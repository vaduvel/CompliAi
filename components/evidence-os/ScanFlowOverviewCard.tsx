import { Card, CardContent } from "@/components/evidence-os/Card"
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

  return (
    <Card className="border-eos-border-subtle bg-eos-bg-panel">
      <CardContent className="grid gap-4 p-5 lg:grid-cols-3">
        <FlowStatusItem
          label="Lucrezi acum in"
          value={currentSourceLabel}
          hint="Zona de sus este singurul loc unde pornești scanarea sau validarea."
        />
        <FlowStatusItem
          label={resultLabel}
          value={latestResult?.documentName ?? "inca lipseste"}
          hint={
            latestResult
              ? `Procesat ${formatRelativeRomanian(latestResult.createdAtISO)}`
              : "Rezultatul apare dupa primul scan pentru acest tip de sursa."
          }
        />
        <FlowStatusItem
          label="Cum citesti pagina"
          value="sus lucrezi · jos verifici"
          hint="Pastram separat work queue-ul de sumarul ultimului rezultat ca sa nu para doua scanari diferite."
        />
      </CardContent>
    </Card>
  )
}

function FlowStatusItem({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-bg-inset p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-eos-text-tertiary">{label}</p>
      <p className="mt-3 text-sm font-semibold text-eos-text">{value}</p>
      <p className="mt-2 text-xs leading-6 text-eos-text-muted">{hint}</p>
    </div>
  )
}
