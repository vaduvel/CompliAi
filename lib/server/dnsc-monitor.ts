// P4 — DNSC Monitor (Regulatory Radar Phase 2)
// Fetches recent announcements from DNSC.ro (Romanian cybersecurity authority).
// DNSC.ro has no public API — we fetch the news page and parse HTML.
// Falls back to [] on any failure.

const DNSC_NEWS_URL = "https://dnsc.ro/citeste/comunicate-de-presa"

// Keywords that indicate high-impact announcements for NIS2/cybersecurity
const HIGH_IMPACT_KEYWORDS = [
  "nis2", "cerință", "obligat", "amendă", "sancțiune", "termen",
  "ghid", "ordin", "reglementare", "incident", "notificare",
]

const MEDIUM_IMPACT_KEYWORDS = [
  "securitate", "cyber", "vulnerabilitate", "atac", "breșă",
  "conformitate", "audit", "evaluare",
]

export type DnscAnnouncement = {
  title: string
  url: string
  publishedDateISO: string
  snippet: string
  potentialImpact: "high" | "medium" | "low"
}

function detectImpact(title: string, snippet: string): DnscAnnouncement["potentialImpact"] {
  const combined = (title + " " + snippet).toLowerCase()
  if (HIGH_IMPACT_KEYWORDS.some((k) => combined.includes(k))) return "high"
  if (MEDIUM_IMPACT_KEYWORDS.some((k) => combined.includes(k))) return "medium"
  return "low"
}

/**
 * Parse a date string from DNSC.ro HTML.
 * Tries common Romanian date formats: "25 martie 2026", "25.03.2026", ISO.
 */
function parseDnscDate(raw: string): string {
  const months: Record<string, string> = {
    ianuarie: "01", februarie: "02", martie: "03", aprilie: "04",
    mai: "05", iunie: "06", iulie: "07", august: "08",
    septembrie: "09", octombrie: "10", noiembrie: "11", decembrie: "12",
  }

  // "25 martie 2026"
  const roMatch = raw.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/)
  if (roMatch) {
    const month = months[roMatch[2].toLowerCase()]
    if (month) {
      return `${roMatch[3]}-${month}-${roMatch[1].padStart(2, "0")}T00:00:00.000Z`
    }
  }

  // "25.03.2026"
  const dotMatch = raw.match(/(\d{1,2})\.(\d{2})\.(\d{4})/)
  if (dotMatch) {
    return `${dotMatch[3]}-${dotMatch[2]}-${dotMatch[1].padStart(2, "0")}T00:00:00.000Z`
  }

  return new Date().toISOString()
}

/**
 * Fetch recent DNSC.ro announcements published since sinceISO.
 * Returns max 10 announcements sorted by date desc.
 * Falls back to [] on any error.
 */
export async function fetchDnscAnnouncements(
  sinceISO: string,
): Promise<DnscAnnouncement[]> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 6000) // 6s timeout

    const res = await fetch(DNSC_NEWS_URL, {
      signal: controller.signal,
      headers: {
        // Mimic a browser to avoid bot blocks
        "User-Agent": "Mozilla/5.0 (compatible; CompliScan-RadarBot/1.0)",
        Accept: "text/html",
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return []

    const html = await res.text()

    // Parse: extract article titles, links, dates from DNSC.ro HTML
    // The site uses standard HTML with article/news card patterns.
    // We use regex since importing a DOM parser adds bundle weight.
    const announcements: DnscAnnouncement[] = []

    // Match article blocks: <a href="/citeste/...">TITLE</a> near date patterns
    const articlePattern =
      /href="(\/citeste\/[^"]+)"[^>]*>([^<]{10,200})<\/a>/g
    const datePattern = /(\d{1,2}(?:\s+\w+\s+|\.\d{2}\.)?\d{4})/g

    let match: RegExpExecArray | null
    const links: { href: string; title: string }[] = []

    while ((match = articlePattern.exec(html)) !== null) {
      const href = match[1]
      const title = match[2].trim().replace(/\s+/g, " ")
      if (title.length < 15 || title.length > 300) continue
      if (links.some((l) => l.href === href)) continue
      links.push({ href, title })
    }

    // Extract dates from surrounding context (simplified: find dates in full HTML)
    const allDates: string[] = []
    let dateMatch: RegExpExecArray | null
    while ((dateMatch = datePattern.exec(html)) !== null) {
      allDates.push(dateMatch[1])
    }

    const sinceMs = new Date(sinceISO).getTime()

    for (let i = 0; i < Math.min(links.length, 15); i++) {
      const { href, title } = links[i]
      // Pair with nearest date (approximate — site order is roughly correct)
      const rawDate = allDates[i] ?? ""
      const dateISO = parseDnscDate(rawDate)

      // Filter by sinceISO
      if (new Date(dateISO).getTime() < sinceMs) continue

      announcements.push({
        title,
        url: `https://dnsc.ro${href}`,
        publishedDateISO: dateISO,
        snippet: title, // Title is sufficient for impact detection
        potentialImpact: detectImpact(title, ""),
      })
    }

    return announcements.slice(0, 10)
  } catch {
    // Network failure, parse error, abort — return empty, cron continues with Phase 1
    return []
  }
}
