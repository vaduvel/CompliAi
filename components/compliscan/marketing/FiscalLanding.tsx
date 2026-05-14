// [FC-12 2026-05-14] Landing fiscal-only pentru deploy cabinet contabil.
// Activată când NEXT_PUBLIC_PRODUCT_MODE=fiscal.
// Pitch: cockpit cross-client, ANAF SPV, fără DPO/GDPR/AI Act references.

import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  FileWarning,
  ShieldAlert,
  Target,
  TrendingUp,
  Users,
  AlertTriangle,
  Mail,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"

// ── Data ─────────────────────────────────────────────────────────────────────

const HERO_BADGES = ["ANAF SPV", "e-Factura", "SAF-T D406", "CECCAR", "OPANAF"] as const

const SEVEN_CARDS = [
  { icon: FileWarning, color: "text-amber-300", title: "Declarații", desc: "Depuneri întârziate și rectificări cross-client. Vezi ce lipsește la TOȚI clienții într-un singur loc." },
  { icon: Calendar, color: "text-blue-300", title: "Termene 7 zile", desc: "Calendar agregat cu termene ANAF din SPV. Sortat după urgență." },
  { icon: ShieldAlert, color: "text-red-300", title: "Certificate & împuterniciri", desc: "Cert ANAF expiră? Împuternicire form 270 expiră? Alertă cu 30/7 zile înainte." },
  { icon: Mail, color: "text-violet-300", title: "Cereri documente", desc: "Cabinet cere bonuri Z, contracte, AGA, extras bancar — istoric complet pentru audit ANAF." },
  { icon: Target, color: "text-orange-300", title: "Simulare control ANAF", desc: "Dacă ANAF te-ar verifica AZI, unde pici prima dată? Top 5 riscuri ordonate după magnitudine." },
  { icon: AlertTriangle, color: "text-red-300", title: "Probleme prioritare", desc: "Toate excepțiile cross-client într-un singur loc. Total impact RON. Responsabil + termen + recurență." },
  { icon: CreditCard, color: "text-emerald-300", title: "Bank ↔ SPV reconciliere", desc: "Plăți fără factură (suspect!) + facturi neîncasate + reconciliere automată CUI/sumă/dată." },
]

const MOAT_FEATURES = [
  { title: "Diferențe între declarații", desc: "8 verificări care detectează neconcordanțe între D300 ↔ facturi, AGA ↔ D205, AGA ↔ ONRC, D205 ↔ D100, termen ↔ depunere, frecvență TVA." },
  { title: "Impact economic LEI", desc: "Pentru fiecare problemă: „te costă 3.300-8.300 RON” (CPF Art. 219). Nu doar avertizare, ci sumă reală cu interval MIN-MAX." },
  { title: "Profitabilitate per client", desc: "Care client îți consumă cabinetul. Profitabil / efort mare / neprofitabil / inactiv. Recomandare automată: renegociere fee." },
  { title: "ERP ↔ SPV Reconciler", desc: "Folosești SAGA / SmartBill / Oblio? Vezi gap-uri între ERP-ul clientului și SPV ANAF — diferența reală față de SPVGo, SAGA nativ, Nexus." },
]

const COMPETITION = [
  { name: "SAGA", does: "ERP cabinet — book-keeping + generare D300", lacks: "Diferențe între declarații, impact economic, simulare ANAF, probleme prioritare, profitabilitate client" },
  { name: "SmartBill Conta", does: "ERP + integrare SmartBill invoicing", lacks: "Vedere cross-client, simulare risc" },
  { name: "SPVGo", does: "Import e-Factura SPV centralizat", lacks: "Strat analitic peste date" },
  { name: "Nexus ERP", does: "ERP enterprise cu import SPV", lacks: "Workflow non-digital (bonuri, AGA)" },
]

// ── Component ────────────────────────────────────────────────────────────────

export function FiscalLanding() {
  return (
    <main className="min-h-screen bg-eos-bg text-eos-text">
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-30 border-b border-eos-border bg-eos-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <CompliScanLogoLockup size="md" />
          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[12.5px] font-medium text-eos-text hover:bg-eos-surface-elevated"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-md border border-eos-primary bg-eos-primary px-3 py-1.5 text-[12.5px] font-semibold text-white hover:bg-eos-primary/90"
            >
              Programează demo
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── HERO ─── */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-24">
        <div className="flex flex-wrap items-center gap-2 text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-tertiary">
          {HERO_BADGES.map((b) => (
            <span key={b} className="rounded-md border border-eos-primary/30 bg-eos-primary-soft px-2 py-0.5 text-eos-primary">
              {b}
            </span>
          ))}
        </div>
        <h1
          data-display-text="true"
          className="mt-4 font-display text-[42px] font-bold tracking-[-0.025em] text-eos-text md:text-[56px] leading-[1.05]"
        >
          Cockpit pentru cabinet contabil. <br />
          <span className="text-eos-primary">Toate firmele într-un singur ecran.</span>
        </h1>
        <p className="mt-5 max-w-3xl text-[16px] leading-[1.55] text-eos-text-muted md:text-[18px]">
          ANAF SPV + cross-client analytics + reconciliere ERP. Dimineața la 9, deschizi CompliScan
          Fiscal și vezi în <strong className="text-eos-text">7 carduri</strong> ce arde la TOATE
          firmele tale — fără să intri pe rând în fiecare. Click pe o problemă → te ducem direct în
          firma respectivă să o rezolvi.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-lg border border-eos-primary bg-eos-primary px-5 py-3 text-[14px] font-semibold text-white hover:bg-eos-primary/90"
          >
            Programează demo pentru cabinetul tău
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center gap-2 rounded-lg border border-eos-border bg-eos-surface px-5 py-3 text-[14px] font-medium text-eos-text hover:bg-eos-surface-elevated"
          >
            Vezi ce face
          </Link>
        </div>
        <p className="mt-5 text-[12.5px] text-eos-text-tertiary">
          🎯 În căutare de 4 cabinete pilot — gratuit 3 luni în schimbul feedback-ului real.
        </p>
      </section>

      {/* ─── PROBLEMA ─── */}
      <section className="border-y border-eos-border bg-eos-surface-subtle py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-tertiary">
            Problema cu care lucrezi acum
          </p>
          <h2
            data-display-text="true"
            className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-eos-text md:text-[36px]"
          >
            30 de clienți. 8 tool-uri diferite. Niciun tablou general.
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {[
              "Pentru fiecare client te loghezi separat în SAGA + SPV. Manual. Lunar.",
              "Nu vezi cu ochiul liber care client a depus cu întârziere, cine NU și-a încasat facturile, cine are certificat ANAF expirat.",
              "Trebuie să intri pe fiecare client să verifici dacă pot fi probleme. 30 de clienți × 15 min = 7.5 ore/lună doar pentru triage.",
            ].map((p, i) => (
              <div key={i} className="rounded-lg border border-eos-border bg-eos-surface p-4">
                <p className="text-[13.5px] leading-[1.55] text-eos-text">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 7 CARDURI AZI TAB ─── */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-tertiary">
          Soluția — dashboardul "AZI"
        </p>
        <h2
          data-display-text="true"
          className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-eos-text md:text-[36px]"
        >
          Dimineața la 9 deschizi ecranul ăsta și vezi tot.
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] text-eos-text-muted">
          7 carduri pe tip de necesitate. Fiecare item arată firma + impact RON + acțiune. Click →
          ești în firma respectivă pe rezolvat.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {SEVEN_CARDS.map((card) => {
            const Icon = card.icon
            return (
              <div
                key={card.title}
                className="rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-sm transition hover:border-eos-primary/40"
              >
                <Icon className={`size-5 ${card.color}`} strokeWidth={2} />
                <h3 className="mt-3 font-display text-[16px] font-semibold tracking-tight text-eos-text">
                  {card.title}
                </h3>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">{card.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── MOAT ─── */}
      <section className="border-y border-eos-border bg-eos-surface-subtle py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-tertiary">
            Ce nimeni altcineva nu face în RO
          </p>
          <h2
            data-display-text="true"
            className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-eos-text md:text-[36px]"
          >
            4 features care nu există nicăieri pe piață.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {MOAT_FEATURES.map((f) => (
              <div key={f.title} className="rounded-2xl border border-eos-primary/30 bg-eos-primary-soft/30 p-5">
                <h3 className="font-display text-[17px] font-semibold tracking-tight text-eos-text">
                  {f.title}
                </h3>
                <p className="mt-2 text-[13px] leading-[1.55] text-eos-text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── COMPETIȚIE ─── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-tertiary">
          Cu ce concurăm și unde câștigăm
        </p>
        <h2
          data-display-text="true"
          className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-eos-text md:text-[36px]"
        >
          NU înlocuim SAGA. Suntem stratul de analytics deasupra.
        </h2>
        <p className="mt-3 max-w-3xl text-[14px] text-eos-text-muted">
          Cabinetul tot folosește SAGA / SmartBill pentru book-keeping zilnic (note contabile,
          generare D300, balanță). CompliScan Fiscal lucrează deasupra: insights cross-client,
          risk simulation, reconciliere — lucruri pe care ERP-ul tău nu le face.
        </p>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-eos-border">
          <table className="min-w-full divide-y divide-eos-border text-[12.5px]">
            <thead className="bg-eos-surface-subtle">
              <tr>
                <th className="px-4 py-3 text-left font-mono font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                  Tool
                </th>
                <th className="px-4 py-3 text-left font-mono font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                  Ce face bine
                </th>
                <th className="px-4 py-3 text-left font-mono font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                  Ce lipsește (= unde câștigăm noi)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-eos-border bg-eos-surface">
              {COMPETITION.map((c) => (
                <tr key={c.name}>
                  <td className="px-4 py-3 font-semibold text-eos-text">{c.name}</td>
                  <td className="px-4 py-3 text-eos-text-muted">{c.does}</td>
                  <td className="px-4 py-3 text-red-600">{c.lacks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-t border-eos-border bg-eos-surface-subtle py-16">
        <div className="mx-auto max-w-6xl px-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-eos-text-tertiary">
            Cum funcționează
          </p>
          <h2
            data-display-text="true"
            className="mt-2 font-display text-[28px] font-semibold tracking-[-0.015em] text-eos-text md:text-[36px]"
          >
            Setup în 30 minute pe primul client.
          </h2>
          <ol className="mt-8 space-y-4">
            {[
              {
                n: "01",
                title: "Conectezi ANAF SPV cu certificatul cabinetului",
                desc: "OAuth real ANAF. Per client cu împuternicire form 270 (avem PDF generator pre-completat). Mod test sau producție — alegi.",
              },
              {
                n: "02",
                title: "Importi lista clienților (Excel/CSV sau prin Oblio/SmartBill)",
                desc: "Pentru fiecare CUI primit completăm automat: denumire, status TVA, sector CAEN — gratis, din ANAF API public.",
              },
              {
                n: "03",
                title: "CompliScan pulle automat e-Facturile din SPV (zilnic)",
                desc: "Cron job 4×/zi sincronizează facturi noi din SPV. Plus tu uploadezi manual bonuri Z, contracte, AGA, extras bancar.",
              },
              {
                n: "04",
                title: "Dimineața la 9, deschizi dashboardul AZI",
                desc: "7 carduri populate cross-client. Vezi exact ce trebuie făcut. Click pe item → te ducem direct în firma respectivă.",
              },
            ].map((s) => (
              <li key={s.n} className="flex gap-4 rounded-lg border border-eos-border bg-eos-surface p-5">
                <span className="shrink-0 font-mono text-[24px] font-bold text-eos-primary">{s.n}</span>
                <div>
                  <h3 className="font-display text-[16px] font-semibold tracking-tight text-eos-text">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-[13px] leading-[1.55] text-eos-text-muted">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="rounded-3xl border-2 border-eos-primary/40 bg-gradient-to-br from-eos-primary-soft via-eos-surface to-eos-surface p-8 md:p-12">
          <h2
            data-display-text="true"
            className="font-display text-[28px] font-bold tracking-[-0.015em] text-eos-text md:text-[36px]"
          >
            Lista pilot — 4 cabinete contabile din RO
          </h2>
          <p className="mt-3 text-[14px] leading-[1.55] text-eos-text-muted">
            <strong>Gratuit 3 luni</strong> de full access pentru primii 4 cabinete care semnează
            ca piloți. În schimb: 30 min/săptămână de call de feedback. Vrem să construim împreună
            ce contează pentru cabinetul tău real.
          </p>
          <Link
            href="/register"
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-eos-primary bg-eos-primary px-6 py-3 text-[15px] font-semibold text-white hover:bg-eos-primary/90"
          >
            Aplic pentru pilot
            <ArrowRight className="size-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-eos-border bg-eos-surface-subtle px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <CompliScanLogoLockup size="sm" />
          <p className="text-[11px] text-eos-text-tertiary">
            © 2026 CompliScan Fiscal · Cod Procedură Fiscală Art. 219 · CIUS-RO · OPANAF · eIDAS 910/2014
          </p>
        </div>
        <div className="mx-auto mt-6 max-w-6xl">
          <LegalDisclaimer />
        </div>
      </footer>
    </main>
  )
}
