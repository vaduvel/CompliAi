"use client"

// SmartBill connect/sync card pentru tab-ul „Integrări" din /dashboard/fiscal.
//
// UX: două stări — disconnected (form cu email + token + CUI) și connected
// (status + sync button + disconnect). Toast la fiecare acțiune.

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
  tokenMasked?: string
  connectedAtISO?: string
  lastSyncAtISO?: string | null
  lastSyncCount?: number
  lastSyncError?: string | null
}

type SyncResponse = {
  ok: boolean
  syncedAtISO?: string
  invoicesTotal?: number
  invoicesProblematic?: number
  findingsGenerated?: number
  findings?: Array<{ id: string; title: string; severity: string }>
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

export function SmartBillConnectCard() {
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
      const res = await fetch("/api/integrations/smartbill/connect", { cache: "no-store" })
      if (res.ok) {
        const data = (await res.json()) as ConnectionStatus
        setStatus(data)
      } else {
        setStatus({ connected: false })
      }
    } catch {
      setStatus({ connected: false })
    } finally {
      setLoading(false)
    }
  }

  async function handleConnect() {
    if (!form.email.includes("@") || form.token.length < 10 || form.cif.replace(/\D/g, "").length < 6) {
      toast.error("Completează toate câmpurile corect.")
      return
    }
    setBusy(true)
    try {
      const res = await fetch("/api/integrations/smartbill/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string; seriesCount?: number }
      if (!res.ok || !data.ok) {
        toast.error("Conectare SmartBill eșuată", {
          description: data.error ?? "Verifică tokenul în SmartBill > My Account > Integrations.",
        })
        return
      }
      toast.success("SmartBill conectat", {
        description: `${data.seriesCount ?? 0} serii detectate. Poți rula sync acum.`,
      })
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
      const res = await fetch("/api/integrations/smartbill/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: 30 }),
      })
      const data = (await res.json()) as SyncResponse
      if (!res.ok || !data.ok) {
        toast.error("Sync eșuat", { description: data.error ?? "Verifică conexiunea." })
        return
      }
      toast.success("Sync SmartBill complet", {
        description: `${data.invoicesTotal} facturi citite · ${data.invoicesProblematic} cu probleme · ${data.findingsGenerated} findings.`,
      })
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la sync.")
    } finally {
      setBusy(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm("Sigur vrei să deconectezi SmartBill? Tokenul va fi șters.")) return
    setBusy(true)
    try {
      const res = await fetch("/api/integrations/smartbill/connect", { method: "DELETE" })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        toast.error("Deconectare eșuată", { description: data.error ?? "" })
        return
      }
      toast.success("SmartBill deconectat.")
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la deconectare.")
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se verifică conexiunea SmartBill...
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
            Integrare SmartBill
          </p>
        </div>
        {status?.connected && (
          <span className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-success/30 bg-eos-success-soft px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-success">
            <Check className="size-3" strokeWidth={2.5} /> CONECTAT
          </span>
        )}
      </div>

      <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
        Importă automat statusul e-Facturilor emise prin SmartBill — detectează „cu eroare", „in validare",
        „de trimis" și generează findings preventive.{" "}
        <a
          href="https://ajutor.smartbill.ro/article/196-integrare-api"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-eos-primary underline-offset-2 hover:underline"
        >
          Cum obții tokenul <ExternalLink className="size-3" strokeWidth={2} />
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
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">Token</p>
              <p className="mt-0.5 font-mono text-[12px] text-eos-text">{status.tokenMasked}</p>
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

          {status.lastSyncError && (
            <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft p-2.5 text-[12px] text-eos-error">
              <XCircle className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
              Ultima eroare: {status.lastSyncError}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <Button onClick={() => void handleSync()} disabled={busy} data-testid="smartbill-sync">
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Sync în curs...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 size-3.5" strokeWidth={2} /> Rulează sync (ultimele 30 zile)
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
              Email cont SmartBill
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
              Token API SmartBill
            </span>
            <input
              type="password"
              value={form.token}
              onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
              placeholder="My Account > Integrations > API"
              className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 font-mono text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
            />
          </label>
          <div className="sm:col-span-2">
            <Button
              onClick={() => void handleConnect()}
              disabled={busy || !form.email || !form.token || !form.cif}
              data-testid="smartbill-connect"
            >
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Validare...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 size-3.5" strokeWidth={2} /> Conectează SmartBill
                </>
              )}
            </Button>
            <p className="mt-2 text-[11.5px] leading-[1.5] text-eos-text-muted">
              Tokenul rămâne stocat criptat la noi. Necesită plan SmartBill Platinum sau Gestiune (API
              inclus). Citim doar status e-Factura — nu modificăm date.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}
