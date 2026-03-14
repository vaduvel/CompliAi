import { promises as fs } from "node:fs"
import path from "node:path"

export type StoredRlsVerificationSnapshot = {
  checkedAtISO: string
  ready: boolean
  runId?: string
  blockers?: string[]
  checks?: Array<{
    name: string
    ok: boolean
    detail?: string
  }>
}

export type RlsVerificationReadiness = {
  ready: boolean
  state: "healthy" | "degraded"
  summary: string
  blockers: string[]
  checkedAtISO: string | null
  ageHours: number | null
}

const DEFAULT_MAX_AGE_HOURS = 24

export function getRlsVerificationFilePath() {
  const explicit = process.env.COMPLISCAN_RLS_VERIFICATION_FILE?.trim()
  if (explicit) return explicit
  return path.join(process.cwd(), ".data", "ops", "last-rls-verification.json")
}

export async function readStoredRlsVerificationSnapshot(): Promise<StoredRlsVerificationSnapshot | null> {
  try {
    const raw = await fs.readFile(getRlsVerificationFilePath(), "utf8")
    return JSON.parse(raw) as StoredRlsVerificationSnapshot
  } catch {
    return null
  }
}

export async function getRlsVerificationReadiness(
  maxAgeHours = DEFAULT_MAX_AGE_HOURS
): Promise<RlsVerificationReadiness> {
  const snapshot = await readStoredRlsVerificationSnapshot()

  if (!snapshot) {
    return {
      ready: false,
      state: "degraded",
      summary: "Nu exista inca o verificare RLS rulata local pentru mediul curent.",
      blockers: ["Rulati `npm run verify:supabase:rls` inainte de release controlat."],
      checkedAtISO: null,
      ageHours: null,
    }
  }

  const checkedAtMs = Date.parse(snapshot.checkedAtISO)
  if (Number.isNaN(checkedAtMs)) {
    return {
      ready: false,
      state: "degraded",
      summary: "Marker-ul ultimei verificari RLS este invalid.",
      blockers: ["Regenerati marker-ul cu `npm run verify:supabase:rls`."],
      checkedAtISO: snapshot.checkedAtISO,
      ageHours: null,
    }
  }

  const ageHours = (Date.now() - checkedAtMs) / (60 * 60 * 1000)

  if (!snapshot.ready) {
    return {
      ready: false,
      state: "degraded",
      summary:
        snapshot.blockers?.[0] ||
        "Ultima verificare RLS a esuat si cere investigatie inainte de release.",
      blockers:
        snapshot.blockers && snapshot.blockers.length > 0
          ? snapshot.blockers
          : ["Ultima verificare RLS a esuat."],
      checkedAtISO: snapshot.checkedAtISO,
      ageHours,
    }
  }

  if (ageHours > maxAgeHours) {
    return {
      ready: false,
      state: "degraded",
      summary: `Ultima verificare RLS are ${Math.floor(ageHours)}h si este prea veche pentru release controlat.`,
      blockers: ["Rulati din nou `npm run verify:supabase:rls` pentru un verdict proaspat."],
      checkedAtISO: snapshot.checkedAtISO,
      ageHours,
    }
  }

  return {
    ready: true,
    state: "healthy",
    summary: "Ultima verificare RLS este proaspata si a trecut fara blocaje.",
    blockers: [],
    checkedAtISO: snapshot.checkedAtISO,
    ageHours,
  }
}
