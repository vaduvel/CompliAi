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
      ? "Ultimul rezultat repo"
      : sourceType === "yaml"
        ? "Ultimul rezultat YAML"
        : "Ultimul rezultat document"

  const nextDestination =
    sourceType === "manifest" || sourceType === "yaml" ? "Control" : "Dovada"

  const items: SummaryStripItem[] = [
    {
      label: "Lucrezi acum in",
      value: currentSourceLabel,
      hint: "Aici pornesti scanarea sau validarea pentru sursa curenta.",
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
      label: "Continui dupa analiza",
      value: nextDestination,
      hint:
        nextDestination === "Control"
          ? "Acolo confirmi inventarul, baseline-ul si drift-ul pentru sursa tehnica."
          : "Acolo transformi verdictul in task-uri, dovezi si livrabil separat.",
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
