"use client"

// Sub-pagina IA fiscal: Deadline urgent
// Conține: PFA Form 082 tracker (deadline 26 mai 2026) + link calendar termene

import Link from "next/link"
import { AlertCircle, CalendarClock, FileText, ShieldAlert } from "lucide-react"

import { CertSpvPanel } from "@/components/compliscan/fiscal/CertSpvPanel"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"
import { PfaForm082Panel } from "@/components/compliscan/fiscal/PfaForm082Panel"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

export default function FiscalDeadlinesPage() {
  return (
    <FiscalSubpageShell
      title="Deadline urgent"
      description="Termene fiscale critice cu zile rămase. PFA / Form 082 (26 mai 2026) + calendar fiscal cu reminders automate."
      breadcrumb="Deadline urgent"
    >
      <section className="overflow-hidden rounded-eos-lg border border-eos-error/30 bg-eos-error-soft p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 size-5 shrink-0 text-eos-error" strokeWidth={2} />
          <div>
            <p className="font-display text-[14px] font-semibold text-eos-error">
              Form 082 obligatoriu pentru PFA / CNP
            </p>
            <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text">
              Persoanele fizice identificate fiscal prin CNP (PFA, II, IF, profesii liberale)
              trebuie să depună <strong>Formular 082</strong> în SPV ANAF până la{" "}
              <strong>26 mai 2026</strong> (Ordin ANAF 378/2026 + OG 6/2026). Obligația e-Factura
              pentru ei începe 1 iunie 2026.
            </p>
          </div>
        </div>
      </section>

      <Section
        icon={<ShieldAlert className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Certificate SPV manager (F#4)"
        subtitle="Tracking certificate digitale per client. Reminders 30/14/7/3/1 zile + detector 'utilizator neautorizat' post-reînnoire."
      >
        <CertSpvPanel />
      </Section>

      <Section
        icon={<FileText className="size-4 text-eos-primary" strokeWidth={2} />}
        title="PFA / Form 082 tracker"
        subtitle="Listă clienți PFA cu status registrare + countdown deadline. Cron zilnic trimite reminders."
      >
        <PfaForm082Panel />
      </Section>

      <Section
        icon={<CalendarClock className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Calendar termene fiscale"
        subtitle="Vezi toate deadline-urile fiscale lunare/trimestriale pentru clienții tăi într-un singur loc."
      >
        <div className="rounded-eos-md border border-eos-border bg-eos-surface px-4 py-3">
          <Link
            href={dashboardRoutes.calendar}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-eos-primary hover:underline"
          >
            Deschide calendar fiscal →
          </Link>
        </div>
      </Section>
    </FiscalSubpageShell>
  )
}

function Section({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface/30 p-4">
      <header className="flex items-start gap-3 border-b border-eos-border-subtle pb-3">
        <div className="mt-0.5 flex size-7 items-center justify-center rounded-eos-sm border border-eos-border bg-eos-surface">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3
            data-display-text="true"
            className="font-display text-[15px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            {title}
          </h3>
          <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{subtitle}</p>
        </div>
      </header>
      <div>{children}</div>
    </section>
  )
}
