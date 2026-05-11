"use client"

import { useEffect, useState } from "react"
import { Loader2, PlayCircle, RefreshCw, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type BatchSession = {
  sessionId: string
  kind: "validate" | "upload" | "import-erp"
  label: string
  totalItems: number
  processedCount: number
  failedCount: number
  succeededCount: number
  status: "active" | "completed" | "cancelled"
  createdAtISO: string
  updatedAtISO: string
}

const KIND_LABEL: Record<BatchSession["kind"], string> = {
  validate: "Validare",
  upload: "Upload SPV",
  "import-erp": "Import ERP",
}

export function BatchSessionsCard() {
  const [sessions, setSessions] = useState<BatchSession[]>([])
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/batch-sessions", { cache: "no-store" })
      if (!res.ok) throw new Error("HTTP " + res.status)
      const payload = (await res.json()) as { sessions: BatchSession[] }
      setSessions(payload.sessions ?? [])
    } catch (err) {
      toast.error("Nu am putut citi sesiunile.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function cancelSession(sessionId: string) {
    const res = await fetch(`/api/fiscal/batch-sessions/${encodeURIComponent(sessionId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cancel: true }),
    })
    if (res.ok) {
      toast.success("Sesiune anulată")
      await load()
    } else {
      toast.error("Nu am putut anula sesiunea.")
    }
  }

  return (
    <div className="space-y-3">
      <header className="flex items-center justify-between">
        <p className="text-[12px] text-eos-text-muted">
          Sesiuni active de procesare bulk. Continuă unde au rămas dacă s-au întrerupt.
        </p>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="rounded-eos-sm p-1.5 text-eos-text-muted hover:bg-eos-surface-elevated"
          aria-label="Reîncarcă"
        >
          {loading ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="size-3.5" strokeWidth={2} />
          )}
        </button>
      </header>

      {sessions.length === 0 && !loading && (
        <div className="rounded-eos-md border border-dashed border-eos-border bg-eos-surface/40 px-4 py-6 text-center text-[12px] text-eos-text-muted">
          Nicio sesiune activă. Vor apărea aici după ce începi un bulk de validare /
          upload / import ERP.
        </div>
      )}

      <ul className="space-y-2">
        {sessions.map((session) => {
          const progress = Math.round((session.processedCount / Math.max(session.totalItems, 1)) * 100)
          return (
            <li
              key={session.sessionId}
              className="rounded-eos-md border border-eos-border bg-eos-surface p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    data-display-text="true"
                    className="font-display text-[12.5px] font-semibold tracking-[-0.015em] text-eos-text"
                  >
                    {session.label}
                  </p>
                  <p className="text-[10.5px] text-eos-text-tertiary">
                    {KIND_LABEL[session.kind]} ·{" "}
                    {new Date(session.createdAtISO).toLocaleString("ro-RO")}
                  </p>
                </div>
                <span
                  className={`rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase ${
                    session.status === "active"
                      ? "bg-eos-primary/10 text-eos-primary"
                      : session.status === "completed"
                        ? "bg-eos-success-soft text-eos-success"
                        : "bg-eos-text-muted/10 text-eos-text-muted"
                  }`}
                >
                  {session.status}
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-[11px] text-eos-text-muted">
                  <span>
                    {session.processedCount}/{session.totalItems} procesate · {session.succeededCount} OK ·{" "}
                    {session.failedCount} eșuat
                  </span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-eos-border">
                  <div
                    className="h-full bg-eos-primary"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
              {session.status === "active" && (
                <div className="mt-2 flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      toast.info(`Sesiune ${session.sessionId} — reluare via worker.`, {
                        description:
                          "Worker-ul preia automat itemii pendinți la următoarea rulare.",
                      })
                    }}
                  >
                    <PlayCircle className="mr-1 size-3.5" strokeWidth={2} /> Reia
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => cancelSession(session.sessionId)}
                  >
                    <XCircle className="mr-1 size-3.5" strokeWidth={2} /> Anulează
                  </Button>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
