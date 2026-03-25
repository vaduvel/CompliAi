// Multiplicator A — Site Intelligence Layer
// Puppeteer + @sparticuz/chromium-min: JS executat complet, trackere async, consent banners reale.

import chromium from "@sparticuz/chromium-min"
import puppeteer from "puppeteer-core"

export type DetectedTracker = {
  id: string
  name: string
  category: "analytics" | "advertising" | "social" | "support" | "cdn" | "payment"
  requiresConsent: boolean
  gdprRisk: "high" | "medium" | "low"
  dpaVendorId?: string
}

export type DetectedForm = {
  type: "contact" | "newsletter" | "checkout" | "login" | "hr-application" | "unknown"
  hint: string
  collectsPersonalData: boolean
}

export type SiteScanResult = {
  url: string
  scannedAtISO: string
  reachable: boolean
  errorMessage?: string
  trackers: DetectedTracker[]
  vendorCandidates: string[]
  forms: DetectedForm[]
  hasCookieBanner: boolean
  hasPrivacyPolicy: boolean
  hasGoogleAnalytics: boolean
  dataCategories: string[]
  findingSuggestions: FindingSuggestion[]
}

export type FindingSuggestion = {
  type: "missing-consent" | "missing-dpa" | "missing-privacy-policy" | "vendor-candidate" | "data-collection" | "cookie-banner-mismatch"
  title: string
  detail: string
  severity: "high" | "medium" | "low"
}

// ── Tracker definitions ───────────────────────────────────────────────────────

type TrackerDef = Omit<DetectedTracker, "id"> & {
  urlPatterns: RegExp[]  // network requests
  scriptPatterns: RegExp[]  // script src sau inline
}

const TRACKER_DEFS: TrackerDef[] = [
  {
    name: "Google Analytics 4",
    category: "analytics",
    requiresConsent: true,
    gdprRisk: "high",
    dpaVendorId: "google",
    urlPatterns: [/google-analytics\.com|googletagmanager\.com\/gtag/],
    scriptPatterns: [/gtag\(|GA_MEASUREMENT_ID|G-[A-Z0-9]{6,}/],
  },
  {
    name: "Google Tag Manager",
    category: "analytics",
    requiresConsent: true,
    gdprRisk: "high",
    dpaVendorId: "google",
    urlPatterns: [/googletagmanager\.com\/gtm\.js/],
    scriptPatterns: [/GTM-[A-Z0-9]{4,}/],
  },
  {
    name: "Meta Pixel (Facebook)",
    category: "advertising",
    requiresConsent: true,
    gdprRisk: "high",
    dpaVendorId: "meta",
    urlPatterns: [/connect\.facebook\.net|facebook\.com\/tr/],
    scriptPatterns: [/fbevents\.js|fbq\(/],
  },
  {
    name: "Hotjar",
    category: "analytics",
    requiresConsent: true,
    gdprRisk: "high",
    urlPatterns: [/hotjar\.com/],
    scriptPatterns: [/hjid:|hj\(window/],
  },
  {
    name: "Microsoft Clarity",
    category: "analytics",
    requiresConsent: true,
    gdprRisk: "medium",
    dpaVendorId: "microsoft",
    urlPatterns: [/clarity\.ms/],
    scriptPatterns: [/clarity\.ms|microsoft.*clarity/i],
  },
  {
    name: "TikTok Pixel",
    category: "advertising",
    requiresConsent: true,
    gdprRisk: "high",
    urlPatterns: [/analytics\.tiktok\.com/],
    scriptPatterns: [/ttq\.|tiktok.*pixel/i],
  },
  {
    name: "LinkedIn Insight",
    category: "advertising",
    requiresConsent: true,
    gdprRisk: "high",
    urlPatterns: [/snap\.licdn\.com/],
    scriptPatterns: [/linkedin.*insight/i],
  },
  {
    name: "Intercom",
    category: "support",
    requiresConsent: false,
    gdprRisk: "medium",
    dpaVendorId: "intercom",
    urlPatterns: [/intercom\.io/],
    scriptPatterns: [/Intercom\(/],
  },
  {
    name: "Crisp Chat",
    category: "support",
    requiresConsent: false,
    gdprRisk: "medium",
    urlPatterns: [/crisp\.chat/],
    scriptPatterns: [/CRISP_WEBSITE_ID/],
  },
  {
    name: "Stripe",
    category: "payment",
    requiresConsent: false,
    gdprRisk: "medium",
    dpaVendorId: "stripe",
    urlPatterns: [/js\.stripe\.com/],
    scriptPatterns: [/Stripe\(/],
  },
  {
    name: "YouTube Embed",
    category: "social",
    requiresConsent: true,
    gdprRisk: "medium",
    dpaVendorId: "google",
    urlPatterns: [/youtube\.com\/embed|youtu\.be/],
    scriptPatterns: [/youtube\.com\/embed/],
  },
  {
    name: "Google Maps",
    category: "cdn",
    requiresConsent: true,
    gdprRisk: "medium",
    dpaVendorId: "google",
    urlPatterns: [/maps\.googleapis\.com/],
    scriptPatterns: [/maps\.googleapis\.com|google\.com\/maps\/embed/],
  },
  {
    name: "HubSpot",
    category: "analytics",
    requiresConsent: true,
    gdprRisk: "high",
    urlPatterns: [/hs-scripts\.com|hubspot\.com/],
    scriptPatterns: [/_hsq\./],
  },
  {
    name: "Mailchimp",
    category: "analytics",
    requiresConsent: false,
    gdprRisk: "medium",
    dpaVendorId: "mailchimp",
    urlPatterns: [/mailchimp\.com/],
    scriptPatterns: [/mc\.us\d+\./],
  },
  {
    name: "Cloudflare",
    category: "cdn",
    requiresConsent: false,
    gdprRisk: "low",
    dpaVendorId: "cloudflare",
    urlPatterns: [/cloudflare\.com/],
    scriptPatterns: [/__cf_bm/],
  },
]

// ── Main scanner ──────────────────────────────────────────────────────────────

export async function scanSite(rawUrl: string): Promise<SiteScanResult> {
  const scannedAtISO = new Date().toISOString()

  let url = rawUrl.trim()
  if (!url.startsWith("http")) url = `https://${url}`
  try { new URL(url) } catch {
    return empty(url, scannedAtISO, "URL invalid.")
  }

  let browser
  try {
    const executablePath = await chromium.executablePath(
      "https://github.com/Sparticuz/chromium/releases/download/v143.0.0/chromium-v143.0.0-pack.tar"
    )

    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1280, height: 800 },
      executablePath,
      headless: true,
    })

    const page = await browser.newPage()

    // Interceptăm network requests pentru detecție trackere
    const networkRequests: string[] = []
    await page.setRequestInterception(true)
    page.on("request", (req) => {
      networkRequests.push(req.url())
      req.continue()
    })

    await page.goto(url, { waitUntil: "networkidle2", timeout: 20_000 })

    // HTML după JS execution
    const html = await page.content()

    await browser.close()
    browser = undefined

    return analyzeHtml(url, scannedAtISO, html, networkRequests)
  } catch (err) {
    if (browser) await browser.close().catch(() => {})
    const msg = err instanceof Error ? err.message : "Scan failed"
    return empty(url, scannedAtISO, msg.includes("timeout") ? "Timeout (>20s) — site prea lent." : msg.slice(0, 120))
  }
}

function empty(url: string, scannedAtISO: string, errorMessage: string): SiteScanResult {
  return { url, scannedAtISO, reachable: false, errorMessage, trackers: [], vendorCandidates: [], forms: [], hasCookieBanner: false, hasPrivacyPolicy: false, hasGoogleAnalytics: false, dataCategories: [], findingSuggestions: [] }
}

function analyzeHtml(url: string, scannedAtISO: string, html: string, networkRequests: string[]): SiteScanResult {
  // Detect trackers — verificăm atât network requests cât și HTML/script content
  const trackers: DetectedTracker[] = []
  for (const def of TRACKER_DEFS) {
    const inNetwork = def.urlPatterns.some((p) => networkRequests.some((r) => p.test(r)))
    const inHtml = def.scriptPatterns.some((p) => p.test(html))
    if (inNetwork || inHtml) {
      trackers.push({
        id: def.name.toLowerCase().replace(/\s+/g, "-"),
        name: def.name,
        category: def.category,
        requiresConsent: def.requiresConsent,
        gdprRisk: def.gdprRisk,
        dpaVendorId: def.dpaVendorId,
      })
    }
  }

  const vendorCandidates = [...new Set(trackers.filter((t) => t.dpaVendorId).map((t) => t.name))]

  // Detect forms din HTML renderizat
  const forms: DetectedForm[] = []
  const formMatches = html.match(/<form[^>]*>[\s\S]*?<\/form>/gi) ?? []
  const formDefs = [
    { type: "contact" as const, patterns: [/contact|mesaj|message/i], hint: "Formular contact" },
    { type: "newsletter" as const, patterns: [/newsletter|subscribe|abonare/i], hint: "Formular newsletter" },
    { type: "checkout" as const, patterns: [/checkout|card.*number|billing/i], hint: "Formular plată/checkout" },
    { type: "login" as const, patterns: [/login|signin|autentific|password/i], hint: "Formular autentificare" },
    { type: "hr-application" as const, patterns: [/cv|resume|apply.*job|cariere|careers/i], hint: "Formular aplicație job" },
  ]
  for (const formHtml of formMatches.slice(0, 10)) {
    let matched = false
    for (const def of formDefs) {
      if (def.patterns.some((p) => p.test(formHtml))) {
        forms.push({ type: def.type, hint: def.hint, collectsPersonalData: true })
        matched = true
        break
      }
    }
    if (!matched && /email/i.test(formHtml)) {
      forms.push({ type: "unknown", hint: "Formular cu câmp email", collectsPersonalData: true })
    }
  }

  const hasCookieBanner = /cookie.*consent|cookielaw|onetrust|cookiebot|tarteaucitron|accepta.*cookie|accept.*cookie/i.test(html)
  const hasPrivacyPolicy = /politica.*privacitate|privacy.*policy|confidentialitate/i.test(html)
  const hasGoogleAnalytics = trackers.some((t) => t.name.includes("Google Analytics") || t.name.includes("Google Tag Manager"))

  const dataCategories: string[] = []
  if (forms.some((f) => ["contact", "newsletter"].includes(f.type))) dataCategories.push("date contact (email, nume)")
  if (forms.some((f) => f.type === "checkout")) dataCategories.push("date financiare")
  if (forms.some((f) => f.type === "login")) dataCategories.push("credențiale autentificare")
  if (forms.some((f) => f.type === "hr-application")) dataCategories.push("date HR / candidați")
  if (trackers.some((t) => t.category === "analytics")) dataCategories.push("date comportamentale (navigare, sesiune)")
  if (trackers.some((t) => t.category === "advertising")) dataCategories.push("date publicitate (profil, remarketing)")

  const findingSuggestions: FindingSuggestion[] = []
  const consentTrackers = trackers.filter((t) => t.requiresConsent)
  if (consentTrackers.length > 0 && !hasCookieBanner) {
    findingSuggestions.push({
      type: "missing-consent",
      title: `${consentTrackers.length} tracker${consentTrackers.length > 1 ? "e" : ""} fără banner consimțământ`,
      detail: `${consentTrackers.map((t) => t.name).join(", ")} — GDPR Art. 6 + ePrivacy necesită consimțământ explicit.`,
      severity: "high",
    })
  }
  // P8 — Cookie banner mismatch: banner present but trackers still load on page load (pre-consent)
  if (consentTrackers.length > 0 && hasCookieBanner) {
    findingSuggestions.push({
      type: "cookie-banner-mismatch",
      title: `Banner cookie detectat, dar ${consentTrackers.length} tracker${consentTrackers.length > 1 ? "e" : ""} se încarcă înainte de consimțământ`,
      detail: `${consentTrackers.map((t) => t.name).join(", ")} — Bannerul nu blochează aceste cookieuri la prima vizită. ePrivacy + GDPR Art. 6 impun consimțământ prealabil.`,
      severity: "high",
    })
  }
  if (!hasPrivacyPolicy) {
    findingSuggestions.push({
      type: "missing-privacy-policy",
      title: "Politică de confidențialitate nedetectată",
      detail: "Nu a fost găsit link spre o politică de privacy. Obligatorie GDPR Art. 13.",
      severity: "high",
    })
  }
  const dpaVendors = trackers.filter((t) => t.dpaVendorId && t.gdprRisk !== "low")
  if (dpaVendors.length > 0) {
    findingSuggestions.push({
      type: "missing-dpa",
      title: `${dpaVendors.length} vendor${dpaVendors.length > 1 ? "i" : ""} care necesită DPA`,
      detail: `${dpaVendors.map((t) => t.name).join(", ")} — GDPR Art. 28.`,
      severity: "medium",
    })
  }
  if (vendorCandidates.length > 0) {
    findingSuggestions.push({
      type: "vendor-candidate",
      title: `${vendorCandidates.length} vendor${vendorCandidates.length > 1 ? "i" : ""} detectați — adaugă în Vendor Review`,
      detail: vendorCandidates.join(", "),
      severity: "medium",
    })
  }

  return {
    url, scannedAtISO, reachable: true,
    trackers, vendorCandidates, forms,
    hasCookieBanner, hasPrivacyPolicy, hasGoogleAnalytics,
    dataCategories, findingSuggestions,
  }
}
