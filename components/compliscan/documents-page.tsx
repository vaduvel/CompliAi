"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, FolderOpen, Sparkles } from "lucide-react"

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

const QUICK_DOC_TYPES = [
  { id: "privacy-policy", label: "Politică de Confidențialitate", desc: "GDPR Art. 13–14 — obligatorie", icon: "📄" },
  { id: "cookie-policy", label: "Politică de Cookies", desc: "ePrivacy + GDPR", icon: "🍪" },
  { id: "dpa", label: "Acord DPA", desc: "GDPR Art. 28 — cu procesatorii", icon: "🤝" },
  { id: "nis2-incident-response", label: "Plan Incidente NIS2", desc: "NIS2 + GDPR Art. 33–34", icon: "🛡️" },
  { id: "ai-governance", label: "Politică Guvernanță AI", desc: "EU AI Act Art. 9, 17", icon: "🤖" },
] as const

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
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={dashboardRoutes.auditorVault}>
                <FolderOpen className="mr-1.5 size-3.5" />
                Vault audit
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={dashboardRoutes.generator}>
                <Sparkles className="mr-1.5 size-3.5" />
                Generator
              </Link>
            </Button>
          </div>
        }
      />

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="mr-1.5 size-3.5" />
            Generează
          </TabsTrigger>
          <TabsTrigger value="generated">
            <BookOpen className="mr-1.5 size-3.5" />
            Politici generate
          </TabsTrigger>
          <TabsTrigger value="scanned">Documente scanate</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_DOC_TYPES.map((doc) => (
              <Link
                key={doc.id}
                href={`${dashboardRoutes.generator}?documentType=${doc.id}`}
                className="flex items-start gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5 transition-all hover:border-eos-primary/40 hover:bg-eos-surface-hover"
              >
                <span className="text-2xl leading-none">{doc.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-eos-text">{doc.label}</p>
                  <p className="mt-0.5 text-xs text-eos-text-muted">{doc.desc}</p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-eos-text-tertiary" />
              </Link>
            ))}
            <Link
              href={dashboardRoutes.generator}
              className="flex items-center justify-center gap-2 rounded-eos-lg border border-dashed border-eos-border px-4 py-3.5 text-sm text-eos-text-muted transition-all hover:border-eos-primary/40 hover:text-eos-text"
            >
              <Sparkles className="size-4" />
              Toate tipurile de documente
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="generated">
          {generatedDocuments.length === 0 ? (
            <EmptyState
              title="Nu există documente generate"
              label="Generează primul document asistat — Privacy Policy, DPA sau Politică Internă."
              className="rounded-eos-xl border border-eos-border bg-eos-surface px-5 py-10"
              actions={
                <Button asChild size="sm">
                  <Link href={dashboardRoutes.generator}>Mergi la Generator</Link>
                </Button>
              }
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
