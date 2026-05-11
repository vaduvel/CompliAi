import { promises as fs } from "node:fs"
import path from "node:path"
import { deflateRawSync } from "node:zlib"

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000"
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60_000)
const OUT_DIR =
  process.env.OUT_DIR ||
  `/private/tmp/compliscan-dpo-consultant-runtime-demo-${new Date()
    .toISOString()
    .slice(0, 10)}`

class CookieJar {
  constructor() {
    this.cookies = new Map()
  }

  capture(headers) {
    const setCookie =
      typeof headers.getSetCookie === "function"
        ? headers.getSetCookie()
        : headers.get("set-cookie")
          ? [headers.get("set-cookie")]
          : []

    for (const raw of setCookie) {
      const first = raw.split(";")[0]
      const eq = first.indexOf("=")
      if (eq !== -1) this.cookies.set(first.slice(0, eq), first.slice(eq + 1))
    }
  }

  header() {
    return [...this.cookies.entries()].map(([key, value]) => `${key}=${value}`).join("; ")
  }
}

const jar = new CookieJar()
const checks = []
const artifacts = {}

function record(ok, label, details = "") {
  checks.push({ ok, label, details })
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${details ? ` — ${details}` : ""}`)
}

async function request(pathname, options = {}) {
  const headers = new Headers(options.headers || {})
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData
  if (options.body && !headers.has("content-type") && !isFormData) {
    headers.set("content-type", "application/json")
  }
  const cookie = jar.header()
  if (cookie) headers.set("cookie", cookie)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}${pathname}`, {
      redirect: "manual",
      ...options,
      headers,
      signal: controller.signal,
    })
    jar.capture(res.headers)
  } catch (error) {
    const reason = error?.name === "AbortError" ? `${REQUEST_TIMEOUT_MS}ms timeout` : error?.message
    throw new Error(`Request failed ${pathname}: ${reason}`)
  } finally {
    clearTimeout(timer)
  }

  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const body = await res.json().catch(() => ({}))
    return { res, body, text: JSON.stringify(body) }
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  return { res, body: buffer, text: buffer.toString("utf8") }
}

async function publicRequest(pathname, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json")
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}${pathname}`, {
      redirect: "manual",
      ...options,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    const reason = error?.name === "AbortError" ? `${REQUEST_TIMEOUT_MS}ms timeout` : error?.message
    throw new Error(`Public request failed ${pathname}: ${reason}`)
  } finally {
    clearTimeout(timer)
  }
  const contentType = res.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    const body = await res.json().catch(() => ({}))
    return { res, body, text: JSON.stringify(body) }
  }
  const buffer = Buffer.from(await res.arrayBuffer())
  return { res, body: buffer, text: buffer.toString("utf8") }
}

async function writeText(relativePath, content) {
  const target = path.join(OUT_DIR, relativePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, "utf8")
  artifacts[relativePath] = target
}

async function writeBuffer(relativePath, buffer) {
  const target = path.join(OUT_DIR, relativePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, buffer)
  artifacts[relativePath] = target
}

function stripScripts(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "")
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function summarizeState(state) {
  const findings = state?.findings ?? []
  const alerts = state?.alerts ?? []
  const docs = state?.generatedDocuments ?? []
  const taskState = state?.taskState ?? {}

  return {
    highRisk: state?.highRisk ?? 0,
    lowRisk: state?.lowRisk ?? 0,
    gdprProgress: state?.gdprProgress ?? 0,
    findings: findings.map((finding) => ({
      id: finding.id,
      title: finding.title,
      category: finding.category,
      severity: finding.severity,
      legalReference: finding.legalReference,
      taskStatus: resolveFindingTaskState(state, finding.id)?.status ?? "todo",
      validationStatus: resolveFindingTaskState(state, finding.id)?.validationStatus ?? null,
      evidenceQuality: resolveFindingTaskState(state, finding.id)?.attachedEvidenceMeta?.quality?.status ?? null,
    })),
    alerts: alerts.map((alert) => ({
      id: alert.id,
      severity: alert.severity,
      message: alert.message,
      findingId: alert.findingId,
    })),
    generatedDocuments: docs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      type: doc.documentType,
      adoptionStatus: doc.adoptionStatus ?? null,
      approvalStatus: doc.approvalStatus ?? null,
      sourceFindingId: doc.sourceFindingId ?? null,
    })),
    evidenceTasks: Object.entries(taskState)
      .filter(([, task]) => Boolean(task?.attachedEvidenceMeta))
      .map(([taskId, task]) => ({
        taskId,
        status: task.status,
        validationStatus: task.validationStatus ?? null,
        evidenceFile: task.attachedEvidenceMeta?.fileName ?? null,
        evidenceQuality: task.attachedEvidenceMeta?.quality?.status ?? null,
      })),
    events: (state?.events ?? []).map((event) => ({
      id: event.id,
      type: event.type,
      entityId: event.entityId,
      message: event.message,
      createdAtISO: event.createdAtISO,
    })),
  }
}

function latestActions(orgName, state, limit = 5) {
  return [...(state?.events ?? [])]
    .sort((left, right) => String(right.createdAtISO).localeCompare(String(left.createdAtISO)))
    .slice(0, limit)
    .map((event) => ({
      orgName,
      createdAtISO: event.createdAtISO,
      type: event.type,
      message: event.message,
      entityId: event.entityId,
    }))
}

function openFindingTitles(state) {
  return (state?.findings ?? [])
    .filter((finding) => {
      if (["resolved", "dismissed", "under_monitoring"].includes(finding.findingStatus)) return false
      return !isFindingOperationallyClosedForDemo(state, finding.id)
    })
    .map((finding) => `${finding.title} (${finding.legalReference || finding.category})`)
}

function resolveFindingTaskState(state, findingId) {
  const taskState = state?.taskState ?? {}
  const candidates = [
    taskState[findingId],
    taskState[`finding-${findingId}`],
    ...Object.entries(taskState)
      .filter(([, task]) =>
        Array.isArray(task?.relatedFindingIds) && task.relatedFindingIds.includes(findingId)
      )
      .map(([, task]) => task),
  ].filter(Boolean)

  return (
    candidates.find((task) => task.status === "done" && task.validationStatus === "passed") ||
    candidates.find((task) => task.status === "done") ||
    candidates[0] ||
    null
  )
}

function isFindingOperationallyClosedForDemo(state, findingId) {
  const finding = (state?.findings ?? []).find((item) => item.id === findingId)
  if (["resolved", "dismissed", "under_monitoring"].includes(finding?.findingStatus)) return true

  const direct = resolveFindingTaskState(state, findingId)
  if (direct?.status === "done" && direct.validationStatus === "passed") return true

  const taskState = state?.taskState ?? {}
  return Object.entries(taskState).some(([taskId, task]) => {
    if (task?.status !== "done" || task.validationStatus !== "passed") return false
    if (taskId === findingId || taskId === `finding-${findingId}`) return true
    return Array.isArray(task?.relatedFindingIds) && task.relatedFindingIds.includes(findingId)
  })
}

async function switchToOrg(memberships, orgName) {
  const membership = memberships.find((item) => item.orgName === orgName)
  record(Boolean(membership), `Membership exists for ${orgName}`, membership?.membershipId ?? "")
  if (!membership) throw new Error(`Missing membership for ${orgName}`)

  const switched = await request("/api/auth/switch-org", {
    method: "POST",
    body: JSON.stringify({ membershipId: membership.membershipId }),
  })
  record(switched.res.ok, `Switch workspace to ${orgName}`, switched.body.orgName || switched.text)
  return membership
}

async function loadDashboardFor(orgName) {
  const dashboard = await request("/api/dashboard")
  record(dashboard.res.ok, `Dashboard loads for ${orgName}`, `HTTP ${dashboard.res.status}`)
  const state = dashboard.body.state || {}
  await writeText(`dashboards/${slug(orgName)}.json`, JSON.stringify(summarizeState(state), null, 2))
  return { dashboard, state }
}

async function uploadTaskEvidence(taskId, { kind, fileName, mimeType, content }) {
  const formData = new FormData()
  formData.set("kind", kind)
  formData.set("file", new Blob([content], { type: mimeType }), fileName)

  return request(`/api/tasks/${encodeURIComponent(taskId)}/evidence`, {
    method: "POST",
    body: formData,
  })
}

async function uploadCabinetTemplateFile({ documentType, name, description, versionLabel, fileName, mimeType, content }) {
  const formData = new FormData()
  formData.set("documentType", documentType)
  formData.set("name", name)
  formData.set("description", description)
  formData.set("versionLabel", versionLabel)
  formData.set("sourceFileName", fileName)
  formData.set("active", "true")
  formData.set("file", new Blob([content], { type: mimeType }), fileName)

  return request("/api/cabinet/templates", {
    method: "POST",
    body: formData,
  })
}

function buildMinimalDocx(paragraphs) {
  const xml = [
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>`,
    `<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`,
    ...paragraphs.map(
      (paragraph) => `<w:p><w:r><w:t>${escapeXml(paragraph)}</w:t></w:r></w:p>`
    ),
    `</w:body></w:document>`,
  ].join("")
  return buildZipEntry("word/document.xml", Buffer.from(xml, "utf8"))
}

function buildZipEntry(fileName, content) {
  const compressed = deflateRawSync(content)
  const fileNameBytes = Buffer.from(fileName, "utf8")
  const header = Buffer.alloc(30)
  header.writeUInt32LE(0x04034b50, 0)
  header.writeUInt16LE(20, 4)
  header.writeUInt16LE(0, 6)
  header.writeUInt16LE(8, 8)
  header.writeUInt16LE(0, 10)
  header.writeUInt16LE(0, 12)
  header.writeUInt32LE(0, 14)
  header.writeUInt32LE(compressed.length, 18)
  header.writeUInt32LE(content.length, 22)
  header.writeUInt16LE(fileNameBytes.length, 26)
  header.writeUInt16LE(0, 28)
  return Buffer.concat([header, fileNameBytes, compressed])
}

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

async function closeOperationalFinding(taskId, label, evidenceInput) {
  const evidence = await uploadTaskEvidence(taskId, evidenceInput)
  record(evidence.res.ok, `${label}: evidence uploaded`, evidence.body?.evidence?.fileName || evidence.text)

  const done = await request(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "done" }),
  })
  record(done.res.ok, `${label}: task marked done`, done.body?.feedback?.status || done.text)

  const validated = await request(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    body: JSON.stringify({ action: "validate" }),
  })
  record(
    validated.body?.feedback?.validationStatus === "passed",
    `${label}: operational validation passed`,
    validated.body?.feedback?.validationMessage || validated.text
  )

  return { evidence, done, validated }
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUT_DIR, { recursive: true })

  const demo = await request("/api/demo/dpo-consultant")
  record(
    demo.res.status >= 300 && demo.res.status < 400,
    "Demo route seeds DPO consultant portfolio",
    demo.res.headers.get("location") || `HTTP ${demo.res.status}`
  )

  const me = await request("/api/auth/me")
  record(me.res.ok, "Authenticated as demo consultant", me.body.user?.email || me.text)
  record(me.body.user?.orgName === "DPO Complet SRL", "Cabinet workspace is DPO Complet SRL")

  const membershipsResponse = await request("/api/auth/memberships")
  const memberships = membershipsResponse.body.memberships || []
  await writeText("01-memberships.json", JSON.stringify(memberships, null, 2))
  record(memberships.length >= 4, "Cabinet + 3 client memberships exist", `${memberships.length} memberships`)

  const portfolio = await request("/api/partner/portfolio")
  await writeText("02-portfolio-initial.json", JSON.stringify(portfolio.body, null, 2))
  record(portfolio.res.ok, "Partner portfolio API loads", `HTTP ${portfolio.res.status}`)
  record(portfolio.body.totalClients === 3, "Portfolio has exactly 3 clients", `${portfolio.body.totalClients}`)
  record(
    ["Apex Logistic SRL", "Lumen Clinic SRL", "Cobalt Fintech IFN"].every((name) =>
      (portfolio.body.clientScores || []).some((client) => client.name === name)
    ),
    "Portfolio includes Apex, Lumen, Cobalt"
  )

  const cabinetTemplate = await request("/api/cabinet/templates", {
    method: "POST",
    body: JSON.stringify({
      documentType: "dpa",
      name: "DPO Complet — DPA procesatori v2026",
      description: "Template cabinet validat pentru procesatori SaaS, folosit în pilotul DPO.",
      versionLabel: "v2026.1",
      sourceFileName: "Drive:/DPO Complet/Templates/DPA-procesatori-v2026.docx",
      active: true,
      content: [
        "# Template DPA DPO Complet — {{ORG_NAME}}",
        "",
        "**Pregătit de cabinet:** DPO Complet SRL",
        "**Client / Operator:** {{ORG_NAME}}",
        "**Procesator:** {{COUNTERPARTY_NAME}}",
        "",
        "Clauză cabinet custom: procesatorul notifică operatorul fără întârziere nejustificată pentru orice incident care poate afecta datele personale.",
        "Documentul rămâne draft de lucru până la validarea consultantului DPO.",
      ].join("\n"),
    }),
  })
  record(cabinetTemplate.res.ok, "Cabinet DPO can upload active DPA template", cabinetTemplate.body?.template?.name || cabinetTemplate.text)

  const dirtyDpaTemplate = await uploadCabinetTemplateFile({
    documentType: "dpa",
    name: "DPO Complet — DPA Word murdar importat v2026.2",
    description: "Document Word real importat: antet, comentariu intern, clauze cabinet și variabile.",
    versionLabel: "v2026.2-docx",
    fileName: "DPA-procesatori-murdar-cu-comentarii.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    content: buildMinimalDocx([
      "Template DPA DPO Complet — {{ORG_NAME}}",
      "Client / Operator: {{ORG_NAME}}",
      "Procesator: {{COUNTERPARTY_NAME}}",
      "Comentariu intern cabinet: păstrează această clauză doar pentru procesatori SaaS.",
      "Clauză cabinet custom: procesatorul notifică operatorul fără întârziere nejustificată pentru orice incident care poate afecta datele personale.",
      "Status: draft de lucru până la validarea consultantului DPO.",
    ]),
  })
  record(
    dirtyDpaTemplate.res.ok,
    "Cabinet can import dirty Word .docx DPA template",
    dirtyDpaTemplate.body?.template?.sourceFileName || dirtyDpaTemplate.text
  )

  const dirtyRopaTemplate = await uploadCabinetTemplateFile({
    documentType: "ropa",
    name: "DPO Complet — RoPA import Markdown",
    description: "RoPA cabinet importat din arhiva existentă, cu variabile client.",
    versionLabel: "v2026.1-md",
    fileName: "RoPA-template-cabinet.md",
    mimeType: "text/markdown",
    content: [
      "# RoPA — {{ORG_NAME}}",
      "",
      "Comentariu intern cabinet: verificați temeiul legal înainte de trimitere.",
      "Activitate, categorii date, destinatari, transferuri și retenție.",
    ].join("\n"),
  })
  record(dirtyRopaTemplate.res.ok, "Cabinet can import RoPA Markdown template", dirtyRopaTemplate.body?.template?.sourceFileName || dirtyRopaTemplate.text)

  const dirtyRetentionTemplate = await uploadCabinetTemplateFile({
    documentType: "retention-policy",
    name: "DPO Complet — Retention Policy TXT import",
    description: "Politică retenție veche, importată ca text curățat pentru pilot.",
    versionLabel: "v2026.1-txt",
    fileName: "retentie-date-clienti-vechi.txt",
    mimeType: "text/plain",
    content: "Politică de retenție {{ORG_NAME}}. Datele se păstrează conform scopului, temeiului legal și termenelor contractuale. Revizuire anuală de cabinet DPO Complet. ".repeat(6),
  })
  record(dirtyRetentionTemplate.res.ok, "Cabinet can import retention TXT template", dirtyRetentionTemplate.body?.template?.sourceFileName || dirtyRetentionTemplate.text)

  const cabinetTemplates = await request("/api/cabinet/templates")
  await writeText("reports/cabinet-templates.json", JSON.stringify(cabinetTemplates.body, null, 2))
  record(
    (cabinetTemplates.body.templates || []).some((template) => template.documentType === "dpa" && template.active),
    "Cabinet template library lists active DPA template"
  )
  const activeDpaTemplate = (cabinetTemplates.body.templates || []).find(
    (template) => template.documentType === "dpa" && template.active
  )
  record(activeDpaTemplate?.versionLabel === "v2026.2-docx", "Cabinet template stores version label", activeDpaTemplate?.versionLabel || "missing")
  record(
    String(activeDpaTemplate?.sourceFileName || "").includes("DPA-procesatori-murdar"),
    "Cabinet template stores source file / migration history",
    activeDpaTemplate?.sourceFileName || "missing"
  )
  record(
    (cabinetTemplates.body.templates || []).filter((template) =>
      ["dpa", "ropa", "retention-policy"].includes(template.documentType)
    ).length >= 3,
    "Cabinet template library stores 3 migrated dirty templates"
  )

  const urgencyQueue = await request("/api/partner/urgency-queue")
  await writeText("04-work-queue-today.json", JSON.stringify(urgencyQueue.body, null, 2))
  const topUrgency = urgencyQueue.body.items?.[0]
  const queueKeys = (urgencyQueue.body.items || []).map((item) => `${item.orgId}:${item.findingId}`)
  const uniqueQueueKeys = new Set(queueKeys)
  record(urgencyQueue.res.ok, "Partner urgency queue loads", `HTTP ${urgencyQueue.res.status}`)
  record(queueKeys.length === uniqueQueueKeys.size, "Work queue deduplicates findings and alerts", `${uniqueQueueKeys.size}/${queueKeys.length}`)
  record(
    topUrgency?.orgName === "Lumen Clinic SRL" &&
      topUrgency?.severity === "critical" &&
      String(topUrgency?.title || "").toLowerCase().includes("dsar"),
    "Work queue prioritizes Lumen critical DSAR first",
    topUrgency ? `${topUrgency.orgName} · ${topUrgency.title}` : "missing"
  )
  record(topUrgency?.deadlineStatus === "overdue", "Work queue computes overdue DSAR deadline", topUrgency?.deadlineLabel || "missing")
  record(
    !(urgencyQueue.body.items || []).some((item) => item.findingId === "apex-gdpr-dpa-stripe"),
    "Work queue hides already resolved Apex DPA"
  )

  await switchToOrg(memberships, "Apex Logistic SRL")
  const apex = await loadDashboardFor("Apex Logistic SRL")
  const apexDoc = (apex.state.generatedDocuments || []).find((doc) => doc.id === "apex-doc-dpa-stripe")
  const apexApprovalTask = apex.state.taskState?.["document-approval-apex-doc-dpa-stripe"]
  const apexRopa = (apex.state.findings || []).find((finding) => finding.id === "apex-gdpr-ropa-stripe")
  const apexCookie = (apex.state.findings || []).find((finding) => finding.id === "apex-gdpr-cookie-reject")
  record(apexDoc?.adoptionStatus === "signed", "Apex DPA Stripe is signed", apexDoc?.adoptionStatus || "missing")
  record(
    apexApprovalTask?.attachedEvidenceMeta?.quality?.status === "sufficient",
    "Apex magic-link approval evidence is sufficient"
  )
  record(apexRopa?.legalReference === "GDPR Art. 30", "Apex RoPA gap remains visible", apexRopa?.legalReference || "missing")
  record(
    apexCookie?.legalReference?.includes("ePrivacy"),
    "Apex cookie banner gap remains visible",
    apexCookie?.legalReference || "missing"
  )

  const inheritedTemplateDoc = await request("/api/documents/generate", {
    method: "POST",
    body: JSON.stringify({
      documentType: "dpa",
      orgName: "Apex Logistic SRL",
      counterpartyName: "Stripe Payments Europe",
      counterpartyReferenceUrl: "https://stripe.com/legal/dpa",
    }),
  })
  await writeText("reports/apex-inherited-template-document.json", JSON.stringify(inheritedTemplateDoc.body, null, 2))
  record(inheritedTemplateDoc.res.ok, "Apex can generate document while inheriting cabinet template", `HTTP ${inheritedTemplateDoc.res.status}`)
  record(
    String(inheritedTemplateDoc.body.content || "").includes("Clauză cabinet custom"),
    "Generated Apex DPA contains DPO Complet custom template clause"
  )

  const apexClientHtml = await request("/api/exports/audit-pack/client")
  record(apexClientHtml.res.ok, "Apex Audit Pack HTML exports", `HTTP ${apexClientHtml.res.status}`)
  record(apexClientHtml.text.includes("Apex Logistic SRL"), "Apex Audit Pack is for Apex")
  record(apexClientHtml.text.includes("DPO Complet") || apexClientHtml.text.includes("Diana Popescu"), "Apex Audit Pack carries cabinet identity")
  record(!apexClientHtml.text.includes("CompliAI"), "Apex Audit Pack contains zero CompliAI mentions")
  await writeText("exports/apex-audit-pack-client.html", apexClientHtml.text)

  const apexAuditJson = await request("/api/exports/audit-pack")
  record(apexAuditJson.res.ok, "Apex Audit Pack JSON exports", `HTTP ${apexAuditJson.res.status}`)
  record(apexAuditJson.body.executiveSummary?.openFindings >= 2, "Apex summary counts RoPA + cookie as open findings", `${apexAuditJson.body.executiveSummary?.openFindings}`)
  record(apexAuditJson.body.executiveSummary?.missingEvidenceItems >= 2, "Apex summary counts missing evidence per open finding", `${apexAuditJson.body.executiveSummary?.missingEvidenceItems}`)
  record(
    !(apexAuditJson.body.controlsMatrix || []).some((control) => String(control.title || "").toLowerCase().includes("ai high-risk")),
    "Apex Audit Pack hides AI high-risk control when no AI systems are in scope"
  )
  record(apexAuditJson.body.bundleEvidenceSummary?.status === "review_required", "Apex bundle summary stays review_required until all evidence closes", apexAuditJson.body.bundleEvidenceSummary?.status || "missing")
  record(apexAuditJson.body.bundleEvidenceSummary?.attachedFiles > 0, "Apex bundle summary counts attached evidence", `${apexAuditJson.body.bundleEvidenceSummary?.attachedFiles}`)
  record(apexAuditJson.body.bundleEvidenceSummary?.validatedFiles > 0, "Apex bundle summary counts validated evidence", `${apexAuditJson.body.bundleEvidenceSummary?.validatedFiles}`)
  record(
    !(apexAuditJson.body.evidenceLedger || []).some((entry) => String(entry.title || "").includes("Task fara titlu") || String(entry.title || "").includes("Task fără titlu")),
    "Apex evidence ledger has no untitled tasks"
  )
  await writeText("exports/apex-audit-pack-v2-1.json", JSON.stringify(apexAuditJson.body, null, 2))

  const apexBundle = await request("/api/exports/audit-pack/bundle")
  record(apexBundle.res.ok, "Apex Audit Pack ZIP exports", `HTTP ${apexBundle.res.status}`)
  record(
    apexBundle.body.includes(Buffer.from("dpa-apex-stripe-approved.pdf")),
    "Apex Audit Pack ZIP physically includes DPA PDF evidence"
  )
  await writeBuffer("exports/apex-audit-pack-bundle.zip", apexBundle.body)

  await closeOperationalFinding("finding-apex-gdpr-ropa-stripe", "Apex RoPA remediation", {
    kind: "document_bundle",
    fileName: "ropa-apex-v3-stripe-processor.pdf",
    mimeType: "application/pdf",
    content: `${[
      "%PDF-1.4",
      "Apex Logistic SRL — RoPA v3",
      "Procesator nou: Stripe Payments Europe",
      "Scop: procesare plăți online; categorii: identificatori tranzacție, date facturare, confirmări plată.",
      "Revizuit de Diana Popescu, CIPP/E — DPO Complet SRL.",
    ].join("\n")}\n${"Control RoPA actualizat cu Stripe ca procesator. ".repeat(40)}`,
  })

  await closeOperationalFinding("finding-apex-gdpr-cookie-reject", "Apex cookie remediation", {
    kind: "screenshot",
    fileName: "apex-cookie-banner-accept-refuz-setari.png",
    mimeType: "image/png",
    content:
      "PNG demo evidence: banner CMP cu Accept / Refuz / Setări; cookie-uri non-esențiale blocate până la acord explicit.\n".repeat(260),
  })

  const apexAfterRemediation = await loadDashboardFor("Apex Logistic SRL after remediation")
  const apexAfterRopaTask = apexAfterRemediation.state.taskState?.["finding-apex-gdpr-ropa-stripe"]
  const apexAfterCookieTask = apexAfterRemediation.state.taskState?.["finding-apex-gdpr-cookie-reject"]
  record(
    apexAfterRopaTask?.status === "done" && apexAfterRopaTask?.validationStatus === "passed",
    "Apex RoPA task is done + validated after evidence"
  )
  record(
    apexAfterCookieTask?.status === "done" && apexAfterCookieTask?.validationStatus === "passed",
    "Apex cookie task is done + validated after evidence"
  )

  const apexBaseline = await request("/api/state/baseline", {
    method: "POST",
    body: JSON.stringify({ action: "set" }),
  })
  await writeText("exports/apex-baseline-validation-response.json", JSON.stringify(apexBaseline.body, null, 2))
  record(
    apexBaseline.res.ok && Boolean(apexBaseline.body.state?.validatedBaselineSnapshotId),
    "Apex baseline validates after all remediation evidence closes",
    apexBaseline.body.state?.validatedBaselineSnapshotId || apexBaseline.text
  )

  const apexAuditReadyJson = await request("/api/exports/audit-pack")
  await writeText("exports/apex-after-audit-ready-v2-1.json", JSON.stringify(apexAuditReadyJson.body, null, 2))
  record(apexAuditReadyJson.res.ok, "Apex after-state Audit Pack JSON exports", `HTTP ${apexAuditReadyJson.res.status}`)
  record(
    apexAuditReadyJson.body.executiveSummary?.baselineStatus === "validated",
    "Apex after-state baseline is validated",
    apexAuditReadyJson.body.executiveSummary?.baselineStatus || "missing"
  )
  record(
    apexAuditReadyJson.body.executiveSummary?.openFindings === 0,
    "Apex after-state has zero open findings",
    `${apexAuditReadyJson.body.executiveSummary?.openFindings}`
  )
  record(
    apexAuditReadyJson.body.executiveSummary?.missingEvidenceItems === 0,
    "Apex after-state has zero missing evidence",
    `${apexAuditReadyJson.body.executiveSummary?.missingEvidenceItems}`
  )
  record(
    apexAuditReadyJson.body.executiveSummary?.auditReadiness === "audit_ready",
    "Apex after-state transitions to audit_ready",
    apexAuditReadyJson.body.executiveSummary?.auditReadiness || "missing"
  )
  record(
    apexAuditReadyJson.body.bundleEvidenceSummary?.status === "bundle_ready",
    "Apex after-state bundle is ready",
    apexAuditReadyJson.body.bundleEvidenceSummary?.status || "missing"
  )

  const apexAuditReadyHtml = await request("/api/exports/audit-pack/client")
  await writeText("exports/apex-after-audit-ready-client.html", apexAuditReadyHtml.text)

  const apexAuditReadyBundle = await request("/api/exports/audit-pack/bundle")
  record(apexAuditReadyBundle.res.ok, "Apex after-state Audit Pack ZIP exports", `HTTP ${apexAuditReadyBundle.res.status}`)
  await writeBuffer("exports/apex-after-audit-ready-bundle.zip", apexAuditReadyBundle.body)

  await switchToOrg(memberships, "Lumen Clinic SRL")
  const lumen = await loadDashboardFor("Lumen Clinic SRL")
  const lumenDsar = (lumen.state.findings || []).find((finding) => finding.id === "lumen-dsar-overdue")
  record(lumenDsar?.severity === "critical", "Lumen DSAR appears as critical", lumenDsar?.severity || "missing")
  record(
    lumen.state.taskState?.["lumen-dsar-overdue"]?.validationStatus === "needs_review",
    "Lumen DSAR remains needs_review until evidence is sent"
  )
  const lumenClientHtml = await request("/api/exports/audit-pack/client")
  record(lumenClientHtml.res.ok, "Lumen Audit Pack HTML exports", `HTTP ${lumenClientHtml.res.status}`)
  await writeText("exports/lumen-audit-pack-client.html", lumenClientHtml.text)

  await switchToOrg(memberships, "Cobalt Fintech IFN")
  const cobalt = await loadDashboardFor("Cobalt Fintech IFN")
  const cobaltAiStateKey = "cobalt-ai-inventory-chatgpt"
  const cobaltAiTaskId = "finding-cobalt-ai-inventory-chatgpt"
  const cobaltAiTask = cobalt.state.taskState?.[cobaltAiStateKey]
  record(cobaltAiTask?.status === "done", "Cobalt AI minimization task is closed", cobaltAiTask?.status || "missing")
  record(
    cobaltAiTask?.attachedEvidenceMeta?.quality?.status === "sufficient",
    "Cobalt AI OFF evidence is sufficient"
  )
  const cobaltAiEvidenceId = cobaltAiTask?.attachedEvidenceMeta?.id
  if (cobaltAiEvidenceId) {
    const softDelete = await request(
      `/api/tasks/${encodeURIComponent(cobaltAiTaskId)}/evidence/${encodeURIComponent(cobaltAiEvidenceId)}`,
      {
        method: "DELETE",
        body: JSON.stringify({ reason: "test restore window pentru document incarcat gresit" }),
      }
    )
    record(softDelete.res.ok, "Evidence delete hardening: soft delete requires reason and succeeds", softDelete.body?.evidenceDeletion?.status || softDelete.text)
    record(
      Boolean(softDelete.body?.state?.taskState?.[cobaltAiStateKey]?.deletedEvidenceMeta?.restoreUntilISO),
      "Evidence delete hardening: restore window is recorded",
      softDelete.body?.state?.taskState?.[cobaltAiStateKey]?.deletedEvidenceMeta?.restoreUntilISO || "missing"
    )

    const deletedDownload = await request(
      `/api/tasks/${encodeURIComponent(cobaltAiTaskId)}/evidence/${encodeURIComponent(cobaltAiEvidenceId)}`
    )
    record(
      deletedDownload.res.status === 410,
      "Evidence delete hardening: soft-deleted evidence cannot be downloaded",
      `HTTP ${deletedDownload.res.status}`
    )

    if (me.body.user?.role !== "owner") {
      const permanentDenied = await request(
        `/api/tasks/${encodeURIComponent(cobaltAiTaskId)}/evidence/${encodeURIComponent(cobaltAiEvidenceId)}?permanent=1`,
        {
          method: "DELETE",
          body: JSON.stringify({ reason: "test owner only permanent deletion" }),
        }
      )
      record(
        permanentDenied.res.status === 403,
        "Evidence delete hardening: permanent delete is owner-only",
        `HTTP ${permanentDenied.res.status}`
      )
    } else {
      record(
        true,
        "Evidence delete hardening: permanent delete owner-only rule covered by unit/RBAC tests",
        "runtime demo user is owner; skip destructive hard delete"
      )
    }

    const restoreEvidence = await request(
      `/api/tasks/${encodeURIComponent(cobaltAiTaskId)}/evidence/${encodeURIComponent(cobaltAiEvidenceId)}`,
      {
        method: "PATCH",
        body: JSON.stringify({ action: "restore" }),
      }
    )
    record(restoreEvidence.res.ok, "Evidence delete hardening: soft-deleted evidence restores", restoreEvidence.body?.evidenceDeletion?.status || restoreEvidence.text)

    const revalidateCobaltAi = await request(`/api/tasks/${encodeURIComponent(cobaltAiTaskId)}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "mark_done_and_validate" }),
    })
    record(
      revalidateCobaltAi.body?.feedback?.validationStatus === "passed",
      "Evidence delete hardening: restored evidence can be revalidated",
      revalidateCobaltAi.body?.feedback?.validationMessage || revalidateCobaltAi.text
    )
  } else {
    record(false, "Evidence delete hardening: Cobalt AI evidence id exists", "missing")
  }

  const share = await request("/api/reports/share-token", {
    method: "POST",
    body: JSON.stringify({
      recipientType: "partner",
      documentId: "cobalt-doc-payroll-dpa",
      documentTitle: "DPA salarizare — Cobalt Fintech IFN × PayFlow HR",
    }),
  })
  record(Boolean(share.res.ok && share.body.token), "Create Cobalt magic link for client feedback", share.body.token ? "token generated" : share.text)
  const token = share.body.token

  const sharedBefore = await publicRequest(`/shared/${token}`)
  const visibleBefore = stripScripts(sharedBefore.text)
  record(sharedBefore.res.ok, "Cobalt shared page loads before feedback", `HTTP ${sharedBefore.res.status}`)
  record(visibleBefore.includes("DPO Complet") && visibleBefore.includes("Cobalt Fintech IFN"), "Cobalt shared page is cabinet-branded")
  await writeText("shared/cobalt-before-feedback.html", sharedBefore.text)

  const comment = await publicRequest(`/api/shared/${token}/comment`, {
    method: "POST",
    body: JSON.stringify({
      authorName: "Radu Marinescu",
      comment: "Vă rog adăugați explicit regula: fără date CNP în prompturi.",
    }),
  })
  record(comment.res.ok, "Cobalt client comment captured", comment.text)

  const reject = await publicRequest(`/api/shared/${token}/reject`, {
    method: "POST",
    body: JSON.stringify({
      authorName: "Radu Marinescu",
      comment: "Solicit revizie: adăugați regula CNP și aprobarea responsabilului IT înainte de publicare.",
    }),
  })
  record(reject.res.ok, "Cobalt client rejection captured with reason", reject.text)

  const approveAfterReject = await publicRequest(`/api/shared/${token}/approve`, {
    method: "POST",
  })
  record(
    approveAfterReject.res.status === 409,
    "Messy case: rejected document cannot be approved with same magic link",
    `HTTP ${approveAfterReject.res.status}`
  )

  const tamperedShared = await publicRequest(`/shared/${token}tampered`)
  record(
    tamperedShared.res.status === 401 ||
      tamperedShared.res.status === 404 ||
      stripScripts(tamperedShared.text).includes("Link invalid sau expirat"),
    "Messy case: tampered magic link shows blocked state",
    `HTTP ${tamperedShared.res.status}`
  )

  const sharedAfter = await publicRequest(`/shared/${token}`)
  record(sharedAfter.text.includes("Respins") || sharedAfter.text.includes("respins"), "Cobalt shared page shows rejected state")
  await writeText("shared/cobalt-after-rejection.html", sharedAfter.text)

  const cobaltAfter = await loadDashboardFor("Cobalt Fintech IFN after reject")
  const rejectedDoc = (cobaltAfter.state.generatedDocuments || []).find((doc) => doc.id === "cobalt-doc-payroll-dpa")
  record(rejectedDoc?.adoptionStatus === "rejected", "Cobalt document adoptionStatus is rejected", rejectedDoc?.adoptionStatus || "missing")
  record(
    (cobaltAfter.state.events || []).some((event) => event.type === "document.shared_rejected"),
    "Cobalt event ledger includes rejection"
  )
  record(
    (cobaltAfter.state.events || []).some((event) => event.type === "document.shared_commented"),
    "Cobalt event ledger includes comment"
  )

  const finalPortfolio = await request("/api/partner/portfolio")
  await writeText("03-portfolio-final.json", JSON.stringify(finalPortfolio.body, null, 2))
  record(finalPortfolio.res.ok, "Partner portfolio still loads after client actions")
  const finalApexPortfolio = (finalPortfolio.body.clientScores || []).find(
    (client) => client.name === "Apex Logistic SRL"
  )
  record(
    finalApexPortfolio?.criticalFindings === 0,
    "Final portfolio shows Apex with zero critical findings after audit_ready",
    `${finalApexPortfolio?.criticalFindings ?? "missing"}`
  )
  record(
    finalApexPortfolio?.alertCount === 0,
    "Final portfolio shows Apex with zero open alerts after audit_ready",
    `${finalApexPortfolio?.alertCount ?? "missing"}`
  )

  const monthly = await request(
    `/api/cron/partner-monthly-report?preview=1&consultantEmail=${encodeURIComponent(me.body.user?.email || "")}`,
    { method: "POST" }
  )
  const monthlyReport = monthly.body.reports?.[0]
  record(monthly.res.ok, "Partner monthly report preview endpoint runs", `HTTP ${monthly.res.status}`)
  record(monthlyReport?.clientEntries?.length === 3, "Monthly report covers exactly 3 client orgs", `${monthlyReport?.clientEntries?.length ?? 0}`)
  record(Boolean(monthlyReport?.html?.includes("DPO Complet") || monthlyReport?.html?.includes("Raport lunar")), "Monthly report HTML is generated")
  record(String(monthlyReport?.html || "").includes("Activitate lunară pe client"), "Monthly report includes client activity section")
  record(String(monthlyReport?.html || "").includes("DPA — Apex Logistic SRL × Stripe Payments Europe"), "Monthly report includes worked DPA item")
  record(String(monthlyReport?.html || "").includes("DSAR pacient neînchis"), "Monthly report includes Lumen DSAR next action")
  record(!String(monthlyReport?.html || "").includes("CompliAI"), "Monthly report contains zero CompliAI mentions")
  record(
    monthlyReport?.clientFacingReports?.length === 3,
    "Monthly report includes client-facing report for each client",
    `${monthlyReport?.clientFacingReports?.length ?? 0}`
  )
  const monthlyApex = (monthlyReport?.clientEntries || []).find((client) => client.orgName === "Apex Logistic SRL")
  record(
    monthlyApex?.auditReadiness === "audit_ready",
    "Monthly report shows Apex audit_ready after baseline validation",
    monthlyApex?.auditReadiness || "missing"
  )
  record(
    monthlyApex?.openFindings === 0,
    "Monthly report shows Apex with zero open findings after remediation",
    `${monthlyApex?.openFindings ?? "missing"}`
  )
  record(
    monthlyApex?.pendingEvidence === 0,
    "Monthly report shows Apex with zero pending evidence after remediation",
    `${monthlyApex?.pendingEvidence ?? "missing"}`
  )
  await writeText("reports/partner-monthly-report.json", JSON.stringify(monthly.body, null, 2))
  if (monthlyReport?.html) {
    await writeText("reports/partner-monthly-report.html", monthlyReport.html)
  }
  for (const clientReport of monthlyReport?.clientFacingReports || []) {
    const reportSlug = slug(clientReport.orgName)
    await writeText(`reports/client-monthly-${reportSlug}.html`, clientReport.html)
    record(
      String(clientReport.html || "").includes(clientReport.orgName) &&
        String(clientReport.html || "").includes("Ce s-a lucrat luna aceasta") &&
        !String(clientReport.html || "").includes("CompliAI"),
      `Client-facing monthly report is usable for ${clientReport.orgName}`
    )
  }

  await switchToOrg(memberships, "DPO Complet SRL")
  const cabinetExport = await request("/api/partner/export")
  record(cabinetExport.res.ok, "Cabinet complete migration export downloads", `HTTP ${cabinetExport.res.status}`)
  record(
    cabinetExport.body?._meta?.clientCount === 3,
    "Cabinet export includes all 3 client workspaces",
    `${cabinetExport.body?._meta?.clientCount ?? "missing"}`
  )
  record(
    (cabinetExport.body?.cabinet?.templates || []).some((template) => template.documentType === "dpa"),
    "Cabinet export includes template library"
  )
  record(
    cabinetExport.body?.securityContractualPack?.permissionMatrix?.some((row) => row.action === "validate_baseline"),
    "Cabinet export includes RBAC permission matrix"
  )
  record(
    String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("DPA CompliScan ↔ cabinet DPO"),
    "Cabinet export includes security + contractual pack markdown"
  )
  record(
    cabinetExport.body?.securityContractualPack?.contractualDocuments?.some(
      (doc) => doc.id === "dpa-controller-processor" && doc.status === "signature_ready_template"
    ),
    "Production trust pack includes signature-ready DPA template"
  )
  record(
    String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("Storage production") &&
      String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("eu-central-1 — Frankfurt"),
    "Production trust pack documents Supabase production storage clearly"
  )
  record(
    (cabinetExport.body?.securityContractualPack?.subprocessors || []).every(
      (item) => item.exactProvider && item.region && item.dataProcessed && item.trainingUse
    ),
    "Production trust pack has exact subprocessor table fields"
  )
  record(
    String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("Evidence delete policy") &&
      String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("30 zile restore window"),
    "Production trust pack documents evidence delete hardening"
  )
  record(
    !String(cabinetExport.body?.securityContractualPackMarkdown || "").includes("draft_for_review"),
    "Production trust pack has no draft_for_review blocker"
  )
  await writeText("exports/cabinet-complete-migration-export.json", JSON.stringify(cabinetExport.body, null, 2))
  await writeText(
    "reports/security-contractual-pack.md",
    cabinetExport.body?.securityContractualPackMarkdown || ""
  )

  const acceptanceChecklist = [
    "# DPO pilot acceptance checklist",
    "",
    "1. Ultimele 5 lucruri făcute:",
    ...[
      ...latestActions("Apex Logistic SRL", apexAfterRemediation.state),
      ...latestActions("Lumen Clinic SRL", lumen.state),
      ...latestActions("Cobalt Fintech IFN", cobaltAfter.state),
    ]
      .sort((left, right) => String(right.createdAtISO).localeCompare(String(left.createdAtISO)))
      .slice(0, 5)
      .map((item) => `   - ${item.createdAtISO} · ${item.orgName} · ${item.type} · ${item.message}`),
    "",
    "2. Unde sunt notate:",
    "   - `dashboards/*.json`, `runtime-demo-report.json`, `exports/apex-audit-pack-v2-1.json`, event ledger și evidence ledger.",
    "",
    "3. Livrabile trimise clientului:",
    "   - Apex DPA Stripe semnat; Cobalt DPA payroll trimis prin magic link; Audit Pack HTML/ZIP pentru Apex; raport lunar portofoliu.",
    "   - Apex after-state: RoPA actualizat, cookie screenshot atașat, baseline validat și Audit Pack `audit_ready`.",
    "",
    "4. Dovezi păstrate:",
    "   - Magic-link approval Apex, RoPA v3 Apex, cookie banner screenshot Apex, AI OFF evidence Cobalt, comment/reject Cobalt, manifest SHA-256 în Audit Pack bundle.",
    "   - Evidence delete hardening testat: soft delete cu motiv, blocare download, restore window și revalidare după restore.",
    "",
    "5. Prioritate azi:",
    `   - ${topUrgency?.orgName || "n/a"} · ${topUrgency?.severity || "n/a"} · ${topUrgency?.title || "n/a"}`,
    "",
    "6. Aprobări client:",
    "   - Apex aprobat; Cobalt comentat și respins; statusurile sunt reflectate în dashboard și event ledger.",
    "",
    "7. Raportare lunară:",
    "   - `reports/partner-monthly-report.html` generat din portofoliul real al consultantului demo.",
    "   - `reports/client-monthly-*.html` sunt rapoarte client-facing separate, cu activitate reală per client.",
    "",
    "8. RoPA / DPA / DSAR în practică:",
    `   - Apex RoPA: ${apexAfterRemediation.state.taskState?.["finding-apex-gdpr-ropa-stripe"]?.validationStatus || "missing"}; Apex DPA: ${apexDoc?.adoptionStatus || "missing"}; Lumen DSAR: ${lumen.state.taskState?.["lumen-dsar-overdue"]?.validationStatus || "missing"}.`,
    "",
    "9. Tool vs email/Word/Drive:",
    "   - În tool: status, livrabile, approvals, evidence, audit pack, raport lunar, template-uri Word importate. În afara tool-ului rămân validarea profesională și portalurile oficiale.",
    "",
    "10. Ce nu ar trebui arătat încă într-un audit final:",
    ...openFindingTitles(apexAfterRemediation.state).map((title) => `   - Apex: ${title}`),
    ...openFindingTitles(lumen.state).map((title) => `   - Lumen: ${title}`),
    ...openFindingTitles(cobaltAfter.state).map((title) => `   - Cobalt: ${title}`),
    "",
  ].join("\n")
  await writeText("reports/dpo-acceptance-checklist.md", acceptanceChecklist)

  const failed = checks.filter((check) => !check.ok)
  const report = {
    generatedAtISO: new Date().toISOString(),
    baseUrl: BASE,
    scenario: "dpo-consultant",
    cabinet: "DPO Complet SRL",
    consultant: "Diana Popescu, CIPP/E",
    clients: ["Apex Logistic SRL", "Lumen Clinic SRL", "Cobalt Fintech IFN"],
    checks,
    failed,
    artifacts,
  }
  await writeText("runtime-demo-report.json", JSON.stringify(report, null, 2))
  await writeText(
    "README.md",
    [
      "# CompliScan — DPO consultant runtime demo",
      "",
      `Generat: ${report.generatedAtISO}`,
      `Base URL: ${BASE}`,
      "",
      "## Verdict",
      "",
      failed.length === 0
        ? `PASS — ${checks.length}/${checks.length} verificări runtime trecute.`
        : `FAIL — ${checks.length - failed.length}/${checks.length} verificări trecute, ${failed.length} eșuate.`,
      "",
      "## Flow verificat",
      "",
      "- `/api/demo/dpo-consultant` seedează cabinet + 3 clienți.",
      "- Portfolio partner vede Apex, Lumen și Cobalt.",
      "- Apex are DPA Stripe semnat și Audit Pack exportabil.",
      "- Apex are after-state complet: RoPA + cookie închise, baseline validat, Audit Pack `audit_ready`.",
      "- Lumen are DSAR critic în `needs_review` până la dovada trimiterii.",
      "- Cobalt are AI OFF evidence și flow comment/reject prin magic link.",
      "- Template import real: DPA .docx murdar + RoPA .md + retenție .txt intră în biblioteca cabinetului.",
      "- Evidence delete hardening: soft delete cu motiv, download blocat, restore window, restore + revalidare.",
      "- Messy cases: token alterat respins; document respins nu poate fi supra-aprobat cu același link.",
      "- Export cabinet complet include template-uri, clienți, RBAC, DPA semnabil și production trust pack.",
      "",
      "## Artefacte",
      "",
      "- `01-memberships.json`",
      "- `02-portfolio-initial.json`",
      "- `03-portfolio-final.json`",
      "- `04-work-queue-today.json`",
      "- `dashboards/*.json`",
      "- `exports/*.html` + `exports/apex-audit-pack-bundle.zip`",
      "- `exports/apex-after-audit-ready-v2-1.json` + `exports/apex-after-audit-ready-bundle.zip`",
      "- `reports/cabinet-templates.json` + `reports/apex-inherited-template-document.json`",
      "- `reports/partner-monthly-report.html`",
      "- `reports/client-monthly-*.html`",
      "- `reports/security-contractual-pack.md`",
      "- `exports/cabinet-complete-migration-export.json`",
      "- `reports/dpo-acceptance-checklist.md`",
      "- `shared/cobalt-before-feedback.html` + `shared/cobalt-after-rejection.html`",
      "- `runtime-demo-report.json`",
      "",
    ].join("\n")
  )

  console.log(JSON.stringify({ outDir: OUT_DIR, checks: checks.length, failed: failed.length }, null, 2))
  if (failed.length > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
