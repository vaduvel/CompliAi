import Link from "next/link"
import { ArrowRight, ArrowLeft } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

export const metadata = {
  title: "Acord de Prelucrare a Datelor (DPA) — CompliAI",
}

export default function DpaPage() {
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
            Document legal · Art. 28 GDPR
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[40px]"
          >
            Acord de Prelucrare a Datelor (DPA)
          </h1>
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            Ultima actualizare · 18 martie 2026
          </p>
        </div>

        {/* Intro card */}
        <div className="mb-10 rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.06] px-5 py-4">
          <p className="text-[13.5px] leading-[1.65] text-eos-text-muted">
            Prezentul Acord de Prelucrare a Datelor (&ldquo;DPA&rdquo;) se aplică automat
            tuturor utilizatorilor CompliAI care, prin utilizarea Serviciului, acționează în
            calitate de <strong className="text-eos-text">operatori de date</strong> conform
            GDPR, și implică CompliAI în calitate de{" "}
            <strong className="text-eos-text">persoană împuternicită de operator (procesator)</strong>.
          </p>
        </div>

        <article className="space-y-8">
          {[
            {
              n: "01",
              h: "Definiții",
              body: (
                <ul className="space-y-2">
                  <li>
                    <strong className="text-eos-text">Operator</strong> — organizația utilizatoare
                    a CompliAI (clientul)
                  </li>
                  <li>
                    <strong className="text-eos-text">Procesator</strong> — CompliAI SRL
                  </li>
                  <li>
                    <strong className="text-eos-text">Date Personale</strong> — orice date cu
                    caracter personal introduse de Operator în Serviciu
                  </li>
                  <li>
                    <strong className="text-eos-text">GDPR</strong> — Regulamentul (UE) 2016/679
                  </li>
                </ul>
              ),
            },
            {
              n: "02",
              h: "Obiectul Prelucrării",
              body: (
                <p>
                  CompliAI prelucrează datele introduse de Operator exclusiv pentru furnizarea
                  funcționalităților Serviciului: stocare, calcul scor conformitate, generare
                  documente, export rapoarte. Nu există prelucrare în scopuri proprii ale
                  CompliAI fără consimțământ explicit.
                </p>
              ),
            },
            {
              n: "03",
              h: "Categoriile de Date și Subiecți",
              body: (
                <ul className="space-y-2">
                  <li>Date de identificare angajați (pentru chestionare HR, inventar AI)</li>
                  <li>Date de contact (email, telefon) ale persoanelor de contact</li>
                  <li>Date operaționale (incidente, riscuri, findinguri de conformitate)</li>
                </ul>
              ),
            },
            {
              n: "04",
              h: "Instrucțiunile Operatorului",
              body: (
                <p>
                  CompliAI prelucrează datele conform instrucțiunilor documentate ale
                  Operatorului, transmise prin interfața Serviciului. Dacă o instrucțiune
                  încalcă GDPR, CompliAI va notifica Operatorul înainte de executare.
                </p>
              ),
            },
            {
              n: "05",
              h: "Obligațiile CompliAI (Art. 28(3) GDPR)",
              body: (
                <ul className="space-y-2">
                  <li>
                    <strong className="text-eos-text">Confidențialitate</strong> — accesul
                    personalului la datele Operatorului este limitat și documentat
                  </li>
                  <li>
                    <strong className="text-eos-text">Securitate</strong> — măsuri tehnice și
                    organizatorice conform Art. 32 GDPR
                  </li>
                  <li>
                    <strong className="text-eos-text">Sub-procesori</strong> — notificare prealabilă
                    cu 30 de zile la adăugarea de noi sub-procesori
                  </li>
                  <li>
                    <strong className="text-eos-text">Asistență</strong> — sprijin pentru
                    exercitarea drepturilor persoanelor vizate
                  </li>
                  <li>
                    <strong className="text-eos-text">Ștergere</strong> — ștergerea sau returnarea
                    datelor la finalizarea contractului
                  </li>
                  <li>
                    <strong className="text-eos-text">Audit</strong> — informații și acces pentru
                    verificarea conformității
                  </li>
                </ul>
              ),
            },
            {
              n: "06",
              h: "Sub-procesori Actuali",
              body: (
                <ul className="space-y-2">
                  <li>
                    <strong className="text-eos-text">Stripe Inc.</strong> — procesare plăți (SCC
                    cu garanții adecvate)
                  </li>
                  <li>
                    <strong className="text-eos-text">Supabase Inc.</strong> — stocare date (region
                    EU, Frankfurt)
                  </li>
                  <li>
                    <strong className="text-eos-text">Resend Inc.</strong> — trimitere email
                    tranzacțional (SCC)
                  </li>
                  <li>
                    <strong className="text-eos-text">Google Cloud Platform</strong> — servicii
                    AI/OCR (region EU)
                  </li>
                </ul>
              ),
            },
            {
              n: "07",
              h: "Transferuri Internaționale",
              body: (
                <p>
                  Transferurile de date în afara SEE se realizează exclusiv pe baza Clauzelor
                  Contractuale Standard (SCC) aprobate de Comisia Europeană sau a altor
                  mecanisme de transfer adecvate.
                </p>
              ),
            },
            {
              n: "08",
              h: "Notificare Incidente",
              body: (
                <p>
                  CompliAI va notifica Operatorul fără întârzieri nejustificate, și în cel mult
                  72 de ore de la constatare, în cazul unui incident de securitate care
                  afectează datele Operatorului.
                </p>
              ),
            },
            {
              n: "09",
              h: "Durata și Ștergerea",
              body: (
                <p>
                  DPA este valabil pe durata contractului de servicii. La terminarea
                  contractului, CompliAI va șterge sau returna datele în termen de 30 de zile,
                  conform opțiunii Operatorului.
                </p>
              ),
            },
            {
              n: "10",
              h: "Contact DPO",
              body: (
                <p>
                  Pentru exercitarea drepturilor sau solicitări DPA:{" "}
                  <a
                    href="mailto:dpo@compliscan.ro"
                    className="text-eos-primary underline-offset-2 hover:underline"
                  >
                    dpo@compliscan.ro
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
        </div>
      </main>

      <footer className="border-t border-eos-border-subtle py-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-5 gap-y-2 px-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
          <Link href="/" className="transition-colors hover:text-eos-text-muted">
            Acasă
          </Link>
          <Link href="/terms" className="transition-colors hover:text-eos-text-muted">
            Termeni
          </Link>
          <Link href="/privacy" className="transition-colors hover:text-eos-text-muted">
            Privacy
          </Link>
          <span className="ml-auto text-eos-text-muted">© 2026 CompliScan</span>
        </div>
      </footer>
    </div>
  )
}
