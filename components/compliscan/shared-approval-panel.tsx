"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, Loader2, MessageCircle, ShieldCheck, XCircle } from "lucide-react"

// Sprint 1.2 — Issue 3 DPO: extension cu Reject + Comment flow.
// Patron poate alege: Aprob / Respinge cu motivare / Trimite comentariu.

type SharedComment = {
  id: string
  authorName: string
  comment: string
  createdAtISO: string
}

type SharedApprovalPanelProps = {
  token: string
  documentTitle: string
  initialApproved: boolean
  initialRejected?: boolean
  initialComments?: SharedComment[]
}

type Mode = "idle" | "rejecting" | "commenting"

export function SharedApprovalPanel({
  token,
  documentTitle,
  initialApproved,
  initialRejected = false,
  initialComments = [],
}: SharedApprovalPanelProps) {
  const [approved, setApproved] = useState(initialApproved)
  const [rejected, setRejected] = useState(initialRejected)
  const [comments, setComments] = useState<SharedComment[]>(initialComments)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>("idle")
  const [commentInput, setCommentInput] = useState("")
  const [authorInput, setAuthorInput] = useState("")
  const [hydrated, setHydrated] = useState(false)

  const isFinal = approved || rejected
  const showCommentBox = mode === "rejecting" || mode === "commenting"

  useEffect(() => {
    setHydrated(true)
  }, [])

  async function approveDocument() {
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/shared/${encodeURIComponent(token)}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut salva aprobarea.")
      }

      setApproved(true)
      setMode("idle")
    } catch (approvalError) {
      setError(
        approvalError instanceof Error ? approvalError.message : "Nu am putut salva aprobarea."
      )
    } finally {
      setPending(false)
    }
  }

  async function rejectDocument() {
    if (commentInput.trim().length < 8) {
      setError("Motivul respingerii este obligatoriu (minim 8 caractere).")
      return
    }
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/shared/${encodeURIComponent(token)}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment: commentInput.trim() }),
      })
      const payload = (await response.json().catch(() => null)) as { error?: string } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut salva respingerea.")
      }

      setRejected(true)
      setCommentInput("")
      setMode("idle")
    } catch (rejectionError) {
      setError(
        rejectionError instanceof Error ? rejectionError.message : "Nu am putut salva respingerea."
      )
    } finally {
      setPending(false)
    }
  }

  async function submitComment() {
    if (commentInput.trim().length < 4) {
      setError("Comentariul este obligatoriu (minim 4 caractere).")
      return
    }
    setPending(true)
    setError(null)

    try {
      const response = await fetch(`/api/shared/${encodeURIComponent(token)}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comment: commentInput.trim(),
          authorName: authorInput.trim() || undefined,
        }),
      })
      const payload = (await response.json().catch(() => null)) as {
        error?: string
        commentId?: string
      } | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut salva comentariul.")
      }

      setComments((prev) => [
        ...prev,
        {
          id: payload?.commentId ?? `local-${Date.now()}`,
          authorName: authorInput.trim() || "Client (magic link)",
          comment: commentInput.trim(),
          createdAtISO: new Date().toISOString(),
        },
      ])
      setCommentInput("")
      setAuthorInput("")
      setMode("idle")
    } catch (commentError) {
      setError(
        commentError instanceof Error ? commentError.message : "Nu am putut salva comentariul."
      )
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-eos-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start gap-3">
        <div
          className={`rounded-full p-2 ${
            rejected
              ? "bg-rose-50 text-rose-600"
              : approved
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-50 text-slate-600"
          }`}
        >
          <ShieldCheck className="size-5" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
            Aprobare client
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{documentTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Confirmarea, respingerea sau comentariul rămân în audit trail și creează alerte în
            dashboard-ul consultantului. Documentul nu devine certificare oficială; marchează doar
            decizia ta despre conținut.
          </p>

          {approved ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">
              <CheckCircle2 className="size-4" strokeWidth={2} />
              Aprobat prin magic link
            </div>
          ) : rejected ? (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700">
              <XCircle className="size-4" strokeWidth={2} />
              Respins de client cu motivare
            </div>
          ) : (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void approveDocument()}
                disabled={!hydrated || pending}
                className="inline-flex items-center justify-center gap-2 rounded-eos-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {pending && mode === "idle" ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <CheckCircle2 className="size-4" strokeWidth={2} />
                )}
                Aprob și semnez
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("rejecting")
                  setError(null)
                }}
                disabled={!hydrated || pending}
                className="inline-flex items-center justify-center gap-2 rounded-eos-md border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <XCircle className="size-4" strokeWidth={2} />
                Respinge cu motivare
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("commenting")
                  setError(null)
                }}
                disabled={!hydrated || pending}
                className="inline-flex items-center justify-center gap-2 rounded-eos-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <MessageCircle className="size-4" strokeWidth={2} />
                Trimite comentariu
              </button>
            </div>
          )}

          {showCommentBox && !isFinal ? (
            <div className="mt-4 space-y-3 rounded-eos-md border border-slate-200 bg-slate-50/60 p-4">
              <p className="text-sm font-semibold text-slate-900">
                {mode === "rejecting"
                  ? "Motiv pentru respingere (obligatoriu)"
                  : "Comentariu pentru cabinet"}
              </p>
              {mode === "commenting" ? (
                <input
                  type="text"
                  value={authorInput}
                  onChange={(e) => setAuthorInput(e.target.value)}
                  placeholder="Numele tău (opțional)"
                  className="w-full rounded-eos-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                  maxLength={120}
                  disabled={pending}
                />
              ) : null}
              <textarea
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  mode === "rejecting"
                    ? "Ex: Termenul de retenție 12 luni este prea scurt pentru sub-procesatori. Vă rog reformulați la 24 luni."
                    : "Întrebare sau feedback pentru cabinet despre acest document."
                }
                className="h-24 w-full rounded-eos-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none"
                maxLength={2000}
                disabled={pending}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => (mode === "rejecting" ? rejectDocument() : submitComment())}
                  disabled={pending}
                  className={`inline-flex items-center justify-center gap-2 rounded-eos-md px-4 py-2 text-sm font-semibold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
                    mode === "rejecting"
                      ? "bg-rose-600 hover:bg-rose-700"
                      : "bg-slate-900 hover:bg-slate-800"
                  }`}
                >
                  {pending ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : null}
                  {mode === "rejecting" ? "Trimite respingere" : "Trimite comentariu"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("idle")
                    setCommentInput("")
                    setAuthorInput("")
                    setError(null)
                  }}
                  disabled={pending}
                  className="inline-flex items-center justify-center gap-2 rounded-eos-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Renunță
                </button>
              </div>
            </div>
          ) : null}

          {error ? <p className="mt-3 text-sm text-eos-error">{error}</p> : null}

          {comments.length > 0 ? (
            <div className="mt-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                Comentarii trimise ({comments.length})
              </p>
              <ul className="space-y-2">
                {comments.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-eos-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                  >
                    <p className="text-xs font-semibold text-slate-500">
                      {c.authorName} · {new Date(c.createdAtISO).toLocaleString("ro-RO")}
                    </p>
                    <p className="mt-1 leading-6">{c.comment}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
