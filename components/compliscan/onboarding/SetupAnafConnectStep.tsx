"use client"

// SetupAnafConnectStep — Pas 2 setup-fiscal: ANAF SPV OAuth.
//
// Mircea are deja N clienți în portofoliu. Acum trebuie să conecteze
// certificatul digital al cabinetului ca să putem accesa SPV per CUI.
//
// Realitate ANAF (verificată):
//   • 1 OAuth cu cert cabinet = 1 token valid 90 zile
//   • Cu token putem apela listaMesajeFactura?cif=X pentru ORICE CUI unde
//     cabinetul are împuternicire activă (înregistrată anterior la ANAF, hârtie)
//   • NU există endpoint care listează împuternicirile — noi probăm per CUI
//   • Pentru CUI fără împuternicire: ANAF returnează 403/401 → marcăm clientul
//     cu badge + template PDF descărcabil
//
// Refs Faza 1.5b din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Loader2,
  ShieldCheck,
} from "lucide-react"

type SetupAnafConnectStepProps = {
  /** Câți clienți sunt în portofoliu — folosit pentru mesaj contextual. */
  clientsCount: number
}

export function SetupAnafConnectStep({ clientsCount }: SetupAnafConnectStepProps) {
  const [busy, setBusy] = useState(false)

  function handleConnect() {
    setBusy(true)
    // Redirect către OAuth ANAF. Callback-ul vine cu ?anaf=connected pe
    // /onboarding/setup-fiscal — page-ul SSR re-evaluează și avansează la
    // step=scan automat.
    const returnTo = encodeURIComponent("/onboarding/setup-fiscal")
    window.location.href = `/api/anaf/connect?returnTo=${returnTo}`
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h2
          data-display-text="true"
          className="font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Pas 2 — Conectează ANAF SPV
        </h2>
        <p className="text-[13.5px] leading-[1.6] text-eos-text-muted">
          <span className="font-medium text-eos-text">
            {clientsCount} {clientsCount === 1 ? "client importat" : "clienți importați"}.
          </span>{" "}
          Pentru a vedea ce probleme au — facturi respinse ANAF, notificări
          e-TVA, certificate care expiră — avem nevoie de certificatul tău
          digital de cabinet ca să accesăm SPV-ul lor.
        </p>
      </header>

      {/* Hero CTA card */}
      <div className="relative overflow-hidden rounded-eos-lg border border-eos-warning/30 bg-eos-warning/[0.05] p-6">
        <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-eos-warning" aria-hidden />
        <div className="flex items-start gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-eos-xl border border-eos-warning/30 bg-eos-warning/[0.08]">
            <Landmark className="size-6 text-eos-warning" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                Recomandat — obligatoriu pentru wow moment
              </p>
              <h3
                data-display-text="true"
                className="font-display text-[17px] font-semibold tracking-[-0.01em] text-eos-text"
              >
                Autorizează ANAF SPV cu certificatul cabinetului
              </h3>
            </div>

            <ul className="space-y-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
              <li className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-eos-warning"
                  strokeWidth={2}
                />
                <span>
                  1 OAuth cu cert cabinet → token valid 90 zile, refresh automat
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-eos-warning"
                  strokeWidth={2}
                />
                <span>
                  Pentru fiecare CUI din portofoliu, probăm ANAF SPV cu token-ul
                  tău — tragem mesajele (facturi respinse, notificări e-TVA, alerte)
                </span>
              </li>
              <li className="flex gap-2">
                <CheckCircle2
                  className="mt-0.5 size-3.5 shrink-0 text-eos-warning"
                  strokeWidth={2}
                />
                <span>
                  Cron lunar continuă scan-ul automat — Mircea nu trebuie să
                  reapese
                </span>
              </li>
            </ul>

            <button
              type="button"
              onClick={handleConnect}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-eos-md bg-eos-warning px-4 py-2 text-[13px] font-semibold text-eos-warning-foreground shadow-sm transition hover:bg-eos-warning disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  Redirect către anaf.ro…
                </>
              ) : (
                <>
                  <ShieldCheck className="size-4" strokeWidth={2} />
                  Autorizează ANAF SPV
                  <ExternalLink className="size-3.5" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* What if no împuternicire? */}
      <details className="group rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 p-3">
        <summary className="flex cursor-pointer items-center gap-2 text-[12.5px] font-medium text-eos-text">
          <AlertTriangle className="size-3.5 text-eos-text-muted" strokeWidth={2} />
          Ce se întâmplă dacă unii clienți NU au împuternicire activă la ANAF?
        </summary>
        <div className="mt-2 space-y-2 text-[12px] leading-[1.55] text-eos-text-muted">
          <p>
            <strong className="text-eos-text">Pentru clienții cu împuternicire activă</strong>
            : tragem mesajele SPV imediat — apar în portofoliu cu findings reale.
          </p>
          <p>
            <strong className="text-eos-text">Pentru clienții fără împuternicire activă</strong>
            : apar în portofoliu cu badge{" "}
            <code className="font-mono text-[10.5px]">⚠ împuternicire lipsă</code>
            . Îți oferim:
          </p>
          <ul className="list-inside list-disc space-y-1 pl-2">
            <li>Template PDF împuternicire pre-completat cu CUI client + CUI cabinet</li>
            <li>Link direct la formularul online ANAF de înregistrare împuternicire</li>
            <li>După înregistrare (proces ofline, 1-5 zile), apeși „Refresh ANAF” și re-probăm</li>
          </ul>
          <p className="pt-1 text-[11.5px]">
            <strong>Notă:</strong> ANAF NU oferă API public pentru listarea
            împuternicirilor. De aceea probăm per CUI și marcăm individual.
          </p>
        </div>
      </details>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 p-3 text-[11.5px] leading-[1.55] text-eos-text-tertiary">
        <strong className="text-eos-text">Securitate:</strong> CompliScan NU
        stochează certificatul tău digital. ANAF emite un token OAuth bearer
        valid 90 zile pe care îl folosim doar pentru read-only la SPV-ul
        clienților. Poți revoca oricând din Setări → Integrări ANAF.
      </div>
    </div>
  )
}
