"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  ListChecks,
  Loader2,
  Shield,
  Sparkles,
  TriangleAlert,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import {
  APPLICABILITY_TAG_LABELS,
  ORG_EMPLOYEE_COUNT_LABELS,
  ORG_SECTOR_LABELS,
  type ApplicabilityResult,
  type OrgEmployeeCount,
  type OrgProfile,
  type OrgSector,
} from "@/lib/compliance/applicability"
import {
  type OrgProfilePrefill,
  type PrefillSuggestion,
} from "@/lib/compliance/org-profile-prefill"
import {
  buildInitialIntakeAnswers,
  CONDITIONAL_QUESTIONS,
  DECISIVE_QUESTIONS,
  deriveSuggestedAnswers,
  getVisibleConditionalQuestions,
  type DocumentRequest,
  type FullIntakeAnswers,
  type IntakeQuestion,
  type NextBestAction,
  type SuggestedAnswer,
} from "@/lib/compliance/intake-engine"
import type { ScanFinding } from "@/lib/compliance/types"
import { useTrackEvent } from "@/lib/client/use-track-event"

export type ApplicabilityWizardStep =
  | "cui"
  | "checking"
  | "sector"
  | "size"
  | "ai"
  | "efactura"
  | "intake"
  | "done"

type WizardState = {
  cui: string
  website: string
  sector: OrgSector | null
  employeeCount: OrgEmployeeCount | null
  usesAITools: boolean | null
  requiresEfactura: boolean | null
}

type ProfileSaveResponse = {
  applicability: ApplicabilityResult
  initialFindings?: ScanFinding[]
  documentRequests?: DocumentRequest[]
  nextBestAction?: NextBestAction | null
  intakeAnswers?: FullIntakeAnswers | null
}

type ProfilePrefillResponse = {
  prefill: OrgProfilePrefill | null
}

type Props = {
  onComplete: (result: ApplicabilityResult) => void
  onStepChange?: (step: ApplicabilityWizardStep) => void
  onBackToModeSelection?: () => void
}

const SECTORS = Object.entries(ORG_SECTOR_LABELS) as [OrgSector, string][]
const SIZES = Object.entries(ORG_EMPLOYEE_COUNT_LABELS) as [OrgEmployeeCount, string][]
const INTAKE_QUESTIONS = DECISIVE_QUESTIONS.filter((question) => question.id !== "usesAITools")

const CERTAINTY_BADGE: Record<string, string> = {
  certain: "border-eos-border bg-eos-success-soft text-eos-success",
  probable: "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
  unlikely: "border-eos-border bg-eos-surface-variant text-eos-text-muted",
}

const CONFIDENCE_BADGE: Record<SuggestedAnswer["confidence"], string> = {
  high: "border-eos-border bg-eos-success-soft text-eos-success",
  medium: "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
  low: "border-eos-border bg-eos-surface-variant text-eos-text-muted",
}

const WIZARD_SEQUENCE: ApplicabilityWizardStep[] = [
  "cui",
  "checking",
  "sector",
  "size",
  "ai",
  "efactura",
  "intake",
  "done",
]

const WIZARD_PROGRESS_LABELS: Record<ApplicabilityWizardStep, string> = {
  cui: "Profil firmă",
  checking: "Compli verifică",
  sector: "Sector de activitate",
  size: "Dimensiunea firmei",
  ai: "Utilizare AI",
  efactura: "e-Factura",
  intake: "Confirmări finale",
  done: "Raport inițial pregătit",
}

const CHECKING_MESSAGES = [
  "Verificăm datele firmei",
  "Analizăm website-ul",
  "Căutăm semnale relevante",
  "Identificăm ce ți se aplică",
  "Pregătim snapshot-ul",
] as const

export function ApplicabilityWizard({ onComplete, onStepChange, onBackToModeSelection }: Props) {
  const { track, trackOnce } = useTrackEvent()
  const completedRef = useRef(false)

  useEffect(() => {
    trackOnce("started_applicability")
  }, [trackOnce])

  useEffect(() => () => {
    if (!completedRef.current) track("abandoned_applicability")
  }, [track])

  const [step, setStep] = useState<ApplicabilityWizardStep>("cui")
  const [values, setValues] = useState<WizardState>({
    cui: "",
    website: "",
    sector: null,
    employeeCount: null,
    usesAITools: null,
    requiresEfactura: null,
  })
  const [intakeAnswers, setIntakeAnswers] = useState<FullIntakeAnswers>({
    usesAITools: "unknown",
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prefillError, setPrefillError] = useState<string | null>(null)
  const [prefillLoading, setPrefillLoading] = useState(false)
  const [orgPrefill, setOrgPrefill] = useState<OrgProfilePrefill | null>(null)
  const [result, setResult] = useState<ApplicabilityResult | null>(null)
  const [initialFindings, setInitialFindings] = useState<ScanFinding[]>([])
  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([])
  const [nextBestAction, setNextBestAction] = useState<NextBestAction | null>(null)
  const [prefillInvoiceStatus, setPrefillInvoiceStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const [checkingMessageIndex, setCheckingMessageIndex] = useState(0)
  const checkingPrefillDone = useRef(false)

  useEffect(() => {
    onStepChange?.(step)
  }, [onStepChange, step])

  // "Compli verifică" step: animate messages + run prefill in parallel
  useEffect(() => {
    if (step !== "checking") return
    setCheckingMessageIndex(0)
    checkingPrefillDone.current = false

    // Start prefill API call
    void runPrefillCheck().then(() => {
      checkingPrefillDone.current = true
    })

    // Animate through messages (800ms each, last one waits for API)
    let idx = 0
    const interval = setInterval(() => {
      idx++
      if (idx >= CHECKING_MESSAGES.length - 1) {
        // On last message, wait for prefill to complete
        setCheckingMessageIndex(idx)
        clearInterval(interval)
        const waitForPrefill = setInterval(() => {
          if (checkingPrefillDone.current) {
            clearInterval(waitForPrefill)
            // Short pause on last message, then advance
            setTimeout(() => setStep("sector"), 600)
          }
        }, 100)
        return
      }
      setCheckingMessageIndex(idx)
    }, 800)

    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const profileSnapshot = buildProfileSnapshot(values)
  const suggestedAnswers = profileSnapshot ? deriveSuggestedAnswers(profileSnapshot, orgPrefill) : []
  const visibleConditionalQuestions = getVisibleConditionalQuestions(intakeAnswers)
  const visibleQuestionIds = new Set<string>([
    ...INTAKE_QUESTIONS.map((question) => question.id),
    ...visibleConditionalQuestions.map((question) => question.id),
  ])
  const visibleSuggestedAnswers = suggestedAnswers.filter((suggestion) =>
    visibleQuestionIds.has(suggestion.questionId)
  )
  const unansweredQuestions = getUnansweredQuestions(intakeAnswers, visibleConditionalQuestions)
  const visibleQuestionCount = INTAKE_QUESTIONS.length + visibleConditionalQuestions.length
  const answeredQuestionCount = Math.max(0, visibleQuestionCount - unansweredQuestions.length)
  const currentStepIndex = WIZARD_SEQUENCE.indexOf(step)
  // "checking" is a visual transition, not a real step — use CUI index for progress
  const effectiveStepIndex = step === "checking" ? WIZARD_SEQUENCE.indexOf("cui") : currentStepIndex
  const progressSteps = WIZARD_SEQUENCE.length - 2 // exclude "checking" from count
  const progressPercent = step === "done" ? 100 : ((effectiveStepIndex + 1) / progressSteps) * 100

  function goBack() {
    setError(null)

    if (step === "done") {
      setStep("intake")
      return
    }

    if (step === "cui" || step === "checking") {
      if (step === "checking") {
        setStep("cui")
        return
      }
      onBackToModeSelection?.()
      return
    }

    // Skip "checking" when going back from "sector"
    if (step === "sector") {
      setStep("cui")
      return
    }

    const previousStep = WIZARD_SEQUENCE[Math.max(0, currentStepIndex - 1)]
    if (previousStep) {
      setStep(previousStep)
    }
  }

  function hydrateIntakeStep(nextRequiresEfactura: boolean) {
    if (!values.sector || !values.employeeCount || values.usesAITools === null) return

    const snapshot = buildProfileSnapshot({ ...values, requiresEfactura: nextRequiresEfactura })
    if (!snapshot) return
    const nextAnswers = buildInitialIntakeAnswers(snapshot, orgPrefill)
    setIntakeAnswers(nextAnswers)
    setError(null)
    setStep("intake")
  }

  async function runPrefillCheck() {
    const trimmedCui = values.cui.trim()
    const trimmedWebsite = values.website.trim()
    const validCui = trimmedCui ? isValidCui(trimmedCui) : false
    const validWebsite = trimmedWebsite ? isValidWebsiteInput(trimmedWebsite) : false

    setPrefillLoading(true)
    setPrefillError(null)
    try {
      const res = await fetch("/api/org/profile/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cui: validCui ? trimmedCui : undefined,
          website: validWebsite ? trimmedWebsite : undefined,
        }),
      })

      if (!res.ok) {
        setOrgPrefill(null)
        setPrefillError("Nu am putut pregăti prefill-ul automat acum. Continuăm fără el.")
        return
      }

      const data = (await res.json()) as ProfilePrefillResponse
      setOrgPrefill(data.prefill)
      if (!data.prefill && (trimmedCui || trimmedWebsite)) {
        setPrefillError("Nu am găsit suficiente semnale utile din CUI, website sau datele deja existente. Continuăm manual.")
      } else {
        setPrefillError(null)
      }
    } catch {
      setOrgPrefill(null)
      setPrefillError("Nu am putut pregăti prefill-ul automat acum. Continuăm fără el.")
    } finally {
      setPrefillLoading(false)
    }
  }

  async function handleCuiContinue() {
    if (orgPrefill) {
      setStep("sector")
      return
    }
    const trimmedCui = values.cui.trim()
    const trimmedWebsite = values.website.trim()
    const validCui = trimmedCui ? isValidCui(trimmedCui) : false
    const validWebsite = trimmedWebsite ? isValidWebsiteInput(trimmedWebsite) : false

    if (trimmedCui && !validCui && !validWebsite) {
      setOrgPrefill(null)
      setPrefillError("CUI-ul sau website-ul par invalide. Corectează unul dintre ele sau continuă fără prefill.")
      return
    }

    if (trimmedWebsite && !validWebsite && !validCui) {
      setOrgPrefill(null)
      setPrefillError("Website-ul pare invalid. Adaugă domeniul public al firmei sau continuă fără prefill.")
      return
    }

    // Go to visual "Compli verifică" sequence
    setStep("checking")
  }

  async function handleCuiBlur() {
    const trimmedCui = values.cui.trim()
    if (!trimmedCui || !isValidCui(trimmedCui)) return
    if (orgPrefill || prefillLoading) return

    setPrefillLoading(true)
    setPrefillError(null)
    try {
      const trimmedWebsite = values.website.trim()
      const validWebsite = trimmedWebsite ? isValidWebsiteInput(trimmedWebsite) : false
      const res = await fetch("/api/org/profile/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cui: trimmedCui,
          website: validWebsite ? trimmedWebsite : undefined,
        }),
      })
      if (!res.ok) return
      const data = (await res.json()) as ProfilePrefillResponse
      setOrgPrefill(data.prefill)
    } catch {
      // Silent failure on blur — don't block flow
    } finally {
      setPrefillLoading(false)
    }
  }

  async function handleSubmit() {
    if (!profileSnapshot) return
    if (unansweredQuestions.length > 0) {
      setError("Mai confirmă răspunsurile care schimbă findings sau documentele recomandate.")
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/org/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...profileSnapshot,
          intakeAnswers,
        }),
      })
      if (!res.ok) throw new Error("save failed")
      const data = (await res.json()) as ProfileSaveResponse
      setResult(data.applicability)
      setInitialFindings(data.initialFindings ?? [])
      setDocumentRequests(data.documentRequests ?? [])
      setNextBestAction(data.nextBestAction ?? null)
      completedRef.current = true
      setStep("done")
    } catch {
      setError("Nu am putut salva onboarding-ul asistat. Mai încearcă o dată.")
    } finally {
      setSaving(false)
    }
  }

  function handleDone() {
    if (result) onComplete(result)
  }

  return (
    <Card className="border-eos-border bg-eos-surface shadow-sm">
      <CardContent className="border-l-4 border-l-eos-primary px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 shrink-0 text-eos-primary" />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Îți pregătim primul snapshot de conformitate
              </p>
              <p className="text-xs text-eos-text-muted">
                Prefill + confirmare asistată · vezi ce se aplică, ce am găsit și ce faci acum
              </p>
            </div>
          </div>
          {(step !== "cui" || onBackToModeSelection) && step !== "done" && step !== "checking" ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0 gap-2"
              onClick={goBack}
            >
              <ArrowLeft className="size-3.5" />
              Înapoi
            </Button>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between gap-3 text-xs text-eos-text-muted">
            <span>{WIZARD_PROGRESS_LABELS[step]}</span>
            <span>{step === "done" ? "gata" : "flow ghidat"}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
            <div
              className="h-full bg-eos-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-5">
          {step === "cui" && (
            <div className="space-y-3">
              <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/10 px-4 py-3">
                <p className="text-sm font-medium text-eos-text">
                  Dacă adaugi CUI-ul sau website-ul, pregătim automat profilul firmei și reducem întrebările manuale.
                </p>
                <p className="mt-1 text-xs text-eos-text-muted">
                  Nu sunt obligatorii, dar scurtează flow-ul și cresc precizia primelor findings.
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-eos-text">
                  CUI-ul organizației tale <span className="font-normal text-eos-text-muted">(opțional, recomandat)</span>
                </p>
                <p className="mt-0.5 text-xs text-eos-text-muted">
                  Codul de identificare fiscală (8–10 cifre, ex: RO12345678).{" "}
                  <span className="text-eos-text-muted">Îl găsești pe orice factură emisă de firmă sau pe{" "}
                    <a
                      href="https://www.anaf.ro/anaf/internet/RO/cautare-persoane-juridice"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2 hover:text-eos-text"
                    >
                      anaf.ro
                    </a>.
                  </span>
                </p>
              </div>
              <input
                type="text"
                value={values.cui}
                onChange={(e) => {
                  const nextValue = e.target.value
                  setValues((current) => ({ ...current, cui: nextValue }))
                  setOrgPrefill(null)
                  setPrefillError(null)
                }}
                placeholder="Ex: RO12345678 sau 12345678"
                className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted focus:border-eos-primary"
                onBlur={() => void handleCuiBlur()}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCuiContinue()
                }}
              />
              <div className="space-y-1">
                <p className="text-sm font-medium text-eos-text">
                  Website-ul public <span className="font-normal text-eos-text-muted">(opțional)</span>
                </p>
                <input
                  type="url"
                  value={values.website}
                  onChange={(e) => {
                    const nextValue = e.target.value
                    setValues((current) => ({ ...current, website: nextValue }))
                    setOrgPrefill(null)
                    setPrefillError(null)
                  }}
                  placeholder="Ex: https://firmatamea.ro"
                  className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted focus:border-eos-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCuiContinue()
                  }}
                />
                <p className="text-xs text-eos-text-muted">
                  Analizăm semnalele publice: formulare de contact, cookie banner, newsletter, politica de confidențialitate.
                </p>
              </div>
              {prefillError ? (
                <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-3 py-2 text-sm text-eos-warning">
                  {prefillError}
                </div>
              ) : null}
              {orgPrefill ? (
                <div className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-eos-text">
                        {orgPrefill.companyName}
                      </p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {[
                          orgPrefill.normalizedCui,
                          orgPrefill.mainCaen ? `CAEN ${orgPrefill.mainCaen}` : null,
                          orgPrefill.address,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Badge className="shrink-0 border-eos-border bg-eos-success-soft text-eos-success">
                      ✓ Sugerat din ANAF
                    </Badge>
                  </div>
                  {(() => {
                    const nis2 = classifyNis2FromSector(orgPrefill.suggestions.sector?.value)
                    return nis2 ? (
                      <div className="mt-2">
                        <Badge className={nis2.badge}>{nis2.label}</Badge>
                      </div>
                    ) : null
                  })()}
                </div>
              ) : null}
              <Button onClick={() => void handleCuiContinue()} className="w-full" disabled={prefillLoading}>
                {prefillLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Continuă
              </Button>
            </div>
          )}

          {step === "checking" && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative mb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-eos-primary/20 bg-eos-primary/[0.06]">
                  <Loader2 className="size-7 animate-spin text-eos-primary" strokeWidth={1.5} />
                </div>
                <Sparkles className="absolute -right-1 -top-1 size-5 text-eos-primary animate-pulse" strokeWidth={2} />
              </div>
              <p className="mb-2 text-lg font-semibold text-eos-text">Compli verifică</p>
              <p className="mb-8 text-sm text-eos-text-muted">
                Pornim din CUI, website și semnalele deja găsite. Îți pregătim primul snapshot.
              </p>
              <div className="w-full max-w-xs space-y-3">
                {CHECKING_MESSAGES.map((msg, i) => (
                  <div
                    key={msg}
                    className={[
                      "flex items-center gap-3 rounded-eos-md px-4 py-2.5 text-sm transition-all duration-500",
                      i < checkingMessageIndex
                        ? "text-eos-success"
                        : i === checkingMessageIndex
                          ? "text-eos-primary font-medium"
                          : "text-eos-text-muted/40",
                    ].join(" ")}
                  >
                    {i < checkingMessageIndex ? (
                      <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
                    ) : i === checkingMessageIndex ? (
                      <Loader2 className="size-4 shrink-0 animate-spin" strokeWidth={2} />
                    ) : (
                      <div className="size-4 shrink-0 rounded-full border border-current opacity-30" />
                    )}
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "sector" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Care este sectorul principal de activitate?
              </p>
              {prefillError ? (
                <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-3 py-2 text-sm text-eos-warning">
                  {prefillError}
                </div>
              ) : null}
              {orgPrefill ? (
                <PrefillContextCard
                  prefill={orgPrefill}
                  selectedSector={values.sector}
                  onApplySector={(sector) => {
                    setValues((current) => ({ ...current, sector }))
                    setStep("size")
                  }}
                />
              ) : null}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SECTORS.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setValues((current) => ({ ...current, sector: value }))
                      setStep("size")
                    }}
                    className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5 text-left text-sm text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "size" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                Câți oameni sunt în firmă acum?
              </p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {SIZES.map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => {
                      setValues((current) => ({ ...current, employeeCount: value }))
                      setStep("ai")
                    }}
                    className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5 text-left text-sm text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "ai" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-eos-text">
                  Folosiți unelte AI în activitatea firmei?
                </p>
                <p className="mt-0.5 text-xs text-eos-text-muted">
                  Exemple: ChatGPT, Copilot, Gemini, Google Translate, un chatbot pe site, un tool de recrutare automatizat sau orice alt asistent automat. Dacă nu ești sigur, alege <strong className="font-medium">Da</strong> — poți corecta mai târziu.
                </p>
              </div>
              {orgPrefill?.aiSignals ? (
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-eos-text">Semnal AI din inventarul existent</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {orgPrefill.aiSignals.confirmedSystems > 0
                          ? `${orgPrefill.aiSignals.confirmedSystems} sisteme AI confirmate`
                          : "Niciun sistem confirmat încă"}
                        {orgPrefill.aiSignals.detectedSystems > 0
                          ? ` · ${orgPrefill.aiSignals.detectedSystems} detectate automat`
                          : ""}
                        {orgPrefill.aiSignals.personalDataSystems > 0
                          ? ` · ${orgPrefill.aiSignals.personalDataSystems} cu semnal de date personale`
                          : ""}
                        {orgPrefill.aiSignals.topSystems.length > 0
                          ? `. Exemple: ${orgPrefill.aiSignals.topSystems.join(", ")}.`
                          : "."}
                      </p>
                    </div>
                    <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
                      Din inventarul AI
                    </Badge>
                  </div>
                </div>
              ) : null}
              {orgPrefill?.suggestions.usesAITools ? (
                <PrefillSuggestionCard
                  label="Sugestie din inventarul AI"
                  valueLabel={orgPrefill.suggestions.usesAITools.value ? "Da" : "Nu"}
                  suggestion={orgPrefill.suggestions.usesAITools}
                />
              ) : null}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, usesAITools: true }))
                    setStep("efactura")
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, usesAITools: false }))
                    setStep("efactura")
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Nu
                </button>
              </div>
            </div>
          )}

          {step === "efactura" && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-eos-text">
                  Trimiți facturi electronice prin SPV ANAF (e-Factura)?
                </p>
                <p className="mt-0.5 text-xs text-eos-text-muted">
                  E-Factura este obligatorie pentru firmele care emit facturi B2B în România. Dacă facturezi alte companii (nu doar persoane fizice), probabil da. Dacă nu ești sigur, alege <strong className="font-medium">Da</strong>.
                </p>
              </div>
              {orgPrefill?.suggestions.requiresEfactura ? (
                <PrefillSuggestionCard
                  label="Sugestie ANAF"
                  valueLabel={orgPrefill.suggestions.requiresEfactura.value ? "Da" : "Nu"}
                  suggestion={orgPrefill.suggestions.requiresEfactura}
                />
              ) : null}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, requiresEfactura: true }))
                    hydrateIntakeStep(true)
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, requiresEfactura: false }))
                    hydrateIntakeStep(false)
                  }}
                  className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-variant"
                >
                  Nu / Nu știu
                </button>
              </div>
            </div>
          )}

          {step === "intake" && (
            <div className="space-y-5">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-eos-text">
                      Confirmările finale sunt toate pe aceeași pagină
                    </p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      Ai răspuns la {answeredQuestionCount} din {visibleQuestionCount} întrebări relevante.
                      {unansweredQuestions.length === 0
                        ? " Poți genera primul plan."
                        : ` Mai sunt ${unansweredQuestions.length} pentru precizie maximă.`}
                    </p>
                  </div>
                  <Badge className="border-eos-border bg-eos-surface text-eos-text-muted">
                    {answeredQuestionCount}/{visibleQuestionCount}
                  </Badge>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
                  <div
                    className="h-full bg-eos-primary transition-all duration-300"
                    style={{
                      width: `${visibleQuestionCount === 0 ? 100 : (answeredQuestionCount / visibleQuestionCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-eos-primary" />
                  <div>
                    <p className="text-sm font-medium text-eos-text">
                      Ce am înțeles deja despre firmă
                    </p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      Semnalele cu încredere mare sunt precompletate. Restul rămân de confirmat doar unde schimbă findings, documentele recomandate sau următorul pas.
                    </p>
                  </div>
                </div>
                {visibleSuggestedAnswers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {visibleSuggestedAnswers.map((suggestion) => (
                      <Badge
                        key={suggestion.questionId}
                        className={`normal-case tracking-normal ${CONFIDENCE_BADGE[suggestion.confidence]}`}
                      >
                        {questionLabelForSuggestion(suggestion.questionId)} · {answerLabel(suggestion.value)}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {INTAKE_QUESTIONS.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={intakeAnswers[question.id as keyof FullIntakeAnswers]}
                    suggestion={visibleSuggestedAnswers.find((item) => item.questionId === question.id)}
                    onChange={(value) =>
                      setIntakeAnswers((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }
                  />
                ))}
              </div>

              {visibleConditionalQuestions.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
                    Confirmări suplimentare doar unde se schimbă obligațiile
                  </p>
                  {visibleConditionalQuestions.map((question) => (
                    <QuestionCard
                      key={question.id}
                      question={question}
                      value={intakeAnswers[question.id as keyof FullIntakeAnswers]}
                      suggestion={visibleSuggestedAnswers.find((item) => item.questionId === question.id)}
                      onChange={(value) =>
                        setIntakeAnswers((current) => ({
                          ...current,
                          [question.id]: value,
                        }))
                      }
                    />
                  ))}
                </div>
              )}

              {error && (
                <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-3 py-2 text-sm text-eos-warning">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
                <div className="text-xs text-eos-text-muted">
                  {unansweredQuestions.length === 0
                    ? "Toate răspunsurile care contează pentru prima rundă de findings sunt confirmate."
                    : `Mai sunt ${unansweredQuestions.length} răspunsuri care schimbă findings sau documentele recomandate.`}
                </div>
                <Button onClick={() => void handleSubmit()} disabled={saving || unansweredQuestions.length > 0}>
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                  Generează primul plan
                </Button>
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-eos-success" />
                <p className="text-sm font-medium text-eos-text">
                  Ai primul snapshot. Nu mai pornești de la zero.
                </p>
              </div>

              <div className="space-y-2">
                {result.entries.map((entry) => (
                  <div
                    key={entry.tag}
                    className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2.5"
                  >
                    <Badge className={`mt-0.5 shrink-0 ${CERTAINTY_BADGE[entry.certainty]}`}>
                      {entry.certainty === "certain"
                        ? "Se aplică"
                        : entry.certainty === "probable"
                          ? "Probabil"
                          : "Neaplicabil"}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-eos-text">
                        {APPLICABILITY_TAG_LABELS[entry.tag]}
                      </p>
                      <p className="mt-0.5 text-xs text-eos-text-muted">{entry.reason}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-3 lg:grid-cols-3">
                <SummaryCard
                  icon={<TriangleAlert className="h-4 w-4 text-eos-warning" />}
                  title="Ce am găsit deja"
                  subtitle="Primele constatări generate automat"
                  items={initialFindings.slice(0, 4).map((finding) => finding.title)}
                  emptyLabel="Nu au apărut findings inițiale."
                />
                <SummaryCard
                  icon={<FileText className="h-4 w-4 text-eos-primary" />}
                  title="Ce merită pregătit"
                  subtitle="Documente și artefacte recomandate acum"
                  items={documentRequests.slice(0, 4).map((document) => document.label)}
                  emptyLabel="Nu există documente noi recomandate."
                />
                <SummaryCard
                  icon={<ListChecks className="h-4 w-4 text-eos-success" />}
                  title="Ce faci acum"
                  subtitle={
                    nextBestAction
                      ? `${nextBestAction.estimatedMinutes} min până la prima acțiune`
                      : "Poți intra direct în dashboard"
                  }
                  items={nextBestAction ? [nextBestAction.label] : []}
                  emptyLabel="Continuă în dashboard."
                />
              </div>

              {/* ── Addon 3: Invoice Smart Prefill trigger ─────────────────── */}
              {values.requiresEfactura && prefillInvoiceStatus === "idle" && (
                <div className="flex items-start gap-3 rounded-eos-md border border-dashed border-eos-primary/30 bg-eos-primary/5 px-4 py-3">
                  <Sparkles className="mt-0.5 size-4 shrink-0 text-eos-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-eos-text">
                      Smart Prefill din facturi
                    </p>
                    <p className="mt-0.5 text-xs text-eos-text-muted">
                      Dacă ai facturile e-Factura conectate, putem deduce automat ce tool-uri și servicii cloud folosești. Toate valorile rămân sugestii — tu confirmi.
                    </p>
                    <Button
                      variant="outline"
                      size="default"
                      className="mt-3 gap-2"
                      onClick={async () => {
                        setPrefillInvoiceStatus("loading")
                        try {
                          const res = await fetch("/api/prefill/invoice", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ invoiceItems: [] }),
                          })
                          if (res.ok) {
                            setPrefillInvoiceStatus("done")
                          } else {
                            setPrefillInvoiceStatus("error")
                          }
                        } catch {
                          setPrefillInvoiceStatus("error")
                        }
                      }}
                    >
                      <Sparkles className="size-4" />
                      Analizează facturile
                    </Button>
                  </div>
                </div>
              )}
              {prefillInvoiceStatus === "loading" && (
                <div className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface px-4 py-3 text-sm text-eos-text-muted">
                  <Loader2 className="size-4 animate-spin" />
                  Se analizează facturile cu AI...
                </div>
              )}
              {prefillInvoiceStatus === "done" && (
                <div className="flex items-center gap-2 rounded-eos-md border border-eos-success-border bg-eos-success-soft px-4 py-3 text-sm text-eos-success">
                  <CheckCircle2 className="size-4" />
                  Prefill salvat — vei vedea sugestiile în dashboard.
                </div>
              )}
              {prefillInvoiceStatus === "error" && (
                <div className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface px-4 py-3 text-sm text-eos-text-muted">
                  <TriangleAlert className="size-4" />
                  Nu am putut analiza facturile. Poți încerca mai târziu din setări.
                </div>
              )}

              <Button onClick={handleDone} className="w-full">
                Continuă spre ecranul de start
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function PrefillContextCard({
  prefill,
  selectedSector,
  onApplySector,
}: {
  prefill: OrgProfilePrefill
  selectedSector: OrgSector | null
  onApplySector: (sector: OrgSector) => void
}) {
  const sectorSuggestion = prefill.suggestions.sector
  const subtitleParts = [prefill.companyName]
  if (prefill.normalizedCui) subtitleParts.push(prefill.normalizedCui)
  if (prefill.normalizedWebsite) subtitleParts.push(formatWebsiteLabel(prefill.normalizedWebsite))
  const sourceLabel = humanizePrefillSource(prefill.source)
  const title =
    prefill.source === "anaf_vat_registry"
      ? "Am găsit firma în ANAF"
      : prefill.source === "website_signals"
        ? "Am găsit semnale din site-ul public"
        : "Am găsit semnale în AI Compliance Pack"

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-eos-text">{title}</p>
          <p className="mt-1 text-xs text-eos-text-muted">
            {subtitleParts.join(" · ")}
          </p>
        </div>
        <Badge className="shrink-0 border-eos-border bg-eos-success-soft text-eos-success">
          ✓ Detectat din {sourceLabel}
        </Badge>
      </div>

      {prefill.address ? (
        <p className="mt-2 text-xs text-eos-text-muted">{prefill.address}</p>
      ) : null}

      {prefill.source === "anaf_vat_registry" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {prefill.mainCaen ? (
            <Badge className="border-eos-border bg-eos-surface text-eos-text">CAEN {prefill.mainCaen}</Badge>
          ) : null}
          <Badge className="border-eos-border bg-eos-surface text-eos-text">
            TVA {prefill.vatRegistered ? "activ" : "inactiv"}
          </Badge>
          <Badge className="border-eos-border bg-eos-surface text-eos-text">
            RO e-Factura {prefill.efacturaRegistered ? "activ" : "neconfirmat"}
          </Badge>
          {(() => {
            const nis2 = classifyNis2FromSector(prefill.suggestions.sector?.value)
            return nis2 ? <Badge className={nis2.badge}>{nis2.label}</Badge> : null
          })()}
        </div>
      ) : null}

      {prefill.source === "anaf_vat_registry" && prefill.fiscalStatus ? (
        <p className="mt-3 text-xs text-eos-text-muted">{prefill.fiscalStatus}</p>
      ) : null}

      {prefill.vendorSignals ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Semnal vendor din e-Factura
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {prefill.vendorSignals.vendorCount} furnizori detectați în {prefill.vendorSignals.invoiceCount} validări e-Factura.
                {prefill.vendorSignals.topVendors.length > 0
                  ? ` Exemple: ${prefill.vendorSignals.topVendors.join(", ")}.`
                  : ""}
              </p>
            </div>
            <Badge className={`normal-case tracking-normal ${CONFIDENCE_BADGE.high}`}>
              Semnal solid
            </Badge>
          </div>
        </div>
      ) : null}

      {prefill.aiSignals ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Semnal AI din inventarul intern
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {prefill.aiSignals.confirmedSystems > 0
                  ? `${prefill.aiSignals.confirmedSystems} sisteme AI confirmate`
                  : "Niciun sistem confirmat încă"}
                {prefill.aiSignals.detectedSystems > 0
                  ? ` · ${prefill.aiSignals.detectedSystems} detectate automat`
                  : ""}
                {prefill.aiSignals.topSystems.length > 0
                  ? `. Exemple: ${prefill.aiSignals.topSystems.join(", ")}.`
                  : "."}
              </p>
            </div>
            <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
              Din inventarul AI
            </Badge>
          </div>
        </div>
      ) : null}

      {prefill.aiCompliancePackSignals ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Semnale din AI Compliance Pack
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {prefill.aiCompliancePackSignals.totalEntries} sisteme în pack
                {prefill.aiCompliancePackSignals.auditReadyEntries > 0
                  ? ` · ${prefill.aiCompliancePackSignals.auditReadyEntries} audit-ready`
                  : ""}
                {prefill.aiCompliancePackSignals.confirmedEntries > 0
                  ? ` · ${prefill.aiCompliancePackSignals.confirmedEntries} confirmate`
                  : ""}
                {prefill.aiCompliancePackSignals.personalDataEntries > 0
                  ? ` · ${prefill.aiCompliancePackSignals.personalDataEntries} cu semnal de date personale`
                  : ""}
                {prefill.aiCompliancePackSignals.topSystems.length > 0
                  ? `. Exemple: ${prefill.aiCompliancePackSignals.topSystems.join(", ")}.`
                  : "."}
              </p>
            </div>
            <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
              Din AI Compliance Pack
            </Badge>
          </div>
        </div>
      ) : null}

      {prefill.documentSignals ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Semnale din documentele existente
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {prefill.documentSignals.generatedCount > 0
                  ? `${prefill.documentSignals.generatedCount} documente generate`
                  : "Fără documente generate încă"}
                {prefill.documentSignals.uploadedCount > 0
                  ? ` · ${prefill.documentSignals.uploadedCount} documente încărcate`
                  : ""}
                {prefill.documentSignals.matchedSignals.length > 0
                  ? `. Semnale: ${prefill.documentSignals.matchedSignals.join(", ")}.`
                  : "."}
                {prefill.documentSignals.topDocuments.length > 0
                  ? ` Exemple: ${prefill.documentSignals.topDocuments.join(", ")}.`
                  : ""}
              </p>
            </div>
            <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
              Din documentele existente
            </Badge>
          </div>
        </div>
      ) : null}

      {prefill.websiteSignals ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Semnale din website-ul public
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">
                {prefill.websiteSignals.pagesChecked} pagini verificate
                {prefill.websiteSignals.matchedSignals.length > 0
                  ? ` · Semnale: ${prefill.websiteSignals.matchedSignals.join(", ")}.`
                  : "."}
                {prefill.websiteSignals.topPages.length > 0
                  ? ` Pagini: ${prefill.websiteSignals.topPages.join(", ")}.`
                  : ""}
              </p>
            </div>
            <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
              Din site-ul public
            </Badge>
          </div>
        </div>
      ) : null}

      {sectorSuggestion ? (
        <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-eos-text">
                Sector sugerat: {ORG_SECTOR_LABELS[sectorSuggestion.value]}
              </p>
              <p className="mt-1 text-xs text-eos-text-muted">{sectorSuggestion.reason}</p>
            </div>
        <Badge className={`normal-case tracking-normal ${CONFIDENCE_BADGE[sectorSuggestion.confidence]}`}>
          {confidenceLabel(sectorSuggestion.confidence)}
        </Badge>
          </div>
          {selectedSector !== sectorSuggestion.value ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => onApplySector(sectorSuggestion.value)}
            >
              Folosește sugestia
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function PrefillSuggestionCard({
  label,
  valueLabel,
  suggestion,
}: {
  label: string
  valueLabel: string
  suggestion: PrefillSuggestion<boolean>
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-eos-text">
            {label}: <span className="text-eos-primary">{valueLabel}</span>
          </p>
          <p className="mt-1 text-xs text-eos-text-muted">{suggestion.reason}</p>
        </div>
        <Badge className={`normal-case tracking-normal ${CONFIDENCE_BADGE[suggestion.confidence]}`}>
          Sugestie automată
        </Badge>
      </div>
    </div>
  )
}

function QuestionCard({
  question,
  value,
  suggestion,
  onChange,
}: {
  question: IntakeQuestion
  value: FullIntakeAnswers[keyof FullIntakeAnswers] | undefined
  suggestion?: SuggestedAnswer
  onChange: (value: string) => void
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
      <div className="space-y-2">
        <div>
          <p className="text-sm font-medium text-eos-text">{question.text}</p>
          {suggestion ? (
            <div className="mt-1 space-y-2">
              <div className="flex flex-wrap gap-2">
                <Badge className={`normal-case tracking-normal ${CONFIDENCE_BADGE[suggestion.confidence]}`}>
                  Sugestie automată
                </Badge>
              </div>
              <p className="text-xs text-eos-text-muted">
                Sugestie: <span className="text-eos-text">{answerLabel(suggestion.value)}</span> · {suggestion.reason}
              </p>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {question.options.map((option) => {
            const active = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onChange(option.value)}
                className={`rounded-eos-md border px-3 py-2 text-sm transition ${
                  active
                    ? "border-eos-primary bg-eos-primary/10 text-eos-primary"
                    : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  title,
  subtitle,
  items,
  emptyLabel,
}: {
  icon: ReactNode
  title: string
  subtitle: string
  items: string[]
  emptyLabel: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-sm font-medium text-eos-text">{title}</p>
      </div>
      <p className="mt-1 text-xs text-eos-text-muted">{subtitle}</p>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-eos-text">
          {items.map((item) => (
            <li key={item} className="rounded-eos-sm border border-eos-border-subtle bg-eos-surface px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-eos-text-muted">{emptyLabel}</p>
      )}
    </div>
  )
}

function buildProfileSnapshot(values: WizardState): OrgProfile | null {
  if (!values.sector || !values.employeeCount || values.usesAITools === null || values.requiresEfactura === null) {
    return null
  }

  const cui = values.cui.trim()
  const website = values.website.trim()
  return {
    sector: values.sector,
    employeeCount: values.employeeCount,
    usesAITools: values.usesAITools,
    requiresEfactura: values.requiresEfactura,
    ...(cui ? { cui } : {}),
    ...(website ? { website } : {}),
    completedAtISO: new Date().toISOString(),
  }
}

function getUnansweredQuestions(answers: FullIntakeAnswers, conditionalQuestions: IntakeQuestion[]) {
  const visibleQuestions = [...INTAKE_QUESTIONS, ...conditionalQuestions]
  return visibleQuestions.filter((question) => !answers[question.id as keyof FullIntakeAnswers])
}

function answerLabel(value: string) {
  switch (value) {
    case "yes":
      return "Da"
    case "no":
      return "Nu"
    case "probably":
      return "Probabil"
    case "unknown":
      return "Nu știu"
    case "partial":
      return "Parțial"
    case "collaborators":
      return "Doar colaboratori"
    case "mixed":
      return "Mixt"
    default:
      return value
  }
}

function confidenceLabel(value: SuggestedAnswer["confidence"]) {
  switch (value) {
    case "high":
      return "Detectat sigur"
    case "medium":
      return "Necesită confirmare"
    default:
      return "Semnal orientativ"
  }
}

function humanizePrefillSource(source: OrgProfilePrefill["source"]) {
  switch (source) {
    case "anaf_vat_registry":
      return "datele fiscale"
    case "website_signals":
      return "site-ul public"
    case "ai_compliance_pack":
      return "AI Compliance Pack"
    default:
      return "semnalele detectate"
  }
}

function isValidCui(value: string) {
  return /^(RO)?\d{2,10}$/i.test(value.trim())
}

function isValidWebsiteInput(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(trimmed)
}

function questionLabelForSuggestion(questionId: string) {
  const question = [...DECISIVE_QUESTIONS, ...CONDITIONAL_QUESTIONS].find((item) => item.id === questionId)
  return question?.text ?? questionId
}

function classifyNis2FromSector(
  sector: OrgSector | null | undefined
): { label: string; badge: string } | null {
  if (!sector) return null
  const essential: OrgSector[] = [
    "energy",
    "transport",
    "banking",
    "health",
    "digital-infrastructure",
    "public-admin",
  ]
  const important: OrgSector[] = ["finance", "manufacturing"]
  if (essential.includes(sector))
    return {
      label: "Entitate esențială NIS2",
      badge: "border-eos-border bg-eos-warning-soft text-eos-warning",
    }
  if (important.includes(sector))
    return {
      label: "Entitate importantă NIS2",
      badge: "border-eos-border bg-eos-surface-variant text-eos-text-muted",
    }
  return null
}

function formatWebsiteLabel(value: string) {
  return value.replace(/^https?:\/\//i, "")
}
