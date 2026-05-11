"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Bell,
  ClipboardCheck,
  FileText,
  Shield,
  ChevronDown,
  ChevronUp,
  Download,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { V3Pill } from "@/components/compliscan/v3/compat"
import { Button } from "@/components/evidence-os/Button"
import { V3Surface, V3SurfaceBody, V3SurfaceHead, V3SurfaceTitle } from "@/components/compliscan/v3/compat"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type {
  Nis2Incident,
  Nis2IncidentSeverity,
  Nis2OperationalImpact,
  Nis2AttackType,
} from "@/lib/server/nis2-store"
import { ATTACK_TYPE_LABELS, OPERATIONAL_IMPACT_LABELS } from "@/lib/compliance/dnsc-report"
import { downloadDNSCReport, slaLabel, SEVERITY_BADGE, INCIDENT_STATUS_LABELS } from "./nis2-shared"
import { IncidentStageStepper, IncidentChecklist_UI } from "./incident-stepper"
import { PostIncidentPanel, AnspdcpNotificationPanel } from "./incident-panels"

export function buildIncidentCockpitEvidenceNote(incident: Nis2Incident) {
  const evidenceParts = [
    `Flow DNSC completat pentru incidentul "${incident.title}".`,
    incident.earlyWarningReport
      ? `Early warning trimis la ${new Date(incident.earlyWarningReport.submittedAtISO).toLocaleString("ro-RO")}.`
      : null,
    incident.fullReport72h
      ? `Raportul 72h este deja salvat în timeline.`
      : null,
    incident.finalReport
      ? `Raportul final este deja salvat în timeline.`
      : null,
    incident.postIncidentTracking?.dnscReference
      ? `Referință DNSC: ${incident.postIncidentTracking.dnscReference}.`
      : null,
  ]

  return evidenceParts.filter(Boolean).join(" ")
}

function isPrivacyOnlyBreachCompleted(incident: Nis2Incident) {
  return (
    incident.involvesPersonalData &&
    (incident.anspdcpNotification?.status === "submitted" || incident.anspdcpNotification?.status === "acknowledged") &&
    !incident.earlyWarningReport &&
    !incident.fullReport72h &&
    !incident.finalReport
  )
}

// ── IncidentRow (refactored cu 3-stage stepper + post-incident) ──────────────

export function IncidentRow({
  incident,
  orgName,
  onUpdate,
  onDelete,
  highlighted = false,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  incident: Nis2Incident
  orgName?: string
  onUpdate: (id: string, patch: Partial<Nis2Incident>) => void | Promise<void>
  onDelete: (id: string) => void
  highlighted?: boolean
  focusMode?: "anspdcp" | "incident"
  sourceFindingId?: string
  returnTo?: string
}) {
  const sla24 = slaLabel(incident.deadline24hISO, 24 * 3_600_000)
  const sla72 = slaLabel(incident.deadline72hISO, 72 * 3_600_000)
  const privacyBreachCompleted = isPrivacyOnlyBreachCompleted(incident)
  const displayStatus = privacyBreachCompleted ? "closed" : incident.status
  const isOpen = displayStatus !== "closed"
  const [showChecklist, setShowChecklist] = useState(false)
  const [showStages, setShowStages] = useState(true)

  const completedStages = privacyBreachCompleted
    ? 3
    : [incident.earlyWarningReport, incident.fullReport72h, incident.finalReport].filter(Boolean).length

  const nis2IncidentBorderL =
    incident.severity === "critical" || incident.severity === "high"
      ? "border-l-[3px] border-l-eos-error"
      : incident.severity === "medium"
        ? "border-l-[3px] border-l-eos-warning"
        : "border-l-[3px] border-l-eos-border-subtle"

  return (
    <div
      id={`incident-${incident.id}`}
      className={`space-y-3 px-5 py-4 ${nis2IncidentBorderL} ${highlighted ? "scroll-mt-24 rounded-eos-lg bg-eos-warning-soft ring-1 ring-eos-warning/30" : ""}`}
    >
      {highlighted && focusMode === "anspdcp" ? (
        <div className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-3 py-2 text-xs text-eos-warning">
          Ai venit aici din cockpitul finding-ului GDPR de breach. Completează notificarea ANSPDCP și apoi întoarce-te cu dovada în același caz.
        </div>
      ) : highlighted && focusMode === "incident" ? (
        <div className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft/20 px-3 py-2 text-xs text-eos-primary">
          Ai venit aici din cockpitul finding-ului NIS2. Parcurge timeline-ul 24h / 72h / 30 zile pentru incidentul selectat și întoarce-te cu dovada early warning-ului în același caz.
        </div>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-eos-text">{incident.title}</p>
            <V3Pill variant={SEVERITY_BADGE[incident.severity]} className="text-[10px] normal-case tracking-normal">
              {incident.severity}
            </V3Pill>
            <V3Pill variant="outline" className="text-[10px] normal-case tracking-normal">
              {INCIDENT_STATUS_LABELS[displayStatus]}
            </V3Pill>
            <V3Pill variant={completedStages === 3 ? "success" : "warning"} className="text-[10px] normal-case tracking-normal">
              {privacyBreachCompleted ? "ANSPDCP trimisă" : `${completedStages}/3 etape`}
            </V3Pill>
            {incident.involvesPersonalData && (
              <V3Pill
                variant={incident.anspdcpNotification?.status === "submitted" || incident.anspdcpNotification?.status === "acknowledged" ? "default" : "destructive"}
                className="text-[10px] normal-case tracking-normal gap-1"
              >
                <Bell className="size-2.5" strokeWidth={2.5} />
                ANSPDCP {incident.anspdcpNotification?.status === "pending" ? "— de notificat" : incident.anspdcpNotification?.status === "submitted" ? "— trimis" : "— confirmat"}
              </V3Pill>
            )}
          </div>
          {incident.description && (
            <p className="mt-1 text-xs text-eos-text-muted">{incident.description}</p>
          )}
          <p className="mt-1 text-xs text-eos-text-tertiary">
            Detectat: {new Date(incident.detectedAtISO).toLocaleString("ro-RO")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => downloadDNSCReport(incident, orgName)}
            title="Generează raport DNSC"
            className="flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1.5 text-xs font-medium text-eos-text-muted hover:border-eos-primary/30 hover:bg-eos-primary-soft hover:text-eos-primary"
            aria-label="Export raport DNSC"
          >
            <Download className="size-3.5" strokeWidth={2} />
            DNSC
          </button>
          <button
            type="button"
            onClick={() => onDelete(incident.id)}
            className="rounded-eos-sm border border-eos-border bg-eos-surface p-1.5 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error"
            aria-label="Șterge incident"
          >
            <Trash2 className="size-3.5" strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* SLA timers */}
      {isOpen && (
        <div className="grid grid-cols-2 gap-2">
          <div className={`rounded-eos-sm border px-3 py-2 ${sla24.expired ? "border-eos-error/30 bg-eos-error-soft" : sla24.urgent ? "border-eos-warning/30 bg-eos-warning-soft" : "border-eos-border bg-eos-surface-variant"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${sla24.expired || sla24.urgent ? "text-eos-error" : "text-eos-text-muted"}`}>24h Early Warning</span>
              <span className={`text-xs font-bold ${sla24.expired ? "text-eos-error" : sla24.urgent ? "text-eos-warning" : "text-eos-text"}`}>
                {sla24.expired ? "DEPASIT" : sla24.label}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface">
              <div className={`h-full rounded-full transition-all ${sla24.expired ? "bg-eos-error" : sla24.urgent ? "bg-eos-warning" : "bg-eos-primary"}`} style={{ width: `${sla24.progressPct}%` }} />
            </div>
          </div>
          <div className={`rounded-eos-sm border px-3 py-2 ${sla72.expired ? "border-eos-error/30 bg-eos-error-soft" : sla72.urgent ? "border-eos-warning/30 bg-eos-warning-soft" : "border-eos-border bg-eos-surface-variant"}`}>
            <div className="flex items-center justify-between">
              <span className={`text-[10px] font-medium uppercase tracking-[0.15em] ${sla72.expired || sla72.urgent ? "text-eos-error" : "text-eos-text-muted"}`}>72h Raport Complet</span>
              <span className={`text-xs font-bold ${sla72.expired ? "text-eos-error" : sla72.urgent ? "text-eos-warning" : "text-eos-text"}`}>
                {sla72.expired ? "DEPASIT" : sla72.label}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface">
              <div className={`h-full rounded-full transition-all ${sla72.expired ? "bg-eos-error" : sla72.urgent ? "bg-eos-warning" : "bg-eos-primary"}`} style={{ width: `${sla72.progressPct}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Câmpuri DNSC completate */}
      {(incident.attackType || incident.operationalImpact) && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-eos-text-muted">
          {incident.attackType && (
            <span><span className="font-medium text-eos-text">Tip atac:</span> {ATTACK_TYPE_LABELS[incident.attackType]}</span>
          )}
          {incident.operationalImpact && (
            <span><span className="font-medium text-eos-text">Impact:</span> {OPERATIONAL_IMPACT_LABELS[incident.operationalImpact]}</span>
          )}
        </div>
      )}

      {/* 3-Stage Stepper */}
      <div>
        <button type="button" className="flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline" onClick={() => setShowStages((v) => !v)}>
          <Shield className="size-3.5" />
          {showStages ? "Ascunde etapele de raportare" : "Etapele de raportare NIS2"}
          {showStages ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {showStages && (
          <div className="mt-2">
            <IncidentStageStepper
              incident={incident}
              onSubmitStage={(_stage, data) => onUpdate(incident.id, data as Partial<Nis2Incident>)}
            />
          </div>
        )}
      </div>

      {/* Post-incident tracking */}
      <PostIncidentPanel
        incident={incident}
        onUpdate={(patch) => onUpdate(incident.id, patch as Partial<Nis2Incident>)}
      />

      {/* ANSPDCP breach notification panel (GOLD 6) */}
      <AnspdcpNotificationPanel
        incident={incident}
        onUpdate={(patch) => onUpdate(incident.id, patch as Partial<Nis2Incident>)}
        emphasized={highlighted && focusMode === "anspdcp"}
        sourceFindingId={sourceFindingId}
        returnTo={returnTo}
      />

      {/* Checklist răspuns incident */}
      <div>
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
          onClick={() => setShowChecklist((v) => !v)}
        >
          <ClipboardCheck className="size-3.5" />
          {showChecklist ? "Ascunde checklist" : "Checklist răspuns incident"}
          {showChecklist ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>
        {showChecklist && (
          <div className="mt-2 rounded-eos-sm border border-eos-border bg-eos-surface p-3">
            <IncidentChecklist_UI attackType={incident.attackType} />
          </div>
        )}
      </div>
    </div>
  )
}

export function IncidentsTab({
  orgName,
  highlightedIncidentId,
  focusMode,
  sourceFindingId,
  returnTo,
}: {
  orgName?: string
  highlightedIncidentId?: string
  focusMode?: "anspdcp" | "incident"
  sourceFindingId?: string
  returnTo?: string
}) {
  const router = useRouter()
  const [incidents, setIncidents] = useState<Nis2Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [generatingIR, setGeneratingIR] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: "",
    description: "",
    severity: "high" as Nis2IncidentSeverity,
    affectedSystems: "",
    attackType: "" as Nis2AttackType | "",
    attackVector: "",
    operationalImpact: "" as Nis2OperationalImpact | "",
    operationalImpactDetails: "",
    measuresTaken: "",
    involvesPersonalData: false,
  })

  useEffect(() => {
    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { incidents: Nis2Incident[] }) => setIncidents(d.incidents ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading || !highlightedIncidentId) return
    const row = document.getElementById(`incident-${highlightedIncidentId}`)
    if (!row) return
    row.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [highlightedIncidentId, incidents.length, loading])

  async function handleGenerateIR() {
    setGeneratingIR(true)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "nis2-incident-response",
          orgName: orgName ?? "Organizația mea",
        }),
      })
      if (!res.ok) throw new Error("Generarea a eșuat.")
      const doc = (await res.json()) as { content: string; title: string }
      const blob = new Blob([doc.content], { type: "text/markdown;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `plan-ir-nis2-${new Date().toISOString().split("T")[0]}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Plan IR NIS2 generat și descărcat")
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGeneratingIR(false)
    }
  }

  async function handleCreate() {
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description.trim(),
          severity: form.severity,
          affectedSystems: form.affectedSystems.split(",").map((s) => s.trim()).filter(Boolean),
          ...(form.attackType && { attackType: form.attackType }),
          ...(form.attackVector.trim() && { attackVector: form.attackVector.trim() }),
          ...(form.operationalImpact && { operationalImpact: form.operationalImpact }),
          ...(form.operationalImpactDetails.trim() && { operationalImpactDetails: form.operationalImpactDetails.trim() }),
          ...(form.measuresTaken.trim() && { measuresTaken: form.measuresTaken.trim() }),
          involvesPersonalData: form.involvesPersonalData || form.attackType === "data-breach",
        }),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setIncidents((prev) => [data.incident!, ...prev])
      setForm({
        title: "", description: "", severity: "high", affectedSystems: "",
        attackType: "", attackVector: "", operationalImpact: "",
        operationalImpactDetails: "", measuresTaken: "", involvesPersonalData: false,
      })
      setShowForm(false)
      toast.success("Incident înregistrat", { description: "Termenele SLA au fost calculate automat." })
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleUpdate(id: string, patch: Partial<Nis2Incident>) {
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { incident?: Nis2Incident; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la actualizare.")
      setIncidents((prev) => prev.map((i) => (i.id === id ? data.incident! : i)))

      if (patch.earlyWarningReport && sourceFindingId && returnTo && data.incident) {
        toast.success("Early warning salvat. Revenim în cockpit.")
        const params = new URLSearchParams({
          incidentFlow: "done",
          evidenceNote: buildIncidentCockpitEvidenceNote(data.incident),
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
        return
      }
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Ștergi acest incident NIS2?")) return
    try {
      const res = await fetch(`/api/nis2/incidents/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Eroare la ștergere.")
      setIncidents((prev) => prev.filter((i) => i.id !== id))
      toast.success("Incident șters")
    } catch {
      toast.error("Eroare la ștergere")
    }
  }

  const openCount = incidents.filter((i) => i.status !== "closed" && !isPrivacyOnlyBreachCompleted(i)).length
  const highlightedIncident = highlightedIncidentId
    ? incidents.find((incident) => incident.id === highlightedIncidentId)
    : null
  const backToCockpitHref =
    !returnTo && sourceFindingId && highlightedIncident?.earlyWarningReport
      ? `/dashboard/resolve/${encodeURIComponent(sourceFindingId)}?${new URLSearchParams({
          incidentFlow: "done",
          evidenceNote: buildIncidentCockpitEvidenceNote(highlightedIncident),
        }).toString()}`
      : null

  return (
    <div className="space-y-4">
      {highlightedIncident && focusMode === "anspdcp" ? (
        <V3Surface className="border-eos-warning/30 bg-eos-warning-soft">
          <V3SurfaceBody className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-eos-text">Flow ANSPDCP deschis din cockpit</p>
              <p className="mt-1 text-xs text-eos-warning/80">
                Incidentul „{highlightedIncident.title}” este deja selectat mai jos. Completează notificarea ANSPDCP și revino în cockpit cu dovada pregătită.
              </p>
            </div>
            <V3Pill variant="warning" className="shrink-0 normal-case tracking-normal">
              GDPR Art. 33
            </V3Pill>
          </V3SurfaceBody>
        </V3Surface>
      ) : highlightedIncident && focusMode === "incident" ? (
        <V3Surface className="border-sky-300 bg-sky-50">
          <V3SurfaceBody className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Flow de incident NIS2 deschis din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Incidentul „{highlightedIncident.title}” este deja selectat mai jos. Completează early warning-ul în 24h, iar după salvare revii automat în același cockpit pentru închidere.
              </p>
            </div>
            {backToCockpitHref ? (
              <Link href={backToCockpitHref} className="shrink-0">
                <Button size="sm" variant="outline" className="gap-1.5 border-sky-300 bg-white text-sky-950 hover:bg-sky-100">
                  <ArrowLeft className="size-3.5" strokeWidth={2} />
                  Înapoi la finding
                </Button>
              </Link>
            ) : (
              <V3Pill variant="outline" className="shrink-0 normal-case tracking-normal border-sky-300 bg-white text-sky-950">
                NIS2 Art. 23
              </V3Pill>
            )}
          </V3SurfaceBody>
        </V3Surface>
      ) : sourceFindingId && focusMode === "incident" ? (
        <V3Surface className="border-sky-300 bg-sky-50">
          <V3SurfaceBody className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-sky-950">Alege incidentul corect din cockpit</p>
              <p className="mt-1 text-xs text-sky-900/80">
                Nu am putut selecta automat incidentul potrivit. Alege un incident existent sau înregistrează unul nou, apoi revino în același finding cu dovada early warning-ului.
              </p>
            </div>
            <Link
              href={`/dashboard/resolve/${encodeURIComponent(sourceFindingId)}`}
              className="inline-flex shrink-0 items-center gap-1 text-xs text-sky-950 hover:underline"
            >
              <ArrowLeft className="size-3" strokeWidth={2} />
              Înapoi la finding
            </Link>
          </V3SurfaceBody>
        </V3Surface>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {openCount > 0 && (
            <V3Pill variant="destructive" dot className="normal-case tracking-normal">
              {openCount} deschis{openCount !== 1 ? "e" : ""}
            </V3Pill>
          )}
        </div>
        <Button size="sm" className="gap-2" onClick={() => setShowForm((v) => !v)}>
          <Plus className="size-3.5" strokeWidth={2} />
          Înregistrează incident
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <V3Surface className="border-eos-border bg-eos-surface">
          <V3SurfaceHead>
            <V3SurfaceTitle className="text-sm">Incident nou</V3SurfaceTitle>
          </V3SurfaceHead>
          <V3SurfaceBody className="space-y-3">
            <input
              type="text"
              placeholder="Titlu incident *"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Descriere (opțional)"
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Severitate</label>
                <select
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.severity}
                  onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value as Nis2IncidentSeverity }))}
                >
                  {(["low", "medium", "high", "critical"] as Nis2IncidentSeverity[]).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Sisteme afectate (virgulă)</label>
                <input
                  type="text"
                  placeholder="ERP, email, VPN"
                  value={form.affectedSystems}
                  onChange={(e) => setForm((f) => ({ ...f, affectedSystems: e.target.value }))}
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
            </div>
            {/* Câmpuri DNSC opționale */}
            <p className="text-xs font-medium text-eos-text-muted pt-1">Câmpuri raportare DNSC (opționale)</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Tip atac</label>
                <select
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.attackType}
                  onChange={(e) => setForm((f) => ({ ...f, attackType: e.target.value as Nis2AttackType | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(ATTACK_TYPE_LABELS) as [Nis2AttackType, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Impact operațional</label>
                <select
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  value={form.operationalImpact}
                  onChange={(e) => setForm((f) => ({ ...f, operationalImpact: e.target.value as Nis2OperationalImpact | "" }))}
                >
                  <option value="">— Selectează —</option>
                  {(Object.entries(OPERATIONAL_IMPACT_LABELS) as [Nis2OperationalImpact, string][]).map(([val, lbl]) => (
                    <option key={val} value={val}>{lbl}</option>
                  ))}
                </select>
              </div>
            </div>
            <input
              type="text"
              placeholder="Vector de atac (ex: email phishing cu .exe atașat)"
              value={form.attackVector}
              onChange={(e) => setForm((f) => ({ ...f, attackVector: e.target.value }))}
              className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
            />
            <textarea
              placeholder="Măsuri luate (containment, remediere)"
              value={form.measuresTaken}
              onChange={(e) => setForm((f) => ({ ...f, measuresTaken: e.target.value }))}
              rows={2}
              className="w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text outline-none resize-none"
            />
            {/* ANSPDCP: personal data flag */}
            <label className={`flex items-start gap-2 cursor-pointer rounded-eos-sm border px-3 py-2.5 text-xs transition-colors ${
              form.involvesPersonalData || form.attackType === "data-breach"
                ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                : "border-eos-border bg-eos-surface-variant text-eos-text"
            }`}>
              <input
                type="checkbox"
                className="mt-0.5 rounded"
                checked={form.involvesPersonalData || form.attackType === "data-breach"}
                onChange={(e) => setForm((f) => ({ ...f, involvesPersonalData: e.target.checked }))}
              />
              <span>
                <span className="font-medium">Implică date cu caracter personal</span>
                <span className="block text-[10px] opacity-70 mt-0.5">
                  Activează notificarea ANSPDCP în 72h (GDPR Art. 33), separată de raportarea DNSC.
                  {form.attackType === "data-breach" && " (detectat automat din tipul atacului)"}
                </span>
              </span>
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.title.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează incident
              </Button>
            </div>
          </V3SurfaceBody>
        </V3Surface>
      )}

      {loading ? (
        <LoadingScreen variant="section" />
      ) : incidents.length === 0 ? (
        <div className="rounded-eos-sm border border-eos-border bg-eos-surface p-8 text-center">
          <ShieldAlert className="mx-auto mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
          <p className="font-semibold text-eos-text">Niciun incident înregistrat</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            Înregistrează incidente de securitate pentru a monitoriza termenele SLA de raportare DNSC.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 gap-2"
            onClick={() => void handleGenerateIR()}
            disabled={generatingIR}
          >
            {generatingIR ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <FileText className="size-4" strokeWidth={2} />}
            Generează Plan de Răspuns la Incidente
          </Button>
        </div>
      ) : (
        <V3Surface className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {incidents.map((inc) => (
            <IncidentRow
              key={inc.id}
              incident={inc}
              orgName={orgName}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              highlighted={inc.id === highlightedIncidentId}
              focusMode={focusMode}
              sourceFindingId={sourceFindingId}
              returnTo={returnTo}
            />
          ))}
        </V3Surface>
      )}

      {/* DNSC info */}
      <div className="rounded-eos-sm border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">Obligații raportare NIS2 (Art. 23)</p>
        <p className="mt-1">
          <span className="font-semibold text-eos-warning">24h</span> — Alertă inițială la DNSC (confirmare incident semnificativ).{" "}
          <span className="font-semibold text-eos-error">72h</span> — Raport complet (impact, cauze, măsuri luate).{" "}
          1 lună — Raport final cu lecțiile învățate.
        </p>
      </div>
    </div>
  )
}
