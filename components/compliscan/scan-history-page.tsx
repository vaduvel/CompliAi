"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { Skeleton, SkeletonCard } from "@/components/evidence-os/Skeleton"
import { buildScanInsights, useCockpitData } from "@/components/compliscan/use-cockpit"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { V3KpiStrip, type V3KpiItem } from "@/components/compliscan/v3/kpi-strip"
import { V3Panel } from "@/components/compliscan/v3/panel"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

const LatestDocumentSection = dynamic(
  () =>
    import("@/components/compliscan/route-sections").then((mod) => mod.LatestDocumentSection),
  {
    loading: () => <LoadingScreen variant="section" />,
  }
)

const RecentScansCard = dynamic(
  () => import("@/components/compliscan/route-sections").then((mod) => mod.RecentScansCard),
  {
    loading: () => <LoadingScreen variant="section" />,
  }
)

export function ScanHistoryPageSurface() {
  const cockpit = useCockpitData()

  if (cockpit.loading || !cockpit.data) return (
    <div className="space-y-6">
      <Skeleton className="h-20 w-full rounded-eos-lg" />
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  )

  const latestDocumentScan =
    cockpit.data.state.scans.find((scan) => scan.sourceKind === "document") ?? null
  const latestDocumentText =
    latestDocumentScan?.contentExtracted || latestDocumentScan?.contentPreview || ""
  const latestDocumentFindings = latestDocumentScan
    ? cockpit.data.state.findings.filter(
        (finding) =>
          finding.scanId === latestDocumentScan.id ||
          finding.sourceDocument === latestDocumentScan.documentName
      )
    : []
  const latestScanTasks = latestDocumentScan
    ? cockpit.tasks.filter((task) => task.sourceDocument === latestDocumentScan.documentName)
    : []
  const latestDocumentInsights = buildScanInsights(latestDocumentText)
  const documentScans = cockpit.data.state.scans.filter((scan) => scan.sourceKind === "document")
  const documentFindings = cockpit.data.state.findings.filter((finding) =>
    documentScans.some(
      (scan) =>
        finding.scanId === scan.id || finding.sourceDocument === scan.documentName
    )
  )

  const kpiItems: V3KpiItem[] = [
    {
      id: "docs",
      label: "Documente scanate",
      value: documentScans.length,
      stripe: documentScans.length > 0 ? "info" : undefined,
      detail: "istoricul document-first ramas separat de fluxul activ",
    },
    {
      id: "findings",
      label: "Probleme detectate",
      value: documentFindings.length,
      stripe: documentFindings.length > 0 ? "warning" : undefined,
      valueTone: documentFindings.length > 0 ? "warning" : "success",
      detail: "semnale extrase din documentele deja analizate",
    },
    {
      id: "tasks",
      label: "Task-uri legate",
      value: latestScanTasks.length,
      stripe: latestScanTasks.length > 0 ? "warning" : undefined,
      detail: latestDocumentScan
        ? "legate de ultimul document relevant"
        : "apar după primul document analizat",
    },
    {
      id: "latest",
      label: "Ultimul document",
      value: latestDocumentScan ? "disponibil" : "lipsește",
      valueTone: latestDocumentScan ? "success" : "neutral",
      detail: latestDocumentScan?.documentName ?? "pornește din Flux scanare",
    },
  ]

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Scanează" }, { label: "Istoric", current: true }]}
        title="Istoric documente și rezultate confirmate"
        description="Aici vezi istoricul document-first și rezultatele deja extrase, separat de fluxul activ de scanare. Pagina rămâne doar pentru consultare și transfer spre De rezolvat sau Rapoarte."
        eyebrowBadges={
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center rounded-sm border border-eos-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
              istoric documente
            </span>
            <span className="inline-flex items-center rounded-sm border border-eos-border px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-tertiary">
              doar vizualizare
            </span>
          </div>
        }
        actions={
          <>
            <Link
              href={dashboardRoutes.scan}
              className="flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[12.5px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              Scanează
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
            <Link
              href={dashboardRoutes.resolve}
              className="flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-primary bg-eos-primary px-3 text-[12.5px] font-semibold text-white transition hover:bg-eos-primary-hover"
            >
              De rezolvat
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </>
        }
      />

      <PillarTabs sectionId="scanare" />

      <V3KpiStrip items={kpiItems} />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <V3Panel eyebrow="Flux canonic" title="Istoricul rămâne arhiva de consultare, nu locul în care repornești analiza">
          <p className="mb-3 text-[12.5px] leading-[1.55] text-eos-text-muted">
            Dacă vrei să încarci un document nou sau să reiei analiza, te întorci în Scanează.
            Dacă rezultatul a produs acțiuni, continui în De rezolvat sau Rapoarte, nu aici.
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            <DocumentFlowHint
              title="1. Consulți istoricul"
              detail="Cauți documentul și înțelegi rapid ce rezultat a produs."
            />
            <DocumentFlowHint
              title="2. Separi rezultatul de acțiune"
              detail="Aici consulți, nu închizi task-uri și nu validezi baseline."
            />
            <DocumentFlowHint
              title="3. Continui în pagina potrivită"
              detail="Pentru lucru nou te întorci în Scanează, iar pentru acțiune mergi în De rezolvat sau Rapoarte."
            />
          </div>
        </V3Panel>
        <V3Panel
          eyebrow="Handoff"
          title="După consultare revii în fluxul potrivit"
          action={
            <>
              <Link
                href={dashboardRoutes.scan}
                className="flex h-[28px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[12px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
              >
                Scanează
              </Link>
              <Link
                href={dashboardRoutes.resolve}
                className="flex h-[28px] items-center gap-1.5 rounded-eos-sm border border-eos-primary bg-eos-primary px-2.5 text-[12px] font-semibold text-white transition hover:bg-eos-primary-hover"
              >
                De rezolvat
              </Link>
            </>
          }
        >
          <p className="mb-3 text-[12.5px] leading-[1.55] text-eos-text-muted">
            Istoricul este pagina în care citești arhiva și compari rezultate. Pentru analiza nouă revii în Scanează,
            iar pentru task-uri și dovadă continui în De rezolvat.
          </p>
          <ul className="space-y-1.5 text-[12.5px] text-eos-text-muted">
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1 shrink-0 rounded-full bg-eos-text-tertiary" aria-hidden />
              nu repornești flow-ul complet din această pagină
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1 shrink-0 rounded-full bg-eos-text-tertiary" aria-hidden />
              nu tratezi istoricul ca board de execuție
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1 shrink-0 rounded-full bg-eos-text-tertiary" aria-hidden />
              folosești handoff clar spre Scanează sau De rezolvat
            </li>
          </ul>
        </V3Panel>
      </div>

      <LatestDocumentSection
        latestScan={latestDocumentScan}
        latestScanText={latestDocumentText}
        latestScanFindings={latestDocumentFindings}
        latestScanInsights={latestDocumentInsights}
        latestScanTasks={latestScanTasks}
      />

      <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
    </div>
  )
}

function DocumentFlowHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] p-3">
      <p className="text-[12.5px] font-semibold text-eos-text">{title}</p>
      <p className="mt-1.5 text-[12px] leading-[1.5] text-eos-text-muted">{detail}</p>
    </div>
  )
}
