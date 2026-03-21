"use client"

import Link from "next/link"
import { useState } from "react"
import { ArrowRight, ChevronDown, ChevronRight } from "lucide-react"

import { RemediationBoard } from "@/components/compliscan/remediation-board"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import type { TaskPriority } from "@/components/compliscan/types"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { ScanFinding, FindingResolution } from "@/lib/compliance/types"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

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
  const inRemediation = Boolean(finding.resolution)

  // Human review state badge per blueprint state machine
  const reviewState = finding.resolution ? "remediation" : "detected"
  const reviewBadgeVariant = reviewState === "remediation" ? "default" : "warning"
  const reviewBadgeLabel = reviewState === "remediation" ? "În remediere" : "Detectat"

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
        <Badge variant={reviewBadgeVariant} className="normal-case tracking-normal shrink-0">
          {reviewBadgeLabel}
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

function FindingQueue({ findings }: { findings: ScanFinding[] }) {
  const [activeFilter, setActiveFilter] = useState<FrameworkFilter>("toate")

  const filterTabs: Array<{ id: FrameworkFilter; label: string }> = [
    { id: "toate",     label: "Toate" },
    { id: "gdpr",      label: "GDPR" },
    { id: "nis2",      label: "NIS2" },
    { id: "ai-act",    label: "AI Act" },
    { id: "furnizori", label: "Furnizori" },
  ]

  // Count per framework
  const counts: Record<FrameworkFilter, number> = {
    toate: findings.length,
    gdpr:      findings.filter((f) => frameworkFromLegal(f.legalReference) === "gdpr").length,
    nis2:      findings.filter((f) => frameworkFromLegal(f.legalReference) === "nis2").length,
    "ai-act":  findings.filter((f) => frameworkFromLegal(f.legalReference) === "ai-act").length,
    furnizori: findings.filter((f) => frameworkFromLegal(f.legalReference) === "furnizori").length,
  }

  // Filter + sort critical first
  const SEVERITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
  const filtered = findings
    .filter((f) => activeFilter === "toate" || frameworkFromLegal(f.legalReference) === activeFilter)
    .sort((a, b) => (SEVERITY_RANK[a.severity] ?? 4) - (SEVERITY_RANK[b.severity] ?? 4))

  return (
    <div>
      {/* Framework filter tabs */}
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
                <span className={["ml-1.5 rounded-full px-1.5 py-0.5 text-[11px]", active ? "bg-eos-primary-soft text-eos-primary" : "bg-eos-bg-inset text-eos-text-muted"].join(" ")}>
                  {counts[tab.id]}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Finding rows */}
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

export function ResolvePageSurface() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("ALL")
  const [showHandoff, setShowHandoff] = useState(false)

  if (cockpit.error && !cockpit.loading) return <ErrorScreen message={cockpit.error} variant="section" />
  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const openTasks = cockpit.tasks.filter((task) => task.status !== "done")
  const evidenceAttached = cockpit.tasks.filter((task) => Boolean(task.attachedEvidence))
  const openPriorityOneTasks = openTasks.filter((task) => task.priority === "P1")
  const tasksMissingEvidence = openTasks.filter((task) => !task.attachedEvidence)
  const evidenceLedger = cockpit.data.evidenceLedger ?? []
  const ledgerReadyCount = evidenceLedger.filter((entry) => entry.quality?.status === "sufficient").length
  const ledgerWeakCount = evidenceLedger.filter((entry) => entry.quality?.status === "weak").length
  const ledgerUnratedCount = Math.max(0, evidenceLedger.length - ledgerReadyCount - ledgerWeakCount)
  const dominantExecutionSignal =
    tasksMissingEvidence.length > 0
      ? `${tasksMissingEvidence.length} task-uri fara dovada`
      : ledgerWeakCount > 0
        ? `${ledgerWeakCount} dovezi slabe`
        : openPriorityOneTasks.length > 0
          ? `${openPriorityOneTasks.length} urgente P1`
          : `${openTasks.length} task-uri active`

  const items: SummaryStripItem[] = [
    {
      label: "Task-uri deschise",
      value: `${openTasks.length}`,
      hint: "executie activa in queue-ul canonic",
      tone: openTasks.length > 0 ? "warning" : "success",
    },
    {
      label: "P1 deschise",
      value: `${openPriorityOneTasks.length}`,
      hint: openPriorityOneTasks.length > 0 ? "intri mai intai in urgente" : "nu ai urgente acum",
      tone: openPriorityOneTasks.length > 0 ? "danger" : "success",
    },
    {
      label: "Fara dovada",
      value: `${tasksMissingEvidence.length}`,
      hint:
        tasksMissingEvidence.length > 0
          ? "task-uri care tin auditul blocat"
          : `${evidenceAttached.length} au dovada atasata`,
      tone: tasksMissingEvidence.length > 0 ? "warning" : "accent",
    },
  ]

  if (evidenceLedger.length > 0) {
    items.push({
      label: "Calitate dovada",
      value: ledgerWeakCount > 0 ? `${ledgerWeakCount} slabe` : `${ledgerReadyCount} verificate`,
      hint:
        ledgerWeakCount > 0
          ? "inlocuiesti dovezile slabe inainte de audit"
          : ledgerUnratedCount > 0
            ? `${ledgerUnratedCount} neevaluate inca`
            : "registru curat",
      tone: ledgerWeakCount > 0 ? "warning" : ledgerUnratedCount > 0 ? "accent" : "success",
    })
  }

  const allTasksDone = cockpit.tasks.length > 0 && openTasks.length === 0
  const shouldShowHandoff = showHandoff || allTasksDone

  const findings = cockpit.data.state.findings
  const criticalCount = findings.filter((f) => f.severity === "critical").length
  const highCount     = findings.filter((f) => f.severity === "high").length
  const mediumCount   = findings.filter((f) => f.severity === "medium").length

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="De rezolvat"
        title="De rezolvat"
        description="Tot ce necesită acțiune umană — finding-uri, task-uri, drift. Un singur loc, indiferent de framework."
        badges={
          <>
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
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Deschise
            </p>
            <p className="text-2xl font-semibold text-eos-text">{findings.length}</p>
            <p className="text-sm text-eos-text-muted">
              {criticalCount > 0
                ? `${criticalCount} critice · intri mai întâi în ele`
                : openTasks.length > 0
                  ? `${openTasks.length} task-uri active`
                  : "fără blocaje majore"}
            </p>
          </div>
        }
      />

      {/* ── Finding Queue — framework filter tabs ──────────────────────── */}
      <section aria-label="Finding-uri de rezolvat">
        <FindingQueue findings={findings} />
      </section>

      <PillarTabs sectionId="dovada" />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip eyebrow="Snapshot de executie" title="Ce inchizi acum" items={items} />
        </CardContent>
      </Card>

      {cockpit.tasks.length === 0 ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-col gap-4 px-5 py-8 text-center sm:flex-row sm:items-center sm:text-left">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-eos-text">Niciun task generat inca</p>
              <p className="mt-1 text-xs text-eos-text-muted">
                Task-urile apar dupa primul scan. Scaneaza un document sau manifeste de configurare ca sa construim planul de remediere.
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0 gap-2">
              <Link href={dashboardRoutes.scan}>
                Deschide Scaneaza
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <RemediationBoard
          tasks={cockpit.tasks}
          activeFilter={taskFilter}
          onFilterChange={setTaskFilter}
          onMarkDone={cockpitActions.handleMarkDone}
          onAttachEvidence={cockpitActions.attachEvidence}
          onExport={cockpitActions.handleTaskExport}
        />
      )}

      <div className="grid gap-4">
        {openTasks.length > 0 ? (
          <Card className="border-eos-border bg-eos-surface">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 px-5 py-5">
              <div>
                <p className="text-sm font-semibold text-eos-text">Verificare si livrabil</p>
                <p className="text-xs text-eos-text-muted">
                  Vault si Rapoarte raman dupa executie, ca sa nu concureze cu board-ul.
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowHandoff((current) => !current)}>
                {showHandoff ? "Ascunde pasii de verificare" : "Arata pasii de verificare"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {shouldShowHandoff ? (
          <HandoffCard
            title="Ai terminat queue-ul — mergi in paginile read-only"
            description="De rezolvat ramane pagina de actiune. Vault si Rapoarte te ajuta sa verifici ce este audit-ready, fara sa concureze cu executia."
            destinationLabel="vault / rapoarte"
            checklist={[
              "inchizi task-ul si atasezi dovada aici",
              "verifici ledger-ul separat in Auditor Vault",
              "pregatesti livrabilul final in Rapoarte",
            ]}
            actions={
              <>
                <Button asChild variant="outline">
                  <Link href={dashboardRoutes.reports}>
                    Rapoarte
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
                <Button asChild>
                  <Link href={dashboardRoutes.auditorVault}>
                    Auditor Vault
                    <ArrowRight className="size-4" strokeWidth={2} />
                  </Link>
                </Button>
              </>
            }
          />
        ) : null}
      </div>
    </div>
  )
}
