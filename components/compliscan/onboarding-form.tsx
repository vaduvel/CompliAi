"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react"
import { toast } from "sonner"

import {
  ApplicabilityWizard,
  type ApplicabilityWizardStep,
} from "@/components/compliscan/applicability-wizard"
import { PartnerWorkspaceStep } from "@/components/compliscan/partner-workspace-step"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { resolveOnboardingDestination } from "@/lib/compliscan/onboarding-destination"

// ── Types ────────────────────────────────────────────────────────────────────

type ModeId = "solo" | "partner" | "compliance"

type OnboardingFormProps = {
  initialUserMode: ModeId | null
  orgName?: string | null
}

// ── Data ─────────────────────────────────────────────────────────────────────

const MODE_OPTIONS = [
  {
    id: "solo" as ModeId,
    label: "Proprietar / Manager",
    description:
      "Gestionezi conformitatea firmei tale. Tablou de bord simplificat, axat pe acțiuni concrete și primul risc rezolvat.",
    icon: Building2,
    badge: "Solo",
    iconClass: "text-eos-primary",
    iconBg: "bg-eos-primary-soft border-eos-border",
    activeBorder: "border-eos-primary/40",
    activeBg: "bg-eos-primary-soft",
    activeShadow: "shadow-[0_0_28px_rgba(59,130,246,0.10)]",
    badgeClass: "bg-eos-primary/20 text-eos-primary",
    checkClass: "text-eos-primary",
  },
  {
    id: "partner" as ModeId,
    label: "Consultant / Contabil / Auditor",
    description:
      "Gestionezi mai multe firme simultan. Portofoliu agregat cu vedere cross-client și livrabile pentru clienți.",
    icon: Briefcase,
    badge: "Partner",
    iconClass: "text-eos-primary",
    iconBg: "bg-eos-primary-soft border-violet-500/20",
    activeBorder: "border-violet-500/40",
    activeBg: "bg-violet-500/[0.06]",
    activeShadow: "shadow-[0_0_28px_rgba(139,92,246,0.10)]",
    badgeClass: "bg-violet-500/20 text-eos-primary",
    checkClass: "text-eos-primary",
  },
  {
    id: "compliance" as ModeId,
    label: "Responsabil conformitate",
    description:
      "Lucrezi intern pe o singură firmă, cu drepturi extinse de audit, raportare și instrumente de control.",
    icon: ShieldCheck,
    badge: "Compliance",
    iconClass: "text-eos-success",
    iconBg: "bg-eos-success-soft border-eos-border",
    activeBorder: "border-eos-success/50/40",
    activeBg: "bg-eos-success/[0.06]",
    activeShadow: "shadow-[0_0_28px_rgba(16,185,129,0.10)]",
    badgeClass: "bg-eos-success/20 text-eos-success",
    checkClass: "text-eos-success",
  },
]

const PHASES: Record<ModeId | "default", { label: string }[]> = {
  solo: [
    { label: "Rolul tău" },
    { label: "Profilul firmei" },
    { label: "Confirmări finale" },
  ],
  partner: [
    { label: "Rolul tău" },
    { label: "Spațiul de lucru" },
  ],
  compliance: [
    { label: "Rolul tău" },
    { label: "Profilul organizației" },
    { label: "Audit readiness" },
  ],
  default: [
    { label: "Rolul tău" },
    { label: "Date firmă" },
    { label: "Confirmări finale" },
  ],
}

function getPhasesForMode(mode: ModeId | null): { label: string }[] {
  return PHASES[mode ?? "default"] ?? PHASES.default
}

function getPhaseIndex(mode: ModeId | null, wizardStep: ApplicabilityWizardStep | null): number {
  if (!mode) return 0
  // Partner has only 2 phases — workspace step is always phase index 1
  if (mode === "partner") return 1
  if (
    !wizardStep ||
    wizardStep === "cui" ||
    wizardStep === "checking" ||
    wizardStep === "sector" ||
    wizardStep === "size" ||
    wizardStep === "ai" ||
    wizardStep === "efactura"
  ) {
    return 1
  }
  return 2
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OnboardingForm({ initialUserMode, orgName }: OnboardingFormProps) {
  const router = useRouter()
  const [currentMode, setCurrentMode] = useState<ModeId | null>(initialUserMode)
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(initialUserMode)
  const [wizardStep, setWizardStep] = useState<ApplicabilityWizardStep | null>(
    initialUserMode ? "cui" : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const phaseIndex = getPhaseIndex(currentMode, wizardStep)
  const destination = resolveOnboardingDestination(currentMode)
  const currentMeta = currentMode ? MODE_OPTIONS.find((o) => o.id === currentMode) ?? null : null
  const phases = getPhasesForMode(currentMode ?? selectedMode)

  // Progress bar + phase dot accent color per persona
  const progressAccent =
    currentMode === "partner" || selectedMode === "partner"
      ? "bg-violet-500"
      : currentMode === "compliance" || selectedMode === "compliance"
        ? "bg-eos-success"
        : "bg-eos-primary"

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
      toast.success("Pasul 1 salvat. Continuăm cu profilul firmei.")
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  async function handleOnboardingComplete() {
    if (destination.requiresPortfolioWorkspace) {
      try {
        const response = await fetch("/api/auth/select-workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceMode: "portfolio" }),
        })
        const payload = (await response.json().catch(() => ({}))) as { error?: string }

        if (!response.ok) {
          throw new Error(payload.error || "Nu am putut muta sesiunea în portofoliu.")
        }
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : "Nu am putut muta sesiunea în portofoliu."
        )
        return
      }
    }

    router.replace(destination.clientHref)
    router.refresh()
  }

  function handleBackToModeSelection() {
    if (!currentMode) return
    setSelectedMode(currentMode)
    setCurrentMode(null)
    setWizardStep(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* Header */}
      <header className="border-b border-eos-border-subtle px-6 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <span className="text-xs text-eos-text-tertiary">
            Pasul {phaseIndex + 1} din {phases.length}
            {" · "}
            {phases[phaseIndex]?.label}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-eos-surface-active">
        <div
          className={`h-full ${progressAccent} transition-all duration-500`}
          style={{ width: `${((phaseIndex + 1) / phases.length) * 100}%` }}
        />
      </div>

      <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
        {/* Phase dots */}
        <div className="mb-8 flex items-center gap-2">
          {phases.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                  i < phaseIndex
                    ? `${progressAccent} text-eos-text`
                    : i === phaseIndex
                      ? `border ${
                          progressAccent === "bg-violet-500"
                            ? "border-violet-500/50 bg-violet-500/10 text-violet-400"
                            : progressAccent === "bg-eos-success"
                              ? "border-eos-success/50 bg-eos-success-soft text-eos-success"
                              : "border-eos-primary/50 bg-eos-primary-soft text-eos-primary"
                        }`
                      : "border border-eos-border text-eos-text-tertiary",
                ].join(" ")}
              >
                {i < phaseIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={[
                  "text-xs",
                  i === phaseIndex ? "font-medium text-eos-text" : "text-eos-text-tertiary",
                ].join(" ")}
              >
                {phase.label}
              </span>
              {i < phases.length - 1 && <div className="mx-1 h-px w-6 bg-eos-border" />}
            </div>
          ))}
        </div>

        {/* ── Phase 1: Selectare mod ── */}
        {!currentMode && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-eos-text">Cum vei folosi CompliScan?</h1>
              <p className="mt-2 text-sm leading-6 text-eos-text-muted">
                Alege rolul care descrie cel mai bine modul în care lucrezi. Poți schimba
                ulterior din Setări.
              </p>
            </div>

            <div className="space-y-3">
              {MODE_OPTIONS.map((option) => {
                const isSelected = selectedMode === option.id
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedMode(option.id)}
                    className={[
                      "w-full rounded-eos-xl border p-5 text-left transition-all duration-200",
                      isSelected
                        ? [option.activeBorder, option.activeBg, option.activeShadow].join(" ")
                        : "border-eos-border bg-eos-surface-variant hover:border-eos-border-strong hover:bg-eos-surface-active",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-eos-lg border transition-all",
                          isSelected
                            ? [option.iconBg, option.iconClass].join(" ")
                            : "border-eos-border bg-eos-surface-elevated text-eos-text-tertiary",
                        ].join(" ")}
                      >
                        <option.icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <p
                            className={[
                              "font-semibold transition-colors",
                              isSelected ? "text-eos-text" : "text-eos-text-muted",
                            ].join(" ")}
                          >
                            {option.label}
                          </p>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all",
                              isSelected ? option.badgeClass : "bg-eos-surface-elevated text-eos-text-tertiary",
                            ].join(" ")}
                          >
                            {option.badge}
                          </span>
                        </div>
                        <p
                          className={[
                            "mt-1 text-sm leading-relaxed transition-colors",
                            isSelected ? "text-eos-text-muted" : "text-eos-text-tertiary",
                          ].join(" ")}
                        >
                          {option.description}
                        </p>
                      </div>
                      {isSelected && (
                        <CheckCircle2
                          className={["mt-0.5 h-5 w-5 shrink-0", option.checkClass].join(" ")}
                        />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {error && (
              <div className="rounded-eos-lg border border-eos-error-border bg-eos-error/10 px-4 py-3 text-sm text-eos-error">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!selectedMode || loading}
              onClick={() => void handleConfirm()}
              className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-eos-primary py-3.5 text-sm font-semibold text-eos-text shadow-lg shadow-eos-primary/20/20 transition-all hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Se salvează...
                </>
              ) : (
                <>
                  Continuă cu profilul firmei
                  <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
                </>
              )}
            </button>
          </div>
        )}

        {/* ── Phase 2 + 3: Wizard or Partner Workspace ── */}
        {currentMode && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-eos-text">
                  {currentMode === "partner"
                    ? "Configurează-ți spațiul de lucru"
                    : currentMode === "compliance"
                      ? phaseIndex === 1
                        ? "Profilul organizației pentru audit"
                        : "Audit readiness — confirmări finale"
                      : phaseIndex === 1
                        ? "Ce trebuie să știm despre firma ta"
                        : "Confirmări finale și pornire în runtime"}
                </h1>
                <p className="mt-1.5 text-sm text-eos-text-muted">
                  {currentMode === "partner"
                    ? "Clienții se adaugă din portofoliu după configurare."
                    : `${orgName ?? "Organizația ta"} · intri direct în `}
                  {currentMode !== "partner" && (
                    <span className="text-eos-text">{destination.summaryLabel}</span>
                  )}
                  {currentMode !== "partner" && " la final"}
                </p>
              </div>
              {currentMeta && (
                <div
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5",
                    currentMeta.activeBorder,
                    "bg-eos-surface-variant",
                  ].join(" ")}
                >
                  <currentMeta.icon
                    className={["h-3.5 w-3.5", currentMeta.iconClass].join(" ")}
                    strokeWidth={1.5}
                  />
                  <span className={["text-[11px] font-semibold", currentMeta.iconClass].join(" ")}>
                    {currentMeta.badge}
                  </span>
                </div>
              )}
            </div>

            {currentMode === "partner" ? (
              <PartnerWorkspaceStep
                initialOrgName={orgName ?? ""}
                onComplete={() => void handleOnboardingComplete()}
                onBack={handleBackToModeSelection}
              />
            ) : (
              <ApplicabilityWizard
                onComplete={handleOnboardingComplete}
                onStepChange={setWizardStep}
                onBackToModeSelection={handleBackToModeSelection}
                completionLabel={destination.submitLabel}
                completionHint={`La final intri direct în ${destination.summaryLabel}.`}
                userMode={currentMode === "compliance" ? "compliance" : "solo"}
              />
            )}
          </div>
        )}
      </main>
    </div>
  )
}
