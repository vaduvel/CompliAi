"use client"

import Link from "next/link"
import { useDeferredValue, useEffect, useState } from "react"
import { AlertTriangle, ArrowRight, Bell, Bot, CalendarClock, ChevronRight, Clock, Cpu, FileSearch, Shield } from "lucide-react"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import {
  V3FilterBar,
  V3FindingRow,
  V3FrameworkTag,
  V3KpiStrip,
  V3PageHero,
  V3Panel,
  V3RiskPill,
  type V3FilterTab,
  type V3KpiItem,
  type V3SeverityTone,
} from "@/components/compliscan/v3"
import type { ScanFinding } from "@/lib/compliance/types"
import { describeFindingRiskForTriage, sortFindingsForTriage } from "@/lib/compliscan/finding-triage"
import type { UrgencyItem } from "@/app/api/dashboard/urgency/route"
import {
  isFindingActive,
} from "@/lib/compliscan/finding-cockpit"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { dashboardFindingRoute, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
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
    "Codul Muncii": "Codul Muncii",
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

// ── Finding Row (V3) ──────────────────────────────────────────────────────────

function severityToTone(sev: ScanFinding["severity"]): V3SeverityTone {
  if (sev === "critical") return "critical"
  if (sev === "high") return "high"
  if (sev === "medium") return "medium"
  return "low"
}

function severityLabelRo(sev: ScanFinding["severity"]) {
  return sev === "critical" ? "Critic" : sev === "high" ? "Ridicat" : sev === "medium" ? "Mediu" : "Scăzut"
}

function FindingRow({ finding }: { finding: ScanFinding }) {
  const recipe = buildCockpitRecipe(finding)
  const flowStatus = getRecipeRowBadge(finding, recipe)
  const hasGenerator = recipe.visibleBlocks.detailBlocks.includes("generator")
  const cockpitHref = dashboardFindingRoute(finding.id, hasGenerator ? { generator: "1" } : undefined)

  const tone = severityToTone(finding.severity)
  const riskLine = getFindingRiskLine(finding, recipe)

  return (
    <V3FindingRow
      href={cockpitHref}
      severity={tone}
      title={finding.title}
      subtitle={riskLine}
      meta={
        <>
          <span>{ageLabel(finding.createdAtISO)}</span>
          {finding.sourceDocument && (
            <>
              <span className="text-white/10">·</span>
              <span className="truncate">Sursă: {finding.sourceDocument}</span>
            </>
          )}
        </>
      }
      badges={
        <>
          <V3RiskPill tone={tone}>{severityLabelRo(finding.severity)}</V3RiskPill>
          <V3FrameworkTag label={canonicalFrameworkLabel(recipe.framework)} tone="neutral" />
          <V3FrameworkTag
            label={flowStatus.label}
            tone={
              flowStatus.variant === "success"
                ? "ok"
                : flowStatus.variant === "warning"
                  ? "high"
                  : flowStatus.variant === "destructive"
                    ? "critical"
                    : "neutral"
            }
          />
        </>
      }
      ctaLabel="Deschide cockpit"
    />
  )
}

// ── Finding Queue with framework filter ──────────────────────────────────────

function FindingQueue({ findings, soloMode }: { findings: ScanFinding[]; soloMode: boolean }) {
  const [activeFilter, setActiveFilter] = useState<FrameworkFilter>("toate")
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("toate")
  const [statusFilter, setStatusFilter] = useState<FindingStatusFilter>("active")
  const [query, setQuery] = useState("")
  const deferredQuery = useDeferredValue(query)

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

  const frameworkTabs: V3FilterTab<FrameworkFilter>[] = [
    { id: "toate",     label: "Toate",     count: counts["toate"] },
    { id: "gdpr",      label: "GDPR",      count: counts["gdpr"] },
    { id: "nis2",      label: "NIS2",      count: counts["nis2"] },
    { id: "ai-act",    label: "AI Act",    count: counts["ai-act"] },
    { id: "furnizori", label: "Furnizori", count: counts["furnizori"] },
  ]

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        <V3FilterBar
          tabs={frameworkTabs}
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Caută după titlu, sursă sau referință legală"
          rightSlot={
            filtered.length < findingsForStatus.length ? (
              <span className="font-mono text-[10px] tabular-nums text-eos-text-tertiary">
                {filtered.length} din {findingsForStatus.length}
              </span>
            ) : undefined
          }
        />
        <div className="flex flex-wrap items-center gap-2 border-t border-eos-border-subtle bg-eos-surface/80 px-3 py-2 md:px-4">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Status
          </span>
          <div className="flex gap-1 rounded-eos-sm bg-white/[0.03] p-0.5">
            {[
              { id: "active" as FindingStatusFilter, label: "Deschise", count: findings.filter(isFindingActive).length },
              { id: "all" as FindingStatusFilter, label: "Toate", count: findings.length },
            ].map((tab) => {
              const active = statusFilter === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={[
                    "flex items-center gap-1.5 rounded-eos-sm px-2.5 py-1 text-[12px] font-medium transition-all duration-100",
                    active
                      ? "bg-white/[0.06] font-semibold text-eos-text"
                      : "text-eos-text-muted hover:text-eos-text",
                  ].join(" ")}
                >
                  {tab.label}
                  <span className={`font-mono text-[10px] tabular-nums ${active ? "text-eos-text-muted" : "text-eos-text-tertiary"}`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>
          {!soloMode && (
            <>
              <span className="mx-1 h-4 w-px bg-eos-border-subtle" aria-hidden />
              <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Severitate
              </span>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: "toate" as SeverityFilter, label: "Toate" },
                    { id: "critical" as SeverityFilter, label: "Critice" },
                    { id: "high" as SeverityFilter, label: "Ridicate" },
                    { id: "medium" as SeverityFilter, label: "Medii" },
                    { id: "low" as SeverityFilter, label: "Scăzute" },
                  ]
                ).map((tab) => {
                  const active = severityFilter === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSeverityFilter(tab.id)}
                      className={[
                        "flex items-center gap-1.5 rounded-eos-sm border px-2 py-0.5 font-mono text-[11px] transition-colors duration-100",
                        active
                          ? "border-eos-primary/35 bg-eos-primary/10 text-eos-primary"
                          : "border-eos-border-subtle bg-transparent text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text",
                      ].join(" ")}
                    >
                      {tab.label}
                      <span className="tabular-nums opacity-70">{severityCounts[tab.id]}</span>
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-10 text-center">
          <p className="text-[13px] text-eos-text-tertiary">
            {findings.length === 0
              ? "Nu există constatări. Rulează o scanare pentru a detecta probleme."
              : statusFilter === "active"
                ? "Nu există constatări active pentru filtrul curent."
                : "Nu există constatări care să se potrivească filtrelor."}
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
      <div className="flex items-center gap-1.5">
        <AlertTriangle className="size-3 text-eos-error" strokeWidth={2} />
        <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Urgențe cu deadline — {items.length} active
        </p>
      </div>
      <div className="divide-y divide-eos-border-subtle overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
        {[...critical, ...rest].map((item) => {
          const stripeColor =
            item.severity === "critical"
              ? "bg-eos-error"
              : item.severity === "high"
                ? "bg-eos-warning"
                : "bg-eos-primary"
          return (
            <Link
              key={item.id}
              href={item.href}
              className="group relative flex items-start justify-between gap-3 py-2.5 pl-5 pr-3 transition-colors hover:bg-white/[0.02]"
            >
              <span className={`absolute left-0 top-2.5 bottom-2.5 w-[2px] rounded-r-sm ${stripeColor}`} aria-hidden />
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`inline-flex shrink-0 rounded-sm border px-1.5 py-px font-mono text-[10px] font-semibold uppercase tracking-[0.05em] ${
                      item.severity === "critical"
                        ? "border-eos-error/25 bg-eos-error-soft text-eos-error"
                        : item.severity === "high"
                          ? "border-eos-warning/25 bg-eos-warning-soft text-eos-warning"
                          : "border-eos-primary/25 bg-eos-primary/10 text-eos-primary"
                    }`}
                  >
                    {SOURCE_LABELS[item.source]}
                  </span>
                  <p className="truncate text-[13px] font-semibold text-eos-text">{item.title}</p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-eos-text-tertiary">
                  {item.daysLeft !== undefined && (
                    <span
                      className={`flex items-center gap-1 ${
                        item.daysLeft < 0 ? "font-semibold text-eos-error" : item.daysLeft <= 3 ? "text-eos-error" : ""
                      }`}
                    >
                      <Clock className="size-3" strokeWidth={2} />
                      {item.daysLeft < 0 ? `Depășit cu ${Math.abs(item.daysLeft)}z` : `${item.daysLeft}z rămase`}
                    </span>
                  )}
                  <span>{item.detail}</span>
                </div>
              </div>
              <ArrowRight className="mt-1 size-3.5 shrink-0 text-eos-text-tertiary transition-transform group-hover:translate-x-0.5" strokeWidth={2} />
            </Link>
          )
        })}
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

  const lowCount = activeFindings.length - criticalCount - highCount - mediumCount

  const severityKpis: V3KpiItem[] = [
    {
      id: "critical",
      label: "Critice",
      value: criticalCount,
      stripe: criticalCount > 0 ? "critical" : undefined,
      valueTone: criticalCount > 0 ? "critical" : "neutral",
      detail: criticalCount > 0 ? "necesită rezolvare imediată" : "fără critice deschise",
    },
    {
      id: "high",
      label: "Ridicate",
      value: highCount,
      stripe: highCount > 0 ? "warning" : undefined,
      valueTone: highCount > 0 ? "warning" : "neutral",
      detail: highCount > 0 ? "risc mare · <7 zile" : "fără alertă ridicată",
    },
    {
      id: "medium",
      label: "Medii",
      value: mediumCount,
      stripe: mediumCount > 0 ? "info" : undefined,
      valueTone: mediumCount > 0 ? "info" : "neutral",
      detail: mediumCount > 0 ? "de prioritizat săptămâna asta" : "nicio alertă medie",
    },
    {
      id: "low",
      label: "Scăzute",
      value: lowCount,
      valueTone: "neutral",
      detail: lowCount > 0 ? "în monitorizare" : "fără scăzute",
    },
    {
      id: "deadline",
      label: "Deadline-uri",
      value: urgencyItems.length,
      stripe: urgencyItems.length > 0 ? "critical" : undefined,
      valueTone: urgencyItems.length > 0 ? "critical" : "neutral",
      detail: urgencyItems.length > 0 ? "DSAR · NIS2 · Vendor" : "fără deadline activ",
    },
  ]

  return (
    <div className="space-y-5">
      <V3PageHero
        breadcrumbs={[
          { label: isSolo ? "Firma mea" : "Portofoliu" },
          { label: "Acțiuni", current: true },
        ]}
        title={isSolo ? `${activeFindings.length} urgente de rezolvat` : `${activeFindings.length} cazuri deschise`}
        description={
          <>
            {isSolo
              ? "Aici vezi simplificat ce trebuie rezolvat acum și intri direct în caz. "
              : "Inbox-ul de cazuri active. Alegi finding-ul și rezolvi totul din cockpit. "}
            <strong className="text-eos-text">{nextActionLine}</strong>
          </>
        }
        actions={
          <>
            {openTasks.length > 0 && (
              <Link
                href={dashboardRoutes.resolveSupport}
                className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 text-[12.5px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
              >
                Task-uri suport · {openTasks.length}
              </Link>
            )}
            <Link
              href={dashboardRoutes.scan}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm bg-eos-primary px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-primary-hover"
            >
              Scanare nouă
              <ArrowRight className="size-3.5" strokeWidth={2.5} />
            </Link>
          </>
        }
      />

      <V3KpiStrip items={severityKpis} />

      <V3Panel
        eyebrow="Se aplică"
        padding="tight"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">Frameworks</p>
            <p className="mt-0.5 text-[13px] text-eos-text-muted">{applicabilityLabels}</p>
          </div>
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">Status</p>
            <p className="mt-0.5 text-[13px] text-eos-text-muted">{foundSummary}</p>
          </div>
          <div>
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">Acum</p>
            <p className="mt-0.5 text-[13px] text-eos-text-muted">{nextActionLine}</p>
          </div>
        </div>
      </V3Panel>

      {/* Quick-nav strip — makes orphaned features discoverable */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { label: "Alerte", href: dashboardRoutes.drifts, icon: Bell },
          { label: "Calendar", href: dashboardRoutes.calendar, icon: CalendarClock },
          { label: "Sisteme AI", href: dashboardRoutes.aiSystems, icon: Cpu },
          { label: "Conformitate AI", href: dashboardRoutes.aiConformity, icon: Shield },
          { label: "Vendor Review", href: dashboardRoutes.vendorReview, icon: FileSearch },
          { label: "Agenți", href: dashboardRoutes.agents, icon: Bot },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 font-mono text-[11px] text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
          >
            <item.icon className="size-3" strokeWidth={2} />
            {item.label}
          </Link>
        ))}
      </div>

      {/* Main execution queue */}
      <section aria-label="Finding-uri de rezolvat">
        <FindingQueue findings={findings} soloMode={isSolo} />
      </section>

      {urgencyItems.length > 0 && (
        <details className="group overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Deadline-uri și semnale conexe
              </p>
              <p className="mt-1 text-[13px] text-eos-text-muted">
                Rămân dedesubt, ca să nu concureze cu inbox-ul principal de constatări.
              </p>
            </div>
            <span className="rounded-sm border border-eos-border-subtle bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.05em] text-eos-text-muted">
              {urgencyItems.length} active
            </span>
          </summary>
          <div className="mt-3">
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
    <div className="space-y-5">
      <V3PageHero
        breadcrumbs={[
          { label: "Firma mea" },
          { label: "Acțiuni" },
          { label: "Suport", current: true },
        ]}
        title={`Board separat · ${openTasks.length} deschise`}
        description="Aici stau doar task-urile auxiliare. Finding-ul și cockpitul lui rămân traseul principal pentru rezolvare, generare, dovadă și monitorizare."
        actions={
          <Link
            href={dashboardRoutes.resolve}
            className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
          >
            Înapoi la De rezolvat
            <ArrowRight className="size-3.5" strokeWidth={2} />
          </Link>
        }
      />

      <div className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary/70" aria-hidden />
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-1">
            <p className="text-[13px] font-semibold text-eos-text">Nu concurează cu cockpitul</p>
            <p className="text-[12px] leading-relaxed text-eos-text-muted">
              Când un task are caz asociat, intri în cockpitul finding-ului ca să generezi, atașezi dovada și închizi cu urmă clară.
            </p>
          </div>
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
