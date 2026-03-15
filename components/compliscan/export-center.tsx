"use client"

import {
  type LucideIcon,
  ClipboardCheck,
  FileBraces,
  FileCheck2,
  FileCode,
  FileStack,
  FolderKanban,
  Mail,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

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

type ExportAction = {
  key: string
  label: string
  hint: string
  icon: LucideIcon
  onClick: () => void
  className?: string
  variant?: React.ComponentProps<typeof Button>["variant"]
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
  const primaryActions: ExportAction[] = [
    {
      key: "pdf",
      label: "Raport PDF",
      hint: "Livrabilul standard pentru management si control.",
      icon: FileCheck2,
      onClick: onGeneratePdf,
      className:
        "min-h-11 h-auto justify-start rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]",
      variant: undefined,
    },
  ]

  const secondaryActions: ExportAction[] = [
    ...(onGenerateAuditPack
      ? [
          {
            key: "audit-pdf",
            label: "Audit PDF",
            hint: "Varianta extinsa pentru audit si due diligence.",
            icon: FolderKanban,
            onClick: onGenerateAuditPack,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onGenerateAnnexLite
      ? [
          {
            key: "annex",
            label: "Annex IV",
            hint: "Rezumat pentru maparea AI Act.",
            icon: FileStack,
            onClick: onGenerateAnnexLite,
            variant: "outline" as const,
          },
        ]
      : []),
    {
      key: "checklist",
      label: "Checklist",
      hint: "Lista pentru inchidere si follow-up.",
      icon: ClipboardCheck,
      onClick: onExportChecklist,
      variant: "outline" as const,
    },
    {
      key: "share",
      label: "Trimite spre review",
      hint: "Partajeaza rapid pentru revizie externa.",
      icon: Mail,
      onClick: onShare,
      variant: "outline" as const,
    },
  ]

  const technicalActions: ExportAction[] = [
    ...(onGenerateAuditBundle
      ? [
          {
            key: "audit-zip",
            label: "Audit ZIP",
            hint: "Arhiva tehnica pentru audit.",
            icon: FolderKanban,
            onClick: onGenerateAuditBundle,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onExportCompliScanJson
      ? [
          {
            key: "json",
            label: "Snapshot JSON",
            hint: "Export `compliscan.json` pentru integrare.",
            icon: FileBraces,
            onClick: onExportCompliScanJson,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onExportCompliScanYaml
      ? [
          {
            key: "yaml",
            label: "Snapshot YAML",
            hint: "Export `compliscan.yaml` pentru trasabilitate.",
            icon: FileCode,
            onClick: onExportCompliScanYaml,
            variant: "outline" as const,
          },
        ]
      : []),
  ]

  const totalActions =
    primaryActions.length + secondaryActions.length + technicalActions.length

  return (
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg text-[var(--color-on-surface)]">
              Export si dovada
            </CardTitle>
            <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
              Incepi cu raportul principal, apoi mergi spre audit sau snapshot tehnic doar cand este necesar.
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-1 text-xs text-[var(--color-on-surface-muted)]">
            {totalActions} optiuni
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Principal
              </p>
              <Badge variant="success">trimite primul</Badge>
            </div>
            <p className="text-xs text-[var(--color-muted)]">Raportul standard pentru management si control</p>
          </div>
          <div className="grid gap-3">
            {primaryActions.map((action) => (
              <Button
                key={action.key}
                onClick={action.onClick}
                variant={action.variant}
                className={`${action.className} items-start gap-3 text-left`}
              >
                <action.icon className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
                <span className="min-w-0 text-left">
                  <span className="block whitespace-normal leading-5">{action.label}</span>
                  <span className="mt-0.5 block whitespace-normal text-xs font-medium normal-case tracking-normal opacity-80">
                    {action.hint}
                  </span>
                </span>
              </Button>
            ))}
          </div>
        </div>

        {secondaryActions.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Audit si review
              </p>
              <p className="text-xs text-[var(--color-muted)]">Anexe, pachete extinse si partajare</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {secondaryActions.map((action) => (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant}
                  className="min-h-11 h-auto items-start justify-start gap-3 rounded-xl border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 py-3 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                >
                  <action.icon className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
                  <span className="min-w-0 text-left">
                    <span className="block whitespace-normal leading-5">{action.label}</span>
                    <span className="mt-0.5 block whitespace-normal text-xs font-medium normal-case tracking-normal text-[var(--color-muted)]">
                      {action.hint}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}

        {technicalActions.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Tehnic
              </p>
              <p className="text-xs text-[var(--color-muted)]">Pentru integrare, suport sau arhivare</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {technicalActions.map((action) => (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant}
                  className="min-h-11 h-auto items-start justify-start gap-3 rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] px-4 py-3 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
                >
                  <action.icon className="mt-0.5 size-4 shrink-0" strokeWidth={2.25} />
                  <span className="min-w-0 text-left">
                    <span className="block whitespace-normal leading-5">{action.label}</span>
                    <span className="mt-0.5 block whitespace-normal text-xs font-medium normal-case tracking-normal text-[var(--color-muted)]">
                      {action.hint}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
