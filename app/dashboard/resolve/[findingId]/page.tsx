"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  Scale,
} from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanFinding } from "@/lib/compliance/types"
import {
  FindingDossierSuccessCard,
  FindingExecutionCard,
  FindingHeroAction,
  FindingNarrativeCard,
} from "@/components/compliscan/finding-cockpit-shared"
import {
  getFindingAgeLabel,
  isFindingResolvedLike,
  getFindingStatusPresentation,
} from "@/lib/compliscan/finding-cockpit"
import { GeneratorDrawer } from "@/components/compliscan/generator-drawer"
import type { DocumentType } from "@/lib/server/document-generator"

// Extended finding type — automation fields are optional so the page
// compiles regardless of which branch supplies the data.
type FindingDetail = ScanFinding & {
  findingStatus?: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
  findingStatusUpdatedAtISO?: string
  confidenceScore?: number
  requiresHumanReview?: boolean
  reasoning?: string
  sourceParagraph?: string
  suggestedDocumentType?: string
}

type LinkedGeneratedDocument = {
  id: string
  title: string
  generatedAtISO: string
  approvalStatus?: "draft" | "approved_as_evidence"
  approvedAtISO?: string
  approvedByEmail?: string
  expiresAtISO?: string
  nextReviewDateISO?: string
}

type FindingDetailResponse = {
  finding: FindingDetail
  linkedGeneratedDocument?: LinkedGeneratedDocument | null
  documentFlowState?: "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
  feedbackMessage?: string
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>()
  const searchParams = useSearchParams()
  const [finding, setFinding] = useState<FindingDetail | null>(null)
  const [linkedGeneratedDocument, setLinkedGeneratedDocument] = useState<LinkedGeneratedDocument | null>(null)
  const [documentFlowState, setDocumentFlowState] = useState<
    "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
  >("not_required")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [showDossierMoment, setShowDossierMoment] = useState(false)
  const [autoOpenConsumed, setAutoOpenConsumed] = useState(false)
  const { reloadDashboard } = useCockpitMutations()

  const refetchFinding = useCallback(() => {
    if (!params.findingId) return
    fetch(`/api/findings/${encodeURIComponent(params.findingId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare server.")
        return r.json()
      })
      .then((data: FindingDetailResponse) => {
        setFinding(data.finding)
        setLinkedGeneratedDocument(data.linkedGeneratedDocument ?? null)
        setDocumentFlowState(data.documentFlowState ?? "not_required")
      })
      .catch(() => {})
    void reloadDashboard()
  }, [params.findingId, reloadDashboard])

  useEffect(() => {
    if (!params.findingId) return
    setLoading(true)
    setShowDossierMoment(false)
    setAutoOpenConsumed(false)
    fetch(`/api/findings/${encodeURIComponent(params.findingId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Finding inexistent." : "Eroare server.")
        return r.json()
      })
      .then((data: FindingDetailResponse) => {
        setFinding(data.finding)
        setLinkedGeneratedDocument(data.linkedGeneratedDocument ?? null)
        setDocumentFlowState(data.documentFlowState ?? "not_required")
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.findingId])

  useEffect(() => {
    if (!finding) return

    const status = finding.findingStatus ?? "open"
    const requiresDocumentFlow = Boolean(finding.suggestedDocumentType)
    const shouldAutoOpenGenerator =
      searchParams.get("generator") === "1" || searchParams.get("action") === "generate"

    if (!requiresDocumentFlow || status !== "confirmed" || !shouldAutoOpenGenerator || autoOpenConsumed) {
      return
    }

    setGeneratorOpen(true)
    setAutoOpenConsumed(true)
  }, [autoOpenConsumed, finding, searchParams])

  async function updateStatus(status: "confirmed" | "dismissed" | "resolved") {
    if (!finding) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Eroare la actualizare.")
      const payload = (await res.json()) as FindingDetailResponse
      setFinding(
        payload.finding ?? {
          ...finding,
          findingStatus: status === "resolved" ? "under_monitoring" : status,
          findingStatusUpdatedAtISO: new Date().toISOString(),
        }
      )
      setLinkedGeneratedDocument(payload.linkedGeneratedDocument ?? null)
      setDocumentFlowState(payload.documentFlowState ?? "not_required")
      setStatusFeedback(payload.feedbackMessage ?? null)
      void reloadDashboard()
    } catch {
      setError("Nu s-a putut actualiza statusul.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error || !finding) return <ErrorScreen message={error ?? "Finding inexistent."} variant="section" />

  const status = (finding.findingStatus ?? "open") as "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
  const statusCfg = getFindingStatusPresentation(finding.findingStatus)
  const dossierMomentVisible =
    (searchParams.get("success") === "dossier" || showDossierMoment) &&
    isFindingResolvedLike(status) &&
    linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
  const requiresDocumentFlow = Boolean(finding.suggestedDocumentType)
  const detailHelperText =
    status === "open"
      ? "Mai întâi confirmi sau respingi finding-ul. După confirmare, Compli deschide fluxul corect de închidere."
      : status === "confirmed" && requiresDocumentFlow
        ? "După review și aprobare, draftul merge la dosar și finding-ul se închide cu urmă clară."
      : status === "confirmed"
          ? "După măsura reală și dovada aferentă, poți închide finding-ul fără pași ocoliți."
          : "Finding-ul rămâne în istoric, cu dovada salvată și monitorizare activă pentru reverificări sau drift."

  return (
    <div className="space-y-4 px-1 sm:space-y-6 sm:px-0">
      {/* Back nav */}
      <Link
        href={dashboardRoutes.resolve}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-eos-text-muted transition-colors hover:text-eos-text"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Înapoi la De rezolvat
      </Link>

      <PageIntro
        eyebrow={`Caz · ${finding.category.replace("_", " ")}`}
        title={finding.title}
        description={finding.detail}
        badges={
          <>
            <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
            <Badge variant={statusCfg.variant} className="normal-case tracking-normal">
              {statusCfg.label}
            </Badge>
            {finding.verdictConfidence && (
              <Badge variant="outline" className="normal-case tracking-normal">
                Încredere: {finding.verdictConfidence}
                {finding.confidenceScore != null && ` (${finding.confidenceScore}%)`}
              </Badge>
            )}
          </>
        }
        aside={
          <div className="space-y-2 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Detectat
            </p>
            <p className="text-sm text-eos-text-muted">{getFindingAgeLabel(finding.createdAtISO)}</p>
            {finding.sourceDocument && (
              <p className="text-xs text-eos-text-muted">
                Sursă: {finding.sourceDocument}
              </p>
            )}
          </div>
        }
      />

      {dossierMomentVisible && linkedGeneratedDocument ? (
        <FindingDossierSuccessCard
          findingTitle={finding.title}
          linkedGeneratedDocument={linkedGeneratedDocument}
          primaryHref={dashboardRoutes.auditorVault}
          secondaryHref={dashboardRoutes.auditLog}
          feedbackMessage="Dovada a intrat la dosar și rămâne disponibilă pentru audit, handoff și reverificare. De aici înainte intră în monitorizare, nu dispare."
        />
      ) : null}

      {/* ── Hero Action — above the fold, dominant ────────────────────── */}
      {status === "open" && (
        <FindingHeroAction
          finding={finding}
          helperText="Confirmă dacă problema este reală și începi remedierea. Respinge doar dacă este fals pozitiv sau deja acoperită."
        >
          <Button
            data-testid="confirm-finding"
            onClick={() => updateStatus("confirmed")}
            disabled={actionLoading}
            className="gap-1.5"
          >
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
            Confirmă finding-ul
          </Button>
          <Button
            data-testid="dismiss-finding"
            variant="outline"
            onClick={() => updateStatus("dismissed")}
            disabled={actionLoading}
            className="gap-1.5"
          >
            <XCircle className="size-3.5" strokeWidth={2} />
            Respinge
          </Button>
        </FindingHeroAction>
      )}

      {status === "confirmed" && (
        <FindingHeroAction
          finding={finding}
          helperText={detailHelperText}
        >
          {requiresDocumentFlow ? (
            <>
              <Button
                data-testid="open-generator-drawer"
                onClick={() => setGeneratorOpen(true)}
                className="gap-1.5"
              >
                <FileText className="size-3.5" strokeWidth={2} />
                {documentFlowState === "draft_ready" ? "Continuă flow-ul" : "Generează acum"}
              </Button>
              <Button
                data-testid="resolve-with-existing-evidence"
                variant="outline"
                onClick={() => updateStatus("resolved")}
                disabled={actionLoading}
                className="gap-1.5"
              >
                Am deja dovada
              </Button>
            </>
          ) : (
            <Button
              data-testid="mark-finding-resolved"
              onClick={() => updateStatus("resolved")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Marchează rezolvat
            </Button>
          )}
        </FindingHeroAction>
      )}

      {statusFeedback && !dossierMomentVisible && (
        <Card className="border-eos-primary/30 bg-eos-primary-soft/20">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-eos-text">{statusFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Details below the fold ────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <FindingNarrativeCard
          finding={finding}
          title="Rezolvare în același loc"
          description="Vezi problema, impactul și traseul de închidere fără să pleci din acest caz."
        />
        <FindingExecutionCard
          finding={finding}
          documentFlowState={documentFlowState}
          linkedGeneratedDocument={linkedGeneratedDocument}
        />
      </div>

      {(finding.legalMappings?.length || finding.provenance || finding.reasoning) ? (
        <details className="group rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                Context juridic și proveniență
              </p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Baza legală, semnalul sursă și explicația AI rămân disponibile când ai nevoie de ele, fără să încarce primul ecran.
              </p>
            </div>
            <Badge variant="outline" className="normal-case tracking-normal">
              Detalii
            </Badge>
          </summary>
          <div className="mt-4 space-y-4 border-t border-eos-border-subtle pt-4">
            {finding.legalMappings && finding.legalMappings.length > 0 && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Baza legală
                </p>
                {finding.legalMappings.map((lm, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                    <Scale className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-eos-text">
                        {lm.regulation} — {lm.article}
                      </p>
                      <p className="text-xs text-eos-text-muted">{lm.label}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">{lm.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {finding.provenance && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Proveniență semnal
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Regulă</p>
                    <p className="mt-1 text-sm text-eos-text">{finding.provenance.ruleId}</p>
                  </div>
                  {finding.provenance.matchedKeyword && (
                    <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Cuvânt cheie</p>
                      <p className="mt-1 text-sm text-eos-text font-mono">{finding.provenance.matchedKeyword}</p>
                    </div>
                  )}
                  {finding.provenance.signalSource && (
                    <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Sursă semnal</p>
                      <p className="mt-1 text-sm text-eos-text">{finding.provenance.signalSource}</p>
                    </div>
                  )}
                  {finding.provenance.signalConfidence && (
                    <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Încredere semnal</p>
                      <p className="mt-1 text-sm text-eos-text">{finding.provenance.signalConfidence}</p>
                    </div>
                  )}
                </div>
                {finding.provenance.excerpt && (
                  <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Excerpt sursă</p>
                    <p className="mt-1 text-sm leading-relaxed text-eos-text italic">
                      &ldquo;{finding.provenance.excerpt}&rdquo;
                    </p>
                  </div>
                )}
              </div>
            )}

            {finding.reasoning && (
              <div className="space-y-3">
                <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Raționament AI
                </p>
                <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                  <p className="text-sm leading-relaxed text-eos-text">{finding.reasoning}</p>
                  {finding.sourceParagraph && (
                    <div className="mt-3 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3">
                      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                        Paragraf sursă
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-eos-text-muted italic">
                        &ldquo;{finding.sourceParagraph}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </details>
      ) : null}

      {/* ── Metadata footer ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
        <span>ID: {finding.id}</span>
        {finding.scanId && <span>Scan: {finding.scanId}</span>}
        {finding.ownerSuggestion && <span>Owner sugerat: {finding.ownerSuggestion}</span>}
        {finding.findingStatusUpdatedAtISO && (
          <span>Actualizat: {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
        )}
      </div>

      {/* ── Generator Drawer (in-context, no page navigation) ─────────── */}
      {requiresDocumentFlow && (
        <GeneratorDrawer
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          findingId={finding.id}
          documentType={(finding.suggestedDocumentType ?? "") as DocumentType}
          findingTitle={finding.title}
          onComplete={(result) => {
            if (result?.dossierSaved) {
              setShowDossierMoment(true)
            }
            refetchFinding()
          }}
        />
      )}
    </div>
  )
}
