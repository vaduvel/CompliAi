"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ArrowUpRight,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { useTrackEvent } from "@/lib/client/use-track-event"
import { PLAN_LABELS, PLAN_PRICES, type OrgPlan } from "@/lib/shared/plan-constants"

// ── Types ─────────────────────────────────────────────────────────────────────

type PlanResponse = {
  plan: OrgPlan
  updatedAtISO: string
  trialEndsAtISO: string | null
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function PlanStatusBadge({ plan, trialEndsAtISO }: { plan: OrgPlan; trialEndsAtISO: string | null }) {
  const isTrialActive =
    trialEndsAtISO && trialEndsAtISO > new Date().toISOString()

  if (isTrialActive) {
    const daysLeft = Math.ceil(
      (new Date(trialEndsAtISO!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    return (
      <Badge variant="warning">
        <Clock className="size-3" strokeWidth={2} />
        Trial Pro — {daysLeft} zile rămase
      </Badge>
    )
  }

  if (plan === "partner") {
    return (
      <Badge variant="warning">
        <CheckCircle2 className="size-3" strokeWidth={2} />
        Partner activ
      </Badge>
    )
  }
  if (plan === "pro") {
    return (
      <Badge variant="success">
        <CheckCircle2 className="size-3" strokeWidth={2} />
        Pro activ
      </Badge>
    )
  }
  return (
    <Badge variant="secondary">
      Gratuit
    </Badge>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

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
        body: JSON.stringify({ targetPlan }),
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
      const r = await fetch("/api/stripe/portal", { method: "POST" })
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

  return (
    <div className="mx-auto max-w-2xl">
      <PageIntro
        title="Abonament"
        description="Gestionează planul și facturarea organizației tale."
      />

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Current plan card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-base">
                <CreditCard className="size-4 text-eos-text-muted" strokeWidth={2} />
                Plan curent
                <PlanStatusBadge plan={currentPlan} trialEndsAtISO={trialEndsAtISO} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-eos-text">
                    {PLAN_LABELS[currentPlan]}
                  </p>
                  <p className="mt-0.5 text-sm text-eos-text-muted">
                    {PLAN_PRICES[currentPlan]}
                    {isTrialActive && (
                      <span className="ml-2 text-eos-warning">
                        (trial activ — se termină{" "}
                        {new Date(trialEndsAtISO!).toLocaleDateString("ro-RO")})
                      </span>
                    )}
                  </p>
                  {planData?.updatedAtISO && (
                    <p className="mt-1 text-xs text-eos-text-muted">
                      Actualizat:{" "}
                      {new Date(planData.updatedAtISO).toLocaleDateString("ro-RO")}
                    </p>
                  )}
                </div>
                {planData?.hasActiveSubscription && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handlePortal()}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ExternalLink className="size-4" strokeWidth={2} />
                    )}
                    Gestionează în Stripe
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trial expiry warning */}
          {isTrialActive && currentPlan === "free" && (
            <div className="flex items-start gap-3 rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft px-4 py-3">
              <AlertTriangle
                className="mt-0.5 size-4 shrink-0 text-eos-warning"
                strokeWidth={2}
              />
              <div>
                <p className="text-sm font-medium text-eos-warning">
                  Trial Pro activ —{" "}
                  {Math.ceil(
                    (new Date(trialEndsAtISO!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                  )}{" "}
                  zile rămase
                </p>
                <p className="mt-0.5 text-xs text-eos-warning/80">
                  La expirarea trial-ului, accesul la funcțiile Pro va fi restricționat.
                  Fă upgrade înainte pentru a menține continuitatea.
                </p>
              </div>
            </div>
          )}

          {/* Upgrade options */}
          {currentPlan !== "partner" && (
            <div className="grid gap-4 sm:grid-cols-2">
              {currentPlan === "free" && (
                <Card className="border-eos-primary/30 bg-[linear-gradient(180deg,var(--eos-surface-primary),var(--eos-surface-elevated))]">
                  <CardContent className="pt-5">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-primary">
                      Pro
                    </p>
                    <p className="mt-1.5 text-2xl font-bold text-eos-text">
                      {PLAN_PRICES.pro}
                    </p>
                    <p className="mt-1 text-sm text-eos-text-muted">
                      Compliance ops complet — NIS2, AI Act, Audit Pack, Inspector Mode.
                    </p>
                    <Button
                      className="mt-4 w-full"
                      onClick={() => void handleUpgrade("pro")}
                      disabled={checkoutLoading !== null}
                    >
                      {checkoutLoading === "pro" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <ArrowUpRight className="size-4" strokeWidth={2} />
                      )}
                      Upgrade la Pro
                    </Button>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-warning">
                    Partner
                  </p>
                  <p className="mt-1.5 text-2xl font-bold text-eos-text">
                    {PLAN_PRICES.partner}
                  </p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Multi-client hub pentru contabili și consultanți.
                    Până la 50 clienți, import CSV, urgency queue.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 w-full"
                    onClick={() => void handleUpgrade("partner")}
                    disabled={checkoutLoading !== null}
                  >
                    {checkoutLoading === "partner" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="size-4" strokeWidth={2} />
                    )}
                    Upgrade la Partner
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Compare plans link */}
          <p className="text-sm text-eos-text-muted">
            Compară toate planurile pe{" "}
            <Link href="/pricing" className="text-eos-primary hover:underline">
              pagina de prețuri →
            </Link>
          </p>

          {/* Legal note */}
          <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3 text-xs text-eos-text-muted">
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
