"use client"

// Public lead-magnet calculator pentru estimarea amenzilor ANAF.
// Frontend pure (folosește direct lib pure-functions, fără apel API).

import { useMemo, useState } from "react"
import { AlertTriangle, ArrowRight, Calculator, Sparkles } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import {
  ALL_CATEGORIES,
  ALL_VIOLATIONS,
  estimateAggregate,
  type TaxpayerCategory,
  type ViolationType,
} from "@/lib/compliance/efactura-fines-calculator"

function fmtRON(n: number): string {
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 0 })
}

export function FinesCalculator() {
  const [category, setCategory] = useState<TaxpayerCategory>("mic")
  const [counts, setCounts] = useState<Record<ViolationType, number>>({
    efactura_nedepusa: 0,
    efactura_b2c_nedepusa: 0,
    efactura_b2b_15pct: 0,
    efactura_intarziere: 0,
    efactura_xml_eroare: 0,
    pfa_cnp_neinregistrat: 0,
    saft_d406_nedepusa: 0,
    saft_d406_intarziere: 0,
    etva_neresponded: 0,
    spv_neactivat: 0,
    registru_facturi_neactualizat: 0,
  })

  const violations = useMemo(
    () =>
      (Object.keys(counts) as ViolationType[]).map((type) => ({
        type,
        count: counts[type],
      })),
    [counts],
  )

  const aggregate = useMemo(
    () => estimateAggregate(violations, category),
    [violations, category],
  )

  const hasViolations = aggregate.estimates.length > 0

  return (
    <section className="space-y-5 rounded-eos-lg border border-eos-border bg-eos-surface p-6">
      <div className="flex items-center gap-2">
        <Calculator className="size-4 text-eos-primary" strokeWidth={2} />
        <p
          data-display-text="true"
          className="font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Calculator amenzi ANAF — e-Factura, SAF-T, RO e-TVA
        </p>
      </div>

      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12.5px] text-eos-text">
        <strong className="font-semibold">Disclaimer:</strong> Estimările sunt INFORMATIVE. Decizia
        ANAF este în limita prevăzută de lege și depinde de circumstanțe (bună-credință,
        recurența, mărimea contribuabilului). Nu este consultanță juridică — verifică cu
        contabilul / fiscalistul tău.
      </div>

      {/* Category selector */}
      <div>
        <label className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Categoria contribuabilului
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {ALL_CATEGORIES.map((c) => (
            <button
              key={c.category}
              type="button"
              onClick={() => setCategory(c.category)}
              className={`rounded-eos-sm border px-3 py-2 text-left text-[12.5px] transition-colors ${
                category === c.category
                  ? "border-eos-primary bg-eos-primary/10 text-eos-text"
                  : "border-eos-border bg-eos-surface-variant text-eos-text-muted hover:border-eos-border-strong"
              }`}
            >
              <p className="font-semibold">{c.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Violation inputs */}
      <div>
        <label className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
          Câte încălcări estimezi în ultimele 12 luni?
        </label>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {ALL_VIOLATIONS.map((v) => (
            <label
              key={v.type}
              className="flex items-center justify-between gap-3 rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 text-[12.5px]"
            >
              <span className="text-eos-text-muted">{v.label}</span>
              <input
                type="number"
                min={0}
                value={counts[v.type] || ""}
                onChange={(e) =>
                  setCounts((prev) => ({ ...prev, [v.type]: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="h-8 w-20 rounded-eos-sm border border-eos-border bg-eos-surface px-2 text-right font-mono text-[12px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
                placeholder="0"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Results */}
      {hasViolations && (
        <div className="space-y-4">
          <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-eos-error" strokeWidth={2} />
              <div>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-error">
                  Expunere totală amenzi
                </p>
                <p
                  data-display-text="true"
                  className="mt-1 font-display text-[26px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  {fmtRON(aggregate.grandTotalMinRON)} – {fmtRON(aggregate.grandTotalMaxRON)} RON
                </p>
                <p className="mt-1 text-[12.5px] text-eos-text-muted">
                  Maxim aproximativ <strong>{fmtRON(aggregate.worstCaseEUR)} EUR</strong> (curs ~5 RON/EUR)
                  · pentru categoria {aggregate.categoryLabel.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-eos-md border border-eos-border">
            <table className="w-full text-[12.5px]">
              <thead>
                <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10.5px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                  <th className="px-3 py-2">Încălcare</th>
                  <th className="px-3 py-2 text-right">Nr.</th>
                  <th className="px-3 py-2 text-right">Min RON</th>
                  <th className="px-3 py-2 text-right">Max RON</th>
                  <th className="px-3 py-2">Bază legală</th>
                </tr>
              </thead>
              <tbody>
                {aggregate.estimates.map((est) => (
                  <tr key={est.violation} className="border-b border-eos-border/50 align-top">
                    <td className="px-3 py-2 text-eos-text">{est.violationLabel}</td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text-muted">
                      {est.count}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">
                      {fmtRON(est.totalMinRON)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-eos-text">
                      {fmtRON(est.totalMaxRON)}
                    </td>
                    <td className="px-3 py-2 text-[11px] text-eos-text-muted">
                      {est.legalReference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 rounded-eos-md border border-eos-border bg-eos-surface-elevated p-4">
            <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Recomandări de prevenție
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[12.5px] leading-[1.55] text-eos-text-muted">
              {aggregate.estimates.map((est) => (
                <li key={est.violation}>
                  <strong className="text-eos-text">{est.violationLabel}:</strong>{" "}
                  {est.recommendation}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/10 p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="mt-0.5 size-5 shrink-0 text-eos-primary" strokeWidth={2} />
              <div className="flex-1">
                <p className="text-[13px] text-eos-text">
                  <strong className="font-semibold">CompliScan</strong> monitorizează automat aceste
                  încălcări lunar, generează findings preventive și avertizează ÎNAINTE ca ANAF să
                  trimită notificare. Pentru contabili cu portofoliu de clienți: portofoliu agregat.
                </p>
                <a
                  href="/register?utm_source=fines_calculator&utm_medium=cta"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-eos-sm bg-eos-primary px-4 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-white hover:bg-eos-primary/90"
                >
                  Cont gratuit CompliScan
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasViolations && (
        <div className="rounded-eos-md border border-dashed border-eos-border bg-eos-surface-variant p-6 text-center">
          <p className="text-[13px] text-eos-text-muted">
            Introdu numărul estimat de încălcări pentru a vedea expunerea ta totală în RON și EUR.
          </p>
        </div>
      )}
    </section>
  )
}
