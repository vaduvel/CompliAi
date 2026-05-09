"use client"

// S3.3 — Waitlist form surface.

import { use, useState } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { LegalDisclaimer } from "@/components/compliscan/legal-disclaimer"
import type { IcpSegment } from "@/lib/server/white-label"

const ICP_LABEL: Record<IcpSegment, string> = {
  solo: "Proprietar / Manager IMM mic",
  "cabinet-dpo": "Cabinet DPO",
  "cabinet-fiscal": "Contabil CECCAR",
  "cabinet-hr": "Cabinet HR (Consultant)",
  "imm-internal": "Responsabil Compliance Intern (IMM)",
  "imm-hr": "HR Director / CHRO (IMM 100-500 ang)",
  enterprise: "CISO / Multi-framework Enterprise",
}

const VALID_ICP: readonly IcpSegment[] = [
  "solo",
  "cabinet-dpo",
  "cabinet-fiscal",
  "cabinet-hr",
  "imm-internal",
  "imm-hr",
  "enterprise",
]

function parseIcp(value: string | undefined): IcpSegment | null {
  if (!value) return null
  return (VALID_ICP as readonly string[]).includes(value) ? (value as IcpSegment) : null
}

export function WaitlistFormSurface({
  searchParams,
}: {
  searchParams: Promise<{ icp?: string; source?: string }>
}) {
  const params = use(searchParams)
  const initialIcp = parseIcp(params.icp)
  const initialSource = params.source ?? "/waitlist"

  const [email, setEmail] = useState("")
  const [icpSegment, setIcpSegment] = useState<IcpSegment | null>(initialIcp)
  const [context, setContext] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes("@")) {
      setError("Adresă email invalidă.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          icpSegment,
          source: initialSource,
          context: context.trim() || undefined,
        }),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Eroare la înscriere.")
        return
      }
      setSubmitted(true)
    } catch {
      setError("Eroare de rețea.")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="border-b border-eos-border-subtle bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="inline-flex items-center gap-2">
            <CompliScanLogoLockup size="sm" />
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] text-eos-text-muted hover:text-eos-text"
          >
            <ArrowLeft className="size-3.5" strokeWidth={2} />
            Pagina principală
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-16">
        {submitted ? (
          <div className="rounded-eos-lg border border-emerald-500/30 bg-emerald-500/[0.06] p-8 text-center">
            <CheckCircle2 className="mx-auto size-12 text-eos-success" strokeWidth={1.5} />
            <h1
              data-display-text="true"
              className="mt-4 font-display text-[26px] font-semibold tracking-[-0.02em] text-eos-text"
            >
              Te-am adăugat pe listă
            </h1>
            <p className="mx-auto mt-3 max-w-md text-[14px] leading-[1.6] text-eos-text-muted">
              Te anunțăm prin email când deschidem segmentul tău. Ținem volumul mic — nu spam,
              doar anunțuri relevante (lansări, beta-test, pricing finalizat).
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-4 py-2 text-[13px] font-medium text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
            >
              <ArrowLeft className="size-3.5" strokeWidth={2} />
              Înapoi la pagina principală
            </Link>
          </div>
        ) : (
          <>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-eos-primary">
              Listă de așteptare
            </p>
            <h1
              data-display-text="true"
              className="mt-3 font-display text-[36px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[44px]"
            >
              Anunță-mă când deschideți segmentul meu
            </h1>
            <p className="mt-4 max-w-xl text-[14.5px] leading-[1.65] text-eos-text-muted">
              CompliScan se lansează faseat pe ICP-uri (Doc strategic 06). Pentru segmentele
              încă în pregătire (Enterprise, IMM bundle), te poți înscrie aici și te anunțăm
              când deschidem.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <label className="block">
                <span className="text-sm font-medium text-eos-text-muted">Email *</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@firma.ro"
                  className="mt-1.5 h-10 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-eos-text-muted">Segment ICP</span>
                <select
                  value={icpSegment ?? ""}
                  onChange={(e) => setIcpSegment(parseIcp(e.target.value || undefined))}
                  className="mt-1.5 h-10 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                >
                  <option value="">Alege segmentul tău (opțional)</option>
                  {VALID_ICP.map((id) => (
                    <option key={id} value={id}>
                      {ICP_LABEL[id]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-medium text-eos-text-muted">
                  Context (opțional)
                </span>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="ex: 80 angajați, sector financiar, NIS2 + GDPR + DORA, vrem să centralizăm..."
                  rows={3}
                  maxLength={500}
                  className="mt-1.5 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3 py-2 text-sm text-eos-text outline-none focus:border-eos-border-strong"
                />
                <p className="mt-1 text-[11px] text-eos-text-tertiary">
                  Ne ajută să prioritizăm și să ne pregătim demo relevant pentru segmentul tău.
                  Max 500 caractere.
                </p>
              </label>

              {error && (
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12.5px] text-eos-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-eos-sm bg-eos-primary px-5 py-2.5 text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.45)] transition-colors hover:bg-eos-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <ArrowRight className="size-4" strokeWidth={2.5} />
                )}
                Înscrie-mă pe listă
              </button>
            </form>
          </>
        )}
      </main>

      <footer className="border-t border-eos-border-subtle py-10">
        <div className="mx-auto max-w-3xl px-6">
          <LegalDisclaimer />
          <p className="mt-6 text-center text-[11px] text-eos-text-tertiary">
            © 2026 CompliScan
          </p>
        </div>
      </footer>
    </div>
  )
}
