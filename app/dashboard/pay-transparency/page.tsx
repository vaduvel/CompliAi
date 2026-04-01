import { PayTransparencyPage } from "@/components/compliscan/pay-transparency-page"
import { PageIntro } from "@/components/evidence-os/PageIntro"

export default function DashboardPayTransparencyPage() {
  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Codul Muncii"
        title="Pay Transparency"
        description="Încarci datele salariale, calculezi gap-ul și transformi raportul în dovadă pentru findingul din cockpit."
      />
      <PayTransparencyPage />
    </div>
  )
}
