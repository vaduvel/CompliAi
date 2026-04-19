/**
 * CONSULTANT WORKSPACE AUDIT (Diana) — v2 cu cookie sharing corect
 *
 * Nu e test pass/fail. E audit funcțional.
 * Output: /tmp/consultant-audit.json
 */

import { test, type Page, type BrowserContext } from "@playwright/test"
import fs from "fs"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001"
const ts = Date.now()
const EMAIL = `diana-audit-${ts}@test.local`
const PASS = "DianaTest123!"
const ORG = `Cabinet Diana ${ts}`

type PageFinding = {
  route: string
  finalUrl: string
  loaded: boolean
  httpErrors: string[]
  consoleErrors: string[]
  h1s: string[]
  h2s: string[]
  visibleButtons: { text: string; disabled: boolean }[]
  forms: number
  inputs: { type: string; placeholder: string; name: string }[]
  links: { text: string; href: string }[]
  primaryCtas: string[]
  emptyStateText: string | null
  hasLoadingState: boolean
  hasSidebar: boolean
  sidebarItems: string[]
  pageTextPreview: string
  notes: string[]
}

const audit: {
  base: string
  timestamp: string
  email: string
  onboarding: Record<string, unknown>
  pages: PageFinding[]
  flows: Record<string, unknown>
} = {
  base: BASE,
  timestamp: new Date().toISOString(),
  email: EMAIL,
  onboarding: {},
  pages: [],
  flows: {},
}

let sharedSessionCookie = ""

function saveAudit() {
  fs.writeFileSync("/tmp/consultant-audit.json", JSON.stringify(audit, null, 2))
}

async function seedContext(context: BrowserContext) {
  if (!sharedSessionCookie) return
  const url = new URL(BASE)
  await context.addCookies([{
    name: "compliscan_session",
    value: sharedSessionCookie,
    domain: url.hostname,
    path: "/",
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "Lax",
  }])
}

async function capturePage(page: Page, route: string, notes: string[] = []): Promise<PageFinding> {
  const httpErrors: string[] = []
  const consoleErrors: string[] = []

  const consoleHandler = (msg: { type(): string; text(): string }) => {
    if (msg.type() === "error") consoleErrors.push(msg.text().slice(0, 200))
  }
  const responseHandler = (resp: { status(): number; url(): string }) => {
    const s = resp.status()
    if (s >= 500) httpErrors.push(`${s} ${resp.url()}`)
    else if (s === 401 || s === 403) httpErrors.push(`${s} ${resp.url()}`)
  }
  page.on("console", consoleHandler)
  page.on("response", responseHandler)

  let loaded = true
  try {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 })
  } catch (err) {
    loaded = false
    notes.push(`nav-error: ${(err as Error).message.slice(0, 120)}`)
  }
  await page.waitForTimeout(2500)
  try {
    await page.waitForLoadState("networkidle", { timeout: 5000 })
  } catch { /* ignore polling */ }
  const finalUrl = page.url()

  async function safeEval<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
    for (let i = 0; i < 3; i++) {
      try { return await fn() } catch { await page.waitForTimeout(500) }
    }
    return fallback
  }

  const h1s = await safeEval(() => page.$$eval("h1", (els) => els.map((e) => (e.textContent || "").trim()).filter(Boolean)), [])
  const h2s = await safeEval(() => page.$$eval("h2", (els) => els.map((e) => (e.textContent || "").trim()).filter(Boolean)), [])
  const visibleButtons = await safeEval(() => page.$$eval("button", (els) =>
    els
      .map((e) => ({
        text: (e.textContent || "").trim().slice(0, 80),
        visible: (e as HTMLElement).offsetParent !== null,
        disabled: (e as HTMLButtonElement).disabled,
      }))
      .filter((b) => b.text.length > 0 && b.visible)
      .map((b) => ({ text: b.text, disabled: b.disabled }))
  ), [] as { text: string; disabled: boolean }[])
  const forms = await safeEval(() => page.$$eval("form", (els) => els.length), 0)
  const inputs = await safeEval(() => page.$$eval("input, textarea, select", (els) =>
    els.map((e) => ({
      type: (e as HTMLInputElement).type || e.tagName.toLowerCase(),
      placeholder: (e as HTMLInputElement).placeholder || "",
      name: (e as HTMLInputElement).name || "",
    }))
  ), [] as { type: string; placeholder: string; name: string }[])
  const links = await safeEval(() => page.$$eval("a[href]", (els) =>
    els
      .map((e) => ({
        text: (e.textContent || "").trim().slice(0, 60),
        href: (e as HTMLAnchorElement).getAttribute("href") || "",
      }))
      .filter((l) => l.text.length > 0 && l.href.length > 0 && !l.href.startsWith("javascript:"))
  ), [] as { text: string; href: string }[])
  const primaryCtas = visibleButtons
    .filter((b) => !b.disabled)
    .filter((b) => b.text.length > 3 && b.text.length < 50)
    .slice(0, 5)
    .map((b) => b.text)

  const emptyStateText = await safeEval(() => page.evaluate(() => {
    const els = Array.from(document.querySelectorAll("p, div, span"))
    const emptyIndicators = ["niciun", "nicio", "nu există", "încă", "goal", "empty", "adaugă primul", "începe", "nu ai", "lista este", "nu am putut"]
    const candidates = els
      .map((el) => (el.textContent || "").trim())
      .filter((t) => t.length > 10 && t.length < 250)
      .filter((t) => emptyIndicators.some((ind) => t.toLowerCase().includes(ind)))
    return candidates[0] || null
  }), null as string | null)

  const hasLoadingState = await safeEval(() => page.evaluate(() =>
    !!document.querySelector("[data-loading], .animate-pulse, [aria-busy='true']")
  ), false)

  const hasSidebar = await safeEval(() => page.evaluate(() =>
    !!document.querySelector("aside, [role='navigation'], nav")
  ), false)
  const sidebarItems = await safeEval(() => page.$$eval("aside a, aside button, nav a, nav button", (els) =>
    els
      .map((e) => (e.textContent || "").trim())
      .filter((t) => t.length > 0 && t.length < 40)
      .slice(0, 20)
  ), [] as string[])

  const pageTextPreview = await safeEval(() => page.evaluate(() =>
    (document.body.innerText || document.body.textContent || "").replace(/\s+/g, " ").trim().slice(0, 400)
  ), "")

  page.off("console", consoleHandler)
  page.off("response", responseHandler)

  return {
    route,
    finalUrl,
    loaded,
    httpErrors: [...new Set(httpErrors)].slice(0, 8),
    consoleErrors: [...new Set(consoleErrors)].slice(0, 8),
    h1s,
    h2s: h2s.slice(0, 10),
    visibleButtons: visibleButtons.slice(0, 40),
    forms,
    inputs: inputs.slice(0, 20),
    links: links.slice(0, 30),
    primaryCtas,
    emptyStateText,
    hasLoadingState,
    hasSidebar,
    sidebarItems,
    pageTextPreview,
    notes,
  }
}

test.describe.serial("Consultant Workspace Audit — Diana", () => {
  test("A. Register + Partner onboarding (server-side, capture cookie)", async ({ playwright }) => {
    const apiCtx = await playwright.request.newContext({ baseURL: BASE })

    const reg = await apiCtx.post("/api/auth/register", { data: { email: EMAIL, password: PASS, orgName: ORG } })
    audit.onboarding.register = { status: reg.status(), ok: reg.ok() }

    const setMode = await apiCtx.post("/api/auth/set-user-mode", { data: { mode: "partner" } })
    audit.onboarding.setMode = { status: setMode.status(), ok: setMode.ok() }

    const ws = await apiCtx.post("/api/org/partner-workspace", {
      data: { orgName: ORG, clientScale: "5-20", cui: "RO12345678" },
    })
    audit.onboarding.partnerWorkspace = { status: ws.status(), ok: ws.ok() }

    const select = await apiCtx.post("/api/auth/select-workspace", { data: { workspaceMode: "portfolio" } })
    audit.onboarding.selectWorkspace = { status: select.status(), ok: select.ok() }

    const storage = await apiCtx.storageState()
    const sessionCookie = storage.cookies.find((c) => c.name === "compliscan_session")
    sharedSessionCookie = sessionCookie?.value || ""
    audit.onboarding.sessionCookieCaptured = sharedSessionCookie.length > 0

    await apiCtx.dispose()
    saveAudit()
  })

  const portfolioRoutes = [
    "/portfolio",
    "/portfolio/alerts",
    "/portfolio/tasks",
    "/portfolio/vendors",
    "/portfolio/reports",
  ]

  const dashboardRoutesForConsultant = [
    "/dashboard/settings",
    "/dashboard/approvals",
    "/dashboard/review",
    "/dashboard/calendar",
    "/dashboard/vendor-review",
    "/dashboard/generator",
    "/dashboard/dosar",
    "/dashboard",
  ]

  for (const route of portfolioRoutes) {
    test(`PORTFOLIO page: ${route}`, async ({ page, context }) => {
      await seedContext(context)
      const finding = await capturePage(page, route)
      audit.pages.push(finding)
      saveAudit()
    })
  }

  for (const route of dashboardRoutesForConsultant) {
    test(`DASHBOARD page: ${route}`, async ({ page, context }) => {
      await seedContext(context)
      const finding = await capturePage(page, route)
      audit.pages.push(finding)
      saveAudit()
    })
  }

  test("FLOW: Try to find Add Client button on /portfolio", async ({ page, context }) => {
    await seedContext(context)
    const flow: Record<string, unknown> = { steps: [] as unknown[] }
    const steps = flow.steps as unknown[]

    await page.goto(`${BASE}/portfolio`, { waitUntil: "networkidle" })
    await page.waitForTimeout(2000)

    const addCandidates = await page.$$eval("button, a", (els) =>
      els
        .map((e) => ({
          tag: e.tagName.toLowerCase(),
          text: (e.textContent || "").trim(),
          href: (e as HTMLAnchorElement).getAttribute("href") || null,
          visible: (e as HTMLElement).offsetParent !== null,
        }))
        .filter((e) => e.visible)
        .filter((e) => /adaug|adăug|invită|invita|import|\+ *client|client nou/i.test(e.text))
        .slice(0, 10)
    )
    steps.push({ step: "search-add-button", found: addCandidates })

    if (addCandidates.length === 0) {
      flow.verdict = "NO_ADD_BUTTON_VISIBLE"
      audit.flows["add-client-ui"] = flow
      saveAudit()
      return
    }

    const first = addCandidates[0]
    try {
      if (first.tag === "a" && first.href) {
        await page.goto(first.href.startsWith("http") ? first.href : `${BASE}${first.href}`, { waitUntil: "networkidle" })
      } else {
        await page.getByText(first.text, { exact: false }).first().click({ timeout: 5000 })
      }
      await page.waitForTimeout(2000)
      steps.push({ step: "clicked", urlAfter: page.url() })

      const afterFinding = await capturePage(page, page.url().replace(BASE, ""), ["reached-via-add-button"])
      steps.push({ step: "capture-after-click", finding: afterFinding })
      flow.verdict = "REACHED_ADD_SURFACE"
    } catch (err) {
      flow.verdict = "CLICK_FAILED"
      steps.push({ step: "click-error", err: (err as Error).message.slice(0, 200) })
    }

    audit.flows["add-client-ui"] = flow
    saveAudit()
  })

  test("FLOW: Hit partner APIs with authenticated context", async ({ playwright }) => {
    const apiCtx = await playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: sharedSessionCookie
        ? { Cookie: `compliscan_session=${sharedSessionCookie}` }
        : {},
    })

    const flow: Record<string, unknown> = { attempts: [] as unknown[] }
    const attempts = flow.attempts as unknown[]

    const calls = [
      { method: "GET" as const, url: "/api/partner/clients" },
      { method: "GET" as const, url: "/api/partner/portfolio" },
      { method: "GET" as const, url: "/api/partner/urgency-queue" },
      { method: "POST" as const, url: "/api/partner/import/anaf-prefill", data: { cui: "RO12345678" } },
      { method: "POST" as const, url: "/api/partner/clients", data: { orgName: "Test Client SRL", cui: "RO11111111" } },
    ]

    for (const c of calls) {
      try {
        const resp = c.method === "GET"
          ? await apiCtx.get(c.url)
          : await apiCtx.post(c.url, { data: c.data })
        const body = await resp.text()
        attempts.push({
          method: c.method,
          url: c.url,
          status: resp.status(),
          bodyPreview: body.slice(0, 500),
        })
      } catch (err) {
        attempts.push({ url: c.url, error: (err as Error).message.slice(0, 200) })
      }
    }

    audit.flows["partner-api-probe"] = flow
    await apiCtx.dispose()
    saveAudit()
  })

  test("Z. Save final audit", async () => {
    saveAudit()
    console.log(`\n\nAudit saved to /tmp/consultant-audit.json (${audit.pages.length} pages, ${Object.keys(audit.flows).length} flows)\n`)
  })
})
