import { execFile } from "node:child_process"
import os from "node:os"
import path from "node:path"
import { promises as fs } from "node:fs"
import { promisify } from "node:util"

import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { buildClientAnnexLiteDocument } from "@/lib/server/annex-lite-client"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"

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

  try {
    await fs.mkdir(evidenceDir, { recursive: true })
    await fs.mkdir(reportsDir, { recursive: true })
    await fs.mkdir(dataDir, { recursive: true })

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

    const includedEvidence = await copyEvidenceFiles(auditPack, evidenceDir)

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
    if (!evidence?.publicPath) continue

    const sourceFile = path.join(process.cwd(), "public", evidence.publicPath.replace(/^\//, ""))
    const exists = await fs
      .stat(sourceFile)
      .then(() => true)
      .catch(() => false)

    if (!exists) continue

    const safeName = `${sanitizeSegment(entry.taskId)}-${sanitizeSegment(evidence.fileName)}`
    const destination = path.join(evidenceDir, safeName)
    await fs.copyFile(sourceFile, destination)

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
