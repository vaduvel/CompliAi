"use client"

import { useState } from "react"
import { Copy, ExternalLink, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { supportsDocumentAdoption } from "@/lib/compliance/document-adoption"
import type { GeneratedDocumentRecord } from "@/lib/compliance/types"

type TokenResponse =
  | {
      ok?: boolean
      token?: string | { token?: string; expiresAtISO?: string }
      expiresAtISO?: string
      error?: string
    }
  | null

function getTokenValue(payload: TokenResponse): string | null {
  if (!payload?.token) return null
  if (typeof payload.token === "string") return payload.token
  return payload.token.token ?? null
}

export function DocumentShareAction({
  document,
  variant = "compact",
}: {
  document: Pick<GeneratedDocumentRecord, "id" | "title" | "documentType" | "adoptionStatus">
  variant?: "compact" | "full"
}) {
  const [loading, setLoading] = useState(false)
  const [shareLink, setShareLink] = useState<string | null>(null)

  if (!supportsDocumentAdoption(document.documentType)) return null

  const isFinal = document.adoptionStatus === "signed" || document.adoptionStatus === "active"
  const isRejected = document.adoptionStatus === "rejected"

  async function handleShare() {
    setLoading(true)
    try {
      const response = await fetch("/api/reports/share-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType: "partner",
          documentId: document.id,
          documentTitle: document.title,
        }),
      })
      const payload = (await response.json().catch(() => null)) as TokenResponse
      if (!response.ok) {
        throw new Error(payload?.error ?? "Nu am putut genera linkul de aprobare.")
      }

      const token = getTokenValue(payload)
      if (!token) throw new Error("Tokenul de aprobare lipsește din răspuns.")

      const link = `${window.location.origin}/shared/${token}`
      setShareLink(link)
      await navigator.clipboard.writeText(link).catch(() => undefined)
      toast.success("Link de aprobare copiat. Clientul poate aproba, respinge sau comenta.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nu am putut genera linkul de aprobare.")
    } finally {
      setLoading(false)
    }
  }

  const label = isRejected ? "Trimite versiune nouă" : isFinal ? "Retrimite link" : "Trimite la client"

  return (
    <div className={variant === "full" ? "space-y-2" : "flex flex-wrap items-center gap-2"}>
      <button
        type="button"
        onClick={() => void handleShare()}
        disabled={loading}
        className={[
          "inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-primary/35 bg-eos-primary/10 px-3 py-1.5 text-[12px] font-semibold text-eos-primary transition-colors hover:border-eos-primary/60 hover:bg-eos-primary/15 disabled:cursor-not-allowed disabled:opacity-60",
          variant === "full" ? "w-full justify-center" : "",
        ].join(" ")}
        title="Generează un magic link pentru acest document, nu doar profilul de readiness."
      >
        {loading ? <Loader2 className="size-3.5 animate-spin" strokeWidth={2} /> : <Send className="size-3.5" strokeWidth={2} />}
        {label}
      </button>

      {shareLink ? (
        <div
          className={[
            "flex min-w-0 items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-active px-2.5 py-1.5",
            variant === "full" ? "w-full" : "max-w-full",
          ].join(" ")}
        >
          <p className="min-w-0 flex-1 truncate text-[11px] text-eos-text-tertiary">{shareLink}</p>
          <button
            type="button"
            className="shrink-0 text-eos-text-tertiary transition-colors hover:text-eos-text"
            onClick={() => void navigator.clipboard.writeText(shareLink).then(() => toast.info("Link copiat"))}
            aria-label="Copiază linkul"
          >
            <Copy className="size-3.5" strokeWidth={2} />
          </button>
          <a
            href={shareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-eos-text-tertiary transition-colors hover:text-eos-text"
            aria-label="Deschide pagina clientului"
          >
            <ExternalLink className="size-3.5" strokeWidth={2} />
          </a>
        </div>
      ) : null}
    </div>
  )
}
