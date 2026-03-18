"use client"

import { useState } from "react"
import { ClipboardList } from "lucide-react"

import { EmptyState } from "@/components/evidence-os/EmptyState"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { getControlFamilyReusePolicySummary } from "@/lib/compliance/control-families"
import type { ComplianceTraceRecord } from "@/lib/compliance/traceability"

type TraceabilityMatrixCardProps = {
  records: ComplianceTraceRecord[]
  busy: boolean
  onReview: (input: {
    scope?: "record" | "law_reference" | "family"
    familyKey?: string
    traceId?: string
    lawReference?: string
    action: "confirm" | "clear"
    note?: string | null
  }) => Promise<unknown>
  onReuseFamilyEvidence: (familyKey: string) => Promise<unknown>
}

export function TraceabilityMatrixCard({
  records,
  busy,
  onReview,
  onReuseFamilyEvidence,
}: TraceabilityMatrixCardProps) {
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})
  const familyGroups = buildTraceabilityFamilyGroups(records)
  const reviewGroups = buildTraceabilityReviewGroups(records)

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="border-b border-eos-border pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-eos-md border border-eos-border bg-eos-bg-inset text-eos-primary">
            <ClipboardList className="size-4" strokeWidth={2} />
          </div>
          <div>
            <CardTitle className="text-xl">Matrice de trasabilitate</CardTitle>
            <p className="mt-1 text-sm text-eos-text-muted">
              Traseul dintre sursa, finding, task, drift si snapshot pentru fiecare control urmarit la audit.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {records.length === 0 && (
          <VaultEmptyState
            title="Nu exista inca trasee complete de control"
            description="Dupa ce ai task-uri, dovada si cel putin un snapshot, matricea de trasabilitate se completeaza singura."
          />
        )}
        {familyGroups.length > 0 && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Familie de controale
                </p>
                <p className="mt-2 text-sm leading-6 text-eos-text-muted">
                  Aici refolosim dovada validata si confirmam impreuna controale care au aceeasi natura operationala. Scadem munca repetitiva, dar pastram trasabilitatea pe fiecare control.
                </p>
              </div>
              <Badge variant="outline">{familyGroups.length} familii</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {familyGroups.map((group) => (
                <div
                  key={group.familyKey}
                  className="rounded-eos-md border border-eos-border bg-eos-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">
                        {group.familyLabel}
                      </p>
                      <p className="mt-2 text-xs text-eos-text-muted">
                        {group.recordsCount} controale · {group.confirmedCount} confirmate · {group.reusableEvidenceCount} dovezi reutilizabile
                      </p>
                    </div>
                    <Badge variant={group.pendingEvidenceCount === 0 ? "success" : "warning"}>
                      {group.pendingEvidenceCount === 0 ? "familie acoperita" : "reuse disponibil"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                    {group.description}
                  </p>
                  <div className="mt-3 grid gap-2 rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-xs text-eos-text-muted">
                    <p>
                      <span className="font-medium text-eos-text">De ce conteaza:</span>{" "}
                      {group.familyImpact}
                    </p>
                    <p>
                      <span className="font-medium text-eos-text">Ce dovedeste:</span>{" "}
                      {group.proofSummary}
                    </p>
                    <p>
                      <span className="font-medium text-eos-text">Surse in scope:</span>{" "}
                      {group.sourceDocuments.length > 0 ? group.sourceDocuments.join(" · ") : "fara surse legate inca"}
                    </p>
                    <p>
                      <span className="font-medium text-eos-text">Presiune curenta:</span>{" "}
                      {group.findingsCount} findings · {group.driftsCount} drift
                    </p>
                  </div>
                  <p className="mt-3 text-xs leading-6 text-eos-text-muted">
                    {group.reusePolicy}
                  </p>
                  <p className="mt-3 text-xs text-eos-text-muted">
                    Articole: {group.lawReferences.join(" · ") || "fara articol explicit"}
                  </p>
                  {group.reusableFiles.length > 0 && (
                    <p className="mt-2 text-xs text-eos-text-muted">
                      Bundle curent: {group.reusableFiles.join(" · ")}
                    </p>
                  )}
                  <textarea
                    value={draftNotes[group.familyKey] ?? group.defaultNote}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [group.familyKey]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-4 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm text-eos-text outline-none ring-0"
                    placeholder="Nota comuna pentru aceasta familie de controale."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-eos-primary px-3 text-eos-primary-text hover:bg-eos-primary-hover"
                      disabled={busy || group.validatedCount !== group.recordsCount}
                      onClick={() =>
                        void onReview({
                          scope: "family",
                          familyKey: group.familyKey,
                          action: "confirm",
                          note: (draftNotes[group.familyKey] ?? group.defaultNote).trim() || null,
                        })
                      }
                    >
                      Confirma familia
                    </Button>
                    {group.reusableEvidenceCount > 0 && group.pendingEvidenceCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() => void onReuseFamilyEvidence(group.familyKey)}
                      >
                        Reutilizeaza ultima dovada
                      </Button>
                    )}
                    {group.confirmedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() =>
                          void onReview({
                            scope: "family",
                            familyKey: group.familyKey,
                            action: "clear",
                          })
                        }
                      >
                        Elimina confirmarea
                      </Button>
                    )}
                  </div>
                  {group.validatedCount !== group.recordsCount && (
                    <p className="mt-3 text-xs text-eos-warning">
                      Finalizeaza dovada si rescan-ul pentru toate controalele din familie inainte de confirmare.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {reviewGroups.length > 0 && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Confirmare pe articol / control
                </p>
                <p className="mt-2 text-sm leading-6 text-eos-text-muted">
                  Poti confirma toate controalele legate de acelasi articol legal dintr-o singura actiune. Asta pastreaza auditul coerent cand mai multe task-uri sustin aceeasi obligatie.
                </p>
              </div>
              <Badge variant="outline">{reviewGroups.length} grupuri</Badge>
            </div>
            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              {reviewGroups.map((group) => (
                <div
                  key={group.lawReference}
                  className="rounded-eos-md border border-eos-border bg-eos-surface p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">
                        {group.lawReference}
                      </p>
                      <p className="mt-2 text-xs text-eos-text-muted">
                        {group.recordsCount} controale · {group.confirmedCount} confirmate · {group.sourceCount} surse
                      </p>
                    </div>
                    <Badge variant={group.confirmedCount === group.recordsCount ? "success" : "warning"}>
                      {group.confirmedCount === group.recordsCount ? "grup confirmat" : "revizuire deschisa"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                    {group.sampleNextStep}
                  </p>
                  <textarea
                    value={draftNotes[group.lawReference] ?? group.defaultNote}
                    onChange={(event) =>
                      setDraftNotes((current) => ({
                        ...current,
                        [group.lawReference]: event.target.value,
                      }))
                    }
                    rows={3}
                    className="mt-4 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-3 text-sm text-eos-text outline-none ring-0"
                    placeholder="Nota comuna pentru toate controalele din acest articol."
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 rounded-lg bg-eos-primary px-3 text-eos-primary-text hover:bg-eos-primary-hover"
                      disabled={busy || group.validatedCount !== group.recordsCount}
                      onClick={() =>
                        void onReview({
                          scope: "law_reference",
                          lawReference: group.lawReference,
                          action: "confirm",
                          note: (draftNotes[group.lawReference] ?? group.defaultNote).trim() || null,
                        })
                      }
                    >
                      Confirma grupul
                    </Button>
                    {group.confirmedCount > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-lg"
                        disabled={busy}
                        onClick={() =>
                          void onReview({
                            scope: "law_reference",
                            lawReference: group.lawReference,
                            action: "clear",
                          })
                        }
                      >
                        Elimina confirmarea
                      </Button>
                    )}
                  </div>
                  {group.validatedCount !== group.recordsCount && (
                    <p className="mt-3 text-xs text-eos-warning">
                      Grupul mai contine controale cu dovada slaba sau validare nefinalizata.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {records.length > 3 && (
          <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-3 text-sm text-eos-text-muted">
            Afisam primele 3 trasee de control ca sa ramana pagina usor de citit. Pentru restul, confirma mai intai pe familie sau pe articol si apoi revino pe controalele individuale.
          </div>
        )}
        {records.slice(0, 3).map((record) => (
          <div
            key={record.id}
            className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">
                    {record.entryKind === "control_task" ? "control" : "constatare"}
                  </Badge>
                  {record.remediationMode && (
                    <Badge variant="outline">
                      {record.remediationMode === "rapid" ? "rapid" : "structural"}
                    </Badge>
                  )}
                </div>
                <p className="mt-3 text-sm font-semibold text-eos-text">
                  {record.title}
                </p>
                <p className="mt-2 text-xs text-eos-text-muted">
                  {record.sourceDocuments.length > 0
                    ? record.sourceDocuments.join(" · ")
                    : "fara sursa explicita"}
                </p>
                {record.review.confirmedByUser && (
                  <p className="mt-2 text-xs text-eos-success">
                    Confirmat pentru audit
                    {record.review.updatedAtISO
                      ? ` · ${new Date(record.review.updatedAtISO).toLocaleString("ro-RO")}`
                      : ""}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant={traceStatusBadgeVariant(record.traceStatus)}>
                  {record.traceStatus === "validated"
                    ? "validat"
                    : record.traceStatus === "evidence_required"
                      ? "cere dovada"
                      : "actiune necesara"}
                </Badge>
                <Badge variant={auditDecisionBadgeVariant(record.auditDecision)}>
                  {formatAuditDecision(record.auditDecision)}
                </Badge>
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <TraceMiniCard
                label="Finding / drift"
                value={`${record.findingRefs.length} findings · ${record.driftRefs.length} drift`}
                hint={
                  record.lawReferences.length > 0
                    ? record.lawReferences.join(" · ")
                    : "fara referinta explicita"
                }
              />
              <TraceMiniCard
                label="Snapshot"
                value={record.snapshotContext.currentSnapshotId ?? "n/a"}
                hint={
                  record.snapshotContext.validatedBaselineSnapshotId
                    ? `baseline ${record.snapshotContext.validatedBaselineSnapshotId}`
                    : "baseline lipsa"
                }
              />
              <TraceMiniCard
                label="Dovada"
                value={record.evidence.fileName ?? "neatasata"}
                hint={
                  record.evidence.attached
                    ? [
                        `status ${record.evidence.validationStatus}`,
                        record.evidence.validationBasis
                          ? `baza ${formatValidationBasis(record.evidence.validationBasis)}`
                          : null,
                        record.evidence.validationConfidence
                          ? formatValidationConfidence(record.evidence.validationConfidence)
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    : "cere dovada pentru audit"
                }
              />
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                    Coverage pe control
                  </p>
                  <Badge variant={controlCoverageBadgeVariant(record.bundleCoverageStatus)}>
                    {record.bundleCoverageStatus}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                  {record.evidenceRequired || "Nu exista inca o cerinta explicita de dovada pentru acest control."}
                </p>
                {record.evidence.quality && (
                  <p className="mt-2 text-xs leading-6 text-eos-text-muted">
                    Calitate dovada: {formatEvidenceQualityStatus(record.evidence.quality.status)} ·{" "}
                    {record.evidence.quality.summary}
                  </p>
                )}
                {record.auditGateCodes.length > 0 && (
                  <p className="mt-2 text-xs leading-6 text-eos-text-muted">
                    Gates active: {record.auditGateCodes.map(formatAuditGateCode).join(" · ")}
                  </p>
                )}
                {record.bundleFiles.length > 0 && (
                  <p className="mt-2 text-xs text-eos-text-muted">
                    Fisiere legate: {record.bundleFiles.join(" · ")}
                  </p>
                )}
              </div>
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Referinte si surse
                </p>
                <p className="mt-3 text-sm leading-6 text-eos-text-muted">
                  {record.lawReferences.length > 0
                    ? record.lawReferences.join(" · ")
                    : "Fara referinta legala explicita"}
                </p>
                <p className="mt-2 text-xs text-eos-text-muted">
                  {record.sourceKinds.join(" · ") || "tip sursa neconfirmat"}
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                Ce urmeaza
              </p>
              <p className="mt-2 text-sm leading-6 text-eos-text-muted">
                {record.nextStep}
              </p>
              <div className="mt-4 space-y-3">
                <p className="text-xs uppercase tracking-[0.24em] text-eos-text-muted">
                  Confirmare control / articol
                </p>
                <textarea
                  value={draftNotes[record.id] ?? record.review.note ?? ""}
                  onChange={(event) =>
                    setDraftNotes((current) => ({
                      ...current,
                      [record.id]: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3 text-sm text-eos-text outline-none ring-0"
                  placeholder="Noteaza de ce acest control este acceptat sau ce a fost validat manual."
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-eos-primary px-3 text-eos-primary-text hover:bg-eos-primary-hover"
                    disabled={busy || record.auditDecision !== "pass"}
                    onClick={() =>
                      void onReview({
                        scope: "record",
                        traceId: record.id,
                        action: "confirm",
                        note: (draftNotes[record.id] ?? record.review.note ?? "").trim() || null,
                      })
                    }
                  >
                    Confirma pentru audit
                  </Button>
                  {record.review.confirmedByUser && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 rounded-lg"
                      disabled={busy}
                      onClick={() =>
                        void onReview({ scope: "record", traceId: record.id, action: "clear" })
                      }
                    >
                      Elimina confirmarea
                    </Button>
                  )}
                </div>
                {record.auditDecision !== "pass" && (
                  <p className="text-xs text-eos-warning">
                    Finalizeaza dovada, gates-urile si rescan-ul inainte de confirmarea pentru audit.
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function buildTraceabilityFamilyGroups(records: ComplianceTraceRecord[]) {
  const grouped = new Map<
    string,
    {
      familyKey: string
      familyLabel: string
      description: string
      recordsCount: number
      validatedCount: number
      confirmedCount: number
      pendingEvidenceCount: number
      reusableEvidenceFiles: Set<string>
      reusePolicy: string
      lawReferences: Set<string>
      sourceDocuments: Set<string>
      findingsCount: number
      driftsCount: number
      familyImpact: string
      proofSummary: string
      defaultNote: string
    }
  >()

  for (const record of records) {
    const current = grouped.get(record.controlFamily.key) ?? {
      familyKey: record.controlFamily.key,
      familyLabel: record.controlFamily.label,
      description: record.controlFamily.description,
      recordsCount: 0,
      validatedCount: 0,
      confirmedCount: 0,
      pendingEvidenceCount: 0,
      reusableEvidenceFiles: new Set<string>(),
      reusePolicy: getControlFamilyReusePolicySummary(record.controlFamily.key),
      lawReferences: new Set<string>(),
      sourceDocuments: new Set<string>(),
      findingsCount: 0,
      driftsCount: 0,
      familyImpact: buildFamilyImpact(record.controlFamily.key),
      proofSummary: buildFamilyProofSummary(record.controlFamily.key),
      defaultNote: `Familia ${record.controlFamily.label} a fost revizuita pe baza dovezii comune si a snapshot-ului curent.`,
    }

    current.recordsCount += 1
    current.validatedCount += record.auditDecision === "pass" ? 1 : 0
    current.confirmedCount += record.review.confirmedByUser ? 1 : 0
    current.findingsCount += record.linkedFindingIds.length
    current.driftsCount += record.linkedDriftIds.length
    current.pendingEvidenceCount += record.auditDecision === "pass" ? 0 : 1
    if (record.auditDecision === "pass" && record.evidence.fileName) {
      current.reusableEvidenceFiles.add(record.evidence.fileName)
    }
    for (const lawReference of record.lawReferences) current.lawReferences.add(lawReference)
    for (const sourceDocument of record.sourceDocuments) current.sourceDocuments.add(sourceDocument)
    if (record.review.note) current.defaultNote = record.review.note
    grouped.set(record.controlFamily.key, current)
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      reusableEvidenceCount: group.reusableEvidenceFiles.size,
      reusableFiles: [...group.reusableEvidenceFiles],
      lawReferences: [...group.lawReferences],
      sourceDocuments: [...group.sourceDocuments],
    }))
    .sort((left, right) => left.familyLabel.localeCompare(right.familyLabel))
}

function buildFamilyImpact(familyKey: string) {
  if (familyKey === "human-oversight") {
    return "Arata daca sistemul poate fi oprit, revizuit sau escaladat inainte sa produca efecte operationale."
  }
  if (familyKey === "privacy-tracking") {
    return "Arata daca profilarea, tracking-ul si suprafetele publice pot fi aparate legal si operational."
  }
  if (familyKey === "data-residency") {
    return "Arata daca rezidenta datelor si transferurile sunt explicate clar inainte de audit."
  }
  if (familyKey === "retention-and-deletion") {
    return "Arata daca datele personale sunt pastrate doar cat trebuie si daca exista iesire controlata din flux."
  }
  if (familyKey === "governance-baseline") {
    return "Leaga scopul declarat, baseline-ul si asumarea operationala intr-un punct defensibil."
  }
  if (familyKey === "efactura-operations") {
    return "Arata ca fluxurile cu impact financiar au owner, reconciliere si dovada operationala."
  }

  return "Aceasta familie tine impreuna controale care trebuie explicate ca un pachet, nu ca task-uri izolate."
}

function buildFamilyProofSummary(familyKey: string) {
  if (familyKey === "human-oversight") {
    return "Workflow de review, log de override si nota clara de escaladare."
  }
  if (familyKey === "privacy-tracking") {
    return "CMP activ, consent log si textul legal folosit in suprafata relevanta."
  }
  if (familyKey === "data-residency") {
    return "Regiune declarata, traseu de transfer si document tehnic de sustinere."
  }
  if (familyKey === "retention-and-deletion") {
    return "Politica de retentie si dovada de stergere sau anonimizare."
  }
  if (familyKey === "governance-baseline") {
    return "Baseline validat, owner confirmat si decizie de review legata de snapshot."
  }
  if (familyKey === "efactura-operations") {
    return "Runbook operational, owner financiar si exemplu de reconciliere."
  }

  return "O combinatie de dovada operationala, referinta legala si confirmare de audit."
}

function buildTraceabilityReviewGroups(records: ComplianceTraceRecord[]) {
  const grouped = new Map<
    string,
    {
      lawReference: string
      recordsCount: number
      validatedCount: number
      confirmedCount: number
      sourceDocuments: Set<string>
      sampleNextStep: string
      defaultNote: string
    }
  >()

  for (const record of records) {
    for (const lawReference of record.lawReferences) {
      const current = grouped.get(lawReference)
      const defaultNote = record.review.confirmedByUser
        ? record.review.note ?? ""
        : `Control validat in contextul ${lawReference} pe baza dovezilor si a snapshot-ului curent.`

      if (!current) {
        grouped.set(lawReference, {
          lawReference,
          recordsCount: 1,
          validatedCount: record.auditDecision === "pass" ? 1 : 0,
          confirmedCount: record.review.confirmedByUser ? 1 : 0,
          sourceDocuments: new Set(record.sourceDocuments),
          sampleNextStep: record.nextStep,
          defaultNote,
        })
        continue
      }

      current.recordsCount += 1
      current.validatedCount += record.auditDecision === "pass" ? 1 : 0
      current.confirmedCount += record.review.confirmedByUser ? 1 : 0
      for (const sourceDocument of record.sourceDocuments) {
        current.sourceDocuments.add(sourceDocument)
      }
      if (current.sampleNextStep.length < record.nextStep.length) {
        current.sampleNextStep = record.nextStep
      }
      if (!current.defaultNote && defaultNote) {
        current.defaultNote = defaultNote
      }
    }
  }

  return [...grouped.values()]
    .map((group) => ({
      ...group,
      sourceCount: group.sourceDocuments.size,
    }))
    .sort((left, right) => left.lawReference.localeCompare(right.lawReference))
}

function TraceMiniCard({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3">
      <p className="text-xs uppercase tracking-[0.22em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-sm font-medium text-eos-text">{value}</p>
      <p className="mt-2 text-xs text-eos-text-muted">{hint}</p>
    </div>
  )
}

function VaultEmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return <EmptyState title={title} label={description} className="rounded-eos-md" />
}

function formatValidationBasis(value: NonNullable<ComplianceTraceRecord["evidence"]["validationBasis"]>) {
  if (value === "direct_signal") return "semnal direct"
  if (value === "inferred_signal") return "semnal inferat"
  return "stare operationala"
}

function formatValidationConfidence(
  value: NonNullable<ComplianceTraceRecord["evidence"]["validationConfidence"]>
) {
  if (value === "high") return "incredere mare"
  if (value === "medium") return "incredere medie"
  return "incredere redusa"
}

function formatEvidenceQualityStatus(
  value: NonNullable<ComplianceTraceRecord["evidence"]["quality"]>["status"]
) {
  if (value === "sufficient") return "suficienta"
  return "slaba"
}

function formatAuditDecision(value: ComplianceTraceRecord["auditDecision"]) {
  if (value === "pass") return "gata pentru audit"
  if (value === "review") return "review necesar"
  return "blocat"
}

function formatAuditGateCode(value: ComplianceTraceRecord["auditGateCodes"][number]) {
  if (value === "missing_evidence") return "dovada lipsa"
  if (value === "pending_validation") return "validare in asteptare"
  if (value === "weak_evidence") return "dovada slaba"
  if (value === "stale_evidence") return "dovada veche / afectata de drift"
  if (value === "unresolved_drift") return "drift nerezolvat"
  return "finding doar inferat"
}

function traceStatusBadgeVariant(status: ComplianceTraceRecord["traceStatus"]) {
  if (status === "validated") {
    return "success" as const
  }
  if (status === "evidence_required") {
    return "warning" as const
  }
  return "destructive" as const
}

function auditDecisionBadgeVariant(status: ComplianceTraceRecord["auditDecision"]) {
  if (status === "pass") {
    return "success" as const
  }
  if (status === "review") {
    return "warning" as const
  }
  return "destructive" as const
}

function controlCoverageBadgeVariant(status: ComplianceTraceRecord["bundleCoverageStatus"]) {
  if (status === "covered") {
    return "success" as const
  }
  if (status === "partial") {
    return "warning" as const
  }
  return "secondary" as const
}
