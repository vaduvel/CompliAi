/**
 * AGENT DIANA — Consultant / Contabil
 *
 * Caracter: Diana are 35 de ani, consultant GDPR, are 80 de clienți IMM.
 * Ea nu e utilizatorul final — e intermediarul care gestionează multiple firme.
 * Vrea: portfolio, CSV import, rapoarte rapide, cross-client view.
 *
 * Flow de test:
 * 1. Înregistrare → onboarding partner
 * 2. Portfolio → dashboard multi-client
 * 3. Partner workspace → client management
 * 4. CSV import workflow
 * 5. Vendor review — gestionează riscuri furnizori
 * 6. Rapoarte — generează dovezi pentru clienți
 * 7. Trust Center — profil public de compliance
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
  await page.screenshot({ path: `/tmp/diana-${name}.png`, fullPage: false })
  logEmoji("📸", `Screenshot: /tmp/diana-${name}.png`)
}

test.describe("AGENT DIANA — Partner Consultant", () => {
  let cookie: string
  const email = `diana-test-${ts}@test.ro`

  test.beforeAll(async () => {
    console.log("\n=== AGENT DIANA ===")
    console.log("  Personaj: Consultant GDPR, 35 ani, 80 clienți IMM")
    console.log("  Obiectiv: Portfolio, CSV import, rapoarte, vendor management\n")
    cookie = await registerAndLogin(email, "Cabinet Diana SRL")
    expect(cookie.length).toBeGreaterThan(10)
  })

  test("01. Onboarding — selectare Partner", async ({ page }) => {
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
    const hasPartner = html.includes("partner") || html.includes("Consultant") || html.includes("Contabil")
    logEmoji("1️⃣", `Onboarding partner option: ${hasPartner ? "✅" : "❌"}`)
    await screenshot(page, "01-onboarding")

    expect(hasPartner).toBeTruthy()
  })

  test("02. Portfolio — dashboard multi-client", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/portfolio`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasPortfolio = html.includes("Portofoliu") || html.includes("portfolio") || html.includes("clienți")
    logEmoji("2️⃣", `Portfolio: ${no404 ? "✅" : "❌"} | Content: ${hasPortfolio ? "✅" : "❌"}`)
    await screenshot(page, "02-portfolio")

    expect(no404).toBeTruthy()
  })

  test("03. Partner dashboard", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/partner`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("3️⃣", `Partner dashboard: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "03-partner")

    expect(no404).toBeTruthy()
  })

  test("04. Partner — import CSV workflow", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/partner`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    const hasImport = html.includes("import") || html.includes("CSV") || html.includes("Import") || html.includes("adaug")
    logEmoji("4️⃣", `Import CSV: ${no404 ? "✅" : "❌"} | UI: ${hasImport ? "✅" : "❌"}`)
    await screenshot(page, "04-import")

    expect(no404).toBeTruthy()
  })

  test("05. Vendor review — management furnizori", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/vendor-review`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("5️⃣", `Vendor review: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "05-vendor")

    expect(no404).toBeTruthy()
  })

  test("06. Rapoarte — dovezi pentru clienți", async ({ page }) => {
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
    logEmoji("6️⃣", `Rapoarte: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "06-rapoarte")

    expect(no404).toBeTruthy()
  })

  test("07. Calendar — deadlineuri compliance", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/calendar`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("7️⃣", `Calendar: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "07-calendar")

    expect(no404).toBeTruthy()
  })

  test("08. Alerte — notificări active", async ({ page }) => {
    await page.context().addCookies([{
      name: "compliscan_session",
      value: cookie.split("=")[1]?.split(";")[0] || "",
      domain: ".compliscanag.vercel.app",
      path: "/",
    }])
    await page.goto(`${BASE}/dashboard/alerte`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const no404 = !html.includes('"statusCode":404')
    logEmoji("8️⃣", `Alerte: ${no404 ? "✅" : "❌"}`)
    await screenshot(page, "08-alerte")

    expect(no404).toBeTruthy()
  })

  test("09. Documente — generează documente pentru clienți", async ({ page }) => {
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

  test("10. Setări — configurație cont partner", async ({ page }) => {
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
