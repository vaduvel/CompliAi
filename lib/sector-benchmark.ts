// Addon 2 — Sector Benchmark (Weekly Motivation)
// Compares org score against anonymous aggregate of same-sector orgs.
// Uses first 2 digits of CAEN code for sector grouping.
// Minimum 5 orgs required before showing benchmark (GDPR privacy rule).
// Never exposes individual org data — only anonymous aggregates.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// ── Types ───────────────────────────────────────────────────────────────────

export type SectorBenchmark = {
  medie: number             // sector average score
  percentil: number         // e.g. 78 = better than 78% of sector
  nrFirme: number           // number of firms in comparison
  sector: string            // human-readable sector name
}

// ── CAEN sector names (first 2 digits) ──────────────────────────────────────

const SECTOR_NAMES: Record<string, string> = {
  "10": "Industria alimentară",
  "13": "Textile",
  "20": "Industria chimică",
  "25": "Produse metalice",
  "41": "Construcții clădiri",
  "43": "Lucrări specializate construcții",
  "45": "Comerț auto",
  "46": "Comerț en-gros",
  "47": "Comerț cu amănuntul",
  "49": "Transport terestru",
  "52": "Depozitare",
  "55": "Hoteluri",
  "56": "Restaurante",
  "58": "Editare",
  "61": "Telecomunicații",
  "62": "IT & Software",
  "63": "Servicii informaționale",
  "64": "Servicii financiare",
  "65": "Asigurări",
  "66": "Servicii auxiliare financiare",
  "68": "Imobiliare",
  "69": "Juridic & Contabilitate",
  "70": "Consultanță management",
  "71": "Arhitectură & Inginerie",
  "72": "Cercetare",
  "73": "Publicitate",
  "74": "Alte activități profesionale",
  "77": "Închirieri",
  "78": "Recrutare",
  "80": "Securitate",
  "82": "Servicii suport afaceri",
  "85": "Educație",
  "86": "Sănătate",
  "87": "Asistență socială rezidențială",
  "90": "Arte & Spectacole",
  "93": "Sport & Recreere",
  "95": "Reparații",
  "96": "Alte servicii personale",
}

function getSectorName(prefix: string): string {
  return SECTOR_NAMES[prefix] ?? `Sector ${prefix}xx`
}

// ── Supabase helpers ────────────────────────────────────────────────────────

async function getOrgIdsBySector(caenPrefix: string): Promise<string[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return []

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/org_profiles?caen_prefix=eq.${encodeURIComponent(caenPrefix)}&select=org_id`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Array<{ org_id: string }>
    return rows.map((r) => r.org_id)
  } catch {
    return []
  }
}

async function getRecentScoresForOrgs(
  orgIds: string[],
  daysBack = 30
): Promise<number[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY || orgIds.length === 0) return []

  const since = new Date(Date.now() - daysBack * 24 * 3_600_000)
    .toISOString()
    .split("T")[0]

  try {
    // Fetch latest score per org (not all daily snapshots)
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/score_snapshots?date=gte.${since}&org_id=in.(${orgIds.join(",")})&select=org_id,score&order=date.desc`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    )
    if (!res.ok) return []
    const rows = (await res.json()) as Array<{ org_id: string; score: number }>

    // Deduplicate: keep latest score per org
    const seen = new Set<string>()
    const scores: number[] = []
    for (const row of rows) {
      if (!seen.has(row.org_id)) {
        seen.add(row.org_id)
        scores.push(row.score)
      }
    }
    return scores
  } catch {
    return []
  }
}

// ── Main benchmark function ─────────────────────────────────────────────────

/**
 * Addon 2: Get sector benchmark for an org.
 * Returns null if fewer than 5 firms in the same sector (privacy rule).
 */
export async function getSectorBenchmark(
  orgId: string,
  codCaen: string,
  scoreOrg: number
): Promise<SectorBenchmark | null> {
  const prefix = codCaen.substring(0, 2)
  if (!prefix || prefix.length < 2) return null

  const orgIds = await getOrgIdsBySector(prefix)

  // Minimum 5 firms required for benchmark (GDPR anonymization)
  if (orgIds.length < 5) return null

  const scores = await getRecentScoresForOrgs(orgIds)
  if (scores.length < 5) return null

  const sorted = [...scores].sort((a, b) => a - b)
  const medie = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length)
  const pozitie = sorted.filter((s) => s < scoreOrg).length
  const percentil = Math.round((pozitie / sorted.length) * 100)

  return {
    medie,
    percentil,
    nrFirme: sorted.length,
    sector: getSectorName(prefix),
  }
}
