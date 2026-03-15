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
      hint: "Livrabilul standard pe care il trimiti primul.",
      icon: FileCheck2,
      onClick: onGeneratePdf,
      className:
        "min-h-12 h-auto justify-start rounded-xl bg-[var(--color-primary)] px-4 py-3 text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]",
      variant: undefined,
    },
  ]

  const secondaryActions: ExportAction[] = [
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
            label: "Annex IV",
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
    {
      key: "share",
      label: "Trimite spre review",
      hint: "Partajare pentru review extern.",
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
    <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="text-lg text-[var(--color-on-surface)]">
              Export si dovada
            </CardTitle>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              Aici inchizi snapshot-ul curent si alegi doar artefactul potrivit pentru livrare.
            </p>
          </div>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-3 py-1 text-xs text-[var(--color-on-surface-muted)]">
            {totalActions} optiuni
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--bg-inset)] p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Trimite acum
                </p>
                <Badge variant="success">principal</Badge>
              </div>
              <div>
                <p className="text-base font-semibold text-[var(--color-on-surface)]">Raport PDF</p>
                <p className="mt-1 text-sm text-[var(--color-on-surface-muted)]">
                  Livrabilul standard pentru management, control si handoff initial.
                </p>
              </div>
            </div>
            <p className="max-w-xs text-xs text-[var(--color-muted)]">
              Daca nu ai nevoie de artefacte speciale, acesta este exportul corect.
            </p>
          </div>
          <div className="mt-4 grid gap-3">
            {primaryActions.map((action) => (
              <Button
                key={action.key}
                onClick={action.onClick}
                variant={action.variant}
                className={`${action.className} items-start gap-3 text-left shadow-none`}
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
        </section>

        {secondaryActions.length > 0 && (
          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="space-y-1">
                <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                  Suport pentru audit si review
                </p>
                <p className="text-sm text-[var(--color-on-surface-muted)]">
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
          </section>
        )}

        {technicalActions.length > 0 && (
          <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] p-4">
            <summary className="cursor-pointer list-none">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--color-muted)]">
                    Tehnic
                  </p>
                  <p className="text-sm font-medium text-[var(--color-on-surface)]">
                    Snapshoturi si arhive pentru integrare, suport sau arhivare.
                  </p>
                  <p className="text-xs text-[var(--color-muted)]">
                    Deschizi aceasta zona doar cand ai nevoie de artefacte tehnice.
                  </p>
                </div>
                <ChevronDown
                  className="mt-1 size-4 shrink-0 text-[var(--color-muted)]"
                  strokeWidth={2.25}
                />
              </div>
            </summary>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {technicalActions.map((action) => (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant}
                  className="min-h-10 h-auto items-start justify-start gap-3 rounded-xl border-[var(--color-border)] bg-[var(--bg-inset)] px-4 py-3 text-[var(--color-on-surface)] hover:bg-[var(--color-surface-hover)]"
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
          </details>
        )}
      </CardContent>
    </Card>
  )
}
