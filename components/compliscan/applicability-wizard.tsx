"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import {
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
import type { OrgProfilePrefill, PrefillSuggestion } from "@/lib/compliance/org-profile-prefill"
import {
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

type WizardStep = "cui" | "sector" | "size" | "ai" | "efactura" | "intake" | "done"

type WizardState = {
  cui: string
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

export function ApplicabilityWizard({ onComplete }: Props) {
  const { track, trackOnce } = useTrackEvent()
  const completedRef = useRef(false)

  useEffect(() => {
    trackOnce("started_applicability")
  }, [trackOnce])

  useEffect(() => () => {
    if (!completedRef.current) track("abandoned_applicability")
  }, [track])

  const [step, setStep] = useState<WizardStep>("cui")
  const [values, setValues] = useState<WizardState>({
    cui: "",
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

  const profileSnapshot = buildProfileSnapshot(values)
  const suggestedAnswers = profileSnapshot ? deriveSuggestedAnswers(profileSnapshot, orgPrefill) : []
  const visibleConditionalQuestions = getVisibleConditionalQuestions(intakeAnswers)
  const unansweredQuestions = getUnansweredQuestions(intakeAnswers, visibleConditionalQuestions)

  function hydrateIntakeStep(nextRequiresEfactura: boolean) {
    if (!values.sector || !values.employeeCount || values.usesAITools === null) return

    const snapshot = buildProfileSnapshot({ ...values, requiresEfactura: nextRequiresEfactura })
    if (!snapshot) return
    const nextAnswers = deriveInitialIntakeAnswers(snapshot, orgPrefill)
    setIntakeAnswers(nextAnswers)
    setError(null)
    setStep("intake")
  }

  async function handleCuiContinue() {
    const trimmedCui = values.cui.trim()
    if (!trimmedCui) {
      setOrgPrefill(null)
      setPrefillError(null)
      setStep("sector")
      return
    }

    if (!isValidCui(trimmedCui)) {
      setOrgPrefill(null)
      setPrefillError("CUI-ul pare invalid. Corectează-l sau lasă câmpul gol ca să continui fără prefill.")
      return
    }

    setPrefillLoading(true)
    setPrefillError(null)
    try {
      const res = await fetch("/api/org/profile/prefill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cui: trimmedCui }),
      })

      if (!res.ok) {
        setOrgPrefill(null)
        setPrefillError("Nu am putut interoga ANAF acum. Continuăm fără prefill automat.")
        setStep("sector")
        return
      }

      const data = (await res.json()) as ProfilePrefillResponse
      setOrgPrefill(data.prefill)
      if (!data.prefill) {
        setPrefillError("Nu am găsit firma în registrul ANAF pentru CUI-ul introdus. Continuăm manual.")
      }
      setStep("sector")
    } catch {
      setOrgPrefill(null)
      setPrefillError("Nu am putut interoga ANAF acum. Continuăm fără prefill automat.")
      setStep("sector")
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

  const STEP_LABELS: Record<WizardStep, string> = {
    cui: "1 / 6",
    sector: "2 / 6",
    size: "3 / 6",
    ai: "4 / 6",
    efactura: "5 / 6",
    intake: "6 / 6",
    done: "✓",
  }

  return (
    <Card className="border-eos-border bg-eos-surface shadow-sm">
      <CardContent className="border-l-4 border-l-eos-primary px-5 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 shrink-0 text-eos-primary" />
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Descoperă ce legi se aplică organizației tale
              </p>
              <p className="text-xs text-eos-text-muted">
                Prefill + confirmare asistată · primele findings apar imediat
              </p>
            </div>
          </div>
          <span className="shrink-0 text-xs font-medium text-eos-text-muted tabular-nums">
            {STEP_LABELS[step]}
          </span>
        </div>

        <div className="mt-5">
          {step === "cui" && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-eos-text">
                CUI-ul organizației tale <span className="font-normal text-eos-text-muted">(opțional)</span>
              </p>
              <p className="text-xs text-eos-text-muted">
                Îl folosim pentru prefill în documentele generate. Dacă nu-l ai acum, mergem mai departe.
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
                placeholder="Ex: RO12345678"
                className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted focus:border-eos-primary"
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCuiContinue()
                }}
              />
              {prefillError ? (
                <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft px-3 py-2 text-sm text-eos-warning">
                  {prefillError}
                </div>
              ) : null}
              <Button onClick={() => void handleCuiContinue()} className="w-full" disabled={prefillLoading}>
                {prefillLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
                Continuă
              </Button>
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
                <AnafPrefillCard
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
              <p className="text-sm font-medium text-eos-text">
                Folosiți unelte AI în firmă?
              </p>
              <p className="text-xs text-eos-text-muted">
                Exemplu: ChatGPT, Copilot, Gemini sau orice clasificator / asistent automat.
              </p>
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
                      Sursa: AI inventory
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
              <p className="text-sm font-medium text-eos-text">
                Facturezi B2B cu obligație de e-Factura / SPV ANAF?
              </p>
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
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-eos-primary" />
                  <div>
                    <p className="text-sm font-medium text-eos-text">
                      Ce am înțeles deja despre firmă
                    </p>
                    <p className="mt-1 text-xs text-eos-text-muted">
                      Confirmi doar răspunsurile care schimbă findings, documentele recomandate sau următorul pas.
                    </p>
                  </div>
                </div>
                {suggestedAnswers.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {suggestedAnswers.map((suggestion) => (
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
                    suggestion={suggestedAnswers.find((item) => item.questionId === question.id)}
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
                    : `${unansweredQuestions.length} răspunsuri mai schimbă findings sau documentele recomandate.`}
                </div>
                <Button onClick={() => void handleSubmit()} disabled={saving}>
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
                  Ai direcția inițială. Nu mai pornești din întuneric.
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
                  title="Primele findings"
                  subtitle="Constatări inițiale generate automat"
                  items={initialFindings.slice(0, 4).map((finding) => finding.title)}
                  emptyLabel="Nu au apărut findings inițiale."
                />
                <SummaryCard
                  icon={<FileText className="h-4 w-4 text-eos-primary" />}
                  title="Documente recomandate"
                  subtitle="Ce merită pregătit imediat"
                  items={documentRequests.slice(0, 4).map((document) => document.label)}
                  emptyLabel="Nu există documente noi recomandate."
                />
                <SummaryCard
                  icon={<ListChecks className="h-4 w-4 text-eos-success" />}
                  title="Următorul pas"
                  subtitle={
                    nextBestAction
                      ? `${nextBestAction.estimatedMinutes} min până la prima acțiune`
                      : "Poți intra direct în dashboard"
                  }
                  items={nextBestAction ? [nextBestAction.label] : []}
                  emptyLabel="Continuă în dashboard."
                />
              </div>

              <Button onClick={handleDone} className="w-full">
                Continuă la dashboard
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AnafPrefillCard({
  prefill,
  selectedSector,
  onApplySector,
}: {
  prefill: OrgProfilePrefill
  selectedSector: OrgSector | null
  onApplySector: (sector: OrgSector) => void
}) {
  const sectorSuggestion = prefill.suggestions.sector

  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-eos-text">Am găsit firma în ANAF</p>
          <p className="mt-1 text-xs text-eos-text-muted">
            {prefill.companyName} · {prefill.normalizedCui}
          </p>
        </div>
        <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
          Sursa: ANAF
        </Badge>
      </div>

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
      </div>

      {prefill.fiscalStatus ? (
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
              Încredere mare
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
              Sursa: AI inventory
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
          {confidenceLabel(suggestion.confidence)}
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
            <p className="mt-1 text-xs text-eos-text-muted">
              Sugestie: <span className="text-eos-text">{answerLabel(suggestion.value)}</span> · {suggestion.reason}
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
  return {
    sector: values.sector,
    employeeCount: values.employeeCount,
    usesAITools: values.usesAITools,
    requiresEfactura: values.requiresEfactura,
    ...(cui ? { cui } : {}),
    completedAtISO: new Date().toISOString(),
  }
}

function deriveInitialIntakeAnswers(profile: OrgProfile, prefill?: OrgProfilePrefill | null): FullIntakeAnswers {
  const initial: FullIntakeAnswers = {
    usesAITools: profile.usesAITools ? "yes" : "no",
  }

  for (const suggestion of deriveSuggestedAnswers(profile, prefill)) {
    ;(initial as Record<string, string | undefined>)[suggestion.questionId] = suggestion.value
  }

  return initial
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
      return "Încredere mare"
    case "medium":
      return "Încredere medie"
    default:
      return "Semnal slab"
  }
}

function isValidCui(value: string) {
  return /^(RO)?\d{2,10}$/i.test(value.trim())
}

function questionLabelForSuggestion(questionId: string) {
  const question = DECISIVE_QUESTIONS.find((item) => item.id === questionId)
  return question?.text ?? questionId
}
