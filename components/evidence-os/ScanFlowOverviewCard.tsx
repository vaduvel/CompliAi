import { Card, CardContent } from "@/components/evidence-os/Card"
import { SummaryStrip, type SummaryStripItem } from "@/components/evidence-os/SummaryStrip"
import type { ScanRecord } from "@/lib/compliance/types"
import { formatRelativeRomanian } from "@/lib/compliance/engine"
import type { ScanSourceType } from "@/components/evidence-os/ScanSourceTypeSelector"

interface ScanFlowOverviewCardProps {
  sourceType: ScanSourceType
  latestDocumentScan: ScanRecord | null
  latestManifestScan: ScanRecord | null
  latestYamlScan: ScanRecord | null
}

export function ScanFlowOverviewCard({
  sourceType,
  latestDocumentScan,
  latestManifestScan,
  latestYamlScan,
}: ScanFlowOverviewCardProps) {
  const currentSourceLabel =
    sourceType === "document"
      ? "Document cu OCR si review"
      : sourceType === "text"
        ? "Text manual pentru analiza rapida"
        : sourceType === "manifest"
          ? "Manifest / lockfile pentru autodiscovery"
          : "compliscan.yaml pentru control declarat"

  const latestResult =
    sourceType === "manifest"
      ? latestManifestScan
      : sourceType === "yaml"
        ? latestYamlScan
        : latestDocumentScan

  const resultLabel =
    sourceType === "manifest"
      ? "Ultimul rezultat de repo"
      : sourceType === "yaml"
        ? "Ultimul rezultat YAML"
        : "Ultimul rezultat document"

  const items: SummaryStripItem[] = [
    {
      label: "Lucrezi acum in",
      value: currentSourceLabel,
      hint: "Zona de sus este singurul loc unde pornesti scanarea sau validarea.",
      tone: "accent",
    },
    {
      label: resultLabel,
      value: latestResult?.documentName ?? "inca lipseste",
      hint: latestResult
        ? `Procesat ${formatRelativeRomanian(latestResult.createdAtISO)}`
        : "Rezultatul apare dupa primul scan pentru acest tip de sursa.",
    },
    {
      label: "Cum citesti pagina",
      value: "sus lucrezi · jos verifici",
      hint:
        "Pastram separat work queue-ul de sumarul ultimului rezultat ca sa nu para doua scanari diferite.",
    },
  ]

  return (
    <Card className="border-eos-border-subtle bg-eos-bg-panel">
      <CardContent className="p-5">
        <SummaryStrip items={items} />
      </CardContent>
    </Card>
  )
}
