import * as XLSX from "xlsx"

import { buildAnspdcpBreachFinding } from "@/lib/compliance/anspdcp-breach-rescue"
import { appendComplianceEvents, createComplianceEvent } from "@/lib/compliance/events"
import type {
  ComplianceEvent,
  DpoMigrationImportKind,
  DpoMigrationImportRecord,
  GdprTrainingAudience,
  GdprTrainingRecord,
  GeneratedDocumentKind,
  GeneratedDocumentRecord,
  ScanFinding,
} from "@/lib/compliance/types"
import type { TransferAnswer, VendorReview } from "@/lib/compliance/vendor-review-engine"
import type { DsarRequest, DsarRequestType, DsarStatus } from "@/lib/server/dsar-store"
import { readDsarState, seedDsarState } from "@/lib/server/dsar-store"
import { mutateFreshStateForOrg } from "@/lib/server/mvp-store"
import type {
  AnspdcpBreachNotification,
  Nis2Incident,
  Nis2IncidentSeverity,
  Nis2IncidentStatus,
} from "@/lib/server/nis2-store"
import { readNis2State, seedNis2State } from "@/lib/server/nis2-store"
import { createReview, safeListReviews } from "@/lib/server/vendor-review-store"

export type DpoMigrationActor = {
  userId: string
  email: string
  role?: ComplianceEvent["actorRole"]
}

export type DpoMigrationParsedRow = {
  rowIndex: number
  raw: Record<string, string>
  warnings: string[]
  errors: string[]
}

export type DpoMigrationParseResult = {
  kind: DpoMigrationImportKind
  fileName: string
  headers: string[]
  rowCount: number
  rows: DpoMigrationParsedRow[]
}

export type DpoMigrationApplyResult = {
  ok: true
  kind: DpoMigrationImportKind
  fileName: string
  rowCount: number
  importedCount: number
  skippedCount: number
  structuredCount: number
  archiveOnlyCount: number
  warnings: string[]
  errors: string[]
  importRecord: DpoMigrationImportRecord
}

const MAX_ROWS = 500

const KIND_LABELS: Record<DpoMigrationImportKind, string> = {
  "dsar-log": "Registru DSAR istoric",
  "ropa-register": "RoPA istoric",
  "vendor-dpa-register": "Vendor/DPA register istoric",
  "training-tracker": "Training GDPR istoric",
  "breach-log": "Breach log / ANSPDCP istoric",
  "approval-history": "Aprobări istorice din email/Word",
  "evidence-archive": "Arhivă dovezi nestructurate",
}

export const DPO_MIGRATION_IMPORT_KINDS: DpoMigrationImportKind[] = [
  "dsar-log",
  "ropa-register",
  "vendor-dpa-register",
  "training-tracker",
  "breach-log",
  "approval-history",
  "evidence-archive",
]

export function parseDpoMigrationFile(
  buffer: Buffer,
  fileName: string,
  kind: DpoMigrationImportKind
): DpoMigrationParseResult {
  if (!DPO_MIGRATION_IMPORT_KINDS.includes(kind)) {
    throw new Error("Tip import DPO invalid.")
  }
  if (!/\.(xlsx|xls|csv)$/i.test(fileName)) {
    throw new Error("Format nesuportat. Acceptăm .xlsx, .xls sau .csv.")
  }

  const workbook = /\.(xlsx|xls)$/i.test(fileName)
    ? XLSX.read(buffer, { type: "buffer" })
    : XLSX.read(buffer.toString("utf8").replace(/^\uFEFF/, ""), { type: "string", raw: true })
  const sheetName = workbook.SheetNames[0]
  if (!sheetName) throw new Error("Fișierul nu conține niciun sheet.")

  const sheet = workbook.Sheets[sheetName]!
  const matrix = XLSX.utils.sheet_to_json<string[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  })
  const headerIndex = matrix.findIndex((row) => row.filter((cell) => String(cell).trim()).length >= 2)
  if (headerIndex === -1) throw new Error("Nu am găsit un header valid în fișier.")

  const headers = matrix[headerIndex].map((cell) => String(cell).trim()).filter(Boolean)
  if (headers.length === 0) throw new Error("Headerul fișierului este gol.")

  const rows = matrix
    .slice(headerIndex + 1)
    .filter((row) => row.some((cell) => String(cell).trim()))
    .slice(0, MAX_ROWS)
    .map((row, index) => {
      const raw: Record<string, string> = {}
      headers.forEach((header, i) => {
        raw[header] = String(row[i] ?? "").trim()
      })
      return validateParsedRow(kind, {
        rowIndex: index + 1,
        raw,
        warnings: [],
        errors: [],
      })
    })

  if (rows.length === 0) throw new Error("Fișierul conține doar header, fără date.")

  return { kind, fileName, headers, rowCount: rows.length, rows }
}

export async function applyDpoMigrationImport(params: {
  orgId: string
  orgName: string
  actor: DpoMigrationActor
  kind: DpoMigrationImportKind
  fileName: string
  buffer: Buffer
}): Promise<DpoMigrationApplyResult> {
  const parsed = parseDpoMigrationFile(params.buffer, params.fileName, params.kind)
  const nowISO = new Date().toISOString()
  const warnings = parsed.rows.flatMap((row) =>
    row.warnings.map((warning) => `Rând ${row.rowIndex}: ${warning}`)
  )
  const errors = parsed.rows.flatMap((row) =>
    row.errors.map((error) => `Rând ${row.rowIndex}: ${error}`)
  )
  const validRows = parsed.rows.filter((row) => row.errors.length === 0)

  let importedCount = 0
  let skippedCount = parsed.rows.length - validRows.length
  let structuredCount = 0
  let archiveOnlyCount = 0
  const noteEvents: ComplianceEvent[] = []

  if (params.kind === "dsar-log") {
    const result = await importDsarRows(params.orgId, validRows, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else if (params.kind === "ropa-register") {
    const result = await importRopaRows(params.orgId, params.orgName, validRows, params.actor, params.fileName, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else if (params.kind === "vendor-dpa-register") {
    const result = await importVendorRows(params.orgId, validRows, params.actor, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else if (params.kind === "training-tracker") {
    const result = await importTrainingRows(params.orgId, params.orgName, validRows, params.actor, params.fileName, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else if (params.kind === "breach-log") {
    const result = await importBreachRows(params.orgId, params.orgName, validRows, params.actor, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else if (params.kind === "approval-history") {
    const result = await importApprovalRows(params.orgId, params.orgName, validRows, params.actor, params.fileName, nowISO)
    importedCount += result.imported
    skippedCount += result.skipped
    structuredCount += result.imported
  } else {
    archiveOnlyCount = validRows.length
    importedCount = validRows.length
    noteEvents.push(
      createDpoMigrationEvent({
        kind: params.kind,
        fileName: params.fileName,
        entityId: `dpo-archive-${Date.now()}`,
        message: `Arhivă istorică importată ca referință: ${params.fileName}.`,
        nowISO,
        actor: params.actor,
      })
    )
  }

  const importRecord: DpoMigrationImportRecord = {
    id: `dpo-migration-${params.kind}-${Date.now().toString(36)}`,
    kind: params.kind,
    fileName: params.fileName,
    importedAtISO: nowISO,
    importedByEmail: params.actor.email,
    rowCount: parsed.rowCount,
    importedCount,
    skippedCount,
    structuredCount,
    archiveOnlyCount,
    notes: [
      `${KIND_LABELS[params.kind]} importat de ${params.actor.email}.`,
      archiveOnlyCount > 0
        ? "Aceste rânduri au fost păstrate ca arhivă/import istoric, nu ca evenimente magic-link native."
        : "Rândurile valide au fost mapate în registrele operaționale CompliScan.",
    ],
  }

  await mutateFreshStateForOrg(
    params.orgId,
    (state) => ({
      ...state,
      dpoMigrationImports: [importRecord, ...(state.dpoMigrationImports ?? [])].slice(0, 50),
      events: appendComplianceEvents(state, [
        createDpoMigrationEvent({
          kind: params.kind,
          fileName: params.fileName,
          entityId: importRecord.id,
          message: `${KIND_LABELS[params.kind]}: ${importedCount} rânduri importate, ${skippedCount} ignorate.`,
          nowISO,
          actor: params.actor,
        }),
        ...noteEvents,
      ]),
    }),
    params.orgName
  )

  return {
    ok: true,
    kind: params.kind,
    fileName: params.fileName,
    rowCount: parsed.rowCount,
    importedCount,
    skippedCount,
    structuredCount,
    archiveOnlyCount,
    warnings,
    errors,
    importRecord,
  }
}

function validateParsedRow(kind: DpoMigrationImportKind, row: DpoMigrationParsedRow) {
  const requireAny = (aliases: string[], label: string) => {
    if (!findValue(row.raw, aliases)) row.errors.push(`${label} lipsește.`)
  }

  if (kind === "dsar-log") {
    requireAny(["solicitant", "nume solicitant", "persoana vizata", "requester", "name"], "Solicitantul")
    requireAny(["email", "e-mail", "mail"], "Emailul")
  }
  if (kind === "ropa-register") {
    requireAny(["activitate", "activity", "procesare", "prelucrare"], "Activitatea RoPA")
    requireAny(["scop", "purpose"], "Scopul")
  }
  if (kind === "vendor-dpa-register") {
    requireAny(["furnizor", "vendor", "procesator", "supplier"], "Furnizorul")
  }
  if (kind === "training-tracker") {
    requireAny(["training", "titlu", "sesiune", "title"], "Titlul trainingului")
  }
  if (kind === "breach-log") {
    requireAny(["incident", "titlu", "breach", "eveniment"], "Incidentul")
  }
  if (kind === "approval-history") {
    requireAny(["document", "titlu document", "dpa", "livrabil"], "Documentul")
    if (!findValue(row.raw, ["aprobat de", "approved by", "client", "patron", "reprezentant"])) {
      row.warnings.push("Aprobatorul lipsește; se va marca drept aprobare istorică fără persoană nominală.")
    }
  }

  return row
}

async function importDsarRows(orgId: string, rows: DpoMigrationParsedRow[], nowISO: string) {
  const state = await readDsarState(orgId)
  const existingKeys = new Set(state.requests.map(dsarIdentityKey))
  const imported: DsarRequest[] = []
  let skipped = 0

  for (const row of rows) {
    const requestType = normalizeDsarType(findValue(row.raw, ["tip", "tip cerere", "drept", "request type"]) ?? "access")
    const receivedAtISO = normalizeDate(findValue(row.raw, ["primit la", "data primire", "received", "received at"])) ?? nowISO
    const request: DsarRequest = {
      id: `dsar-import-${Math.random().toString(36).slice(2, 10)}`,
      orgId,
      receivedAtISO,
      deadlineISO: addDays(receivedAtISO, 30),
      requesterName: findValue(row.raw, ["solicitant", "nume solicitant", "persoana vizata", "requester", "name"]) ?? "Solicitant importat",
      requesterEmail: findValue(row.raw, ["email", "e-mail", "mail"]) ?? "unknown@example.local",
      requestType,
      status: normalizeDsarStatus(findValue(row.raw, ["status", "stare"])),
      identityVerified: truthy(findValue(row.raw, ["identitate verificata", "identity verified"])),
      draftResponseGenerated: truthy(findValue(row.raw, ["draft generat", "draft", "raspuns draft"])),
      responseReviewedByHuman: truthy(findValue(row.raw, ["revizuit", "reviewed", "validat"])),
      responseSentAtISO: normalizeDate(findValue(row.raw, ["raspuns trimis", "sent at", "data raspuns"])),
      evidenceVaultIds: splitList(findValue(row.raw, ["dovada", "evidence", "proof"])),
      notes: findValue(row.raw, ["note", "observatii", "comentarii"]),
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    }
    const key = dsarIdentityKey(request)
    if (existingKeys.has(key)) {
      skipped++
      continue
    }
    existingKeys.add(key)
    imported.push(request)
  }

  if (imported.length > 0) {
    await seedDsarState(orgId, {
      ...state,
      requests: [...imported, ...state.requests],
      updatedAtISO: nowISO,
    })
  }
  return { imported: imported.length, skipped }
}

async function importRopaRows(
  orgId: string,
  orgName: string,
  rows: DpoMigrationParsedRow[],
  actor: DpoMigrationActor,
  fileName: string,
  nowISO: string
) {
  const content = renderRopaImportMarkdown(orgName, rows, fileName, nowISO)
  const documentId = `imported-ropa-${Date.now().toString(36)}`
  const document: GeneratedDocumentRecord = {
    id: documentId,
    documentType: "ropa",
    title: `RoPA istoric importat — ${orgName}`,
    content,
    generatedAtISO: nowISO,
    llmUsed: false,
    approvalStatus: "draft",
    validationStatus: "pending",
    evidenceNote:
      "Import istoric din registrul cabinetului. Necesită revizie DPO înainte să fie marcat ca dovadă validată.",
  }
  await mutateFreshStateForOrg(
    orgId,
    (state) => ({
      ...state,
      generatedDocuments: [document, ...(state.generatedDocuments ?? [])].slice(0, 100),
      events: appendComplianceEvents(state, [
        createDpoMigrationEvent({
          kind: "ropa-register",
          fileName,
          entityId: documentId,
          message: `RoPA istoric importat cu ${rows.length} activități.`,
          nowISO,
          actor,
        }),
      ]),
    }),
    orgName
  )
  return { imported: rows.length, skipped: 0 }
}

async function importVendorRows(
  orgId: string,
  rows: DpoMigrationParsedRow[],
  actor: DpoMigrationActor,
  nowISO: string
) {
  const existing = await safeListReviews(orgId)
  const existingKeys = new Set(existing.map((review) => review.vendorName.toLowerCase().trim()))
  let imported = 0
  let skipped = 0

  for (const row of rows) {
    const vendorName = findValue(row.raw, ["furnizor", "vendor", "procesator", "supplier"]) ?? ""
    const key = vendorName.toLowerCase().trim()
    if (!key || existingKeys.has(key)) {
      skipped++
      continue
    }
    existingKeys.add(key)
    const hasDpa = truthy(findValue(row.raw, ["dpa", "are dpa", "dpa semnat", "contract art 28"]))
    const sendsPersonalData = truthy(findValue(row.raw, ["date personale", "personal data", "proceseaza date"]))
    const review: VendorReview = {
      id: `vendor-review-import-${Math.random().toString(36).slice(2, 10)}`,
      vendorId: `vendor-import-${slug(vendorName)}`,
      vendorName,
      status: hasDpa ? "closed" : "awaiting-evidence",
      urgency: hasDpa ? "info" : sendsPersonalData ? "high" : "medium",
      category: guessVendorCategory(vendorName, findValue(row.raw, ["serviciu", "service", "categorie"])),
      confidence: "medium",
      detectionSource: "vendor-registry",
      context: {
        sendsPersonalData: sendsPersonalData ? "yes" : "unknown",
        sendsConfidentialData: "unknown",
        vendorProcessesData: sendsPersonalData ? "processor" : "unknown",
        hasDpaOrTerms: hasDpa ? "yes" : "unknown",
        hasTransferMechanism: normalizeTransfer(findValue(row.raw, ["transfer", "scc", "dpf", "tara terta"])),
        isActivelyUsed: truthy(findValue(row.raw, ["activ", "active", "folosit"])) ? "active" : "historic",
      },
      closedAtISO: hasDpa ? normalizeDate(findValue(row.raw, ["data dpa", "semnat la", "signed at"])) ?? nowISO : undefined,
      closureEvidence: findValue(row.raw, ["dovada", "evidence", "link", "fisier"]),
      closureApprovedBy: hasDpa ? actor.email : undefined,
      nextReviewDueISO: normalizeDate(findValue(row.raw, ["review", "next review", "expira", "expiry"])),
      auditTrail: [
        {
          action: "created",
          by: actor.email,
          atISO: nowISO,
          note: "Importat din vendor/DPA register istoric al cabinetului.",
        },
      ],
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
      ownerId: actor.userId,
    }
    await createReview(orgId, review)
    imported++
  }
  return { imported, skipped }
}

async function importTrainingRows(
  orgId: string,
  orgName: string,
  rows: DpoMigrationParsedRow[],
  actor: DpoMigrationActor,
  fileName: string,
  nowISO: string
) {
  const records: GdprTrainingRecord[] = rows.map((row) => {
    const completedAtISO = normalizeDate(findValue(row.raw, ["finalizat la", "completed", "data", "training date"]))
    const evidenceNote = findValue(row.raw, ["dovada", "evidence", "proof"])
    const explicitStatus = findValue(row.raw, ["status", "stare"])
    const completed = Boolean(completedAtISO || evidenceNote || truthy(explicitStatus))
    return {
      id: `gdpr-training-import-${Math.random().toString(36).slice(2, 10)}`,
      title: findValue(row.raw, ["training", "titlu", "sesiune", "title"]) ?? "Training GDPR importat",
      audience: normalizeTrainingAudience(findValue(row.raw, ["audienta", "audience", "public"])),
      participantCount: normalizeNumber(findValue(row.raw, ["participanti", "participants", "numar participanti"])),
      status: completed ? "completed" : "evidence_required",
      dueAtISO: normalizeDate(findValue(row.raw, ["termen", "due", "deadline"])),
      completedAtISO: completedAtISO ?? (completed ? nowISO : undefined),
      evidenceNote,
      createdAtISO: nowISO,
      updatedAtISO: nowISO,
    }
  })

  await mutateFreshStateForOrg(
    orgId,
    (state) => ({
      ...state,
      gdprTrainingRecords: [...records, ...(state.gdprTrainingRecords ?? [])].slice(0, 200),
      events: appendComplianceEvents(state, [
        createDpoMigrationEvent({
          kind: "training-tracker",
          fileName,
          entityId: `training-import-${Date.now()}`,
          message: `${records.length} înregistrări de training GDPR importate.`,
          nowISO,
          actor,
        }),
      ]),
    }),
    orgName
  )
  return { imported: records.length, skipped: 0 }
}

async function importBreachRows(
  orgId: string,
  orgName: string,
  rows: DpoMigrationParsedRow[],
  actor: DpoMigrationActor,
  nowISO: string
) {
  const state = await readNis2State(orgId)
  const existingKeys = new Set(state.incidents.map((incident) => `${incident.title.toLowerCase()}|${incident.detectedAtISO.slice(0, 10)}`))
  const incidents: Nis2Incident[] = []
  const anspdcpFindings: ScanFinding[] = []
  let skipped = 0

  for (const row of rows) {
    const title = findValue(row.raw, ["incident", "titlu", "breach", "eveniment"]) ?? ""
    const detectedAtISO = normalizeDate(findValue(row.raw, ["detectat la", "data", "detected", "discovered"])) ?? nowISO
    const key = `${title.toLowerCase()}|${detectedAtISO.slice(0, 10)}`
    if (!title || existingKeys.has(key)) {
      skipped++
      continue
    }
    existingKeys.add(key)
    const personalData = positiveMarker(findValue(row.raw, ["date personale", "personal data", "cnp", "pacienti", "angajati"]))
    const incident = buildImportedIncident(row, title, detectedAtISO, personalData, nowISO)
    incidents.push(incident)
    if (personalData) {
      const finding = buildAnspdcpBreachFinding(
        incident.id,
        incident.title,
        incident.detectedAtISO,
        incident.anspdcpNotification?.status,
        nowISO
      )
      if (finding) anspdcpFindings.push(finding)
    }
  }

  if (incidents.length > 0) {
    await seedNis2State(orgId, {
      ...state,
      incidents: [...incidents, ...state.incidents],
      updatedAtISO: nowISO,
    })
    await mutateFreshStateForOrg(
      orgId,
      (current) => ({
        ...current,
        findings: [
          ...current.findings.filter((finding) => !anspdcpFindings.some((next) => next.id === finding.id)),
          ...anspdcpFindings,
        ],
        events: appendComplianceEvents(current, [
          createDpoMigrationEvent({
            kind: "breach-log",
            fileName: "breach-log-import",
            entityId: `breach-import-${Date.now()}`,
            message: `${incidents.length} incidente istorice importate; ${anspdcpFindings.length} cu notificare ANSPDCP urmărită.`,
            nowISO,
            actor,
          }),
        ]),
      }),
      orgName
    )
  }
  return { imported: incidents.length, skipped }
}

async function importApprovalRows(
  orgId: string,
  orgName: string,
  rows: DpoMigrationParsedRow[],
  actor: DpoMigrationActor,
  fileName: string,
  nowISO: string
) {
  const documents: GeneratedDocumentRecord[] = rows.map((row) => {
    const title = findValue(row.raw, ["document", "titlu document", "dpa", "livrabil"]) ?? "Aprobare istorică importată"
    const approvedAtISO = normalizeDate(findValue(row.raw, ["aprobat la", "approved at", "data aprobare"])) ?? nowISO
    return {
      id: `historical-approval-${Math.random().toString(36).slice(2, 10)}`,
      documentType: normalizeDocumentType(findValue(row.raw, ["tip", "document type", "categorie"])),
      title: `${title} — aprobare istorică`,
      content: [
        `# Aprobare istorică importată`,
        "",
        `**Document:** ${title}`,
        `**Aprobat de:** ${findValue(row.raw, ["aprobat de", "approved by", "client", "patron", "reprezentant"]) ?? "Nespecificat"}`,
        `**Data:** ${approvedAtISO}`,
        `**Sursă:** ${findValue(row.raw, ["sursa", "source", "email", "dovada"]) ?? fileName}`,
        "",
        "Aceasta este o dovadă istorică importată. Nu este echivalentă cu o aprobare nativă prin magic link CompliScan.",
      ].join("\n"),
      generatedAtISO: approvedAtISO,
      llmUsed: false,
      approvalStatus: "approved_as_evidence" as const,
      approvedAtISO,
      approvedByEmail: findValue(row.raw, ["email", "aprobat email", "approved email"]) ?? actor.email,
      validationStatus: "passed" as const,
      validatedAtISO: nowISO,
      adoptionStatus: "active" as const,
      adoptionEvidenceNote:
        "Aprobare istorică importată din email/Word/Drive; păstrată ca dovadă, nu ca magic-link nativ.",
    }
  })

  await mutateFreshStateForOrg(
    orgId,
    (state) => ({
      ...state,
      generatedDocuments: [...documents, ...(state.generatedDocuments ?? [])].slice(0, 100),
      events: appendComplianceEvents(state, [
        ...documents.map((document) =>
          createDpoMigrationEvent({
            kind: "approval-history",
            fileName,
            entityId: document.id,
            message: `Aprobare istorică importată: ${document.title}.`,
            nowISO,
            actor,
          })
        ),
      ]),
    }),
    orgName
  )
  return { imported: documents.length, skipped: 0 }
}

function renderRopaImportMarkdown(orgName: string, rows: DpoMigrationParsedRow[], fileName: string, nowISO: string) {
  const tableRows = rows.map((row) => {
    const c = (aliases: string[]) => escapeTable(findValue(row.raw, aliases) ?? "—")
    return `| ${c(["activitate", "activity", "procesare", "prelucrare"])} | ${c(["scop", "purpose"])} | ${c(["temei", "baza legala", "legal basis"])} | ${c(["categorii date", "data categories"])} | ${c(["persoane vizate", "data subjects"])} | ${c(["destinatari", "recipients"])} | ${c(["retentie", "retention"])} | ${c(["masuri", "securitate", "security"])} |`
  })
  return [
    "# RoPA istoric importat",
    "",
    `**Client:** ${orgName}`,
    `**Sursă:** ${fileName}`,
    `**Importat la:** ${nowISO}`,
    "**Status:** draft pentru revizie DPO. Nu este marcat automat ca audit-ready.",
    "",
    "| Activitate | Scop | Temei | Categorii date | Persoane vizate | Destinatari | Retenție | Măsuri |",
    "|---|---|---|---|---|---|---|---|",
    ...tableRows,
  ].join("\n")
}

function buildImportedIncident(
  row: DpoMigrationParsedRow,
  title: string,
  detectedAtISO: string,
  personalData: boolean,
  nowISO: string
): Nis2Incident {
  const severity = normalizeIncidentSeverity(findValue(row.raw, ["severitate", "severity"]))
  const status = normalizeIncidentStatus(findValue(row.raw, ["status", "stare"]))
  const deadline24hISO = addHours(detectedAtISO, 24)
  const deadline72hISO = addHours(detectedAtISO, 72)
  const notification: AnspdcpBreachNotification | undefined = personalData
    ? {
        required: true,
        deadlineISO: deadline72hISO,
        status: status === "closed" || truthy(findValue(row.raw, ["notificat anspdcp", "anspdcp", "notification sent"]))
          ? "submitted"
          : "pending",
        dataCategories: splitList(findValue(row.raw, ["categorii date", "data categories", "date afectate"])),
        estimatedDataSubjects: normalizeNumber(findValue(row.raw, ["persoane vizate", "data subjects", "numar persoane"])),
        dpoContact: findValue(row.raw, ["dpo", "contact dpo"]),
        consequencesDescription: findValue(row.raw, ["consecinte", "consequences"]),
        measuresTaken: findValue(row.raw, ["masuri", "measures"]),
        submittedAtISO: normalizeDate(findValue(row.raw, ["trimis anspdcp", "submitted anspdcp"])),
        anspdcpReference: findValue(row.raw, ["numar anspdcp", "referinta anspdcp"]),
        notifyDataSubjects: truthy(findValue(row.raw, ["notificare persoane", "notify data subjects"])),
      }
    : undefined

  return {
    id: `nis2-import-${Math.random().toString(36).slice(2, 10)}`,
    title,
    description: findValue(row.raw, ["descriere", "description", "note"]) ?? "Incident istoric importat din registrul cabinetului DPO.",
    severity,
    status,
    detectedAtISO,
    deadline24hISO,
    deadline72hISO,
    deadlineFinalISO: addDays(deadline72hISO, 30),
    resolvedAtISO: status === "closed" ? normalizeDate(findValue(row.raw, ["inchis la", "closed at"])) ?? nowISO : undefined,
    affectedSystems: splitList(findValue(row.raw, ["sisteme", "affected systems", "systems"])),
    attackType: personalData ? "data-breach" : "unknown",
    measuresTaken: findValue(row.raw, ["masuri", "measures"]),
    involvesPersonalData: personalData,
    anspdcpNotification: notification,
    createdAtISO: nowISO,
    updatedAtISO: nowISO,
  }
}

function createDpoMigrationEvent(params: {
  kind: DpoMigrationImportKind
  fileName: string
  entityId: string
  message: string
  nowISO: string
  actor: DpoMigrationActor
}) {
  return createComplianceEvent(
    {
      type: "dpo.migration_imported",
      entityType: "integration",
      entityId: params.entityId,
      message: params.message,
      createdAtISO: params.nowISO,
      metadata: {
        kind: params.kind,
        fileName: params.fileName,
      },
    },
    {
      id: params.actor.userId,
      label: params.actor.email,
      role: params.actor.role,
      source: "session",
    }
  )
}

function findValue(raw: Record<string, string>, aliases: string[]): string | undefined {
  const normalizedAliases = aliases.map(normalizeKey)
  for (const [key, value] of Object.entries(raw)) {
    if (!value.trim()) continue
    const normalizedKey = normalizeKey(key)
    if (
      normalizedAliases.some(
        (alias) =>
          normalizedKey === alias ||
          normalizedKey.includes(alias) ||
          (!isUnsafeReverseHeaderMatch(normalizedKey) && alias.includes(normalizedKey))
      )
    ) {
      return value.trim()
    }
  }
  return undefined
}

function isUnsafeReverseHeaderMatch(normalizedKey: string) {
  const tokenCount = normalizedKey.split(/\s+/).filter(Boolean).length
  if (tokenCount > 1) return false

  return [
    "data",
    "date",
    "nr",
    "numar",
    "no",
    "id",
    "tip",
  ].includes(normalizedKey)
}

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[șş]/gi, "s")
    .replace(/[țţ]/gi, "t")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function normalizeDate(value: string | null | undefined) {
  if (!value) return undefined
  const trimmed = value.trim()
  const romanian = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/)
  if (romanian) {
    const [, day, month, year] = romanian
    return new Date(`${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T12:00:00.000Z`).toISOString()
  }
  const parsed = Date.parse(trimmed)
  return Number.isNaN(parsed) ? undefined : new Date(parsed).toISOString()
}

function addDays(iso: string, days: number) {
  return new Date(new Date(iso).getTime() + days * 24 * 60 * 60 * 1000).toISOString()
}

function addHours(iso: string, hours: number) {
  return new Date(new Date(iso).getTime() + hours * 60 * 60 * 1000).toISOString()
}

function truthy(value: string | null | undefined) {
  if (!value) return false
  return ["da", "yes", "true", "1", "x", "ok", "semnat", "completat", "trimis"].includes(
    normalizeKey(value)
  )
}

function positiveMarker(value: string | null | undefined) {
  if (!value) return false
  const key = normalizeKey(value)
  return !["nu", "no", "false", "0", "n a", "na", "none"].includes(key)
}

function splitList(value: string | null | undefined) {
  if (!value) return []
  return value
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeNumber(value: string | null | undefined) {
  if (!value) return 0
  const n = Number.parseInt(value.replace(/[^0-9]/g, ""), 10)
  return Number.isFinite(n) ? Math.max(0, n) : 0
}

function normalizeDsarType(value: string): DsarRequestType {
  const key = normalizeKey(value)
  if (key.includes("sterg") || key.includes("erasure") || key.includes("17")) return "erasure"
  if (key.includes("rect") || key.includes("16")) return "rectification"
  if (key.includes("port") || key.includes("20")) return "portability"
  if (key.includes("opoz") || key.includes("objection") || key.includes("21")) return "objection"
  if (key.includes("restrict") || key.includes("18")) return "restriction"
  return "access"
}

function normalizeDsarStatus(value: string | null | undefined): DsarStatus {
  const key = normalizeKey(value ?? "")
  if (key.includes("rasp") || key.includes("responded") || key.includes("trimis")) return "responded"
  if (key.includes("refuz") || key.includes("refused")) return "refused"
  if (key.includes("verific")) return "awaiting_verification"
  if (key.includes("lucr") || key.includes("progress")) return "in_progress"
  return "received"
}

function dsarIdentityKey(request: Pick<DsarRequest, "requesterEmail" | "requestType" | "receivedAtISO">) {
  return `${request.requesterEmail.toLowerCase().trim()}|${request.requestType}|${request.receivedAtISO.slice(0, 10)}`
}

function normalizeTransfer(value: string | null | undefined): TransferAnswer {
  const key = normalizeKey(value ?? "")
  if (key.includes("dpf")) return "dpf"
  if (key.includes("scc")) return "scc"
  if (key) return "other"
  return "unknown"
}

function guessVendorCategory(name: string, service: string | null | undefined): VendorReview["category"] {
  const key = normalizeKey(`${name} ${service ?? ""}`)
  if (key.includes("openai") || key.includes("mistral") || key.includes("gemini") || key.includes("ai")) return "ai"
  if (key.includes("aws") || key.includes("google") || key.includes("microsoft") || key.includes("cloud")) return "cloud"
  if (key.includes("stripe") || key.includes("pay") || key.includes("saas") || key.includes("crm")) return "tech"
  return "possible-processor"
}

function normalizeTrainingAudience(value: string | null | undefined): GdprTrainingAudience {
  const key = normalizeKey(value ?? "")
  if (key.includes("management") || key.includes("conduc")) return "management"
  if (key.includes("nou") || key.includes("new")) return "new_hires"
  if (key.includes("rol") || key.includes("specific")) return "specific_roles"
  return "all_staff"
}

function normalizeIncidentSeverity(value: string | null | undefined): Nis2IncidentSeverity {
  const key = normalizeKey(value ?? "")
  if (key.includes("critic") || key.includes("critical")) return "critical"
  if (key.includes("high") || key.includes("ridicat")) return "high"
  if (key.includes("low") || key.includes("scazut")) return "low"
  return "medium"
}

function normalizeIncidentStatus(value: string | null | undefined): Nis2IncidentStatus {
  const key = normalizeKey(value ?? "")
  if (key.includes("inchis") || key.includes("closed") || key.includes("rezolvat")) return "closed"
  if (key.includes("72")) return "reported-72h"
  if (key.includes("24")) return "reported-24h"
  return "open"
}

function normalizeDocumentType(value: string | null | undefined): GeneratedDocumentKind {
  const key = normalizeKey(value ?? "")
  if (key.includes("dpa") || key.includes("procesator")) return "dpa"
  if (key.includes("dsar")) return "dsar-response"
  if (key.includes("ropa") || key.includes("art 30")) return "ropa"
  if (key.includes("cookie")) return "cookie-policy"
  if (key.includes("privacy") || key.includes("confidential")) return "privacy-policy"
  return "contract-template"
}

function escapeTable(value: string) {
  return value.replace(/\|/g, "\\|").replace(/\n/g, " ")
}

function slug(value: string) {
  return normalizeKey(value).replace(/\s+/g, "-").slice(0, 80) || "vendor"
}
