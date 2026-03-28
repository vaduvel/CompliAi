import Link from "next/link"
import { Check, X, ArrowRight, Zap, Building2, Briefcase, ShieldCheck } from "lucide-react"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { PricingVisitTracker } from "@/components/compliscan/pricing-visit-tracker"
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

// ── Plan config ───────────────────────────────────────────────────────────────

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
    Icon: Building2,
    iconClass: "text-white/30",
    iconBg: "bg-white/5 border-white/10",
    borderClass: "border-white/[0.08]",
    bgClass: "bg-white/[0.02]",
    ctaClass: "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
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
    Icon: ShieldCheck,
    iconClass: "text-blue-400",
    iconBg: "bg-blue-500/10 border-blue-500/20",
    borderClass: "border-blue-500/40",
    bgClass: "bg-blue-500/[0.04]",
    ctaClass: "bg-blue-600 text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500",
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
    Icon: Briefcase,
    iconClass: "text-violet-400",
    iconBg: "bg-violet-500/10 border-violet-500/20",
    borderClass: "border-white/[0.08]",
    bgClass: "bg-white/[0.02]",
    ctaClass: "border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white",
  },
]

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

const PLAN_FEATURES: Record<string, string[]> = {
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
    <div className="min-h-screen bg-[#060810] text-white">
      <PricingVisitTracker />

      {/* Nav */}
      <header className="border-b border-white/[0.06] px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm text-white/50 transition-colors hover:text-white/80"
            >
              Conectare
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
            >
              Începe gratuit
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-16">

        {/* Hero */}
        <div className="mb-16 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-3.5 py-1.5">
            <Zap className="h-3.5 w-3.5 text-blue-400" strokeWidth={2} />
            <span className="text-xs font-semibold text-blue-400">Prețuri clare, fără surprize</span>
          </div>
          <h1 className="text-4xl font-bold leading-tight text-white md:text-5xl">
            Alege planul potrivit
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/45 md:text-lg">
            Pornești gratuit ca să vezi ce ți se aplică și ce trebuie rezolvat acum.
            Pro deblochează cockpitul complet, dovada, dosarul și monitorizarea continuă.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((plan) => {
            const features = PLAN_FEATURES[plan.id] ?? []
            const isHighlighted = plan.highlight

            return (
              <div
                key={plan.id}
                className={[
                  "relative flex flex-col rounded-2xl border p-7 transition-all",
                  plan.borderClass,
                  plan.bgClass,
                  isHighlighted
                    ? "shadow-[0_0_48px_rgba(59,130,246,0.12)]"
                    : "",
                ].join(" ")}
              >
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="rounded-full border border-blue-500/30 bg-blue-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-blue-400">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {/* Icon + label */}
                <div className="mb-6 flex items-center gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl border",
                      plan.iconBg,
                    ].join(" ")}
                  >
                    <plan.Icon className={["h-5 w-5", plan.iconClass].join(" ")} strokeWidth={1.5} />
                  </div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                    {plan.label}
                  </p>
                </div>

                {/* Price */}
                <div className="mb-2">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold text-white md:text-5xl">
                      {plan.price.split(" / ")[0]}
                    </span>
                    {plan.price.includes("/") && (
                      <span className="mb-1.5 text-sm text-white/35">/ lună</span>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-white/40">{plan.subtitle}</p>
                </div>

                {/* Divider */}
                <div className="my-6 h-px bg-white/[0.07]" />

                {/* Features */}
                <div className="flex-1 space-y-3.5">
                  {features.map((feat) => (
                    <div key={feat} className="flex items-start gap-3">
                      <div
                        className={[
                          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                          isHighlighted
                            ? "bg-blue-500/20"
                            : plan.id === "partner"
                              ? "bg-violet-500/15"
                              : "bg-white/8",
                        ].join(" ")}
                      >
                        <Check
                          className={[
                            "h-2.5 w-2.5",
                            isHighlighted
                              ? "text-blue-400"
                              : plan.id === "partner"
                                ? "text-violet-400"
                                : "text-white/40",
                          ].join(" ")}
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-sm leading-relaxed text-white/65">{feat}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-8">
                  <Link
                    href={plan.ctaHref}
                    className={[
                      "flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all",
                      plan.ctaClass,
                    ].join(" ")}
                  >
                    {plan.cta}
                    {plan.highlight && <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />}
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

        {/* Feature comparison */}
        <div className="mt-16">
          <details className="group rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-6 py-5 select-none">
              <div>
                <h2 className="text-base font-semibold text-white">Comparație completă</h2>
                <p className="mt-0.5 text-sm text-white/35">
                  Toate funcționalitățile față în față pe cele 3 planuri.
                </p>
              </div>
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/40 transition-colors group-open:text-white/60">
                Deschide
              </span>
            </summary>
            <div className="overflow-x-auto border-t border-white/[0.06]">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="px-5 py-3.5 text-left text-xs font-medium uppercase tracking-wider text-white/30">
                      Funcționalitate
                    </th>
                    {PLANS.map((p) => (
                      <th
                        key={p.id}
                        className={[
                          "px-4 py-3.5 text-center text-xs font-bold uppercase tracking-wider",
                          p.highlight ? "text-blue-400" : "text-white/40",
                        ].join(" ")}
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
                      className={[
                        "border-b border-white/[0.04]",
                        i % 2 === 0 ? "" : "bg-white/[0.015]",
                      ].join(" ")}
                    >
                      <td className="px-5 py-3 text-sm text-white/55">{feature.label}</td>
                      {PLANS.map((p) => {
                        const val = feature[p.id]
                        return (
                          <td key={p.id} className="px-4 py-3 text-center">
                            {val === true ? (
                              <Check
                                className={[
                                  "mx-auto h-4 w-4",
                                  p.highlight ? "text-blue-400" : p.id === "partner" ? "text-violet-400" : "text-white/40",
                                ].join(" ")}
                                strokeWidth={2.5}
                              />
                            ) : val === false ? (
                              <X
                                className="mx-auto h-4 w-4 text-white/15"
                                strokeWidth={2}
                              />
                            ) : (
                              <span className="text-xs text-white/55">{val}</span>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>

        {/* FAQ */}
        <div className="mt-10 space-y-3">
          <h2 className="mb-6 text-base font-semibold text-white/60">Întrebări frecvente</h2>
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/[0.07] bg-white/[0.02]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 select-none">
                <span className="text-sm font-medium text-white/75">{item.q}</span>
                <span className="shrink-0 text-lg font-light text-white/25 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <div className="border-t border-white/[0.05] px-5 py-4">
                <p className="text-sm leading-relaxed text-white/45">{item.a}</p>
              </div>
            </details>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] px-8 py-10 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-blue-400/70">
            Fără card. Fără angajament.
          </p>
          <h2 className="mt-3 text-2xl font-bold text-white md:text-3xl">
            Începe gratuit și afli în 5 minute ce ți se aplică.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/40">
            14 zile Pro incluse la înregistrare. Dacă nu e pentru tine, rămâi pe Free — gratis permanent.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500"
            >
              Creează cont gratuit
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="mailto:contact@compliscan.ro"
              className="rounded-xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white/60 transition-all hover:bg-white/10 hover:text-white"
            >
              Vorbește cu echipa
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-5xl px-6">
          <LegalDisclaimer variant="short" />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-white/25">
            <Link href="/terms" className="transition-colors hover:text-white/50">
              Termeni și condiții
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-white/50">
              Politica de confidențialitate
            </Link>
            <Link href="/dpa" className="transition-colors hover:text-white/50">
              DPA
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
