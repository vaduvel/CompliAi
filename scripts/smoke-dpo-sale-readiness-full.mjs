import { promises as fs } from "node:fs"
import path from "node:path"

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000"
const OUT_DIR =
  process.env.OUT_DIR ||
  `/private/tmp/compliscan-dpo-sale-readiness-${new Date().toISOString().slice(0, 10)}`
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 60_000)
const EMAIL_TEST_TO =
  process.env.EMAIL_TEST_TO ||
  process.env.COMPLISCAN_EMAIL_TEST_TO ||
  "vaduvadaniel10@yahoo.com"

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
  checks.push({ ok: Boolean(ok), label, details })
  console.log(`${ok ? "PASS" : "FAIL"} ${label}${details ? ` — ${details}` : ""}`)
}

async function request(pathname, options = {}) {
  const headers = new Headers(options.headers || {})
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData
  if (options.body && !headers.has("content-type") && !isFormData) {
    headers.set("content-type", "application/json")
  }
  const cookie = jar.header()
  if (cookie) headers.set("cookie", cookie)

  const result = await fetchWithBody(pathname, { ...options, headers }, true)
  if (
    pathname.startsWith("/api/") &&
    (!options.method || options.method === "GET") &&
    result.res.status === 404 &&
    typeof result.text === "string" &&
    result.text.includes("Pagina nu a fost găsită")
  ) {
    await new Promise((resolve) => setTimeout(resolve, 1200))
    return fetchWithBody(pathname, { ...options, headers }, true)
  }
  return result
}

async function publicRequest(pathname, options = {}) {
  const headers = new Headers(options.headers || {})
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json")
  return fetchWithBody(pathname, { ...options, headers }, false)
}

async function fetchWithBody(pathname, options, captureCookies) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res
  try {
    res = await fetch(`${BASE}${pathname}`, {
      redirect: "manual",
      ...options,
      signal: controller.signal,
    })
    if (captureCookies) jar.capture(res.headers)
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

async function writeText(relativePath, content) {
  const target = path.join(OUT_DIR, relativePath)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.writeFile(target, content, "utf8")
  artifacts[relativePath] = target
}

function slug(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function switchToOrg(orgName) {
  const membershipsResponse = await request("/api/auth/memberships")
  const membership = (membershipsResponse.body.memberships || []).find(
    (item) => item.orgName === orgName
  )
  record(Boolean(membership), `Membership exists for ${orgName}`, membership?.membershipId ?? "")
  if (!membership) throw new Error(`Missing membership for ${orgName}`)

  const switched = await request("/api/auth/switch-org", {
    method: "POST",
    body: JSON.stringify({ membershipId: membership.membershipId }),
  })
  record(switched.res.ok, `Switch workspace to ${orgName}`, switched.body.orgName || switched.text)
  return membership
}

async function uploadDpoMigration(kind, fileName, content) {
  const form = new FormData()
  form.set("kind", kind)
  form.set("file", new Blob([content], { type: "text/csv" }), fileName)
  return request("/api/dpo/migration/import", {
    method: "POST",
    body: form,
  })
}

function findDocumentBackedDpaFinding(state) {
  return (state.findings || []).find(
    (finding) =>
      finding.suggestedDocumentType === "dpa" ||
      finding.id === "intake-vendor-no-dpa" ||
      String(finding.title || "").toLowerCase().includes("dpa")
  )
}

function requireCheck(condition, message) {
  if (!condition) throw new Error(message)
}

async function main() {
  await fs.rm(OUT_DIR, { recursive: true, force: true })
  await fs.mkdir(OUT_DIR, { recursive: true })

  const unique = Date.now().toString().slice(-6)
  const clientName = `Clinica Diana Flow ${unique} SRL`
  const clientCui = `RO${unique}42`
  const counterpartyName = "Stripe Payments Europe"

  const demo = await request("/api/demo/dpo-consultant")
  record(
    demo.res.status >= 300 && demo.res.status < 400,
    "Seed Diana / DPO Complet demo account",
    demo.res.headers.get("location") || `HTTP ${demo.res.status}`
  )

  const me = await request("/api/auth/me")
  record(me.res.ok, "Diana is authenticated", me.body.user?.email || me.text)
  record(me.body.user?.orgName === "DPO Complet SRL", "Current workspace starts at cabinet")

  const templateContent = [
    "# DPA Cabinet Diana — {{orgName}} × {{counterpartyName}}",
    "",
    "**Cabinet:** {{preparedBy}}",
    "**Client / Operator:** {{orgName}}",
    "**CUI client:** {{orgCui}}",
    "**Procesator:** {{counterpartyName}}",
    "**Contact DPO:** {{dpoEmail}}",
    "**Data documentului:** {{documentDate}}",
    "",
    "Clauză cabinet Diana: procesatorul notifică operatorul fără întârziere nejustificată, iar dovada aprobării clientului rămâne legată de dosarul de audit.",
    "Clauză verificare: documentul devine utilizabil doar după aprobarea prin magic link și validarea consultantului DPO.",
  ].join("\n")

  const template = await request("/api/cabinet/templates", {
    method: "POST",
    body: JSON.stringify({
      documentType: "dpa",
      name: "DPO Complet — DPA Diana real template",
      description: "Template DPA importat din arhiva cabinetului, cu variabile camelCase reale.",
      versionLabel: "v2026.3-sale-readiness",
      sourceFileName: "Drive:/DPO Complet/Templates/DPA-Diana-real-template.docx",
      active: true,
      content: templateContent,
    }),
  })
  record(template.res.ok, "Diana imports/activates her real DPA template", template.body.template?.name || template.text)
  record(
    (template.body.template?.detectedVariables || []).includes("orgName") &&
      (template.body.template?.detectedVariables || []).includes("counterpartyName"),
    "Template parser detects Diana-style camelCase variables",
    (template.body.template?.detectedVariables || []).join(", ")
  )

  const importResponse = await request("/api/partner/import/execute", {
    method: "POST",
    body: JSON.stringify({
      rows: [
        {
          orgName: clientName,
          cui: clientCui,
          sector: "health",
          employeeCount: "50-249",
          email: `contact+${unique}@clinica-diana.test`,
          website: null,
        },
      ],
    }),
  })
  await writeText("01-import-response.json", JSON.stringify(importResponse.body, null, 2))
  record(importResponse.res.ok && importResponse.body.imported === 1, "Diana imports one pseudonymized real client", importResponse.text)
  const imported = (importResponse.body.results || []).find((item) => item.ok)
  requireCheck(imported?.orgId, "Import did not return orgId")

  const baseline = await request("/api/partner/import/baseline-scan", {
    method: "POST",
    body: JSON.stringify({ orgId: imported.orgId, cui: clientCui, website: null }),
  })
  await writeText("02-baseline-scan.json", JSON.stringify(baseline.body, null, 2))
  record(baseline.res.ok && baseline.body.findingsCount > 0, "Baseline scan creates real findings for imported client", `${baseline.body.findingsCount} findings`)

  await switchToOrg(clientName)
  const dashboard = await request("/api/dashboard")
  const state = dashboard.body.state || {}
  await writeText("03-dashboard-after-import.json", JSON.stringify(state, null, 2))
  record(dashboard.res.ok, "New client dashboard loads after import")
  record(Boolean(state.scans?.[0]?.analyzedAtISO), "Dashboard has latest scan timestamp", state.scans?.[0]?.analyzedAtISO || "missing")
  record(
    (state.findings || []).some((finding) => finding.id === "intake-lege190-cnp-sensitive-data"),
    "Romanian DPO baseline detects Legea 190/2018 / CNP-sensitive-data gap"
  )

  const dsarMigration = await uploadDpoMigration(
    "dsar-log",
    "diana-dsar-istoric.csv",
    [
      "Solicitant,Email,Tip cerere,Data primire,Status,Dovada",
      "Maria Ionescu,maria.ionescu@example.ro,Acces Art 15,01.04.2026,raspuns trimis,Drive:/DSAR/maria.pdf",
    ].join("\n")
  )
  record(dsarMigration.res.ok && dsarMigration.body.importedCount === 1, "Diana imports historical DSAR log", dsarMigration.text)

  const ropaMigration = await uploadDpoMigration(
    "ropa-register",
    "diana-ropa-istoric.csv",
    [
      "Activitate,Scop,Temei,Categorii date,Persoane vizate,Destinatari,Retentie",
      "Programări pacienți,Gestionare consultații,Art. 6(1)(b),date contact; date sănătate,pacienți,medici,5 ani",
    ].join("\n")
  )
  record(ropaMigration.res.ok && ropaMigration.body.structuredCount === 1, "Diana imports historical RoPA register as review draft", ropaMigration.text)

  const vendorMigration = await uploadDpoMigration(
    "vendor-dpa-register",
    "diana-vendori-dpa.csv",
    [
      "Furnizor,Serviciu,DPA,Date personale,Transfer,Review",
      "MailTool Clinic,Newsletter,nu,da,SCC,30.09.2026",
    ].join("\n")
  )
  record(vendorMigration.res.ok && vendorMigration.body.importedCount === 1, "Diana imports historical vendor/DPA register", vendorMigration.text)

  const trainingMigration = await uploadDpoMigration(
    "training-tracker",
    "diana-training-gdpr.csv",
    [
      "Training,Audienta,Participanti,Data,Dovada",
      "Training GDPR recepție,angajați,12,12.03.2026,Drive:/Training/receptie.pdf",
    ].join("\n")
  )
  record(trainingMigration.res.ok && trainingMigration.body.importedCount === 1, "Diana imports historical GDPR training tracker", trainingMigration.text)

  const breachMigration = await uploadDpoMigration(
    "breach-log",
    "diana-breach-log.csv",
    [
      "Incident,Data,Severitate,Date personale,Categorii date,Masuri",
      "Email pacient trimis greșit,20.04.2026,high,da,date sănătate,contactat pacientul",
    ].join("\n")
  )
  record(breachMigration.res.ok && breachMigration.body.importedCount === 1, "Diana imports historical breach log and ANSPDCP tracking", breachMigration.text)

  const postMigration = await request("/api/dashboard")
  const migratedState = postMigration.body.state || {}
  await writeText("03b-dashboard-after-history-migration.json", JSON.stringify(migratedState, null, 2))
  record(
    (migratedState.dpoMigrationImports || []).length >= 5,
    "Dashboard state keeps DPO migration import history",
    `${(migratedState.dpoMigrationImports || []).length} imports`
  )
  record(
    (migratedState.generatedDocuments || []).some((document) => document.documentType === "ropa" && String(document.title || "").includes("RoPA istoric")),
    "Historical RoPA is visible as draft document"
  )
  record(
    (migratedState.gdprTrainingRecords || []).some((record) => record.title.includes("Training GDPR recepție")),
    "Historical training tracker is visible in client state"
  )
  record(
    (migratedState.findings || []).some((finding) => String(finding.id || "").startsWith("anspdcp-breach-")),
    "Historical personal-data breach creates ANSPDCP 72h finding"
  )

  const incidents = await request("/api/nis2/incidents")
  const personalDataIncident = (incidents.body.incidents || []).find((incident) => incident.involvesPersonalData)
  record(Boolean(personalDataIncident), "Historical breach is visible as ANSPDCP-trackable incident", personalDataIncident?.title || "missing")
  if (personalDataIncident?.id) {
    const anspdcpExport = await request(`/api/breach-notification/${encodeURIComponent(personalDataIncident.id)}/export`)
    await writeText("03c-anspdcp-export-check.txt", `status=${anspdcpExport.res.status}\ncontent-type=${anspdcpExport.res.headers.get("content-type")}\nbytes=${Buffer.isBuffer(anspdcpExport.body) ? anspdcpExport.body.length : 0}\n`)
    record(
      anspdcpExport.res.ok && anspdcpExport.res.headers.get("content-type")?.includes("application/pdf"),
      "ANSPDCP 72h incident package exports as PDF",
      anspdcpExport.res.headers.get("content-type") || `HTTP ${anspdcpExport.res.status}`
    )
  }

  const ropaDocument = (migratedState.generatedDocuments || []).find((document) => document.documentType === "ropa")
  const dpia = await request("/api/gdpr/dpia", {
    method: "POST",
    body: JSON.stringify({
      title: `DPIA portal pacienți — ${clientName}`,
      purpose: "Evaluarea riscului pentru programări online și istoricul consultațiilor.",
      description: "Portal pacient cu cont, notificări și acces la rezultate medicale.",
      dataCategories: ["date identificare", "date contact", "date sănătate"],
      dataSubjects: ["pacienți", "aparținători"],
      legalBasis: "GDPR Art. 6(1)(b), Art. 9(2)(h)",
      specialCategories: true,
      automatedDecisionMaking: false,
      largeScaleProcessing: true,
      linkedRopaDocumentId: ropaDocument?.id,
      linkedRopaEntryLabel: "Programări pacienți",
      necessityAssessment: "Portalul reduce erorile operaționale și centralizează cererile pacienților.",
      proportionalityAssessment: "Acces limitat pe roluri, minimizare câmpuri și retenție controlată.",
      risks: ["acces neautorizat la date medicale", "expunere accidentală rezultate"],
      mitigationMeasures: ["MFA pentru personal", "log audit acces", "criptare storage", "review trimestrial"],
      residualRisk: "medium",
      owner: "Diana Popescu",
      dueAtISO: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    }),
  })
  record(dpia.res.ok && dpia.body.record?.id, "Diana creates Art. 35 DPIA linked to RoPA", dpia.body.record?.id || dpia.text)
  const dpiaId = dpia.body.record?.id
  if (dpiaId) {
    const dpiaReview = await request("/api/gdpr/dpia", {
      method: "PATCH",
      body: JSON.stringify({ id: dpiaId, status: "approved" }),
    })
    record(dpiaReview.res.ok && dpiaReview.body.record?.status === "approved", "DPIA moves to approved after consultant review", dpiaReview.body.record?.status || dpiaReview.text)
    const dpiaExport = await request(`/api/gdpr/dpia/${encodeURIComponent(dpiaId)}/export`)
    await writeText("03d-dpia-export-check.txt", `status=${dpiaExport.res.status}\ncontent-type=${dpiaExport.res.headers.get("content-type")}\nbytes=${Buffer.isBuffer(dpiaExport.body) ? dpiaExport.body.length : 0}\n`)
    record(
      dpiaExport.res.ok && dpiaExport.res.headers.get("content-type")?.includes("application/pdf"),
      "DPIA exports as client dossier PDF",
      dpiaExport.res.headers.get("content-type") || `HTTP ${dpiaExport.res.status}`
    )
  }

  const trainingExport = await request("/api/gdpr/training/export")
  await writeText("03e-training-export-check.txt", `status=${trainingExport.res.status}\ncontent-type=${trainingExport.res.headers.get("content-type")}\nbytes=${Buffer.isBuffer(trainingExport.body) ? trainingExport.body.length : 0}\n`)
  record(
    trainingExport.res.ok && trainingExport.res.headers.get("content-type")?.includes("application/pdf"),
    "GDPR training register exports as evidence PDF",
    trainingExport.res.headers.get("content-type") || `HTTP ${trainingExport.res.status}`
  )

  const dpaFinding = findDocumentBackedDpaFinding(migratedState)
  record(Boolean(dpaFinding), "Imported client has a real DPA/vendor finding", dpaFinding?.title || "missing")
  requireCheck(dpaFinding?.id, "No DPA finding found")

  const generated = await request("/api/documents/generate", {
    method: "POST",
    body: JSON.stringify({
      documentType: "dpa",
      sourceFindingId: dpaFinding.id,
      orgName: clientName,
      orgCui: clientCui,
      orgSector: "health",
      dpoEmail: "diana@dpocomplet.ro",
      counterpartyName,
      counterpartyReferenceUrl: "https://stripe.com/legal/dpa",
      dataFlows: "Plăți online, facturare, confirmări tranzacții și suport clienți.",
    }),
  })
  await writeText("04-generated-dpa.json", JSON.stringify(generated.body, null, 2))
  record(generated.res.ok && generated.body.recordId, "Diana generates a real DPA document for the finding", generated.body.title || generated.text)
  record(String(generated.body.content || "").includes(clientName), "Generated DPA substitutes client name")
  record(String(generated.body.content || "").includes(counterpartyName), "Generated DPA substitutes counterparty")
  record(String(generated.body.content || "").includes("Clauză cabinet Diana"), "Generated DPA uses Diana cabinet template clause")

  const share = await request("/api/reports/share-token", {
    method: "POST",
    body: JSON.stringify({
      recipientType: "client",
      documentId: generated.body.recordId,
      documentTitle: generated.body.title,
    }),
  })
  record(Boolean(share.res.ok && share.body.token), "Diana creates document-specific magic link", share.body.token ? "token generated" : share.text)
  requireCheck(share.body.token, "Missing share token")

  const sharedPage = await publicRequest(`/shared/${share.body.token}`)
  await writeText("05-shared-document-before-approval.html", sharedPage.text)
  record(sharedPage.res.ok, "Client opens shared document page", `HTTP ${sharedPage.res.status}`)
  record(sharedPage.text.includes("DPO Complet") && sharedPage.text.includes(clientName), "Shared page is white-label and client-specific")
  record(
    sharedPage.text.includes("Aprob") || sharedPage.text.includes("SharedApprovalPanel"),
    "Shared page exposes document approval flow"
  )

  const approval = await publicRequest(`/api/shared/${share.body.token}/approve`, {
    method: "POST",
  })
  await writeText("06-approval-response.json", JSON.stringify(approval.body, null, 2))
  record(approval.res.ok && approval.body.document?.adoptionStatus === "signed", "Client approves DPA through magic link", approval.text)

  const afterApproval = await request("/api/dashboard")
  const approvedState = afterApproval.body.state || {}
  const approvedDoc = (approvedState.generatedDocuments || []).find(
    (document) => document.id === generated.body.recordId
  )
  const approvalTask = approvedState.taskState?.[`document-approval-${generated.body.recordId}`]
  record(approvedDoc?.adoptionStatus === "signed", "Document adoptionStatus is signed in dashboard state", approvedDoc?.adoptionStatus || "missing")
  record(
    approvalTask?.attachedEvidenceMeta?.quality?.status === "sufficient",
    "Magic-link approval becomes sufficient evidence",
    approvalTask?.attachedEvidenceMeta?.fileName || "missing"
  )
  record(
    (approvedState.events || []).some((event) => event.type === "document.shared_approved"),
    "Event ledger records document.shared_approved"
  )

  const confirmationChecklist = ["content-reviewed", "facts-confirmed", "approved-for-evidence"]
  const validationChecklist = ["validation-reviewed", "validation-ready"]
  const confirmFinding = await request(`/api/findings/${encodeURIComponent(dpaFinding.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "confirmed",
      generatedDocumentId: generated.body.recordId,
      confirmationChecklist,
      validationChecklist,
      evidenceNote: "Diana a verificat draftul DPA și aprobarea clientului capturată prin magic link.",
    }),
  })
  record(confirmFinding.res.ok, "Diana validates the generated DPA against the finding", confirmFinding.body.feedbackMessage || confirmFinding.text)

  const resolveFinding = await request(`/api/findings/${encodeURIComponent(dpaFinding.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "resolved",
      evidenceNote: "DPA aprobat prin magic link și pregătit pentru dosarul clientului.",
    }),
  })
  record(resolveFinding.res.ok, "Diana resolves the finding with the approved DPA", resolveFinding.body.feedbackMessage || resolveFinding.text)

  const dossierFinding = await request(`/api/findings/${encodeURIComponent(dpaFinding.id)}`, {
    method: "PATCH",
    body: JSON.stringify({
      status: "under_monitoring",
      generatedDocumentId: generated.body.recordId,
      evidenceNote: "DPA salvat în Dosar; următorul review la schimbarea procesatorului sau expirarea documentului.",
    }),
  })
  record(dossierFinding.res.ok, "Diana sends the document-backed finding to Dosar / monitoring", dossierFinding.body.feedbackMessage || dossierFinding.text)

  const finalDashboard = await request("/api/dashboard")
  const finalState = finalDashboard.body.state || {}
  await writeText("07-dashboard-final-client.json", JSON.stringify(finalState, null, 2))
  const finalFinding = (finalState.findings || []).find((finding) => finding.id === dpaFinding.id)
  const finalDoc = (finalState.generatedDocuments || []).find((document) => document.id === generated.body.recordId)
  record(finalFinding?.findingStatus === "under_monitoring", "Finding is under monitoring after full closure", finalFinding?.findingStatus || "missing")
  record(finalDoc?.approvalStatus === "approved_as_evidence", "Generated DPA is approved_as_evidence in Dosar", finalDoc?.approvalStatus || "missing")

  const auditPack = await request("/api/exports/audit-pack")
  await writeText("08-audit-pack-client.json", JSON.stringify(auditPack.body, null, 2))
  record(auditPack.res.ok, "Audit Pack exports for new imported client")
  record(auditPack.body.workspace?.orgName === clientName || auditPack.text.includes(clientName), "Audit Pack belongs to imported client")
  record(
    (auditPack.body.evidenceLedger || []).some((entry) =>
      String(entry.sourceDocument || entry.title || "").includes(generated.body.title)
    ),
    "Audit Pack evidence ledger includes approved DPA evidence"
  )
  record(
    auditPack.body.issuer?.cabinetName === "DPO Complet" ||
      auditPack.body.issuer?.cabinetName === "DPO Complet SRL" ||
      auditPack.text.includes("DPO Complet"),
    "Audit Pack carries cabinet identity"
  )

  await switchToOrg("DPO Complet SRL")
  const monthly = await request("/api/partner/reports/monthly", {
    method: "POST",
    body: JSON.stringify({ clientOrgId: imported.orgId }),
  })
  await writeText("09-monthly-report-client.json", JSON.stringify(monthly.body, null, 2))
  if (monthly.body.html) await writeText("10-monthly-report-client.html", monthly.body.html)
  record(monthly.res.ok, "Diana generates client monthly report on-demand", `HTTP ${monthly.res.status}`)
  record((monthly.body.activities || []).length > 0, "Monthly report has real activities from generated/approved DPA", (monthly.body.activities || []).join(" | "))
  record(String(monthly.body.html || "").includes(clientName), "Client-facing monthly HTML names the imported client")
  record(String(monthly.body.html || "").includes("DPO Complet"), "Client-facing monthly HTML is cabinet-branded")
  const monthlyPdf = await request(`/api/partner/reports/monthly/pdf?clientOrgId=${encodeURIComponent(imported.orgId)}`)
  await writeText("10b-monthly-report-pdf-check.txt", `status=${monthlyPdf.res.status}\ncontent-type=${monthlyPdf.res.headers.get("content-type")}\nbytes=${Buffer.isBuffer(monthlyPdf.body) ? monthlyPdf.body.length : 0}\n`)
  record(
    monthlyPdf.res.ok && monthlyPdf.res.headers.get("content-type")?.includes("application/pdf"),
    "Monthly report exports as client-facing PDF",
    monthlyPdf.res.headers.get("content-type") || `HTTP ${monthlyPdf.res.status}`
  )

  const partnerExport = await request("/api/partner/export")
  await writeText("11-cabinet-export-after-flow.json", JSON.stringify(partnerExport.body, null, 2))
  record(partnerExport.res.ok, "Cabinet export still works after imported-client workflow")
  record(
    JSON.stringify(partnerExport.body).includes(clientName) &&
      JSON.stringify(partnerExport.body).includes("DPO Complet — DPA Diana real template"),
    "Cabinet export contains imported client and Diana template library"
  )

  const trustPack = await request("/api/partner/trust-pack")
  await writeText("12-trust-pack-pdf-check.txt", `status=${trustPack.res.status}\ncontent-type=${trustPack.res.headers.get("content-type")}\nbytes=${Buffer.isBuffer(trustPack.body) ? trustPack.body.length : 0}\n`)
  record(
    trustPack.res.ok && trustPack.res.headers.get("content-type")?.includes("application/pdf"),
    "DPO Trust Pack exports as PDF",
    trustPack.res.headers.get("content-type") || `HTTP ${trustPack.res.status}`
  )

  const emailTest = await request("/api/partner/email-test", {
    method: "POST",
    body: JSON.stringify({ to: EMAIL_TEST_TO }),
  })
  await writeText("13-email-test.json", JSON.stringify(emailTest.body, null, 2))
  record(emailTest.res.ok && emailTest.body.ok, "Email live test endpoint responds", emailTest.body.message || emailTest.text)

  const failed = checks.filter((check) => !check.ok)
  const report = {
    generatedAtISO: new Date().toISOString(),
    baseUrl: BASE,
    scenario: "dpo-sale-readiness-full-workflow",
    consultant: "Diana Popescu, CIPP/E",
    cabinet: "DPO Complet SRL",
    importedClient: { orgId: imported.orgId, orgName: clientName, cui: clientCui },
    generatedDocument: { id: generated.body.recordId, title: generated.body.title },
    checks,
    failed,
    artifacts,
  }
  await writeText("runtime-sale-readiness-report.json", JSON.stringify(report, null, 2))
  await writeText(
    "README.md",
    [
      "# CompliScan — DPO Sale Readiness Full Workflow",
      "",
      `Generat: ${report.generatedAtISO}`,
      `Client importat: ${clientName}`,
      "",
      failed.length === 0
        ? `PASS — ${checks.length}/${checks.length} verificări trecute.`
        : `FAIL — ${checks.length - failed.length}/${checks.length} verificări trecute, ${failed.length} eșuate.`,
      "",
      "Flow verificat: import client pseudonimizat → baseline scan → import istoric → DPIA → training export → ANSPDCP export → finding DPA real → template cabinet real → document DPA → magic link document-specific → aprobare client → evidence ledger → Dosar/monitoring → raport lunar PDF → audit pack → trust pack → export cabinet → email test.",
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
