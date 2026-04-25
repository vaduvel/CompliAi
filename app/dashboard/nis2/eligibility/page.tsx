"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Loader2, ShieldAlert } from "lucide-react"

import { V3PageHero, V3RiskPill } from "@/components/compliscan/v3"
import {
  Nis2EligibilityWizard,
  type Nis2EligibilityCompletionPayload,
} from "@/components/compliscan/nis2/eligibility-wizard"
import {
  NIS2_SECTORS,
  type Nis2EligibilityResult,
  type Nis2EmployeeRange,
  type Nis2RevenueRange,
} from "@/lib/compliscan/nis2-eligibility"

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
  const returnTo = searchParams.get("returnTo")
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

  function buildEligibilityReturnEvidence(payload: Nis2EligibilityCompletionPayload) {
    const resultLabel =
      payload.result === "intri"
        ? "firma intră sub NIS2"
        : payload.result === "posibil"
          ? "eligibilitatea rămâne la limită și cere clarificare suplimentară"
          : "firma nu intră sub NIS2"

    return [
      `Eligibilitatea NIS2 a fost salvată pentru sectorul "${payload.sectorLabel}".`,
      `Mărime: ${payload.employees}.`,
      `Cifră de afaceri: ${payload.revenue}.`,
      `Rezultat: ${resultLabel}.`,
    ].join(" ")
  }

  function buildSavedEligibilityPayload(
    savedEligibility: SavedEligibility
  ): Nis2EligibilityCompletionPayload {
    const sectorLabel =
      NIS2_SECTORS.find((sector) => sector.id === savedEligibility.sectorId)?.label ??
      savedEligibility.sectorId
    return {
      sectorId: savedEligibility.sectorId,
      sectorLabel,
      employees: savedEligibility.employees,
      revenue: savedEligibility.revenue,
      result: savedEligibility.result,
    }
  }

  function handleComplete(payload: Nis2EligibilityCompletionPayload) {
    if (fromCockpit && sourceFindingId && returnTo) {
      const params = new URLSearchParams({
        eligibilityFlow: "done",
        evidenceNote: buildEligibilityReturnEvidence(payload),
      })
      router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
      return
    }

    void fetchEligibility()
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 pb-12">
      <V3PageHero
        breadcrumbs={[
          { label: "Firma mea" },
          { label: "NIS2" },
          { label: "Eligibilitate", current: true },
        ]}
        eyebrowBadges={
          <V3RiskPill tone="info">OUG 155/2024 · Directiva NIS2</V3RiskPill>
        }
        title="Eligibilitate NIS2"
        description="Verifică rapid dacă organizația ta intră sub incidența Directivei NIS2. Răspunde la 3 întrebări (sector + angajați + cifră de afaceri) și primești verdictul cu temei legal."
        actions={
          <Link
            href="/dashboard/nis2"
            className="inline-flex h-[34px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 text-[12.5px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2.5} />
            Înapoi la NIS2
          </Link>
        }
      />

      {fromCockpit && (
        <div className="flex items-start gap-3 rounded-eos-lg border border-eos-warning/25 bg-eos-warning-soft px-4 py-3.5">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2.25} />
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
              Vii din cockpit · pasul preliminar
            </p>
            <p className="mt-1.5 text-[13px] leading-[1.6] text-eos-text">
              Clarifică mai întâi dacă firma intră sub NIS2. După salvare, te întorci automat în
              cockpit pentru pasul final.
            </p>
          </div>
          <Link
            href={returnTo ?? `/dashboard/resolve/${sourceFindingId}`}
            className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-primary transition-colors hover:text-eos-primary/80"
          >
            <ArrowLeft className="size-3" strokeWidth={2.5} />
            la finding
          </Link>
        </div>
      )}

      <div className="mx-auto max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-eos-text-tertiary" strokeWidth={2} />
          </div>
        ) : (
          <div className="space-y-5">
            <Nis2EligibilityWizard
              saved={saved}
              onComplete={handleComplete}
              onResetSaved={() => setSaved(null)}
            />

            {fromCockpit && saved && returnTo ? (
              <div className="rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.06] px-5 py-4">
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                  Eligibilitate clarificată
                </p>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-eos-text">
                  Dacă ai verificat rezultatul, te întorci acum în cockpit pentru pasul final.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleComplete(buildSavedEligibilityPayload(saved))}
                    className="inline-flex h-9 items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition-all hover:bg-eos-primary/90"
                  >
                    Revino în cockpit
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            ) : fromCockpit && saved && saved.result !== "nu_intri" && !returnTo ? (
              <div className="rounded-eos-lg border border-eos-primary/25 bg-eos-primary/[0.06] px-5 py-4">
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                  Următorul pas
                </p>
                <p className="mt-2 text-[13.5px] leading-[1.55] text-eos-text">
                  Eligibilitatea este clarificată. Poți continua direct spre înregistrarea DNSC.
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link
                    href={`/dashboard/nis2/inregistrare-dnsc?${new URLSearchParams({
                      findingId: sourceFindingId ?? "",
                      source: "cockpit",
                    }).toString()}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 text-[12.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition-all hover:bg-eos-primary/90"
                  >
                    Continuă spre DNSC
                    <ArrowRight className="size-3.5" strokeWidth={2.5} />
                  </Link>
                  <Link
                    href={`/dashboard/resolve/${sourceFindingId}`}
                    className="inline-flex items-center gap-1 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-text-muted transition-colors hover:text-eos-text"
                  >
                    <ArrowLeft className="size-3" strokeWidth={2.5} />
                    Înapoi la cockpit
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
