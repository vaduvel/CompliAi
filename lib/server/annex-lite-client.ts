import type { AICompliancePack } from "@/lib/compliance/ai-compliance-pack"
import {
  buildAnnexSectionAnchor,
  buildAnnexSystemAnchor,
  getAnnexSectionDescriptors,
  getAnnexSectionLabel,
} from "@/lib/compliance/annex-lite-linking"
import { formatPrincipleLabel } from "@/lib/compliance/constitution"

type ClientAnnexLiteDocument = {
  fileName: string
  html: string
}

export function buildClientAnnexLiteDocument(
  compliancePack: AICompliancePack
): ClientAnnexLiteDocument {
  const dateLabel = compliancePack.generatedAt.slice(0, 10)
  const fileName = `annex-iv-lite-${slugify(compliancePack.workspace.orgName)}-${dateLabel}.html`

  return {
    fileName,
    html: buildClientAnnexLiteHtml(compliancePack),
  }
}

function buildClientAnnexLiteHtml(compliancePack: AICompliancePack) {
  const summaryCards = [
    {
      label: "Sisteme in pack",
      value: String(compliancePack.summary.totalEntries),
      tone: "neutral",
    },
    {
      label: "Annex ready",
      value: String(compliancePack.summary.annexLiteReadyEntries),
      tone:
        compliancePack.summary.annexLiteReadyEntries === compliancePack.summary.totalEntries
          ? "success"
          : "warning",
    },
    {
      label: "Review required",
      value: String(compliancePack.summary.reviewRequiredEntries),
      tone: compliancePack.summary.reviewRequiredEntries > 0 ? "warning" : "success",
    },
    {
      label: "Average prefill",
      value: `${compliancePack.summary.averageCompletenessScore}%`,
      tone: compliancePack.summary.averageCompletenessScore >= 80 ? "success" : "warning",
    },
    {
      label: "Open findings",
      value: String(compliancePack.summary.openFindings),
      tone: compliancePack.summary.openFindings > 0 ? "danger" : "success",
    },
    {
      label: "Open drift",
      value: String(compliancePack.summary.openDrifts),
      tone: compliancePack.summary.openDrifts > 0 ? "danger" : "success",
    },
  ]

  const scopeChips = [
    `document: ${compliancePack.summary.sourceCoverage.document}`,
    `manifest: ${compliancePack.summary.sourceCoverage.manifest}`,
    `yaml: ${compliancePack.summary.sourceCoverage.yaml}`,
  ]

  const systemsMarkup =
    compliancePack.entries.length === 0
      ? emptyState("Nu exista sisteme in AI Compliance Pack pentru acest export.")
      : compliancePack.entries.map((entry) => buildEntrySection(entry)).join("")
  const tocMarkup =
    compliancePack.entries.length === 0
      ? ""
      : compliancePack.entries
          .map((entry) => {
            const descriptors = getAnnexSectionDescriptors(entry.systemId)
            return `<article class="card inset">
              <h3><a href="#${buildAnnexSystemAnchor(entry.systemId)}">${escapeHtml(entry.systemName)}</a></h3>
              <p class="muted small">${escapeHtml(entry.identity.provider)} / ${escapeHtml(
                entry.identity.model
              )} · ${escapeHtml(entry.governance.riskClass)}</p>
              <div class="toc-links">
                ${descriptors
                  .map(
                    (descriptor) =>
                      `<a href="#${descriptor.anchorId}">${escapeHtml(descriptor.sectionLabel)}</a>`
                  )
                  .join("")}
              </div>
            </article>`
          })
          .join("")

  return `<!doctype html>
<html lang="ro">
  <head>
    <meta charset="utf-8" />
    <title>Annex IV lite CompliScan</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        --eos-surface-base: #ffffff;
        --eos-text-primary: #14181f;
        --eos-text-secondary: #5b6573;
        --eos-border-default: #dfe5ec;
        --eos-surface-secondary: #f5f7fb;
        --eos-surface-tertiary: #eef2f7;
        --eos-status-success: #0f8f5a;
        --eos-status-warning: #9a6a00;
        --eos-status-danger: #b42318;
        --eos-accent-secondary: #445066;
      }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: var(--eos-text-primary); background: var(--eos-surface-base); }
      main { max-width: 1080px; margin: 0 auto; padding: 28px; }
      h1, h2, h3, h4, p { margin: 0; }
      h1 { font-size: 30px; line-height: 1.08; }
      h2 { font-size: 19px; margin-bottom: 14px; }
      h3 { font-size: 16px; }
      h4 { font-size: 14px; }
      .hero { border: 1px solid var(--eos-border-default); border-radius: 20px; padding: 28px; background: linear-gradient(180deg, var(--eos-surface-base) 0%, var(--eos-surface-secondary) 100%); }
      .eyebrow { color: var(--eos-text-secondary); text-transform: uppercase; letter-spacing: 0.18em; font-size: 11px; font-weight: 700; }
      .sub { margin-top: 10px; color: var(--eos-text-secondary); line-height: 1.6; max-width: 800px; }
      .grid { display: grid; gap: 14px; }
      .hero-grid { margin-top: 24px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .summary-card, .card { border: 1px solid var(--eos-border-default); border-radius: 16px; background: var(--eos-surface-base); }
      .summary-card { padding: 16px; }
      .summary-card .label { color: var(--eos-text-secondary); font-size: 12px; text-transform: uppercase; letter-spacing: 0.12em; }
      .summary-card .value { font-size: 24px; font-weight: 700; margin-top: 10px; }
      .summary-card.success .value { color: var(--eos-status-success); }
      .summary-card.warning .value { color: var(--eos-status-warning); }
      .summary-card.danger .value { color: var(--eos-status-danger); }
      .summary-card.neutral .value { color: var(--eos-accent-secondary); }
      .section { margin-top: 26px; }
      .card { padding: 18px; }
      .inset { background: var(--eos-surface-secondary); }
      .muted { color: var(--eos-text-secondary); margin-top: 8px; line-height: 1.6; }
      .small { font-size: 12px; }
      .row-between { display: flex; justify-content: space-between; gap: 12px; align-items: flex-start; }
      .tag-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
      .chip { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 5px 10px; font-size: 12px; font-weight: 700; border: 1px solid currentColor; text-transform: uppercase; }
      .chip.success { color: var(--eos-status-success); }
      .chip.warning { color: var(--eos-status-warning); }
      .chip.danger { color: var(--eos-status-danger); }
      .chip.neutral { color: var(--eos-accent-secondary); }
      .section-grid { display: grid; gap: 14px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .meta-grid { margin-top: 14px; display: grid; gap: 10px; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .meta-grid dt { color: var(--eos-text-secondary); font-size: 11px; text-transform: uppercase; letter-spacing: 0.12em; }
      .meta-grid dd { margin: 6px 0 0; font-size: 13px; line-height: 1.5; }
      .table { width: 100%; border-collapse: collapse; font-size: 13px; }
      .table th, .table td { border-top: 1px solid var(--eos-border-default); padding: 12px 10px; text-align: left; vertical-align: top; }
      .table thead th { border-top: none; background: var(--eos-surface-secondary); color: var(--eos-text-secondary); text-transform: uppercase; letter-spacing: 0.12em; font-size: 11px; }
      .empty { padding: 18px; border-radius: 16px; border: 1px dashed var(--eos-border-default); color: var(--eos-text-secondary); background: var(--eos-surface-secondary); }
      .footer { margin-top: 26px; color: var(--eos-text-secondary); font-size: 12px; line-height: 1.6; }
      .toc-links { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
      .toc-links a, .inline-link { color: var(--eos-accent-secondary); text-decoration: none; border-bottom: 1px solid var(--eos-border-default); }
      .toc-links a:hover, .inline-link:hover { color: var(--eos-text-primary); }
      @media print {
        main { max-width: 100%; padding: 0; }
        .section, .card { break-inside: avoid; page-break-inside: avoid; }
      }
      @media (max-width: 900px) {
        .hero-grid, .section-grid, .meta-grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <p class="eyebrow">CompliScan · Annex IV lite</p>
        <h1>Documentatie client-facing pentru sisteme AI</h1>
        <p class="sub">
          Acest document transforma AI Compliance Pack intr-o varianta lizibila pentru review operational, pregatire audit si discutii cu stakeholderi non-tehnici. Scopul lui este sa reduca birocrația si sa porneasca de la prefill, nu de la pagina goala.
        </p>
        <div class="tag-row">
          ${scopeChips.map((chip) => `<span class="chip neutral">${escapeHtml(chip)}</span>`).join("")}
          <span class="chip ${compliancePack.summary.openDrifts > 0 ? "danger" : "success"}">drift activ: ${compliancePack.summary.openDrifts}</span>
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
      </section>

    <section class="section card">
      <h2>Context de generare</h2>
        <dl class="meta-grid">
          <div><dt>Workspace</dt><dd>${escapeHtml(compliancePack.workspace.workspaceLabel)}</dd></div>
          <div><dt>Owner</dt><dd>${escapeHtml(compliancePack.workspace.workspaceOwner)}</dd></div>
          <div><dt>Generated at</dt><dd>${escapeHtml(formatDateTime(compliancePack.generatedAt))}</dd></div>
          <div><dt>Snapshot</dt><dd>${escapeHtml(compliancePack.snapshotId ?? "inca negenerat")}</dd></div>
          <div><dt>Compared to</dt><dd>${escapeHtml(compliancePack.comparedToSnapshotId ?? "ultimul snapshot disponibil")}</dd></div>
          <div><dt>Entries review required</dt><dd>${compliancePack.summary.reviewRequiredEntries}</dd></div>
        </dl>
        <p class="muted">
          Acest export foloseste aceeasi sursa de adevar ca Auditor Vault si Audit Pack. Sistemele din pack pot contine date detectate, inferate sau confirmate de utilizator, iar diferentele raman vizibile pentru revizie.
        </p>
      </section>

      <section class="section card">
        <h2>Review checklist</h2>
        <div class="section-grid">
          <article class="card inset">
            <h3>Ce verifici înainte de export oficial</h3>
            <p class="muted">Confirmă scopul sistemului, clasa de risc, human oversight și mapările legale care intră în documentație.</p>
          </article>
          <article class="card inset">
            <h3>Ce dovadă trebuie păstrată</h3>
            <p class="muted">Leagă fiecare control de o dovadă validată și păstrează bundle-ul de fișiere atașate înainte de audit sau livrare externă.</p>
          </article>
        </div>
      </section>

      <section class="section card">
        <h2>Table of contents</h2>
        <div class="grid">${tocMarkup}</div>
      </section>

      ${systemsMarkup}

      <p class="footer">
        Acest document a fost generat automat de CompliScan pe baza datelor introduse. Nu constituie opinie juridică și nu garantează conformitatea. CompliScan nu este certificat de DNSC, ANSPDCP sau altă autoritate. Consultați un specialist juridic pentru validare. Varianta structurată rămâne AI Compliance Pack din snapshot-ul curent.
      </p>
    </main>
  </body>
</html>`
}

function buildEntrySection(entry: AICompliancePack["entries"][number]) {
  const principleLabels = entry.compliance.principles.map(formatPrincipleLabel)
  const systemAnchor = buildAnnexSystemAnchor(entry.systemId)
  const dominantPackage = groupSystemSuggestedControls(entry.compliance.suggestedControls)[0]
  const fieldRows = entry.prefill.fieldStatus
    .map(
      (field) => `<tr>
        <td>${escapeHtml(field.label)}</td>
        <td>${escapeHtml(field.value ?? "missing")}</td>
        <td>${escapeHtml(field.status)}</td>
        <td>${escapeHtml(field.confidenceModel.state)}</td>
      </tr>`
    )
    .join("")

  const lawCoverageRows =
    entry.evidenceBundle.lawCoverage.length === 0
      ? `<tr><td colspan="4" class="empty">Nu exista inca coverage mapat pe articol.</td></tr>`
      : entry.evidenceBundle.lawCoverage
          .map(
            (coverage) => `<tr>
              <td>${escapeHtml(coverage.lawReference)}</td>
              <td>${coverage.totalControls}</td>
              <td>${coverage.validatedControls}</td>
              <td>${coverage.pendingControls}</td>
            </tr>`
          )
          .join("")

  const controlsRows =
    entry.evidenceBundle.controls.length === 0
      ? `<tr><td colspan="6" class="empty">Nu exista controale in bundle pentru acest sistem.</td></tr>`
      : entry.evidenceBundle.controls
          .map(
            (control) => `<tr>
              <td>${escapeHtml(control.title)}</td>
              <td>${escapeHtml(control.lawReference ?? "revizie juridica")}</td>
              <td>${escapeHtml(control.remediationMode)}</td>
              <td>${escapeHtml(control.status)}</td>
              <td>${escapeHtml(control.validationStatus)}</td>
              <td>${escapeHtml(control.files.join(", ") || "fara fisiere")}</td>
            </tr>`
          )
          .join("")

  return `<section class="section card" id="${systemAnchor}">
    <div class="row-between">
      <div>
        <p class="eyebrow">Sistem AI</p>
        <h2>${escapeHtml(entry.systemName)}</h2>
        <p class="muted">
          ${escapeHtml(entry.identity.provider)} / ${escapeHtml(entry.identity.model)} · ${escapeHtml(entry.identity.purpose)}
        </p>
      </div>
      <div class="tag-row" style="justify-content:flex-end;">
        <span class="chip ${readinessClass(entry.readiness)}">${escapeHtml(entry.readiness)}</span>
        <span class="chip ${confidenceModelClass(entry.confidenceModel.state)}">${escapeHtml(
          entry.confidenceModel.state
        )}</span>
        <span class="chip ${bundleStatusClass(entry.evidenceBundle.status)}">${escapeHtml(
          entry.evidenceBundle.status
        )}</span>
      </div>
    </div>

    <dl class="meta-grid">
      <div><dt>Risk class</dt><dd>${escapeHtml(entry.governance.riskClass)}</dd></div>
      <div><dt>Personal data</dt><dd>${entry.governance.personalDataUsed ? "da" : "nu"}</dd></div>
      <div><dt>Human review</dt><dd>${entry.governance.humanReviewPresent ? "prezent" : "lipsa"}${entry.governance.humanReviewRequired ? " · required" : ""}</dd></div>
      <div><dt>Owner</dt><dd>${escapeHtml(entry.governance.owner)}</dd></div>
      <div><dt>Prefill completeness</dt><dd>${entry.prefill.completenessScore}%</dd></div>
      <div><dt>Suggested next step</dt><dd>${escapeHtml(entry.suggestedNextStep)}</dd></div>
    </dl>

    <section class="section section-grid">
      <article class="card inset">
        <h3>Rezumat pentru management</h3>
        <p class="muted">${escapeHtml(
          dominantPackage?.businessImpact ??
            "Acest sistem cere încă revizie operațională înainte de a fi folosit ca documentație formală."
        )}</p>
        <p class="muted"><strong>Owner route:</strong> ${escapeHtml(
          dominantPackage?.ownerRoute ?? entry.governance.owner
        )}</p>
        <p class="muted"><strong>Pachet dominant:</strong> ${escapeHtml(
          dominantPackage?.groupLabel ?? "operațiuni generale"
        )} · ${escapeHtml(dominantPackage?.highestPriority ?? "P3")}</p>
      </article>
      <article class="card inset">
        <h3>Ce trebuie ținut împreună</h3>
        <p class="muted">${escapeHtml(
          dominantPackage?.bundleHint ??
            "Ține împreună owner-ul, dovada operațională și confirmarea controlului înainte de export."
        )}</p>
        <p class="muted"><strong>Gap-uri rămase:</strong> ${escapeHtml(
          entry.prefill.missingFields.join(", ") || "niciun gap major"
        )}</p>
        <p class="muted"><strong>Readiness:</strong> ${escapeHtml(entry.readiness)} · <strong>bundle:</strong> ${escapeHtml(entry.evidenceBundle.status)}</p>
      </article>
    </section>

    <div class="section-grid" style="margin-top: 18px;">
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "system_description")}">${getAnnexSectionLabel(
          "system_description"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.systemDescription)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "system_scope")}">${getAnnexSectionLabel(
          "system_scope"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.systemScope)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "intended_purpose")}">${getAnnexSectionLabel(
          "intended_purpose"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.intendedPurpose)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "intended_users_and_affected_persons")}">${getAnnexSectionLabel(
          "intended_users_and_affected_persons"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.intendedUsersAndAffectedPersons)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "data_and_governance")}">${getAnnexSectionLabel(
          "data_and_governance"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.dataAndGovernance)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "risk_and_rights_impact")}">${getAnnexSectionLabel(
          "risk_and_rights_impact"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.riskAndRightsImpact)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "human_oversight")}">${getAnnexSectionLabel(
          "human_oversight"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.humanOversight)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "technical_dependencies")}">${getAnnexSectionLabel(
          "technical_dependencies"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.technicalDependencies)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "monitoring_and_controls")}">${getAnnexSectionLabel(
          "monitoring_and_controls"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.monitoringAndControls)}</p>
      </article>
      <article class="card inset">
        <h3 id="${buildAnnexSectionAnchor(entry.systemId, "evidence_and_validation")}">${getAnnexSectionLabel(
          "evidence_and_validation"
        )}</h3>
        <p class="muted">${escapeHtml(entry.annexLiteDraft.evidenceAndValidation)}</p>
      </article>
    </div>

    <section class="section">
      <h3>Prefill field register</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Camp</th>
            <th>Valoare</th>
            <th>Status</th>
            <th>Confidence model</th>
          </tr>
        </thead>
        <tbody>${fieldRows}</tbody>
      </table>
    </section>

    <section class="section section-grid">
      <article class="card inset">
        <h3>Legal and control context</h3>
        <p class="muted">
          Principii: ${escapeHtml(principleLabels.join(", ") || "nicio mapare")}
        </p>
        <p class="muted">
          Referinte legale: ${escapeHtml(
            entry.compliance.legalReferences.join(" · ") || "fara articol explicit"
          )}
        </p>
        <p class="muted">
          Controale necesare: ${escapeHtml(
            entry.compliance.requiredControls.join(" · ") || "in revizie"
          )}
        </p>
      </article>
      <article class="card inset">
        <h3>Source coverage</h3>
        <p class="muted">
          Surse: ${escapeHtml(entry.sources.map((source) => source.name).join(", ") || "nicio sursa")}
        </p>
        <p class="muted">
          Capabilitati: ${escapeHtml(
            entry.sourceSignals.capabilities.join(", ") || "nicio capabilitate explicita"
          )}
        </p>
        <p class="muted">
          Data categories: ${escapeHtml(
            entry.sourceSignals.dataCategories.join(", ") || "fara categorii explicite"
          )}
        </p>
      </article>
      <article class="card inset">
        <h3>Readiness and missing fields</h3>
        <p class="muted">Readiness: ${escapeHtml(entry.readiness)} · next step: ${escapeHtml(entry.suggestedNextStep)}</p>
        <p class="muted">Missing fields: ${escapeHtml(entry.prefill.missingFields.join(", ") || "niciun gap major")}</p>
      </article>
    </section>

    <section class="section">
      <h3>Control coverage by law reference</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Articol / control</th>
            <th>Total</th>
            <th>Validated</th>
            <th>Pending</th>
          </tr>
        </thead>
        <tbody>${lawCoverageRows}</tbody>
      </table>
    </section>

    <section class="section">
      <h3>Bundle controls</h3>
      <table class="table">
        <thead>
          <tr>
            <th>Control</th>
            <th>Referinta</th>
            <th>Mod</th>
            <th>Coverage</th>
            <th>Validare</th>
            <th>Fisiere</th>
          </tr>
        </thead>
        <tbody>${controlsRows}</tbody>
      </table>
    </section>
  </section>`
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value))
}

function emptyState(message: string) {
  return `<div class="empty">${escapeHtml(message)}</div>`
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

function readinessClass(
  value: AICompliancePack["entries"][number]["readiness"]
) {
  if (value === "audit_ready") return "success"
  if (value === "review_required") return "warning"
  return "neutral"
}

function confidenceModelClass(
  value: AICompliancePack["entries"][number]["confidenceModel"]["state"]
) {
  if (value === "confirmed_by_user") return "success"
  if (value === "inferred") return "warning"
  return "neutral"
}

function bundleStatusClass(
  value: AICompliancePack["entries"][number]["evidenceBundle"]["status"]
) {
  if (value === "bundle_ready") return "success"
  if (value === "partial") return "warning"
  return "danger"
}

function groupSystemSuggestedControls(
  controls: AICompliancePack["entries"][number]["compliance"]["suggestedControls"]
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
        "Acest pachet adună controalele care trebuie explicate împreună pentru un review ne-tehnic.",
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
