"use client"

import { useCallback, useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

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
  FindingHeroAction,
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
  title: string
  generatedAtISO: string
  approvalStatus?: "draft" | "approved_as_evidence"
  validationStatus?: "pending" | "passed"
  validatedAtISO?: string
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
  const [nextReviewDateISO, setNextReviewDateISO] = useState(getDefaultReviewDateInput())
  const { reloadDashboard } = useCockpitMutations()

  const applyFindingResponse = useCallback((data: FindingDetailResponse) => {
    setFinding(data.finding)
    setLinkedGeneratedDocument(data.linkedGeneratedDocument ?? null)
    setDocumentFlowState(data.documentFlowState ?? "not_required")
    setOperationalEvidenceNote(data.finding.operationalEvidenceNote ?? "")
    setStatusFeedback(data.feedbackMessage ?? null)
    setRevalidationConfirmed(false)
    setNextReviewDateISO(data.finding.nextMonitoringDateISO?.slice(0, 10) ?? getDefaultReviewDateInput())
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

  async function updateStatus(
    status: "open" | "confirmed" | "dismissed" | "resolved" | "under_monitoring",
    options?: {
      redirectTo?: string
      evidenceNote?: string
      revalidationConfirmed?: boolean
      newReviewDateISO?: string
      generatedDocumentId?: string
    }
  ) {
    if (!finding) return
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
        }),
      })
      if (!res.ok) throw new Error("Eroare la actualizare.")
      const payload = (await res.json()) as FindingDetailResponse
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
      if (options?.redirectTo) {
        router.push(options.redirectTo)
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

  return (
    <div className="space-y-4 px-1 sm:space-y-5 sm:px-0">

      {/* ── Compact case header ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Back nav + meta row */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href={dashboardRoutes.resolve}
            className="flex items-center gap-1.5 text-sm text-eos-text-muted transition-colors hover:text-eos-text"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            De rezolvat
          </Link>
          <div className="flex items-center gap-2 text-xs text-eos-text-tertiary">
            <span>{getFindingAgeLabel(finding.createdAtISO)}</span>
            {finding.sourceDocument && (
              <span className="text-eos-border">·</span>
            )}
            {finding.sourceDocument && (
              <span>Sursă: {finding.sourceDocument}</span>
            )}
          </div>
        </div>

        {/* Title + badges */}
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
            <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
              {finding.category.replace(/_/g, " ")}
            </span>
            <Badge variant="outline" className="normal-case tracking-normal text-xs">
              {getExecutionClassLabel(recipe)}
            </Badge>
            <Badge variant={statusCfg.variant} className="normal-case tracking-normal text-xs">
              {statusCfg.label}
            </Badge>
          </div>
          <h1 className="mt-2.5 text-xl font-semibold leading-snug text-eos-text">
            {finding.title}
          </h1>
          {introDescription && (
            <p className="mt-1.5 text-sm leading-relaxed text-eos-text-muted">
              {introDescription}
            </p>
          )}
        </div>
      </div>

      {/* ── Status progression rail ──────────────────────────────────────── */}
      {status !== "dismissed" && (
        <div className="flex items-center gap-0 overflow-x-auto rounded-eos-lg border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
          {PROGRESS_STEPS.map((step, i) => {
            const isPast    = i < currentStepIdx
            const isCurrent = i === currentStepIdx
            return (
              <div key={step.id} className="flex flex-1 items-center">
                <div className="flex flex-col items-center gap-1.5 shrink-0">
                  <div className={[
                    "size-5 rounded-full border-2 grid place-items-center transition-all",
                    isPast    ? "border-eos-success bg-eos-success"    : "",
                    isCurrent ? "border-eos-primary bg-eos-primary/15" : "",
                    !isPast && !isCurrent ? "border-eos-border-subtle bg-eos-surface-variant" : "",
                  ].join(" ")}>
                    {isPast
                      ? <CheckCircle2 className="size-3 text-white" strokeWidth={2.5} />
                      : <div className={["size-1.5 rounded-full", isCurrent ? "bg-eos-primary" : "bg-eos-border"].join(" ")} />
                    }
                  </div>
                  <span className={[
                    "text-[10px] font-medium whitespace-nowrap",
                    isCurrent ? "text-eos-text" : isPast ? "text-eos-success" : "text-eos-text-tertiary",
                  ].join(" ")}>
                    {step.label}
                  </span>
                </div>
                {i < PROGRESS_STEPS.length - 1 && (
                  <div className={[
                    "h-px flex-1 mx-2 mb-4 rounded-full transition-all",
                    i < currentStepIdx ? "bg-eos-success" : "bg-eos-border-subtle",
                  ].join(" ")} />
                )}
              </div>
            )
          })}
        </div>
      )}

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
          savedAtISO={finding.findingStatusUpdatedAtISO}
          nextReviewDateISO={finding.nextMonitoringDateISO}
          primaryHref={dashboardRoutes.dosar}
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
          primaryHref={dashboardRoutes.dosar}
          secondaryHref={dashboardRoutes.auditLog}
        />
      ) : null}

      {isFindingResolvedLike(status) ? (
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
      ) : null}

      {resolvedMomentVisible && !needsDossierHandoff ? (
        <Card data-testid="finding-risk-resolved" className="border-eos-success/35 bg-eos-success-soft/60">
          <CardContent className="space-y-3 px-5 py-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-eos-success/25 bg-white/70 text-eos-success">
                  <CheckCircle2 className="size-5" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-success">
                    Risc rezolvat
                  </p>
                  <p className="mt-1 text-lg font-semibold text-eos-text">
                    {finding.title} a fost rezolvat cu documentul confirmat
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-eos-text-muted">
                    Documentul a trecut confirmarea și validarea din cockpit. Următorul pas este separat:
                    îl adaugi la Dosar, iar abia după aceea cazul intră în monitorizare.
                  </p>
                </div>
              </div>
              <Badge variant="success" className="normal-case tracking-normal">
                rezolvat
              </Badge>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* ── Hero Action — above the fold, dominant ────────────────────── */}
      {status === "open" && (
        <FindingHeroAction
          finding={finding}
          recipe={recipe}
        >
          {hasGenerator ? (
            <Button
              data-testid="confirm-and-generate"
              onClick={() => updateStatus("confirmed")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <FileText className="size-3.5" strokeWidth={2} />
              Confirmă findingul
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
                : recipe.findingTypeId === "EF-003"
                  ? "Confirmă și deschide validatorul XML"
                  : recipe.findingTypeId === "EF-004"
                    ? "Confirmă și deschide protocolul fiscal"
                  : recipe.findingTypeId === "EF-005"
                    ? "Confirmă și pregătește transmiterea"
                : recipe.findingTypeId === "GDPR-019"
                  ? "Confirmă și deschide breach flow"
                  : recipe.findingTypeId === "NIS2-015"
                    ? "Confirmă și deschide timeline-ul"
                  : recipe.findingTypeId === "NIS2-GENERIC" && recipe.workflowLink?.href.includes("/dashboard/nis2/maturitate")
                    ? "Confirmă și deschide maturitatea"
                  : recipe.findingTypeId === "NIS2-GENERIC" && recipe.workflowLink?.href.includes("/dashboard/nis2/governance")
                    ? "Confirmă și deschide guvernanța"
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

      {showConfirmedHeroAction && !inlineOperationalAction && (
        <FindingHeroAction
          finding={finding}
          recipe={recipe}
        >
          {!hasGenerator ? (
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
          ) : null}
        </FindingHeroAction>
      )}

      {needsDossierHandoff ? (
        <div className="rounded-eos-xl border-2 border-eos-primary/25 bg-gradient-to-br from-eos-primary/[0.06] via-transparent to-transparent px-5 py-5 sm:px-6 sm:py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-primary">
            Acum faci asta
          </p>
          <p className="mt-2 text-sm leading-relaxed text-eos-text sm:text-[15px]">
            Riscul este deja rezolvat cu documentul confirmat. Ultimul pas este să trimiți documentul la Dosar; abia apoi pornește monitorizarea.
          </p>
          <p className="mt-1.5 text-sm text-eos-text-muted">
            Dosarul primește rezultatul, nu procesul. Până nu faci pasul ăsta, cazul nu trebuie tratat ca monitorizat.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
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
          <p className="mt-3 text-xs leading-relaxed text-eos-text-muted">
            După ce documentul intră în Dosar, cockpitul marchează clar monitoring-ul pe aceeași urmă.
          </p>
        </div>
      ) : null}

      {requiresOperationalEvidence ? (
        <Card className={`bg-eos-surface border-2 transition-colors ${operationalEvidenceNote.trim() ? "border-eos-success/40" : "border-eos-primary/20"}`}>
          <CardContent className="space-y-3 px-5 py-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors ${operationalEvidenceNote.trim() ? "bg-eos-success/15" : "bg-eos-primary/10"}`}>
                  <FileText className={`size-3 ${operationalEvidenceNote.trim() ? "text-eos-success" : "text-eos-primary"}`} strokeWidth={2.5} />
                </span>
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                    {evidenceCardCopy.eyebrow}
                  </p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    {evidenceCardCopy.body}
                  </p>
                </div>
              </div>
              {operationalEvidenceNote.trim() ? (
                <span className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] bg-eos-success/10 text-eos-success">
                  Completat
                </span>
              ) : null}
            </div>
            <textarea
              data-testid="operational-evidence-note"
              value={operationalEvidenceNote}
              onChange={(event) => setOperationalEvidenceNote(event.target.value)}
              rows={4}
              className={`ring-focus w-full rounded-eos-md border bg-eos-surface-variant px-3 py-2.5 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none transition-colors ${operationalEvidenceNote.trim() ? "border-eos-success/40" : "border-eos-border"}`}
              placeholder={evidenceCardCopy.placeholder}
            />
            <p className="text-xs text-eos-text-muted">
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
          </CardContent>
        </Card>
      ) : null}

      {statusFeedback &&
        !successMomentVisible &&
        !(status === "confirmed" && hasGenerator) &&
        !inlineOperationalAction &&
        !needsDossierHandoff && (
        <Card className="border-eos-primary/30 bg-eos-primary-soft/20">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-eos-text">{statusFeedback}</p>
          </CardContent>
        </Card>
      )}

      {documentaryGeneratorVisible && generatorDocumentType ? (
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
      ) : null}



      {/* ── Metadata footer ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
        <span>ID: {finding.id}</span>
        {finding.findingStatusUpdatedAtISO && (
          <span>Actualizat: {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
        )}
        {finding.nextMonitoringDateISO && (
          <span>Următor control: {new Date(finding.nextMonitoringDateISO).toLocaleDateString("ro-RO")}</span>
        )}
      </div>
    </div>
  )
}
