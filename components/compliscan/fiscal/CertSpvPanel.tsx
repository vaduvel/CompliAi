"use client"

// F#4 — Certificate SPV manager UI panel (Sprint 1 - 2026-05-11).
// Listă certificate per cabinet cu status + expiry + re-enrollment tracking.

import { useEffect, useState } from "react"
import { AlertCircle, CheckCircle2, Clock, Lock, Loader2, Plus, ShieldAlert, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type Status = "active" | "expiring_soon" | "expiring_critical" | "expired" | "renewed_pending" | "unauthorized" | "unknown"

type CertRecord = {
  id: string
  clientCif: string
  clientName: string
  certSerial: string
  ownerName: string
  ownerEmail?: string
  provider?: string
  validFromISO: string
  validUntilISO: string
  lastSpvEnrollmentISO?: string
  lastSpvVerifiedOk?: boolean
  notes?: string
  status: Status
}

type Snapshot = {
  total: number
  active: number
  expiringSoon: number
  expiringCritical: number
  expired: number
  unauthorized: number
  renewedPending: number
  atRiskRecords: CertRecord[]
}

const STATUS_LABEL: Record<Status, string> = {
  active: "Activ",
  expiring_soon: "Expiră în curând",
  expiring_critical: "Critic (≤7 zile)",
  expired: "EXPIRAT",
  renewed_pending: "Reînnoit (în grace)",
  unauthorized: "Utilizator neautorizat",
  unknown: "Necunoscut",
}

const STATUS_TONE: Record<Status, string> = {
  active: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  expiring_soon: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  expiring_critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  expired: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  renewed_pending: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  unauthorized: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  unknown: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })
}

function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000)
}

export function CertSpvPanel() {
  const [records, setRecords] = useState<CertRecord[]>([])
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    clientCif: "",
    clientName: "",
    certSerial: "",
    ownerName: "",
    ownerEmail: "",
    provider: "",
    validFromISO: "",
    validUntilISO: "",
    notes: "",
  })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/cert-spv", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { snapshot: Snapshot; records: CertRecord[] }
      setSnapshot(data.snapshot)
      setRecords(data.records)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut încărca certificatele.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate() {
    if (!form.clientCif || !form.clientName || !form.certSerial || !form.ownerName || !form.validFromISO || !form.validUntilISO) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/cert-spv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { record?: CertRecord; error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setForm({
        clientCif: "",
        clientName: "",
        certSerial: "",
        ownerName: "",
        ownerEmail: "",
        provider: "",
        validFromISO: "",
        validUntilISO: "",
        notes: "",
      })
      setShowForm(false)
      toast.success("Certificat adăugat în tracker.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare adăugare.")
    } finally {
      setCreating(false)
    }
  }

  async function markReenrolled(id: string) {
    try {
      const res = await fetch("/api/fiscal/cert-spv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, lastSpvEnrollmentISO: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success("Marcat ca reînrolat în SPV.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare update.")
    }
  }

  async function markSpvVerified(id: string, ok: boolean) {
    try {
      const res = await fetch("/api/fiscal/cert-spv", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          lastSpvVerifiedISO: new Date().toISOString(),
          lastSpvVerifiedOk: ok,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success(ok ? "Cert verificat OK în SPV." : "Marcat ca 'Utilizator neautorizat'.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare update.")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/fiscal/cert-spv?id=${encodeURIComponent(id)}`, { method: "DELETE" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success("Certificat șters.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare ștergere.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă certificatele...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      {snapshot && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={snapshot.total} tone="text-eos-text" />
          <Stat label="Active" value={snapshot.active} tone="text-eos-success" />
          <Stat label="Expirând" value={snapshot.expiringCritical + snapshot.expiringSoon} tone="text-eos-warning" />
          <Stat label="Critice" value={snapshot.expired + snapshot.unauthorized} tone="text-eos-error" />
        </div>
      )}

      {/* Pain hook */}
      <section className="rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p className="flex items-start gap-2">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <span>
            <strong>Pain validat pe forumuri:</strong> după reînnoire certificat digital, SPV ANAF returnează
            "Utilizator neautorizat" timp de 10-17 zile. Tracker-ul îți reamintește deadline-urile + flagheaza
            cert-urile care nu mai sunt recunoscute în SPV.
          </span>
        </p>
      </section>

      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Certificate digitale per client ({records.length})
        </span>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} /> Adaugă certificat
        </Button>
      </div>

      {showForm && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <div className="space-y-3 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormInput label="CIF client" placeholder="RO12345678" value={form.clientCif} onChange={(v) => setForm((f) => ({ ...f, clientCif: v }))} />
              <FormInput label="Nume client" placeholder="ABC SRL" value={form.clientName} onChange={(v) => setForm((f) => ({ ...f, clientName: v }))} />
              <FormInput label="Serie certificat" placeholder="ABC123…" value={form.certSerial} onChange={(v) => setForm((f) => ({ ...f, certSerial: v }))} />
              <FormInput label="Nume titular" placeholder="Ion Popescu" value={form.ownerName} onChange={(v) => setForm((f) => ({ ...f, ownerName: v }))} />
              <FormInput label="Email titular" placeholder="ion@example.com" value={form.ownerEmail} onChange={(v) => setForm((f) => ({ ...f, ownerEmail: v }))} />
              <FormInput label="Furnizor (opt)" placeholder="CertSign / DigiSign / TransSped" value={form.provider} onChange={(v) => setForm((f) => ({ ...f, provider: v }))} />
              <FormInput label="Valid de la" type="date" placeholder="" value={form.validFromISO?.slice(0, 10) ?? ""} onChange={(v) => setForm((f) => ({ ...f, validFromISO: v ? `${v}T00:00:00.000Z` : "" }))} />
              <FormInput label="Expiră la" type="date" placeholder="" value={form.validUntilISO?.slice(0, 10) ?? ""} onChange={(v) => setForm((f) => ({ ...f, validUntilISO: v ? `${v}T23:59:59.999Z` : "" }))} />
            </div>
            <FormInput label="Note (opt)" placeholder="ex: cert pentru SPV principal" value={form.notes} onChange={(v) => setForm((f) => ({ ...f, notes: v }))} />
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>Anulează</Button>
              <Button size="sm" disabled={creating || !form.clientCif || !form.clientName || !form.certSerial || !form.ownerName || !form.validFromISO || !form.validUntilISO} onClick={() => void handleCreate()}>
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
                Adaugă
              </Button>
            </div>
          </div>
        </section>
      )}

      {records.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <Lock className="size-5 text-eos-text-tertiary" strokeWidth={1.8} />
          <p className="max-w-md text-[12.5px] text-eos-text-muted">
            Niciun certificat digital în tracker. Adaugă primul certificat pentru a începe monitorizarea expirării
            și a statusului SPV.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map((r) => {
            const days = daysUntil(r.validUntilISO)
            return (
              <article key={r.id} className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
                <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13.5px] font-semibold text-eos-text">{r.clientName}</p>
                      <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${STATUS_TONE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      <span className="font-mono text-[11px] text-eos-text-muted">{r.clientCif}</span>
                    </div>
                    <p className="text-[11.5px] text-eos-text-muted">
                      Titular: <strong>{r.ownerName}</strong>
                      {r.provider && ` · ${r.provider}`}
                      {r.ownerEmail && ` · ${r.ownerEmail}`}
                    </p>
                    <p className="flex items-center gap-1 font-mono text-[10.5px] text-eos-text-tertiary">
                      <Clock className="size-3" strokeWidth={2} />
                      Expiră: {fmtDate(r.validUntilISO)} ({days >= 0 ? `${days} zile rămase` : `expirat acum ${Math.abs(days)} zile`})
                      {r.lastSpvEnrollmentISO && (
                        <span> · Reînrolat: {fmtDate(r.lastSpvEnrollmentISO)}</span>
                      )}
                    </p>
                    {r.notes && <p className="text-[11px] text-eos-text-muted">{r.notes}</p>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => void markReenrolled(r.id)}>
                      Marcat reînrolat
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void markSpvVerified(r.id, true)}>
                      SPV OK
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => void markSpvVerified(r.id, false)}>
                      SPV "neautorizat"
                    </Button>
                    <button
                      onClick={() => void handleDelete(r.id)}
                      aria-label="Șterge"
                      className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-error-soft hover:text-eos-error"
                    >
                      <Trash2 className="size-3.5" strokeWidth={2} />
                    </button>
                  </div>
                </div>
                {r.status === "unauthorized" && (
                  <div className="border-t border-eos-error/30 bg-eos-error-soft px-4 py-2 text-[11.5px] text-eos-error">
                    <p className="flex items-start gap-2">
                      <AlertCircle className="mt-0.5 size-3.5 shrink-0" strokeWidth={2} />
                      <span>
                        <strong>SPV nu recunoaște certificatul.</strong> Verifică în ANAF SPV → Modificare date → Reînnoire certificat.
                        Procesul poate dura 24h-14 zile.
                      </span>
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      <p className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3 text-[11.5px] text-eos-text-muted">
        <strong>Cron zilnic:</strong> trimite reminders email la 30/14/7/3/1/0 zile înainte de expirare (skip weekend/sărbători RO).
        Pentru certificate marcate "neautorizat" — alert imediat în următoarea rulare lucrătoare.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">{label}</p>
      <p className={`mt-0.5 font-display text-[20px] font-semibold ${tone}`}>{value}</p>
    </div>
  )
}

function FormInput({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  label: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  type?: string
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">{label}</span>
      <input
        type={type}
        className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  )
}
