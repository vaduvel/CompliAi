import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, FileCheck2, Activity, ChevronRight } from "lucide-react"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"

// ── Data ─────────────────────────────────────────────────────────────────────

const REGS = ["GDPR", "NIS2", "EU AI Act", "e-Factura", "DORA"]

const JOURNEY_STEPS = [
  {
    step: "01",
    title: "Introduci CUI și website",
    description: "Pornim din datele firmei și semnalele publice deja disponibile.",
  },
  {
    step: "02",
    title: "Primești snapshot-ul",
    description: "Vezi exact ce legi ți se aplică și care sunt golurile reale.",
  },
  {
    step: "03",
    title: "Rezolvi în cockpit",
    description: "Generezi documentul, validezi și rezolvi riscul cu dovadă.",
  },
  {
    step: "04",
    title: "Rămâi în monitorizare",
    description: "Dosarul și watch-ul rămân legate de același caz.",
  },
]

const FEATURES = [
  {
    icon: ShieldCheck,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
    title: "Snapshot pe firma ta",
    description:
      "Nu liste generice. CompliScan pornește din CUI, ANAF și website-ul tău și îți arată exact ce i se aplică firmei tale.",
  },
  {
    icon: FileCheck2,
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
    title: "Rezolvare cu dovadă",
    description:
      "Intri pe risc, generezi documentul conform cu AI, validezi și închizi cazul cu urmă completă — totul din același cockpit.",
  },
  {
    icon: Activity,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    title: "Dosar și monitorizare",
    description:
      "Dovada intră automat în dosar. Cazul rămâne sub watch și îți semnalează când trebuie revizuit.",
  },
]

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

// ── Mock UI (product preview) ─────────────────────────────────────────────────

function ProductMock() {
  return (
    <div className="relative mx-auto mt-16 max-w-4xl px-4">
      {/* Glow */}
      <div className="absolute left-1/2 top-0 h-64 w-3/4 -translate-x-1/2 rounded-full bg-blue-500/20 blur-3xl" />

      {/* Browser chrome */}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-[0_0_60px_rgba(0,0,0,0.6)]">
        {/* Top bar */}
        <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="block h-3 w-3 rounded-full bg-[#ff5f57]" />
            <span className="block h-3 w-3 rounded-full bg-[#febc2e]" />
            <span className="block h-3 w-3 rounded-full bg-[#28c840]" />
          </div>
          <div className="mx-auto rounded-md bg-white/5 px-4 py-1.5 text-[11px] text-white/40">
            compliscanag.vercel.app/dashboard/resolve
          </div>
        </div>

        {/* App layout */}
        <div className="flex h-[340px] sm:h-[380px]">
          {/* Sidebar */}
          <div className="hidden w-52 shrink-0 flex-col gap-1 border-r border-white/[0.07] bg-white/[0.02] p-4 sm:flex">
            <div className="mb-2 flex items-center gap-2 px-2 py-1.5">
              <span className="h-6 w-6 rounded bg-blue-500/30" />
              <span className="text-[11px] font-semibold text-white/60">CompliScan</span>
            </div>
            {["Acasă", "Scanează", "De rezolvat", "Dosar", "Setări"].map((item, i) => (
              <div
                key={item}
                className={[
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs",
                  i === 2
                    ? "bg-blue-500/15 text-blue-400 font-medium"
                    : "text-white/40",
                ].join(" ")}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {item}
                {i === 2 && (
                  <span className="ml-auto rounded-full bg-blue-500/25 px-1.5 py-0.5 text-[10px] text-blue-400">
                    4
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Main content */}
          <div className="flex flex-1 flex-col overflow-hidden p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold text-white/80">De rezolvat</p>
              <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-white/40">
                4 riscuri identificate
              </span>
            </div>

            <div className="space-y-2.5">
              {[
                { title: "Politică de confidențialitate lipsă", badge: "GDPR", dot: "bg-red-500", priority: "Critic" },
                { title: "DPA cu furnizori neconfirmat", badge: "GDPR", dot: "bg-orange-400", priority: "Ridicat" },
                { title: "Registru evidență ANAF neemis", badge: "e-Factura", dot: "bg-yellow-400", priority: "Mediu" },
              ].map((f) => (
                <div
                  key={f.title}
                  className="flex items-center gap-3 rounded-lg border border-white/[0.07] bg-white/[0.03] px-3.5 py-2.5"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${f.dot}`} />
                  <span className="flex-1 truncate text-xs text-white/70">{f.title}</span>
                  <span className="shrink-0 rounded bg-blue-500/15 px-2 py-0.5 text-[10px] font-medium text-blue-400">
                    {f.badge}
                  </span>
                  <span className="hidden shrink-0 text-[10px] text-white/30 sm:block">
                    {f.priority}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/20" />
                </div>
              ))}

              {/* Resolved row */}
              <div className="flex items-center gap-3 rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-3.5 py-2.5 opacity-60">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span className="flex-1 truncate text-xs text-emerald-400/80">
                  Cookie policy publicată · dovadă în dosar
                </span>
                <span className="shrink-0 text-[10px] text-emerald-500/60">Rezolvat</span>
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
  return (
    <div className="min-h-screen bg-[#060810] text-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-white/[0.07] bg-[#060810]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <div className="flex items-center gap-2">
            <Link
              href="/pricing"
              className="hidden px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white sm:block"
            >
              Prețuri
            </Link>
            <Link
              href="/login"
              className="px-3 py-1.5 text-sm text-white/50 transition-colors hover:text-white"
            >
              Conectare
            </Link>
            <Link
              href="/login?mode=register"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Începe gratuit
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative overflow-hidden px-6 pb-8 pt-20 text-center">
          {/* Background glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-blue-600/10 blur-3xl" />
          </div>

          {/* Regulation badges */}
          <div className="relative mb-8 flex flex-wrap items-center justify-center gap-2">
            {REGS.map((reg) => (
              <span
                key={reg}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/50"
              >
                {reg}
              </span>
            ))}
          </div>

          {/* H1 */}
          <h1 className="relative mx-auto max-w-4xl text-5xl font-bold leading-[0.95] tracking-[-0.035em] md:text-6xl lg:text-7xl">
            <span className="block text-white">
              Vezi ce se aplică firmei tale.
            </span>
            <span className="mt-2 block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Rezolvi clar.
            </span>
            <span className="block text-white/90">Rămâi acoperit.</span>
          </h1>

          {/* Subtitle */}
          <p className="relative mx-auto mt-7 max-w-2xl text-lg leading-8 text-white/50 md:text-xl">
            Snapshot din CUI și website, cockpit de rezolvare cu dovadă, dosar
            și monitorizare — tot pe un singur traseu.
          </p>

          {/* CTAs */}
          <div className="relative mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/login?mode=register"
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-500 hover:shadow-blue-500/40"
            >
              Începe gratuit
              <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </Link>
            <Link
              href="/demo/imm"
              className="rounded-xl border border-white/10 bg-white/5 px-7 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
            >
              Vezi demo live
            </Link>
          </div>

          {/* Proof strip */}
          <div className="relative mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-[12px] text-white/30">
            <span>Fără card necesar</span>
            <span className="hidden sm:block">·</span>
            <span>Primul snapshot în câteva minute</span>
            <span className="hidden sm:block">·</span>
            <span>Onboarding ghidat</span>
          </div>

          {/* Product mock */}
          <ProductMock />
        </section>

        {/* ── Journey ── */}
        <section className="relative mt-24 px-6 pb-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Cum merge
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
                Un traseu. De la snapshot la dovadă.
              </h2>
            </div>

            {/* Steps with connecting line */}
            <div className="relative grid gap-6 md:grid-cols-4">
              {/* Connecting line (desktop) */}
              <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent md:block" />

              {JOURNEY_STEPS.map((item, i) => (
                <div key={item.step} className="relative flex flex-col gap-3">
                  {/* Step number */}
                  <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
                    <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-bold text-blue-400">
                      {i + 1}
                      {/* Pulse dot for first step */}
                      {i === 0 && (
                        <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border border-[#060810] bg-blue-500" />
                      )}
                    </div>
                    <p className="font-semibold text-white md:mt-3">{item.title}</p>
                  </div>
                  <p className="text-sm leading-6 text-white/40 md:mt-0">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ── */}
        <section className="border-t border-white/[0.06] bg-white/[0.02] px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Ce primești
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl lg:text-4xl">
                Conformitate operată, nu doar explicată.
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 transition-colors hover:border-white/[0.12] hover:bg-white/[0.05]"
                >
                  <div
                    className={[
                      "mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl border",
                      item.bg,
                    ].join(" ")}
                  >
                    <item.icon className={["h-5 w-5", item.color].join(" ")} strokeWidth={1.5} />
                  </div>
                  <p className="mb-2 font-semibold text-white">{item.title}</p>
                  <p className="text-sm leading-6 text-white/45">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Personas ── */}
        <section className="px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mb-12 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
                Pentru cine
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-white md:text-3xl">
                Construit pentru firmele românești.
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PERSONAS.map((p) => (
                <div
                  key={p.role}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
                >
                  <span className="mb-4 inline-block rounded-full border border-blue-500/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold text-blue-400">
                    {p.label}
                  </span>
                  <p className="mb-3 font-semibold text-white">{p.role}</p>
                  <p className="text-sm leading-6 text-white/45 italic">&ldquo;{p.quote}&rdquo;</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section className="relative overflow-hidden border-t border-white/[0.06] px-6 py-20 text-center">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/8 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Gratuit pentru diagnostic.
              <br />
              <span className="text-white/50">Pro pentru operare.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-7 text-white/40">
              Începi cu snapshot-ul și vezi exact ce ai de făcut. Când vrei
              cockpit complet, dovadă și dosar, treci pe Pro.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/login?mode=register"
                className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500"
              >
                Încearcă gratuit
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Link>
              <Link
                href="/pricing"
                className="text-sm text-white/40 underline underline-offset-4 hover:text-white/70"
              >
                Vezi prețurile
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-8">
        <div className="mx-auto max-w-6xl px-6">
          <LegalDisclaimer variant="short" />
          <div className="mt-4 flex flex-wrap gap-5 text-xs text-white/25">
            <Link href="/terms" className="hover:text-white/60 transition-colors">Termeni și condiții</Link>
            <Link href="/privacy" className="hover:text-white/60 transition-colors">Politica de confidențialitate</Link>
            <Link href="/dpa" className="hover:text-white/60 transition-colors">DPA</Link>
            <Link href="/pricing" className="hover:text-white/60 transition-colors">Prețuri</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
