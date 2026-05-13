"use client"

// Sub-pagina IA fiscal: TVA & declarații
// Conține: Discrepanțe e-TVA + Depuneri fiscale + SAF-T Hygiene
// Toate sub un layout cu secțiuni clare delimitate.

import { Receipt, Calendar, FileText, Globe2, FileCode2, Coins, CircleDollarSign, Gavel, ScanLine } from "lucide-react"

import { AgaUploadCard } from "@/components/compliscan/fiscal/AgaUploadCard"
import { CrossBorderAdvisorCard } from "@/components/compliscan/fiscal/CrossBorderAdvisorCard"
import { D100UploadCard } from "@/components/compliscan/fiscal/D100UploadCard"
import { D205UploadCard } from "@/components/compliscan/fiscal/D205UploadCard"
import { D300UploadCard } from "@/components/compliscan/fiscal/D300UploadCard"
import { InvoicePrimitaOcrCard } from "@/components/compliscan/fiscal/InvoicePrimitaOcrCard"
import { DiscrepanciesTab } from "@/components/compliscan/fiscal/DiscrepanciesTab"
import { CrossFilingCheckCard } from "@/components/compliscan/fiscal/CrossFilingCheckCard"
import { FilingRecordsTab } from "@/components/compliscan/fiscal/FilingRecordsTab"
import { FrequencyCheckCard } from "@/components/compliscan/fiscal/FrequencyCheckCard"
import { SaftHygieneTab } from "@/components/compliscan/fiscal/SaftHygieneTab"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"

export default function FiscalTvaPage() {
  return (
    <FiscalSubpageShell
      title="TVA & declarații"
      description="Discrepanțe e-TVA, depuneri lunare/trimestriale și hygiene SAF-T D406. Verifică D300 vs P300 preventiv și termenele de depunere."
      breadcrumb="TVA & declarații"
    >
      <Section
        icon={<Receipt className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Discrepanțe e-TVA"
        subtitle="Comparator preventiv D300 vs P300, bibliotecă răspunsuri ANAF, false-conformance check."
      >
        <DiscrepanciesTab />
      </Section>

      <Section
        icon={<Calendar className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Depuneri fiscale"
        subtitle="Frecvență detectare, cross-filing check și calendar termene D300/D406/D394."
      >
        <div className="space-y-4">
          <FrequencyCheckCard />
          <CrossFilingCheckCard />
          <FilingRecordsTab />
        </div>
      </Section>

      <Section
        icon={<FileText className="size-4 text-eos-primary" strokeWidth={2} />}
        title="SAF-T Hygiene"
        subtitle="Scor 0-100 pentru fișierul D406 + draft D300/D394 generat din SAF-T XML."
      >
        <SaftHygieneTab />
      </Section>

      <Section
        icon={<FileCode2 className="size-4 text-eos-primary" strokeWidth={2} />}
        title="D300 — parser conținut declarație TVA"
        subtitle="Încarcă XML D300 descărcat din SPV ANAF sau exportat din Saga / SmartBill. Parser-ul extrage baze TVA per cotă, totale și TVA de plată — fundație pentru cross-correlation cu facturile."
      >
        <D300UploadCard />
      </Section>

      <Section
        icon={<Coins className="size-4 text-eos-primary" strokeWidth={2} />}
        title="D205 — parser declarație impozit reținut la sursă"
        subtitle="Încarcă XML D205 anual descărcat din SPV ANAF. Parser-ul extrage beneficiarii (dividende, drepturi autor, dobânzi) cu sume și impozit reținut — fundație pentru cross-correlation cu hotărâri AGA și D100 lunar."
      >
        <D205UploadCard />
      </Section>

      <Section
        icon={<CircleDollarSign className="size-4 text-eos-primary" strokeWidth={2} />}
        title="D100 — parser declarație obligații buget de stat"
        subtitle="Încarcă XML-uri D100 lunare/trimestriale (impozit profit, micro, dividende, salarii). Parser-ul recunoaște codurile ANAF (480 dividende, 101 profit, 401 micro, 201 salarii) — fundație pentru R5: Σ D100 lunare ↔ D205 anual."
      >
        <D100UploadCard />
      </Section>

      <Section
        icon={<Gavel className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Hotărâri AGA — extragere automată cu AI"
        subtitle="Lipește textul hotărârii AGA sau încarcă .txt și AI-ul extrage asociați (CNP/CUI), procente deținere și dividende per asociat. Folosit pentru cross-correlation R2 (AGA ↔ stat plată ↔ D205) și R3 (AGA procent ↔ ONRC procent)."
      >
        <AgaUploadCard />
      </Section>

      <Section
        icon={<ScanLine className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Facturi primite — OCR Gemini Vision"
        subtitle="Fotografiază sau încarcă imaginea facturii primite de la furnizor. AI extrage CIF, sume, articole. Cross-correlation R1: Σ TVA facturi primite ↔ D300 TVA deductibil."
      >
        <InvoicePrimitaOcrCard />
      </Section>

      <Section
        icon={<Globe2 className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Vânzări UE — verifică reverse charge & e-Factura"
        subtitle="Advisor cross-border pentru tranzacții RO→UE B2B/B2C, RO→non-UE export, sau import UE→RO cu reverse charge. OUG 89/2025 + Cod Fiscal Art. 319-329."
      >
        <CrossBorderAdvisorCard />
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
