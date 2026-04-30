"use client"

// S1.7 — UI cabinet pentru magic links trimise patron.
// Listează generatedDocuments care au fost partajate prin /shared/[token],
// cu status (pending/signed/rejected), comments primite și timestamps.

import { useMemo, useState } from "react"
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Hourglass,
  MessageCircle,
  ShieldCheck,
  XCircle,
} from "lucide-react"

import {
  V3FilterBar,
  V3KpiStrip,
  V3PageHero,
  type V3FilterTab,
  type V3KpiItem,
} from "@/components/compliscan/v3"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { supportsDocumentAdoption } from "@/lib/compliance/document-adoption"
import type { GeneratedDocumentRecord } from "@/lib/compliance/types"

type StatusFilter = "all" | "pending" | "signed" | "rejected" | "commented"

function statusBucket(doc: GeneratedDocumentRecord): "pending" | "signed" | "rejected" {
  if (doc.adoptionStatus === "signed" || doc.adoptionStatus === "active") return "signed"
  if (doc.adoptionStatus === "rejected") return "rejected"
  return "pending"
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("ro-RO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function MagicLinksPageSurface() {
  const cockpit = useCockpitData()
  const [filter, setFilter] = useState<StatusFilter>("all")

  const documents = useMemo(() => {
    if (!cockpit.data) return [] as GeneratedDocumentRecord[]
    return cockpit.data.state.generatedDocuments
      .filter((doc) => supportsDocumentAdoption(doc.documentType))
      .filter((doc) => Boolean(doc.adoptionStatus || doc.adoptionUpdatedAtISO || (doc.shareComments?.length ?? 0) > 0))
      .sort((a, b) => {
        const bDate = b.adoptionUpdatedAtISO ?? b.generatedAtISO
        const aDate = a.adoptionUpdatedAtISO ?? a.generatedAtISO
        return new Date(bDate).getTime() - new Date(aDate).getTime()
      })
  }, [cockpit.data])

  const counts = useMemo(() => {
    let pending = 0
    let signed = 0
    let rejected = 0
    let commented = 0
    for (const doc of documents) {
      const bucket = statusBucket(doc)
      if (bucket === "pending") pending++
      else if (bucket === "signed") signed++
      else rejected++
      if ((doc.shareComments?.length ?? 0) > 0) commented++
    }
    return { pending, signed, rejected, commented, total: documents.length }
  }, [documents])

  const visible = useMemo(() => {
    if (filter === "all") return documents
    if (filter === "commented") {
      return documents.filter((doc) => (doc.shareComments?.length ?? 0) > 0)
    }
    return documents.filter((doc) => statusBucket(doc) === filter)
  }, [documents, filter])

  if (cockpit.loading || !cockpit.data) {
    return <LoadingScreen variant="section" />
  }

  const kpiItems: V3KpiItem[] = [
    {
      id: "pending",
      label: "Așteaptă răspuns",
      value: counts.pending,
      stripe: counts.pending > 0 ? "warning" : undefined,
      valueTone: counts.pending > 0 ? "warning" : "neutral",
      detail:
        counts.pending === 0
          ? "Niciun magic link în așteptare"
          : `${counts.pending} document${counts.pending !== 1 ? "e" : ""} la patron`,
    },
    {
      id: "signed",
      label: "Aprobate",
      value: counts.signed,
      stripe: counts.signed > 0 ? "success" : undefined,
      valueTone: counts.signed > 0 ? "success" : "neutral",
      detail: counts.signed === 0 ? "Niciun document aprobat" : "semnate prin magic link",
    },
    {
      id: "rejected",
      label: "Respinse",
      value: counts.rejected,
      stripe: counts.rejected > 0 ? "critical" : undefined,
      valueTone: counts.rejected > 0 ? "critical" : "neutral",
      detail: counts.rejected === 0 ? "Niciun document respins" : "necesită refacere",
    },
    {
      id: "commented",
      label: "Cu comentarii",
      value: counts.commented,
      stripe: counts.commented > 0 ? "info" : undefined,
      valueTone: counts.commented > 0 ? "info" : "neutral",
      detail:
        counts.commented === 0
          ? "Niciun feedback primit"
          : `${counts.commented} document${counts.commented !== 1 ? "e" : ""} cu feedback`,
    },
  ]

  const filterTabs: V3FilterTab<StatusFilter>[] = [
    { id: "all", label: "Toate", count: counts.total },
    { id: "pending", label: "Așteaptă", count: counts.pending },
    { id: "signed", label: "Aprobate", count: counts.signed },
    { id: "rejected", label: "Respinse", count: counts.rejected },
    { id: "commented", label: "Cu comentarii", count: counts.commented },
  ]

  return (
    <div className="space-y-5 pb-20 sm:pb-0" role="main">
      <V3PageHero
        breadcrumbs={[{ label: "Cabinet" }, { label: "Magic links", current: true }]}
        title="Magic links trimise patroni"
        description={
          <>
            Vezi statusul fiecărui link partajat prin <code className="font-mono text-[12px]">/shared/[token]</code>.
            Aprobările, respingerile și comentariile sunt salvate în Audit Trail și trimit notificare email.
          </>
        }
      />

      <V3KpiStrip items={kpiItems} />

      <V3FilterBar
        tabs={filterTabs}
        activeTab={filter}
        onTabChange={(id) => setFilter(id)}
      />

      {visible.length === 0 ? (
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-10 text-center">
          <ShieldCheck className="mx-auto size-8 text-eos-text-tertiary" strokeWidth={1.5} />
          <p className="mt-3 text-sm font-semibold text-eos-text">Nimic în această categorie</p>
          <p className="mt-1 text-xs text-eos-text-tertiary">
            {filter === "all"
              ? "Generează un document și trimite-l prin magic link patron pentru a vedea statusul aici."
              : "Schimbă filtrul de mai sus pentru a vedea alte documente."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((doc) => (
            <DocumentRow key={doc.id} doc={doc} />
          ))}
        </div>
      )}
    </div>
  )
}

function DocumentRow({ doc }: { doc: GeneratedDocumentRecord }) {
  const bucket = statusBucket(doc)
  const comments = doc.shareComments ?? []
  const updatedAt = doc.adoptionUpdatedAtISO ?? doc.generatedAtISO

  return (
    <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5 transition-colors hover:border-eos-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <StatusBadge bucket={bucket} />
            <span className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              {doc.documentType}
            </span>
          </div>
          <h3
            data-display-text="true"
            className="mt-2 font-display text-[16px] font-semibold tracking-[-0.01em] text-eos-text"
          >
            {doc.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.04em] text-eos-text-tertiary">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3" strokeWidth={2} />
              {bucket === "pending" ? "trimis" : bucket} · {formatDate(updatedAt)}
            </span>
            {comments.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-eos-primary">
                <MessageCircle className="size-3" strokeWidth={2} />
                {comments.length} comentari{comments.length !== 1 ? "i" : "u"}
              </span>
            )}
          </div>
          {doc.adoptionEvidenceNote && (
            <p className="mt-3 text-[13px] leading-[1.6] text-eos-text-muted">
              {doc.adoptionEvidenceNote}
            </p>
          )}
          {comments.length > 0 && (
            <div className="mt-4 space-y-2 border-l-2 border-eos-border-subtle pl-4">
              {comments.slice(-3).map((c) => (
                <div key={c.id}>
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-eos-text-tertiary">
                    {c.authorName} · {formatDate(c.createdAtISO)}
                  </p>
                  <p className="mt-1 text-[13px] leading-[1.55] text-eos-text-muted whitespace-pre-wrap">
                    {c.comment}
                  </p>
                </div>
              ))}
              {comments.length > 3 && (
                <p className="text-[11px] text-eos-text-tertiary">
                  + {comments.length - 3} comentari{comments.length - 3 !== 1 ? "i" : "u"} mai vechi
                </p>
              )}
            </div>
          )}
        </div>
        <a
          href={`/dashboard/dosar?focus=${encodeURIComponent(doc.id)}`}
          className="inline-flex shrink-0 items-center gap-1 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3 py-1.5 text-[12px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
        >
          Deschide
          <ExternalLink className="size-3" strokeWidth={2} />
        </a>
      </div>
    </div>
  )
}

function StatusBadge({ bucket }: { bucket: "pending" | "signed" | "rejected" }) {
  if (bucket === "signed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-emerald-600">
        <CheckCircle2 className="size-3" strokeWidth={2.5} />
        aprobat
      </span>
    )
  }
  if (bucket === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-rose-600">
        <XCircle className="size-3" strokeWidth={2.5} />
        respins
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-amber-600">
      <Hourglass className="size-3" strokeWidth={2.5} />
      așteaptă
    </span>
  )
}
