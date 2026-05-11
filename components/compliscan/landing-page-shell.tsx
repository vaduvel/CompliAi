// S3.2 — Shared landing page shell pentru 4 ICP-uri publice (/dpo, /fiscal,
// /imm, /nis2). Componenta server-side (NU "use client") pentru SEO maxim.
// Fiecare page wrapper îi pasează un LandingPageProps specific ICP-ului.

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { listTiersForIcp } from "@/lib/server/stripe-tier-config"
import type { IcpSegment } from "@/lib/server/white-label"

export type LandingPageProps = {
  icpSegment: IcpSegment
  /** Eyebrow deasupra heroului (uppercase, mono). */
  eyebrow: string
  /** H1 hero title. */
  title: string
  /** Subtitle paragraph (1-2 propoziții). */
  subtitle: string
  /** 3-5 frameworks acoperite (chip list). */
  frameworks: string[]
  /** 3-4 features-cheie pentru ICP cu titluri scurte și 1-2 propoziții. */
  features: Array<{
    title: string
    description: string
  }>
  /** Workflow / journey steps (3-5). */
  steps: Array<{
    n: string
    title: string
    description: string
  }>
  /** Buton CTA principal label. Default: "Începe gratuit". */
  primaryCtaLabel?: string
  primaryCtaHref?: string
  /** Quote sau social proof scurt. Optional. */
  testimonial?: {
    quote: string
    author: string
    role: string
  }
  /** Anti-pattern explicit: "NU înlocuim X, Y, Z". Optional. */
  notReplacing?: string[]
  /** Internal link la waitlist sau register dacă ICP-ul nu e încă deschis. */
  waitlistHref?: string
}

export function LandingPageShell(props: LandingPageProps) {
  const tiers = listTiersForIcp(props.icpSegment)

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* Top nav */}
      <header className="border-b border-eos-border-subtle bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <CompliScanLogoLockup size="sm" />
          </Link>
          <nav className="hidden items-center gap-6 text-[13px] text-eos-text-muted md:flex">
            <Link href="/dpo" className="hover:text-eos-text">DPO</Link>
            <Link href="/fiscal" className="hover:text-eos-text">Fiscal</Link>
            <Link href="/imm" className="hover:text-eos-text">IMM</Link>
            <Link href="/nis2" className="hover:text-eos-text">NIS2</Link>
            <Link href="/pricing" className="hover:text-eos-text">Preț</Link>
            <Link
              href={`/login?icp=${props.icpSegment}`}
              className="rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-1.5 text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
            >
              Login
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-eos-border-subtle bg-eos-surface/50">
        <div className="mx-auto max-w-4xl px-6 py-20 text-center md:py-28">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-eos-primary">
            {props.eyebrow}
          </p>
          <h1
            data-display-text="true"
            className="mt-4 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[52px]"
            style={{ textWrap: "balance" }}
          >
            {props.title}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.65] text-eos-text-muted md:text-[17px]">
            {props.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {props.frameworks.map((fw) => (
              <span
                key={fw}
                className="inline-flex items-center gap-1.5 rounded-full border border-eos-border bg-eos-surface-variant px-3 py-1 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-muted"
              >
                <ShieldCheck className="size-3" strokeWidth={2} />
                {fw}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={props.primaryCtaHref ?? `/login?mode=register&icp=${props.icpSegment}`}
              className="inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-3 text-[14px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition-colors hover:bg-eos-primary-hover"
            >
              {props.primaryCtaLabel ?? "Începe gratuit"}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-5 py-3 text-[14px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              Vezi pricing
            </Link>
            {props.waitlistHref ? (
              <Link
                href={props.waitlistHref}
                className="inline-flex items-center gap-2 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-5 py-3 text-[14px] font-medium text-eos-warning transition-colors hover:bg-eos-warning-soft/80"
              >
                Sau înscrie-te pe lista de așteptare
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-b border-eos-border-subtle">
        <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
          <div className="grid gap-6 md:grid-cols-2">
            {props.features.map((feat, i) => (
              <div
                key={i}
                className="rounded-eos-lg border border-eos-border bg-eos-surface p-6"
              >
                <div className="flex size-10 items-center justify-center rounded-eos-sm bg-eos-primary/10 text-eos-primary">
                  <CheckCircle2 className="size-5" strokeWidth={2} />
                </div>
                <h3
                  data-display-text="true"
                  className="mt-4 font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  {feat.title}
                </h3>
                <p className="mt-2 text-[13.5px] leading-[1.6] text-eos-text-muted">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow steps */}
      <section className="border-b border-eos-border-subtle bg-eos-surface/30">
        <div className="mx-auto max-w-4xl px-6 py-16 md:py-24">
          <h2
            data-display-text="true"
            className="text-center font-display text-[28px] font-semibold tracking-[-0.02em] text-eos-text md:text-[32px]"
          >
            Workflow
          </h2>
          <div className="mt-10 space-y-4">
            {props.steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-5 rounded-eos-lg border border-eos-border bg-eos-surface p-5"
              >
                <span
                  data-display-text="true"
                  className="font-mono text-[24px] font-semibold tabular-nums text-eos-primary"
                >
                  {step.n}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[16px] font-semibold tracking-[-0.01em] text-eos-text">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-[13.5px] leading-[1.55] text-eos-text-muted">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing tiers (din STRIPE_TIER_REGISTRY) */}
      {tiers.length > 0 && (
        <section className="border-b border-eos-border-subtle">
          <div className="mx-auto max-w-5xl px-6 py-16 md:py-24">
            <h2
              data-display-text="true"
              className="text-center font-display text-[28px] font-semibold tracking-[-0.02em] text-eos-text md:text-[32px]"
            >
              Pricing transparent
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-[14px] leading-[1.6] text-eos-text-muted">
              Self-serve prin Stripe Checkout. Fără sales call. Cancel oricând.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface p-5"
                >
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-eos-text-tertiary">
                    {tier.label}
                  </p>
                  <p
                    data-display-text="true"
                    className="mt-3 font-display text-[28px] font-semibold tabular-nums tracking-[-0.025em] text-eos-text"
                  >
                    €{tier.priceLabelEur}
                    <span className="ml-1 text-[12px] font-medium text-eos-text-tertiary">
                      /lună
                    </span>
                  </p>
                  <ul className="mt-4 space-y-1.5">
                    {tier.features.slice(0, 5).map((feat, fi) => (
                      <li
                        key={fi}
                        className="flex items-start gap-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted"
                      >
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-eos-success"
                          strokeWidth={2}
                        />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/login?mode=register&icp=${props.icpSegment}&tier=${tier.id}`}
                    className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-2 text-[12.5px] font-semibold text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
                  >
                    Începe cu {tier.label}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonial */}
      {props.testimonial && (
        <section className="border-b border-eos-border-subtle">
          <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
            <p
              data-display-text="true"
              className="font-display text-[20px] font-medium leading-[1.5] tracking-[-0.015em] text-eos-text md:text-[24px]"
              style={{ textWrap: "balance" }}
            >
              „{props.testimonial.quote}”
            </p>
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.08em] text-eos-text-tertiary">
              {props.testimonial.author} · {props.testimonial.role}
            </p>
          </div>
        </section>
      )}

      {/* Anti-pattern strip — what we DON'T replace */}
      {props.notReplacing && props.notReplacing.length > 0 && (
        <section className="border-b border-eos-border-subtle bg-eos-surface/30">
          <div className="mx-auto max-w-3xl px-6 py-12 text-center">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
              CompliScan NU înlocuiește
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {props.notReplacing.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-eos-border bg-eos-surface-variant px-3 py-1 font-mono text-[11px] text-eos-text-muted"
                >
                  {tool}
                </span>
              ))}
            </div>
            <p className="mx-auto mt-4 max-w-xl text-[13px] leading-[1.55] text-eos-text-muted">
              Adaugă layer-ul de governance peste tool-urile pe care le folosești deja.
              Nu te forțează să schimbi stack-ul.
            </p>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="border-b border-eos-border-subtle bg-eos-primary/[0.04]">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center md:py-20">
          <h2
            data-display-text="true"
            className="font-display text-[28px] font-semibold tracking-[-0.02em] text-eos-text md:text-[36px]"
          >
            Pornește în 5 minute
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-[1.6] text-eos-text-muted">
            Fără card la înregistrare. Trial 14 zile pentru toate plan-urile Pro+.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={props.primaryCtaHref ?? `/login?mode=register&icp=${props.icpSegment}`}
              className="inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-6 py-3 text-[14px] font-semibold text-white transition-colors hover:bg-eos-primary-hover"
            >
              {props.primaryCtaLabel ?? "Începe gratuit"}
              <ArrowRight className="size-4" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="py-10">
        <div className="mx-auto max-w-6xl px-6">
          <LegalDisclaimer />
          <div className="mt-8 grid gap-6 border-t border-eos-border-subtle pt-6 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Tools gratuite
              </p>
              <ul className="mt-2 space-y-1 text-[12px]">
                <li>
                  <Link
                    href="/verifica-saft-hygiene"
                    className="text-eos-text-muted hover:text-eos-text"
                  >
                    Verifică igiena SAF-T D406
                  </Link>
                </li>
                <li>
                  <Link
                    href="/calculator-amenzi-anaf"
                    className="text-eos-text-muted hover:text-eos-text"
                  >
                    Calculator amenzi ANAF
                  </Link>
                </li>
                <li>
                  <Link
                    href="/genereaza-politica-gdpr"
                    className="text-eos-text-muted hover:text-eos-text"
                  >
                    Generator Politică GDPR
                  </Link>
                </li>
                <li>
                  <Link
                    href="/genereaza-dpa"
                    className="text-eos-text-muted hover:text-eos-text"
                  >
                    Generator DPA
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Pentru cine
              </p>
              <ul className="mt-2 space-y-1 text-[12px]">
                <li>
                  <Link href="/dpo" className="text-eos-text-muted hover:text-eos-text">
                    Cabinete DPO
                  </Link>
                </li>
                <li>
                  <Link href="/fiscal" className="text-eos-text-muted hover:text-eos-text">
                    Cabinete fiscale
                  </Link>
                </li>
                <li>
                  <Link href="/imm" className="text-eos-text-muted hover:text-eos-text">
                    IMM-uri (intern)
                  </Link>
                </li>
                <li>
                  <Link href="/nis2" className="text-eos-text-muted hover:text-eos-text">
                    Entități NIS2
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Cont
              </p>
              <ul className="mt-2 space-y-1 text-[12px]">
                <li>
                  <Link href="/pricing" className="text-eos-text-muted hover:text-eos-text">
                    Prețuri
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="text-eos-text-muted hover:text-eos-text">
                    Cont gratuit
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="text-eos-text-muted hover:text-eos-text">
                    Login
                  </Link>
                </li>
                <li>
                  <Link href="/trust" className="text-eos-text-muted hover:text-eos-text">
                    Trust
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <p className="mt-6 text-center text-[11px] text-eos-text-tertiary">
            © 2026 CompliScan · {" "}
            <Link href="/privacy" className="hover:text-eos-text-muted">
              Privacy
            </Link>{" "}
            ·{" "}
            <Link href="/terms" className="hover:text-eos-text-muted">
              Terms
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
