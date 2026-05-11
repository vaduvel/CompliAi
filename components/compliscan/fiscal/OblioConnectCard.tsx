"use client"

// Oblio connect/sync card — pattern identic cu SmartBill, dar OAuth-based.

import { useEffect, useState } from "react"
import {
  Check,
  CheckCircle2,
  ExternalLink,
  Loader2,
  PlugZap,
  RefreshCw,
  Unplug,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type ConnectionStatus = {
  connected: boolean
  email?: string
  cif?: string
  connectedAtISO?: string
  tokenExpiresAtISO?: string
  tokenExpired?: boolean
  lastSyncAtISO?: string | null
  lastSyncCount?: number
}

type SyncResponse = {
  ok: boolean
  syncedAtISO?: string
  invoicesTotal?: number
  invoicesProblematic?: number
  findingsGenerated?: number
  error?: string | null
}

function fmtDate(iso?: string | null) {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

export function OblioConnectCard() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [form, setForm] = useState({ email: "", token: "", cif: "" })

  useEffect(() => {
    void refresh()
  }, [])

  async function refresh() {
    setLoading(true)
    try {
      const res = await fetch("/api/integrations/oblio/connect", { cache: "no-store" })
      setStatus(res.ok ? ((await res.json()) as ConnectionStatus) : { connected: false })
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    setBusy(true)
    try {
      const res = await fetch("/api/integrations/oblio/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error("Conectare Oblio eșuată", { description: data.error ?? "Verifică credențialele." })
        return
      }
      toast.success("Oblio conectat. Token valid 1h, refresh automat la sync.")
      setForm({ email: "", token: "", cif: "" })
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la conectare.")
    } finally {
      setBusy(false)
    }
  }

  async function handleSync() {
    setBusy(true)
    try {
      const res = await fetch("/api/integrations/oblio/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      })
      const data = (await res.json()) as SyncResponse
      if (!res.ok || !data.ok) {
        toast.error("Sync eșuat", { description: data.error ?? "" })
        return
      }
      toast.success("Sync Oblio complet", {
        description: `${data.invoicesTotal} facturi · ${data.invoicesProblematic} cu probleme · ${data.findingsGenerated} findings.`,
      })
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la sync.")
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("Sigur vrei să deconectezi Oblio?")) return
    setBusy(true)
    try {
      await fetch("/api/integrations/oblio/connect", { method: "DELETE" })
      toast.success("Oblio deconectat.")
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se verifică conexiunea Oblio...
      </div>
    )
  }

  return (
    <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <PlugZap className="size-4 text-eos-primary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            Integrare Oblio
          </p>
        </div>
        {status?.connected && (
          <span
            className={`inline-flex items-center gap-1 rounded-eos-sm border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] ${
              status.tokenExpired
                ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                : "border-eos-success/30 bg-eos-success-soft text-eos-success"
            }`}
          >
            <Check className="size-3" strokeWidth={2.5} />
            {status.tokenExpired ? "TOKEN EXPIRAT" : "CONECTAT"}
          </span>
        )}
      </div>

      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        OAuth 2.0. Token valid 1 oră, refresh automat la fiecare sync. Toate integrările Oblio sunt gratuite
        (€2.49/lună abonament Oblio inclus).{" "}
        <a
          href="https://www.oblio.eu/api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-eos-primary underline-offset-2 hover:underline"
        >
          Documentație API <ExternalLink className="size-3" strokeWidth={2} />
        </a>
      </p>

      {status?.connected ? (
        <div className="mt-4 space-y-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Email</p>
              <p className="mt-0.5 font-mono text-[12px] text-eos-text">{status.email}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">CUI</p>
              <p className="mt-0.5 font-mono text-[12px] text-eos-text">{status.cif}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">
                Token expiră
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-eos-text">{fmtDate(status.tokenExpiresAtISO)}</p>
            </div>
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 py-2">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">
                Ultimul sync
              </p>
              <p className="mt-0.5 font-mono text-[12px] text-eos-text">
                {status.lastSyncAtISO
                  ? `${fmtDate(status.lastSyncAtISO)} · ${status.lastSyncCount ?? 0} facturi`
                  : "Niciodată"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void handleSync()} disabled={busy} data-testid="oblio-sync">
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Sync în curs...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-3.5" strokeWidth={2} /> Rulează sync
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={() => void handleDisconnect()} disabled={busy}>
              <Unplug className="mr-2 size-3.5" strokeWidth={2} /> Deconectează
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Email cont Oblio
            </span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="contabil@cabinet.ro"
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            />
          </label>
          <label className="block">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              CUI (fără RO)
            </span>
            <input
              value={form.cif}
              onChange={(e) => setForm((f) => ({ ...f, cif: e.target.value }))}
              placeholder="12345678"
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 font-mono text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Client Secret (Settings &gt; Account Details)
            </span>
            <input
              type="password"
              value={form.token}
              onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
              placeholder="Token Oblio din contul tău"
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 font-mono text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            />
          </label>
          <div className="sm:col-span-2">
            <Button
              onClick={() => void handleConnect()}
              disabled={busy || !form.email || !form.token || !form.cif}
              data-testid="oblio-connect"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Validare OAuth...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-3.5" strokeWidth={2} /> Conectează Oblio
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
