"use client"

import { useEffect, useState, useCallback } from "react"
import {
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Loader2,
  Plus,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Upload,
  RotateCcw,
  Download,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import {
  CONTEXT_QUESTIONS,
  REVIEW_STATUS_LABELS,
  URGENCY_LABELS,
  REVIEW_CASE_LABELS,
  EVIDENCE_TYPE_LABELS,
  type VendorReview,
  type VendorReviewContext,
  type VendorReviewStatus,
  type VendorReviewUrgency,
  type EvidenceType,
} from "@/lib/compliance/vendor-review-engine"
import {
  fingerprintMatch,
  VENDOR_CATEGORY_LABELS,
  type VendorFingerprint,
} from "@/lib/compliance/vendor-library"
import { OrgKnowledgePrefill } from "@/components/compliscan/org-knowledge-prefill"

// ── Types ─────────────────────────────────────────────────────────────────────

type Nis2Vendor = {
  id: string
  name: string
  service: string
  riskLevel: string
  techConfidence?: "high" | "medium" | "low" | null
  hasDPA?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function urgencyVariant(u: VendorReviewUrgency) {
  const map: Record<VendorReviewUrgency, "destructive" | "warning" | "secondary" | "outline"> = {
    critical: "destructive",
    high: "warning",
    medium: "secondary",
    info: "outline",
  }
  return map[u]
}

function statusIcon(s: VendorReviewStatus) {
  switch (s) {
    case "detected":
      return <Eye className="size-3.5" strokeWidth={2} />
    case "needs-context":
      return <AlertTriangle className="size-3.5" strokeWidth={2} />
    case "review-generated":
      return <FileText className="size-3.5" strokeWidth={2} />
    case "awaiting-human-validation":
      return <Clock className="size-3.5" strokeWidth={2} />
    case "awaiting-evidence":
      return <Upload className="size-3.5" strokeWidth={2} />
    case "closed":
      return <CheckCircle2 className="size-3.5" strokeWidth={2} />
    case "overdue-review":
      return <XCircle className="size-3.5" strokeWidth={2} />
  }
}

function statusVariant(s: VendorReviewStatus) {
  if (s === "closed") return "success" as const
  if (s === "overdue-review") return "destructive" as const
  if (s === "needs-context" || s === "awaiting-evidence") return "warning" as const
  return "secondary" as const
}

function getLibraryMatch(vendorName: string): { vendor: VendorFingerprint; confidence: number } | null {
  const match = fingerprintMatch(vendorName)
  if (!match || match.confidence < 0.4) return null
  return { vendor: match.vendor, confidence: match.confidence }
}

function LibraryBadges({ vendorName }: { vendorName: string }) {
  const match = getLibraryMatch(vendorName)
  if (!match) return null

  const { vendor } = match
  return (
    <>
      <Badge variant="outline" className="text-[10px] normal-case tracking-normal gap-1">
        <CheckCircle2 className="size-2.5" strokeWidth={2.5} />
        Library
      </Badge>
      {vendor.dpaUrl && (
        <a
          href={vendor.dpaUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-full border border-eos-success/30 bg-eos-success/10 px-2 py-0.5 text-[10px] font-medium text-eos-success hover:bg-eos-success/20 transition-colors"
        >
          DPA public ↗
        </a>
      )}
      {!vendor.dpaUrl && vendor.typicallyProcessor && (
        <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
          DPA lipsă
        </Badge>
      )}
    </>
  )
}

function LibraryDetailPanel({ vendorName }: { vendorName: string }) {
  const match = getLibraryMatch(vendorName)
  if (!match) return null

  const { vendor, confidence } = match
  return (
    <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/5 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <p className="text-xs font-semibold text-eos-primary">
          Recunoscut din Library: {vendor.canonicalName}
        </p>
        <Badge variant="outline" className="text-[9px]">
          {Math.round(confidence * 100)}% match
        </Badge>
      </div>
      <div className="grid gap-1 text-xs text-eos-text-muted sm:grid-cols-2">
        <p><span className="font-medium">Categorie:</span> {VENDOR_CATEGORY_LABELS[vendor.category]}</p>
        <p><span className="font-medium">HQ:</span> {vendor.hqCountry} {vendor.hasEuEntity ? "(entitate UE)" : ""}</p>
        <p><span className="font-medium">Transfer:</span> {vendor.transferClue}</p>
        <p><span className="font-medium">Processor GDPR:</span> {vendor.typicallyProcessor ? "Da" : "Nu (controller)"}</p>
        {vendor.certifications.length > 0 && (
          <p className="sm:col-span-2"><span className="font-medium">Certificări:</span> {vendor.certifications.join(", ")}</p>
        )}
        {vendor.dataTypes.length > 0 && (
          <p className="sm:col-span-2"><span className="font-medium">Date procesate:</span> {vendor.dataTypes.join(", ")}</p>
        )}
        {vendor.complianceNote && (
          <p className="sm:col-span-2 italic">{vendor.complianceNote}</p>
        )}
      </div>
      {vendor.dpaUrl && (
        <a
          href={vendor.dpaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-eos-primary hover:underline"
        >
          Deschide DPA public ↗
        </a>
      )}
    </div>
  )
}

function inferVendorValidationLabel(review: VendorReview) {
  if (review.urgency === "critical" || review.urgency === "high") {
    return "L3 · Validare specialist"
  }
  if (review.urgency === "medium") return "L2 · Confirmare internă"
  return "L1 · Standard"
}

// ── Context Form ──────────────────────────────────────────────────────────────

function ContextForm({
  onSubmit,
  loading,
}: {
  onSubmit: (ctx: VendorReviewContext) => void
  loading: boolean
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const allAnswered = CONTEXT_QUESTIONS.every((q) => answers[q.key])

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-eos-text">
        Completează contextul minim necesar pentru a genera review-ul corect.
      </p>
      <OrgKnowledgePrefill
        categories={["vendors", "tools", "data-categories"]}
        prefillLabel="Vezi date confirmate anterior"
      />
      {CONTEXT_QUESTIONS.map((q) => (
        <div key={q.key} className="space-y-1.5">
          <p className="text-sm text-eos-text-muted">{q.label}</p>
          <div className="flex flex-wrap gap-2">
            {q.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.key]: opt.value }))}
                className={`rounded-eos-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                  answers[q.key] === opt.value
                    ? "border-eos-primary bg-eos-primary-soft text-eos-primary"
                    : "border-eos-border bg-eos-surface text-eos-text-muted hover:bg-eos-surface-variant"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}
      <Button
        className="mt-2"
        disabled={!allAnswered || loading}
        onClick={() => onSubmit(answers as unknown as VendorReviewContext)}
      >
        {loading ? <Loader2 className="size-4 animate-spin" /> : <FileText className="size-4" strokeWidth={2} />}
        Generează review
      </Button>
    </div>
  )
}

// ── Asset viewer ──────────────────────────────────────────────────────────────

function AssetViewer({ assets }: { assets: VendorReview["generatedAssets"] }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  if (!assets?.length) return null

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
        Assets generate
      </p>
      {assets.map((a) => (
        <div key={a.id} className="rounded-eos-md border border-eos-border bg-eos-surface">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-eos-text hover:bg-eos-surface-variant"
            onClick={() => setExpanded(expanded === a.id ? null : a.id)}
          >
            {expanded === a.id ? (
              <ChevronDown className="size-3.5 shrink-0" />
            ) : (
              <ChevronRight className="size-3.5 shrink-0" />
            )}
            <FileText className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
            {a.title}
          </button>
          {expanded === a.id && (
            <div className="border-t border-eos-border-subtle px-3 py-3">
              <pre className="whitespace-pre-wrap text-xs text-eos-text-muted">{a.content}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Evidence manager (V5.3) ───────────────────────────────────────────────────

const EVIDENCE_TYPES: EvidenceType[] = [
  "dpa-signed",
  "checklist-completed",
  "internal-approval",
  "link",
  "note",
  "other",
]

function EvidenceManager({
  review,
  onAddEvidence,
  onClose,
  loading,
}: {
  review: VendorReview
  onAddEvidence: (type: EvidenceType, description: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [evidenceType, setEvidenceType] = useState<EvidenceType>("note")
  const [description, setDescription] = useState("")
  const [confirmClose, setConfirmClose] = useState(false)
  const items = review.evidenceItems ?? []

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
        Dovezi ({items.length})
      </p>

      {/* Existing evidence items */}
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-surface px-3 py-2"
            >
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-eos-text">{item.description}</p>
                <p className="text-xs text-eos-text-tertiary">
                  {EVIDENCE_TYPE_LABELS[item.type]} · {item.addedBy} ·{" "}
                  {new Date(item.addedAtISO).toLocaleDateString("ro-RO")}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new evidence */}
      <div className="space-y-2 rounded-eos-md border border-eos-border bg-eos-surface-variant/50 p-3">
        <p className="text-xs font-medium text-eos-text-muted">Adaugă dovadă nouă</p>
        <div className="flex flex-wrap gap-1.5">
          {EVIDENCE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEvidenceType(t)}
              className={`rounded-eos-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                evidenceType === t
                  ? "border-eos-primary bg-eos-primary-soft text-eos-primary"
                  : "border-eos-border bg-eos-surface text-eos-text-muted hover:bg-eos-surface-variant"
              }`}
            >
              {EVIDENCE_TYPE_LABELS[t]}
            </button>
          ))}
        </div>
        <textarea
          className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-tertiary focus:border-eos-primary focus:outline-none"
          rows={2}
          placeholder="Descrie dovada: DPA semnat, link, notă internă, etc."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <Button
          size="sm"
          variant="outline"
          disabled={!description.trim() || loading}
          onClick={() => {
            onAddEvidence(evidenceType, description)
            setDescription("")
          }}
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" strokeWidth={2} />}
          Adaugă dovadă
        </Button>
      </div>

      {/* Close button with confirmation */}
      {!confirmClose ? (
        <Button
          size="sm"
          disabled={items.length === 0 || loading}
          onClick={() => setConfirmClose(true)}
        >
          <CheckCircle2 className="size-4" strokeWidth={2} />
          Închide review-ul ({items.length} {items.length === 1 ? "dovadă" : "dovezi"})
        </Button>
      ) : (
        <div className="flex items-center gap-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 p-3">
          <AlertTriangle className="size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <p className="flex-1 text-xs text-eos-text">
            Confirmi închiderea review-ului? Asigură-te că toate dovezile sunt adăugate.
          </p>
          <Button size="sm" disabled={loading} onClick={onClose}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : null}
            Da, închide
          </Button>
          <Button size="sm" variant="outline" onClick={() => setConfirmClose(false)}>
            Anulează
          </Button>
        </div>
      )}
    </div>
  )
}

// ── Progress stepper (V5.3) ──────────────────────────────────────────────────

const REVIEW_STEPS: { status: VendorReviewStatus; label: string }[] = [
  { status: "needs-context", label: "Context" },
  { status: "review-generated", label: "Review generat" },
  { status: "awaiting-evidence", label: "Dovezi" },
  { status: "closed", label: "Închis" },
]

function ProgressStepper({ currentStatus }: { currentStatus: VendorReviewStatus }) {
  const statusOrder: VendorReviewStatus[] = [
    "needs-context",
    "review-generated",
    "awaiting-evidence",
    "closed",
  ]
  const currentIdx = statusOrder.indexOf(currentStatus)

  return (
    <div className="flex items-center gap-1">
      {REVIEW_STEPS.map((step, i) => {
        const isDone = currentIdx > i || currentStatus === "closed"
        const isCurrent = statusOrder[i] === currentStatus
        return (
          <div key={step.status} className="flex items-center gap-1">
            {i > 0 && (
              <div
                className={`h-px w-4 ${isDone ? "bg-eos-success" : "bg-eos-border"}`}
              />
            )}
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                isDone
                  ? "bg-eos-success/10 text-eos-success"
                  : isCurrent
                    ? "bg-eos-primary-soft text-eos-primary"
                    : "bg-eos-surface-variant text-eos-text-tertiary"
              }`}
            >
              {isDone && <CheckCircle2 className="size-2.5" strokeWidth={2.5} />}
              {step.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Audit trail viewer (V5.3) ─────────────────────────────────────────────────

function AuditTrailViewer({ trail }: { trail: VendorReview["auditTrail"] }) {
  const [show, setShow] = useState(false)
  if (!trail?.length) return null

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-eos-text-tertiary hover:text-eos-text-muted"
        onClick={() => setShow(!show)}
      >
        {show ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Istoric acțiuni ({trail.length})
      </button>
      {show && (
        <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
          {[...trail].reverse().map((entry, i) => (
            <div key={i} className="flex items-baseline gap-2 text-xs text-eos-text-tertiary">
              <span className="shrink-0 font-mono">
                {new Date(entry.atISO).toLocaleDateString("ro-RO")}{" "}
                {new Date(entry.atISO).toLocaleTimeString("ro-RO", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="font-medium text-eos-text-muted">{entry.action}</span>
              <span>de {entry.by}</span>
              {entry.note && <span className="italic">({entry.note})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Past closures viewer (V5.4) ──────────────────────────────────────────────

function PastClosuresViewer({ closures }: { closures: VendorReview["pastClosures"] }) {
  const [show, setShow] = useState(false)
  if (!closures?.length) return null

  return (
    <div>
      <button
        type="button"
        className="flex items-center gap-1 text-xs text-eos-text-tertiary hover:text-eos-text-muted"
        onClick={() => setShow(!show)}
      >
        {show ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
        Review-uri anterioare ({closures.length})
      </button>
      {show && (
        <div className="mt-2 space-y-2">
          {closures.map((c, i) => (
            <div key={i} className="rounded-eos-md border border-eos-border-subtle bg-eos-surface p-2 text-xs">
              <p className="text-eos-text-muted">
                <span className="font-medium">Închis:</span>{" "}
                {new Date(c.closedAtISO).toLocaleDateString("ro-RO")} de {c.closedBy}
                {" · Caz: "}{REVIEW_CASE_LABELS[c.reviewCase]}
              </p>
              {c.evidenceItems.length > 0 && (
                <p className="mt-0.5 text-eos-text-tertiary">
                  {c.evidenceItems.length} {c.evidenceItems.length === 1 ? "dovadă" : "dovezi"} atașate
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Review detail panel ───────────────────────────────────────────────────────

function ReviewPanel({
  review,
  onAction,
  actionLoading,
}: {
  review: VendorReview
  onAction: (reviewId: string, action: string, data?: Record<string, unknown>) => void
  actionLoading: boolean
}) {
  return (
    <div className="space-y-4 border-t border-eos-border-subtle pt-4">
      {/* Progress stepper */}
      {review.status !== "overdue-review" && review.status !== "detected" && (
        <ProgressStepper currentStatus={review.status} />
      )}

      {/* Review count badge */}
      {(review.reviewCount ?? 0) > 0 && (
        <p className="text-xs text-eos-text-tertiary">
          Acest vendor a fost revizuit de {review.reviewCount}{" "}
          {review.reviewCount === 1 ? "ori" : "ori"}.
        </p>
      )}

      {/* Revalidation reason banner */}
      {review.reviewReason && (
        <div className="flex items-start gap-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 p-2.5">
          <Clock className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
          <p className="text-xs text-eos-text">{review.reviewReason}</p>
        </div>
      )}

      {/* Library match info */}
      <LibraryDetailPanel vendorName={review.vendorName} />

      {/* Header info */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-xs text-eos-text-tertiary">Categorie</p>
          <p className="text-sm font-medium text-eos-text capitalize">{review.category}</p>
        </div>
        <div>
          <p className="text-xs text-eos-text-tertiary">Sursă detectare</p>
          <p className="text-sm font-medium text-eos-text">{review.detectionSource}</p>
        </div>
        <div>
          <p className="text-xs text-eos-text-tertiary">Confidence</p>
          <p className="text-sm font-medium text-eos-text capitalize">{review.confidence}</p>
        </div>
        {review.reviewCase && (
          <div>
            <p className="text-xs text-eos-text-tertiary">Caz review</p>
            <p className="text-sm font-medium text-eos-text">
              {REVIEW_CASE_LABELS[review.reviewCase]}
            </p>
          </div>
        )}
        {review.nextReviewDueISO && (
          <div>
            <p className="text-xs text-eos-text-tertiary">Următorul review</p>
            <p className={`text-sm font-medium ${
              new Date(review.nextReviewDueISO) <= new Date() ? "text-eos-error" : "text-eos-text"
            }`}>
              {new Date(review.nextReviewDueISO).toLocaleDateString("ro-RO")}
              {new Date(review.nextReviewDueISO) <= new Date() && " (expirat)"}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-eos-text-tertiary">Nivel validare</p>
          <p className="text-sm font-medium text-eos-text">
            {inferVendorValidationLabel(review)}
          </p>
        </div>
      </div>

      {/* Stale evidence warning */}
      {review.status === "closed" && review.closedAtISO && (() => {
        const closedAt = new Date(review.closedAtISO).getTime()
        const daysSinceClosed = Math.floor((Date.now() - closedAt) / (1000 * 60 * 60 * 24))
        const evidenceAge = daysSinceClosed > 365 ? "expirate" : daysSinceClosed > 270 ? "aproape expirate" : null
        if (!evidenceAge) return null
        return (
          <div className="flex items-start gap-2 rounded-eos-md border border-eos-warning/30 bg-eos-warning/5 p-2.5">
            <Clock className="mt-0.5 size-3.5 shrink-0 text-eos-warning" strokeWidth={2} />
            <p className="text-xs text-eos-text">
              <span className="font-medium">Dovezile sunt {evidenceAge}</span> ({daysSinceClosed} zile de la închidere).
              {daysSinceClosed > 365
                ? " Revalidare recomandată imediat."
                : " Planifică revalidarea în curând."}
            </p>
          </div>
        )
      })()}

      {/* DPA expiry warning for library vendors */}
      {review.status !== "closed" && (() => {
        const match = getLibraryMatch(review.vendorName)
        if (!match) return null
        const { vendor } = match
        if (!vendor.typicallyProcessor) return null
        const hasDpaEvidence = review.evidenceItems?.some((e) => e.type === "dpa-signed")
        if (hasDpaEvidence) return null
        return (
          <div className="flex items-start gap-2 rounded-eos-md border border-eos-error/30 bg-eos-error/5 p-2.5">
            <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-eos-error" strokeWidth={2} />
            <p className="text-xs text-eos-text">
              <span className="font-medium">{vendor.canonicalName} este processor GDPR</span> dar nu are dovadă DPA atașată.
              {vendor.dpaUrl
                ? " DPA public disponibil — descarcă, semnează și atașează."
                : " Solicită DPA direct de la furnizor."}
            </p>
          </div>
        )
      })()}

      {/* Specialist escalation for high-urgency vendors */}
      {(review.urgency === "critical" || review.urgency === "high") && review.status !== "closed" && (
        <div className="flex items-start gap-2 rounded-eos-md border border-eos-error/30 bg-eos-error/5 p-2.5">
          <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-eos-error" strokeWidth={2} />
          <p className="text-xs text-eos-text">
            Cazul este pregătit pentru validare de specialitate. Documentele și red flags sunt deja organizate. Specialistul intervine doar pentru validare finală.
          </p>
        </div>
      )}

      {/* Status-based UI */}
      {review.status === "needs-context" && (
        <ContextForm
          loading={actionLoading}
          onSubmit={(ctx) =>
            onAction(review.id, "submit-context", { context: ctx })
          }
        />
      )}

      {review.status === "review-generated" && (
        <>
          <AssetViewer assets={review.generatedAssets} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={() => onAction(review.id, "approve")}
            >
              <ThumbsUp className="size-4" strokeWidth={2} />
              Aprobă review-ul
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => onAction(review.id, "reject")}
            >
              <ThumbsDown className="size-4" strokeWidth={2} />
              Respinge
            </Button>
          </div>
        </>
      )}

      {review.status === "awaiting-human-validation" && (
        <>
          <AssetViewer assets={review.generatedAssets} />
          <div className="flex gap-2">
            <Button
              size="sm"
              disabled={actionLoading}
              onClick={() => onAction(review.id, "approve")}
            >
              <ThumbsUp className="size-4" strokeWidth={2} />
              Validează și continuă
            </Button>
          </div>
        </>
      )}

      {review.status === "awaiting-evidence" && (
        <>
          <AssetViewer assets={review.generatedAssets} />
          <EvidenceManager
            review={review}
            loading={actionLoading}
            onAddEvidence={(type, description) =>
              onAction(review.id, "add-evidence", { evidenceType: type, evidenceDescription: description })
            }
            onClose={() => onAction(review.id, "close")}
          />
        </>
      )}

      {review.status === "closed" && (
        <div className="space-y-3">
          <AssetViewer assets={review.generatedAssets} />

          {/* Evidence items */}
          {(review.evidenceItems?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
                Dovezi ({review.evidenceItems!.length})
              </p>
              <div className="mt-1 space-y-1">
                {review.evidenceItems!.map((item) => (
                  <div key={item.id} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2} />
                    <span className="text-eos-text">{item.description}</span>
                    <span className="shrink-0 text-xs text-eos-text-tertiary">
                      ({EVIDENCE_TYPE_LABELS[item.type]})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Legacy evidence text */}
          {review.closureEvidence && !(review.evidenceItems?.length) && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
                Dovadă
              </p>
              <p className="mt-1 text-sm text-eos-text">{review.closureEvidence}</p>
            </div>
          )}

          {review.closureApprovedBy && (
            <p className="text-xs text-eos-text-tertiary">
              Aprobat de: {review.closureApprovedBy} la{" "}
              {review.closedAtISO
                ? new Date(review.closedAtISO).toLocaleDateString("ro-RO")
                : "—"}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={actionLoading}
            onClick={() => onAction(review.id, "reopen")}
          >
            <RotateCcw className="size-4" strokeWidth={2} />
            Redeschide
          </Button>
        </div>
      )}

      {/* Overdue review state (V5.4) */}
      {review.status === "overdue-review" && (
        <div className="space-y-3">
          <div className="flex items-start gap-2 rounded-eos-md border border-eos-error/30 bg-eos-error/5 p-3">
            <XCircle className="mt-0.5 size-4 shrink-0 text-eos-error" strokeWidth={2} />
            <div>
              <p className="text-sm font-medium text-eos-text">Review expirat</p>
              <p className="text-xs text-eos-text-muted">
                Review-ul periodic a expirat. Este necesară o revalidare pentru a menține conformitatea.
              </p>
            </div>
          </div>
          <AssetViewer assets={review.generatedAssets} />
          <Button
            size="sm"
            disabled={actionLoading}
            onClick={() => onAction(review.id, "revalidate")}
          >
            <RotateCcw className="size-4" strokeWidth={2} />
            Pornește revalidarea
          </Button>
        </div>
      )}

      {/* Past closures (V5.4) */}
      <PastClosuresViewer closures={review.pastClosures} />

      {/* Audit trail (V5.3) */}
      <AuditTrailViewer trail={review.auditTrail} />

      {/* Counsel-ready brief export (GOLD 3) */}
      <div className="border-t border-eos-border-subtle pt-3">
        <a
          href={`/api/vendor-review/${review.id}/brief`}
          download
          className="inline-flex items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-1.5 text-xs font-medium text-eos-text-muted transition-colors hover:bg-eos-surface-variant hover:text-eos-text"
        >
          <Download className="size-3.5" strokeWidth={2} />
          Descarcă brief counsel-ready
        </a>
      </div>
    </div>
  )
}

// ── Vendor picker (for creating new reviews) ──────────────────────────────────

function VendorPicker({
  vendors,
  existingVendorIds,
  onSelect,
  loading,
}: {
  vendors: Nis2Vendor[]
  existingVendorIds: Set<string>
  onSelect: (vendorId: string) => void
  loading: boolean
}) {
  const available = vendors.filter((v) => !existingVendorIds.has(v.id))

  if (available.length === 0) {
    return (
      <p className="text-sm text-eos-text-muted">
        Toți vendorii au deja un review activ sau nu există vendori în registru.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-eos-text-muted">
        Selectează un vendor din registrul NIS2 pentru a porni un review:
      </p>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {available.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={loading}
            onClick={() => onSelect(v.id)}
            className="flex w-full items-center justify-between rounded-eos-md border border-eos-border px-3 py-2 text-left text-sm transition-colors hover:bg-eos-surface-variant disabled:opacity-50"
          >
            <span className="font-medium text-eos-text">{v.name}</span>
            <span className="text-xs text-eos-text-muted">
              {v.techConfidence ? `tech (${v.techConfidence})` : v.service || "—"}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VendorReviewPage() {
  const [reviews, setReviews] = useState<VendorReview[]>([])
  const [vendors, setVendors] = useState<Nis2Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showPicker, setShowPicker] = useState(false)

  const load = useCallback(async () => {
    try {
      const [reviewsRes, vendorsRes] = await Promise.all([
        fetch("/api/vendor-review"),
        fetch("/api/nis2/vendors"),
      ])
      const reviewsData = (await reviewsRes.json()) as { reviews: VendorReview[] }
      const vendorsData = (await vendorsRes.json()) as { vendors: Nis2Vendor[] }
      setReviews(reviewsData.reviews ?? [])
      setVendors(vendorsData.vendors ?? [])
    } catch {
      toast.error("Nu am putut încărca datele.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function handleCreateReview(vendorId: string) {
    setActionLoading(true)
    try {
      const r = await fetch("/api/vendor-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendorId, detectionSource: "vendor-registry" }),
      })
      if (!r.ok) {
        const data = (await r.json()) as { error?: string }
        throw new Error(data.error ?? "Eroare la creare.")
      }
      toast.success("Review creat cu succes.")
      setShowPicker(false)
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare.")
    } finally {
      setActionLoading(false)
    }
  }

  async function handleAction(reviewId: string, action: string, data?: Record<string, unknown>) {
    setActionLoading(true)
    try {
      const r = await fetch(`/api/vendor-review/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...data }),
      })
      if (!r.ok) {
        const d = (await r.json()) as { error?: string }
        throw new Error(d.error ?? "Eroare.")
      }
      const messages: Record<string, string> = {
        close: "Review închis cu succes.",
        approve: "Review aprobat.",
        "submit-context": "Review generat pe baza contextului.",
        reject: "Review respins — completează din nou contextul.",
        "add-evidence": "Dovadă adăugată.",
        reopen: "Review redeschis.",
        revalidate: "Revalidare pornită — completează contextul actualizat.",
      }
      toast.success(messages[action] ?? "Actualizat.")
      await load()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Eroare.")
    } finally {
      setActionLoading(false)
    }
  }

  // Stats
  const openReviews = reviews.filter((r) => r.status !== "closed")
  const closedReviews = reviews.filter((r) => r.status === "closed")
  const criticalCount = reviews.filter(
    (r) => r.urgency === "critical" && r.status !== "closed",
  ).length
  const needsContextCount = reviews.filter((r) => r.status === "needs-context").length
  const overdueCount = reviews.filter((r) => r.status === "overdue-review").length
  const existingVendorIds = new Set(
    reviews.filter((r) => r.status !== "closed").map((r) => r.vendorId),
  )

  return (
    <div className="mx-auto max-w-4xl">
      <PageIntro
        eyebrow="V5 — Vendor Review Workbench"
        title="Vendor Review"
        description="Review semi-automat pentru vendorii externi detectați. Completează contextul, generează review-ul corect, confirmă și închide cu dovadă."
        actions={
          <Button onClick={() => setShowPicker(!showPicker)}>
            <Plus className="size-4" strokeWidth={2} />
            Pornește review nou
          </Button>
        }
      />

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" />
          Se încarcă...
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-eos-text">{openReviews.length}</p>
                <p className="text-xs text-eos-text-muted">Deschise</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-eos-error">{criticalCount}</p>
                <p className="text-xs text-eos-text-muted">Critice</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-eos-warning">{needsContextCount}</p>
                <p className="text-xs text-eos-text-muted">Necesită context</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-eos-error" : "text-eos-text-tertiary"}`}>
                  {overdueCount}
                </p>
                <p className="text-xs text-eos-text-muted">Expirate</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-eos-success">{closedReviews.length}</p>
                <p className="text-xs text-eos-text-muted">Închise</p>
              </CardContent>
            </Card>
          </div>

          {/* Vendor picker */}
          {showPicker && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Plus className="size-4 text-eos-text-muted" strokeWidth={2} />
                  Pornește review nou
                </CardTitle>
              </CardHeader>
              <CardContent>
                <VendorPicker
                  vendors={vendors}
                  existingVendorIds={existingVendorIds}
                  onSelect={(vid) => void handleCreateReview(vid)}
                  loading={actionLoading}
                />
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {reviews.length === 0 && (
            <div className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface p-8 text-center">
              <ShieldAlert className="mx-auto mb-3 size-10 text-eos-text-tertiary" strokeWidth={1.5} />
              <p className="font-medium text-eos-text">Niciun vendor review</p>
              <p className="mt-1 text-sm text-eos-text-muted">
                Pornește un review din registrul de vendori NIS2 sau importă vendori din e-Factura.
              </p>
            </div>
          )}

          {/* Review queue */}
          {reviews.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-eos-text-muted">
                Coada de review ({reviews.length})
              </p>
              {reviews.map((review) => {
                const isExpanded = expandedId === review.id
                return (
                  <Card key={review.id} className={isExpanded ? "ring-1 ring-eos-primary/30" : ""}>
                    <div className="p-4">
                      {/* Row header */}
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 text-left"
                        onClick={() => setExpandedId(isExpanded ? null : review.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="size-4 shrink-0 text-eos-text-muted" />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-eos-text-muted" />
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium text-eos-text">
                              {review.vendorName}
                            </span>
                            <Badge variant={urgencyVariant(review.urgency)}>
                              {URGENCY_LABELS[review.urgency]}
                            </Badge>
                            <Badge variant={statusVariant(review.status)}>
                              {statusIcon(review.status)}
                              {REVIEW_STATUS_LABELS[review.status]}
                            </Badge>
                            <LibraryBadges vendorName={review.vendorName} />
                            {review.detectionSource === "site-scan" && (
                              <Badge variant="secondary" className="text-[10px] normal-case tracking-normal gap-1">
                                🔍 detectat din site
                              </Badge>
                            )}
                            <span className="text-xs text-eos-text-tertiary capitalize">
                              {review.category}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-eos-text-tertiary">
                            Creat: {new Date(review.createdAtISO).toLocaleDateString("ro-RO")}
                            {review.nextReviewDueISO &&
                              ` · Următorul review: ${new Date(review.nextReviewDueISO).toLocaleDateString("ro-RO")}`}
                          </p>
                        </div>
                      </button>

                      {/* Expanded panel */}
                      {isExpanded && (
                        <ReviewPanel
                          review={review}
                          onAction={handleAction}
                          actionLoading={actionLoading}
                        />
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {/* Disclaimer */}
          <p className="text-center text-xs text-eos-text-tertiary">
            CompliScan nu oferă verdict juridic final. Review-urile generate sunt instrumente de asistență
            — validarea și decizia finală aparțin utilizatorului.
          </p>
        </div>
      )}
    </div>
  )
}
