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
    title: "Afli ce ți se aplică",
    description:
      "4 întrebări → dashboard adaptat. Scor de conformitate GDPR, NIS2, EU AI Act, e-Factura.",
  },
  {
    icon: FileCheck2,
    title: "Pregătești dovezile",
    description:
      "Documente generate (GDPR, DPA, AI governance, IR Plan). Audit Pack ZIP gata de control.",
  },
  {
    icon: Cpu,
    title: "Ești gata de control",
    description:
      "Simulare control (Inspector Mode). Resolution Layer ghidat. One-Page Compliance Report.",
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
            Afli ce ți se aplică.
            <br />
            Pregătești dovezile.
            <br />
            <span className="text-eos-primary">Ești gata de control.</span>
          </h1>
          <p className="mt-5 text-base text-eos-text-muted md:text-lg">
            Instrument de asistență în conformitate GDPR, NIS2, EU AI Act și e-Factura
            pentru IMM-uri și administratori din România.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/login">
                Începe gratuit — 2 minute <ArrowRight className="ml-2 size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">Vezi planurile</Link>
            </Button>
          </div>
          <p className="mt-3 text-xs text-eos-text-muted">
            Nu e nevoie de card. Trial Pro 14 zile inclus.
          </p>
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
            Soluția
          </p>
          <h2 className="mt-3 text-center text-xl font-semibold text-eos-text md:text-2xl">
            Un instrument care face munca de pregătire în locul tău
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
