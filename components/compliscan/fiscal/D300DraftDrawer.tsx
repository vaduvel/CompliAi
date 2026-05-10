"use client"

// Drawer pentru afișarea draft-ului D300/D394 generat din SAF-T XML.
// Trimitem la endpoint /api/fiscal/d300-draft, primim totaluri pe cote.

import { Loader2, X } from "lucide-react"

type D300Draft = {
  period: string
  collected: {
    standardRate: { taxableBase: number; vatAmount: number }
    reduced9: { taxableBase: number; vatAmount: number }
    reduced5: { taxableBase: number; vatAmount: number }
    zeroRate: { taxableBase: number; vatAmount: number }
    reverseCharge: { taxableBase: number; vatAmount: number }
    exempt: { taxableBase: number; vatAmount: number }
  }
  deductible: {
    standardRate: { taxableBase: number; vatAmount: number }
    reduced9: { taxableBase: number; vatAmount: number }
    reduced5: { taxableBase: number; vatAmount: number }
    intraCommunity: { taxableBase: number; vatAmount: number }
    reverseCharge: { taxableBase: number; vatAmount: number }
    nonDeductible: { taxableBase: number; vatAmount: number }
  }
  totalCollectedVat: number
  totalDeductibleVat: number
  vatToPay: number
  vatToReturn: number
  warnings: string[]
}

type D394Line = {
  partyTaxId: string
  partyName: string
  taxableBase: number
  vatAmount: number
  invoiceCount: number
  type: "achizitii" | "livrari"
}

type D394Draft = {
  achizitii: D394Line[]
  livrari: D394Line[]
  totalAchizitii: { taxableBase: number; vatAmount: number; partnerCount: number }
  totalLivrari: { taxableBase: number; vatAmount: number; partnerCount: number }
}

export type DraftResponse = {
  ok: boolean
  period: string
  transactionsExtracted: number
  d300?: D300Draft
  d394?: D394Draft
}

function fmtRON(n: number): string {
  return n.toLocaleString("ro-RO", { maximumFractionDigits: 2 })
}

export function D300DraftDrawer({
  result,
  onClose,
  busy,
}: {
  result: DraftResponse | null
  onClose: () => void
  busy: boolean
}) {
  if (!result && !busy) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="w-full max-w-2xl overflow-y-auto bg-eos-surface border-l border-eos-border p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              data-display-text="true"
              className="font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Draft D300 / D394 — {result?.period ?? "..."}
            </p>
            <p className="mt-1 text-[12px] text-eos-text-muted">
              Generat din SAF-T uploadat. Validare obligatorie de către contabil înainte de depunere.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-surface-variant hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        {busy && (
          <div className="mt-6 flex items-center gap-2 text-[12.5px] text-eos-text-muted">
            <Loader2 className="size-4 animate-spin" strokeWidth={2} /> Generez draft din SAF-T...
          </div>
        )}

        {result && result.d300 && (
          <div className="mt-6 space-y-5">
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-4">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                Tranzacții extrase din SAF-T
              </p>
              <p className="mt-1 font-display text-[26px] font-semibold text-eos-text">
                {result.transactionsExtracted}
              </p>
            </div>

            <section>
              <h3
                data-display-text="true"
                className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
              >
                D300 — TVA pe cote
              </h3>
              <table className="mt-2 w-full text-[12px]">
                <thead>
                  <tr className="border-b border-eos-border bg-eos-surface-elevated text-left text-[10px] font-mono uppercase tracking-[0.12em] text-eos-text-muted">
                    <th className="px-2 py-1.5">Cotă</th>
                    <th className="px-2 py-1.5 text-right">Bază (colectat)</th>
                    <th className="px-2 py-1.5 text-right">TVA col</th>
                    <th className="px-2 py-1.5 text-right">Bază (dedus)</th>
                    <th className="px-2 py-1.5 text-right">TVA ded</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["19% (standard)", result.d300.collected.standardRate, result.d300.deductible.standardRate],
                    ["9% (redusă)", result.d300.collected.reduced9, result.d300.deductible.reduced9],
                    ["5% (redusă)", result.d300.collected.reduced5, result.d300.deductible.reduced5],
                    ["0% (export/UE)", result.d300.collected.zeroRate, { taxableBase: 0, vatAmount: 0 }],
                    ["Taxare inversă", result.d300.collected.reverseCharge, result.d300.deductible.reverseCharge],
                    ["UE intracom", { taxableBase: 0, vatAmount: 0 }, result.d300.deductible.intraCommunity],
                  ].map(([label, c, d]) => {
                    const co = c as { taxableBase: number; vatAmount: number }
                    const de = d as { taxableBase: number; vatAmount: number }
                    return (
                      <tr key={label as string} className="border-b border-eos-border/50">
                        <td className="px-2 py-1.5 text-eos-text">{label as string}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-eos-text-muted">
                          {fmtRON(co.taxableBase)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-eos-text">
                          {fmtRON(co.vatAmount)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-eos-text-muted">
                          {fmtRON(de.taxableBase)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-mono text-eos-text">
                          {fmtRON(de.vatAmount)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <div
                  className={`rounded-eos-md border px-3 py-2 ${
                    result.d300.vatToPay > 0
                      ? "border-eos-warning/30 bg-eos-warning-soft text-eos-warning"
                      : "border-eos-border bg-eos-surface-elevated text-eos-text"
                  }`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em]">TVA de plată</p>
                  <p className="mt-0.5 font-display text-[20px] font-semibold">
                    {fmtRON(result.d300.vatToPay)} RON
                  </p>
                </div>
                <div
                  className={`rounded-eos-md border px-3 py-2 ${
                    result.d300.vatToReturn > 0
                      ? "border-eos-success/30 bg-eos-success-soft text-eos-success"
                      : "border-eos-border bg-eos-surface-elevated text-eos-text"
                  }`}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em]">De rambursat</p>
                  <p className="mt-0.5 font-display text-[20px] font-semibold">
                    {fmtRON(result.d300.vatToReturn)} RON
                  </p>
                </div>
              </div>

              {result.d300.warnings.length > 0 && (
                <ul className="mt-3 space-y-1">
                  {result.d300.warnings.map((w, i) => (
                    <li
                      key={i}
                      className="rounded-eos-sm border border-eos-warning/30 bg-eos-warning-soft px-2 py-1 text-[11.5px] text-eos-warning"
                    >
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {result.d394 && (
              <section>
                <h3
                  data-display-text="true"
                  className="font-display text-[14px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  D394 — Achiziții/livrări locale
                </h3>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">
                      Achiziții ({result.d394.totalAchizitii.partnerCount} parteneri)
                    </p>
                    <p className="mt-0.5 font-display text-[16px] font-semibold text-eos-text">
                      {fmtRON(result.d394.totalAchizitii.taxableBase)} RON
                    </p>
                    <p className="text-[11px] text-eos-text-muted">
                      TVA dedus: {fmtRON(result.d394.totalAchizitii.vatAmount)}
                    </p>
                  </div>
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-muted">
                      Livrări ({result.d394.totalLivrari.partnerCount} parteneri)
                    </p>
                    <p className="mt-0.5 font-display text-[16px] font-semibold text-eos-text">
                      {fmtRON(result.d394.totalLivrari.taxableBase)} RON
                    </p>
                    <p className="text-[11px] text-eos-text-muted">
                      TVA colectat: {fmtRON(result.d394.totalLivrari.vatAmount)}
                    </p>
                  </div>
                </div>
              </section>
            )}

            <p className="mt-4 rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12px] text-eos-text">
              <strong>Validare obligatorie CECCAR.</strong> Acest draft e doar punct de plecare —
              verifică TOATE valorile manual înainte să depui declarația. Decizia rămâne în
              responsabilitatea ta profesională.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
