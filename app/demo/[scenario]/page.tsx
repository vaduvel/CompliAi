"use client"

import { useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { DEMO_SCENARIO_LABELS, DEMO_SCENARIOS } from "@/lib/server/demo-seed"
import type { DemoScenario } from "@/lib/server/demo-seed"

export default function DemoScenarioPage() {
  const params = useParams()
  const router = useRouter()
  const scenario = params.scenario as string
  const started = useRef(false)

  const isValid = DEMO_SCENARIOS.includes(scenario as DemoScenario)
  const label = isValid
    ? DEMO_SCENARIO_LABELS[scenario as DemoScenario]
    : null

  useEffect(() => {
    if (!isValid || started.current) return
    started.current = true

    // Apelează ruta API care seedează datele și setează cookie-ul de sesiune.
    // Redirecționarea se face server-side după seeding.
    window.location.href = `/api/demo/${scenario}`
  }, [scenario, isValid])

  if (!isValid) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-eos-surface-base px-6 text-center">
        <p className="text-sm text-eos-error">
          Scenariu demo necunoscut: <code className="font-mono">{scenario}</code>
        </p>
        <p className="text-xs text-eos-text-muted">
          Disponibil: <code>/demo/imm</code>, <code>/demo/nis2</code>, <code>/demo/partner</code>, <code>/demo/revalidation</code>
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[radial-gradient(circle_at_top_left,var(--eos-accent-primary-subtle),transparent_30%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] px-6">
      <CompliScanLogoLockup variant="flat" size="sm" />

      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2 text-sm text-eos-text-muted">
          <Loader2 className="size-4 animate-spin" strokeWidth={2} />
          Se pornește demo-ul…
        </div>
        <p className="text-base font-semibold text-eos-text">
          Scenariu: {label}
        </p>
        <p className="max-w-xs text-xs text-eos-text-muted">
          Datele demo sunt fictive. Nu trimite documente la terți din contul demo.
        </p>
      </div>
    </div>
  )
}
