"use client"

// V3 P0.2 — Late NIS2 Rescue Banner
// Afișat pe pagina NIS2 când înregistrarea DNSC nu este confirmată.
// Formulare juridică prudentă: nu promitem reducere sancțiuni — demonstrăm bună-credință.

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, ShieldAlert, X } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import type { DnscRegistrationStatus } from "@/lib/server/nis2-store"

const STATUS_CONTEXT: Record<
  Exclude<DnscRegistrationStatus, "confirmed">,
  { label: string; urgency: "critical" | "warning" }
> = {
  "not-started": { label: "Nu ai început înregistrarea DNSC", urgency: "critical" },
  "in-progress": { label: "Înregistrarea DNSC este în curs", urgency: "warning" },
  submitted: { label: "Înregistrarea a fost transmisă — așteaptă confirmare", urgency: "warning" },
}

export function Nis2RescueBanner() {
  const [status, setStatus] = useState<DnscRegistrationStatus | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch("/api/nis2/dnsc-status", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { status: DnscRegistrationStatus }) => setStatus(d.status))
      .catch(() => null)
  }, [])

  if (!status || status === "confirmed" || dismissed) return null

  const ctx = STATUS_CONTEXT[status]
  const isCritical = ctx.urgency === "critical"

  return (
    <div
      role="alert"
      className={`rounded-eos-md border p-4 ${
        isCritical
          ? "border-eos-error/40 bg-eos-error/8"
          : "border-eos-warning/40 bg-eos-warning/8"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 shrink-0">
          {isCritical ? (
            <ShieldAlert className="size-5 text-eos-error" strokeWidth={2} />
          ) : (
            <AlertTriangle className="size-5 text-eos-warning" strokeWidth={2} />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-[11px] font-bold uppercase tracking-[0.18em] ${
                isCritical ? "text-eos-error" : "text-eos-warning"
              }`}
            >
              {isCritical ? "Urgență NIS2" : "Acțiune necesară NIS2"}
            </span>
          </div>

          <p className={`text-sm font-semibold ${isCritical ? "text-eos-error" : "text-eos-warning"}`}>
            {ctx.label}
          </p>

          <p className="text-sm text-eos-text">
            Înregistrarea tardivă este preferabilă lipsei totale de acțiune și poate demonstra{" "}
            <strong>buna-credință / atitudine proactivă</strong> la un eventual control DNSC.
          </p>

          <p className="text-xs text-eos-text-muted">
            CompliAI nu garantează rezultate juridice. Verifică situația cu un consultant specializat
            în securitate cibernetică sau drept IT.
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button asChild size="sm" variant={isCritical ? "destructive" : "default"}>
              <Link href="/dashboard/nis2/inregistrare-dnsc">
                Deschide Expertul de Înregistrare
              </Link>
            </Button>
            <span className="text-xs text-eos-text-muted">
              Ref: NIS2 Art. 27 · OUG 155/2024 Art. 22
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded p-1 text-eos-text-muted hover:bg-eos-secondary-hover hover:text-eos-text"
          aria-label="Închide avertisment"
        >
          <X className="size-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}
