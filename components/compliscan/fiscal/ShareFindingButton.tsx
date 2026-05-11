"use client"

// Share finding cu contabilul intern al clientului — magic link 72h.
// Componentă standalone: deschide modal cu email + recipientType,
// generează token via /api/findings/[id]/share, afișează URL + copy.

import { useState } from "react"
import { Check, Copy, Loader2, Send, Share2, X } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"

type RecipientType = "accountant" | "counsel" | "partner"

type ShareResponse = {
  ok: boolean
  url?: string
  expiresAtISO?: string
  emailSent?: boolean
  emailReason?: string | null
  error?: string
}

const RECIPIENT_LABEL: Record<RecipientType, string> = {
  accountant: "Contabil intern client",
  counsel: "Consultant juridic",
  partner: "Partener cabinet",
}

export function ShareFindingButton({ findingId, findingTitle }: { findingId: string; findingTitle: string }) {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [recipientType, setRecipientType] = useState<RecipientType>("accountant")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [sendEmail, setSendEmail] = useState(true)
  const [result, setResult] = useState<ShareResponse | null>(null)
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    setBusy(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(findingId)}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientType,
          recipientEmail: recipientEmail.trim() || undefined,
          sendEmail: sendEmail && !!recipientEmail.trim(),
        }),
      })
      const data = (await res.json()) as ShareResponse
      if (!res.ok || !data.ok) {
        toast.error(data.error ?? "Share eșuat.")
        return
      }
      setResult(data)
      if (data.emailSent) {
        toast.success(`Email trimis la ${recipientEmail}.`)
      } else {
        toast.success("Link generat — copiază-l și trimite-l prin canalul tău.")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setBusy(false)
    }
  }

  async function copyUrl() {
    if (!result?.url) return
    try {
      await navigator.clipboard.writeText(result.url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success("Link copiat.")
    } catch {
      toast.error("Nu am putut copia link-ul.")
    }
  }

  function reset() {
    setOpen(false)
    setResult(null)
    setCopied(false)
    setRecipientEmail("")
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-[30px] items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 font-mono text-[11px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
        data-testid="share-finding-button"
      >
        <Share2 className="size-3.5" strokeWidth={2} />
        Share cu contabilul clientului
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) reset()
          }}
        >
          <div className="w-full max-w-md rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p
                  data-display-text="true"
                  className="font-display text-[15.5px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Partajează finding
                </p>
                <p className="mt-0.5 text-[12px] text-eos-text-muted">
                  Link valid 72h, read-only. Nu necesită cont CompliScan.
                </p>
              </div>
              <button
                onClick={reset}
                className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-surface-variant hover:text-eos-text"
              >
                <X className="size-4" strokeWidth={2} />
              </button>
            </div>

            <div className="mt-4 rounded-eos-sm border border-eos-border-subtle bg-eos-surface-elevated p-3 text-[12.5px] text-eos-text-muted">
              <strong className="text-eos-text">{findingTitle}</strong>
            </div>

            {!result ? (
              <div className="mt-4 space-y-3">
                <label className="block">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                    Pentru cine
                  </span>
                  <select
                    value={recipientType}
                    onChange={(e) => setRecipientType(e.target.value as RecipientType)}
                    className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 text-[12.5px] text-eos-text"
                  >
                    {(Object.keys(RECIPIENT_LABEL) as RecipientType[]).map((t) => (
                      <option key={t} value={t}>
                        {RECIPIENT_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                    Email (opțional — trimitem direct dacă e completat)
                  </span>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="contabil@client.ro"
                    className="mt-1.5 h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 text-[12.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
                  />
                </label>

                {recipientEmail.trim() && (
                  <label className="flex items-center gap-2 text-[12px] text-eos-text-muted">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="size-3.5"
                    />
                    Trimite email automat
                  </label>
                )}

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    Anulează
                  </Button>
                  <Button onClick={() => void handleShare()} disabled={busy} size="sm">
                    {busy ? (
                      <>
                        <Loader2 className="mr-2 size-3.5 animate-spin" strokeWidth={2} /> Generez...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 size-3.5" strokeWidth={2} /> Generează link
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-eos-sm border border-eos-success/30 bg-eos-success-soft p-3 text-[12px] text-eos-success">
                  Link generat cu succes. Expiră:{" "}
                  <strong>
                    {result.expiresAtISO &&
                      new Date(result.expiresAtISO).toLocaleString("ro-RO", {
                        day: "2-digit",
                        month: "long",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                  </strong>
                </div>

                <div className="flex items-stretch gap-2">
                  <input
                    readOnly
                    value={result.url ?? ""}
                    className="ring-focus flex-1 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-2 font-mono text-[11.5px] text-eos-text outline-none"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => void copyUrl()}
                    className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 font-mono text-[11px] font-semibold text-eos-text-muted transition-colors hover:border-eos-primary hover:text-eos-primary"
                  >
                    {copied ? (
                      <>
                        <Check className="size-3.5" strokeWidth={2} /> Copiat
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" strokeWidth={2} /> Copiază
                      </>
                    )}
                  </button>
                </div>

                {result.emailSent ? (
                  <p className="text-[11.5px] text-eos-success">✓ Email trimis automat.</p>
                ) : recipientEmail.trim() ? (
                  <p className="text-[11.5px] text-eos-warning">
                    Email nu a fost trimis ({result.emailReason}). Copiază link-ul și trimite-l
                    manual.
                  </p>
                ) : (
                  <p className="text-[11.5px] text-eos-text-muted">
                    Copiază link-ul și trimite-l prin WhatsApp / email / Slack.
                  </p>
                )}

                <div className="flex justify-end pt-1">
                  <Button onClick={reset} size="sm">
                    Închide
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
