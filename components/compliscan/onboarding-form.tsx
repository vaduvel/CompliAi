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
      "Gestionezi conformitatea firmei tale. Dashboard simplificat, axat pe acțiuni concrete și primul risc rezolvat.",
    icon: Building2,
    badge: "Solo",
    iconClass: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    activeBorder: "border-blue-500/40",
    activeBg: "bg-blue-500/[0.06]",
    activeShadow: "shadow-[0_0_28px_rgba(59,130,246,0.10)]",
    badgeClass: "bg-blue-500/20 text-blue-400",
    checkClass: "text-blue-400",
  },
  {
    id: "partner" as ModeId,
    label: "Consultant / Contabil / Auditor",
    description:
      "Gestionezi mai multe firme simultan. Portofoliu agregat cu vedere cross-client și livrabile pentru clienți.",
    icon: Briefcase,
    badge: "Partner",
    iconClass: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    activeBorder: "border-violet-500/40",
    activeBg: "bg-violet-500/[0.06]",
    activeShadow: "shadow-[0_0_28px_rgba(139,92,246,0.10)]",
    badgeClass: "bg-violet-500/20 text-violet-400",
    checkClass: "text-violet-400",
  },
  {
    id: "compliance" as ModeId,
    label: "Responsabil conformitate",
    description:
      "Lucrezi intern pe o singură firmă, cu drepturi extinse de audit, raportare și instrumente de control.",
    icon: ShieldCheck,
    badge: "Compliance",
    iconClass: "text-emerald-400",
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    activeBorder: "border-emerald-500/40",
    activeBg: "bg-emerald-500/[0.06]",
    activeShadow: "shadow-[0_0_28px_rgba(16,185,129,0.10)]",
    badgeClass: "bg-emerald-500/20 text-emerald-400",
    checkClass: "text-emerald-400",
  },
]

const PHASES = [
  { label: "Rolul tău" },
  { label: "Date firmă" },
  { label: "Legi aplicabile" },
]

function getPhaseIndex(mode: ModeId | null, wizardStep: ApplicabilityWizardStep | null): number {
  if (!mode) return 0
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
    <div className="min-h-screen bg-[#060810] text-white">
      {/* Header */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-xl items-center justify-between">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <span className="text-xs text-white/30">
            Pasul {phaseIndex + 1} din {PHASES.length}
            {" · "}
            {PHASES[phaseIndex]?.label}
          </span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.05]">
        <div
          className="h-full bg-blue-500 transition-all duration-500"
          style={{ width: `${((phaseIndex + 1) / PHASES.length) * 100}%` }}
        />
      </div>

      <main className="mx-auto max-w-xl px-6 pb-16 pt-10">
        {/* Phase dots */}
        <div className="mb-8 flex items-center gap-2">
          {PHASES.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-2">
              <div
                className={[
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                  i < phaseIndex
                    ? "bg-blue-500 text-white"
                    : i === phaseIndex
                      ? "border border-blue-500/50 bg-blue-500/15 text-blue-400"
                      : "border border-white/10 text-white/20",
                ].join(" ")}
              >
                {i < phaseIndex ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={[
                  "text-xs",
                  i === phaseIndex ? "font-medium text-white/80" : "text-white/25",
                ].join(" ")}
              >
                {phase.label}
              </span>
              {i < PHASES.length - 1 && <div className="mx-1 h-px w-6 bg-white/10" />}
            </div>
          ))}
        </div>

        {/* ── Phase 1: Selectare mod ── */}
        {!currentMode && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-white">Cum vei folosi CompliScan?</h1>
              <p className="mt-2 text-sm leading-6 text-white/45">
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
                      "w-full rounded-2xl border p-5 text-left transition-all duration-200",
                      isSelected
                        ? [option.activeBorder, option.activeBg, option.activeShadow].join(" ")
                        : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={[
                          "mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-all",
                          isSelected
                            ? [option.iconBg, option.iconClass].join(" ")
                            : "border-white/10 bg-white/5 text-white/30",
                        ].join(" ")}
                      >
                        <option.icon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2.5">
                          <p
                            className={[
                              "font-semibold transition-colors",
                              isSelected ? "text-white" : "text-white/65",
                            ].join(" ")}
                          >
                            {option.label}
                          </p>
                          <span
                            className={[
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold transition-all",
                              isSelected ? option.badgeClass : "bg-white/5 text-white/20",
                            ].join(" ")}
                          >
                            {option.badge}
                          </span>
                        </div>
                        <p
                          className={[
                            "mt-1 text-sm leading-relaxed transition-colors",
                            isSelected ? "text-white/55" : "text-white/30",
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
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={!selectedMode || loading}
              onClick={() => void handleConfirm()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
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

        {/* ── Phase 2 + 3: Wizard ── */}
        {currentMode && (
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {phaseIndex === 1 ? "Date firmă și semnale publice" : "Legi aplicabile și confirmări"}
                </h1>
                <p className="mt-1.5 text-sm text-white/45">
                  {orgName ?? "Organizația ta"} · intri direct în{" "}
                  <span className="text-white/70">{destination.summaryLabel}</span> la final
                </p>
              </div>
              {currentMeta && (
                <div
                  className={[
                    "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5",
                    currentMeta.activeBorder,
                    "bg-white/[0.03]",
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

            <ApplicabilityWizard
              onComplete={handleOnboardingComplete}
              onStepChange={setWizardStep}
              onBackToModeSelection={handleBackToModeSelection}
              completionLabel={destination.submitLabel}
              completionHint={`La final intri direct în ${destination.summaryLabel}.`}
            />
          </div>
        )}
      </main>
    </div>
  )
}
