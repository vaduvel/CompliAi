"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import {
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
  type FullIntakeAnswers,
  type IntakeQuestion,
  type SuggestedAnswer,
} from "@/lib/compliance/intake-engine"
import { useTrackEvent } from "@/lib/client/use-track-event"
import {
  INTAKE_FLOW_STEP_LABELS,
  getQuestionIdsForIntakeFlowStep,
  getVisibleConditionalIntakeSteps,
  type IntakeFlowStep,
} from "@/lib/compliscan/onboarding-steps"

type ProfileWizardStep = "cui" | "checking" | "sector" | "size" | "ai" | "efactura"

export type ApplicabilityWizardStep = ProfileWizardStep | IntakeFlowStep

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
  intakeAnswers?: FullIntakeAnswers | null
}

type ProfilePrefillResponse = {
  prefill: OrgProfilePrefill | null
}

type Props = {
  onComplete: (result: ApplicabilityResult) => void
  onStepChange?: (step: ApplicabilityWizardStep) => void
  onBackToModeSelection?: () => void
  completionLabel?: string
  completionHint?: string
}

const SECTORS = Object.entries(ORG_SECTOR_LABELS) as [OrgSector, string][]
const SIZES = Object.entries(ORG_EMPLOYEE_COUNT_LABELS) as [OrgEmployeeCount, string][]
const INTAKE_QUESTIONS = DECISIVE_QUESTIONS.filter((question) => question.id !== "usesAITools")

const CONFIDENCE_BADGE: Record<SuggestedAnswer["confidence"], string> = {
  high: "border-eos-border bg-eos-success-soft text-eos-success",
  medium: "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
  low: "border-eos-border bg-eos-surface-variant text-eos-text-muted",
}

const PROFILE_WIZARD_SEQUENCE: ProfileWizardStep[] = [
  "cui",
  "checking",
  "sector",
  "size",
  "ai",
  "efactura",
]

const WIZARD_PROGRESS_LABELS: Record<ApplicabilityWizardStep, string> = {
  cui: "Profil firmă",
  checking: "Compli verifică",
  sector: "Sector de activitate",
  size: "Dimensiunea firmei",
  ai: "Utilizare AI",
  efactura: "e-Factura",
  ...INTAKE_FLOW_STEP_LABELS,
}

const INTAKE_FLOW_STEPS = Object.keys(INTAKE_FLOW_STEP_LABELS) as IntakeFlowStep[]
const BASE_INTAKE_FLOW: IntakeFlowStep[] = ["intake-core-data", "intake-core-ops"]

const INTAKE_STEP_COPY: Record<
  IntakeFlowStep,
  {
    title: string
    description: string
  }
> = {
  "intake-core-data": {
    title: "Datele care schimbă findings-urile",
    description:
      "Confirmăm doar prelucrările de bază care schimbă primul set de riscuri și documente recomandate.",
  },
  "intake-core-ops": {
    title: "Site, contracte și furnizori",
    description:
      "Strângem câteva confirmări operaționale scurte, fără să deschidem încă zone laterale.",
  },
  "intake-hr": {
    title: "Confirmări HR",
    description: "Apare doar dacă răspunsurile tale duc spre obligații HR suplimentare.",
  },
  "intake-gdpr": {
    title: "Confirmări GDPR",
    description: "Apare doar unde răspunsurile schimbă obligațiile și documentele GDPR.",
  },
  "intake-ai": {
    title: "Confirmări AI",
    description: "Apare doar dacă folosești AI și schimbă obligațiile AI Act sau documentele cerute.",
  },
  "intake-vendors": {
    title: "Confirmări furnizori",
    description: "Apare doar dacă vendorii externi schimbă următorul pas operațional.",
  },
  "intake-site": {
    title: "Confirmări website",
    description: "Apare doar pentru semnalele din site care schimbă findings-urile publice.",
  },
  review: {
    title: "Revizuire finală",
    description: "Verifici ce am înțeles și intri în runtime doar după ce tot ce contează este confirmat.",
  },
}

const CHECKING_MESSAGES = [
  "Verificăm datele firmei",
  "Analizăm website-ul",
  "Căutăm semnale relevante",
  "Identificăm ce ți se aplică",
  "Pregătim snapshot-ul",
] as const

export function ApplicabilityWizard({
  onComplete,
  onStepChange,
  onBackToModeSelection,
  completionLabel = "Salvează și intră în dashboard",
  completionHint = "La final intri direct în suprafața principală potrivită rolului tău.",
}: Props) {
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
  const visibleConditionalSteps = getVisibleConditionalIntakeSteps(visibleConditionalQuestions)
  const intakeFlowSteps: IntakeFlowStep[] = [...BASE_INTAKE_FLOW, ...visibleConditionalSteps, "review"]
  const wizardSequence: ApplicabilityWizardStep[] = [...PROFILE_WIZARD_SEQUENCE, ...intakeFlowSteps]
  const visibleQuestionIds = new Set<string>([
    ...INTAKE_QUESTIONS.map((question) => question.id),
    ...visibleConditionalQuestions.map((question) => question.id),
  ])
  const visibleQuestionsById = new Map<string, IntakeQuestion>(
    [...INTAKE_QUESTIONS, ...visibleConditionalQuestions].map((question) => [question.id, question])
  )
  const visibleSuggestedAnswers = suggestedAnswers.filter((suggestion) =>
    visibleQuestionIds.has(suggestion.questionId)
  )
  const unansweredQuestions = getUnansweredQuestions(intakeAnswers, visibleConditionalQuestions)
  const visibleQuestionCount = INTAKE_QUESTIONS.length + visibleConditionalQuestions.length
  const answeredQuestionCount = Math.max(0, visibleQuestionCount - unansweredQuestions.length)
  const visibleProgressSteps: ApplicabilityWizardStep[] = [
    "cui",
    "sector",
    "size",
    "ai",
    "efactura",
    ...intakeFlowSteps,
  ]
  const progressStep = step === "checking" ? "cui" : step
  const effectiveStepIndex = Math.max(0, visibleProgressSteps.indexOf(progressStep))
  const progressSteps = visibleProgressSteps.length
  const progressPercent = ((effectiveStepIndex + 1) / progressSteps) * 100
  const currentStepQuestionIds = isIntakeQuestionStep(step)
    ? getQuestionIdsForIntakeFlowStep(step)
    : []
  const currentStepQuestions = currentStepQuestionIds
    .map((questionId) => visibleQuestionsById.get(questionId))
    .filter((question): question is IntakeQuestion => Boolean(question))
  const unansweredCurrentStepQuestions = currentStepQuestions.filter(
    (question) => !intakeAnswers[question.id as keyof FullIntakeAnswers]
  )
  const currentStepSuggestedAnswers = visibleSuggestedAnswers.filter((suggestion) =>
    currentStepQuestionIds.includes(suggestion.questionId)
  )

  function goBack() {
    setError(null)

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

    const currentStepIndex = wizardSequence.indexOf(step)
    const previousStep = wizardSequence[Math.max(0, currentStepIndex - 1)]
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
    setStep("intake-core-data")
  }

  function goToNextIntakeStep() {
    const currentStepIndex = wizardSequence.indexOf(step)
    const nextStep = wizardSequence[currentStepIndex + 1]
    if (nextStep) {
      setError(null)
      setStep(nextStep)
    }
  }

  function handleIntakeStepContinue() {
    if (isIntakeQuestionStep(step)) {
      if (unansweredCurrentStepQuestions.length > 0) {
        setError("Mai confirmă răspunsurile din pasul curent înainte să continui.")
        return
      }
      goToNextIntakeStep()
    }
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
      completedRef.current = true
      onComplete(data.applicability)
    } catch {
      setError("Nu am putut salva onboarding-ul asistat. Mai încearcă o dată.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface-variant">
      <div className="px-5 py-5">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Shield className="h-4 w-4 shrink-0 text-eos-primary" strokeWidth={1.5} />
            <p className="text-sm font-medium text-eos-text-muted">
              {WIZARD_PROGRESS_LABELS[step]}
            </p>
          </div>
          {(step !== "cui" || onBackToModeSelection) && step !== "checking" ? (
            <button
              type="button"
              onClick={goBack}
              className="flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-1.5 text-xs text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Înapoi
            </button>
          ) : null}
        </div>

        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-eos-surface-elevated">
            <div
              className="h-full bg-eos-primary transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-right text-[10px] text-eos-text-tertiary">
            {step === "checking" ? "Compli verifică…" : `${Math.round(progressPercent)}% completat`}
          </p>
        </div>

        <div className="mt-5">
          {step === "cui" && (
            <div className="space-y-4">
              <div className="rounded-eos-lg border border-eos-border bg-eos-primary-soft px-4 py-3">
                <p className="text-sm font-medium text-eos-text">
                  CUI-ul sau website-ul precompletează automat profilul și reduc întrebările manuale.
                </p>
                <p className="mt-1 text-xs text-eos-text-tertiary">
                  Nu sunt obligatorii, dar scurtează flow-ul și cresc precizia primelor findings.
                </p>
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-eos-text">
                  CUI-ul organizației{" "}
                  <span className="font-normal text-eos-text-tertiary">(opțional, recomandat)</span>
                </p>
                <p className="text-xs text-eos-text-tertiary">
                  Codul de identificare fiscală (ex: RO12345678). Îl găsești pe orice factură sau pe{" "}
                  <a
                    href="https://www.anaf.ro/anaf/internet/RO/cautare-persoane-juridice"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-eos-primary/70 underline underline-offset-2 hover:text-eos-primary"
                  >
                    anaf.ro
                  </a>
                  .
                </p>
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
                  className="h-11 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3.5 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-primary/50 focus:bg-eos-surface-active"
                  onBlur={() => void handleCuiBlur()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCuiContinue()
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <p className="text-sm font-medium text-eos-text">
                  Website-ul public{" "}
                  <span className="font-normal text-eos-text-tertiary">(opțional)</span>
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
                  className="h-11 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3.5 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-primary/50 focus:bg-eos-surface-active"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleCuiContinue()
                  }}
                />
                <p className="text-xs text-eos-text-tertiary">
                  Analizăm cookie banner, formulare, newsletter, politica de confidențialitate.
                </p>
              </div>

              {prefillError ? (
                <div className="rounded-eos-lg border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-400/80">
                  {prefillError}
                </div>
              ) : null}

              {orgPrefill ? (
                <div className="rounded-eos-lg border border-eos-success/50/25 bg-eos-success/[0.07] px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">{orgPrefill.companyName}</p>
                      <p className="mt-1 text-xs text-eos-text-tertiary">
                        {[
                          orgPrefill.normalizedCui,
                          orgPrefill.mainCaen ? `CAEN ${orgPrefill.mainCaen}` : null,
                          orgPrefill.address,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-eos-success/20 px-2.5 py-1 text-[10px] font-semibold text-eos-success">
                      ✓ ANAF
                    </span>
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

              <button
                type="button"
                onClick={() => void handleCuiContinue()}
                className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-eos-primary py-3 text-sm font-semibold text-eos-text transition hover:bg-eos-primary disabled:opacity-50"
              >
                {prefillLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Continuă
              </button>
            </div>
          )}

          {step === "checking" && (
            <div className="flex flex-col items-center justify-center py-14">
              <div className="relative mb-8">
                <div className="absolute inset-0 rounded-full bg-eos-primary/20 blur-xl" />
                <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-eos-border bg-eos-primary-soft">
                  <Loader2 className="h-7 w-7 animate-spin text-eos-primary" strokeWidth={1.5} />
                </div>
                <Sparkles
                  className="absolute -right-1 -top-1 h-5 w-5 animate-pulse text-eos-primary"
                  strokeWidth={2}
                />
              </div>
              <p className="mb-2 text-lg font-semibold text-eos-text">Compli verifică</p>
              <p className="mb-8 text-sm text-eos-text-tertiary">
                Pornim din CUI, website și semnalele deja găsite.
              </p>
              <div className="w-full max-w-xs space-y-2">
                {CHECKING_MESSAGES.map((msg, i) => (
                  <div
                    key={msg}
                    className={[
                      "flex items-center gap-3 rounded-eos-lg px-4 py-2.5 text-sm transition-all duration-500",
                      i < checkingMessageIndex
                        ? "text-eos-success"
                        : i === checkingMessageIndex
                          ? "bg-eos-primary-soft font-medium text-eos-primary"
                          : "text-eos-text-tertiary",
                    ].join(" ")}
                  >
                    {i < checkingMessageIndex ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" strokeWidth={2} />
                    ) : i === checkingMessageIndex ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin" strokeWidth={2} />
                    ) : (
                      <div className="h-4 w-4 shrink-0 rounded-full border border-current opacity-30" />
                    )}
                    {msg}
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "sector" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-eos-text">
                Care este sectorul principal de activitate?
              </p>
              {prefillError ? (
                <div className="rounded-eos-lg border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-400/80">
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
                    className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-left text-sm text-eos-text-muted transition hover:border-eos-border-strong hover:bg-eos-surface-active hover:text-eos-text"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "size" && (
            <div className="space-y-4">
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
                    className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-left text-sm text-eos-text-muted transition hover:border-eos-border-strong hover:bg-eos-surface-active hover:text-eos-text"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === "ai" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-eos-text">
                  Folosiți unelte AI în activitatea firmei?
                </p>
                <p className="mt-1 text-xs text-eos-text-tertiary">
                  Exemple: ChatGPT, Copilot, Gemini, Google Translate, chatbot pe site, tool de recrutare automatizat. Dacă nu ești sigur, alege{" "}
                  <strong className="font-medium text-eos-text-muted">Da</strong> — poți corecta mai târziu.
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, usesAITools: true }))
                    setStep("efactura")
                  }}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface-variant py-3 text-sm font-medium text-eos-text-muted transition hover:border-eos-border hover:bg-eos-primary-soft hover:text-eos-text"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, usesAITools: false }))
                    setStep("efactura")
                  }}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface-variant py-3 text-sm font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:bg-eos-surface-active hover:text-eos-text"
                >
                  Nu
                </button>
              </div>
            </div>
          )}

          {step === "efactura" && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-eos-text">
                  Trimiți facturi electronice prin SPV ANAF (e-Factura)?
                </p>
                <p className="mt-1 text-xs text-eos-text-tertiary">
                  Obligatorie pentru firmele care emit facturi B2B în România. Dacă facturezi alte companii (nu doar persoane fizice), probabil da. Dacă nu ești sigur, alege{" "}
                  <strong className="font-medium text-eos-text-muted">Da</strong>.
                </p>
              </div>
              {orgPrefill?.suggestions.requiresEfactura ? (
                <PrefillSuggestionCard
                  label="Sugestie ANAF"
                  valueLabel={orgPrefill.suggestions.requiresEfactura.value ? "Da" : "Nu"}
                  suggestion={orgPrefill.suggestions.requiresEfactura}
                />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, requiresEfactura: true }))
                    hydrateIntakeStep(true)
                  }}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface-variant py-3 text-sm font-medium text-eos-text-muted transition hover:border-eos-border hover:bg-eos-primary-soft hover:text-eos-text"
                >
                  Da
                </button>
                <button
                  onClick={() => {
                    setValues((current) => ({ ...current, requiresEfactura: false }))
                    hydrateIntakeStep(false)
                  }}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface-variant py-3 text-sm font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:bg-eos-surface-active hover:text-eos-text"
                >
                  Nu / Nu știu
                </button>
              </div>
            </div>
          )}

          {isIntakeQuestionStep(step) && (
            <div className="space-y-4">
              <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-eos-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-eos-text">{INTAKE_STEP_COPY[step].title}</p>
                    <p className="mt-1 text-xs text-eos-text-tertiary">{INTAKE_STEP_COPY[step].description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-eos-surface-elevated px-2 py-0.5 text-[10px] text-eos-text-tertiary">
                    {currentStepQuestions.length - unansweredCurrentStepQuestions.length}/{currentStepQuestions.length}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {currentStepQuestions.map((question) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    value={intakeAnswers[question.id as keyof FullIntakeAnswers]}
                    suggestion={currentStepSuggestedAnswers.find((item) => item.questionId === question.id)}
                    onChange={(value) =>
                      setIntakeAnswers((current) => ({
                        ...current,
                        [question.id]: value,
                      }))
                    }
                  />
                ))}
              </div>

              {error && (
                <div className="rounded-eos-lg border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-400/80">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3">
                <p className="text-xs text-eos-text-tertiary">
                  {unansweredCurrentStepQuestions.length === 0
                    ? "Pasul curent este confirmat."
                    : `Mai sunt ${unansweredCurrentStepQuestions.length} răspunsuri.`}
                </p>
                <button
                  type="button"
                  onClick={handleIntakeStepContinue}
                  disabled={unansweredCurrentStepQuestions.length > 0}
                  className="rounded-eos-md bg-eos-primary px-4 py-1.5 text-sm font-medium text-eos-text transition hover:bg-eos-primary disabled:opacity-40"
                >
                  Continuă
                </button>
              </div>
            </div>
          )}

          {step === "review" && (
            <div className="space-y-4">
              <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-eos-primary" />
                  <div>
                    <p className="text-sm font-medium text-eos-text">{INTAKE_STEP_COPY.review.title}</p>
                    <p className="mt-1 text-xs text-eos-text-tertiary">{INTAKE_STEP_COPY.review.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-eos-text-tertiary">
                    {unansweredQuestions.length === 0
                      ? "Tot ce schimbă prima rundă de findings este confirmat."
                      : `Mai sunt ${unansweredQuestions.length} răspunsuri.`}
                  </p>
                  <span className="text-[10px] text-eos-text-tertiary">
                    {answeredQuestionCount}/{visibleQuestionCount}
                  </span>
                </div>
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-eos-surface-elevated">
                  <div
                    className="h-full bg-eos-primary transition-all duration-300"
                    style={{
                      width: `${visibleQuestionCount === 0 ? 100 : (answeredQuestionCount / visibleQuestionCount) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {visibleSuggestedAnswers.length > 0 && (
                <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-eos-primary" />
                    <div>
                      <p className="text-sm font-medium text-eos-text">Ce am înțeles deja</p>
                      <p className="mt-1 text-xs text-eos-text-tertiary">
                        Semnalele cu încredere mare sunt precompletate.
                      </p>
                    </div>
                  </div>
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
                </div>
              )}

              {error && (
                <div className="rounded-eos-lg border border-yellow-500/20 bg-yellow-500/[0.06] px-4 py-3 text-sm text-yellow-400/80">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={saving || unansweredQuestions.length > 0}
                className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-eos-primary py-3.5 text-sm font-semibold text-eos-text shadow-lg shadow-eos-primary/20/20 transition hover:bg-eos-primary disabled:opacity-40"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {completionLabel}
              </button>
            </div>
          )}

        </div>
        </div>
    </div>
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
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-eos-text">{title}</p>
          <p className="mt-1 text-xs text-eos-text-tertiary">
            {subtitleParts.join(" · ")}
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-eos-success/15 px-2.5 py-1 text-[10px] font-semibold text-eos-success">
          ✓ {sourceLabel}
        </span>
      </div>

      {prefill.address ? (
        <p className="mt-2 text-xs text-eos-text-tertiary">{prefill.address}</p>
      ) : null}

      {prefill.source === "anaf_vat_registry" ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prefill.mainCaen ? (
            <span className="rounded-full border border-eos-border bg-eos-surface-elevated px-2.5 py-0.5 text-[11px] text-eos-text-muted">
              CAEN {prefill.mainCaen}
            </span>
          ) : null}
          <span className="rounded-full border border-eos-border bg-eos-surface-elevated px-2.5 py-0.5 text-[11px] text-eos-text-muted">
            TVA {prefill.vatRegistered ? "activ" : "inactiv"}
          </span>
          <span className="rounded-full border border-eos-border bg-eos-surface-elevated px-2.5 py-0.5 text-[11px] text-eos-text-muted">
            e-Factura {prefill.efacturaRegistered ? "activ" : "neconfirmat"}
          </span>
          {(() => {
            const nis2 = classifyNis2FromSector(prefill.suggestions.sector?.value)
            return nis2 ? <Badge className={nis2.badge}>{nis2.label}</Badge> : null
          })()}
        </div>
      ) : null}

      {prefill.source === "anaf_vat_registry" && prefill.fiscalStatus ? (
        <p className="mt-3 text-xs text-eos-text-tertiary">{prefill.fiscalStatus}</p>
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
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-4">
      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-eos-text">{question.text}</p>
          {suggestion ? (
            <p className="mt-1 text-xs text-eos-text-tertiary">
              Sugestie automată:{" "}
              <span className="text-eos-text-muted">{answerLabel(suggestion.value)}</span>
              {" · "}
              {suggestion.reason}
            </p>
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
                className={[
                  "rounded-eos-md border px-3 py-1.5 text-sm transition",
                  active
                    ? "border-eos-primary/40 bg-eos-primary-soft text-eos-primary"
                    : "border-eos-border bg-eos-surface-variant text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text",
                ].join(" ")}
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

function isIntakeQuestionStep(step: ApplicabilityWizardStep): step is Exclude<IntakeFlowStep, "review"> {
  return isIntakeFlowStep(step) && step !== "review"
}

function isIntakeFlowStep(step: ApplicabilityWizardStep): step is IntakeFlowStep {
  return INTAKE_FLOW_STEPS.includes(step as IntakeFlowStep)
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
