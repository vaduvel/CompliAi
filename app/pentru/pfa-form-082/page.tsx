import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, FileText, Lock } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { PFA_FORM082_DEADLINE_ISO } from "@/lib/compliance/pfa-form082-tracker"

export const metadata: Metadata = {
  title: "PFA Form 082 — registrare e-Factura până la 26 mai 2026 | CompliScan",
  description:
    "Persoanele fizice (PFA / CNP) trebuie să se înregistreze în Registrul RO e-Factura prin Formularul 082 până la 26 mai 2026 (Ordin ANAF 378/2026). Verifică statusul portofoliului tău.",
  keywords: [
    "PFA Form 082",
    "Formular 082 ANAF",
    "PFA e-Factura 2026",
    "CNP Registrul e-Factura",
    "Ordin ANAF 378/2026",
    "OG 6/2026 PFA",
  ],
  openGraph: {
    title: "PFA Form 082 — registrare e-Factura până la 26 mai 2026",
    description: "Persoanele fizice cu CNP trebuie să se înregistreze prin Form 082. Deadline 26 mai 2026.",
    type: "website",
  },
}

function daysUntilDeadline(): number {
  const now = Date.now()
  const deadline = new Date(PFA_FORM082_DEADLINE_ISO).getTime()
  return Math.max(0, Math.ceil((deadline - now) / 86_400_000))
}

export default function PfaForm082Page() {
  const daysLeft = daysUntilDeadline()
  const urgent = daysLeft <= 14

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <Link
            href="/register?utm_source=pfa_form082&utm_medium=topnav"
            className="flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 text-[12.5px] font-semibold text-white hover:bg-eos-primary/90"
          >
            Cont gratuit
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-8 px-6 py-12">
        <section className="space-y-4">
          <span className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-warning">
            <Clock className="size-3.5" strokeWidth={2} />
            Deadline 26 mai 2026
          </span>
          <h1
            data-display-text="true"
            className="font-display text-[32px] font-semibold tracking-[-0.025em] text-eos-text md:text-[40px]"
          >
            PFA / CNP — Formular 082 obligatoriu pentru e-Factura
          </h1>
          <p className="text-[15px] leading-[1.55] text-eos-text-muted">
            Persoanele fizice identificate fiscal prin <strong>CNP</strong> (PFA, II, IF,
            profesii liberale, fotografi, influenceri, deținători de drepturi IP) au obligația
            de a depune <strong>Formularul 082</strong> în SPV ANAF până la <strong>26 mai
            2026</strong>, conform <em>Ordinului ANAF 378/2026</em> + <em>OG 6/2026</em>.
            Obligația e-Factura intră în vigoare pentru ei pe <strong>1 iunie 2026</strong>.
          </p>
        </section>

        <section
          className={`overflow-hidden rounded-eos-lg border ${
            urgent
              ? "border-eos-error/30 bg-eos-error-soft"
              : "border-eos-warning/30 bg-eos-warning-soft"
          } p-6`}
        >
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]">
            Countdown deadline
          </p>
          <p className="mt-2 font-display text-[56px] font-bold leading-none">
            {daysLeft} <span className="text-[24px] font-medium">{daysLeft === 1 ? "zi" : "zile"}</span>
          </p>
          <p className="mt-3 text-[13px] leading-[1.5]">
            {urgent
              ? "Mai puțin de 2 săptămâni. Dacă ai clienți PFA / CNP în portofoliu, verifică-le statusul URGENT."
              : "Pregătește-ți portofoliul: identifică toți clienții PFA / CNP și depune Form 082 cu certificat digital prin SPV."}
          </p>
        </section>

        <section className="space-y-4">
          <h2
            data-display-text="true"
            className="font-display text-[22px] font-semibold tracking-[-0.02em] text-eos-text"
          >
            Cine trebuie să depună Form 082?
          </h2>
          <ul className="space-y-2 text-[14px] text-eos-text">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
              <span><strong>PFA</strong> identificat fiscal prin CNP (nu CIF)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
              <span><strong>Întreprinderi individuale (II)</strong> și <strong>familiale (IF)</strong> cu CNP</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
              <span><strong>Profesii liberale</strong> (avocați, notari, doctori, traducători) cu CNP</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
              <span><strong>Fotografi, influenceri</strong>, deținători drepturi IP cu venituri impozabile</span>
            </li>
          </ul>
          <p className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3 text-[12.5px] text-eos-text-muted">
            <strong>Excepție:</strong> fermierii sub regim agricol special — exempt până la 1 iunie
            2026 (OUG 52/2025).
          </p>
        </section>

        <section className="space-y-4">
          <h2
            data-display-text="true"
            className="font-display text-[22px] font-semibold tracking-[-0.02em] text-eos-text"
          >
            Cum depui Form 082 (5 pași)
          </h2>
          <ol className="space-y-3 text-[14px] text-eos-text">
            <li><strong>1.</strong> Loghează-te în SPV ANAF cu certificat digital calificat.</li>
            <li><strong>2.</strong> Mergi la <em>Formulare → Cerere de înregistrare în Registrul RO e-Factura</em>.</li>
            <li><strong>3.</strong> Selectează <strong>Formular 082</strong> (versiune actualizată Ordin ANAF 378/2026).</li>
            <li><strong>4.</strong> Completează datele cerute (CNP, denumire, adresă fiscală, CAEN).</li>
            <li><strong>5.</strong> Semnează digital + transmite. Confirmarea ANAF vine în câteva zile lucrătoare via SPV.</li>
          </ol>
        </section>

        <section className="space-y-4 rounded-eos-lg border border-eos-border bg-eos-surface-elevated p-6">
          <div className="flex items-start gap-3">
            <Lock className="mt-0.5 size-5 text-eos-primary" strokeWidth={2} />
            <div className="space-y-2">
              <h3 className="font-display text-[18px] font-semibold text-eos-text">
                Ai mai mult de 5 clienți PFA?
              </h3>
              <p className="text-[13px] leading-[1.55] text-eos-text-muted">
                Cabinetele fiscale cu mai multe clienți PFA pierd ore căutând în SPV cine s-a
                înregistrat și cine nu. <strong>CompliScan PFA Tracker</strong> centralizează
                toți clienții tăi PFA cu status real-time, countdown personal pe deadline și
                reminders automate la 14/7/3/1 zile înainte de 26 mai 2026.
              </p>
              <Link
                href="/register?utm_source=pfa_form082&utm_medium=cta_box&utm_campaign=deadline_may26"
                className="inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-2 text-[13px] font-semibold text-white hover:bg-eos-primary/90"
              >
                Activează PFA Tracker (gratuit 14 zile)
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </Link>
            </div>
          </div>
        </section>

        <section className="space-y-2 text-[12px] text-eos-text-tertiary">
          <p>
            <strong>Bază legală:</strong> OG 6/2026, Ordin ANAF 378/2026 (M.Of. 250 / 31 martie
            2026), OUG 120/2021 modif. OUG 89/2025.
          </p>
          <p>
            Această pagină e informativă. Nu constituie consultanță juridică sau fiscală;
            validarea de specialitate rămâne în responsabilitatea cabinetului CECCAR.
          </p>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-3 border-t border-eos-border-subtle pt-6 text-[12.5px]">
          <Link
            href="/calculator-amenzi-anaf"
            className="inline-flex items-center gap-1.5 text-eos-primary hover:underline"
          >
            <FileText className="size-3.5" strokeWidth={2} />
            Calculator amenzi ANAF →
          </Link>
          <Link
            href="/verifica-saft-hygiene"
            className="inline-flex items-center gap-1.5 text-eos-primary hover:underline"
          >
            <FileText className="size-3.5" strokeWidth={2} />
            Verifică SAF-T Hygiene →
          </Link>
        </section>
      </main>
    </div>
  )
}
