import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata = {
  title: "Politica de Confidențialitate — CompliScan",
}

export default function PrivacyPage() {
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
        {/* Hero */}
        <div className="mb-10">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Document legal · GDPR
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[40px]"
          >
            Politica de Confidențialitate
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            Ultima actualizare · 18 martie 2026
          </p>
        </div>

        {/* Prose body */}
        <article className="space-y-8">
          {[
            {
              n: "01",
              h: "Operatorul de Date",
              body: (
                <p>
                  Operatorul datelor cu caracter personal este CompliScan SRL (în curs de
                  constituire), cu sediul în România. Contact:{" "}
                  <a
                    href="mailto:privacy@compliscan.ro"
                    className="text-eos-primary underline-offset-2 hover:underline"
                  >
                    privacy@compliscan.ro
                  </a>
                </p>
              ),
            },
            {
              n: "02",
              h: "Categorii de Date Prelucrate",
              body: (
                <ul className="space-y-2">
                  <li>
                    <strong className="text-eos-text">Date de cont</strong> — adresă email, parolă
                    (hash bcrypt), nume organizație, CUI
                  </li>
                  <li>
                    <strong className="text-eos-text">Date de utilizare</strong> — logs de acces,
                    IP, browser, acțiuni în aplicație
                  </li>
                  <li>
                    <strong className="text-eos-text">Date de conformitate</strong> — documentele,
                    răspunsurile la chestionare și datele introduse de utilizator în scopuri de
                    compliance — aceste date aparțin utilizatorului
                  </li>
                  <li>
                    <strong className="text-eos-text">Date de facturare</strong> — procesate
                    integral de Stripe; CompliScan nu stochează date de card
                  </li>
                </ul>
              ),
            },
            {
              n: "03",
              h: "Scopurile Prelucrării",
              body: (
                <ul className="space-y-2">
                  <li>Furnizarea și îmbunătățirea Serviciului</li>
                  <li>Autentificarea și securizarea conturilor</li>
                  <li>Facturarea și gestionarea abonamentelor</li>
                  <li>Comunicări de serviciu (notificări, digest săptămânal)</li>
                  <li>Respectarea obligațiilor legale</li>
                </ul>
              ),
            },
            {
              n: "04",
              h: "Temeiurile Juridice (Art. 6 GDPR)",
              body: (
                <ul className="space-y-2">
                  <li>
                    <strong className="text-eos-text">Executarea contractului</strong> (Art. 6(1)(b))
                    — pentru furnizarea Serviciului
                  </li>
                  <li>
                    <strong className="text-eos-text">Consimțământ</strong> (Art. 6(1)(a)) — pentru
                    emailuri de marketing (opțional)
                  </li>
                  <li>
                    <strong className="text-eos-text">Obligație legală</strong> (Art. 6(1)(c)) —
                    pentru facturare și arhivare fiscală
                  </li>
                  <li>
                    <strong className="text-eos-text">Interes legitim</strong> (Art. 6(1)(f)) —
                    pentru securitate și detectarea fraudei
                  </li>
                </ul>
              ),
            },
            {
              n: "05",
              h: "Destinatari și Transferuri",
              body: (
                <>
                  <p>
                    Datele pot fi accesate de subprocesori contractuali, toți cu sediul în UE sau
                    cu garanții adecvate (SCC):
                  </p>
                  <ul className="mt-3 space-y-2">
                    <li>
                      <strong className="text-eos-text">Stripe Inc.</strong> — procesare plăți (SCC)
                    </li>
                    <li>
                      <strong className="text-eos-text">Supabase</strong> — stocare date (EU region)
                    </li>
                    <li>
                      <strong className="text-eos-text">Resend</strong> — trimitere email (SCC)
                    </li>
                    <li>
                      <strong className="text-eos-text">Google Cloud</strong> — OCR și AI (EU region)
                    </li>
                  </ul>
                </>
              ),
            },
            {
              n: "06",
              h: "Retenție",
              body: (
                <p>
                  Datele de cont se păstrează pe durata contractului și 3 ani după închiderea
                  contului (obligații fiscale). Datele de utilizare anonimizate pot fi păstrate
                  nedefinit în scopuri statistice.
                </p>
              ),
            },
            {
              n: "07",
              h: "Drepturile Tale (Art. 15–22 GDPR)",
              body: (
                <>
                  <p>
                    Ai dreptul la: acces, rectificare, ștergere, portabilitate, restricționare,
                    opoziție și retragerea consimțământului. Cereri la:{" "}
                    <a
                      href="mailto:privacy@compliscan.ro"
                      className="text-eos-primary underline-offset-2 hover:underline"
                    >
                      privacy@compliscan.ro
                    </a>
                  </p>
                  <p className="mt-3">
                    Ai dreptul să depui plângere la ANSPDCP (Autoritatea Națională de
                    Supraveghere).
                  </p>
                </>
              ),
            },
            {
              n: "08",
              h: "Cookie-uri",
              body: (
                <p>
                  Serviciul folosește cookie-uri strict necesare (sesiune autentificare) și, cu
                  consimțământul tău, cookie-uri analitice. Nu folosim cookie-uri de tracking de
                  la terți în absența consimțământului explicit.
                </p>
              ),
            },
            {
              n: "09",
              h: "Modificări",
              body: (
                <p>
                  Modificările semnificative vor fi notificate cu cel puțin 30 de zile înainte
                  prin email sau banner în aplicație.
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

        {/* Related links */}
        <div className="mt-16 grid gap-3 border-t border-eos-border pt-8 sm:grid-cols-2">
          <Link
            href="/terms"
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
                Termeni și Condiții
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

      {/* Footer mono */}
      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">
            Acasă
          </Link>
          <Link href="/terms" className="transition-colors hover:text-eos-text-muted">
            Termeni
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
