"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, ChevronDown, ChevronRight, Clock } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import type { ScanFinding, FindingResolution } from "@/lib/compliance/types"
import type { UrgencyItem } from "@/app/api/dashboard/urgency/route"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL" | "L1" | "L2" | "L3"
type FrameworkFilter = "toate" | "gdpr" | "nis2" | "ai-act" | "furnizori"

// ── Helpers ───────────────────────────────────────────────────────────────────

function frameworkFromLegal(ref?: string): FrameworkFilter {
  if (!ref) return "toate"
  const r = ref.toUpperCase()
  if (r.includes("GDPR")) return "gdpr"
  if (r.includes("AI ACT") || r.includes("EU AI")) return "ai-act"
  if (r.includes("NIS2") || r.includes("NIS 2")) return "nis2"
  if (r.includes("FACTURA") || r.includes("ANAF") || r.includes("CIUS") || r.includes("FURNIZOR") || r.includes("VENDOR")) return "furnizori"
  return "toate"
}

function frameworkLabel(fw: FrameworkFilter): string {
  const labels: Record<FrameworkFilter, string> = {
    toate: "General", gdpr: "GDPR", nis2: "NIS2", "ai-act": "AI Act", furnizori: "Furnizori",
  }
  return labels[fw]
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `${days}z`
  return `${Math.floor(days / 30)}l`
}

function getFindingReviewBadge(
  finding: ScanFinding
): { label: string; variant: "default" | "warning" | "secondary" | "success" } {
  if (finding.findingStatus === "resolved") {
    return { label: "Rezolvat", variant: "success" }
  }
  if (finding.findingStatus === "dismissed") {
    return { label: "Respins", variant: "secondary" }
  }
  if (finding.findingStatus === "confirmed") {
    return { label: "Confirmat", variant: "default" }
  }
  if (finding.requiresHumanReview) {
    return { label: "De revizuit", variant: "warning" }
  }
  if (finding.resolution) {
    return { label: "În remediere", variant: "default" }
  }
  return { label: "Detectat", variant: "warning" }
}

// ── Resolution Layer (inline) ─────────────────────────────────────────────────

const RESOLUTION_STEPS: Array<{ key: keyof FindingResolution; label: string }> = [
  { key: "problem",         label: "Problemă detectată" },
  { key: "impact",          label: "Impact" },
  { key: "action",          label: "Acțiune recomandată" },
  { key: "generatedAsset",  label: "Asset generat" },
  { key: "humanStep",       label: "Pas uman obligatoriu" },
  { key: "closureEvidence", label: "Dovadă de închidere" },
  { key: "revalidation",    label: "Revalidare" },
]

function ResolutionLayer({ finding }: { finding: ScanFinding }) {
  const res = finding.resolution
  const activeIdx = res ? RESOLUTION_STEPS.findIndex((s) => !res[s.key]) : 0
  const currentStep = activeIdx === -1 ? RESOLUTION_STEPS.length : activeIdx

  return (
    <div className="border-t border-eos-border-subtle px-5 py-5">
      <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.06em] text-eos-text-tertiary">
        Resolution Layer{finding.legalReference ? ` · ${finding.legalReference}` : ""}
      </p>
      <div className="space-y-4">
        {RESOLUTION_STEPS.map((step, idx) => {
          const isDone = idx < currentStep
          const isActive = idx === currentStep
          const text = (res?.[step.key] as string | undefined)
            ?? (isActive ? (finding.remediationHint ?? finding.detail) : undefined)
          return (
            <div key={step.key} className="flex gap-3.5">
              <div className="flex w-6 flex-col items-center">
                <div
                  className={[
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                    isDone
                      ? "border border-eos-success/40 bg-eos-success-soft text-eos-success"
                      : isActive
                        ? "border border-eos-border-strong bg-eos-bg-inset text-eos-text shadow-[0_0_0_3px_hsl(145_60%_48%/0.15)]"
                        : "border border-eos-border-subtle bg-eos-bg-inset text-eos-text-muted",
                  ].join(" ")}
                >
                  {isDone ? "✓" : idx + 1}
                </div>
                {idx < RESOLUTION_STEPS.length - 1 && (
                  <div className="mt-1 w-px flex-1 bg-eos-border-subtle" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className={["mb-0.5 text-[11px] font-semibold", isDone ? "text-eos-success" : isActive ? "text-eos-text-tertiary" : "text-eos-text-muted"].join(" ")}>
                  {step.label}
                </p>
                <p className={["text-sm leading-relaxed", isDone ? "text-eos-text-muted" : isActive ? "text-eos-text" : "text-eos-text-muted"].join(" ")}>
                  {text ?? "—"}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Finding Row ───────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: ScanFinding }) {
  const [expanded, setExpanded] = useState(false)
  const fw = frameworkFromLegal(finding.legalReference)
  const age = ageLabel(finding.createdAtISO)
  const reviewBadge = getFindingReviewBadge(finding)

  return (
    <div className={["overflow-hidden rounded-eos-md border transition-colors duration-150", expanded ? "border-eos-border-default" : "border-eos-border-subtle", "bg-eos-surface"].join(" ")}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
        aria-expanded={expanded}
      >
        <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
        <p className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-eos-text">
          {finding.title}
        </p>
        {fw !== "toate" && (
          <Badge variant="secondary" className="normal-case tracking-normal shrink-0">
            {frameworkLabel(fw)}
          </Badge>
        )}
        <span className="shrink-0 text-[11px] text-eos-text-muted">{age}</span>
        <Badge variant={reviewBadge.variant} className="normal-case tracking-normal shrink-0">
          {reviewBadge.label}
        </Badge>
        {expanded
          ? <ChevronDown className="size-3 shrink-0 text-eos-text-muted" strokeWidth={2} />
          : <ChevronRight className="size-3 shrink-0 text-eos-text-muted" strokeWidth={2} />
        }
      </button>
      {expanded && (
        <>
          <ResolutionLayer finding={finding} />
          <div className="border-t border-eos-border-subtle px-5 py-3">
            <Link
              href={`/dashboard/resolve/${finding.id}`}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
            >
              Deschide detalii complete
              <ArrowRight className="size-3" strokeWidth={2} />
            </Link>
          </div>
        </>
      )}
    </div>
  )
}

// ── Finding Queue with framework filter ──────────────────────────────────────

function FindingQueue({ findings, soloMode }: { findings: ScanFinding[]; soloMode: boolean }) {
  const [activeFilter, setActiveFilter] = useState<FrameworkFilter>("toate")

  const filterTabs: Array<{ id: FrameworkFilter; label: string }> = [
    { id: "toate",     label: "Toate" },
    { id: "gdpr",      label: "GDPR" },
    { id: "nis2",      label: "NIS2" },
    { id: "ai-act",    label: "AI Act" },
    { id: "furnizori", label: "Furnizori" },
  ]

  const counts: Record<FrameworkFilter, number> = {
    toate: findings.length,
    gdpr:      findings.filter((f) => frameworkFromLegal(f.legalReference) === "gdpr").length,
    nis2:      findings.filter((f) => frameworkFromLegal(f.legalReference) === "nis2").length,
    "ai-act":  findings.filter((f) => frameworkFromLegal(f.legalReference) === "ai-act").length,
    furnizori: findings.filter((f) => frameworkFromLegal(f.legalReference) === "furnizori").length,
  }

  const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const filtered = findings
    .filter((f) => activeFilter === "toate" || frameworkFromLegal(f.legalReference) === activeFilter)
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 4) - (SEVERITY_RANK[b.severity] ?? 4))

  return (
    <div>
      {soloMode ? (
        <div className="mb-4 flex items-center justify-between rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3">
          <div>
            <p className="text-sm font-medium text-eos-text">Prioritatea de azi</p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Findings și task-uri în aceeași listă, fără filtre complexe pe framework.
            </p>
          </div>
          <Badge variant="outline" className="normal-case tracking-normal">
            {filtered.length} deschise
          </Badge>
        </div>
      ) : (
        <div className="mb-4 flex border-b border-eos-border-subtle">
          {filterTabs.map((tab) => {
            const active = activeFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={[
                  "border-b-2 px-4 py-3 text-sm font-medium transition-colors duration-150",
                  active
                    ? "border-eos-primary text-eos-text"
                    : "border-transparent text-eos-text-muted hover:text-eos-text",
                ].join(" ")}
              >
                {tab.label}
                {counts[tab.id] > 0 && (
                  <span
                    className={[
                      "ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]",
                      active ? "bg-eos-primary-soft text-eos-primary" : "bg-eos-bg-inset text-eos-text-muted",
                    ].join(" ")}
                  >
                    {counts[tab.id]}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          label={findings.length === 0
            ? "Nu există finding-uri. Rulează o scanare pentru a detecta probleme."
            : "Nu există finding-uri în această categorie."}
          className="border-eos-border bg-eos-surface-variant"
        />
      ) : (
        <div className="space-y-2" aria-live="polite">
          {filtered.map((f) => <FindingRow key={f.id} finding={f} />)}
        </div>
      )}
    </div>
  )
}

// ── Urgency Items (cross-module: DSAR + NIS2 + Vendor) ───────────────────────

const URGENCY_REFRESH_MS = 5 * 60 * 1000

function useUrgencyItems() {
  const [items, setItems] = useState<UrgencyItem[]>([])
  useEffect(() => {
    const fetch_ = () => {
      fetch("/api/dashboard/urgency")
        .then((r) => r.ok ? r.json() : { items: [] })
        .then((d) => setItems(d.items ?? []))
        .catch(() => {})
    }
    fetch_()
    const id = setInterval(fetch_, URGENCY_REFRESH_MS)
    return () => clearInterval(id)
  }, [])
  return items
}

const SOURCE_LABELS: Record<UrgencyItem["source"], string> = {
  dsar: "DSAR",
  nis2: "NIS2",
  vendor: "Vendor",
}

function UrgentItemsSection({ items }: { items: UrgencyItem[] }) {
  if (items.length === 0) return null
  const critical = items.filter((i) => i.severity === "critical")
  const rest = items.filter((i) => i.severity !== "critical")

  return (
    <section aria-label="Urgențe cu deadline" className="space-y-2">
      <div className="flex items-center gap-2">
        <AlertTriangle className="size-4 text-red-500" strokeWidth={2} />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eos-text-muted">
          Urgențe cu deadline — {items.length} active
        </p>
      </div>
      <div className="divide-y divide-eos-border rounded-eos-md border border-eos-border bg-eos-surface">
        {[...critical, ...rest].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-eos-surface-variant"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  item.severity === "critical" ? "bg-red-100 text-red-700"
                  : item.severity === "high" ? "bg-amber-100 text-amber-700"
                  : "bg-blue-100 text-blue-700"
                }`}>
                  {SOURCE_LABELS[item.source]}
                </span>
                <p className="truncate text-sm font-medium text-eos-text">{item.title}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-eos-text-muted">
                {item.daysLeft !== undefined && (
                  <span className={`flex items-center gap-1 ${item.daysLeft < 0 ? "text-red-600 font-medium" : item.daysLeft <= 3 ? "text-red-500" : ""}`}>
                    <Clock className="size-3" strokeWidth={2} />
                    {item.daysLeft < 0 ? `Depășit cu ${Math.abs(item.daysLeft)}z` : `${item.daysLeft}z rămase`}
                  </span>
                )}
                <span>{item.detail}</span>
              </div>
            </div>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
          </Link>
        ))}
      </div>
    </section>
  )
}

// ── Page Surface ─────────────────────────────────────────────────────────────

export function ResolvePageSurface() {
  const runtime = useDashboardRuntime()
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")
  const urgencyItems = useUrgencyItems()

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const findings = cockpit.data.state.findings
  const criticalCount = findings.filter((f) => f.severity === "critical").length
  const highCount = findings.filter((f) => f.severity === "high").length
  const mediumCount = findings.filter((f) => f.severity === "medium").length
  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const isSolo = runtime?.userMode === "solo"

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="De rezolvat"
        title={isSolo ? `De rezolvat · ${findings.length} urgente` : `De rezolvat · ${findings.length} deschise`}
        description={
          isSolo
            ? "Aici vezi simplificat ce trebuie rezolvat acum: findings și task-uri într-un singur flux, fără filtre complexe."
            : "Tot ce necesită acțiune umană — finding-uri, drift și remediere. Un singur loc, indiferent de framework."
        }
        badges={
          <>
            {urgencyItems.length > 0 && (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {urgencyItems.length} deadline{urgencyItems.length > 1 ? "s" : ""}
              </Badge>
            )}
            {criticalCount > 0 && (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {criticalCount} critice
              </Badge>
            )}
            {highCount > 0 && (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {highCount} ridicate
              </Badge>
            )}
            {mediumCount > 0 && (
              <Badge variant="warning" className="normal-case tracking-normal">
                {mediumCount} medii
              </Badge>
            )}
          </>
        }
      />

      {/* Cross-module urgency: DSAR deadlines + NIS2 incidents + Vendor overdue */}
      <UrgentItemsSection items={urgencyItems} />

      {/* Primary: Finding Queue with framework filter tabs */}
      <section aria-label="Finding-uri de rezolvat">
      <FindingQueue findings={findings} soloMode={isSolo} />
      </section>

      {/* Secondary: Task board — under disclosure, not competing */}
      {cockpit.tasks.length > 0 && (
        <details className="group">
          <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-4 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
            <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
            Board de task-uri · {openTasks.length} deschise
          </summary>
          <div className="mt-4">
            <RemediationBoard
              tasks={cockpit.tasks}
              activeFilter={taskFilter}
              onFilterChange={setTaskFilter}
              onMarkDone={cockpitActions.handleMarkDone}
              onAttachEvidence={cockpitActions.attachEvidence}
              onExport={cockpitActions.handleTaskExport}
            />
          </div>
        </details>
      )}
    </div>
  )
}
