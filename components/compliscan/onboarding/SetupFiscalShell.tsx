"use client"

// SetupFiscalShell — orchestrator UI pentru pagina /onboarding/setup-fiscal.
//
// Render-uiește 3 pași secvențiali per starea curentă:
//   step=import → SetupImportStep (4 căi: CSV / Oblio / SmartBill / SAGA)
//   step=anaf   → SetupAnafConnectStep (CTA OAuth ANAF)
//   step=scan   → SetupScanStep (animație live SPV pull per client)
//
// User-ul NU poate sări pași. Routing logic e pe server (page.tsx). Aici doar
// rendering + stepper visual + back link.
//
// Refs Faza 1.5 din fiscal-module-final-sprint-2026-05-12.md.

import Link from "next/link"
import { CheckCircle2, FileSpreadsheet, Landmark, Sparkles } from "lucide-react"

import { SetupImportStep } from "@/components/compliscan/onboarding/SetupImportStep"
import { SetupAnafConnectStep } from "@/components/compliscan/onboarding/SetupAnafConnectStep"
import { SetupScanStep } from "@/components/compliscan/onboarding/SetupScanStep"

type SetupStep = "import" | "anaf" | "scan"

type SetupFiscalShellProps = {
  currentStep: SetupStep
  clientsCount: number
  anafConnected: boolean
}

const STEPS: { id: SetupStep; label: string; icon: React.ElementType }[] = [
  { id: "import", label: "Importă clienții", icon: FileSpreadsheet },
  { id: "anaf", label: "Conectează ANAF SPV", icon: Landmark },
  { id: "scan", label: "Scanare automată", icon: Sparkles },
]

export function SetupFiscalShell({
  currentStep,
  clientsCount,
  anafConnected,
}: SetupFiscalShellProps) {
  const stepIdx = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-10">
      {/* Header */}
      <header className="space-y-2">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-eos-text-tertiary">
          Setup cabinet fiscal
        </p>
        <h1
          data-display-text="true"
          className="font-display text-[26px] font-semibold tracking-[-0.02em] text-eos-text"
        >
          Pune CompliScan la treabă în 3 pași
        </h1>
        <p className="max-w-2xl text-[13.5px] leading-[1.6] text-eos-text-muted">
          Aduce clienții tăi, conectează ANAF SPV ca să citim mesajele lor, apoi
          îți arătăm direct ce arde — fără să te lăsăm cu portofoliu gol fără
          context.
        </p>
      </header>

      {/* Stepper */}
      <nav aria-label="Pași setup" className="flex items-center gap-2 overflow-x-auto">
        {STEPS.map((step, idx) => {
          const isActive = idx === stepIdx
          const isComplete = idx < stepIdx
          const Icon = step.icon
          return (
            <div key={step.id} className="flex flex-1 items-center gap-2">
              <div
                className={`flex h-9 flex-1 items-center gap-2 rounded-eos-md border px-3 transition ${
                  isActive
                    ? "border-eos-primary bg-eos-primary/[0.08] text-eos-text"
                    : isComplete
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-text-muted"
                      : "border-eos-border bg-eos-surface text-eos-text-tertiary"
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="size-4 shrink-0 text-eos-success" strokeWidth={2} />
                ) : (
                  <Icon
                    className={`size-4 shrink-0 ${isActive ? "text-eos-primary" : "text-eos-text-tertiary"}`}
                    strokeWidth={1.5}
                  />
                )}
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {idx + 1}. {step.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <span
                  className={`h-px w-3 ${
                    isComplete ? "bg-eos-success/40" : "bg-eos-border"
                  }`}
                  aria-hidden
                />
              )}
            </div>
          )
        })}
      </nav>

      {/* Step body */}
      <section className="flex-1">
        {currentStep === "import" && <SetupImportStep />}
        {currentStep === "anaf" && (
          <SetupAnafConnectStep clientsCount={clientsCount} />
        )}
        {currentStep === "scan" && (
          <SetupScanStep clientsCount={clientsCount} anafConnected={anafConnected} />
        )}
      </section>

      {/* Footer disclaimer + bypass link */}
      <footer className="border-t border-eos-border-subtle pt-4 text-center">
        <Link
          href="/portfolio?skip=setup"
          className="text-[11.5px] text-eos-text-tertiary transition hover:text-eos-text-muted"
        >
          Sari peste setup — vezi portofoliu gol (nu recomandat)
        </Link>
      </footer>
    </main>
  )
}
