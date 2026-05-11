"use client"

// Sub-pagina IA fiscal: Validare & emitere
// Conține: Bulk ZIP upload + Validator e-Factura XML + Semnale e-Factura

import { useState } from "react"
import { toast } from "sonner"
import { Camera, FileCode2, Package, Radio } from "lucide-react"

import { EFacturaSignalsTab } from "@/components/compliscan/fiscal/EFacturaSignalsTab"
import { BulkZipUploadCard } from "@/components/compliscan/fiscal/BulkZipUploadCard"
import { EFacturaValidatorCard } from "@/components/compliscan/efactura-validator-card"
import { FiscalSubpageShell } from "@/components/compliscan/fiscal/FiscalSubpageShell"
import { InvoiceOcrPanel } from "@/components/compliscan/fiscal/InvoiceOcrPanel"
import type { EFacturaValidationRecord, EFacturaXmlRepairRecord } from "@/lib/compliance/types"

export default function FiscalValidationPage() {
  const [validatorBusy, setValidatorBusy] = useState(false)
  const [repairBusy, setRepairBusy] = useState(false)
  const [validations, setValidations] = useState<EFacturaValidationRecord[]>([])

  async function handleValidateXml(input: { documentName: string; xml: string }) {
    setValidatorBusy(true)
    try {
      const response = await fetch("/api/efactura/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        validation?: EFacturaValidationRecord
      }
      if (!response.ok) throw new Error(payload.error || "Validarea XML a eșuat.")
      if (payload.validation) {
        setValidations((current) =>
          [payload.validation!, ...current.filter((item) => item.id !== payload.validation!.id)].slice(0, 10),
        )
      }
      const isValid = payload.validation?.valid ?? false
      const description =
        payload.message ||
        (isValid
          ? "Factura trece validarea structurală de bază."
          : "Corectează XML-ul și validează din nou înainte de transmitere.")
      if (isValid) {
        toast.success("XML validat", { id: "efactura-validation", description })
      } else {
        toast.error("XML cu probleme", { id: "efactura-validation", description })
      }
      return payload.validation ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la validarea XML."
      toast.error("Validare eșuată", { description: message })
      throw error
    } finally {
      setValidatorBusy(false)
    }
  }

  async function handleRepairXml(input: {
    documentName: string
    xml: string
    errorCodes?: string[]
  }) {
    setRepairBusy(true)
    try {
      const response = await fetch("/api/efactura/repair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      })
      const payload = (await response.json()) as {
        error?: string
        message?: string
        repair?: EFacturaXmlRepairRecord
      }
      if (!response.ok) throw new Error(payload.error || "Nu am putut genera corecțiile XML.")
      toast.success(
        payload.repair && payload.repair.appliedFixes.length > 0
          ? "Corecții XML pregătite"
          : "Nu există fixuri automate sigure",
        {
          description:
            payload.message ||
            (payload.repair && payload.repair.appliedFixes.length > 0
              ? "Revizuiește XML-ul reparat și retransmite-l manual."
              : "Corecția rămâne manuală în ERP sau în exportul XML."),
        },
      )
      return payload.repair ?? null
    } catch (error) {
      const message = error instanceof Error ? error.message : "Eroare la generarea corecțiilor XML."
      toast.error("Reparare eșuată", { description: message })
      throw error
    } finally {
      setRepairBusy(false)
    }
  }

  return (
    <FiscalSubpageShell
      title="Validare & emitere"
      description="Validează XML-uri UBL CIUS-RO V001-V011 înainte de transmitere SPV. Bulk upload ZIP pentru până la 200 facturi. Monitorizează semnalele e-Factura."
      breadcrumb="Validare & emitere"
    >
      <Section
        icon={<Camera className="size-4 text-eos-primary" strokeWidth={2} />}
        title="OCR & Voice → Factură (F#8 KILLER)"
        subtitle="Foto factură / bon (mobil camera direct) sau dictare voce → AI extrage CIF, sume, articole. Privacy by default: Gemma 4 local prima, Gemini Vision fallback."
      >
        <InvoiceOcrPanel />
      </Section>

      <Section
        icon={<Package className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Bulk ZIP upload"
        subtitle="Trage un fișier ZIP cu până la 200 XML-uri. Toate validate în paralel cu raportare per fișier."
      >
        <BulkZipUploadCard />
      </Section>

      <Section
        icon={<FileCode2 className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Validator e-Factura XML"
        subtitle="Validare UBL CIUS-RO + auto-repair sugestii pentru V002 (CustomizationID), V003, V005, T003."
      >
        <EFacturaValidatorCard
          validations={validations}
          busy={validatorBusy}
          repairBusy={repairBusy}
          onValidate={handleValidateXml}
          onRepair={handleRepairXml}
        />
      </Section>

      <Section
        icon={<Radio className="size-4 text-eos-primary" strokeWidth={2} />}
        title="Semnale e-Factura"
        subtitle="Status SPV per factură: respins, eroare XML, blocat, netransmis. Generează findings automat."
      >
        <EFacturaSignalsTab />
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
