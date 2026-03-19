"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileText,
  RefreshCw,
  Scale,
  ShieldAlert,
  User,
  XCircle,
} from "lucide-react"

import { Badge } from "@/components/evidence-os/Badge"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { FindingVerdictMeta } from "@/components/compliscan/finding-verdict-meta"
import type { ScanFinding } from "@/lib/compliance/types"

// ── Severity config ─────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { label: "Critic", variant: "destructive" as const, icon: XCircle, color: "text-eos-error" },
  high:     { label: "Ridicat", variant: "destructive" as const, icon: AlertTriangle, color: "text-eos-error" },
  medium:   { label: "Mediu", variant: "warning" as const, icon: AlertTriangle, color: "text-eos-warning" },
  low:      { label: "Scăzut", variant: "secondary" as const, icon: CheckCircle2, color: "text-eos-text-muted" },
}

const CATEGORY_LABEL: Record<string, string> = {
  EU_AI_ACT: "EU AI Act",
  GDPR: "GDPR",
  E_FACTURA: "e-Factura",
  NIS2: "NIS2",
}

// ── Resolution step component ───────────────────────────────────────────────

function ResolutionStep({
  stepNumber,
  title,
  icon: Icon,
  content,
  accent,
}: {
  stepNumber: number
  title: string
  icon: typeof ShieldAlert
  content: string
  accent: string
}) {
  return (
    <div className="relative flex gap-4">
      {/* Vertical connector line */}
      <div className="flex flex-col items-center">
        <div className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${accent}`}>
          {stepNumber}
        </div>
        <div className="mt-1 w-px flex-1 bg-eos-border-subtle" />
      </div>
      <div className="min-w-0 flex-1 pb-6">
        <div className="flex items-center gap-2">
          <Icon className="size-4 text-eos-text-muted" strokeWidth={2} />
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-muted">{title}</p>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-eos-text">{content}</p>
      </div>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────────

export default function FindingDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [finding, setFinding] = useState<ScanFinding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/findings/${params.id}`, { cache: "no-store" })
        if (!res.ok) { setError(true); return }
        const data = await res.json() as { finding: ScanFinding }
        setFinding(data.finding)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <div className="space-y-4">
          <div className="h-6 w-48 animate-pulse rounded-eos-md bg-eos-surface-variant" />
          <div className="h-40 animate-pulse rounded-eos-lg bg-eos-surface-variant" />
          <div className="h-60 animate-pulse rounded-eos-lg bg-eos-surface-variant" />
        </div>
      </div>
    )
  }

  if (error || !finding) {
    return (
      <div className="mx-auto max-w-3xl py-12 text-center">
        <XCircle className="mx-auto size-10 text-eos-error" strokeWidth={1.5} />
        <p className="mt-4 text-sm text-eos-text-muted">Finding-ul nu a fost găsit.</p>
        <button
          onClick={() => router.back()}
          className="mt-4 text-sm text-eos-primary hover:underline"
        >
          Înapoi
        </button>
      </div>
    )
  }

  const sev = SEVERITY_CONFIG[finding.severity]
  const SevIcon = sev.icon
  const res = finding.resolution

  // Build resolution steps from available data
  const resolutionSteps: Array<{ title: string; icon: typeof ShieldAlert; content: string; accent: string }> = []
  if (res) {
    resolutionSteps.push({
      title: "Problemă detectată",
      icon: ShieldAlert,
      content: res.problem,
      accent: "border-eos-error bg-eos-error/10 text-eos-error",
    })
    resolutionSteps.push({
      title: "Impact dacă nu acționezi",
      icon: AlertTriangle,
      content: res.impact,
      accent: "border-eos-warning bg-eos-warning/10 text-eos-warning",
    })
    resolutionSteps.push({
      title: "Acțiune recomandată",
      icon: ChevronRight,
      content: res.action,
      accent: "border-eos-primary bg-eos-primary/10 text-eos-primary",
    })
    if (res.generatedAsset) {
      resolutionSteps.push({
        title: "Asset generat",
        icon: FileText,
        content: res.generatedAsset,
        accent: "border-eos-info bg-eos-info/10 text-eos-info",
      })
    }
    if (res.humanStep) {
      resolutionSteps.push({
        title: "Pas uman obligatoriu",
        icon: User,
        content: res.humanStep,
        accent: "border-eos-warning bg-eos-warning/10 text-eos-warning",
      })
    }
    if (res.closureEvidence) {
      resolutionSteps.push({
        title: "Dovadă de închidere",
        icon: CheckCircle2,
        content: res.closureEvidence,
        accent: "border-eos-success bg-eos-success/10 text-eos-success",
      })
    }
    if (res.revalidation) {
      resolutionSteps.push({
        title: "Revalidare",
        icon: RefreshCw,
        content: res.revalidation,
        accent: "border-eos-text-muted bg-eos-surface-variant text-eos-text-muted",
      })
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Back link */}
      <button
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-xs text-eos-text-muted hover:text-eos-text"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Înapoi la findings
      </button>

      {/* Header card */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={sev.variant} className="normal-case tracking-normal">
                  <SevIcon className="mr-1 inline size-3" strokeWidth={2} />
                  {sev.label}
                </Badge>
                <Badge variant="outline" className="normal-case tracking-normal text-eos-text-muted">
                  {CATEGORY_LABEL[finding.category] ?? finding.category}
                </Badge>
                {finding.risk === "high" && (
                  <Badge variant="destructive" className="normal-case tracking-normal text-[10px]">
                    Risc ridicat
                  </Badge>
                )}
              </div>
              <h1 className="mt-3 text-lg font-semibold text-eos-text">{finding.title}</h1>
              <p className="mt-2 text-sm leading-relaxed text-eos-text-muted">{finding.detail}</p>
            </div>
          </div>

          {/* Metadata row */}
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-eos-border-subtle pt-4 text-xs text-eos-text-muted">
            {finding.sourceDocument && (
              <span>
                <FileText className="mr-1 inline size-3" strokeWidth={2} />
                {finding.sourceDocument}
              </span>
            )}
            <span>
              {new Date(finding.createdAtISO).toLocaleString("ro-RO", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </span>
            {finding.legalReference && (
              <span>
                <Scale className="mr-1 inline size-3" strokeWidth={2} />
                {finding.legalReference}
              </span>
            )}
          </div>

          {/* Verdict meta */}
          <FindingVerdictMeta finding={finding} className="mt-4" />
        </CardContent>
      </Card>

      {/* Resolution Layer */}
      {resolutionSteps.length > 0 ? (
        <Card className="mt-6 border-eos-border bg-eos-surface">
          <CardContent className="p-6">
            <p className="mb-6 text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Traseu de rezolvare
            </p>
            <div>
              {resolutionSteps.map((step, i) => (
                <ResolutionStep
                  key={step.title}
                  stepNumber={i + 1}
                  title={step.title}
                  icon={step.icon}
                  content={step.content}
                  accent={step.accent}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 border-eos-border bg-eos-surface">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-eos-text-muted">
              Acest finding nu are încă un traseu de rezolvare generat.
            </p>
            <p className="mt-1 text-xs text-eos-text-muted">
              Traseul va fi disponibil după analiza completă.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Additional info cards */}
      {(finding.impactSummary || finding.remediationHint || finding.ownerSuggestion || finding.evidenceRequired) && (
        <Card className="mt-6 border-eos-border bg-eos-surface">
          <CardContent className="divide-y divide-eos-border-subtle p-0">
            {finding.impactSummary && (
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-muted">Sumar impact</p>
                <p className="mt-2 text-sm leading-relaxed text-eos-text">{finding.impactSummary}</p>
              </div>
            )}
            {finding.remediationHint && (
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-muted">Indiciu remediere</p>
                <p className="mt-2 text-sm leading-relaxed text-eos-text">{finding.remediationHint}</p>
              </div>
            )}
            {finding.ownerSuggestion && (
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-muted">Responsabil sugerat</p>
                <p className="mt-2 text-sm leading-relaxed text-eos-text">{finding.ownerSuggestion}</p>
              </div>
            )}
            {finding.evidenceRequired && (
              <div className="px-6 py-4">
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-eos-text-muted">Dovezi necesare</p>
                <p className="mt-2 text-sm leading-relaxed text-eos-text">{finding.evidenceRequired}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legal mappings */}
      {finding.legalMappings && finding.legalMappings.length > 0 && (
        <Card className="mt-6 border-eos-border bg-eos-surface">
          <CardContent className="p-6">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Mapare legală
            </p>
            <div className="space-y-3">
              {finding.legalMappings.map((m, i) => (
                <div key={i} className="flex items-start gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-4 py-3">
                  <Scale className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-eos-text">
                      {m.regulation} — {m.article}
                    </p>
                    <p className="mt-0.5 text-xs text-eos-text-muted">{m.label}</p>
                    <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{m.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
