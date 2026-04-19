/**
 * CONSULTANT IMPORT FLOW TEST (Diana)
 *
 * Testează flow-ul complet:
 *  1. Register + partner onboarding
 *  2. Lands on /portfolio (empty state)
 *  3. Opens ImportWizard
 *  4. Uploads CSV
 *  5. Walks through mapping/review/execute
 *  6. Verifies clients appear in portfolio
 *  7. Drills into first client → inspects cockpit
 *
 * Output: /tmp/consultant-import-flow.json
 */

import { test, type Page, type BrowserContext } from "@playwright/test"
import fs from "fs"
import path from "path"

const BASE = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001"
const ts = Date.now()
const EMAIL = `diana-import-${ts}@test.local`
const PASS = "DianaTest123!"
const ORG = `Cabinet Diana Import ${ts}`
const CSV_PATH = "/tmp/test-clients.csv"

let sharedSessionCookie = ""

const report: Record<string, unknown> = {
  base: BASE,
  email: EMAIL,
  steps: [] as unknown[],
  timings: {} as Record<string, number>,
}

function step(name: string, data: unknown) {
  const entry = { step: name, data, at: new Date().toISOString() }
  ;(report.steps as unknown[]).push(entry)
  fs.writeFileSync("/tmp/consultant-import-flow.json", JSON.stringify(report, null, 2))
  console.log(`  → ${name}`)
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

test.describe.serial("Consultant Import Flow — Diana", () => {
  test("A. Register + partner onboarding", async ({ playwright }) => {
    const apiCtx = await playwright.request.newContext({ baseURL: BASE })
    const reg = await apiCtx.post("/api/auth/register", { data: { email: EMAIL, password: PASS, orgName: ORG } })
    step("register", { status: reg.status(), ok: reg.ok() })

    const setMode = await apiCtx.post("/api/auth/set-user-mode", { data: { mode: "partner" } })
    step("set-mode", { status: setMode.status() })

    const ws = await apiCtx.post("/api/org/partner-workspace", {
      data: { orgName: ORG, clientScale: "5-20" },
    })
    step("partner-workspace", { status: ws.status() })

    const select = await apiCtx.post("/api/auth/select-workspace", { data: { workspaceMode: "portfolio" } })
    step("select-workspace", { status: select.status() })

    const storage = await apiCtx.storageState()
    sharedSessionCookie = storage.cookies.find((c) => c.name === "compliscan_session")?.value || ""
    step("cookie-captured", { ok: sharedSessionCookie.length > 0 })
    await apiCtx.dispose()
  })

  test("B. Portfolio empty state — verify fix", async ({ page, context }) => {
    await seedContext(context)
    await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    const h1 = await page.$eval("h1", (el) => el.textContent?.trim()).catch(() => null)
    step("h1-present", { value: h1 })

    const emptyStateTitle = await page.getByText("Niciun client încă").count()
    step("empty-state-visible", { count: emptyStateTitle })

    const primaryBtn = await page.getByRole("button", { name: /adaugă primul client/i }).count()
    step("primary-cta-visible", { count: primaryBtn })

    await page.screenshot({ path: "/tmp/step-B-portfolio-empty.png", fullPage: true })
  })

  test("C. Open ImportWizard + upload CSV", async ({ page, context }) => {
    await seedContext(context)
    await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    await page.getByRole("button", { name: /adaugă primul client/i }).click()
    await page.waitForTimeout(1000)
    step("wizard-opened", { url: page.url() })

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(CSV_PATH)
    step("csv-uploaded", { path: CSV_PATH })
    await page.waitForTimeout(3000)

    await page.screenshot({ path: "/tmp/step-C-after-upload.png", fullPage: true })

    const bodyText = (await page.textContent("body")) || ""
    const errors = bodyText.match(/eroare|invalid|nu am putut|failed/gi) || []
    step("post-upload-errors", { errors: errors.slice(0, 5) })

    const currentStepLabel = await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('[role="tab"], button, li'))
      const active = tabs.find((t) => t.classList.toString().match(/active|selected|current|bg-eos-primary/))
      return active?.textContent?.trim().slice(0, 40) || null
    })
    step("current-step-label", { value: currentStepLabel })
  })

  test("D. Walk mapping → review → execute", async ({ page, context }) => {
    await seedContext(context)
    await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(2500)

    await page.getByRole("button", { name: /adaugă primul client/i }).click()
    await page.waitForTimeout(1000)

    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(CSV_PATH)
    await page.waitForTimeout(3500)

    for (let i = 0; i < 4; i++) {
      const nextCandidates = await page.$$eval("button", (els) =>
        els
          .map((e) => ({
            text: (e.textContent || "").trim(),
            disabled: (e as HTMLButtonElement).disabled,
            visible: (e as HTMLElement).offsetParent !== null,
          }))
          .filter((b) => b.visible && !b.disabled)
          .filter((b) => /continuă|înainte|următorul|next|confirmă|import|salvează|execută/i.test(b.text))
          .slice(0, 5)
      )
      step(`iteration-${i}-buttons`, { candidates: nextCandidates })

      if (nextCandidates.length === 0) {
        step(`iteration-${i}-stop`, { reason: "no-action-button-found" })
        break
      }

      const firstBtn = nextCandidates[0]
      try {
        await page.getByRole("button", { name: firstBtn.text, exact: false }).first().click({ timeout: 5000 })
        await page.waitForTimeout(2500)
        step(`iteration-${i}-clicked`, { clicked: firstBtn.text, urlAfter: page.url() })
      } catch (err) {
        step(`iteration-${i}-click-failed`, { err: (err as Error).message.slice(0, 200) })
        break
      }

      const stillWizard = (await page.$('[role="dialog"], [class*="wizard"], [class*="modal"]').catch(() => null)) !== null
      if (!stillWizard) {
        step(`iteration-${i}-wizard-closed`, { url: page.url() })
        break
      }
    }

    await page.screenshot({ path: "/tmp/step-D-after-wizard.png", fullPage: true })

    await page.goto(`${BASE}/portfolio`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3000)

    const clientRows = await page.$$eval("tr, [role='row'], [data-orgid], [class*='client-row']", (els) => els.length).catch(() => 0)
    step("client-rows-count", { count: clientRows })

    const pageText = ((await page.textContent("body")) || "").replace(/\s+/g, " ")
    const found = {
      logitrans: pageText.includes("LogiTrans"),
      medihealth: pageText.includes("MediHealth"),
      techretail: pageText.includes("TechRetail"),
    }
    step("clients-visible-on-portfolio", found)
  })

  test("E. API probe — what endpoints accept after import", async ({ playwright }) => {
    const apiCtx = await playwright.request.newContext({
      baseURL: BASE,
      extraHTTPHeaders: sharedSessionCookie ? { Cookie: `compliscan_session=${sharedSessionCookie}` } : {},
    })

    const overview = await apiCtx.get("/api/portfolio/overview")
    step("api-portfolio-overview", { status: overview.status(), body: (await overview.text()).slice(0, 800) })

    const clients = await apiCtx.get("/api/partner/clients")
    step("api-partner-clients", { status: clients.status(), body: (await clients.text()).slice(0, 800) })

    await apiCtx.dispose()
  })

  test("Z. Save report", async () => {
    fs.writeFileSync("/tmp/consultant-import-flow.json", JSON.stringify(report, null, 2))
    console.log(`\nReport saved: /tmp/consultant-import-flow.json (${(report.steps as unknown[]).length} steps)\n`)
  })
})
