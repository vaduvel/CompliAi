"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, FolderKanban, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import type { ScanFinding } from "@/lib/compliance/types"
import { DOCUMENT_ADOPTION_LABELS, type DocumentAdoptionStatus } from "@/lib/compliance/document-adoption"
import {
  getFindingAgeLabel,
  getSuggestedDocumentLabel,
  getFindingStatusPresentation,
  type FindingDocumentFlowState,
} from "@/lib/compliscan/finding-cockpit"
import { buildCockpitRecipe, type CockpitRecipe } from "@/lib/compliscan/finding-kernel"

type LinkedGeneratedDocumentMeta = {
  id?: string
  documentType?: string
  title: string
  generatedAtISO: string
  approvalStatus?: "draft" | "approved_as_evidence"
  validationStatus?: "pending" | "passed"
  validatedAtISO?: string
  approvedAtISO?: string
  approvedByEmail?: string
  adoptionStatus?: DocumentAdoptionStatus
  adoptionUpdatedAtISO?: string
  nextReviewDateISO?: string
  expiresAtISO?: string
}

type RecipeBackedProps = {
  recipe?: CockpitRecipe
}

type ProgressStepState = "done" | "active" | "upcoming"

type RecipeProgressStep = {
  id: string
  label: string
  hint: string
  state: ProgressStepState
}

function resolveRecipe(
  finding: ScanFinding,
  documentFlowState: FindingDocumentFlowState = "not_required",
  linkedGeneratedDocument?: LinkedGeneratedDocumentMeta | null,
  recipe?: CockpitRecipe
) {
  if (recipe) return recipe
  return buildCockpitRecipe(finding, {
    documentFlowState,
    linkedGeneratedDocument,
  })
}

function getRecipeBadgePresentation(
  finding: ScanFinding,
  recipe: CockpitRecipe
): { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" | "outline" } {
  if (finding.findingStatus === "under_monitoring") {
    return { label: "Monitorizat", variant: "success" }
  }
  if (finding.findingStatus === "resolved") {
    return { label: "Rezolvat", variant: "success" }
  }
  if (finding.findingStatus === "dismissed") {
    return { label: "Marcat nevalid", variant: "secondary" }
  }

  switch (recipe.uiState) {
    case "ready_to_generate":
      return { label: recipe.collapsedStatusLabel, variant: "default" }
    case "evidence_uploaded":
    case "rechecking":
      return { label: recipe.collapsedStatusLabel, variant: "default" }
    case "external_action_required":
    case "needs_revalidation":
    case "need_your_input":
      return { label: recipe.collapsedStatusLabel, variant: "warning" }
    case "false_positive":
      return { label: recipe.collapsedStatusLabel, variant: "secondary" }
    default:
      return { label: recipe.collapsedStatusLabel, variant: "outline" }
  }
}

function getRecipeMainStepLabel(recipe: CockpitRecipe) {
  if (recipe.uiState === "needs_revalidation") {
    return "Reconfirmi"
  }

  switch (recipe.resolutionMode) {
    case "in_app_full":
    case "in_app_guided":
      return "Pregătești draftul"
    case "external_action":
      return "Aplici remedierea"
    case "user_attestation":
      return "Confirmi"
  }
}

function getRecipeProgressSteps(
  finding: ScanFinding,
  recipe: CockpitRecipe,
  linkedGeneratedDocument?: LinkedGeneratedDocumentMeta | null
): RecipeProgressStep[] {
  const documentValidationFlow = recipe.visibleBlocks.detailBlocks.includes("generator")
  const mainStepLabel = getRecipeMainStepLabel(recipe)
  const mainStepHint =
    recipe.whatUserMustDo ||
    "Execuți pasul principal al cockpitului și păstrezi urma clară a rezultatului."
  const evidenceHint =
    linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
      ? "Artefactul este aprobat și legat de finding ca dovadă."
      : linkedGeneratedDocument
        ? "Există deja un draft; mai rămân review-ul explicit și legarea la dosar."
        : recipe.acceptedEvidence.length > 0
          ? `Dovada acceptată: ${recipe.acceptedEvidence.join(" · ")}`
          : "Pregătești dovada operațională sau documentară cerută."
  const verificationHint =
    recipe.monitoringSignals[0] ??
    "Confirmăm că rezultatul rămâne valid și auditabil înainte să intre sub watch."
  const monitoringHint =
    finding.findingStatus === "under_monitoring"
      ? "Cazul este închis și rămâne sub watch pentru drift, expirări sau schimbări noi."
      : recipe.monitoringSignals[0] ??
        "După închidere, cazul rămâne sub watch pentru drift, review și schimbări noi."

  const activeIndex =
    finding.findingStatus === "dismissed"
      ? 0
      : finding.findingStatus === "under_monitoring" || finding.findingStatus === "resolved"
        ? 4
        : recipe.uiState === "rechecking"
          ? 3
          : recipe.uiState === "evidence_uploaded"
            ? 2
            : recipe.uiState === "ready_to_generate" ||
                recipe.uiState === "need_your_input" ||
                recipe.uiState === "external_action_required" ||
                recipe.uiState === "needs_revalidation"
              ? 1
              : 0

  return [
    {
      id: "detected",
      label: "Detectat",
      hint: "Problema este confirmată și gata de lucru în cockpit.",
      state: activeIndex > 0 ? "done" : "active",
    },
    {
      id: "main-action",
      label: mainStepLabel,
      hint: mainStepHint,
      state: activeIndex > 1 ? "done" : activeIndex === 1 ? "active" : "upcoming",
    },
    {
      id: "evidence",
      label: documentValidationFlow ? "Validezi dovada" : "Dovadă la dosar",
      hint: evidenceHint,
      state: activeIndex > 2 ? "done" : activeIndex === 2 ? "active" : "upcoming",
    },
    {
      id: "verification",
      label: recipe.uiState === "needs_revalidation"
        ? "Revalidare"
        : documentValidationFlow
          ? "Confirmi și salvezi"
          : "Verificare",
      hint: verificationHint,
      state: activeIndex > 3 ? "done" : activeIndex === 3 ? "active" : "upcoming",
    },
    {
      id: "monitoring",
      label: "Monitorizat",
      hint: monitoringHint,
      state: activeIndex === 4 ? "active" : "upcoming",
    },
  ]
}

function getNarrativeModel(finding: ScanFinding, recipe: CockpitRecipe) {
  const suggestedDocumentLabel = getSuggestedDocumentLabel(finding.suggestedDocumentType)
  const evidence = recipe.acceptedEvidence.length > 0
    ? recipe.acceptedEvidence.join(" · ")
    : finding.evidenceRequired ??
      "Atașezi dovada operațională sau documentară cerută pentru audit."
  const dossierContext = suggestedDocumentLabel
    ? `${suggestedDocumentLabel} intră în același flow și, după confirmare, merge la dosar pe aceeași urmă.`
    : recipe.dossierOutcome

  return {
    problem: finding.resolution?.problem ?? finding.detail,
    impact:
      finding.resolution?.impact ??
      finding.impactSummary ??
      "Riscul rămâne deschis până când măsura este aplicată și rezultatul este salvat la dosar.",
    action: recipe.whatUserMustDo,
    compliSupport: recipe.whatCompliDoes,
    evidence,
    dossierContext,
    revalidation:
      recipe.monitoringSignals[0] ??
      finding.resolution?.revalidation ??
      finding.rescanHint ??
      null,
  }
}

type FindingNarrativeCardProps = {
  finding: ScanFinding
  title?: string
  description?: string
} & RecipeBackedProps

export function FindingNarrativeCard({
  finding,
  title = "Rezolvare în același loc",
  description = "Problema, impactul, pașii și dovada rămân în același context, fără să te plimbe între suprafețe.",
  recipe,
}: FindingNarrativeCardProps) {
  const cockpitRecipe = resolveRecipe(finding, "not_required", null, recipe)
  const narrative = getNarrativeModel(finding, cockpitRecipe)
  const status = getFindingStatusPresentation(finding.findingStatus)
  const hasSecondaryContext = Boolean(
    narrative.compliSupport || narrative.dossierContext || narrative.revalidation
  )

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="gap-3 border-b border-eos-border-subtle pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="max-w-2xl text-sm text-eos-text-muted">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
            <Badge variant={status.variant} className="normal-case tracking-normal">
              {status.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <NarrativeBlock
            label="Problema"
            content={narrative.problem}
            tone="default"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <NarrativeBlock
              label="Impact"
              content={narrative.impact}
              tone="warning"
            />
            <NarrativeBlock
              label="Dovada acceptată"
              content={narrative.evidence}
              tone="default"
            />
          </div>
        </div>

        <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.05] px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eos-primary">
            Cum arată închiderea
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-eos-text">{cockpitRecipe.closeCondition}</p>
        </div>

        {hasSecondaryContext ? (
          <details className="group rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eos-text-muted">
                  Pregătire, confirmare și revalidare
                </p>
                <p className="mt-1 text-xs leading-5 text-eos-text-muted">
                  Doar contextul care te ajută să închizi corect cazul, fără să aglomereze primul ecran.
                </p>
              </div>
              <ArrowRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {narrative.compliSupport ? (
                <NarrativeBlock
                  label="Ce face Compli"
                  content={narrative.compliSupport}
                  tone="default"
                />
              ) : null}
              {narrative.dossierContext ? (
                <NarrativeBlock
                  label="Ce intră în dosar"
                  content={narrative.dossierContext}
                  tone="default"
                />
              ) : null}
              {narrative.revalidation ? (
                <NarrativeBlock
                  label="Revalidare"
                  content={narrative.revalidation}
                  tone="default"
                />
              ) : null}
            </div>
          </details>
        ) : null}

        <div className="grid gap-3 border-t border-eos-border-subtle pt-4 sm:grid-cols-3">
          <FactLine label="Sursă" value={finding.sourceDocument || "finding generat intern"} />
          <FactLine label="Detectat" value={getFindingAgeLabel(finding.createdAtISO)} />
          <FactLine label="Ref. legală" value={finding.legalReference || "în curs de mapare"} />
        </div>
      </CardContent>
    </Card>
  )
}

// ── Hero Action Block ────────────────────────────────────────────────────────
// The single most prominent element in the cockpit — above the fold.
// Shows: what to do now + why + one dominant CTA.
// Everything else (stepper, rails, details) goes below.

type FindingHeroActionProps = {
  finding: ScanFinding
  children: React.ReactNode
  helperText?: string
} & RecipeBackedProps

export function FindingHeroAction({
  finding,
  children,
  helperText,
  recipe,
}: FindingHeroActionProps) {
  const cockpitRecipe = resolveRecipe(finding, "not_required", null, recipe)

  return (
    <div
      data-testid="finding-hero-action"
      className="relative overflow-hidden rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.04] px-4 py-4 shadow-[0_0_32px_rgba(59,130,246,0.05)] sm:px-5 sm:py-5"
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary" aria-hidden />
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
        Acum faci asta
      </p>
      <p
        data-display-text="true"
        className="mt-1.5 font-display text-[15px] font-medium leading-snug tracking-[-0.015em] text-eos-text sm:text-[16px]"
      >
        {cockpitRecipe.whatUserMustDo}
      </p>
      {cockpitRecipe.vendorContext ? (
        <div className="mt-3 rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2.5 text-[13px] text-eos-text">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
            Vendor detectat
          </p>
          <p className="mt-1">{cockpitRecipe.vendorContext.vendorName}</p>
          {cockpitRecipe.vendorContext.dpaUrl ? (
            <p className="mt-1 text-[12.5px] text-eos-text-muted">
              Referință publică DPA:{" "}
              <a
                href={cockpitRecipe.vendorContext.dpaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-eos-primary underline underline-offset-2"
              >
                deschide linkul
              </a>
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">{children}</div>
      {helperText && (
        <p className="mt-3 font-mono text-[11px] leading-relaxed text-eos-text-muted">
          {helperText}
        </p>
      )}
    </div>
  )
}

// ── Execution Details Card ───────────────────────────────────────────────────
// Secondary details: stepper, closure rules, linked docs, dossier + monitoring rails.
// Sits below the hero action block.

type FindingExecutionCardProps = {
  finding: ScanFinding
  documentFlowState?: FindingDocumentFlowState
  linkedGeneratedDocument?: LinkedGeneratedDocumentMeta | null
} & RecipeBackedProps

export function FindingExecutionCard({
  finding,
  documentFlowState = "not_required",
  linkedGeneratedDocument,
  recipe,
}: FindingExecutionCardProps) {
  const cockpitRecipe = resolveRecipe(
    finding,
    documentFlowState,
    linkedGeneratedDocument,
    recipe
  )
  const status = getRecipeBadgePresentation(finding, cockpitRecipe)
  const suggestedDocumentLabel = getSuggestedDocumentLabel(finding.suggestedDocumentType)
  const steps = getRecipeProgressSteps(finding, cockpitRecipe, linkedGeneratedDocument)
  const activeStep = steps.find((step) => step.state === "active") ?? steps[steps.length - 1]
  const monitoringSignals = cockpitRecipe.monitoringSignals
  const monitoringTitle =
    finding.category === "E_FACTURA" && finding.findingStatus === "under_monitoring"
      ? "Ce reverificăm fiscal"
      : "Ce monitorizăm"
  const monitoringEyebrow =
    finding.category === "E_FACTURA" && finding.findingStatus === "under_monitoring"
      ? "Fiscal"
      : "Monitoring"
  const artifactLabel = linkedGeneratedDocument?.title ?? suggestedDocumentLabel ?? null
  const artifactDetail = linkedGeneratedDocument
    ? `${linkedGeneratedDocument.approvalStatus === "approved_as_evidence" ? "Validat și aprobat ca dovadă" : "Draft pregătit pentru confirmare"} · ${new Date(linkedGeneratedDocument.generatedAtISO).toLocaleString("ro-RO")}`
    : suggestedDocumentLabel
      ? `${suggestedDocumentLabel} intră pe aceeași urmă a finding-ului și ajunge la dosar după confirmare.`
      : null

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="gap-3 border-b border-eos-border-subtle pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Harta cazului</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Vezi progresul, dovada și ce rămâne sub watch, fără să concureze cu acțiunea principală.
            </p>
          </div>
          <Badge variant={status.variant} className="normal-case tracking-normal">
            {status.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <div
          data-testid="finding-progress-stepper"
          className="space-y-3 rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-4"
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
              Harta de progres
            </p>
            <p className="text-xs text-eos-text-muted">
              {steps.findIndex((step) => step.state === "active") + 1}/{steps.length}
            </p>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-2">
                  <ProgressStepPill
                    label={step.label}
                    state={step.state}
                  />
                  {index < steps.length - 1 ? (
                    <div className="h-px w-5 shrink-0 bg-eos-border-subtle" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3">
            <p className="text-xs font-medium text-eos-text">Pas activ: {activeStep.label}</p>
            <p className="mt-1 text-xs leading-5 text-eos-text-muted">{activeStep.hint}</p>
            <p className="mt-2 text-xs leading-5 text-eos-text-muted">
              Închidere corectă: {cockpitRecipe.closeCondition}
            </p>
          </div>
        </div>

        {artifactLabel ? (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-eos-text">Artefact pe aceeași urmă</p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  {artifactLabel}
                </p>
                {artifactDetail ? (
                  <p className="mt-1 text-xs text-eos-text-tertiary">
                    {artifactDetail}
                  </p>
                ) : null}
                {linkedGeneratedDocument?.validatedAtISO ? (
                  <p className="mt-1 text-xs text-eos-text-tertiary">
                    Verificat {new Date(linkedGeneratedDocument.validatedAtISO).toLocaleString("ro-RO")}
                  </p>
                ) : null}
                {linkedGeneratedDocument?.approvedAtISO ? (
                  <p className="mt-1 text-xs text-eos-text-tertiary">
                    Aprobat {new Date(linkedGeneratedDocument.approvedAtISO).toLocaleString("ro-RO")}
                  </p>
                ) : null}
                {linkedGeneratedDocument?.adoptionStatus ? (
                  <p className="mt-1 text-xs text-eos-text-tertiary">
                    Urmă de adoptare: {DOCUMENT_ADOPTION_LABELS[linkedGeneratedDocument.adoptionStatus]}
                    {linkedGeneratedDocument.adoptionUpdatedAtISO
                      ? ` · ${new Date(linkedGeneratedDocument.adoptionUpdatedAtISO).toLocaleString("ro-RO")}`
                      : ""}
                  </p>
                ) : null}
                {!linkedGeneratedDocument ? (
                  <>
                    <p className="mt-1 text-xs text-eos-text-tertiary">
                      Se leagă la dosar doar după confirmarea finală.
                    </p>
                    <p className="mt-1 text-xs text-eos-text-tertiary">
                      Artefactul nu concurează cu acțiunea principală; doar păstrează urma clară a cazului.
                    </p>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {cockpitRecipe.vendorContext ? (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3">
            <div className="flex items-start gap-2">
              <FolderKanban className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-eos-text">
                  Context vendor pentru DPA
                </p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  {cockpitRecipe.vendorContext.vendorName} rămâne ancorat pe aceeași urmă între draft, semnare și dovada salvată la dosar.
                </p>
                {cockpitRecipe.vendorContext.dpaUrl ? (
                  <a
                    href={cockpitRecipe.vendorContext.dpaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex text-sm text-eos-primary underline underline-offset-2"
                  >
                    Deschide DPA-ul public al vendorului
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <details className="group rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-4">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
                Aftercare
              </p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Dosarul și monitoring-ul rămân aici după închidere, fără să concureze cu execuția.
              </p>
            </div>
            <ArrowRight className="size-4 shrink-0 text-eos-text-muted transition-transform group-open:rotate-90" strokeWidth={2} />
          </summary>
          <div className="mt-4 grid gap-3 border-t border-eos-border-subtle pt-4 md:grid-cols-2">
            <RailCard
              title="Ce intră în dosar"
              eyebrow="Dossier"
              items={[
                linkedGeneratedDocument
                  ? `Artifact: ${linkedGeneratedDocument.title}`
                  : suggestedDocumentLabel
                    ? `Artifact așteptat: ${suggestedDocumentLabel}`
                    : "Artifact / dovadă operațională asociată finding-ului",
                cockpitRecipe.dossierOutcome,
                linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
                  ? "Status: aprobat ca dovadă"
                  : linkedGeneratedDocument
                    ? "Status: draft pregătit pentru aprobare"
                    : "Status: încă nu există dovadă salvată",
                linkedGeneratedDocument?.approvedAtISO
                  ? `Salvat: ${new Date(linkedGeneratedDocument.approvedAtISO).toLocaleString("ro-RO")}`
                  : linkedGeneratedDocument
                    ? `Ultimul draft: ${new Date(linkedGeneratedDocument.generatedAtISO).toLocaleString("ro-RO")}`
                    : "Dosarul se completează după confirmare și dovadă",
              ]}
            />
            <RailCard
              title={monitoringTitle}
              eyebrow={monitoringEyebrow}
              items={
                monitoringSignals.length > 0
                  ? monitoringSignals
                  : [
                      "Cazul rămâne sub watch pentru drift, schimbări sursă și reverificări.",
                      "După închidere, cockpit-ul poate redeschide finding-ul dacă apare o schimbare nouă.",
                    ]
              }
            />
          </div>
        </details>
      </CardContent>
    </Card>
  )
}

type FindingDossierSuccessCardProps = {
  findingTitle: string
  linkedGeneratedDocument: LinkedGeneratedDocumentMeta
  savedAtISO?: string | null
  nextReviewDateISO?: string | null
  feedbackMessage?: string | null
  primaryHref?: string
  secondaryHref?: string
}

type FindingCaseClosedCardProps = {
  findingTitle: string
  savedAtISO: string
  nextReviewDateISO?: string
  closureEvidence?: string | null
  feedbackMessage?: string | null
  primaryHref?: string
  secondaryHref?: string
}

export function FindingDossierSuccessCard({
  findingTitle,
  linkedGeneratedDocument,
  savedAtISO,
  nextReviewDateISO,
  feedbackMessage,
  primaryHref,
  secondaryHref,
}: FindingDossierSuccessCardProps) {
  const savedAt = savedAtISO ?? linkedGeneratedDocument.approvedAtISO ?? linkedGeneratedDocument.generatedAtISO
  const nextReviewLabel = nextReviewDateISO
    ? new Date(nextReviewDateISO).toLocaleDateString("ro-RO")
    : linkedGeneratedDocument.nextReviewDateISO
      ? new Date(linkedGeneratedDocument.nextReviewDateISO).toLocaleDateString("ro-RO")
    : linkedGeneratedDocument.expiresAtISO
      ? `expiră ${new Date(linkedGeneratedDocument.expiresAtISO).toLocaleDateString("ro-RO")}`
      : "monitorizare activă după închidere"

  return (
    <div
      data-testid="finding-dossier-success"
      className="relative overflow-hidden rounded-eos-lg border border-eos-success/25 bg-eos-success-soft/30 px-5 py-4"
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-success" aria-hidden />
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-eos-sm border border-eos-success/30 bg-eos-success-soft text-eos-success">
              <ShieldCheck className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
                Risc rezolvat și dovadă salvată la dosar
              </p>
              <p
                data-display-text="true"
                className="mt-1.5 font-display text-[15px] font-semibold leading-snug tracking-[-0.015em] text-eos-text"
              >
                {findingTitle} este rezolvat, iar {linkedGeneratedDocument.title} a intrat în Dosar
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-eos-text-muted">
                Riscul rămâne închis cu documentul salvat la dosar, urmă de aprobare clară și ancoră de monitorizare pe aceeași urmă.
              </p>
            </div>
          </div>
          <Badge variant="success" className="normal-case tracking-normal">
            înregistrat
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FactLine label="Finding sursă" value={findingTitle} />
          <FactLine label="Salvat" value={new Date(savedAt).toLocaleString("ro-RO")} />
          <FactLine label="Următor control" value={nextReviewLabel} />
        </div>

        <div className="rounded-eos-sm border border-eos-success/20 bg-eos-surface px-3 py-2.5">
          <div className="flex items-start gap-2">
            <FolderKanban className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
            <p className="text-[13px] leading-relaxed text-eos-text-muted">
              {feedbackMessage ??
                "Dovada rămâne în dosar pentru audit, handoff și reverificare. Dacă apare drift sau expirare, finding-ul poate fi redeschis pe aceeași urmă."}
            </p>
          </div>
        </div>

        {(primaryHref || secondaryHref) && (
          <div className="flex flex-wrap items-center gap-2">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm bg-eos-success px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-success/90"
              >
                Deschide Dosarul
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </Link>
            ) : null}
            {secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-[34px] items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-text-muted underline underline-offset-2 transition-colors hover:text-eos-text"
              >
                Vezi audit log
                <ArrowRight className="size-3" strokeWidth={2} />
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

export function FindingCaseClosedCard({
  findingTitle,
  savedAtISO,
  nextReviewDateISO,
  closureEvidence,
  feedbackMessage,
  primaryHref,
  secondaryHref,
}: FindingCaseClosedCardProps) {
  const nextReviewLabel = nextReviewDateISO
    ? new Date(nextReviewDateISO).toLocaleDateString("ro-RO")
    : "monitorizare activă după închidere"

  return (
    <div
      data-testid="finding-case-closed"
      className="relative overflow-hidden rounded-eos-lg border border-eos-success/25 bg-eos-success-soft/30 px-5 py-4"
    >
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-success" aria-hidden />
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-eos-sm border border-eos-success/30 bg-eos-success-soft text-eos-success">
              <ShieldCheck className="size-4" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
                Caz închis și trecut în monitorizare
              </p>
              <p
                data-display-text="true"
                className="mt-1.5 font-display text-[15px] font-semibold leading-snug tracking-[-0.015em] text-eos-text"
              >
                {findingTitle} are acum urmă clară în cockpit
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-eos-text-muted">
                Dovada operațională sau reconfirmarea rămâne disponibilă pentru audit, iar cazul continuă sub watch pe aceeași urmă.
              </p>
            </div>
          </div>
          <Badge variant="success" className="normal-case tracking-normal">
            monitorizat
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <FactLine label="Finding" value={findingTitle} />
          <FactLine label="Salvat" value={new Date(savedAtISO).toLocaleString("ro-RO")} />
          <FactLine label="Următor control" value={nextReviewLabel} />
        </div>

        <div className="rounded-eos-sm border border-eos-success/20 bg-eos-surface px-3 py-2.5">
          <div className="flex items-start gap-2">
            <FolderKanban className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
            <p className="text-[13px] leading-relaxed text-eos-text-muted">
              {feedbackMessage ??
                closureEvidence ??
                "Cazul este închis, dovada rămâne disponibilă pentru audit și următorul control este deja programat în monitoring."}
            </p>
          </div>
        </div>

        {(primaryHref || secondaryHref) && (
          <div className="flex flex-wrap items-center gap-2">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm bg-eos-success px-3.5 text-[12.5px] font-semibold text-white transition-colors hover:bg-eos-success/90"
              >
                Deschide Dosarul
                <ArrowRight className="size-3.5" strokeWidth={2} />
              </Link>
            ) : null}
            {secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex h-[34px] items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-text-muted underline underline-offset-2 transition-colors hover:text-eos-text"
              >
                Vezi audit log
                <ArrowRight className="size-3" strokeWidth={2} />
              </Link>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function ProgressStepPill({
  label,
  state,
}: {
  label: string
  state: "done" | "active" | "upcoming"
}) {
  const toneClass =
    state === "done"
      ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
      : state === "active"
        ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
        : "border-eos-border-subtle bg-eos-surface text-eos-text-muted"

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${toneClass}`}
    >
      <span
        className={`inline-flex size-4 items-center justify-center rounded-full border text-[10px] ${
          state === "done"
            ? "border-eos-success/40 bg-white text-eos-success"
            : state === "active"
              ? "border-eos-primary/30 bg-white text-eos-primary"
              : "border-eos-border-subtle bg-eos-surface text-eos-text-muted"
        }`}
      >
        {state === "done" ? "✓" : state === "active" ? "•" : ""}
      </span>
      <span>{label}</span>
    </div>
  )
}

function RailCard({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string
  title: string
  items: string[]
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
        {eyebrow}
      </p>
      <p className="mt-1.5 text-sm font-medium text-eos-text">{title}</p>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex gap-2">
            <span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-eos-text-muted" />
            <p className="text-xs leading-5 text-eos-text-muted">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function NarrativeBlock({
  label,
  content,
  tone,
}: {
  label: string
  content: string
  tone: "default" | "primary" | "warning"
}) {
  const toneClass =
    tone === "primary"
      ? "border-eos-primary/20 bg-eos-primary/5"
      : tone === "warning"
        ? "border-eos-warning-border bg-eos-warning-soft/30"
        : "border-eos-border bg-eos-bg-inset"

  return (
    <div className={`rounded-eos-md border px-4 py-3 ${toneClass}`}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-eos-text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-eos-text">{content}</p>
    </div>
  )
}

function FactLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
        {label}
      </p>
      <p className="text-[13px] text-eos-text-muted">{value}</p>
    </div>
  )
}
