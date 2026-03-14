"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { toast } from "sonner"

import type {
  CockpitTask,
  ScanInsight,
  TaskConfidence,
  TaskPriority,
} from "@/components/compliscan/types"
import type {
  AISystemPurpose,
  ComplianceAlert,
  ComplianceState,
  DashboardSummary,
  DetectedAISystemRecord,
  EFacturaValidationRecord,
  PersistedTaskState,
  RemediationAction,
  ScanFinding,
  TaskEvidenceAttachment,
  TaskEvidenceKind,
  TaskValidationStatus,
  WorkspaceContext,
} from "@/lib/compliance/types"
import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"
import { formatPurposeLabel } from "@/lib/compliance/ai-inventory"
import {
  severityToTaskConfidence,
  severityToTaskPriority,
  summarizePrinciples,
} from "@/lib/compliance/constitution"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import {
  buildDefaultReadyTextForCategory,
  getFindingRemediationRecipe,
  inferRemediationModeFromFinding,
} from "@/lib/compliance/remediation-recipes"
import {
  buildFindingTaskId,
  getTaskStateByTaskId,
  resolveFindingIdFromTaskId,
} from "@/lib/compliance/task-ids"

export type DashboardPayload = {
  state: ComplianceState
  summary: DashboardSummary
  remediationPlan: RemediationAction[]
  workspace: WorkspaceContext
  compliancePack: AICompliancePack
  traceabilityMatrix: ComplianceTraceRecord[]
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

function useCockpitStore() {
  const [documentName, setDocumentName] = useState("")
  const [documentContent, setDocumentContent] = useState("")
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [scanInfo, setScanInfo] = useState<string | null>(null)
  const [lastExtractedPreview, setLastExtractedPreview] = useState("")
  const [pendingScanId, setPendingScanId] = useState<string | null>(null)
  const [pendingExtractedText, setPendingExtractedText] = useState("")
  const [loading, setLoading] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<DashboardPayload | null>(null)
  const [tasks, setTasks] = useState<CockpitTask[]>([])

  useEffect(() => {
    void reloadDashboard()
  }, [])

  useEffect(() => {
    if (!data) return
    setTasks(buildCockpitTasks(data))
  }, [data])

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
    ? new Date(latestScan.createdAtISO).toLocaleString("ro-RO")
    : "inca fara scan"

  async function reloadDashboard() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/dashboard", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut incarca dashboard-ul.")
      const payload = (await response.json()) as DashboardPayload
      setData(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
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
      return false
    }

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
        description: "Findings, alerte si task-uri au fost regenerate pentru documentul curent.",
      })
      return true
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la analiza."
      setError(message)
      toast.error("Analiza a esuat", { description: message })
      return false
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
    setBusy(true)
    try {
      const response = await fetch("/api/reports", { method: "POST" })
      if (!response.ok) throw new Error("Nu am putut genera raportul.")
      const payload = (await response.json()) as { html: string }
      const reportWindow = window.open("", "_blank")
      if (!reportWindow) throw new Error("Browserul a blocat fereastra noua.")
      reportWindow.document.write(payload.html)
      reportWindow.document.close()
      toast.success("Raport PDF generat")
    } catch (err) {
      toast.error("Export esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea raportului.",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerateAuditPack() {
    setBusy(true)
    try {
      const response = await fetch("/api/exports/audit-pack/client", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut genera Audit Pack-ul.")
      const html = await response.text()
      const reportWindow = window.open("", "_blank")
      if (!reportWindow) throw new Error("Browserul a blocat fereastra noua.")
      reportWindow.document.write(html)
      reportWindow.document.close()
      toast.success("Audit Pack deschis", {
        description: "Poti folosi print din browser pentru PDF si distribuire catre stakeholderi.",
      })
    } catch (err) {
      toast.error("Export Audit Pack esuat", {
        description: err instanceof Error ? err.message : "Eroare la generarea Audit Pack-ului.",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerateAuditBundle() {
    setBusy(true)
    try {
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
    } catch (err) {
      toast.error("Export ZIP eșuat", {
        description:
          err instanceof Error ? err.message : "Eroare la generarea bundle-ului de audit.",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerateAnnexLite() {
    setBusy(true)
    try {
      const response = await fetch("/api/exports/annex-lite/client", { cache: "no-store" })
      if (!response.ok) throw new Error("Nu am putut genera documentul Annex IV lite.")
      const html = await response.text()
      const reportWindow = window.open("", "_blank")
      if (!reportWindow) throw new Error("Browserul a blocat fereastra noua.")
      reportWindow.document.write(html)
      reportWindow.document.close()
      toast.success("Annex IV lite deschis", {
        description:
          "Poti folosi print din browser pentru PDF sau pentru un review rapid cu stakeholderii.",
      })
    } catch (err) {
      toast.error("Export Annex IV lite esuat", {
        description:
          err instanceof Error ? err.message : "Eroare la generarea documentului Annex IV lite.",
      })
    } finally {
      setBusy(false)
    }
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
    setBusy(true)
    try {
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
    } catch (err) {
      toast.error("Export snapshot esuat", {
        description:
          err instanceof Error ? err.message : "Eroare la exportul snapshot-ului.",
      })
    } finally {
      setBusy(false)
    }
  }

  async function handleShareWithAccountant() {
    const link =
      typeof window !== "undefined"
        ? `${window.location.origin}/dashboard/documente?scan=${latestScan?.id ?? "latest"}`
        : "https://compliscan.local/dashboard/documente"

    try {
      await navigator.clipboard.writeText(link)
      toast.success("Link copiat pentru contabil")
    } catch {
      toast.info("Nu am putut copia automat linkul")
    }
  }

  async function handleSyncNow() {
    setBusy(true)
    try {
      const response = await fetch("/api/integrations/efactura/sync", { method: "POST" })
      if (!response.ok) throw new Error("Sincronizarea e-Factura a esuat.")
      const payload = (await response.json()) as DashboardPayload
      setData(payload)
      toast.success("Sincronizare e-Factura pornita")
    } catch (err) {
      toast.error("Sync esuat", {
        description: err instanceof Error ? err.message : "Eroare la sincronizare.",
      })
    } finally {
      setBusy(false)
    }
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
    setBusy(true)
    try {
      const response = await fetch("/api/ai-systems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as DashboardPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Nu am putut adauga sistemul AI.")
      setData(payload)
      toast.success("Sistem AI adaugat", {
        description: `${input.name} a fost clasificat ca ${formatPurposeLabel(input.purpose)}.`,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la adaugarea sistemului."
      toast.error("Adaugare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function discoverAISystemsFromManifest(input: { documentName: string; content: string }) {
    setBusy(true)
    try {
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
      setData(payload)
      toast.success("Autodiscovery finalizat", {
        description:
          payload.message ||
          "Sistemele detectate automat au fost salvate si asteapta confirmare umana.",
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la autodiscovery."
      toast.error("Autodiscovery esuat", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function updateDetectedAISystem(
    id: string,
    action: "review" | "confirm" | "reject" | "restore"
  ) {
    setBusy(true)
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
      setData(payload)
      toast.success("Status actualizat", {
        description: payload.message || "Modificarea a fost salvata.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea sistemului detectat."
      toast.error("Actualizare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
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
    setBusy(true)
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
      setData(payload)
      toast.success("Detectie actualizata", {
        description: payload.message || "Clasificarea a fost recalculata pe baza editarilor.",
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea detectiei."
      toast.error("Editare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function removeAISystem(id: string) {
    setBusy(true)
    try {
      const response = await fetch(`/api/ai-systems?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      const payload = (await response.json()) as DashboardPayload & { error?: string }
      if (!response.ok) throw new Error(payload.error || "Nu am putut elimina sistemul AI.")
      setData(payload)
      toast.success("Sistem eliminat din inventar")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la eliminarea sistemului."
      toast.error("Eliminare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function validateEFacturaXml(input: { documentName: string; xml: string }) {
    setBusy(true)
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
      setData(payload)
      toast.success(payload.validation?.valid ? "XML validat" : "XML cu probleme", {
        description:
          payload.validation?.valid
            ? "Factura trece validarea structurala de baza."
            : "Corecteaza erorile si valideaza din nou inainte de transmitere.",
      })
      return payload.validation ?? null
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la validarea XML."
      toast.error("Validare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function resetWorkspaceState() {
    setBusy(true)
    try {
      const response = await fetch("/api/state/reset", { method: "POST" })
      const payload = (await response.json()) as DashboardPayload & {
        error?: string
        message?: string
      }

      if (!response.ok) {
        throw new Error(payload.error || "Nu am putut reseta workspace-ul.")
      }

      setData(payload)
      setDocumentName("")
      setDocumentContent("")
      setDocumentFile(null)
      setScanInfo(null)
      setLastExtractedPreview("")
      resetPendingScanReview()
      toast.success("Workspace resetat", {
        description:
          payload.message ||
          "Toate scanarile, alertele si task-urile au fost sterse din workspace-ul curent.",
      })
      return payload
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la resetarea workspace-ului."
      toast.error("Reset esuat", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function updateValidatedBaseline(action: "set" | "clear") {
    setBusy(true)
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

      setData(payload)
      toast.success(action === "set" ? "Baseline validat" : "Baseline eliminat", {
        description:
          payload.message ||
          (action === "set"
            ? "Drift-ul va compara de acum cu snapshot-ul validat."
            : "Comparatia revine la ultimul snapshot disponibil."),
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la actualizarea baseline-ului."
      toast.error("Baseline esuat", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function updateDriftSeverityOverrides(
    severityOverrides: Record<string, "critical" | "high" | "medium" | "low" | "default">
  ) {
    setBusy(true)
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

      setData(payload)
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
    } finally {
      setBusy(false)
    }
  }

  async function updateCompliancePackField(input: {
    systemId: string
    field: string
    value?: string | null
    action: "save" | "confirm" | "clear"
  }) {
    setBusy(true)
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

      setData(payload)
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
    } finally {
      setBusy(false)
    }
  }

  async function updateTraceabilityReview(input: {
    scope?: "record" | "law_reference" | "family"
    familyKey?: string
    traceId?: string
    lawReference?: string
    action: "confirm" | "clear"
    note?: string | null
  }) {
    setBusy(true)
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

      setData(payload)
      toast.success(
        input.action === "clear" ? "Confirmare eliminată" : "Control confirmat",
        {
          description:
            payload.message ||
            "Traceability matrix și exporturile au fost regenerate cu noua confirmare.",
        }
      )
      return payload
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea controlului din audit."
      toast.error("Actualizare traceability eșuată", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
  }

  async function reuseFamilyEvidence(familyKey: string) {
    setBusy(true)
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
        throw new Error(payload.error || "Nu am putut reutiliza dovada pentru familia de controale.")
      }

      setData(payload)
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
    } finally {
      setBusy(false)
    }
  }

  async function updateDriftLifecycle(input: {
    driftId: string
    action: "acknowledge" | "start" | "resolve" | "waive" | "reopen"
    note?: string | null
  }) {
    setBusy(true)
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

      setData(payload)
      toast.success(formatDriftActionTitle(input.action), {
        description:
          payload.message ||
          "Owner-ul, SLA-ul și audit trail-ul au fost actualizate pentru drift.",
      })
      return payload
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea drift-ului."
      toast.error("Actualizare drift eșuată", { description: message })
      throw err
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
    setBusy(true)
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

      setData(payload)
      toast.success("Dovada încărcată", {
        description: payload.evidence
          ? `${payload.evidence.fileName} · ${formatEvidenceKind(payload.evidence.kind)}`
          : file.name,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : "Eroare la încărcarea dovezii."
      toast.error("Upload eșuat", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
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
    toast.success("Export generat")
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
    setBusy(true)
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

      setData(payload)
      return payload
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Eroare la actualizarea task-ului."
      toast.error("Actualizare esuata", { description: message })
      throw err
    } finally {
      setBusy(false)
    }
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
    handleExtractScan,
    handleAnalyzePendingScan,
    handleScan,
    handleGenerateReport,
    handleGenerateAuditPack,
    handleGenerateAuditBundle,
    handleGenerateAnnexLite,
    handleChecklistExport,
    handleExportCompliScanJson: () => handleExportCompliScan("json"),
    handleExportCompliScanYaml: () => handleExportCompliScan("yaml"),
    handleShareWithAccountant,
    handleSyncNow,
    handleMarkDone,
    attachEvidence,
    handleTaskExport,
    handleSandbox,
    addAISystem,
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

export function CockpitProvider({ children }: { children: React.ReactNode }) {
  const store = useCockpitStore()
  return <CockpitContext.Provider value={store}>{children}</CockpitContext.Provider>
}

export function useCockpit() {
  const store = useContext(CockpitContext)
  if (!store) {
    throw new Error("useCockpit trebuie folosit in interiorul CockpitProvider.")
  }
  return store
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
          ? "1 alerta inchisa automat"
          : "1 alerta redeschisa"
        : feedback.status === "done"
          ? `${alertCount} alerte inchise automat`
          : `${alertCount} alerte redeschise`
    )
  }

  if (driftCount > 0) {
    impactLabels.push(
      driftCount === 1
        ? feedback.status === "done"
          ? "1 drift inchis automat"
          : "1 drift redeschis"
        : feedback.status === "done"
          ? `${driftCount} drift-uri inchise automat`
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
    ? "Task-ul este inchis, fara impact imediat in scor."
    : "Task-ul a fost redeschis."
}

export function buildCockpitTasks(data: DashboardPayload): CockpitTask[] {
  const remediationTasks = data.remediationPlan
    .filter((item) => item.id !== "baseline-maintenance")
    .map(convertRemediationTask)
  const resolvedFindingIds = getResolvedFindingIdsFromPayload(data)

  const evidenceTasks = data.state.findings
    .filter((finding) => !resolvedFindingIds.has(finding.id))
    .map((finding) =>
      convertFindingTask(
        finding,
        data.state.alerts.find(
          (alert) =>
            alert.findingId === finding.id ||
            (alert.scanId === finding.scanId && alert.sourceDocument === finding.sourceDocument && alert.open)
        )
        )
      )

  return [...remediationTasks, ...evidenceTasks]
    .map((task) => applyPersistedTaskState(task, getTaskStateByTaskId(data.state.taskState, task.id)))
    .sort(compareTasks)
}

function getResolvedFindingIdsFromPayload(data: DashboardPayload) {
  const resolved = new Set<string>()

  for (const [taskId, taskState] of Object.entries(data.state.taskState ?? {})) {
    if (taskState?.status !== "done") continue

    if (taskId.startsWith("finding-")) {
      const findingId = resolveFindingIdFromTaskId(taskId)
      if (findingId) resolved.add(findingId)
      continue
    }

    if (!taskId.startsWith("rem-")) continue

    const remediation = data.remediationPlan.find((item) => `rem-${item.id}` === taskId)
    for (const findingId of remediation?.relatedFindingIds ?? []) {
      resolved.add(findingId)
    }
  }

  return resolved
}

function convertRemediationTask(item: RemediationAction): CockpitTask {
  return {
    id: `rem-${item.id}`,
    title: item.title,
    priority: item.priority,
    severity: item.severity,
    remediationMode: item.remediationMode,
    principles: item.principles ?? ["accountability"],
    summary: item.detectedIssue || item.why,
    why: item.why,
    evidenceSnippet: item.evidence,
    source: item.sourceDocument ? `din document: ${item.sourceDocument}` : "din planul AI",
    triggerLabel: item.sourceDocument
      ? `Semnal derivat din ${item.sourceDocument}`
      : "Semnal agregat din dashboard",
    triggerSnippet: item.triggerSnippet,
    lawReference: item.lawReference || inferLawReference(item.title, item.why),
    legalSummary: item.lawReference ? `Mapare legală: ${item.lawReference}` : undefined,
    fixPreview:
      item.fixPreview || item.actions[0] || "Revizuiește cazul și aplică remedierea recomandată.",
    readyTextLabel: item.readyTextLabel || "Text gata de copiat",
    readyText: item.readyText || buildReadyTextForRemediation(item),
    confidence: severityToTaskConfidence(item.severity),
    owner: item.owner,
    dueDate:
      item.dueDate ||
      (item.priority === "P1" ? "azi" : item.priority === "P2" ? "in 3 zile" : "saptamana asta"),
    effortLabel: item.priority === "P1" ? "5 min" : item.priority === "P2" ? "15 min" : "30 min",
    steps: item.actions,
    relatedFindingIds: item.relatedFindingIds ?? [],
    relatedDriftIds: item.relatedDriftIds ?? [],
    rescanHint: "Atașează dovada, apoi folosește Mark as fixed & rescan ca să verifici task-ul pe sursa curentă.",
    status: "todo",
    sourceDocument: item.sourceDocument,
    evidenceKinds: item.evidenceTypes ?? ["policy_text", "other"],
    validationStatus: "idle",
  }
}

function convertFindingTask(finding: ScanFinding, alert?: ComplianceAlert): CockpitTask {
  const severity = alert?.severity || finding.severity
  const priority: TaskPriority = severityToTaskPriority(severity)
  const confidence: TaskConfidence = mapFindingConfidenceToTaskConfidence(
    finding.verdictConfidence
  )
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)

  return {
    id: buildFindingTaskId(finding.id),
    title: finding.title,
    priority,
    severity,
    remediationMode: inferRemediationModeFromFinding(finding),
    principles: finding.principles,
    summary: buildFindingSummary(finding),
    why: buildFindingWhy(finding),
    evidenceSnippet: buildProofNeeded(finding),
    source: `din document: ${finding.sourceDocument}`,
    triggerLabel: buildFindingTriggerLabel(finding),
    triggerSnippet: buildFindingTriggerSnippet(finding),
    lawReference: formatFindingLawReference(finding),
    legalSummary: buildLegalSummary(finding),
    fixPreview: finding.remediationHint || buildFixPreview(finding),
    readyTextLabel: buildReadyTextLabel(finding),
    readyText: buildReadyText(finding),
    confidence,
    owner:
      finding.ownerSuggestion ||
      recipe?.ownerFallback ||
      (priority === "P1" ? "Tu + DPO" : priority === "P2" ? "Marketing / Legal" : "Operatiuni"),
    dueDate:
      recipe?.dueDate ||
      (priority === "P1" ? "azi" : priority === "P2" ? "maine" : "cand revii pe document"),
    effortLabel: recipe?.effortLabel || (priority === "P1" ? "5 min" : priority === "P2" ? "10 min" : "20 min"),
    steps: buildStepsForFinding(finding),
    relatedFindingIds: [finding.id],
    relatedDriftIds: [],
    rescanHint: finding.rescanHint,
    status: "todo",
    sourceDocument: finding.sourceDocument,
    evidenceKinds: finding.evidenceTypes ?? inferEvidenceKindsFromCategory(finding.category),
    validationStatus: "idle",
  }
}

function applyPersistedTaskState(
  task: CockpitTask,
  persistedState?: PersistedTaskState
): CockpitTask {
  if (!persistedState) return task

  return {
    ...task,
    status: persistedState.status,
    attachedEvidence:
      persistedState.attachedEvidenceMeta ||
      (persistedState.attachedEvidence
        ? {
            id: `legacy-${task.id}`,
            fileName: persistedState.attachedEvidence,
            mimeType: "application/octet-stream",
            sizeBytes: 0,
            uploadedAtISO: persistedState.updatedAtISO,
            kind: task.evidenceKinds[0] ?? "other",
          }
        : undefined),
    validationStatus: persistedState.validationStatus ?? "idle",
    validationMessage: persistedState.validationMessage,
    validationConfidence: persistedState.validationConfidence,
    validationBasis: persistedState.validationBasis,
    validatedAtLabel: persistedState.validatedAtISO
      ? formatRelativeRomanian(persistedState.validatedAtISO)
      : undefined,
  }
}

function mapFindingConfidenceToTaskConfidence(
  confidence?: ScanFinding["verdictConfidence"]
): TaskConfidence {
  if (confidence === "high") return "high"
  if (confidence === "medium") return "med"
  if (confidence === "low") return "low"
  return "med"
}

function buildFindingSummary(finding: ScanFinding) {
  if (finding.provenance?.matchedKeyword) {
    return `Am găsit termenul „${finding.provenance.matchedKeyword}” în ${finding.sourceDocument}.`
  }

  if (finding.category === "GDPR") {
    return `Documentul ${finding.sourceDocument} conține semnale de tracking sau cookies care cer verificare.`
  }
  if (finding.category === "EU_AI_ACT") {
    return `Documentul ${finding.sourceDocument} sugerează decizie automată sau profilare cu impact.`
  }
  if (finding.category === "E_FACTURA") {
    return `Documentul ${finding.sourceDocument} sugerează un flux e-Factura care trebuie confirmat operațional.`
  }

  return finding.detail
}

function buildFindingWhy(finding: ScanFinding) {
  if (finding.legalMappings && finding.legalMappings.length > 0) {
    return `${finding.impactSummary || finding.detail} Mapare legală: ${finding.legalMappings
      .map((item) => `${item.regulation} ${item.article}`)
      .join(", ")}.`
  }

  return finding.impactSummary || finding.detail
}

function buildLegalSummary(finding: ScanFinding) {
  const legalSummary =
    finding.legalMappings && finding.legalMappings.length > 0
      ? finding.legalMappings
          .map((item) => `${item.regulation} ${item.article} - ${item.label}`)
          .join(" · ")
      : ""
  const principleSummary =
    finding.principles.length > 0 ? `Principii: ${summarizePrinciples(finding.principles)}` : ""

  return [legalSummary, principleSummary].filter(Boolean).join(" · ") || undefined
}

function buildFindingTriggerLabel(finding: ScanFinding) {
  return `Document: ${finding.sourceDocument} · Regula: ${finding.provenance?.ruleId || "fără regulă"}`
}

function buildFindingTriggerSnippet(finding: ScanFinding) {
  const excerpt = finding.provenance?.excerpt?.trim()
  if (!excerpt) return "Nu există încă excerpt salvat pentru acest finding."

  if (finding.provenance?.matchedKeyword) {
    return `Keyword: ${finding.provenance.matchedKeyword}\n${excerpt}`
  }

  return excerpt
}

function buildFixPreview(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.fixPreview) return recipe.fixPreview
  if (finding.remediationHint) return finding.remediationHint
  if (finding.category === "EU_AI_ACT") {
    return "Pune control uman obligatoriu și documentează logica operațională a deciziei."
  }
  if (finding.category === "GDPR") {
    return "Blochează tracking-ul până la accept explicit și salvează dovada consimțământului."
  }
  return "Validează XML-ul, confirmă transmiterea și arhivează dovada pentru contabil."
}

function buildProofNeeded(finding: ScanFinding) {
  if (finding.evidenceRequired) return finding.evidenceRequired
  if (finding.category === "EU_AI_ACT") {
    return "Dovadă de închidere: procedură de override uman, owner aprobat și log de validare pentru cazurile cu impact."
  }
  if (finding.category === "GDPR") {
    return "Dovadă de închidere: capturi CMP, test că scripturile sunt blocate înainte de accept și log cu timestamp + preferințe."
  }
  return "Dovadă de închidere: XML validat, răspuns de transmitere și arhivare a documentelor pentru audit."
}

function inferEvidenceKindsFromCategory(category: ScanFinding["category"]): TaskEvidenceKind[] {
  if (category === "EU_AI_ACT") return ["policy_text", "log_export", "screenshot"]
  if (category === "GDPR") return ["screenshot", "policy_text", "log_export"]
  return ["document_bundle", "log_export"]
}

function formatEvidenceKind(kind: TaskEvidenceKind) {
  if (kind === "screenshot") return "screenshot"
  if (kind === "policy_text") return "policy text"
  if (kind === "log_export") return "log export"
  if (kind === "yaml_evidence") return "yaml evidence"
  if (kind === "document_bundle") return "document bundle"
  return "other"
}

function buildReadyTextLabel(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.readyTextLabel) return recipe.readyTextLabel
  if (finding.readyTextLabel) return finding.readyTextLabel
  if (finding.category === "EU_AI_ACT") return "Text gata de copiat in procedura"
  if (finding.category === "GDPR") return "Text gata de copiat in banner / notice"
  return "Text gata de copiat in runbook"
}

function buildReadyText(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe?.readyText) return recipe.readyText
  if (finding.readyText) return finding.readyText
  return buildDefaultReadyTextForCategory(finding.category)
}

function buildReadyTextForRemediation(item: RemediationAction) {
  if (item.id === "tracking-consent") {
    return [
      "Folosim cookie-uri și tehnologii similare pentru analiză și îmbunătățirea experienței doar după acordul tău explicit.",
      "Poți accepta, refuza sau modifica preferințele în orice moment din centrul de preferințe.",
    ].join("\n")
  }

  if (item.id === "high-risk-flow") {
    return [
      "Nicio decizie cu efect asupra persoanei vizate nu este executată exclusiv automat.",
      "Înainte de rezultat final, cazul este revizuit de un operator desemnat care poate confirma, modifica sau respinge recomandarea sistemului.",
    ].join("\n")
  }

  if (item.id === "retention-policy") {
    return [
      "Datele personale sunt păstrate doar pe perioada necesară scopului pentru care au fost colectate.",
      "La expirarea termenului aplicabil, datele sunt șterse sau anonimizate prin procese automate sau controale documentate.",
    ].join("\n")
  }

  if (item.id === "efactura-freshness") {
    return [
      "Pentru fiecare factură transmisă prin e-Factura se păstrează XML-ul validat, confirmarea de transmitere și dovada de arhivare.",
      "Verificarea zilnică a răspunsurilor și a erorilor de sincronizare face parte din controlul operațional standard.",
    ].join("\n")
  }

  return item.actions.join("\n")
}

export function buildScanInsights(text: string): ScanInsight[] {
  const lower = text.toLowerCase()
  return [
    { id: "system", label: "Tip sistem", value: detectSystemType(lower) },
    { id: "data", label: "Date atinse", value: detectDataTypes(lower) },
    { id: "actions", label: "Actiuni", value: detectActions(lower) },
    { id: "focus", label: "Focus revizie", value: detectFocusArea(lower) },
  ]
}

export function getNextBestAction(tasks: CockpitTask[]) {
  return [...tasks].filter((task) => task.status !== "done").sort(compareTasks)[0] ?? null
}

function buildStepsForFinding(finding: ScanFinding) {
  const recipe = getFindingRemediationRecipe(finding.provenance?.ruleId)
  if (recipe) {
    return finding.rescanHint ? [...recipe.steps, finding.rescanHint] : recipe.steps
  }

  if (finding.rescanHint) {
    const baseSteps =
      finding.category === "EU_AI_ACT"
        ? [
            "Confirma daca exista decizie automata cu impact asupra utilizatorului.",
            "Documenteaza datele folosite si logica operationala.",
            "Adauga punct de override uman inainte de decizia finala.",
          ]
        : finding.category === "GDPR"
          ? [
              "Verifica baza legala pentru tracking sau prelucrare.",
              "Revizuieste bannerul de consimtamant si textul legal.",
              "Pastreaza dovada preferintelor si a versiunii politicii.",
            ]
          : [
              "Confirma traseul operational e-Factura.",
              "Verifica logurile de transmitere si raspunsurile.",
              "Arhiveaza dovada pentru audit si contabil.",
            ]

    return [...baseSteps, finding.rescanHint]
  }

  if (finding.category === "EU_AI_ACT") {
    return [
      "Confirma daca exista decizie automata cu impact asupra utilizatorului.",
      "Documenteaza datele folosite si logica operationala.",
      "Adauga punct de override uman inainte de decizia finala.",
    ]
  }
  if (finding.category === "GDPR") {
    return [
      "Verifica baza legala pentru tracking sau prelucrare.",
      "Revizuieste bannerul de consimtamant si textul legal.",
      "Pastreaza dovada preferintelor si a versiunii politicii.",
    ]
  }
  return [
    "Confirma traseul operational e-Factura.",
    "Verifica logurile de transmitere si raspunsurile.",
    "Arhiveaza dovada pentru audit si contabil.",
  ]
}

function formatFindingLawReference(finding: ScanFinding) {
  if (finding.legalMappings && finding.legalMappings.length > 0) {
    return finding.legalMappings.map((item) => `${item.regulation} ${item.article}`).join(" · ")
  }

  return finding.legalReference || inferLawReference(finding.title, finding.detail)
}

function detectSystemType(text: string) {
  if (includesAny(text, ["chatbot", "assistant", "assistant ai"])) return "chatbot / asistenta automata"
  if (includesAny(text, ["tracking", "analytics", "cookies"])) return "tracking / analytics"
  if (includesAny(text, ["recomand", "personalizare", "segment"])) return "recomandari / segmentare"
  if (includesAny(text, ["factura", "anaf", "xml"])) return "flux operational e-factura"
  return "document general de conformitate"
}

function detectDataTypes(text: string) {
  const hits: string[] = []
  if (includesAny(text, ["email", "mail"])) hits.push("email")
  if (includesAny(text, ["ip"])) hits.push("IP")
  if (includesAny(text, ["cookie", "cookies"])) hits.push("cookies")
  if (includesAny(text, ["telefon"])) hits.push("telefon")
  if (includesAny(text, ["istoric", "log"])) hits.push("istoric / log")
  return hits.length > 0 ? hits.join(", ") : "nu sunt mentionate explicit"
}

function detectActions(text: string) {
  const hits: string[] = []
  if (includesAny(text, ["decizie automata", "automat", "scoring"])) hits.push("decizie automata")
  if (includesAny(text, ["segment", "profil"])) hits.push("segmentare / profilare")
  if (includesAny(text, ["recomand"])) hits.push("recomandari")
  if (includesAny(text, ["sync", "anaf", "trimite"])) hits.push("transmitere operationala")
  return hits.length > 0 ? hits.join(", ") : "revizie text si scope"
}

function detectFocusArea(text: string) {
  if (includesAny(text, ["consim", "cookies", "tracking"])) return "consimtamant si baza legala"
  if (includesAny(text, ["decizie automata", "scoring", "profilare"])) return "human oversight si AI Act"
  if (includesAny(text, ["factura", "anaf"])) return "sync si dovada operationala"
  return "verificare umana a clauzelor"
}

function inferLawReference(title: string, detail: string) {
  const combined = `${title} ${detail}`.toLowerCase()
  if (includesAny(combined, ["consim", "tracking", "cookies"])) return "GDPR Art. 6 / Art. 7"
  if (includesAny(combined, ["high-risk", "impact ridicat", "decizie automata", "profilare"])) {
    return "AI Act Art. 9 / Art. 14"
  }
  if (includesAny(combined, ["factura", "anaf", "xml"])) return "RO e-Factura / flux ANAF"
  return "revizie juridica necesara"
}

function compareTasks(left: CockpitTask, right: CockpitTask) {
  const priorityDelta = priorityWeight(left.priority) - priorityWeight(right.priority)
  if (priorityDelta !== 0) return priorityDelta

  return remediationModeWeight(left.remediationMode) - remediationModeWeight(right.remediationMode)
}

function priorityWeight(priority: TaskPriority) {
  if (priority === "P1") return 1
  if (priority === "P2") return 2
  return 3
}

function remediationModeWeight(mode: CockpitTask["remediationMode"]) {
  return mode === "rapid" ? 1 : 2
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle))
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-")
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function getFileNameFromDisposition(contentDisposition: string | null) {
  if (!contentDisposition) return null
  const match = contentDisposition.match(/filename=\"?([^\";]+)\"?/i)
  return match?.[1] ?? null
}

async function toBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function getRiskLastSyncLabel(iso: string) {
  return formatRelativeRomanian(iso)
}
