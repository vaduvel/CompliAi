"use client"

// AuditLogInline — afișează ultimele 5 evenimente din audit log pentru un
// finding fiscal sau un client. Folosit ca block JOS în Fiscal Resolve Cockpit.
//
// Source: lib/server/anaf-request-log.ts (engine) — fetch via API.
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useEffect, useState } from "react"
import Link from "next/link"
import { Clock, FileText, Loader2 } from "lucide-react"

type AuditLogEntry = {
  id: string
  timestamp: string
  actorLabel: string
  action: string
  result: "success" | "failed" | "pending"
  message?: string
}

type AuditLogInlineProps = {
  /** ID-ul finding-ului (sau client) pentru care fetch-ăm log-ul. */
  scopeId: string
  /** Maxim N intrări. Default 5. */
  limit?: number
}

export function AuditLogInline({ scopeId, limit = 5 }: AuditLogInlineProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/fiscal/anaf-request-log?scope=${encodeURIComponent(scopeId)}&limit=${limit}`, {
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((data: { entries?: AuditLogEntry[] }) => setEntries(data.entries ?? []))
      .catch(() => setEntries([]))
      .finally(() => setLoading(false))
  }, [scopeId, limit])

  return (
    <section className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40">
      <header className="flex items-center justify-between gap-2 border-b border-eos-border-subtle px-3 py-2">
        <div className="flex items-center gap-2">
          <Clock className="size-3.5 text-eos-text-tertiary" strokeWidth={1.5} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Audit log — ultimele {limit}
          </span>
        </div>
        <Link
          href={`/dashboard/fiscal/transmitere?anafLog=${encodeURIComponent(scopeId)}`}
          className="flex items-center gap-1 font-mono text-[10px] text-eos-text-link transition hover:underline"
        >
          <FileText className="size-3" strokeWidth={1.5} />
          Vezi log complet
        </Link>
      </header>

      <div className="divide-y divide-eos-border-subtle">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Loader2 className="size-3 animate-spin text-eos-text-muted" strokeWidth={2} />
            <span className="text-[11.5px] text-eos-text-tertiary">Încărc audit log…</span>
          </div>
        ) : entries.length === 0 ? (
          <p className="px-3 py-2.5 text-[11.5px] text-eos-text-tertiary">
            Niciun eveniment înregistrat încă. Primul fix sau retransmit va apărea aici.
          </p>
        ) : (
          entries.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 px-3 py-2">
              <span
                className={`mt-1 inline-block size-1.5 shrink-0 rounded-full ${
                  entry.result === "success"
                    ? "bg-eos-success"
                    : entry.result === "failed"
                      ? "bg-eos-error"
                      : "bg-eos-warning"
                }`}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12px] text-eos-text">{entry.action}</p>
                {entry.message && (
                  <p className="mt-0.5 truncate text-[11px] text-eos-text-tertiary">
                    {entry.message}
                  </p>
                )}
              </div>
              <span className="shrink-0 whitespace-nowrap font-mono text-[10px] text-eos-text-tertiary">
                {formatTimestamp(entry.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}
