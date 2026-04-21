"use client"

import { useState } from "react"
import { X, Zap, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

type QuickAddStep = "idle" | "processing" | "done" | "error"

type QuickAddResult = {
  ok: boolean
  orgId: string
  orgName: string
  cui: string
  vatRegistered: boolean
  efacturaRegistered: boolean
  sector: string
  findingsCount: number
  criticalCount: number
  score: number
  message: string
}

type QuickAddDialogProps = {
  open: boolean
  onClose: () => void
  onSuccess: (result: QuickAddResult) => void
  onDrillIn?: (orgId: string) => void
}

export function QuickAddClientDialog({ open, onClose, onSuccess, onDrillIn }: QuickAddDialogProps) {
  const [cui, setCui] = useState("")
  const [website, setWebsite] = useState("")
  const [step, setStep] = useState<QuickAddStep>("idle")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<QuickAddResult | null>(null)

  if (!open) return null

  function reset() {
    setCui("")
    setWebsite("")
    setStep("idle")
    setError(null)
    setResult(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedCui = cui.trim()
    if (!trimmedCui) {
      setError("Introdu un CUI valid.")
      return
    }

    setStep("processing")
    setError(null)

    try {
      const res = await fetch("/api/partner/clients/quick-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cui: trimmedCui,
          website: website.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setStep("error")
        setError(data.error || "Eroare la adăugare.")
        return
      }

      setResult(data)
      setStep("done")
      toast.success(`Firma ${data.orgName} adăugată cu ${data.findingsCount} findings.`)
    } catch (err) {
      setStep("error")
      setError(err instanceof Error ? err.message : "Eroare de rețea.")
    }
  }

  function handleFinish() {
    if (result) onSuccess(result)
    reset()
  }

  function handleDrillIn() {
    if (result && onDrillIn) {
      onDrillIn(result.orgId)
      onSuccess(result)
    } else if (result) {
      onSuccess(result)
    }
    reset()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md rounded-eos-xl border border-eos-border bg-eos-surface shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-eos-border-subtle px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-eos-md bg-eos-primary/15">
              <Zap className="size-4 text-eos-primary" strokeWidth={2} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-eos-text">Adaugă firmă rapid</h3>
              <p className="text-xs text-eos-text-tertiary">CUI → ANAF → findings în sub 30s</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={step === "processing"}
            className="rounded-eos-md p-1.5 text-eos-text-muted transition-colors hover:bg-eos-surface-variant hover:text-eos-text disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Închide"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body — idle form */}
        {step === "idle" && (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div className="space-y-1.5">
              <label htmlFor="quick-add-cui" className="block text-xs font-medium text-eos-text-secondary">
                CUI firmă <span className="text-red-400">*</span>
              </label>
              <input
                id="quick-add-cui"
                type="text"
                value={cui}
                onChange={(e) => setCui(e.target.value)}
                placeholder="Ex: RO12345678"
                required
                autoFocus
                className="w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
              />
              <p className="text-[11px] text-eos-text-tertiary">
                Căutăm în ANAF → luăm nume, sector, e-Factura status
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="quick-add-website" className="block text-xs font-medium text-eos-text-secondary">
                Website (opțional)
              </label>
              <input
                id="quick-add-website"
                type="text"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="Ex: exemplu.ro"
                className="w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
              />
              <p className="text-[11px] text-eos-text-tertiary">
                Scanăm homepage pentru privacy policy, cookies, formulare
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-eos-md border border-red-500/30 bg-red-500/10 px-3 py-2.5">
                <AlertCircle className="size-4 shrink-0 text-red-400" />
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-eos-md px-3 py-2 text-xs font-medium text-eos-text-secondary transition-colors hover:bg-eos-surface-variant"
              >
                Anulează
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-eos-md bg-eos-primary px-4 py-2 text-xs font-semibold text-eos-text shadow-md shadow-eos-primary/20 transition-all hover:bg-eos-primary/90"
              >
                <Zap className="size-3.5" strokeWidth={2.5} />
                Adaugă firmă
              </button>
            </div>
          </form>
        )}

        {/* Body — processing */}
        {step === "processing" && (
          <div className="space-y-4 px-5 py-8 text-center">
            <Loader2 className="mx-auto size-8 animate-spin text-eos-primary" strokeWidth={2} />
            <div className="space-y-1">
              <p className="text-sm font-medium text-eos-text">Procesăm firma...</p>
              <p className="text-xs text-eos-text-tertiary">ANAF lookup → creare firmă → scan baseline</p>
            </div>
            <div className="space-y-1.5 text-left text-[11px] text-eos-text-tertiary">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-eos-primary" />
                <span>Căutare CUI în registrul ANAF</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-eos-primary/40" />
                <span>Creare firmă + profil compliance</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-eos-primary/40" />
                <span>Scan website + generare findings</span>
              </div>
            </div>
          </div>
        )}

        {/* Body — done */}
        {step === "done" && result && (
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-2.5 rounded-eos-lg border border-green-500/30 bg-green-500/10 px-3 py-3">
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-400" strokeWidth={2} />
              <div className="space-y-0.5">
                <p className="text-sm font-semibold text-green-300">{result.orgName}</p>
                <p className="text-xs text-green-200/80">CUI {result.cui} · sector {result.sector}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-eos-text-muted">Findings</p>
                <p className="mt-0.5 text-base font-semibold text-eos-text">{result.findingsCount}</p>
              </div>
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-eos-text-muted">Scor</p>
                <p className="mt-0.5 text-base font-semibold text-eos-text">{result.score}%</p>
              </div>
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-eos-text-muted">Critice</p>
                <p className="mt-0.5 text-base font-semibold text-eos-text">{result.criticalCount}</p>
              </div>
              <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2">
                <p className="text-[10px] uppercase tracking-wide text-eos-text-muted">e-Factura</p>
                <p className="mt-0.5 text-sm font-semibold text-eos-text">
                  {result.efacturaRegistered ? "✓ activ" : "— lipsă"}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleFinish}
                className="rounded-eos-md px-3 py-2 text-xs font-medium text-eos-text-secondary transition-colors hover:bg-eos-surface-variant"
              >
                Rămâi în portofoliu
              </button>
              <button
                type="button"
                onClick={handleDrillIn}
                className="rounded-eos-md bg-eos-primary px-4 py-2 text-xs font-semibold text-eos-text shadow-md shadow-eos-primary/20 transition-all hover:bg-eos-primary/90"
              >
                Intră în firmă →
              </button>
            </div>
          </div>
        )}

        {/* Body — error */}
        {step === "error" && (
          <div className="space-y-4 px-5 py-5">
            <div className="flex items-start gap-2.5 rounded-eos-lg border border-red-500/30 bg-red-500/10 px-3 py-3">
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" strokeWidth={2} />
              <div>
                <p className="text-sm font-semibold text-red-300">Nu am putut adăuga firma</p>
                <p className="mt-1 text-xs text-red-200/80">{error}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-eos-md px-3 py-2 text-xs font-medium text-eos-text-secondary transition-colors hover:bg-eos-surface-variant"
              >
                Închide
              </button>
              <button
                type="button"
                onClick={() => setStep("idle")}
                className="rounded-eos-md bg-eos-primary px-4 py-2 text-xs font-semibold text-eos-text shadow-md shadow-eos-primary/20 transition-all hover:bg-eos-primary/90"
              >
                Încearcă din nou
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
