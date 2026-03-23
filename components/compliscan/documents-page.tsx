"use client"

import Link from "next/link"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { dashboardRoutes, dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"

export function DocumentsPageSurface() {
  const runtime = useDashboardRuntime()
  const cockpit = useCockpitData()

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const isSolo = runtime?.userMode === "solo"
  const generatedDocuments = cockpit.data.state.generatedDocuments
    .slice()
    .sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))
  const documentScans = cockpit.data.state.scans
    .filter((scan) => scan.sourceKind === "document")
    .slice()
    .sort((left, right) => {
      const leftDate = left.analyzedAtISO ?? left.createdAtISO
      const rightDate = right.analyzedAtISO ?? right.createdAtISO
      return rightDate.localeCompare(leftDate)
    })

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow={isSolo ? "Documente" : "Documente asistate"}
        title={isSolo ? "Politici și documente scanate" : "Documente generate și arhivă scanată"}
        description={
          isSolo
            ? "Aici găsești într-un singur loc politicile generate și documentele scanate. Intri în detaliu doar când vrei să continui analiza sau exportul."
            : "Suprafața asta grupează documentele generate și arhiva scanărilor, fără să dubleze fluxurile din Scanează și Rapoarte."
        }
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {generatedDocuments.length} documente generate
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {documentScans.length} documente scanate
            </Badge>
          </>
        }
        actions={
          <Button asChild>
            <Link href={dashboardRoutes.scan}>Scanează un document</Link>
          </Button>
        }
      />

      <Tabs defaultValue="generated" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generated">Politici generate</TabsTrigger>
          <TabsTrigger value="scanned">Documente scanate</TabsTrigger>
        </TabsList>

        <TabsContent value="generated">
          {generatedDocuments.length === 0 ? (
            <EmptyState
              title="Nu există documente generate"
              label="Generează primul document din Rapoarte sau după ce confirmi un finding."
              className="rounded-eos-xl border border-eos-border bg-eos-surface px-5 py-10"
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {generatedDocuments.map((document) => (
                <Card key={document.id} className="border-eos-border bg-eos-surface">
                  <CardHeader className="border-b border-eos-border-subtle pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{document.title}</CardTitle>
                        <p className="mt-1 text-sm text-eos-text-muted">
                          {document.documentType} · {new Date(document.generatedAtISO).toLocaleString("ro-RO")}
                        </p>
                      </div>
                      <Badge
                        variant={document.llmUsed ? "secondary" : "outline"}
                        className="normal-case tracking-normal"
                      >
                        {document.llmUsed ? "asistat" : "standard"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={dashboardRoutes.policies}>Vezi în Politici</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scanned">
          {documentScans.length === 0 ? (
            <EmptyState
              title="Nu există documente scanate"
              label="Încarcă primul document din Scanează pentru a porni istoricul firmei."
              className="rounded-eos-xl border border-eos-border bg-eos-surface px-5 py-10"
            />
          ) : (
            <div className="space-y-4">
              {documentScans.map((scan) => (
                <Card key={scan.id} className="border-eos-border bg-eos-surface">
                  <CardContent className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-eos-text">{scan.documentName}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {new Date(scan.analyzedAtISO ?? scan.createdAtISO).toLocaleString("ro-RO")} · {scan.findingsCount} findings
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={dashboardScanResultsRoute(scan.id)}>Deschide rezultatul</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
