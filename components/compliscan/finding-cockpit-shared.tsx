"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, FileText, FolderKanban, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import type { ScanFinding } from "@/lib/compliance/types"
import {
  getFindingAgeLabel,
  getFindingDocumentFlowPresentation,
  getFindingMonitoringSignals,
  getFindingNarrative,
  getFindingProgressSteps,
  getFindingStatusPresentation,
  type FindingDocumentFlowState,
} from "@/lib/compliscan/finding-cockpit"

type LinkedGeneratedDocumentMeta = {
  id?: string
  title: string
  generatedAtISO: string
  approvalStatus?: "draft" | "approved_as_evidence"
  approvedAtISO?: string
  approvedByEmail?: string
  nextReviewDateISO?: string
  expiresAtISO?: string
}

type FindingNarrativeCardProps = {
  finding: ScanFinding
  title?: string
  description?: string
}

export function FindingNarrativeCard({
  finding,
  title = "Rezolvare în același loc",
  description = "Problema, impactul, pașii și dovada rămân în același context, fără să te plimbe între suprafețe.",
}: FindingNarrativeCardProps) {
  const narrative = getFindingNarrative(finding)
  const status = getFindingStatusPresentation(finding.findingStatus)
  const hasSecondaryContext = Boolean(
    narrative.generatedAsset || narrative.humanStep || narrative.revalidation
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
          <p className="mt-1.5 text-sm leading-relaxed text-eos-text">{narrative.action}</p>
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
              {narrative.generatedAsset ? (
                <NarrativeBlock
                  label="Ce pregătește Compli"
                  content={narrative.generatedAsset}
                  tone="default"
                />
              ) : null}
              {narrative.humanStep ? (
                <NarrativeBlock
                  label="Confirmarea ta"
                  content={narrative.humanStep}
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
}

export function FindingHeroAction({
  finding,
  children,
  helperText,
}: FindingHeroActionProps) {
  const narrative = getFindingNarrative(finding)

  return (
    <div
      data-testid="finding-hero-action"
      className="rounded-eos-xl border-2 border-eos-primary/25 bg-gradient-to-br from-eos-primary/[0.06] via-transparent to-transparent px-5 py-5 sm:px-6 sm:py-6"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-primary">
        Acum faci asta
      </p>
      <p className="mt-2 text-sm leading-relaxed text-eos-text sm:text-[15px]">
        {narrative.action}
      </p>
      {narrative.generatedAsset && (
        <p className="mt-1.5 text-sm text-eos-text-muted">
          {narrative.generatedAsset}
        </p>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {children}
      </div>
      {helperText && (
        <p className="mt-3 text-xs leading-relaxed text-eos-text-muted">
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
}

export function FindingExecutionCard({
  finding,
  documentFlowState = "not_required",
  linkedGeneratedDocument,
}: FindingExecutionCardProps) {
  const status = getFindingDocumentFlowPresentation(documentFlowState)
  const narrative = getFindingNarrative(finding)
  const suggestedDocumentLabel = narrative.suggestedDocumentLabel
  const steps = getFindingProgressSteps(finding, documentFlowState, linkedGeneratedDocument)
  const activeStep = steps.find((step) => step.state === "active") ?? steps[steps.length - 1]
  const monitoringSignals = getFindingMonitoringSignals(finding, linkedGeneratedDocument)

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="gap-3 border-b border-eos-border-subtle pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Progres, dosar și monitorizare</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Harta de progres, regulile de închidere și ce rămâne sub watch după rezolvare.
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
          </div>
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-eos-text">Cum se închide corect</p>
              <p className="mt-1 text-sm leading-relaxed text-eos-text-muted">
                {status.summary}
              </p>
            </div>
          </div>
        </div>

        {linkedGeneratedDocument ? (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-eos-text">{linkedGeneratedDocument.title}</p>
                <p className="mt-1 text-xs text-eos-text-muted">
                  Generat {new Date(linkedGeneratedDocument.generatedAtISO).toLocaleString("ro-RO")}
                  {linkedGeneratedDocument.approvalStatus === "approved_as_evidence"
                    ? " · aprobat ca dovadă"
                    : " · în așteptare pentru confirmare"}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {suggestedDocumentLabel ? (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
              <div>
                <p className="text-sm font-medium text-eos-text">Asset recomandat</p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  {suggestedDocumentLabel} intră în flow-ul acestui finding și, după confirmare, merge la dosar ca dovadă.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 border-t border-eos-border-subtle pt-4 md:grid-cols-2">
          <RailCard
            title="Ce intră în dosar"
            eyebrow="Dossier"
            items={[
              linkedGeneratedDocument
                ? `Artifact: ${linkedGeneratedDocument.title}`
                : suggestedDocumentLabel
                  ? `Artifact așteptat: ${suggestedDocumentLabel}`
                  : "Artifact / dovadă operațională asociată finding-ului",
              linkedGeneratedDocument?.approvalStatus === "approved_as_evidence"
                ? `Status: aprobat ca dovadă`
                : linkedGeneratedDocument
                  ? "Status: draft pregătit pentru aprobare"
                  : "Status: încă nu există dovadă salvată",
              linkedGeneratedDocument?.approvedByEmail
                ? `Aprobat de: ${linkedGeneratedDocument.approvedByEmail}`
                : "Aprobarea explicită rămâne obligatorie înainte de închidere",
              linkedGeneratedDocument?.approvedAtISO
                ? `Salvat: ${new Date(linkedGeneratedDocument.approvedAtISO).toLocaleString("ro-RO")}`
                : linkedGeneratedDocument
                  ? `Ultimul draft: ${new Date(linkedGeneratedDocument.generatedAtISO).toLocaleString("ro-RO")}`
                  : "Dosarul se completează după confirmare și dovadă",
            ]}
          />
          <RailCard
            title="Ce monitorizăm"
            eyebrow="Monitoring"
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
      </CardContent>
    </Card>
  )
}

type FindingDossierSuccessCardProps = {
  findingTitle: string
  linkedGeneratedDocument: LinkedGeneratedDocumentMeta
  feedbackMessage?: string | null
  primaryHref?: string
  secondaryHref?: string
}

export function FindingDossierSuccessCard({
  findingTitle,
  linkedGeneratedDocument,
  feedbackMessage,
  primaryHref,
  secondaryHref,
}: FindingDossierSuccessCardProps) {
  const savedAt = linkedGeneratedDocument.approvedAtISO ?? linkedGeneratedDocument.generatedAtISO
  const nextReviewLabel = linkedGeneratedDocument.nextReviewDateISO
    ? new Date(linkedGeneratedDocument.nextReviewDateISO).toLocaleDateString("ro-RO")
    : linkedGeneratedDocument.expiresAtISO
      ? `expiră ${new Date(linkedGeneratedDocument.expiresAtISO).toLocaleDateString("ro-RO")}`
      : "monitorizare activă după închidere"

  return (
    <Card data-testid="finding-dossier-success" className="border-eos-success/35 bg-eos-success-soft/60">
      <CardContent className="space-y-5 px-5 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-eos-success/25 bg-white/70 text-eos-success">
              <ShieldCheck className="size-5" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-success">
                Dovadă salvată la dosar
              </p>
              <p className="mt-1 text-lg font-semibold text-eos-text">
                {linkedGeneratedDocument.title} a intrat în Vault
              </p>
              <p className="mt-1 text-sm leading-relaxed text-eos-text-muted">
                Finding-ul <span className="font-medium text-eos-text">{findingTitle}</span> este acum închis cu
                artefact, urmă de aprobare și ancoră de monitorizare.
              </p>
            </div>
          </div>
          <Badge variant="success" className="normal-case tracking-normal">
            înregistrat
          </Badge>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <FactLine label="Artifact" value={linkedGeneratedDocument.title} />
          <FactLine label="Finding sursă" value={findingTitle} />
          <FactLine label="Salvat" value={new Date(savedAt).toLocaleString("ro-RO")} />
          <FactLine label="Următor control" value={nextReviewLabel} />
        </div>

        <div className="rounded-eos-md border border-eos-success/20 bg-white/55 px-4 py-3">
          <div className="flex items-start gap-2">
            <FolderKanban className="mt-0.5 size-4 shrink-0 text-eos-success" strokeWidth={2} />
            <p className="text-sm leading-relaxed text-eos-text-muted">
              {feedbackMessage ??
                "Dovada rămâne în dosar pentru audit, handoff și reverificare. Dacă apare drift sau expirare, finding-ul poate fi redeschis pe aceeași urmă."}
            </p>
          </div>
        </div>

        {(primaryHref || secondaryHref) && (
          <div className="flex flex-wrap gap-3">
            {primaryHref ? (
              <Link
                href={primaryHref}
                className="inline-flex items-center gap-2 rounded-eos-md bg-eos-success px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-eos-success/90"
              >
                Deschide Vault
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            ) : null}
            {secondaryHref ? (
              <Link
                href={secondaryHref}
                className="inline-flex items-center gap-2 rounded-eos-md border border-eos-border bg-white/75 px-4 py-2.5 text-sm font-medium text-eos-text transition-colors hover:bg-white"
              >
                Vezi audit log
                <ArrowRight className="size-4" strokeWidth={2} />
              </Link>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
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
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-tertiary">
        {label}
      </p>
      <p className="text-sm text-eos-text-muted">{value}</p>
    </div>
  )
}
