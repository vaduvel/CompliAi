"use client"

// Card reconciliere ERP local (SmartBill) vs ANAF SPV real.
// Buton care declanșează compararea și afișează disparities cu severity.

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, Scale, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/evidence-os/Button"

type Disparity = {
  invoiceKey: string
  type: string
  severity: "critical" | "high" | "medium"
  erpStatus: string
  spvStatus: string
  invoiceNumber: string
  series: string
  message: string
}

type ReconcileResult = {
  ok: boolean
  erpCount: number
  spvCount: number
  disparities: Disparity[]
  findingsGenerated: number
  error?: string
}

const SEVERITY_TONE: Record<Disparity["severity"], string> = {
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  high: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  medium: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
}

export function ErpSpvReconcileCard() {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<ReconcileResult | null>(null)

  async function reconcile() {
    setBusy(true)
    try {
      const res = await fetch("/api/fiscal/erp-spv-reconcile", { method: "POST" })
      const data = (await res.json()) as ReconcileResult
      if (!res.ok) {
        toast.error("Reconciliere eșuată", { description: data.error })
        return
      }
      setResult(data)
      if (data.disparities.length === 0) {
        toast.success("ERP și SPV sunt sincronizate.", {
          description: `${data.erpCount} facturi SmartBill ↔ ${data.spvCount} mesaje SPV — zero disparities.`,
        })
      } else {
        const critCount = data.disparities.filter((d) => d.severity === "critical").length
        toast.warning(`${data.disparities.length} disparities detectate`, {
          description: `${critCount} critice — verifică imediat.`,
        })
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <Scale className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Reconciliere ERP local ↔ ANAF SPV real
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        Compară statusul facturilor în SmartBill local cu statusul real în SPV ANAF. Detectează
        cazul „SmartBill zice transmis dar SPV o respinge" — risc 15% amendă dacă nu acționezi.
      </p>

      <div className="mt-4">
        <Button onClick={() => void reconcile()} disabled={busy}>
          {busy ? (
            <>
              <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Compar ERP-SPV...
            </>
          ) : (
            <>
              <Scale className="mr-2 size-3.5" strokeWidth={2} /> Rulează reconciliere
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">SmartBill</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{result.erpCount}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">ANAF SPV</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{result.spvCount}</p>
            </div>
            <div
              className={`rounded-eos-sm border px-3 py-2 ${
                result.disparities.length > 0
                  ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
                  : "border-eos-success/30 bg-eos-success-soft text-eos-success"
              }`}
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Disparities</p>
              <p className="mt-0.5 font-display text-[18px] font-semibold">{result.disparities.length}</p>
            </div>
          </div>

          {result.disparities.length === 0 ? (
            <div className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12.5px] text-eos-success">
              <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
              ERP și SPV sunt sincronizate perfect. Niciun risc de discordanță.
            </div>
          ) : (
            <ul className="space-y-2">
              {result.disparities.map((d) => (
                <li
                  key={d.invoiceKey}
                  className={`rounded-eos-md border px-3 py-2 ${SEVERITY_TONE[d.severity]}`}
                >
                  <div className="flex items-start gap-2">
                    {d.severity === "critical" ? (
                      <ShieldAlert className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                    ) : (
                      <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={2} />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-semibold text-eos-text">
                        Factură {d.series}
                        {d.invoiceNumber}
                      </p>
                      <p className="mt-0.5 text-[12px] leading-[1.5] text-eos-text-muted">{d.message}</p>
                      <p className="mt-0.5 font-mono text-[10.5px] text-eos-text-tertiary">
                        ERP: {d.erpStatus} ↔ SPV: {d.spvStatus}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  )
}
