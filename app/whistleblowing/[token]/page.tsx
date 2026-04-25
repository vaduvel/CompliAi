"use client"

import { use, useState } from "react"
import Link from "next/link"
import { CheckCircle2, Flag, Loader2, Lock, Shield } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

type Category = "fraud" | "corruption" | "safety" | "privacy" | "harassment" | "financial" | "other"

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "fraud", label: "Fraudă" },
  { value: "corruption", label: "Corupție" },
  { value: "safety", label: "Securitate / Siguranță" },
  { value: "privacy", label: "Confidențialitate date" },
  { value: "harassment", label: "Hărțuire" },
  { value: "financial", label: "Nereguli financiare" },
  { value: "other", label: "Altele" },
]

export default function WhistleblowingSubmitPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [category, setCategory] = useState<Category>("fraud")
  const [description, setDescription] = useState("")
  const [anonymous, setAnonymous] = useState(true)
  const [contactInfo, setContactInfo] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (description.trim().length < 20) {
      setError("Descrierea trebuie să aibă cel puțin 20 de caractere.")
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch("/api/whistleblowing/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          category,
          description: description.trim(),
          anonymous,
          contactInfo: anonymous ? undefined : contactInfo.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Eroare la trimitere")
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare necunoscută. Încearcă din nou.")
    } finally {
      setSubmitting(false)
    }
  }

  // ── Submitted state ──────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="min-h-screen bg-eos-bg text-eos-text">
        <header className="border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-6 py-4">
            <Link href="/">
              <CompliScanLogoLockup variant="flat" size="sm" />
            </Link>
          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md flex-col items-center justify-center px-6 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full border border-eos-success/30 bg-eos-success-soft">
            <CheckCircle2 className="size-6 text-eos-success" strokeWidth={2} />
          </div>
          <p className="mt-5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
            Sesizare înregistrată
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text"
          >
            Mulțumim — sesizarea a fost primită.
          </h1>
          <p className="mt-3 max-w-sm text-[13.5px] leading-[1.65] text-eos-text-muted">
            Sesizarea ta va fi analizată în termen de <strong className="text-eos-text">3 luni</strong>,
            conform Directivei EU 2019/1937. Identitatea ta rămâne protejată.
          </p>
          <p className="mt-6 font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
            Poți închide această pagină
          </p>
        </main>
      </div>
    )
  }

  // ── Form state ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <header className="border-b border-eos-border bg-eos-bg/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-6 py-4">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="sm" />
          </Link>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-eos-border bg-white/[0.03] px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
            <Lock className="size-3" strokeWidth={2} />
            Canal protejat
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md px-6 py-10">
        {/* Hero */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-eos-sm border border-eos-primary/30 bg-eos-primary/10">
            <Flag className="size-5 text-eos-primary" strokeWidth={2} />
          </div>
          <p className="mt-4 font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Whistleblowing · Directiva EU 2019/1937
          </p>
          <h1
            data-display-text="true"
            className="mt-2 font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[30px]"
          >
            Canal de sesizare
          </h1>
          <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">
            Sesizările sunt tratate confidențial. Poți rămâne anonim — datele tale nu vor
            fi stocate dacă alegi anonimat.
          </p>
        </div>

        {/* Form */}
        <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label
                htmlFor="wb-category"
                className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
              >
                Categorie
              </label>
              <select
                id="wb-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[13.5px] text-eos-text outline-none transition-colors focus:border-eos-primary/50"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="wb-description"
                className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
              >
                Descriere · minim 20 caractere
              </label>
              <textarea
                id="wb-description"
                rows={6}
                placeholder="Descrie situația în detaliu — ce s-a întâmplat, când, cine a fost implicat..."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value)
                  setError(null)
                }}
                className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2.5 text-[13.5px] leading-[1.55] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
              />
              <div className="flex items-center justify-between font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                <span>{description.length} caractere</span>
                {description.length > 0 && description.length < 20 && (
                  <span className="text-eos-warning">{20 - description.length} mai trebuie</span>
                )}
                {description.length >= 20 && <span className="text-eos-success">✓ valid</span>}
              </div>
            </div>

            {/* Anonymity panel */}
            <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={anonymous}
                  onChange={(e) => setAnonymous(e.target.checked)}
                  className="mt-0.5 size-4 shrink-0 accent-eos-primary"
                />
                <div>
                  <p className="flex items-center gap-1.5 text-[13px] font-semibold text-eos-text">
                    <Shield className="size-3.5 text-eos-primary" strokeWidth={2.25} />
                    Sesizare anonimă
                  </p>
                  <p className="mt-1 text-[12px] leading-[1.55] text-eos-text-muted">
                    Datele tale nu vor fi salvate și nu vei putea fi identificat.
                  </p>
                </div>
              </label>

              {!anonymous && (
                <div className="mt-4 space-y-1.5">
                  <label
                    htmlFor="wb-contact"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                  >
                    Date contact · opțional
                  </label>
                  <input
                    id="wb-contact"
                    placeholder="Email sau telefon pentru follow-up"
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    className="h-10 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[13px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                  />
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                {error}
              </div>
            )}

            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm bg-eos-primary text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:bg-eos-primary/50 disabled:shadow-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Se trimite...
                </>
              ) : (
                <>
                  <Flag className="size-4" strokeWidth={2.25} />
                  Trimite sesizarea
                </>
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-eos-text-tertiary">
          Protejat de Directiva EU 2019/1937 · Răspuns garantat în 3 luni · Token validat
          server-side
        </p>
      </main>
    </div>
  )
}
