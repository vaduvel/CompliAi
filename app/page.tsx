import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  FileCheck2,
  Activity,
  ChevronRight,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import { FiscalLanding } from "@/components/compliscan/marketing/FiscalLanding"

const isFiscalMode = process.env.NEXT_PUBLIC_PRODUCT_MODE === "fiscal"

// [FC-12 2026-05-14] Metadata env-aware: fiscal-only branding pentru cabinet contabil deploy.
export const metadata: Metadata = isFiscalMode
  ? {
      title: "CompliScan Fiscal — Cockpit cabinet contabil RO",
      description:
        "ANAF SPV + cross-client analytics + reconciliere ERP-SPV. Pre-ANAF Simulation, Master Exception Queue, Client Burden Index, Bank ↔ SPV reconciliere. Vezi ce arde la TOATE firmele tale într-un singur ecran.",
      alternates: { canonical: "/" },
      openGraph: {
        title: "CompliScan Fiscal — Cockpit cabinet contabil RO",
        description:
          "ANAF SPV + cross-client analytics. 38 capabilities funcționale. Pentru cabinetul tău contabil.",
        url: "/",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "CompliScan Fiscal — Cockpit cabinet contabil RO",
        description: "ANAF SPV + cross-client. Reconciliere ERP. Pentru cabinetul tău.",
      },
    }
  : {
      title: "CompliScan — conformitate GDPR, NIS2 și EU AI Act pentru IMM",
      description:
        "Vezi ce se aplică firmei tale, rezolvi finding-urile clare și păstrezi dovada într-un dosar operațional pentru GDPR, NIS2, EU AI Act și e-Factura.",
      alternates: { canonical: "/" },
      openGraph: {
        title: "CompliScan — conformitate GDPR, NIS2 și EU AI Act pentru IMM",
        description:
          "Vezi ce se aplică firmei tale, rezolvi finding-urile clare și păstrezi dovada într-un dosar operațional.",
        url: "/",
        type: "website",
      },
      twitter: {
        card: "summary",
        title: "CompliScan — conformitate GDPR, NIS2 și EU AI Act pentru IMM",
        description:
          "Vezi ce se aplică firmei tale, rezolvi finding-urile clare și păstrezi dovada.",
      },
    }

// ── Data ─────────────────────────────────────────────────────────────────────

const REGS = ["GDPR", "NIS2", "EU AI Act", "e-Factura", "DORA"] as const

const JOURNEY_STEPS = [
  {
    n: "01",
    title: "Introduci CUI și website",
    description: "Pornim din datele firmei și semnalele publice deja disponibile.",
  },
  {
    n: "02",
    title: "Primești snapshot-ul",
    description: "Vezi exact ce legi ți se aplică și care sunt golurile reale.",
  },
  {
    n: "03",
    title: "Rezolvi în cockpit",
    description: "Generezi documentul, validezi și rezolvi riscul cu dovadă.",
  },
  {
    n: "04",
    title: "Rămâi în monitorizare",
    description: "Dosarul și watch-ul rămân legate de același caz.",
  },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    title: "Snapshot pe firma ta",
    description:
      "Nu liste generice. CompliScan pornește din CUI, ANAF și website-ul tău și îți arată exact ce i se aplică firmei tale.",
    tone: "info",
  },
  {
    icon: FileCheck2,
    title: "Rezolvare cu dovadă",
    description:
      "Intri pe risc, generezi documentul conform cu AI, validezi și închizi cazul cu urmă completă — totul din același cockpit.",
    tone: "violet",
  },
  {
    icon: Activity,
    title: "Dosar și monitorizare",
    description:
      "Dovada intră automat în dosar. Cazul rămâne sub watch și îți semnalează când trebuie revizuit.",
    tone: "success",
  },
] as const

const FEATURE_TONE_CLASSES: Record<
  (typeof FEATURES)[number]["tone"],
  { bg: string; icon: string }
> = {
  info: { bg: "border-eos-primary/25 bg-eos-primary/10", icon: "text-eos-primary" },
  violet: { bg: "border-violet-500/25 bg-violet-500/10", icon: "text-violet-400" },
  success: { bg: "border-eos-success/25 bg-eos-success-soft", icon: "text-eos-success" },
}

const PERSONAS = [
  {
    role: "Proprietar IMM",
    quote: "Spune-mi ce mi se aplică, dă-mi primul pas și lasă-mi dovada.",
    label: "Solo",
  },
  {
    role: "Consultant / Contabil",
    quote: "Văd urgențele, lucrez pe clientul corect, livrez pachetul.",
    label: "Partner",
  },
  {
    role: "Responsabil conformitate",
    quote: "Vreau control, urmă, dovadă reală și monitoring serios.",
    label: "Compliance",
  },
]

const STATS = [
  { number: "5", label: "Regulamente europene" },
  { number: "40+", label: "Tipuri de constatări" },
  { number: "<3", label: "Minute prim snapshot", unit: "min" },
  { number: "100", label: "Date stocate în UE", unit: "%" },
]

// ── V3 Hero Mock — preview cockpit cu stepper ────────────────────────────────

function HeroMock() {
  return (
    <div className="relative w-full">
      {/* glow fundal */}
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-eos-lg bg-eos-primary/10 opacity-40 blur-3xl" />

      <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
        {/* header card cu badge GDPR + timestamp */}
        <div className="flex items-center gap-2.5 border-b border-eos-border bg-white/[0.02] px-5 py-4">
          <span className="size-2.5 shrink-0 rounded-full bg-eos-error shadow-[0_0_8px_rgba(248,113,113,0.6)]" />
          <span className="inline-flex items-center gap-1 rounded-sm border border-eos-error/25 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-error">
            GDPR
          </span>
          <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            detectat acum 47 min
          </span>
        </div>

        {/* body */}
        <div className="space-y-4 px-5 py-5">
          <div>
            <h3
              data-display-text="true"
              className="font-display text-[18px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
            >
              Politica de confidențialitate lipsește pe apex.ro
            </h3>
            <p className="mt-2 text-[12.5px] leading-[1.55] text-eos-text-muted">
              Scan-ul a găsit că după redesign linkul din footer a fost șters. Am pregătit un draft aliniat cu GDPR art. 13.
            </p>
          </div>

          {/* stepper vertical */}
          <div className="space-y-1.5 border-t border-eos-border pt-4">
            {[
              { l: "Analiză legală", state: "done" as const },
              { l: "Draft IA generat", state: "done" as const },
              { l: "Adaptare la firma ta", state: "done" as const },
              { l: "Review consultant", state: "active" as const },
              { l: "Trimite la tine", state: "todo" as const },
            ].map((s, i) => (
              <div key={s.l} className="flex items-center gap-2.5 py-1">
                <div
                  className={[
                    "flex size-4 items-center justify-center rounded-full font-mono text-[9px] font-bold text-white",
                    s.state === "done"
                      ? "bg-eos-success"
                      : s.state === "active"
                        ? "bg-eos-primary"
                        : "bg-white/[0.08] text-eos-text-tertiary",
                  ].join(" ")}
                >
                  {s.state === "done" ? "✓" : i + 1}
                </div>
                <span
                  className={[
                    "font-mono text-[12px] tracking-[0.02em]",
                    s.state === "done"
                      ? "text-eos-text-muted"
                      : s.state === "active"
                        ? "font-semibold text-eos-primary"
                        : "text-eos-text-tertiary",
                  ].join(" ")}
                >
                  {s.l}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* avatar floating bottom-right */}
      <div className="absolute -bottom-5 -right-5 hidden items-center gap-2.5 rounded-eos-lg border border-eos-border bg-eos-bg px-3.5 py-2.5 shadow-[0_20px_40px_-20px_rgba(0,0,0,0.8)] sm:flex">
        <div className="grid size-8 place-items-center rounded-full border border-eos-border bg-eos-surface font-mono text-[11px] font-semibold text-eos-text">
          DP
        </div>
        <div className="leading-tight">
          <div className="text-[11.5px] font-semibold text-eos-text">Diana Popescu</div>
          <div className="font-mono text-[9.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
            Consultant conformitate
          </div>
        </div>
      </div>
    </div>
  )
}

// ── V3 Product preview (cockpit list) ─────────────────────────────────────────

function ProductMock() {
  return (
    <div className="relative mx-auto mt-20 max-w-5xl px-4">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-3/4 -translate-x-1/2 rounded-full bg-eos-primary/15 blur-3xl" />

      <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface shadow-[0_0_60px_rgba(0,0,0,0.55)]">
        {/* browser chrome */}
        <div className="flex items-center gap-3 border-b border-eos-border bg-white/[0.02] px-4 py-2.5">
          <div className="flex gap-1.5">
            <span className="block size-2.5 rounded-full bg-[#ff5f57]" />
            <span className="block size-2.5 rounded-full bg-[#febc2e]" />
            <span className="block size-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto rounded-eos-sm border border-eos-border bg-white/[0.03] px-3 py-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            app.compliscan.ro/dashboard/resolve
          </div>
        </div>

        <div className="flex h-[360px] sm:h-[400px]">
          {/* sidebar mock */}
          <aside className="hidden w-[210px] shrink-0 border-r border-eos-border bg-white/[0.02] px-3 py-4 sm:block">
            <div className="mb-4 flex items-center gap-2 px-2">
              <span className="grid size-6 place-items-center rounded-eos-sm bg-eos-primary text-[10px] font-bold text-white">
                C
              </span>
              <span className="font-display text-[12px] font-semibold tracking-[-0.015em] text-eos-text">
                CompliScan
              </span>
            </div>
            <p className="mb-1.5 px-2.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-eos-text-tertiary">
              Firmă activă
            </p>
            {["Acasă", "Scanează", "De rezolvat", "Dosar", "Setări"].map((item, i) => {
              const active = i === 2
              return (
                <div
                  key={item}
                  className={[
                    "flex items-center gap-2 rounded-eos-sm px-2.5 py-1.5 text-[12px]",
                    active
                      ? "bg-white/[0.04] font-semibold text-eos-text"
                      : "font-medium text-eos-text-tertiary",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "size-1.5 rounded-full",
                      active ? "bg-eos-primary" : "bg-current opacity-40",
                    ].join(" ")}
                  />
                  {item}
                  {active && (
                    <span className="ml-auto rounded-sm bg-eos-error-soft px-1.5 py-0 font-mono text-[10px] font-bold text-eos-error">
                      4
                    </span>
                  )}
                </div>
              )
            })}
          </aside>

          {/* main */}
          <div className="flex flex-1 flex-col px-5 py-5">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Acțiuni / De rezolvat
              </p>
              <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-muted">
                4 riscuri
              </span>
            </div>
            <h4
              data-display-text="true"
              className="mb-4 font-display text-[18px] font-semibold tracking-[-0.02em] text-eos-text"
            >
              Acțiuni urgente · următoarele 72h
            </h4>

            <div className="space-y-2">
              {[
                {
                  id: "GDPR-001",
                  title: "Politica de confidențialitate lipsă",
                  fw: "GDPR",
                  sla: "47h",
                  sev: "critical" as const,
                },
                {
                  id: "GDPR-014",
                  title: "DPA cu furnizori neconfirmat",
                  fw: "GDPR",
                  sla: "5z",
                  sev: "critical" as const,
                },
                {
                  id: "EFA-002",
                  title: "Registru evidență ANAF neemis",
                  fw: "e-Factura",
                  sla: "12z",
                  sev: "high" as const,
                },
              ].map((f) => (
                <div
                  key={f.id}
                  className="relative flex items-center gap-3 overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-3.5 py-2.5"
                >
                  <span
                    aria-hidden
                    className={[
                      "absolute left-0 top-0 bottom-0 w-[3px]",
                      f.sev === "critical" ? "bg-eos-error" : "bg-eos-warning",
                    ].join(" ")}
                  />
                  <span className="ml-1 font-mono text-[10.5px] font-semibold tracking-[0.04em] text-eos-text">
                    {f.id}
                  </span>
                  <span className="flex-1 truncate text-[12.5px] text-eos-text">{f.title}</span>
                  <span className="hidden shrink-0 rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-text-muted sm:inline-flex">
                    {f.fw}
                  </span>
                  <span
                    className={[
                      "shrink-0 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em]",
                      f.sev === "critical" ? "text-eos-error" : "text-eos-warning",
                    ].join(" ")}
                  >
                    SLA {f.sla}
                  </span>
                  <ChevronRight className="size-3.5 shrink-0 text-eos-text-tertiary" />
                </div>
              ))}

              {/* resolved row */}
              <div className="relative flex items-center gap-3 overflow-hidden rounded-eos-lg border border-eos-success/15 bg-eos-success-soft/40 px-3.5 py-2.5 opacity-70">
                <span aria-hidden className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-success" />
                <CheckCircle2 className="ml-1 size-3.5 shrink-0 text-eos-success" strokeWidth={2.5} />
                <span className="flex-1 truncate text-[12.5px] text-eos-success/90">
                  Cookie policy publicată · dovadă în dosar
                </span>
                <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-success">
                  Rezolvat
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  // [FC-12 2026-05-14] Fiscal-only landing pentru deploy cabinet contabil.
  if (isFiscalMode) {
    return <FiscalLanding />
  }

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden px-3 py-1.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.08em] text-eos-text-muted transition-colors hover:text-eos-text sm:block"
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
              Creează cont gratuit
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero (V3 2-col) ── */}
        <section className="relative overflow-hidden border-b border-eos-border">
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-eos-primary/10 blur-3xl" />

          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
            {/* left column */}
            <div className="flex flex-col">
              <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-3 py-1">
                <span className="size-1.5 rounded-full bg-eos-success shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                  Pentru IMM-urile din România
                </span>
              </div>

              <h1
                data-display-text="true"
                className="font-display text-[40px] font-semibold leading-[1.05] tracking-[-0.035em] text-eos-text md:text-[52px] lg:text-[56px]"
                style={{ textWrap: "balance" }}
              >
                <span className="block">Vezi ce se aplică firmei tale.</span>
                <span className="block text-eos-primary">Rezolvi clar.</span>
                <span className="block">Rămâi acoperit.</span>
              </h1>

              <p className="mt-5 max-w-xl text-[15px] leading-[1.6] text-eos-text-muted md:text-[16px]">
                Snapshot din CUI și website, cockpit de rezolvare cu dovadă, dosar
                și monitorizare — tot pe un singur traseu.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/login?mode=register"
                  className="flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 hover:shadow-[0_12px_32px_-8px_rgba(59,130,246,0.55)]"
                >
                  Creează cont gratuit
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                </Link>
                <Link
                  href="/demo/imm"
                  className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-5 py-2.5 text-[13.5px] font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
                >
                  Vezi demo live
                </Link>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                <span>Fără card necesar</span>
                <span className="text-eos-border-strong">·</span>
                <span>Primul snapshot în 3 minute</span>
                <span className="text-eos-border-strong">·</span>
                <span>Date stocate în UE</span>
              </div>

              {/* stats divider */}
              <div className="mt-10 grid grid-cols-3 gap-6 border-t border-eos-border pt-6">
                {[
                  { n: "47+", l: "IMM-uri în pilot" },
                  { n: "5", l: "regulamente acoperite" },
                  { n: "98%", l: "rate închidere finding" },
                ].map((s) => (
                  <div key={s.l}>
                    <div
                      data-display-text="true"
                      className="font-display text-[24px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
                    >
                      {s.n}
                    </div>
                    <div className="mt-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                      {s.l}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* right column — V3 mock */}
            <div className="relative flex items-center">
              <HeroMock />
            </div>
          </div>

          {/* regulation badges sub hero */}
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-6 pb-12">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              acoperă
            </span>
            {REGS.map((reg) => (
              <span
                key={reg}
                className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.03] px-2 py-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.05em] text-eos-text-muted"
              >
                {reg}
              </span>
            ))}
          </div>
        </section>

        {/* ── ICP discovery band (link to landing pages per segment) ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Pe rolul tău
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
                CompliScan se pliază pe segmentul tău.
              </h2>
              <p className="mt-3 max-w-xl text-[14px] leading-[1.6] text-eos-text-muted">
                Patru ICP-uri Faza 1, fiecare cu workflow + pricing dedicat. Click pe segmentul tău pentru detalii și activare self-serve.
              </p>
            </div>

            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  href: "/dpo",
                  badge: "Cabinet DPO",
                  title: "DPO consultanți",
                  desc: "Înlocuim Excel + Word + Drive. Magic links + Audit Pack + white-label.",
                  accent: "violet",
                },
                {
                  href: "/fiscal",
                  badge: "Cabinet Fiscal",
                  title: "Contabili CECCAR",
                  desc: "Layer compliance peste SmartBill / Saga / Oblio. UBL CIUS-RO validator + e-TVA.",
                  accent: "amber",
                },
                {
                  href: "/imm",
                  badge: "IMM Internal",
                  title: "Compliance Officer",
                  desc: "Control tower 50-250 ang. GDPR + AI Act + NIS2 + DORA într-un singur tool.",
                  accent: "emerald",
                },
                {
                  href: "/nis2",
                  badge: "Enterprise",
                  title: "CISO / multi-framework",
                  desc: "Governance NIS2 + DORA + ISO 27001 readiness. Sales-led pricing.",
                  accent: "indigo",
                },
              ].map((card) => {
                const accentClass =
                  card.accent === "violet"
                    ? "border-violet-500/30 bg-violet-500/[0.04] hover:border-violet-500/50 text-violet-300"
                    : card.accent === "amber"
                      ? "border-amber-500/30 bg-amber-500/[0.04] hover:border-amber-500/50 text-amber-300"
                      : card.accent === "emerald"
                        ? "border-emerald-500/30 bg-emerald-500/[0.04] hover:border-emerald-500/50 text-emerald-300"
                        : "border-indigo-500/30 bg-indigo-500/[0.04] hover:border-indigo-500/50 text-indigo-300"
                return (
                  <Link
                    key={card.href}
                    href={card.href}
                    className={`group rounded-eos-lg border bg-eos-surface p-5 transition-all hover:scale-[1.01] ${accentClass.split(" ").slice(0, 3).join(" ")}`}
                  >
                    <span
                      className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${accentClass.split(" ").slice(3).join(" ")}`}
                    >
                      {card.badge}
                    </span>
                    <h3
                      data-display-text="true"
                      className="mt-3 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
                    >
                      {card.title}
                    </h3>
                    <p className="mt-2 text-[12.5px] leading-[1.55] text-eos-text-muted">
                      {card.desc}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-eos-text-tertiary group-hover:text-eos-text-muted">
                      Vezi detalii
                      <ChevronRight className="size-3" strokeWidth={2.5} />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Cum merge — V3 4-values band ── */}
        <section className="border-b border-eos-border px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Cum merge
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
                Un traseu. De la snapshot la dovadă.
              </h2>
            </div>

            <div className="grid gap-x-8 gap-y-10 md:grid-cols-2 lg:grid-cols-4">
              {JOURNEY_STEPS.map((item) => (
                <div key={item.n} className="flex flex-col">
                  <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                    {item.n}
                  </div>
                  <h3
                    data-display-text="true"
                    className="mt-3 font-display text-[16px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
                  >
                    {item.title}
                  </h3>
                  <p className="mt-2 text-[12.5px] leading-[1.55] text-eos-text-muted">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product mock band ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-5xl text-center">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Cockpit
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              Findings clare. Acțiuni concrete. Dovadă în dosar.
            </h2>
          </div>
          <ProductMock />
        </section>

        {/* ── Features (V3 panels) ── */}
        <section className="border-b border-eos-border bg-white/[0.015] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Ce primești
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
                Conformitate operată, nu doar explicată.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {FEATURES.map((item) => {
                const tone = FEATURE_TONE_CLASSES[item.tone]
                return (
                  <div
                    key={item.title}
                    className="group rounded-eos-lg border border-eos-border bg-eos-surface p-5 transition-colors duration-150 hover:border-eos-border-strong hover:bg-white/[0.02]"
                  >
                    <div
                      className={[
                        "mb-4 inline-flex size-10 items-center justify-center rounded-eos-sm border",
                        tone.bg,
                      ].join(" ")}
                    >
                      <item.icon className={["size-5", tone.icon].join(" ")} strokeWidth={1.75} />
                    </div>
                    <h3
                      data-display-text="true"
                      className="mb-2 font-display text-[15px] font-semibold tracking-[-0.015em] text-eos-text"
                    >
                      {item.title}
                    </h3>
                    <p className="text-[13px] leading-[1.55] text-eos-text-muted">
                      {item.description}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Stats (V3 KPI strip variant) ── */}
        <section className="border-b border-eos-border px-6 py-16">
          <div className="mx-auto max-w-5xl">
            <div
              className={[
                "grid divide-x divide-eos-border overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface",
                "grid-cols-2 md:grid-cols-4",
              ].join(" ")}
            >
              {STATS.map((stat) => (
                <div key={stat.label} className="px-4 py-4">
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                    {stat.label}
                  </p>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span
                      data-display-text="true"
                      className="font-display text-[26px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
                    >
                      {stat.number}
                    </span>
                    {stat.unit && (
                      <span className="text-[13px] text-eos-text-tertiary">{stat.unit}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personas (V3 cards) ── */}
        <section className="border-b border-eos-border px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 max-w-2xl">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Pentru cine
              </p>
              <h2
                data-display-text="true"
                className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px]"
              >
                Construit pentru firmele românești.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PERSONAS.map((p) => (
                <div
                  key={p.role}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface p-5"
                >
                  <span className="inline-flex items-center rounded-sm border border-eos-primary/25 bg-eos-primary/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-primary">
                    {p.label}
                  </span>
                  <h3
                    data-display-text="true"
                    className="mt-3 font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
                  >
                    {p.role}
                  </h3>
                  <p className="mt-2 text-[13px] italic leading-[1.55] text-eos-text-muted">
                    &ldquo;{p.quote}&rdquo;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden px-6 py-20 text-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 size-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-eos-primary/10 blur-3xl" />
          <div className="mx-auto max-w-2xl">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Începe acum
            </p>
            <h2
              data-display-text="true"
              className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text md:text-[34px] lg:text-[38px]"
            >
              Gratuit pentru diagnostic.{" "}
              <span className="text-eos-text-muted">Pro pentru operare.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[13.5px] leading-[1.65] text-eos-text-muted">
              Începi cu snapshot-ul și vezi exact ce ai de făcut. Când vrei
              cockpit complet, dovadă și dosar, treci pe Pro.
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
                href="/pricing"
                className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-eos-text-tertiary underline-offset-4 hover:text-eos-text-muted hover:underline"
              >
                Vezi prețurile →
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer mono ── */}
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
            <Link href="/pricing" className="transition-colors hover:text-eos-text-muted">
              Prețuri
            </Link>
            <span className="ml-auto text-eos-text-muted">
              © 2026 CompliScan
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
