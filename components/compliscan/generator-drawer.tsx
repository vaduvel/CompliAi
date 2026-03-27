"use client"

import { useEffect, useRef, useState } from "react"
import { AlertTriangle, CheckCircle2, Copy, FileText, Loader2, RotateCw, Sparkles } from "lucide-react"
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

const CONFIRMATION_ITEMS = [
  {
    id: "content-reviewed",
    label: "Am citit draftul și confirm că reflectă realitatea firmei",
  },
  {
    id: "facts-confirmed",
    label: "Am verificat datele, procesele și specificul firmei față de ce scrie în draft",
  },
  {
    id: "approved-for-evidence",
    label: "Îl aprob ca dovadă de conformitate",
  },
] as const

const VALIDATION_ITEMS = [
  {
    id: "validation-reviewed",
    label: "Am rulat verificarea rapidă și am revizuit observațiile înainte să rezolv riscul",
  },
  {
    id: "validation-ready",
    label: "Confirm că versiunea validată este cea pe care o voi folosi pentru rezolvarea riscului",
  },
] as const

type GeneratorDrawerProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
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
  onOpenChange,
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
  const [checklist, setChecklist] = useState<string[]>([])
  const [validationChecklist, setValidationChecklist] = useState<string[]>([])
  const [validationRunAtISO, setValidationRunAtISO] = useState<string | null>(null)
  const previewRef = useRef<HTMLDivElement>(null)

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
      setChecklist([])
      setValidationChecklist([])
      setValidationRunAtISO(null)
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
    setChecklist([])
    setValidationChecklist([])
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
      toast.success(`${doc.title} generat`)

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
          confirmationChecklist: checklist,
          validationChecklist,
        }),
      })
      const payload = (await res.json()) as GeneratorDrawerCompletionResult & { error?: string }

      if (!res.ok) {
        throw new Error(payload.error ?? "Nu am putut atasa draftul ca dovada.")
      }

      toast.success("Documentul este confirmat", {
        description: "Documentul este pregătit. Acum rezolvi riscul din același cockpit, apoi îl trimiți la Dosar.",
      })
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

  function toggleItem(id: string) {
    setChecklist((c) => (c.includes(id) ? c.filter((v) => v !== id) : [...c, id]))
  }

  function toggleValidationItem(id: string) {
    setValidationChecklist((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    )
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
      toast.success("Draftul a trecut verificarea rapidă")
      return
    }

    toast.error("Draftul are observații înainte de rezolvare", {
      description: "Corectează punctele picate, regenerează sau înlocuiește documentul.",
    })
  }

  const allChecked = CONFIRMATION_ITEMS.every((item) => checklist.includes(item.id))
  const validationConfirmed = VALIDATION_ITEMS.every((item) =>
    validationChecklist.includes(item.id)
  )
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
  const attachDisabled = !allChecked || !validationConfirmed || !validationPassed || attaching
  const activeDrawerStepIndex = !result
    ? generating
      ? 1
      : 0
    : validationPassed && validationConfirmed && allChecked
      ? 3
      : 2
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

  return (
    <Card data-testid="finding-generator-drawer" className="border-eos-primary/25 bg-eos-bg-inset/30">
      <CardContent className="space-y-5 px-5 py-5 sm:px-6 sm:py-6">
        <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-primary">
              Zonă de generare pentru rezolvare
            </p>
            <p className="flex items-center gap-2 text-base font-semibold text-eos-text">
              <FileText className="size-4 text-eos-primary" strokeWidth={2} />
              {docTypeLabel}
            </p>
            <p className="text-sm text-eos-text-muted">
              {findingTitle} · generezi, validezi și confirmi documentul chiar în acest cockpit.
            </p>
        </div>

        <div className="flex-1 space-y-4">
          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              {["Completezi", "Generezi", "Validezi", "Confirmi"].map((step, index) => {
                return (
                  <span
                    key={step}
                    className={[
                      "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium",
                      index === activeDrawerStepIndex
                        ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                        : "border-eos-border bg-eos-surface text-eos-text-muted",
                    ].join(" ")}
                  >
                    {step}
                  </span>
                )
              })}
            </div>
          </div>

      {/* ── Form ── */}
          {!result && (
            <div className="space-y-3">
              <Field label="Numele organizatiei">
                <input
                  className={inputClass}
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="SRL-ul tau"
                />
              </Field>

              {showWebsiteField && (
                <Field label="Website" hint="Opțional — apare în document ca sursă de identificare">
                  <input
                    className={inputClass}
                    value={orgWebsite}
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

              <Field label={contextFieldLabel} hint={contextFieldHint}>
                <textarea
                  className={textareaClass}
                  rows={3}
                  value={dataFlows}
                  onChange={(e) => setDataFlows(e.target.value)}
                  placeholder={contextFieldPlaceholder}
                />
              </Field>

              <Button
                onClick={handleGenerate}
                disabled={generating}
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

          {/* ── Preview ── */}
          {result && (
            <div ref={previewRef} className="space-y-4">
              <div data-testid="generated-document-preview" className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                    Preview draft
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-eos-sm px-2 py-1 text-[11px] text-eos-text-muted transition-colors hover:bg-eos-surface-variant hover:text-eos-text"
                    title="Copiază în clipboard"
                  >
                    <Copy className="size-3" strokeWidth={2} />
                    Copiază
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto text-sm leading-relaxed text-eos-text whitespace-pre-wrap">
                  {result.content}
                </div>
              </div>

              <div className="space-y-3 rounded-eos-md border border-eos-border bg-eos-surface px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                      Scan / Validate evidence
                    </p>
                    <p className="mt-1 text-sm text-eos-text-muted">
                      Verifici rapid dacă draftul poate fi folosit pentru a rezolva riscul, înainte să ajungă la Dosar.
                    </p>
                  </div>
                  <span
                    className={[
                      "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                      validationRunAtISO === null
                        ? "border border-eos-border bg-eos-bg-inset text-eos-text-muted"
                        : validationPassed
                          ? "bg-eos-success-soft text-eos-success"
                          : "bg-red-100 text-red-700",
                    ].join(" ")}
                  >
                    {validationRunAtISO === null
                      ? "Nevalidat încă"
                      : validationPassed
                        ? "Valid"
                        : "Are observații"}
                  </span>
                </div>

                {validationRunAtISO ? (
                  <p className="text-xs text-eos-text-muted">
                    Ultima verificare: {new Date(validationRunAtISO).toLocaleString("ro-RO")}
                  </p>
                ) : (
                  <p className="text-xs text-eos-text-muted">
                    Rulează mai întâi validarea explicită. Fără pasul ăsta, draftul nu poate fi confirmat pentru rezolvare.
                  </p>
                )}

                <div className="space-y-2 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-3 py-3">
                  {validationResult?.checks.map((check) => (
                    <div key={check.id} className="flex items-start gap-2 text-sm">
                      {check.passed ? (
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
                      ) : (
                        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-red-600" strokeWidth={2} />
                      )}
                      <div>
                        <p className={check.passed ? "text-eos-text" : "text-red-700"}>
                          {check.label}
                        </p>
                        <p className="mt-0.5 text-xs text-eos-text-muted">{check.help}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {validationFailed ? (
                  <div className="rounded-eos-md border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-red-700">
                      Ce trebuie corectat
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-eos-text-muted">
                      {validationResult?.checks
                        .filter((check) => !check.passed)
                        .map((check) => (
                          <li key={check.id}>• {check.help}</li>
                        ))}
                    </ul>
                  </div>
                ) : null}

                <div className="space-y-2.5">
                  {VALIDATION_ITEMS.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer items-start gap-3 rounded-eos-md border border-eos-border px-4 py-3 transition-colors hover:bg-eos-surface-variant"
                    >
                      <input
                        type="checkbox"
                        checked={validationChecklist.includes(item.id)}
                        onChange={() => toggleValidationItem(item.id)}
                        data-testid={`drawer-validation-${item.id}`}
                        className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
                      />
                      <span className="text-sm text-eos-text">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                  Confirmă înainte de salvare
                </p>
                {CONFIRMATION_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-start gap-3 rounded-eos-md border border-eos-border px-4 py-3 transition-colors hover:bg-eos-surface-variant"
                  >
                    <input
                      type="checkbox"
                      checked={checklist.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                      data-testid={`drawer-checklist-${item.id}`}
                      className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
                    />
                    <span className="text-sm text-eos-text">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={runValidation}
                  data-testid="rerun-document-validation"
                  className="gap-2"
                >
                  <RotateCw className="size-4" strokeWidth={2} />
                  Re-scannează
                </Button>
                <Button variant="outline" onClick={handleGenerate} disabled={generating}>
                  Regenerează
                </Button>
                <Button variant="outline" onClick={() => setResult(null)}>
                  Înlocuiește documentul
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={handleAttach}
                  disabled={attachDisabled}
                    data-testid="confirm-generated-document"
                  className="w-full gap-2"
                >
                  {attaching ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" strokeWidth={2} />
                  )}
                  Confirmă documentul pentru rezolvare
                </Button>
                <p className="text-xs text-eos-text-muted">
                  Zona de generare doar produce, validează și confirmă documentul. Rezolvarea riscului și trimiterea la Dosar rămân pași separați în același cockpit.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
