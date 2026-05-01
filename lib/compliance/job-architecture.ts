// Pay Transparency — Job Architecture builder
// Schema: level × role × salary band (min/max RON brut)
// Conform Directivei (UE) 2023/970 — transpunere RO 7 iunie 2026

export type JobLevel = string
export type JobRole = string

export type SalaryBand = {
  level: JobLevel
  role: JobRole
  min: number // RON brut/lună
  max: number // RON brut/lună
  currency?: "RON" | "EUR"
}

/**
 * Computed salary range pentru un (level, role) — derivat din band cu mid =
 * (min + max) / 2 rounded la integer.
 */
export type SalaryRange = {
  min: number
  mid: number
  max: number
}

export type JobArchitecture = {
  levels: JobLevel[]
  roles: JobRole[]
  bands: SalaryBand[]
}

export type JobArchitectureInput = {
  levels: JobLevel[]
  roles: JobRole[]
  bands: SalaryBand[]
}

/**
 * Build job architecture from input — dedupes + sorts levels/roles, keeps
 * bands as-is.
 */
export function buildJobArchitecture(input: JobArchitectureInput): JobArchitecture {
  return {
    levels: [...new Set(input.levels)].sort(),
    roles: [...new Set(input.roles)].sort(),
    bands: input.bands,
  }
}

/**
 * Compute salary range pentru un (level, role) lookup în architecture.
 * Returns null dacă nu există band pentru combinația dată.
 */
export function computeSalaryRange(
  arch: JobArchitecture,
  level: JobLevel,
  role: JobRole,
): SalaryRange | null {
  const band = arch.bands.find((b) => b.level === level && b.role === role)
  if (!band) return null
  return {
    min: band.min,
    mid: Math.round((band.min + band.max) / 2),
    max: band.max,
  }
}
