"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
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
  const searchParams = useSearchParams()
  const [saved, setSaved] = useState<SavedEligibility | null>(null)
  const [loading, setLoading] = useState(true)
  const sourceFindingId = searchParams.get("findingId")
  const fromCockpit = searchParams.get("source") === "cockpit" && Boolean(sourceFindingId)

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
      {fromCockpit ? (
        <div className="flex items-start gap-3 rounded-lg border border-eos-warning/30 bg-eos-warning/5 px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-eos-text">
              Ai venit din cockpit pentru eligibilitatea NIS2
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              Clarifică mai întâi dacă firma intră sub NIS2. Dacă rezultatul confirmă eligibilitatea, continuă imediat spre wizardul DNSC.
            </p>
          </div>
          <Link
            href={`/dashboard/resolve/${sourceFindingId}`}
            className="shrink-0 text-xs text-eos-primary hover:underline"
          >
            Înapoi la finding
          </Link>
        </div>
      ) : null}

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
        <>
          <Nis2EligibilityWizard saved={saved} onComplete={handleComplete} />
          {fromCockpit && saved && saved.result !== "nu_intri" ? (
            <div className="rounded-eos-md border border-eos-primary/25 bg-eos-primary/5 px-4 py-4">
              <p className="text-sm font-medium text-eos-text">
                Eligibilitatea este clarificată. Poți continua direct spre înregistrarea DNSC.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <Link
                  href={`/dashboard/nis2/inregistrare-dnsc?${new URLSearchParams({
                    findingId: sourceFindingId ?? "",
                    source: "cockpit",
                  }).toString()}`}
                >
                  <Button size="sm">Continuă spre DNSC</Button>
                </Link>
                <Link
                  href={`/dashboard/resolve/${sourceFindingId}`}
                  className="inline-flex items-center text-sm text-eos-primary hover:underline"
                >
                  Înapoi la cockpit
                </Link>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
