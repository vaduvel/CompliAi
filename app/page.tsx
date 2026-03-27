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
      "După ce închizi un caz, Compli rămâne activ: urmărește drift-ul, datele de review și semnalele noi care contează.",
  },
]

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Introduci CUI și website",
    description: "Ne conectăm la ANAF, analizăm website-ul tău și pornim din semnalele pe care le avem deja.",
  },
  {
    step: "2",
    title: "Primești primul snapshot",
    description: "Vezi ce reguli contează pentru tine, ce am găsit deja și unde sunt golurile reale.",
  },
  {
    step: "3",
    title: "Rezolvi și păstrezi dovada",
    description: "Închizi cazul în cockpit, generezi ce trebuie, atașezi dovada și o trimiți la dosar.",
  },
]

const AUDIENCES = [
  "IMM: vezi ce ți se aplică și închizi rapid ce lipsește",
  "Consultant: păstrezi urme clare pentru handoff și audit",
  "Compliance intern: legi descoperirea, dovada și monitoringul într-un singur traseu",
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
        <section className="mx-auto max-w-3xl px-6 pb-14 pt-20 text-center">
          <Badge variant="warning" className="mb-6">
            <AlertTriangle className="size-3" strokeWidth={2} />
            NIS2 activ · GDPR amendează · AI Act intră în vigoare
          </Badge>
          <h1 className="font-display text-4xl font-bold leading-tight text-eos-text md:text-5xl">
            Afli ce ți se aplică,
            <br />
            rezolvi ce lipsește
            <br />
            <span className="text-eos-primary">și rămâi acoperit.</span>
          </h1>
          <p className="mt-5 text-base text-eos-text-muted md:text-lg">
            Pornești din CUI și website. Primești un snapshot clar, rezolvi fiecare risc
            în cockpit, păstrezi dovada și intri în monitorizare continuă.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Începe gratuit — 2 minute <ArrowRight className="ml-2 size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Link href="/demo/imm" className="text-sm font-medium text-eos-text-muted underline underline-offset-2 hover:text-eos-text">
              Vezi demo live
            </Link>
          </div>
          <p className="mt-3 text-xs text-eos-text-muted">
            Fără card necesar.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-6 pb-14">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
            Cum merge
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
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
          <div className="mt-8 rounded-eos-xl border border-eos-border-subtle bg-eos-surface-primary px-5 py-5 shadow-[var(--eos-shadow-sm)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-eos-text-muted">
              Pentru cine
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {AUDIENCES.map((item) => (
                <p key={item} className="text-sm text-eos-text-muted">
                  {item}
                </p>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-eos-border-subtle bg-eos-surface-primary">
          <div className="mx-auto max-w-3xl px-6 py-14 text-center">
            <h2 className="text-xl font-semibold text-eos-text md:text-2xl">
              Gratuit pentru diagnostic. Pro pentru operare.
            </h2>
            <p className="mt-3 text-sm text-eos-text-muted">
              Începi gratuit ca să vezi ce se aplică și ce ai de făcut acum. Când vrei cockpit complet, dovadă și dosar, treci pe Pro.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/login">
                  Încearcă gratuit <ArrowRight className="ml-2 size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Link href="/pricing" className="text-sm font-medium text-eos-text-muted underline underline-offset-2 hover:text-eos-text">
                Vezi prețurile
              </Link>
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
