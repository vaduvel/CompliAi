"use client"

import {
  ClipboardCheck,
  FileBraces,
  FileCheck2,
  FileCode,
  FileStack,
  FolderKanban,
  Mail,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ExportCenterProps = {
  onGeneratePdf: () => void
  onGenerateAuditPack?: () => void
  onGenerateAuditBundle?: () => void
  onGenerateAnnexLite?: () => void
  onExportChecklist: () => void
  onExportCompliScanJson?: () => void
  onExportCompliScanYaml?: () => void
  onShare: () => void
}

export function ExportCenter({
  onGeneratePdf,
  onGenerateAuditPack,
  onGenerateAuditBundle,
  onGenerateAnnexLite,
  onExportChecklist,
  onExportCompliScanJson,
  onExportCompliScanYaml,
  onShare,
}: ExportCenterProps) {
  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-[var(--color-on-surface)]">
          Export si dovada
        </CardTitle>
        <p className="text-sm text-[var(--color-on-surface-muted)]">
          Pregateste livrabile pentru audit si exporta snapshot-ul care va deveni baza pentru autodiscovery si drift.
        </p>
      </CardHeader>

      <CardContent className="grid gap-3 pt-4">
        <Button
          onClick={onGeneratePdf}
          className="h-11 justify-start rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          <FileCheck2 className="size-4" strokeWidth={2.25} />
          Genereaza raport PDF
        </Button>
        {onGenerateAuditPack && (
          <Button
            onClick={onGenerateAuditPack}
            variant="secondary"
            className="h-11 justify-start rounded-xl"
          >
            <FolderKanban className="size-4" strokeWidth={2.25} />
            Genereaza Audit Pack PDF
          </Button>
        )}
        {onGenerateAuditBundle && (
          <Button
            onClick={onGenerateAuditBundle}
            variant="outline"
            className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            <FolderKanban className="size-4" strokeWidth={2.25} />
            Export Audit Pack ZIP
          </Button>
        )}
        {onGenerateAnnexLite && (
          <Button
            onClick={onGenerateAnnexLite}
            variant="outline"
            className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            <FileStack className="size-4" strokeWidth={2.25} />
            Genereaza Annex IV lite
          </Button>
        )}
        {onExportCompliScanJson && (
          <Button
            onClick={onExportCompliScanJson}
            variant="outline"
            className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            <FileBraces className="size-4" strokeWidth={2.25} />
            Export compliscan.json
          </Button>
        )}
        {onExportCompliScanYaml && (
          <Button
            onClick={onExportCompliScanYaml}
            variant="outline"
            className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
          >
            <FileCode className="size-4" strokeWidth={2.25} />
            Export compliscan.yaml
          </Button>
        )}
        <Button
          onClick={onExportChecklist}
          variant="outline"
          className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
        >
          <ClipboardCheck className="size-4" strokeWidth={2.25} />
          Export checklist
        </Button>
        <Button
          onClick={onShare}
          variant="outline"
          className="h-11 justify-start rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
        >
          <Mail className="size-4" strokeWidth={2.25} />
          Share cu contabil
        </Button>
      </CardContent>
    </Card>
  )
}
