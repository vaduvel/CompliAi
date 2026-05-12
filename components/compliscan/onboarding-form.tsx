"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
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

// S1.6 — ICP segment (Doc 06): 5 segmente Faza 1, mapate la 3 userMode-uri.
type IcpSegmentId =
  | "solo"
  | "cabinet-dpo"
  | "cabinet-fiscal"
  | "imm-internal"
  | "enterprise"

type ModeAccent = "primary" | "violet" | "success" | "amber" | "indigo"

type OnboardingFormProps = {
  initialUserMode: ModeId | null
  orgName?: string | null
}

// ── Data ─────────────────────────────────────────────────────────────────────

type IcpSegmentOption = {
  id: IcpSegmentId
  label: string
  description: string
  icon: typeof Building2
  badge: string
  accent: ModeAccent
  // Mapare la userMode tehnic existent (auth.ts).
  mapsTo: ModeId
}

const ICP_OPTIONS: IcpSegmentOption[] = [
  {
    id: "solo",
    label: "Proprietar / Manager",
    description:
      "Gestionezi conformitatea firmei tale (1 organizație). Tablou de bord simplificat, primul risc rezolvat.",
    icon: Building2,
    badge: "Solo",
    accent: "primary",
    mapsTo: "solo",
  },
  {
    id: "cabinet-dpo",
    label: "Cabinet DPO / Privacy Manager",
    description:
      "Gestionezi GDPR + EU AI Act pentru mai mulți clienți. Portofoliu agregat, magic links, white-label cabinet.",
    icon: ShieldCheck,
    badge: "Cabinet DPO",
    accent: "violet",
    mapsTo: "partner",
  },
  {
    id: "cabinet-fiscal",
    label: "Contabil CECCAR",
    description:
      "Layer compliance peste SmartBill/Saga/Oblio. Validator UBL CIUS-RO + e-TVA + GDPR lite per client.",
    icon: Briefcase,
    badge: "Cabinet Fiscal",
    accent: "amber",
    mapsTo: "partner",
  },
  {
    id: "imm-internal",
    label: "Responsabil Compliance Intern",
    description:
      "Lucrezi intern pe o singură firmă (IMM 50-250 ang). Drepturi extinse de audit, raportare, control.",
    icon: ShieldCheck,
    badge: "IMM Internal",
    accent: "success",
    mapsTo: "compliance",
  },
  {
    id: "enterprise",
    label: "CISO / Multi-framework",
    description:
      "Acoperire NIS2 + DORA + ISO 27001 + AI Act. Governance layer pentru organizații reglementate. Sales-led.",
    icon: ShieldCheck,
    badge: "Enterprise",
    accent: "indigo",
    mapsTo: "compliance",
  },
]

// Backward-compat: păstrăm MODE_OPTIONS-style array pentru steps și progress bar.
const MODE_OPTIONS: Array<{
  id: ModeId
  label: string
  description: string
  icon: typeof Building2
  badge: string
  accent: ModeAccent
}> = ICP_OPTIONS.filter((opt, idx, arr) =>
  arr.findIndex((o) => o.mapsTo === opt.mapsTo) === idx
).map((opt) => ({
  id: opt.mapsTo,
  label: opt.label,
  description: opt.description,
  icon: opt.icon,
  badge: opt.badge,
  accent: opt.accent,
}))

const ACCENT_CLASSES: Record<
  ModeAccent,
  {
    border: string
    bg: string
    text: string
    iconBox: string
    iconColor: string
    badgeBg: string
    badgeText: string
    progressBar: string
  }
> = {
  primary: {
    border: "border-eos-primary/40",
    bg: "bg-eos-primary/[0.06]",
    text: "text-eos-primary",
    iconBox: "border-eos-primary/30 bg-eos-primary/10",
    iconColor: "text-eos-primary",
    badgeBg: "bg-eos-primary/15",
    badgeText: "text-eos-primary",
    progressBar: "bg-eos-primary",
  },
  violet: {
    border: "border-violet-500/40",
    bg: "bg-violet-500/[0.06]",
    text: "text-violet-300",
    iconBox: "border-violet-500/30 bg-violet-500/10",
    iconColor: "text-violet-300",
    badgeBg: "bg-violet-500/15",
    badgeText: "text-violet-300",
    progressBar: "bg-violet-500",
  },
  success: {
    border: "border-eos-success/40",
    bg: "bg-eos-success-soft",
    text: "text-eos-success",
    iconBox: "border-eos-success/30 bg-eos-success-soft",
    iconColor: "text-eos-success",
    badgeBg: "bg-eos-success/15",
    badgeText: "text-eos-success",
    progressBar: "bg-eos-success",
  },
  amber: {
    border: "border-amber-500/40",
    bg: "bg-amber-500/[0.06]",
    text: "text-amber-300",
    iconBox: "border-amber-500/30 bg-amber-500/10",
    iconColor: "text-amber-300",
    badgeBg: "bg-amber-500/15",
    badgeText: "text-amber-300",
    progressBar: "bg-amber-500",
  },
  indigo: {
    border: "border-indigo-500/40",
    bg: "bg-indigo-500/[0.06]",
    text: "text-indigo-300",
    iconBox: "border-indigo-500/30 bg-indigo-500/10",
    iconColor: "text-indigo-300",
    badgeBg: "bg-indigo-500/15",
    badgeText: "text-indigo-300",
    progressBar: "bg-indigo-500",
  },
}

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
  const searchParams = useSearchParams()
  // Mircea UX fix (2026-05-11): preselect ICP from ?icp= URL param (vine din
  // landing page /fiscal cu icp=cabinet-fiscal). Userul nu trebuie să aleagă
  // ICP-ul de două ori dacă a venit deja din segmentul landing dedicat.
  const initialIcpFromUrl: IcpSegmentId | null = (() => {
    const raw = searchParams.get("icp")
    const valid: IcpSegmentId[] = [
      "solo",
      "cabinet-dpo",
      "cabinet-fiscal",
      "cabinet-hr",
      "imm-internal",
      "imm-hr",
      "enterprise",
    ]
    return raw && valid.includes(raw as IcpSegmentId) ? (raw as IcpSegmentId) : null
  })()
  const initialModeFromIcp = initialIcpFromUrl
    ? ICP_OPTIONS.find((o) => o.id === initialIcpFromUrl)?.mapsTo ?? null
    : null
  const [currentMode, setCurrentMode] = useState<ModeId | null>(
    initialUserMode ?? initialModeFromIcp,
  )
  const [selectedMode, setSelectedMode] = useState<ModeId | null>(
    initialUserMode ?? initialModeFromIcp,
  )
  // S1.6 — ICP segment selectat (5 carduri, mapează la 3 userMode-uri).
  const [selectedSegment, setSelectedSegment] = useState<IcpSegmentId | null>(initialIcpFromUrl)
  // Mircea UX fix Faza 0.4 (2026-05-12): dacă URL register conține icp= valid
  // (ex: /login?mode=register&icp=cabinet-fiscal venind din /fiscal landing),
  // sărim ecranul "Pasul 1 — Cum vei folosi CompliScan?" cu cele 4 carduri de
  // rol. ICP-ul e deja selectat din landing; ar fi redundant și enervant să
  // întrebăm a doua oară.
  const shouldSkipRoleSelection =
    !initialUserMode && Boolean(initialIcpFromUrl && initialModeFromIcp)
  const [wizardStep, setWizardStep] = useState<ApplicabilityWizardStep | null>(
    initialUserMode || shouldSkipRoleSelection ? "cui" : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mircea UX fix Faza 0.4: persistă auto userMode + icpSegment dacă am sărit
  // ecranul de selecție rol (URL register cu icp= valid). Best-effort, nu blocăm
  // flow-ul dacă API-urile sunt down — utilizatorul oricum poate continua.
  useEffect(() => {
    if (!shouldSkipRoleSelection || !selectedMode || !selectedSegment) return
    void (async () => {
      try {
        await fetch("/api/auth/set-user-mode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: selectedMode }),
        })
        await fetch("/api/partner/white-label", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ icpSegment: selectedSegment }),
        }).catch(() => {})
      } catch {
        // ignore — userMode persistare e best-effort în acest moment.
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const phaseIndex = getPhaseIndex(currentMode, wizardStep)
  const destination = resolveOnboardingDestination(currentMode)
  const currentMeta = currentMode ? MODE_OPTIONS.find((o) => o.id === currentMode) ?? null : null
  const phases = getPhasesForMode(currentMode ?? selectedMode)

  // accent picked from current/selected segment (5 carduri)
  const selectedIcp = selectedSegment
    ? ICP_OPTIONS.find((o) => o.id === selectedSegment) ?? null
    : null
  const accentMode: ModeAccent =
    selectedIcp?.accent ??
    currentMeta?.accent ??
    MODE_OPTIONS.find((o) => o.id === selectedMode)?.accent ??
    "primary"
  const accent = ACCENT_CLASSES[accentMode]

  async function handleConfirm() {
    if (!selectedSegment || !selectedMode) return
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

      // S1.6 — persist sub-segment ICP în white-label (best-effort, NU blocăm flow-ul).
      void fetch("/api/partner/white-label", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icpSegment: selectedSegment }),
      }).catch(() => {
        // ignore — userMode e salvat, sub-segment e nice-to-have
      })

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <div className="grid min-h-screen lg:grid-cols-[320px_1fr]">
        {/* ── LEFT — progress sidebar ─────────────────────────────────────── */}
        <aside className="flex flex-col border-b border-eos-border bg-eos-surface px-6 py-6 lg:border-b-0 lg:border-r lg:px-8 lg:py-8">
          <div className="mb-10 flex items-center gap-2.5">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </div>

          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Configurare cont
          </p>
          <h2
            data-display-text="true"
            className="mt-1.5 font-display text-[20px] font-semibold leading-tight tracking-[-0.02em] text-eos-text"
          >
            {/* Mircea fix (2026-05-11): show "Pasul 1" simplu cât timp user-ul
                n-a ales încă rolul (selectedMode = null). După alegere,
                phases.length reflectă numărul real (2 pentru partner,
                3 pentru solo/compliance). */}
            {!selectedMode && !currentMode
              ? "Pasul 1"
              : `Pasul ${phaseIndex + 1} din ${phases.length}`}
          </h2>
          <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
            {!selectedMode && !currentMode
              ? "Alege rolul tău. Totul poate fi modificat retroactiv."
              : phases.length - phaseIndex - 1 > 0
                ? `Încă ${phases.length - phaseIndex - 1} ${
                    phases.length - phaseIndex - 1 === 1 ? "pas" : "pași"
                  }. Totul poate fi modificat retroactiv.`
                : "Aproape gata — confirmă și pornim primul scan."}
          </p>

          {/* Vertical stepper */}
          <ol className="mt-7 flex flex-col">
            {phases.map((phase, i) => {
              const isDone = i < phaseIndex
              const isActive = i === phaseIndex
              return (
                <li
                  key={phase.label}
                  className={[
                    "flex items-start gap-3 border-l-2 py-3 pl-3.5 transition-colors duration-150",
                    isActive ? accent.border.replace("border-", "border-l-") : "border-l-transparent",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "grid size-5 shrink-0 place-items-center rounded-full font-mono text-[10px] font-bold text-white",
                      isDone
                        ? "bg-eos-success"
                        : isActive
                          ? accent.progressBar
                          : "bg-white/[0.08] text-eos-text-tertiary",
                    ].join(" ")}
                  >
                    {isDone ? <CheckCircle2 className="size-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <div className="min-w-0">
                    <p
                      className={[
                        "text-[13px] leading-tight",
                        isActive
                          ? "font-semibold text-eos-text"
                          : isDone
                            ? "font-medium text-eos-text-muted"
                            : "font-medium text-eos-text-tertiary",
                      ].join(" ")}
                    >
                      {phase.label}
                    </p>
                    {isDone && (
                      <p className="mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em] text-eos-success">
                        Completat
                      </p>
                    )}
                    {isActive && (
                      <p className={["mt-1 font-mono text-[9.5px] font-semibold uppercase tracking-[0.08em]", accent.text].join(" ")}>
                        Acum
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-auto pt-8">
            <div className="rounded-eos-lg border border-eos-border bg-white/[0.02] px-4 py-3.5">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                Timp estimat
              </p>
              <p
                data-display-text="true"
                className="mt-1.5 font-display text-[22px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
              >
                ~{Math.max(1, (phases.length - phaseIndex) * 2)} min
              </p>
              <p className="mt-1.5 text-[11px] leading-[1.45] text-eos-text-muted">
                înainte ca primul scan să ruleze
              </p>
            </div>
          </div>
        </aside>

        {/* ── RIGHT — main content ────────────────────────────────────────── */}
        <main className="flex flex-col px-6 py-10 md:px-12 md:py-14 lg:px-20 lg:py-16">
          {/* phase chip + meta */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span
              className={[
                "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]",
                accent.iconBox,
                accent.text,
              ].join(" ")}
            >
              Pasul {phaseIndex + 1}
            </span>
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
              {phases[phaseIndex]?.label}
            </span>
            {(selectedIcp ?? currentMeta) && (
              <span
                className={[
                  "ml-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
                  accent.iconBox,
                ].join(" ")}
              >
                {/* Bug fix 2026-05-11: foloseam currentMeta.icon/badge din MODE_OPTIONS care
                    deduplica după mapsTo şi pierdea distincţia cabinet-dpo vs cabinet-fiscal.
                    Acum folosim ICP-ul ales direct, fallback la mode meta dacă lipseşte. */}
                {(() => {
                  const Icon = (selectedIcp?.icon ?? currentMeta?.icon)
                  return Icon ? (
                    <Icon
                      className={["size-3.5", accent.iconColor].join(" ")}
                      strokeWidth={1.75}
                    />
                  ) : null
                })()}
                <span className={["font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]", accent.text].join(" ")}>
                  {selectedIcp?.badge ?? currentMeta?.badge}
                </span>
              </span>
            )}
          </div>

          {/* ── Phase 1: mode selection ── */}
          {!currentMode && (
            <div className="max-w-2xl">
              <h1
                data-display-text="true"
                className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
                Cum vei folosi CompliScan?
              </h1>
              <p className="mt-3 max-w-xl text-[14px] leading-[1.65] text-eos-text-muted">
                Alege rolul care descrie cel mai bine modul în care lucrezi. Poți schimba
                ulterior din Setări.
              </p>

              <div className="mt-8 space-y-3">
                {ICP_OPTIONS.map((option) => {
                  const isSelected = selectedSegment === option.id
                  const optAccent = ACCENT_CLASSES[option.accent]
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => {
                        setSelectedSegment(option.id)
                        setSelectedMode(option.mapsTo)
                      }}
                      className={[
                        "group w-full rounded-eos-lg border bg-eos-surface p-5 text-left transition-all duration-150",
                        isSelected
                          ? `${optAccent.border} ${optAccent.bg} shadow-[0_0_0_1px_rgba(59,130,246,0.15)]`
                          : "border-eos-border hover:border-eos-border-strong hover:bg-white/[0.02]",
                      ].join(" ")}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={[
                            "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-eos-sm border transition-colors",
                            isSelected
                              ? `${optAccent.iconBox} ${optAccent.iconColor}`
                              : "border-eos-border bg-white/[0.03] text-eos-text-tertiary",
                          ].join(" ")}
                        >
                          <option.icon className="size-5" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p
                              className={[
                                "font-display text-[15px] font-semibold tracking-[-0.015em] transition-colors",
                                isSelected ? "text-eos-text" : "text-eos-text-muted",
                              ].join(" ")}
                            >
                              {option.label}
                            </p>
                            <span
                              className={[
                                "inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em]",
                                isSelected
                                  ? `${optAccent.badgeBg} ${optAccent.badgeText}`
                                  : "bg-white/[0.04] text-eos-text-tertiary",
                              ].join(" ")}
                            >
                              {option.badge}
                            </span>
                          </div>
                          <p
                            className={[
                              "mt-1.5 text-[13px] leading-[1.55] transition-colors",
                              isSelected ? "text-eos-text-muted" : "text-eos-text-tertiary",
                            ].join(" ")}
                          >
                            {option.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle2
                            className={["mt-1 size-5 shrink-0", optAccent.iconColor].join(" ")}
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {error && (
                <div className="mt-5 rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-4 py-3 font-mono text-[12px] text-eos-error">
                  {error}
                </div>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!selectedSegment || loading}
                  onClick={() => void handleConfirm()}
                  className={[
                    "inline-flex items-center gap-2 rounded-eos-sm px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition-all",
                    accent.progressBar,
                    "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
                  ].join(" ")}
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se salvează...
                    </>
                  ) : (
                    <>
                      Continuă cu profilul firmei
                      <ArrowRight className="size-4" strokeWidth={2.5} />
                    </>
                  )}
                </button>
                <p className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                  Pas 1 / {phases.length} · poate fi schimbat din Setări
                </p>
              </div>
            </div>
          )}

          {/* ── Phase 2 + 3: wizard / partner workspace ── */}
          {currentMode && (
            <div className="max-w-3xl">
              <h1
                data-display-text="true"
                className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
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
              <p className="mt-3 max-w-2xl text-[14px] leading-[1.65] text-eos-text-muted">
                {currentMode === "partner" ? (
                  <>Clienții se adaugă din portofoliu după configurare.</>
                ) : (
                  <>
                    {orgName ?? "Organizația ta"} · intri direct în{" "}
                    <span className="font-semibold text-eos-text">
                      {destination.summaryLabel}
                    </span>{" "}
                    la final
                  </>
                )}
              </p>

              {error && (
                <div className="mt-5 rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-4 py-3 font-mono text-[12px] text-eos-error">
                  {error}
                </div>
              )}

              <div className="mt-8">
                {currentMode === "partner" ? (
                  <PartnerWorkspaceStep
                    initialOrgName={orgName ?? ""}
                    onComplete={() => void handleOnboardingComplete()}
                    onBack={handleBackToModeSelection}
                    // Faza 0.5: cabinet-fiscal venit din /fiscal landing cu icp=
                    // în URL → auto-submit cu defaults (clientScale="1-5",
                    // cui="" — vine ulterior din Stripe). Nu mai întrebăm câmpuri
                    // redundante; clientScale se updatează automat după import CSV.
                    autoSubmit={shouldSkipRoleSelection && selectedSegment === "cabinet-fiscal"}
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

              <div className="mt-8 border-t border-eos-border pt-5">
                <button
                  type="button"
                  onClick={handleBackToModeSelection}
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                >
                  <ArrowLeft className="size-3.5" strokeWidth={2.5} />
                  Înapoi la alegerea rolului
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
