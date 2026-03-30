"use client"

import dynamic from "next/dynamic"
import { useCallback, useEffect, useRef, useState } from "react"
import { Archive, ArrowRight, Briefcase, ChevronRight, Copy, FileCheck2, Loader2, Scale, Share2, Shield, ScrollText } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { ReportsTabs } from "@/components/compliscan/reports-tabs"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { DOCUMENT_ADOPTION_LABELS } from "@/lib/compliance/document-adoption"
import type { GeneratedDocumentRecord } from "@/lib/compliance/types"

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
        detail="Se încarcă starea de audit a pack-ului."
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
        title="Export în încărcare"
        detail="Centrul de export se încarcă în fundal."
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
        detail="Se încarcă simularea controlului extern."
      />
    ),
  }
)

export function ReportsPageSurface({ hideHeader = false }: { hideHeader?: boolean } = {}) {
  const runtime = useDashboardRuntime()
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
  const auditStatusLabel =
    activeDrifts.some((drift) => drift.blocksAudit)
      ? "Blocat"
      : cockpit.data.summary.score >= 90
        ? "Pregătit"
        : "În progres"
  const isSolo = runtime?.userMode === "solo"

  return (
    <div className="space-y-6">
      {!hideHeader && (
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">Rapoarte</p>
          <h1 className="mt-1.5 text-2xl font-semibold text-eos-text">
            {isSolo ? "Dosarul tău" : "Dovezi și livrabile"}
          </h1>
          <p className="mt-1 text-sm text-eos-text-tertiary">
            {isSolo
              ? "Documentele generate, exporturile și dovezile aprobate — tot ce ai nevoie pentru un audit sau un control."
              : "Output-ul conformității tale — livrabile gata de trimis, dovezi aprobate și pachet de handoff."}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-tertiary">
              doar vizualizare
            </span>
            <span className="rounded-full border border-eos-border bg-eos-surface-active px-3 py-1 text-xs font-medium text-eos-text-tertiary">
              Audit: {auditStatusLabel}
            </span>
          </div>
        </div>
      )}

      {!isSolo ? <ReportsTabs /> : null}

      {/* Vault — Documentele tale, primul lucru vizibil */}
      {cockpit.data.state.generatedDocuments.length > 0 && (
        <GeneratedDocumentsVault docs={cockpit.data.state.generatedDocuments} />
      )}

      {/* Export Center — după ce ai văzut ce ai */}
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

      {/* Share token — vizibil deasupra fold pentru non-solo */}
      {!isSolo ? <PartnerCounselPack /> : null}

      {/* Secondary: detailed info under fold */}
      <details className="group">
        <summary className="flex cursor-pointer items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-3.5 text-sm font-medium text-eos-text-muted transition hover:bg-eos-surface-active [&::-webkit-details-marker]:hidden">
          <ChevronRight className="size-4 shrink-0 text-eos-text-tertiary transition-transform group-open:rotate-90" strokeWidth={2} />
          Detalii snapshot și semnale
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

          {!isSolo ? <InspectorModePanel /> : null}

          {/* Contextual access — Trust surfaces */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              href="/dashboard/reports/trust-center"
              className="flex items-center gap-3 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3 text-sm transition-colors hover:border-eos-border hover:bg-eos-surface-active"
            >
              <Shield className="size-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-eos-text-muted">Trust Center</p>
                <p className="text-xs text-eos-text-tertiary">Profil public de conformitate</p>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
            </Link>
            <Link
              href="/dashboard/reports/audit-log"
              className="flex items-center gap-3 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3 text-sm transition-colors hover:border-eos-border hover:bg-eos-surface-active"
            >
              <ScrollText className="size-4 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-eos-text-muted">Jurnal audit</p>
                <p className="text-xs text-eos-text-tertiary">Istoricul complet al acțiunilor</p>
              </div>
              <ArrowRight className="size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={2} />
            </Link>
          </div>
        </div>
      </details>
    </div>
  )
}

function SectionLoadingCard({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant p-5">
      <p className="text-sm font-semibold text-eos-text-muted">{title}</p>
      <p className="mt-1 text-xs text-eos-text-tertiary">{detail}</p>
    </div>
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
    <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
      <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
        <h2 className="text-lg font-semibold text-eos-text">Snapshot curent</h2>
        <p className="mt-1 text-sm text-eos-text-tertiary">Baza din care pornesc exporturile și dovezile.</p>
      </div>
      <div className="space-y-4 px-5 py-5">
        {!latestSnapshot && (
          <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-5 py-10 text-center">
            <p className="text-sm font-medium text-eos-text-tertiary">Niciun snapshot înregistrat</p>
            <p className="mt-1 text-xs text-eos-text-tertiary">Rulează un scan complet, apoi revino pentru export.</p>
          </div>
        )}

        {latestSnapshot && (
          <>
            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-tertiary">Generat</p>
              <p className="mt-2 text-sm font-semibold text-eos-text">
                {new Date(latestSnapshot.generatedAt).toLocaleString("ro-RO")}
              </p>
              <p className="mt-2 text-xs text-eos-text-tertiary">
                {latestSnapshot.snapshotId}
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SnapshotMeta label="Surse" value={latestSnapshot.sources.length} />
              <SnapshotMeta label="Sisteme" value={latestSnapshot.systems.length} />
              <SnapshotMeta label="Probleme detectate" value={latestSnapshot.findings.length} />
              <SnapshotMeta label="Modificari incluse" value={driftCount} />
            </div>

            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-eos-border bg-eos-surface-active px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">
                  comparat cu
                </span>
                <span className="text-sm text-eos-text-muted">
                  {latestSnapshot.comparedToSnapshotId || "fara comparatie"}
                </span>
              </div>
              <p className="mt-3 text-sm text-eos-text-tertiary">
                {validatedBaseline
                  ? `Baseline validat activ: ${validatedBaseline.snapshotId}`
                  : "Nu exista baseline validat."}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function SnapshotMeta({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
      <p className="text-xs uppercase tracking-[0.24em] text-eos-text-tertiary">{label}</p>
      <p className="mt-2 text-sm font-semibold text-eos-text-muted">{value}</p>
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
    <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
      <div className="border-b border-eos-border-subtle px-5 pt-5 pb-4">
        <h2 className="text-lg font-semibold text-eos-text">Partner & Counsel Pack</h2>
        <p className="mt-1 text-sm text-eos-text-tertiary">
          Partajează starea conformității cu contabilul sau generează un brief juridic.
        </p>
      </div>
      <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
          <div className="flex items-center gap-2 text-eos-text-muted">
            <Scale className="size-4" strokeWidth={2} />
            <p className="text-sm font-medium">Brief juridic (Counsel)</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-eos-text-tertiary">
            Sumar legal cu referințe la legislație, gap-uri critice și recomandări.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => void handleCounselBrief()}
            disabled={briefLoading}
          >
            {briefLoading ? <Loader2 className="size-4 animate-spin" /> : <Briefcase className="size-4" />}
            Generează brief
          </button>
        </div>

        <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant p-4">
          <div className="flex items-center gap-2 text-eos-text-muted">
            <Share2 className="size-4" strokeWidth={2} />
            <p className="text-sm font-medium">Partajează cu contabilul</p>
          </div>
          <p className="mt-2 text-xs leading-5 text-eos-text-tertiary">
            Link securizat cu expirare 72h. Contabilul vede doar starea.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleShareToken("accountant")}
              disabled={shareLoading}
            >
              {shareLoading ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
              Link contabil
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 py-2 text-sm font-medium text-eos-text-muted transition hover:text-eos-text-muted disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void handleShareToken("counsel")}
              disabled={shareLoading}
            >
              <Scale className="size-4" />
              Link consilier
            </button>
          </div>
          {shareLink && (
            <div className="mt-3 flex items-center gap-2 rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
              <p className="flex-1 truncate text-xs text-eos-text-tertiary">{shareLink}</p>
              <button
                type="button"
                className="shrink-0 text-eos-text-tertiary hover:text-eos-text-muted transition-colors"
                onClick={() => void navigator.clipboard.writeText(shareLink).then(() => toast.info("Link copiat"))}
              >
                <Copy className="size-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vault — Documente generate automat ───────────────────────────────────────

const DOC_TYPE_LABELS: Record<string, string> = {
  "ai-governance": "Audit Pack",
  "privacy-policy": "Politică de confidențialitate",
  "nis2-incident-response": "Plan IR NIS2",
  "dpa-agreement": "Acord DPA",
  "data-processing-record": "Registru Prelucrări",
}

function GeneratedDocumentsVault({ docs }: { docs: GeneratedDocumentRecord[] }) {
  const sorted = [...docs].sort(
    (a, b) => new Date(b.generatedAtISO).getTime() - new Date(a.generatedAtISO).getTime()
  )
  const recent = sorted.slice(0, 6)
  const hasAutoGenerated = sorted.some((d) => d.id.startsWith("audit-pack-auto-"))

  return (
    <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant">
      <div className="border-b border-eos-border-subtle px-5 pt-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold text-eos-text-muted">
              <Archive className="size-4 text-eos-primary/70" strokeWidth={2} />
              Vault — Documente generate
            </h2>
            <p className="mt-1 text-xs text-eos-text-tertiary">
              {sorted.length} document{sorted.length !== 1 ? "e" : ""} înregistrat{sorted.length !== 1 ? "e" : ""} în registru
              {hasAutoGenerated && " · include generări automate lunare"}
            </p>
          </div>
          <span className="rounded-full border border-eos-border bg-eos-surface-active px-2.5 py-0.5 text-xs font-medium text-eos-text-tertiary">
            {sorted.length} total
          </span>
        </div>
      </div>
      <div className="px-5 py-4">
        <div className="divide-y divide-eos-border-subtle">
          {recent.map((doc) => {
            const isAuto = doc.id.startsWith("audit-pack-auto-")
            const typeLabel = DOC_TYPE_LABELS[doc.documentType] ?? doc.documentType
            return (
              <div key={doc.id} className="flex flex-wrap items-center gap-3 py-3">
                <FileCheck2 className="size-4 shrink-0 text-eos-primary/60" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-eos-text-muted">{doc.title}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] text-eos-text-tertiary">
                      {new Date(doc.generatedAtISO).toLocaleDateString("ro-RO", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </span>
                    <span className="rounded-full border border-eos-border px-1.5 py-0.5 text-[10px] text-eos-text-tertiary">
                      {typeLabel}
                    </span>
                    {isAuto && (
                      <span className="rounded-full bg-eos-primary-soft px-1.5 py-0.5 text-[10px] font-medium text-eos-primary/70">
                        generat automat
                      </span>
                    )}
                    {doc.approvalStatus === "approved_as_evidence" && (
                      <span className="rounded-full bg-eos-success-soft px-1.5 py-0.5 text-[10px] font-semibold text-eos-success">
                        aprobat
                      </span>
                    )}
                    {doc.approvalStatus === "draft" && (
                      <span className="rounded-full bg-eos-warning-soft px-1.5 py-0.5 text-[10px] font-semibold text-eos-warning">
                        draft
                      </span>
                    )}
                    {doc.adoptionStatus && (
                      <span className="rounded-full bg-eos-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-eos-primary">
                        {DOCUMENT_ADOPTION_LABELS[doc.adoptionStatus]}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {sorted.length > 6 && (
          <p className="mt-3 text-center text-xs text-eos-text-tertiary">
            + {sorted.length - 6} mai vechi
          </p>
        )}
      </div>
    </div>
  )
}
