"use client"

import {
  ArrowRight,
  Bell,
  Clock3,
  Scan,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { Avatar, AvatarFallback } from "@/components/evidence-os/Avatar"
import type { WorkspaceContext } from "@/lib/compliance/types"

type RiskHeaderProps = {
  score: number
  riskLabel: string
  lastScanLabel: string
  activeRiskCount: number
  hasEvidence: boolean
  onScan: () => void
  workspace?: WorkspaceContext
}

function headerState(
  score: number,
  riskLabel: string,
  lastScanLabel: string,
  activeRiskCount: number,
  hasEvidence: boolean
) {
  const isOnboarding = !hasEvidence || lastScanLabel === "inca fara scan"
  const lower = riskLabel.toLowerCase()

  if (isOnboarding) {
    return {
      isOnboarding,
      ring: "var(--color-info)",
      badge:
        "border-[var(--status-info-border)] bg-[var(--status-info-bg-soft)] text-[var(--status-info-text)]",
      emphasis: "text-[var(--status-info-text)]",
      eyebrow: "Punct de start",
      statusLabel: "Fara baseline",
      scoreLabel: "scor de control curent",
      primaryMessage:
        "Nu ai suficiente dovezi pentru un verdict util. Scaneaza primul document si construieste baza reala de lucru.",
      actionTitle: "Scaneaza primul document",
      actionDescription:
        "Incarca un PDF, o imagine sau text manual. Dupa primul scan vezi riscurile reale, task-urile si dovada exportabila.",
      actionHint:
        "Flux: colectezi dovezi, primesti recomandare AI, apoi validezi uman.",
      ctaLabel: "Scaneaza primul document",
      ringLabel: "Pregatire",
    }
  }

  if (activeRiskCount === 0) {
    return {
      isOnboarding,
      ring: "var(--color-risk-low)",
      badge:
        "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]",
      emphasis: "text-[var(--color-success)]",
      eyebrow: "Baseline stabil",
      statusLabel: "0 riscuri active",
      scoreLabel: "scor curent de risc activ",
      primaryMessage:
        "Nu exista probleme active. Scanarile anterioare raman salvate ca istoric de control si dovada.",
      actionTitle: "Monitorizezi doar schimbarile reale",
      actionDescription:
        "Nu ai de inchis nimic acum. Rulezi un scan nou doar cand apar schimbari reale in documente, politici sau fluxuri.",
      actionHint:
        "Istoricul ramane salvat. Rescanezi doar la o versiune noua sau la o schimbare reala.",
      ctaLabel: "Mergi la Scanari",
      ringLabel: "Nicio problema activa",
    }
  }

  if (score === 0 || lower.includes("ridicat")) {
    return {
      isOnboarding,
      ring: "var(--color-risk-high)",
      badge:
        "border-[var(--color-error)] bg-[var(--color-error-muted)] text-[var(--color-error)]",
      emphasis: "text-[var(--color-error)]",
      eyebrow: "Risc prioritar",
      statusLabel: riskLabel,
      scoreLabel: "scor curent de risc",
      primaryMessage:
        "Semnalele colectate indica risc ridicat. Clarifica documentul critic, rezolva cauza principala si ruleaza din nou scanarea.",
      actionTitle: "Rezolva documentul critic si rescaneaza",
      actionDescription:
        "Nu deschide mai multe fronturi. Inchide mai intai cauza care blocheaza scorul, apoi reconfirma starea cu un nou scan.",
      actionHint: "Mai intai remediere, apoi un nou scan si verificare umana.",
      ctaLabel: "Scaneaza dupa remediere",
      ringLabel: riskLabel,
    }
  }

  if (lower.includes("mediu")) {
    return {
      isOnboarding,
      ring: "var(--color-risk-medium)",
      badge:
        "border-[var(--color-warning)] bg-[var(--color-warning-muted)] text-[var(--color-warning)]",
      emphasis: "text-[var(--color-warning)]",
      eyebrow: "Atentie moderata",
      statusLabel: riskLabel,
      scoreLabel: "scor curent de risc",
      primaryMessage:
        "Ai deja semnale utile. Urmatorul castig vine din clarificarea documentelor ambigue, nu din volum de scanari.",
      actionTitle: "Clarifica punctul ambiguu urmator",
      actionDescription:
        "Concentreaza-te pe documentul cel mai recent sau pe alerta deschisa cu impact real. Inchide un risc complet, apoi treci la urmatorul.",
      actionHint: "Mai putine scanari, mai multa claritate pe fiecare risc deschis.",
      ctaLabel: "Scaneaza documente",
      ringLabel: riskLabel,
    }
  }

  return {
    isOnboarding,
    ring: "var(--color-risk-low)",
    badge:
      "border-[var(--status-success-border)] bg-[var(--status-success-bg-soft)] text-[var(--status-success-text)]",
    emphasis: "text-[var(--color-success)]",
    eyebrow: "Control bun",
    statusLabel: riskLabel,
    scoreLabel: "scor curent de risc",
      primaryMessage:
      "Ai deja control bun asupra situatiei. Continui doar cand apare o schimbare reala in documente, politici sau fluxuri.",
    actionTitle: "Pastreaza ritmul si valideaza dovada",
    actionDescription:
      "Foloseste scanari noi doar pentru schimbari reale, apoi valideaza uman rezultatul si exporta dovada necesara.",
    actionHint: "Analizezi schimbarea, validezi manual, apoi exporti dovada.",
    ctaLabel: "Scaneaza documente",
    ringLabel: riskLabel,
  }
}

function lastScanMeta(lastScanLabel: string) {
  if (lastScanLabel === "inca fara scan") {
    return "Inca fara scan"
  }

  return lastScanLabel
}

function scoreCaption(score: number) {
  if (score === 100) return "control complet"
  if (score >= 75) return "control bun"
  if (score > 0) return "control partial"
  return "control minim"
}

export function RiskHeader({
  score,
  riskLabel,
  lastScanLabel,
  activeRiskCount,
  hasEvidence,
  onScan,
  workspace,
}: RiskHeaderProps) {
  const activeWorkspace = workspace ?? {
    orgId: "org-local-workspace",
    orgName: "Magazin Online S.R.L.",
    workspaceLabel: "Workspace local",
    workspaceOwner: "Ion Popescu",
    workspaceInitials: "IP",
  }
  const state = headerState(score, riskLabel, lastScanLabel, activeRiskCount, hasEvidence)
  const headerHighlights = [
    {
      id: "last-scan",
      label: "Ultimul scan",
      icon: Clock3,
      value: lastScanMeta(lastScanLabel),
      meta: hasEvidence ? "ultimul reper operational salvat" : "porneste primul scan",
      valueClassName: "text-[var(--color-on-surface)]",
    },
    {
      id: "open-risks",
      label: hasEvidence ? "Riscuri deschise" : "Stare curenta",
      icon: ShieldAlert,
      value: hasEvidence ? `${activeRiskCount}` : "Fara baseline",
      meta: hasEvidence
        ? activeRiskCount === 1
          ? "un risc cere inchidere"
          : `${state.statusLabel.toLowerCase()}`
        : "asteapta primul document analizat",
      valueClassName: hasEvidence && activeRiskCount > 0 ? state.emphasis : "text-[var(--color-on-surface)]",
    },
    {
      id: "operating-principle",
      label: activeRiskCount === 0 ? "Istoric" : "Principiu",
      icon: ShieldCheck,
      value: activeRiskCount === 0 ? "Dovada ramane salvata" : "AI propune, omul valideaza",
      meta:
        activeRiskCount === 0
          ? "rescanezi doar la schimbari reale"
          : "validarea umana inchide decizia oficiala",
      valueClassName: "text-[var(--color-on-surface)]",
    },
  ] as const

  return (
    <Card className="overflow-hidden border-[var(--color-border)] bg-[linear-gradient(180deg,var(--bg-panel-2),var(--card-bg))] shadow-[var(--shadow-xl)]">
      <CardContent className="px-5 py-5 md:px-8 md:py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--color-border)] pb-5">
          <CompliScanLogoLockup
            variant="flat"
            size="lg"
            subtitle="prioritizare AI cu validare umana"
            titleClassName="text-[var(--color-on-surface)]"
            subtitleClassName="text-[var(--color-muted)]"
          />

          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                {activeWorkspace.workspaceLabel}
              </p>
              <p className="mt-1 text-base font-semibold text-[var(--color-on-surface)]">
                {activeWorkspace.workspaceOwner}
              </p>
              <p className="text-sm text-[var(--color-muted)]">{activeWorkspace.orgName}</p>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)]"
              aria-label="Notificari"
            >
              <Bell className="size-4" strokeWidth={2.25} />
            </Button>
            <Avatar
              size="lg"
              className="border border-[var(--color-border)] bg-[var(--color-surface-variant)]"
            >
              <AvatarFallback className="bg-transparent text-[var(--color-on-surface)]">
                {activeWorkspace.workspaceInitials}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,380px)]">
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  {state.eyebrow}
                </Badge>
                <Badge className={state.badge}>{state.statusLabel}</Badge>
                {!state.isOnboarding && (
                  <Badge className="border-[var(--color-border)] bg-transparent text-[var(--color-on-surface-muted)]">
                    validare umana
                  </Badge>
                )}
              </div>

              <div className="max-w-4xl space-y-2.5">
                <div className="flex flex-wrap items-end gap-3 md:gap-5">
                  <h1 className="text-[38px] font-semibold leading-none tracking-tight text-[var(--color-on-surface)] md:text-[54px]">
                    {score}
                    <span className="ml-1 text-[0.42em] text-[var(--color-muted)]">/100</span>
                  </h1>
                  <div className="space-y-1 pb-2">
                    <p className="text-sm text-[var(--color-muted)] md:text-lg">
                      {state.scoreLabel}
                    </p>
                    <p className={`text-sm font-medium ${state.emphasis}`}>{scoreCaption(score)}</p>
                  </div>
                </div>

                <p className="max-w-3xl text-sm leading-6 text-[var(--color-on-surface-muted)] md:text-lg md:leading-7">
                  {state.primaryMessage}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {headerHighlights.map((item) => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-4"
                    >
                      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                        <Icon className="size-4" strokeWidth={2.25} />
                        {item.label}
                      </div>
                      <p className={`mt-2.5 text-base font-medium ${item.valueClassName}`}>{item.value}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--color-muted)]">{item.meta}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4 shadow-[inset_0_1px_0_0_var(--border-subtle)]">
            <div className="flex h-full flex-col justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--color-muted)]">
                  Pasul urmator
                </p>
                <h2 className="text-lg font-semibold leading-snug text-[var(--color-on-surface)] md:text-xl">
                  {state.actionTitle}
                </h2>
                <p className="text-sm leading-6 text-[var(--color-on-surface-muted)]">
                  {state.actionDescription}
                </p>
                <p className="text-xs leading-5 text-[var(--color-muted)]">
                  {state.actionHint}
                </p>
              </div>

              <Button
                onClick={onScan}
                className="h-11 w-full rounded-xl bg-[var(--color-primary)] px-5 font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] sm:w-auto"
              >
                <Scan className="size-4" strokeWidth={2.25} />
                {state.ctaLabel}
                <ArrowRight className="size-4" strokeWidth={2.25} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
