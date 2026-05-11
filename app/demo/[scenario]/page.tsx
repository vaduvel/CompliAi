"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, AlertTriangle, Sparkles } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { DEMO_SCENARIO_LABELS, DEMO_SCENARIOS } from "@/lib/server/demo-seed"
import type { DemoScenario } from "@/lib/server/demo-seed"

export default function DemoScenarioPage() {
  const params = useParams()
  // Note: router is not used directly — redirect happens via window.location.href
  // because /api/demo/[scenario] sets cookies server-side and we need a hard reload.
  void useRouter
  const scenario = params.scenario as string
  const started = useRef(false)

  const isValid = DEMO_SCENARIOS.includes(scenario as DemoScenario)
  const label = isValid ? DEMO_SCENARIO_LABELS[scenario as DemoScenario] : null

  useEffect(() => {
    if (!isValid || started.current) return
    started.current = true

    // Apelează ruta API care seedează datele și setează cookie-ul de sesiune.
    // Redirecționarea se face server-side după seeding.
    window.location.href = `/api/demo/${scenario}`
  }, [scenario, isValid])

  // ── Invalid scenario state ──────────────────────────────────────────────

  if (!isValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-eos-bg px-6 text-center">
        <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-error/30 bg-eos-error-soft">
          <AlertTriangle className="size-5 text-eos-error" strokeWidth={1.75} />
        </div>
        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-error">
          Scenariu necunoscut
        </p>
        <h1
          data-display-text="true"
          className="mt-3 font-display text-[24px] font-semibold tracking-[-0.025em] text-eos-text"
        >
          Demo &ldquo;{scenario}&rdquo; nu există
        </h1>
        <p className="mt-3 max-w-md text-[13.5px] leading-[1.65] text-eos-text-muted">
          Scenariile disponibile sunt enumerate mai jos. Verifică URL-ul sau alege unul din
          listă.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {DEMO_SCENARIOS.map((s) => (
            <Link
              key={s}
              href={`/demo/${s}`}
              className="inline-flex items-center rounded-sm border border-eos-border bg-white/[0.02] px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.05em] text-eos-text-muted transition-colors hover:border-eos-primary/35 hover:bg-eos-primary/10 hover:text-eos-primary"
            >
              /demo/{s}
            </Link>
          ))}
        </div>

        <Link
          href="/"
          className="mt-8 font-mono text-[11px] uppercase tracking-[0.06em] text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
        >
          ← Înapoi la pagina principală
        </Link>
      </div>
    )
  }

  // ── Valid scenario — loading state ──────────────────────────────────────

  return (
    <div className="relative min-h-screen bg-eos-bg text-eos-text">
      {/* radial glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 size-[600px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-eos-primary/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 size-[400px] -translate-x-1/2 translate-y-1/3 rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-10">
        <Link href="/">
          <CompliScanLogoLockup variant="flat" size="sm" />
        </Link>

        <div className="mt-12 text-center">
          <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-eos-sm border border-eos-primary/30 bg-eos-primary/10">
            <Sparkles className="size-5 text-eos-primary" strokeWidth={2} />
          </div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            Demo · seed în curs
          </p>
          <h1
            data-display-text="true"
            className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text md:text-[32px]"
          >
            Pornim scenariul
          </h1>
          <p
            data-display-text="true"
            className="mt-2 font-display text-[18px] font-medium leading-tight tracking-[-0.015em] text-eos-primary"
          >
            {label}
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-eos-sm border border-eos-border bg-eos-surface px-4 py-2.5 font-mono text-[11.5px] uppercase tracking-[0.06em] text-eos-text-muted">
            <Loader2 className="size-3.5 animate-spin text-eos-primary" strokeWidth={2.5} />
            seed datele · setare cookie · redirect cockpit
          </div>

          <p className="mx-auto mt-6 max-w-sm text-[12px] leading-[1.6] text-eos-text-tertiary">
            Datele demo sunt fictive — nu trimite documente la terți din contul demo.
          </p>
        </div>

        <p className="mt-auto pt-12 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-eos-text-tertiary">
          © 2026 CompliScan · scenariul rulează izolat în orgID temporar
        </p>
      </div>
    </div>
  )
}
