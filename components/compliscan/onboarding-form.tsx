"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSearch,
  ListChecks,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  ApplicabilityWizard,
  type ApplicabilityWizardStep,
} from "@/components/compliscan/applicability-wizard"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"

type ModeOption = {
  id: "solo" | "partner" | "compliance"
  label: string
  description: string
  icon: React.ReactNode
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "solo",
    label: "Proprietar / Manager",
    description:
      "Gestionezi conformitatea pentru propria ta firma. Vei vedea un dashboard simplificat, axat pe actiuni concrete.",
    icon: <Building2 className="size-6" />,
  },
  {
    id: "partner",
    label: "Consultant / Contabil / Auditor",
    description:
      "Gestionezi mai multe firme simultan. Vei avea acces la un portofoliu agregat cu vedere cross-client.",
    icon: <Briefcase className="size-6" />,
  },
  {
    id: "compliance",
    label: "Responsabil conformitate",
    description:
      "Lucrezi intern pe o singura firma, cu drepturi operationale extinse. Vei vedea toate instrumentele de audit si raportare.",
    icon: <ShieldCheck className="size-6" />,
  },
]

type OnboardingFormProps = {
  initialUserMode: ModeOption["id"] | null
  orgName?: string | null
}

type OnboardingOverviewStep = {
  id: "mode" | "profile" | "laws" | "report"
  label: string
  hint: string
  icon: typeof ShieldCheck
}

const ONBOARDING_OVERVIEW_STEPS: OnboardingOverviewStep[] = [
  {
    id: "mode",
    label: "Cum vei folosi CompliScan",
    hint: "alegi rolul si modul de lucru",
    icon: ShieldCheck,
  },
  {
    id: "profile",
    label: "Date firma si semnale publice",
    hint: "CUI, website, sector si marime",
    icon: Building2,
  },
  {
    id: "laws",
    label: "Legi aplicabile si confirmari",
    hint: "ce reguli se aplica si unde trebuie confirmare",
    icon: ListChecks,
  },
  {
    id: "report",
    label: "Primul tau raport",
    hint: "vezi findings, documente si urmatorul pas",
    icon: FileSearch,
  },
]

function getOverviewStep(mode: ModeOption["id"] | null, wizardStep: ApplicabilityWizardStep | null) {
  if (!mode) return "mode"
  if (!wizardStep || wizardStep === "cui" || wizardStep === "sector" || wizardStep === "size") {
    return "profile"
  }
  if (wizardStep === "done") return "report"
  return "laws"
}

export function OnboardingForm({ initialUserMode, orgName }: OnboardingFormProps) {
  const router = useRouter()
  const [currentMode, setCurrentMode] = useState<ModeOption["id"] | null>(initialUserMode)
  const [selectedMode, setSelectedMode] = useState<ModeOption["id"] | null>(initialUserMode)
  const [wizardStep, setWizardStep] = useState<ApplicabilityWizardStep | null>(
    initialUserMode ? "cui" : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeOverviewStep = getOverviewStep(currentMode, wizardStep)
  const selectedModeMeta = currentMode
    ? MODE_OPTIONS.find((option) => option.id === currentMode) ?? null
    : null

  async function handleConfirm() {
    if (!selectedMode) return
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/set-user-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setError(data.error || "Eroare la salvarea modului de utilizare.")
        return
      }

      setCurrentMode(selectedMode)
      setWizardStep("cui")
      toast.success("Pasul 1 a fost salvat. Continuam cu profilul firmei.")
    } catch {
      setError("Eroare de retea. Incearca din nou.")
    } finally {
      setLoading(false)
    }
  }

  function handleOnboardingComplete() {
    toast.success("Onboarding finalizat. Te ducem in dashboard.")
    router.replace("/dashboard")
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--eos-accent-primary-subtle),transparent_32%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] px-3 py-6 sm:px-4 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div>
            <CompliScanLogoLockup
              className="mb-5"
              variant="gradient"
              size="md"
              subtitle=""
              titleClassName="text-eos-text"
              subtitleClassName="text-eos-text-muted"
            />

            <Badge variant="outline" className="normal-case tracking-normal">
              Onboarding ghidat
            </Badge>
            <h1 className="mt-4 text-3xl font-semibold text-eos-text">
              Primele decizii, intr-un singur flow
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-eos-text-muted">
              Nu te trimitem in dashboard pana cand alegi modul de lucru, confirmi datele firmei si
              vezi primul raport initial.
            </p>
          </div>

          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="space-y-4 pt-4">
              {ONBOARDING_OVERVIEW_STEPS.map((step, index) => {
                const stepIndex = ONBOARDING_OVERVIEW_STEPS.findIndex((item) => item.id === activeOverviewStep)
                const isDone = index < stepIndex
                const isCurrent = index === stepIndex
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="flex items-start gap-3">
                    <div
                      className={[
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border",
                        isDone
                          ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                          : isCurrent
                            ? "border-eos-primary/40 bg-eos-primary/10 text-eos-primary"
                            : "border-eos-border bg-eos-bg-inset text-eos-text-muted",
                      ].join(" ")}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-4" strokeWidth={2} />
                      ) : (
                        <StepIcon className="size-4" strokeWidth={2} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-eos-text">
                          {index + 1}. {step.label}
                        </p>
                        {isCurrent ? (
                          <Badge className="border-eos-primary/20 bg-eos-primary/10 text-eos-primary">
                            Acum
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-xs text-eos-text-muted">{step.hint}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {selectedModeMeta ? (
            <Card className="border-eos-border bg-eos-surface">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-eos-md bg-eos-primary/10 p-2 text-eos-primary">
                    {selectedModeMeta.icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-eos-text">
                      Mod selectat: {selectedModeMeta.label}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">
                      {selectedModeMeta.description}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-eos-text-muted">
                  Il poti schimba ulterior din Setari cont.
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="pt-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-eos-text-muted">
                    {currentMode ? "Pasii 2-4 din 4" : "Pasul 1 din 4"}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-eos-text">
                    {currentMode ? "Configuram profilul initial al firmei" : "Cum vei folosi CompliScan?"}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-eos-text-muted">
                    {currentMode
                      ? `${orgName ?? "Organizatia ta"} ramane in acelasi flow pana cand primesti findings si urmatorul pas clar.`
                      : "Alege rolul care descrie cel mai bine modul in care vei lucra in produs."}
                  </p>
                </div>
                {currentMode ? (
                  <Badge variant="outline" className="normal-case tracking-normal">
                    Fara ping-pong intre ecrane
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {!currentMode ? (
            <Card className="border-eos-border bg-eos-surface">
              <CardContent className="pt-5">
                <div className="space-y-3">
                  {MODE_OPTIONS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setSelectedMode(option.id)}
                      className={`w-full rounded-eos-lg bg-eos-surface p-4 text-left transition-colors ${
                        selectedMode === option.id
                          ? "ring-2 ring-eos-primary"
                          : "ring-1 ring-eos-border hover:ring-eos-border-hover"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 shrink-0 rounded-eos-md p-2 ${
                            selectedMode === option.id
                              ? "bg-eos-primary/10 text-eos-primary"
                              : "bg-eos-surface-variant text-eos-text-muted"
                          }`}
                        >
                          {option.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-eos-text">{option.label}</p>
                          <p className="mt-1 text-sm leading-relaxed text-eos-text-muted">
                            {option.description}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {error ? (
                  <div className="mt-4 rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    {error}
                  </div>
                ) : null}

                <Button
                  size="lg"
                  className="mt-6 w-full gap-2"
                  disabled={!selectedMode || loading}
                  onClick={() => void handleConfirm()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se salveaza...
                    </>
                  ) : (
                    <>
                      Continua cu profilul firmei
                      <ArrowRight className="size-4" strokeWidth={2} />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ApplicabilityWizard
              onComplete={handleOnboardingComplete}
              onStepChange={setWizardStep}
            />
          )}
        </div>
      </div>
    </div>
  )
}
