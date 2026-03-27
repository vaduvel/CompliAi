"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, Clock, Search } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import type { ScanFinding } from "@/lib/compliance/types"
import type { UrgencyItem } from "@/app/api/dashboard/urgency/route"
import {
  isFindingActive,
} from "@/lib/compliscan/finding-cockpit"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

type TaskFilter = "ALL" | TaskPriority | "DONE" | "RAPID" | "STRUCTURAL" | "L1" | "L2" | "L3"
type FrameworkFilter = "toate" | "gdpr" | "nis2" | "ai-act" | "furnizori"
type SeverityFilter = "toate" | "critical" | "high" | "medium" | "low"
type FindingStatusFilter = "active" | "all"

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

  switch (recipe.uiState) {
    case "ready_to_generate":
      return { label: recipe.collapsedStatusLabel, variant: "default" }
    case "evidence_uploaded":
    case "rechecking":
      return { label: recipe.collapsedStatusLabel, variant: "default" }
    case "external_action_required":
    case "needs_revalidation":
    case "need_your_input":
      return { label: recipe.collapsedStatusLabel, variant: "warning" }
    case "resolved":
      return { label: recipe.collapsedStatusLabel, variant: "success" }
    case "false_positive":
      return { label: recipe.collapsedStatusLabel, variant: "secondary" }
    default:
      return { label: recipe.collapsedStatusLabel, variant: "outline" }
  }
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
      className="flex w-full items-center gap-3 overflow-hidden rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3.5 transition-colors hover:border-eos-border hover:bg-eos-surface-variant"
    >
      <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
      <div className="min-w-0 flex-1">
        <p className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-eos-text">
          {finding.title}
        </p>
        {recipe.whatUserMustDo && (
          <p className="mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap text-xs text-eos-text-muted">
            {recipe.whatUserMustDo}
          </p>
        )}
      </div>
      <Badge variant="secondary" className="hidden normal-case tracking-normal shrink-0 sm:inline-flex">
        {canonicalFrameworkLabel(recipe.framework)}
      </Badge>
      <Badge variant={flowStatus.variant} className="hidden normal-case tracking-normal shrink-0 lg:inline-flex">
        {flowStatus.label}
      </Badge>
      <span className="shrink-0 text-[11px] text-eos-text-muted">{ageLabel(finding.createdAtISO)}</span>
      <ArrowRight className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
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

  const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const filtered = findingsForStatus
    .filter((f) => activeFilter === "toate" || frameworkFromLegal(f.legalReference) === activeFilter)
    .filter((f) => severityFilter === "toate" || f.severity === severityFilter)
    .filter((f) => matchesFindingSearch(f, deferredQuery))
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 4) - (SEVERITY_RANK[b.severity] ?? 4))

  return (
    <div>
      <div className="mb-4 space-y-3 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium text-eos-text">
              {soloMode ? "Prioritatea de azi" : "Queue de finding-uri"}
            </p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Vezi rapid ce e deschis acum și intră în caz. Filtrele secundare rămân dedesubt.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                statusFilter === "active"
                  ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                  : "border-eos-border bg-eos-surface text-eos-text-muted hover:text-eos-text",
              ].join(" ")}
            >
              Deschise · {findings.filter((finding) => isFindingActive(finding)).length}
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={[
                "rounded-full border px-3 py-1.5 text-xs transition-colors",
                statusFilter === "all"
                  ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                  : "border-eos-border bg-eos-surface text-eos-text-muted hover:text-eos-text",
              ].join(" ")}
            >
              Toate · {findings.length}
            </button>
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2">
          <Search className="size-4 text-eos-text-muted" strokeWidth={2} />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Caută după titlu, sursă sau referință legală"
            className="w-full bg-transparent text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
          />
        </label>

        {soloMode ? (
          <div className="flex items-center justify-between rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
            <div>
              <p className="text-sm font-medium text-eos-text">Lucrezi pe ce e activ acum</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Lista rămâne simplă, dar poți restrânge severitatea sau căuta direct problema.
              </p>
            </div>
            <Badge variant="outline" className="normal-case tracking-normal">
              {filtered.length} vizibile
            </Badge>
          </div>
        ) : (
          <details className="group rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-eos-text">Filtre secundare</p>
                <p className="mt-1 text-xs text-eos-text-muted">
                  Severitate și framework doar când ai nevoie să restrângi lista.
                </p>
              </div>
              <Badge variant="outline" className="normal-case tracking-normal">
                Deschide
              </Badge>
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
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                          : "border-eos-border bg-eos-surface text-eos-text-muted hover:text-eos-text",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span className="ml-1.5 text-[11px] text-inherit">{severityCounts[tab.id]}</span>
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
                        "rounded-full border px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                          : "border-eos-border bg-eos-surface text-eos-text-muted hover:text-eos-text",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span className="ml-1.5 text-[11px] text-inherit">{counts[tab.id]}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </details>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          label={findings.length === 0
            ? "Nu există finding-uri. Rulează o scanare pentru a detecta probleme."
            : statusFilter === "active"
              ? "Nu există finding-uri active pentru filtrul curent. Poți afișa și pe cele închise."
              : "Nu există finding-uri care să se potrivească filtrelor curente."}
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

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="De rezolvat"
        title={isSolo ? `De rezolvat · ${activeFindings.length} urgente` : `De rezolvat · ${activeFindings.length} deschise`}
        description={
          isSolo
            ? "Aici vezi simplificat ce trebuie rezolvat acum și intri direct în caz."
            : "Inbox-ul de cazuri active. Alegi finding-ul și rezolvi totul din cockpitul lui."
        }
        badges={
          <>
            {urgencyItems.length > 0 && (
              <Badge variant="destructive" className="normal-case tracking-normal">
                {urgencyItems.length} deadline{urgencyItems.length > 1 ? "-uri" : ""}
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
            {openTasks.length > 0 && (
              <Link
                href={dashboardRoutes.resolveSupport}
                className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 text-[12px] font-medium text-eos-text transition-colors hover:bg-eos-bg-inset"
              >
                Task-uri de suport · {openTasks.length}
                <ArrowRight className="size-3" strokeWidth={2} />
              </Link>
            )}
          </>
        }
      />

      {/* Main execution queue */}
      <section aria-label="Finding-uri de rezolvat">
        <FindingQueue findings={findings} soloMode={isSolo} />
      </section>

      {urgencyItems.length > 0 ? (
        <details className="group rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                Deadline-uri și semnale conexe
              </p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Rămân dedesubt, ca să nu concureze cu inbox-ul principal de finding-uri.
              </p>
            </div>
            <Badge variant="outline" className="normal-case tracking-normal">
              {urgencyItems.length} active
            </Badge>
          </summary>
          <div className="mt-4">
            <UrgentItemsSection items={urgencyItems} />
          </div>
        </details>
      ) : null}
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
      <PageIntro
        eyebrow="Task-uri de suport"
        title={`Board separat · ${openTasks.length} deschise`}
        description="Aici stau doar task-urile auxiliare. Finding-ul și cockpitul lui rămân traseul principal pentru rezolvare, generare, dovadă și monitorizare."
        badges={
          <Badge variant="outline" className="normal-case tracking-normal">
            Board secundar
          </Badge>
        }
      />

      <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-eos-text">Nu concurează cu cockpitul</p>
            <p className="text-xs text-eos-text-muted">
              Când un task are caz asociat, intri în cockpitul finding-ului ca să generezi, atașezi dovada și închizi cu urmă clară.
            </p>
          </div>
          <Link
            href={dashboardRoutes.resolve}
            className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-xs font-medium text-eos-text transition-colors hover:bg-eos-bg-inset"
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
