"use client"

// Sub-pagina IA fiscal: Integrări ERP
// Conține: SmartBill + Oblio + Saga + ERP↔SPV reconcile

import { PlugZap, Zap, FileCode2, GitCompareArrows } from "lucide-react"

import { ErpSpvReconcileCard } from "@/components/compliscan/fiscal/ErpSpvReconcileCard"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"
import { OblioConnectCard } from "@/components/compliscan/fiscal/OblioConnectCard"
import { SagaImportCard } from "@/components/compliscan/fiscal/SagaImportCard"
import { SmartBillConnectCard } from "@/components/compliscan/fiscal/SmartBillConnectCard"

export default function FiscalIntegrationsPage() {
  return (
    <FiscalSubpageShell
      title="Integrări ERP"
      description="Conectează SmartBill / Oblio / Saga pentru sync automat al facturilor. Reconciliază ERP-ul cu SPV ANAF pentru a depista diferențele."
      breadcrumb="Integrări ERP"
    >
      <Section
        icon={<Zap className="size-4 text-eos-primary" strokeWidth={2} />}
        title="SmartBill"
        subtitle="Sincronizare API cu token + email config. Importă facturile emise în ultimele 30 zile."
      >
        <SmartBillConnectCard />
      </Section>

      <Section
        icon={<PlugZap className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Oblio"
        subtitle="OAuth 2.0 + token expiry tracking. Sincronizare automată facturi emise/primite."
      >
        <OblioConnectCard />
      </Section>

      <Section
        icon={<FileCode2 className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Saga"
        subtitle="Smart-detect XML/ZIP cu schema oficială Saga (FurnizorNume, FacturaNumar, pattern fișier)."
      >
        <SagaImportCard />
      </Section>

      <Section
        icon={<GitCompareArrows className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Reconciliere ERP ↔ SPV"
        subtitle="Compară facturile din ERP cu cele din SPV ANAF. Detectează lipsuri, duplicate, diferențe de sumă."
      >
        <ErpSpvReconcileCard />
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
