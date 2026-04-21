"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, ClipboardCheck, Shield, Users } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import type { MaturityAssessment, BoardMember, Nis2Incident } from "@/lib/server/nis2-store"

// ── NIS2 Progress Stepper ───────────────────────────────────────────────────────

type StepStatus = "done" | "in_progress" | "pending"

export function Nis2ProgressStepper() {
  const [maturityDone, setMaturityDone] = useState<boolean | null>(null)
  const [hasIncidents, setHasIncidents] = useState<boolean | null>(null)
  const [governanceDone, setGovernanceDone] = useState<boolean | null>(null)

  useEffect(() => {
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: MaturityAssessment | null }) => setMaturityDone(!!d.assessment))
      .catch(() => setMaturityDone(false))

    fetch("/api/nis2/incidents", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { incidents: Nis2Incident[] }) => setHasIncidents(Array.isArray(d.incidents)))
      .catch(() => setHasIncidents(false))

    fetch("/api/nis2/governance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { members: BoardMember[] }) => setGovernanceDone((d.members ?? []).length > 0))
      .catch(() => setGovernanceDone(false))
  }, [])

  const steps: { label: string; sub: string; status: StepStatus; href: string; anchor?: string }[] = [
    {
      label: "Clasificare",
      sub: "Sector și tip entitate",
      status: "done",
      href: "/dashboard/monitorizare/nis2",
    },
    {
      label: "Maturitate",
      sub: "Auto-evaluare DNSC",
      status: maturityDone === null ? "pending" : maturityDone ? "done" : "in_progress",
      href: "/dashboard/monitorizare/nis2/maturitate",
    },
    {
      label: "Incidente",
      sub: "Log SLA 24h / 72h",
      status: hasIncidents === null ? "pending" : hasIncidents ? "done" : "pending",
      href: "/dashboard/monitorizare/nis2",
      anchor: "incidents",
    },
    {
      label: "Guvernanță",
      sub: "Board & CISO training",
      status: governanceDone === null ? "pending" : governanceDone ? "done" : "in_progress",
      href: "/dashboard/monitorizare/nis2/governance",
    },
  ]

  const statusIcon: Record<StepStatus, string> = {
    done: "✓",
    in_progress: "⚠",
    pending: "—",
  }
  const statusColor: Record<StepStatus, string> = {
    done: "border-eos-success/30 bg-eos-success-soft text-eos-success",
    in_progress: "border-eos-warning/30 bg-eos-warning-soft text-eos-warning",
    pending: "border-eos-border bg-eos-surface text-eos-text-muted",
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {steps.map((step, i) => (
        <Link
          key={step.label}
          href={step.anchor ? `${step.href}#${step.anchor}` : step.href}
          className={`flex flex-col gap-1 rounded-eos-lg border px-3 py-2.5 transition-all hover:border-eos-primary/40 ${statusColor[step.status]}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-medium text-eos-text-tertiary">Pasul {i + 1}</span>
            <span className="text-[11px] font-bold">{statusIcon[step.status]}</span>
          </div>
          <p className="text-sm font-semibold leading-tight">{step.label}</p>
          <p className="text-[11px] leading-tight opacity-70">{step.sub}</p>
        </Link>
      ))}
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function MaturityCard() {
  const [assessment, setAssessment] = useState<MaturityAssessment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment: MaturityAssessment | null }) => setAssessment(d.assessment ?? null))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  if (!assessment) {
    return (
      <Link href="/dashboard/monitorizare/nis2/maturitate" className="block">
        <div className="flex items-center justify-between gap-4 rounded-eos-lg border border-dashed border-eos-primary/40 bg-eos-primary-soft px-4 py-3 transition-all hover:border-eos-primary/70">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="size-5 shrink-0 text-eos-primary" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-eos-text">Auto-evaluare maturitate DNSC</p>
              <p className="text-xs text-eos-text-muted">Obligatorie — OUG 155/2024 Art.18(7) ✅ · ~15 min · 10 domenii</p>
            </div>
          </div>
          <Badge variant="warning" className="shrink-0">Necompletată</Badge>
        </div>
      </Link>
    )
  }

  const daysLeft = Math.ceil(
    (new Date(assessment.remediationPlanDue).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Link href="/dashboard/monitorizare/nis2/maturitate" className="block">
      <div className="flex items-center justify-between gap-4 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3 transition-all hover:border-eos-primary/40">
        <div className="flex items-center gap-3">
          <ClipboardCheck className="size-5 shrink-0 text-eos-primary" strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-eos-text">
              Maturitate DNSC — {assessment.overallScore}%
            </p>
            <p className="text-xs text-eos-text-muted">
              Nivel {assessment.level} ·{" "}
              {daysLeft > 0
                ? `Plan remediere în ${daysLeft} zile`
                : "⚠ Deadline plan remediere depășit"}
            </p>
          </div>
        </div>
        <Badge
          variant={assessment.level === "essential" ? "success" : assessment.level === "important" ? "warning" : "destructive"}
          className="shrink-0 normal-case"
        >
          {assessment.level}
        </Badge>
      </div>
    </Link>
  )
}

export function GovernanceCard() {
  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/nis2/governance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { members: BoardMember[] }) => setMembers(d.members ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return null

  const missingTraining = members.filter((m) => !m.nis2TrainingCompleted).length
  const issues = missingTraining

  return (
    <Link href="/dashboard/monitorizare/nis2/governance" className="block">
      <div className={`flex items-center justify-between gap-4 rounded-eos-lg border px-4 py-3 transition-all hover:border-eos-primary/40 ${
        members.length === 0
          ? "border-dashed border-eos-border bg-eos-surface"
          : issues > 0
            ? "border-eos-warning/30 bg-eos-warning-soft"
            : "border-eos-border bg-eos-surface"
      }`}>
        <div className="flex items-center gap-3">
          <Users className={`size-5 shrink-0 ${issues > 0 ? "text-eos-warning" : "text-eos-primary"}`} strokeWidth={1.5} />
          <div>
            <p className="text-sm font-semibold text-eos-text">Training Board & CISO</p>
            <p className="text-xs text-eos-text-muted">
              {members.length === 0
                ? "Adaugă membrii conducerii — OUG 155/2024 Art. 14 ✅"
                : `${members.length} membri · ${missingTraining > 0 ? `${missingTraining} fără training` : "toți cu training documentat"}`}
            </p>
          </div>
        </div>
        {members.length === 0 ? (
          <Badge variant="outline" className="shrink-0">Necompletat</Badge>
        ) : issues > 0 ? (
          <Badge variant="warning" className="shrink-0">{issues} problemă{issues > 1 ? "i" : ""}</Badge>
        ) : (
          <Badge variant="success" className="shrink-0">Conform</Badge>
        )}
      </div>
    </Link>
  )
}
