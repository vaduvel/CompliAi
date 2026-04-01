import type { SalaryRecordInput } from "@/lib/server/pay-transparency-store"

const HEADER_ALIASES: Record<keyof SalaryRecordInput, string[]> = {
  jobRole: ["rol", "functie", "funcție", "job", "position", "job role"],
  gender: ["gen", "gender", "sex"],
  salaryBrut: ["salariu brut", "salary", "brut", "salary brut", "salariu"],
  salaryBonuses: ["bonus", "bonusuri", "bonuses"],
  contractType: ["contract", "contract type", "tip contract"],
  department: ["departament", "department", "dept"],
}

export function parseSalaryCSV(csvContent: string): SalaryRecordInput[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length < 2) return []

  const headers = splitCsvLine(lines[0]).map(normalizeHeader)
  const headerMap = new Map<keyof SalaryRecordInput, number>()

  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as Array<[keyof SalaryRecordInput, string[]]>) {
    const index = headers.findIndex((header) => aliases.some((alias) => header.includes(alias)))
    if (index >= 0) headerMap.set(field, index)
  }

  return lines.slice(1).flatMap((line) => {
    const columns = splitCsvLine(line)
    const jobRole = readColumn(columns, headerMap.get("jobRole"))
    const gender = normalizeGender(readColumn(columns, headerMap.get("gender")))
    const salaryBrut = parseMoney(readColumn(columns, headerMap.get("salaryBrut")))
    const salaryBonuses = parseMoney(readColumn(columns, headerMap.get("salaryBonuses")))
    const contractType = normalizeContractType(readColumn(columns, headerMap.get("contractType")))
    const department = readColumn(columns, headerMap.get("department")) || undefined

    if (!jobRole || !gender || !contractType || !Number.isFinite(salaryBrut)) return []

    return [
      {
        jobRole,
        gender,
        salaryBrut,
        salaryBonuses: Number.isFinite(salaryBonuses) ? salaryBonuses : 0,
        contractType,
        department,
      },
    ]
  })
}

function splitCsvLine(line: string) {
  const result: string[] = []
  let current = ""
  let insideQuotes = false

  for (const char of line) {
    if (char === "\"") {
      insideQuotes = !insideQuotes
      continue
    }

    if (char === "," && !insideQuotes) {
      result.push(current.trim())
      current = ""
      continue
    }

    current += char
  }

  result.push(current.trim())
  return result
}

function normalizeHeader(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function readColumn(columns: string[], index: number | undefined) {
  if (index == null || index < 0 || index >= columns.length) return ""
  return columns[index]?.trim() ?? ""
}

function normalizeGender(value: string): SalaryRecordInput["gender"] | null {
  const normalized = value.trim().toLowerCase()
  if (["m", "male", "masculin", "barbat", "bărbat"].includes(normalized)) return "M"
  if (["f", "female", "feminin", "femeie"].includes(normalized)) return "F"
  if (["other", "alt", "divers"].includes(normalized)) return "other"
  if (["undisclosed", "prefer not to say", "nedeclarat"].includes(normalized)) return "undisclosed"
  return null
}

function normalizeContractType(value: string): SalaryRecordInput["contractType"] | null {
  const normalized = value.trim().toLowerCase()
  if (["full-time", "full time", "norma intreaga", "normă întreagă"].includes(normalized)) {
    return "full-time"
  }
  if (["part-time", "part time", "fractionat", "fracționat"].includes(normalized)) {
    return "part-time"
  }
  return null
}

function parseMoney(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^0-9.-]/g, "")
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : Number.NaN
}
