import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import {
  getAnnexRefsForTaskLike,
  getAnnexRefsForTraceRecord,
} from "@/lib/compliance/annex-lite-linking"
import { resolveEvidenceHref } from "@/lib/compliance/evidence-links"
import { formatPrincipleLabel } from "@/lib/compliance/constitution"

type ClientAuditPackDocument = {
  fileName: string
  html: string
}

export function buildClientAuditPackDocument(
  auditPack: AuditPackV2,
  options?: {
    annexHrefBase?: string
  }
): ClientAuditPackDocument {
  const dateLabel = auditPack.generatedAt.slice(0, 10)
  const fileName = `audit-pack-client-${slugify(auditPack.workspace.name)}-${dateLabel}.html`
  const annexHrefBase = options?.annexHrefBase ?? "/api/exports/annex-lite/client"

  return {
    fileName,
    html: buildClientAuditPackHtml(auditPack, annexHrefBase),
  }
}

function buildClientAuditPackHtml(auditPack: AuditPackV2, annexHrefBase: string) {
  const summaryCards = [
    {
      label: "Scor conformitate",
      value:
        auditPack.executiveSummary.complianceScore === null
          ? "n/a"
          : `${auditPack.executiveSummary.complianceScore}%`,
      tone: "neutral",
    },
    {
      label: "Audit readiness",
      value: formatAuditReadiness(auditPack.executiveSummary.auditReadiness),
      tone:
        auditPack.executiveSummary.auditReadiness === "audit_ready" ? "success" : "warning",
    },
    {
      label: "Baseline",
      value:
        auditPack.executiveSummary.baselineStatus === "validated"
          ? "baseline validat"
          : "baseline lipsa",
      tone:
        auditPack.executiveSummary.baselineStatus === "validated" ? "success" : "warning",
    },
    {
      label: "Drift activ",
      value: String(auditPack.executiveSummary.activeDrifts),
      tone: auditPack.executiveSummary.activeDrifts > 0 ? "danger" : "success",
    },
    {
      label: "Sisteme in scope",
      value: String(auditPack.executiveSummary.systemsInScope),
      tone: "neutral",
    },
    {
      label: "Dovezi validate",
      value: String(auditPack.executiveSummary.validatedEvidenceItems),
      tone:
        auditPack.executiveSummary.missingEvidenceItems > 0 ? "warning" : "success",
    },
    {
      label: "Bundle evidence",
      value:
        auditPack.bundleEvidenceSummary.status === "bundle_ready"
          ? "pregatit"
          : "in review",
      tone:
        auditPack.bundleEvidenceSummary.status === "bundle_ready" ? "success" : "warning",
    },
    {
      label: "Controale confirmate",
      value: String(auditPack.traceabilityMatrix.filter((item) => item.review.confirmedByUser).length),
      tone:
        auditPack.traceabilityMatrix.some((item) => item.review.confirmedByUser)
          ? "success"
          : "neutral",
    },
  ]

  const sourcesRows = auditPack.scope.sources
    .map(
      (source) => `<tr>
        <td>${escapeHtml(source.name)}</td>
        <td>${escapeHtml(source.type)}</td>
        <td>${escapeHtml(formatDateTime(source.scannedAt))}</td>
        <td>${escapeHtml(source.analysisStatus)}</td>
        <td>${escapeHtml(source.extractionStatus)}</td>
      </tr>`
    )
    .join("")

  const systemsRows = auditPack.systemRegister
    .map(
      (system) => `<tr>
        <td>
          <strong>${escapeHtml(system.systemName)}</strong>
          <div class="muted small">${escapeHtml(system.discoveryMethod)} · ${escapeHtml(
            formatDetectionStatus(system.detectionStatus)
          )} · ${escapeHtml(formatConfidenceState(system.confidenceModel.state))} · bundle ${escapeHtml(
            formatBundleStatus(system.evidenceBundle.status)
          )}</div>
        </td>
        <td>${escapeHtml(system.provider)} / ${escapeHtml(system.model)}</td>
        <td>${escapeHtml(system.riskClass)}</td>
        <td>${system.openFindings} findings · ${system.openDrifts} drift</td>
        <td>${system.prefillCompletenessScore}%</td>
        <td>${escapeHtml(system.suggestedNextStep)}<div class="muted small" style="margin-top:6px;">${escapeHtml(
          system.confidenceModel.reason
        )}</div>${
          system.suggestedControls[0]
            ? `<div class="muted small" style="margin-top:6px;"><strong>Primul control:</strong> ${escapeHtml(
                system.suggestedControls[0].title
              )}</div>`
            : ""
        }</td>
      </tr>`
    )
    .join("")
  const systemControlPackageRows =
    auditPack.systemRegister.length === 0
      ? `<tr><td colspan="6" class="empty-cell">Nu există încă sisteme în scope pentru pachete de control.</td></tr>`
      : auditPack.systemRegister
          .map((system) => {
            const dominantPackage = groupSystemSuggestedControls(system.suggestedControls)[0]

            return `<tr>
              <td><strong>${escapeHtml(system.systemName)}</strong></td>
              <td>${escapeHtml(dominantPackage?.groupLabel ?? "operațiuni generale")}</td>
              <td>${escapeHtml(dominantPackage?.highestPriority ?? "P3")}</td>
              <td>${escapeHtml(dominantPackage?.ownerRoute ?? system.owner)}</td>
              <td>${escapeHtml(dominantPackage?.bundleHint ?? "Bundle minim în curs de definire")}</td>
              <td>${escapeHtml(dominantPackage?.businessImpact ?? system.suggestedNextStep)}</td>
            </tr>`
          })
          .join("")

  const executiveDecisionItems = buildExecutiveDecisionItems(auditPack)
  const decisionRegister = buildBulletList(executiveDecisionItems)
  const executiveDecisionCards = buildExecutiveDecisionCards(auditPack)
  const executiveMemo = buildExecutiveMemo(auditPack)
  const decisionGateCards = buildDecisionGateCards(auditPack)
  const stakeholderChecklist = buildBulletList(buildStakeholderChecklist(auditPack))
  const ownerActionRows = buildOwnerActionRows(auditPack)
  const externalUseGuidance = buildBulletList(buildExternalUseGuidance(auditPack))
  const statusLegend = buildStatusLegend()

  const controlsRows = auditPack.controlsMatrix
    .map(
      (task) => {
        const annexRefs = getAnnexRefsForTaskLike(auditPack.appendix.compliancePack, {
          taskId: task.taskId,
          sourceDocument: task.sourceDocument,
          lawReference: task.lawReference,
          title: task.title,
          body: `${task.why} ${task.evidenceRequired} ${task.readyText.content ?? ""}`,
        })

        return `<tr>
        <td>
          <strong>${escapeHtml(task.title)}</strong>
          <div class="muted small">${escapeHtml(task.controlFamily.label)}</div>
          <div class="muted small">${escapeHtml(task.why)}</div>
        </td>
        <td><span class="chip ${severityClass(task.severity)}">${escapeHtml(
          task.severity
        )}</span></td>
        <td>${escapeHtml(formatRemediationMode(task.remediationMode))}</td>
        <td>${escapeHtml(task.owner)}</td>
        <td>
          <span class="chip ${auditDecisionClass(task.auditDecision)}">${escapeHtml(
            formatAuditDecision(task.auditDecision)
          )}</span>
          <div class="muted small" style="margin-top:6px;">status task: ${escapeHtml(
            formatTaskStatus(task.status, task.validationStatus)
          )}</div>
          ${
            task.auditGateCodes.length > 0
              ? `<div class="muted small" style="margin-top:6px;">blocaje/gates: ${escapeHtml(
                  task.auditGateCodes.map(formatAuditGateCode).join(" · ")
                )}</div>`
              : ""
          }
        </td>
        <td>${escapeHtml(task.evidenceRequired)}</td>
        <td>${escapeHtml(task.lawReference ?? "revizie juridica")}${
          annexRefs.length > 0
            ? `<div class="muted small" style="margin-top:6px;">${annexRefs
                .map(
                  (ref) =>
                    `<a class="inline-link" href="${escapeHtml(annexHrefBase)}#${escapeHtml(
                      ref.anchorId
                    )}">${escapeHtml(ref.systemName)} · ${escapeHtml(ref.sectionLabel)}</a>`
                )
                .join("<br />")}</div>`
            : ""
        }</td>
      </tr>`
      }
    )
    .join("")

  const evidenceCards =
    auditPack.evidenceLedger.length === 0
      ? emptyState("Nu exista inca dovezi atasate in acest pachet.")
      : auditPack.evidenceLedger
          .map((entry) => {
            const evidenceFile = formatEvidenceFile(entry)

            return `<article class="card inset">
              <div class="row-between">
                <div>
                  <h4>${escapeHtml(entry.title)}</h4>
                  <p class="muted small">${escapeHtml(entry.lawReference ?? "fara articol explicit")}</p>
                </div>
                <span class="chip ${validationClass(entry.validationStatus)}">${escapeHtml(
                  formatValidationStatus(entry.validationStatus)
                )}</span>
              </div>
              <p class="muted">${escapeHtml(entry.validationMessage ?? "Fara mesaj suplimentar.")}</p>
              <dl class="meta-grid">
                <div><dt>Tip dovada</dt><dd>${escapeHtml(entry.evidence?.kind ?? "n/a")}</dd></div>
                <div><dt>Fisier</dt><dd>${evidenceFile}</dd></div>
                <div><dt>Actualizat</dt><dd>${escapeHtml(formatDateTime(entry.updatedAtISO))}</dd></div>
                <div><dt>Document</dt><dd>${escapeHtml(entry.sourceDocument ?? "n/a")}</dd></div>
              </dl>
            </article>`
          })
          .join("")

  const driftCards =
    auditPack.driftRegister.length === 0
      ? emptyState("Nu exista drift activ in acest moment.")
      : auditPack.driftRegister
          .map(
            (drift) => `<article class="card inset">
              <div class="row-between">
                <div>
                  <h4>${escapeHtml(drift.summary)}</h4>
                  <p class="muted small">${escapeHtml(drift.systemLabel ?? drift.sourceDocument ?? "fara context explicit")}</p>
                </div>
                <span class="chip ${severityClass(drift.severity)}">${escapeHtml(
                  drift.severity
                )}</span>
              </div>
              <p class="muted">${escapeHtml(drift.impactSummary ?? "Impactul este în curs de revizie.")}</p>
              <dl class="meta-grid">
                <div><dt>Tip</dt><dd>${escapeHtml(drift.type)}</dd></div>
                <div><dt>Change</dt><dd>${escapeHtml(drift.change)}</dd></div>
                <div><dt>Status</dt><dd>${escapeHtml(formatDriftLifecycleState(drift.lifecycleStatus))}</dd></div>
                <div><dt>Detectat</dt><dd>${escapeHtml(formatDateTime(drift.detectedAtISO))}</dd></div>
                <div><dt>Owner</dt><dd>${escapeHtml(drift.escalationOwner ?? "n/a")}</dd></div>
                <div><dt>Deadline</dt><dd>${escapeHtml(
                  drift.escalationDueAtISO ? formatDateTime(drift.escalationDueAtISO) : "n/a"
                )}</dd></div>
                <div><dt>Task-uri</dt><dd>${escapeHtml(
                  drift.linkedTaskIds.length > 0 ? drift.linkedTaskIds.join(", ") : "n/a"
                )}</dd></div>
                <div><dt>Ce faci acum</dt><dd>${escapeHtml(drift.nextAction ?? "Revizie manuală necesară")}</dd></div>
                <div><dt>Dovada</dt><dd>${escapeHtml(drift.evidenceRequired ?? "Dovadă în curs de definire")}</dd></div>
                <div><dt>Escalare</dt><dd>${escapeHtml(formatEscalationLabel(drift))}</dd></div>
                <div><dt>Ultima acțiune</dt><dd>${escapeHtml(
                  drift.lastStatusUpdatedAtISO ? formatDateTime(drift.lastStatusUpdatedAtISO) : "n/a"
                )}</dd></div>
              </dl>
              ${
                drift.acknowledgedBy || drift.escalationBreachedAtISO || drift.waivedReason
                  ? `<p class="muted small" style="margin-top:12px;">${escapeHtml(
                      [
                        drift.acknowledgedBy ? `Owner: ${drift.acknowledgedBy}` : null,
                        drift.escalationBreachedAtISO
                          ? `SLA depășit la ${formatDateTime(drift.escalationBreachedAtISO)}`
                          : null,
                        drift.waivedReason ? `Motiv waive: ${drift.waivedReason}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")
                    )}</p>`
                  : ""
              }
            </article>`
          )
          .join("")

  const validationRows =
    auditPack.validationLog.length === 0
      ? `<tr><td colspan="4" class="empty-cell">Nu exista inca intrari in validation log.</td></tr>`
      : auditPack.validationLog
          .map(
            (entry) => `<tr>
              <td>${escapeHtml(entry.title)}</td>
              <td><span class="chip ${validationClass(entry.validationStatus)}">${escapeHtml(
                formatValidationStatus(entry.validationStatus)
              )}</span></td>
              <td>${escapeHtml(entry.validationMessage ?? "Fara observatii")}</td>
              <td>${escapeHtml(
                formatDateTime(entry.validatedAtISO ?? entry.lastRescanAtISO ?? auditPack.generatedAt)
              )}</td>
            </tr>`
          )
          .join("")

  const traceabilityRows =
    auditPack.traceabilityMatrix.length === 0
      ? `<tr><td colspan="6" class="empty-cell">Nu exista inca trasee complete de control pentru audit.</td></tr>`
      : auditPack.traceabilityMatrix
          .map(
            (entry) => {
              const annexRefs = getAnnexRefsForTraceRecord(auditPack.appendix.compliancePack, entry)

              return `<tr>
              <td>
                <strong>${escapeHtml(entry.title)}</strong>
                <div class="muted small">${escapeHtml(entry.entryKind)}${entry.remediationMode ? ` · ${escapeHtml(entry.remediationMode)}` : ""}</div>
              </td>
              <td>${escapeHtml(entry.sourceDocuments.join(", ") || "n/a")}</td>
              <td>${escapeHtml(entry.lawReferences.join(" · ") || "fara articol explicit")}${
                annexRefs.length > 0
                  ? `<div class="muted small" style="margin-top:6px;">${annexRefs
                      .map(
                        (ref) =>
                          `<a class="inline-link" href="${escapeHtml(
                            annexHrefBase
                          )}#${escapeHtml(ref.anchorId)}">${escapeHtml(ref.sectionLabel)}</a>`
                      )
                      .join(" · ")}</div>`
                  : ""
              }</td>
              <td>${entry.linkedFindingIds.length} findings / ${entry.linkedDriftIds.length} drift</td>
              <td><span class="chip ${validationClass(entry.evidence.validationStatus)}">${escapeHtml(
                entry.traceStatus
              )}</span>
              <div class="muted small" style="margin-top:6px;">
                <span class="chip ${auditDecisionClass(entry.auditDecision)}">${escapeHtml(
                  formatAuditDecision(entry.auditDecision)
                )}</span>
              </div>${
                entry.auditGateCodes.length > 0
                  ? `<div class="muted small" style="margin-top:6px;">gates active: ${escapeHtml(
                      entry.auditGateCodes.map(formatAuditGateCode).join(" · ")
                    )}</div>`
                  : ""
              }${
                entry.evidence.quality
                  ? `<div class="muted small" style="margin-top:6px;">calitate dovadă: ${escapeHtml(
                      entry.evidence.quality.status
                    )} · ${escapeHtml(entry.evidence.quality.summary)}</div>`
                  : ""
              }</td>
              <td>${escapeHtml(entry.nextStep)}${
                entry.review.confirmedByUser
                  ? `<div class="muted small" style="margin-top:6px;">confirmat pentru audit${
                      entry.review.note ? ` · ${escapeHtml(entry.review.note)}` : ""
                    }</div>`
                  : ""
              }</td>
            </tr>`
            }
          )
          .join("")

  const reviewCards =
    auditPack.traceabilityMatrix.filter((entry) => entry.review.confirmedByUser).length === 0
      ? emptyState("Nu exista inca controale confirmate explicit pentru audit.")
      : auditPack.traceabilityMatrix
          .filter((entry) => entry.review.confirmedByUser)
          .slice(0, 8)
          .map(
            (entry) => `<article class="card inset">
              <div class="row-between">
                <div>
                  <h4>${escapeHtml(entry.title)}</h4>
                  <p class="muted small">${escapeHtml(entry.lawReferences.join(" · ") || "fara articol explicit")}</p>
                </div>
                <span class="chip success">confirmed</span>
              </div>
              <p class="muted">${escapeHtml(entry.review.note || "Control confirmat fara nota suplimentara.")}</p>
              <dl class="meta-grid">
                <div><dt>Snapshot</dt><dd>${escapeHtml(entry.snapshotContext.currentSnapshotId ?? "n/a")}</dd></div>
                <div><dt>Baseline</dt><dd>${escapeHtml(entry.snapshotContext.validatedBaselineSnapshotId ?? "n/a")}</dd></div>
                <div><dt>Coverage</dt><dd>${escapeHtml(entry.bundleCoverageStatus)}</dd></div>
                <div><dt>Ultima confirmare</dt><dd>${escapeHtml(
                  entry.review.updatedAtISO ? formatDateTime(entry.review.updatedAtISO) : "n/a"
                )}</dd></div>
              </dl>
            </article>`
          )
          .join("")

  const blockers = buildBulletList(auditPack.executiveSummary.topBlockers)
  const nextActions = buildBulletList(auditPack.executiveSummary.nextActions)
  const principles = [
    ...new Set(auditPack.systemRegister.flatMap((item) => item.principles).map(formatPrincipleLabel)),
  ]
  const defensibleNow = buildBulletList(buildDefensibleNowItems(auditPack))
  const needsAttention = buildBulletList(buildNeedsAttentionItems(auditPack))
  const changedSinceBaseline = buildBulletList(buildChangedSinceBaselineItems(auditPack))
  const bundleEvidenceRows =
    auditPack.bundleEvidenceSummary.evidenceByKind.length === 0
      ? `<tr><td colspan="2" class="empty-cell">Nu exista inca dovezi agregate in bundle.</td></tr>`
      : auditPack.bundleEvidenceSummary.evidenceByKind
          .map(
            (item) => `<tr>
              <td>${escapeHtml(item.kind)}</td>
              <td>${item.count}</td>
            </tr>`
          )
          .join("")
  const familyCoverageRows =
    auditPack.bundleEvidenceSummary.familyCoverage.length === 0
      ? `<tr><td colspan="5" class="empty-cell">Nu exista inca familii de controale agregate.</td></tr>`
      : auditPack.bundleEvidenceSummary.familyCoverage
          .map(
            (item) => `<tr>
              <td><strong>${escapeHtml(item.familyLabel)}</strong><div class="muted small">${escapeHtml(item.familyDescription)}</div></td>
              <td>${item.validatedControls}/${item.totalControls}<div class="muted small">${item.attachedControls} controale cu dovadă</div></td>
              <td>${item.reusableEvidenceFiles}<div class="muted small">${item.reuseAvailable ? "reuse disponibil" : "reuse indisponibil"}</div></td>
              <td>${escapeHtml(item.reusePolicy)}</td>
              <td>${escapeHtml(item.includedFiles.join(" · ") || "fără fișiere reutilizabile")}</td>
            </tr>`
          )
          .join("")

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <title>Audit Pack CompliScan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --canvas: #0b0d10;
        --ink: #14181f;
        --muted: #5b6573;
        --line: #dfe5ec;
        --panel: #f5f7fb;
        --panel-strong: #eef2f7;
        --success: #0f8f5a;
        --warning: #9a6a00;
        --danger: #b42318;
        --neutral: #445066;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--ink); background: white; }
      .wrap { max-width: 1080px; margin: 0 auto; padding: 28px; }
      .hero { border: 1px solid var(--line); border-radius: 20px; padding: 28px; background: linear-gradient(180deg, #ffffff 0%, #f7fafc 100%); }
      h1, h2, h3, h4, p { margin: 0; }
      h1 { font-size: 30px; line-height: 1.1; }
      h2 { font-size: 18px; margin-bottom: 14px; }
      h3 { font-size: 15px; }
      h4 { font-size: 14px; }
      .sub { margin-top: 10px; color: var(--muted); line-height: 1.6; max-width: 760px; }
      .eyebrow { color: var(--muted); text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; font-weight: 700; }
      .grid { display: grid; gap: 14px; }
      .hero-grid { margin-top: 24px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .summary-card, .card { border: 1px solid var(--line); border-radius: 16px; background: white; }
      .summary-card { padding: 16px; }
      .summary-card .label { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      .summary-card .value { font-size: 24px; font-weight: 700; margin-top: 10px; }
      .summary-card.success .value { color: var(--success); }
      .summary-card.warning .value { color: var(--warning); }
      .summary-card.danger .value { color: var(--danger); }
      .summary-card.neutral .value { color: var(--neutral); }
      .section { margin-top: 26px; }
      .two-col { grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr); }
      .card { padding: 18px; }
      .inset { background: var(--panel); }
      .muted { color: var(--muted); margin-top: 8px; line-height: 1.6; }
      .small { font-size: 12px; }
      .list { margin: 0; padding-left: 18px; color: var(--ink); }
      .list li { margin-top: 8px; line-height: 1.5; }
      .chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; border: 1px solid currentColor; text-transform: uppercase; }
      .chip.success { color: var(--success); }
      .chip.warning { color: var(--warning); }
      .chip.danger { color: var(--danger); }
      .chip.neutral { color: var(--neutral); }
      .chip.idle { color: var(--neutral); }
      .row-between { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .table th, .table td { border-top: 1px solid var(--line); padding: 12px 10px; text-align: left; vertical-align: top; }
      .table thead th { border-top: none; background: var(--panel); color: var(--muted); text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; }
      .meta-grid { margin-top: 14px; display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .meta-grid dt { color: var(--muted); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
      .meta-grid dd { margin: 6px 0 0; font-size: 13px; line-height: 1.5; }
      .empty { padding: 18px; border-radius: 16px; border: 1px dashed var(--line); color: var(--muted); background: var(--panel); }
      .empty-cell { color: var(--muted); text-align: center; }
      .footer { margin-top: 26px; color: var(--muted); font-size: 12px; line-height: 1.6; }
      .tag-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      .cover-grid { margin-top: 18px; display: grid; gap: 14px; grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr); }
      .inline-link { color: var(--neutral); text-decoration: none; border-bottom: 1px solid var(--line); }
      .inline-link:hover { color: var(--ink); }
      @media print {
        body { background: white; }
        .wrap { max-width: 100%; padding: 0; }
        .section { break-inside: avoid; page-break-inside: avoid; }
      }
      @media (max-width: 900px) {
        .hero-grid, .two-col { grid-template-columns: 1fr; }
        .meta-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="hero">
        <p class="eyebrow">CompliScan · Audit Pack client-facing</p>
        <h1>Dosar de audit pentru ${escapeHtml(auditPack.workspace.label)}</h1>
        <p class="sub">
          Acest pachet leaga sursele analizate, sistemele AI identificate, drift-ul activ, controalele recomandate si dovezile validate intr-o forma printabila pentru stakeholderi non-tehnici si audit operational.
        </p>
        <div class="tag-row">
          <span class="chip ${auditPack.executiveSummary.auditReadiness === "audit_ready" ? "success" : "warning"}">${escapeHtml(
            formatAuditReadiness(auditPack.executiveSummary.auditReadiness)
          )}</span>
          <span class="chip ${auditPack.executiveSummary.activeDrifts > 0 ? "danger" : "success"}">drift activ: ${auditPack.executiveSummary.activeDrifts}</span>
          <span class="chip ${auditPack.executiveSummary.baselineStatus === "validated" ? "success" : "warning"}">${escapeHtml(
            auditPack.executiveSummary.baselineStatus === "validated"
              ? "baseline validat"
              : "baseline lipsa"
          )}</span>
        </div>
        <div class="grid hero-grid">
          ${summaryCards
            .map(
              (item) => `<article class="summary-card ${item.tone}">
                <div class="label">${escapeHtml(item.label)}</div>
                <div class="value">${escapeHtml(item.value)}</div>
              </article>`
            )
            .join("")}
        </div>
        <div class="cover-grid">
          <article class="card inset">
            <h3>Ce contine acest dosar</h3>
            <p class="muted">Rezumat executiv, surse in scope, sisteme AI, matrice de controale, bundle de dovezi, drift, validation log si traseul complet finding → task → dovada → snapshot.</p>
          </article>
          <article class="card inset">
            <h3>Ce faci daca il revizuiesti acum</h3>
            <p class="muted">Verifici blocker-ele, vezi controalele confirmate explicit pentru audit si folosesti linkurile catre Annex IV lite pentru contextul fiecarui control sau articol.</p>
          </article>
        </div>
      </section>

      <section class="section grid two-col">
        <article class="card">
          <h2>Dacă citești o singură pagină</h2>
          <p class="muted">${escapeHtml(executiveMemo)}</p>
          <div class="grid hero-grid" style="margin-top:16px;">
            ${decisionGateCards}
          </div>
        </article>
        <article class="card inset">
          <h2>Checklist rapid pentru stakeholder</h2>
          ${stakeholderChecklist}
        </article>
      </section>

      <section class="section grid two-col">
        <article class="card inset">
          <h2>Ce trimiți mai departe și când</h2>
          ${externalUseGuidance}
        </article>
        <article class="card inset">
          <h2>Legendă de citire rapidă</h2>
          ${statusLegend}
        </article>
      </section>

      <section class="section card">
        <h2>Livrabile complementare</h2>
        <div class="grid two-col">
          <article class="card inset">
            <h3>Annex IV lite</h3>
            <p class="muted">Documentul explicativ pentru sistemele AI, generat din pack si completat cu semnale, controale si dovada.</p>
            <p class="muted small"><a class="inline-link" href="${escapeHtml(annexHrefBase)}">Deschide Annex IV lite</a></p>
          </article>
          <article class="card inset">
            <h3>Bundle ZIP</h3>
            <p class="muted">Include README.txt cu ordinea recomandată de citire, plus pack-ul JSON, matrix-ul de trasabilitate si fișierele de dovadă disponibile în bundle.</p>
          </article>
        </div>
      </section>

      <section class="section grid two-col">
        <article class="card">
          <h2>Rezumat executiv</h2>
          <p class="muted">
            Generat la ${escapeHtml(formatDateTime(auditPack.generatedAt))} pentru ${escapeHtml(
              auditPack.workspace.name
            )}. Snapshot-ul curent este ${escapeHtml(
              auditPack.scope.snapshot.id ?? "inca negenerat"
            )}, iar comparatia se face cu ${escapeHtml(
              auditPack.scope.validatedBaseline?.id ?? auditPack.scope.snapshot.comparedToSnapshotId ?? "ultimul snapshot disponibil"
            )}.
          </p>
          <div class="grid" style="margin-top: 16px;">
            <div>
              <h3>Top blockers</h3>
              ${blockers}
            </div>
            <div>
              <h3>Next actions</h3>
              ${nextActions}
            </div>
          </div>
        </article>
        <article class="card">
          <h2>Scope si principii</h2>
          <dl class="meta-grid">
            <div><dt>Sources</dt><dd>${auditPack.executiveSummary.sourcesInScope}</dd></div>
            <div><dt>Systems</dt><dd>${auditPack.executiveSummary.systemsInScope}</dd></div>
            <div><dt>Findings deschise</dt><dd>${auditPack.executiveSummary.openFindings}</dd></div>
            <div><dt>Remedieri deschise</dt><dd>${auditPack.executiveSummary.remediationOpen}</dd></div>
          </dl>
          <p class="muted">
            Principii principale in acest dosar: ${escapeHtml(
              principles.length > 0 ? principles.join(", ") : "nicio principiu mapat inca"
            )}.
          </p>
        </article>
      </section>

      <section class="section grid two-col">
        <article class="card inset">
          <h2>Ce este deja defensibil</h2>
          ${defensibleNow}
        </article>
        <article class="card inset">
          <h2>Ce cere atenție înainte de audit</h2>
          ${needsAttention}
        </article>
      </section>

      <section class="section card">
        <h2>Ce s-a schimbat față de baseline</h2>
        ${changedSinceBaseline}
      </section>

      <section class="section card">
        <h2>Decizii executive recomandate</h2>
        <p class="muted">Această secțiune comprimă dosarul într-un set de decizii clare pentru owner, management sau stakeholder non-tehnic.</p>
        <div class="grid hero-grid" style="margin-top:16px;">
          ${executiveDecisionCards}
        </div>
        ${decisionRegister}
      </section>

      <section class="section card">
        <h2>Owner action register</h2>
        <p class="muted">Vedere simplificată pentru management: cine are responsabilitatea operațională, ce tip de acțiune are și până când trebuie închisă.</p>
        <table class="table">
          <thead>
            <tr>
              <th>Owner</th>
              <th>Ce are de făcut</th>
              <th>Tip</th>
              <th>Deadline</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>
            ${ownerActionRows}
          </tbody>
        </table>
      </section>

      <section class="section">
        <h2>Bundle evidence summary</h2>
        <div class="grid two-col">
          <article class="card inset">
            <div class="row-between">
              <div>
                <h3>Status bundle</h3>
                <p class="muted">Agregam dovezile validate la nivel de dosar, nu doar per task.</p>
              </div>
              <span class="chip ${auditPack.bundleEvidenceSummary.status === "bundle_ready" ? "success" : "warning"}">${escapeHtml(
                auditPack.bundleEvidenceSummary.status
              )}</span>
            </div>
            <dl class="meta-grid">
              <div><dt>Fișiere atașate</dt><dd>${auditPack.bundleEvidenceSummary.attachedFiles}</dd></div>
              <div><dt>Fișiere validate</dt><dd>${auditPack.bundleEvidenceSummary.validatedFiles}</dd></div>
              <div><dt>Controale în așteptare</dt><dd>${auditPack.bundleEvidenceSummary.pendingControls}</dd></div>
              <div><dt>Bundle ready</dt><dd>${auditPack.bundleEvidenceSummary.readyBundles}</dd></div>
            </dl>
          </article>
          <article class="card">
            <table class="table">
              <thead>
                <tr>
                  <th>Tip dovadă</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>${bundleEvidenceRows}</tbody>
            </table>
          </article>
        </div>
        <article class="card" style="margin-top:14px;">
          <h3>Reuse pe familie de controale</h3>
          <p class="muted">Aici se vede unde aceeași dovadă poate susține mai multe controale din aceeași familie operațională, fără să pierzi trasabilitatea pe task.</p>
          <table class="table" style="margin-top:14px;">
            <thead>
              <tr>
                <th>Familie</th>
                <th>Validate</th>
                <th>Fișiere reutilizabile</th>
                <th>Policy reuse</th>
                <th>Bundle disponibil</th>
              </tr>
            </thead>
            <tbody>${familyCoverageRows}</tbody>
          </table>
        </article>
      </section>

      <section class="section card">
        <h2>Sources in scope</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Sursa</th>
              <th>Tip</th>
              <th>Scanata</th>
              <th>Analiza</th>
              <th>Extragere</th>
            </tr>
          </thead>
          <tbody>
            ${sourcesRows || `<tr><td colspan="5" class="empty-cell">Nu exista surse in snapshot.</td></tr>`}
          </tbody>
        </table>
      </section>

      <section class="section card">
        <h2>System register</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Sistem</th>
              <th>Provider / Model</th>
              <th>Risk class</th>
              <th>Probleme active</th>
              <th>Prefill</th>
              <th>Next step</th>
            </tr>
          </thead>
          <tbody>
            ${systemsRows || `<tr><td colspan="6" class="empty-cell">Nu exista sisteme in pack.</td></tr>`}
          </tbody>
        </table>
      </section>

      <section class="section card">
        <h2>Pachete de control recomandate</h2>
        <p class="muted">Această vedere comprimă controalele sugerate în pachete ușor de urmărit de management: ce grup de risc domină, cine conduce execuția și ce bundle minim de dovadă trebuie ținut împreună.</p>
        <table class="table" style="margin-top:14px;">
          <thead>
            <tr>
              <th>Sistem</th>
              <th>Pachet dominant</th>
              <th>Prioritate</th>
              <th>Owner route</th>
              <th>Bundle minim</th>
              <th>Impact</th>
            </tr>
          </thead>
          <tbody>${systemControlPackageRows}</tbody>
        </table>
      </section>

      <section class="section card">
        <h2>Controls matrix</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Severitate</th>
              <th>Mod</th>
              <th>Owner</th>
              <th>Status</th>
              <th>Dovada ceruta</th>
              <th>Referinta</th>
            </tr>
          </thead>
          <tbody>
            ${controlsRows || `<tr><td colspan="7" class="empty-cell">Nu exista controale in acest pachet.</td></tr>`}
          </tbody>
        </table>
      </section>

      <section class="section grid two-col">
        <article class="card">
          <h2>Evidence ledger</h2>
          <div class="grid">${evidenceCards}</div>
        </article>
        <article class="card">
          <h2>Drift register</h2>
          <div class="grid">${driftCards}</div>
        </article>
      </section>

      <section class="section card">
        <h2>Validation log</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Status validare</th>
              <th>Mesaj</th>
              <th>Ultima verificare</th>
            </tr>
          </thead>
          <tbody>
            ${validationRows}
          </tbody>
        </table>
      </section>

      <section class="section card">
        <h2>Traceability matrix</h2>
        <table class="table">
          <thead>
            <tr>
              <th>Control</th>
              <th>Sursa</th>
              <th>Articol / control</th>
              <th>Legaturi</th>
              <th>Status trace</th>
              <th>Next step</th>
            </tr>
          </thead>
          <tbody>
            ${traceabilityRows}
          </tbody>
        </table>
      </section>

      <section class="section card">
        <h2>Control confirmations</h2>
        <div class="grid">${reviewCards}</div>
      </section>

      <p class="footer">
        Acest dosar este generat automat de CompliScan si trebuie revizuit uman inainte de utilizare oficiala. Varianta JSON ramane sursa structurata de adevar, iar acest format client-facing este optimizat pentru citire, discutie si export PDF din browser.
      </p>
    </main>
  </body>
</html>`
}

function buildBulletList(items: string[]) {
  if (items.length === 0) {
    return emptyState("Nu exista puncte notabile in aceasta sectiune.")
  }

  return `<ul class="list">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
}

function emptyState(message: string) {
  return `<div class="empty">${escapeHtml(message)}</div>`
}

function formatAuditReadiness(value: AuditPackV2["executiveSummary"]["auditReadiness"]) {
  return value === "audit_ready" ? "pregătit pentru audit" : "necesită review"
}

function formatRemediationMode(value: AuditPackV2["controlsMatrix"][number]["remediationMode"]) {
  return value === "rapid" ? "rapid" : "structural"
}

function formatTaskStatus(
  status: AuditPackV2["controlsMatrix"][number]["status"],
  validationStatus: AuditPackV2["controlsMatrix"][number]["validationStatus"]
) {
  if (status !== "done") return "deschis"
  if (validationStatus === "passed") return "validat"
  if (validationStatus === "needs_review") return "necesita revizie"
  if (validationStatus === "failed") return "rescan esuat"
  return "inchis"
}

function formatAuditDecision(value: AuditPackV2["controlsMatrix"][number]["auditDecision"]) {
  if (value === "pass") return "gata pentru audit"
  if (value === "review") return "review necesar"
  return "blocat"
}

function auditDecisionClass(value: AuditPackV2["controlsMatrix"][number]["auditDecision"]) {
  if (value === "pass") return "success"
  if (value === "review") return "warning"
  return "danger"
}

function formatAuditGateCode(value: AuditPackV2["controlsMatrix"][number]["auditGateCodes"][number]) {
  if (value === "missing_evidence") return "dovadă lipsă"
  if (value === "pending_validation") return "validare în așteptare"
  if (value === "weak_evidence") return "dovadă slabă"
  if (value === "stale_evidence") return "dovadă veche / afectată de drift"
  if (value === "unresolved_drift") return "drift nerezolvat"
  if (value === "inferred_only_finding") return "finding doar inferat"
  return value
}

function formatValidationStatus(value: AuditPackV2["validationLog"][number]["validationStatus"]) {
  if (value === "passed") return "validat"
  if (value === "failed") return "eșuat"
  if (value === "needs_review") return "în review"
  return "nepornit"
}

function formatBundleStatus(value: AuditPackV2["systemRegister"][number]["evidenceBundle"]["status"]) {
  if (value === "bundle_ready") return "pregătit"
  if (value === "partial") return "parțial"
  return "incomplet"
}

function formatDetectionStatus(value: AuditPackV2["systemRegister"][number]["detectionStatus"]) {
  if (value === "confirmed") return "confirmat"
  if (value === "reviewed") return "revizuit"
  if (value === "rejected") return "respins"
  return "detectat"
}

function formatConfidenceState(value: AuditPackV2["systemRegister"][number]["confidenceModel"]["state"]) {
  if (value === "confirmed_by_user") return "confirmat de user"
  if (value === "inferred") return "inferat"
  return "detectat"
}

function buildDefensibleNowItems(auditPack: AuditPackV2) {
  const items: string[] = []

  if (auditPack.executiveSummary.validatedEvidenceItems > 0) {
    items.push(
      `${auditPack.executiveSummary.validatedEvidenceItems} dovezi sunt deja validate și pot susține discuția de audit.`
    )
  }
  if (auditPack.executiveSummary.baselineStatus === "validated") {
    items.push("Există un baseline validat cu care comparația actuală este trasabilă.")
  }
  const confirmedControls = auditPack.traceabilityMatrix.filter((item) => item.review.confirmedByUser).length
  if (confirmedControls > 0) {
    items.push(`${confirmedControls} controale au fost confirmate explicit pentru audit.`)
  }
  const readySystems = auditPack.systemRegister.filter((item) => item.readiness === "audit_ready").length
  if (readySystems > 0) {
    items.push(`${readySystems} sisteme sunt deja într-o stare apropiată de audit-ready.`)
  }

  return items.length > 0 ? items : ["Dosarul nu are încă suficiente elemente defensive validate; folosește secțiunile de mai jos pentru a închide gap-urile."]
}

function buildNeedsAttentionItems(auditPack: AuditPackV2) {
  const items = [...auditPack.executiveSummary.topBlockers]

  if (auditPack.executiveSummary.missingEvidenceItems > 0) {
    items.push(
      `${auditPack.executiveSummary.missingEvidenceItems} controale au încă dovadă lipsă sau incompletă.`
    )
  }
  if (auditPack.executiveSummary.activeDrifts > 0) {
    items.push(`${auditPack.executiveSummary.activeDrifts} drift-uri deschise trebuie explicate înainte de audit.`)
  }
  const breachedDrifts = auditPack.driftRegister.filter((drift) => Boolean(drift.escalationBreachedAtISO))
  if (breachedDrifts.length > 0) {
    items.push(`${breachedDrifts.length} drift-uri au depășit SLA-ul și cer asumare explicită de owner.`)
  }

  return items.length > 0 ? items : ["Nu există blocaje majore active în acest moment."]
}

function buildChangedSinceBaselineItems(auditPack: AuditPackV2) {
  if (auditPack.driftRegister.length === 0) {
    return ["Nu există schimbări active față de baseline-ul comparat."]
  }

  return auditPack.driftRegister.slice(0, 6).map((drift) => {
    const context = drift.systemLabel ?? drift.sourceDocument ?? "context neexplicit"
    return `${drift.summary} (${context}). Ce faci acum: ${drift.nextAction ?? "revizie manuală"}.`
  })
}

function buildExecutiveDecisionCards(auditPack: AuditPackV2) {
  const blockingDrifts = auditPack.driftRegister.filter((drift) => drift.blocksAudit).length
  const reviewRequiredSystems = auditPack.systemRegister.filter(
    (system) => system.readiness !== "audit_ready" || system.detectionStatus !== "confirmed"
  ).length
  const incompleteFamilies = auditPack.bundleEvidenceSummary.familyCoverage.filter(
    (family) => family.pendingControls > 0
  ).length

  const cards = [
    {
      label: "Blocaje acum",
      value: String(blockingDrifts),
      tone: blockingDrifts > 0 ? "danger" : "success",
      detail:
        blockingDrifts > 0
          ? "Drift-uri care trebuie acceptate sau remediate înainte de audit."
          : "Nu există drift blocant pentru audit în acest moment.",
    },
    {
      label: "Sisteme în review",
      value: String(reviewRequiredSystems),
      tone: reviewRequiredSystems > 0 ? "warning" : "success",
      detail:
        reviewRequiredSystems > 0
          ? "Câmpuri sau sisteme care cer confirmare operațională."
          : "Sistemele în scope sunt deja confirmate operațional.",
    },
    {
      label: "Familii cu gap-uri",
      value: String(incompleteFamilies),
      tone: incompleteFamilies > 0 ? "warning" : "success",
      detail:
        incompleteFamilies > 0
          ? "Bundle-ul de dovadă mai cere completări pe unele familii de controale."
          : "Familiile de controale au acoperire suficientă în bundle-ul curent.",
    },
  ]

  return cards
    .map(
      (card) => `<article class="summary-card ${card.tone}">
        <div class="label">${escapeHtml(card.label)}</div>
        <div class="value">${escapeHtml(card.value)}</div>
        <div class="muted small">${escapeHtml(card.detail)}</div>
      </article>`
    )
    .join("")
}

function buildExecutiveDecisionItems(auditPack: AuditPackV2) {
  const items: string[] = []
  const blockingDrifts = auditPack.driftRegister.filter((drift) => drift.blocksAudit)
  const reviewRequiredSystems = auditPack.systemRegister.filter(
    (system) => system.readiness !== "audit_ready" || system.detectionStatus !== "confirmed"
  )
  const p1Controls = auditPack.systemRegister.flatMap((system) =>
    system.suggestedControls
      .filter((control) => control.priority === "P1")
      .slice(0, 1)
      .map(
        (control) =>
          `${system.systemName}: aprobă controlul „${control.title}” (${control.controlFamily?.label ?? "familie nedefinită"}).`
      )
  )

  if (blockingDrifts.length > 0) {
    items.push(
      `${blockingDrifts.length} drift-uri blochează auditul; acestea trebuie acceptate sau remediate înainte de semnare.`
    )
  }
  if (reviewRequiredSystems.length > 0) {
    items.push(
      `${reviewRequiredSystems.length} sisteme rămân în review sau neconfirmate complet; cere owner-ului validarea câmpurilor operaționale înainte de export final.`
    )
  }
  items.push(...p1Controls.slice(0, 4))

  if (auditPack.bundleEvidenceSummary.familyCoverage.some((family) => family.pendingControls > 0)) {
    items.push(
      "Există familii de controale cu bundle parțial; decide dacă reuse-ul de dovadă este suficient sau dacă ceri dovadă separată."
    )
  }

  if (items.length === 0) {
    items.push("Nu există decizii executive urgente; dosarul poate fi folosit ca punct de control pentru revizia următoare.")
  }

  return items
}

function buildExecutiveMemo(auditPack: AuditPackV2) {
  const blockingDrifts = auditPack.driftRegister.filter((drift) => drift.blocksAudit).length
  const breachedDrifts = auditPack.driftRegister.filter((drift) => Boolean(drift.escalationBreachedAtISO)).length
  const reviewSystems = auditPack.systemRegister.filter(
    (system) => system.readiness !== "audit_ready" || system.detectionStatus !== "confirmed"
  ).length

  if (
    auditPack.executiveSummary.auditReadiness === "audit_ready" &&
    blockingDrifts === 0 &&
    breachedDrifts === 0
  ) {
    return "Dosarul este într-o stare bună pentru audit: baseline-ul este valid, drift-ul blocant este închis, iar dovezile validate susțin controalele principale. Revizia finală rămâne recomandată, dar nu există blocaje majore care să oprească folosirea pachetului."
  }

  return `Dosarul este utilizabil pentru review executiv, dar nu este încă pregătit pentru semnare finală. Avem ${blockingDrifts} drift-uri blocante, ${breachedDrifts} drift-uri cu SLA depășit și ${reviewSystems} sisteme care cer confirmare operațională înainte de exportul final.`
}

function groupSystemSuggestedControls(
  controls: AuditPackV2["systemRegister"][number]["suggestedControls"]
) {
  const groups = new Map<
    string,
    {
      groupKey: string
      groupLabel: string
      controlsCount: number
      highestPriority: "P1" | "P2" | "P3"
      ownerRoute: string
      bundleHint: string
      businessImpact: string
    }
  >()

  for (const control of controls) {
    const groupKey = control.systemGroup ?? "general-operations"
    const current = groups.get(groupKey) ?? {
      groupKey,
      groupLabel: formatSystemGroupLabel(groupKey),
      controlsCount: 0,
      highestPriority: control.priority,
      ownerRoute: control.ownerRoute ?? "Owner sistem + responsabil compliance",
      bundleHint:
        control.bundleHint ?? "Bundle recomandat: owner, dovadă operațională și confirmare a controlului.",
      businessImpact:
        control.businessImpact ??
        "Acest pachet adună controalele care trebuie explicate împreună într-un limbaj executiv.",
    }

    current.controlsCount += 1
    if (priorityRank(control.priority) < priorityRank(current.highestPriority)) {
      current.highestPriority = control.priority
    }
    if (control.ownerRoute) current.ownerRoute = control.ownerRoute
    if (control.bundleHint) current.bundleHint = control.bundleHint
    if (control.businessImpact) current.businessImpact = control.businessImpact

    groups.set(groupKey, current)
  }

  return [...groups.values()].sort((left, right) => {
    if (priorityRank(left.highestPriority) !== priorityRank(right.highestPriority)) {
      return priorityRank(left.highestPriority) - priorityRank(right.highestPriority)
    }
    if (right.controlsCount !== left.controlsCount) {
      return right.controlsCount - left.controlsCount
    }
    return left.groupLabel.localeCompare(right.groupLabel, "ro")
  })
}

function buildDecisionGateCards(auditPack: AuditPackV2) {
  const canShareExternally =
    auditPack.executiveSummary.auditReadiness === "audit_ready" &&
    !auditPack.driftRegister.some((drift) => drift.blocksAudit || Boolean(drift.escalationBreachedAtISO))
  const canFreezeBaseline =
    auditPack.executiveSummary.baselineStatus === "validated" &&
    !auditPack.driftRegister.some((drift) => drift.blocksBaseline)
  const canSignOffEvidence =
    auditPack.executiveSummary.missingEvidenceItems === 0 &&
    auditPack.bundleEvidenceSummary.pendingControls === 0

  const cards = [
    {
      label: "Poți trimite extern",
      value: canShareExternally ? "da" : "încă nu",
      tone: canShareExternally ? "success" : "warning",
      detail: canShareExternally
        ? "Nu există drift blocant sau SLA depășit care să oprească distribuirea controlată."
        : "Mai există drift sau review operațional care trebuie închis înainte de distribuire externă.",
    },
    {
      label: "Poți îngheța baseline",
      value: canFreezeBaseline ? "da" : "încă nu",
      tone: canFreezeBaseline ? "success" : "warning",
      detail: canFreezeBaseline
        ? "Baseline-ul actual poate rămâne punctul de comparație aprobat."
        : "Există drift care afectează baseline-ul și cere revizie înainte de reconfirmare.",
    },
    {
      label: "Poți susține controalele",
      value: canSignOffEvidence ? "da" : "parțial",
      tone: canSignOffEvidence ? "success" : "warning",
      detail: canSignOffEvidence
        ? "Dovezile validate și bundle-ul actual acoperă controalele active."
        : "Mai există controale fără dovadă validată sau bundle incomplet.",
    },
  ]

  return cards
    .map(
      (card) => `<article class="summary-card ${card.tone}">
        <div class="label">${escapeHtml(card.label)}</div>
        <div class="value">${escapeHtml(card.value)}</div>
        <div class="muted small">${escapeHtml(card.detail)}</div>
      </article>`
    )
    .join("")
}

function buildExternalUseGuidance(auditPack: AuditPackV2) {
  const canShareExternally =
    auditPack.executiveSummary.auditReadiness === "audit_ready" &&
    !auditPack.driftRegister.some((drift) => drift.blocksAudit || Boolean(drift.escalationBreachedAtISO))
  const items: string[] = []

  if (canShareExternally) {
    items.push("Poți trimite stakeholderilor externi versiunea client-facing a Audit Pack-ului împreună cu Annex IV lite.")
    items.push("Păstrează ZIP-ul doar pentru situațiile în care cineva cere și dovada brută, nu ca prim document de citit.")
  } else {
    items.push("Ține acest dosar în uz intern până închizi drift-ul blocant sau review-ul operațional rămas.")
    items.push("Trimite extern doar după ce deciziile executive și pachetul de dovezi trec pe verde.")
  }

  if (auditPack.bundleEvidenceSummary.pendingControls > 0) {
    items.push("Înainte de trimitere externă, verifică dacă bundle-ul pe familii de controale are toate fișierele promise.")
  }
  if (auditPack.systemRegister.some((system) => system.detectionStatus !== "confirmed")) {
    items.push("Nu prezenta sistemele încă detectate sau doar inferate ca adevăr operațional; confirmă-le în pack înainte.")
  }

  items.push(
    "Nu trimite extern: fișierele JSON brute (audit-pack-v2-1, traceability, evidence ledger) și dovezile brute, decât la cerere explicită."
  )
  items.push("Ordinea bună de folosire este: Audit Pack client-facing → Annex IV lite → ZIP doar la cerere.")

  return items
}

function buildStatusLegend() {
  return buildBulletList([
    "Audit ready: dosarul poate susține o discuție formală, cu baseline și dovezi suficient de curate.",
    "Review required: există încă elemente bune de lucru, dar nu toate sunt pregătite pentru semnare sau trimitere externă.",
    "Bundle ready: familia de controale are dovadă suficientă și reutilizabilă.",
    "SLA depășit: drift-ul nu mai este doar tehnic; este o responsabilitate întârziată care trebuie asumată de owner.",
  ])
}

function formatEvidenceFile(entry: AuditPackV2["evidenceLedger"][number]) {
  const fileName = entry.evidence?.fileName ?? "neatasat"
  const evidenceHref = resolveEvidenceHref(entry.evidence)
  if (!evidenceHref) {
    return escapeHtml(fileName)
  }
  return `<a class="inline-link" href="${escapeHtml(evidenceHref)}">${escapeHtml(fileName)}</a>`
}

function formatSystemGroupLabel(value: string) {
  if (value === "customer-support") return "suport clienți"
  if (value === "hr-recruitment") return "HR / recrutare"
  if (value === "finance-operations") return "operațiuni financiare"
  if (value === "marketing-analytics") return "marketing / analytics"
  return "operațiuni generale"
}

function priorityRank(priority: "P1" | "P2" | "P3") {
  if (priority === "P1") return 0
  if (priority === "P2") return 1
  return 2
}

function buildStakeholderChecklist(auditPack: AuditPackV2) {
  const items: string[] = []

  items.push(
    auditPack.executiveSummary.baselineStatus === "validated"
      ? "Baseline-ul comparat este validat și poate susține explicația schimbărilor."
      : "Lipsește baseline-ul validat; auditul rămâne explicativ, nu încă defensibil complet."
  )
  items.push(
    auditPack.executiveSummary.activeDrifts === 0
      ? "Nu există drift activ deschis în momentul generării pachetului."
      : `Există ${auditPack.executiveSummary.activeDrifts} drift-uri active care trebuie explicate sau închise.`
  )
  items.push(
    auditPack.executiveSummary.missingEvidenceItems === 0
      ? "Toate controalele active au dovadă validată în acest moment."
      : `${auditPack.executiveSummary.missingEvidenceItems} controale au încă dovadă lipsă sau nevalidată.`
  )
  items.push(
    auditPack.traceabilityMatrix.some((item) => item.review.confirmedByUser)
      ? "Există controale confirmate explicit pentru audit și urmărite în traceability matrix."
      : "Încă nu există confirmări explicite de audit pe controale; se recomandă review manual."
  )

  return items
}

function buildOwnerActionRows(auditPack: AuditPackV2) {
  const rows = [
    ...auditPack.driftRegister
      .filter((drift) => drift.open)
      .map((drift) => ({
        owner: drift.escalationOwner ?? "owner nealocat",
        action: drift.nextAction ?? drift.summary,
        type: "drift",
        deadline: drift.escalationDueAtISO,
        impact: drift.blocksAudit
          ? "blochează auditul"
          : drift.escalationBreachedAtISO
            ? "SLA depășit"
            : "review necesar",
      })),
    ...auditPack.controlsMatrix
      .filter((control) => control.status !== "done" || control.validationStatus !== "passed")
      .slice(0, 12)
      .map((control) => ({
        owner: control.owner,
        action: control.title,
        type: `control ${formatRemediationMode(control.remediationMode)}`,
        deadline: null,
        impact:
          control.severity === "critical" || control.severity === "high"
            ? "prioritate ridicată"
            : "control incomplet",
      })),
  ]

  if (rows.length === 0) {
    return `<tr><td colspan="5" class="empty-cell">Nu există acțiuni deschise care să ceară owner explicit.</td></tr>`
  }

  return rows
    .slice(0, 16)
    .map(
      (row) => `<tr>
        <td>${escapeHtml(row.owner)}</td>
        <td>${escapeHtml(row.action)}</td>
        <td>${escapeHtml(row.type)}</td>
        <td>${escapeHtml(row.deadline ? formatDateTime(row.deadline) : "fără termen explicit")}</td>
        <td>${escapeHtml(row.impact)}</td>
      </tr>`
    )
    .join("")
}

function formatEscalationLabel(drift: AuditPackV2["driftRegister"][number]) {
  const flags = [
    drift.blocksAudit ? "blochează auditul" : null,
    drift.blocksBaseline ? "blochează baseline-ul" : null,
    drift.requiresHumanApproval ? "cere aprobare umană" : null,
    drift.escalationBreachedAtISO ? "SLA depășit" : null,
  ].filter(Boolean)

  return [
    formatDriftLifecycleState(drift.lifecycleStatus),
    drift.escalationTier ?? "watch",
    ...flags,
  ].join(" · ")
}

function formatDriftLifecycleState(value: AuditPackV2["driftRegister"][number]["lifecycleStatus"]) {
  if (value === "acknowledged") return "preluat"
  if (value === "in_progress") return "în lucru"
  if (value === "resolved") return "rezolvat"
  if (value === "waived") return "waived"
  return "deschis"
}

function severityClass(value: string) {
  if (value === "critical" || value === "high") return "danger"
  if (value === "medium") return "warning"
  if (value === "low") return "neutral"
  return "neutral"
}

function validationClass(value: string) {
  if (value === "passed") return "success"
  if (value === "failed") return "danger"
  if (value === "needs_review") return "warning"
  return "idle"
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ro-RO")
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
