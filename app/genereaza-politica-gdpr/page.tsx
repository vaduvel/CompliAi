import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Lock, ShieldCheck, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Generator Politică de Confidențialitate GDPR — CompliScan",
  description:
    "Generează gratuit o Politică de Confidențialitate GDPR personalizată pentru firma ta. Conform Art. 13–14 GDPR, în română, în 30 de secunde.",
  keywords: [
    "politica de confidentialitate GDPR",
    "generator politica GDPR Romania",
    "privacy policy Romania",
    "GDPR Romania SME",
    "politica confidentialitate gratuita",
  ],
  openGraph: {
    title: "Generator Politică de Confidențialitate GDPR — CompliScan",
    description: "Generează gratuit o politică GDPR personalizată pentru firma ta în 30 de secunde.",
    type: "website",
  },
}

const FEATURES = [
  "Conform GDPR Art. 13 și Art. 14",
  "Personalizată cu datele firmei tale",
  "Categorii de date, scopuri, drepturi",
  "Date de contact DPO și responsabil",
  "Download gratuit în format .md",
  "Verificare AI + validare umană recomandată",
]

const STEPS = [
  {
    step: "1",
    title: "Completezi datele firmei",
    detail: "Nume, CUI, website, sector, email DPO — datele tale fac documentul specific.",
  },
  {
    step: "2",
    title: "AI generează documentul",
    detail: "Gemini AI redactează politica completă conform GDPR, în 20–30 de secunde.",
  },
  {
    step: "3",
    title: "Verifici și publici",
    detail: "Descarci în format Markdown, verifici cu un specialist și publici pe site.",
  },
]

export default function GenereazaPoliticaGdprPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <ShieldCheck className="size-5 text-eos-primary" strokeWidth={2} />
            CompliScan
          </Link>
          <Link
            href="/login"
            className="rounded-eos-md bg-eos-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-eos-primary-hover"
          >
            Deschide dashboard →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main>
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-eos-success-soft px-3 py-1 text-xs font-medium text-eos-success ring-1 ring-emerald-200">
            <Sparkles className="size-3" strokeWidth={2} />
            Gratuit — fără card, fără cont
          </span>

          <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Generator Politică de Confidențialitate GDPR
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Generează o politică completă, personalizată pentru firma ta.
            Conform GDPR Art. 13–14. În română. În 30 de secunde.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-eos-primary-hover"
            >
              Generează gratuit
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-eos-md border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              Înregistrează-te gratuit
            </Link>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            ⚠️ Documentele generate de AI necesită verificare umană înainte de publicare.
          </p>
        </section>

        {/* Features */}
        <section className="border-y border-gray-200 bg-white py-12">
          <div className="mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center text-xl font-semibold text-gray-900">
              Ce conține politica generată
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature} className="flex items-start gap-2.5 rounded-eos-md border border-gray-100 bg-gray-50 p-3">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
                  <p className="text-sm text-gray-700">{feature}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-xl font-semibold text-gray-900">
            Cum funcționează
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.step} className="rounded-eos-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex size-8 items-center justify-center rounded-full bg-eos-primary-soft text-sm font-bold text-eos-primary">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-gray-500">{s.detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Legal context */}
        <section className="border-t border-gray-200 bg-white py-10">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              De ce ai nevoie de o Politică de Confidențialitate?
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-800">GDPR Art. 13</strong> obligă orice operator de date să informeze
                persoanele vizate la momentul colectării datelor — prin intermediul site-ului, aplicației sau
                formularului de contact.
              </p>
              <p>
                Amenzile ANSPDCP pentru lipsa politicii sau pentru o politică incompletă pornesc de la câteva
                mii de euro și pot ajunge la <strong className="text-gray-800">4% din cifra de afaceri globală</strong>.
              </p>
              <p>
                O politică generată cu CompliScan acoperă toate secțiunile obligatorii: categorii de date,
                scopuri și temei juridic, durata păstrării, drepturile utilizatorilor, date DPO, transferuri
                internaționale.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-eos-primary py-12">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <Lock className="mx-auto mb-3 size-8 text-eos-primary" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-white">
              Generează politica în 30 de secunde
            </h2>
            <p className="mt-2 text-sm text-eos-primary">
              Gratuit pentru Privacy Policy și Cookie Policy. GDPR + AI Act + e-Factura — toate într-un singur loc.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-eos-md bg-white px-6 py-3 text-sm font-semibold text-eos-primary shadow-sm transition hover:bg-eos-primary-soft"
            >
              Creează cont gratuit
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} CompliScan.ro · Platforma de conformitate pentru IMM-uri românești ·{" "}
          <Link href="/trust" className="hover:text-gray-600">
            Trust Center
          </Link>
        </div>
      </footer>
    </div>
  )
}
