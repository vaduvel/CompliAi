"use client"

import { useEffect, useMemo, useState, type ChangeEvent } from "react"
import { AlertTriangle, ArrowRight, Upload } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

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

  const riskTone =
    latestReport?.riskLevel === "high"
      ? "warning"
      : latestReport?.riskLevel === "medium"
        ? "outline"
        : "success"

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
        <div className="flex items-start gap-3 rounded-eos-md border border-eos-warning/20 bg-eos-warning-soft px-4 py-3 text-sm">
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
        <div className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft/50 p-4 text-sm text-eos-error">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">1. Încarcă datele salariale</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex flex-wrap gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-eos-md border border-eos-border px-3 py-2 text-sm text-eos-text">
                <Upload className="size-4" strokeWidth={2} />
                Încarcă CSV
                <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileInput} />
              </label>
              <Badge variant="outline" className="normal-case tracking-normal">
                {records.length} înregistrări salvate
              </Badge>
              <Badge variant="outline" className="normal-case tracking-normal">
                finding {findingStatus ?? "open"}
              </Badge>
            </div>

            <textarea
              value={csvContent}
              onChange={(event) => setCsvContent(event.target.value)}
              placeholder="Rol,Gen,Salariu brut,Bonusuri,Tip contract,Departament"
              className="min-h-[220px] w-full rounded-eos-md border border-eos-border bg-eos-bg px-4 py-3 text-sm text-eos-text outline-none"
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
          </CardContent>
        </Card>

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">2. Calculează și aprobă raportul</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Metric label="Înregistrări" value={String(records.length)} />
              <Metric label="Raport curent" value={latestReport ? latestReport.status : "lipsește"} />
            </div>

            {latestReport ? (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-eos-text">
                    Gap salarial {latestReport.gapPercent}%
                  </p>
                  <Badge variant={riskTone} className="normal-case tracking-normal">
                    risc {latestReport.riskLevel}
                  </Badge>
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
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                Generează primul draft după ce ai încărcat datele salariale.
              </div>
            )}

            <Button onClick={() => void handleGenerateReport()} disabled={busy || records.length === 0}>
              Calculează gap salarial
              <ArrowRight className="size-4" strokeWidth={2} />
            </Button>
          </CardContent>
        </Card>
      </div>

      {latestReport ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">3. Rezultate pe roluri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {latestReport.gapByRole.length === 0 ? (
              <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4 text-sm text-eos-text-muted">
                Nu există suficiente date pentru comparație pe roluri.
              </div>
            ) : (
              latestReport.gapByRole.map((role) => (
                <div key={role.role} className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-eos-text">{role.role}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        M {role.avgSalaryM} RON · F {role.avgSalaryF} RON · diferență {role.gap} RON
                      </p>
                    </div>
                    <Badge
                      variant={Math.abs(role.gapPercent) > 15 ? "warning" : Math.abs(role.gapPercent) >= 5 ? "outline" : "success"}
                      className="normal-case tracking-normal"
                    >
                      {role.gapPercent}%
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      ) : null}

      {latestReport?.gapByDepartment?.length ? (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-base">4. Semnal pe departamente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 pt-6">
            {latestReport.gapByDepartment.map((department) => (
              <div key={department.dept} className="flex items-center justify-between rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
                <p className="text-sm font-medium text-eos-text">{department.dept}</p>
                <Badge
                  variant={Math.abs(department.gapPercent) > 15 ? "warning" : Math.abs(department.gapPercent) >= 5 ? "outline" : "success"}
                  className="normal-case tracking-normal"
                >
                  {department.gapPercent}%
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
      <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-eos-text-muted">{label}</p>
      <p className="mt-2 text-lg font-semibold text-eos-text">{value}</p>
    </div>
  )
}
