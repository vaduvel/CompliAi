"use client"

// Sprint 6.4 — Cross-filing consistency UI card.
// Expune checkCrossFilingConsistency existing pe filing-records-uri.

import { useEffect, useState } from "react"
import { AlertTriangle, CheckCircle2, FileText, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { FilingRecord } from "@/lib/compliance/filing-discipline"
import { checkCrossFilingConsistency } from "@/lib/compliance/saft-hygiene"

type ApiResponse = {
  records?: FilingRecord[]
}

export function CrossFilingCheckCard() {
  const [records, setRecords] = useState<FilingRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/filing-records", { cache: "no-store" })
      if (!res.ok) {
        toast.error("Nu am putut încărca depunerile.")
        return
      }
      const data = (await res.json()) as ApiResponse
      setRecords(data.records ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Verific consistența cross-filing...
      </div>
    )
  }

  const issues = checkCrossFilingConsistency(records)
  const errorIssues = issues.filter((i) => i.severity === "error")
  const warningIssues = issues.filter((i) => i.severity === "warning")

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-center gap-2">
        <FileText className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Cross-filing consistency: SAF-T ↔ D300 ↔ D394 ↔ D390
        </p>
      </div>
      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        Verifică automat dacă declarațiile fiscale sunt aliniate. Lipsa unei declarații complementare
        (ex: D300 fără D394, sau SAF-T fără D300) crește riscul de notificare ANAF.
      </p>

      {/* Summary */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">
            Total depuneri
          </p>
          <p className="mt-0.5 font-display text-[18px] font-semibold text-eos-text">{records.length}</p>
        </div>
        <div
          className={`rounded-eos-sm border px-3 py-2 ${
            errorIssues.length > 0
              ? "border-eos-error/30 bg-eos-error-soft text-eos-error"
              : "border-eos-border bg-eos-surface-elevated text-eos-text"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Erori</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold">{errorIssues.length}</p>
        </div>
        <div
          className={`rounded-eos-sm border px-3 py-2 ${
            warningIssues.length > 0
              ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
              : "border-eos-border bg-eos-surface-elevated text-eos-text"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em]">Warnings</p>
          <p className="mt-0.5 font-display text-[18px] font-semibold">{warningIssues.length}</p>
        </div>
      </div>

      {/* Issues list */}
      {issues.length === 0 ? (
        <div className="mt-4 flex items-center gap-2 rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12.5px] text-eos-success">
          <CheckCircle2 className="size-4 shrink-0" strokeWidth={2} />
          <span>
            Toate depunerile sunt aliniate. SAF-T, D300, D394 și D390 corespund pe fiecare perioadă.
          </span>
        </div>
      ) : (
        <ul className="mt-4 space-y-2">
          {issues.map((issue, idx) => (
            <li
              key={`${issue.type}-${issue.periods.join(",")}-${idx}`}
              className={`rounded-eos-md border px-3 py-2 ${
                issue.severity === "error"
                  ? "border-eos-error/30 bg-eos-error-soft"
                  : "border-eos-warning/30 bg-eos-warning-soft"
              }`}
            >
              <div className="flex items-start gap-2">
                <AlertTriangle
                  className={`mt-0.5 size-4 shrink-0 ${
                    issue.severity === "error" ? "text-eos-error" : "text-eos-warning"
                  }`}
                  strokeWidth={2}
                />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold text-eos-text">{issue.message}</p>
                  {issue.periods.length > 0 && (
                    <p className="mt-0.5 font-mono text-[10.5px] text-eos-text-muted">
                      Perioade: {issue.periods.join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
