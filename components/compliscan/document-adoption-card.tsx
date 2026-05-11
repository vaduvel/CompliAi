"use client"

import { useState } from "react"
import { CheckCircle2, PenSquare, Send, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { V3FrameworkTag } from "@/components/compliscan/v3"
import { Button } from "@/components/evidence-os/Button"
import {
  DOCUMENT_ADOPTION_LABELS,
  getDocumentAdoptionHint,
  getDocumentAdoptionProgress,
  type DocumentAdoptionStatus,
} from "@/lib/compliance/document-adoption"
import type { GeneratedDocumentKind } from "@/lib/compliance/types"

type DocumentAdoptionCardProps = {
  documentId: string
  documentTitle: string
  documentType: GeneratedDocumentKind
  adoptionStatus?: DocumentAdoptionStatus
  adoptionUpdatedAtISO?: string
  adoptionEvidenceNote?: string
  onUpdated: (payload: {
    adoptionStatus: DocumentAdoptionStatus
    adoptionUpdatedAtISO?: string
    adoptionEvidenceNote?: string
  }) => void
}

const ACTION_ORDER: DocumentAdoptionStatus[] = [
  "reviewed_internally",
  "sent_for_signature",
  "signed",
  "active",
]

function getActionIcon(status: DocumentAdoptionStatus) {
  switch (status) {
    case "reviewed_internally":
      return <PenSquare className="size-3.5" />
    case "sent_for_signature":
      return <Send className="size-3.5" />
    case "signed":
      return <CheckCircle2 className="size-3.5" />
    case "active":
      return <ShieldCheck className="size-3.5" />
  }
}

export function DocumentAdoptionCard({
  documentId,
  documentTitle,
  documentType,
  adoptionStatus,
  adoptionUpdatedAtISO,
  adoptionEvidenceNote,
  onUpdated,
}: DocumentAdoptionCardProps) {
  const [note, setNote] = useState(adoptionEvidenceNote ?? "")
  const [loadingStatus, setLoadingStatus] = useState<DocumentAdoptionStatus | null>(null)
  const progress = getDocumentAdoptionProgress(adoptionStatus)
  const isDpa = documentType === "dpa"

  async function handleUpdate(nextStatus: DocumentAdoptionStatus) {
    setLoadingStatus(nextStatus)

    try {
      const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/adoption`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adoptionStatus: nextStatus,
          adoptionEvidenceNote: note.trim() || undefined,
        }),
      })

      const payload = (await response.json().catch(() => null)) as
        | {
            feedbackMessage?: string
            document?: {
              adoptionStatus?: DocumentAdoptionStatus
              adoptionUpdatedAtISO?: string
              adoptionEvidenceNote?: string
            }
            error?: string
          }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || "Nu am putut salva starea de adoptare.")
      }

      onUpdated({
        adoptionStatus: payload?.document?.adoptionStatus ?? nextStatus,
        adoptionUpdatedAtISO: payload?.document?.adoptionUpdatedAtISO,
        adoptionEvidenceNote: payload?.document?.adoptionEvidenceNote ?? (note.trim() || undefined),
      })

      toast.success(payload?.feedbackMessage ?? "Starea de adoptare a fost salvată.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nu am putut salva starea de adoptare.")
    } finally {
      setLoadingStatus(null)
    }
  }

  return (
    <div
      data-testid="document-adoption-card"
      className="overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface"
    >
      <header className="border-b border-eos-border-subtle px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Urmă bilaterală
            </p>
            <h3
              data-display-text="true"
              className="mt-1 font-display text-[14.5px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
            >
              {isDpa ? "Semnarea DPA-ului" : "Adoptarea contractului-cadru"}
            </h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-eos-text-muted">
              {documentTitle} este deja în Dosar. De aici urmărești separat dacă a fost doar revizuit intern, trimis, semnat și pus efectiv în uz.
            </p>
          </div>
          <V3FrameworkTag
            tone={adoptionStatus ? "info" : "neutral"}
            label={adoptionStatus ? DOCUMENT_ADOPTION_LABELS[adoptionStatus] : "urmă nesalvată"}
            className="normal-case"
          />
        </div>
      </header>

      <div className="space-y-3 px-5 py-4">
        <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {progress.map((step, index) => (
              <div key={step.id} className="flex items-center gap-1.5">
                <span
                  className={[
                    "rounded-eos-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-[0.04em]",
                    step.state === "done"
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                      : step.state === "active"
                        ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                        : "border-eos-border bg-transparent text-eos-text-tertiary",
                  ].join(" ")}
                >
                  {step.label}
                </span>
                {index < progress.length - 1 ? (
                  <span className="text-[10px] text-white/10">—</span>
                ) : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-eos-text-muted">{getDocumentAdoptionHint(adoptionStatus)}</p>
          {adoptionUpdatedAtISO ? (
            <p className="mt-1.5 font-mono text-[10.5px] text-eos-text-tertiary">
              Ultima actualizare: {new Date(adoptionUpdatedAtISO).toLocaleString("ro-RO")}
            </p>
          ) : null}
        </div>

        <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3">
          <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.13em] text-eos-text-tertiary">
            Notă pentru semnare / punere în uz
          </p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            rows={4}
            placeholder={
              isDpa
                ? "Ex: Template-ul a fost revizuit intern și trimis către Mailchimp pentru semnare la 30.03.2026. Urma păstrată: email și ticket procurement."
                : "Ex: Contractul-cadru a fost validat intern și pus în uz în folderul comercial. Urma păstrată: link intern și data comunicării."
            }
            className="mt-2.5 min-h-[96px] w-full rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-2 text-[13px] leading-[1.5] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-border-strong"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {ACTION_ORDER.map((status) => (
            <Button
              key={status}
              type="button"
              size="sm"
              variant={adoptionStatus === status ? "default" : "outline"}
              className="gap-1.5"
              disabled={loadingStatus !== null}
              data-testid={`document-adoption-${status}`}
              onClick={() => void handleUpdate(status)}
            >
              {getActionIcon(status)}
              {DOCUMENT_ADOPTION_LABELS[status]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
