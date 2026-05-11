"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileText,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/evidence-os/Button"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { useCockpitMutations } from "@/components/compliscan/use-cockpit"
import {
  V3PageHero,
  V3Panel,
  V3RiskPill,
  V3FrameworkTag,
  V3Stepper,
  type V3SeverityTone,
  type V3StepperStep,
} from "@/components/compliscan/v3"
import { dashboardFindingRoute, dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanFinding } from "@/lib/compliance/types"
import {
  FindingCaseClosedCard,
  FindingDossierSuccessCard,
  FindingHeroAction,
} from "@/components/compliscan/finding-cockpit-shared"
import { DocumentAdoptionCard } from "@/components/compliscan/document-adoption-card"
import { ShareFindingButton } from "@/components/compliscan/fiscal/ShareFindingButton"
import {
  getFindingAgeLabel,
  isFindingResolvedLike,
  getFindingStatusPresentation,
} from "@/lib/compliscan/finding-cockpit"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import { getCloseGatingRequirements } from "@/lib/compliscan/finding-kernel"
import { GeneratorDrawer } from "@/components/compliscan/generator-drawer"
import { supportsDocumentAdoption, type DocumentAdoptionStatus } from "@/lib/compliance/document-adoption"
import type { FindingLifecycleView } from "@/lib/compliance/finding-lifecycle"
import type { DocumentType } from "@/lib/server/document-generator"

const GENERATOR_PROGRESS_TOAST_ID = "resolve-document-progress"

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
  documentType?: DocumentType
  title: string
  generatedAtISO: string
  approvalStatus?: "draft" | "approved_as_evidence"
  validationStatus?: "pending" | "passed"
  validatedAtISO?: string
  approvedAtISO?: string
  approvedByEmail?: string
  expiresAtISO?: string
  nextReviewDateISO?: string
  adoptionStatus?: DocumentAdoptionStatus
  adoptionUpdatedAtISO?: string
  adoptionEvidenceNote?: string
}

type EvidenceCompletenessItem = { label: string; done: boolean }

type FindingDetailResponse = {
  finding: FindingDetail
  linkedGeneratedDocument?: LinkedGeneratedDocument | null
  documentFlowState?: "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
  lifecycle?: FindingLifecycleView
  feedbackMessage?: string
  pendingApproval?: boolean
  actionId?: string
  evidenceCompleteness?: {
    total: number
    completed: number
    percentage: number
    items: EvidenceCompletenessItem[]
  }
}

const LIFECYCLE_STAGE_LABELS: Record<FindingLifecycleView["completedStages"][number], string> = {
  detected: "Detectat",
  triaged: "Triat",
  in_progress: "Lucrat",
  sent_to_client: "Trimis client",
  client_decided: "Feedback client",
  evidence_attached: "Dovadă",
  evidence_validated: "Validat",
  resolved: "Închis",
  monitoring: "Dosar",
}

function getExecutionClassLabel(recipe: ReturnType<typeof buildCockpitRecipe>) {
  if (recipe.documentSupport?.mode === "assistive") {
    return "Acțiune asistată"
  }

  switch (recipe.executionClass) {
    case "documentary":
      return "Document"
    case "specialist_handoff":
      return "Asistat"
    default:
      return "Acțiune"
  }
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
  const [operationalEvidenceNote, setOperationalEvidenceNote] = useState("")
  const [revalidationConfirmed, setRevalidationConfirmed] = useState(false)
  const [evidenceCompleteness, setEvidenceCompleteness] = useState<FindingDetailResponse["evidenceCompleteness"]>(undefined)
  const [lifecycle, setLifecycle] = useState<FindingLifecycleView | null>(null)
  const [pendingApprovalId, setPendingApprovalId] = useState<string | null>(null)
  const [nextReviewDateISO, setNextReviewDateISO] = useState(getDefaultReviewDateInput())
  const [manualReviewCycleId, setManualReviewCycleId] = useState<string | null>(null)
  const [manualReviewDate, setManualReviewDate] = useState(getDefaultReviewDateInput())
  const [manualReviewNotes, setManualReviewNotes] = useState("")
  const [manualReviewLoading, setManualReviewLoading] = useState(false)
  const [manualReviewSaving, setManualReviewSaving] = useState(false)
  const processedRopaFlowRef = useRef<string | null>(null)
  const { reloadDashboard } = useCockpitMutations()

  const applyFindingResponse = useCallback((data: FindingDetailResponse) => {
    setFinding(data.finding)
    setLinkedGeneratedDocument(data.linkedGeneratedDocument ?? null)
    setDocumentFlowState(data.documentFlowState ?? "not_required")
    setOperationalEvidenceNote(data.finding.operationalEvidenceNote ?? "")
    setStatusFeedback(data.feedbackMessage ?? null)
    setRevalidationConfirmed(false)
    setNextReviewDateISO(data.finding.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
    setEvidenceCompleteness(data.evidenceCompleteness)
    setLifecycle(data.lifecycle ?? null)
    if (data.pendingApproval && data.actionId) {
      setPendingApprovalId(data.actionId)
    }
  }, [])

  const refetchFinding = useCallback(() => {
    if (!params.findingId) return
    fetch(`/api/findings/${encodeURIComponent(params.findingId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error("Eroare server.")
        return r.json()
      })
      .then((data: FindingDetailResponse) => {
        applyFindingResponse(data)
      })
      .catch(() => {})
    void reloadDashboard()
  }, [applyFindingResponse, params.findingId, reloadDashboard])

  useEffect(() => {
    if (!params.findingId) return
    setLoading(true)
    fetch(`/api/findings/${encodeURIComponent(params.findingId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Finding inexistent." : "Eroare server.")
        return r.json()
      })
      .then((data: FindingDetailResponse) => {
        applyFindingResponse(data)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [applyFindingResponse, params.findingId])

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
    if (searchParams.get("dsarFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din flow-ul DSAR. Revizuiește dovada precompletată și închide cazul doar dacă identitatea și răspunsul sunt documentate clar."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("dsarProcessFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din pachetul DSAR. Revizuiește dovada precompletată și închide cazul doar dacă procedura, registrul și responsabilul sunt confirmate clar."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("ropaFlow") === "done") {
      const ropaDocId = searchParams.get("ropaDocId")
      const ropaNote = searchParams.get("evidenceNote") ?? ""
      const ropaChecklist = searchParams.get("checklist")?.split(",").filter(Boolean) ?? []
      const ropaFlowKey = `${finding.id}:${ropaDocId ?? "missing"}:${ropaNote}:${ropaChecklist.join(",")}`

      if (processedRopaFlowRef.current === ropaFlowKey) {
        return
      }

      processedRopaFlowRef.current = ropaFlowKey
      if (ropaDocId) {
        void updateStatus("resolved", {
          generatedDocumentId: ropaDocId,
          evidenceNote: decodeURIComponent(ropaNote) || undefined,
          confirmationChecklist: ropaChecklist.length > 0 ? ropaChecklist : undefined,
        })
      } else {
        setStatusFeedback(
          "Ai revenit din RoPA. Revizuiește dovada precompletată și închide cazul doar dacă registrul de prelucrări reflectă situația reală."
        )
      }
    }
    if (searchParams.get("assessmentFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din evaluarea NIS2. Revizuiește dovada precompletată și închide cazul doar dacă assessment-ul salvat reflectă situația reală."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("eligibilityFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din eligibilitatea NIS2. Revizuiește dovada precompletată și închide cazul doar dacă rezultatul salvat reflectă sectorul și mărimea firmei."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("dnscFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din wizardul DNSC. Revizuiește dovada precompletată și închide cazul doar dacă statusul, recipisa sau numărul de înregistrare sunt documentate clar."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("incidentFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din timeline-ul NIS2. Revizuiește nota precompletată și închide cazul doar dacă early warning-ul DNSC este documentat clar în incident."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("governanceFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din registrul Board & CISO. Revizuiește dovada precompletată și închide cazul doar dacă training-ul sau certificarea au fost salvate corect în registru."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("maturityFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din evaluarea de maturitate. Revizuiește dovada precompletată și închide cazul doar dacă domeniul evaluat și scorul salvat reflectă situația reală."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("vendorFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din registrul furnizorilor NIS2. Revizuiește dovada precompletată și închide cazul doar dacă revizuirea contractuală și urma din registru sunt complete."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("vendorPackFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din Vendor Review. Revizuiește dovada precompletată și închide cazul doar dacă pachetul vendor este pregătit și review-ul pentru furnizorii relevanți a fost pornit clar."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("fiscalStatusFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din protocolul fiscal. Revizuiește nota precompletată și închide cazul doar dacă verificarea SPV, transmiterea sau retransmiterea sunt documentate clar."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("jobDescriptionPackFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din pachetul HR. Revizuiește dovada precompletată și închide cazul doar dacă modelul de fișă, inventarul de roluri și planul de rollout sunt clare pentru rolurile reale din firmă."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("hrProcedurePackFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din pachetul de proceduri HR. Revizuiește dovada precompletată și închide cazul doar dacă regulamentul intern, planul de comunicare și urma de rollout sunt clare pentru firmă."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("regesCorrectionFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din brief-ul REGES. Revizuiește dovada precompletată și închide cazul doar dacă handoff-ul este clar, iar exportul sau confirmarea de corecție pot fi urmărite fără ambiguități."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
    if (searchParams.get("contractsPackFlow") === "done") {
      setStatusFeedback(
        "Ai revenit din pachetul contractual. Revizuiește dovada precompletată și închide cazul doar dacă baseline-ul contractual, locul de stocare și regula de folosire sunt clare pentru relațiile comerciale reale."
      )
      setTimeout(() => {
        const resolveButton = document.querySelector<HTMLElement>('[data-testid="mark-finding-resolved"]')
        resolveButton?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }
  }, [finding, searchParams])

  useEffect(() => {
    if (!finding || !isFindingResolvedLike(finding.findingStatus)) {
      setManualReviewCycleId(null)
      setManualReviewDate(getDefaultReviewDateInput())
      setManualReviewNotes("")
      setManualReviewLoading(false)
      return
    }

    const resolvedFindingId = finding.id
    const resolvedFindingNextMonitoringDate = finding.nextMonitoringDateISO?.slice(0, 10) ?? null
    let cancelled = false

    async function loadReviewCycle() {
      setManualReviewLoading(true)
      try {
        const response = await fetch(`/api/review-cycles?findingId=${encodeURIComponent(resolvedFindingId)}&limit=20`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Nu am putut încărca review-urile programate.")
        }
        const payload = (await response.json()) as {
          items?: Array<{
            id: string
            status: "upcoming" | "due" | "overdue" | "completed"
            scheduledAt: string
            notes?: string | null
          }>
        }
        if (cancelled) return

        const activeCycle =
          (payload.items ?? []).find((item) => item.status !== "completed") ?? payload.items?.[0] ?? null

        setManualReviewCycleId(activeCycle?.id ?? null)
        setManualReviewDate(activeCycle?.scheduledAt?.slice(0, 10) ?? resolvedFindingNextMonitoringDate ?? getDefaultReviewDateInput())
        setManualReviewNotes(activeCycle?.notes ?? "")
      } catch {
        if (cancelled) return
        setManualReviewCycleId(null)
        setManualReviewDate(resolvedFindingNextMonitoringDate ?? getDefaultReviewDateInput())
        setManualReviewNotes("")
      } finally {
        if (!cancelled) {
          setManualReviewLoading(false)
        }
      }
    }

    void loadReviewCycle()

    return () => {
      cancelled = true
    }
  }, [finding])

  async function updateStatus(
    status: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring",
    options?: {
      redirectTo?: string
      evidenceNote?: string
      revalidationConfirmed?: boolean
      newReviewDateISO?: string
      generatedDocumentId?: string
      confirmationChecklist?: string[]
    }
  ): Promise<FindingDetailResponse | null> {
    if (!finding) return null
    setActionLoading(true)
    try {
      if (status === "resolved" || status === "under_monitoring") {
        toast.dismiss(GENERATOR_PROGRESS_TOAST_ID)
      }
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          generatedDocumentId: options?.generatedDocumentId,
          evidenceNote: options?.evidenceNote,
          revalidationConfirmed: options?.revalidationConfirmed,
          newReviewDateISO: options?.newReviewDateISO,
          confirmationChecklist: options?.confirmationChecklist,
        }),
      })
      if (!res.ok) throw new Error("Eroare la actualizare.")
      const payload = (await res.json()) as FindingDetailResponse

      // P0-4: Handle pending approval response
      if (payload.pendingApproval && payload.actionId) {
        setPendingApprovalId(payload.actionId)
        setStatusFeedback(payload.feedbackMessage ?? "Acțiunea a intrat în coada de aprobări.")
        toast.info("Acțiune în așteptare", {
          description: payload.feedbackMessage ?? "Rezolvarea necesită aprobare.",
          duration: 5000,
        })
        setActionLoading(false)
        return payload
      }

      setFinding(
        payload.finding ?? {
          ...finding,
          findingStatus: status,
          findingStatusUpdatedAtISO: new Date().toISOString(),
        }
      )
      setLinkedGeneratedDocument(payload.linkedGeneratedDocument ?? null)
      setDocumentFlowState(payload.documentFlowState ?? "not_required")
      setStatusFeedback(payload.feedbackMessage ?? null)
      setOperationalEvidenceNote(payload.finding?.operationalEvidenceNote ?? "")
      setNextReviewDateISO(payload.finding?.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
      setRevalidationConfirmed(false)
      setEvidenceCompleteness(payload.evidenceCompleteness)
      setLifecycle(payload.lifecycle ?? null)
      setPendingApprovalId(null)
      if (options?.redirectTo) {
        router.push(options.redirectTo)
      }
      void reloadDashboard()
      return payload
    } catch {
      setError("Nu s-a putut actualiza statusul.")
      return null
    } finally {
      setActionLoading(false)
    }
  }

  async function saveManualReviewCycle() {
    if (!finding || !manualReviewDate) return

    setManualReviewSaving(true)
    try {
      const scheduledAt = new Date(`${manualReviewDate}T09:00:00.000Z`).toISOString()
      const response = await fetch(
        manualReviewCycleId
          ? `/api/review-cycles/${encodeURIComponent(manualReviewCycleId)}`
          : "/api/review-cycles",
        {
          method: manualReviewCycleId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            manualReviewCycleId
              ? {
                  scheduledAt,
                  notes: manualReviewNotes.trim() || undefined,
                }
              : {
                  findingId: finding.id,
                  findingTypeId: recipe.findingTypeId ?? null,
                  scheduledAt,
                  reviewType: "manual",
                  notes: manualReviewNotes.trim() || undefined,
                }
          ),
        }
      )
      if (!response.ok) {
        throw new Error("Nu am putut salva review-ul programat.")
      }
      const payload = (await response.json()) as { item?: { id?: string; scheduledAt?: string; notes?: string | null } }
      setManualReviewCycleId(payload.item?.id ?? manualReviewCycleId)
      setManualReviewDate(payload.item?.scheduledAt?.slice(0, 10) ?? manualReviewDate)
      setManualReviewNotes(payload.item?.notes ?? manualReviewNotes)
      toast.success(
        manualReviewCycleId
          ? "Review-ul programat a fost actualizat."
          : "Review-ul programat a fost creat."
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nu am putut salva review-ul programat.")
    } finally {
      setManualReviewSaving(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error || !finding) {
    const isMissing = !error || /inexistent|not found|404/i.test(error)
    return (
      <ErrorScreen
        message={isMissing ? "Cazul nu mai există sau a fost arhivat." : error ?? "Cazul nu a putut fi încărcat."}
        hint={
          isMissing
            ? "Vezi inbox-ul De rezolvat sau Dosarul pentru cazurile rezolvate."
            : "Verifică conexiunea și încearcă din nou."
        }
        variant="section"
      />
    )
  }

  const status = (finding.findingStatus ?? "open") as "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring"
  const statusCfg = getFindingStatusPresentation(finding.findingStatus)
  const recipe = buildCockpitRecipe(finding, {
    documentFlowState,
    linkedGeneratedDocument: linkedGeneratedDocument ?? undefined,
  })
  const introDescription = recipe.whatUserSees || finding.detail
  const generatorDocumentType = (recipe.documentSupport?.documentType ?? "") as DocumentType | ""
  const isOperationalAssisted = recipe.documentSupport?.mode === "assistive"
  const preparedDocumentReady =
    linkedGeneratedDocument?.validationStatus === "passed" &&
    linkedGeneratedDocument?.approvalStatus !== "approved_as_evidence"
  const successMomentVisible = status === "under_monitoring"
  const dossierMomentVisible =
    successMomentVisible &&
    linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
  const caseClosedMomentVisible = successMomentVisible && !dossierMomentVisible
  const hasGenerator =
    recipe.visibleBlocks.detailBlocks.includes("generator") && recipe.executionClass !== "specialist_handoff"
  const documentaryGeneratorVisible = hasGenerator && (status === "open" || status === "confirmed")
  const needsDocumentResolution =
    status === "confirmed" && hasGenerator && preparedDocumentReady && !isOperationalAssisted
  const showConfirmedHeroAction = status === "confirmed" && !hasGenerator
  const resolvedMomentVisible =
    status === "resolved" &&
    hasGenerator &&
    preparedDocumentReady &&
    Boolean(linkedGeneratedDocument?.id)
  const needsDossierHandoff =
    status === "resolved" &&
    hasGenerator &&
    preparedDocumentReady &&
    Boolean(linkedGeneratedDocument?.id)
  const adoptionTrackingVisible = Boolean(
    linkedGeneratedDocument &&
    linkedGeneratedDocument.approvalStatus === "approved_as_evidence" &&
    linkedGeneratedDocument.documentType &&
    supportsDocumentAdoption(linkedGeneratedDocument.documentType)
  )
  const closeGating = getCloseGatingRequirements(recipe.findingTypeId)
  const requiresOperationalEvidence =
    status === "confirmed" &&
    closeGating.requiresEvidenceNote &&
    (!hasGenerator || (isOperationalAssisted && preparedDocumentReady))
  const requiresRevalidation = status === "confirmed" && !hasGenerator && recipe.resolveFlowState === "needs_revalidation"
  const inlineOperationalAction =
    status === "confirmed" &&
    !hasGenerator &&
    !recipe.workflowLink &&
    (requiresOperationalEvidence || requiresRevalidation)
  const resolveDisabled =
    actionLoading ||
    (requiresOperationalEvidence && !operationalEvidenceNote.trim()) ||
    (requiresRevalidation && (!revalidationConfirmed || !nextReviewDateISO))
  const previousEvidence =
    finding.operationalEvidenceNote ||
    finding.resolution?.closureEvidence ||
    linkedGeneratedDocument?.title

  async function handleConfirmFinding() {
    const currentFinding = finding
    if (!currentFinding) return

    const payload = await updateStatus("confirmed")
    if (!payload || payload.pendingApproval) return

    if (hasGenerator) {
      const confirmedFindingId = payload.finding?.id ?? currentFinding.id
      router.replace(dashboardFindingRoute(confirmedFindingId, { generator: "1" }), { scroll: false })
      window.setTimeout(() => {
        const generatorDrawer = document.querySelector<HTMLElement>('[data-testid="finding-generator-drawer"]')
        generatorDrawer?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 80)
    }
  }
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
      : recipe.findingTypeId === "NIS2-015"
        ? {
            eyebrow: "Dovadă de raportare DNSC",
            body: `${recipe.whatUserMustDo} Notează ce ai trimis în early warning, pe ce incident și care este referința sau confirmarea rămasă în timeline.`,
            placeholder: "Ex: Early warning DNSC trimis la 26.03.2026 pentru incidentul Ransomware ERP. Referință internă: EW-2026-004. Raportul 72h rămâne deschis în tab-ul NIS2 incidents.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a early warning-ului DNSC și a incidentului la care se referă.",
          }
      : recipe.findingTypeId === "NIS2-GENERIC" && recipe.workflowLink?.href.includes("tab=vendors")
        ? {
            eyebrow: "Dovadă de revizuire furnizor NIS2",
            body: `${recipe.whatUserMustDo} Notează ce ai verificat în registrul furnizorilor și ce dovadă contractuală ai lăsat în dosar.`,
            placeholder: "Ex: Microsoft Corporation revizuit în registrul NIS2 la 26.03.2026. DPA verificat, clauza de notificare incidente confirmată, data ultimei revizuiri actualizată și contractul salvat la dosar.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a revizuirii furnizorului și a dovezii contractuale.",
          }
      : recipe.findingTypeId === "NIS2-GENERIC" && recipe.workflowLink?.href.includes("/dashboard/nis2/maturitate")
        ? {
            eyebrow: "Dovadă de evaluare maturitate NIS2",
            body: `${recipe.whatUserMustDo} Notează ce domeniu ai completat, ce răspunsuri ai confirmat și ce plan de remediere ai lăsat în evaluarea DNSC.`,
            placeholder: "Ex: Domeniul Business Continuity completat în evaluarea de maturitate la 26.03.2026. BCP și DRP confirmate ca lipsă, plan de remediere actualizat cu termen intern 30.04.2026 și assessment salvat.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a evaluării de maturitate și a planului salvat pentru domeniul afectat.",
          }
      : recipe.findingTypeId === "NIS2-GENERIC" && recipe.workflowLink?.href.includes("/dashboard/nis2/governance")
        ? {
            eyebrow: "Dovadă de actualizare Board & CISO",
            body: `${recipe.whatUserMustDo} Notează ce training sau ce certificare ai actualizat și cum ai salvat urma în registrul de guvernanță.`,
            placeholder: "Ex: Training NIS2 documentat pentru directorul operațional la 26.03.2026, registrul Board & CISO actualizat cu data completării și nota sesiunii. Sau: certificarea CISO reînnoită și noua dată de expirare salvată în registru.",
            footer: "Cazul nu poate intra în monitorizare fără urma clară a actualizării făcute în registrul Board & CISO.",
          }
      : recipe.findingTypeId === "GDPR-017"
          ? {
              eyebrow: "Dovadă de ștergere / anonimizare",
              body: "Politica de retenție generată te ajută, dar aici închizi cazul doar după ce spui ce date au fost șterse sau anonimizate, din ce sisteme, când a rulat controlul și ce log sau export poți arăta la audit.",
              placeholder: "Ex: Lead-urile expirate >12 luni au fost șterse din CRM la 26.03.2026. Export job #retention-2026-03-26 salvat, verificare făcută pe 124 înregistrări, fără excepții.",
              footer: "Cazul nu poate intra în monitorizare fără urma clară a execuției reale, nu doar politica de retenție.",
            }
      : recipe.findingTypeId === "AI-OPS"
        ? {
            eyebrow: "Dovadă operațională AI obligatorie",
            body: "Politica AI generată te ajută, dar aici închizi cazul doar după ce spui ce restricții, training sau protecții ai aplicat efectiv în firmă.",
            placeholder: "Ex: Politica AI publicată și comunicată la 28.03.2026. Echipa folosește doar ChatGPT Team, prompturile cu date personale sunt interzise, iar trainingul intern a fost ținut în aceeași zi.",
            footer: "Cazul nu poate intra în monitorizare doar cu politica. Trebuie și urma clară a aplicării reale.",
          }
      : recipe.findingTypeId === "GDPR-005"
        ? {
            eyebrow: "Dovadă operațională cookies obligatorie",
            body: "Politica de cookies generată te ajută, dar aici închizi cazul doar după ce spui ce ai schimbat în banner și ce verificare curată ai obținut la re-scan.",
            placeholder: "Ex: Bannerul a fost actualizat la 28.03.2026 ca să blocheze analytics înainte de consimțământ. Politica de cookies a fost publicată, iar re-scanul site-ului a confirmat lipsa trackerelor înainte de accept.",
            footer: "Cazul nu poate intra în monitorizare doar cu politica. Trebuie și urma clară a remedierii tehnice.",
          }
      : recipe.findingTypeId === "GDPR-020"
        ? {
            eyebrow: "Dovadă contractuală obligatorie",
            body: "După pachetul contractual, notează ce template-uri ai pus în baseline, unde sunt salvate și pentru ce relații comerciale intră în uz. Dacă ai link intern sau fișier, menționează-l clar aici.",
            placeholder: "Ex: Template contract client B2B și template furnizor revizuite cu juristul la 29.03.2026. Salvate în Drive /Legal/Contracte-standard-v4 și intră în uz pentru onboarding clienți noi și furnizori recurenti.",
            footer: "Cazul nu poate intra în monitorizare fără o urmă contractuală explicită despre baseline-ul pus în uz.",
          }
      : recipe.findingTypeId === "EF-001"
        ? {
            eyebrow: "Dovadă de activare SPV",
            body: `${recipe.whatUserMustDo} Atașează dovada că SPV-ul este activ și configurat corect pentru firma ta.`,
            placeholder: "Ex: SPV activat pe portal ANAF la 26.03.2026, screenshot din pagina SPV cu status activ. Sau: token ANAF reînnoit în Setări → Integrări, verificare rulată cu succes.",
            footer: "Cazul nu poate intra în monitorizare fără dovada că SPV-ul este activ și facturile pot fi transmise/recepționate.",
          }
      : recipe.findingTypeId === "EF-004"
        ? {
            eyebrow: "Factura nu e respinsă — verifică statusul în SPV",
            body: `${recipe.whatUserMustDo} Notează ce status ai găsit și dacă ai retransmis sau ai contactat ANAF.`,
            placeholder: "Ex: Am verificat în SPV ANAF la 26.03.2026 — factura FC-00294811 are status 'în prelucrare' de 80 ore. Am retransmis la 26.03.2026. Sau: statusul s-a schimbat la 'ok' la 26.03.2026.",
            footer: "Cazul nu poate intra în monitorizare fără dovada verificării statusului în SPV (screenshot sau referință ANAF).",
          }
      : recipe.findingTypeId === "EF-005"
        ? {
            eyebrow: "Dovadă de transmitere în SPV ANAF",
            body: `${recipe.whatUserMustDo} Notează data transmiterii și confirmarea primită de la ANAF.`,
            placeholder: "Ex: Factura INV-OAI-2026-03 transmisă în SPV ANAF la 26.03.2026. Confirmare ANAF primită cu numărul mesajului 2026-03-1234, status 'ok'.",
            footer: "Cazul nu poate intra în monitorizare fără dovada că factura a fost transmisă și acceptată în SPV ANAF.",
          }
      : recipe.findingTypeId === "EF-006"
        ? {
            eyebrow: "Dovadă corectare date client (buyer-side)",
            body: `${recipe.whatUserMustDo} Notează CUI-ul clientului verificat, ce ai corectat în factură și confirmarea după retransmitere.`,
            placeholder: "Ex: CUI client verificat la anaf.ro/verificare-cif — CUI 12345678 activ. Datele corectate în ERP. Factura retransmisă în SPV la 26.03.2026, confirmare status 'ok' primită.",
            footer: "Cazul nu poate intra în monitorizare fără dovada că datele clientului sunt corecte și factura a fost retransmisă cu succes.",
          }
      : recipe.findingTypeId === "EF-003"
        ? {
            eyebrow: "Dovadă de retransmitere e-Factura",
            body: `${recipe.whatUserMustDo} Notează referința de confirmare primită din SPV ANAF.`,
            placeholder: "Ex: Eroare corectată în ERP, factura retransmisă în SPV ANAF pe 26.03.2026, confirmare ANAF ref. 2026-XXXX primită cu status 'ok'.",
            footer: "Cazul nu poate intra în monitorizare fără dovada statusului 'ok' în SPV ANAF sau a retransmiterii corecte.",
          }
      : {
          eyebrow: "Dovadă operațională obligatorie",
          body: "Spune concret ce ai corectat, unde ai făcut remedierea și ce urmă poate fi verificată mai departe.",
          placeholder: "Ex: Măsura aplicată la 27.03.2026 în sistemul real. Urma verificabilă: registru actualizat, export salvat, link intern sau confirmare operațională păstrată la dosar.",
          footer: "Cazul nu poate intra în monitorizare fără această dovadă operațională.",
        }

  // Status progression rail steps
  const PROGRESS_STEPS = [
    { id: "open",             label: "Detectat" },
    { id: "confirmed",        label: "Confirmat" },
    { id: "resolved",         label: "Rezolvat" },
    { id: "under_monitoring", label: "Monitorizat" },
  ] as const
  const currentStepIdx = status === "dismissed"
    ? -1
    : PROGRESS_STEPS.findIndex((s) => s.id === status)

  function handleLinkedDocumentAdoptionUpdated(payload: {
    adoptionStatus: DocumentAdoptionStatus
    adoptionUpdatedAtISO?: string
    adoptionEvidenceNote?: string
  }) {
    setLinkedGeneratedDocument((current) =>
      current
        ? {
            ...current,
            adoptionStatus: payload.adoptionStatus,
            adoptionUpdatedAtISO: payload.adoptionUpdatedAtISO,
            adoptionEvidenceNote: payload.adoptionEvidenceNote,
          }
        : current
    )
    setStatusFeedback("Urma de adoptare a documentului a fost actualizată în Dosar.")
  }

  const severityTone: V3SeverityTone =
    finding.severity === "critical"
      ? "critical"
      : finding.severity === "high"
        ? "high"
        : finding.severity === "medium"
          ? "medium"
          : "low"
  const severityLabel =
    finding.severity === "critical"
      ? "Critic"
      : finding.severity === "high"
        ? "Ridicat"
        : finding.severity === "medium"
          ? "Mediu"
          : "Scăzut"

  const categoryLabel = finding.category.replace(/_/g, " ")

  const v3Steps: V3StepperStep[] = PROGRESS_STEPS.map((step, i) => ({
    id: step.id,
    label: step.label,
    status:
      i < currentStepIdx
        ? "done"
        : i === currentStepIdx
          ? "active"
          : "pending",
  }))

  return (
    <div className="space-y-4 sm:space-y-5">

      {/* ── V3 hero compact ──────────────────────────────────────────────── */}
      <V3PageHero
        compact
        breadcrumbs={[
          { label: "Firma mea" },
          { label: "Acțiuni" },
          { label: finding.id.toUpperCase(), current: true },
        ]}
        eyebrowBadges={
          <>
            <V3RiskPill tone={severityTone}>{severityLabel}</V3RiskPill>
            <V3FrameworkTag label={categoryLabel} tone="neutral" />
            <V3FrameworkTag label={getExecutionClassLabel(recipe)} tone="neutral" />
            <V3FrameworkTag label={statusCfg.label} tone={statusCfg.variant === "success" ? "ok" : statusCfg.variant === "warning" ? "high" : statusCfg.variant === "destructive" ? "critical" : "neutral"} />
          </>
        }
        title={finding.title}
        description={
          <>
            {introDescription}
            <span className="ml-2 inline-flex items-center gap-1.5 font-mono text-[11px] text-eos-text-tertiary">
              <span>{getFindingAgeLabel(finding.createdAtISO)}</span>
              {finding.sourceDocument && <span className="text-white/15">·</span>}
              {finding.sourceDocument && <span>Sursă: {finding.sourceDocument}</span>}
            </span>
          </>
        }
        actions={
          <div className="flex items-center gap-2">
            {finding.category === "E_FACTURA" && (
              <ShareFindingButton findingId={finding.id} findingTitle={finding.title} />
            )}
            <Link
              href={dashboardRoutes.resolve}
              className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              De rezolvat
            </Link>
          </div>
        }
      />

      {/* ── V3 stepper ───────────────────────────────────────────────────── */}
      {status !== "dismissed" && (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-3 py-2.5 md:px-4">
          <V3Stepper steps={v3Steps} />
        </div>
      )}

      {lifecycle ? (
        <V3Panel
          eyebrow="Finding lifecycle"
          title="Detectat → lucrat → dovadă → Dosar, fără pași ascunși"
          action={<V3FrameworkTag label={lifecycle.statusLabel} tone={lifecycle.dossierReady ? "ok" : "info"} />}
        >
          <div className="flex flex-wrap gap-2">
            {Object.entries(LIFECYCLE_STAGE_LABELS).map(([stage, label]) => {
              const done = lifecycle.completedStages.includes(stage as FindingLifecycleView["completedStages"][number])
              return (
                <span
                  key={stage}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em]",
                    done
                      ? "border-eos-success/25 bg-eos-success-soft text-eos-success"
                      : "border-eos-border bg-white/[0.02] text-eos-text-tertiary",
                  ].join(" ")}
                >
                  {done ? <CheckCircle2 className="size-3" strokeWidth={2} /> : <XCircle className="size-3" strokeWidth={2} />}
                  {label}
                </span>
              )
            })}
          </div>
          <div className="mt-4 rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] px-3.5 py-3">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
              Următorul pas
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-eos-text-muted">
              {lifecycle.nextAction}
            </p>
            {lifecycle.evidence.sources.length > 0 ? (
              <p className="mt-2 text-[12px] leading-relaxed text-eos-text-tertiary">
                Dovadă: {lifecycle.evidence.sources.slice(0, 2).join(" · ")}
                {lifecycle.evidence.sources.length > 2 ? ` · +${lifecycle.evidence.sources.length - 2}` : ""}
              </p>
            ) : null}
          </div>
        </V3Panel>
      ) : null}

      {finding.reopenedFromISO && status === "open" ? (
        <div className="relative overflow-hidden rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft/30 px-5 py-3">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-warning" aria-hidden />
          <p className="text-[13px] leading-relaxed text-eos-text">
            Cazul a mai fost închis pe {new Date(finding.reopenedFromISO).toLocaleDateString("ro-RO")}. Contextul și dovada anterioară rămân disponibile în cockpit pentru comparație și revalidare.
          </p>
        </div>
      ) : null}

      {dossierMomentVisible && linkedGeneratedDocument ? (
        <FindingDossierSuccessCard
          findingTitle={finding.title}
          linkedGeneratedDocument={linkedGeneratedDocument}
          savedAtISO={finding.findingStatusUpdatedAtISO}
          nextReviewDateISO={finding.nextMonitoringDateISO}
          primaryHref={dashboardRoutes.dosar}
          secondaryHref={dashboardRoutes.auditLog}
          feedbackMessage="Dovada a intrat la dosar și rămâne disponibilă pentru audit, handoff și reverificare. De aici înainte intră în monitorizare, nu dispare."
        />
      ) : null}

      {adoptionTrackingVisible && linkedGeneratedDocument ? (
        <DocumentAdoptionCard
          documentId={linkedGeneratedDocument.id}
          documentTitle={linkedGeneratedDocument.title}
          documentType={linkedGeneratedDocument.documentType!}
          adoptionStatus={linkedGeneratedDocument.adoptionStatus}
          adoptionUpdatedAtISO={linkedGeneratedDocument.adoptionUpdatedAtISO}
          adoptionEvidenceNote={linkedGeneratedDocument.adoptionEvidenceNote}
          onUpdated={handleLinkedDocumentAdoptionUpdated}
        />
      ) : null}

      {caseClosedMomentVisible ? (
        <FindingCaseClosedCard
          findingTitle={finding.title}
          savedAtISO={finding.findingStatusUpdatedAtISO ?? new Date().toISOString()}
          nextReviewDateISO={finding.nextMonitoringDateISO}
          closureEvidence={finding.operationalEvidenceNote ?? finding.resolution?.closureEvidence ?? null}
          feedbackMessage={statusFeedback}
          primaryHref={dashboardRoutes.dosar}
          secondaryHref={dashboardRoutes.auditLog}
        />
      ) : null}

      {isFindingResolvedLike(status) ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              data-testid="reopen-finding"
              variant="outline"
              onClick={() => updateStatus("open")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Redeschide cazul
            </Button>
          </div>

          <V3Panel
            eyebrow={
              <span className="inline-flex items-center gap-1.5 text-eos-primary">
                <CalendarClock className="size-3" strokeWidth={2} />
                Review programat
              </span>
            }
            title="Păstrezi finding-ul pe aceeași urmă de monitorizare și reverificare"
            action={
              <V3FrameworkTag
                label={manualReviewCycleId ? "Review activ" : "fără review"}
                tone={manualReviewCycleId ? "ok" : "neutral"}
              />
            }
            className="border-eos-primary/20 bg-eos-primary/[0.03]"
          >
            <p className="mb-4 text-[13px] leading-relaxed text-eos-text-muted">
              {manualReviewCycleId
                ? "Există deja un review activ pentru acest finding. Îl poți reprograma sau actualiza fără să ieși din cockpit."
                : "Dacă vrei o reverificare explicită, o programezi aici și o vezi apoi în Review-uri programate."}
            </p>
            <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
              <label className="space-y-1.5 text-[12px]">
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                  Data review-ului
                </span>
                <input
                  type="date"
                  value={manualReviewDate}
                  onChange={(event) => setManualReviewDate(event.target.value)}
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[13px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
                />
              </label>
              <label className="space-y-1.5 text-[12px]">
                <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
                  Notă de reverificare
                </span>
                <input
                  value={manualReviewNotes}
                  onChange={(event) => setManualReviewNotes(event.target.value)}
                  placeholder="Ex: reverificăm recipisa SPV, expirarea DPA sau răspunsul vendorului."
                  className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[13px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
                />
              </label>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                data-testid="save-manual-review-cycle"
                onClick={() => void saveManualReviewCycle()}
                disabled={manualReviewSaving || manualReviewLoading || !manualReviewDate}
                className="gap-1.5"
              >
                <CalendarClock className="size-3.5" strokeWidth={2} />
                {manualReviewSaving
                  ? "Se salvează..."
                  : manualReviewCycleId
                    ? "Actualizează review-ul"
                    : "Programează review"}
              </Button>
              <Link
                href={dashboardRoutes.reviewCycles}
                className={buttonVariants({ variant: "outline", className: "gap-1.5" })}
              >
                Vezi toate review-urile
              </Link>
            </div>
          </V3Panel>
        </div>
      ) : null}

      {resolvedMomentVisible && !needsDossierHandoff ? (
        <V3Panel
          eyebrow={
            <span className="inline-flex items-center gap-1.5 text-eos-success">
              <CheckCircle2 className="size-3" strokeWidth={2.5} />
              Risc rezolvat
            </span>
          }
          title={`${finding.title} a fost rezolvat cu documentul confirmat`}
          action={<V3FrameworkTag label="Rezolvat" tone="ok" />}
          className="border-eos-success/25 bg-eos-success-soft/30"
        >
          <p className="text-[13px] leading-relaxed text-eos-text-muted">
            Documentul a trecut confirmarea și validarea din cockpit. Următorul pas este separat:
            îl adaugi la Dosar, iar abia după aceea cazul intră în monitorizare.
          </p>
        </V3Panel>
      ) : null}

      {/* ── Hero Action — above the fold, dominant ────────────────────── */}
      {status === "open" && (
        <FindingHeroAction
          finding={finding}
          recipe={recipe}
        >
          <Button
            data-testid="confirm-finding"
            onClick={handleConfirmFinding}
            disabled={actionLoading}
            className="gap-1.5"
          >
            {hasGenerator ? (
              <FileText className="size-3.5" strokeWidth={2} />
            ) : (
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
            )}
            Confirmă constatarea
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

      {showConfirmedHeroAction && !inlineOperationalAction && (
        <FindingHeroAction
          finding={finding}
          recipe={recipe}
        >
          {!hasGenerator ? (
            <>
              {recipe.workflowLink ? (
                <Button
                  asChild
                  data-testid="open-workflow-link"
                  className="gap-1.5"
                  variant="outline"
                >
                  <Link href={recipe.workflowLink.href}>
                    <FileText className="size-3.5" strokeWidth={2} />
                    {recipe.workflowLink.label}
                  </Link>
                </Button>
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
                variant="default"
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                {recipe.closureCTA ?? recipe.primaryCTA.label}
              </Button>
            </>
          ) : null}
        </FindingHeroAction>
      )}

      {needsDossierHandoff ? (
        <div className="relative overflow-hidden rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.04] px-4 py-4 shadow-[0_0_32px_rgba(59,130,246,0.05)] sm:px-5 sm:py-5">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary" aria-hidden />
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Acum faci asta
          </p>
          <p
            data-display-text="true"
            className="mt-1.5 font-display text-[15px] font-medium leading-snug tracking-[-0.015em] text-eos-text sm:text-[16px]"
          >
            Riscul este deja rezolvat cu documentul confirmat. Ultimul pas este să trimiți documentul la Dosar; abia apoi pornește monitorizarea.
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-eos-text-muted">
            Dosarul primește rezultatul, nu procesul. Până nu faci pasul ăsta, cazul nu trebuie tratat ca monitorizat.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button
              data-testid="send-document-to-dosar"
              onClick={() =>
                updateStatus("under_monitoring", {
                  generatedDocumentId: linkedGeneratedDocument?.id,
                })
              }
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Adaugă documentul la Dosar
            </Button>
          </div>
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-eos-text-muted">
            După ce documentul intră în Dosar, cockpitul marchează clar monitoring-ul pe aceeași urmă.
          </p>
        </div>
      ) : null}

      {requiresOperationalEvidence ? (
        <div
          className={`relative overflow-hidden rounded-eos-lg border bg-eos-surface transition-colors ${
            operationalEvidenceNote.trim() ? "border-eos-success/40" : "border-eos-primary/25"
          }`}
        >
          <span
            className={`absolute left-0 top-0 bottom-0 w-[3px] ${
              operationalEvidenceNote.trim() ? "bg-eos-success" : "bg-eos-primary"
            }`}
            aria-hidden
          />
          <div className="space-y-3 px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-eos-sm transition-colors ${
                    operationalEvidenceNote.trim() ? "bg-eos-success-soft text-eos-success" : "bg-eos-primary/10 text-eos-primary"
                  }`}
                >
                  <FileText className="size-3.5" strokeWidth={2.5} />
                </span>
                <div>
                  <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                    {evidenceCardCopy.eyebrow}
                  </p>
                  <p className="mt-1 text-[13px] leading-relaxed text-eos-text-muted">
                    {evidenceCardCopy.body}
                  </p>
                </div>
              </div>
              {operationalEvidenceNote.trim() ? (
                <V3FrameworkTag label="Completat" tone="ok" />
              ) : null}
            </div>
            <textarea
              data-testid="operational-evidence-note"
              value={operationalEvidenceNote}
              onChange={(event) => setOperationalEvidenceNote(event.target.value)}
              rows={4}
              className={`w-full resize-none rounded-eos-sm border bg-white/[0.02] px-2.5 py-2 text-[13px] leading-[1.5] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary ${
                operationalEvidenceNote.trim() ? "border-eos-success/40" : "border-eos-border hover:border-eos-border-strong"
              }`}
              placeholder={evidenceCardCopy.placeholder}
            />
            <p className="font-mono text-[10.5px] text-eos-text-muted">
              {evidenceCardCopy.footer}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
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
              >
                <CheckCircle2 className="size-3.5" strokeWidth={2} />
                {recipe.closureCTA ?? recipe.primaryCTA.label}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {requiresRevalidation ? (
        <V3Panel
          eyebrow="Revalidare necesară"
          title="Reconfirmi dovada existentă"
        >
          <p className="mb-3 text-[13px] text-eos-text-muted">
            Stabilești următorul control și lași cazul sub watch pe aceeași urmă.
          </p>
          <div className="rounded-eos-sm border border-eos-border-subtle bg-white/[0.02] px-3 py-2.5">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
              Dovada anterioară
            </p>
            <p className="mt-1 text-[13px] text-eos-text">
              {previousEvidence || "Nu există încă o dovadă anterioară explicită; completează nota de revalidare în contextul juridic al cazului."}
            </p>
          </div>
          <label className="mt-3 flex items-start gap-3 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 py-2.5 text-[13px] text-eos-text">
            <input
              data-testid="revalidation-confirmation"
              type="checkbox"
              checked={revalidationConfirmed}
              onChange={(event) => setRevalidationConfirmed(event.target.checked)}
              className="mt-0.5 size-4 rounded border-eos-border accent-eos-primary"
            />
            <span>Confirm că am reverificat dovada și că rămâne valabilă pentru perioada următoare.</span>
          </label>
          <div className="mt-3 space-y-1.5">
            <label className="block font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
              Următor review
            </label>
            <input
              data-testid="revalidation-next-review-date"
              type="date"
              value={nextReviewDateISO}
              onChange={(event) => setNextReviewDateISO(event.target.value)}
              className="h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[13px] text-eos-text outline-none transition-colors focus:border-eos-border-strong"
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
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
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              {recipe.closureCTA ?? recipe.primaryCTA.label}
            </Button>
          </div>
        </V3Panel>
      ) : null}

      {statusFeedback &&
        !successMomentVisible &&
        !(status === "confirmed" && hasGenerator) &&
        !inlineOperationalAction &&
        !needsDossierHandoff && (
          <div className="relative overflow-hidden rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.04] px-5 py-3">
            <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary" aria-hidden />
            <p className="text-[13px] text-eos-text">{statusFeedback}</p>
          </div>
        )}

      {documentaryGeneratorVisible && generatorDocumentType ? (
        generatorDocumentType === "ropa" ? (
          <V3Panel
            eyebrow={
              <span className="inline-flex items-center gap-1.5 text-eos-primary">
                <FileText className="size-3" strokeWidth={2} />
                Registru de Prelucrări (RoPA)
              </span>
            }
            title="Completează registrul în pagină dedicată"
          >
            <p className="mb-3 text-[13px] leading-relaxed text-eos-text-muted">
              Completezi registrul de prelucrări în pagină dedicată, apoi te întorci în cockpit cu dovada atașată.
            </p>
            <Link
              className={buttonVariants({ className: "gap-1.5" })}
              href={`/dashboard/ropa?findingId=${encodeURIComponent(finding.id)}&returnTo=${encodeURIComponent(dashboardFindingRoute(finding.id))}`}
            >
              <FileText className="size-3.5" strokeWidth={2} />
              Deschide RoPA
            </Link>
          </V3Panel>
        ) : (
        <GeneratorDrawer
          open
          findingStatus={status}
          findingId={finding.id}
          documentType={generatorDocumentType}
          findingTitle={finding.title}
          vendorName={recipe.vendorContext?.vendorName}
          vendorDpaUrl={recipe.vendorContext?.dpaUrl}
          onComplete={(result) => {
            if (result?.finding) {
              applyFindingResponse({
                finding: result.finding as FindingDetail,
                linkedGeneratedDocument: result.linkedGeneratedDocument ?? null,
                documentFlowState: result.documentFlowState,
                feedbackMessage: result.feedbackMessage,
              })
            }
            if (
              recipe.documentSupport?.mode === "assistive" &&
              result?.linkedGeneratedDocument?.approvalStatus === "draft" &&
              result.linkedGeneratedDocument.validationStatus === "passed"
            ) {
              setTimeout(() => {
                const evidenceField = document.querySelector<HTMLElement>('[data-testid="operational-evidence-note"]')
                evidenceField?.scrollIntoView({ behavior: "smooth", block: "center" })
              }, 50)
            }
            // Auto-resolve after document is confirmed — closes the loop without an extra card
            if (result?.evidenceAttached && !isOperationalAssisted) {
              void updateStatus("resolved")
              return
            }
            refetchFinding()
          }}
        />
        )
      ) : null}



      {/* ── Pending approval banner ─────────────────────────────────────── */}
      {pendingApprovalId && (
        <div className="relative overflow-hidden rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft/30 px-5 py-3">
          <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-warning" aria-hidden />
          <div className="flex items-center gap-3">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-eos-sm bg-eos-warning-soft text-eos-warning">
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                Acțiune trimisă spre aprobare
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-eos-text-muted">
                Rezolvarea necesită aprobare explicită. Următorul pas:{" "}
                <Link href="/dashboard/approvals" className="font-medium text-eos-primary hover:underline">
                  deschide coada de aprobări
                </Link>{" "}
                și aprobă sau respinge. Dacă politica e semi-auto, acțiunea se execută automat în 24h dacă nu este respinsă.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Evidence completeness ────────────────────────────────────────── */}
      {evidenceCompleteness && evidenceCompleteness.total > 0 && status !== "under_monitoring" && (
        <V3Panel
          eyebrow={`Dovadă — ${evidenceCompleteness.completed}/${evidenceCompleteness.total}`}
          action={
            <span className="font-mono text-[10.5px] font-semibold tabular-nums text-eos-text-muted">
              {evidenceCompleteness.percentage}%
            </span>
          }
        >
          <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.04]">
            <div
              className="h-full rounded-full bg-eos-primary transition-all duration-700"
              style={{ width: `${evidenceCompleteness.percentage}%` }}
            />
          </div>
          <div className="mt-3 space-y-1.5">
            {evidenceCompleteness.items.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-[12.5px]">
                {item.done ? (
                  <CheckCircle2 className="size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
                ) : (
                  <XCircle className="size-3.5 shrink-0 text-eos-text-tertiary" strokeWidth={1.5} />
                )}
                <span className={item.done ? "text-eos-text-muted" : "text-eos-text-tertiary"}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </V3Panel>
      )}

      {/* ── Metadata footer ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] text-eos-text-muted">
        <span>ID: {finding.id}</span>
        {finding.findingStatusUpdatedAtISO && (
          <>
            <span className="text-white/10">·</span>
            <span>Actualizat: {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
          </>
        )}
        {finding.nextMonitoringDateISO && (
          <>
            <span className="text-white/10">·</span>
            <span>Următor control: {new Date(finding.nextMonitoringDateISO).toLocaleDateString("ro-RO")}</span>
          </>
        )}
      </div>
    </div>
  )
}
