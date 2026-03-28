"use client"

import { useState } from "react"
import { use } from "react"
import { CheckCircle2, Flag, Loader2, Shield } from "lucide-react"

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

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-eos-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto size-12 text-eos-success" strokeWidth={1.5} />
          <h1 className="mt-4 text-xl font-semibold text-gray-900">Sesizare înregistrată</h1>
          <p className="mt-2 text-sm text-gray-500">
            Sesizarea ta a fost primită și va fi analizată în termen de 3 luni, conform Directivei EU 2019/1937.
          </p>
          <p className="mt-4 text-xs text-gray-400">Poți închide această pagină.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-eos-primary-soft">
            <Flag className="size-6 text-eos-primary" strokeWidth={1.5} />
          </div>
          <h1 className="mt-3 text-xl font-semibold text-gray-900">Canal de sesizare</h1>
          <p className="mt-1 text-sm text-gray-500">
            Sesizările sunt tratate confidențial. Poți rămâne anonim.
          </p>
        </div>

        <div className="rounded-eos-xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Categorie</label>
            <select
              className="w-full rounded-eos-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-eos-primary focus:ring-1 focus:ring-blue-500"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Descriere (minim 20 caractere)</label>
            <textarea
              className="w-full rounded-eos-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-eos-primary focus:ring-1 focus:ring-blue-500"
              rows={5}
              placeholder="Descrie situația în detaliu: ce s-a întâmplat, când, cine a fost implicat..."
              value={description}
              onChange={(e) => { setDescription(e.target.value); setError(null) }}
            />
          </div>

          <div className="rounded-eos-md border border-gray-200 bg-gray-50 p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 size-4 rounded border-gray-300 accent-eos-primary"
                checked={anonymous}
                onChange={(e) => setAnonymous(e.target.checked)}
              />
              <div>
                <p className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                  <Shield className="size-3.5 text-eos-primary" />
                  Sesizare anonimă
                </p>
                <p className="text-xs text-gray-500">Datele tale nu vor fi salvate și nu vei putea fi identificat.</p>
              </div>
            </label>
            {!anonymous && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date contact (opțional)</label>
                <input
                  className="w-full rounded-eos-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-eos-primary"
                  placeholder="Email sau telefon pentru follow-up"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                />
              </div>
            )}
          </div>

          {error && (
            <p className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft px-3 py-2 text-sm text-eos-error">{error}</p>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-eos-primary-hover disabled:opacity-60"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Trimite sesizarea
          </button>

          <p className="text-center text-[11px] text-gray-400">
            Protejat de Directiva EU 2019/1937 · Răspuns garantat în 3 luni
          </p>
        </div>
      </div>
    </div>
  )
}
