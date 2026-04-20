"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Bell, CheckCircle2, ChevronDown, FileText, Loader2, Shield, XCircle } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type {
  AnspdcpBreachNotification,
  Nis2Incident,
  Nis2AttackType,
} from "@/lib/server/nis2-store"
import { ATTACK_TYPE_LABELS } from "@/lib/compliance/dnsc-report"
import { slaLabel } from "./nis2-shared"

// ── Post-Incident Tracking (S2.4) ──────────────────────────────────────────

export function PostIncidentPanel({
  incident,
  onUpdate,
}: {
  incident: Nis2Incident
  onUpdate: (patch: Record<string, unknown>) => void
}) {
  const tracking = incident.postIncidentTracking
  const [notes, setNotes] = useState(tracking?.notes ?? "")
  const [dnscRef, setDnscRef] = useState(tracking?.dnscReference ?? "")
  const [newCorr, setNewCorr] = useState({ direction: "received" as "sent" | "received", summary: "" })

  if (incident.status !== "closed") return null

  function saveDnscRef() {
    onUpdate({
      postIncidentTracking: {
        ...tracking,
        isRemediated: tracking?.isRemediated ?? false,
        dnscReference: dnscRef,
      },
    })
  }

  function addCorrespondence() {
    if (!newCorr.summary.trim()) return
    const entry = {
      id: `corr-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      direction: newCorr.direction,
      summary: newCorr.summary.trim(),
      createdAtISO: new Date().toISOString(),
    }
    onUpdate({
      postIncidentTracking: {
        ...tracking,
        isRemediated: tracking?.isRemediated ?? false,
        dnscCorrespondence: [...(tracking?.dnscCorrespondence ?? []), entry],
      },
    })
    setNewCorr({ direction: "received", summary: "" })
  }

  return (
    <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/5 px-3 py-3 space-y-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-primary">
        Post-incident tracking
      </p>
      {/* DNSC Reference */}
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Nr. înregistrare DNSC</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="DNSC-2026-..."
            value={dnscRef}
            onChange={(e) => setDnscRef(e.target.value)}
          />
          <Button size="sm" variant="outline" onClick={saveDnscRef} disabled={dnscRef === (tracking?.dnscReference ?? "")}>
            Salvează
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { key: "remediationStartedAtISO", label: "Remediere începută" },
          { key: "remediationCompletedAtISO", label: "Remediere finalizată" },
          { key: "followUpValidationAtISO", label: "Validare follow-up" },
        ].map(({ key, label }) => {
          const value = tracking?.[key as keyof typeof tracking] as string | undefined
          return (
            <div key={key}>
              <label className="text-[10px] font-medium text-eos-primary">{label}</label>
              {value ? (
                <p className="mt-0.5 text-xs text-eos-text">{new Date(value).toLocaleDateString("ro-RO")}</p>
              ) : (
                <button
                  type="button"
                  className="mt-0.5 text-[10px] font-medium text-eos-primary hover:underline"
                  onClick={() =>
                    onUpdate({
                      postIncidentTracking: {
                        ...tracking,
                        isRemediated: key === "remediationCompletedAtISO" ? true : tracking?.isRemediated ?? false,
                        [key]: new Date().toISOString(),
                      },
                    })
                  }
                >
                  Marchează acum
                </button>
              )}
            </div>
          )
        })}
      </div>
      {/* DNSC Correspondence */}
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Corespondență DNSC</label>
        {(tracking?.dnscCorrespondence ?? []).length > 0 && (
          <div className="mt-1 space-y-1">
            {(tracking?.dnscCorrespondence ?? []).map((c) => (
              <div key={c.id} className="flex items-start gap-2 text-xs text-eos-text">
                <span className={`shrink-0 text-[10px] font-medium ${c.direction === "sent" ? "text-eos-primary" : "text-eos-warning"}`}>
                  {c.direction === "sent" ? "Trimis" : "Primit"}
                </span>
                <span className="text-eos-text-muted">{new Date(c.date).toLocaleDateString("ro-RO")}</span>
                <span className="flex-1">{c.summary}</span>
              </div>
            ))}
          </div>
        )}
        <div className="mt-1.5 flex gap-2">
          <select
            className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
            value={newCorr.direction}
            onChange={(e) => setNewCorr((p) => ({ ...p, direction: e.target.value as "sent" | "received" }))}
          >
            <option value="received">Primit de la DNSC</option>
            <option value="sent">Trimis către DNSC</option>
          </select>
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="Rezumat corespondență..."
            value={newCorr.summary}
            onChange={(e) => setNewCorr((p) => ({ ...p, summary: e.target.value }))}
          />
          <Button size="sm" variant="outline" onClick={addCorrespondence} disabled={!newCorr.summary.trim()}>
            Adaugă
          </Button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-medium text-eos-primary">Note post-incident</label>
        <div className="mt-1 flex gap-2">
          <input
            className="flex-1 rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="Observații, acțiuni rămase..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              onUpdate({
                postIncidentTracking: {
                  ...tracking,
                  isRemediated: tracking?.isRemediated ?? false,
                  notes,
                },
              })
            }
          >
            Salvează
          </Button>
        </div>
      </div>
      {tracking?.isRemediated && (
        <Badge variant="success" className="text-[10px] normal-case tracking-normal">Remediat complet</Badge>
      )}
    </div>
  )
}

// ── ANSPDCP Breach Notification Panel (GOLD 6) ─────────────────────────────

export function AnspdcpNotificationPanel({
  incident,
  onUpdate,
  emphasized = false,
  sourceFindingId,
  returnTo,
}: {
  incident: Nis2Incident
  onUpdate: (patch: Record<string, unknown>) => void | Promise<void>
  emphasized?: boolean
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const notif = incident.anspdcpNotification
  const [form, setForm] = useState({
    dataCategories: notif?.dataCategories.join(", ") ?? "",
    estimatedDataSubjects: notif?.estimatedDataSubjects?.toString() ?? "",
    dpoContact: notif?.dpoContact ?? "",
    consequencesDescription: notif?.consequencesDescription ?? "",
    measuresTaken: notif?.measuresTaken ?? "",
    anspdcpReference: notif?.anspdcpReference ?? "",
    notifyDataSubjects: notif?.notifyDataSubjects ?? false,
  })
  const [saving, setSaving] = useState(false)

  if (!incident.involvesPersonalData) return null

  const buildAnspdcpEvidenceNote = (notification: AnspdcpBreachNotification) => {
    const evidenceParts = [
      `Flow ANSPDCP completat pentru incidentul "${incident.title}".`,
      notification.status === "acknowledged"
        ? "Notificarea este confirmată de ANSPDCP."
        : notification.status === "submitted"
          ? "Notificarea a fost trimisă către ANSPDCP."
          : "Notificarea a fost pregătită în flow-ul dedicat.",
      notification.anspdcpReference ? `Referință: ${notification.anspdcpReference}.` : null,
      notification.dataCategories.length > 0
        ? `Categorii afectate: ${notification.dataCategories.join(", ")}.`
        : null,
      notification.estimatedDataSubjects != null
        ? `Persoane estimate: ${notification.estimatedDataSubjects}.`
        : null,
      notification.notifyDataSubjects ? "Este necesară și notificarea persoanelor vizate." : null,
    ]

    return evidenceParts.filter(Boolean).join(" ")
  }

  const deadline72h = notif?.deadlineISO
    ? slaLabel(notif.deadlineISO, 72 * 3_600_000)
    : null
  const backToCockpitHref =
    !returnTo && sourceFindingId && notif && (notif.status === "submitted" || notif.status === "acknowledged")
      ? `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}?${new URLSearchParams({
          anspdcp: "done",
          evidenceNote: buildAnspdcpEvidenceNote(notif),
        }).toString()}`
      : null

  async function handleSubmit(submitted: boolean) {
    setSaving(true)
    const updated: AnspdcpBreachNotification = {
      required: true,
      deadlineISO: notif?.deadlineISO ?? new Date(new Date(incident.detectedAtISO).getTime() + 72 * 3_600_000).toISOString(),
      status: submitted ? "submitted" : (notif?.status ?? "pending"),
      dataCategories: form.dataCategories.split(",").map((s) => s.trim()).filter(Boolean),
      estimatedDataSubjects: form.estimatedDataSubjects ? parseInt(form.estimatedDataSubjects, 10) : null,
      dpoContact: form.dpoContact.trim() || undefined,
      consequencesDescription: form.consequencesDescription.trim() || undefined,
      measuresTaken: form.measuresTaken.trim() || undefined,
      submittedAtISO: submitted ? new Date().toISOString() : notif?.submittedAtISO,
      anspdcpReference: form.anspdcpReference.trim() || undefined,
      notifyDataSubjects: form.notifyDataSubjects,
      dataSubjectsNotifiedAtISO: notif?.dataSubjectsNotifiedAtISO,
    }
    await Promise.resolve(onUpdate({ anspdcpNotification: updated }))
    setSaving(false)
    if (sourceFindingId && returnTo && (submitted || updated.status === "submitted" || updated.status === "acknowledged")) {
      toast.success("Notificare ANSPDCP salvată. Revenim în cockpit.")
      const params = new URLSearchParams({
        anspdcp: "done",
        evidenceNote: buildAnspdcpEvidenceNote(updated),
      })
      router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
      return
    }
    if (submitted) toast.success("Notificare ANSPDCP marcată ca trimisă")
  }

  const statusColors: Record<string, string> = {
    pending: "border-eos-warning/30 bg-eos-warning-soft",
    submitted: "border-eos-primary/30 bg-eos-primary-soft",
    acknowledged: "border-eos-success/30 bg-eos-success-soft",
  }
  const statusLabels: Record<string, string> = {
    pending: "De trimis",
    submitted: "Trimisă",
    acknowledged: "Confirmată de ANSPDCP",
  }

  return (
    <div className={`rounded-eos-md border px-3 py-3 space-y-3 ${statusColors[notif?.status ?? "pending"]} ${emphasized ? "ring-2 ring-eos-warning/50 ring-offset-2 ring-offset-eos-bg" : ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-3.5 text-eos-warning" strokeWidth={2} />
          <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-warning">
            Notificare ANSPDCP — GDPR Art. 33
          </p>
        </div>
        <div className="flex items-center gap-2">
          {deadline72h && notif?.status === "pending" && (
            <span className={`text-[10px] font-bold ${deadline72h.expired ? "text-eos-error" : deadline72h.urgent ? "text-eos-warning" : "text-eos-warning"}`}>
              {deadline72h.expired ? "DEPĂȘIT" : `${deadline72h.label} rămas`}
            </span>
          )}
          <Badge
            variant={notif?.status === "submitted" ? "default" : notif?.status === "acknowledged" ? "success" : "warning"}
            className="text-[10px] normal-case tracking-normal"
          >
            {statusLabels[notif?.status ?? "pending"]}
          </Badge>
        </div>
      </div>

      <p className="text-[10px] text-eos-warning/80">
        Incidentul implică date cu caracter personal. Notificarea ANSPDCP este obligatorie în 72h de la descoperire (GDPR Art. 33). Aceasta este <strong>separată</strong> de raportarea DNSC.
      </p>

      <div className="space-y-2">
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Categorii date afectate (virgulă)</label>
          <input
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            placeholder="ex: date identitate, date financiare, date medicale..."
            value={form.dataCategories}
            onChange={(e) => setForm((p) => ({ ...p, dataCategories: e.target.value }))}
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-medium text-eos-warning">Nr. persoane vizate (estimat)</label>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="0"
              value={form.estimatedDataSubjects}
              onChange={(e) => setForm((p) => ({ ...p, estimatedDataSubjects: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-eos-warning">DPO / Responsabil conformitate</label>
            <input
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="email@exemplu.ro"
              value={form.dpoContact}
              onChange={(e) => setForm((p) => ({ ...p, dpoContact: e.target.value }))}
            />
          </div>
        </div>
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Consecințe probabile (Art. 33(3)(c))</label>
          <textarea
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            rows={2}
            placeholder="Consecințe probabile pentru persoanele vizate..."
            value={form.consequencesDescription}
            onChange={(e) => setForm((p) => ({ ...p, consequencesDescription: e.target.value }))}
          />
        </div>
        <div>
          <label className="text-[10px] font-medium text-eos-warning">Măsuri luate / propuse (Art. 33(3)(d))</label>
          <textarea
            className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text placeholder:text-eos-text-tertiary"
            rows={2}
            placeholder="Măsuri de remediere adoptate sau propuse..."
            value={form.measuresTaken}
            onChange={(e) => setForm((p) => ({ ...p, measuresTaken: e.target.value }))}
          />
        </div>

        {/* Art. 34 — notificare persoane vizate */}
        <label className="flex items-start gap-2 text-xs text-eos-warning cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 rounded"
            checked={form.notifyDataSubjects}
            onChange={(e) => setForm((p) => ({ ...p, notifyDataSubjects: e.target.checked }))}
          />
          <span>
            <span className="font-medium">Art. 34 — Notifică persoanele vizate individual</span>
            <span className="block text-[10px] text-eos-warning/70">Dacă breach-ul prezintă risc ridicat pentru drepturile și libertățile persoanelor.</span>
          </span>
        </label>

        {notif?.status !== "pending" && (
          <div>
            <label className="text-[10px] font-medium text-eos-warning">Nr. înregistrare ANSPDCP</label>
            <input
              className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-2 py-1.5 text-xs text-eos-text"
              placeholder="ANSPDCP-2026-..."
              value={form.anspdcpReference}
              onChange={(e) => setForm((p) => ({ ...p, anspdcpReference: e.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          className="flex-1 gap-1.5 border-eos-warning/30 text-eos-warning hover:bg-eos-warning-soft"
          disabled={saving}
          onClick={() => void handleSubmit(false)}
        >
          Salvează
        </Button>
        {notif?.status === "pending" && (
          <Button
            size="sm"
            className="flex-1 gap-1.5 bg-eos-warning hover:bg-eos-warning/90 text-white"
            disabled={saving || !form.dataCategories.trim()}
            onClick={() => void handleSubmit(true)}
          >
            <Bell className="size-3.5" strokeWidth={2} />
            Marchează ca trimisă la ANSPDCP
          </Button>
        )}
        {backToCockpitHref ? (
          <Link href={backToCockpitHref} className="flex-1 min-w-[220px]">
            <Button
              size="sm"
              variant="outline"
              className="w-full gap-1.5 border-eos-warning/30 text-eos-warning hover:bg-eos-warning-soft"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              Înapoi în cockpit cu dovada
            </Button>
          </Link>
        ) : null}
      </div>
    </div>
  )
}
