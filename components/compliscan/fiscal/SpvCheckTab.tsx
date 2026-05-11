"use client"

import { useState } from "react"
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

// ── SPV Check Tab ────────────────────────────────────────────────────────────

type SpvSignal = { messageId: string; type: string; date: string; detail: string; converted: boolean }
type SpvCheckResult = {
  cui: string
  spvRegistered: boolean | null
  tokenAvailable: boolean
  messagesChecked: number
  newFindings: number
  signals: SpvSignal[]
}

export function SpvCheckTab() {
  const [result, setResult] = useState<SpvCheckResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function runCheck() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/spv-check", { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la verificare.")
      setResult(data as SpvCheckResult)
      if (data.newFindings > 0) toast.success(`${data.newFindings} finding(s) noi create din semnale SPV.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscuta.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <section className="flex flex-col items-start justify-between gap-3 overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5 md:flex-row md:items-center">
        <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
          Verifica daca firma e inregistrata in SPV si citeste semnalele de eroare ANAF.
        </p>
        <Button size="sm" className="gap-1.5" onClick={() => void runCheck()} disabled={loading}>
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <ShieldCheck className="size-3.5" strokeWidth={2} />
          )}
          Verifica SPV
        </Button>
      </section>

      {error && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-error/30 bg-eos-error-soft">
          <div className="px-4 py-3">
            <p className="text-[12.5px] leading-[1.55] text-eos-error">{error}</p>
          </div>
        </section>
      )}

      {result && (
        <div className="space-y-4">
          <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
            <header className="border-b border-eos-border-subtle px-4 py-3.5">
              <h3
                data-display-text="true"
                className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                Rezultat verificare SPV
              </h3>
            </header>
            <div className="space-y-2 px-4 py-4">
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="text-eos-text-muted">CUI:</span>
                <span className="font-mono text-eos-text">{result.cui}</span>
              </div>
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="text-eos-text-muted">SPV:</span>
                {result.spvRegistered === true && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-success">
                    <CheckCircle2 className="size-3" strokeWidth={2} /> Inregistrat
                  </span>
                )}
                {result.spvRegistered === false && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
                    <AlertTriangle className="size-3" strokeWidth={2} /> Neinregistrat
                  </span>
                )}
                {result.spvRegistered === null && (
                  <span className="inline-flex items-center gap-1 rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                    Nu s-a putut determina
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[12.5px]">
                <span className="text-eos-text-muted">Token ANAF:</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${
                    result.tokenAvailable
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                      : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
                  }`}
                >
                  {result.tokenAvailable ? "Conectat" : "Neconectat"}
                </span>
              </div>
              {result.messagesChecked > 0 && (
                <p className="font-mono text-[11px] text-eos-text-muted">
                  {result.messagesChecked} mesaje verificate · {result.newFindings} findings noi
                </p>
              )}
            </div>
          </section>

          {result.signals.length > 0 && (
            <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
              <header className="border-b border-eos-border-subtle px-4 py-3.5">
                <h3
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Semnale detectate
                </h3>
              </header>
              <ul className="divide-y divide-eos-border-subtle">
                {result.signals.map((s) => (
                  <li key={s.messageId} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[13.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text">
                          {s.type}
                        </p>
                        <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">{s.detail}</p>
                        <p className="mt-1 font-mono text-[11px] text-eos-text-muted">{s.date}</p>
                      </div>
                      {s.converted && (
                        <span className="inline-flex shrink-0 items-center rounded-sm border border-eos-primary/30 bg-eos-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-primary">
                          Finding creat
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {result.signals.length === 0 && result.spvRegistered && (
            <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-full border border-eos-success/30 bg-eos-success-soft">
                <CheckCircle2 className="size-4 text-eos-success" strokeWidth={1.8} />
              </div>
              <div className="max-w-md space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Fara semnale de eroare
                </p>
                <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
                  Nu au fost detectate facturi respinse sau erori XML in ultimele 30 de zile.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {!result && !loading && !error && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
            <ShieldCheck className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
          </div>
          <div className="max-w-md space-y-1">
            <p
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Verificare SPV
            </p>
            <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
              Apasa butonul pentru a verifica inregistrarea SPV si a citi semnalele ANAF.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
