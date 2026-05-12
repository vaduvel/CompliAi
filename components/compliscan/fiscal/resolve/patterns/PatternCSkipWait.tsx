"use client"

// PatternCSkipWait — Pattern C pentru EF-004 < 72h (factură în prelucrare
// ANAF, normal sub 72h). Folosit doar dacă timeSinceSubmit < 72h. Peste 72h,
// dispatcher trimite la Pattern I (retransmit).
//
// Faza 3.4 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternCProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternCSkipWait({ finding, onResolved }: PatternCProps) {
  const [checking, setChecking] = useState(false)
  const [reminding, setReminding] = useState(false)

  const submittedAt = extractSubmittedAt(finding)
  const hoursElapsed = submittedAt
    ? Math.floor((Date.now() - submittedAt.getTime()) / (1000 * 60 * 60))
    : 0
  const hoursRemaining = Math.max(72 - hoursElapsed, 0)

  async function handleCheckStatus() {
    setChecking(true)
    try {
      // Re-probă SPV pentru această factură
      const res = await fetch(
        `/api/fiscal/spv-check?findingId=${encodeURIComponent(finding.id)}`,
        { method: "POST" },
      )
      if (!res.ok) throw new Error("Verificare SPV eșuată.")
      const data = (await res.json()) as { status?: string }
      if (data.status === "ok" || data.status === "accepted") {
        toast.success("Status final: ACCEPTAT. Marchez rezolvat.")
        // Auto-resolve
        await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            evidence: { type: "skip-wait-confirmed", spvStatus: data.status },
          }),
        })
        onResolved()
        return
      }
      if (data.status === "rejected") {
        toast.error("ANAF a respins factura. Trecem la Pattern A (auto-fix).")
        // Refresh ca dispatcher să re-evalueze tipul
        window.location.reload()
        return
      }
      toast.info(`Status curent: ${data.status ?? "în prelucrare"}. Mai aștept.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare verificare.")
    } finally {
      setChecking(false)
    }
  }

  async function handleSetReminder() {
    setReminding(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/reminder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delayHours: 24 }),
      })
      if (!res.ok) throw new Error("Nu am putut seta reminder.")
      toast.success("Reminder setat — îți pinguim peste 24h să reverifici.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setReminding(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] p-3">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
          <Clock className="size-3.5" strokeWidth={1.5} />
          În prelucrare ANAF — sub pragul de intervenție
        </p>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
          ANAF e încărcat în zilele 20-25 ale lunii (depuneri D300). Factura ta
          e în coadă, NU e respinsă. Sub 72h, e comportament normal — nu retransmiți.
        </p>
      </div>

      {/* Timer countdown */}
      <div className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
        <div className="grid grid-cols-3 divide-x divide-eos-border-subtle">
          <div className="px-3 py-3 text-center">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Timp scurs
            </p>
            <p className="mt-1 font-display text-[18px] font-semibold text-eos-text">
              {hoursElapsed}h
            </p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Prag intervenție
            </p>
            <p className="mt-1 font-display text-[18px] font-semibold text-eos-text">72h</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Rămas
            </p>
            <p className="mt-1 font-display text-[18px] font-semibold text-eos-warning">
              {hoursRemaining}h
            </p>
          </div>
        </div>
        <div className="h-1.5 w-full bg-eos-surface-variant">
          <div
            className="h-full bg-eos-warning transition-all"
            style={{ width: `${Math.min(100, (hoursElapsed / 72) * 100)}%` }}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleCheckStatus()}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? (
            <>
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
              Verific…
            </>
          ) : (
            <>
              <RefreshCw className="size-4" strokeWidth={2} />
              Verifică status acum
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => void handleSetReminder()}
          disabled={reminding}
          className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reminding ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <Clock className="size-3.5" strokeWidth={2} />
          )}
          Reamintește peste 24h
        </button>
        {hoursElapsed >= 72 && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.06] px-3 py-2 text-[12px] font-medium text-eos-warning transition hover:bg-eos-warning/[0.10]"
          >
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
            Trecut prag 72h — retransmite oricum
          </button>
        )}
      </div>
    </div>
  )
}

function extractSubmittedAt(finding: ScanFinding): Date | null {
  // Try to parse submittedAt from finding.detail or createdAtISO
  try {
    return new Date(finding.createdAtISO)
  } catch {
    return null
  }
}
