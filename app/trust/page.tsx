import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  ShieldCheck,
} from "lucide-react"

import { CeBadge } from "@/components/compliscan/ce-badge"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata: Metadata = {
  title: "Trust Center - CompliScan",
  description:
    "Pagina publica de trust pentru CompliScan: documente legale, subprocesori, disclosure AI Act si informatii operationale pentru clienti si consultanti.",
}

const SUBPROCESSORS = [
  { name: "Vercel", role: "livrare aplicație web și edge infrastructure", location: "Platform delivery" },
  { name: "Supabase", role: "stocare date și autentificare", location: "EU region" },
  { name: "Google Cloud", role: "Gemini AI și OCR / Vision pentru generare și extracție asistată", location: "EU region" },
  { name: "Resend", role: "email tranzacțional", location: "SCC safeguards" },
  { name: "Sentry", role: "monitoring operațional și error tracing", location: "Telemetry processor" },
  { name: "Stripe", role: "procesare plăți și abonamente", location: "Payment processor" },
  { name: "ANAF / SPV", role: "integrare doar-vizualizare pentru status și fluxuri e-Factura", location: "Romania public authority" },
] as const

const TRUST_DOCUMENTS = [
  { title: "DPA CompliScan", href: "/legal/dpa-compliscan.pdf", detail: "copie publică operațională pentru review B2B" },
  { title: "Subprocesori", href: "/legal/subprocessors.html", detail: "lista publică a furnizorilor și rolurilor" },
  { title: "AI Act disclosure", href: "/legal/ai-act-disclosure.pdf", detail: "transparență AI Act + human oversight + CE gate" },
] as const

const AI_SYSTEMS = [
  {
    name: "Document Generator (Gemini)",
    purpose: "Drafting asistat pentru politici și documente de conformitate",
    riskClass: "Limited risk · Art. 50 transparency",
    humanOversight: "Obligatoriu — draft-ul necesită confirmare umană explicită înainte de utilizare",
    dataUsed: "Text-ul din profilul organizației și findings-urile detectate",
  },
  {
    name: "OCR / Vision Extractor",
    purpose: "Extracție asistată din documente încărcate (PDF, imagini)",
    riskClass: "Minimal risk",
    humanOversight: "Rezultatele sunt prezentate pentru review, nu sunt aplicate automat",
    dataUsed: "Fișierele încărcate de utilizator în cadrul scanării",
  },
  {
    name: "Agent OS · Finding Triage",
    purpose: "Triaj de findings, sugestii de remediere și clasificare operațională",
    riskClass: "Limited risk · Art. 50 transparency",
    humanOversight: "Toate propunerile trec prin review uman obligatoriu (needs_review → confirmed)",
    dataUsed: "Starea de conformitate, documente scanate, semnale detectate",
  },
] as const

export default function TrustLandingPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/privacy"
              className="hidden font-mono text-[11.5px] font-semibold uppercase tracking-[0.08em] text-eos-text-muted transition-colors hover:text-eos-text sm:inline-flex"
            >
              Privacy
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary/90"
            >
              Deschide dashboard
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {/* ── Hero ── */}
        <section className="mb-12">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-eos-primary/25 bg-eos-primary/10 px-3 py-1">
            <ShieldCheck className="size-3.5 text-eos-primary" strokeWidth={2.25} />
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
              Trust Center · public
            </span>
          </div>
          <h1
            data-display-text="true"
            className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.03em] text-eos-text md:text-[44px]"
            style={{ textWrap: "balance" }}
          >
            Infrastructura, documentele legale și disclosure-ul AI.
          </h1>
          <p className="mt-4 max-w-2xl text-[14.5px] leading-[1.65] text-eos-text-muted md:text-[15.5px]">
            Pagina publică de trust adună minimul cerut de due diligence B2B: DPA-ul
            CompliScan, lista subprocesorilor, informații despre hosting și ciclul de viață
            al datelor, plus disclosure-ul AI Act pentru modul în care folosim AI în produs.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <CeBadge mode="transparent" className="normal-case tracking-normal" />
            <CeBadge mode="decision-gate" className="normal-case tracking-normal" />
            <span className="inline-flex items-center rounded-sm border border-eos-success/25 bg-eos-success-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-success">
              Audit trail active
            </span>
          </div>
        </section>

        {/* ── Quick info KPI strip ── */}
        <section className="mb-12">
          <div className="grid divide-x divide-eos-border overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface md:grid-cols-4">
            {[
              { label: "Hosting", value: "Vercel + Supabase EU" },
              { label: "Retenție operațională", value: "≤ 90 zile post-închidere" },
              { label: "Ștergere la cerere", value: "≤ 30 zile" },
              { label: "Contact DPO", value: "dpo@compliscan.ro" },
            ].map((info) => (
              <div key={info.label} className="px-4 py-3.5">
                <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                  {info.label}
                </p>
                <p
                  data-display-text="true"
                  className="mt-1.5 font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
                >
                  {info.value}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust documents ── */}
        <section className="mb-12">
          <div className="mb-5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Documente publice
            </p>
            <h2
              data-display-text="true"
              className="mt-2 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text md:text-[28px]"
            >
              Descarcă pentru review B2B
            </h2>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {TRUST_DOCUMENTS.map((doc) => (
              <Link
                key={doc.href}
                href={doc.href}
                className="group flex flex-col gap-3 rounded-eos-lg border border-eos-border bg-eos-surface p-5 transition-colors duration-150 hover:border-eos-border-strong hover:bg-white/[0.02]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10">
                    <FileText className="size-5 text-eos-primary" strokeWidth={1.75} />
                  </div>
                  <Download
                    className="size-4 text-eos-text-tertiary transition-colors group-hover:text-eos-primary"
                    strokeWidth={2}
                  />
                </div>
                <div>
                  <p
                    data-display-text="true"
                    className="font-display text-[15px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
                  >
                    {doc.title}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-[1.55] text-eos-text-muted">{doc.detail}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-3 rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft px-4 py-3 font-mono text-[11.5px] leading-[1.6] text-eos-text-muted">
            <strong className="text-eos-text">Notă</strong> · Copiile publice sunt operaționale
            pentru due diligence inițial. Pentru release public larg, master-ul cere validare
            finală de counsel.
          </div>
        </section>

        {/* ── Two-col: Subprocessors + AI disclosure ── */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Subprocessors */}
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface">
            <div className="flex items-center gap-2 border-b border-eos-border px-5 py-3.5">
              <Globe className="size-4 text-eos-text-muted" strokeWidth={2} />
              <p
                data-display-text="true"
                className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Subprocesori și infrastructură
              </p>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                {SUBPROCESSORS.length} furnizori
              </span>
            </div>
            <div className="space-y-1 p-3">
              {SUBPROCESSORS.map((p) => (
                <div
                  key={p.name}
                  className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] px-3.5 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p
                      data-display-text="true"
                      className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-eos-text"
                    >
                      {p.name}
                    </p>
                    <span className="font-mono text-[10px] uppercase tracking-[0.05em] text-eos-text-tertiary">
                      {p.location}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] leading-[1.5] text-eos-text-muted">{p.role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* AI disclosure */}
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface">
            <div className="flex items-center gap-2 border-b border-eos-border px-5 py-3.5">
              <Lock className="size-4 text-eos-text-muted" strokeWidth={2} />
              <p
                data-display-text="true"
                className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                AI Act disclosure
              </p>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <CeBadge mode="transparent" className="normal-case tracking-normal" />
                <span className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em] text-eos-text-muted">
                  Human oversight required
                </span>
              </div>

              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Sisteme AI folosite în produs
              </p>

              <div className="space-y-2">
                {AI_SYSTEMS.map((system) => (
                  <div
                    key={system.name}
                    className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-3.5"
                  >
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2.5} />
                      <p
                        data-display-text="true"
                        className="font-display text-[13px] font-semibold tracking-[-0.01em] text-eos-text"
                      >
                        {system.name}
                      </p>
                    </div>
                    <p className="mt-1.5 text-[12px] leading-[1.5] text-eos-text-muted">
                      {system.purpose}
                    </p>
                    <span className="mt-2 inline-flex items-center rounded-sm border border-eos-primary/25 bg-eos-primary/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em] text-eos-primary">
                      {system.riskClass}
                    </span>
                    <p className="mt-2 text-[11.5px] leading-[1.5] text-eos-text-muted">
                      <span className="font-mono uppercase tracking-[0.05em] text-eos-text">
                        Oversight ·
                      </span>{" "}
                      {system.humanOversight}
                    </p>
                    <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
                      <span className="font-mono uppercase tracking-[0.05em] text-eos-text">Date ·</span>{" "}
                      {system.dataUsed}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3 text-[12.5px] leading-[1.6] text-eos-text-muted">
                CompliScan este poziționat operațional ca sistem informativ și asistiv —
                propune, explică și structurează, dar nu trimite automat către autorități,
                nu semnează documente și nu marchează ireversibil conformitatea fără
                confirmare umană explicită.
              </div>

              <div className="rounded-eos-sm border border-eos-warning/25 bg-eos-warning-soft px-3.5 py-3 text-[12px] leading-[1.55] text-eos-text-muted">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-warning">
                  CE Decision Gate
                </p>
                <p className="mt-2">
                  Clasificarea finală sub AI Act (Art. 50 limited risk vs. Annex III
                  high-risk) depinde de analiza juridică. CompliScan operează sub prezumția
                  de <strong className="text-eos-text">limited risk cu obligații de transparență</strong>{" "}
                  și nu revendică CE marking.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Lifecycle + Quick links ── */}
        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Lifecycle date și solicitări
            </p>
            <h3
              data-display-text="true"
              className="mt-2 font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Cum gestionăm datele tale după închiderea contului
            </h3>
            <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">
              Datele de cont și datele operaționale sunt păstrate pe durata relației
              contractuale, apoi intră într-un flux de închidere controlată. Țintă
              operațională curentă: <strong className="text-eos-text">≤ 90 zile</strong>{" "}
              pentru curățarea datelor din workspace, iar solicitările de ștergere validate
              sunt procesate în <strong className="text-eos-text">≤ 30 zile</strong>, sub
              rezerva obligațiilor legale de arhivare sau audit.
            </p>
            <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">
              Pentru review juridic sau change log subprocesori:{" "}
              <a
                href="mailto:legal@compliscan.ro"
                className="text-eos-primary underline-offset-2 hover:underline"
              >
                legal@compliscan.ro
              </a>
              . Cererile de confidențialitate și ștergere:{" "}
              <a
                href="mailto:privacy@compliscan.ro"
                className="text-eos-primary underline-offset-2 hover:underline"
              >
                privacy@compliscan.ro
              </a>
              .
            </p>
          </div>

          <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Legături rapide
            </p>
            <div className="mt-3 space-y-2">
              {[
                { href: "/dpa", label: "DPA · format HTML", external: false },
                { href: "/privacy", label: "Politica de confidențialitate", external: false },
                { href: "/terms", label: "Termeni și condiții", external: false },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group flex items-center justify-between gap-3 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-2.5 text-[12.5px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:bg-white/[0.04] hover:text-eos-text"
                >
                  {link.label}
                  <ExternalLink className="size-3.5 text-eos-text-tertiary transition-colors group-hover:text-eos-primary" strokeWidth={2} />
                </Link>
              ))}
              <Link
                href="/legal/dpa-compliscan.pdf"
                className="group flex items-center justify-between gap-3 rounded-eos-sm bg-eos-primary px-3.5 py-2.5 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90"
              >
                Descarcă DPA · PDF
                <Download className="size-3.5" strokeWidth={2.5} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">Acasă</Link>
          <Link href="/privacy" className="transition-colors hover:text-eos-text-muted">Privacy</Link>
          <Link href="/terms" className="transition-colors hover:text-eos-text-muted">Termeni</Link>
          <Link href="/dpa" className="transition-colors hover:text-eos-text-muted">DPA</Link>
          <span className="ml-auto text-eos-text-muted">© 2026 CompliScan</span>
        </div>
      </footer>
    </div>
  )
}
