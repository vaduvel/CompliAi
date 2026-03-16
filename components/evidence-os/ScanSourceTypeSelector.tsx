"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, FileCode2, FileText, ScanText, ShieldAlert, type LucideIcon } from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { cn } from "@/lib/utils"

export type ScanSourceType = "document" | "text" | "manifest" | "yaml"

interface ScanSourceTypeSelectorProps {
  value: ScanSourceType
  onValueChange: (value: ScanSourceType) => void
}

const basicOptions: Array<{
  value: ScanSourceType
  icon: LucideIcon
  title: string
  description: string
  badge: string
}> = [
  {
    value: "document",
    icon: FileText,
    title: "Document",
    description: "PDF, imagine sau document scanat cu OCR si review.",
    badge: "GDPR / AI Act / e-Factura",
  },
  {
    value: "text",
    icon: ScanText,
    title: "Text manual",
    description: "Cand ai deja continutul copiat si vrei analiza directa.",
    badge: "Rapid review",
  },
]

const advancedOptions: Array<{
  value: ScanSourceType
  icon: LucideIcon
  title: string
  description: string
  badge: string
}> = [
  {
    value: "manifest",
    icon: FileCode2,
    title: "Repo / manifest",
    description: "package.json, requirements.txt, pyproject.toml si lockfiles.",
    badge: "Auto-discovery",
  },
  {
    value: "yaml",
    icon: ShieldAlert,
    title: "compliscan.yaml",
    description: "Sursa de adevar declarata pentru provider, model, rezidenta si human oversight.",
    badge: "Compliance as code",
  },
]

export function ScanSourceTypeSelector({ value, onValueChange }: ScanSourceTypeSelectorProps) {
  const isAdvancedSelected = advancedOptions.some((opt) => opt.value === value)
  const [showAdvanced, setShowAdvanced] = useState(isAdvancedSelected)

  return (
    <Card className="border-eos-border-subtle bg-eos-bg-panel">
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          {basicOptions.map((option) => (
            <SourceTypeOption
              key={option.value}
              active={value === option.value}
              icon={option.icon}
              title={option.title}
              description={option.description}
              badge={option.badge}
              onClick={() => onValueChange(option.value)}
            />
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced((prev) => !prev)}
            className="flex items-center gap-2 text-xs font-medium text-eos-text-muted transition hover:text-eos-text"
          >
            {showAdvanced ? (
              <ChevronUp className="size-3.5" strokeWidth={2} />
            ) : (
              <ChevronDown className="size-3.5" strokeWidth={2} />
            )}
            Surse tehnice avansate
            {isAdvancedSelected && (
              <Badge variant="outline" className="normal-case tracking-normal text-eos-primary">
                activa
              </Badge>
            )}
          </button>

          {showAdvanced && (
            <div className="mt-3 grid gap-4 md:grid-cols-2">
              {advancedOptions.map((option) => (
                <SourceTypeOption
                  key={option.value}
                  active={value === option.value}
                  icon={option.icon}
                  title={option.title}
                  description={option.description}
                  badge={option.badge}
                  onClick={() => onValueChange(option.value)}
                />
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function SourceTypeOption({
  active,
  icon: Icon,
  title,
  description,
  badge,
  onClick,
}: {
  active: boolean
  icon: LucideIcon
  title: string
  description: string
  badge: string
  onClick: () => void
}) {
  return (
    <Button
      type="button"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "h-auto items-start justify-start rounded-eos-lg border px-5 py-4 text-left",
        active
          ? "border-eos-border-strong bg-eos-surface-variant text-eos-text shadow-sm"
          : "border-eos-border-subtle bg-eos-surface text-eos-text-muted hover:bg-eos-surface-variant hover:text-eos-text"
      )}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "grid size-8 place-items-center rounded-eos-md border",
                active
                  ? "border-eos-border bg-eos-bg-inset text-eos-text"
                  : "border-eos-border-subtle bg-eos-bg-panel text-eos-text-muted"
              )}
            >
              <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="text-base font-semibold">{title}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-eos-text-muted">{description}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className="normal-case tracking-normal">
            {badge}
          </Badge>
          {active && <span className="text-xs font-medium text-eos-primary">Selectat</span>}
        </div>
      </div>
    </Button>
  )
}
