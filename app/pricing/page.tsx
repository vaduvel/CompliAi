import Link from "next/link"
import { Check, X, ArrowRight, Zap } from "lucide-react"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { PricingVisitTracker } from "@/components/compliscan/pricing-visit-tracker"
import { Button } from "@/components/evidence-os/Button"
import { Badge } from "@/components/evidence-os/Badge"
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/server/plan"

// ── Feature lists per plan ────────────────────────────────────────────────────

type FeatureRow = {
  label: string
  free: boolean | string
  pro: boolean | string
  partner: boolean | string
}

const FEATURES: FeatureRow[] = [
  { label: "Applicability Engine (ce legi ți se aplică)", free: true, pro: true, partner: true },
  { label: "Scor general conformitate", free: true, pro: true, partner: true },
  { label: "Profil organizație (CUI, sector, angajați)", free: true, pro: true, partner: true },
  { label: "1 document generat (sample)", free: true, pro: true, partner: true },
  { label: "Toate documentele generate (PDF)", free: false, pro: true, partner: true },
  { label: "Findings complet + Resolution Layer", free: false, pro: true, partner: true },
  { label: "NIS2 complet (assessment, DNSC, incidente, vendori)", free: false, pro: true, partner: true },
  { label: "AI Act complet (inventar, Annex IV, timeline)", free: false, pro: true, partner: true },
  { label: "e-Factura Signal Dashboard", free: false, pro: true, partner: true },
  { label: "Audit Pack + One-Page Report + Response Pack", free: false, pro: true, partner: true },
  { label: "Health Check periodic", free: false, pro: true, partner: true },
  { label: "Inspector Mode / Simulare Control", free: false, pro: true, partner: true },
  { label: "Weekly digest email", free: false, pro: true, partner: true },
  { label: "Multi-client hub (până la 50 clienți)", free: false, pro: false, partner: true },
  { label: "Import bulk CSV clienți", free: false, pro: false, partner: true },
  { label: "Drill-down + export per client", free: false, pro: false, partner: true },
  { label: "Urgency queue contabil", free: false, pro: false, partner: true },
]

// ── Plan card config ──────────────────────────────────────────────────────────

const PLANS = [
  {
    id: "free" as const,
    label: PLAN_LABELS.free,
    price: PLAN_PRICES.free,
    subtitle: "Diagnostic gratuit. Afli ce ți se aplică.",
    highlight: false,
    badge: null,
    cta: "Începe gratuit",
    ctaHref: "/login",
    ctaVariant: "outline" as const,
  },
  {
    id: "pro" as const,
    label: PLAN_LABELS.pro,
    price: PLAN_PRICES.pro,
    subtitle: "Compliance ops complet pentru organizația ta.",
    highlight: true,
    badge: "Cel mai ales",
    cta: "Pornește Pro — 14 zile gratuit",
    ctaHref: "/login",
    ctaVariant: "default" as const,
  },
  {
    id: "partner" as const,
    label: PLAN_LABELS.partner,
    price: PLAN_PRICES.partner,
    subtitle: "Gestionezi conformitatea pentru mai mulți clienți.",
    highlight: false,
    badge: null,
    cta: "Contactează-ne",
    ctaHref: "mailto:contact@compliscan.ro",
    ctaVariant: "outline" as const,
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--eos-accent-primary-subtle),transparent_28%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] text-eos-text">
      <PricingVisitTracker />
      {/* Nav */}
      <header className="border-b border-eos-border-subtle bg-eos-surface-primary/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Conectare</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">
                Începe gratuit <ArrowRight className="ml-1.5 size-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        {/* Hero */}
        <div className="mb-12 text-center">
          <Badge variant="default" className="mb-4">
            <Zap className="size-3" strokeWidth={2} />
            Prețuri clare, fără surprize
          </Badge>
          <h1 className="font-display text-3xl font-semibold leading-tight text-eos-text md:text-4xl">
            Alege planul potrivit
          </h1>
          <p className="mt-3 text-sm text-eos-text-muted md:text-base">
            Toate planurile includ trial gratuit de 14 zile pentru funcțiile Pro.
            <br />
            Prețurile sunt ipoteze de validare de piață — se pot ajusta.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-eos-xl border p-6 ${
                plan.highlight
                  ? "border-eos-primary bg-[linear-gradient(180deg,var(--eos-surface-primary),var(--eos-surface-elevated))] shadow-[0_0_0_1px_var(--eos-primary),var(--eos-shadow-lg)]"
                  : "border-eos-border-subtle bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant="default" className="px-3 py-1 text-[11px]">
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
                  {plan.label}
                </p>
                <div className="mt-2 flex items-end gap-1">
                  <span className="text-3xl font-bold text-eos-text">
                    {plan.price.split(" / ")[0]}
                  </span>
                  {plan.price.includes("/") && (
                    <span className="mb-1 text-sm text-eos-text-muted">/ lună</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-eos-text-muted">{plan.subtitle}</p>
              </div>

              <Button asChild variant={plan.ctaVariant} className="w-full">
                <Link href={plan.ctaHref}>{plan.cta}</Link>
              </Button>

              <div className="mt-6 space-y-3">
                {FEATURES.filter((f) => {
                  const val = f[plan.id]
                  return val === true || typeof val === "string"
                })
                  .slice(0, 8)
                  .map((feature) => (
                    <div key={feature.label} className="flex items-start gap-2.5">
                      <Check
                        className="mt-0.5 size-4 shrink-0 text-eos-success"
                        strokeWidth={2.5}
                      />
                      <span className="text-sm text-eos-text">
                        {typeof feature[plan.id] === "string"
                          ? (feature[plan.id] as string)
                          : feature.label}
                      </span>
                    </div>
                  ))}
                {FEATURES.filter((f) => f[plan.id] === false).length > 0 && (
                  <div className="mt-1 space-y-2 opacity-50">
                    {FEATURES.filter((f) => f[plan.id] === false)
                      .slice(0, 3)
                      .map((feature) => (
                        <div key={feature.label} className="flex items-start gap-2.5">
                          <X className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                          <span className="text-sm text-eos-text-muted line-through">
                            {feature.label}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Full comparison table */}
        <div className="mt-16">
          <h2 className="mb-6 text-center text-xl font-semibold text-eos-text">
            Comparație completă
          </h2>
          <div className="overflow-x-auto rounded-eos-xl border border-eos-border-subtle bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-eos-border-subtle">
                  <th className="px-4 py-3 text-left font-medium text-eos-text-muted">
                    Funcționalitate
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.id}
                      className={`px-4 py-3 text-center font-semibold ${
                        p.highlight ? "text-eos-primary" : "text-eos-text"
                      }`}
                    >
                      {p.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FEATURES.map((feature, i) => (
                  <tr
                    key={feature.label}
                    className={`border-b border-eos-border-subtle ${
                      i % 2 === 0 ? "bg-transparent" : "bg-eos-surface/40"
                    }`}
                  >
                    <td className="px-4 py-3 text-eos-text">{feature.label}</td>
                    {PLANS.map((p) => {
                      const val = feature[p.id]
                      return (
                        <td key={p.id} className="px-4 py-3 text-center">
                          {val === true ? (
                            <Check
                              className="mx-auto size-4 text-eos-success"
                              strokeWidth={2.5}
                            />
                          ) : val === false ? (
                            <X
                              className="mx-auto size-4 text-eos-text-muted opacity-30"
                              strokeWidth={2}
                            />
                          ) : (
                            <span className="text-xs text-eos-text">{val}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ / note */}
        <div className="mt-12 rounded-eos-xl border border-eos-border-subtle bg-eos-surface-primary px-6 py-6 text-sm text-eos-text-muted">
          <h3 className="mb-3 font-semibold text-eos-text">Întrebări frecvente</h3>
          <div className="space-y-3">
            <p>
              <span className="font-medium text-eos-text">Ce înseamnă trial 14 zile?</span>{" "}
              La înregistrare primești automat 14 zile de acces Pro gratuit. Nu este nevoie de card.
            </p>
            <p>
              <span className="font-medium text-eos-text">Pot schimba planul oricând?</span>{" "}
              Da. Upgrade și downgrade sunt disponibile din Setări → Abonament.
            </p>
            <p>
              <span className="font-medium text-eos-text">Prețurile sunt finale?</span>{" "}
              Prețurile actuale sunt ipoteze de validare de piață. Primii utilizatori pilot pot
              beneficia de condiții speciale — contactează-ne.
            </p>
            <p>
              <span className="font-medium text-eos-text">Partener / contabil?</span>{" "}
              Planul Partner e pentru firme de contabilitate, consultanți și integratori care
              gestionează conformitatea pentru mai mulți clienți.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle bg-eos-surface-primary py-8">
        <div className="mx-auto max-w-5xl px-6">
          <LegalDisclaimer variant="short" />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-eos-text-muted">
            <Link href="/terms" className="hover:text-eos-text">
              Termeni și condiții
            </Link>
            <Link href="/privacy" className="hover:text-eos-text">
              Politica de confidențialitate
            </Link>
            <Link href="/dpa" className="hover:text-eos-text">
              DPA
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
