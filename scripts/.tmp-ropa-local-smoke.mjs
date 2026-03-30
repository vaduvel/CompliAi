import process from "node:process"

import { chromium } from "@playwright/test"

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3201"
const CHROME_PATH =
  process.env.SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

function assertOk(condition, message) {
  if (!condition) throw new Error(message)
}

function extractSessionCookie(setCookie) {
  const match = setCookie?.match(/compliscan_session=([^;]+)/)
  assertOk(match, "Nu am primit cookie-ul de sesiune.")
  return match[1]
}

async function registerUser() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `ropa-smoke-${Date.now()}@test.ro`,
      password: "TestPass123!",
      orgName: "RoPA Smoke Org",
    }),
  })

  assertOk(response.ok, `Register a eșuat cu status ${response.status}.`)
  return extractSessionCookie(response.headers.get("set-cookie"))
}

async function setUserMode(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/auth/set-user-mode`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `compliscan_session=${sessionCookie}`,
    },
    body: JSON.stringify({ mode: "compliance" }),
  })

  assertOk(response.ok, `Setarea modului a eșuat cu status ${response.status}.`)
  return extractSessionCookie(response.headers.get("set-cookie"))
}

async function completeOnboarding(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/org/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `compliscan_session=${sessionCookie}`,
    },
    body: JSON.stringify({
      sector: "professional-services",
      employeeCount: "10-49",
      usesAITools: false,
      requiresEfactura: false,
      intakeAnswers: {
        sellsToConsumers: "no",
        hasEmployees: "no",
        processesPersonalData: "yes",
        usesExternalVendors: "no",
        hasSiteWithForms: "no",
        hasStandardContracts: "yes",
        hasPrivacyPolicy: "yes",
        hasDsarProcess: "yes",
        hasRopaRegistry: "no",
        hasRetentionSchedule: "yes",
      },
    }),
  })

  assertOk(response.ok, `Onboardingul a eșuat cu status ${response.status}.`)
}

async function getRopaFinding(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { cookie: `compliscan_session=${sessionCookie}` },
  })
  assertOk(response.ok, `Dashboard payload a eșuat cu status ${response.status}.`)

  const payload = await response.json()
  const finding = payload.state.findings.find(
    (item) =>
      item.id === "intake-gdpr-ropa-missing" ||
      item.id === "intake-gdpr-ropa-update" ||
      item.suggestedDocumentType === "ropa"
  )

  assertOk(finding, "Nu am găsit un finding ROPA în dashboard.")
  return finding
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body.textContent?.includes(expected), {}, text)
}

async function main() {
  const log = (step, details) => {
    const suffix = details ? ` ${JSON.stringify(details)}` : ""
    console.log(`[ropa-smoke] ${step}${suffix}`)
  }

  log("register:start")
  const registeredCookie = await registerUser()
  log("register:ok")
  const sessionCookie = await setUserMode(registeredCookie)
  log("mode:ok")
  await completeOnboarding(sessionCookie)
  log("onboarding:ok")
  const finding = await getRopaFinding(sessionCookie)
  log("finding:ok", { id: finding.id, findingTypeId: finding.findingTypeId ?? null })

  const browser = await chromium.launch({
    headless: true,
    executablePath: CHROME_PATH,
  })
  log("browser:launched")

  try {
    const context = await browser.newContext()
    const { hostname } = new URL(BASE_URL)
    await context.addCookies([
      {
        name: "compliscan_session",
        value: sessionCookie,
        domain: hostname,
        path: "/",
        httpOnly: false,
        secure: false,
      },
    ])

    const page = await context.newPage()
    page.on("pageerror", (error) => {
      console.log(`[ropa-smoke] pageerror ${error.message}`)
    })
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        console.log(`[ropa-smoke] console:${msg.type()} ${msg.text()}`)
      }
    })

    await page.goto(`${BASE_URL}/dashboard/resolve/${finding.id}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    })
    log("resolve:loaded")

    await page
      .locator('[data-testid="confirm-and-generate"], [data-testid="confirm-finding"], [data-testid="confirm-and-open-workflow"]')
      .first()
      .waitFor({ timeout: 90_000 })
    log("resolve:cta-ready")

    const buttonLabels = await page.getByRole("button").allTextContents()
    const testIds = await page.locator("[data-testid]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-testid")).filter(Boolean)
    )
    log("resolve:buttons", { buttonLabels, testIds })

    const confirmAndGenerate = page.getByTestId("confirm-and-generate")
    const confirmFinding = page.getByTestId("confirm-finding")
    if (await confirmAndGenerate.count()) {
      await confirmAndGenerate.click()
      log("resolve:confirmed", { strategy: "confirm-and-generate" })
    } else if (await confirmFinding.count()) {
      await confirmFinding.click()
      log("resolve:confirmed", { strategy: "confirm-finding" })
    } else {
      throw new Error(`Nu am găsit buton de confirmare. Test IDs: ${JSON.stringify(testIds)}`)
    }
    await page.waitForLoadState("networkidle", { timeout: 30_000 })
    const postConfirmButtons = await page.getByRole("button").allTextContents()
    const postConfirmTestIds = await page.locator("[data-testid]").evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("data-testid")).filter(Boolean)
    )
    const postConfirmBody = (await page.locator("body").innerText()).slice(0, 1000)
    log("resolve:post-confirm-ui", {
      url: page.url(),
      postConfirmButtons,
      postConfirmTestIds,
      postConfirmBody,
    })
    const openRopaButton = page.getByRole("link", { name: "Deschide RoPA" })
    await openRopaButton.waitFor({ timeout: 60_000 })
    log("resolve:generator-visible", {
      tagName: await openRopaButton.evaluate((node) => node.tagName),
      html: await openRopaButton.evaluate((node) => node.outerHTML),
    })
    await openRopaButton.click()
    await page.waitForTimeout(1000)
    log("resolve:after-open-click", { url: page.url() })
    await page.waitForFunction(() => window.location.pathname.includes("/dashboard/ropa"), {
      timeout: 30_000,
    })
    log("ropa:url", { url: page.url() })
    await page.getByPlaceholder("ex. Facturare clienți").waitFor({ timeout: 30_000 })
    log("ropa:loaded")

    await page.getByPlaceholder("ex. Facturare clienți").fill("Facturare clienți")
    await page
      .getByPlaceholder("ex. Emiterea facturilor și gestionarea plăților")
      .fill("Emiterea facturilor și gestionarea plăților")
    await page.locator("select").first().selectOption("6(1)(b)")

    await page.getByLabel("Am verificat toate câmpurile").check()
    await page.getByLabel("Datele reflectă firma reală").check()
    await page.getByLabel("Îl aprob ca dovadă de conformitate").check()
    await page
      .getByPlaceholder("Ex: RoPA conține 5 activități de prelucrare, actualizat la data de azi.")
      .fill("RoPA conține activitatea de facturare și a fost revizuit în smoke.")

    await page.getByRole("button", { name: "Salvează RoPA și revino în cockpit" }).click()
    await page.waitForFunction(
      (expectedPath) => window.location.pathname === expectedPath,
      `/dashboard/resolve/${finding.id}`,
      { timeout: 120_000 }
    )
    log("ropa:return-to-resolve")
    await page.getByTestId("send-document-to-dosar").waitFor({ timeout: 120_000 })
    await waitForText(page, "documentul confirmat")
    log("resolve:dossier-ready")

    await page.getByTestId("send-document-to-dosar").click()
    await page.getByTestId("finding-dossier-success").waitFor({ timeout: 30_000 })
    log("dosar:handoff-ok")

    await page.goto(`${BASE_URL}/dashboard/dosar`, {
      waitUntil: "networkidle",
      timeout: 60_000,
    })
    await waitForText(page, "Registru de Prelucrări")
    log("dosar:contains-ropa")

    console.log(
      JSON.stringify(
        {
          ok: true,
          baseUrl: BASE_URL,
          findingId: finding.id,
          findingTypeId: finding.findingTypeId,
          returnedToCockpit: true,
          dossierSuccessVisible: true,
          dosarContainsRopa: true,
        },
        null,
        2
      )
    )
  } finally {
    await browser.close()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
