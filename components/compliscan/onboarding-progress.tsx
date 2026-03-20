"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react"

import { Card } from "@/components/evidence-os/Card"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"

type OnboardingStep = {
  id: string
  label: string
  hint: string
  href: string
  done: boolean
}

type Props = {
  hasProfile: boolean
  hasAiSystems: boolean
  gdprProgress: number
  hasScans: boolean
  hasResolvedTasks: boolean
}

export function OnboardingProgress({
  hasProfile,
  hasAiSystems,
  gdprProgress,
  hasScans,
  hasResolvedTasks,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const [hasVendors, setHasVendors] = useState(false)
  const [hasMaturity, setHasMaturity] = useState(false)

  useEffect(() => {
    // Fetch vendors
    fetch("/api/nis2/vendors", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { vendors?: unknown[] }) => setHasVendors((d.vendors ?? []).length > 0))
      .catch(() => {})

    // Fetch maturity assessment
    fetch("/api/nis2/maturity", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { assessment?: unknown }) => setHasMaturity(d.assessment != null))
      .catch(() => {})
  }, [])

  const steps: OnboardingStep[] = [
    {
      id: "profile",
      label: "Completează profilul organizației",
      hint: "CUI, sector, număr angajați",
      href: dashboardRoutes.home,
      done: hasProfile,
    },
    {
      id: "maturity",
      label: "Evaluează maturitatea NIS2",
      hint: "Auto-evaluare pe 10 domenii Art.21(2)",
      href: dashboardRoutes.nis2Maturity,
      done: hasMaturity,
    },
    {
      id: "ai",
      label: "Adaugă primul sistem AI în inventar",
      hint: "Completează fișa de sistem AI",
      href: dashboardRoutes.aiSystems,
      done: hasAiSystems,
    },
    {
      id: "gdpr",
      label: "Generează prima politică GDPR",
      hint: "Politică de confidențialitate sau DPA",
      href: dashboardRoutes.policies,
      done: gdprProgress > 0,
    },
    {
      id: "vendors",
      label: "Importă furnizorii din e-Factura",
      hint: "Registru furnizori NIS2 Art.21(2)(d)",
      href: dashboardRoutes.nis2,
      done: hasVendors,
    },
    {
      id: "scan",
      label: "Scanează un document existent",
      hint: "Politică, contract sau procedură internă",
      href: dashboardRoutes.scan,
      done: hasScans,
    },
    {
      id: "finding",
      label: "Rezolvă primul finding",
      hint: "Închide o problemă din lista de acțiuni",
      href: dashboardRoutes.resolve,
      done: hasResolvedTasks,
    },
    {
      id: "dossier",
      label: "Descarcă dosarul de control",
      hint: "ZIP complet pregătit pentru audit DNSC",
      href: dashboardRoutes.reports,
      done: false,
    },
  ]

  const doneCount = steps.filter((s) => s.done).length
  const total = steps.length
  const pct = Math.round((doneCount / total) * 100)

  // Hide at 100%
  if (doneCount === total) return null

  return (
    <Card className="border-eos-border bg-eos-surface">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-semibold text-eos-text">
                Ghid de pornire — {doneCount}/{total} pași completați
              </p>
              <p className="mt-0.5 text-xs text-eos-text-muted">
                Urmați pașii pentru a activa toate funcționalitățile
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className="flex items-center gap-1 text-xs text-eos-text-muted hover:text-eos-text"
          >
            {collapsed ? (
              <>Arată <ChevronDown className="size-3.5" strokeWidth={2} /></>
            ) : (
              <>Minimizează <ChevronUp className="size-3.5" strokeWidth={2} /></>
            )}
          </button>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-eos-border">
            <div
              className="h-full rounded-full bg-eos-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[10px] text-eos-text-muted">{pct}%</p>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-eos-border-subtle px-5 pb-4">
          <ol className="mt-4 space-y-2">
            {steps.map((step, i) => (
              <li key={step.id} className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">
                  {step.done ? (
                    <CheckCircle2 className="size-4 text-emerald-500" strokeWidth={2} />
                  ) : (
                    <Circle className="size-4 text-eos-border" strokeWidth={2} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  {step.done ? (
                    <p className="text-sm text-eos-text-muted line-through">{step.label}</p>
                  ) : (
                    <Link
                      href={step.href}
                      className="text-sm font-medium text-eos-text hover:text-eos-primary hover:underline"
                    >
                      {i + 1}. {step.label}
                    </Link>
                  )}
                  {!step.done && (
                    <p className="mt-0.5 text-[11px] text-eos-text-muted">{step.hint}</p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}
    </Card>
  )
}
