"use client"

// PatternBManualInput — Pattern B (manual-input) pentru finding-uri care
// cer valori introduse manual de utilizator (corecții line-item, mapare
// conturi, decizie A/B).
//
// Aplicabilitate:
//   • D300-LINE-ERROR — corecție valoare linie D300
//   • SAFT-ACCOUNTS-INVALID — mapare cont SAF-T la plan contabil RO
//
// Faza 3.2 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternBProps = {
  finding: ScanFinding
  onResolved: () => void
}

type InputFieldConfig = {
  name: string
  label: string
  type?: "text" | "number"
  placeholder?: string
  hint?: string
  required?: boolean
}

function resolveFieldsConfig(finding: ScanFinding): InputFieldConfig[] {
  const typeId = finding.findingTypeId ?? ""
  if (typeId === "D300-LINE-ERROR") {
    return [
      {
        name: "lineNumber",
        label: "Număr linie D300",
        type: "number",
        placeholder: "ex: 27",
        required: true,
      },
      {
        name: "correctedValue",
        label: "Valoare corectată (RON)",
        type: "number",
        placeholder: "ex: 12345.67",
        required: true,
      },
      {
        name: "justification",
        label: "Motivul corecției (audit log)",
        type: "text",
        placeholder: "ex: recalculare TVA aferent factură F2026-0445",
        hint: "Va fi salvat în audit log conform CECCAR Art. 14.",
      },
    ]
  }
  if (typeId === "SAFT-ACCOUNTS-INVALID") {
    return [
      {
        name: "accountCode",
        label: "Cont SAF-T (raw)",
        type: "text",
        placeholder: "ex: 401.01",
        required: true,
      },
      {
        name: "planContabilCode",
        label: "Cod Plan Contabil RO",
        type: "text",
        placeholder: "ex: 401",
        required: true,
        hint: "Mapare obligatorie la planul contabil RO standardizat.",
      },
    ]
  }
  // Fallback — câmp text liber pentru "note explicativă"
  return [
    {
      name: "note",
      label: "Notă explicativă",
      type: "text",
      placeholder: "Descrie scurt corectarea aplicată",
      required: true,
      hint: "Salvată în audit log + intrare la dosar.",
    },
  ]
}

export function PatternBManualInput({ finding, onResolved }: PatternBProps) {
  const fields = resolveFieldsConfig(finding)
  const [values, setValues] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    for (const f of fields) {
      if (f.required && !values[f.name]?.trim()) {
        setError(`Completează „${f.label}”.`)
        return
      }
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: {
            type: "manual-input",
            findingTypeId: finding.findingTypeId,
            fields: values,
          },
        }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Nu am putut salva intrările.")
      }
      toast.success("Intrări salvate + finding marcat rezolvat.")
      onResolved()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare."
      setError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-3">
        <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
          <strong className="text-eos-text">Cum se rezolvă:</strong> completezi valorile cerute
          de mai jos. CompliScan le salvează în audit log + adaugă o intrare la dosar pentru
          dovada corecției profesionale.
        </p>
      </div>
      {fields.map((f) => (
        <div key={f.name} className="space-y-1">
          <label className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            {f.label}
            {f.required && <span className="ml-1 text-eos-error">*</span>}
          </label>
          <input
            type={f.type ?? "text"}
            placeholder={f.placeholder}
            value={values[f.name] ?? ""}
            onChange={(e) => setValues((p) => ({ ...p, [f.name]: e.target.value }))}
            disabled={submitting}
            className="w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-1.5 text-[12.5px] text-eos-text outline-none focus:border-eos-primary disabled:opacity-50"
          />
          {f.hint && <p className="text-[10.5px] text-eos-text-tertiary">{f.hint}</p>}
        </div>
      ))}
      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={submitting}
        className="inline-flex items-center gap-2 rounded-eos-md bg-eos-primary px-4 py-2 text-[13px] font-semibold text-eos-primary-foreground shadow-sm transition hover:bg-eos-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" strokeWidth={2} />
            Salvez…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-4" strokeWidth={2} />
            Salvează + marchez rezolvat
          </>
        )}
      </button>
      {error && (
        <div className="rounded-eos-md border border-eos-error/30 bg-eos-error-soft px-3 py-2 text-[12px] text-eos-error">
          {error}
        </div>
      )}
    </div>
  )
}
