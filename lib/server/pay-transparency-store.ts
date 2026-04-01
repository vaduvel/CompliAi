import { createAdaptiveStorage } from "@/lib/server/storage-adapter"
import { calculatePayGap } from "@/lib/compliance/pay-gap-calculator"

export type SalaryRecordInput = {
  jobRole: string
  gender: "M" | "F" | "other" | "undisclosed"
  salaryBrut: number
  salaryBonuses: number
  contractType: "full-time" | "part-time"
  department?: string
}

export type SalaryRecord = SalaryRecordInput & {
  id: string
  orgId: string
  createdAtISO: string
}

export type PayGapReport = {
  id: string
  orgId: string
  generatedAtISO: string
  periodYear: number
  totalEmployees: number
  avgSalaryM: number
  avgSalaryF: number
  gapPercent: number
  gapByRole: { role: string; avgSalaryM: number; avgSalaryF: number; gap: number; gapPercent: number }[]
  gapByDepartment?: { dept: string; gapPercent: number }[]
  riskLevel: "low" | "medium" | "high"
  obligationMet: boolean
  status: "draft" | "approved" | "published"
  approvedAtISO?: string
  publishedAtISO?: string
  recommendations: string[]
}

type PayTransparencyState = {
  records: SalaryRecord[]
  reports: PayGapReport[]
}

const storage = createAdaptiveStorage<PayTransparencyState>(
  "pay-transparency",
  "pay_transparency_state"
)

export async function saveSalaryRecords(
  orgId: string,
  records: SalaryRecordInput[]
): Promise<SalaryRecord[]> {
  const current = (await storage.read(orgId)) ?? { records: [], reports: [] }
  const nowISO = new Date().toISOString()
  const nextRecords = records.map((record) => ({
    ...record,
    id: `salary-${Math.random().toString(36).slice(2, 10)}`,
    orgId,
    createdAtISO: nowISO,
  }))

  await storage.write(orgId, {
    ...current,
    records: nextRecords,
  })

  return nextRecords
}

export async function listSalaryRecords(orgId: string): Promise<SalaryRecord[]> {
  const current = (await storage.read(orgId)) ?? { records: [], reports: [] }
  return [...current.records].sort((left, right) => left.jobRole.localeCompare(right.jobRole, "ro"))
}

export async function listPayGapReports(orgId: string): Promise<PayGapReport[]> {
  const current = (await storage.read(orgId)) ?? { records: [], reports: [] }
  return [...current.reports].sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))
}

export async function getPayGapReport(orgId: string, reportId: string): Promise<PayGapReport | null> {
  const reports = await listPayGapReports(orgId)
  return reports.find((report) => report.id === reportId) ?? null
}

export async function buildPayGapReport(orgId: string, year: number): Promise<PayGapReport> {
  const current = (await storage.read(orgId)) ?? { records: [], reports: [] }
  const analysis = calculatePayGap(current.records)
  const men = current.records.filter((record) => record.gender === "M")
  const women = current.records.filter((record) => record.gender === "F")
  const avgSalaryM =
    men.length === 0 ? 0 : men.reduce((sum, record) => sum + record.salaryBrut + record.salaryBonuses, 0) / men.length
  const avgSalaryF =
    women.length === 0 ? 0 : women.reduce((sum, record) => sum + record.salaryBrut + record.salaryBonuses, 0) / women.length

  const report: PayGapReport = {
    id: `pay-gap-${Math.random().toString(36).slice(2, 10)}`,
    orgId,
    generatedAtISO: new Date().toISOString(),
    periodYear: year,
    totalEmployees: current.records.length,
    avgSalaryM: round(avgSalaryM),
    avgSalaryF: round(avgSalaryF),
    gapPercent: analysis.overallGapPercent,
    gapByRole: analysis.byRole.map((item) => ({
      role: item.role,
      avgSalaryM: item.avgM,
      avgSalaryF: item.avgF,
      gap: item.gap,
      gapPercent: item.gapPercent,
    })),
    gapByDepartment: analysis.byDepartment,
    riskLevel: analysis.riskLevel,
    obligationMet: analysis.obligationMet,
    status: "draft",
    recommendations: analysis.recommendations,
  }

  await storage.write(orgId, {
    ...current,
    reports: [report, ...current.reports].slice(0, 20),
  })

  return report
}

export async function approvePayGapReport(orgId: string, reportId: string): Promise<PayGapReport> {
  return updatePayGapReportStatus(orgId, reportId, "approved")
}

export async function publishPayGapReport(orgId: string, reportId: string): Promise<PayGapReport> {
  return updatePayGapReportStatus(orgId, reportId, "published")
}

export function buildPayGapReportMarkdown(report: PayGapReport) {
  const roleLines =
    report.gapByRole.length === 0
      ? "- Nu există suficiente date pe roluri pentru comparație."
      : report.gapByRole.map((role) => `- ${role.role}: ${role.gapPercent}%`).join("\n")

  return [
    "# Raport Pay Transparency",
    "",
    `**Perioadă:** ${report.periodYear}`,
    `**Data generării:** ${new Date(report.generatedAtISO).toLocaleDateString("ro-RO")}`,
    `**Total angajați incluși:** ${report.totalEmployees}`,
    "",
    "## Rezumat",
    "",
    `- Medie M: ${report.avgSalaryM} RON`,
    `- Medie F: ${report.avgSalaryF} RON`,
    `- Gap salarial: ${report.gapPercent}%`,
    `- Nivel risc: ${report.riskLevel}`,
    `- Prag de obligație îndeplinit: ${report.obligationMet ? "da" : "nu"}`,
    `- Status: ${report.status}`,
    "",
    "## Gap pe roluri",
    "",
    roleLines,
    "",
    report.gapByDepartment?.length
      ? "## Gap pe departamente"
      : null,
    report.gapByDepartment?.length
      ? ""
      : null,
    ...(report.gapByDepartment ?? []).map((item) => `- ${item.dept}: ${item.gapPercent}%`),
    "",
    "## Recomandări",
    "",
    ...report.recommendations.map((item) => `- ${item}`),
  ]
    .filter((line): line is string => typeof line === "string")
    .join("\n")
}

async function updatePayGapReportStatus(
  orgId: string,
  reportId: string,
  status: "approved" | "published"
): Promise<PayGapReport> {
  const current = (await storage.read(orgId)) ?? { records: [], reports: [] }
  const reportIndex = current.reports.findIndex((report) => report.id === reportId)
  if (reportIndex === -1) {
    throw new Error("PAY_GAP_REPORT_NOT_FOUND")
  }

  const nowISO = new Date().toISOString()
  const updatedReport: PayGapReport = {
    ...current.reports[reportIndex],
    status,
    approvedAtISO: status === "approved" || status === "published" ? nowISO : current.reports[reportIndex].approvedAtISO,
    publishedAtISO: status === "published" ? nowISO : current.reports[reportIndex].publishedAtISO,
  }

  const reports = [...current.reports]
  reports[reportIndex] = updatedReport
  await storage.write(orgId, { ...current, reports })
  return updatedReport
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
