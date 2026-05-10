"use client"

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"

import {
  buildCockpitTasks,
  buildScanInsights,
  formatEvidenceKind,
  getNextBestAction,
} from "@/components/compliscan/cockpit-derivations"
import {
  copyTextToClipboard,
  downloadBlob,
  getFileNameFromDisposition,
  openHtmlPreview,
  sanitizeFileName,
  toBase64,
} from "@/components/compliscan/cockpit-browser"
import type {
  AISystemPurpose,
  ComplianceState,
  DashboardSummary,
  DetectedAISystemRecord,
  EvidenceRegistryEntry,
  EFacturaValidationRecord,
  RemediationAction,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
  TaskValidationStatus,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { dashboardRoutes, dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"

export { buildScanInsights, getRiskLastSyncLabel } from "@/components/compliscan/cockpit-derivations"

export type DashboardPayload = {
  state: ComplianceState
  summary: DashboardSummary
  remediationPlan: RemediationAction[]
  workspace: WorkspaceContext
  compliancePack?: AICompliancePack
  traceabilityMatrix?: ComplianceTraceRecord[]
  auditReadinessSummary?: {
    auditReadiness: AuditPackV2["executiveSummary"]["auditReadiness"]
    baselineStatus: AuditPackV2["executiveSummary"]["baselineStatus"]
    complianceScore: AuditPackV2["executiveSummary"]["complianceScore"]
    riskLabel: AuditPackV2["executiveSummary"]["riskLabel"]
    topBlockers: string[]
    nextActions: string[]
    activeDrifts: number
    openFindings: number
    remediationOpen: number
    validatedEvidenceItems: number
    missingEvidenceItems: number
    evidenceLedgerSummary: AuditPackV2["executiveSummary"]["evidenceLedgerSummary"]
    auditQualityDecision: AuditPackV2["executiveSummary"]["auditQualityDecision"]
    blockedQualityGates: number
    reviewQualityGates: number
    bundleStatus: AuditPackV2["bundleEvidenceSummary"]["status"]
  }
  evidenceLedger?: EvidenceRegistryEntry[]
}

const COCKPIT_TIME_ZONE = "Europe/Bucharest"

const COCKPIT_SCAN_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("ro-RO", {
  timeZone: COCKPIT_TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

function formatCockpitDateTime(iso: string) {
  return COCKPIT_SCAN_DATE_TIME_FORMATTER.format(new Date(iso))
}

type TaskUpdateFeedback = {
  status: "todo" | "done"
  closedAlerts: number
  reopenedAlerts: number
  closedDrifts: number
  reopenedDrifts: number
  previousScore: number
  nextScore: number
  scoreDelta: number
  validationStatus?: TaskValidationStatus
  validationMessage?: string
  validationConfidence?: "high" | "medium" | "low"
  validationBasis?: "direct_signal" | "inferred_signal" | "operational_state"
}

type TaskUpdateResponse = DashboardPayload & {
  message?: string
  feedback?: TaskUpdateFeedback
  error?: string
}

type TaskEvidenceUploadResponse = DashboardPayload & {
  message?: string
  error?: string
  evidence?: TaskEvidenceAttachment
}

type TaskEvidenceMutationResponse = DashboardPayload & {
  message?: string
  error?: string
  evidenceDeletion?: {
    status: "soft_deleted" | "restored" | "permanently_deleted"
    evidenceId: string
    deletedAtISO?: string
    restoredAtISO?: string
    restoreUntilISO?: string
  }
}

function useCockpitStore(initialData?: DashboardPayload | null) {
  const DASHBOARD_CORE_ENDPOINT = "/api/dashboard/core"
  const DASHBOARD_FULL_ENDPOINT = "/api/dashboard"
  const [documentName, setDocumentName] = useState("")
  const [documentContent, setDocumentContent] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [lastExtractedPreview, setLastExtractedPreview] = useState("")
  const [pendingScanId, setPendingScanId] = useState<string | null>(null)
  const [pendingExtractedText, setPendingExtractedText] = useState("")
  const [loading, setLoading] = useState(!initialData)
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardPayload | null>(initialData ?? null)
  const tasks = useMemo(() => (data ? buildCockpitTasks(data) : []), [data])
  const hasLoadedOnce = useRef(Boolean(initialData))

  useEffect(() => {
    if (initialData) {
      setData(initialData)
      setLoading(false)
      setError(null)
      hasLoadedOnce.current = true
      return
    }

    if (!hasLoadedOnce.current) {
      void reloadDashboard()
    }
  }, [initialData])

  const latestScan = data?.state.scans[0] ?? null
  const latestScanText =
    lastExtractedPreview || latestScan?.contentExtracted || latestScan?.contentPreview || ""
  const latestScanFindings =
    latestScan && data
      ? data.state.findings.filter(
          (finding) =>
            finding.scanId === latestScan.id || finding.sourceDocument === latestScan.documentName
        )
      : []
  const recentEvents = data?.state.events.slice(0, 6) ?? []
  const latestScanInsights = buildScanInsights(latestScanText)
  const nextBestAction = getNextBestAction(tasks)
  const lastScanLabel = latestScan
    ? formatCockpitDateTime(latestScan.createdAtISO)
    : "inca fara scan"

  async function withBusyOperation<T>(operation: () => Promise<T>): Promise<T> {
    setBusy(true)
    try {
      return await operation()
    } finally {
      setBusy(false)
    }
  }

  function applyDashboardPayload<TPayload extends DashboardPayload>(payload: TPayload): TPayload {
    setData(payload)
    return payload
  }

  async function reloadDashboard() {
    const shouldShowLoading = !hasLoadedOnce.current
    if (shouldShowLoading) setLoading(true)
    setError(null)
    try {
      const response = await fetch(DASHBOARD_CORE_ENDPOINT, { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut incarca dashboard-ul.")
      const payload = (await response.json()) as DashboardPayload
      setData(payload)
      hasLoadedOnce.current = true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      if (shouldShowLoading) setLoading(false)
    }
  }

  async function ensureHeavyPayload() {
    if (!data) return
    if (data.compliancePack && data.traceabilityMatrix && data.auditReadinessSummary) return

    await withBusyOperation(async () => {
      const response = await fetch(DASHBOARD_FULL_ENDPOINT, { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut incarca payload-ul complet.")
      const payload = (await response.json()) as DashboardPayload
      applyDashboardPayload(payload)
      return payload
    }).catch((err) => {
      const message = err instanceof Error ? err.message : "Eroare la incarcarea payload-ului."
      toast.error("Incarcare esuata", { description: message })
    })
  }

  function resetPendingScanReview() {
    setPendingScanId(null)
    setPendingExtractedText("")
  }

  function updateDocumentName(value: string) {
    setDocumentName(value)
    resetPendingScanReview()
  }

  function updateDocumentContent(value: string) {
    setDocumentContent(value)
    resetPendingScanReview()
  }

  function updateDocumentFile(file: File | null) {
    setDocumentFile(file)
    resetPendingScanReview()
  }

  async function handleExtractScan() {
    setScanning(true)
    setError(null)
    setScanInfo(null)
    try {
      let imageBase64 = ""
      let pdfBase64 = ""

      if (documentFile) {
        const base64 = await toBase64(documentFile)
        const isPdf =
          documentFile.type === "application/pdf" ||
          documentFile.name.toLowerCase().endsWith(".pdf")
        if (isPdf) pdfBase64 = base64
        else imageBase64 = base64
      }

      const clientId =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`

      const response = await fetch("/api/scan/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          documentName,
          content: documentContent,
          imageBase64,
          pdfBase64,
        }),
      })

      const payload = (await response.json()) as DashboardPayload & {
        error?: string
        ocrUsed?: boolean
        ocrWarning?: string | null
        extractedTextPreview?: string
        scan?: { id: string; contentExtracted?: string }
      }

      if (!response.ok) throw new Error(payload.error || "Extragerea a esuat.")

      setData(payload)
      setPendingScanId(payload.scan?.id ?? null)
      setPendingExtractedText(
        payload.extractedTextPreview ?? payload.scan?.contentExtracted ?? documentContent
      )

      if (payload.ocrUsed) {
        setScanInfo("Text extras. Revizuieste OCR-ul si porneste analiza cand esti gata.")
      } else if (payload.ocrWarning) {
        setScanInfo(`Extragere partiala: ${payload.ocrWarning}`)
      } else {
        setScanInfo("Text pregatit pentru analiza. Poti continua imediat.")
      }

      toast.success("Text extras", {
        description: "Revizuieste continutul si ruleaza analiza pe varianta corectata.",
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la extragere."
      setError(message)
      toast.error("Extragerea a esuat", { description: message })
      return false
    } finally {
      setScanning(false)
    }
  }

  async function handleAnalyzePendingScan() {
    if (!pendingScanId) {
      const message = "Extrage mai intai textul documentului."
      setError(message)
      toast.error("Analiza nu poate porni", { description: message })
      return null
    }

    const analyzedScanId = pendingScanId
    setScanning(true)
    setError(null)
    try {
      const response = await fetch(`/api/scan/${pendingScanId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedContent: pendingExtractedText }),
      })

      const payload = (await response.json()) as DashboardPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Analiza a esuat.")

      setData(payload)
      setLastExtractedPreview(pendingExtractedText)
      resetPendingScanReview()
      setScanInfo("Analiza finalizata pe textul revizuit.")
      toast.success("Analiza finalizata", {
        description: "Findings, drift si task-uri au fost regenerate pentru documentul curent.",
      })
      return payload.state.scans.find((scan) => scan.id === analyzedScanId)?.id ?? analyzedScanId
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la analiza."
      setError(message)
      toast.error("Analiza a esuat", { description: message })
      return null
    } finally {
      setScanning(false)
    }
  }

  async function handleScan() {
    const extracted = await handleExtractScan()
    if (!extracted) return false
    return handleAnalyzePendingScan()
  }

  async function handleGenerateReport() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/reports", { method: "POST" })
      if (!response.ok) throw new Error("Nu am putut genera raportul.")
      const payload = (await response.json()) as { html: string }
      openHtmlPreview(payload.html)
      toast.success("Raport PDF generat", { description: "Previzualizarea s-a deschis într-un tab nou." })
    }).catch((err) => {
      toast.error("Export esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea raportului.",
      })
    })
  }

  async function handleGenerateResponsePack() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/reports/response-pack", { method: "POST" })
      if (!response.ok) throw new Error("Nu am putut genera Compliance Response Pack-ul.")
      const payload = (await response.json()) as { html: string }
      openHtmlPreview(payload.html)
      toast.success("Compliance Response Pack generat", {
        description: "Folosește print din browser pentru PDF și distribuire.",
      })
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "generated_response_pack" }),
      }).catch(() => {})
    }).catch((err) => {
      toast.error("Export esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea Response Pack-ului.",
      })
    })
  }

  async function handleDownloadExecutivePdf() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/reports/pdf", { method: "POST" })
      if (!response.ok) throw new Error("Nu am putut genera raportul executiv PDF.")
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `raport-executiv-${new Date().toISOString().slice(0, 10)}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Raport Executiv descărcat")
      // Track download event — fire-and-forget
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ event: "downloaded_one_page_report" }),
      }).catch(() => {})
    }).catch((err) => {
      toast.error("Export esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea raportului executiv.",
      })
    })
  }

  async function handleGenerateAuditPack() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/exports/audit-pack/pdf", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut genera Audit Pack-ul.")
      
      const blob = await response.blob()
      const fileName =
        getFileNameFromDisposition(response.headers.get("Content-Disposition")) ||
        "audit-pack-dosar.pdf"

      downloadBlob(blob, fileName)
      
      toast.success("Audit Pack PDF Descarcat", {
        description: "Dosarul complet a fost arhivat ca PDF pentru trimiterea catre autoritati.",
      })
    }).catch((err) => {
      toast.error("Export Audit Pack esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea Audit Pack-ului.",
      })
    })
  }

  async function handleGenerateAuditBundle() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/exports/audit-pack/bundle", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut genera bundle-ul ZIP pentru audit.")
      const blob = await response.blob()
      const fileName =
        getFileNameFromDisposition(response.headers.get("Content-Disposition")) ||
        "audit-pack-dossier.zip"

      downloadBlob(blob, fileName)
      toast.success("Audit Pack ZIP generat", {
        description: "Bundle-ul conține dosarul client-facing, JSON-urile de control și dovezile agregate disponibile.",
      })
    }).catch((err) => {
      toast.error("Export ZIP eșuat", {
        description:
          err instanceof Error ? err.message : "Eroare la generarea bundle-ului de audit.",
      })
    })
  }

  async function handleGenerateAnnexLite() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/exports/annex-lite/client", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut genera documentul Annex IV lite.")
      const html = await response.text()
      openHtmlPreview(html)
      toast.success("Annex IV lite deschis", {
        description:
          "Poti folosi print din browser pentru PDF sau pentru un review rapid cu stakeholderii.",
      })
    }).catch((err) => {
      toast.error("Export Annex IV lite esuat", {
        description:
          err instanceof Error ? err.message : "Eroare la generarea documentului Annex IV lite.",
      })
    })
  }

  async function handleChecklistExport() {
    const openTasks = tasks.filter((task) => task.status !== "done")
    const blob = new Blob(
      [
        openTasks
          .map(
            (task) =>
              `${task.priority} | ${task.title}\nOwner: ${task.owner}\nDue: ${task.dueDate}\n${task.steps.join("\n- ")}`
          )
          .join("\n\n"),
      ],
      { type: "text/plain;charset=utf-8" }
    )
    downloadBlob(blob, "compliscan-checklist-local.txt")
    toast.success("Checklist exportat")
  }

  async function handleExportCompliScan(format: "json" | "yaml") {
    await withBusyOperation(async () => {
      const response = await fetch(`/api/exports/compliscan?format=${format}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error(`Nu am putut exporta compliscan.${format}.`)
      }

      const blob = await response.blob()
      const fileName =
        getFileNameFromDisposition(response.headers.get("Content-Disposition")) ||
        `compliscan.${format}`

      downloadBlob(blob, fileName)
      toast.success(`Export compliscan.${format} generat`, {
        description:
          format === "json"
            ? "Snapshot-ul poate deveni source of truth pentru autodiscovery si drift."
            : "Varianta YAML este pregatita pentru workflows si revizie umana.",
      })
    }).catch((err) => {
      toast.error("Export snapshot esuat", {
        description:
          err instanceof Error ? err.message : "Eroare la exportul snapshot-ului.",
      })
    })
  }

  async function handleShareWithAccountant() {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}${
            latestScan?.id ? dashboardScanResultsRoute(latestScan.id) : dashboardRoutes.scan
          }`
        : "https://compliscan.local/dashboard/scan"

    try {
      await copyTextToClipboard(link)
      toast.success("Link copiat pentru contabil")
    } catch {
      toast.info("Nu am putut copia automat linkul")
    }
  }

  async function handleSyncNow() {
    await withBusyOperation(async () => {
      const response = await fetch("/api/integrations/efactura/sync", { method: "POST" })
      if (!response.ok) throw new Error("Sincronizarea e-Factura a esuat.")
      const payload = (await response.json()) as DashboardPayload
      applyDashboardPayload(payload)
      toast.success("Sincronizare e-Factura pornita")
    }).catch((err) => {
      toast.error("Sync esuat", {
        description: err instanceof Error ? err.message : "Eroare la sincronizare.",
      })
    })
  }

  async function addAISystem(input: {
    name: string
    purpose: AISystemPurpose
    vendor: string
    modelType: string
    usesPersonalData: boolean
    makesAutomatedDecisions: boolean
    impactsRights: boolean
    hasHumanReview: boolean
  }) {
    await withBusyOperation(async () => {
      const response = await fetch("/api/ai-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as DashboardPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Nu am putut adauga sistemul AI.")
      applyDashboardPayload(payload)
      toast.success("Sistem AI adaugat", {
        description: `${input.name} a fost clasificat ca ${formatPurposeLabel(input.purpose)}.`,
      })
    }).catch((err) => {
      const message = err instanceof Error ? err.message : "Eroare la adaugarea sistemului."
      toast.error("Adaugare esuata", { description: message })
      throw err
    })
  }

  async function patchAISystem(input: { id: string; approvalStatus?: string; policyAttestationStatus?: string }) {
    await withBusyOperation(async () => {
      try {
        const response = await fetch("/api/ai-systems", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const payload = (await response.json()) as DashboardPayload & { error?: string }
        if (!response.ok) throw new Error(payload.error || "Nu am putut actualiza sistemul AI.")
        applyDashboardPayload(payload)
        toast.success("Sistem AI actualizat")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la actualizarea sistemului."
        toast.error("Actualizare esuata", { description: message })
        throw err
      }
    })
  }

  async function discoverAISystemsFromManifest(input: { documentName: string; content: string }) {
    await withBusyOperation(async () => {
      const response = await fetch("/api/ai-systems/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as DashboardPayload & {
        error?: string
        message?: string
      }
      if (!response.ok) throw new Error(payload.error || "Nu am putut rula autodiscovery.")
      applyDashboardPayload(payload)
      toast.success("Autodiscovery finalizat", {
        description:
          payload.message ||
          "Sistemele detectate automat au fost salvate si asteapta confirmare umana.",
      })
    }).catch((err) => {
      const message = err instanceof Error ? err.message : "Eroare la autodiscovery."
      toast.error("Autodiscovery esuat", { description: message })
      throw err
    })
  }

  async function updateDetectedAISystem(
    id: string,
    action: "review" | "confirm" | "reject" | "restore"
  ) {
    await withBusyOperation(async () => {
      try {
        const response = await fetch(`/api/ai-systems/detected/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza sistemul detectat.")
        }
        applyDashboardPayload(payload)
        toast.success("Status actualizat", {
          description: payload.message || "Modificarea a fost salvata.",
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea sistemului detectat."
        toast.error("Actualizare esuata", { description: message })
        throw err
      }
    })
  }

  async function editDetectedAISystem(
    id: string,
    updates: Partial<
      Pick<
        DetectedAISystemRecord,
        | "name"
        | "purpose"
        | "vendor"
        | "modelType"
        | "usesPersonalData"
        | "makesAutomatedDecisions"
        | "impactsRights"
        | "hasHumanReview"
        | "confidence"
        | "frameworks"
        | "evidence"
      >
    >
  ) {
    await withBusyOperation(async () => {
      try {
        const response = await fetch(`/api/ai-systems/detected/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "edit", updates }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut salva editarile pentru detectie.")
        }
        applyDashboardPayload(payload)
        toast.success("Detectie actualizata", {
          description: payload.message || "Clasificarea a fost recalculata pe baza editarilor.",
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la actualizarea detectiei."
        toast.error("Editare esuata", { description: message })
        throw err
      }
    })
  }

  async function removeAISystem(id: string) {
    await withBusyOperation(async () => {
      try {
        const response = await fetch(`/api/ai-systems?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
        const payload = (await response.json()) as DashboardPayload & { error?: string }
        if (!response.ok) throw new Error(payload.error || "Nu am putut elimina sistemul AI.")
        applyDashboardPayload(payload)
        toast.success("Sistem eliminat din inventar")
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la eliminarea sistemului."
        toast.error("Eliminare esuata", { description: message })
        throw err
      }
    })
  }

  async function validateEFacturaXml(input: { documentName: string; xml: string }) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/efactura/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          validation?: EFacturaValidationRecord
        }
        if (!response.ok) throw new Error(payload.error || "Validarea XML a esuat.")
        applyDashboardPayload(payload)
        const isValid = payload.validation?.valid ?? false
        const description = isValid
          ? "Factura trece validarea structurala de baza."
          : "Corecteaza erorile si valideaza din nou inainte de transmitere."
        // id deduplică toast-urile — re-validarea înlocuiește toast-ul curent
        // (apelăm direct toast.success/error ca să nu rupem `this` binding)
        if (isValid) {
          toast.success("XML validat", { id: "efactura-validation", description })
        } else {
          toast.error("XML cu probleme", { id: "efactura-validation", description })
        }
        return payload.validation ?? null
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la validarea XML."
        toast.error("Validare esuata", { description: message })
        throw err
      }
    })
  }

  async function resetWorkspaceState() {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/state/reset", { method: "POST" })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut reseta workspace-ul.")
        }

        applyDashboardPayload(payload)
        setDocumentName("")
        setDocumentContent("")
        setDocumentFile(null)
        setScanInfo(null)
        setLastExtractedPreview("")
        resetPendingScanReview()
        toast.success("Spațiu de lucru resetat", {
          description:
            payload.message ||
            "Toate scanarile, drift-ul si task-urile au fost sterse din workspace-ul curent.",
        })
        return payload
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la resetarea workspace-ului."
        toast.error("Reset esuat", { description: message })
        throw err
      }
    })
  }

  async function updateValidatedBaseline(action: "set" | "clear") {
    await withBusyOperation(async () => {
      try {
        const response = await fetch("/api/state/baseline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza baseline-ul.")
        }

        applyDashboardPayload(payload)
        toast.success(action === "set" ? "Baseline validat" : "Baseline eliminat", {
          description:
            payload.message ||
            (action === "set"
              ? "Drift-ul va compara de acum cu snapshot-ul validat."
              : "Comparatia revine la ultimul snapshot disponibil."),
        })
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea baseline-ului."
        toast.error("Baseline esuat", { description: message })
        throw err
      }
    })
  }

  async function updateDriftSeverityOverrides(
    severityOverrides: Record<string, "critical" | "high" | "medium" | "low" | "default">
  ) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/state/drift-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ severityOverrides }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza severitatea pentru drift.")
        }

        applyDashboardPayload(payload)
        toast.success("Severitate drift actualizată", {
          description:
            payload.message ||
            "Politica de drift a fost recalculată cu noile override-uri pentru workspace.",
        })
        return payload
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea severității pentru drift."
        toast.error("Actualizare drift eșuată", { description: message })
        throw err
      }
    })
  }

  async function updateCompliancePackField(input: {
    systemId: string
    field: string
    value?: string | null
    action: "save" | "confirm" | "clear"
  }) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/compliance-pack/fields", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza câmpul din AI Compliance Pack.")
        }

        applyDashboardPayload(payload)
        toast.success(
          input.action === "clear"
            ? "Override eliminat"
            : input.action === "confirm"
              ? "Câmp confirmat"
              : "Câmp actualizat",
          {
            description:
              payload.message ||
              "Pack-ul și auditul au fost regenerate cu noua valoare confirmată.",
          }
        )
        return payload
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea câmpului din pack."
        toast.error("Actualizare pack eșuată", { description: message })
        throw err
      }
    })
  }

  async function updateTraceabilityReview(input: {
    scope?: "record" | "law_reference" | "family"
    familyKey?: string
    traceId?: string
    lawReference?: string
    action: "confirm" | "clear"
    note?: string | null
  }) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/traceability/review", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza confirmarea controlului.")
        }

        applyDashboardPayload(payload)
        toast.success(input.action === "clear" ? "Confirmare eliminată" : "Control confirmat", {
          description:
            payload.message ||
            "Traceability matrix și exporturile au fost regenerate cu noua confirmare.",
        })
        return payload
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea controlului din audit."
        toast.error("Actualizare traceability eșuată", { description: message })
        throw err
      }
    })
  }

  async function reuseFamilyEvidence(familyKey: string) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch("/api/traceability/family-evidence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ familyKey }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }
        if (!response.ok) {
          throw new Error(
            payload.error || "Nu am putut reutiliza dovada pentru familia de controale."
          )
        }

        applyDashboardPayload(payload)
        toast.success("Dovadă reutilizată", {
          description:
            payload.message ||
            "Controalele din aceeași familie au preluat dovada și așteaptă acum rescan de confirmare.",
        })
        return payload
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la reutilizarea dovezii pentru familie."
        toast.error("Reutilizare dovadă eșuată", { description: message })
        throw err
      }
    })
  }

  async function updateDriftLifecycle(input: {
    driftId: string
    action: "acknowledge" | "start" | "resolve" | "waive" | "reopen"
    note?: string | null
  }) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch(`/api/drifts/${input.driftId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: input.action,
            note: input.note,
          }),
        })
        const payload = (await response.json()) as DashboardPayload & {
          error?: string
          message?: string
        }

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza responsabilitatea pentru drift.")
        }

        applyDashboardPayload(payload)
        toast.success(formatDriftActionTitle(input.action), {
          description:
            payload.message ||
            "Owner-ul, SLA-ul și audit trail-ul au fost actualizate pentru drift.",
        })
        return payload
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la actualizarea drift-ului."
        toast.error("Actualizare drift eșuată", { description: message })
        throw err
      }
    })
  }

  async function handleBulkMarkDone(ids: string[]) {
    if (ids.length === 0) return
    setBusy(true)
    try {
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/tasks/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "mark_done_and_validate" }),
          })
        )
      )
      toast.success(`${ids.length} task-uri marcate ca rezolvate`)
      await reloadDashboard()
    } catch {
      toast.error("Eroare la marcarea în bloc")
    } finally {
      setBusy(false)
    }
  }

  async function handleMarkDone(taskId: string) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return

    try {
      if (task.status === "done") {
        const payload = await updateTaskState(taskId, { status: "todo" })
        const description = formatTaskStatusFeedback(payload.feedback)
        toast.success("Task redeschis", { description })
        return
      }

      const payload = await updateTaskState(taskId, { action: "mark_done_and_validate" })
      const validationStatus = payload.feedback?.validationStatus
      const description = formatTaskStatusFeedback(payload.feedback)

      if (validationStatus === "passed") {
        toast.success("Task validat și închis", { description })
      } else if (validationStatus === "needs_review") {
        toast.warning("Mai lipsește dovada sau confirmarea finală", {
          description,
        })
      } else {
        toast.error("Rescan-ul nu a confirmat remedierea", {
          description,
        })
      }
    } catch {}
  }

  async function attachEvidence(taskId: string, file: File, kind: TaskEvidenceKind) {
    await withBusyOperation(async () => {
      try {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("kind", kind)

        const response = await fetch(`/api/tasks/${taskId}/evidence`, {
          method: "POST",
          body: formData,
        })
        const payload = (await response.json()) as TaskEvidenceUploadResponse
        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut încărca dovada.")
        }

        applyDashboardPayload(payload)
        toast.success("Dovada încărcată", {
          description: payload.evidence
            ? `${payload.evidence.fileName} · ${formatEvidenceKind(payload.evidence.kind)}`
            : file.name,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la încărcarea dovezii."
        toast.error("Upload eșuat", { description: message })
        throw err
      }
    })
  }

  async function softDeleteEvidence(taskId: string, evidenceId: string, reason: string) {
    return mutateEvidenceDeletion(taskId, evidenceId, {
      method: "DELETE",
      reason,
      successTitle: "Dovada ștearsă soft",
      successDescription: "Poate fi restaurată din task în fereastra de recovery.",
    })
  }

  async function restoreEvidence(taskId: string, evidenceId: string) {
    return mutateEvidenceDeletion(taskId, evidenceId, {
      method: "PATCH",
      action: "restore",
      successTitle: "Dovada restaurată",
      successDescription: "Revalidează task-ul înainte de audit_ready.",
    })
  }

  async function permanentlyDeleteEvidence(taskId: string, evidenceId: string, reason: string) {
    return mutateEvidenceDeletion(taskId, evidenceId, {
      method: "DELETE",
      permanent: true,
      reason,
      successTitle: "Dovada ștearsă definitiv",
      successDescription: "Fișierul și metadata operațională au fost eliminate.",
    })
  }

  async function mutateEvidenceDeletion(
    taskId: string,
    evidenceId: string,
    options: {
      method: "DELETE" | "PATCH"
      action?: "restore"
      permanent?: boolean
      reason?: string
      successTitle: string
      successDescription: string
    }
  ) {
    await withBusyOperation(async () => {
      try {
        const response = await fetch(
          `/api/tasks/${encodeURIComponent(taskId)}/evidence/${encodeURIComponent(evidenceId)}${
            options.permanent ? "?permanent=1" : ""
          }`,
          {
            method: options.method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: options.action,
              reason: options.reason,
            }),
          }
        )
        const payload = (await response.json()) as TaskEvidenceMutationResponse
        if (!response.ok) {
          throw new Error(payload.error || "Operația pe dovadă a eșuat.")
        }

        applyDashboardPayload(payload)
        toast.success(options.successTitle, { description: options.successDescription })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Eroare la operația pe dovadă."
        toast.error("Evidence control eșuat", { description: message })
        throw err
      }
    })
  }

  function handleTaskExport(taskId: string) {
    const task = tasks.find((item) => item.id === taskId)
    if (!task) return
    const blob = new Blob(
      [
        `${task.title}\n${task.priority}\nOwner: ${task.owner}\nDue: ${task.dueDate}\n\nCe am detectat:\n${task.summary}\n\nDe ce conteaza:\n${task.why}\n\nUnde apare:\n${task.triggerLabel}\n${task.triggerSnippet ?? "Nu exista excerpt salvat."}\n\nFix propus:\n${task.fixPreview}\n\n${task.readyTextLabel}:\n${task.readyText}\n\nDovada de inchidere:\n${task.evidenceSnippet}\n\nActiuni:\n- ${task.steps.join("\n- ")}`,
      ],
      { type: "text/plain;charset=utf-8" }
    )
    downloadBlob(blob, `${sanitizeFileName(task.title)}.txt`)
    toast.success("Export generat", { description: "Fișierul a fost descărcat." })
  }

  function handleSandbox() {
    toast.info("Simulare locala pornita", {
      description: "Flux local de test. Nu exista apeluri reale catre ANAF sau sisteme externe.",
    })
  }

  const openAlerts = data?.state.alerts.filter((alert) => alert.open) ?? []
  const activeDrifts = data?.state.driftRecords.filter((drift) => drift.open) ?? []
  const validatedInvoicesToday =
    data?.state.efacturaConnected ? Math.max(1, Math.min(8, (data?.state.scannedDocuments ?? 0) + 1)) : 0
  const efacturaErrorsToday = openAlerts.filter((alert) =>
    (alert.sourceDocument || "").toLowerCase().includes("factura")
  ).length
  const gdprQuickFixes = openAlerts.filter((alert) =>
    alert.message.toLowerCase().includes("consim")
  )

  async function updateTaskState(
    taskId: string,
    patch: {
      status?: "todo" | "done"
      attachedEvidence?: string | null
      action?: "validate" | "mark_done_and_validate"
    }
  ) {
    return withBusyOperation(async () => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        })
        const payload = (await response.json()) as TaskUpdateResponse

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut actualiza task-ul.")
        }

        return applyDashboardPayload(payload)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Eroare la actualizarea task-ului."
        toast.error("Actualizare esuata", { description: message })
        throw err
      }
    })
  }

  return {
    loading,
    scanning,
    busy,
    error,
    data,
    tasks,
    latestScan,
    latestScanText,
    latestScanFindings,
    recentEvents,
    latestScanInsights,
    nextBestAction,
    lastScanLabel,
    pendingScanId,
    pendingExtractedText,
    documentName,
    documentContent,
    documentFile,
    scanInfo,
    openAlerts,
    activeDrifts,
    validatedInvoicesToday,
    efacturaErrorsToday,
    gdprQuickFixes,
    setDocumentName: updateDocumentName,
    setDocumentContent: updateDocumentContent,
    setDocumentFile: updateDocumentFile,
    setPendingExtractedText,
    reloadDashboard,
    ensureHeavyPayload,
    handleExtractScan,
    handleAnalyzePendingScan,
    handleScan,
    handleGenerateReport,
    handleGenerateResponsePack,
    handleDownloadExecutivePdf,
    handleGenerateAuditPack,
    handleGenerateAuditBundle,
    handleGenerateAnnexLite,
    handleChecklistExport,
    handleExportCompliScanJson: () => handleExportCompliScan("json"),
    handleExportCompliScanYaml: () => handleExportCompliScan("yaml"),
    handleShareWithAccountant,
    handleSyncNow,
    handleMarkDone,
    handleBulkMarkDone,
    attachEvidence,
    softDeleteEvidence,
    restoreEvidence,
    permanentlyDeleteEvidence,
    handleTaskExport,
    handleSandbox,
    addAISystem,
    patchAISystem,
    discoverAISystemsFromManifest,
    removeAISystem,
    updateDetectedAISystem,
    editDetectedAISystem,
    validateEFacturaXml,
    resetWorkspaceState,
    setValidatedBaseline: () => updateValidatedBaseline("set"),
    clearValidatedBaseline: () => updateValidatedBaseline("clear"),
    updateDriftSeverityOverrides,
    updateCompliancePackField,
    updateTraceabilityReview,
    reuseFamilyEvidence,
    updateDriftLifecycle,
  }
}

type CockpitStore = ReturnType<typeof useCockpitStore>

const CockpitContext = createContext<CockpitStore | null>(null)

export function CockpitProvider({
  children,
  initialData,
}: {
  children: React.ReactNode
  initialData?: DashboardPayload | null
}) {
  const store = useCockpitStore(initialData)
  return <CockpitContext.Provider value={store}>{children}</CockpitContext.Provider>
}

export function useCockpit() {
  const store = useContext(CockpitContext)
  if (!store) {
    throw new Error("useCockpit trebuie folosit in interiorul CockpitProvider.")
  }
  return store
}

export type CockpitDataSlice = Pick<
  CockpitStore,
  | "loading"
  | "scanning"
  | "busy"
  | "error"
  | "data"
  | "tasks"
  | "latestScan"
  | "latestScanText"
  | "latestScanFindings"
  | "recentEvents"
  | "latestScanInsights"
  | "nextBestAction"
  | "lastScanLabel"
  | "pendingScanId"
  | "pendingExtractedText"
  | "documentName"
  | "documentContent"
  | "documentFile"
  | "scanInfo"
  | "openAlerts"
  | "activeDrifts"
  | "validatedInvoicesToday"
  | "efacturaErrorsToday"
  | "gdprQuickFixes"
  | "reloadDashboard"
>

export type CockpitActionSlice = Pick<
  CockpitStore,
  | "setDocumentName"
  | "setDocumentContent"
  | "setDocumentFile"
  | "setPendingExtractedText"
  | "reloadDashboard"
  | "ensureHeavyPayload"
  | "handleExtractScan"
  | "handleAnalyzePendingScan"
  | "handleScan"
  | "handleGenerateReport"
  | "handleGenerateResponsePack"
  | "handleDownloadExecutivePdf"
  | "handleGenerateAuditPack"
  | "handleGenerateAuditBundle"
  | "handleGenerateAnnexLite"
  | "handleChecklistExport"
  | "handleExportCompliScanJson"
  | "handleExportCompliScanYaml"
  | "handleShareWithAccountant"
  | "handleSyncNow"
  | "handleMarkDone"
  | "attachEvidence"
  | "softDeleteEvidence"
  | "restoreEvidence"
  | "permanentlyDeleteEvidence"
  | "handleTaskExport"
  | "handleSandbox"
  | "addAISystem"
  | "patchAISystem"
  | "discoverAISystemsFromManifest"
  | "removeAISystem"
  | "updateDetectedAISystem"
  | "editDetectedAISystem"
  | "validateEFacturaXml"
  | "resetWorkspaceState"
  | "setValidatedBaseline"
  | "clearValidatedBaseline"
  | "updateDriftSeverityOverrides"
  | "updateCompliancePackField"
  | "updateTraceabilityReview"
  | "reuseFamilyEvidence"
  | "updateDriftLifecycle"
  | "handleBulkMarkDone"
>

export function useCockpitData(): CockpitDataSlice {
  const store = useCockpit()
  const {
    loading,
    scanning,
    busy,
    error,
    data,
    tasks,
    latestScan,
    latestScanText,
    latestScanFindings,
    recentEvents,
    latestScanInsights,
    nextBestAction,
    lastScanLabel,
    pendingScanId,
    pendingExtractedText,
    documentName,
    documentContent,
    documentFile,
    scanInfo,
    openAlerts,
    activeDrifts,
    validatedInvoicesToday,
    efacturaErrorsToday,
    gdprQuickFixes,
    reloadDashboard,
  } = store

  return {
    loading,
    scanning,
    busy,
    error,
    data,
    tasks,
    latestScan,
    latestScanText,
    latestScanFindings,
    recentEvents,
    latestScanInsights,
    nextBestAction,
    lastScanLabel,
    pendingScanId,
    pendingExtractedText,
    documentName,
    documentContent,
    documentFile,
    scanInfo,
    openAlerts,
    activeDrifts,
    validatedInvoicesToday,
    efacturaErrorsToday,
    gdprQuickFixes,
    reloadDashboard,
  }
}

export function useOptionalCockpitData(): CockpitDataSlice | null {
  const store = useContext(CockpitContext)
  if (!store) return null

  const {
    loading,
    scanning,
    busy,
    error,
    data,
    tasks,
    latestScan,
    latestScanText,
    latestScanFindings,
    recentEvents,
    latestScanInsights,
    nextBestAction,
    lastScanLabel,
    pendingScanId,
    pendingExtractedText,
    documentName,
    documentContent,
    documentFile,
    scanInfo,
    openAlerts,
    activeDrifts,
    validatedInvoicesToday,
    efacturaErrorsToday,
    gdprQuickFixes,
    reloadDashboard,
  } = store

  return {
    loading,
    scanning,
    busy,
    error,
    data,
    tasks,
    latestScan,
    latestScanText,
    latestScanFindings,
    recentEvents,
    latestScanInsights,
    nextBestAction,
    lastScanLabel,
    pendingScanId,
    pendingExtractedText,
    documentName,
    documentContent,
    documentFile,
    scanInfo,
    openAlerts,
    activeDrifts,
    validatedInvoicesToday,
    efacturaErrorsToday,
    gdprQuickFixes,
    reloadDashboard,
  }
}

export function useCockpitMutations(): CockpitActionSlice {
  const store = useCockpit()
  const {
    setDocumentName,
    setDocumentContent,
    setDocumentFile,
    setPendingExtractedText,
    reloadDashboard,
    ensureHeavyPayload,
    handleExtractScan,
    handleAnalyzePendingScan,
    handleScan,
    handleGenerateReport,
    handleGenerateResponsePack,
    handleDownloadExecutivePdf,
    handleGenerateAuditPack,
    handleGenerateAuditBundle,
    handleGenerateAnnexLite,
    handleChecklistExport,
    handleExportCompliScanJson,
    handleExportCompliScanYaml,
    handleShareWithAccountant,
    handleSyncNow,
    handleMarkDone,
    attachEvidence,
    softDeleteEvidence,
    restoreEvidence,
    permanentlyDeleteEvidence,
    handleTaskExport,
    handleSandbox,
    addAISystem,
    patchAISystem,
    discoverAISystemsFromManifest,
    removeAISystem,
    updateDetectedAISystem,
    editDetectedAISystem,
    validateEFacturaXml,
    resetWorkspaceState,
    setValidatedBaseline,
    clearValidatedBaseline,
    updateDriftSeverityOverrides,
    updateCompliancePackField,
    updateTraceabilityReview,
    reuseFamilyEvidence,
    updateDriftLifecycle,
    handleBulkMarkDone,
  } = store

  return {
    setDocumentName,
    setDocumentContent,
    setDocumentFile,
    setPendingExtractedText,
    reloadDashboard,
    ensureHeavyPayload,
    handleExtractScan,
    handleAnalyzePendingScan,
    handleScan,
    handleGenerateReport,
    handleGenerateResponsePack,
    handleDownloadExecutivePdf,
    handleGenerateAuditPack,
    handleGenerateAuditBundle,
    handleGenerateAnnexLite,
    handleChecklistExport,
    handleExportCompliScanJson,
    handleExportCompliScanYaml,
    handleShareWithAccountant,
    handleSyncNow,
    handleMarkDone,
    attachEvidence,
    softDeleteEvidence,
    restoreEvidence,
    permanentlyDeleteEvidence,
    handleTaskExport,
    handleSandbox,
    addAISystem,
    patchAISystem,
    discoverAISystemsFromManifest,
    removeAISystem,
    updateDetectedAISystem,
    editDetectedAISystem,
    validateEFacturaXml,
    resetWorkspaceState,
    setValidatedBaseline,
    clearValidatedBaseline,
    updateDriftSeverityOverrides,
    updateCompliancePackField,
    updateTraceabilityReview,
    reuseFamilyEvidence,
    updateDriftLifecycle,
    handleBulkMarkDone,
  }
}

function formatDriftActionTitle(
  action: "acknowledge" | "start" | "resolve" | "waive" | "reopen"
) {
  if (action === "acknowledge") return "Drift preluat"
  if (action === "start") return "Drift în lucru"
  if (action === "resolve") return "Drift rezolvat"
  if (action === "waive") return "Drift waived"
  return "Drift redeschis"
}

function formatTaskStatusFeedback(feedback?: TaskUpdateFeedback) {
  if (!feedback) return undefined

  if (
    feedback.validationStatus === "failed" ||
    feedback.validationStatus === "needs_review"
  ) {
    return feedback.validationMessage
  }

  const alertCount = feedback.status === "done" ? feedback.closedAlerts : feedback.reopenedAlerts
  const driftCount = feedback.status === "done" ? feedback.closedDrifts : feedback.reopenedDrifts
  const impactLabels: string[] = []

  if (alertCount > 0) {
    impactLabels.push(
      alertCount === 1
        ? feedback.status === "done"
          ? "1 semnal închis automat"
          : "1 semnal redeschis"
        : feedback.status === "done"
          ? `${alertCount} semnale închise automat`
          : `${alertCount} semnale redeschise`
    )
  }

  if (driftCount > 0) {
    impactLabels.push(
      driftCount === 1
        ? feedback.status === "done"
          ? "1 drift închis automat"
          : "1 drift redeschis"
        : feedback.status === "done"
          ? `${driftCount} drift-uri închise automat`
          : `${driftCount} drift-uri redeschise`
    )
  }

  const scoreDeltaLabel =
    feedback.scoreDelta === 0
      ? ""
      : feedback.scoreDelta > 0
        ? `scor +${feedback.scoreDelta}`
        : `scor ${feedback.scoreDelta}`

  if (impactLabels.length > 0 && scoreDeltaLabel) {
    return `${impactLabels.join(", ")}, ${scoreDeltaLabel}.`
  }
  if (impactLabels.length > 0) {
    return `${impactLabels.join(", ")}.`
  }
  if (scoreDeltaLabel) {
    return `${scoreDeltaLabel}.`
  }
  return feedback.status === "done"
    ? "Task-ul este închis, fără impact imediat în scor."
    : "Task-ul a fost redeschis."
}
