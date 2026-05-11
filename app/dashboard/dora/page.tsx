"use client"

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Plus,
  Shield,
  ShieldAlert,
  X,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { SimpleTooltip } from "@/components/evidence-os"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3KpiStrip, type V3KpiItem } from "@/components/compliscan/v3/kpi-strip"
import { V3FilterBar, type V3FilterTab } from "@/components/compliscan/v3/filter-bar"
import type {
  DoraIncident,
  DoraTprmEntry,
  DoraState,
  DoraIncidentSeverity,
  DoraIncidentStatus,
  TprmCriticality,
} from "@/lib/server/dora-store"

// ─── Label maps ───────────────────────────────────────────────────────────────

const SEVERITY_LABELS: Record<DoraIncidentSeverity, string> = {
  major: "Major",
  significant: "Semnificativ",
  minor: "Minor",
}

const STATUS_LABELS: Record<DoraIncidentStatus, string> = {
  detected: "Detectat",
  "under-analysis": "În analiză",
  "notified-authority": "Raportat la autoritate",
  resolved: "Rezolvat",
  closed: "Închis",
}

const CRITICALITY_LABELS: Record<TprmCriticality, string> = {
  critical: "Critic",
  important: "Important",
  standard: "Standard",
}

// ─── Chip helpers (V3 span replacements for Badge) ───────────────────────────

function SeverityChip({ severity }: { severity: DoraIncidentSeverity }) {
  if (severity === "major") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
        {SEVERITY_LABELS[severity]}
      </span>
    )
  }
  if (severity === "significant") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        {SEVERITY_LABELS[severity]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {SEVERITY_LABELS[severity]}
    </span>
  )
}

function StatusChip({ status }: { status: DoraIncidentStatus }) {
  const label = STATUS_LABELS[status]
  if (status === "detected") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
        {label}
      </span>
    )
  }
  if (status === "under-analysis") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        {label}
      </span>
    )
  }
  if (status === "resolved") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-success">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {label}
    </span>
  )
}

function CriticalityChip({ criticality }: { criticality: TprmCriticality }) {
  if (criticality === "critical") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
        {CRITICALITY_LABELS[criticality]}
      </span>
    )
  }
  if (criticality === "important") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        {CRITICALITY_LABELS[criticality]}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {CRITICALITY_LABELS[criticality]}
    </span>
  )
}

function RiskChip({ level }: { level: "low" | "medium" | "high" }) {
  const label = level === "high" ? "Risc ridicat" : level === "medium" ? "Risc mediu" : "Risc scăzut"
  if (level === "high") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
        {label}
      </span>
    )
  }
  if (level === "medium") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {label}
    </span>
  )
}

function DeadlineChip({ label, urgent }: { label: string; urgent: boolean }) {
  if (urgent) {
    return (
      <span className="inline-flex items-center gap-1 rounded-sm border border-eos-error/30 bg-eos-error-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-error">
        <Clock className="size-2.5" />
        {label}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      <Clock className="size-2.5" />
      {label}
    </span>
  )
}

function NeutralChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
      {children}
    </span>
  )
}

function WarningChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
      {children}
    </span>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeLeft(isoDate: string) {
  const diff = new Date(isoDate).getTime() - Date.now()
  if (diff < 0) return { label: "Depășit", urgent: true }
  const hours = Math.floor(diff / 3_600_000)
  if (hours < 24) return { label: `${hours}h rămase`, urgent: hours < 4 }
  const days = Math.ceil(diff / 86_400_000)
  return { label: `${days} zile rămase`, urgent: days <= 7 }
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function DoraPage() {
  const [state, setState] = useState<DoraState | null>(null)
  const [loading, setLoading] = useState(true)
  const [showIncidentForm, setShowIncidentForm] = useState(false)
  const [showTprmForm, setShowTprmForm] = useState(false)
  const [activeTab, setActiveTab] = useState<"incidents" | "tprm">("incidents")

  useEffect(() => {
    fetch("/api/dora", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: DoraState) => setState(d))
      .catch(() => toast.error("Eroare la încărcare DORA"))
      .finally(() => setLoading(false))
  }, [])

  async function handleUpdateIncident(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/dora/incidents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error("Eroare la actualizare"); return }
    const { incident } = await res.json() as { incident: DoraIncident }
    setState((prev) => prev ? { ...prev, incidents: prev.incidents.map((i) => i.id === id ? incident : i) } : prev)
    toast.success("Incident actualizat")
  }

  async function handleUpdateTprm(id: string, patch: Record<string, unknown>) {
    const res = await fetch(`/api/dora/tprm/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) { toast.error("Eroare la actualizare"); return }
    const { entry } = await res.json() as { entry: DoraTprmEntry }
    setState((prev) => prev ? { ...prev, tprm: prev.tprm.map((t) => t.id === id ? entry : t) } : prev)
    toast.success("Furnizor actualizat")
  }

  function onIncidentCreated(incident: DoraIncident) {
    setState((prev) => prev ? { ...prev, incidents: [incident, ...prev.incidents] } : prev)
    setShowIncidentForm(false)
    toast.success("Incident înregistrat")
  }

  function onTprmCreated(entry: DoraTprmEntry) {
    setState((prev) => prev ? { ...prev, tprm: [entry, ...prev.tprm] } : prev)
    setShowTprmForm(false)
    toast.success("Furnizor ICT adăugat")
  }

  if (loading) return <LoadingScreen />

  const incidents = state?.incidents ?? []
  const tprm = state?.tprm ?? []
  const openIncidents = incidents.filter((i) => !["resolved", "closed"].includes(i.status))
  const majorOpen = openIncidents.filter((i) => i.severity === "major")
  const criticalProviders = tprm.filter((t) => t.criticality === "critical" && t.status === "active")
  const resilienceTests = state?.resilienceTests ?? []
  const resilienceCompleted = resilienceTests.filter((t) => t.status === "completed").length

  const kpiItems: V3KpiItem[] = [
    {
      id: "major-incidents",
      label: "Incidente majore",
      value: majorOpen.length,
      stripe: majorOpen.length > 0 ? "critical" : undefined,
      valueTone: majorOpen.length > 0 ? "critical" : "neutral",
      detail: `${openIncidents.length} deschise total`,
    },
    {
      id: "critical-providers",
      label: "Furnizori critici",
      value: criticalProviders.length,
      stripe: criticalProviders.length > 0 ? "warning" : undefined,
      valueTone: criticalProviders.length > 0 ? "warning" : "neutral",
      detail: `${tprm.length} furnizori total`,
    },
    {
      id: "resilience-tests",
      label: "Teste reziliență",
      value: resilienceTests.length,
      detail: `${resilienceCompleted} completate`,
    },
  ]

  const tabs: V3FilterTab<"incidents" | "tprm">[] = [
    { id: "incidents", label: "Incidente ICT", count: incidents.length },
    { id: "tprm", label: "Furnizori TPRM", count: tprm.length },
  ]

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "De rezolvat" }, { label: "DORA", current: true }]}
        title="Reziliență Digitală"
        description="Regulamentul EU 2022/2554 — obligatoriu pentru instituții financiare. Gestionează incidentele ICT, furnizorii terți critici și testele de reziliență."
        eyebrowBadges={
          <div className="flex flex-wrap items-center gap-1.5">
            <SimpleTooltip content="Digital Operational Resilience Act — Regulamentul UE 2022/2554">
              <span className="inline-flex cursor-help items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                DORA
              </span>
            </SimpleTooltip>
            <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              Reziliență operațională
            </span>
          </div>
        }
      />

      <V3KpiStrip items={kpiItems} />

      {/* DORA context banner */}
      <section className="flex items-start gap-3 overflow-hidden rounded-eos-lg border border-eos-primary/20 bg-eos-primary-soft/30 px-4 py-3.5">
        <Shield className="mt-0.5 size-4 shrink-0 text-eos-primary" />
        <div className="space-y-1 text-xs text-eos-text-muted">
          <p>
            <span className="font-semibold text-eos-text">Termene DORA:</span> Incidente majore → raportare inițială la autoritate în{" "}
            <span className="font-semibold">4 ore</span>, raport detaliat în <span className="font-semibold">72 ore</span>, raport final în{" "}
            <span className="font-semibold">1 lună</span>.
          </p>
          <p>Furnizori ICT critici trebuie evaluați anual. Contractele trebuie să includă clauze DORA (Art. 30).</p>
        </div>
      </section>

      <div className="overflow-hidden rounded-eos-lg border border-eos-border">
        <V3FilterBar<"incidents" | "tprm">
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          rightSlot={
            activeTab === "incidents" ? (
              <Button size="sm" className="gap-1.5" onClick={() => setShowIncidentForm(true)}>
                <Plus className="size-3.5" />
                Raportează incident
              </Button>
            ) : (
              <Button size="sm" className="gap-1.5" onClick={() => setShowTprmForm(true)}>
                <Plus className="size-3.5" />
                Adaugă furnizor ICT
              </Button>
            )
          }
        />
      </div>

      {/* ── Incidents tab ── */}
      {activeTab === "incidents" && (
        <div className="space-y-3">
          {showIncidentForm && (
            <IncidentForm
              onCreated={onIncidentCreated}
              onCancel={() => setShowIncidentForm(false)}
            />
          )}

          {incidents.length === 0 && !showIncidentForm && (
            <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface py-12 text-center">
              <ShieldAlert className="size-10 text-eos-text-tertiary" strokeWidth={1.5} />
              <div className="space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Niciun incident ICT
                </p>
                <p className="max-w-md text-[12.5px] text-eos-text-muted">
                  Înregistrează incidentele ICT conform obligațiilor DORA Art. 17-23.
                </p>
              </div>
            </div>
          )}

          {incidents.map((incident) => (
            <IncidentRow key={incident.id} incident={incident} onUpdate={handleUpdateIncident} />
          ))}
        </div>
      )}

      {/* ── TPRM tab ── */}
      {activeTab === "tprm" && (
        <div className="space-y-3">
          {showTprmForm && (
            <TprmForm
              onCreated={onTprmCreated}
              onCancel={() => setShowTprmForm(false)}
            />
          )}

          {tprm.length === 0 && !showTprmForm && (
            <div className="flex flex-col items-center gap-3 rounded-eos-lg border border-eos-border bg-eos-surface py-12 text-center">
              <Shield className="size-10 text-eos-text-tertiary" strokeWidth={1.5} />
              <div className="space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Niciun furnizor ICT înregistrat
                </p>
                <p className="max-w-md text-[12.5px] text-eos-text-muted">
                  Adaugă furnizorii ICT terți. Cei critici necesită evaluare anuală conform DORA Art. 28-30.
                </p>
              </div>
            </div>
          )}

          {tprm.map((entry) => (
            <TprmRow key={entry.id} entry={entry} onUpdate={handleUpdateTprm} />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Incident Row ─────────────────────────────────────────────────────────────

function IncidentRow({
  incident: i,
  onUpdate,
}: {
  incident: DoraIncident
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [rootCause, setRootCause] = useState(i.rootCause ?? "")
  const [mitigation, setMitigation] = useState(i.mitigation ?? "")
  const isClosed = i.status === "resolved" || i.status === "closed"
  const dl = !isClosed ? timeLeft(i.initialReportDeadlineISO) : null

  const nextStatuses: DoraIncidentStatus[] = ({
    detected: ["under-analysis", "closed"],
    "under-analysis": ["notified-authority", "resolved", "closed"],
    "notified-authority": ["resolved", "closed"],
    resolved: ["closed"],
    closed: [],
  } as Record<DoraIncidentStatus, DoraIncidentStatus[]>)[i.status]

  const stripeTone =
    i.severity === "major"
      ? "bg-eos-error"
      : i.severity === "significant"
        ? "bg-eos-warning"
        : "bg-eos-border-strong"

  const emphasizeBg = !isClosed && i.severity === "major" ? "bg-eos-error-soft/40" : ""

  return (
    <section className={`relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface ${emphasizeBg}`}>
      <span className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r-sm ${stripeTone}`} aria-hidden />
      <div className="space-y-3 px-4 py-4">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex min-w-0 items-start gap-2">
            {expanded ? (
              <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            ) : (
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-eos-text">{i.title}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <StatusChip status={i.status} />
                <SeverityChip severity={i.severity} />
                {dl && <DeadlineChip label={dl.label} urgent={dl.urgent} />}
                <span className="text-xs text-eos-text-muted">
                  Detectat: {new Date(i.detectedAtISO).toLocaleDateString("ro-RO")}
                </span>
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div className="rounded-eos-sm border border-eos-border bg-eos-surface-variant p-3">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">Descriere</p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-eos-text">{i.description}</p>
            </div>

            {i.affectedSystems.length > 0 && (
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">Sisteme afectate</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {i.affectedSystems.map((s) => (
                    <NeutralChip key={s}>{s}</NeutralChip>
                  ))}
                </div>
              </div>
            )}

            {i.estimatedImpact && (
              <p className="text-xs text-eos-text-muted">Impact estimat: {i.estimatedImpact}</p>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Cauza rădăcină
                </label>
                <textarea
                  className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  rows={2}
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Cauza identificată..."
                />
              </div>
              <div>
                <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Măsuri de remediere
                </label>
                <textarea
                  className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                  rows={2}
                  value={mitigation}
                  onChange={(e) => setMitigation(e.target.value)}
                  placeholder="Acțiuni întreprinse..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() => onUpdate(i.id, { rootCause, mitigation })}
              >
                Salvează
              </Button>
              {nextStatuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={s === "resolved" ? "default" : "outline"}
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const patch: Record<string, unknown> = { status: s }
                    if (s === "notified-authority") patch.notifiedAuthorityAtISO = new Date().toISOString()
                    onUpdate(i.id, patch)
                  }}
                >
                  {s === "resolved" && <CheckCircle2 className="size-3.5" />}
                  {s === "notified-authority" && <ExternalLink className="size-3.5" />}
                  {STATUS_LABELS[s]}
                </Button>
              ))}
            </div>

            <div className="space-y-0.5 text-[10px] text-eos-text-muted">
              <p>
                Termen raportare inițial:{" "}
                <span className={timeLeft(i.initialReportDeadlineISO).urgent ? "font-semibold text-eos-error" : ""}>
                  {new Date(i.initialReportDeadlineISO).toLocaleString("ro-RO")}
                </span>
              </p>
              <p>Termen raport final: {new Date(i.finalReportDeadlineISO).toLocaleDateString("ro-RO")}</p>
              {i.notifiedAuthorityAtISO && (
                <p>Raportat la autoritate: {new Date(i.notifiedAuthorityAtISO).toLocaleString("ro-RO")}</p>
              )}
              {i.resolvedAtISO && <p>Rezolvat: {new Date(i.resolvedAtISO).toLocaleDateString("ro-RO")}</p>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── TPRM Row ─────────────────────────────────────────────────────────────────

function TprmRow({
  entry: e,
  onUpdate,
}: {
  entry: DoraTprmEntry
  onUpdate: (id: string, patch: Record<string, unknown>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState(e.notes ?? "")
  const contractEnd = timeLeft(e.contractEndISO)
  const isActive = e.status === "active"

  const stripeTone =
    e.criticality === "critical"
      ? "bg-eos-error"
      : e.criticality === "important"
        ? "bg-eos-warning"
        : "bg-eos-border-strong"

  const emphasizeBg = e.criticality === "critical" && e.riskLevel === "high" ? "bg-eos-warning-soft/40" : ""

  return (
    <section className={`relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface ${emphasizeBg}`}>
      <span className={`absolute left-0 top-3 bottom-3 w-[2px] rounded-r-sm ${stripeTone}`} aria-hidden />
      <div className="space-y-3 px-4 py-4">
        <button
          type="button"
          className="flex w-full items-start justify-between gap-3 text-left"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex min-w-0 items-start gap-2">
            {expanded ? (
              <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            ) : (
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-eos-text">{e.providerName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <CriticalityChip criticality={e.criticality} />
                <NeutralChip>{e.serviceType}</NeutralChip>
                <RiskChip level={e.riskLevel} />
                {isActive && contractEnd.urgent && (
                  <WarningChip>
                    <Clock className="size-2.5" />
                    Contract: {contractEnd.label}
                  </WarningChip>
                )}
              </div>
            </div>
          </div>
        </button>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div className="grid grid-cols-2 gap-3 text-xs text-eos-text-muted">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">Contract</p>
                <p>
                  {new Date(e.contractStartISO).toLocaleDateString("ro-RO")} —{" "}
                  {new Date(e.contractEndISO).toLocaleDateString("ro-RO")}
                </p>
              </div>
              {e.lastAssessmentISO && (
                <div>
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">Ultima evaluare</p>
                  <p>{new Date(e.lastAssessmentISO).toLocaleDateString("ro-RO")}</p>
                </div>
              )}
            </div>

            <div>
              <label className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">Note</label>
              <textarea
                className="mt-1 w-full rounded-eos-sm border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text"
                rows={2}
                value={notes}
                onChange={(e2) => setNotes(e2.target.value)}
                placeholder="Observații, clauze speciale, riscuri identificate..."
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                className="text-xs"
                onClick={() =>
                  onUpdate(e.id, {
                    notes,
                    lastAssessmentISO: new Date().toISOString(),
                    nextAssessmentISO: new Date(Date.now() + 365 * 86_400_000).toISOString(),
                  })
                }
              >
                Marchează evaluat azi
              </Button>
              {e.status === "active" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdate(e.id, { status: "under-review" })}
                >
                  Pune sub revizuire
                </Button>
              )}
              {e.status === "under-review" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => onUpdate(e.id, { status: "active" })}
                >
                  Marchează activ
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

// ─── Incident Form ────────────────────────────────────────────────────────────

function IncidentForm({
  onCreated,
  onCancel,
}: {
  onCreated: (incident: DoraIncident) => void
  onCancel: () => void
}) {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [severity, setSeverity] = useState<DoraIncidentSeverity>("significant")
  const [occurredAt, setOccurredAt] = useState("")
  const [detectedAt, setDetectedAt] = useState(new Date().toISOString().slice(0, 16))
  const [affectedSystems, setAffectedSystems] = useState("")
  const [estimatedImpact, setEstimatedImpact] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!title.trim() || !description.trim() || !occurredAt || !detectedAt) {
      toast.error("Completează câmpurile obligatorii")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/dora", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          severity,
          occurredAtISO: new Date(occurredAt).toISOString(),
          detectedAtISO: new Date(detectedAt).toISOString(),
          affectedSystems: affectedSystems.split(",").map((s) => s.trim()).filter(Boolean),
          estimatedImpact: estimatedImpact.trim(),
        }),
      })
      if (!res.ok) throw new Error("Eroare")
      const { incident } = await res.json() as { incident: DoraIncident }
      onCreated(incident)
    } catch {
      toast.error("Nu am putut crea incidentul")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-eos-lg border border-eos-primary/30 bg-eos-primary/5">
      <header className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-3.5">
        <h3
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Raportează incident ICT nou
        </h3>
        <button type="button" onClick={onCancel} className="text-eos-text-muted hover:text-eos-text">
          <X className="size-4" />
        </button>
      </header>
      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Titlu incident *</label>
            <input
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary focus:ring-1 focus:ring-eos-primary"
              placeholder="ex: Atac ransomware pe serverul de producție"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Severitate *</label>
            <select
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={severity}
              onChange={(e) => setSeverity(e.target.value as DoraIncidentSeverity)}
            >
              <option value="major">Major — raportare în 4h</option>
              <option value="significant">Semnificativ — raportare în 24h</option>
              <option value="minor">Minor — raportare în 72h</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Sisteme afectate</label>
            <input
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="Core banking, CRM, ... (separate prin virgulă)"
              value={affectedSystems}
              onChange={(e) => setAffectedSystems(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Data producerii *</label>
            <input
              type="datetime-local"
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={occurredAt}
              onChange={(e) => setOccurredAt(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Data detectării *</label>
            <input
              type="datetime-local"
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={detectedAt}
              onChange={(e) => setDetectedAt(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Descriere *</label>
            <textarea
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              rows={3}
              placeholder="Descrie incidentul: ce s-a întâmplat, impactul operațional, datele afectate..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Impact estimat</label>
            <input
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: Indisponibilitate 2h, ~5000 clienți afectați"
              value={estimatedImpact}
              onChange={(e) => setEstimatedImpact(e.target.value)}
            />
          </div>
        </div>

        {severity === "major" && (
          <div className="flex items-center gap-2 rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2">
            <AlertTriangle className="size-4 shrink-0 text-eos-error" />
            <p className="text-xs text-eos-error">
              Incident major — trebuie raportat la autoritatea competentă (ASF/BNR) în{" "}
              <strong>4 ore</strong> de la detectare.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Anulează
          </Button>
          <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()} className="gap-1.5">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Înregistrează incident
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─── TPRM Form ────────────────────────────────────────────────────────────────

function TprmForm({
  onCreated,
  onCancel,
}: {
  onCreated: (entry: DoraTprmEntry) => void
  onCancel: () => void
}) {
  const [providerName, setProviderName] = useState("")
  const [serviceType, setServiceType] = useState("")
  const [criticality, setCriticality] = useState<TprmCriticality>("important")
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high">("medium")
  const [contractStart, setContractStart] = useState("")
  const [contractEnd, setContractEnd] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!providerName.trim() || !serviceType.trim() || !contractStart || !contractEnd) {
      toast.error("Completează câmpurile obligatorii")
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/dora/tprm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerName: providerName.trim(),
          serviceType: serviceType.trim(),
          criticality,
          riskLevel,
          contractStartISO: new Date(contractStart).toISOString(),
          contractEndISO: new Date(contractEnd).toISOString(),
        }),
      })
      if (!res.ok) throw new Error("Eroare")
      const { entry } = await res.json() as { entry: DoraTprmEntry }
      onCreated(entry)
    } catch {
      toast.error("Nu am putut adăuga furnizorul")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="overflow-hidden rounded-eos-lg border border-eos-primary/30 bg-eos-primary/5">
      <header className="flex items-center justify-between border-b border-eos-border-subtle px-4 py-3.5">
        <h3
          data-display-text="true"
          className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Adaugă furnizor ICT terț
        </h3>
        <button type="button" onClick={onCancel} className="text-eos-text-muted hover:text-eos-text">
          <X className="size-4" />
        </button>
      </header>
      <div className="space-y-3 px-4 py-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Denumire furnizor *</label>
            <input
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: AWS, Microsoft Azure, Oracle..."
              value={providerName}
              onChange={(e) => setProviderName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Tip serviciu *</label>
            <input
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              placeholder="ex: Cloud hosting, Payment processing..."
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Criticitate DORA *</label>
            <select
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={criticality}
              onChange={(e) => setCriticality(e.target.value as TprmCriticality)}
            >
              <option value="critical">Critic — evaluare obligatorie anuală</option>
              <option value="important">Important</option>
              <option value="standard">Standard</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Nivel de risc</label>
            <select
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value as "low" | "medium" | "high")}
            >
              <option value="low">Scăzut</option>
              <option value="medium">Mediu</option>
              <option value="high">Ridicat</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Contract de la *</label>
            <input
              type="date"
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={contractStart}
              onChange={(e) => setContractStart(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-eos-text-muted">Contract până la *</label>
            <input
              type="date"
              className="w-full rounded-eos-sm border border-eos-border bg-white px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-primary"
              value={contractEnd}
              onChange={(e) => setContractEnd(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={onCancel}>
            Anulează
          </Button>
          <Button size="sm" disabled={submitting} onClick={() => void handleSubmit()} className="gap-1.5">
            {submitting && <Loader2 className="size-3.5 animate-spin" />}
            Adaugă furnizor
          </Button>
        </div>
      </div>
    </section>
  )
}
