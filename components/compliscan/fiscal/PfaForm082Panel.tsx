"use client"

// PFA / CNP Form 082 tracker panel.
// Listă clienți PFA + status registrare + deadline 26 mai 2026 + countdown.

import { useEffect, useState } from "react"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type Status = "not_registered" | "form_submitted" | "registered" | "exempt" | "unknown"

type Client = {
  id: string
  taxId: string
  name: string
  status: Status
  form082SubmittedAtISO?: string
  confirmationAtISO?: string
  notes?: string
  createdAtISO: string
  updatedAtISO: string
}

type Snapshot = {
  totalClients: number
  registered: number
  formSubmitted: number
  notRegistered: number
  exempt: number
  unknown: number
  daysUntilDeadline: number
  urgency: "critical" | "high" | "medium" | "low" | "passed"
  atRiskClients: Client[]
}

const STATUS_LABEL: Record<Status, string> = {
  not_registered: "Neînregistrat",
  form_submitted: "Form depus",
  registered: "Înregistrat ✓",
  exempt: "Exempt",
  unknown: "Necunoscut",
}

const STATUS_TONE: Record<Status, string> = {
  not_registered: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  form_submitted: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  registered: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  exempt: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
  unknown: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

const URGENCY_TONE: Record<Snapshot["urgency"], string> = {
  critical: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  high: "border-eos-error/30 bg-eos-error-soft text-eos-error",
  medium: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
  low: "border-eos-success/30 bg-eos-success-soft text-eos-success",
  passed: "border-eos-border bg-eos-surface-elevated text-eos-text-muted",
}

export function PfaForm082Panel() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ taxId: "", name: "", notes: "" })

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/fiscal/pfa-form082", { cache: "no-store" })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { snapshot: Snapshot; clients: Client[] }
      setSnapshot(data.snapshot)
      setClients(data.clients)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Nu am putut încărca lista PFA.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  async function handleCreate() {
    if (!form.taxId.trim() || !form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/fiscal/pfa-form082", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await res.json()) as { client?: Client; error?: string }
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      setForm({ taxId: "", name: "", notes: "" })
      setShowForm(false)
      toast.success("Client adăugat.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare adăugare.")
    } finally {
      setCreating(false)
    }
  }

  async function handleStatusChange(id: string, status: Status) {
    try {
      const res = await fetch("/api/fiscal/pfa-form082", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        throw new Error(data.error ?? `HTTP ${res.status}`)
      }
      toast.success("Status actualizat.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare actualizare.")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/fiscal/pfa-form082?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      toast.success("Client șters.")
      void load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare ștergere.")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 text-[12.5px] text-eos-text-muted">
        <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Se încarcă lista PFA / Form 082...
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Deadline banner */}
      {snapshot && (
        <section
          className={`overflow-hidden rounded-eos-lg border ${URGENCY_TONE[snapshot.urgency]} p-4`}
        >
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
            <div className="space-y-1">
              <p className="font-display text-[14px] font-semibold">
                PFA / CNP — Formular 082 obligatoriu
              </p>
              <p className="text-[12.5px] leading-[1.5]">
                <strong>Deadline registrare: 26 mai 2026.</strong>{" "}
                {snapshot.daysUntilDeadline >= 0
                  ? `Mai sunt ${snapshot.daysUntilDeadline} ${snapshot.daysUntilDeadline === 1 ? "zi" : "zile"}.`
                  : `EXPIRAT cu ${Math.abs(snapshot.daysUntilDeadline)} zile.`}{" "}
                Bază legală: OG 6/2026 + Ordin ANAF 378/2026. Obligația e-Factura pentru PFA / CNP
                începe 1 iunie 2026.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Stats */}
      {snapshot && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat label="Total" value={snapshot.totalClients} tone="text-eos-text" />
          <Stat label="Înregistrați" value={snapshot.registered} tone="text-eos-success" />
          <Stat label="Form depus" value={snapshot.formSubmitted} tone="text-eos-warning" />
          <Stat
            label="Neînregistrați"
            value={snapshot.notRegistered + snapshot.unknown}
            tone={
              snapshot.notRegistered + snapshot.unknown > 0
                ? "text-eos-error"
                : "text-eos-text-muted"
            }
          />
        </div>
      )}

      {/* Add form */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Clienți PFA / CNP tracked
        </span>
        <Button size="sm" className="gap-1.5" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} /> Adaugă client PFA
        </Button>
      </div>

      {showForm && (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <div className="space-y-3 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  CNP / CIF
                </span>
                <input
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
                  placeholder="1980101080011 (CNP) sau RO12345678 (CIF PFA)"
                  value={form.taxId}
                  onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                />
              </label>
              <label className="block">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Nume client
                </span>
                <input
                  className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </label>
            </div>
            <label className="block">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Note (opțional)
              </span>
              <input
                className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </label>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.taxId.trim() || !form.name.trim()}
                onClick={() => void handleCreate()}
              >
                {creating && <Loader2 className="mr-1.5 size-3.5 animate-spin" strokeWidth={2} />}
                Adaugă
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* List */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-dashed border-eos-border bg-eos-surface/40 px-6 py-12 text-center">
          <div className="flex size-10 items-center justify-center rounded-full border border-eos-border bg-eos-surface">
            <CheckCircle2 className="size-4 text-eos-text-tertiary" strokeWidth={1.8} />
          </div>
          <p className="text-[13px] text-eos-text-muted">
            Niciun client PFA / CNP în tracking. Adaugă primul client pentru a începe monitorizarea
            Form 082.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <article
              key={c.id}
              className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13.5px] font-semibold text-eos-text">{c.name}</p>
                    <span
                      className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-medium ${STATUS_TONE[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                    <span className="font-mono text-[11px] text-eos-text-muted">
                      {c.taxId}
                    </span>
                  </div>
                  {c.notes && (
                    <p className="text-[11.5px] text-eos-text-muted">{c.notes}</p>
                  )}
                  {(c.form082SubmittedAtISO || c.confirmationAtISO) && (
                    <p className="flex items-center gap-1 font-mono text-[10.5px] text-eos-text-tertiary">
                      <Clock className="size-3" strokeWidth={2} />
                      {c.form082SubmittedAtISO &&
                        `Form depus: ${new Date(c.form082SubmittedAtISO).toLocaleDateString("ro-RO")}`}
                      {c.confirmationAtISO &&
                        ` · Confirmat: ${new Date(c.confirmationAtISO).toLocaleDateString("ro-RO")}`}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="h-8 rounded-eos-sm border border-eos-border bg-eos-surface px-2 text-[11.5px] text-eos-text outline-none focus:border-eos-border-strong"
                    value={c.status}
                    onChange={(e) => void handleStatusChange(c.id, e.target.value as Status)}
                  >
                    {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => void handleDelete(c.id)}
                    aria-label="Șterge"
                    className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-error-soft hover:text-eos-error"
                  >
                    <Trash2 className="size-3.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3 text-[11.5px] text-eos-text-muted">
        <strong>Cum depui Form 082:</strong> SPV ANAF → Formulare → cerere registrare RO e-Factura
        → Form 082 (semnat cu certificat digital). Confirmarea vine în câteva zile lucrătoare prin
        SPV.
      </p>
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
        {label}
      </p>
      <p className={`mt-0.5 font-display text-[20px] font-semibold ${tone}`}>{value}</p>
    </div>
  )
}
