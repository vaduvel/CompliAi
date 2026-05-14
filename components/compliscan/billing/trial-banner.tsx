"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, Clock, Download, X } from "lucide-react"
import { deriveAccountState, type AccountStateInfo } from "@/lib/billing/account-state"
import type { OrgPlan } from "@/lib/shared/plan-constants"

// S3.4 — Progressive trial banner (days 11-14, then expired state).
// Fetches plan info from /api/plan and derives account state.

export function TrialBanner() {
  const [info, setInfo] = useState<AccountStateInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  // [FC-12 fix 2026-05-14] Maria persona test: trial banner apărea simultan cu DEV banner
  // și o panica ("sunt logată ca Ana Maria și apare expirat?"). Pe deploy fiscal pilot,
  // toți userii sunt în program pilot 3 luni gratuit — nu există trial expirat.
  // Ascundem complet banner-ul în fiscal mode pentru a evita confuzia.
  const isFiscalMode = process.env.NEXT_PUBLIC_PRODUCT_MODE === "fiscal"

  useEffect(() => {
    if (isFiscalMode) return
    fetch("/api/plan")
      .then((r) => r.json())
      .then((data: { plan: OrgPlan; trialEndsAtISO: string | null }) => {
        const derived = deriveAccountState(data.plan, data.trialEndsAtISO)
        if (derived.showBanner) setInfo(derived)
      })
      .catch(() => {})
  }, [isFiscalMode])

  if (isFiscalMode || !info || !info.showBanner || dismissed) return null

  const isExpired = info.state === "trial_expired"
  const bgColor = isExpired
    ? "bg-eos-error/90 border-eos-error/50"
    : info.bannerSeverity === "error"
      ? "bg-eos-warning/90 border-eos-warning/70"
      : "bg-eos-warning/80 border-eos-warning/60"

  const Icon = isExpired ? AlertTriangle : Clock

  return (
    <div className={`relative flex items-center gap-3 border-b px-4 py-2.5 text-sm text-white ${bgColor}`}>
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{info.bannerMessage}</span>
      <div className="flex items-center gap-2">
        {info.canExport && (
          <Link
            href="/api/account/export-data"
            className="inline-flex items-center gap-1 rounded bg-white/20 px-2 py-1 text-xs font-medium hover:bg-white/30"
          >
            <Download className="size-3" />
            Export date
          </Link>
        )}
        {!isExpired && (
          <Link
            href="/pricing"
            className="rounded bg-white px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-white/90"
          >
            Upgrade
          </Link>
        )}
        {isExpired && (
          <Link
            href="/pricing"
            className="rounded bg-eos-success px-3 py-1 text-xs font-semibold text-white hover:bg-eos-success"
          >
            Reactivează cont
          </Link>
        )}
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            className="rounded p-0.5 hover:bg-white/20"
            aria-label="Închide"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
