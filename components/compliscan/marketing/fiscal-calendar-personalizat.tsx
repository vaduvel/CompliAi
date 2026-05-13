"use client"

// Lead magnet public — generator calendar fiscal personalizat fără cont.
// User completează 4 întrebări simple → vede 10 termene aplicabile firmei.
// CTA "Salvează permanent + email reminder zilnic" → register.

import { useState } from "react"
import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Loader2,
  Sparkles,
  Wand2,
} from "lucide-react"

type LegalForm = "SRL" | "SA" | "PFA" | "II" | "IF" | "ONG"
type EmployeeCount = "1-9" | "10-49" | "50-249" | "250+"

type CalendarRecord = {
  id: string
  type: string
  period: string
  dueISO: string
  status: string
  ruleCode: string
  legalReference: string
}

type ApplicableRule = {
  code: string
  shortName: string
  category: string
  legalReference: string
  description: string
  frequency: string
}

type Response = {
  ok: boolean
  applicableRules: ApplicableRule[]
  records: CalendarRecord[]
  situationalRules: Array<{
    code: string
    shortName: string
    description: string
  }>
  summary: {
    totalRules: number
    applicableRules: number
    recordsShown: number
    recordsTotal: number
    monthsAhead: number
  }
}

const FILING_TYPE_LABELS: Record<string, string> = {
  d300_tva: "D300 — Decont TVA",
  d394_local: "D394 — Achiziții/livrări",
  d390_recap: "D390 — Recapitulativă UE",
  saft: "D406 — SAF-T",
  efactura_monthly: "Raport e-Factura B2C",
  etva_precompletata: "e-TVA precompletată",
}

export function FiscalCalendarPersonalizat() {
  const [legalForm, setLegalForm] = useState<LegalForm>("SRL")
  const [employeeCount, setEmployeeCount] = useState<EmployeeCount>("1-9")
  const [vatRegistered, setVatRegistered] = useState(true)
  const [hasEmployees, setHasEmployees] = useState(false)
  const [hasIntraCommunityTransactions, setHasIntraCommunityTransactions] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Response | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/public/fiscal-calendar-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          legalForm,
          employeeCount,
          vatRegistered,
          hasEmployees,
          hasIntraCommunityTransactions,
          isMicroenterprise: employeeCount === "1-9" || employeeCount === "10-49",
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body.error ?? "Nu am putut genera calendarul.")
        return
      }
      setResult((await res.json()) as Response)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="space-y-6">
      {/* Form */}
      <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-6">
        <div className="flex items-center gap-2">
          <Wand2 className="size-4 text-eos-primary" strokeWidth={2} />
          <p
            data-display-text="true"
            className="font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            4 întrebări → calendarul tău fiscal personalizat
          </p>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {/* Tip juridic */}
          <div>
            <label className="block font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Tip persoană juridică
            </label>
            <div className="mt-2 grid grid-cols-3 gap-1.5">
              {(["SRL", "SA", "PFA", "II", "IF", "ONG"] as LegalForm[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setLegalForm(opt)}
                  className={`rounded-eos-sm border px-2.5 py-1.5 text-[12px] font-medium transition ${
                    legalForm === opt
                      ? "border-eos-primary bg-eos-primary text-white"
                      : "border-eos-border bg-eos-surface text-eos-text hover:border-eos-border-strong"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Mărime firmă */}
          <div>
            <label className="block font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
              Număr angajați
            </label>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              {(["1-9", "10-49", "50-249", "250+"] as EmployeeCount[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setEmployeeCount(opt)}
                  className={`rounded-eos-sm border px-2.5 py-1.5 text-[12px] font-medium transition ${
                    employeeCount === opt
                      ? "border-eos-primary bg-eos-primary text-white"
                      : "border-eos-border bg-eos-surface text-eos-text hover:border-eos-border-strong"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Checkboxes */}
          <div className="md:col-span-2 space-y-2">
            <CheckRow
              label="Plătitor TVA"
              checked={vatRegistered}
              onChange={setVatRegistered}
            />
            <CheckRow
              label="Are angajați"
              checked={hasEmployees}
              onChange={setHasEmployees}
            />
            <CheckRow
              label="Tranzacții intracomunitare UE"
              checked={hasIntraCommunityTransactions}
              onChange={setHasIntraCommunityTransactions}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-eos-md border border-eos-primary bg-eos-primary px-4 py-3 text-[13.5px] font-semibold text-white shadow-eos-sm transition hover:bg-eos-primary/90 disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={2.5} />
          ) : (
            <Sparkles className="size-4" strokeWidth={2.5} />
          )}
          {loading ? "Generez calendarul…" : "Vezi calendarul meu fiscal"}
        </button>

        {error && (
          <div className="mt-3 rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
            {error}
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="space-y-4">
          <div className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary-soft/40 p-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-eos-primary" strokeWidth={2} />
              <div>
                <p
                  data-display-text="true"
                  className="font-display text-[15px] font-semibold tracking-[-0.015em] text-eos-text"
                >
                  Calendarul tău: <strong>{result.summary.applicableRules}</strong>{" "}
                  declarații ANAF aplicabile
                </p>
                <p className="mt-1 text-[12.5px] leading-[1.55] text-eos-text-muted">
                  Din <strong>{result.summary.totalRules} reguli</strong> ANAF, doar{" "}
                  {result.summary.applicableRules} te privesc pe tine. Restul nu se
                  aplică firmei tale. Mai jos vezi primele{" "}
                  {result.summary.recordsShown} termene viitoare pe 3 luni.
                </p>
              </div>
            </div>
          </div>

          {/* Applicable rules summary */}
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Declarații aplicabile firmei tale
            </p>
            <ul className="mt-3 space-y-1.5">
              {result.applicableRules.map((rule) => (
                <li
                  key={rule.code}
                  className="flex items-start gap-2 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[12.5px]"
                >
                  <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-eos-success" strokeWidth={2.5} />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-eos-text">
                      {rule.shortName}{" "}
                      <span className="ml-1 font-mono text-[10.5px] font-normal text-eos-text-muted">
                        ({rule.frequency})
                      </span>
                    </p>
                    <p className="mt-0.5 text-[11px] leading-[1.5] text-eos-text-muted">
                      {rule.description}{" "}
                      <span className="italic text-eos-text-tertiary">
                        {rule.legalReference}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Upcoming records preview */}
          <div className="rounded-eos-lg border border-eos-border bg-eos-surface p-5">
            <p
              data-display-text="true"
              className="font-display text-[13.5px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Primele 10 termene viitoare
            </p>
            <ul className="mt-3 divide-y divide-eos-border">
              {result.records.map((record) => {
                const due = new Date(record.dueISO)
                const daysUntil = Math.floor(
                  (due.getTime() - Date.now()) / 86_400_000,
                )
                const isUrgent = daysUntil <= 7
                return (
                  <li
                    key={record.id}
                    className="flex items-center justify-between gap-3 py-2.5 text-[12.5px]"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-eos-text">
                        {FILING_TYPE_LABELS[record.type] ?? record.type}
                      </p>
                      <p className="mt-0.5 text-[11px] text-eos-text-muted">
                        Perioada {record.period} · Termen{" "}
                        {due.toLocaleDateString("ro-RO", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-eos-sm border px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] ${
                        isUrgent
                          ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
                          : "border-eos-border bg-eos-surface-elevated text-eos-text-muted"
                      }`}
                    >
                      {daysUntil} zile
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* CTA */}
          <div className="rounded-eos-lg border border-eos-primary bg-gradient-to-br from-eos-primary to-eos-primary/80 p-6 text-white shadow-eos-md">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-1 size-6 shrink-0" strokeWidth={2} />
              <div className="flex-1">
                <p
                  data-display-text="true"
                  className="font-display text-[17px] font-semibold tracking-[-0.015em]"
                >
                  Vrei calendarul complet pe 12 luni + reminder zilnic prin email?
                </p>
                <ul className="mt-3 space-y-1.5 text-[12.5px] opacity-95">
                  <li>✓ Toate termenele pe 12 luni înainte (nu doar 3 luni)</li>
                  <li>✓ Email reminder la 7 / 3 / 1 zi înainte de fiecare termen</li>
                  <li>✓ Status flip automat din SmartBill / Saga / SPV ANAF</li>
                  <li>✓ Confirmare automată după upload SAF-T</li>
                  <li>✓ Smart Pattern Engine — detectează probleme recurrente</li>
                </ul>
                <Link
                  href="/register?utm_source=calendar_fiscal&utm_medium=cta"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-eos-md border border-white/30 bg-white px-4 py-2 text-[13px] font-semibold text-eos-primary shadow hover:bg-white/95"
                >
                  Cont gratuit — am activat reminder-ul
                  <ArrowRight className="size-3.5" strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </div>

          {/* Situational rules note */}
          {result.situationalRules.length > 0 && (
            <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3 text-[11.5px] text-eos-text-muted">
              <AlertTriangle className="-mt-0.5 mr-1.5 inline size-3.5 text-eos-warning" strokeWidth={2} />
              <strong className="text-eos-text">
                {result.situationalRules.length} declarații situaționale
              </strong>{" "}
              se aplică doar la eveniment (înregistrare, modificare vector
              fiscal, încetare activitate) — le ținem minte și te avertizăm la
              moment.
            </div>
          )}
        </div>
      )}
    </section>
  )
}

function CheckRow({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (next: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 rounded-eos-md border border-eos-border bg-eos-surface-elevated px-3 py-2 text-[12.5px] hover:border-eos-border-strong">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 accent-eos-primary"
      />
      <span className="text-eos-text">{label}</span>
    </label>
  )
}
