import { PayTransparencyPage } from "@/components/compliscan/pay-transparency-page"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"

export default function DashboardPayTransparencyPage() {
  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "De rezolvat" }, { label: "Pay Transparency", current: true }]}
        title="Pay Transparency"
        description="Încarci datele salariale, calculezi gap-ul și transformi raportul în dovadă pentru findingul din cockpit."
        eyebrowBadges={
          <span className="inline-flex items-center rounded-sm border border-eos-border bg-eos-surface-elevated px-1.5 py-0.5 font-mono text-[10px] font-medium text-eos-text-muted">
            Codul Muncii
          </span>
        }
      />
      <PayTransparencyPage />
    </div>
  )
}
