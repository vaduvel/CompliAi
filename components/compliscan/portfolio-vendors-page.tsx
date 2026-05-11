"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { ArrowRight, Building2, GitPullRequestArrow } from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { V3FrameworkTag, V3KpiStrip, V3PageHero, V3RiskPill, type V3SeverityTone } from "@/components/compliscan/v3"
import type { PortfolioVendorRow } from "@/lib/server/portfolio"

const riskTone: Record<PortfolioVendorRow["highestRisk"], V3SeverityTone> = {
  critical: "critical",
  high: "high",
  medium: "medium",
  low: "low",
  unknown: "info",
} as const

export function PortfolioVendorsPage() {
  const [vendors, setVendors] = useState<PortfolioVendorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("/api/portfolio/vendors", { cache: "no-store" })
        if (!response.ok) throw new Error("Nu am putut încărca furnizorii din portofoliu.")
        const data = (await response.json()) as { vendors: PortfolioVendorRow[] }
        setVendors(data.vendors)
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Eroare necunoscută.")
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  if (loading) return <LoadingScreen variant="section" />
  if (error) return <ErrorScreen message={error} variant="section" />

  const criticalCount = vendors.filter((vendor) => vendor.highestRisk === "critical").length
  const highCount = vendors.filter((vendor) => vendor.highestRisk === "high").length
  const openReviews = vendors.reduce((sum, vendor) => sum + vendor.openReviews, 0)
  const affectedOrgs = new Set(vendors.flatMap((vendor) => vendor.orgs.map((org) => org.orgId))).size
  const sourceCount = new Set(vendors.flatMap((vendor) => vendor.sourceKinds)).size

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Portofoliu" }, { label: "Furnizori", current: true }]}
        title="Furnizori comuni"
        description="Registru agregat de vendor reviews și furnizori NIS2, dedupat pe CUI sau nume."
        eyebrowBadges={
          <div className="flex flex-wrap items-center gap-2">
            <V3FrameworkTag label="furnizori unici" count={vendors.length} />
            {criticalCount > 0 ? <V3RiskPill tone="critical">{criticalCount} critic</V3RiskPill> : null}
            {highCount > 0 ? <V3RiskPill tone="high">{highCount} ridicat</V3RiskPill> : null}
          </div>
        }
      />

      <V3KpiStrip
        items={[
          {
            id: "vendors",
            label: "Furnizori unici",
            value: vendors.length,
            detail: "dedup CUI sau nume",
          },
          {
            id: "orgs",
            label: "Firme afectate",
            value: affectedOrgs,
            detail: "au vendor în registru",
          },
          {
            id: "reviews",
            label: "Review-uri deschise",
            value: openReviews,
            detail: "necesită execuție",
            stripe: openReviews > 0 ? "warning" : undefined,
            valueTone: openReviews > 0 ? "warning" : "neutral",
          },
          {
            id: "critical",
            label: "Risc critic",
            value: criticalCount,
            detail: "highest risk",
            stripe: criticalCount > 0 ? "critical" : undefined,
            valueTone: criticalCount > 0 ? "critical" : "neutral",
          },
          {
            id: "sources",
            label: "Surse",
            value: sourceCount,
            detail: "tipuri detectate",
          },
        ]}
      />

      <section className="space-y-2">
        {vendors.length === 0 ? (
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-10 text-center">
            <GitPullRequestArrow className="mx-auto mb-3 size-6 text-eos-text-tertiary" strokeWidth={1.6} />
            <h3 data-display-text="true" className="font-display text-[16px] font-semibold text-eos-text">
              Nu există furnizori în portofoliu
            </h3>
            <p className="mx-auto mt-1 max-w-md text-[13px] text-eos-text-muted">
              Furnizorii se adaugă în firma client, în secțiunea NIS2 / Furnizori. De acolo apar agregat aici.
            </p>
            <Link
              href="/portfolio"
              className="mt-4 inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-primary/35 hover:text-eos-primary"
            >
              Alege o firmă din portofoliu
              <ArrowRight className="size-3.5" strokeWidth={2} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {vendors.map((vendor) => (
              <article
                key={vendor.dedupeKey}
                className="group relative flex flex-wrap items-start gap-3 overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4 transition-all duration-150 hover:border-eos-border-strong hover:bg-white/[0.02]"
              >
                <span
                  className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                    vendor.highestRisk === "critical"
                      ? "bg-eos-error"
                      : vendor.highestRisk === "high"
                        ? "bg-eos-warning"
                        : vendor.highestRisk === "medium"
                          ? "bg-eos-primary/70"
                          : "bg-eos-border-strong"
                  }`}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <V3RiskPill tone={riskTone[vendor.highestRisk]}>
                      risc {vendor.highestRisk}
                    </V3RiskPill>
                    <span className="text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text">{vendor.vendorName}</span>
                    <span className="font-mono text-[11px] text-eos-text-muted">{vendor.orgCount} firme</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[11px] text-eos-text-muted">
                    {vendor.cui ? <span>CUI: {vendor.cui}</span> : null}
                    <span>Surse: {vendor.sourceKinds.join(", ")}</span>
                    <span>Review-uri deschise: {vendor.openReviews}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {vendor.categoryLabels.map((label) => (
                      <V3FrameworkTag key={label} label={label} />
                    ))}
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-eos-text-muted">
                    Prezent în: {vendor.orgs.map((org) => org.orgName).join(", ")}
                  </p>
                </div>
                <PortfolioOrgActionButton
                  orgId={vendor.primaryOrgId}
                  destination="/dashboard/vendor-review"
                  label="Deschide registrul"
                  variant="outline"
                />
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <Building2 className="size-4" strokeWidth={1.8} />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">Dedup cross-client</span>
        </div>
        <p className="mt-1">
          Vendorii sunt grupați după CUI sau nume, dar drilldown-ul te duce în prima firmă relevantă pentru execuție și actualizare.
        </p>
      </div>
    </div>
  )
}
