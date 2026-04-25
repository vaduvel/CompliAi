"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react"

import type {
  AICompliancePack,
  AICompliancePackEntry,
} from "@/lib/compliance/ai-compliance-pack"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { formatPrincipleLabel } from "@/lib/compliance/constitution"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

const COMMON_RESIDENCIES = [
  "eu-central-1",
  "eu-west-1",
  "westeurope",
  "germany-west-central",
  "Romania / EU",
  "EEA only",
]

const COMMON_LEGAL_REFERENCES = [
  "EU AI Act Art. 14",
  "EU AI Act Art. 52",
  "GDPR Art. 5",
  "GDPR Art. 7",
  "GDPR Art. 13",
  "GDPR Chapter V",
]

function readinessClasses(readiness: AICompliancePackEntry["readiness"]) {
  if (readiness === "audit_ready") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }

  if (readiness === "review_required") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }

  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function severityClasses(severity: AICompliancePackEntry["compliance"]["highestSeverity"]) {
  if (severity === "critical" || severity === "high") {
    return "border-eos-error-border bg-eos-error-soft text-eos-error"
  }

  if (severity === "medium") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }

  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function readinessLabel(readiness: AICompliancePackEntry["readiness"]) {
  if (readiness === "audit_ready") return "gata de audit"
  if (readiness === "review_required") return "necesită validare"
  return "draft"
}

function confidenceModelClasses(state: AICompliancePackEntry["confidenceModel"]["state"]) {
  if (state === "confirmed_by_user") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }
  if (state === "inferred") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-bg-inset text-eos-text-muted"
}

function confidenceModelLabel(state: AICompliancePackEntry["confidenceModel"]["state"]) {
  if (state === "confirmed_by_user") return "confirmat"
  if (state === "inferred") return "dedus"
  return "detectat"
}

export function AICompliancePackSummaryCard({
  pack,
  compact: _compact = false,
}: {
  pack: AICompliancePack
  compact?: boolean
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">AI Compliance Pack</CardTitle>
            <p className="mt-2 max-w-2xl text-sm text-eos-text-muted">
              Unifica sursele, controalele si dovada intr-un obiect unic de review si audit.
            </p>
          </div>
          <Badge className="border-eos-border bg-eos-surface-variant text-eos-text-muted">
            {pack.summary.totalEntries} intrări
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-3">
          <PackMetric
            label="Gata de audit"
            value={pack.summary.auditReadyEntries}
            tone="text-eos-success"
            hint="Intrări care au control confirmat și dovezi suficiente."
          />
          <PackMetric
            label="De validat"
            value={pack.summary.reviewRequiredEntries}
            tone={pack.summary.reviewRequiredEntries > 0 ? "text-eos-warning" : "text-eos-success"}
            hint="Sisteme sau configurații care cer încă validare umană."
          />
          <PackMetric
            label="Drift deschis"
            value={pack.summary.openDrifts}
            tone={pack.summary.openDrifts > 0 ? "text-eos-error" : "text-eos-success"}
            hint="Schimbări față de baseline care cer explicație sau remediere."
          />
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                Snapshot pack
              </p>
              <p className="mt-2 text-sm text-eos-text-muted">
                Documente {pack.summary.sourceCoverage.document} · Manifests {pack.summary.sourceCoverage.manifest} · YAML {pack.summary.sourceCoverage.yaml}
              </p>
              <p className="mt-2 text-xs text-eos-text-muted">
                Snapshot: {pack.snapshotId || "încă lipsă"} {pack.comparedToSnapshotId ? `· comparat cu ${pack.comparedToSnapshotId}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="default" className="gap-2">
                <Link href={dashboardRoutes.scan}>
                  Completează sursele
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
              <Button asChild size="default" className="gap-2">
                <Link href={dashboardRoutes.auditorVault}>
                  Vezi Auditor Vault
                  <ArrowRight className="size-4" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </div>
          <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">Detalii acoperire</p>
            <div className="mt-3 space-y-2 text-sm text-eos-text-muted">
              <p>
                Findings deschise: {pack.summary.openFindings} · Completare medie: {pack.summary.averageCompletenessScore}%
              </p>
              <p>
                Confirmate: {pack.summary.confidenceCoverage.confirmedByUser} · Deduse: {pack.summary.confidenceCoverage.inferred} · Detectate: {pack.summary.confidenceCoverage.detected}
              </p>
              <p>
                Câmpuri: confirmate {pack.summary.fieldConfidenceCoverage.confirmed} · deduse {pack.summary.fieldConfidenceCoverage.inferred} · lipsă {pack.summary.fieldConfidenceCoverage.missing}
              </p>
              <p>
                Annex IV ready: {pack.summary.annexLiteReadyEntries} · Bundle gata: {pack.summary.bundleReadyEntries}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AICompliancePackEntriesCard({
  pack,
  limit = 4,
  title = "Intrări AI Compliance Pack",
  editable = false,
  busy = false,
  onUpdateField,
}: {
  pack: AICompliancePack
  limit?: number
  title?: string
  editable?: boolean
  busy?: boolean
  onUpdateField?: (input: {
    systemId: string
    field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
    value?: string | null
    action: "save" | "confirm" | "clear"
  }) => Promise<unknown>
}) {
  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              Fiecare intrare leaga identitatea sistemului de starea curenta, controale si urmatorul pas.
            </p>
          </div>
          <Button asChild variant="outline" size="default" className="gap-2">
            <Link href={dashboardRoutes.resolve}>
              Mergi la De rezolvat
              <ArrowRight className="size-4" strokeWidth={2} />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {pack.entries.length === 0 && (
          <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5 text-sm text-eos-text-muted">
            Încă nu există intrări în pack. Confirmă un sistem detectat sau încarcă `compliscan.yaml`.
          </div>
        )}
        {pack.entries.slice(0, limit).map((entry) => (
          <div
            key={entry.id}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-eos-text">
                  {entry.systemName}
                </p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  {entry.identity.provider} · {entry.identity.model} · {entry.identity.purpose}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={readinessClasses(entry.readiness)}>
                  {readinessLabel(entry.readiness)}
                </Badge>
                {entry.compliance.highestSeverity && (
                  <Badge className={severityClasses(entry.compliance.highestSeverity)}>
                    {entry.compliance.highestSeverity}
                  </Badge>
                )}
                <Badge className={confidenceModelClasses(entry.confidenceModel.state)}>
                  {confidenceModelLabel(entry.confidenceModel.state)}
                </Badge>
                <Badge className="border-eos-border bg-eos-bg-inset text-eos-text">
                  prefill {entry.prefill.completenessScore}%
                </Badge>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {entry.compliance.principles.map((principle) => (
                <Badge
                  key={`${entry.id}-${principle}`}
                  className="border-eos-border bg-eos-bg-inset text-eos-text-muted"
                >
                  {formatPrincipleLabel(principle)}
                </Badge>
              ))}
            </div>

            {entry.suggestedNextStep && (
              <p className="mt-3 text-sm font-medium text-eos-text">
                → {entry.suggestedNextStep}
              </p>
            )}

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <PackMiniMeta
                icon={ShieldCheck}
                label="Guvernanță"
                value={`${entry.governance.riskClass} · ${entry.governance.humanReviewPresent ? "review prezent" : "review lipsă"}`}
              />
              <PackMiniMeta
                icon={CheckCircle2}
                label="Evidență"
                value={`${entry.evidence.validatedCount}/${entry.evidence.attachedCount} validate`}
              />
              <PackMiniMeta
                icon={ShieldAlert}
                label="Acum"
                value={`${entry.compliance.openFindings} findings · ${entry.compliance.openDrifts} drift`}
              />
            </div>

            <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                Model de încredere · {confidenceModelLabel(entry.confidenceModel.state)} · {entry.confidence}
              </p>
              <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                {entry.confidenceModel.reason}
              </p>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
              {editable && onUpdateField ? (
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                    Câmpuri de completat · {entry.prefill.completenessScore}% completat
                    {entry.prefill.missingFields.length > 0 ? ` · ${entry.prefill.missingFields.length} câmpuri lipsesc` : ""}
                  </p>
                  <EditablePackFields
                    entry={entry}
                    busy={busy}
                    onUpdateField={onUpdateField}
                  />
                </div>
              ) : (
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                    Câmpuri prefill · {entry.prefill.completenessScore}%
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.prefill.fieldStatus.map((field) => (
                      <Badge
                        key={`${entry.id}-${field.field}`}
                        className={fieldStatusClasses(field.status)}
                      >
                        {field.label}: {field.status}
                      </Badge>
                    ))}
                  </div>
                  {entry.prefill.missingFields.length > 0 && (
                    <p className="mt-3 text-sm text-eos-text-muted">
                      Lipsesc: {entry.prefill.missingFields.join(", ")}
                    </p>
                  )}
                </div>
              )}

              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">Semnale si surse</p>
                <div className="mt-3 space-y-2 text-sm text-eos-text-muted">
                  <p>
                    Capabilitati: {entry.sourceSignals.capabilities.join(", ") || "in curs de inferare"}
                  </p>
                  <p>Date: {entry.sourceSignals.dataCategories.join(", ") || "neconfirmate inca"}</p>
                  <p>Rezidenta: {entry.sourceSignals.residencySignals.join(", ") || "fara semnal clar"}</p>
                  {entry.sources.length > 0 && (
                    <p className="text-xs text-eos-text-muted">
                      Prefill din: {entry.sources.map((source) => `${source.origin}:${source.name}`).join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {entry.compliance.requiredControls.length > 0 && (
              <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">Controale, bundle si trace</p>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                    Controale cerute
                  </p>
                  <div className="mt-3 space-y-3">
                    {groupSuggestedControls(entry.compliance.suggestedControls)
                      .slice(0, 3)
                      .map((group) => (
                        <div
                          key={`${entry.id}-${group.groupKey}`}
                          className="rounded-eos-md border border-eos-border bg-eos-surface p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-eos-text">
                              {group.groupLabel}
                            </p>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge className={suggestedPriorityClasses(group.highestPriority)}>
                                {group.highestPriority}
                              </Badge>
                              <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                                {group.controls.length} controale sugerate
                              </Badge>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                            {group.groupSummary}
                          </p>
                          <div className="mt-3 space-y-2 text-xs text-eos-text-muted">
                            <p>
                              <span className="font-medium text-eos-text">Owner route:</span>{" "}
                              {group.ownerRoute}
                            </p>
                            <p>
                              <span className="font-medium text-eos-text">Bundle util:</span>{" "}
                              {group.bundleHint}
                            </p>
                            {group.familyLabels.length > 0 && (
                              <p>
                                <span className="font-medium text-eos-text">Familii:</span>{" "}
                                {group.familyLabels.join(" · ")}
                              </p>
                            )}
                          </div>

                          <div className="mt-3 space-y-3">
                            {group.controls.slice(0, 2).map((control) => (
                              <div
                                key={control.key}
                                className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3"
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <p className="text-sm font-medium text-eos-text">
                                    {control.title}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2">
                                    {control.controlFamily && (
                                      <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                                        {control.controlFamily.label}
                                      </Badge>
                                    )}
                                    <Badge className="border-eos-border bg-transparent text-eos-text-muted">
                                      {control.priority}
                                    </Badge>
                                  </div>
                                </div>
                                <p className="mt-2 text-sm text-eos-text-muted">
                                  {control.rationale}
                                </p>
                                <p className="mt-2 text-xs text-eos-text-muted">
                                  Dovadă: {control.evidence}
                                  {control.lawReference ? ` · ${control.lawReference}` : ""}
                                  {control.systemGroup ? ` · grup: ${formatSystemGroupLabel(control.systemGroup)}` : ""}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                  <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                    Evidence bundle
                  </p>
                  <p className="mt-3 text-sm font-medium text-eos-text">
                    {formatEvidenceBundleStatus(entry.evidenceBundle.status)}
                  </p>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    {entry.evidenceBundle.validatedItems}/{entry.evidenceBundle.requiredItems} controale validate · {entry.evidenceBundle.attachedItems} fișiere atașate
                  </p>
                  <p className="mt-2 text-sm text-eos-text-muted">
                    Tipuri dovadă: {entry.evidenceBundle.evidenceKinds.join(", ") || "încă lipsesc"}
                  </p>
                  {entry.evidenceBundle.controls.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {entry.evidenceBundle.controls.slice(0, 3).map((control) => (
                        <div
                          key={control.taskId}
                          className="rounded-eos-md border border-eos-border bg-eos-surface p-3"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-medium text-eos-text">
                              {control.title}
                            </p>
                            <Badge className={controlCoverageClasses(control.status)}>
                              {control.status}
                            </Badge>
                          </div>
                          <p className="mt-2 text-xs text-eos-text-muted">
                            {control.lawReference || "fără referință legală explicită"} · {control.remediationMode === "rapid" ? "rapid" : "structural"} · {control.validationStatus}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  {entry.evidenceBundle.lawCoverage.length > 0 && (
                    <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-surface p-3">
                      <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                        Acoperire pe articol
                      </p>
                      <div className="mt-3 space-y-2">
                        {entry.evidenceBundle.lawCoverage.slice(0, 3).map((coverage) => (
                          <p
                            key={`${entry.id}-${coverage.lawReference}`}
                            className="text-sm text-eos-text-muted"
                          >
                            <span className="font-medium text-eos-text">
                              {coverage.lawReference}
                            </span>
                            : {coverage.validatedControls}/{coverage.totalControls} validate
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                  {entry.evidenceBundle.familyCoverage.length > 0 && (
                    <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-surface p-3">
                      <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                        Bundle pe familie de controale
                      </p>
                      <div className="mt-3 space-y-3">
                        {entry.evidenceBundle.familyCoverage.slice(0, 3).map((family) => (
                          <div
                            key={`${entry.id}-${family.familyKey}`}
                            className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium text-eos-text">
                                {family.familyLabel}
                              </p>
                              <Badge className={controlCoverageClasses(family.status)}>
                                {family.status}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm text-eos-text-muted">
                              {family.validatedControls}/{family.totalControls} validate · {family.attachedControls} controale cu dovadă ·{" "}
                              {family.reuseAvailable ? "reuse disponibil" : "reuse indisponibil"}
                            </p>
                            <p className="mt-2 text-xs leading-6 text-eos-text-muted">
                              {family.reusePolicy}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                </div>
              </div>
            )}

            <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">Trace si Annex IV lite</p>
              <div className="mt-3 rounded-eos-md border border-eos-border bg-eos-surface p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                  Trace summary
                </p>
                <p className="mt-3 text-sm text-eos-text-muted">
                  {entry.traceSummary.controlsCovered} controale · {entry.traceSummary.linkedFindings} findings · {entry.traceSummary.linkedDrifts} drift · {entry.traceSummary.linkedLegalReferences} referinte legale
                </p>
                <p className="mt-2 text-sm text-eos-text-muted">
                  Baseline: {entry.traceSummary.baselineLinked ? "legat de baseline validat" : "inca fara baseline validat"} · status: {entry.traceSummary.traceStatus}
                </p>
              </div>
              <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-surface p-4">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">
                  Annex IV lite draft
                </p>
                <div className="mt-3 space-y-3 text-sm text-eos-text-muted">
                  <DraftSection
                    label="System description"
                    content={entry.annexLiteDraft.systemDescription}
                  />
                  <DraftSection
                    label="System scope"
                    content={entry.annexLiteDraft.systemScope}
                  />
                  <DraftSection
                    label="Intended users & affected persons"
                    content={entry.annexLiteDraft.intendedUsersAndAffectedPersons}
                  />
                  <DraftSection
                    label="Intended purpose"
                    content={entry.annexLiteDraft.intendedPurpose}
                  />
                  <DraftSection
                    label="Data & governance"
                    content={entry.annexLiteDraft.dataAndGovernance}
                  />
                  <DraftSection
                    label="Risk & rights impact"
                    content={entry.annexLiteDraft.riskAndRightsImpact}
                  />
                  <DraftSection
                    label="Human oversight"
                    content={entry.annexLiteDraft.humanOversight}
                  />
                  <DraftSection
                    label="Technical dependencies"
                    content={entry.annexLiteDraft.technicalDependencies}
                  />
                  <DraftSection
                    label="Monitoring & controls"
                    content={entry.annexLiteDraft.monitoringAndControls}
                  />
                  <DraftSection
                    label="Evidence & validation"
                    content={entry.annexLiteDraft.evidenceAndValidation}
                  />
                </div>
              </div>
            </div>

          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function EditablePackFields({
  entry,
  busy,
  onUpdateField,
}: {
  entry: AICompliancePackEntry
  busy: boolean
  onUpdateField: (input: {
    systemId: string
    field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
    value?: string | null
    action: "save" | "confirm" | "clear"
  }) => Promise<unknown>
}) {
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState("")
  const [savingField, setSavingField] = useState<string | null>(null)

  const missingLabel = useMemo(
    () => (entry.prefill.missingFields.length > 0 ? entry.prefill.missingFields.join(", ") : null),
    [entry.prefill.missingFields]
  )

  async function handleAction(
    field: AICompliancePackEntry["prefill"]["fieldStatus"][number],
    action: "save" | "confirm" | "clear",
    value?: string | null
  ) {
    setSavingField(field.field)
    try {
      await onUpdateField({
        systemId: entry.systemId,
        field: field.field,
        action,
        value,
      })
      if (action === "save") setEditingField(null)
    } finally {
      setSavingField(null)
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {missingLabel && (
        <p className="text-sm text-eos-text-muted">
          Lipsesc încă: {missingLabel}
        </p>
      )}
      <div className="grid gap-3 xl:grid-cols-2">
        {entry.prefill.fieldStatus.map((field) => {
          const isEditing = editingField === field.field
          const isSaving = busy || savingField === field.field

          return (
            <div
              key={`${entry.id}-${field.field}-editable`}
              className="rounded-eos-md border border-eos-border bg-eos-surface p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-eos-text">
                    {field.label}
                  </p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    {field.status} · {field.confidenceModel.state}
                    {field.userConfirmed ? " · confirmat de user" : ""}
                  </p>
                </div>
                <Badge className={fieldStatusClasses(field.status)}>
                  {field.status}
                </Badge>
              </div>

              {isEditing ? (
                <div className="mt-3 space-y-3">
                  <FieldEditor
                    field={field.field}
                    value={draftValue}
                    onChange={setDraftValue}
                  />
                  <FieldHelperText field={field.field} />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-eos-primary px-3 text-eos-primary-text hover:bg-eos-primary-hover"
                      disabled={isSaving || !draftValue.trim()}
                      onClick={() => void handleAction(field, "save", draftValue)}
                    >
                      Salvează
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={isSaving}
                      onClick={() => {
                        setEditingField(null)
                        setDraftValue("")
                      }}
                    >
                      Renunță
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-3 text-sm text-eos-text-muted">
                    {field.value || "Fără valoare confirmată încă."}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-eos-text-muted">
                    {field.confidenceModel.reason}
                  </p>
                  {field.lastUpdatedAtISO && (
                    <p className="mt-2 text-[11px] text-eos-text-muted">
                      Ultima confirmare: {new Date(field.lastUpdatedAtISO).toLocaleString("ro-RO")}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={isSaving}
                      onClick={() => {
                        setEditingField(field.field)
                        setDraftValue(defaultFieldDraft(field))
                      }}
                    >
                      Editează
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={isSaving || !field.value}
                      onClick={() => void handleAction(field, "confirm", field.value)}
                    >
                      Confirmă
                    </Button>
                    {field.userConfirmed && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg border-eos-error-border text-eos-error hover:bg-eos-error-soft"
                        disabled={isSaving}
                        onClick={() => void handleAction(field, "clear")}
                      >
                        Șterge override
                      </Button>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function FieldEditor({
  field,
  value,
  onChange,
}: {
  field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
  value: string
  onChange: (value: string) => void
}) {
  if (field === "risk_class") {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
      >
        <option value="">Alege clasa de risc</option>
        <option value="minimal">minimal</option>
        <option value="limited">limited</option>
        <option value="high">high</option>
      </select>
    )
  }

  if (field === "personal_data") {
    return (
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
      >
        <option value="">Alege statusul</option>
        <option value="yes">yes</option>
        <option value="no">no</option>
      </select>
    )
  }

  if (field === "human_oversight") {
    return (
      <div className="space-y-3">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
        >
          <option value="">Alege starea de oversight</option>
          <option value="required + present">required + present</option>
          <option value="required + missing">required + missing</option>
          <option value="not required">not required</option>
        </select>
        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-3 text-xs text-eos-text-muted">
          Folosește `required + missing` când controlul trebuie să existe, dar încă nu ai dovada sau fluxul operațional confirmat.
        </div>
      </div>
    )
  }

  if (field === "retention_days") {
    return (
      <div className="space-y-3">
        <input
          type="number"
          min={1}
          step={1}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
          placeholder="Ex. 30"
        />
        <div className="flex flex-wrap gap-2">
          {[30, 90, 180, 365].map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => onChange(String(option))}
            >
              {option} zile
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (field === "data_residency") {
    return (
      <div className="space-y-3">
        <input
          list="data-residency-options"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
          placeholder="Ex. eu-central-1"
        />
        <datalist id="data-residency-options">
          {COMMON_RESIDENCIES.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
        <div className="flex flex-wrap gap-2">
          {COMMON_RESIDENCIES.slice(0, 4).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => onChange(option)}
            >
              {option}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  if (field === "legal_mapping") {
    return (
      <div className="space-y-3">
        <textarea
          value={normalizeLegalMappingDraft(value)}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm text-eos-text outline-none ring-0"
          placeholder={"Un articol pe linie\nEx. GDPR Art. 13\nEU AI Act Art. 52"}
        />
        <div className="flex flex-wrap gap-2">
          {COMMON_LEGAL_REFERENCES.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={() => onChange(appendLine(normalizeLegalMappingDraft(value), option))}
            >
              + {option}
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none ring-0"
      placeholder="Introdu valoarea confirmată"
    />
  )
}

function defaultFieldDraft(field: AICompliancePackEntry["prefill"]["fieldStatus"][number]) {
  if (field.field === "legal_mapping") {
    return normalizeLegalMappingDraft(field.value || "")
  }
  return field.value || ""
}

function FieldHelperText({
  field,
}: {
  field: AICompliancePackEntry["prefill"]["fieldStatus"][number]["field"]
}) {
  const copy =
    field === "legal_mapping"
      ? "Mapează doar articolele sau controalele pe care le poți apăra cu dovadă reală. Un rând = o referință."
      : field === "data_residency"
        ? "Confirmă regiunea reală în care rămân datele sau cea promisă contractual. Asta intră direct în drift și audit."
        : field === "retention_days"
          ? "Folosește durata de retenție asumată operațional, nu o estimare vagă. Dacă nu ai o regulă clară, mai bine lasă în review."
          : field === "human_oversight"
            ? "Confirmă doar starea care există în fluxul real. Lipsa dovezii e mai bună decât o confirmare falsă."
            : field === "purpose"
              ? "Scopul trebuie să fie clar și defensibil. Evită formulări prea late de tip „automatizare generală”."
              : "Confirmă doar valoarea pe care vrei să o folosești mai departe în pack, audit și export."

  return <p className="text-xs leading-5 text-eos-text-muted">{copy}</p>
}

function normalizeLegalMappingDraft(value: string) {
  return value
    .split(/[\n,;·]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n")
}

function appendLine(value: string, next: string) {
  const normalized = normalizeLegalMappingDraft(value)
  if (!normalized) return next
  const lines = normalized.split("\n")
  if (lines.includes(next)) return normalized
  return `${normalized}\n${next}`
}

function PackMetric({
  label,
  value,
  suffix,
  hint,
  tone,
}: {
  label: string
  value: number
  suffix?: string
  hint: string
  tone: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
      <p className={`mt-2 text-2xl font-semibold ${tone}`}>
        {value}
        {suffix ? <span className="ml-1 text-base font-medium">{suffix}</span> : null}
      </p>
      <p className="mt-2 text-sm leading-6 text-eos-text-muted">{hint}</p>
    </div>
  )
}

function fieldStatusClasses(status: AICompliancePackEntry["prefill"]["fieldStatus"][number]["status"]) {
  if (status === "confirmed") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }
  if (status === "inferred") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function DraftSection({ label, content }: { label: string; content: string }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
      <p className="mt-1 leading-6">{content}</p>
    </div>
  )
}

function formatEvidenceBundleStatus(status: AICompliancePackEntry["evidenceBundle"]["status"]) {
  if (status === "bundle_ready") return "bundle pregatit"
  if (status === "partial") return "bundle partial"
  return "dovezi lipsa"
}

function formatSystemGroupLabel(value: string) {
  if (value === "customer-support") return "suport clienți"
  if (value === "hr-recruitment") return "HR / recrutare"
  if (value === "finance-operations") return "operațiuni financiare"
  if (value === "marketing-analytics") return "marketing / analytics"
  return "operațiuni generale"
}

function groupSuggestedControls(
  controls: AICompliancePackEntry["compliance"]["suggestedControls"]
) {
  const groups = new Map<
    string,
    {
      groupKey: string
      groupLabel: string
      controls: AICompliancePackEntry["compliance"]["suggestedControls"]
      highestPriority: "P1" | "P2" | "P3"
      familyLabels: string[]
      ownerRoute: string
      bundleHint: string
      groupSummary: string
    }
  >()

  for (const control of controls) {
    const groupKey = control.systemGroup ?? "general-operations"
    const current = groups.get(groupKey)

    if (current) {
      current.controls.push(control)
      continue
    }

    groups.set(groupKey, {
      groupKey,
      groupLabel: formatSystemGroupLabel(groupKey),
      controls: [control],
      highestPriority: control.priority,
      familyLabels: control.controlFamily?.label ? [control.controlFamily.label] : [],
      ownerRoute: control.ownerRoute ?? "Owner sistem + responsabil compliance",
      bundleHint: control.bundleHint ?? "Bundle recomandat: owner, dovadă operațională și confirmare a controlului.",
      groupSummary:
        control.businessImpact ??
        "Grupul acesta concentrează controalele care fac sistemul defensibil operațional și ușor de explicat la audit.",
    })
  }

  return Array.from(groups.values())
    .map((group) => {
      const highestPriority = group.controls.reduce<"P1" | "P2" | "P3">((current, control) => {
        return priorityRank(control.priority) < priorityRank(current) ? control.priority : current
      }, group.highestPriority)

      return {
        ...group,
        highestPriority,
        familyLabels: [...new Set(group.controls.flatMap((control) =>
          control.controlFamily?.label ? [control.controlFamily.label] : []
        ))],
        ownerRoute:
          group.controls.find((control) => control.ownerRoute)?.ownerRoute ??
          group.ownerRoute,
        bundleHint:
          group.controls.find((control) => control.bundleHint)?.bundleHint ??
          group.bundleHint,
        groupSummary:
          group.controls.find((control) => control.businessImpact)?.businessImpact ??
          group.groupSummary,
      }
    })
    .sort((left, right) => {
    if (right.controls.length !== left.controls.length) {
      return right.controls.length - left.controls.length
    }
    if (priorityRank(left.highestPriority) !== priorityRank(right.highestPriority)) {
      return priorityRank(left.highestPriority) - priorityRank(right.highestPriority)
    }
    return left.groupLabel.localeCompare(right.groupLabel, "ro")
  })
}

function suggestedPriorityClasses(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") {
    return "border-eos-error-border bg-eos-error-soft text-eos-error"
  }
  if (priority === "P2") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-transparent text-eos-text-muted"
}

function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}

function controlCoverageClasses(
  status: AICompliancePackEntry["evidenceBundle"]["controls"][number]["status"]
) {
  if (status === "covered") {
    return "border-eos-border bg-eos-success-soft text-eos-success"
  }
  if (status === "partial") {
    return "border-eos-warning-border bg-eos-warning-soft text-eos-warning"
  }
  return "border-eos-border bg-eos-surface-variant text-eos-text-muted"
}

function PackMiniMeta({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
      <div className="flex items-center gap-2 text-eos-text-muted">
        <Icon className="size-4" strokeWidth={2.2} />
        <span className="font-mono text-xs uppercase tracking-[0.14em]">{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-eos-text">{value}</p>
    </div>
  )
}
