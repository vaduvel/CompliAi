"use client"

import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowRight } from "lucide-react"

import { RecentScansCard } from "@/components/compliscan/route-sections"
import { ScanVerdictsTab } from "@/components/compliscan/scanari/scan-verdicts-tab"
import { buildScanInsights, useCockpitData } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { HandoffCard } from "@/components/evidence-os/HandoffCard"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SectionBoundary } from "@/components/evidence-os/SectionBoundary"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

function sourceBadge(scan: { sourceKind?: "document" | "manifest" | "yaml" }) {
  if (scan.sourceKind === "manifest") return "repo / manifest"
  if (scan.sourceKind === "yaml") return "compliscan.yaml"
  return "document"
}

export default function ScanResultsPage() {
  const params = useParams<{ scanId: string }>()
  const scanId = Array.isArray(params.scanId) ? params.scanId[0] : params.scanId
  const cockpit = useCockpitData()

  if (cockpit.loading || !cockpit.data) return <div className="py-10" />

  const targetScan = cockpit.data.state.scans.find((scan) => scan.id === scanId) ?? null

  if (!targetScan) {
    return (
      <div className="space-y-8">
        <PageIntro
          eyebrow="Scaneaza / Rezultat"
          title="Rezultatul cautat nu mai este disponibil"
          description="Scanarea cautata nu mai apare in snapshotul curent. Poti porni o analiza noua sau poti cauta rezultatul in istoricul ramas separat."
          badges={
            <>
              <Badge variant="outline" className="normal-case tracking-normal">
                rezultat indisponibil
              </Badge>
              <Badge variant="outline" className="normal-case tracking-normal">
                punte temporara
              </Badge>
            </>
          }
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.scan}>
                  Scaneaza din nou
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.documents}>
                  Deschide Documente
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
              label="Daca rezultatul era mai vechi, il poti cauta in Documente. Pentru o analiza noua revii in Scaneaza."
              className="border-eos-border bg-eos-surface-variant py-8"
              actions={
                <Button asChild variant="default">
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

  const targetFindings = cockpit.data.state.findings.filter(
    (finding) => finding.scanId === targetScan.id || finding.sourceDocument === targetScan.documentName
  )
  const targetTasks = cockpit.tasks.filter((task) => task.sourceDocument === targetScan.documentName)
  const targetText = targetScan.contentExtracted || targetScan.contentPreview || ""
  const targetInsights = buildScanInsights(targetText)
  const targetSystems = cockpit.data.state.detectedAISystems.filter(
    (system) => system.sourceScanId === targetScan.id || system.sourceDocument === targetScan.documentName
  )
  const targetSystemNames = new Set(targetSystems.map((system) => system.name))
  const targetDrifts = cockpit.activeDrifts.filter(
    (drift) =>
      drift.sourceDocument === targetScan.documentName ||
      (drift.systemLabel ? targetSystemNames.has(drift.systemLabel) : false)
  )
  const sourceType = targetScan.sourceKind === "manifest" || targetScan.sourceKind === "yaml"
    ? targetScan.sourceKind
    : "document"

  const summaryItems: SummaryStripItem[] = [
    {
      label: "Finding-uri",
      value: `${targetFindings.length}`,
      hint: "rezultatul curent ramas explicabil pe scanarea aleasa",
      tone: targetFindings.length > 0 ? "warning" : "success",
    },
    {
      label: "Task-uri derivate",
      value: `${targetTasks.length}`,
      hint: targetTasks.length > 0 ? "actiuni deja pregatite pentru De rezolvat" : "nu exista actiuni noi pentru acest rezultat",
      tone: targetTasks.length > 0 ? "accent" : "neutral",
    },
    {
      label: "Drift legat",
      value: `${targetDrifts.length}`,
      hint: targetDrifts.length > 0 ? "semnale active care continua in De rezolvat" : "niciun drift activ pentru aceasta scanare",
      tone: targetDrifts.length > 0 ? "warning" : "success",
    },
    {
      label: "Scanat la",
      value: new Date(targetScan.createdAtISO).toLocaleString("ro-RO"),
      hint: targetScan.analysisStatus === "completed" ? "analiza finalizata" : "analiza in asteptare",
      tone: targetScan.analysisStatus === "completed" ? "success" : "neutral",
    },
  ]

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Scaneaza / Rezultat"
        title={`Rezultatul pentru ${targetScan.documentName}`}
        description="Pagina aceasta pastreaza verdictul si explicatia lui pentru scanarea tocmai analizata. Executia continua in De rezolvat, iar istoricul complet ramane separat."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {sourceBadge(targetScan)}
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {targetScan.analysisStatus === "completed" ? "analiza finalizata" : "in asteptare"}
            </Badge>
          </>
        }
        aside={
          <div className="space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Scan curent
            </p>
            <p className="text-2xl font-semibold text-eos-text">{targetFindings.length}</p>
            <p className="text-sm text-eos-text-muted">
              finding-uri pe {sourceBadge(targetScan)}
            </p>
          </div>
        }
        actions={
          <>
            <Button asChild variant="outline">
              <Link href={dashboardRoutes.scan}>
                Scaneaza din nou
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
            <Button asChild>
              <Link href={dashboardRoutes.resolve}>
                Deschide De rezolvat
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            </Button>
          </>
        }
      />

      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <SummaryStrip
            eyebrow="Rezultat"
            title="Verdictul ramane aici, executia merge mai departe"
            description="Folosesti pagina asta ca sa intelegi ce a produs scanarea curenta, apoi continui cu task-urile si remedierea in locul dedicat."
            items={summaryItems}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <SectionBoundary
          eyebrow="Handoff canonic"
          title="Rezultatul explica, De rezolvat executa"
          description="Aici citesti verdictul, provenance-ul si contextul scanarii. Daca rezultatul deschide task-uri sau drift, continui in De rezolvat, nu pe aceasta pagina."
          support={
            <div className="grid gap-4 md:grid-cols-3">
              <ResultFlowHint
                title="1. Verifici verdictul"
                detail="Vezi de ce a aparut problema si ce sursa a generat-o."
              />
              <ResultFlowHint
                title="2. Separi explicatia de actiune"
                detail="Pagina ramane explicabila si stabila, fara sa devina board de executie."
              />
              <ResultFlowHint
                title="3. Continui in locul potrivit"
                detail="Executia si inchiderea task-urilor se fac in De rezolvat."
              />
            </div>
          }
        />
        <HandoffCard
          title="Continui fara sa pierzi contextul acestui scan"
          description="Rezultatul tocmai analizat ramane ancorat aici, dar task-urile si drifturile lui merg in De rezolvat. Istoricul complet ramane separat in Documente."
          destinationLabel="de rezolvat / documente"
          checklist={[
            "nu repornesti analiza din pagina de rezultat",
            "nu tratezi verdictul ca board de executie",
            "folosesti Documente doar pentru arhiva completa",
          ]}
          actions={
            <>
              <Button asChild variant="outline">
                <Link href={dashboardRoutes.documents}>Documente</Link>
              </Button>
              <Button asChild>
                <Link href={dashboardRoutes.resolve}>De rezolvat</Link>
              </Button>
            </>
          }
        />
      </div>

      <ScanVerdictsTab
        sourceType={sourceType}
        latestManifestScan={sourceType === "manifest" ? targetScan : null}
        latestManifestSystems={sourceType === "manifest" ? targetSystems : []}
        latestManifestDrifts={sourceType === "manifest" ? targetDrifts : []}
        latestYamlScan={sourceType === "yaml" ? targetScan : null}
        latestYamlSystems={sourceType === "yaml" ? targetSystems : []}
        latestYamlFindings={sourceType === "yaml" ? targetFindings : []}
        latestYamlDrifts={sourceType === "yaml" ? targetDrifts : []}
        latestDocumentScan={sourceType === "document" ? targetScan : null}
        latestDocumentText={sourceType === "document" ? targetText : ""}
        latestDocumentFindings={sourceType === "document" ? targetFindings : []}
        latestDocumentInsights={sourceType === "document" ? targetInsights : []}
        latestDocumentTasks={sourceType === "document" ? targetTasks : []}
      />

      <RecentScansCard scans={cockpit.data.state.scans} tasks={cockpit.tasks} />
    </div>
  )
}

function ResultFlowHint({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <p className="text-sm font-medium text-eos-text">{title}</p>
      <p className="mt-2 text-sm leading-6 text-eos-text-muted">{detail}</p>
    </div>
  )
}
