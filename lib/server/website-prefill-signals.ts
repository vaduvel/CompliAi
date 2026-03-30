import type { OrgProfilePrefill } from "@/lib/compliance/org-profile-prefill"
import { normalizeWebsiteUrl } from "@/lib/server/request-validation"

type WebsiteSignalInput = {
  website?: string | null
}

type WebsitePageSnapshot = {
  url: string
  label: string
  text: string
  hasForm: boolean
  hasEmailInput: boolean
  hasPrivacySignal: boolean
  hasCookieSignal: boolean
  hasContactSignal: boolean
  hasNewsletterSignal: boolean
  mentionsPersonalData: boolean
}

const MAX_PAGES = 4
const MAX_HTML_LENGTH = 120_000
const WEBSITE_TIMEOUT_MS = 6_000

const DEFAULT_PATHS = [
  "/",
  "/privacy-policy",
  "/privacy",
  "/politica-de-confidentialitate",
  "/confidentialitate",
  "/gdpr",
  "/cookie-policy",
  "/cookies",
  "/politica-de-cookies",
  "/contact",
]

export async function enrichOrgProfilePrefillWithWebsiteSignals(
  prefill: OrgProfilePrefill | null,
  input: WebsiteSignalInput,
  fetchImpl: typeof fetch = fetch
): Promise<OrgProfilePrefill | null> {
  const normalizedWebsite = normalizeWebsiteUrl(input.website)
  if (!normalizedWebsite) return prefill

  const { suggestions, websiteSignals } = await buildWebsitePrefillSignals(normalizedWebsite, fetchImpl)
  const basePrefill = prefill ?? createWebsiteSeedPrefill(normalizedWebsite)

  if (!websiteSignals) {
    return prefill
      ? {
          ...prefill,
          normalizedWebsite,
        }
      : null
  }

  return {
    ...basePrefill,
    normalizedWebsite,
    websiteSignals,
    suggestions: {
      ...suggestions,
      ...basePrefill.suggestions,
      hasSiteWithForms: basePrefill.suggestions.hasSiteWithForms ?? suggestions.hasSiteWithForms,
      processesPersonalData:
        basePrefill.suggestions.processesPersonalData ?? suggestions.processesPersonalData,
      hasPrivacyPolicy: basePrefill.suggestions.hasPrivacyPolicy ?? suggestions.hasPrivacyPolicy,
      hasSitePrivacyPolicy:
        basePrefill.suggestions.hasSitePrivacyPolicy ?? suggestions.hasSitePrivacyPolicy,
      hasCookiesConsent:
        basePrefill.suggestions.hasCookiesConsent ?? suggestions.hasCookiesConsent,
    },
  }
}

export async function buildWebsitePrefillSignals(
  normalizedWebsite: string,
  fetchImpl: typeof fetch = fetch
): Promise<{
  suggestions: Partial<
    Pick<
      OrgProfilePrefill["suggestions"],
      | "hasSiteWithForms"
      | "processesPersonalData"
      | "hasPrivacyPolicy"
      | "hasSitePrivacyPolicy"
      | "hasCookiesConsent"
    >
  >
  websiteSignals?: OrgProfilePrefill["websiteSignals"]
}> {
  const pageSnapshots = await collectWebsiteSnapshots(normalizedWebsite, fetchImpl)

  if (pageSnapshots.length === 0) {
    return { suggestions: {} }
  }

  const suggestions: Partial<
    Pick<
      OrgProfilePrefill["suggestions"],
      | "hasSiteWithForms"
      | "processesPersonalData"
      | "hasPrivacyPolicy"
      | "hasSitePrivacyPolicy"
      | "hasCookiesConsent"
    >
  > = {}

  const matchedSignals = new Set<string>()

  const hasStrongFormSignal = pageSnapshots.some(
    (page) => page.hasForm || page.hasEmailInput || (page.hasContactSignal && page.hasNewsletterSignal)
  )
  const hasSurfaceSignal = pageSnapshots.some(
    (page) => page.hasCookieSignal || page.hasContactSignal || page.hasNewsletterSignal || page.hasForm
  )
  const hasStrongPrivacySignal = pageSnapshots.some(
    (page) => page.hasPrivacySignal && page.mentionsPersonalData
  )
  const hasPrivacySignal = pageSnapshots.some((page) => page.hasPrivacySignal)
  const hasCookieSignal = pageSnapshots.some((page) => page.hasCookieSignal)

  if (hasStrongFormSignal || hasSurfaceSignal) {
    const confidence = hasStrongFormSignal ? "high" : "medium"
    matchedSignals.add("site cu formulare / cookies / newsletter")
    suggestions.hasSiteWithForms = {
      value: true,
      confidence,
      reason: hasStrongFormSignal
        ? `Am detectat direct elemente de formular, contact sau newsletter pe site-ul public (${examplesFromPages(pageSnapshots)}).`
        : `Am detectat semnale publice de cookies, contact sau newsletter pe site (${examplesFromPages(pageSnapshots)}).`,
      source: "website_signals",
    }
  }

  if (hasStrongPrivacySignal || hasPrivacySignal) {
    const confidence = hasStrongPrivacySignal ? "high" : "medium"
    matchedSignals.add("privacy policy publică")
    suggestions.hasSitePrivacyPolicy = {
      value: true,
      confidence,
      reason: hasStrongPrivacySignal
        ? `Am găsit o pagină publică de privacy/confidențialitate cu referințe explicite la date personale (${examplesFromPages(pageSnapshots, "privacy")}).`
        : `Am detectat o pagină sau link public de privacy/confidențialitate pe site (${examplesFromPages(pageSnapshots, "privacy")}).`,
      source: "website_signals",
    }
    suggestions.hasPrivacyPolicy = {
      value: true,
      confidence,
      reason: hasStrongPrivacySignal
        ? "Există o politică publică de privacy/confidențialitate pe site, deci răspunsul pentru existența politicii este foarte probabil „da”."
        : "Site-ul indică existența unei pagini de privacy/confidențialitate, deci există probabil deja o politică pregătită.",
      source: "website_signals",
    }
  }

  if (hasCookieSignal) {
    matchedSignals.add("cookies / consent banner")
    suggestions.hasCookiesConsent = {
      value: true,
      confidence: "medium",
      reason: `Am detectat limbaj de cookies, consent sau tracking pe site (${examplesFromPages(pageSnapshots, "cookies")}).`,
      source: "website_signals",
    }
  }

  if (hasStrongPrivacySignal || (hasStrongFormSignal && (hasPrivacySignal || hasCookieSignal))) {
    matchedSignals.add("prelucrare date personale")
    suggestions.processesPersonalData = {
      value: true,
      confidence: hasStrongPrivacySignal ? "high" : "medium",
      reason: hasStrongPrivacySignal
        ? "Site-ul public are politică de privacy și semnale explicite despre date personale, deci există prelucrare de date."
        : "Formularele, cookies-urile sau suprafața publică detectată pe site indică probabil prelucrare de date personale.",
      source: "website_signals",
    }
  }

  if (matchedSignals.size === 0) {
    return { suggestions: {} }
  }

  const topPages = [...new Set(pageSnapshots.map((page) => page.label))].slice(0, 3)

  return {
    suggestions,
    websiteSignals: {
      source: "website_signals",
      normalizedWebsite,
      pagesChecked: pageSnapshots.length,
      matchedSignals: [...matchedSignals],
      topPages,
    },
  }
}

async function collectWebsiteSnapshots(normalizedWebsite: string, fetchImpl: typeof fetch) {
  // Fetch up to MAX_PAGES + 2 candidates in parallel instead of sequentially.
  // Worst case drops from MAX_PAGES × TIMEOUT (24s) to 1 × TIMEOUT (6s).
  const batch = buildCandidateUrls(normalizedWebsite).slice(0, MAX_PAGES + 2)
  const htmlResults = await Promise.all(batch.map((url) => fetchWebsiteHtml(url, fetchImpl)))

  const snapshots: WebsitePageSnapshot[] = []
  for (let i = 0; i < batch.length && snapshots.length < MAX_PAGES; i++) {
    const html = htmlResults[i]
    if (!html) continue
    const url = batch[i]
    const text = simplifyHtml(html)
    snapshots.push({
      url,
      label: labelForUrl(url, normalizedWebsite),
      text,
      hasForm: /<form\b/i.test(html),
      hasEmailInput: /type=["']email["']/i.test(html),
      hasPrivacySignal:
        hasPrivacyPath(url) ||
        matchesAny(text, ["privacy", "confidentialitate", "gdpr", "date personale", "politica de confidentialitate"]),
      hasCookieSignal:
        hasCookiePath(url) ||
        matchesAny(text, ["cookie", "cookies", "consimtam", "consent", "tracking", "analytics"]),
      hasContactSignal:
        hasContactPath(url) ||
        matchesAny(text, ["contact", "contacteaza", "trimite mesaj", "cerere oferta", "solicita demo"]),
      hasNewsletterSignal: matchesAny(text, ["newsletter", "abonare", "aboneaza-te", "subscribe"]),
      mentionsPersonalData: matchesAny(text, ["date personale", "personal data", "persoanelor vizate", "operator de date"]),
    })
  }

  return snapshots
}

function buildCandidateUrls(normalizedWebsite: string) {
  return DEFAULT_PATHS.map((path) => new URL(path, `${normalizedWebsite}/`).toString())
}

async function fetchWebsiteHtml(url: string, fetchImpl: typeof fetch) {
  try {
    const response = await fetchImpl(url, {
      headers: {
        Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
        "User-Agent": "CompliScan Website Prefill/1.0",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(WEBSITE_TIMEOUT_MS),
    })

    if (!response.ok) return null

    const contentType = response.headers.get("content-type")?.toLowerCase() ?? ""
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null

    const html = await response.text()
    const trimmed = html.trim()
    return trimmed ? trimmed.slice(0, MAX_HTML_LENGTH) : null
  } catch {
    return null
  }
}

function extractCandidateLinks(html: string, normalizedWebsite: string) {
  const base = new URL(`${normalizedWebsite}/`)
  const matches = html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)
  const links = new Set<string>()

  for (const match of matches) {
    const href = match[1]?.trim()
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) continue

    try {
      const url = new URL(href, base)
      if (url.origin !== base.origin) continue
      if (!looksLikeRelevantPath(url.pathname)) continue

      url.search = ""
      url.hash = ""
      links.add(url.toString())
    } catch {
      continue
    }
  }

  return [...links].slice(0, MAX_PAGES)
}

function looksLikeRelevantPath(pathname: string) {
  const path = pathname.toLowerCase()
  return matchesAny(path, [
    "privacy",
    "confidential",
    "cookie",
    "cookies",
    "contact",
    "newsletter",
    "gdpr",
  ])
}

function simplifyHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
}

function createWebsiteSeedPrefill(normalizedWebsite: string): OrgProfilePrefill {
  return {
    source: "website_signals",
    fetchedAtISO: new Date().toISOString(),
    normalizedCui: null,
    normalizedWebsite,
    companyName: humanizeHostname(normalizedWebsite),
    address: null,
    legalForm: null,
    mainCaen: null,
    caenDescription: null,
    fiscalStatus: null,
    vatRegistered: false,
    vatOnCashAccounting: false,
    efacturaRegistered: false,
    inactive: false,
    suggestions: {},
  }
}

function humanizeHostname(normalizedWebsite: string) {
  try {
    return new URL(normalizedWebsite).hostname.replace(/^www\./i, "")
  } catch {
    return normalizedWebsite
  }
}

function labelForUrl(url: string, normalizedWebsite: string) {
  try {
    const website = new URL(normalizedWebsite)
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/$/, "") || "/"
    return path === "/" ? website.hostname.replace(/^www\./i, "") : path
  } catch {
    return url
  }
}

function hasPrivacyPath(url: string) {
  return matchesAny(url.toLowerCase(), ["privacy", "confidential", "gdpr"])
}

function hasCookiePath(url: string) {
  return matchesAny(url.toLowerCase(), ["cookie", "cookies"])
}

function hasContactPath(url: string) {
  return matchesAny(url.toLowerCase(), ["contact", "newsletter"])
}

function matchesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword))
}

function examplesFromPages(pages: WebsitePageSnapshot[], scope?: "privacy" | "cookies") {
  const filtered = pages.filter((page) => {
    if (scope === "privacy") return page.hasPrivacySignal
    if (scope === "cookies") return page.hasCookieSignal
    return page.hasForm || page.hasCookieSignal || page.hasContactSignal || page.hasNewsletterSignal
  })

  const labels = [...new Set(filtered.map((page) => page.label))].slice(0, 3)
  return labels.join(", ")
}
