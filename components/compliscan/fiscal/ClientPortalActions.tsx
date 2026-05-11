"use client"

// Componenta client-portal (read+write) pe public page /shared-finding/[token].
// Permite contabilului intern al clientului să:
//   - vadă comentariile (atât de la cabinet cât și de la el)
//   - adauge comentariu nou
//   - upload documente (PDF, XML, imagini, max 1 MB)

import { useEffect, useRef, useState } from "react"
import {
  CheckCircle2,
  FileUp,
  Loader2,
  MessageSquare,
  Send,
} from "lucide-react"

type Comment = {
  id: string
  authorRole: "cabinet" | "client"
  authorEmail?: string
  body: string
  createdAtISO: string
}

type Document = {
  id: string
  fileName: string
  contentType: string
  sizeBytes: number
  uploadedByEmail?: string
  uploadedAtISO: string
  note?: string
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ro-RO", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function ClientPortalActions({ token }: { token: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loadingComments, setLoadingComments] = useState(true)
  const [posting, setPosting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [commentBody, setCommentBody] = useState("")
  const [authorEmail, setAuthorEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [okMsg, setOkMsg] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    void load()
  }, [])

  async function load() {
    setLoadingComments(true)
    try {
      const [c, d] = await Promise.all([
        fetch(`/api/client-portal/${encodeURIComponent(token)}/comment`).then((r) => r.json()),
        fetch(`/api/client-portal/${encodeURIComponent(token)}/upload`).then((r) => r.json()),
      ])
      setComments(c.comments ?? [])
      setDocuments(d.documents ?? [])
    } catch {
      setError("Nu am putut încărca comentariile/documentele.")
    } finally {
      setLoadingComments(false)
    }
  }

  async function postComment() {
    if (commentBody.trim().length < 2) {
      setError("Comentariu prea scurt.")
      return
    }
    setPosting(true)
    setError(null)
    setOkMsg(null)
    try {
      const res = await fetch(`/api/client-portal/${encodeURIComponent(token)}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: commentBody, authorEmail: authorEmail || undefined }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Trimitere eșuată.")
        return
      }
      setOkMsg("Comentariu trimis cabinetului.")
      setCommentBody("")
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setPosting(false)
    }
  }

  async function uploadFile(file: File) {
    setUploading(true)
    setError(null)
    setOkMsg(null)
    try {
      const fd = new FormData()
      fd.append("file", file)
      if (authorEmail) fd.append("email", authorEmail)
      const res = await fetch(`/api/client-portal/${encodeURIComponent(token)}/upload`, {
        method: "POST",
        body: fd,
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Upload eșuat.")
        return
      }
      setOkMsg(`Document trimis: ${data.document?.fileName}.`)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  return (
    <section className="space-y-6 rounded-eos-lg border border-eos-border bg-eos-surface p-5">
      <div>
        <h3
          data-display-text="true"
          className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Răspunde cabinetului
        </h3>
        <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">
          Trimite documentul justificativ sau adaugă o clarificare. Conversația rămâne legată de
          acest finding și e arhivată audit.
        </p>
      </div>

      {/* Email field (optional, identifies the responder) */}
      <div>
        <label className="block">
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Email tău (opțional, ajută cabinetul să te recunoască)
          </span>
          <input
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="contabil@firma-ta.ro"
            className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
          />
        </label>
      </div>

      {/* Upload section */}
      <div className="rounded-eos-md border border-dashed border-eos-border-strong bg-eos-surface-variant p-4">
        <div className="flex items-center gap-2">
          <FileUp className="size-4 text-eos-primary" strokeWidth={2} />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Upload document (PDF, XML, imagine, ZIP, Excel — max 1 MB)
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.xml,.zip,.xlsx,.xls,application/pdf,image/*,application/xml,text/xml,application/zip,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="mt-3 block w-full cursor-pointer text-[12px] text-eos-text-muted file:mr-3 file:rounded-eos-sm file:border-0 file:bg-eos-primary file:px-3 file:py-1.5 file:font-mono file:text-[11px] file:font-semibold file:uppercase file:tracking-[0.06em] file:text-white"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) void uploadFile(file)
          }}
          disabled={uploading}
        />
        {uploading && (
          <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] text-eos-text-muted">
            <Loader2 className="size-3 animate-spin" strokeWidth={2} /> Upload în curs...
          </p>
        )}
      </div>

      {/* Documents list */}
      {documents.length > 0 && (
        <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Documente trimise ({documents.length})
          </p>
          <ul className="mt-2 space-y-1.5 text-[12px]">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-2 text-eos-text-muted">
                <span className="font-mono">{d.fileName}</span>
                <span className="font-mono text-[10.5px] text-eos-text-tertiary">
                  {fmtSize(d.sizeBytes)} · {fmtDate(d.uploadedAtISO)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comment form */}
      <div>
        <div className="flex items-center gap-2">
          <MessageSquare className="size-4 text-eos-primary" strokeWidth={2} />
          <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Adaugă comentariu / clarificare
          </span>
        </div>
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          rows={4}
          maxLength={5000}
          placeholder="Ex: Atașez factura corectă cu CIF actualizat. Vă rog să confirmați recepția."
          className="ring-focus mt-2 min-h-[100px] w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-2 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="font-mono text-[10.5px] text-eos-text-tertiary">
            {commentBody.length}/5000
          </span>
          <button
            onClick={() => void postComment()}
            disabled={posting || commentBody.trim().length < 2}
            className="inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-eos-primary/90 disabled:opacity-50"
          >
            {posting ? (
              <>
                <Loader2 className="size-3 animate-spin" strokeWidth={2} /> Trimit...
              </>
            ) : (
              <>
                <Send className="size-3" strokeWidth={2} /> Trimite
              </>
            )}
          </button>
        </div>
      </div>

      {/* Comments thread */}
      {loadingComments ? (
        <div className="flex items-center gap-2 text-[12px] text-eos-text-muted">
          <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> Se încarcă...
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-3">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            Conversație ({comments.length})
          </p>
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-eos-md border p-3 ${
                c.authorRole === "cabinet"
                  ? "border-eos-primary/30 bg-eos-primary/5"
                  : "border-eos-border-subtle bg-eos-surface-elevated"
              }`}
            >
              <div className="flex items-center gap-2 text-[10.5px] text-eos-text-tertiary">
                <span className="font-mono font-semibold uppercase">
                  {c.authorRole === "cabinet" ? "Cabinet" : "Tu (client)"}
                </span>
                {c.authorEmail && <span>· {c.authorEmail}</span>}
                <span>· {fmtDate(c.createdAtISO)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[12.5px] leading-[1.55] text-eos-text">{c.body}</p>
            </div>
          ))}
        </div>
      ) : null}

      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-3 text-[12px] text-eos-error">
          {error}
        </div>
      )}
      {okMsg && (
        <div className="rounded-eos-md border border-eos-success/30 bg-eos-success-soft p-3 text-[12px] text-eos-success">
          <CheckCircle2 className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
          {okMsg}
        </div>
      )}
    </section>
  )
}
