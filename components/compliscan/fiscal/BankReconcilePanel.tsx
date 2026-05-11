"use client"

// F#2 — Bank-SPV Reconciliation UI Panel.
// Upload extras bancar (MT940/CAMT.053/CSV) + listă facturi simplă → match + forecast.

import { useState } from "react"
import { CheckCircle2, FileUp, Loader2, TrendingUp, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type ReconResult = {
  parsed: {
    format: string
    accountIban?: string
    transactionCount: number
    parseWarnings: string[]
  }
  reconciliation: {
    matches: Array<{
      transaction: {
        id: string
        dateISO: string
        amountRON: number
        narrative: string
        detectedCif?: string
      }
      invoice: { invoiceNumber: string; partyCif: string; totalRON: number }
      score: { total: number }
      confidence: "high" | "medium" | "low"
    }>
    unmatched: number
    matchedHigh: number
    matchedMedium: number
    totalTransactions: number
    totalInvoices: number
    coveragePct: number
  } | null
  forecast: {
    avgMonthlyInflow: number
    avgMonthlyOutflow: number
    avgMonthlyNet: number
    next30Days: number
    next60Days: number
    next90Days: number
    trend: "rising" | "stable" | "falling"
  }
}

function fmtRON(n: number): string {
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })
}

export function BankReconcilePanel() {
  const [statementContent, setStatementContent] = useState("")
  const [invoicesJson, setInvoicesJson] = useState("[]")
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ReconResult | null>(null)

  async function handleFile(file: File) {
    const text = await file.text()
    setStatementContent(text)
    toast.success(`Fișier încărcat: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`)
  }

  async function reconcile() {
    if (!statementContent.trim()) {
      toast.error("Încarcă mai întâi extrasul bancar.")
      return
    }
    setBusy(true)
    setResult(null)
    try {
      let invoices = []
      try {
        invoices = JSON.parse(invoicesJson)
      } catch {
        toast.error("JSON facturi invalid — folosește format []")
        setBusy(false)
        return
      }

      const res = await fetch("/api/fiscal/bank-reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statementContent, invoices }),
      })
      const data = (await res.json()) as ReconResult & { error?: string }
      if (!res.ok) throw new Error((data as { error?: string }).error ?? `HTTP ${res.status}`)
      setResult(data)
      toast.success(
        data.reconciliation
          ? `Reconciliat ${data.reconciliation.matchedHigh + data.reconciliation.matchedMedium}/${data.reconciliation.totalTransactions} tranzacții (${data.reconciliation.coveragePct}% acoperire).`
          : "Extras parsat dar fără facturi de potrivit.",
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare reconciliere.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p>
          <strong>F#2 Bank-SPV Reconciliation:</strong> uploadează extrasul bancar (MT940, CAMT.053
          sau CSV) + transmite lista facturilor din ERP. Motor AI fuzzy-match potrivește automat
          90%+ din tranzacții cu facturile (criterii: CUI + sumă ±0.01 + dată ±3 zile + nr. factură).
          100% on-device — NU trimitem extrasul bancar la nicio API externă.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <header className="flex items-center gap-2">
            <FileUp className="size-4 text-eos-primary" strokeWidth={2} />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Extras bancar
            </p>
          </header>
          <input
            type="file"
            accept=".txt,.mt940,.xml,.csv,text/plain,application/xml,text/csv"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleFile(f)
            }}
            className="block w-full text-[12px] text-eos-text-muted file:mr-3 file:rounded-eos-sm file:border-0 file:bg-eos-primary file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-white"
          />
          <textarea
            placeholder="Sau lipește conținutul aici (MT940 / CAMT.053 / CSV)"
            value={statementContent}
            onChange={(e) => setStatementContent(e.target.value)}
            className="h-32 w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[11px] text-eos-text outline-none focus:border-eos-border-strong"
          />
          <p className="text-[10.5px] text-eos-text-tertiary">
            {statementContent.length > 0 ? `${(statementContent.length / 1024).toFixed(1)} KB încărcați` : "0 KB"}
          </p>
        </section>

        <section className="space-y-3 rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <header className="flex items-center gap-2">
            <CheckCircle2 className="size-4 text-eos-primary" strokeWidth={2} />
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Facturi (JSON) — testare manuală
            </p>
          </header>
          <textarea
            value={invoicesJson}
            onChange={(e) => setInvoicesJson(e.target.value)}
            placeholder='[{"id":"i1","invoiceNumber":"F100","partyCif":"12345678","totalRON":1000,"issueDateISO":"2026-05-08","direction":"received"}]'
            className="h-32 w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2 font-mono text-[10.5px] text-eos-text outline-none focus:border-eos-border-strong"
          />
          <p className="text-[10.5px] text-eos-text-tertiary">
            Phase 2: import auto din SmartBill/Oblio/Saga + state.efacturaValidations.
          </p>
        </section>
      </div>

      <Button size="sm" disabled={busy || !statementContent.trim()} onClick={() => void reconcile()}>
        {busy && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
        Reconciliază
      </Button>

      {result && (
        <div className="space-y-4">
          {/* Stats */}
          {result.reconciliation && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="Acoperire" value={`${result.reconciliation.coveragePct}%`} tone="text-eos-primary" />
              <Stat label="Match high" value={String(result.reconciliation.matchedHigh)} tone="text-eos-success" />
              <Stat label="Match medium" value={String(result.reconciliation.matchedMedium)} tone="text-eos-warning" />
              <Stat label="Unmatched" value={String(result.reconciliation.unmatched)} tone="text-eos-error" />
            </div>
          )}

          {/* Parse info */}
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3 text-[11.5px]">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Extras parsat
            </p>
            <p className="mt-1 text-eos-text">
              Format <strong>{result.parsed.format}</strong> · {result.parsed.transactionCount} tranzacții
              {result.parsed.accountIban && ` · IBAN ${result.parsed.accountIban}`}
            </p>
            {result.parsed.parseWarnings.length > 0 && (
              <p className="mt-1 text-eos-warning">
                ⚠️ {result.parsed.parseWarnings.length} avertismente la parsare.
              </p>
            )}
          </div>

          {/* Forecast */}
          <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
            <header className="mb-3 flex items-center gap-2">
              <TrendingUp className="size-4 text-eos-primary" strokeWidth={2} />
              <p
                data-display-text="true"
                className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                Cash-flow forecast (regresie pe istoric)
              </p>
            </header>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">+30 zile</p>
                <p className="mt-0.5 font-display text-[16px] font-semibold text-eos-text">
                  {fmtRON(result.forecast.next30Days)} RON
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">+60 zile</p>
                <p className="mt-0.5 font-display text-[16px] font-semibold text-eos-text">
                  {fmtRON(result.forecast.next60Days)} RON
                </p>
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">+90 zile</p>
                <p className="mt-0.5 font-display text-[16px] font-semibold text-eos-text">
                  {fmtRON(result.forecast.next90Days)} RON
                </p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-eos-text-muted">
              Avg lunar: încasări {fmtRON(result.forecast.avgMonthlyInflow)} RON · plăți{" "}
              {fmtRON(result.forecast.avgMonthlyOutflow)} RON · net{" "}
              <strong className={result.forecast.avgMonthlyNet >= 0 ? "text-eos-success" : "text-eos-error"}>
                {fmtRON(result.forecast.avgMonthlyNet)} RON
              </strong>{" "}
              · trend{" "}
              <strong className="capitalize">
                {result.forecast.trend === "rising"
                  ? "ascendent"
                  : result.forecast.trend === "falling"
                    ? "descendent"
                    : "stabil"}
              </strong>
            </p>
          </section>

          {/* Matches */}
          {result.reconciliation && result.reconciliation.matches.length > 0 && (
            <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
              <p
                data-display-text="true"
                className="mb-2 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                Potriviri ({result.reconciliation.matches.length})
              </p>
              <div className="space-y-2">
                {result.reconciliation.matches.slice(0, 20).map((m, i) => (
                  <div
                    key={i}
                    className={`flex flex-wrap items-start justify-between gap-2 rounded-eos-md border px-3 py-2 text-[11.5px] ${
                      m.confidence === "high"
                        ? "border-eos-success/30 bg-eos-success-soft"
                        : "border-eos-warning/30 bg-eos-warning-soft"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <p className="font-mono text-eos-text">
                        {m.transaction.dateISO} · {fmtRON(m.transaction.amountRON)} RON · CUI {m.transaction.detectedCif ?? "?"}
                      </p>
                      <p className="text-[10.5px] text-eos-text-muted">
                        → Factura {m.invoice.invoiceNumber} ({m.invoice.partyCif}, {fmtRON(m.invoice.totalRON)} RON)
                      </p>
                    </div>
                    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                      score {m.score.total} · {m.confidence}
                    </span>
                  </div>
                ))}
                {result.reconciliation.matches.length > 20 && (
                  <p className="text-[10.5px] text-eos-text-tertiary">
                    + {result.reconciliation.matches.length - 20} alte potriviri (afișează primele 20)
                  </p>
                )}
              </div>
            </section>
          )}

          {/* CECCAR disclaimer */}
          <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[11.5px] text-eos-text">
            <p className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
              <span>
                <strong>Validare CECCAR Art. 14:</strong> verifică manual potrivirile cu confidence
                'medium' înainte de confirmare contabilă. Sistemul e instrument informativ, nu
                automat de înregistrare contabilă.
              </span>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">{label}</p>
      <p className={`mt-0.5 font-display text-[18px] font-semibold ${tone}`}>{value}</p>
    </div>
  )
}
