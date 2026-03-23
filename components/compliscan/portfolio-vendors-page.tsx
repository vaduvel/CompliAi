"use client"

import { useEffect, useState } from "react"
import { Building2, GitPullRequestArrow } from "lucide-react"

import { PortfolioOrgActionButton } from "@/components/compliscan/portfolio-org-action-button"
import { ErrorScreen, LoadingScreen } from "@/components/compliscan/route-sections"
import { Badge } from "@/components/evidence-os/Badge"
import { Card } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { PortfolioVendorRow } from "@/lib/server/portfolio"

const riskVariant = {
  critical: "destructive",
  high: "warning",
  medium: "secondary",
  low: "outline",
  unknown: "outline",
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

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Portofoliu"
        title="Furnizori comuni"
        description="Registru agregat de vendor reviews și furnizori NIS2, dedupat pe CUI sau nume."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {vendors.length} furnizori unici
            </Badge>
          </>
        }
      />

      <Card className="overflow-hidden border-eos-border bg-eos-surface">
        {vendors.length === 0 ? (
          <EmptyState
            title="Nu există furnizori în portofoliu"
            label="Adaugă vendor reviews sau completează registrul NIS2 în firmele din portofoliu."
            icon={GitPullRequestArrow}
            className="px-5 py-10"
          />
        ) : (
          <div className="divide-y divide-eos-border-subtle">
            {vendors.map((vendor) => (
              <div key={vendor.dedupeKey} className="flex flex-wrap items-start gap-3 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={riskVariant[vendor.highestRisk]}
                      className="text-[10px] normal-case tracking-normal"
                    >
                      risc {vendor.highestRisk}
                    </Badge>
                    <span className="text-sm font-medium text-eos-text">{vendor.vendorName}</span>
                    <span className="text-xs text-eos-text-muted">{vendor.orgCount} firme</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-eos-text-muted">
                    {vendor.cui ? <span>CUI: {vendor.cui}</span> : null}
                    <span>Surse: {vendor.sourceKinds.join(", ")}</span>
                    <span>Review-uri deschise: {vendor.openReviews}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {vendor.categoryLabels.map((label) => (
                      <Badge key={label} variant="outline" className="text-[10px] normal-case tracking-normal">
                        {label}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-xs leading-5 text-eos-text-muted">
                    Prezent în: {vendor.orgs.map((org) => org.orgName).join(", ")}
                  </p>
                </div>
                <PortfolioOrgActionButton
                  orgId={vendor.primaryOrgId}
                  destination="/dashboard/vendor-review"
                  label="Deschide registrul"
                  variant="outline"
                />
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-4 text-xs text-eos-text-muted">
        <div className="flex items-center gap-2 text-eos-text">
          <Building2 className="size-4" strokeWidth={1.8} />
          <span className="font-medium">Dedup cross-client</span>
        </div>
        <p className="mt-1">
          Vendorii sunt grupați după CUI sau nume, dar drilldown-ul te duce în prima firmă relevantă pentru execuție și actualizare.
        </p>
      </div>
    </div>
  )
}

