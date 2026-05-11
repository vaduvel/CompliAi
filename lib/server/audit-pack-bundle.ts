import os from "node:os"
import path from "node:path"
import { createHash } from "node:crypto"
import { promises as fs } from "node:fs"
import archiver from "archiver"

import type { AuditPackV2 } from "@/lib/compliance/audit-pack"
import { buildClientAnnexLiteDocument } from "@/lib/server/annex-lite-client"
import { buildClientAuditPackDocument } from "@/lib/server/audit-pack-client"
import { copyStoredEvidenceFile } from "@/lib/server/evidence-storage"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { readNis2State, readMaturityAssessment, readBoardMembers } from "@/lib/server/nis2-store"
import type { Nis2OrgState } from "@/lib/server/nis2-store"
import { computeVendorRisk } from "@/lib/compliance/vendor-risk"
import { sanitizeForMarkdown } from "@/lib/server/request-validation"
import { safeListReviews } from "@/lib/server/vendor-review-store"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

type AuditPackBundleArtifact = {
  fileName: string
  buffer: Buffer
}

type BundleFileHash = {
  path: string
  sha256: string
  sizeBytes: number
  modifiedAtISO: string
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
  const hasAnnexLiteContent = auditPack.appendix.compliancePack.entries.length > 0
  const annexLiteDocument = hasAnnexLiteContent
    ? buildClientAnnexLiteDocument(auditPack.appendix.compliancePack)
    : null
  const zipFileName = `audit-pack-dossier-${slug}-${dateLabel}.zip`

  // R-10: citim NIS2 state pentru a-l include în bundle
  const nis2State = await readNis2State(auditPack.workspace.id).catch(() => ({
    assessment: null,
    incidents: [],
    vendors: [],
  }))
  // Sprint 2.6: citim maturity assessment
  const maturityAssessment = await readMaturityAssessment(auditPack.workspace.id).catch(() => null)
  // Sprint 2.7: board members training
  const boardMembers = await readBoardMembers(auditPack.workspace.id).catch(() => [])
  // V5.6: vendor review workbench data
  const vendorReviews = await safeListReviews(auditPack.workspace.id).catch(() => [])
  const whiteLabel = await getWhiteLabelConfig(auditPack.workspace.id).catch(() => null)
  const preparedByName = whiteLabel?.partnerName?.trim() || null
  const nis2Dir = path.join(bundleDir, "nis2")
  const vendorRiskReport = nis2State.vendors.map((v) => ({
    id: v.id,
    name: v.name,
    service: v.service,
    ...computeVendorRisk(v),
    lastReviewDate: v.lastReviewDate ?? null,
    nextReviewDue: v.nextReviewDue ?? null,
  }))
  const hasNis2Content =
    Boolean(nis2State.assessment) ||
    nis2State.incidents.length > 0 ||
    nis2State.vendors.length > 0 ||
    Boolean(maturityAssessment) ||
    boardMembers.length > 0 ||
    vendorReviews.length > 0

  try {
    await fs.mkdir(evidenceDir, { recursive: true })
    await fs.mkdir(reportsDir, { recursive: true })
    await fs.mkdir(dataDir, { recursive: true })
    if (hasNis2Content) {
      await fs.mkdir(nis2Dir, { recursive: true })
    }

    await fs.writeFile(
      path.join(bundleDir, "README.txt"),
      replaceLegacyBrand(buildReadme(auditPack, { hasAnnexLiteContent, hasNis2Content, preparedByName })),
      "utf8"
    )
    await fs.writeFile(
      path.join(reportsDir, "executive-summary.txt"),
      replaceLegacyBrand(buildExecutiveSummary(auditPack, { preparedByName })),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "audit-pack-v2-1.json"),
      stringifyBundleJson(auditPack),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "ai-compliance-pack.json"),
      stringifyBundleJson(auditPack.appendix.compliancePack),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "traceability-matrix.json"),
      stringifyBundleJson(auditPack.traceabilityMatrix),
      "utf8"
    )
    await fs.writeFile(
      path.join(dataDir, "evidence-ledger.json"),
      stringifyBundleJson(auditPack.evidenceLedger),
      "utf8"
    )
    await fs.writeFile(
      path.join(reportsDir, clientDocument.fileName),
      replaceLegacyBrand(clientDocument.html),
      "utf8"
    )
    if (annexLiteDocument) {
        await fs.writeFile(
          path.join(reportsDir, annexLiteDocument.fileName),
          replaceLegacyBrand(annexLiteDocument.html),
          "utf8"
        )
    }

    if (hasNis2Content) {
      // R-10: NIS2 data în subfolder dedicat, doar când există conținut NIS2 real.
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
      // Sprint 2.6: maturity assessment
      await fs.writeFile(
        path.join(nis2Dir, "maturity-assessment.json"),
        JSON.stringify(maturityAssessment ?? {}, null, 2),
        "utf8"
      )
      // Sprint 2.7: board members governance
      await fs.writeFile(
        path.join(nis2Dir, "governance-training.json"),
        JSON.stringify(boardMembers, null, 2),
        "utf8"
      )
      // Sprint 5.3/5.4: vendor risk report
      await fs.writeFile(
        path.join(nis2Dir, "vendor-risk-report.json"),
        JSON.stringify(vendorRiskReport, null, 2),
        "utf8"
      )

      if (vendorReviews.length > 0) {
        await fs.writeFile(
          path.join(nis2Dir, "vendor-reviews.json"),
          JSON.stringify(vendorReviews, null, 2),
          "utf8"
        )
        // Summary for quick inspection
        const vrSummary = {
          total: vendorReviews.length,
          closed: vendorReviews.filter((r) => r.status === "closed").length,
          open: vendorReviews.filter((r) => r.status !== "closed").length,
          overdue: vendorReviews.filter((r) => r.status === "overdue-review").length,
          critical: vendorReviews.filter((r) => r.urgency === "critical" && r.status !== "closed").length,
          byCase: {
            A: vendorReviews.filter((r) => r.reviewCase === "A").length,
            B: vendorReviews.filter((r) => r.reviewCase === "B").length,
            C: vendorReviews.filter((r) => r.reviewCase === "C").length,
            D: vendorReviews.filter((r) => r.reviewCase === "D").length,
          },
          exportedAt: new Date().toISOString(),
        }
        await fs.writeFile(
          path.join(nis2Dir, "vendor-reviews-summary.json"),
          JSON.stringify(vrSummary, null, 2),
          "utf8"
        )
      }
    }

    const includedEvidence = await copyEvidenceFiles(auditPack, evidenceDir)

    // MANIFEST.md — lizibil de orice inspector, cu hash-uri pentru artefactele deja generate.
    const manifestFileHashes = await computeBundleFileHashes(bundleDir)
    const manifestMd = replaceLegacyBrand(buildManifestMarkdown(
      auditPack,
      nis2State,
      includedEvidence,
      maturityAssessment,
      manifestFileHashes,
      { hasAnnexLiteContent, hasNis2Content, preparedByName }
    ))
    await fs.writeFile(path.join(bundleDir, "MANIFEST.md"), manifestMd, "utf8")

    // MANIFEST.pdf — generat din Markdown
    try {
      const manifestPdf = await buildPDFFromMarkdown(manifestMd, {
        orgName: getAuditPackDisplayName(auditPack),
        documentType: "Dosar de Control — Manifest",
        generatedAt: auditPack.generatedAt,
        // Issue 7 DPO — watermark vizual "AUDIT READY" pe fiecare pagină
        // când dosarul atinge stadiul canonic (toate cele 8 preconditii incl. baseline).
        auditReadiness: auditPack.executiveSummary.auditReadiness,
        // S1.5 — Signer name pe ultima pagină (footer "Pregătit de: ...")
        signerName: whiteLabel?.signerName?.trim() || preparedByName,
      })
      await fs.writeFile(path.join(bundleDir, "MANIFEST.pdf"), manifestPdf)
    } catch {
      // PDF generation failure nu blochează bundle-ul
    }

    const finalFileHashes = await computeBundleFileHashes(bundleDir)

    await fs.writeFile(
      path.join(dataDir, "bundle-manifest.json"),
      stringifyBundleJson(
        {
          manifestVersion: "1.1",
          hashAlgorithm: "sha256",
          generatedAt: auditPack.generatedAt,
          issuer: auditPack.issuer,
          workspace: auditPack.workspace,
          preparedBy: preparedByName,
          bundleEvidenceSummary: auditPack.bundleEvidenceSummary,
          includedEvidence,
          files: finalFileHashes,
        }
      ),
      "utf8"
    )

    const buffer = await createZipBuffer(rootDir, path.basename(bundleDir))
    return {
      fileName: zipFileName,
      buffer,
    }
  } finally {
    await fs.rm(rootDir, { recursive: true, force: true })
  }
}

async function createZipBuffer(rootDir: string, folderName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const archive = archiver("zip", { zlib: { level: 6 } })
    const chunks: Buffer[] = []

    archive.on("data", (chunk: Buffer) => chunks.push(chunk))
    archive.on("end", () => resolve(Buffer.concat(chunks)))
    archive.on("error", reject)

    archive.directory(path.join(rootDir, folderName), folderName)
    archive.finalize()
  })
}

async function computeBundleFileHashes(bundleDir: string): Promise<BundleFileHash[]> {
  const entries: BundleFileHash[] = []

  async function walk(currentDir: string) {
    const dirEntries = await fs.readdir(currentDir, { withFileTypes: true })

    for (const entry of dirEntries) {
      const absolutePath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        await walk(absolutePath)
        continue
      }

      if (!entry.isFile()) continue

      const relativePath = path.relative(bundleDir, absolutePath).split(path.sep).join(path.posix.sep)
      if (relativePath === "data/bundle-manifest.json") continue

      const [buffer, stat] = await Promise.all([fs.readFile(absolutePath), fs.stat(absolutePath)])
      entries.push({
        path: relativePath,
        sha256: createHash("sha256").update(buffer).digest("hex"),
        sizeBytes: stat.size,
        modifiedAtISO: stat.mtime.toISOString(),
      })
    }
  }

  await walk(bundleDir)
  return entries.sort((a, b) => a.path.localeCompare(b.path))
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

    if (evidence.id.startsWith("evidence-document-approval-")) {
      await fs.writeFile(
        destination,
        JSON.stringify(
          {
            type: "client_approval",
            taskId: entry.taskId,
            title: entry.title,
            lawReference: entry.lawReference,
            status: entry.status,
            validationStatus: entry.validationStatus,
            validationMessage: entry.validationMessage,
            updatedAtISO: entry.updatedAtISO,
            sourceDocument: entry.sourceDocument,
            evidence,
          },
          null,
          2
        ).replaceAll("CompliAI", "CompliScan"),
        "utf8"
      )
      includedEvidence.push({
        taskId: entry.taskId,
        fileName: evidence.fileName,
        storedAs: path.posix.join("evidence", safeName),
        kind: evidence.kind,
      })
      continue
    }

    try {
      await copyStoredEvidenceFile(evidence, destination, {
        orgId: auditPack.workspace.id,
      })
    } catch {
      await writeLedgerEvidenceFallback({
        destination,
        auditPack,
        taskId: entry.taskId,
        title: entry.title,
        lawReference: entry.lawReference,
        sourceDocument: entry.sourceDocument,
        updatedAtISO: entry.updatedAtISO,
        evidence,
      })
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

async function writeLedgerEvidenceFallback({
  destination,
  auditPack,
  taskId,
  title,
  lawReference,
  sourceDocument,
  updatedAtISO,
  evidence,
}: {
  destination: string
  auditPack: AuditPackV2
  taskId: string
  title: string
  lawReference: string | null
  sourceDocument: string | null
  updatedAtISO: string
  evidence: NonNullable<AuditPackV2["evidenceLedger"][number]["evidence"]>
}) {
  await fs.mkdir(path.dirname(destination), { recursive: true })

  const markdown = [
    `# ${title}`,
    "",
    `**Workspace:** ${getAuditPackDisplayName(auditPack)}`,
    `**Task:** ${taskId}`,
    `**Referință legală:** ${lawReference ?? "n/a"}`,
    `**Document sursă:** ${sourceDocument ?? "n/a"}`,
    `**Fișier evidență:** ${evidence.fileName}`,
    `**Tip evidență:** ${evidence.kind}`,
    `**Validat la:** ${updatedAtISO}`,
    "",
    "## Rezumat dovadă",
    "",
    evidence.quality?.summary ?? "Dovadă operațională înregistrată în Evidence Ledger.",
    "",
    "## Notă",
    "",
    "Acest artefact a fost generat din Evidence Ledger pentru a păstra coerența dosarului exportat atunci când fișierul original nu este disponibil în storage-ul local de demo. Verificați fișierul sursă înainte de utilizare externă finală.",
  ].join("\n")

  if (evidence.mimeType === "application/pdf" || evidence.fileName.toLowerCase().endsWith(".pdf")) {
    const pdf = await buildPDFFromMarkdown(markdown, {
      orgName: getAuditPackDisplayName(auditPack),
      documentType: "Dovadă din Evidence Ledger",
      generatedAt: updatedAtISO,
      auditReadiness: auditPack.executiveSummary.auditReadiness,
    })
    await fs.writeFile(destination, pdf)
    return
  }

  if (evidence.mimeType === "application/json" || evidence.fileName.toLowerCase().endsWith(".json")) {
    await fs.writeFile(
      destination,
      JSON.stringify(
        {
          type: "ledger_evidence_fallback",
          taskId,
          title,
          lawReference,
          sourceDocument,
          updatedAtISO,
          evidence,
        },
        null,
        2
      ).replaceAll("CompliAI", "CompliScan"),
      "utf8"
    )
    return
  }

  await fs.writeFile(destination, replaceLegacyBrand(markdown), "utf8")
}

function replaceLegacyBrand(value: string) {
  return value.replaceAll("CompliAI", "CompliScan")
}

function stringifyBundleJson(value: unknown) {
  return replaceLegacyBrand(JSON.stringify(value, null, 2))
}

function buildReadme(
  auditPack: AuditPackV2,
  options: { hasAnnexLiteContent: boolean; hasNis2Content: boolean; preparedByName: string | null }
) {
  const workspaceName = getAuditPackDisplayName(auditPack)
  const recommendedOrder = [
    "1. reports/executive-summary.txt",
    "2. reports/audit-pack-client-*.html",
    options.hasAnnexLiteContent ? "3. reports/annex-iv-lite-*.html" : null,
    `${options.hasAnnexLiteContent ? "4" : "3"}. data/audit-pack-v2-1.json daca este nevoie de detaliu tehnic`,
  ].filter(Boolean)
  const contents = [
    "- reports/executive-summary.txt",
    "- reports/audit-pack-client-*.html",
    options.hasAnnexLiteContent ? "- reports/annex-iv-lite-*.html" : null,
    "- data/audit-pack-v2-1.json",
    "- data/ai-compliance-pack.json",
    "- data/traceability-matrix.json",
    "- data/evidence-ledger.json",
    "- data/bundle-manifest.json",
    options.hasNis2Content ? "- nis2/*" : null,
    "- evidence/*",
  ].filter(Boolean)

  return [
    "CompliScan Audit Pack Dossier",
    "",
    `Workspace: ${workspaceName}`,
    ...(options.preparedByName ? [`Prepared by: ${options.preparedByName}`] : []),
    `Generated at: ${auditPack.generatedAt}`,
    `Audit readiness: ${auditPack.executiveSummary.auditReadiness}`,
    `Baseline status: ${auditPack.executiveSummary.baselineStatus}`,
    "",
    "Ordine recomandata de citire:",
    ...recommendedOrder,
    "",
    "Continut:",
    ...contents,
    "",
    "Acest bundle leaga snapshot-ul curent, statusul baseline-ului, controalele, dovezile disponibile, drift-ul si traceability matrix.",
  ].join("\n")
}

function buildExecutiveSummary(
  auditPack: AuditPackV2,
  options: { preparedByName: string | null }
) {
  const workspaceName = getAuditPackDisplayName(auditPack)
  return [
    `Workspace: ${workspaceName}`,
    ...(options.preparedByName ? [`Prepared by: ${options.preparedByName}`] : []),
    `Generated at: ${auditPack.generatedAt}`,
    `Compliance score: ${auditPack.executiveSummary.complianceScore ?? "n/a"}`,
    `Risk label: ${auditPack.executiveSummary.riskLabel ?? "n/a"}`,
    `Audit readiness: ${auditPack.executiveSummary.auditReadiness}`,
    `Baseline status: ${auditPack.executiveSummary.baselineStatus}`,
    `Systems in scope: ${auditPack.executiveSummary.systemsInScope}`,
    `Sources in scope: ${auditPack.executiveSummary.sourcesInScope}`,
    `Findings de business deschise: ${auditPack.executiveSummary.openFindings}`,
    `Modificări active (drifts): ${auditPack.executiveSummary.activeDrifts}`,
    `Sarcini de remediere active: ${auditPack.executiveSummary.remediationOpen}`,
    `Dovezi validate: ${auditPack.executiveSummary.validatedEvidenceItems}`,
    `Dovezi pendinte de atașat: ${auditPack.executiveSummary.missingEvidenceItems}`,
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
  includedEvidence: Array<{ taskId: string; fileName: string; storedAs: string; kind: string }>,
  maturityAssessment: Pick<import("@/lib/server/nis2-store").MaturityAssessment, "overallScore" | "level" | "completedAt"> | null,
  fileHashes: BundleFileHash[] = [],
  options: { hasAnnexLiteContent: boolean; hasNis2Content: boolean; preparedByName?: string | null } = {
    hasAnnexLiteContent: true,
    hasNis2Content: true,
    preparedByName: null,
  }
): string {
  const orgName = sanitizeForMarkdown(getAuditPackDisplayName(auditPack))
  const cui = sanitizeForMarkdown(
    auditPack.workspace.label && auditPack.workspace.label !== auditPack.workspace.name
      ? auditPack.workspace.label
      : auditPack.workspace.id
  )
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
    ...(options.preparedByName ? [`**Pregătit de:** ${sanitizeForMarkdown(options.preparedByName)}`] : []),
    `**Identificator:** ${cui}`,
    `**Data generării:** ${date}`,
    `**Generat de:** CompliScan v1.0`,
    `**Scor conformitate:** ${score}%`,
    "",
    "---",
    "",
    "## Rezumat executiv",
    "",
    `- Findings de business deschise: **${openFindings}**`,
    `- Sarcini de remediere active: **${auditPack.executiveSummary.remediationOpen}**`,
    `- Dovezi pendinte de atașat: **${auditPack.executiveSummary.missingEvidenceItems}**`,
    `- Modificări active (drifts): **${activeDrifts}**`,
    `- Dovezi validate: **${auditPack.executiveSummary.validatedEvidenceItems}**`,
    `- Stare audit: **${auditPack.executiveSummary.auditReadiness}** _(Notă: \`review_required\` înseamnă "dosar de lucru, NU certificat" — sistemul nu raportează fals \`audit_ready\`.)_`,
    "",
    "---",
    "",
    "## Conținut dosar",
    "",
    "### Rapoarte",
    "",
    "- Raport client HTML — `reports/audit-pack-client-*.html`",
    ...(options.hasAnnexLiteContent ? ["- Anexă IV Lite — `reports/annex-iv-lite-*.html`"] : []),
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

  if (options.hasNis2Content) {
    lines.push("### NIS2", "")
    lines.push(`- Evaluare gap analysis — \`nis2/assessment.json\` (scor: ${nis2State.assessment?.score ?? "—"}%)`)
    lines.push(`- Incidente raportate: ${nis2State.incidents.length} — \`nis2/incidents.json\``)
    lines.push(`- Registru furnizori: ${nis2State.vendors.length} — \`nis2/vendors.json\``)
    if (maturityAssessment) {
      lines.push(`- Auto-evaluare maturitate DNSC — \`nis2/maturity-assessment.json\` (scor: ${maturityAssessment.overallScore}%, nivel: ${maturityAssessment.level})`)
    } else {
      lines.push("- Auto-evaluare maturitate DNSC — \`nis2/maturity-assessment.json\` (necompletată)")
    }
    lines.push(`- Training conducere — \`nis2/governance-training.json\``)
    const highRiskVendors = nis2State.vendors.filter((v) => computeVendorRisk(v).riskLevel === "high").length
    lines.push(`- Raport risc furnizori — \`nis2/vendor-risk-report.json\` (${nis2State.vendors.length} furnizori, ${highRiskVendors} risc ridicat)`)
    lines.push(`- Vendor reviews — \`nis2/vendor-reviews.json\` + \`nis2/vendor-reviews-summary.json\` (dacă există)`)
    lines.push("")
  }
  lines.push("### Date tehnice", "")
  lines.push("- `data/audit-pack-v2-1.json` — snapshot complet")
  lines.push("- `data/traceability-matrix.json` — matrice de trasabilitate")
  lines.push("- `data/evidence-ledger.json` — registru dovezi")
  lines.push("- `data/bundle-manifest.json` — manifest tehnic JSON")
  lines.push("")
  if (fileHashes.length > 0) {
    lines.push("## Integritate dosar (SHA-256)", "")
    lines.push("| Fișier | SHA-256 | Dimensiune |")
    lines.push("| --- | --- | ---: |")
    for (const file of fileHashes) {
      lines.push(`| \`${file.path}\` | \`${file.sha256}\` | ${file.sizeBytes} B |`)
    }
    lines.push("")
  }
  lines.push("---", "")
  lines.push(
    "> **Notă profesională:** Acest dosar este un instrument de lucru pentru organizarea dovezilor și revizia consultantului DPO. " +
    "Nu înlocuiește validarea profesională și nu reprezintă o opinie juridică finală."
  )

  return lines.join("\n")
}

function getAuditPackDisplayName(auditPack: AuditPackV2) {
  return auditPack.workspace.name || auditPack.workspace.label || "Workspace"
}
