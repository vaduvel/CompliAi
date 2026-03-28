"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { Skeleton, SkeletonCard } from "@/components/evidence-os/Skeleton"
import { buildScanInsights, useCockpitData } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
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
      <Skeleton className="h-20 w-full rounded-eos-xl" />
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
  const summaryItems: SummaryStripItem[] = [
    {
      label: "Documente scanate",
      value: `${documentScans.length}`,
      hint: "istoricul document-first ramas separat de fluxul activ",
      tone: documentScans.length > 0 ? "accent" : "neutral",
    },
    {
      label: "Probleme detectate",
      value: `${documentFindings.length}`,
      hint: "semnale extrase din documentele deja analizate",
      tone: documentFindings.length > 0 ? "warning" : "success",
    },
    {
      label: "Task-uri legate",
      value: `${latestScanTasks.length}`,
      hint: latestDocumentScan
        ? "task-uri legate de ultimul document relevant"
        : "task-urile apar dupa primul document analizat",
      tone: latestScanTasks.length > 0 ? "warning" : "neutral",
    },
    {
      label: "Ultimul document",
      value: latestDocumentScan?.documentName ?? "inca lipseste",
      hint: latestDocumentScan ? "rezultatul curent rămâne doar pentru vizualizare" : "porneste din Flux scanare",
      tone: latestDocumentScan ? "success" : "neutral",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Scaneaza / Istoric"
        title="Istoric documente si rezultate confirmate"
        description="Aici vezi istoricul document-first si rezultatele deja extrase, separat de fluxul activ de scanare. Pagina rămâne doar pentru consultare și transfer spre De rezolvat sau Rapoarte."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              istoric documente
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              doar vizualizare
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Snapshot documente
            </p>
            <p className="text-2xl font-semibold text-eos-text">{cockpit.data.summary.score}</p>
            <p className="text-sm text-eos-text-muted">{cockpit.data.summary.riskLabel}</p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.scan}>
                Scaneaza
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
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

      <PillarTabs sectionId="scanare" />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Istoric"
            title="Arhiva separata de lucru activ"
            description="Pagina asta te ajuta sa revii rapid la documentele procesate si la rezultatul lor, fara sa reincarci aceeasi densitate ca in fluxul activ."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Flux canonic"
          title="Istoricul ramane arhiva de consultare, nu locul in care repornesti analiza"
          description="Daca vrei sa incarci un document nou sau sa reiei analiza, te intorci in Scaneaza. Daca rezultatul a produs actiuni, continui in De rezolvat sau Rapoarte, nu aici."
          support={
            <div className="grid gap-4 md:grid-cols-3">
              <DocumentFlowHint
                title="1. Consulti istoricul"
                detail="Cauti documentul si intelegi rapid ce rezultat a produs."
              />
              <DocumentFlowHint
                title="2. Separi rezultatul de actiune"
                detail="Aici consulti, nu inchizi task-uri si nu validezi baseline."
              />
              <DocumentFlowHint
                title="3. Continui in pagina potrivita"
                detail="Pentru lucru nou te intorci in Scaneaza, iar pentru actiune mergi in De rezolvat sau Rapoarte."
              />
            </div>
          }
        />
        <HandoffCard
          title="Dupa consultare revii in fluxul potrivit"
          description="Istoricul este pagina in care citesti arhiva si compari rezultate. Pentru analiza noua revii in Scaneaza, iar pentru task-uri si dovada continui in De rezolvat."
          destinationLabel="scanare / de rezolvat"
          checklist={[
            "nu repornesti flow-ul complet din aceasta pagina",
            "nu tratezi istoricul ca board de executie",
            "folosesti handoff clar spre Scaneaza sau De rezolvat",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.scan}>Deschide Scaneaza</Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.resolve}>Deschide De rezolvat</Link>
              </Button>
            </>
          }
        />
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
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <p className="text-sm font-medium text-eos-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-eos-text-muted">{detail}</p>
    </div>
  )
}
