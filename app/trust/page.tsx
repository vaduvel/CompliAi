import type { Metadata } from "next"
import Link from "next/link"
import {
  CheckCircle2,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Lock,
  ShieldCheck,
} from "lucide-react"

import { CeBadge } from "@/components/compliscan/ce-badge"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

export const metadata: Metadata = {
  title: "Trust Center - CompliScan",
  description:
    "Pagina publica de trust pentru CompliScan: documente legale, subprocesori, disclosure AI Act si informatii operationale pentru clienti si consultanti.",
}

const SUBPROCESSORS = [
  {
    name: "Vercel",
    role: "livrare aplicatie web si edge infrastructure",
    location: "platform delivery",
  },
  {
    name: "Supabase",
    role: "stocare date si autentificare",
    location: "EU region (conform configuratiei cloud active)",
  },
  {
    name: "Google Cloud",
    role: "Gemini AI si OCR / Vision pentru generare si extractie asistata",
    location: "EU region per configuratie contractuala",
  },
  {
    name: "Resend",
    role: "email tranzactional",
    location: "SCC / contractual safeguards",
  },
  {
    name: "Sentry",
    role: "monitoring operational si error tracing",
    location: "telemetry processor",
  },
  {
    name: "Stripe",
    role: "procesare plati si abonamente",
    location: "payment processor",
  },
  {
    name: "ANAF / SPV",
    role: "integrare read-only pentru status si fluxuri e-Factura atunci cand clientul o activeaza",
    location: "Romania public authority endpoint",
  },
] as const

const TRUST_DOCUMENTS = [
  {
    title: "DPA CompliScan",
    href: "/legal/dpa-compliscan.pdf",
    detail: "copie publica operationala pentru review initial B2B",
  },
  {
    title: "Subprocesori",
    href: "/legal/subprocessors.html",
    detail: "lista publica a furnizorilor si rolurilor lor",
  },
  {
    title: "AI Act disclosure",
    href: "/legal/ai-act-disclosure.pdf",
    detail: "transparenta AI Act + human oversight + CE decision gate",
  },
] as const

const AI_SYSTEMS = [
  {
    name: "Document Generator (Gemini)",
    purpose: "Drafting asistat pentru politici si documente de conformitate",
    riskClass: "Limited risk — Art. 50 transparency",
    humanOversight: "Obligatoriu: draft-ul necesita confirmare umana explicita inainte de utilizare",
    dataUsed: "Text-ul din profilul organizatiei si findings-urile detectate",
  },
  {
    name: "OCR / Vision Extractor",
    purpose: "Extractie asistata din documente incarcate (PDF, imagini)",
    riskClass: "Minimal risk",
    humanOversight: "Rezultatele sunt prezentate utilizatorului pentru review, nu sunt aplicate automat",
    dataUsed: "Fisierele incarcate de utilizator in cadrul scanarii",
  },
  {
    name: "Agent OS (Finding Triage + Classification)",
    purpose: "Triaj de findings, sugestii de remediere si clasificare operationala",
    riskClass: "Limited risk — Art. 50 transparency",
    humanOversight: "Toate propunerile Agent OS trec prin review uman obligatoriu (needs_review → confirmed)",
    dataUsed: "Starea de conformitate a organizatiei, documente scanate, semnale detectate",
  },
] as const

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">{label}</p>
      <p className="text-sm text-eos-text">{value}</p>
    </div>
  )
}

export default function TrustLandingPage() {
  return (
    <div className="min-h-screen bg-eos-surface-base text-eos-text">
      <header className="border-b border-eos-border-subtle bg-eos-surface-primary">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-eos-text">
            <ShieldCheck className="size-5 text-eos-primary" strokeWidth={2} />
            CompliScan
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/privacy">Privacy</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/login">Deschide dashboard</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="space-y-5 px-6 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="normal-case tracking-normal">
                  Trust Center public
                </Badge>
                <CeBadge mode="transparent" className="normal-case tracking-normal" />
                <CeBadge mode="decision-gate" className="normal-case tracking-normal" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-semibold text-eos-text sm:text-4xl">
                  Infrastructura, documentele legale si disclosure-ul operational CompliScan
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-eos-text-muted">
                  Pagina publica de trust aduna minimul cerut de due diligence B2B: DPA-ul CompliScan,
                  lista subprocesorilor, informatii despre hosting si ciclul de viata al datelor, plus
                  disclosure-ul AI Act pentru modul in care folosim AI in produs.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <InfoRow label="Hosting" value="Vercel pentru livrarea aplicatiei; Supabase pentru date cand backend-ul cloud este activ" />
                <InfoRow label="Retentie operationala" value="tinta operationala de pana la 90 zile dupa inchiderea contului, cu exceptiile legale si contractuale aplicabile" />
                <InfoRow label="Stergere la cerere" value="solicitarile validate sunt procesate in pana la 30 zile" />
                <InfoRow label="Contact" value="privacy@compliscan.ro / dpo@compliscan.ro / legal@compliscan.ro" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border-subtle pb-4">
              <CardTitle className="text-base">Documente publice</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {TRUST_DOCUMENTS.map((document) => (
                <Link
                  key={document.href}
                  href={document.href}
                  className="flex items-start justify-between gap-3 rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3 transition-colors hover:border-eos-border-strong"
                >
                  <div>
                    <p className="text-sm font-medium text-eos-text">{document.title}</p>
                    <p className="mt-1 text-xs text-eos-text-muted">{document.detail}</p>
                  </div>
                  <Download className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                </Link>
              ))}

              <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft/30 px-4 py-3 text-xs leading-6 text-eos-text-muted">
                Copiile publice sunt operationale pentru due diligence initial. Pentru release public larg,
                masterul cere in continuare validare finala de counsel pe formularea juridica si pe orice
                pretentie privind CE marking.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Globe className="size-4 text-eos-text-muted" strokeWidth={2} />
                <CardTitle className="text-base">Subprocesori si infrastructura</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              {SUBPROCESSORS.map((provider) => (
                <div
                  key={provider.name}
                  className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-medium text-eos-text">{provider.name}</p>
                    <span className="text-xs text-eos-text-muted">{provider.location}</span>
                  </div>
                  <p className="mt-1 text-sm text-eos-text-muted">{provider.role}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border-subtle pb-4">
              <div className="flex items-center gap-2">
                <Lock className="size-4 text-eos-text-muted" strokeWidth={2} />
                <CardTitle className="text-base">AI Act disclosure</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
              <div className="flex flex-wrap items-center gap-2">
                <CeBadge mode="transparent" className="normal-case tracking-normal" />
                <Badge variant="outline" className="normal-case tracking-normal">
                  human oversight required
                </Badge>
                <Badge variant="outline" className="normal-case tracking-normal">
                  audit trail active
                </Badge>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-eos-text">Sisteme AI folosite in produs</p>
                {AI_SYSTEMS.map((system) => (
                  <div
                    key={system.name}
                    className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3 space-y-1.5"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
                      <p className="text-sm font-medium text-eos-text">{system.name}</p>
                    </div>
                    <p className="text-xs text-eos-text-muted">{system.purpose}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Badge variant="outline" className="text-[10px] normal-case tracking-normal">{system.riskClass}</Badge>
                    </div>
                    <p className="text-xs text-eos-text-muted"><span className="font-medium text-eos-text-secondary">Human oversight:</span> {system.humanOversight}</p>
                    <p className="text-xs text-eos-text-muted"><span className="font-medium text-eos-text-secondary">Date folosite:</span> {system.dataUsed}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3 text-sm leading-6 text-eos-text-muted">
                CompliScan este pozitionat operational ca sistem informativ si asistiv: propune, explica si
                structureaza, dar nu trimite automat catre autoritati, nu semneaza documente si nu marcheaza
                ireversibil conformitatea fara confirmare umana explicita.
              </div>

              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3 space-y-2">
                <p className="text-sm font-medium text-eos-text">CE Decision Gate</p>
                <div className="flex items-center gap-2">
                  <CeBadge mode="decision-gate" className="normal-case tracking-normal" />
                </div>
                <p className="text-xs leading-5 text-eos-text-muted">
                  Clasificarea finala a CompliScan sub AI Act (Art. 50 limited risk vs. Annex III high-risk)
                  depinde de analiza juridica asupra modului in care sistemele AI influenteaza deciziile
                  utilizatorilor. Pana la validarea explicita de catre counsel, CompliScan opereaza sub
                  prezumtia de <strong>limited risk cu obligatii de transparenta</strong> si nu revendica
                  CE marking.
                </p>
              </div>

              <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft/30 px-4 py-3 text-sm leading-6 text-eos-text-muted">
                Nu revendicam public CE marking in aceasta etapa. Decizia CE ramane blocata in gate-ul juridic
                cerut de master si va fi afisata doar dupa validare explicita.
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border-subtle pb-4">
              <CardTitle className="text-base">Lifecycle date si solicitari</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5 text-sm leading-7 text-eos-text-muted">
              <p>
                Datele de cont si datele operationale sunt pastrate pe durata relatiei contractuale si apoi
                intra intr-un flux de inchidere controlata. Tinta operationala curenta este de pana la 90 zile
                pentru curatarea datelor din workspace dupa inchidere, iar solicitarile de stergere validate
                sunt procesate in pana la 30 zile, sub rezerva obligatiilor legale de arhivare sau audit.
              </p>
              <p>
                Daca ai nevoie de review juridic sau de un change log pentru subprocesori, echipa CompliScan
                raspunde prin <a className="text-eos-primary" href="mailto:legal@compliscan.ro">legal@compliscan.ro</a>,
                iar cererile de confidentialitate si stergere se trimit la{" "}
                <a className="text-eos-primary" href="mailto:privacy@compliscan.ro">privacy@compliscan.ro</a>.
              </p>
            </CardContent>
          </Card>

          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="border-b border-eos-border-subtle pb-4">
              <CardTitle className="text-base">Legaturi rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-5">
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dpa">
                  Vezi DPA in format HTML
                  <ExternalLink className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/privacy">
                  Politica de confidentialitate
                  <ExternalLink className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/terms">
                  Termeni
                  <ExternalLink className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild className="w-full justify-between">
                <Link href="/legal/dpa-compliscan.pdf">
                  Descarca DPA CompliScan
                  <FileText className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  )
}
