"use client"

import { useState } from "react"
import { ArrowRight, Briefcase, Building2, Loader2, Users } from "lucide-react"

type ClientScale = "1-5" | "5-20" | "20+"

type PartnerWorkspaceData = {
  orgName: string
  cui?: string
  clientScale: ClientScale
}

type Props = {
  initialOrgName?: string
  onComplete: () => void
  onBack?: () => void
}

const CLIENT_SCALE_OPTIONS: {
  id: ClientScale
  label: string
  sublabel: string
  icon: React.ElementType
}[] = [
  {
    id: "1-5",
    label: "1–5 clienți",
    sublabel: "Portofoliu mic",
    icon: Briefcase,
  },
  {
    id: "5-20",
    label: "5–20 clienți",
    sublabel: "Portofoliu mediu",
    icon: Users,
  },
  {
    id: "20+",
    label: "20+ clienți",
    sublabel: "Portofoliu larg",
    icon: Building2,
  },
]

const inputClass =
  "h-11 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-3.5 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-violet-500/50 focus:bg-eos-surface-active transition-colors"

export function PartnerWorkspaceStep({ initialOrgName = "", onComplete, onBack }: Props) {
  const [orgName, setOrgName] = useState(initialOrgName)
  const [cui, setCui] = useState("")
  const [clientScale, setClientScale] = useState<ClientScale | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    const name = orgName.trim()
    if (!name) {
      setError("Introdu numele firmei tale de consultanță.")
      return
    }
    if (!clientScale) {
      setError("Alege câți clienți gestionezi aproximativ.")
      return
    }

    setSaving(true)
    setError(null)

    const body: PartnerWorkspaceData = {
      orgName: name,
      clientScale,
      ...(cui.trim() ? { cui: cui.trim() } : {}),
    }

    try {
      const res = await fetch("/api/org/partner-workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = (await res.json()) as { ok?: boolean; error?: string }
      if (!res.ok) {
        setError(data.error ?? "Nu am putut salva spațiul de lucru. Încearcă din nou.")
        return
      }
      onComplete()
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-eos-xl border border-eos-border bg-eos-surface-variant">
      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Briefcase className="h-4 w-4 shrink-0 text-violet-400" strokeWidth={1.5} />
            <p className="text-sm font-medium text-eos-text-muted">
              Spațiul tău de lucru
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex shrink-0 items-center gap-1.5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-1.5 text-xs text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              Înapoi
            </button>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-eos-surface-elevated">
            <div
              className="h-full bg-violet-500 transition-all duration-300"
              style={{ width: clientScale ? "100%" : orgName.trim() ? "50%" : "10%" }}
            />
          </div>
          <p className="text-right text-[10px] text-eos-text-tertiary">
            {clientScale ? "Gata pentru portofoliu" : "Completează câmpurile de mai jos"}
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {/* Hint card */}
          <div className="rounded-eos-lg border border-violet-500/20 bg-violet-500/[0.06] px-4 py-3">
            <p className="text-sm font-medium text-eos-text">
              Configurezi spațiul de lucru al firmei tale de consultanță.
            </p>
            <p className="mt-1 text-xs text-eos-text-tertiary">
              Datele de conformitate ale clienților se completează din portofoliu, nu de aici.
            </p>
          </div>

          {/* Org name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-eos-text">
              Numele firmei tale de consultanță
            </label>
            <input
              type="text"
              value={orgName}
              onChange={(e) => { setOrgName(e.target.value); setError(null) }}
              placeholder="Ex: Cabinet Contabil Ionescu SRL"
              className={inputClass}
              onKeyDown={(e) => { if (e.key === "Enter") void handleSubmit() }}
            />
          </div>

          {/* CUI optional */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-eos-text">
              CUI propriu{" "}
              <span className="font-normal text-eos-text-tertiary">(opțional)</span>
            </label>
            <input
              type="text"
              value={cui}
              onChange={(e) => setCui(e.target.value)}
              placeholder="Ex: RO12345678"
              className={inputClass}
            />
            <p className="text-xs text-eos-text-tertiary">
              Folosit doar pentru identificarea contului și eventuale facturi emise de noi.
            </p>
          </div>

          {/* Client scale */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-eos-text">
              Câți clienți gestionezi aproximativ?
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {CLIENT_SCALE_OPTIONS.map((option) => {
                const isSelected = clientScale === option.id
                const Icon = option.icon
                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => { setClientScale(option.id); setError(null) }}
                    className={[
                      "flex flex-col items-center gap-2 rounded-eos-xl border px-3 py-4 text-center transition-all duration-200",
                      isSelected
                        ? "border-violet-500/40 bg-violet-500/[0.08] shadow-[0_0_16px_rgba(139,92,246,0.10)]"
                        : "border-eos-border bg-eos-surface-variant hover:border-eos-border-strong hover:bg-eos-surface-active",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-eos-lg border transition-all",
                        isSelected
                          ? "border-violet-500/30 bg-violet-500/10 text-violet-400"
                          : "border-eos-border bg-eos-surface-elevated text-eos-text-tertiary",
                      ].join(" ")}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p
                        className={[
                          "text-sm font-semibold leading-tight",
                          isSelected ? "text-eos-text" : "text-eos-text-muted",
                        ].join(" ")}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-tertiary">{option.sublabel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-eos-lg border border-eos-error/20 bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!orgName.trim() || !clientScale || saving}
            onClick={() => void handleSubmit()}
            className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Se salvează…
              </>
            ) : (
              <>
                Deschid portofoliul
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
