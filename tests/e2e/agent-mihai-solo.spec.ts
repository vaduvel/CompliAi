/**
 * AGENT MIHAI — Proprietar / Manager IMM
 *
 * Caracter: Mihai are 42 de ani, conduce un IMM de 25 angajați în IT.
 * Nu știe GDPR, NIS2, e-Factura — dar știe că are probleme.
 * Vrea soluții simple, rapide, fără birocrație.
 *
 * Flow de test:
 * 1. Înregistrare → onboarding solo
 * 2. Dashboard → home/cockpit
 * 3. Scan site (Puppeteer) → findings
 * 4. Rezolvă finding GDPR-001 (Privacy Policy)
 * 5. Dosar → documentele generate
 * 6. e-Factura validator
 * 7. Cookie banner generator
 * 8. RoPA generator
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
  await page.screenshot({ path: `/tmp/mihai-${name}.png`, fullPage: false })
  logEmoji("📸", `Screenshot: /tmp/mihai-${name}.png`)
}

test.describe("AGENT MIHAI — Solo IMM (Proprietar/Manager)", () => {
  let cookie: string
  const email = `mihai-test-${ts}@test.ro`

  test.beforeAll(async () => {
    console.log("\n=== AGENT MIHAI ===")
    console.log("  Personaj: Proprietar IMM, 42 ani, IT firmă, 25 angajați")
    console.log("  Obiectiv: GDPR + e-Factura + cookie compliance\n")
    cookie = await registerAndLogin(email, "TechMihai SRL")
    expect(cookie.length).toBeGreaterThan(10)
  })

  test("01. Onboarding — selectare Solo", async ({ page }) => {
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
    const hasOnboarding = html.includes("Cum vei folosi") || html.includes("solo") || html.includes("Rolul")
    logEmoji("1️⃣", `Onboarding page: ${hasOnboarding ? "✅" : "❌"}`)
    await screenshot(page, "01-onboarding")

    expect(hasOnboarding).toBeTruthy()
  })

  test("02. Dashboard — cockpit principal", async ({ page }) => {
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
    const hasSidebar = html.includes("Scanează") || html.includes("Rezolvat") || html.includes("Acasă")
    logEmoji("2️⃣", `Dashboard: ${no404 ? "✅ loaded" : "❌ 404"} | Sidebar: ${hasSidebar ? "✅" : "❌"}`)
    await screenshot(page, "02-dashboard")

    expect(no404).toBeTruthy()
  })

  test("03. Acasă / Home — status curent", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/home`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("3️⃣", `Home page: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "03-home")

    expect(no404).toBeTruthy()
  })

  test("04. Scan — inițializare scan site", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/scan`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const hasScanUI = html.includes("Scan") || html.includes("site") || html.includes("URL")
    logEmoji("4️⃣", `Scan page: ${hasScanUI ? "✅" : "❌"}`)
    await screenshot(page, "04-scan")

    expect(hasScanUI).toBeTruthy()
  })

  test("05. Rezolvat — findings existente", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/resolve`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("5️⃣", `Resolve page: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "05-resolve")

    expect(no404).toBeTruthy()
  })

  test("06. Dosar — documente și dovezi", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/dosar`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasDosar = html.includes("Dosar") || html.includes("Documente") || html.includes("dovezi")
    logEmoji("6️⃣", `Dosar: ${no404 ? "✅" : "❌"} | Content: ${hasDosar ? "✅" : "❌"}`)
    await screenshot(page, "06-dosar")

    expect(no404).toBeTruthy()
  })

  test("07. e-Factura — validator fiscal", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/fiscal`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasFiscal = html.includes("Factura") || html.includes("fiscal") || html.includes("Validat")
    logEmoji("7️⃣", `e-Factura: ${no404 ? "✅" : "❌"} | UI: ${hasFiscal ? "✅" : "❌"}`)
    await screenshot(page, "07-fiscal")

    expect(no404).toBeTruthy()
  })

  test("08. Documente Hub — generare documente", async ({ page }) => {
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
    const hasDocs = html.includes("Generează") || html.includes("Documente") || html.includes("Politică")
    logEmoji("8️⃣", `Documente Hub: ${no404 ? "✅" : "❌"} | Content: ${hasDocs ? "✅" : "❌"}`)
    await screenshot(page, "08-documente")

    expect(no404).toBeTruthy()
  })

  test("09. RoPA — registru de prelucrări", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/ropa`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasRoPA = html.includes("RoPA") || html.includes("Registru") || html.includes("Activitate")
    logEmoji("9️⃣", `RoPA: ${no404 ? "✅" : "❌"} | UI: ${hasRoPA ? "✅" : "❌"}`)
    await screenshot(page, "09-ropa")

    expect(no404).toBeTruthy()
  })

  test("10. Setări — configurare cont", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/settings`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("🔟", `Setări: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "10-settings")

    expect(no404).toBeTruthy()
  })
})
