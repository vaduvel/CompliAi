import Link from "next/link"
import { ArrowRight, ShieldCheck, FileCheck2, Cpu, AlertTriangle } from "lucide-react"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"
import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"

// ── Solution cards ────────────────────────────────────────────────────────────

const SOLUTIONS = [
  {
    icon: ShieldCheck,
    title: "Vezi ce ți se aplică",
    description:
      "Pornim din CUI, website și semnalele tale operaționale, apoi îți construim primul snapshot clar.",
  },
  {
    icon: FileCheck2,
    title: "Rezolvi și salvezi dovada",
    description:
      "Finding-urile nu rămân în listă. Intri în cockpit, generezi ce trebuie, atașezi dovada și o trimiți la dosar.",
  },
  {
    icon: Cpu,
    title: "Rămâi sub watch",
    description:
      "După închidere, Compli continuă să monitorizeze drift, review dates și schimbările care îți redeschid cazul.",
  },
]

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Introduci CUI și website",
    description: "Pornim din datele firmei și din semnalele publice sau operaționale pe care le avem deja.",
  },
  {
    step: "2",
    title: "Vezi ce ți se aplică",
    description: "Primești primul snapshot: ce reguli contează, ce am găsit deja și unde sunt golurile reale.",
  },
  {
    step: "3",
    title: "Rezolvi și păstrezi dovada",
    description: "Închizi cazul în cockpit, trimiți rezultatul la dosar și intri apoi în monitorizare.",
  },
]

const AUDIENCES = [
  {
    title: "Pentru IMM",
    description: "Intri repede, afli ce contează, rezolvi ce lipsește și ai ce arăta la control fără să pornești de la zero.",
  },
  {
    title: "Pentru consultant",
    description: "Vezi rapid unde sunt riscurile, pregătești artefactele și păstrezi urme clare pentru handoff și audit.",
  },
  {
    title: "Pentru compliance intern",
    description: "Ai un workspace care leagă descoperirea, rezolvarea, dovada și monitorizarea într-un singur traseu.",
  },
]

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,var(--eos-accent-primary-subtle),transparent_30%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] text-eos-text">
      {/* Nav */}
      <header className="border-b border-eos-border-subtle bg-eos-surface-primary/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <CompliScanLogoLockup variant="flat" size="sm" />
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Prețuri</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Conectare</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">
                Începe gratuit <ArrowRight className="ml-1.5 size-3.5" strokeWidth={2} />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6 pb-16 pt-20 text-center">
          <Badge variant="warning" className="mb-6">
            <AlertTriangle className="size-3" strokeWidth={2} />
            NIS2 activ · GDPR amendează · AI Act intră în vigoare
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight text-eos-text md:text-5xl">
            Afli ce ți se aplică,
            <br />
            rezolvi ce lipsește
            <br />
            <span className="text-eos-primary">și păstrezi dovada.</span>
          </h1>
          <p className="mt-5 text-base text-eos-text-muted md:text-lg">
            CompliScan pornește din CUI, website și semnalele tale operaționale, apoi te duce
            prin același traseu: snapshot, rezolvare, dosar și monitorizare.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Începe gratuit — 2 minute <ArrowRight className="ml-2 size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo/imm">Vezi demo live</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-eos-text-muted">
            Pornim din CUI, website și semnalele tale operaționale. Nu e nevoie de card.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-8">
          <div className="grid gap-4 md:grid-cols-3">
            {JOURNEY_STEPS.map((item) => (
              <Card
                key={item.step}
                className="border-eos-border-subtle bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]"
              >
                <CardContent className="pt-5">
                  <div className="inline-flex rounded-full border border-eos-primary/20 bg-eos-primary/10 px-2.5 py-1 text-xs font-semibold text-eos-primary">
                    Pasul {item.step}
                  </div>
                  <p className="mt-3 font-semibold text-eos-text">{item.title}</p>
                  <p className="mt-1.5 text-sm text-eos-text-muted">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Problem */}
        <section className="border-y border-eos-border-subtle bg-eos-surface-primary">
          <div className="mx-auto max-w-3xl px-6 py-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
              Problema
            </p>
            <h2 className="mt-3 text-xl font-semibold text-eos-text md:text-2xl">
              NIS2 e activ. GDPR amendează. AI Act vine.
              <br />
              Tu nu ai ce arăta la control.
            </h2>
            <p className="mt-3 text-sm text-eos-text-muted md:text-base">
              Firmele din România sunt la risc de amenzi și incidente — nu din lipsă de
              bunăvoință, ci din lipsă de instrumente accesibile. Avocații sunt scumpi.
              Consultanții sunt ocupați. Tabelele Excel nu țin evidența.
            </p>
          </div>
        </section>

        {/* Solution */}
        <section className="mx-auto max-w-5xl px-6 py-16">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
            Ce primești în schimb
          </p>
          <h2 className="mt-3 text-center text-xl font-semibold text-eos-text md:text-2xl">
            Nu doar o scanare. Un traseu complet până la dovadă și monitorizare.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SOLUTIONS.map((item) => (
              <Card
                key={item.title}
                className="border-eos-border-subtle bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]"
              >
                <CardContent className="pt-5">
                  <div className="grid size-9 place-items-center rounded-eos-md border border-eos-border bg-eos-surface-variant">
                    <item.icon className="size-4 text-eos-primary" strokeWidth={1.5} />
                  </div>
                  <p className="mt-3 font-semibold text-eos-text">{item.title}</p>
                  <p className="mt-1.5 text-sm text-eos-text-muted">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {AUDIENCES.map((item) => (
              <Card
                key={item.title}
                className="border-eos-border-subtle bg-eos-surface-primary shadow-[var(--eos-shadow-sm)]"
              >
                <CardContent className="pt-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
                    {item.title}
                  </p>
                  <p className="mt-3 text-sm text-eos-text-muted">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing preview */}
        <section className="border-t border-eos-border-subtle bg-eos-surface-primary">
          <div className="mx-auto max-w-3xl px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-eos-text md:text-2xl">
              Gratuit pentru diagnostic. Pro pentru operare.
            </h2>
            <p className="mt-3 text-sm text-eos-text-muted">
              Planul gratuit îți arată ce legi ți se aplică și scorul de conformitate.
              Pro deblochează tot: documente, Audit Pack, Inspector Mode, NIS2 complet.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/login">
                  Încearcă gratuit <ArrowRight className="ml-2 size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/pricing">Compară planurile</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-eos-border-subtle bg-eos-surface-primary py-8">
        <div className="mx-auto max-w-5xl px-6">
          <LegalDisclaimer variant="short" />
          <div className="mt-4 flex flex-wrap gap-4 text-xs text-eos-text-muted">
            <Link href="/terms" className="hover:text-eos-text">Termeni și condiții</Link>
            <Link href="/privacy" className="hover:text-eos-text">Politica de confidențialitate</Link>
            <Link href="/dpa" className="hover:text-eos-text">DPA</Link>
            <Link href="/pricing" className="hover:text-eos-text">Prețuri</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
