"use client"

import { useState } from "react"
import { CheckCircle2, PenSquare, Send, ShieldCheck } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
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
    <Card className="border-eos-border bg-eos-surface" data-testid="document-adoption-card">
      <CardHeader className="gap-3 border-b border-eos-border-subtle pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-eos-text-tertiary">
              Urmă bilaterală
            </p>
            <CardTitle className="mt-1 text-base">
              {isDpa ? "Semnarea DPA-ului" : "Adoptarea contractului-cadru"}
            </CardTitle>
            <p className="mt-2 text-sm text-eos-text-muted">
              {documentTitle} este deja în Dosar. De aici urmărești separat dacă a fost doar revizuit intern, trimis, semnat și pus efectiv în uz.
            </p>
          </div>
          <Badge variant="outline" className="normal-case tracking-normal">
            {adoptionStatus ? DOCUMENT_ADOPTION_LABELS[adoptionStatus] : "urmă nesalvată"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            {progress.map((step, index) => (
              <div key={step.id} className="flex items-center gap-2">
                <span
                  className={[
                    "rounded-full border px-2.5 py-1 text-xs font-medium",
                    step.state === "done"
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                      : step.state === "active"
                        ? "border-eos-primary/30 bg-eos-primary-soft text-eos-primary"
                        : "border-eos-border bg-eos-surface text-eos-text-tertiary",
                  ].join(" ")}
                >
                  {step.label}
                </span>
                {index < progress.length - 1 ? <div className="h-px w-4 bg-eos-border-subtle" /> : null}
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-eos-text-muted">{getDocumentAdoptionHint(adoptionStatus)}</p>
          {adoptionUpdatedAtISO ? (
            <p className="mt-2 text-xs text-eos-text-tertiary">
              Ultima actualizare: {new Date(adoptionUpdatedAtISO).toLocaleString("ro-RO")}
            </p>
          ) : null}
        </div>

        <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant p-4">
          <p className="text-xs font-mono uppercase tracking-[0.14em] text-eos-text-muted">
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
            className="mt-3 min-h-[112px] w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-3 text-sm text-eos-text outline-none"
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
      </CardContent>
    </Card>
  )
}
