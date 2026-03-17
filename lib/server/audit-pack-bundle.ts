import { execFile } from "node:child_process"
import os from "node:os"
import path from "node:path"
import { promises as fs } from "node:fs"
import { promisify } from "node:util"

import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { buildClientAnnexLiteDocument } from "@/lib/server/annex-lite-client"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"
import { copyStoredEvidenceFile } from "@/lib/server/evidence-storage"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { readNis2State } from "@/lib/server/nis2-store"
import type { Nis2OrgState } from "@/lib/server/nis2-store"

const execFileAsync = promisify(execFile)

type AuditPackBundleArtifact = {
  fileName: string
  buffer: Buffer
}

export async function buildAuditPackBundle(auditPack: AuditPackV2): Promise<AuditPackBundleArtifact> {
  const dateLabel = auditPack.generatedAt.slice(0, 10)
  const slug = slugify(auditPack.workspace.name)
  const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), "compliscan-audit-pack-"))
  const bundleDir = path.join(rootDir, `audit-pack-${slug}-${dateLabel}`)
  const evidenceDir = path.join(bundleDir, "evidence")
  const reportsDir = path.join(bundleDir, "reports")
  const dataDir = path.join(bundleDir, "data")
  const clientDocument = buildClientAuditPackDocument(auditPack)
  const annexLiteDocument = buildClientAnnexLiteDocument(auditPack.appendix.compliancePack)
  const zipFileName = `audit-pack-dossier-${slug}-${dateLabel}.zip`
  const zipAbsolutePath = path.join(rootDir, zipFileName)

  // R-10: citim NIS2 state pentru a-l include în bundle
  const nis2State = await readNis2State(auditPack.workspace.id).catch(() => ({
    assessment: null,
    incidents: [],
    vendors: [],
  }))
  const nis2Dir = path.join(bundleDir, "nis2")

  try {
    await fs.mkdir(evidenceDir, { recursive: true })
    await fs.mkdir(reportsDir, { recursive: true })
    await fs.mkdir(dataDir, { recursive: true })
    await fs.mkdir(nis2Dir, { recursive: true })

    await fs.writeFile(
      path.join(bundleDir, "README.txt"),
      buildReadme(auditPack),
      "utf8"
    )
    await fs.writeFile(
      path.join(reportsDir, "executive-summary.txt"),
      buildExecutiveSummary(auditPack),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "audit-pack-v2-1.json"),
      JSON.stringify(auditPack, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "ai-compliance-pack.json"),
      JSON.stringify(auditPack.appendix.compliancePack, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "traceability-matrix.json"),
      JSON.stringify(auditPack.traceabilityMatrix, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "evidence-ledger.json"),
      JSON.stringify(auditPack.evidenceLedger, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(reportsDir, clientDocument.fileName),
      clientDocument.html,
      "utf8"
    )
    await fs.writeFile(
      path.join(reportsDir, annexLiteDocument.fileName),
      annexLiteDocument.html,
      "utf8"
    )

    // R-10: NIS2 data în subfolder dedicat
    await fs.writeFile(
      path.join(nis2Dir, "incidents.json"),
      JSON.stringify(nis2State.incidents, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(nis2Dir, "vendors.json"),
      JSON.stringify(nis2State.vendors, null, 2),
      "utf8"
    )
    await fs.writeFile(
      path.join(nis2Dir, "assessment.json"),
      JSON.stringify(nis2State.assessment ?? {}, null, 2),
      "utf8"
    )

    const includedEvidence = await copyEvidenceFiles(auditPack, evidenceDir)

    // MANIFEST.md — lizibil de orice inspector
    const manifestMd = buildManifestMarkdown(auditPack, nis2State, includedEvidence)
    await fs.writeFile(path.join(bundleDir, "MANIFEST.md"), manifestMd, "utf8")

    // MANIFEST.pdf — generat din Markdown
    try {
      const manifestPdf = await buildPDFFromMarkdown(manifestMd, {
        orgName: auditPack.workspace.label,
        documentType: "Dosar de Control — Manifest",
        generatedAt: auditPack.generatedAt,
      })
      await fs.writeFile(path.join(bundleDir, "MANIFEST.pdf"), manifestPdf)
    } catch {
      // PDF generation failure nu blochează bundle-ul
    }

    await fs.writeFile(
      path.join(dataDir, "bundle-manifest.json"),
      JSON.stringify(
        {
          generatedAt: auditPack.generatedAt,
          workspace: auditPack.workspace,
          bundleEvidenceSummary: auditPack.bundleEvidenceSummary,
          includedEvidence,
        },
        null,
        2
      ),
      "utf8"
    )

    await execFileAsync("/usr/bin/zip", ["-r", zipAbsolutePath, path.basename(bundleDir)], {
      cwd: rootDir,
    })

    const buffer = await fs.readFile(zipAbsolutePath)
    return {
      fileName: zipFileName,
      buffer,
    }
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
}

async function copyEvidenceFiles(auditPack: AuditPackV2, evidenceDir: string) {
  const includedEvidence: Array<{
    taskId: string
    fileName: string
    storedAs: string
    kind: string
  }> = []

  for (const entry of auditPack.evidenceLedger) {
    const evidence = entry.evidence
    if (!evidence) continue

    const safeName = `${sanitizeSegment(entry.taskId)}-${sanitizeSegment(evidence.fileName)}`
    const destination = path.join(evidenceDir, safeName)
    try {
      await copyStoredEvidenceFile(evidence, destination, {
        orgId: auditPack.workspace.id,
      })
    } catch {
      continue
    }

    includedEvidence.push({
      taskId: entry.taskId,
      fileName: evidence.fileName,
      storedAs: path.posix.join("evidence", safeName),
      kind: evidence.kind,
    })
  }

  return includedEvidence
}

function buildReadme(auditPack: AuditPackV2) {
  return [
    "CompliScan Audit Pack Dossier",
    "",
    `Workspace: ${auditPack.workspace.label}`,
    `Generated at: ${auditPack.generatedAt}`,
    `Audit readiness: ${auditPack.executiveSummary.auditReadiness}`,
    `Baseline status: ${auditPack.executiveSummary.baselineStatus}`,
    "",
    "Ordine recomandata de citire:",
    "1. reports/executive-summary.txt",
    "2. reports/audit-pack-client-*.html",
    "3. reports/annex-iv-lite-*.html",
    "4. data/audit-pack-v2-1.json daca este nevoie de detaliu tehnic",
    "",
    "Continut:",
    "- reports/executive-summary.txt",
    "- reports/audit-pack-client-*.html",
    "- reports/annex-iv-lite-*.html",
    "- data/audit-pack-v2-1.json",
    "- data/ai-compliance-pack.json",
    "- data/traceability-matrix.json",
    "- data/evidence-ledger.json",
    "- data/bundle-manifest.json",
    "- nis2/incidents.json",
    "- nis2/vendors.json",
    "- nis2/assessment.json",
    "- evidence/*",
    "",
    "Acest bundle leaga snapshot-ul curent, baseline-ul validat, controalele, dovezile, drift-ul si traceability matrix.",
  ].join("\n")
}

function buildExecutiveSummary(auditPack: AuditPackV2) {
  return [
    `Workspace: ${auditPack.workspace.label}`,
    `Generated at: ${auditPack.generatedAt}`,
    `Compliance score: ${auditPack.executiveSummary.complianceScore ?? "n/a"}`,
    `Risk label: ${auditPack.executiveSummary.riskLabel ?? "n/a"}`,
    `Audit readiness: ${auditPack.executiveSummary.auditReadiness}`,
    `Baseline status: ${auditPack.executiveSummary.baselineStatus}`,
    `Systems in scope: ${auditPack.executiveSummary.systemsInScope}`,
    `Sources in scope: ${auditPack.executiveSummary.sourcesInScope}`,
    `Open findings: ${auditPack.executiveSummary.openFindings}`,
    `Active drifts: ${auditPack.executiveSummary.activeDrifts}`,
    `Remediation open: ${auditPack.executiveSummary.remediationOpen}`,
    `Validated evidence items: ${auditPack.executiveSummary.validatedEvidenceItems}`,
    `Missing evidence items: ${auditPack.executiveSummary.missingEvidenceItems}`,
    `Evidence ledger (verified/weak/unrated): ${auditPack.executiveSummary.evidenceLedgerSummary.sufficient}/${auditPack.executiveSummary.evidenceLedgerSummary.weak}/${auditPack.executiveSummary.evidenceLedgerSummary.unrated}`,
    "",
    "Decision gates:",
    `- Poți trimite extern: ${
      auditPack.executiveSummary.auditReadiness === "audit_ready" &&
      !auditPack.driftRegister.some((drift) => drift.blocksAudit || Boolean(drift.escalationBreachedAtISO))
        ? "da"
        : "inca nu"
    }`,
    `- Poți îngheța baseline: ${
      auditPack.executiveSummary.baselineStatus === "validated" &&
      !auditPack.driftRegister.some((drift) => drift.blocksBaseline)
        ? "da"
        : "inca nu"
    }`,
    `- Poți susține controalele: ${
      auditPack.executiveSummary.missingEvidenceItems === 0 &&
      auditPack.bundleEvidenceSummary.pendingControls === 0
        ? "da"
        : "partial"
    }`,
    "",
    "Top blockers:",
    ...auditPack.executiveSummary.topBlockers.map((item) => `- ${item}`),
    "",
    "Next actions:",
    ...auditPack.executiveSummary.nextActions.map((item) => `- ${item}`),
  ].join("\n")
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function sanitizeSegment(value: string) {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")

  return sanitized || "artifact"
}

function buildManifestMarkdown(
  auditPack: AuditPackV2,
  nis2State: Pick<Nis2OrgState, "incidents" | "vendors" | "assessment">,
  includedEvidence: Array<{ taskId: string; fileName: string; storedAs: string; kind: string }>
): string {
  const orgName = auditPack.workspace.label
  const cui = auditPack.workspace.name ?? "—"
  const date = new Date(auditPack.generatedAt).toLocaleDateString("ro-RO", {
    day: "numeric", month: "long", year: "numeric",
  })
  const score = auditPack.executiveSummary.complianceScore ?? "—"
  const openFindings = auditPack.executiveSummary.openFindings
  const activeDrifts = auditPack.executiveSummary.activeDrifts

  const lines: string[] = [
    `# Dosar de Control — ${orgName}`,
    "",
    `**Organizație:** ${orgName}`,
    `**Identificator:** ${cui}`,
    `**Data generării:** ${date}`,
    `**Generat de:** CompliAI v1.0`,
    `**Scor conformitate:** ${score}%`,
    "",
    "---",
    "",
    "## Rezumat executiv",
    "",
    `- Probleme deschise: **${openFindings}**`,
    `- Modificări active: **${activeDrifts}**`,
    `- Dovezi validate: **${auditPack.executiveSummary.validatedEvidenceItems}**`,
    `- Dovezi lipsă: **${auditPack.executiveSummary.missingEvidenceItems}**`,
    `- Stare audit: **${auditPack.executiveSummary.auditReadiness}**`,
    "",
    "---",
    "",
    "## Conținut dosar",
    "",
    "### Rapoarte",
    "",
    "- Raport client HTML — `reports/audit-pack-client-*.html`",
    "- Anexă IV Lite — `reports/annex-iv-lite-*.html`",
    "- Sumar executiv — `reports/executive-summary.txt`",
    "",
  ]

  if (includedEvidence.length > 0) {
    lines.push(`### Dovezi (${includedEvidence.length} fișiere)`, "")
    for (const ev of includedEvidence) {
      lines.push(`- ${ev.fileName} — \`${ev.storedAs}\``)
    }
    lines.push("")
  }

  lines.push("### NIS2", "")
  lines.push(`- Evaluare maturitate — \`nis2/assessment.json\` (scor: ${nis2State.assessment?.score ?? "—"}%)`)
  lines.push(`- Incidente raportate: ${nis2State.incidents.length} — \`nis2/incidents.json\``)
  lines.push(`- Registru furnizori: ${nis2State.vendors.length} — \`nis2/vendors.json\``)
  lines.push("")
  lines.push("### Date tehnice", "")
  lines.push("- `data/audit-pack-v2-1.json` — snapshot complet")
  lines.push("- `data/traceability-matrix.json` — matrice de trasabilitate")
  lines.push("- `data/evidence-ledger.json` — registru dovezi")
  lines.push("- `data/bundle-manifest.json` — manifest tehnic JSON")
  lines.push("")
  lines.push("---", "")
  lines.push(
    "> **Disclaimer:** Acest dosar a fost generat automat de CompliAI. " +
    "Nu constituie opinie juridică și nu garantează conformitatea. " +
    "CompliAI nu este certificat de DNSC, ANSPDCP sau altă autoritate. " +
    "Dosarul servește ca instrument de organizare a dovezilor. " +
    "Consultați un specialist juridic pentru validare finală."
  )

  return lines.join("\n")
}
