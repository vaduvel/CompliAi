"use client"

// F#10 — Cross-border e-Factura Advisor UI Card.
// Mircea fix (2026-05-11): featurea era lib-only, invizibilă pentru user.
// Cabinet contabil cu clienți care vând în UE (intracom) sau extra-UE (export)
// întreba: "trebuie să trimit factura asta la SPV sau nu?"

import { useMemo, useState } from "react"
import { AlertTriangle, Check, Globe2, ListChecks } from "lucide-react"

import { Button } from "@/components/evidence-os/Button"
import {
  evaluateCrossBorderAdvisor,
  type CrossBorderAdvisor,
  type CrossBorderAdvisorInput,
} from "@/lib/compliance/efactura-cross-border-guidance"

const EU_COUNTRIES: { code: string; name: string }[] = [
  { code: "RO", name: "România" },
  { code: "DE", name: "Germania" },
  { code: "FR", name: "Franța" },
  { code: "IT", name: "Italia" },
  { code: "ES", name: "Spania" },
  { code: "NL", name: "Olanda" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgia" },
  { code: "HU", name: "Ungaria" },
  { code: "BG", name: "Bulgaria" },
  { code: "PL", name: "Polonia" },
  { code: "CZ", name: "Cehia" },
  { code: "SK", name: "Slovacia" },
  { code: "GR", name: "Grecia" },
  { code: "IE", name: "Irlanda" },
  { code: "PT", name: "Portugalia" },
  { code: "SE", name: "Suedia" },
  { code: "FI", name: "Finlanda" },
  { code: "DK", name: "Danemarca" },
]

const EXTRA_EU: { code: string; name: string }[] = [
  { code: "GB", name: "Regatul Unit (post-Brexit)" },
  { code: "US", name: "SUA" },
  { code: "CH", name: "Elveția" },
  { code: "MD", name: "Republica Moldova" },
  { code: "TR", name: "Turcia" },
  { code: "UA", name: "Ucraina" },
]

const ALL_COUNTRIES = [...EU_COUNTRIES, ...EXTRA_EU]

export function CrossBorderAdvisorCard() {
  const [supplierCountry, setSupplierCountry] = useState("RO")
  const [supplierVatRegistered, setSupplierVatRegistered] = useState(true)
  const [customerCountry, setCustomerCountry] = useState("DE")
  const [customerType, setCustomerType] = useState<"b2b" | "b2c">("b2b")
  const [customerHasEuVat, setCustomerHasEuVat] = useState(true)
  const [transactionKind, setTransactionKind] = useState<"goods" | "services">("goods")
  const [amountRON, setAmountRON] = useState("")
  const [isHighRisk, setIsHighRisk] = useState(false)

  const advisor: CrossBorderAdvisor = useMemo(() => {
    const input: CrossBorderAdvisorInput = {
      supplierCountry,
      supplierVatRegistered,
      customerCountry,
      customerType,
      customerHasEuVat,
      transactionKind,
      amountRON: amountRON ? Number(amountRON) : undefined,
      isHighRiskGoods: isHighRisk,
    }
    return evaluateCrossBorderAdvisor(input)
  }, [
    supplierCountry,
    supplierVatRegistered,
    customerCountry,
    customerType,
    customerHasEuVat,
    transactionKind,
    amountRON,
    isHighRisk,
  ])

  const verdict = advisor.verdict
  const verdictTone =
    verdict.efacturaObligation === "obligation"
      ? "border-eos-error/40 bg-eos-error-soft text-eos-error"
      : verdict.efacturaObligation === "exempt"
        ? "border-eos-success/40 bg-eos-success-soft text-eos-success"
        : verdict.efacturaObligation === "optional"
          ? "border-eos-warning/40 bg-eos-warning-soft text-eos-warning"
          : "border-eos-border bg-eos-surface-elevated text-eos-text"

  const verdictLabel: Record<typeof verdict["efacturaObligation"], string> = {
    obligation: "Obligatorie",
    optional: "Opțională (recomandată)",
    exempt: "Scutire (nu se aplică)",
    investigate: "Verificare manuală",
  }

  return (
    <div className="space-y-4">
      <section className="rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.06] px-4 py-3 text-[12px] leading-[1.5] text-eos-text">
        <p className="flex items-start gap-2">
          <Globe2 className="mt-0.5 size-3.5 shrink-0 text-eos-primary" strokeWidth={2} />
          <span>
            <strong>Cross-border e-Factura advisor:</strong> alege țara furnizor/client și
            tipul tranzacției (B2B/B2C, bunuri/servicii). Sistemul aplică OUG 120/2021 + OUG
            89/2025 + Cod Fiscal Art. 319-329 și îți spune dacă trebuie să transmiți factura
            prin SPV, dacă e opțională sau dacă e scutită.
          </span>
        </p>
      </section>

      <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
        <p
          data-display-text="true"
          className="mb-3 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Detalii tranzacție
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Țara furnizorului">
            <select
              value={supplierCountry}
              onChange={(e) => setSupplierCountry(e.target.value)}
              className={selectClass}
            >
              {ALL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Țara clientului">
            <select
              value={customerCountry}
              onChange={(e) => setCustomerCountry(e.target.value)}
              className={selectClass}
            >
              {ALL_COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Tip client">
            <div className="flex gap-2">
              <ToggleBtn active={customerType === "b2b"} onClick={() => setCustomerType("b2b")}>
                B2B (firmă)
              </ToggleBtn>
              <ToggleBtn active={customerType === "b2c"} onClick={() => setCustomerType("b2c")}>
                B2C (persoană)
              </ToggleBtn>
            </div>
          </Field>

          <Field label="Tip tranzacție">
            <div className="flex gap-2">
              <ToggleBtn
                active={transactionKind === "goods"}
                onClick={() => setTransactionKind("goods")}
              >
                Bunuri
              </ToggleBtn>
              <ToggleBtn
                active={transactionKind === "services"}
                onClick={() => setTransactionKind("services")}
              >
                Servicii
              </ToggleBtn>
            </div>
          </Field>

          <Field label="Furnizorul e plătitor TVA?">
            <Switch checked={supplierVatRegistered} onChange={setSupplierVatRegistered} />
          </Field>

          {customerType === "b2b" && (
            <Field label="Clientul are VAT-ID UE valid?">
              <Switch checked={customerHasEuVat} onChange={setCustomerHasEuVat} />
            </Field>
          )}

          <Field label="Sumă RON (opțional, pentru praguri)">
            <input
              type="number"
              value={amountRON}
              onChange={(e) => setAmountRON(e.target.value)}
              placeholder="ex. 50000"
              className={inputClass}
            />
          </Field>

          {transactionKind === "goods" && (
            <Field label="Bunuri high-risk (alcool, tutun, energie)?">
              <Switch checked={isHighRisk} onChange={setIsHighRisk} />
            </Field>
          )}
        </div>
      </section>

      <section className={`rounded-eos-lg border p-4 ${verdictTone}`}>
        <p
          data-display-text="true"
          className="mb-2 font-display text-[16px] font-semibold tracking-[-0.015em]"
        >
          e-Factura SPV: {verdictLabel[verdict.efacturaObligation]}
        </p>
        <p className="text-[12.5px] leading-[1.55]">{verdict.reasoning}</p>
        <p className="mt-2 text-[11px] text-eos-text-muted">
          <strong>Bază legală:</strong> {verdict.legalReference}
        </p>
        <p className="mt-2 rounded-eos-sm border border-eos-border-subtle bg-eos-surface/30 px-3 py-2 text-[12px] text-eos-text">
          <strong>Acțiune recomandată:</strong> {verdict.recommendedAction}
        </p>
      </section>

      {(verdict.warnings ?? []).length > 0 && (
        <section className="rounded-eos-lg border border-eos-warning/30 bg-eos-warning-soft p-4 text-[12px] text-eos-text">
          <p className="mb-2 flex items-center gap-2 font-semibold text-eos-warning">
            <AlertTriangle className="size-3.5" strokeWidth={2} />
            Atenție
          </p>
          <ul className="space-y-1 pl-5">
            {(verdict.warnings ?? []).map((w, i) => (
              <li key={i} className="list-disc">{w}</li>
            ))}
          </ul>
        </section>
      )}

      {(advisor.documentationChecklist ?? []).length > 0 && (
        <section className="rounded-eos-lg border border-eos-border bg-eos-surface p-4">
          <p
            data-display-text="true"
            className="mb-3 flex items-center gap-2 font-display text-[13px] font-semibold tracking-[-0.015em] text-eos-text"
          >
            <ListChecks className="size-4 text-eos-primary" strokeWidth={2} />
            Documentație necesară
          </p>
          <ul className="space-y-2">
            {(advisor.documentationChecklist ?? []).map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-eos-text">
                <Check className="mt-0.5 size-3 shrink-0 text-eos-success" strokeWidth={2.5} />
                <span>{item.item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {(advisor.externalChecks ?? []).length > 0 && (
        <section className="rounded-eos-lg border border-eos-border-subtle bg-eos-surface-elevated p-4">
          <p className="mb-2 text-[11px] font-mono uppercase tracking-[0.12em] text-eos-text-tertiary">
            Verificări externe
          </p>
          <div className="flex flex-wrap gap-2">
            {(advisor.externalChecks ?? []).map((c, i) => (
              <a
                key={i}
                href={c.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 font-mono text-[10.5px] text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
              >
                {c.label} ↗
              </a>
            ))}
          </div>
        </section>
      )}

      {advisor.oug89Note && (
        <section className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.05] p-3 text-[11.5px] text-eos-text">
          <p className="flex items-start gap-2">
            <Globe2 className="mt-0.5 size-3 shrink-0 text-eos-primary" strokeWidth={2} />
            <span>{advisor.oug89Note}</span>
          </p>
        </section>
      )}
    </div>
  )
}

const inputClass =
  "h-9 w-full rounded-eos-sm border border-eos-border bg-eos-surface-elevated px-3 text-[12.5px] text-eos-text outline-none focus:border-eos-border-strong"
const selectClass = inputClass

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block font-mono text-[10px] uppercase tracking-[0.12em] text-eos-text-tertiary">
        {label}
      </label>
      {children}
    </div>
  )
}

function ToggleBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-eos-sm border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
        active
          ? "border-eos-primary bg-eos-primary text-white"
          : "border-eos-border bg-eos-surface text-eos-text-muted hover:border-eos-border-strong hover:text-eos-text"
      }`}
    >
      {children}
    </button>
  )
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? "bg-eos-primary" : "bg-eos-surface-elevated border border-eos-border"
      }`}
    >
      <span
        className={`inline-block size-5 transform rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  )
}

// Suppress unused import warning
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _btn = Button
