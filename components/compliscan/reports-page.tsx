"use client"

import Link from "next/link"
import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { Briefcase, ChevronRight, Copy, Loader2, Scale, Share2 } from "lucide-react"
import { toast } from "sonner"

import { ReportsTabs } from "@/components/compliscan/reports-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"

const AICompliancePackSummaryCard = dynamic(
  () =>
    import("@/components/compliscan/ai-compliance-pack-card").then(
      (mod) => mod.AICompliancePackSummaryCard
    ),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="AI Compliance Pack"
        detail="Se incarca starea de audit a pack-ului."
      />
    ),
  }
)

const ExportCenter = dynamic(
  () => import("@/components/compliscan/export-center").then((mod) => mod.ExportCenter),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Export in incarcare"
        detail="Centrul de export se incarca in fundal."
      />
    ),
  }
)

const EFacturaRiskCard = dynamic(
  () =>
    import("@/components/compliscan/efactura-risk-card").then((mod) => mod.EFacturaRiskCard),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Semnale e-Factura"
        detail="Se incarca semnalele de risc e-Factura."
      />
    ),
  }
)

const InspectorModePanel = dynamic(
  () =>
    import("@/components/compliscan/inspector-mode-panel").then((mod) => mod.InspectorModePanel),
  {
    ssr: false,
    loading: () => (
      <SectionLoadingCard
        title="Inspector Mode"
        detail="Se incarca simularea controlului extern."
      />
    ),
  }
)

export function ReportsPageSurface() {
  const cockpit = useCockpitData()
  const cockpitActions = useCockpitMutations()
  const heavyPayloadRequested = useRef(false)

  useEffect(() => {
    if (cockpit.data && !cockpit.data.compliancePack && !heavyPayloadRequested.current) {
      heavyPayloadRequested.current = true
      void cockpitActions.ensureHeavyPayload()
    }
  }, [cockpit.data, cockpitActions])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const latestSnapshot = cockpit.data.state.snapshotHistory[0]
  const validatedBaseline = cockpit.data.state.snapshotHistory.find(
    (snapshot) => snapshot.snapshotId === cockpit.data?.state.validatedBaselineSnapshotId
  )
  const activeDrifts = cockpit.activeDrifts

  return (
    <div className="space-y-8">
      <PageIntro
        eyebrow="Rapoarte"
        title="Rapoarte"
        description="Output-ul conformității tale — exportă, partajează și verifică."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              read-only
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              Scor: {cockpit.data.summary.score}%
            </Badge>
          </>
        }
      />

      <ReportsTabs />

      {/* Primary: Export Center */}
      <ExportCenter
        onGeneratePdf={() => void cockpitActions.handleGenerateReport()}
        onDownloadExecutivePdf={() => void cockpitActions.handleDownloadExecutivePdf()}
        onGenerateResponsePack={() => void cockpitActions.handleGenerateResponsePack()}
        onGenerateAuditPack={() => void cockpitActions.handleGenerateAuditPack()}
        onGenerateAuditBundle={() => void cockpitActions.handleGenerateAuditBundle()}
        onGenerateAnnexLite={() => void cockpitActions.handleGenerateAnnexLite()}
        onExportChecklist={() => void cockpitActions.handleChecklistExport()}
        onExportCompliScanJson={() => void cockpitActions.handleExportCompliScanJson()}
        onExportCompliScanYaml={() => void cockpitActions.handleExportCompliScanYaml()}
        onShare={() => void cockpitActions.handleShareWithAccountant()}
      />

      {/* Partner & Counsel Pack */}
      <PartnerCounselPack />

      {/* Secondary: detailed info under fold */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-5 py-4 text-sm font-medium text-eos-text hover:bg-eos-surface-variant [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
          Detalii snapshot, audit pack și semnale
        </summary>
        <div className="mt-4 space-y-6">
          <SnapshotStatusCard
            latestSnapshot={latestSnapshot}
            validatedBaseline={validatedBaseline}
            driftCount={activeDrifts.length}
          />

          {cockpit.data.compliancePack && (
            <AICompliancePackSummaryCard pack={cockpit.data.compliancePack} />
          )}

          <EFacturaRiskCard />

          <InspectorModePanel />
        </div>
      </details>
    </div>
  )
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <Card className="border-eos-border bg-eos-bg-inset">
      <CardHeader className="border-b border-eos-border pb-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-4 text-sm text-eos-text-muted">{detail}</CardContent>
    </Card>
  )
}

function SnapshotStatusCard({
  latestSnapshot,
  validatedBaseline,
  driftCount,
}: {
  latestSnapshot:
    | {
        snapshotId: string
        generatedAt: string
        comparedToSnapshotId: string | null
        sources: unknown[]
        systems: unknown[]
        findings: unknown[]
      }
    | undefined
  validatedBaseline:
    | {
        snapshotId: string
        generatedAt: string
      }
    | undefined
  driftCount: number
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div>
          <CardTitle className="text-xl">Snapshot curent</CardTitle>
          <p className="mt-1 text-sm text-eos-text-muted">
            Exporturile pornesc de aici.
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {!latestSnapshot && (
          <EmptyState title="Nu exista inca snapshot" label="Ruleaza un scan, apoi revino pentru export." className="rounded-eos-md" />
        )}

        {latestSnapshot && (
          <>
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">Generat</p>
              <p className="mt-2 text-sm font-semibold text-eos-text">
                {new Date(latestSnapshot.generatedAt).toLocaleString("ro-RO")}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                {latestSnapshot.snapshotId}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotMeta label="Surse" value={latestSnapshot.sources.length} />
              <SnapshotMeta label="Sisteme" value={latestSnapshot.systems.length} />
              <SnapshotMeta label="Probleme detectate" value={latestSnapshot.findings.length} />
              <SnapshotMeta label="Modificari incluse" value={driftCount} />
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">comparat cu</Badge>
                <span className="text-sm text-eos-text">
                  {latestSnapshot.comparedToSnapshotId || "fara comparatie"}
                </span>
              </div>
              <p className="mt-3 text-sm text-eos-text-muted">
                {validatedBaseline
                  ? `Baseline validat activ: ${validatedBaseline.snapshotId}`
                  : "Nu exista baseline validat."}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function SnapshotMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-sm font-semibold text-eos-text">{value}</p>
    </div>
  )
}

function PartnerCounselPack() {
  const [briefLoading, setBriefLoading] = useState(false)
  const [shareLoading, setShareLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)

  const handleCounselBrief = useCallback(async () => {
    setBriefLoading(true)
    try {
      const res = await fetch("/api/reports/counsel-brief", { method: "POST" })
      if (!res.ok) throw new Error("Eroare server")
      const data = (await res.json()) as {
        brief?: {
          summary: string
          frameworkSummaries: Array<{ framework: string; status: string }>
          disclaimer: string
        }
      }
      if (!data.brief) throw new Error("Brief gol")

      const text = [
        "=== COUNSEL BRIEF — CompliScan ===",
        "",
        data.brief.summary,
        "",
        ...data.brief.frameworkSummaries.map(
          (f) => `${f.framework}: ${f.status}`
        ),
        "",
        data.brief.disclaimer,
      ].join("\n")

      await navigator.clipboard.writeText(text)
      toast.success("Brief juridic copiat în clipboard")
    } catch {
      toast.error("Nu am putut genera brieful juridic")
    } finally {
      setBriefLoading(false)
    }
  }, [])

  const handleShareToken = useCallback(async (recipientType: "accountant" | "counsel") => {
    setShareLoading(true)
    try {
      const res = await fetch("/api/reports/share-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientType }),
      })
      if (!res.ok) throw new Error("Eroare server")
      const data = (await res.json()) as {
        token?: { token: string; expiresAtISO: string }
      }
      if (!data.token) throw new Error("Token gol")

      const link = `${window.location.origin}/shared/${data.token.token}`
      setShareLink(link)
      await navigator.clipboard.writeText(link)
      toast.success(`Link securizat copiat — expiră în 72h`)
    } catch {
      toast.error("Nu am putut genera linkul de partajare")
    } finally {
      setShareLoading(false)
    }
  }, [])

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div>
          <CardTitle className="text-xl">Partner & Counsel Pack</CardTitle>
          <p className="mt-1 text-sm text-eos-text-muted">
            Partajează starea conformității cu contabilul sau generează un brief juridic.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <div className="flex items-center gap-2 text-eos-text">
            <Scale className="size-4" strokeWidth={2} />
            <p className="text-sm font-medium">Brief juridic (Counsel)</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-eos-text-muted">
            Sumar legal cu referințe la legislație, gap-uri critice și recomandări.
          </p>
          <Button
            variant="outline"
            size="default"
            className="mt-4 gap-2"
            onClick={() => void handleCounselBrief()}
            disabled={briefLoading}
          >
            {briefLoading ? <Loader2 className="size-4 animate-spin" /> : <Briefcase className="size-4" />}
            Generează brief
          </Button>
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <div className="flex items-center gap-2 text-eos-text">
            <Share2 className="size-4" strokeWidth={2} />
            <p className="text-sm font-medium">Partajează cu contabilul</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-eos-text-muted">
            Link securizat cu expirare 72h. Contabilul vede doar starea.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => void handleShareToken("accountant")}
              disabled={shareLoading}
            >
              {shareLoading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Link contabil
            </Button>
            <Button
              variant="outline"
              size="default"
              className="gap-2"
              onClick={() => void handleShareToken("counsel")}
              disabled={shareLoading}
            >
              <Scale className="size-4" />
              Link consilier
            </Button>
          </div>
          {shareLink && (
            <div className="mt-3 flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
              <p className="flex-1 truncate text-xs text-eos-text-muted">{shareLink}</p>
              <button
                className="shrink-0 text-eos-text-muted hover:text-eos-text"
                onClick={() => void navigator.clipboard.writeText(shareLink).then(() => toast.info("Link copiat"))}
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
