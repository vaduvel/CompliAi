"use client"

// Card pentru verificare notificare ANAF — apelează /api/fiscal/false-conformance
// și afișează verdict (false positive / verifică manual) + recomandare template.
//
// Pain point real: ANAF trimite notificări de conformare pentru cheltuieli
// presupus „nejustificate" sau facturi „nedeclarate de furnizor", dar
// contabilul are evidența completă — pierde 30 min să verifice manual fiecare.
// Acest card automatizează verificarea: select tip notificare + completează
// detaliile + click „Analizează" → verdict instant.

import { useState } from "react"
import { AlertCircle, CheckCircle2, FileSearch, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type NotificationType =
  | "conformance_supplier_undeclared"
  | "conformance_unjustified_expenses"
  | "conformance_energy_risky"
  | "etva_diff_with_duplicates"
  | "saft_validation_error"
  | "other"

const TYPE_LABELS: Record<NotificationType, string> = {
  conformance_supplier_undeclared: "Furnizor nu a declarat factura",
  conformance_unjustified_expenses: "Cheltuieli nejustificate",
  conformance_energy_risky: "Facturi energie riscante",
  etva_diff_with_duplicates: "Diferență e-TVA cu duplicate",
  saft_validation_error: "Eroare validare SAF-T",
  other: "Altă notificare",
}

const RECOMMENDED_TEMPLATE_LABEL: Record<string, string> = {
  etva_duplicate_invoice: "etva_duplicate_invoice — Răspuns duplicate P300",
  conformare_factura_furnizor_lipsa:
    "conformare_factura_furnizor_lipsa — Furnizor nu a declarat",
  conformare_cheltuieli_nejustificate:
    "conformare_cheltuieli_nejustificate — Cheltuieli justificate",
  investigate_manual: "investigate_manual — Verifică manual",
}

type Assessment = {
  notificationId: string
  isFalsePositive: boolean
  confidence: "high" | "medium" | "low"
  reason: string
  evidenceFound: string[]
  recommendedResponse: string
}

type Response = {
  ok: boolean
  assessment?: Assessment
  evidence?: {
    receivedInvoicesCount: number
    expenseDocumentsCount: number
    p300ItemsCount: number
  }
  error?: string
}

export function FalseConformanceCheckCard() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [type, setType] = useState<NotificationType>("conformance_supplier_undeclared")
  const [period, setPeriod] = useState("")
  const [invoices, setInvoices] = useState("")
  const [supplierCifs, setSupplierCifs] = useState("")
  const [duplicateCount, setDuplicateCount] = useState("")
  const [rawText, setRawText] = useState("")
  const [result, setResult] = useState<Response | null>(null)

  async function analyze() {
    if (!period.trim()) {
      toast.error("Perioada lipsește.")
      return
    }
    setBusy(true)
    setResult(null)
    try {
      const notification = {
        id: `nf-${Date.now()}`,
        type,
        receivedAtISO: new Date().toISOString(),
        period: period.trim(),
        details: {
          invoiceNumbers: invoices
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          supplierCifs: supplierCifs
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          duplicateCount: duplicateCount ? Number(duplicateCount) : undefined,
          rawText: rawText.trim() || undefined,
        },
      }

      const res = await fetch("/api/fiscal/false-conformance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification }),
      })
      const data = (await res.json()) as Response
      if (!res.ok) {
        throw new Error(data.error ?? `Eroare ${res.status}`)
      }
      setResult(data)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la analiză.")
    } finally {
      setBusy(false)
    }
  }

  function reset() {
    setType("conformance_supplier_undeclared")
    setPeriod("")
    setInvoices("")
    setSupplierCifs("")
    setDuplicateCount("")
    setRawText("")
    setResult(null)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-1.5 font-mono text-[11px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
      >
        <FileSearch className="size-3.5" strokeWidth={2} />
        Verifică notificare ANAF
      </button>
    )
  }

  return (
    <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <header className="flex items-start justify-between gap-3 border-b border-eos-border-subtle px-4 py-3.5">
        <div>
          <h3
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Verifică notificare ANAF (false positive?)
          </h3>
          <p className="mt-1 text-[12px] text-eos-text-muted">
            Introdu detalii din notificarea ANAF și sistemul compară cu facturile primite în SPV +
            documentele justificative. Dacă găsește dovezi că ești OK, recomandă template răspuns.
          </p>
        </div>
        <button
          onClick={() => {
            setOpen(false)
            reset()
          }}
          className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-surface-variant hover:text-eos-text"
        >
          ×
        </button>
      </header>

      <div className="space-y-3 px-4 py-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Tip notificare
            </span>
            <select
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
              value={type}
              onChange={(e) => setType(e.target.value as NotificationType)}
            >
              {(Object.entries(TYPE_LABELS) as [NotificationType, string][]).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Perioada (ex: 2026-04)
            </span>
            <input
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
              placeholder="2026-04"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Numere facturi (separate prin virgulă)
          </span>
          <input
            className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            placeholder="F123, F456, F789"
            value={invoices}
            onChange={(e) => setInvoices(e.target.value)}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              CIF furnizori (separate prin virgulă)
            </span>
            <input
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
              placeholder="12345678, 87654321"
              value={supplierCifs}
              onChange={(e) => setSupplierCifs(e.target.value)}
            />
          </label>
          {type === "etva_diff_with_duplicates" && (
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Număr duplicate raportate
              </span>
              <input
                type="number"
                className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                placeholder="3"
                value={duplicateCount}
                onChange={(e) => setDuplicateCount(e.target.value)}
              />
            </label>
          )}
        </div>

        <label className="block">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Text notificare (opțional — paste din SPV)
          </span>
          <textarea
            className="mt-1.5 h-20 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2 text-[12.5px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
          />
        </label>

        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={busy || !period.trim()}
            onClick={() => void analyze()}
          >
            {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
            Analizează
          </Button>
          <Button variant="ghost" size="sm" onClick={reset}>
            Reset
          </Button>
        </div>

        {result?.assessment && (
          <div className="space-y-2 pt-2">
            <div
              className={`flex items-start gap-2 rounded-eos-md border px-3 py-2 text-[12.5px] ${
                result.assessment.isFalsePositive
                  ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                  : "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
              }`}
            >
              {result.assessment.isFalsePositive ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              ) : (
                <AlertCircle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
              )}
              <div className="space-y-1">
                <p className="font-semibold">
                  {result.assessment.isFalsePositive
                    ? `Probabil FALSE POSITIVE (confidence: ${result.assessment.confidence})`
                    : `Verifică manual (confidence: ${result.assessment.confidence})`}
                </p>
                <p className="text-eos-text">{result.assessment.reason}</p>
              </div>
            </div>

            {result.assessment.evidenceFound.length > 0 && (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Dovezi găsite
                </p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-eos-text">
                  {result.assessment.evidenceFound.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Template răspuns recomandat
              </p>
              <p className="mt-1 font-mono text-[12px] text-eos-text">
                {RECOMMENDED_TEMPLATE_LABEL[result.assessment.recommendedResponse] ??
                  result.assessment.recommendedResponse}
              </p>
              <p className="mt-1 text-[11px] text-eos-text-muted">
                Deschide „Bibliotecă răspunsuri ANAF" și selectează template-ul de mai sus pentru a
                completa placeholder-ii și a copia textul.
              </p>
            </div>

            {result.evidence && (
              <p className="text-[11px] text-eos-text-tertiary">
                Surse verificate: {result.evidence.receivedInvoicesCount} facturi din SPV
                {result.evidence.expenseDocumentsCount > 0 &&
                  `, ${result.evidence.expenseDocumentsCount} documente justificative`}
                {result.evidence.p300ItemsCount > 0 &&
                  `, ${result.evidence.p300ItemsCount} linii P300`}
                .
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
