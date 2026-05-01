// Pay Transparency — Salary Range Generator pentru anunțuri job
// Output formatat pentru BestJobs / LinkedIn / eJobs / generic
// Conform Directivei (UE) 2023/970, art. 5: angajatorul publică salariu sau range
// Transpunere RO 7 iunie 2026.

import type { SalaryRange } from "./job-architecture"

export type AdFormat = "bestjobs" | "linkedin" | "ejobs" | "generic"

export type SalaryRangeAdInput = {
  role: string
  level: string
  range: SalaryRange
  currency: "RON" | "EUR"
  format: AdFormat
}

const DIRECTIVE_DISCLAIMER =
  "(Conform Directivei UE 2023/970, range salarial publicat conform politicii de transparență.)"

export function generateRangeForJobAd(input: SalaryRangeAdInput): string {
  const { role, level, range, currency, format } = input

  const fmt = (n: number): string =>
    format === "linkedin" ? n.toLocaleString("en-US") : n.toLocaleString("ro-RO")

  const symbol = currency

  switch (format) {
    case "bestjobs":
      return [
        `${role} (${level})`,
        `Salariu brut: ${fmt(range.min)} - ${fmt(range.max)} ${symbol}/lună`,
        DIRECTIVE_DISCLAIMER,
      ].join("\n")
    case "linkedin":
      return [
        `${role} — ${level} level`,
        `Salary range: ${fmt(range.min)}-${fmt(range.max)} ${symbol}/month gross`,
        DIRECTIVE_DISCLAIMER,
      ].join("\n")
    case "ejobs":
      return [
        `Pentru rolul de ${role} (nivel ${level}), oferim:`,
        `- Salariu brut între ${fmt(range.min)} și ${fmt(range.max)} ${symbol}/lună`,
        DIRECTIVE_DISCLAIMER,
      ].join("\n")
    case "generic":
    default:
      return [
        `${role} - ${level}`,
        `${fmt(range.min)}-${fmt(range.max)} ${symbol}`,
        DIRECTIVE_DISCLAIMER,
      ].join("\n")
  }
}
