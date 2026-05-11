"use client"

import { useEffect, useState } from "react"
import { Copy, FileText, Loader2, RefreshCw, X } from "lucide-react"
import { toast } from "sonner"

type LogEntry = {
  id: string
  kind: "upload" | "status" | "list" | "download" | "probe"
  url: string
  method: "GET" | "POST"
  requestBody: string
  responseStatus: number
  responseHeaders: Record<string, string>
  responseBody: string
  correlationId: string | null
  anafIndexIncarcare: string | null
  anafExecutionStatus: string | null
  durationMs: number
  errorMessage: string | null
  createdAtISO: string
}

const KIND_LABELS: Record<LogEntry["kind"], string> = {
  upload: "Upload factură",
  status: "Verificare stare",
  list: "Listă mesaje",
  download: "Descărcare ZIP",
  probe: "Probe token",
}

export function AnafRequestLogDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [entries, setEntries] = useState<LogEntry[]>([])
  const [selected, setSelected] = useState<LogEntry | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/anaf-request-log?limit=20", { cache: "no-store" })
      if (!res.ok) throw new Error("HTTP " + res.status)
      const payload = (await res.json()) as { entries: LogEntry[] }
      setEntries(payload.entries ?? [])
    } catch (err) {
      toast.error("Nu am putut citi log-ul ANAF.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void load()
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm">
      <div className="ml-auto flex h-full w-full max-w-2xl flex-col bg-eos-surface shadow-2xl">
        <header className="flex items-center justify-between border-b border-eos-border px-4 py-3">
          <div>
            <p
              data-display-text="true"
              className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Istoric cereri ANAF SPV
            </p>
            <p className="text-[11.5px] text-eos-text-muted">
              {entries.length} cereri recente · Folosește pentru dispute / contestații.
            </p>
          </div>
          <div className="flex items-center gap-2">
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
            <button
              onClick={onClose}
              className="rounded-eos-sm p-1.5 text-eos-text-muted hover:bg-eos-surface-elevated"
              aria-label="Închide"
            >
              <X className="size-4" strokeWidth={2} />
            </button>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <ul className="w-72 overflow-y-auto border-r border-eos-border">
            {entries.length === 0 && !loading && (
              <li className="p-4 text-[12px] text-eos-text-muted">
                Niciun request ANAF înregistrat încă. Vor apărea aici după prima submisie.
              </li>
            )}
            {entries.map((entry) => (
              <li
                key={entry.id}
                onClick={() => setSelected(entry)}
                className={`cursor-pointer border-b border-eos-border-subtle px-3 py-2.5 text-[11.5px] ${
                  selected?.id === entry.id ? "bg-eos-surface-elevated" : "hover:bg-eos-surface-elevated/50"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
                    {KIND_LABELS[entry.kind]}
                  </span>
                  <span
                    className={`rounded-sm px-1.5 py-0.5 font-mono text-[10px] ${
                      entry.responseStatus >= 200 && entry.responseStatus < 300
                        ? "bg-eos-success-soft text-eos-success"
                        : "bg-eos-error-soft text-eos-error"
                    }`}
                  >
                    {entry.responseStatus}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-[10.5px] text-eos-text">{entry.url}</p>
                {entry.correlationId && (
                  <p className="mt-1 truncate font-mono text-[9.5px] text-eos-text-tertiary">
                    cid: {entry.correlationId}
                  </p>
                )}
                <p className="mt-0.5 text-[10px] text-eos-text-tertiary">
                  {new Date(entry.createdAtISO).toLocaleString("ro-RO")} · {entry.durationMs}ms
                </p>
              </li>
            ))}
          </ul>

          <div className="flex-1 overflow-y-auto p-4">
            {selected ? (
              <DetailView entry={selected} />
            ) : (
              <p className="text-[12px] text-eos-text-muted">Selectează o cerere din listă.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailView({ entry }: { entry: LogEntry }) {
  function copyCorrelationId() {
    if (!entry.correlationId) return
    navigator.clipboard.writeText(entry.correlationId)
    toast.success("Correlation ID copiat")
  }
  return (
    <div className="space-y-4">
      <section>
        <p
          data-display-text="true"
          className="mb-2 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Sumar
        </p>
        <dl className="grid grid-cols-[140px_1fr] gap-y-1 text-[11.5px]">
          <dt className="text-eos-text-muted">Tip</dt>
          <dd>{KIND_LABELS[entry.kind]}</dd>
          <dt className="text-eos-text-muted">URL</dt>
          <dd className="font-mono break-all">{entry.url}</dd>
          <dt className="text-eos-text-muted">Method</dt>
          <dd className="font-mono">{entry.method}</dd>
          <dt className="text-eos-text-muted">Status</dt>
          <dd className="font-mono">{entry.responseStatus}</dd>
          <dt className="text-eos-text-muted">Latency</dt>
          <dd>{entry.durationMs}ms</dd>
          {entry.correlationId && (
            <>
              <dt className="text-eos-text-muted">x-correlation-id</dt>
              <dd className="flex items-center gap-2 font-mono break-all">
                {entry.correlationId}
                <button
                  onClick={copyCorrelationId}
                  className="text-eos-text-link hover:underline"
                  aria-label="Copiază correlation ID"
                >
                  <Copy className="size-3" strokeWidth={2} />
                </button>
              </dd>
            </>
          )}
          {entry.anafIndexIncarcare && (
            <>
              <dt className="text-eos-text-muted">index_incarcare</dt>
              <dd className="font-mono">{entry.anafIndexIncarcare}</dd>
            </>
          )}
          {entry.anafExecutionStatus !== null && (
            <>
              <dt className="text-eos-text-muted">ExecutionStatus</dt>
              <dd className="font-mono">{entry.anafExecutionStatus}</dd>
            </>
          )}
        </dl>
      </section>

      {entry.requestBody && (
        <section>
          <p
            data-display-text="true"
            className="mb-1 flex items-center gap-1.5 font-display text-[12.5px] font-semibold text-eos-text"
          >
            <FileText className="size-3.5" strokeWidth={2} /> Request body
          </p>
          <pre className="max-h-72 overflow-auto rounded-eos-sm border border-eos-border bg-eos-surface-elevated p-2 font-mono text-[10px] leading-[1.5] text-eos-text">
            {entry.requestBody}
          </pre>
        </section>
      )}

      <section>
        <p
          data-display-text="true"
          className="mb-1 flex items-center gap-1.5 font-display text-[12.5px] font-semibold text-eos-text"
        >
          <FileText className="size-3.5" strokeWidth={2} /> Response body
        </p>
        <pre className="max-h-72 overflow-auto rounded-eos-sm border border-eos-border bg-eos-surface-elevated p-2 font-mono text-[10px] leading-[1.5] text-eos-text">
          {entry.responseBody}
        </pre>
      </section>

      {entry.errorMessage && (
        <section className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft p-3 text-[11.5px] text-eos-text">
          <strong>Error:</strong> {entry.errorMessage}
        </section>
      )}
    </div>
  )
}
