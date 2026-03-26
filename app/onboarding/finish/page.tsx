"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, ArrowRight, Shield } from "lucide-react"
import { useTrackEvent } from "@/lib/client/use-track-event"

const ACHIEVEMENTS = [
  "Asta ți se aplică: reglementările relevante pentru firma ta sunt mapate în workspace.",
  "Asta am găsit deja: primele findings și documente recomandate sunt pregătite.",
  "Asta facem acum: ai deja prima acțiune clară către cockpitul de rezolvare.",
  "Tot ce închizi de acum poate merge la dosar și apoi în monitorizare.",
]

export default function OnboardingFinishPage() {
  const router = useRouter()
  const { trackOnce, track } = useTrackEvent()

  // If user lands here by accident (e.g. after a refresh without completing onboarding),
  // this page is still safe to show — it just links to dashboard.
  useEffect(() => {
    trackOnce("onboarding_finish_viewed")
    if (typeof window !== "undefined" && (window as Window & { _cai?: { track: (e: string) => void } })._cai?.track) {
      (window as Window & { _cai?: { track: (e: string) => void } })._cai!.track("onboarding_finish_viewed")
    }
  }, [trackOnce])

  function handleCtaClick() {
    track("onboarding_finish_cta_clicked")
    if (typeof window !== "undefined" && (window as Window & { _cai?: { track: (e: string) => void } })._cai?.track) {
      (window as Window & { _cai?: { track: (e: string) => void } })._cai!.track("onboarding_finish_cta_clicked")
    }
    router.push("/dashboard?focus=accumulation")
  }

  function handleResolveClick() {
    track("onboarding_finish_resolve_clicked")
    if (typeof window !== "undefined" && (window as Window & { _cai?: { track: (e: string) => void } })._cai?.track) {
      (window as Window & { _cai?: { track: (e: string) => void } })._cai!.track("onboarding_finish_resolve_clicked")
    }
    router.push("/dashboard/resolve")
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,var(--eos-accent-primary-subtle),transparent_32%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="flex items-center justify-center gap-2 mb-10">
          <Shield className="size-6 text-eos-primary" strokeWidth={1.5} />
          <span className="text-sm font-semibold tracking-tight text-eos-text-primary">CompliAI</span>
        </div>

        {/* Card */}
        <div className="rounded-eos-xl border border-eos-border bg-eos-surface-secondary shadow-eos-md p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="size-7 text-emerald-500" strokeWidth={1.5} />
            </div>
            <h1 className="text-xl font-semibold text-eos-text-primary">
              Primul snapshot este gata
            </h1>
            <p className="mt-1.5 text-sm text-eos-text-muted">
              Asta ți se aplică, asta am găsit deja și asta vei face acum
            </p>
          </div>

          {/* Achievement list */}
          <ul className="space-y-3 mb-8">
            {ACHIEVEMENTS.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" strokeWidth={2} />
                <span className="text-sm text-eos-text-primary">{text}</span>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="space-y-3">
            <button
              onClick={handleCtaClick}
              className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-eos-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-eos-primary/90 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary/50"
            >
              Văd ce am acumulat
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
            <button
              onClick={handleResolveClick}
              className="flex w-full items-center justify-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3 text-sm font-semibold text-eos-text shadow-sm transition-all hover:bg-eos-surface-primary active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eos-primary/50"
            >
              Merg la prima acțiune
              <ArrowRight className="size-4" strokeWidth={2} />
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-eos-text-muted">
            Datele tale sunt păstrate în siguranță și rămân disponibile pentru dosar, audit și handoff
          </p>
        </div>
      </div>
    </div>
  )
}
