import { test, expect, type Page } from "@playwright/test"

const BASE = "https://compliscanag.vercel.app"
const ts = Date.now()

async function loginViaApi(email: string, password: string): Promise<string> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const setCookie = res.headers.get("set-cookie") || ""
  const match = setCookie.match(/compliscan_session=([^;]+)/)
  return match ? `compliscan_session=${match[1]}` : ""
}

async function registerViaApi(email: string, password: string, orgName = "Test Org") {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, orgName }),
  })
  return res.json()
}

async function screenshot(page: Page, name: string) {
  await page.screenshot({ path: `/tmp/compliai-${name}.png`, fullPage: false })
  console.log(`  📸 Screenshot: /tmp/compliai-${name}.png`)
}

async function checkPage(page: Page, name: string, expected404 = false) {
  const content = await page.content()
  const is404 = content.includes('"statusCode":404') || (content.includes("404") && content.includes("not found") && !content.includes("GDPR"))
  const status = expected404 ? (is404 ? "✅ 404 expected" : `⚠️  NOT 404`) : (is404 ? `❌ 404` : "✅ OK")
  console.log(`  ${name}: ${status}`)
  if (is404 && !expected404) await screenshot(page, `error-${name}`)
  return !is404 || expected404
}

test.describe("Public pages", () => {
  test("Landing page — hero, personas, CTAs", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    const title = await page.title()
    console.log("  Title:", title)

    const h1 = await page.locator("h1").first().textContent()
    console.log("  H1:", h1?.replace(/\n/g, " "))

    const sections = await page.locator("section").count()
    console.log("  Sections:", sections)

    const ctaLinks = await page.locator('a:has-text("gratuit"), a:has-text("Începe")').count()
    console.log("  CTA buttons:", ctaLinks)

    await screenshot(page, "landing")

    expect(sections).toBeGreaterThan(0)
    expect(ctaLinks).toBeGreaterThan(0)
  })

  test("Login page renders", async ({ page }) => {
    await page.goto(`${BASE}/login`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const hasLoginContent = html.includes("Conect") || html.includes("Login") || html.includes("login") || html.includes("Email")
    console.log("  Login content visible:", hasLoginContent)
    await screenshot(page, "login")

    expect(hasLoginContent).toBeTruthy()
  })

  test("Register page renders", async ({ page }) => {
    await page.goto(`${BASE}/login?mode=register`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const hasRegisterContent = html.includes("Înregistrează") || html.includes("Creează") || html.includes("Registre")
    console.log("  Register content visible:", hasRegisterContent)
    await screenshot(page, "register")

    expect(hasRegisterContent).toBeTruthy()
  })

  test("Demo IMM page", async ({ page }) => {
    await page.goto(`${BASE}/demo/imm`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const hasDemo = html.includes("demo") || html.includes("Demo") || html.includes("IMM")
    console.log("  Demo content:", hasDemo)
    await screenshot(page, "demo-imm")
  })

  test("Pricing page", async ({ page }) => {
    await page.goto(`${BASE}/pricing`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    const html = await page.content()
    const hasPricing = html.includes("Preț") || html.includes("gratuit") || html.includes("Pro")
    console.log("  Pricing content:", hasPricing)
    await screenshot(page, "pricing")
  })
})

test.describe("MIHAI (Solo) — Authenticated pages", () => {
  let cookie: string

  test.beforeAll(async () => {
    const email = `mihai-pw-${ts}@test.ro`
    await registerViaApi(email, "TestPass123!", "Test Mihai SRL")
    cookie = await loginViaApi(email, "TestPass123!")
    console.log("  Cookie obtained:", cookie ? "YES" : "NO")
  })

  test("01. Dashboard loads", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const hasDashboard = !html.includes('"statusCode":404') && !html.includes("not found")
    console.log("  Dashboard loads:", hasDashboard ? "✅" : "❌ 404")
    console.log("  URL:", page.url())
    await screenshot(page, "mihai-dashboard")
    expect(hasDashboard).toBeTruthy()
  })

  test("02. Sidebar nav visible", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const html = await page.content()
    const navItems = ["Acasă", "Scanează", "Rezolvat", "Dosar", "Setări"]
    for (const item of navItems) {
      const found = html.includes(item)
      console.log(`  Nav "${item}": ${found ? "✅" : "❌"}`)
    }
    await screenshot(page, "mihai-sidebar")
  })

  test("03. Scan page", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/scan`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "scan")
    await screenshot(page, "mihai-scan")
    expect(ok).toBeTruthy()
  })

  test("04. De Rezolvat page", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/resolve`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "resolve")
    await screenshot(page, "mihai-resolve")
    expect(ok).toBeTruthy()
  })

  test("05. Dosar page", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/dosar`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "dosar")
    await screenshot(page, "mihai-dosar")
    expect(ok).toBeTruthy()
  })

  test("06. Settings page", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/settings`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "settings")
    await screenshot(page, "mihai-settings")
    expect(ok).toBeTruthy()
  })

  test("07. Fiscal Pre-Validator", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/fiscal`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "fiscal")
    await screenshot(page, "mihai-fiscal")
    expect(ok).toBeTruthy()
  })

  test("08. Home/Acasa page", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/home`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "home")
    await screenshot(page, "mihai-home")
    expect(ok).toBeTruthy()
  })
})

test.describe("DIANA (Partner) — Authenticated pages", () => {
  let cookie: string

  test.beforeAll(async () => {
    const email = `diana-pw-${ts}@test.ro`
    await registerViaApi(email, "TestPass123!", "Cabinet Diana SRL")
    cookie = await loginViaApi(email, "TestPass123!")
    console.log("  Cookie obtained:", cookie ? "YES" : "NO")
  })

  test("01. Dashboard loads", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "diana-dashboard")
    await screenshot(page, "diana-dashboard")
    expect(ok).toBeTruthy()
  })

  test("02. Portfolio overview", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/portfolio`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "portfolio")
    await screenshot(page, "diana-portfolio")
    expect(ok).toBeTruthy()
  })

  test("03. Partner workspace", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/partner`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "partner")
    await screenshot(page, "diana-partner")
    expect(ok).toBeTruthy()
  })

  test("04. Vendor risk register", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/vendors`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "vendors")
    await screenshot(page, "diana-vendors")
    expect(ok).toBeTruthy()
  })
})

test.describe("RADU (Compliance) — Authenticated pages", () => {
  let cookie: string

  test.beforeAll(async () => {
    const email = `radu-pw-${ts}@test.ro`
    await registerViaApi(email, "TestPass123!", "Radu Compliance SRL")
    cookie = await loginViaApi(email, "TestPass123!")
    console.log("  Cookie obtained:", cookie ? "YES" : "NO")
  })

  test("01. Dashboard loads", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "radu-dashboard")
    await screenshot(page, "radu-dashboard")
    expect(ok).toBeTruthy()
  })

  test("02. NIS2 assessment", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/nis2`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "nis2")
    await screenshot(page, "radu-nis2")
    expect(ok).toBeTruthy()
  })

  test("03. AI systems inventory", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/ai-systems`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "ai-systems")
    await screenshot(page, "radu-ai-systems")
    expect(ok).toBeTruthy()
  })

  test("04. Audit / traceability", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/traceability`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "traceability")
    await screenshot(page, "radu-traceability")
    expect(ok).toBeTruthy()
  })

  test("05. Fiscal Pre-Validator", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/fiscal`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "radu-fiscal")
    await screenshot(page, "radu-fiscal")
    expect(ok).toBeTruthy()
  })

  test("06. DPO dashboard", async ({ page }) => {
    await page.context().addCookies([{ name: "compliscan_session", value: cookie.split("=")[1]?.split(";")[0] || "", domain: ".compliscanag.vercel.app", path: "/" }])
    await page.goto(`${BASE}/dashboard/dpo`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(3000)

    const ok = await checkPage(page, "dpo")
    await screenshot(page, "radu-dpo")
    expect(ok).toBeTruthy()
  })
})

test.describe("Footer & Trust pages", () => {
  test("Footer links exist on landing", async ({ page }) => {
    await page.goto(BASE)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)

    const links = ["Termeni", "Confidențialitate", "Privacy", "Prețuri"]
    for (const link of links) {
      const el = page.locator(`footer a:has-text("${link}"), a:has-text("${link}")`).first()
      const visible = await el.isVisible({ timeout: 2000 }).catch(() => false)
      console.log(`  "${link}": ${visible ? "✅" : "❌"}`)
    }
    await screenshot(page, "footer")
  })

  test("Terms page", async ({ page }) => {
    await page.goto(`${BASE}/terms`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    const html = await page.content()
    const ok = !html.includes('"statusCode":404') && html.length > 5000
    console.log("  /terms:", ok ? "✅" : "❌")
    await screenshot(page, "terms")
  })

  test("Privacy page", async ({ page }) => {
    await page.goto(`${BASE}/privacy`)
    await page.waitForLoadState("networkidle")
    await page.waitForTimeout(2000)
    const html = await page.content()
    const ok = !html.includes('"statusCode":404') && html.length > 5000
    console.log("  /privacy:", ok ? "✅" : "❌")
    await screenshot(page, "privacy")
  })
})
