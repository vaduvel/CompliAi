import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata = {
  title: "Termeni și Condiții — CompliScan",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      {/* ── Top nav ── */}
      <header className="sticky top-0 z-50 border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-eos-text-muted transition-colors hover:text-eos-text sm:inline-flex"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2.5} />
              Acasă
            </Link>
            <Link
              href="/login"
              className="rounded-eos-sm border border-eos-border bg-transparent px-3 py-1.5 text-[12.5px] font-medium text-eos-text-muted transition-all hover:border-eos-border-strong hover:text-eos-text"
            >
              Conectare
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <div className="mb-10">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Document legal · contract de utilizare
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[40px]"
          >
            Termeni și Condiții de Utilizare
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            Ultima actualizare · 18 martie 2026
          </p>
        </div>

        {/* Disclaimer hero card */}
        <div className="mb-10 rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft px-5 py-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            Disclamer juridic
          </p>
          <p className="mt-2 text-[13.5px] leading-[1.65] text-eos-text-muted">
            <strong className="text-eos-text">CompliScan NU oferă consultanță juridică.</strong>{" "}
            Conținutul generat reprezintă instrumente de asistență — validează cu un avocat
            sau consultant juridic înainte de utilizare oficială.
          </p>
        </div>

        <article className="space-y-8">
          {[
            {
              n: "01",
              h: "Serviciul CompliScan",
              body: (
                <p>
                  CompliScan (&ldquo;Serviciul&rdquo;) este un instrument digital de asistență în
                  pregătirea conformității cu reglementările aplicabile în Uniunea Europeană:
                  GDPR, EU AI Act, NIS2 și cerințele e-Factura ANAF. Serviciul este operat de
                  CompliScan SRL (în curs de constituire) cu sediul în România.
                </p>
              ),
            },
            {
              n: "02",
              h: "Natura Serviciului",
              body: (
                <>
                  <p>
                    <strong className="text-eos-text">CompliScan NU oferă consultanță juridică.</strong>{" "}
                    Conținutul generat de Serviciu — documente, rapoarte, scoruri, recomandări — sunt
                    instrumente de asistență, nu avize juridice cu forță legală.
                  </p>
                  <p className="mt-3">
                    Utilizatorii sunt responsabili pentru validarea finală a documentelor
                    împreună cu un avocat sau consultant calificat. CompliScan nu garantează
                    conformitatea deplină.
                  </p>
                </>
              ),
            },
            {
              n: "03",
              h: "Eligibilitate și Conturi",
              body: (
                <p>
                  Serviciul este destinat persoanelor juridice (societăți comerciale, ONG-uri,
                  instituții publice) cu sediul sau activitate în UE. Prin crearea unui cont,
                  utilizatorul declară că are cel puțin 18 ani și autoritatea legală de a
                  acționa în numele organizației.
                </p>
              ),
            },
            {
              n: "04",
              h: "Planuri și Facturare",
              body: (
                <>
                  <p>
                    Serviciul oferă planuri gratuite și cu plată (Pro, Partner). Facturarea
                    planurilor cu plată se realizează lunar prin Stripe. Prețurile afișate sunt
                    în EUR și nu includ TVA.
                  </p>
                  <p className="mt-3">
                    Perioada de trial de 14 zile este gratuită, fără obligații, fără card. La
                    expirare, contul revine la planul gratuit dacă nu a fost efectuată plată.
                  </p>
                </>
              ),
            },
            {
              n: "05",
              h: "Proprietate Intelectuală",
              body: (
                <p>
                  Codul sursă, design-ul, algoritmii și modelele de date ale Serviciului sunt
                  proprietatea CompliScan. Documentele generate de utilizator pe baza datelor
                  proprii aparțin utilizatorului.
                </p>
              ),
            },
            {
              n: "06",
              h: "Protecția Datelor",
              body: (
                <p>
                  Prelucrarea datelor cu caracter personal este descrisă în{" "}
                  <Link href="/privacy" className="text-eos-primary underline-offset-2 hover:underline">
                    Politica de Confidențialitate
                  </Link>{" "}
                  și în{" "}
                  <Link href="/dpa" className="text-eos-primary underline-offset-2 hover:underline">
                    Acordul de Prelucrare a Datelor (DPA)
                  </Link>
                  .
                </p>
              ),
            },
            {
              n: "07",
              h: "Limitarea Răspunderii",
              body: (
                <p>
                  În măsura permisă de legea aplicabilă, CompliScan nu este răspunzătoare pentru:
                  decizii de afaceri luate pe baza informațiilor din Serviciu; amenzi sau
                  sancțiuni rezultate din conformitate incompletă; pierderi indirecte sau
                  daune consecvente.
                </p>
              ),
            },
            {
              n: "08",
              h: "Modificarea Termenilor",
              body: (
                <p>
                  CompliScan poate modifica acești Termeni cu notificare de minim 30 de zile prin
                  email sau în aplicație. Continuarea utilizării după notificare constituie
                  acceptul noilor termeni.
                </p>
              ),
            },
            {
              n: "09",
              h: "Drept Aplicabil",
              body: (
                <p>
                  Acești Termeni sunt guvernați de legea română. Litigiile se vor soluționa pe
                  cale amiabilă sau, în caz de eșec, la instanțele competente din România.
                </p>
              ),
            },
            {
              n: "10",
              h: "Contact",
              body: (
                <p>
                  Pentru întrebări juridice sau privind termenii:{" "}
                  <a
                    href="mailto:legal@compliscan.ro"
                    className="text-eos-primary underline-offset-2 hover:underline"
                  >
                    legal@compliscan.ro
                  </a>
                </p>
              ),
            },
          ].map((s) => (
            <section key={s.n} className="grid gap-3 border-t border-eos-border pt-7 md:grid-cols-[80px_1fr] md:gap-8">
              <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
                {s.n}
              </div>
              <div>
                <h2
                  data-display-text="true"
                  className="font-display text-[18px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
                >
                  {s.h}
                </h2>
                <div className="mt-3 text-[14px] leading-[1.7] text-eos-text-muted [&_a]:text-eos-primary [&_strong]:font-semibold">
                  {s.body}
                </div>
              </div>
            </section>
          ))}
        </article>

        <div className="mt-16 grid gap-3 border-t border-eos-border pt-8 sm:grid-cols-2">
          <Link
            href="/privacy"
            className="group flex items-center justify-between gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5 transition-colors hover:border-eos-border-strong hover:bg-white/[0.02]"
          >
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Document conex
              </p>
              <p
                data-display-text="true"
                className="mt-1 font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Politica de Confidențialitate
              </p>
            </div>
            <ArrowRight className="size-4 text-eos-text-tertiary transition-colors group-hover:text-eos-text" />
          </Link>
          <Link
            href="/dpa"
            className="group flex items-center justify-between gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5 transition-colors hover:border-eos-border-strong hover:bg-white/[0.02]"
          >
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Document conex
              </p>
              <p
                data-display-text="true"
                className="mt-1 font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Acordul DPA
              </p>
            </div>
            <ArrowRight className="size-4 text-eos-text-tertiary transition-colors group-hover:text-eos-text" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">
            Acasă
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-eos-text-muted">
            Privacy
          </Link>
          <Link href="/dpa" className="transition-colors hover:text-eos-text-muted">
            DPA
          </Link>
          <span className="ml-auto text-eos-text-muted">© 2026 CompliScan</span>
        </div>
      </footer>
    </div>
  )
}
