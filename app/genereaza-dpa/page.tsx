import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, ShieldCheck, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Generator Acord de Prelucrare Date (DPA) GDPR — CompliScan",
  description:
    "Generează un Acord de Prelucrare a Datelor (DPA) conform GDPR Art. 28 pentru firma ta. Obligatoriu pentru relațiile operator–procesator. Template complet în română.",
  keywords: [
    "acord prelucrare date DPA GDPR",
    "generator DPA Romania",
    "GDPR Art 28 Romania",
    "contract prelucrare date personale",
    "data processing agreement Romania",
  ],
  openGraph: {
    title: "Generator Acord de Prelucrare Date (DPA) — CompliScan",
    description: "Generează un DPA complet conform GDPR Art. 28. Template personalizat în română.",
    type: "website",
  },
}

const FEATURES = [
  "Conform GDPR Art. 28 complet",
  "Obligațiile procesatorului (Art. 28.3 a-h)",
  "Clauze sub-procesatori",
  "Notificare breșe de date",
  "Transferuri internaționale (SCC)",
  "Durata și rezilierea contractului",
]

export default function GenereazaDpaPage() {
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
            className="rounded-lg bg-eos-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-eos-primary-hover"
          >
            Deschide dashboard →
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-4 py-16 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-eos-primary-soft px-3 py-1 text-xs font-medium text-eos-primary ring-1 ring-blue-200">
            <Sparkles className="size-3" strokeWidth={2} />
            GDPR Art. 28 — obligatoriu cu procesatorii
          </span>

          <h1 className="mt-4 text-3xl font-bold text-gray-900 sm:text-4xl">
            Generator Acord de Prelucrare Date (DPA)
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Generează un DPA complet și personalizat pentru relația ta cu procesatorii de date.
            Conform GDPR Art. 28. În română. Cu toate clauzele obligatorii.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-eos-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-eos-primary-hover"
            >
              Generează DPA
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            ⚠️ Disponibil în planul Starter. Verificare umană obligatorie înainte de semnare.
          </p>
        </section>

        {/* What is DPA */}
        <section className="border-y border-gray-200 bg-white py-10">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Ce este un DPA și când este obligatoriu?
            </h2>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong className="text-gray-800">GDPR Art. 28</strong> impune încheierea unui Acord de Prelucrare a
                Datelor între <em>operatorul de date</em> (firma ta) și orice <em>procesator</em> — servicii cloud,
                platforme SaaS, agenții de marketing, furnizori de e-mail, procesatori de plăți.
              </p>
              <p>
                Fără DPA, relația este <strong className="text-gray-800">ilegală conform GDPR</strong> și poate
                atrage amenzi ANSPDCP. Exemple de procesatori care necesită DPA: Google Workspace, AWS, Stripe,
                Mailchimp, HubSpot, orice furnizor care accesează date personale ale clienților tăi.
              </p>
              <p>
                CompliScan generează un DPA complet cu toate clauzele obligatorii, inclusiv lista sub-procesatorilor,
                dreptul de audit și procedura de notificare a breșelor de date.
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-4xl px-4 py-12">
          <h2 className="mb-8 text-center text-xl font-semibold text-gray-900">
            Ce conține DPA-ul generat
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5 rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={2} />
                <p className="text-sm text-gray-700">{feature}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-900 py-12">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <FileText className="mx-auto mb-3 size-8 text-gray-400" strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-white">
              DPA + Privacy Policy + Cookie Policy + NIS2
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              Toate documentele de conformitate într-un singur loc. GDPR, EU AI Act, e-Factura.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-eos-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-eos-primary-hover"
            >
              Înregistrează-te gratuit
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white py-6">
        <div className="mx-auto max-w-5xl px-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} CompliScan.ro ·{" "}
          <Link href="/genereaza-politica-gdpr" className="hover:text-gray-600">
            Generator Privacy Policy
          </Link>{" "}
          ·{" "}
          <Link href="/trust" className="hover:text-gray-600">
            Trust Center
          </Link>
        </div>
      </footer>
    </div>
  )
}
