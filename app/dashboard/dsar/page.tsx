"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Shield,
  Trash2,
  User,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { DsarRequest, DsarRequestType, DsarStatus } from "@/lib/server/dsar-store"

// ── Constants ─────────────────────────────────────────────────────────────────

const REQUEST_TYPE_LABELS: Record<DsarRequestType, string> = {
  access: "Acces date (Art. 15)",
  rectification: "Rectificare (Art. 16)",
  erasure: "Ștergere (Art. 17)",
  portability: "Portabilitate (Art. 20)",
  objection: "Opoziție (Art. 21)",
  restriction: "Restricționare (Art. 18)",
}

const STATUS_LABELS: Record<DsarStatus, string> = {
  received: "Primită",
  in_progress: "În lucru",
  awaiting_verification: "Așteptare verificare",
  responded: "Răspuns trimis",
  refused: "Refuzată",
}

const STATUS_BADGE: Record<DsarStatus, "default" | "warning" | "destructive" | "success" | "outline"> = {
  received: "warning",
  in_progress: "default",
  awaiting_verification: "warning",
  responded: "success",
  refused: "destructive",
}

const NEXT_STATUSES: Record<DsarStatus, DsarStatus[]> = {
  received: ["in_progress", "refused"],
  in_progress: ["awaiting_verification", "responded"],
  awaiting_verification: ["in_progress", "responded", "refused"],
  responded: [],
  refused: [],
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function daysLeft(deadlineISO: string): { days: number; label: string; urgent: boolean; expired: boolean } {
  const diff = new Date(deadlineISO).getTime() - Date.now()
  const days = Math.ceil(diff / (24 * 60 * 60 * 1000))
  if (days < 0) return { days, label: `Depășit cu ${Math.abs(days)} zile`, urgent: true, expired: true }
  if (days <= 5) return { days, label: `${days} zile rămase`, urgent: true, expired: false }
  return { days, label: `${days} zile rămase`, urgent: false, expired: false }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function DsarPage() {
  const [requests, setRequests] = useState<DsarRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({
    requesterName: "",
    requesterEmail: "",
    requestType: "access" as DsarRequestType,
    notes: "",
  })

  useEffect(() => {
    fetch("/api/dsar", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setRequests(d.requests ?? []))
      .catch(() => toast.error("Eroare la încărcare DSAR"))
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.requesterName.trim() || !form.requesterEmail.trim()) {
      toast.error("Completează numele și email-ul solicitantului.")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/dsar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Eroare")
      }
      const { request } = await res.json()
      setRequests((prev) => [request, ...prev])
      setForm({ requesterName: "", requesterEmail: "", requestType: "access", notes: "" })
      setShowForm(false)
      toast.success("Cerere DSAR creată", { description: `Deadline: ${new Date(request.deadlineISO).toLocaleDateString("ro-RO")}` })
    } catch (err) {
      toast.error("Eroare la creare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, patch: Record<string, unknown>) {
    try {
      const res = await fetch(`/api/dsar/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error("Update eșuat")
      const { request } = await res.json()
      setRequests((prev) => prev.map((r) => (r.id === id ? request : r)))
      toast.success("Cerere actualizată")
    } catch {
      toast.error("Eroare la actualizare")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/dsar/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Ștergere eșuată")
      setRequests((prev) => prev.filter((r) => r.id !== id))
      toast.success("Cerere ștearsă")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  if (loading) return <LoadingScreen />

  const active = requests.filter((r) => !["responded", "refused"].includes(r.status))
  const urgent = active.filter((r) => daysLeft(r.deadlineISO).urgent)

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageIntro
        title="DSAR — Cereri persoane vizate"
        description="Tracking cereri GDPR Art. 15-22. Deadline legal: 30 zile de la primire."
      />

      {/* Summary badges */}
      {active.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">{active.length} DSAR active</Badge>
          {urgent.length > 0 && (
            <Badge variant="destructive">{urgent.length} expiră în {"<"}5 zile</Badge>
          )}
        </div>
      )}

      {/* Create button */}
      <div className="flex justify-end">
        <Button size="sm" className="gap-2" onClick={() => setShowForm(!showForm)}>
          <Plus className="size-3.5" />
          Cerere nouă
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <Card className="border-eos-primary/30 bg-eos-primary/5">
          <CardHeader>
            <CardTitle className="text-sm">Cerere nouă DSAR</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Nume solicitant</label>
                <input
                  className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  placeholder="Ion Popescu"
                  value={form.requesterName}
                  onChange={(e) => setForm((p) => ({ ...p, requesterName: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Email solicitant</label>
                <input
                  type="email"
                  className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  placeholder="ion@exemplu.ro"
                  value={form.requesterEmail}
                  onChange={(e) => setForm((p) => ({ ...p, requesterEmail: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Tip cerere</label>
              <select
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                value={form.requestType}
                onChange={(e) => setForm((p) => ({ ...p, requestType: e.target.value as DsarRequestType }))}
              >
                {Object.entries(REQUEST_TYPE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Note (opțional)</label>
              <textarea
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                rows={2}
                placeholder="Context, detalii suplimentare..."
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowForm(false)}>Anulează</Button>
              <Button size="sm" className="gap-2" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                Înregistrează cererea
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {requests.length === 0 && !showForm && (
        <EmptyState
          icon={User}
          title="Nicio cerere DSAR"
          label="Când o persoană vizată solicită acces, rectificare sau ștergerea datelor, înregistrează cererea aici."
        />
      )}

      {/* Requests list */}
      {requests.map((req) => (
        <DsarRow key={req.id} request={req} onUpdate={handleUpdate} onDelete={handleDelete} />
      ))}
    </div>
  )
}

// ── DSAR Row ──────────────────────────────────────────────────────────────────

function DsarRow({
  request: req,
  onUpdate,
  onDelete,
}: {
  request: DsarRequest
  onUpdate: (id: string, patch: Record<string, unknown>) => void
  onDelete: (id: string) => void
}) {
  const dl = daysLeft(req.extendedDeadlineISO ?? req.deadlineISO)
  const isClosed = req.status === "responded" || req.status === "refused"
  const nextStatuses = NEXT_STATUSES[req.status]

  return (
    <Card className={`border-eos-border ${dl.expired && !isClosed ? "border-red-300 bg-red-50/30" : ""}`}>
      <CardContent className="px-5 py-4 space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-eos-text">{req.requesterName}</p>
              <Badge variant={STATUS_BADGE[req.status]} className="text-[10px] normal-case tracking-normal">
                {STATUS_LABELS[req.status]}
              </Badge>
              <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                {REQUEST_TYPE_LABELS[req.requestType]}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-eos-text-muted">{req.requesterEmail}</p>
            <div className="mt-1 flex flex-wrap gap-3 text-xs text-eos-text-tertiary">
              <span>Primită: {new Date(req.receivedAtISO).toLocaleDateString("ro-RO")}</span>
              {!isClosed && (
                <span className={dl.urgent ? "font-medium text-red-600" : ""}>
                  <Clock className="mr-0.5 inline size-3" />
                  {dl.label}
                </span>
              )}
              {req.responseSentAtISO && (
                <span className="text-green-600">
                  <CheckCircle2 className="mr-0.5 inline size-3" />
                  Răspuns: {new Date(req.responseSentAtISO).toLocaleDateString("ro-RO")}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => onDelete(req.id)}
              className="rounded-eos-md p-1.5 text-eos-text-muted hover:bg-red-50 hover:text-red-600"
              title="Șterge"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Checklist flags */}
        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 text-xs text-eos-text">
            <input
              type="checkbox"
              checked={req.identityVerified}
              onChange={(e) => onUpdate(req.id, { identityVerified: e.target.checked })}
              className="rounded"
            />
            Identitate verificată
          </label>
          <label className="flex items-center gap-1.5 text-xs text-eos-text">
            <input
              type="checkbox"
              checked={req.draftResponseGenerated}
              onChange={(e) => onUpdate(req.id, { draftResponseGenerated: e.target.checked })}
              className="rounded"
            />
            Draft răspuns generat
          </label>
          <label className="flex items-center gap-1.5 text-xs text-eos-text">
            <input
              type="checkbox"
              checked={req.responseReviewedByHuman}
              onChange={(e) => onUpdate(req.id, { responseReviewedByHuman: e.target.checked })}
              className="rounded"
            />
            Revizuit de om
          </label>
        </div>

        {/* Status transition buttons */}
        {nextStatuses.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nextStatuses.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={s === "responded" ? "default" : "outline"}
                className="text-xs"
                onClick={() => {
                  const patch: Record<string, unknown> = { status: s }
                  if (s === "responded") patch.responseSentAtISO = new Date().toISOString()
                  onUpdate(req.id, patch)
                }}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
          </div>
        )}

        {req.notes && (
          <p className="text-xs text-eos-text-muted italic">{req.notes}</p>
        )}
      </CardContent>
    </Card>
  )
}
