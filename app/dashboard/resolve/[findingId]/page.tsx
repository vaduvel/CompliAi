"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Scale,
  Eye,
  Clock,
} from "lucide-react"

import { PageIntro } from "@/components/evidence-os/PageIntro"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent } from "@/components/evidence-os/Card"
import { SeverityBadge } from "@/components/evidence-os/SeverityBadge"
import { LoadingScreen, ErrorScreen } from "@/components/compliscan/route-sections"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanFinding, FindingResolution } from "@/lib/compliance/types"

// Extended finding type — automation fields are optional so the page
// compiles regardless of which branch supplies the data.
type FindingDetail = ScanFinding & {
  findingStatus?: "open" | "confirmed" | "dismissed" | "resolved"
  findingStatusUpdatedAtISO?: string
  confidenceScore?: number
  requiresHumanReview?: boolean
  reasoning?: string
  sourceParagraph?: string
  suggestedDocumentType?: string
}

// ── Resolution Steps ──────────────────────────────────────────────────────────

const RESOLUTION_STEPS: Array<{ key: keyof FindingResolution; label: string; icon: React.ElementType }> = [
  { key: "problem",         label: "Problemă detectată",      icon: AlertTriangle },
  { key: "impact",          label: "Impact",                   icon: Scale },
  { key: "action",          label: "Acțiune recomandată",      icon: FileText },
  { key: "generatedAsset",  label: "Asset generat",            icon: FileText },
  { key: "humanStep",       label: "Pas uman obligatoriu",     icon: Eye },
  { key: "closureEvidence", label: "Dovadă de închidere",      icon: CheckCircle2 },
  { key: "revalidation",    label: "Revalidare",               icon: Clock },
]

// ── Status helpers ────────────────────────────────────────────────────────────

type FindingStatus = "open" | "confirmed" | "dismissed" | "resolved"

const STATUS_CONFIG: Record<FindingStatus, { label: string; variant: "default" | "success" | "warning" | "destructive" | "secondary" }> = {
  open:      { label: "Deschis",   variant: "warning" },
  confirmed: { label: "Confirmat", variant: "default" },
  dismissed: { label: "Respins",   variant: "secondary" },
  resolved:  { label: "Rezolvat",  variant: "success" },
}

function ageLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000)
  if (days === 0) return "azi"
  if (days === 1) return "ieri"
  if (days < 30) return `acum ${days} zile`
  return `acum ${Math.floor(days / 30)} luni`
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function FindingDetailPage() {
  const params = useParams<{ findingId: string }>()
  const router = useRouter()
  const [finding, setFinding] = useState<FindingDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    if (!params.findingId) return
    setLoading(true)
    fetch(`/api/findings/${encodeURIComponent(params.findingId)}`, { cache: "no-store" })
      .then((r) => {
        if (!r.ok) throw new Error(r.status === 404 ? "Finding inexistent." : "Eroare server.")
        return r.json()
      })
      .then((data: { finding: FindingDetail }) => {
        setFinding(data.finding)
        setError(null)
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false))
  }, [params.findingId])

  async function updateStatus(status: "confirmed" | "dismissed" | "resolved") {
    if (!finding) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error("Eroare la actualizare.")
      setFinding({ ...finding, findingStatus: status, findingStatusUpdatedAtISO: new Date().toISOString() })
    } catch {
      setError("Nu s-a putut actualiza statusul.")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />
  if (error || !finding) return <ErrorScreen message={error ?? "Finding inexistent."} variant="section" />

  const status = (finding.findingStatus ?? "open") as FindingStatus
  const statusCfg = STATUS_CONFIG[status]
  const res = finding.resolution
  const activeIdx = res ? RESOLUTION_STEPS.findIndex((s) => !res[s.key]) : 0
  const currentStep = activeIdx === -1 ? RESOLUTION_STEPS.length : activeIdx
  const completedSteps = currentStep
  const totalSteps = RESOLUTION_STEPS.length

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href={dashboardRoutes.resolve}
        className="inline-flex items-center gap-1.5 text-sm text-eos-text-muted transition-colors hover:text-eos-text"
      >
        <ArrowLeft className="size-3.5" strokeWidth={2} />
        Înapoi la De rezolvat
      </Link>

      <PageIntro
        eyebrow={`Finding · ${finding.category.replace("_", " ")}`}
        title={finding.title}
        description={finding.detail}
        badges={
          <>
            <SeverityBadge severity={finding.severity as "critical" | "high" | "medium" | "low"} />
            <Badge variant={statusCfg.variant} className="normal-case tracking-normal">
              {statusCfg.label}
            </Badge>
            {finding.verdictConfidence && (
              <Badge variant="outline" className="normal-case tracking-normal">
                Încredere: {finding.verdictConfidence}
                {finding.confidenceScore != null && ` (${finding.confidenceScore}%)`}
              </Badge>
            )}
          </>
        }
        aside={
          <div className="space-y-2 text-right">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-eos-text-tertiary">
              Detectat
            </p>
            <p className="text-sm text-eos-text-muted">{ageLabel(finding.createdAtISO)}</p>
            {finding.sourceDocument && (
              <p className="text-xs text-eos-text-muted">
                Sursă: {finding.sourceDocument}
              </p>
            )}
          </div>
        }
      />

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      {status === "open" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-wrap items-center gap-3 px-5 py-4">
            <p className="mr-auto text-sm font-medium text-eos-text">
              Acest finding necesită decizia ta:
            </p>
            <Button
              size="sm"
              onClick={() => updateStatus("confirmed")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Confirmă
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => updateStatus("dismissed")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <XCircle className="size-3.5" strokeWidth={2} />
              Respinge
            </Button>
          </CardContent>
        </Card>
      )}

      {status === "confirmed" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="flex flex-wrap items-center gap-3 px-5 py-4">
            <p className="mr-auto text-sm font-medium text-eos-text">
              Finding confirmat. Marchează ca rezolvat când ai finalizat acțiunea.
            </p>
            <Button
              size="sm"
              onClick={() => updateStatus("resolved")}
              disabled={actionLoading}
              className="gap-1.5"
            >
              <CheckCircle2 className="size-3.5" strokeWidth={2} />
              Marchează rezolvat
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Resolution Layer (vertical stepper) ────────────────────────── */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="px-5 py-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
              Resolution Layer
              {finding.legalReference ? ` · ${finding.legalReference}` : ""}
            </p>
            <span className="text-xs text-eos-text-muted">{completedSteps}/{totalSteps} pași</span>
          </div>

          {/* Progress bar */}
          <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-eos-surface-variant">
            <div
              className="h-full bg-eos-primary transition-all duration-500"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>

          <div className="space-y-5">
            {RESOLUTION_STEPS.map((step, idx) => {
              const isDone = idx < currentStep
              const isActive = idx === currentStep
              const StepIcon = step.icon
              const text = (res?.[step.key] as string | undefined)
                ?? (isActive ? (finding.remediationHint ?? finding.detail) : undefined)
              return (
                <div key={step.key} className="flex gap-3.5">
                  <div className="flex w-7 flex-col items-center">
                    <div
                      className={[
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                        isDone
                          ? "border border-eos-success/40 bg-eos-success-soft text-eos-success"
                          : isActive
                            ? "border border-eos-border-strong bg-eos-bg-inset text-eos-text shadow-[0_0_0_3px_hsl(145_60%_48%/0.15)]"
                            : "border border-eos-border-subtle bg-eos-bg-inset text-eos-text-muted",
                      ].join(" ")}
                    >
                      {isDone ? (
                        <CheckCircle2 className="size-3.5" strokeWidth={2.5} />
                      ) : (
                        <StepIcon className="size-3.5" strokeWidth={2} />
                      )}
                    </div>
                    {idx < RESOLUTION_STEPS.length - 1 && (
                      <div className={`mt-1.5 w-px flex-1 ${isDone ? "bg-eos-success/30" : "bg-eos-border-subtle"}`} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-2 pt-1">
                    <p className={[
                      "mb-1 text-xs font-semibold",
                      isDone ? "text-eos-success" : isActive ? "text-eos-text" : "text-eos-text-muted",
                    ].join(" ")}>
                      {step.label}
                    </p>
                    <p className={[
                      "text-sm leading-relaxed",
                      isDone ? "text-eos-text-muted" : isActive ? "text-eos-text" : "text-eos-text-muted/60",
                    ].join(" ")}>
                      {text ?? "—"}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Legal Mappings ─────────────────────────────────────────────── */}
      {finding.legalMappings && finding.legalMappings.length > 0 && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-5">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
              Baza legală
            </p>
            <div className="space-y-3">
              {finding.legalMappings.map((lm, i) => (
                <div key={i} className="flex items-start gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                  <Scale className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-eos-text">
                      {lm.regulation} — {lm.article}
                    </p>
                    <p className="text-xs text-eos-text-muted">{lm.label}</p>
                    <p className="mt-1 text-xs text-eos-text-muted">{lm.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Provenance / Signal Source ──────────────────────────────────── */}
      {finding.provenance && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-5">
            <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
              Proveniență semnal
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Regulă</p>
                <p className="mt-1 text-sm text-eos-text">{finding.provenance.ruleId}</p>
              </div>
              {finding.provenance.matchedKeyword && (
                <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Cuvânt cheie</p>
                  <p className="mt-1 text-sm text-eos-text font-mono">{finding.provenance.matchedKeyword}</p>
                </div>
              )}
              {finding.provenance.signalSource && (
                <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Sursă semnal</p>
                  <p className="mt-1 text-sm text-eos-text">{finding.provenance.signalSource}</p>
                </div>
              )}
              {finding.provenance.signalConfidence && (
                <div className="rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Încredere semnal</p>
                  <p className="mt-1 text-sm text-eos-text">{finding.provenance.signalConfidence}</p>
                </div>
              )}
            </div>
            {finding.provenance.excerpt && (
              <div className="mt-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">Excerpt sursă</p>
                <p className="mt-1 text-sm leading-relaxed text-eos-text italic">
                  &ldquo;{finding.provenance.excerpt}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Gemini Reasoning (B1) ──────────────────────────────────────── */}
      {finding.reasoning && (
        <Card className="border-eos-border bg-eos-surface">
          <CardContent className="px-5 py-5">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
              Raționament AI
            </p>
            <p className="text-sm leading-relaxed text-eos-text">{finding.reasoning}</p>
            {finding.sourceParagraph && (
              <div className="mt-3 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                  Paragraf sursă
                </p>
                <p className="mt-1 text-sm leading-relaxed text-eos-text-muted italic">
                  &ldquo;{finding.sourceParagraph}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Metadata footer ────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-eos-text-muted">
        <span>ID: {finding.id}</span>
        {finding.scanId && <span>Scan: {finding.scanId}</span>}
        {finding.ownerSuggestion && <span>Owner sugerat: {finding.ownerSuggestion}</span>}
        {finding.findingStatusUpdatedAtISO && (
          <span>Actualizat: {new Date(finding.findingStatusUpdatedAtISO).toLocaleDateString("ro-RO")}</span>
        )}
      </div>
    </div>
  )
}
