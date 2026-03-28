"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, Clock, Search } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import type { ScanFinding } from "@/lib/compliance/types"
import { describeFindingRiskForTriage, sortFindingsForTriage } from "@/lib/compliscan/finding-triage"
import type { UrgencyItem } from "@/app/api/dashboard/urgency/route"
import {
  isFindingActive,
} from "@/lib/compliscan/finding-cockpit"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { APPLICABILITY_TAG_LABELS } from "@/lib/compliance/applicability"
import type { ApplicabilityTag } from "@/lib/compliance/applicability"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL" | "L1" | "L2" | "L3"
type FrameworkFilter = "toate" | "gdpr" | "nis2" | "ai-act" | "furnizori"
type SeverityFilter = "toate" | "critical" | "high" | "medium" | "low"
type FindingStatusFilter = "active" | "all"

const TAG_TO_FRAMEWORK: Partial<Record<ApplicabilityTag, FrameworkFilter>> = {
  gdpr: "gdpr",
  nis2: "nis2",
  "ai-act": "ai-act",
  efactura: "furnizori",
}

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

function canonicalFrameworkLabel(framework: ReturnType<typeof buildCockpitRecipe>["framework"]) {
  const labels: Record<ReturnType<typeof buildCockpitRecipe>["framework"], string> = {
    GDPR: "GDPR",
    NIS2: "NIS2",
    eFactura: "eFactura",
    "AI Act": "AI Act",
    Cross: "Transversal",
  }

  return labels[framework]
}

function matchesFindingSearch(finding: ScanFinding, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return true

  const haystack = [
    finding.title,
    finding.detail,
    finding.remediationHint,
    finding.legalReference,
    finding.sourceDocument,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `${days}z`
  return `${Math.floor(days / 30)}l`
}

function compactRiskSummary(text: string) {
  if (text.length <= 108) return text
  const shortened = text.slice(0, 108).trimEnd()
  const lastSpace = shortened.lastIndexOf(" ")
  return `${(lastSpace > 52 ? shortened.slice(0, lastSpace) : shortened).trimEnd()}…`
}

function getExecutionClassLabel(recipe: ReturnType<typeof buildCockpitRecipe>) {
  switch (recipe.executionClass) {
    case "documentary":
      return "Document"
    case "specialist_handoff":
      return "Asistat"
    default:
      return "Acțiune"
  }
}

function getFindingRiskLine(
  finding: ScanFinding,
  recipe: ReturnType<typeof buildCockpitRecipe>
) {
  return compactRiskSummary(recipe.whatUserSees || describeFindingRiskForTriage(finding))
}

function getResolveNextActionLine(findings: ScanFinding[]) {
  const firstFinding = sortFindingsForTriage(findings.filter(isFindingActive))[0]
  if (!firstFinding) return "Nu ai un caz deschis. Rulezi o scanare nouă sau verifici Dosarul."

  const recipe = buildCockpitRecipe(firstFinding)
  switch (recipe.executionClass) {
    case "documentary":
      return "Intri în primul caz și generezi documentul de rezolvare."
    case "specialist_handoff":
      return "Intri în primul caz și pornești flow-ul asistat, cu revenire în cockpit."
    default:
      return "Intri în primul caz, faci acțiunea reală și lași dovada în același cockpit."
  }
}


function getRecipeRowBadge(
  finding: ScanFinding,
  recipe: ReturnType<typeof buildCockpitRecipe>
): { label: string; variant: "default" | "warning" | "secondary" | "success" | "destructive" | "outline" } {
  if (finding.findingStatus === "under_monitoring") {
    return { label: "Monitorizat", variant: "success" }
  }
  if (finding.findingStatus === "dismissed") {
    return { label: "Marcat nevalid", variant: "secondary" }
  }

  return { label: getExecutionClassLabel(recipe), variant: "outline" }
}

// ── Finding Row ───────────────────────────────────────────────────────────────

function FindingRow({ finding }: { finding: ScanFinding }) {
  const recipe = buildCockpitRecipe(finding)
  const flowStatus = getRecipeRowBadge(finding, recipe)
  const hasGenerator = recipe.visibleBlocks.detailBlocks.includes("generator")
  const cockpitHref = hasGenerator
    ? `/dashboard/resolve/${finding.id}?generator=1`
    : `/dashboard/resolve/${finding.id}`

  return (
    <Link
      href={cockpitHref}
      className="flex w-full items-center gap-3 overflow-hidden rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3.5 transition-all hover:border-white/[0.11] hover:bg-eos-surface-variant"
    >
      <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
      <div className="min-w-0 flex-1">
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-eos-text">
          {finding.title}
        </p>
        <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-eos-text-tertiary">
          {getFindingRiskLine(finding, recipe)}
        </p>
      </div>
      <span className="hidden shrink-0 rounded-full bg-eos-surface-elevated px-2.5 py-0.5 text-[11px] font-medium text-eos-text-tertiary sm:inline-flex">
        {canonicalFrameworkLabel(recipe.framework)}
      </span>
      <span className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold lg:inline-flex ${
        flowStatus.variant === "success" ? "bg-eos-success-soft text-eos-success" :
        flowStatus.variant === "warning" ? "bg-eos-warning-soft text-eos-warning" :
        flowStatus.variant === "destructive" ? "bg-eos-error-soft text-eos-error" :
        "bg-eos-surface-active text-eos-text-tertiary"
      }`}>
        {flowStatus.label}
      </span>
      <span className="shrink-0 text-[11px] text-eos-text-tertiary">{ageLabel(finding.createdAtISO)}</span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
    </Link>
  )
}

// ── Finding Queue with framework filter ──────────────────────────────────────

function FindingQueue({ findings, soloMode }: { findings: ScanFinding[]; soloMode: boolean }) {
  const [activeFilter, setActiveFilter] = useState<FrameworkFilter>("toate")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("toate")
  const [statusFilter, setStatusFilter] = useState<FindingStatusFilter>("active")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

  const filterTabs: Array<{ id: FrameworkFilter; label: string }> = [
    { id: "toate",     label: "Toate" },
    { id: "gdpr",      label: "GDPR" },
    { id: "nis2",      label: "NIS2" },
    { id: "ai-act",    label: "AI Act" },
    { id: "furnizori", label: "Furnizori" },
  ]

  const severityTabs: Array<{ id: SeverityFilter; label: string }> = [
    { id: "toate", label: "Toate severitățile" },
    { id: "critical", label: "Critice" },
    { id: "high", label: "Ridicate" },
    { id: "medium", label: "Medii" },
    { id: "low", label: "Scăzute" },
  ]

  const findingsForStatus = findings.filter((finding) =>
    statusFilter === "all" ? true : isFindingActive(finding)
  )

  const counts: Record<FrameworkFilter, number> = {
    toate: findingsForStatus.length,
    gdpr:      findingsForStatus.filter((f) => frameworkFromLegal(f.legalReference) === "gdpr").length,
    nis2:      findingsForStatus.filter((f) => frameworkFromLegal(f.legalReference) === "nis2").length,
    "ai-act":  findingsForStatus.filter((f) => frameworkFromLegal(f.legalReference) === "ai-act").length,
    furnizori: findingsForStatus.filter((f) => frameworkFromLegal(f.legalReference) === "furnizori").length,
  }

  const severityCounts: Record<SeverityFilter, number> = {
    toate: findingsForStatus.length,
    critical: findingsForStatus.filter((f) => f.severity === "critical").length,
    high: findingsForStatus.filter((f) => f.severity === "high").length,
    medium: findingsForStatus.filter((f) => f.severity === "medium").length,
    low: findingsForStatus.filter((f) => f.severity === "low").length,
  }

  const filtered = sortFindingsForTriage(
    findingsForStatus
    .filter((f) => activeFilter === "toate" || frameworkFromLegal(f.legalReference) === activeFilter)
    .filter((f) => severityFilter === "toate" || f.severity === severityFilter)
    .filter((f) => matchesFindingSearch(f, deferredQuery))
  )

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-eos-xl border border-eos-border bg-eos-surface-variant px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold text-eos-text-muted">
              {soloMode ? "Prioritatea de azi" : "Queue de finding-uri"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === "active"
                  ? "border-blue-500/30 bg-blue-500/10 text-eos-primary"
                  : "border-eos-border bg-eos-surface-variant text-eos-text-tertiary hover:text-eos-text-muted",
              ].join(" ")}
            >
              Deschise · {findings.filter(isFindingActive).length}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                statusFilter === "all"
                  ? "border-blue-500/30 bg-blue-500/10 text-eos-primary"
                  : "border-eos-border bg-eos-surface-variant text-eos-text-tertiary hover:text-eos-text-muted",
              ].join(" ")}
            >
              Toate · {findings.length}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-3 py-2.5">
          <Search className="h-4 w-4 text-eos-text-tertiary" strokeWidth={2} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după titlu, sursă sau referință legală"
            className="w-full bg-transparent text-sm text-eos-text-muted outline-none placeholder:text-eos-text-tertiary"
          />
        </label>

        {soloMode ? (
          <div className="flex items-center justify-between rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
            <p className="text-sm text-eos-text-muted">Lucrezi pe ce e activ acum</p>
            <span className="rounded-full border border-eos-border px-2.5 py-0.5 text-[11px] text-eos-text-tertiary">
              {filtered.length} vizibile
            </span>
          </div>
        ) : (
          <details className="group rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <p className="text-sm font-medium text-eos-text-muted">Filtre secundare</p>
              <span className="rounded-full border border-eos-border px-2.5 py-0.5 text-[11px] text-eos-text-tertiary">Deschide</span>
            </summary>
            <div className="mt-4 space-y-4 border-t border-eos-border-subtle pt-4">
              <div className="flex flex-wrap gap-2">
                {severityTabs.map((tab) => {
                  const active = severityFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSeverityFilter(tab.id)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        active
                          ? "border-blue-500/30 bg-blue-500/10 text-eos-primary"
                          : "border-eos-border bg-eos-surface-variant text-eos-text-tertiary hover:text-eos-text-muted",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span className="ml-1.5">{severityCounts[tab.id]}</span>
                    </button>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2">
                {filterTabs.map((tab) => {
                  const active = activeFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveFilter(tab.id)}
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-all",
                        active
                          ? "border-blue-500/30 bg-blue-500/10 text-eos-primary"
                          : "border-eos-border bg-eos-surface-variant text-eos-text-tertiary hover:text-eos-text-muted",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span className="ml-1.5">{counts[tab.id]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </details>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-10 text-center">
          <p className="text-sm text-eos-text-tertiary">
            {findings.length === 0
              ? "Nu există finding-uri. Rulează o scanare pentru a detecta probleme."
              : statusFilter === "active"
                ? "Nu există finding-uri active pentru filtrul curent."
                : "Nu există finding-uri care să se potrivească filtrelor."}
          </p>
        </div>
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
        <AlertTriangle className="size-4 text-eos-error" strokeWidth={2} />
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-eos-text-tertiary">
          Urgențe cu deadline — {items.length} active
        </p>
      </div>
      <div className="divide-y divide-eos-border-subtle rounded-eos-lg border border-eos-border bg-eos-surface-variant">
        {[...critical, ...rest].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-eos-surface-variant"
          >
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  item.severity === "critical" ? "bg-eos-error-soft text-eos-error"
                  : item.severity === "high" ? "bg-eos-warning-soft text-eos-warning"
                  : "bg-eos-primary-soft text-eos-primary"
                }`}>
                  {SOURCE_LABELS[item.source]}
                </span>
                <p className="truncate text-sm font-medium text-eos-text">{item.title}</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-eos-text-tertiary">
                {item.daysLeft !== undefined && (
                  <span className={`flex items-center gap-1 ${item.daysLeft < 0 ? "text-eos-error font-medium" : item.daysLeft <= 3 ? "text-eos-error" : ""}`}>
                    <Clock className="size-3" strokeWidth={2} />
                    {item.daysLeft < 0 ? `Depășit cu ${Math.abs(item.daysLeft)}z` : `${item.daysLeft}z rămase`}
                  </span>
                )}
                <span>{item.detail}</span>
              </div>
            </div>
            <ArrowRight className="mt-0.5 size-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
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
  const urgencyItems = useUrgencyItems()

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const findings = cockpit.data.state.findings
  const activeFindings = findings.filter((finding) => isFindingActive(finding))
  const criticalCount = activeFindings.filter((f) => f.severity === "critical").length
  const highCount = activeFindings.filter((f) => f.severity === "high").length
  const mediumCount = activeFindings.filter((f) => f.severity === "medium").length
  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const isSolo = runtime?.userMode === "solo"
  const applicabilityEntries = (cockpit.data.state.applicability?.entries ?? []).filter(
    (entry) => entry.certainty !== "unlikely" && TAG_TO_FRAMEWORK[entry.tag]
  )
  const applicabilityLabels =
    applicabilityEntries.length > 0
      ? applicabilityEntries.map((entry) => APPLICABILITY_TAG_LABELS[entry.tag]).join(" · ")
      : "Se completează după primul snapshot"
  const foundSummary =
    activeFindings.length === 0
      ? "Nicio problemă activă în acest moment."
      : `${activeFindings.length} cazuri deschise · ${criticalCount} critice · ${highCount} ridicate`
  const nextActionLine = getResolveNextActionLine(findings)

  return (
    <div className="space-y-6">
      <section
        aria-label="Snapshot scurt după onboarding"
        className="grid gap-3 rounded-eos-xl border border-eos-border bg-eos-surface-variant p-4 md:grid-cols-3"
      >
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Se aplică</p>
          <p className="mt-1 text-sm text-eos-text">{applicabilityLabels}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Am găsit</p>
          <p className="mt-1 text-sm text-eos-text">{foundSummary}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-eos-text-tertiary">Acum faci asta</p>
          <p className="mt-1 text-sm text-eos-text">{nextActionLine}</p>
        </div>
      </section>

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">De rezolvat</p>
        <h1 className="mt-1.5 text-2xl font-bold text-eos-text">
          {isSolo ? `${activeFindings.length} urgente de rezolvat` : `${activeFindings.length} cazuri deschise`}
        </h1>
        <p className="mt-1 text-sm text-eos-text-tertiary">
          {isSolo
            ? "Aici vezi simplificat ce trebuie rezolvat acum și intri direct în caz."
            : "Inbox-ul de cazuri active. Alegi finding-ul și rezolvi totul din cockpitul lui."}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {urgencyItems.length > 0 && (
            <span className="rounded-full bg-eos-error-soft px-3 py-1 text-xs font-semibold text-eos-error">
              {urgencyItems.length} deadline{urgencyItems.length > 1 ? "-uri" : ""}
            </span>
          )}
          {criticalCount > 0 && (
            <span className="rounded-full bg-eos-error-soft px-3 py-1 text-xs font-semibold text-eos-error">
              {criticalCount} critice
            </span>
          )}
          {highCount > 0 && (
            <span className="rounded-full bg-eos-warning-soft px-3 py-1 text-xs font-semibold text-eos-warning">
              {highCount} ridicate
            </span>
          )}
          {mediumCount > 0 && (
            <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400/70">
              {mediumCount} medii
            </span>
          )}
          {openTasks.length > 0 && (
            <Link
              href={dashboardRoutes.resolveSupport}
              className="inline-flex items-center gap-1.5 rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-muted transition-colors hover:text-eos-text-muted"
            >
              Task-uri de suport · {openTasks.length}
              <ArrowRight className="h-3 w-3" strokeWidth={2} />
            </Link>
          )}
        </div>
      </div>

      {/* Main execution queue */}
      <section aria-label="Finding-uri de rezolvat">
        <FindingQueue findings={findings} soloMode={isSolo} />
      </section>

      {urgencyItems.length > 0 && (
        <details className="group rounded-eos-xl border border-eos-border bg-eos-surface-variant px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                Deadline-uri și semnale conexe
              </p>
              <p className="mt-1 text-sm text-eos-text-tertiary">
                Rămân dedesubt, ca să nu concureze cu inbox-ul principal de finding-uri.
              </p>
            </div>
            <span className="rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-tertiary">
              {urgencyItems.length} active
            </span>
          </summary>
          <div className="mt-4">
            <UrgentItemsSection items={urgencyItems} />
          </div>
        </details>
      )}
    </div>
  )
}

export function ResolveSupportPageSurface() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const findings = cockpit.data.state.findings
  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-eos-text-tertiary">Task-uri de suport</p>
        <h1 className="mt-1.5 text-2xl font-bold text-eos-text">
          Board separat · {openTasks.length} deschise
        </h1>
        <p className="mt-1 text-sm text-eos-text-tertiary">
          Aici stau doar task-urile auxiliare. Finding-ul și cockpitul lui rămân traseul principal pentru rezolvare, generare, dovadă și monitorizare.
        </p>
        <div className="mt-3">
          <span className="rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-tertiary">
            Board secundar
          </span>
        </div>
      </div>

      <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-eos-text-muted">Nu concurează cu cockpitul</p>
            <p className="text-xs text-eos-text-tertiary">
              Când un task are caz asociat, intri în cockpitul finding-ului ca să generezi, atașezi dovada și închizi cu urmă clară.
            </p>
          </div>
          <Link
            href={dashboardRoutes.resolve}
            className="inline-flex items-center gap-1.5 rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 py-2 text-xs font-medium text-eos-text-muted transition-colors hover:text-eos-text-muted"
          >
            Înapoi la De rezolvat
            <ArrowRight className="size-3" strokeWidth={2} />
          </Link>
        </div>
      </div>

      <RemediationBoard
        tasks={cockpit.tasks}
        findings={findings}
        activeFilter={taskFilter}
        onFilterChange={setTaskFilter}
        onMarkDone={cockpitActions.handleMarkDone}
        onAttachEvidence={cockpitActions.attachEvidence}
        onExport={cockpitActions.handleTaskExport}
      />
    </div>
  )
}
