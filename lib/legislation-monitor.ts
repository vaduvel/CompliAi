// F1 — Radar Legislativ (diferențiatorul principal)
// Monitors official Romanian compliance sources for legislative changes.
// Uses SHA-256 hash comparison + Gemini summarization.
// Stores hashes in Supabase legislation_hashes table.

import { createHash } from "crypto"

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite"
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Monitored sources ───────────────────────────────────────────────────────

export type MonitoredSource = {
  url: string
  framework: "GDPR" | "NIS2" | "EFACTURA"
  sursa: string
}

const SURSE_MONITORIZATE: MonitoredSource[] = [
  {
    url: "https://www.dataprotection.ro/?page=allnews",
    framework: "GDPR",
    sursa: "ANSPDCP",
  },
  {
    url: "https://www.dnsc.ro/citeste/stirile-saptamanii-din-cybersecurity",
    framework: "NIS2",
    sursa: "DNSC",
  },
  {
    url: "https://www.anaf.ro/anaf/internet/ANAF/asistenta_contribuabili/legislatie/noutati_legislative",
    framework: "EFACTURA",
    sursa: "ANAF",
  },
]

// ── Types ───────────────────────────────────────────────────────────────────

export type LegislationChange = {
  url: string
  framework: "GDPR" | "NIS2" | "EFACTURA"
  sursa: string
  summary: string
  detectedAt: string
}

// ── Supabase helpers ────────────────────────────────────────────────────────

async function getStoredHash(url: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/legislation_hashes?url=eq.${encodeURIComponent(url)}&select=hash`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ hash: string }>
    return rows[0]?.hash ?? null
  } catch {
    return null
  }
}

async function upsertHash(url: string, hash: string): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return

  try {
    await fetch(`${SUPABASE_URL}/rest/v1/legislation_hashes`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
      },
      body: JSON.stringify({
        url,
        hash,
        last_checked: new Date().toISOString(),
      }),
    })
  } catch {
    // Non-critical — log but don't fail
  }
}

// ── Gemini summarization ────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 8000)
}

async function summarizeLegislationChange(
  html: string,
  sursa: string
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null

  const text = stripHtml(html)

  const prompt = `
Ești expert în legislație română de conformitate.
Analizează conținutul paginii ${sursa}.

IMPORTANT: Ignoră complet:
- Mesaje de Paște, Crăciun, sărbători
- Anunțuri de mentenanță site
- Modificări cosmetice de text
- Comunicări fără impact legal

Alertează DOAR dacă există:
- Proceduri noi sau modificate
- Amenzi sau sancțiuni
- Termene legale noi
- Obligații noi pentru firme
- Ghiduri sau instrucțiuni noi

Dacă nu există nimic important: răspunde exact "FARA_SCHIMBARI"
Dacă există ceva important: 3-5 propoziții în română, limbaj simplu.

Conținut: ${text}
`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 512 },
        }),
      }
    )

    if (!res.ok) return null

    const json = (await res.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }

    const result =
      json.candidates?.[0]?.content?.parts
        ?.map((p) => p.text ?? "")
        .join("")
        .trim() ?? ""

    if (result === "FARA_SCHIMBARI") return null
    return result || null
  } catch {
    return null
  }
}

// ── Main monitor function ───────────────────────────────────────────────────

export async function checkLegislationChanges(): Promise<LegislationChange[]> {
  const changes: LegislationChange[] = []

  for (const sursa of SURSE_MONITORIZATE) {
    try {
      const res = await fetch(sursa.url, {
        headers: { "User-Agent": "CompliScan/1.0 (compliance monitoring)" },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue

      const html = await res.text()
      const hash = createHash("sha256").update(html).digest("hex")

      const prev = await getStoredHash(sursa.url)

      // Always update the hash
      await upsertHash(sursa.url, hash)

      if (prev === hash) continue

      // Hash changed — summarize with Gemini
      const summary = await summarizeLegislationChange(html, sursa.sursa)
      if (!summary) continue // Gemini said no relevant changes

      changes.push({
        ...sursa,
        summary,
        detectedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error(`[F1] Legislation monitor failed for ${sursa.url}:`, err)
    }
  }

  return changes
}
