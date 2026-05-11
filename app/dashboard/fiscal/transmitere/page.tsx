"use client"

// Sub-pagina IA fiscal: Transmitere & SPV
// Conține: Submit SPV cu dublu-aprobare + SPV Check + Protocol fiscal (per finding)

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { AlertTriangle, Clock, FileText, Loader2, Send, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { AnafRequestLogDrawer } from "@/components/compliscan/fiscal/AnafRequestLogDrawer"
import { SubmitSpvTab } from "@/components/compliscan/fiscal/SubmitSpvTab"
import { SpvCheckTab } from "@/components/compliscan/fiscal/SpvCheckTab"
import { FiscalStatusInterpreterCard } from "@/components/compliscan/fiscal-status-interpreter-card"
import { FiscalExecutionLogCard } from "@/components/compliscan/fiscal-execution-log-card"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"
import { Button } from "@/components/evidence-os/Button"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { buildFiscalStatusInterpreterGuide } from "@/lib/compliance/efactura-status-interpreter"
import type { ScanFinding } from "@/lib/compliance/types"

export default function FiscalTransmissionPage() {
  const searchParams = useSearchParams()
  const findingIdParam = searchParams.get("findingId")
  const [statusFinding, setStatusFinding] = useState<ScanFinding | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [logOpen, setLogOpen] = useState(false)

  useEffect(() => {
    if (!findingIdParam) {
      setStatusFinding(null)
      return
    }
    setStatusLoading(true)
    fetch(`/api/findings/${findingIdParam}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("findings-fetch failed")
        return r.json() as Promise<{ finding: ScanFinding }>
      })
      .then((payload) => setStatusFinding(payload.finding))
      .catch(() => {
        setStatusFinding(null)
        toast.error("Nu am putut încărca protocolul fiscal.")
      })
      .finally(() => setStatusLoading(false))
  }, [findingIdParam])

  const statusRecipe = statusFinding ? buildCockpitRecipe(statusFinding) : null
  const statusGuide =
    statusFinding && statusRecipe
      ? buildFiscalStatusInterpreterGuide(statusRecipe.findingTypeId, statusFinding)
      : null

  return (
    <FiscalSubpageShell
      title="Transmitere & SPV"
      description="Transmite facturi e-Factura cu dublă aprobare. Verifică status SPV ANAF. Protocol fiscal pas-cu-pas pentru findings."
      breadcrumb="Transmitere & SPV"
    >
      <Section
        icon={<Send className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Transmitere ANAF cu dublă aprobare"
        subtitle="Orice transmitere SPV necesită aprobare manuală. Audit log per submission."
      >
        <div className="mb-3 flex justify-end">
          <Button size="sm" variant="ghost" onClick={() => setLogOpen(true)}>
            <FileText className="mr-1.5 size-3.5" strokeWidth={2} />
            Istoric cereri ANAF
          </Button>
        </div>
        <SubmitSpvTab
          sourceFindingId={findingIdParam}
          fromCockpit={Boolean(findingIdParam)}
          returnToFindingHref={findingIdParam ? `/dashboard/resolve/${findingIdParam}` : null}
        />
      </Section>
      <AnafRequestLogDrawer open={logOpen} onClose={() => setLogOpen(false)} />

      <Section
        icon={<ShieldCheck className="size-4 text-eos-primary" strokeWidth={2} />}
        title="SPV Check"
        subtitle="Verifică status registrare SPV + mesaje noi de la ANAF (real-time, 4×/zi cron)."
      >
        <SpvCheckTab />
      </Section>

      <Section
        icon={<AlertTriangle className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Protocol fiscal"
        subtitle="Ghid pas-cu-pas pentru findings EF-004/EF-005. Activ doar când vii din cockpit cu findingId."
      >
        {statusLoading ? (
          <div className="flex items-center gap-2 py-6 text-[12.5px] text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă protocolul...
          </div>
        ) : !findingIdParam ? (
          <div className="flex flex-col items-center gap-3 rounded-eos-md border border-dashed border-eos-border bg-eos-surface/40 px-6 py-8 text-center">
            <div className="flex size-9 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
              <Clock className="size-3.5 text-eos-text-tertiary" strokeWidth={1.8} />
            </div>
            <p className="max-w-md text-[12px] text-eos-text-muted">
              Vino aici dintr-un finding (EF-004 sau EF-005) pentru a vedea protocolul fiscal
              detaliat cu pași concreți + audit log.
            </p>
          </div>
        ) : !statusGuide ? (
          <div className="flex flex-col items-center gap-3 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft px-6 py-8 text-center">
            <AlertTriangle className="size-4 text-eos-warning" strokeWidth={1.8} />
            <p className="max-w-md text-[12px] text-eos-text">
              Protocol indisponibil pentru acest finding. Suportat momentan: EF-004, EF-005.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <FiscalStatusInterpreterCard guide={statusGuide} findingId={findingIdParam} />
            <FiscalExecutionLogCard findingId={findingIdParam} findingTypeId={statusGuide.findingTypeId} />
          </div>
        )}
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
