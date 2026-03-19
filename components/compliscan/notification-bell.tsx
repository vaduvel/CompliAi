"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Bell, CheckCheck, X } from "lucide-react"

import type { AppNotification } from "@/lib/server/notifications-store"

const TYPE_ICON: Record<string, string> = {
  finding_new: "🔴",
  incident_deadline: "⏰",
  document_generated: "📄",
  drift_detected: "📊",
  vendor_risk: "🔗",
  info: "ℹ️",
  anaf_signal: "📋",
  anaf_deadline: "⚠️",
  fiscal_alert: "🔔",
}

const ANAF_TYPES = new Set(["anaf_signal", "anaf_deadline", "fiscal_alert"])

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" })
      const data = (await res.json()) as { notifications: AppNotification[]; unread: number }
      setNotifications(data.notifications ?? [])
      setUnread(data.unread ?? 0)
    } catch {
      // silently ignore
    }
  }

  useEffect(() => {
    void fetchNotifications()
    // Poll every 60 seconds
    const interval = setInterval(() => void fetchNotifications(), 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  async function markRead(notifId: string) {
    try {
      await fetch(`/api/notifications/${notifId}`, { method: "PATCH" })
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, readAt: new Date().toISOString() } : n))
      )
      setUnread((prev) => Math.max(0, prev - 1))
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark-all-read" }),
      })
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })))
      setUnread(0)
    } catch {
      // ignore
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v)
          if (!open) void fetchNotifications()
        }}
        className="relative flex size-9 items-center justify-center rounded-eos-md border border-eos-border-subtle bg-eos-surface text-eos-text-muted hover:border-eos-border hover:bg-eos-surface-elevated hover:text-eos-text"
        aria-label="Notificări"
      >
        <Bell className="size-4" strokeWidth={2} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        {notifications.some((n) => !n.readAt && ANAF_TYPES.has(n.type)) && (
          <span
            className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border border-white bg-amber-500"
            title="Notificări ANAF nerezolvate"
          />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface shadow-[var(--eos-shadow-lg)]">
          <div className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-3">
            <p className="text-sm font-semibold text-eos-text">Notificări</p>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={() => void markAllRead()}
                  className="flex items-center gap-1 text-xs text-eos-text-muted hover:text-eos-text"
                  title="Marchează toate ca citite"
                >
                  <CheckCheck className="size-3.5" strokeWidth={2} />
                  Toate citite
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-eos-text-muted hover:text-eos-text"
                aria-label="Închide"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>
          </div>

          {/* ANAF unresolved count strip */}
          {(() => {
            const anafUnread = notifications.filter((n) => !n.readAt && ANAF_TYPES.has(n.type)).length
            if (anafUnread === 0) return null
            return (
              <div className="flex items-center gap-2 border-b border-eos-border-subtle bg-amber-50 px-4 py-2">
                <span className="size-2 rounded-full bg-amber-500" />
                <span className="text-[11px] font-medium text-amber-800">
                  {anafUnread} semnal{anafUnread > 1 ? "e" : ""} ANAF nerezolvat{anafUnread > 1 ? "e" : ""}
                </span>
              </div>
            )
          })()}

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-eos-text-muted">
                Nicio notificare
              </p>
            ) : (
              notifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-eos-border-subtle px-4 py-3 transition-colors ${!n.readAt ? "bg-eos-primary-soft/30" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    <span className="mt-0.5 text-sm">{TYPE_ICON[n.type] ?? "🔔"}</span>
                    <div className="min-w-0 flex-1">
                      {n.linkTo ? (
                        <Link
                          href={n.linkTo}
                          className="block text-xs font-semibold text-eos-text hover:text-eos-primary"
                          onClick={() => {
                            if (!n.readAt) void markRead(n.id)
                            setOpen(false)
                          }}
                        >
                          {n.title}
                        </Link>
                      ) : (
                        <p className="text-xs font-semibold text-eos-text">{n.title}</p>
                      )}
                      <p className="mt-0.5 text-[11px] leading-relaxed text-eos-text-muted">{n.message}</p>
                      <p className="mt-1 text-[10px] text-eos-text-muted">
                        {new Date(n.createdAt).toLocaleString("ro-RO", {
                          day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!n.readAt && (
                      <button
                        type="button"
                        onClick={() => void markRead(n.id)}
                        className="shrink-0 text-eos-text-muted hover:text-eos-primary"
                        title="Marchează ca citit"
                      >
                        <CheckCheck className="size-3.5" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
