"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Briefcase, Building2, ShieldCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"

type ModeOption = {
  id: "solo" | "partner" | "compliance"
  label: string
  description: string
  icon: React.ReactNode
}

const MODE_OPTIONS: ModeOption[] = [
  {
    id: "solo",
    label: "Proprietar / Manager",
    description:
      "Gestionezi conformitatea pentru propria ta firma. Vei vedea un dashboard simplificat, axat pe actiuni concrete.",
    icon: <Building2 className="size-6" />,
  },
  {
    id: "partner",
    label: "Consultant / Contabil / Auditor",
    description:
      "Gestionezi mai multe firme simultan. Vei avea acces la un portofoliu agregat cu vedere cross-client.",
    icon: <Briefcase className="size-6" />,
  },
  {
    id: "compliance",
    label: "Responsabil conformitate",
    description:
      "Lucrezi intern pe o singura firma, cu drepturi operationale extinse. Vei vedea toate instrumentele de audit si raportare.",
    icon: <ShieldCheck className="size-6" />,
  },
]

export function OnboardingForm() {
  const router = useRouter()
  const [selectedMode, setSelectedMode] = useState<ModeOption["id"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    if (!selectedMode) return
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/set-user-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: selectedMode }),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setError(data.error || "Eroare la salvarea modului de utilizare.")
        return
      }

      toast.success("Mod de utilizare salvat")
      router.replace("/dashboard")
      router.refresh()
    } catch {
      setError("Eroare de retea. Incearca din nou.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--eos-accent-primary-subtle),transparent_32%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] px-4 py-12">
      <div className="w-full max-w-xl">
        <CompliScanLogoLockup
          className="mb-5"
          variant="gradient"
          size="md"
          subtitle=""
          titleClassName="text-eos-text"
          subtitleClassName="text-eos-text-muted"
        />

        <h1 className="mb-2 text-2xl font-semibold text-eos-text">
          Cum vei folosi CompliScan?
        </h1>
        <p className="mb-6 text-sm text-eos-text-muted">
          Alege modul care descrie cel mai bine rolul tau. Acest lucru ne ajuta
          sa iti personalizam experienta. Poti schimba oricand din setari.
        </p>

        <div className="space-y-3">
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSelectedMode(option.id)}
              className={`w-full text-left transition-colors ${
                selectedMode === option.id
                  ? "ring-2 ring-eos-primary"
                  : "ring-1 ring-eos-border hover:ring-eos-border-hover"
              } rounded-eos-lg bg-eos-surface p-4`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`mt-0.5 shrink-0 rounded-eos-md p-2 ${
                    selectedMode === option.id
                      ? "bg-eos-primary/10 text-eos-primary"
                      : "bg-eos-surface-variant text-eos-text-muted"
                  }`}
                >
                  {option.icon}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-eos-text">{option.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-eos-text-muted">
                    {option.description}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
            {error}
          </div>
        )}

        <Button
          size="lg"
          className="mt-6 w-full gap-2"
          disabled={!selectedMode || loading}
          onClick={() => void handleConfirm()}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Se salveaza...
            </>
          ) : (
            "Continua"
          )}
        </Button>

        <p className="mt-6 text-center text-xs text-eos-text-muted">
          Poti schimba modul de utilizare oricand din Setari cont.
        </p>
      </div>
    </div>
  )
}
