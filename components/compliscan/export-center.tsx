"use client"

import {
  type LucideIcon,
  ChevronDown,
  ClipboardCheck,
  FileBraces,
  FileCheck2,
  FileCode,
  FileStack,
  FolderKanban,
  Mail,
  Share2,
  ShieldCheck,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type ExportCenterProps = {
  onGeneratePdf: () => void
  onDownloadExecutivePdf?: () => void
  onGenerateAuditPack?: () => void
  onGenerateAuditBundle?: () => void
  onGenerateAnnexLite?: () => void
  onGenerateResponsePack?: () => void
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
  onDownloadExecutivePdf,
  onGenerateAuditPack,
  onGenerateAuditBundle,
  onGenerateAnnexLite,
  onGenerateResponsePack,
  onExportChecklist,
  onExportCompliScanJson,
  onExportCompliScanYaml,
  onShare,
}: ExportCenterProps) {
  const primaryActions: ExportAction[] = [
    {
      key: "pdf",
      label: "Raport PDF",
      hint: "Livrabilul standard pe care il trimiti primul.",
      icon: FileCheck2,
      onClick: onGeneratePdf,
      className:
        "h-auto",
      variant: undefined,
    },
    ...(onDownloadExecutivePdf
      ? [
          {
            key: "executive-pdf",
            label: "Raport Executiv PDF",
            hint: "O pagina — descarca direct ca fisier PDF. Pentru management si auditori.",
            icon: FileStack,
            onClick: onDownloadExecutivePdf,
            className: "h-auto",
            variant: undefined,
          },
        ]
      : []),
  ]

  const secondaryActions: ExportAction[] = [
    ...(onGenerateResponsePack
      ? [
          {
            key: "response-pack",
            label: "Compliance Response Pack",
            hint: "Raspuns la due diligence sau chestionar de conformitate.",
            icon: ShieldCheck,
            onClick: onGenerateResponsePack,
            variant: "outline" as const,
          },
        ]
      : []),
    ...(onGenerateAuditPack
      ? [
          {
            key: "audit-pdf",
            label: "Audit PDF",
            hint: "Varianta extinsa pentru audit.",
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
            label: "Anexa IV",
            hint: "Rezumat AI Act.",
            icon: FileStack,
            onClick: onGenerateAnnexLite,
            variant: "outline" as const,
          },
        ]
      : []),
    {
      key: "checklist",
      label: "Checklist",
      hint: "Lista pentru inchidere.",
      icon: ClipboardCheck,
      onClick: onExportChecklist,
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
            hint: "Export pentru integrare.",
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
            hint: "Export pentru trasabilitate.",
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
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-lg text-eos-text">
              Export si dovada
            </CardTitle>
            <p className="text-sm text-eos-text-muted">
              Aici inchizi snapshot-ul curent si alegi doar artefactul potrivit pentru livrare.
            </p>
          </div>
          <span className="rounded-full border border-eos-border bg-eos-surface-variant px-3 py-1 text-xs text-eos-text-muted">
            {totalActions} optiuni
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <section className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                  Trimite acum
                </p>
                <Badge variant="success">principal</Badge>
              </div>
              <div>
                <p className="text-base font-semibold text-eos-text">Raport PDF</p>
                <p className="mt-1 text-sm text-eos-text-muted">
                  Livrabilul standard pentru management, control si handoff initial.
                </p>
              </div>
            </div>
            <p className="max-w-xs text-xs text-eos-text-muted">
              Daca nu ai nevoie de artefacte speciale, acesta este exportul corect.
            </p>
          </div>
          <div className="mt-4 space-y-2">
            {primaryActions.map((action) => (
              <div key={action.key} className="flex items-center gap-3 rounded-eos-lg border border-eos-border-subtle bg-eos-surface px-3 py-2.5">
                <action.icon className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-eos-text">{action.label}</p>
                  <p className="text-xs text-eos-text-muted">{action.hint}</p>
                </div>
                <Button
                  onClick={action.onClick}
                  size="sm"
                  className="shrink-0"
                >
                  Exportă
                </Button>
              </div>
            ))}
          </div>
        </section>

        {secondaryActions.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                  Suport pentru audit si review
                </p>
                <p className="text-sm text-eos-text-muted">
                  Folosesti aceste exporturi doar cand livrabilul principal nu este suficient.
                </p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {secondaryActions.map((action) => (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant}
                  size="lg"
                  className="h-auto items-start justify-start gap-3 border-eos-border bg-eos-surface-variant text-eos-text hover:bg-eos-secondary-hover"
                >
                  <action.icon className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
                  <span className="min-w-0 text-left">
                    <span className="block whitespace-normal leading-5">{action.label}</span>
                    <span className="mt-0.5 block whitespace-normal text-xs font-medium normal-case tracking-normal text-eos-text-muted">
                      {action.hint}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </section>
        )}

        {technicalActions.length > 0 && (
          <details className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-eos-text-muted">
                    Tehnic
                  </p>
                  <p className="text-sm font-medium text-eos-text">
                    Snapshoturi si arhive pentru integrare, suport sau arhivare.
                  </p>
                  <p className="text-xs text-eos-text-muted">
                    Deschizi aceasta zona doar cand ai nevoie de artefacte tehnice.
                  </p>
                </div>
                <ChevronDown
                  className="mt-1 size-4 shrink-0 text-eos-text-muted"
                  strokeWidth={2}
                />
              </div>
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {technicalActions.map((action) => (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant}
                  size="lg"
                  className="h-auto items-start justify-start gap-3 border-eos-border bg-eos-bg-inset text-eos-text hover:bg-eos-secondary-hover"
                >
                  <action.icon className="mt-0.5 size-5 shrink-0" strokeWidth={2} />
                  <span className="min-w-0 text-left">
                    <span className="block whitespace-normal leading-5">{action.label}</span>
                    <span className="mt-0.5 block whitespace-normal text-xs font-medium normal-case tracking-normal text-eos-text-muted">
                      {action.hint}
                    </span>
                  </span>
                </Button>
              ))}
            </div>
          </details>
        )}

        {/* Share / handoff CTA — always visible (GOLD 7 polish) */}
        <section className="flex flex-col gap-3 rounded-eos-md border border-eos-primary/20 bg-eos-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-primary">
              Partajează spre review
            </p>
            <p className="text-sm font-medium text-eos-text">Trimite pachetul spre contabil, auditor sau client</p>
            <p className="text-xs text-eos-text-muted">
              Generează un link securizat cu valabilitate 72h — fără cont necesar pentru destinatar.
            </p>
          </div>
          <Button
            onClick={onShare}
            variant="outline"
            size="lg"
            className="h-auto shrink-0 items-center gap-2 border-eos-primary/40 bg-eos-primary/10 text-eos-primary hover:bg-eos-primary/20"
          >
            <Share2 className="size-4 shrink-0" strokeWidth={2} />
            <span className="text-left">
              <span className="block whitespace-normal leading-5">Partajează</span>
              <span className="block whitespace-normal text-xs font-normal normal-case tracking-normal opacity-80">
                Link securizat 72h
              </span>
            </span>
          </Button>
        </section>
      </CardContent>
    </Card>
  )
}
