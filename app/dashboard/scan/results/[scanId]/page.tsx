"use client"

import Link from "next/link"
import { useState } from "react"
import { useParams } from "next/navigation"
import { ArrowRight, CheckCircle2, ChevronDown, ChevronRight } from "lucide-react"

import { RecentScansCard } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function frameworkFromLegal(ref?: string): string {
  if (!ref) return "General"
  const r = ref.toUpperCase()
  if (r.includes("GDPR")) return "GDPR"
  if (r.includes("AI ACT") || r.includes("EU AI")) return "AI Act"
  if (r.includes("NIS2") || r.includes("NIS 2")) return "NIS2"
  if (r.includes("FACTURA") || r.includes("ANAF") || r.includes("CIUS")) return "e-Factura"
  return "General"
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `${days}z`
  return `${Math.floor(days / 30)}l`
}

function sourceBadgeLabel(scan: { sourceKind?: string }) {
  if (scan.sourceKind === "manifest") return "repo / manifest"
  if (scan.sourceKind === "yaml") return "compliscan.yaml"
  return "document"
}

// ── Resolution Layer ──────────────────────────────────────────────────────────

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
                <p
                  className={[
                    "mb-0.5 text-[11px] font-semibold",
                    isDone ? "text-eos-success" : isActive ? "text-eos-text-tertiary" : "text-eos-text-muted",
                  ].join(" ")}
                >
                  {step.label}
                </p>
                <p
                  className={[
                    "text-sm leading-relaxed",
                    isDone ? "text-eos-text-muted" : isActive ? "text-eos-text" : "text-eos-text-muted",
                  ].join(" ")}
                >
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
  const framework = frameworkFromLegal(finding.legalReference)
  const age = ageLabel(finding.createdAtISO)
  const inRemediation = Boolean(finding.resolution)

  return (
    <div
      className={[
        "overflow-hidden rounded-eos-md border transition-colors duration-150",
        expanded ? "border-eos-border-default" : "border-eos-border-subtle",
        "bg-eos-surface",
      ].join(" ")}
    >
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
        <Badge variant="secondary" className="normal-case tracking-normal shrink-0">
          {framework}
        </Badge>
        <span className="shrink-0 text-[11px] text-eos-text-muted">{age}</span>
        <Badge
          variant={inRemediation ? "default" : "warning"}
          className="normal-case tracking-normal shrink-0"
        >
          {inRemediation ? "În remediere" : "Detectat"}
        </Badge>
        {expanded
          ? <ChevronDown className="size-3 shrink-0 text-eos-text-muted" strokeWidth={2} />
          : <ChevronRight className="size-3 shrink-0 text-eos-text-muted" strokeWidth={2} />
        }
      </button>
      {expanded && <ResolutionLayer finding={finding} />}
    </div>
  )
}

// ── Finding Groups ────────────────────────────────────────────────────────────

const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const
const SEVERITY_LABEL: Record<string, string> = {
  critical: "Critice",
  high: "Ridicate",
  medium: "Medii",
  low: "Informative",
}

function FindingGroups({ findings }: { findings: ScanFinding[] }) {
  const [openGroups, setOpenGroups] = useState<Set<string>>(() => new Set(["critical", "high"]))

  if (findings.length === 0) {
    return (
      <EmptyState
        title="Nicio problemă detectată"
        label="Documentul analizat nu a produs finding-uri. Poți continua în De rezolvat pentru task-urile existente."
        className="border-eos-border bg-eos-surface-variant"
      />
    )
  }

  const groups = SEVERITY_ORDER
    .map((sev) => ({ sev, items: findings.filter((f) => f.severity === sev) }))
    .filter(({ items }) => items.length > 0)

  function toggle(sev: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(sev)) next.delete(sev)
      else next.add(sev)
      return next
    })
  }

  return (
    <div className="space-y-4">
      {groups.map(({ sev, items }) => {
        const open = openGroups.has(sev)
        return (
          <div key={sev}>
            <button
              type="button"
              onClick={() => toggle(sev)}
              className="mb-2 flex w-full items-center gap-2 text-left"
            >
              <SeverityBadge severity={sev as "critical" | "high" | "medium" | "low"} />
              <span className="text-sm font-semibold text-eos-text">{SEVERITY_LABEL[sev]}</span>
              <span className="rounded-full bg-eos-bg-inset px-2 py-0.5 text-[11px] text-eos-text-muted">
                {items.length}
              </span>
              <div className="flex-1" />
              {open
                ? <ChevronDown className="size-3.5 text-eos-text-muted" strokeWidth={2} />
                : <ChevronRight className="size-3.5 text-eos-text-muted" strokeWidth={2} />
              }
            </button>
            {open && (
              <div className="space-y-2">
                {items.map((f) => <FindingRow key={f.id} finding={f} />)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ScanResultsPage() {
  const params = useParams<{ scanId: string }>()
  const scanId = Array.isArray(params.scanId) ? params.scanId[0] : params.scanId
  const cockpit = useCockpitData()

  if (cockpit.loading || !cockpit.data) return <div className="py-10" />

  const targetScan = cockpit.data.state.scans.find((s) => s.id === scanId) ?? null

  // ── Scan not found ───────────────────────────────────────────────────────
  if (!targetScan) {
    return (
      <div className="space-y-8">
        <PageIntro
          eyebrow="Scaneaza / Rezultat"
          title="Rezultatul cautat nu mai este disponibil"
          description="Scanarea cautata nu mai apare in snapshotul curent. Poti porni o analiza noua sau poti cauta rezultatul in Istoric."
          badges={
            <Badge variant="outline" className="normal-case tracking-normal">
              rezultat indisponibil
            </Badge>
          }
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.scan}>
                  Scanează din nou
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.documents}>
                  Deschide Istoric
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </>
          }
        />
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-6">
            <EmptyState
              title="Scanarea nu mai este in snapshot"
              label="Daca rezultatul era mai vechi, il poti cauta in Istoric."
              className="border-eos-border bg-eos-surface-variant py-8"
              actions={
                <Button asChild>
                  <Link href={dashboardRoutes.scan}>Mergi la Scaneaza</Link>
                </Button>
              }
            />
          </CardContent>
        </Card>
        <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
      </div>
    )
  }

  // ── Data derivations ─────────────────────────────────────────────────────
  const targetFindings = cockpit.data.state.findings.filter(
    (f) => f.scanId === targetScan.id || f.sourceDocument === targetScan.documentName
  )
  const criticalCount = targetFindings.filter((f) => f.severity === "critical").length
  const highCount     = targetFindings.filter((f) => f.severity === "high").length
  const mediumCount   = targetFindings.filter((f) => f.severity === "medium").length
  const lowCount      = targetFindings.filter((f) => f.severity === "low").length

  const summaryItems: SummaryStripItem[] = [
    {
      label: "Finding-uri",
      value: `${targetFindings.length}`,
      hint: targetFindings.length > 0
        ? `${criticalCount} critice · ${highCount} ridicate · ${mediumCount} medii`
        : "document curat",
      tone: targetFindings.length > 0 ? "warning" : "success",
    },
    {
      label: "Critice",
      value: `${criticalCount}`,
      hint: criticalCount > 0 ? "necesită acțiune imediată" : "fără probleme critice",
      tone: criticalCount > 0 ? "danger" : "success",
    },
    {
      label: "Scanat la",
      value: new Date(targetScan.createdAtISO).toLocaleString("ro-RO", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
      hint: targetScan.analysisStatus === "completed" ? "analiză finalizată" : "analiză în așteptare",
      tone: targetScan.analysisStatus === "completed" ? "success" : "neutral",
    },
    {
      label: "Sursă",
      value: sourceBadgeLabel(targetScan),
      hint: targetScan.documentName,
      tone: "neutral",
    },
  ]

  return (
    <div className="space-y-8">

      {/* ── Success Banner ─────────────────────────────────────────────────── */}
      {targetScan.analysisStatus === "completed" && (
        <div className="flex items-center gap-3 rounded-eos-md border border-eos-success/30 bg-eos-success-soft px-4 py-3">
          <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
          <p className="text-sm font-medium text-eos-text">
            Analiză finalizată
            <span className="ml-1 font-normal text-eos-text-muted">
              · {targetScan.documentName} · {targetFindings.length} finding-uri
            </span>
          </p>
        </div>
      )}

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <PageIntro
        eyebrow="Scaneaza / Rezultat"
        title={`Rezultatul pentru ${targetScan.documentName}`}
        description="Verdictul și explicația scanării tocmai analizate. Execuția continuă în De rezolvat — această pagină rămâne ancorată la rezultatul curent."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {sourceBadgeLabel(targetScan)}
            </Badge>
            {targetScan.analysisStatus === "completed" && (
              <Badge variant="success" className="normal-case tracking-normal">
                analiză finalizată
              </Badge>
            )}
          </>
        }
        aside={
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Finding-uri
            </p>
            <p className="text-2xl font-semibold text-eos-text">{targetFindings.length}</p>
            <p className="text-sm text-eos-text-muted">
              {criticalCount > 0
                ? `${criticalCount} critice`
                : highCount > 0
                  ? `${highCount} ridicate`
                  : "fără probleme majore"}
            </p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.scan}>
                Scanează din nou
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.resolve}>
                Adaugă toate în queue
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      {/* ── Summary Strip ─────────────────────────────────────────────────── */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Rezultat"
            title="Verdictul rămâne aici, execuția merge mai departe"
            description="Citești verdictul și contextul scanării pe această pagină, apoi continui task-urile în De rezolvat."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      {/* ── Finding Groups ────────────────────────────────────────────────── */}
      <section aria-label="Finding-uri din această scanare">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Finding-uri din această scanare
            </p>
            <p className="mt-1 text-sm text-eos-text-muted">
              Sortate după severitate · {targetFindings.length} total
            </p>
          </div>
          {targetFindings.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {criticalCount > 0 && <Badge variant="destructive">{criticalCount} critice</Badge>}
              {highCount > 0 && <Badge variant="destructive">{highCount} ridicate</Badge>}
              {mediumCount > 0 && <Badge variant="warning">{mediumCount} medii</Badge>}
              {lowCount > 0 && <Badge variant="secondary">{lowCount} informative</Badge>}
            </div>
          )}
        </div>
        <FindingGroups findings={targetFindings} />
      </section>

      {/* ── Primary CTA ───────────────────────────────────────────────────── */}
      {targetFindings.length > 0 && (
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href={dashboardRoutes.resolve}>
              Adaugă toate în queue
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={dashboardRoutes.scan}>Scanează din nou</Link>
          </Button>
        </div>
      )}

      {/* ── Handoff Card ──────────────────────────────────────────────────── */}
      <HandoffCard
        title="Rezultatul explică, De rezolvat execută"
        description="Verdictul scanării rămâne ancorat pe această pagină. Task-urile și remedierea se fac exclusiv în De rezolvat."
        destinationLabel="de rezolvat / istoric"
        checklist={[
          "nu repornești analiza din pagina de rezultat",
          "execuția și dovezile se gestionează în De rezolvat",
          "Istoricul complet rămâne în Scaneaza → Istoric",
        ]}
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.documents}>Istoric</Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.resolve}>
                De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
    </div>
  )
}
