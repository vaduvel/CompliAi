import { readFile } from "node:fs/promises"
import path from "node:path"
import process from "node:process"

import puppeteer from "puppeteer-core"

const BASE_URL = process.env.SMOKE_BASE_URL ?? "http://127.0.0.1:3301"
const CHROME_PATH =
  process.env.SMOKE_BROWSER_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

function assertOk(condition, message) {
  if (!condition) throw new Error(message)
}

async function waitForSelectorWithDebug(page, selector, timeout = 30_000) {
  try {
    await page.waitForSelector(selector, { timeout })
  } catch {
    const text = await page.evaluate(() => document.body.textContent?.slice(0, 1200) ?? "")
    throw new Error(
      `Waiting for selector \`${selector}\` failed. URL: ${page.url()}. Body: ${text}`
    )
  }
}

function getSessionCookie(setCookie) {
  const match = setCookie?.match(/compliscan_session=([^;]+)/)
  assertOk(match, "Nu am primit cookie-ul de sesiune la register.")
  return match[1]
}

async function registerUser() {
  const response = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `smoke-${Date.now()}@site.ro`,
      password: "secret123",
      orgName: "Smart Resolve Smoke Org",
    }),
  })

  assertOk(response.ok, `Register a eșuat cu status ${response.status}.`)
  return getSessionCookie(response.headers.get("set-cookie"))
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

  assertOk(response.ok, `Setarea modului de utilizare a eșuat cu status ${response.status}.`)
  return getSessionCookie(response.headers.get("set-cookie"))
}

async function seedFindings(sessionCookie) {
  const content = await readFile(
    path.join(
      process.cwd(),
      "public",
      "flow-test-kit-user-nou-document-2026-03-15",
      "03-recruitment-high-risk-bundle-source.txt"
    ),
    "utf8"
  )

  const scanResponse = await fetch(`${BASE_URL}/api/scan`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `compliscan_session=${sessionCookie}`,
    },
    body: JSON.stringify({
      documentName: "03-recruitment-high-risk-bundle-source.txt",
      content,
    }),
  })

  assertOk(scanResponse.ok, `Scanarea fixture-ului a eșuat cu status ${scanResponse.status}.`)
}

async function completeOnboarding(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/org/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      cookie: `compliscan_session=${sessionCookie}`,
    },
    body: JSON.stringify({
      sector: "retail",
      employeeCount: "10-49",
      usesAITools: true,
      requiresEfactura: true,
      cui: "RO12345678",
      website: "https://smart-resolve-smoke.local",
    }),
  })

  assertOk(response.ok, `Finalizarea onboarding-ului a eșuat cu status ${response.status}.`)
}

async function getDocumentFinding(sessionCookie) {
  const response = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { cookie: `compliscan_session=${sessionCookie}` },
  })
  assertOk(response.ok, `Dashboard payload a eșuat cu status ${response.status}.`)

  const payload = await response.json()
  const finding = payload.state.findings.find((item) => item.suggestedDocumentType)
  assertOk(finding, "Nu am găsit un finding cu flow documentar pentru smoke.")
  return finding
}

async function waitForText(page, text) {
  await page.waitForFunction(
    (expected) => document.body.textContent?.includes(expected),
    {},
    text
  )
}

async function safeClick(page, selector) {
  await page.waitForSelector(selector)
  await page.$eval(selector, (element) => {
    if (!(element instanceof HTMLElement)) {
      throw new Error("Selectorul nu pointează la un element HTML clickabil.")
    }
    element.scrollIntoView({ block: "center", inline: "center" })
    element.click()
  })
}

async function main() {
  const initialCookie = await registerUser()
  const sessionCookie = await setUserMode(initialCookie)
  await completeOnboarding(sessionCookie)
  await seedFindings(sessionCookie)
  const finding = await getDocumentFinding(sessionCookie)

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
    defaultViewport: { width: 1440, height: 1100 },
  })

  try {
    const page = await browser.newPage()
    const baseUrl = new URL(BASE_URL)
    await page.setCookie({
      name: "compliscan_session",
      value: sessionCookie,
      domain: baseUrl.hostname,
      path: "/",
    })
    await page.setExtraHTTPHeaders({
      cookie: `compliscan_session=${sessionCookie}`,
    })

    const response = await page.goto(`${BASE_URL}/dashboard/resolve/${finding.id}`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    })
    assertOk(response?.ok(), `Pagina finding-ului a răspuns cu status ${response?.status()}.`)
    assertOk(
      page.url().includes(`/dashboard/resolve/${finding.id}`),
      `Nu am rămas în cockpitul finding-ului. URL curent: ${page.url()}`
    )

    await waitForSelectorWithDebug(page, '[data-testid="finding-hero-action"]')
    const confirmAndGenerateButton = await page.$('[data-testid="confirm-and-generate"]')
    if (confirmAndGenerateButton) {
      await safeClick(page, '[data-testid="confirm-and-generate"]')
      await waitForSelectorWithDebug(page, '[data-testid="finding-generator-drawer"]')
    } else {
      const confirmButton = await page.$('[data-testid="confirm-finding"]')
      if (confirmButton) {
        await safeClick(page, '[data-testid="confirm-finding"]')
      }
      await waitForSelectorWithDebug(page, '[data-testid="open-generator-drawer"]')
      await safeClick(page, '[data-testid="open-generator-drawer"]')
      await waitForSelectorWithDebug(page, '[data-testid="finding-generator-drawer"]')
    }

    const orgNameInput = await page.$('[data-testid="finding-generator-drawer"] input')
    assertOk(orgNameInput, "Nu am găsit input-ul principal din drawer.")
    const inputValue = await orgNameInput.evaluate((element) => element.value)
    if (!inputValue) {
      await orgNameInput.click({ clickCount: 3 })
      await orgNameInput.type("Smart Resolve Smoke Org")
    }

    await safeClick(page, '[data-testid="generate-document-draft"]')
    await waitForSelectorWithDebug(page, '[data-testid="generated-document-preview"]')

    await safeClick(page, '[data-testid="rerun-document-validation"]')

    const validationChecklistSelectors = [
      '[data-testid="drawer-validation-validation-reviewed"]',
      '[data-testid="drawer-validation-validation-ready"]',
    ]

    for (const selector of validationChecklistSelectors) {
      await safeClick(page, selector)
    }

    const checklistSelectors = [
      '[data-testid="drawer-checklist-content-reviewed"]',
      '[data-testid="drawer-checklist-facts-confirmed"]',
      '[data-testid="drawer-checklist-approved-for-evidence"]',
    ]

    for (const selector of checklistSelectors) {
      await safeClick(page, selector)
    }

    await safeClick(page, '[data-testid="confirm-generated-document"]')
    await page.waitForFunction(
      () => document.body.textContent?.includes("Acum poți rezolva riscul")
    )
    await safeClick(page, '[data-testid="mark-finding-resolved"]')
    await waitForSelectorWithDebug(page, '[data-testid="send-document-to-dosar"]')
    await waitForText(page, "Adaugă documentul la Dosar")
    await safeClick(page, '[data-testid="send-document-to-dosar"]')
    await waitForSelectorWithDebug(page, '[data-testid="finding-dossier-success"]')
    await waitForText(page, "a intrat în Dosar")
    await waitForText(page, "Redeschide cazul")

    const dosarResponse = await page.goto(`${BASE_URL}/dashboard/dosar`, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    })
    assertOk(dosarResponse?.ok(), `Pagina Dosar a răspuns cu status ${dosarResponse?.status()}.`)
    await waitForText(page, finding.title)

    console.log(
      JSON.stringify(
        {
          ok: true,
          findingId: finding.id,
          findingTitle: finding.title,
          successCardVisible: true,
          dosarUpdated: true,
          reopenVisible: true,
          baseUrl: BASE_URL,
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
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        baseUrl: BASE_URL,
      },
      null,
      2
    )
  )
  process.exit(1)
})
