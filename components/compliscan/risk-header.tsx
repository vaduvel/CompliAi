"use client"

import {
  ArrowRight,
  Clock3,
  Scan,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Avatar, AvatarFallback } from "@/components/evidence-os/Avatar"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
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
      badge:
        "border-eos-border bg-eos-primary-soft text-eos-primary",
      emphasis: "text-eos-primary",
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
    }
  }

  if (activeRiskCount === 0) {
    return {
      isOnboarding,
      badge:
        "border-eos-border bg-eos-success-soft text-eos-success",
      emphasis: "text-eos-success",
      eyebrow: "Baseline stabil",
      statusLabel: "0 riscuri active",
      scoreLabel: "scor curent de risc activ",
      primaryMessage:
        "Nu există probleme active. Scanările anterioare rămân salvate ca istoric de control și dovadă.",
      actionTitle: "Monitorizezi doar schimbările reale",
      actionDescription:
        "Nu ai de închis nimic acum. Rulezi un scan nou doar când apar schimbări reale în documente, politici sau fluxuri.",
      actionHint:
        "Istoricul ramane salvat. Rescanezi doar la o versiune noua sau la o schimbare reala.",
      ctaLabel: "Mergi la Scanari",
    }
  }

  if (score === 0 || lower.includes("ridicat")) {
    return {
      isOnboarding,
      badge:
        "border-eos-error-border bg-eos-error-soft text-eos-error",
      emphasis: "text-eos-error",
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
    }
  }

  if (lower.includes("mediu")) {
    return {
      isOnboarding,
      badge:
        "border-eos-warning-border bg-eos-warning-soft text-eos-warning",
      emphasis: "text-eos-warning",
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
    }
  }

  return {
    isOnboarding,
    badge:
      "border-eos-border bg-eos-success-soft text-eos-success",
    emphasis: "text-eos-success",
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
    workspaceLabel: "Spațiu de lucru local",
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
      valueClassName: "text-eos-text",
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
      valueClassName: hasEvidence && activeRiskCount > 0 ? state.emphasis : "text-eos-text",
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
      valueClassName: "text-eos-text",
    },
  ] as const

  const summaryItems: SummaryStripItem[] = headerHighlights.map((item) => ({
    label: item.label,
    value: item.value,
    hint: item.meta,
    tone:
      item.id === "open-risks" && hasEvidence && activeRiskCount > 0
        ? score === 0 || riskLabel.toLowerCase().includes("ridicat")
          ? "danger"
          : "warning"
        : item.id === "operating-principle" && activeRiskCount === 0
          ? "success"
          : "neutral",
  }))

  return (
    <section className="space-y-4">
      <PageIntro
        eyebrow="Tablou de bord"
        badges={
          <>
            <Badge className="border-eos-border bg-eos-surface-variant px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-eos-text-muted">
              {state.eyebrow}
            </Badge>
            <Badge className={state.badge}>{state.statusLabel}</Badge>
          </>
        }
        title={state.actionTitle}
        description={state.primaryMessage}
        aside={
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar size="lg" className="border border-eos-border bg-eos-surface-variant">
                <AvatarFallback className="bg-transparent text-eos-text">
                  {activeWorkspace.workspaceInitials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-tertiary">
                  {activeWorkspace.workspaceLabel}
                </p>
                <p className="mt-1 truncate text-base font-semibold text-eos-text">
                  {activeWorkspace.workspaceOwner}
                </p>
                <p className="truncate text-sm text-eos-text-muted">{activeWorkspace.orgName}</p>
              </div>
            </div>

            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-4">
              <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-tertiary">
                {state.scoreLabel}
              </p>
              <div className="mt-3 flex items-end gap-2">
                <div className="text-4xl font-semibold leading-none tracking-tight text-eos-text">
                  {score}
                </div>
                <div className="pb-1 text-sm text-eos-text-muted">/100</div>
              </div>
              <p className={`mt-2 text-sm font-medium ${state.emphasis}`}>{scoreCaption(score)}</p>
            </div>
          </div>
        }
        actions={
          <Button
            onClick={onScan}
            size="lg"
            className="w-full gap-2 sm:w-auto"
          >
            <Scan className="size-5" strokeWidth={2} />
            {state.ctaLabel}
            <ArrowRight className="size-5" strokeWidth={2} />
          </Button>
        }
      />

      <SummaryStrip
        eyebrow="Indicatori de orientare"
        title="Ce urmaresti inainte sa deschizi un nou front"
        items={summaryItems}
      />
    </section>
  )
}
