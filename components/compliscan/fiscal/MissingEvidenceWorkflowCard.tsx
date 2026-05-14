"use client"

// FC-9 (2026-05-14) — Missing Evidence Workflow card.
//
// Cabinet poate cere documente lipsă de la clienți, cu tracking complet:
// status, deadline, email template, timeline. Per cerere arată:
//   - tip document + titlu + reasonDetail
//   - status badge + urgency
//   - deadline countdown
//   - butoane: Trimite email / Marchează primit / Verifică / Anulează
//   - email template preview

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileQuestion,
  Mail,
  Plus,
  Send,
  X,
} from "lucide-react"

type EvidenceStatus =
  | "requested"
  | "sent"
  | "client-acknowledged"
  | "received"
  | "verified"
  | "overdue"
  | "rejected"
  | "cancelled"

type EvidenceUrgency = "low" | "normal" | "high" | "critical"

type EvidenceType =
  | "contract-servicii"
  | "aga-dividende"
  | "decizie-cae"
  | "balanta-cont"
  | "factura-conexa"
  | "extras-cont-bancar"
  | "registru-acte-constitutive"
  | "imputernicire-spv"
  | "raport-z-casa-marcat"
  | "saft-export"
  | "alt-document"

type TimelineEntry = {
  atISO: string
  fromStatus: EvidenceStatus | null
  toStatus: EvidenceStatus
  actor: "cabinet" | "client" | "system"
  note?: string
}

type EvidenceRequest = {
  id: string
  clientOrgId: string
  clientOrgName: string
  clientEmail: string
  type: EvidenceType
  title: string
  reasonDetail: string
  period: string | null
  status: EvidenceStatus
  urgency: EvidenceUrgency
  dueISO: string
  createdAtISO: string
  updatedAtISO: string
  linkedFindingId?: string
  linkedExceptionId?: string
  timeline: TimelineEntry[]
  createdByEmail: string
}

type Summary = {
  total: number
  byStatus: Record<EvidenceStatus, number>
  byClient: Record<string, number>
  overdueCount: number
  dueIn3DaysCount: number
  verifiedThisMonth: number
  pendingClientResponse: number
}

type Template = {
  subject: string
  body: string
  reminderDaysBefore: number
}

const TYPE_LABELS: Record<EvidenceType, string> = {
  "contract-servicii": "Contract servicii",
  "aga-dividende": "Hotărâre AGA dividende",
  "decizie-cae": "Decizie cesionare CAE",
  "balanta-cont": "Balanță contabilă",
  "factura-conexa": "Factură conexă",
  "extras-cont-bancar": "Extras de cont",
  "registru-acte-constitutive": "Acte constitutive",
  "imputernicire-spv": "Împuternicire SPV",
  "raport-z-casa-marcat": "Raport Z casă marcat",
  "saft-export": "Export SAF-T (D406)",
  "alt-document": "Alt document",
}

const STATUS_LABELS: Record<EvidenceStatus, string> = {
  requested: "Solicitat",
  sent: "Email trimis",
  "client-acknowledged": "Client confirmat",
  received: "Document primit",
  verified: "Verificat OK",
  overdue: "Întârziat",
  rejected: "Respins",
  cancelled: "Anulat",
}

const STATUS_CLS: Record<EvidenceStatus, string> = {
  requested: "bg-eos-surface-elevated text-eos-text-muted border-eos-border",
  sent: "bg-blue-500/15 text-blue-300 border-blue-500/30",
  "client-acknowledged": "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  received: "bg-violet-500/15 text-violet-300 border-violet-500/30",
  verified: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  overdue: "bg-red-500/15 text-red-300 border-red-500/30",
  rejected: "bg-orange-500/15 text-orange-300 border-orange-500/30",
  cancelled: "bg-eos-surface-elevated text-eos-text-muted border-eos-border-subtle",
}

export function MissingEvidenceWorkflowCard() {
  const [requests, setRequests] = useState<EvidenceRequest[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [previewReq, setPreviewReq] = useState<EvidenceRequest | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/evidence-requests")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare la încărcare.")
      }
      const data = await res.json()
      setRequests(data.requests ?? [])
      setSummary(data.summary ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handlePatch = async (id: string, status: EvidenceStatus, note?: string) => {
    const res = await fetch(`/api/fiscal/evidence-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, note }),
    })
    if (res.ok) await fetchAll()
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Anulezi această cerere?")) return
    const res = await fetch(`/api/fiscal/evidence-requests/${id}`, { method: "DELETE" })
    if (res.ok) await fetchAll()
  }

  const handlePreview = async (req: EvidenceRequest) => {
    // Re-fetch creating template via API isn't strictly needed — derivăm local din req
    // dar pentru consistență cerem un template (l-am putea cache la create)
    // Aici facem fetch fictiv: serverul re-generează la POST. Pentru preview, derive local.
    setPreviewReq(req)
    // Local fallback inline
    setPreviewTemplate({
      subject: `[CompliAI] Solicitare ${TYPE_LABELS[req.type]}${req.period ? ` — ${req.period}` : ""}`,
      body: `Bună ziua,\n\nAvem nevoie de: ${req.title}.\n\nContext: ${req.reasonDetail}\n\nTermen: ${new Date(req.dueISO).toLocaleDateString("ro-RO")}.\n\nCu stimă,\nCabinet`,
      reminderDaysBefore: 3,
    })
  }

  return (
    <section className="space-y-4 rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Cereri documente lipsă
          </p>
          <h3
            data-display-text="true"
            className="mt-1 font-display text-[20px] font-semibold tracking-[-0.025em] text-eos-text"
          >
            Cereri de documente lipsă
          </h3>
          <p className="mt-1 max-w-3xl text-[12.5px] leading-[1.5] text-eos-text-muted">
            Cere documente de la clienți (contract, AGA, balanță, extras) cu tracking status, deadline și email template generat automat.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-md border border-eos-primary bg-eos-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-eos-primary/90"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Cerere nouă
        </button>
      </header>

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12.5px] text-red-200">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
          <Tile icon={<FileQuestion className="size-3.5" strokeWidth={2} />} label="Total cereri" value={String(summary.total)} />
          <Tile icon={<AlertTriangle className="size-3.5" strokeWidth={2} />} label="Întârziate" value={String(summary.overdueCount)} tone={summary.overdueCount > 0 ? "danger" : "ok"} />
          <Tile icon={<Clock className="size-3.5" strokeWidth={2} />} label="Due în 3 zile" value={String(summary.dueIn3DaysCount)} tone={summary.dueIn3DaysCount > 0 ? "warning" : "neutral"} />
          <Tile icon={<Send className="size-3.5" strokeWidth={2} />} label="Așteaptă client" value={String(summary.pendingClientResponse)} />
          <Tile icon={<CheckCircle2 className="size-3.5" strokeWidth={2} />} label="Verificate luna aceasta" value={String(summary.verifiedThisMonth)} tone="ok" />
        </div>
      )}

      <ul className="space-y-2">
        {requests.length === 0 ? (
          <li className="rounded-lg border border-eos-border bg-eos-surface-subtle px-3 py-4 text-center text-[12.5px] text-eos-text-muted">
            Nicio cerere creată. Apasă „Cerere nouă" pentru a începe.
          </li>
        ) : (
          requests.map((r) => (
            <EvidenceRow
              key={r.id}
              req={r}
              onPatch={handlePatch}
              onCancel={handleCancel}
              onPreview={handlePreview}
            />
          ))
        )}
      </ul>

      {createOpen && (
        <CreateRequestModal
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false)
            await fetchAll()
          }}
        />
      )}

      {previewTemplate && previewReq && (
        <TemplatePreviewModal
          template={previewTemplate}
          req={previewReq}
          onClose={() => {
            setPreviewTemplate(null)
            setPreviewReq(null)
          }}
        />
      )}
    </section>
  )
}

function Tile({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "ok" | "warning" | "danger" | "neutral"
}) {
  const toneCls =
    tone === "danger"
      ? "border-red-500/30 bg-red-500/10"
      : tone === "warning"
        ? "border-amber-500/30 bg-amber-500/10"
        : tone === "ok"
          ? "border-emerald-500/30 bg-emerald-500/10"
          : "border-eos-border bg-eos-surface-subtle"
  return (
    <div className={`rounded-lg border ${toneCls} p-2`}>
      <div className="flex items-center gap-1.5 text-eos-text-muted">
        {icon}
        <p className="text-[10.5px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 font-display text-[16px] font-semibold tracking-[-0.02em] text-eos-text">
        {value}
      </p>
    </div>
  )
}

function EvidenceRow({
  req,
  onPatch,
  onCancel,
  onPreview,
}: {
  req: EvidenceRequest
  onPatch: (id: string, status: EvidenceStatus, note?: string) => Promise<void>
  onCancel: (id: string) => Promise<void>
  onPreview: (req: EvidenceRequest) => void
}) {
  const due = new Date(req.dueISO)
  const now = new Date()
  const daysDiff = Math.round((due.getTime() - now.getTime()) / 86400000)
  const dueText =
    daysDiff < 0
      ? `${Math.abs(daysDiff)} zile depășite`
      : daysDiff === 0
        ? "Astăzi"
        : `Mai sunt ${daysDiff} zile`

  const dueCls =
    daysDiff < 0
      ? "text-red-300"
      : daysDiff <= 3
        ? "text-amber-300"
        : "text-eos-text-muted"

  return (
    <li className="rounded-lg border border-eos-border bg-eos-surface-subtle p-3">
      <div className="flex items-start gap-2.5">
        <FileQuestion className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-mono text-[13px] font-semibold text-eos-text">{req.title}</h4>
            <span className={`inline-flex shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase ${STATUS_CLS[req.status]}`}>
              {STATUS_LABELS[req.status]}
            </span>
            {req.urgency === "critical" && (
              <span className="inline-flex shrink-0 rounded border border-red-500/40 bg-red-500/15 px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase text-red-200">
                URGENT
              </span>
            )}
          </div>
          <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">
            <span className="font-medium text-eos-text">{TYPE_LABELS[req.type]}</span> · {req.clientOrgName} · {req.clientEmail}
            {req.period ? ` · perioada ${req.period}` : ""}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
            <span className="font-medium">Context:</span> {req.reasonDetail}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
            <span className={`inline-flex items-center gap-1 font-medium ${dueCls}`}>
              <Clock className="size-3" strokeWidth={2} /> {dueText}
            </span>
            <span className="text-eos-text-tertiary">·</span>
            <span className="text-eos-text-muted">
              Creat {new Date(req.createdAtISO).toLocaleDateString("ro-RO")}
            </span>
            <span className="text-eos-text-tertiary">·</span>
            <span className="text-eos-text-muted">{req.timeline.length} tranziții</span>
          </div>

          {/* Actions */}
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => onPreview(req)}
              className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2 py-1 text-[10.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
            >
              <Mail className="size-3" strokeWidth={2} /> Email template
            </button>
            {(req.status === "requested" || req.status === "overdue") && (
              <button
                type="button"
                onClick={() => onPatch(req.id, "sent", "Email trimis")}
                className="inline-flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-500/15 px-2 py-1 text-[10.5px] font-medium text-blue-200 hover:bg-blue-500/25"
              >
                <Send className="size-3" strokeWidth={2} /> Marchează trimis
              </button>
            )}
            {(req.status === "sent" || req.status === "client-acknowledged" || req.status === "overdue") && (
              <button
                type="button"
                onClick={() => onPatch(req.id, "received", "Document primit")}
                className="inline-flex items-center gap-1 rounded-md border border-violet-500/40 bg-violet-500/15 px-2 py-1 text-[10.5px] font-medium text-violet-200 hover:bg-violet-500/25"
              >
                Primit
              </button>
            )}
            {req.status === "received" && (
              <button
                type="button"
                onClick={() => onPatch(req.id, "verified", "Verificat și aprobat")}
                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-1 text-[10.5px] font-medium text-emerald-200 hover:bg-emerald-500/25"
              >
                <CheckCircle2 className="size-3" strokeWidth={2} /> Verifică
              </button>
            )}
            {req.status !== "cancelled" && req.status !== "verified" && (
              <button
                type="button"
                onClick={() => onCancel(req.id)}
                className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2 py-1 text-[10.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
              >
                <X className="size-3" strokeWidth={2} /> Anulează
              </button>
            )}
          </div>

          {/* Timeline */}
          {req.timeline.length > 1 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-[10.5px] font-medium text-eos-text-muted hover:text-eos-text">
                Timeline ({req.timeline.length} tranziții)
              </summary>
              <ol className="mt-2 space-y-1 border-l-2 border-eos-border pl-3">
                {req.timeline.map((t, i) => (
                  <li key={i} className="text-[10.5px] text-eos-text-muted">
                    <span className="font-mono">{new Date(t.atISO).toLocaleString("ro-RO")}</span>
                    {" · "}
                    <span className="font-medium text-eos-text">{STATUS_LABELS[t.toStatus]}</span>
                    {" · "}
                    <span className="italic">{t.actor}</span>
                    {t.note ? ` — ${t.note}` : ""}
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
      </div>
    </li>
  )
}

function CreateRequestModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: () => Promise<void>
}) {
  const [type, setType] = useState<EvidenceType>("contract-servicii")
  const [clientOrgId, setClientOrgId] = useState("")
  const [clientOrgName, setClientOrgName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [title, setTitle] = useState("")
  const [reasonDetail, setReasonDetail] = useState("")
  const [period, setPeriod] = useState("")
  const [dueDays, setDueDays] = useState(7)
  const [urgency, setUrgency] = useState<EvidenceUrgency>("normal")
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    try {
      const res = await fetch("/api/fiscal/evidence-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          clientOrgId: clientOrgId || "self",
          clientOrgName: clientOrgName || "Firma curentă",
          clientEmail,
          title: title || TYPE_LABELS[type],
          reasonDetail,
          period: period || undefined,
          dueDaysFromNow: dueDays,
          urgency,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare creare.")
      }
      await onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Eroare necunoscută")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-[18px] font-semibold tracking-tight text-eos-text">
            Cerere nouă document
          </h4>
          <button onClick={onClose} className="text-eos-text-muted hover:text-eos-text">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Tip document">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as EvidenceType)}
              className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
            >
              {(Object.keys(TYPE_LABELS) as EvidenceType[]).map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Titlu cerere">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={TYPE_LABELS[type]}
              className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Firma client (nume)">
              <input
                type="text"
                value={clientOrgName}
                onChange={(e) => setClientOrgName(e.target.value)}
                placeholder="Firma X SRL"
                className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
              />
            </Field>
            <Field label="Org ID">
              <input
                type="text"
                value={clientOrgId}
                onChange={(e) => setClientOrgId(e.target.value)}
                placeholder="org-xyz"
                className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
              />
            </Field>
          </div>
          <Field label="Email destinatar">
            <input
              type="email"
              required
              value={clientEmail}
              onChange={(e) => setClientEmail(e.target.value)}
              placeholder="contabil@firma.ro"
              className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
            />
          </Field>
          <Field label="Context / motiv">
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              rows={2}
              placeholder="Cross-correlation R1 cere contractul aprilie 2026..."
              className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
            />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Perioada">
              <input
                type="text"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                placeholder="2026-04"
                className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
              />
            </Field>
            <Field label="Deadline (zile)">
              <input
                type="number"
                min="1"
                max="60"
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
              />
            </Field>
            <Field label="Urgență">
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value as EvidenceUrgency)}
                className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
              >
                <option value="low">Joasă</option>
                <option value="normal">Normală</option>
                <option value="high">Mare</option>
                <option value="critical">Critică</option>
              </select>
            </Field>
          </div>

          {err && <p className="text-[11.5px] text-red-300">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md border border-eos-primary bg-eos-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-eos-primary/90 disabled:opacity-50"
            >
              {submitting ? "..." : "Crează cerere"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-medium uppercase tracking-wide text-eos-text-muted">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}

function TemplatePreviewModal({
  template,
  req,
  onClose,
}: {
  template: Template
  req: EvidenceRequest
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-xl rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-eos-text-muted">
              Email template — către {req.clientEmail}
            </p>
            <h4 className="mt-1 font-display text-[16px] font-semibold tracking-tight text-eos-text">
              {template.subject}
            </h4>
          </div>
          <button onClick={onClose} className="text-eos-text-muted hover:text-eos-text">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>
        <pre className="whitespace-pre-wrap rounded-md border border-eos-border bg-eos-surface-subtle p-3 font-mono text-[11.5px] leading-[1.5] text-eos-text">
{template.body}
        </pre>
        <p className="mt-3 text-[10.5px] text-eos-text-muted">
          Reminder programat cu {template.reminderDaysBefore} zile înainte de deadline.
        </p>
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(`${template.subject}\n\n${template.body}`)
            }}
            className="rounded-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
          >
            Copiază în clipboard
          </button>
        </div>
      </div>
    </div>
  )
}
