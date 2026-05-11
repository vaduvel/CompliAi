import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  Briefcase,
  Building2,
  Check,
  ShieldCheck,
  X,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { PricingVisitTracker } from "@/components/compliscan/pricing-visit-tracker"
import { PLAN_LABELS, PLAN_PRICES } from "@/lib/server/plan"

export const metadata: Metadata = {
  title: "Prețuri CompliScan — Free, Pro și Partner",
  description:
    "Alege planul CompliScan potrivit: diagnostic gratuit, Pro pentru firma ta sau Partner pentru consultanți și contabili care gestionează mai mulți clienți.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Prețuri CompliScan — Free, Pro și Partner",
    description:
      "Diagnostic gratuit, Pro pentru firma ta sau Partner pentru consultanți și contabili.",
    url: "/pricing",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Prețuri CompliScan — Free, Pro și Partner",
    description:
      "Alege planul pentru diagnostic, execuție în firmă sau portofoliu multi-client.",
  },
}

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
  { label: "e-Factura Signal — tablou semnale fiscale", free: false, pro: true, partner: true },
  { label: "Audit Pack + One-Page Report + Response Pack", free: false, pro: true, partner: true },
  { label: "Health Check periodic", free: false, pro: true, partner: true },
  { label: "Inspector Mode / Simulare Control", free: false, pro: true, partner: true },
  { label: "Weekly digest email", free: false, pro: true, partner: true },
  { label: "Multi-client hub (până la 50 clienți)", free: false, pro: false, partner: true },
  { label: "Import bulk CSV clienți", free: false, pro: false, partner: true },
  { label: "Drill-down + export per client", free: false, pro: false, partner: true },
  { label: "Urgency queue contabil", free: false, pro: false, partner: true },
]

// ── Plan config ───────────────────────────────────────────────────────────────

type PlanId = "free" | "pro" | "partner"
type PlanAccent = "neutral" | "primary" | "violet"

type PlanCard = {
  id: PlanId
  label: string
  price: string
  subtitle: string
  highlight: boolean
  badge: string | null
  cta: string
  ctaHref: string
  Icon: typeof Building2
  accent: PlanAccent
}

const PLANS: PlanCard[] = [
  {
    id: "free",
    label: PLAN_LABELS.free,
    price: PLAN_PRICES.free,
    subtitle: "Diagnostic gratuit. Afli ce ți se aplică.",
    highlight: false,
    badge: null,
    cta: "Începe gratuit",
    ctaHref: "/login",
    Icon: Building2,
    accent: "neutral",
  },
  {
    id: "pro",
    label: PLAN_LABELS.pro,
    price: PLAN_PRICES.pro,
    subtitle: "Compliance ops complet pentru organizația ta.",
    highlight: true,
    badge: "Cel mai ales",
    cta: "Pornește Pro · 14 zile gratuit",
    ctaHref: "/login",
    Icon: ShieldCheck,
    accent: "primary",
  },
  {
    id: "partner",
    label: PLAN_LABELS.partner,
    price: PLAN_PRICES.partner,
    subtitle: "Gestionezi conformitatea pentru mai mulți clienți.",
    highlight: false,
    badge: null,
    cta: "Contactează-ne",
    ctaHref: "mailto:contact@compliscan.ro",
    Icon: Briefcase,
    accent: "violet",
  },
]

const ACCENT_CLASSES: Record<
  PlanAccent,
  {
    iconBox: string
    iconColor: string
    checkBg: string
    checkColor: string
    columnHeader: string
    cellCheck: string
  }
> = {
  neutral: {
    iconBox: "border-eos-border bg-white/[0.04]",
    iconColor: "text-eos-text-tertiary",
    checkBg: "bg-white/[0.05]",
    checkColor: "text-eos-text-tertiary",
    columnHeader: "text-eos-text-tertiary",
    cellCheck: "text-eos-text-tertiary",
  },
  primary: {
    iconBox: "border-eos-primary/25 bg-eos-primary/10",
    iconColor: "text-eos-primary",
    checkBg: "bg-eos-primary/15",
    checkColor: "text-eos-primary",
    columnHeader: "text-eos-primary",
    cellCheck: "text-eos-primary",
  },
  violet: {
    iconBox: "border-violet-500/25 bg-violet-500/10",
    iconColor: "text-violet-300",
    checkBg: "bg-violet-500/15",
    checkColor: "text-violet-300",
    columnHeader: "text-violet-300",
    cellCheck: "text-violet-300",
  },
}

const FREE_FEATURES = [
  "Applicability Engine automat",
  "Scor de conformitate",
  "Profil firmă din ANAF",
  "1 document generat (sample)",
]

const PRO_FEATURES = [
  "Toate documentele PDF generate",
  "Findings complet + Resolution Layer",
  "NIS2, AI Act, e-Factura complete",
  "Audit Pack + Raport one-page",
  "Inspector Mode — simulare control",
  "Health Check periodic automat",
  "Weekly digest email",
]

const PARTNER_FEATURES = [
  "Tot ce include Pro",
  "Hub multi-client (până la 50 clienți)",
  "Import bulk CSV clienți",
  "Drill-down + export per client",
  "Urgency queue pentru contabili",
]

const PLAN_FEATURES: Record<PlanId, string[]> = {
  free: FREE_FEATURES,
  pro: PRO_FEATURES,
  partner: PARTNER_FEATURES,
}

const FAQ = [
  {
    q: "Ce înseamnă trial 14 zile?",
    a: "La înregistrare primești automat 14 zile de acces Pro gratuit. Nu este nevoie de card bancar.",
  },
  {
    q: "Pot schimba planul oricând?",
    a: "Da. Upgrade și downgrade sunt disponibile oricând din Setări → Abonament, fără penalități.",
  },
  {
    q: "Planul Partner — pentru cine e?",
    a: "E pentru firme de contabilitate, consultanți și integratori care gestionează conformitatea pentru mai mulți clienți simultan. Include portofoliu agregat și livrabile per client.",
  },
  {
    q: "Datele mele sunt în siguranță?",
    a: "Da. Datele sunt stocate criptat, izolat per organizație, pe infrastructură europeană (GDPR-compliant prin design).",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <PricingVisitTracker />

      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden px-3 py-1.5 font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-eos-text transition-colors sm:block"
            >
              Prețuri
            </Link>
            <Link
              href="/login"
              className="rounded-eos-sm border border-eos-border bg-transparent px-3 py-1.5 text-[12.5px] font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
            >
              Conectare
            </Link>
            <Link
              href="/login?mode=register"
              className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
            >
              Începe gratuit
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative border-b border-eos-border px-6 py-20">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Prețuri clare · fără surprize
            </p>
            <h1
              data-display-text="true"
              className="mt-3 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px] lg:text-[48px]"
              style={{ textWrap: "balance" }}
            >
              Alege planul potrivit firmei tale.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[16px]">
              Pornești gratuit ca să vezi ce ți se aplică și ce trebuie rezolvat acum. Pro
              deblochează cockpitul complet, dovada, dosarul și monitorizarea continuă.
            </p>
          </div>
        </section>

        {/* ── Plan cards ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-4 md:grid-cols-3">
              {PLANS.map((plan) => {
                const features = PLAN_FEATURES[plan.id] ?? []
                const tones = ACCENT_CLASSES[plan.accent]
                const isHighlighted = plan.highlight

                return (
                  <article
                    key={plan.id}
                    className={[
                      "relative flex flex-col rounded-eos-lg border bg-eos-surface p-6 transition-colors duration-150",
                      isHighlighted
                        ? "border-eos-primary/35 shadow-[0_0_0_1px_rgba(59,130,246,0.15),0_24px_60px_-20px_rgba(59,130,246,0.25)]"
                        : "border-eos-border hover:border-eos-border-strong",
                    ].join(" ")}
                  >
                    {plan.badge && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center rounded-full border border-eos-primary/35 bg-eos-bg px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-eos-primary shadow-[0_4px_12px_rgba(59,130,246,0.2)]">
                          {plan.badge}
                        </span>
                      </div>
                    )}

                    {/* Icon + label */}
                    <div className="mb-5 flex items-center gap-3">
                      <div
                        className={[
                          "flex size-10 items-center justify-center rounded-eos-sm border",
                          tones.iconBox,
                        ].join(" ")}
                      >
                        <plan.Icon className={["size-5", tones.iconColor].join(" ")} strokeWidth={1.75} />
                      </div>
                      <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                        {plan.label}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-2 flex items-end gap-2">
                      <span
                        data-display-text="true"
                        className="font-display text-[40px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text md:text-[44px]"
                      >
                        {plan.price.split(" / ")[0]}
                      </span>
                      {plan.price.includes("/") && (
                        <span className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                          / lună
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[13px] leading-[1.55] text-eos-text-muted">{plan.subtitle}</p>

                    {/* Divider */}
                    <div className="my-5 h-px bg-eos-border" />

                    {/* Features */}
                    <ul className="flex-1 space-y-2.5">
                      {features.map((feat) => (
                        <li key={feat} className="flex items-start gap-2.5">
                          <span
                            className={[
                              "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full",
                              tones.checkBg,
                            ].join(" ")}
                          >
                            <Check
                              className={["size-2.5", tones.checkColor].join(" ")}
                              strokeWidth={3}
                            />
                          </span>
                          <span className="text-[13px] leading-[1.55] text-eos-text-muted">
                            {feat}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="mt-7">
                      <Link
                        href={plan.ctaHref}
                        className={[
                          "flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm text-[13px] font-semibold transition-all",
                          isHighlighted
                            ? "bg-eos-primary text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] hover:bg-eos-primary/90"
                            : "border border-eos-border bg-transparent text-eos-text-muted hover:border-eos-border-strong hover:bg-white/[0.02] hover:text-eos-text",
                        ].join(" ")}
                      >
                        {plan.cta}
                        {isHighlighted && <ArrowRight className="size-3.5" strokeWidth={2.5} />}
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Feature comparison ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Comparație detaliată
                </p>
                <h2
                  data-display-text="true"
                  className="mt-2 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
                >
                  Toate funcționalitățile pe cele 3 planuri
                </h2>
              </div>
              <p className="font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                {FEATURES.length} funcționalități · 3 planuri
              </p>
            </div>

            <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-eos-border bg-white/[0.02]">
                      <th className="px-4 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary md:px-6">
                        Funcționalitate
                      </th>
                      {PLANS.map((p) => {
                        const tones = ACCENT_CLASSES[p.accent]
                        return (
                          <th
                            key={p.id}
                            className={[
                              "px-3 py-3.5 text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em]",
                              tones.columnHeader,
                            ].join(" ")}
                          >
                            {p.label}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {FEATURES.map((feature) => (
                      <tr
                        key={feature.label}
                        className="border-b border-eos-border-subtle last:border-b-0 hover:bg-white/[0.02]"
                      >
                        <td className="px-4 py-3 text-[12.5px] leading-[1.5] text-eos-text-muted md:px-6">
                          {feature.label}
                        </td>
                        {PLANS.map((p) => {
                          const val = feature[p.id]
                          const tones = ACCENT_CLASSES[p.accent]
                          return (
                            <td key={p.id} className="px-3 py-3 text-center">
                              {val === true ? (
                                <Check
                                  className={["mx-auto size-4", tones.cellCheck].join(" ")}
                                  strokeWidth={2.5}
                                />
                              ) : val === false ? (
                                <X className="mx-auto size-3.5 text-eos-text-tertiary/40" strokeWidth={2} />
                              ) : (
                                <span className="font-mono text-[11px] text-eos-text-muted">{val}</span>
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
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Întrebări frecvente
            </p>
            <h2
              data-display-text="true"
              className="mt-2 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              Răspunsuri la întrebările uzuale
            </h2>

            <div className="mt-8 space-y-3">
              {FAQ.map((item) => (
                <div
                  key={item.q}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4 transition-colors hover:border-eos-border-strong"
                >
                  <p
                    data-display-text="true"
                    className="font-display text-[14.5px] font-semibold tracking-[-0.01em] text-eos-text"
                  >
                    {item.q}
                  </p>
                  <p className="mt-2 text-[13px] leading-[1.65] text-eos-text-muted">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Bottom CTA ── */}
        <section className="relative px-6 py-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
              Fără card · fără angajament
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px]"
              style={{ textWrap: "balance" }}
            >
              Începe gratuit. În 5 minute știi ce ți se aplică.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[13.5px] leading-[1.65] text-eos-text-muted">
              14 zile Pro incluse la înregistrare. Dacă nu e pentru tine, rămâi pe Free —
              gratis permanent.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/login?mode=register"
                className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-6 py-3 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Creează cont gratuit
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="mailto:contact@compliscan.ro"
                className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-6 py-3 text-[13.5px] font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
              >
                Vorbește cu echipa
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-eos-border-subtle py-8">
        <div className="mx-auto max-w-6xl px-6">
          <LegalDisclaimer variant="short" />
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            <Link href="/terms" className="transition-colors hover:text-eos-text-muted">
              Termeni
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-eos-text-muted">
              Confidențialitate
            </Link>
            <Link href="/dpa" className="transition-colors hover:text-eos-text-muted">
              DPA
            </Link>
            <span className="ml-auto text-eos-text-muted">© 2026 CompliScan</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
