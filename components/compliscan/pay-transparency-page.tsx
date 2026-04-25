"use client"

import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react"
import { AlertTriangle, ArrowRight, Upload } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"

type SalaryRecord = {
  id: string
  jobRole: string
  gender: "M" | "F" | "other" | "undisclosed"
  salaryBrut: number
  salaryBonuses: number
  contractType: "full-time" | "part-time"
  department?: string
}

type PayGapReport = {
  id: string
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
  recommendations: string[]
}

function GapChip({ value, children }: { value: number; children?: ReactNode }) {
  const abs = Math.abs(value)
  if (abs > 15) {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        {children ?? `${value}%`}
      </span>
    )
  }
  if (abs >= 5) {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
        {children ?? `${value}%`}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-success">
      {children ?? `${value}%`}
    </span>
  )
}

function RiskChip({ risk }: { risk: "low" | "medium" | "high" }) {
  if (risk === "high") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-warning/30 bg-eos-warning-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-warning">
        risc high
      </span>
    )
  }
  if (risk === "medium") {
    return (
      <span className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
        risc medium
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-sm border border-eos-success/30 bg-eos-success-soft px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-success">
      risc low
    </span>
  )
}

export function PayTransparencyPage() {
  const [records, setRecords] = useState<SalaryRecord[]>([])
  const [latestReport, setLatestReport] = useState<PayGapReport | null>(null)
  const [csvContent, setCsvContent] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [findingStatus, setFindingStatus] = useState<string | null>(null)

  useEffect(() => {
    void reload().catch((cause) => {
      setError(cause instanceof Error ? cause.message : "Nu am putut încărca fluxul Pay Transparency.")
    })
  }, [])

  const deadline = new Date("2026-06-07T00:00:00+03:00")
  const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / 86_400_000)
  const showDeadlineBanner = daysRemaining <= 60

  const topRoleGap = useMemo(
    () => latestReport?.gapByRole[0] ?? null,
    [latestReport]
  )
  const genderMix = useMemo(() => {
    const men = records.filter((record) => record.gender === "M").length
    const women = records.filter((record) => record.gender === "F").length
    const hidden = records.filter((record) => record.gender !== "M" && record.gender !== "F").length
    return { men, women, hidden }
  }, [records])

  const rolePreview = useMemo(() => {
    const uniqueRoles = new Set(records.map((record) => record.jobRole.trim()).filter(Boolean))
    return uniqueRoles.size
  }, [records])

  async function reload() {
    const response = await fetch("/api/pay-transparency", { cache: "no-store" })
    if (!response.ok) throw new Error("Nu am putut încărca fluxul Pay Transparency.")
    const payload = (await response.json()) as {
      records: SalaryRecord[]
      latestReport: PayGapReport | null
      findingStatus: string | null
    }
    setRecords(payload.records ?? [])
    setLatestReport(payload.latestReport ?? null)
    setFindingStatus(payload.findingStatus ?? null)
  }

  async function handleUpload() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/pay-transparency/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvContent }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Uploadul a eșuat.")
      }
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Uploadul a eșuat.")
    } finally {
      setBusy(false)
    }
  }

  async function handleGenerateReport() {
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/pay-transparency/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year: new Date().getFullYear() }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Nu am putut genera raportul.")
      }
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nu am putut genera raportul.")
    } finally {
      setBusy(false)
    }
  }

  async function handleApprove(status: "approved" | "published") {
    if (!latestReport) return
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/pay-transparency/report/${latestReport.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.message ?? payload?.error ?? "Nu am putut aproba raportul.")
      }
      await reload()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Nu am putut aproba raportul.")
    } finally {
      setBusy(false)
    }
  }

  async function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const text = await file.text()
    setCsvContent(text)
  }

  return (
    <div className="space-y-6">
      {showDeadlineBanner ? (
        <div className="flex items-start gap-3 rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-4 py-3 text-sm">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <div>
            <p className="font-semibold text-eos-warning">Deadline 7 iunie 2026</p>
            <p className="mt-1 text-xs text-eos-warning">
              Mai sunt {daysRemaining} zile până la termenul de transpunere. Dacă firma are 50+ angajați, pregătirea gap-ului salarial nu mai e un task de backlog.
            </p>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft/50 p-4 text-sm text-eos-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              1. Încarcă datele salariale
            </h3>
          </header>
          <div className="space-y-4 px-4 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-eos-sm border border-eos-border px-3 py-2 text-sm text-eos-text transition hover:border-eos-border-strong">
                <Upload className="size-4" strokeWidth={2} />
                Încarcă CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileInput} />
              </label>
              <span className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                {records.length} înregistrări salvate
              </span>
              <span className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.04] px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
                finding {findingStatus ?? "open"}
              </span>
            </div>

            <textarea
              value={csvContent}
              onChange={(event) => setCsvContent(event.target.value)}
              placeholder="Rol,Gen,Salariu brut,Bonusuri,Tip contract,Departament"
              className="min-h-[220px] w-full rounded-eos-sm border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
            />

            <Button onClick={() => void handleUpload()} disabled={busy || !csvContent.trim()}>
              Salvează datele salariale
            </Button>

            {records.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Roluri detectate" value={String(rolePreview)} />
                <Metric label="M" value={String(genderMix.men)} />
                <Metric label="F / altul" value={String(genderMix.women + genderMix.hidden)} />
              </div>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              2. Calculează și aprobă raportul
            </h3>
          </header>
          <div className="space-y-4 px-4 py-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Înregistrări" value={String(records.length)} />
              <Metric label="Raport curent" value={latestReport ? latestReport.status : "lipsește"} />
            </div>

            {latestReport ? (
              <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-eos-text">
                    Gap salarial {latestReport.gapPercent}%
                  </p>
                  <RiskChip risk={latestReport.riskLevel} />
                </div>
                <p className="mt-1 text-xs text-eos-text-muted">
                  Medie M {latestReport.avgSalaryM} RON · Medie F {latestReport.avgSalaryF} RON
                </p>
                {topRoleGap ? (
                  <p className="mt-2 text-xs text-eos-text-muted">
                    Rol critic: {topRoleGap.role} · gap {topRoleGap.gapPercent}% · M {topRoleGap.avgSalaryM} RON · F {topRoleGap.avgSalaryF} RON
                  </p>
                ) : null}
                <p className="mt-2 text-xs text-eos-text-muted">
                  Prag obligație: {latestReport.obligationMet ? "acoperit" : "neacoperit"}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => void handleApprove("approved")} disabled={busy}>
                    Aprobă raportul
                  </Button>
                  <Button onClick={() => void handleApprove("published")} disabled={busy}>
                    Marchează publicat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4 text-sm text-eos-text-muted">
                Generează primul draft după ce ai încărcat datele salariale.
              </div>
            )}

            <Button onClick={() => void handleGenerateReport()} disabled={busy || records.length === 0}>
              Calculează gap salarial
              <ArrowRight className="size-4" strokeWidth={2} />
            </Button>
          </div>
        </section>
      </div>

      {latestReport ? (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              3. Rezultate pe roluri
            </h3>
          </header>
          <div className="space-y-3 px-4 py-4">
            {latestReport.gapByRole.length === 0 ? (
              <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4 text-sm text-eos-text-muted">
                Nu există suficiente date pentru comparație pe roluri.
              </div>
            ) : (
              latestReport.gapByRole.map((role) => (
                <div key={role.role} className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-eos-text">{role.role}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        M {role.avgSalaryM} RON · F {role.avgSalaryF} RON · diferență {role.gap} RON
                      </p>
                    </div>
                    <GapChip value={role.gapPercent} />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      ) : null}

      {latestReport?.gapByDepartment?.length ? (
        <section className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
          <header className="border-b border-eos-border-subtle px-4 py-3.5">
            <h3
              data-display-text="true"
              className="font-display text-[14.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              4. Semnal pe departamente
            </h3>
          </header>
          <div className="space-y-3 px-4 py-4">
            {latestReport.gapByDepartment.map((department) => (
              <div key={department.dept} className="flex items-center justify-between rounded-eos-sm border border-eos-border bg-white/[0.02] p-4">
                <p className="text-sm font-medium text-eos-text">{department.dept}</p>
                <GapChip value={department.gapPercent} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">{label}</p>
      <p className="mt-2 text-lg font-semibold text-eos-text">{value}</p>
    </div>
  )
}
