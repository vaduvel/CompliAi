import { promises as fs } from "node:fs"
import path from "node:path"

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000"
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 20_000)
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
  if (options.body && !headers.has("content-type")) headers.set("content-type", "application/json")
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
      taskStatus: taskState[finding.id]?.status ?? "todo",
      validationStatus: taskState[finding.id]?.validationStatus ?? null,
      evidenceQuality: taskState[finding.id]?.attachedEvidenceMeta?.quality?.status ?? null,
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

  await switchToOrg(memberships, "Apex Logistic SRL")
  const apex = await loadDashboardFor("Apex Logistic SRL")
  const apexDoc = (apex.state.generatedDocuments || []).find((doc) => doc.id === "apex-doc-dpa-stripe")
  const apexApprovalTask = apex.state.taskState?.["document-approval-apex-doc-dpa-stripe"]
  record(apexDoc?.adoptionStatus === "signed", "Apex DPA Stripe is signed", apexDoc?.adoptionStatus || "missing")
  record(
    apexApprovalTask?.attachedEvidenceMeta?.quality?.status === "sufficient",
    "Apex magic-link approval evidence is sufficient"
  )

  const apexClientHtml = await request("/api/exports/audit-pack/client")
  record(apexClientHtml.res.ok, "Apex Audit Pack HTML exports", `HTTP ${apexClientHtml.res.status}`)
  record(apexClientHtml.text.includes("Apex Logistic SRL"), "Apex Audit Pack is for Apex")
  record(apexClientHtml.text.includes("DPO Complet") || apexClientHtml.text.includes("Diana Popescu"), "Apex Audit Pack carries cabinet identity")
  record(!apexClientHtml.text.includes("CompliAI"), "Apex Audit Pack contains zero CompliAI mentions")
  await writeText("exports/apex-audit-pack-client.html", apexClientHtml.text)

  const apexBundle = await request("/api/exports/audit-pack/bundle")
  record(apexBundle.res.ok, "Apex Audit Pack ZIP exports", `HTTP ${apexBundle.res.status}`)
  await writeBuffer("exports/apex-audit-pack-bundle.zip", apexBundle.body)

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
  const cobaltAiTask = cobalt.state.taskState?.["cobalt-ai-inventory-chatgpt"]
  record(cobaltAiTask?.status === "done", "Cobalt AI minimization task is closed", cobaltAiTask?.status || "missing")
  record(
    cobaltAiTask?.attachedEvidenceMeta?.quality?.status === "sufficient",
    "Cobalt AI OFF evidence is sufficient"
  )

  const share = await request("/api/reports/share-token", {
    method: "POST",
    body: JSON.stringify({
      recipientType: "partner",
      documentId: "cobalt-doc-payroll-dpa",
      documentTitle: "DPA salarizare — Cobalt Fintech IFN × PayFlow HR",
    }),
  })
  record(share.res.ok && share.body.token, "Create Cobalt magic link for client feedback", share.body.token || share.text)
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
      "- Lumen are DSAR critic în `needs_review` până la dovada trimiterii.",
      "- Cobalt are AI OFF evidence și flow comment/reject prin magic link.",
      "",
      "## Artefacte",
      "",
      "- `01-memberships.json`",
      "- `02-portfolio-initial.json`",
      "- `03-portfolio-final.json`",
      "- `dashboards/*.json`",
      "- `exports/*.html` + `exports/apex-audit-pack-bundle.zip`",
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
