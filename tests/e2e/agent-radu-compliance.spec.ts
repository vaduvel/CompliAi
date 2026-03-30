/**
 * AGENT RADU — Responsabil Conformitate
 *
 * Caracter: Radu are 50 de ani, fost auditor, acum DPO intern la o firmă IT.
 * El cunoaște GDPR-ul bine, dar vrea instrumente de dovadă documentară.
 * Vrea: audit readiness, dosar complet, rapoarte pentru management, NIS2.
 *
 * Flow de test:
 * 1. Înregistrare → onboarding compliance
 * 2. Dashboard — audit readiness
 * 3. NIS2 assessment + DNSC registration
 * 4. DSAR workflow — gestionare cereri
 * 5. Whistleblowing — canal de raportare
 * 6. Audit log — trasabilitate
 * 7. DORA — management riscuri operaționale
 * 8. AI Systems — inventar sisteme AI
 * 9. Rapoarte — export dovezi
 */

import { test, expect, type Page } from "@playwright/test"

const BASE = "https://compliscanag.vercel.app"
const ts = Date.now()

function logEmoji(emoji: string, msg: string) {
  console.log(`  ${emoji} ${msg}`)
}

async function registerAndLogin(email: string, orgName: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123!", orgName }),
  })
  if (!res.ok) throw new Error(`Register failed: ${res.status}`)

  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "TestPass123!" }),
  })
  const setCookie = loginRes.headers.get("set-cookie") || ""
  const match = setCookie.match(/compliscan_session=([^;]+)/)
  return match ? `compliscan_session=${match[1]}` : ""
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/radu-${name}.png`, fullPage: false })
  logEmoji("📸", `Screenshot: /tmp/radu-${name}.png`)
}

test.describe("AGENT RADU — Compliance Expert (DPO)", () => {
  let cookie: string
  const email = `radu-test-${ts}@test.ro`

  test.beforeAll(async () => {
    console.log("\n=== AGENT RADU ===")
    console.log("  Personaj: DPO intern, 50 ani, fost auditor, firmă IT")
    console.log("  Obiectiv: Audit readiness, NIS2, DSAR, whistleblowing, dovezile documentare\n")
    cookie = await registerAndLogin(email, "TechCorp SRL")
    expect(cookie.length).toBeGreaterThan(10)
  })

  test("01. Onboarding — selectare Compliance", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/onboarding`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    const html = await page.content()
    const hasCompliance = html.includes("conformitate") || html.includes("Compliance") || html.includes("Responsabil")
    logEmoji("1️⃣", `Onboarding compliance option: ${hasCompliance ? "✅" : "❌"}`)
    await screenshot(page, "01-onboarding")

    expect(hasCompliance).toBeTruthy()
  })

  test("02. Dashboard — status general", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("2️⃣", `Dashboard: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "02-dashboard")

    expect(no404).toBeTruthy()
  })

  test("03. NIS2 — evaluare și DNSC", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/nis2`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasNIS2 = html.includes("NIS2") || html.includes("evaluare") || html.includes("securitate")
    logEmoji("3️⃣", `NIS2: ${no404 ? "✅" : "❌"} | UI: ${hasNIS2 ? "✅" : "❌"}`)
    await screenshot(page, "03-nis2")

    expect(no404).toBeTruthy()
  })

  test("04. DSAR — gestionare cereri", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/dsar`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasDSAR = html.includes("DSAR") || html.includes("cereri") || html.includes("subiecte")
    logEmoji("4️⃣", `DSAR: ${no404 ? "✅" : "❌"} | UI: ${hasDSAR ? "✅" : "❌"}`)
    await screenshot(page, "04-dsar")

    expect(no404).toBeTruthy()
  })

  test("05. Whistleblowing — canal de raportare", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/whistleblowing`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("5️⃣", `Whistleblowing: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "05-whistleblowing")

    expect(no404).toBeTruthy()
  })

  test("06. Audit Log — trasabilitate", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/audit-log`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("6️⃣", `Audit Log: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "06-audit-log")

    expect(no404).toBeTruthy()
  })

  test("07. DORA — reziliență operațională", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/dora`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("7️⃣", `DORA: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "07-dora")

    expect(no404).toBeTruthy()
  })

  test("08. Checklists — conformitate", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/checklists`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("8️⃣", `Checklists: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "08-checklists")

    expect(no404).toBeTruthy()
  })

  test("09. Documente — dovezi documentare", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/documente`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("9️⃣", `Documente: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "09-documente")

    expect(no404).toBeTruthy()
  })

  test("10. Rapoarte — export dovezi", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/rapoarte`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("🔟", `Rapoarte: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "10-rapoarte")

    expect(no404).toBeTruthy()
  })
})
