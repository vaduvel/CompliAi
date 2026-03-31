"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Copy, FileText, Loader2, Maximize2, Plus, RotateCw, Sparkles, Trash2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { ORG_SECTOR_LABELS } from "@/lib/compliance/applicability"
import {
  buildSiteScanContextForDocument,
  getLatestSuccessfulSiteScanResult,
} from "@/lib/compliance/site-scan-context"
import { FINDING_DOCUMENT_LABELS } from "@/lib/compliscan/finding-cockpit"
import { validateGeneratedDocumentEvidence } from "@/lib/compliscan/generated-document-validation"
import type { DocumentType, GeneratedDocument } from "@/lib/server/document-generator"

// ── Types ────────────────────────────────────────────────────────────────────

type GeneratedDocumentResponse = GeneratedDocument & {
  recordId?: string
  sourceFindingId?: string | null
}

type GeneratorDrawerCompletionResult = {
  evidenceAttached?: boolean
  finding?: {
    findingStatus?: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
    findingStatusUpdatedAtISO?: string
    nextMonitoringDateISO?: string
    operationalEvidenceNote?: string
    reopenedFromISO?: string
    resolution?: {
      closureEvidence?: string | null
    } | null
  }
  linkedGeneratedDocument?: {
    id: string
    title: string
    generatedAtISO: string
    approvalStatus?: "draft" | "approved_as_evidence"
    validationStatus?: "pending" | "passed"
    validatedAtISO?: string
    approvedAtISO?: string
    approvedByEmail?: string
    expiresAtISO?: string
    nextReviewDateISO?: string
  } | null
  documentFlowState?: "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
  feedbackMessage?: string
}

const REQUIRED_CONFIRMATION_IDS = [
  "content-reviewed",
  "facts-confirmed",
  "approved-for-evidence",
] as const

const REQUIRED_VALIDATION_IDS = [
  "validation-reviewed",
  "validation-ready",
] as const

const GENERATOR_PROGRESS_TOAST_ID = "resolve-document-progress"

type GeneratorDrawerProps = {
  open: boolean
  findingStatus: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
  findingId: string
  documentType: DocumentType
  findingTitle: string
  vendorName?: string
  vendorDpaUrl?: string | null
  onComplete: (result?: GeneratorDrawerCompletionResult) => void
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-eos-text">{label}</label>
      {hint && <p className="text-[11px] text-eos-text-muted">{hint}</p>}
      {children}
    </div>
  )
}

const inputClass =
  "ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"

const textareaClass =
  "ring-focus w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"

// ── Component ────────────────────────────────────────────────────────────────

export function GeneratorDrawer({
  open,
  findingStatus,
  findingId,
  documentType,
  findingTitle,
  vendorName,
  vendorDpaUrl,
  onComplete,
}: GeneratorDrawerProps) {
  const cockpit = useCockpitData()
  const [orgName, setOrgName] = useState("")
  const [orgWebsite, setOrgWebsite] = useState("")
  const [dpoEmail, setDpoEmail] = useState("")
  const [dataFlows, setDataFlows] = useState("")
  const [counterpartyName, setCounterpartyName] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedDocumentResponse | null>(null)
  const [attaching, setAttaching] = useState(false)
  const [humanApprovalConfirmed, setHumanApprovalConfirmed] = useState(false)
  const [validationRunAtISO, setValidationRunAtISO] = useState<string | null>(null)
  const [documentConfirmed, setDocumentConfirmed] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const [previewExpanded, setPreviewExpanded] = useState(false)

  // Retention matrix wizard state
  type RetentionRow = { category: string; period: string; trigger: string; basis: string }
  const [retentionRows, setRetentionRows] = useState<RetentionRow[]>([
    { category: "", period: "", trigger: "", basis: "" },
  ])
  const showRetentionWizard = documentType === "retention-policy"

  function addRetentionRow() {
    setRetentionRows((prev) => [...prev, { category: "", period: "", trigger: "", basis: "" }])
  }

  function removeRetentionRow(idx: number) {
    setRetentionRows((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateRetentionRow(idx: number, field: keyof RetentionRow, value: string) {
    setRetentionRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)))
  }

  function applyRetentionMatrix() {
    const filled = retentionRows.filter((r) => r.category.trim())
    if (filled.length === 0) return
    const lines = filled.map(
      (r) =>
        `${r.category.trim()}: ${r.period.trim() || "nedefinit"}${r.trigger.trim() ? `, trigger: ${r.trigger.trim()}` : ""}${r.basis.trim() ? `, bază legală: ${r.basis.trim()}` : ""}`
    )
    setDataFlows(lines.join("\n"))
  }

  const docTypeLabel = FINDING_DOCUMENT_LABELS[documentType] ?? documentType
  const siteScanDrivenDocument =
    documentType === "privacy-policy" || documentType === "cookie-policy"
  const latestSiteScanResult = getLatestSuccessfulSiteScanResult(cockpit.data?.state.siteScanJobs)
  const siteScanContext =
    siteScanDrivenDocument && latestSiteScanResult
      ? buildSiteScanContextForDocument(documentType, latestSiteScanResult)
      : ""

  // Pre-fill from org state
  useEffect(() => {
    if (!cockpit.data) return
    if (!orgName) setOrgName(cockpit.data.workspace.orgName)
    if (!orgWebsite && cockpit.data.state.orgProfile?.website) {
      setOrgWebsite(cockpit.data.state.orgProfile.website)
    }
  }, [cockpit.data, orgName, orgWebsite])

  useEffect(() => {
    if (!siteScanDrivenDocument || !latestSiteScanResult) return

    if (!orgWebsite) {
      setOrgWebsite(latestSiteScanResult.url)
    }

    if (!dataFlows && siteScanContext) {
      setDataFlows(siteScanContext)
    }
  }, [dataFlows, latestSiteScanResult, orgWebsite, siteScanContext, siteScanDrivenDocument])

  useEffect(() => {
    if (documentType !== "dpa") return
    if (vendorName && !counterpartyName) {
      setCounterpartyName(vendorName)
    }
  }, [counterpartyName, documentType, vendorName])

  // Reset state when drawer opens with new finding
  useEffect(() => {
    if (open) {
      setResult(null)
      setHumanApprovalConfirmed(false)
      setValidationRunAtISO(null)
      setDocumentConfirmed(false)
    }
  }, [open, findingId])

  async function handleGenerate() {
    const name = orgName.trim()
    if (!name) {
      toast.error("Introdu numele organizatiei")
      return
    }

    setGenerating(true)
    setResult(null)
    setHumanApprovalConfirmed(false)
    setValidationRunAtISO(null)

    try {
      const profile = cockpit.data?.state.orgProfile
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType,
          orgName: name,
          orgWebsite: orgWebsite.trim() || undefined,
          orgSector: profile ? ORG_SECTOR_LABELS[profile.sector] : undefined,
          orgCui: profile?.cui || undefined,
          dpoEmail: dpoEmail.trim() || undefined,
          dataFlows: dataFlows || undefined,
          counterpartyName: documentType === "dpa" ? counterpartyName.trim() || undefined : undefined,
          counterpartyReferenceUrl: documentType === "dpa" ? vendorDpaUrl || undefined : undefined,
          sourceFindingId: findingId,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Generarea a eșuat.")
      }

      const doc = (await res.json()) as GeneratedDocumentResponse
      setResult(doc)
      toast.success(`${doc.title} generat`, {
        id: GENERATOR_PROGRESS_TOAST_ID,
        duration: 2400,
      })

      // Scroll to preview
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function handleAttach() {
    if (!result?.recordId) return

    setAttaching(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(findingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "confirmed",
          generatedDocumentId: result.recordId,
          confirmationChecklist: humanApprovalConfirmed ? [...REQUIRED_CONFIRMATION_IDS] : [],
          validationChecklist: humanApprovalConfirmed ? [...REQUIRED_VALIDATION_IDS] : [],
        }),
      })
      const payload = (await res.json()) as GeneratorDrawerCompletionResult & { error?: string }

      if (!res.ok) {
        throw new Error(payload.error ?? "Nu am putut atasa draftul ca dovada.")
      }

      toast.success("Documentul este confirmat", {
        id: GENERATOR_PROGRESS_TOAST_ID,
        duration: 2800,
        description: "Documentul este pregătit. Acum rezolvi riscul din același cockpit, apoi îl trimiți la Dosar.",
      })
      setDocumentConfirmed(true)
      onComplete({
        ...payload,
        evidenceAttached: true,
      })
    } catch (err) {
      toast.error("Eroare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setAttaching(false)
    }
  }

  async function handleCopy() {
    if (!result?.content) return
    try {
      await navigator.clipboard.writeText(result.content)
      toast.success("Copiat în clipboard")
    } catch {
      toast.error("Nu am putut copia. Selectează textul manual.")
    }
  }

  function runValidation() {
    if (!result) return

    const validation = validateGeneratedDocumentEvidence({
      documentType,
      title: result.title,
      content: result.content,
      orgName: orgName.trim(),
      orgWebsite: orgWebsite.trim() || undefined,
      counterpartyName: counterpartyName.trim() || undefined,
    })

    setValidationRunAtISO(new Date().toISOString())

    if (validation.status === "valid") {
      toast.success("Draftul a trecut verificarea rapidă", {
        id: GENERATOR_PROGRESS_TOAST_ID,
        duration: 2400,
      })
      return
    }

    toast.error("Draftul are observații înainte de rezolvare", {
      description: "Corectează punctele picate, regenerează sau înlocuiește documentul.",
    })
  }

  const validationResult = result
    ? validateGeneratedDocumentEvidence({
        documentType,
        title: result.title,
        content: result.content,
        orgName: orgName.trim(),
        orgWebsite: orgWebsite.trim() || undefined,
        counterpartyName: counterpartyName.trim() || undefined,
      })
    : null
  const validationPassed = validationRunAtISO !== null && validationResult?.status === "valid"
  const validationFailed = validationRunAtISO !== null && validationResult?.status === "invalid"
  const attachDisabled = !humanApprovalConfirmed || !validationPassed || attaching
  const lockedUntilConfirmed = findingStatus === "open"
  const hasDraft = Boolean(result)
  const drawerSteps = [
    {
      id: "confirm-finding",
      label: "Confirmi findingul",
      hint: "Confirmarea rămâne sus, în cockpit.",
      done: !lockedUntilConfirmed,
      active: lockedUntilConfirmed,
    },
    {
      id: "complete-details",
      label: "Completezi datele",
      hint: "Introduci doar datele reale ale firmei.",
      done: !lockedUntilConfirmed && (hasDraft || generating || documentConfirmed),
      active: !lockedUntilConfirmed && !hasDraft && !generating && !documentConfirmed,
    },
    {
      id: "generate-draft",
      label: "Generezi draftul",
      hint: "Gemini sau fallbackul nostru produce draftul.",
      done: hasDraft || documentConfirmed,
      active: generating,
    },
    {
      id: "rescan-draft",
      label: "Re-scanezi draftul",
      hint: "Asta este următoarea acțiune primară după generare.",
      done: validationPassed || documentConfirmed,
      active: hasDraft && !documentConfirmed && !validationPassed,
    },
    {
      id: "confirm-document",
      label: "Confirmi documentul",
      hint: "Aprobarea umană îl pregătește pentru rezolvare.",
      done: documentConfirmed,
      active: hasDraft && validationPassed && !documentConfirmed,
    },
  ]
  const showWebsiteField = ["privacy-policy", "cookie-policy", "dpa"].includes(documentType)
  const showDpoField = ["privacy-policy", "dpa", "retention-policy"].includes(documentType)
  const showCounterpartyField = documentType === "dpa"
  const contextFieldHint = siteScanContext
    ? "Precompletat din ultimul site scan. Poți ajusta înainte de generare."
    : documentType === "retention-policy"
      ? "Listează categoriile de date, termenele și procesele de ștergere / anonimizare pe care vrei să le prinzi în matrice."
      : "Detalii relevante pentru documentul generat."
  const contextFieldLabel =
    documentType === "retention-policy" ? "Categorii de date, termene și procese" : "Context suplimentar"
  const contextFieldPlaceholder =
    documentType === "retention-policy"
      ? "Ex: clienți activi 3 ani după ultimul contract, lead-uri 12 luni, HR conform termenelor legale, loguri suport 90 zile, ștergere manuală lunară și verificare trimestrială."
      : "Detalii relevante pentru documentul generat..."

  if (!open) return null

  // Compact step indicator state
  const activeStepIdx = drawerSteps.findIndex((s) => s.active && !s.done)
  const currentStepNum = activeStepIdx === -1
    ? (drawerSteps.every((s) => s.done) ? drawerSteps.length : 1)
    : activeStepIdx + 1
  const currentStepLabel = activeStepIdx === -1
    ? (drawerSteps.every((s) => s.done) ? "Finalizat" : drawerSteps[0]?.label)
    : drawerSteps[activeStepIdx]?.label

  return (
    <>
      {/* ── Full-screen document preview modal ──────────────────────────── */}
      {previewExpanded && result && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 sm:p-8 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewExpanded(false) }}
        >
          <div className="relative w-full max-w-3xl rounded-eos-xl border border-eos-border bg-eos-surface shadow-2xl">
            {/* Modal header */}
            <div className="flex items-center justify-between gap-4 border-b border-eos-border px-6 py-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText className="size-4 shrink-0 text-eos-primary" strokeWidth={2} />
                <p className="text-sm font-semibold text-eos-text truncate">{result.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-eos-md border border-eos-border px-3 py-1.5 text-xs text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
                >
                  <Copy className="size-3" strokeWidth={2} />
                  Copiază
                </button>
                <button
                  onClick={() => setPreviewExpanded(false)}
                  className="flex size-7 items-center justify-center rounded-eos-md border border-eos-border text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
                  aria-label="Închide preview"
                >
                  <X className="size-4" strokeWidth={2} />
                </button>
              </div>
            </div>
            {/* Modal content */}
            <div className="px-6 py-6">
              <div className="text-sm leading-7 text-eos-text whitespace-pre-wrap font-[var(--font-sans)]">
                {result.content}
              </div>
            </div>
          </div>
        </div>
      )}

    <Card data-testid="finding-generator-drawer" className="border-eos-primary/25 bg-eos-surface-variant">
      <CardContent className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">

        {/* ── Header: doc type + compact step indicator ─────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <p className="flex items-center gap-2 text-base font-semibold text-eos-text">
              <FileText className="size-4 shrink-0 text-eos-primary" strokeWidth={2} />
              {docTypeLabel}
            </p>
            <p className="text-sm text-eos-text-muted truncate">{findingTitle}</p>
          </div>
          {/* Compact step indicator */}
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <div className="flex items-center gap-1">
              {drawerSteps.map((step) => (
                <div
                  key={step.id}
                  className={[
                    "h-1.5 rounded-full transition-all duration-300",
                    step.done
                      ? "w-5 bg-eos-success"
                      : step.active
                        ? "w-6 bg-eos-primary"
                        : "w-4 bg-eos-border",
                  ].join(" ")}
                />
              ))}
            </div>
            <p className="text-[11px] text-eos-text-tertiary whitespace-nowrap">
              Pasul {currentStepNum} din {drawerSteps.length}
              {currentStepLabel ? ` · ${currentStepLabel}` : ""}
            </p>
          </div>
        </div>

        <div className="flex-1 space-y-4">

          {lockedUntilConfirmed ? (
            <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.05] px-4 py-3">
              <p className="text-sm text-eos-text-muted">
                Confirmă findingul mai sus — imediat după confirmare poți completa datele și genera documentul.
              </p>
            </div>
          ) : null}

      {/* ── Form ── */}
          {!result && (
            <div className="space-y-3">
              <Field label="Numele organizatiei">
                <input
                  className={inputClass}
                  value={orgName}
                  disabled={lockedUntilConfirmed}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="SRL-ul tau"
                />
              </Field>

              {showWebsiteField && (
                <Field label="Website" hint="Opțional — apare în document ca sursă de identificare">
                  <input
                    className={inputClass}
                    value={orgWebsite}
                    disabled={lockedUntilConfirmed}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://exemplu.ro"
                    type="url"
                  />
                </Field>
              )}

              {showDpoField && (
                <Field label="Email DPO / responsabil date" hint="Opțional — inclus în secțiunea de contact">
                  <input
                    className={inputClass}
                    value={dpoEmail}
                    disabled={lockedUntilConfirmed}
                    onChange={(e) => setDpoEmail(e.target.value)}
                    placeholder="dpo@firma.ro"
                    type="email"
                  />
                </Field>
              )}

              {showCounterpartyField && (
                <Field
                  label="Procesator / furnizor"
                  hint="Dacă finding-ul vine dintr-un vendor cunoscut, numele este precompletat și intră direct în draftul DPA."
                >
                  <input
                    className={inputClass}
                    value={counterpartyName}
                    disabled={lockedUntilConfirmed}
                    onChange={(e) => setCounterpartyName(e.target.value)}
                    placeholder="Ex: Google Analytics, Mailchimp, Stripe"
                  />
                </Field>
              )}

              {showCounterpartyField && (vendorName || vendorDpaUrl) ? (
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3 text-sm text-eos-text">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                    Context vendor
                  </p>
                  {vendorName ? <p className="mt-1">Vendor detectat: {vendorName}</p> : null}
                  {vendorDpaUrl ? (
                    <p className="mt-1 text-eos-text-muted">
                      Link public DPA:{" "}
                      <a
                        href={vendorDpaUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-eos-primary underline underline-offset-2"
                      >
                        deschide referința
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}

              {siteScanContext && latestSiteScanResult ? (
                <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary-soft/20 px-4 py-3 text-sm text-eos-text">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                    Context din site scan
                  </p>
                  <p className="mt-1 text-eos-text-muted">
                    Ultimul scan al site-ului a rulat la{" "}
                    {new Date(latestSiteScanResult.scannedAtISO).toLocaleString("ro-RO")} și intră direct în draftul acestui document.
                  </p>
                </div>
              ) : null}

              {showRetentionWizard && !lockedUntilConfirmed && (
                <div className="space-y-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="text-xs font-semibold text-eos-text">
                    Matrice retenție — completează categoriile de date
                  </p>
                  <div className="space-y-2">
                    {retentionRows.map((row, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_0.7fr_0.8fr_0.8fr_auto] items-center gap-2">
                        <input
                          className="rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                          placeholder="Categorie date"
                          value={row.category}
                          onChange={(e) => updateRetentionRow(idx, "category", e.target.value)}
                        />
                        <input
                          className="rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                          placeholder="Perioadă"
                          value={row.period}
                          onChange={(e) => updateRetentionRow(idx, "period", e.target.value)}
                        />
                        <input
                          className="rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                          placeholder="Trigger ștergere"
                          value={row.trigger}
                          onChange={(e) => updateRetentionRow(idx, "trigger", e.target.value)}
                        />
                        <input
                          className="rounded-eos-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
                          placeholder="Bază legală"
                          value={row.basis}
                          onChange={(e) => updateRetentionRow(idx, "basis", e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => removeRetentionRow(idx)}
                          disabled={retentionRows.length <= 1}
                          className="rounded p-1 text-eos-text-muted hover:bg-eos-surface-variant hover:text-eos-error disabled:opacity-30"
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={addRetentionRow}
                      className="inline-flex items-center gap-1 rounded-eos-md border border-eos-border px-2.5 py-1.5 text-xs text-eos-text-muted hover:bg-eos-surface-variant"
                    >
                      <Plus className="size-3" strokeWidth={2} />
                      Adaugă categorie
                    </button>
                    <button
                      type="button"
                      onClick={applyRetentionMatrix}
                      className="inline-flex items-center gap-1 rounded-eos-md border border-eos-primary/30 bg-eos-primary/10 px-2.5 py-1.5 text-xs font-medium text-eos-primary hover:bg-eos-primary/20"
                    >
                      Aplică în context
                    </button>
                  </div>
                </div>
              )}

              <Field label={contextFieldLabel} hint={contextFieldHint}>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={dataFlows}
                  disabled={lockedUntilConfirmed}
                  onChange={(e) => setDataFlows(e.target.value)}
                  placeholder={contextFieldPlaceholder}
                />
              </Field>

              <Button
                onClick={handleGenerate}
                disabled={generating || lockedUntilConfirmed}
                data-testid="generate-document-draft"
                className="w-full gap-2"
              >
                {generating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" strokeWidth={2} />
                )}
                {generating ? "Se generează..." : "Generează draftul"}
              </Button>
            </div>
          )}

          {/* ── Preview + sequential actions ── */}
          {result && (
            <div ref={previewRef} className="space-y-4">
              {/* Document preview — full width, expandable */}
              <div data-testid="generated-document-preview" className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-bg-inset">
                <div className="flex items-center justify-between gap-3 border-b border-eos-border-subtle px-4 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                    Preview draft
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-eos-sm px-2.5 py-1 text-[11px] text-eos-text-muted transition-colors hover:bg-eos-surface-variant hover:text-eos-text"
                      title="Copiază în clipboard"
                    >
                      <Copy className="size-3" strokeWidth={2} />
                      Copiază
                    </button>
                    <button
                      onClick={() => setPreviewExpanded(true)}
                      className="flex items-center gap-1.5 rounded-eos-sm px-2.5 py-1 text-[11px] text-eos-text-muted transition-colors hover:bg-eos-surface-variant hover:text-eos-text"
                      title="Deschide în preview complet"
                    >
                      <Maximize2 className="size-3" strokeWidth={2} />
                      Expandează
                    </button>
                  </div>
                </div>
                <div className="h-[480px] overflow-y-auto p-4 text-sm leading-7 text-eos-text whitespace-pre-wrap scrollbar-thin scrollbar-track-transparent scrollbar-thumb-eos-border">
                  {result.content}
                </div>
              </div>

              {/* Step: Re-scanează — acțiune primară când documentul nu e validat încă */}
              {!validationPassed && !documentConfirmed && (
                <div className="space-y-3">
                  {validationRunAtISO && (
                    <div className="rounded-eos-md border border-eos-border bg-eos-surface px-4 py-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">Rezultat re-scan</p>
                        <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-eos-error-soft text-eos-error">Are observații</span>
                      </div>
                      <div className="space-y-2 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-3">
                        {validationResult?.checks.map((check) => (
                          <div key={check.id} className="flex items-start gap-2 text-sm">
                            {check.passed
                              ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
                              : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-error" strokeWidth={2} />}
                            <div>
                              <p className={check.passed ? "text-eos-text" : "text-eos-error"}>{check.label}</p>
                              <p className="mt-0.5 text-xs text-eos-text-muted">{check.help}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button onClick={runValidation} data-testid="rerun-document-validation" className="w-full gap-2">
                    <RotateCw className="size-4" strokeWidth={2} />
                    {validationRunAtISO ? "Re-scanează din nou" : "Re-scanează draftul"}
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>Regenerează</Button>
                    <Button variant="ghost" size="sm" onClick={() => setResult(null)}>Înlocuiește</Button>
                  </div>
                </div>
              )}

              {/* Step: Folosește să închizi riscul — acțiune primară după re-scan valid */}
              {validationPassed && !documentConfirmed && (
                <div className="space-y-3">
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface px-4 py-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">Rezultat re-scan</p>
                      <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium bg-eos-success-soft text-eos-success">Valid</span>
                    </div>
                    <div className="space-y-2 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-3">
                      {validationResult?.checks.map((check) => (
                        <div key={check.id} className="flex items-start gap-2 text-sm">
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
                          <p className="text-eos-text">{check.label}</p>
                        </div>
                      ))}
                    </div>
                    <label className="flex cursor-pointer items-start gap-3 rounded-eos-md border border-eos-border px-4 py-3 transition-colors hover:bg-eos-surface-variant">
                      <input
                        type="checkbox"
                        checked={humanApprovalConfirmed}
                        onChange={(event) => setHumanApprovalConfirmed(event.target.checked)}
                        data-testid="drawer-human-approval"
                        className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
                      />
                      <span className="text-sm text-eos-text">
                        Confirm că am verificat datele generate și aprob documentul pentru rezolvarea riscului.
                      </span>
                    </label>
                  </div>
                  <Button
                    onClick={handleAttach}
                    disabled={!humanApprovalConfirmed || attaching}
                    data-testid="confirm-generated-document"
                    className="w-full gap-2"
                  >
                    {attaching ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" strokeWidth={2} />}
                    Folosește să închizi riscul
                  </Button>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" size="sm" onClick={runValidation}>Re-scanează din nou</Button>
                    <Button variant="ghost" size="sm" onClick={handleGenerate} disabled={generating}>Regenerează</Button>
                  </div>
                </div>
              )}

              {/* Stare finală: document confirmat */}
              {documentConfirmed && (
                <div className="flex items-center gap-2 rounded-eos-md border border-eos-success/25 bg-eos-success-soft/40 px-4 py-3">
                  <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
                  <p className="text-sm font-medium text-eos-success">Documentul a fost confirmat. Riscul este rezolvat.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
    </>
  )
}
