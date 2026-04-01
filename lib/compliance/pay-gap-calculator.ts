export type PayGapInputRecord = {
  jobRole: string
  gender: "M" | "F" | "other" | "undisclosed"
  salaryBrut: number
  salaryBonuses: number
  department?: string
}

export type PayGapAnalysis = {
  overallGapPercent: number
  byRole: { role: string; avgM: number; avgF: number; gap: number; gapPercent: number }[]
  byDepartment?: { dept: string; gapPercent: number }[]
  riskLevel: "low" | "medium" | "high"
  obligationMet: boolean
  recommendations: string[]
}

export function calculatePayGap(records: PayGapInputRecord[]): PayGapAnalysis {
  const normalized = records.filter((record) => Number.isFinite(record.salaryBrut) && record.salaryBrut > 0)
  const overall = computeGap(normalized)
  const byRole = groupBy(normalized, (record) => record.jobRole.trim() || "Nedefinit")
    .map(([role, roleRecords]) => {
      const result = computeGap(roleRecords)
      return {
        role,
        avgM: result.avgM,
        avgF: result.avgF,
        gap: result.avgM - result.avgF,
        gapPercent: result.gapPercent,
      }
    })
    .sort((left, right) => Math.abs(right.gapPercent) - Math.abs(left.gapPercent))

  const byDepartment = groupBy(
    normalized.filter((record) => record.department?.trim()),
    (record) => record.department!.trim()
  ).map(([dept, deptRecords]) => ({
    dept,
    gapPercent: computeGap(deptRecords).gapPercent,
  }))

  const absoluteGap = Math.abs(overall.gapPercent)
  const riskLevel =
    absoluteGap > 15 ? "high" : absoluteGap >= 5 ? "medium" : "low"

  const recommendations = [
    absoluteGap >= 5
      ? "Analizează rolurile cu gap mare și documentează criteriile obiective de remunerare."
      : "Menține evidența criteriilor de remunerare și revizuiește anual structura salarială.",
    byRole[0] && Math.abs(byRole[0].gapPercent) >= 10
      ? `Prioritizează rolul ${byRole[0].role}, unde gap-ul depășește ${Math.round(Math.abs(byRole[0].gapPercent))}%.`
      : "Publică intern metodologia de calcul și traseul de aprobare al raportului.",
    "Pregătește răspunsul standard pentru solicitările individuale privind nivelurile salariale.",
  ]

  return {
    overallGapPercent: round(overall.gapPercent),
    byRole: byRole.map((item) => ({
      ...item,
      avgM: round(item.avgM),
      avgF: round(item.avgF),
      gap: round(item.gap),
      gapPercent: round(item.gapPercent),
    })),
    byDepartment: byDepartment.length > 0 ? byDepartment.map((item) => ({ ...item, gapPercent: round(item.gapPercent) })) : undefined,
    riskLevel,
    obligationMet: absoluteGap < 5,
    recommendations,
  }
}

function computeGap(records: PayGapInputRecord[]) {
  const men = records.filter((record) => record.gender === "M")
  const women = records.filter((record) => record.gender === "F")
  const avgM = average(men.map(totalCompensation))
  const avgF = average(women.map(totalCompensation))
  const gapPercent = avgM > 0 ? ((avgM - avgF) / avgM) * 100 : 0

  return { avgM, avgF, gapPercent }
}

function totalCompensation(record: PayGapInputRecord) {
  return record.salaryBrut + record.salaryBonuses
}

function average(values: number[]) {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

function groupBy<T>(items: T[], keyFn: (item: T) => string) {
  const groups = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    const existing = groups.get(key) ?? []
    existing.push(item)
    groups.set(key, existing)
  }
  return [...groups.entries()]
}
