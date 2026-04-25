"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  CreditCard,
  ExternalLink,
  Loader2,
  UserRound,
} from "lucide-react"
import { toast } from "sonner"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import {
  PARTNER_ACCOUNT_PLAN_LABELS,
  PARTNER_ACCOUNT_PLAN_LIMITS,
  type PartnerAccountPlan,
} from "@/lib/shared/plan-constants"

type AccountPlanResponse = {
  plan: "free" | "pro" | "partner"
  updatedAtISO: string
  trialEndsAtISO: string | null
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
  userMode: "solo" | "partner" | "compliance" | "viewer" | null
  billingScope: "org" | "partner_account"
  planType: PartnerAccountPlan | null
  maxOrgs: number | null
  currentOrgs: number
  canAddOrg: boolean
  partnerPlanSource: "account" | "legacy_org_partner" | "trial"
  partnerHasStripeCustomer: boolean
  partnerHasActiveSubscription: boolean
  partnerUpdatedAtISO: string | null
  canManageOrgBilling: boolean
  canManagePartnerBilling: boolean
}

const PARTNER_PLAN_OPTIONS: PartnerAccountPlan[] = ["partner_10", "partner_25", "partner_50"]

export function AccountSettingsPageSurface() {
  const currentUser = useDashboardRuntime()
  const [planData, setPlanData] = useState<AccountPlanResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState<PartnerAccountPlan | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)

  useEffect(() => {
    fetch("/api/plan")
      .then((response) => response.json() as Promise<AccountPlanResponse>)
      .then(setPlanData)
      .catch(() => toast.error("Nu am putut încărca setările contului."))
      .finally(() => setLoading(false))
  }, [])

  async function handleCheckout(targetPlan: PartnerAccountPlan) {
    setCheckoutLoading(targetPlan)
    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingScope: "account", targetPlan }),
      })
      const payload = (await response.json()) as { url?: string; demo?: boolean; error?: string }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Checkout-ul pentru contul partner a eșuat.")
      }
      if (payload.demo) {
        toast.info("Stripe nu este configurat — mod demo")
        return
      }
      window.location.href = payload.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout-ul a eșuat.")
    } finally {
      setCheckoutLoading(null)
    }
  }

  async function handlePortal() {
    setPortalLoading(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ billingScope: "account" }),
      })
      const payload = (await response.json()) as { url?: string; error?: string }
      if (!response.ok || !payload.url) {
        throw new Error(payload.error ?? "Portalul Stripe nu este disponibil.")
      }
      window.location.href = payload.url
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Portalul Stripe nu este disponibil.")
    } finally {
      setPortalLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" />
        Se încarcă setările contului...
      </div>
    )
  }

  if (!planData || !currentUser) {
    return (
      <div className="rounded-eos-md border border-eos-border bg-eos-surface p-4 text-sm text-eos-text-muted">
        Nu am putut încărca setările contului.
      </div>
    )
  }

  const isPartner = planData.userMode === "partner"
  const slotUsageLabel =
    planData.maxOrgs !== null ? `${planData.currentOrgs} / ${planData.maxOrgs} firme` : `${planData.currentOrgs} firme`

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Cont" }, { label: "Setări cont", current: true }]}
        title="Setări cont"
        description="Gestionezi identitatea contului și, dacă lucrezi în modul partner, planul care guvernează capacitatea portofoliului."
        eyebrowBadges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {currentUser.email}
            </Badge>
            <Badge variant="secondary" className="normal-case tracking-normal">
              Mod: {planData.userMode ?? "neales"}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              Spațiu de lucru: {currentUser.workspaceMode}
            </Badge>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4 text-eos-text-muted" strokeWidth={2} />
              Identitate cont
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-eos-text-muted">
            <div className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
              <BriefcaseBusiness className="mt-0.5 size-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
              <div>
                <p className="font-medium text-eos-text">Mod de lucru</p>
                <p className="mt-1 leading-6">
                  {isPartner
                    ? "Contul tău este în modul partner. Planul de cont limitează câte firme poți administra simultan în portofoliu."
                    : "Contul tău nu folosește facturare partner. Planul comercial rămâne gestionat la nivel de firmă activă."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
              <Building2 className="mt-0.5 size-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
              <div>
                <p className="font-medium text-eos-text">Acces firme</p>
                <p className="mt-1 leading-6">
                  {isPartner
                    ? `Portofoliul tău activ conține ${slotUsageLabel}. Intrarea în firmă se face din portofoliu sau prin selectorul de workspace.`
                    : `Spațiul de lucru activ rămâne ${currentUser.orgName}. Pentru billingul firmei active folosește pagina de abonament per-org.`}
                </p>
              </div>
            </div>

            {!isPartner ? (
              <div className="pt-1">
                <Button asChild size="sm" variant="outline">
                  <Link href={dashboardRoutes.settingsBilling}>Mergi la abonamentul firmei active</Link>
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4 text-eos-text-muted" strokeWidth={2} />
              Plan cont partner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isPartner ? (
              <>
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">
                        {planData.partnerPlanSource === "trial"
                          ? "Trial portofoliu activ"
                          : planData.planType
                          ? PARTNER_ACCOUNT_PLAN_LABELS[planData.planType]
                          : "Niciun plan partner activ"}
                      </p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {planData.maxOrgs !== null
                          ? `Capacitate: ${slotUsageLabel}`
                          : "Fără capacitate de a adăuga firme noi până alegi un plan."}
                      </p>
                    </div>
                    {planData.planType ? (
                      <Badge
                        variant={planData.canAddOrg ? "success" : "warning"}
                        className="normal-case tracking-normal"
                      >
                        {planData.canAddOrg ? "Mai poți adăuga firme" : "Limită atinsă"}
                      </Badge>
                    ) : planData.partnerPlanSource === "trial" ? (
                      <Badge variant="secondary" className="normal-case tracking-normal">
                        Trial
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="normal-case tracking-normal">
                        Plan necesar
                      </Badge>
                    )}
                  </div>
                  {planData.partnerUpdatedAtISO ? (
                    <p className="mt-2 text-[11px] text-eos-text-tertiary">
                      Actualizat: {new Date(planData.partnerUpdatedAtISO).toLocaleDateString("ro-RO")}
                    </p>
                  ) : null}
                </div>

                {planData.partnerPlanSource === "legacy_org_partner" ? (
                  <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft p-3 text-sm text-eos-warning">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                      <div>
                        <p className="font-medium text-eos-text">Compatibilitate legacy activă</p>
                        <p className="mt-1 text-xs leading-5 text-eos-warning/90">
                          Ai acces partner moștenit dintr-un plan vechi per-firmă. Poți continua să lucrezi, dar planul de cont trebuie migrat aici pentru management comercial clar.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : null}

                {planData.partnerHasActiveSubscription ? (
                  <Button variant="outline" size="sm" onClick={() => void handlePortal()} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="size-4 animate-spin" /> : <ExternalLink className="size-4" strokeWidth={2} />}
                    Gestionează în Stripe
                  </Button>
                ) : null}
              </>
            ) : (
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-sm text-eos-text-muted">
                Billingul de cont partner apare doar pentru utilizatorii care operează în modul partner.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {isPartner ? (
        <div className="grid gap-4 md:grid-cols-3">
          {PARTNER_PLAN_OPTIONS.map((plan) => {
            const isCurrent = planData.planType === plan
            return (
              <Card
                key={plan}
                className={isCurrent ? "border-eos-primary/40 bg-[linear-gradient(180deg,var(--eos-surface-primary),var(--eos-surface-elevated))]" : ""}
              >
                <CardContent className="pt-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-primary">
                    {PARTNER_ACCOUNT_PLAN_LABELS[plan]}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-eos-text">
                    {PARTNER_ACCOUNT_PLAN_LIMITS[plan]} firme
                  </p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Capacitate de portofoliu pentru consultanți care lucrează cross-client în CompliScan.
                  </p>
                  <Button
                    className="mt-4 w-full"
                    variant={isCurrent ? "secondary" : "outline"}
                    disabled={checkoutLoading !== null || isCurrent || !planData.canManagePartnerBilling}
                    onClick={() => void handleCheckout(plan)}
                  >
                    {checkoutLoading === plan ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : isCurrent ? (
                      <CheckCircle2 className="size-4" strokeWidth={2} />
                    ) : (
                      <ArrowUpRight className="size-4" strokeWidth={2} />
                    )}
                    {isCurrent ? "Plan activ" : "Alege planul"}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
