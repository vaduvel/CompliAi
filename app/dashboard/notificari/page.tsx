"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, Filter, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

type Notif = {
  id: string
  type: string
  title: string
  message: string
  linkTo?: string
  readAt?: string
  createdAt: string
}

const FILTERS = [
  { value: "all", label: "Toate" },
  { value: "unread", label: "Necitite" },
  { value: "fiscal_alert", label: "Alerte fiscale" },
  { value: "anaf_deadline", label: "Termene ANAF" },
  { value: "anaf_signal", label: "Semnale ANAF" },
] as const

export default function NotificariPage() {
  const [items, setItems] = useState<Notif[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["value"]>("all")
  const [unread, setUnread] = useState(0)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      if (!res.ok) throw new Error("HTTP " + res.status)
      const payload = (await res.json()) as { notifications: Notif[]; unread: number }
      setItems(payload.notifications ?? [])
      setUnread(payload.unread ?? 0)
    } catch (err) {
      toast.error("Nu am putut încărca notificările.")
    } finally {
      setLoading(false)
    }
  }

  async function markAllRead() {
    const res = await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "mark-all-read" }),
    })
    if (res.ok) {
      toast.success("Toate notificările marcate ca citite")
      await load()
    } else {
      toast.error("Operațiunea a eșuat.")
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const filtered = useMemo(() => {
    if (filter === "all") return items
    if (filter === "unread") return items.filter((n) => !n.readAt)
    return items.filter((n) => n.type === filter)
  }, [items, filter])

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <header className="mb-4 flex items-center justify-between">
        <div>
          <h1
            data-display-text="true"
            className="flex items-center gap-2 font-display text-[20px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            <Bell className="size-5 text-eos-primary" strokeWidth={2} />
            Notificări
          </h1>
          <p className="mt-1 text-[12.5px] text-eos-text-muted">
            Toate alertele cron + signals + termene fiscale într-un singur loc.{" "}
            {unread > 0 ? (
              <strong className="text-eos-error">{unread} necitite.</strong>
            ) : (
              <span className="text-eos-success">Toate sunt citite.</span>
            )}
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
              <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              <RefreshCw className="size-4" strokeWidth={2} />
            )}
          </button>
          {unread > 0 && (
            <button
              onClick={() => void markAllRead()}
              className="flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 text-[12px] text-eos-text hover:bg-eos-surface-elevated"
            >
              <CheckCheck className="size-3.5" strokeWidth={2} />
              Marchează toate citite
            </button>
          )}
        </div>
      </header>

      <div className="mb-3 flex items-center gap-2">
        <Filter className="size-3.5 text-eos-text-muted" strokeWidth={2} />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded-full border px-2.5 py-0.5 text-[11.5px] transition-colors ${
                filter === f.value
                  ? "border-eos-primary bg-eos-primary/10 text-eos-primary"
                  : "border-eos-border bg-eos-surface text-eos-text-muted hover:text-eos-text"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && !loading && (
        <div className="rounded-eos-md border border-dashed border-eos-border bg-eos-surface/40 px-6 py-10 text-center">
          <Bell className="mx-auto size-6 text-eos-text-tertiary" strokeWidth={1.5} />
          <p className="mt-2 text-[13px] text-eos-text-muted">
            {filter === "all" ? "Nicio notificare." : "Niciun rezultat pentru filtrul curent."}
          </p>
        </div>
      )}

      <ul className="space-y-2">
        {filtered.map((n) => (
          <li
            key={n.id}
            className={`rounded-eos-md border p-3 ${
              n.readAt ? "border-eos-border bg-eos-surface" : "border-eos-primary/30 bg-eos-primary/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p
                  data-display-text="true"
                  className="font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  {n.title}
                </p>
                <p className="mt-1 text-[12px] leading-[1.5] text-eos-text">{n.message}</p>
                <p className="mt-1 text-[10.5px] text-eos-text-tertiary">
                  {new Date(n.createdAt).toLocaleString("ro-RO")}
                  {!n.readAt && (
                    <span className="ml-2 rounded-sm bg-eos-primary/10 px-1.5 py-0.5 text-eos-primary">
                      nou
                    </span>
                  )}
                </p>
              </div>
              {n.linkTo && (
                <Link
                  href={n.linkTo}
                  className="shrink-0 rounded-eos-sm border border-eos-border bg-eos-surface px-2 py-1 text-[11px] text-eos-text-link hover:bg-eos-surface-elevated"
                >
                  Deschide
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}
