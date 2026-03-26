"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ShieldAlert } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import { Nis2EligibilityWizard } from "@/components/compliscan/nis2/eligibility-wizard"
import type { Nis2EmployeeRange, Nis2RevenueRange, Nis2EligibilityResult } from "@/lib/compliscan/nis2-eligibility"

type SavedEligibility = {
  sectorId: string
  employees: Nis2EmployeeRange
  revenue: Nis2RevenueRange
  result: Nis2EligibilityResult
  savedAtISO: string
}

export default function Nis2EligibilityPage() {
  const router = useRouter()
  const [saved, setSaved] = useState<SavedEligibility | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchEligibility = useCallback(async () => {
    try {
      const res = await fetch("/api/nis2/eligibility")
      if (res.ok) {
        const data = await res.json()
        setSaved(data.eligibility ?? null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchEligibility()
  }, [fetchEligibility])

  function handleComplete() {
    void fetchEligibility()
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/nis2")}
        >
          <ArrowLeft className="size-4" strokeWidth={2} />
        </Button>
        <div>
          <h1 className="flex items-center gap-2 text-lg font-semibold">
            <ShieldAlert className="size-5 text-eos-primary" strokeWidth={2} />
            Eligibilitate NIS2
          </h1>
          <p className="text-sm text-eos-text-muted">
            Verifică rapid dacă organizația ta intră sub incidența Directivei NIS2 (OUG 155/2024)
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="size-6 animate-spin rounded-full border-2 border-eos-primary border-t-transparent" />
        </div>
      ) : (
        <Nis2EligibilityWizard saved={saved} onComplete={handleComplete} />
      )}
    </div>
  )
}
