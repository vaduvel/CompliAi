"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3Panel } from "@/components/compliscan/v3/panel"
import { useTrackEvent } from "@/lib/client/use-track-event"
import { PLAN_LABELS, PLAN_PRICES, type OrgPlan } from "@/lib/shared/plan-constants"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

type PlanResponse = {
  plan: OrgPlan
  updatedAtISO: string
  trialEndsAtISO: string | null
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
  userMode: "solo" | "partner" | "compliance" | "viewer" | null
  canManageOrgBilling: boolean
}

const pillBase =
  "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium tracking-[0.02em]"

function PlanStatusPill({ plan, trialEndsAtISO }: { plan: OrgPlan; trialEndsAtISO: string | null }) {
  const isTrialActive =
    !!trialEndsAtISO && trialEndsAtISO > new Date().toISOString()

  if (isTrialActive) {
    const daysLeft = Math.ceil(
      (new Date(trialEndsAtISO!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return (
      <span className={`${pillBase} border-eos-warning/30 bg-eos-warning-soft text-eos-warning`}>
        <Clock className="size-3" strokeWidth={2} />
        Trial Pro — {daysLeft} zile rămase
      </span>
    )
  }

  if (plan === "partner") {
    return (
      <span className={`${pillBase} border-eos-warning/30 bg-eos-warning-soft text-eos-warning`}>
        <CheckCircle2 className="size-3" strokeWidth={2} />
        Partner activ
      </span>
    )
  }
  if (plan === "pro") {
    return (
      <span className={`${pillBase} border-eos-success/30 bg-eos-success-soft text-eos-success`}>
        <CheckCircle2 className="size-3" strokeWidth={2} />
        Pro activ
      </span>
    )
  }
  return (
    <span className={`${pillBase} border-eos-border bg-eos-surface-elevated text-eos-text-muted`}>
      Gratuit
    </span>
  )
}

const btnPrimary =
  "flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-primary bg-eos-primary px-3 text-[12.5px] font-semibold text-white transition hover:bg-eos-primary-hover disabled:opacity-40"
const btnOutline =
  "flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:opacity-40"

export function SettingsBillingPageSurface() {
  const { track } = useTrackEvent()
  const [planData, setPlanData] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<OrgPlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch("/api/plan")
      .then((r) => r.json() as Promise<PlanResponse>)
      .then(setPlanData)
      .catch(() => toast.error("Nu am putut citi planul curent."))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpgrade(targetPlan: OrgPlan) {
    setCheckoutLoading(targetPlan)
    try {
      const r = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPlan, billingScope: "org" }),
      })
      const data = (await r.json()) as { url?: string; demo?: boolean; error?: string }
      if (!r.ok || !data.url) {
        throw new Error(data.error ?? "Checkout a eșuat.")
      }
      if (data.demo) {
        toast.info("Stripe nu este configurat — mod demo")
        return
      }
      track("started_checkout_not_completed", { targetPlan })
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout a eșuat.")
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const r = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingScope: "org" }),
      })
      const data = (await r.json()) as { url?: string; error?: string }
      if (!r.ok || !data.url) {
        throw new Error(data.error ?? "Portalul Stripe a eșuat.")
      }
      window.location.href = data.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Portalul nu este disponibil.")
    } finally {
      setPortalLoading(false)
    }
  }

  const currentPlan = planData?.plan ?? "free"
  const trialEndsAtISO = planData?.trialEndsAtISO ?? null
  const isTrialActive = !!trialEndsAtISO && trialEndsAtISO > new Date().toISOString()
  const isPartnerUser = planData?.userMode === "partner"
  const canManageOrgBilling = planData?.canManageOrgBilling ?? false

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/dashboard/settings"
        className="inline-flex items-center gap-1.5 font-mono text-[11px] text-eos-text-muted transition-colors hover:text-eos-text"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Înapoi la Setări
      </Link>

      <V3PageHero
        breadcrumbs={[{ label: "Setări" }, { label: "Abonament", current: true }]}
        title="Abonament"
        description="Gestionează planul și facturarea organizației tale."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-[12.5px] text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă...
        </div>
      ) : (
        <div className="mt-6 space-y-5">
          {isPartnerUser ? (
            <div className="rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft px-4 py-3 text-[12.5px] text-eos-warning">
              <p className="font-medium text-eos-text">Facturarea consultantului s-a mutat în Setări cont</p>
              <p className="mt-1 text-[12px] leading-[1.5] text-eos-warning/90">
                Billingul partner se gestionează la nivel de cont. Pagina curentă rămâne doar pentru planul firmei active.
              </p>
              <div className="mt-3">
                <Link href={dashboardRoutes.accountSettings} className={btnOutline}>
                  Deschide Setări cont
                </Link>
              </div>
            </div>
          ) : null}

          {/* Current plan panel */}
          <V3Panel
            eyebrow={
              <span className="inline-flex items-center gap-1.5">
                <CreditCard className="size-3 text-eos-text-tertiary" strokeWidth={2} />
                Plan curent
              </span>
            }
            title={PLAN_LABELS[currentPlan]}
            action={<PlanStatusPill plan={currentPlan} trialEndsAtISO={trialEndsAtISO} />}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p
                  data-display-text="true"
                  className="font-display text-[22px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-eos-text"
                >
                  {PLAN_PRICES[currentPlan]}
                </p>
                {isTrialActive && (
                  <p className="mt-1 text-[12px] text-eos-warning">
                    (trial activ — se termină {new Date(trialEndsAtISO!).toLocaleDateString("ro-RO")})
                  </p>
                )}
                {planData?.updatedAtISO && (
                  <p className="mt-1 font-mono text-[11px] text-eos-text-muted">
                    Actualizat: {new Date(planData.updatedAtISO).toLocaleDateString("ro-RO")}
                  </p>
                )}
              </div>
              {planData?.hasActiveSubscription && canManageOrgBilling && (
                <button
                  type="button"
                  onClick={() => void handlePortal()}
                  disabled={portalLoading}
                  className={btnOutline}
                >
                  {portalLoading ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ExternalLink className="size-3.5" strokeWidth={2} />
                  )}
                  Gestionează în Stripe
                </button>
              )}
            </div>
            {!canManageOrgBilling ? (
              <p className="mt-3 text-[11px] text-eos-text-muted">
                Doar owner-ul poate modifica billingul firmei active.
              </p>
            ) : null}
          </V3Panel>

          {/* Trial expiry warning */}
          {isTrialActive && currentPlan === "free" && (
            <div className="flex items-start gap-3 rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft px-4 py-3">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-eos-warning"
                strokeWidth={2}
              />
              <div>
                <p className="text-[12.5px] font-medium text-eos-warning">
                  Trial Pro activ —{" "}
                  {Math.ceil(
                    (new Date(trialEndsAtISO!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )}{" "}
                  zile rămase
                </p>
                <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-warning/80">
                  La expirarea trial-ului, accesul la funcțiile Pro va fi restricționat.
                  Fă upgrade înainte pentru a menține continuitatea.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade options */}
          {currentPlan !== "partner" && currentPlan === "free" && (
            <section className="relative overflow-hidden rounded-eos-lg border border-eos-primary/30 bg-eos-surface">
              <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary" aria-hidden />
              <div className="px-4 py-4">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                  Pro
                </p>
                <p
                  data-display-text="true"
                  className="mt-1.5 font-display text-[24px] font-semibold leading-none tracking-[-0.02em] tabular-nums text-eos-text"
                >
                  {PLAN_PRICES.pro}
                </p>
                <p className="mt-1.5 text-[12.5px] text-eos-text-muted">
                  Compliance ops complet — NIS2, AI Act, Audit Pack, Inspector Mode.
                </p>
                <button
                  type="button"
                  className={`${btnPrimary} mt-4 w-full justify-center`}
                  onClick={() => void handleUpgrade("pro")}
                  disabled={checkoutLoading !== null || !canManageOrgBilling}
                >
                  {checkoutLoading === "pro" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="size-3.5" strokeWidth={2} />
                  )}
                  Upgrade la Pro
                </button>
              </div>
            </section>
          )}

          {/* Compare plans link */}
          <p className="text-[12.5px] text-eos-text-muted">
            Compară toate planurile pe{" "}
            <Link href="/pricing" className="text-eos-primary hover:underline">
              pagina de prețuri →
            </Link>
          </p>

          {/* Legal note */}
          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-4 py-3 text-[11px] text-eos-text-muted">
            Facturarea este procesată prin Stripe. Nu stocăm date de card.{" "}
            <Link href="/terms" className="hover:text-eos-text">
              Termeni și condiții
            </Link>{" "}
            ·{" "}
            <Link href="/privacy" className="hover:text-eos-text">
              Politica de confidențialitate
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
