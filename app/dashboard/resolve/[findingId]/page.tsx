"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
  FindingCaseClosedCard,
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
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { getCloseGatingRequirements } from "@/lib/compliscan/finding-kernel"
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
  nextMonitoringDateISO?: string
  reopenedFromISO?: string
  operationalEvidenceNote?: string
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

function getDefaultReviewDateInput() {
  const nextReviewDate = new Date()
  nextReviewDate.setUTCDate(nextReviewDate.getUTCDate() + 90)
  return nextReviewDate.toISOString().slice(0, 10)
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>()
  const router = useRouter()
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
  const [operationalEvidenceNote, setOperationalEvidenceNote] = useState("")
  const [revalidationConfirmed, setRevalidationConfirmed] = useState(false)
  const [nextReviewDateISO, setNextReviewDateISO] = useState(getDefaultReviewDateInput())
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
        setOperationalEvidenceNote(data.finding.operationalEvidenceNote ?? "")
        setRevalidationConfirmed(false)
        setNextReviewDateISO(data.finding.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
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
        setOperationalEvidenceNote(data.finding.operationalEvidenceNote ?? "")
        setRevalidationConfirmed(false)
        setNextReviewDateISO(data.finding.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.findingId])

  useEffect(() => {
    if (!finding) return

    const status = finding.findingStatus ?? "open"
    const r = buildCockpitRecipe(finding)
    const hasGen = r.visibleBlocks.detailBlocks.includes("generator")
    const shouldAutoOpenGenerator =
      searchParams.get("generator") === "1" || searchParams.get("action") === "generate"

    if (!hasGen || status !== "confirmed" || !shouldAutoOpenGenerator || autoOpenConsumed) {
      return
    }

    setGeneratorOpen(true)
    setAutoOpenConsumed(true)
  }, [autoOpenConsumed, finding, searchParams])

  useEffect(() => {
    if (!finding) return

    const evidenceFromScan = searchParams.get("evidenceNote")
    if (evidenceFromScan) {
      setOperationalEvidenceNote(evidenceFromScan)
    }

    if (searchParams.get("siteScan") === "done") {
      setStatusFeedback(
        "Ai revenit din re-scanul site-ului. Revizuiește nota precompletată și închide cazul doar dacă rezultatul confirmă remedierea."
      )
    }
    if (searchParams.get("anspdcp") === "done") {
      setStatusFeedback(
        "Ai revenit din flow-ul de breach. Revizuiește nota precompletată și închide cazul doar dacă trimiterea sau raționamentul ANSPDCP sunt documentate complet."
      )
    }
  }, [finding, searchParams])

  async function updateStatus(
    status: "open" | "confirmed" | "dismissed" | "resolved",
    options?: {
      openGeneratorAfter?: boolean
      redirectTo?: string
      evidenceNote?: string
      revalidationConfirmed?: boolean
      newReviewDateISO?: string
    }
  ) {
    if (!finding) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          evidenceNote: options?.evidenceNote,
          revalidationConfirmed: options?.revalidationConfirmed,
          newReviewDateISO: options?.newReviewDateISO,
        }),
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
      setOperationalEvidenceNote(payload.finding?.operationalEvidenceNote ?? "")
      setNextReviewDateISO(payload.finding?.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
      setRevalidationConfirmed(false)
      if (options?.openGeneratorAfter) {
        setGeneratorOpen(true)
      }
      if (options?.redirectTo) {
        router.push(options.redirectTo)
      }
      if (status === "resolved") {
        setShowDossierMoment(true)
      }
      if (status === "open") {
        setShowDossierMoment(false)
      }
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
  const recipe = buildCockpitRecipe(finding, {
    documentFlowState,
    linkedGeneratedDocument: linkedGeneratedDocument ?? undefined,
  })
  const successMomentVisible =
    (searchParams.get("success") === "dossier" || showDossierMoment) &&
    isFindingResolvedLike(status)
  const dossierMomentVisible =
    successMomentVisible &&
    linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
  const caseClosedMomentVisible = successMomentVisible && !dossierMomentVisible
  const hasGenerator = recipe.visibleBlocks.detailBlocks.includes("generator")
  const closeGating = getCloseGatingRequirements(recipe.findingTypeId)
  const requiresOperationalEvidence = status === "confirmed" && !hasGenerator && closeGating.requiresEvidenceNote
  const requiresRevalidation = status === "confirmed" && !hasGenerator && recipe.resolveFlowState === "needs_revalidation"
  const resolveDisabled =
    actionLoading ||
    (requiresOperationalEvidence && !operationalEvidenceNote.trim()) ||
    (requiresRevalidation && (!revalidationConfirmed || !nextReviewDateISO))
  const previousEvidence =
    finding.operationalEvidenceNote ||
    finding.resolution?.closureEvidence ||
    linkedGeneratedDocument?.title
  const detailHelperText =
    status === "open" && hasGenerator
      ? "Confirmi cazul și intri direct în draftul recomandat, fără o pagină separată între finding și generator."
      : status === "open"
        ? "Mai întâi confirmi sau respingi finding-ul. După confirmare, Compli deschide fluxul corect de închidere."
      : status === "confirmed" && hasGenerator
        ? "După review și aprobare, draftul merge la dosar și finding-ul se închide cu urmă clară."
      : status === "confirmed"
          ? recipe.heroSummary
          : "Finding-ul rămâne în istoric, cu dovada salvată și monitorizare activă pentru reverificări sau drift."
  const evidenceCardCopy =
    recipe.findingTypeId === "GDPR-013"
      ? {
          eyebrow: "Dovadă de răspuns obligatorie",
          body: "Leagă cazul de workflow-ul DSAR, apoi notează cum ai verificat identitatea și când ai trimis răspunsul.",
          placeholder: "Ex: Cerere DSAR creată în modulul dedicat, identitatea verificată, răspuns trimis pe email la 26.03.2026 și salvat la dosar.",
          footer: "Cazul nu poate intra în monitorizare fără urma clară a răspunsului DSAR.",
        }
      : recipe.findingTypeId === "GDPR-014"
        ? {
            eyebrow: "Dovadă de ștergere obligatorie",
            body: "Leagă cazul de workflow-ul DSAR pentru ștergere, apoi notează ce sisteme au fost afectate și când a fost trimis răspunsul final.",
            placeholder: "Ex: Cerere de ștergere creată în modulul DSAR, date șterse din CRM și marketing la 26.03.2026, răspuns trimis pe email și salvat la dosar.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a ștergerii executate și a răspunsului trimis.",
          }
      : recipe.findingTypeId === "GDPR-019"
        ? {
            eyebrow: "Dovadă breach obligatorie",
            body: "Notează numărul de înregistrare ANSPDCP sau explică de ce notificarea nu a fost necesară, pe baza situației documentate în incident.",
            placeholder: "Ex: Notificare ANSPDCP trimisă la 26.03.2026, ref. ANSPDCP-2026-114. Categorii afectate: date identitate și contact. Sau: incident analizat, risc scăzut pentru drepturile persoanelor, notificarea nu a fost necesară.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a deciziei și a trimiterii ANSPDCP.",
          }
      : {
          eyebrow: "Dovadă operațională obligatorie",
          body: "Spune concret ce ai corectat, unde ai făcut remedierea și ce urmă poate fi verificată mai departe.",
          placeholder: "Ex: TaxTotal corectat în ERP, factura retransmisă în SPV, confirmare de primire primită la 26.03.2026.",
          footer: "Cazul nu poate intra în monitorizare fără această dovadă operațională.",
        }

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

      {finding.reopenedFromISO && status === "open" ? (
        <Card className="border-eos-warning-border bg-eos-warning-soft/30">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-eos-text">
              Cazul a mai fost închis pe {new Date(finding.reopenedFromISO).toLocaleDateString("ro-RO")}. Contextul și dovada anterioară rămân disponibile în cockpit pentru comparație și revalidare.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {dossierMomentVisible && linkedGeneratedDocument ? (
        <FindingDossierSuccessCard
          findingTitle={finding.title}
          linkedGeneratedDocument={linkedGeneratedDocument}
          primaryHref={dashboardRoutes.auditorVault}
          secondaryHref={dashboardRoutes.auditLog}
          feedbackMessage="Dovada a intrat la dosar și rămâne disponibilă pentru audit, handoff și reverificare. De aici înainte intră în monitorizare, nu dispare."
        />
      ) : null}

      {caseClosedMomentVisible ? (
        <FindingCaseClosedCard
          findingTitle={finding.title}
          savedAtISO={finding.findingStatusUpdatedAtISO ?? new Date().toISOString()}
          nextReviewDateISO={finding.nextMonitoringDateISO}
          closureEvidence={finding.operationalEvidenceNote ?? finding.resolution?.closureEvidence ?? null}
          feedbackMessage={statusFeedback}
          primaryHref={dashboardRoutes.auditorVault}
          secondaryHref={dashboardRoutes.auditLog}
        />
      ) : null}

      {/* ── Hero Action — above the fold, dominant ────────────────────── */}
      {status === "open" && (
        <FindingHeroAction
          finding={finding}
          recipe={recipe}
          helperText="Confirmă dacă problema este reală și începi remedierea. Respinge doar dacă este fals pozitiv sau deja acoperită."
        >
          {hasGenerator ? (
            <Button
              data-testid="confirm-and-generate"
              onClick={() => updateStatus("confirmed", { openGeneratorAfter: true })}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              Confirmă și generează
            </Button>
          ) : recipe.workflowLink ? (
            <Button
              data-testid="confirm-and-open-workflow"
              onClick={() =>
                updateStatus("confirmed", {
                  redirectTo: recipe.workflowLink?.href,
                })
              }
              disabled={actionLoading}
              className="gap-1.5"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              {recipe.findingTypeId === "GDPR-005"
                ? "Confirmă și scanează site-ul"
                : recipe.findingTypeId === "GDPR-019"
                  ? "Confirmă și deschide breach flow"
                : "Confirmă și continuă"}
            </Button>
          ) : (
            <Button
              data-testid="confirm-finding"
              onClick={() => updateStatus("confirmed")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Confirmă finding-ul
            </Button>
          )}
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
          recipe={recipe}
          helperText={detailHelperText}
        >
          {hasGenerator ? (
            <Button
              data-testid="open-generator-drawer"
              onClick={() => setGeneratorOpen(true)}
              className="gap-1.5"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              {documentFlowState === "draft_ready" ? "Continuă flow-ul" : recipe.primaryCTA.label}
            </Button>
          ) : (
            <>
              {recipe.workflowLink ? (
                <Link href={recipe.workflowLink.href}>
                  <Button
                    data-testid="open-workflow-link"
                    className="gap-1.5"
                  >
                    <FileText className="size-3.5" strokeWidth={2} />
                    {recipe.workflowLink.label}
                  </Button>
                </Link>
              ) : null}
              <Button
                data-testid="mark-finding-resolved"
                onClick={() =>
                  updateStatus("resolved", {
                    evidenceNote: operationalEvidenceNote.trim() || undefined,
                    revalidationConfirmed,
                    newReviewDateISO: requiresRevalidation ? nextReviewDateISO : undefined,
                  })
                }
                disabled={resolveDisabled}
                className="gap-1.5"
                variant={recipe.workflowLink ? "outline" : "default"}
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                {recipe.closureCTA ?? recipe.primaryCTA.label}
              </Button>
            </>
          )}
        </FindingHeroAction>
      )}

      {requiresOperationalEvidence ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-3 px-5 py-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                {evidenceCardCopy.eyebrow}
              </p>
              <p className="mt-1 text-sm text-eos-text-muted">
                {evidenceCardCopy.body}
              </p>
            </div>
            <textarea
              data-testid="operational-evidence-note"
              value={operationalEvidenceNote}
              onChange={(event) => setOperationalEvidenceNote(event.target.value)}
              rows={4}
              className="ring-focus w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"
              placeholder={evidenceCardCopy.placeholder}
            />
            <p className="text-xs text-eos-text-muted">
              {evidenceCardCopy.footer}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {requiresRevalidation ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="space-y-4 px-5 py-5">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                Revalidare necesară
              </p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Reconfirmi dovada existentă, stabilești următorul control și lași cazul sub watch pe aceeași urmă.
              </p>
            </div>
            <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Dovada anterioară</p>
              <p className="mt-1 text-sm text-eos-text">
                {previousEvidence || "Nu există încă o dovadă anterioară explicită; completează nota de revalidare în contextul juridic al cazului."}
              </p>
            </div>
            <label className="flex items-start gap-3 rounded-eos-md border border-eos-border px-4 py-3 text-sm text-eos-text">
              <input
                data-testid="revalidation-confirmation"
                type="checkbox"
                checked={revalidationConfirmed}
                onChange={(event) => setRevalidationConfirmed(event.target.checked)}
                className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
              />
              <span>Confirm că am reverificat dovada și că rămâne valabilă pentru perioada următoare.</span>
            </label>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-eos-text">Următor review</label>
              <input
                data-testid="revalidation-next-review-date"
                type="date"
                value={nextReviewDateISO}
                onChange={(event) => setNextReviewDateISO(event.target.value)}
                className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {statusFeedback && !successMomentVisible && (
        <Card className="border-eos-primary/30 bg-eos-primary-soft/20">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-eos-text">{statusFeedback}</p>
          </CardContent>
        </Card>
      )}

      {/* ── Execution first, context second ───────────────────────────── */}
      <FindingExecutionCard
        finding={finding}
        documentFlowState={documentFlowState}
        linkedGeneratedDocument={linkedGeneratedDocument}
        recipe={recipe}
      />

      <details className="group rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
        <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
              Contextul cazului
            </p>
            <p className="mt-1 text-sm text-eos-text-muted">
              Vezi problema, impactul și dovada cerută doar când ai nevoie de context suplimentar, fără să încarci zona de execuție.
            </p>
          </div>
          <Badge variant="outline" className="normal-case tracking-normal">
            Deschide
          </Badge>
        </summary>
        <div className="mt-4">
          <FindingNarrativeCard
            finding={finding}
            title="Rezolvare în același loc"
            description="Problema, impactul și condiția de închidere rămân în aceeași urmă, fără să concureze cu pasul activ."
            recipe={recipe}
          />
        </div>
      </details>

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
        {finding.nextMonitoringDateISO && (
          <span>Următor control: {new Date(finding.nextMonitoringDateISO).toLocaleDateString("ro-RO")}</span>
        )}
        {finding.findingStatusUpdatedAtISO && (
          <span>Actualizat: {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
        )}
      </div>

      {isFindingResolvedLike(status) ? (
        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => updateStatus("open")}
            disabled={actionLoading}
            className="gap-1.5"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Redeschide cazul
          </Button>
        </div>
      ) : null}

      {/* ── Generator Drawer (in-context, no page navigation) ─────────── */}
      {hasGenerator && finding.suggestedDocumentType && (
        <GeneratorDrawer
          open={generatorOpen}
          onOpenChange={setGeneratorOpen}
          findingId={finding.id}
          documentType={(finding.suggestedDocumentType ?? "") as DocumentType}
          findingTitle={finding.title}
          vendorName={recipe.vendorContext?.vendorName}
          vendorDpaUrl={recipe.vendorContext?.dpaUrl}
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
