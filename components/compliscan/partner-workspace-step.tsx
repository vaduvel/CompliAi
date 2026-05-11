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
  "h-10 w-full rounded-eos-sm border border-eos-border bg-eos-surface-active px-3 text-[13px] text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-eos-primary/60 focus:bg-eos-surface-active transition-colors"

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
    <section className="relative overflow-hidden rounded-eos-lg border border-eos-border bg-eos-surface">
      <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-primary/70" aria-hidden />
      <div className="px-5 py-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Briefcase className="size-3.5 shrink-0 text-eos-primary" strokeWidth={1.5} />
            <p className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Spațiul tău de lucru
            </p>
          </div>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex h-[28px] shrink-0 items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 text-[12px] text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              Înapoi
            </button>
          )}
        </div>

        <h2
          data-display-text="true"
          className="mt-2 font-display text-[18px] font-semibold leading-tight tracking-[-0.015em] text-eos-text"
        >
          Configurezi cabinetul tău
        </h2>

        {/* Progress */}
        <div className="mt-4 space-y-1.5">
          <div className="h-1 w-full overflow-hidden rounded-full bg-eos-surface-elevated">
            <div
              className="h-full bg-eos-primary transition-all duration-300"
              style={{ width: clientScale ? "100%" : orgName.trim() ? "50%" : "10%" }}
            />
          </div>
          <p className="text-right font-mono text-[10px] text-eos-text-tertiary">
            {clientScale ? "Gata pentru portofoliu" : "Completează câmpurile de mai jos"}
          </p>
        </div>

        <div className="mt-5 space-y-5">
          {/* Hint card */}
          <div className="rounded-eos-lg border border-eos-primary/20 bg-eos-primary/[0.06] px-4 py-3">
            <p className="text-[13px] font-medium text-eos-text">
              Configurezi spațiul de lucru al firmei tale de consultanță.
            </p>
            <p className="mt-1 text-[12px] text-eos-text-tertiary">
              Datele de conformitate ale clienților se completează din portofoliu, nu de aici.
            </p>
          </div>

          {/* Org name */}
          <div className="space-y-1.5">
            <label className="block text-[12.5px] font-medium text-eos-text">
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
            <label className="block text-[12.5px] font-medium text-eos-text">
              CUI cabinet{" "}
              <span className="font-normal text-eos-text-tertiary">(opțional)</span>
            </label>
            <input
              type="text"
              value={cui}
              onChange={(e) => setCui(e.target.value)}
              placeholder="Ex: RO12345678"
              className={inputClass}
            />
            <p className="text-[11px] text-eos-text-tertiary">
              Doar CUI-ul cabinetului tău — pentru factura ta lunară de la CompliScan.
              CUI-urile clienților se sincronizează separat din SmartBill/Saga/Oblio
              sau din import portofoliu.
            </p>
          </div>

          {/* Client scale */}
          <div className="space-y-2">
            <p className="text-[12.5px] font-medium text-eos-text">
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
                      "flex flex-col items-center gap-2 rounded-eos-lg border px-3 py-4 text-center transition-all duration-200",
                      isSelected
                        ? "border-eos-primary/40 bg-eos-primary/[0.08]"
                        : "border-eos-border bg-eos-surface hover:border-eos-border-strong hover:bg-eos-surface-active",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-9 items-center justify-center rounded-eos-sm border transition-all",
                        isSelected
                          ? "border-eos-primary/30 bg-eos-primary/10 text-eos-primary"
                          : "border-eos-border bg-eos-surface-elevated text-eos-text-tertiary",
                      ].join(" ")}
                    >
                      <Icon className="size-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <p
                        className={[
                          "text-[12.5px] font-semibold leading-tight",
                          isSelected ? "text-eos-text" : "text-eos-text-muted",
                        ].join(" ")}
                      >
                        {option.label}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-eos-text-tertiary">{option.sublabel}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-eos-lg border border-eos-error/20 bg-eos-error-soft px-4 py-3 text-[12.5px] text-eos-error">
              {error}
            </div>
          )}

          <button
            type="button"
            disabled={!orgName.trim() || !clientScale || saving}
            onClick={() => void handleSubmit()}
            className="flex h-[40px] w-full items-center justify-center gap-1.5 rounded-eos-sm bg-eos-primary text-[13px] font-semibold text-white transition hover:bg-eos-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Se salvează…
              </>
            ) : (
              <>
                Deschid portofoliul
                <ArrowRight className="size-4" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
