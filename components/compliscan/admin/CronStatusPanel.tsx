"use client"

// Cron status observability panel — fetches from /api/admin/cron-status,
// renders a table cu nume, schedule, ultima execuție, status, durata, summary.

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Clock, Loader2, RefreshCw } from "lucide-react"

type LastRun = {
  name: string
  lastRunAtISO: string
  ok: boolean
  durationMs: number
  summary: string
  stats?: Record<string, number | string>
  errorMessage?: string
}

type CronEntry = {
  name: string
  path: string
  schedule: string
  description: string
  lastRun: LastRun | null
}

type Response = {
  ok: boolean
  timestamp: string
  crons: CronEntry[]
}

function formatAge(iso: string): string {
  const ageMs = Date.now() - new Date(iso).getTime()
  if (ageMs < 60_000) return "acum"
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)} min`
  if (ageMs < 86_400_000) return `${Math.floor(ageMs / 3_600_000)}h`
  return `${Math.floor(ageMs / 86_400_000)}z`
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`
  return `${(ms / 60_000).toFixed(1)} min`
}

function describeSchedule(cron: string): string {
  // Crontab → friendly RO. Best-effort parser pentru patterns comune.
  if (cron === "*/15 * * * *") return "la 15 minute"
  if (cron === "*/30 * * * *") return "la 30 minute"
  if (/^\d+\s+\d+\s+\*\s+\*\s+\*$/.test(cron)) {
    const [m, h] = cron.split(" ")
    return `zilnic ${h.padStart(2, "0")}:${m.padStart(2, "0")}`
  }
  if (/^\d+\s+\d+\s+\*\s+\*\s+1$/.test(cron)) {
    const [m, h] = cron.split(" ")
    return `Lunea ${h.padStart(2, "0")}:${m.padStart(2, "0")}`
  }
  if (/^\d+\s+\d+\s+1\s+\*\s+\*$/.test(cron)) {
    const [m, h] = cron.split(" ")
    return `1 ale lunii, ${h.padStart(2, "0")}:${m.padStart(2, "0")}`
  }
  return cron
}

export function CronStatusPanel() {
  const [data, setData] = useState<CronEntry[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  async function load(initial = false) {
    if (initial) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/cron-status", { cache: "no-store" })
      if (!res.ok) {
        setError(`Eroare ${res.status}`)
        return
      }
      const json = (await res.json()) as Response
      setData(json.crons)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare de rețea")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    void load(true)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface p-4 text-[13px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
        Se încarcă cron-urile...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-4 text-[13px] text-eos-error">
        {error}
      </div>
    )
  }

  if (!data) return null

  const withRun = data.filter((c) => c.lastRun)
  const noRun = data.filter((c) => !c.lastRun)
  const failures = withRun.filter((c) => c.lastRun && !c.lastRun.ok)

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Configurate
            </p>
            <p className="mt-0.5 font-display text-[20px] font-semibold text-eos-text">
              {data.length}
            </p>
          </div>
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Cu run
            </p>
            <p className="mt-0.5 font-display text-[20px] font-semibold text-eos-text">
              {withRun.length}
            </p>
          </div>
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
              Erori
            </p>
            <p
              className={`mt-0.5 font-display text-[20px] font-semibold ${
                failures.length > 0 ? "text-eos-error" : "text-eos-text"
              }`}
            >
              {failures.length}
            </p>
          </div>
        </div>
        <button
          onClick={() => void load()}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-1.5 font-mono text-[11px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text disabled:opacity-50"
        >
          {refreshing ? (
            <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
          ) : (
            <RefreshCw className="size-3.5" strokeWidth={2} />
          )}
          Refresh
        </button>
      </div>

      <div className="overflow-hidden rounded-eos-md border border-eos-border bg-eos-surface">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
              <th className="px-3 py-2">Cron</th>
              <th className="px-3 py-2">Schedule</th>
              <th className="px-3 py-2">Last run</th>
              <th className="px-3 py-2">Durată</th>
              <th className="px-3 py-2">Sumar</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c) => {
              const r = c.lastRun
              return (
                <tr
                  key={c.name}
                  className="border-b border-eos-border/50 align-top hover:bg-eos-surface-elevated/40"
                >
                  <td className="px-3 py-2">
                    <p className="font-mono text-[12px] font-semibold text-eos-text">{c.name}</p>
                    <p className="mt-0.5 text-[11px] text-eos-text-muted">{c.description}</p>
                  </td>
                  <td className="px-3 py-2">
                    <p className="font-mono text-[11px] text-eos-text-muted">{c.schedule}</p>
                    <p className="mt-0.5 text-[11px] text-eos-text-tertiary">
                      {describeSchedule(c.schedule)}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    {!r ? (
                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-eos-text-tertiary">
                        <Clock className="size-3" strokeWidth={2} /> niciun run
                      </span>
                    ) : (
                      <span
                        className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                          r.ok ? "text-eos-success" : "text-eos-error"
                        }`}
                      >
                        {r.ok ? (
                          <CheckCircle2 className="size-3" strokeWidth={2} />
                        ) : (
                          <AlertCircle className="size-3" strokeWidth={2} />
                        )}
                        {formatAge(r.lastRunAtISO)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-[11px] text-eos-text-muted">
                    {r ? formatDuration(r.durationMs) : "—"}
                  </td>
                  <td className="px-3 py-2 text-[11.5px] text-eos-text">
                    {!r ? (
                      <span className="text-eos-text-tertiary">—</span>
                    ) : r.ok ? (
                      <span>{r.summary}</span>
                    ) : (
                      <span className="text-eos-error">
                        {r.errorMessage ?? r.summary}
                      </span>
                    )}
                    {r?.stats && (
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {Object.entries(r.stats).map(([k, v]) => (
                          <span
                            key={k}
                            className="rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-1.5 py-0.5 font-mono text-[10px] text-eos-text-muted"
                          >
                            {k}: <span className="text-eos-text">{v}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {noRun.length > 0 && (
        <p className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated px-3 py-2 text-[11.5px] text-eos-text-muted">
          <strong>{noRun.length}</strong> cron(uri) configurate dar fără execuție înregistrată.
          Pentru ca un cron să apară în coloana <em>last-run</em>, handler-ul lui trebuie să
          apeleze <code className="font-mono text-[10.5px]">recordCronRun()</code> sau să fie
          împachetat cu <code className="font-mono text-[10.5px]">withCronRecording()</code>.
        </p>
      )}
    </div>
  )
}
