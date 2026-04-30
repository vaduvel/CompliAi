// LegalDisclaimer — Sprint 6.1
// Trei variante: short (footer dashboard), medium (documente), long (audit pack)

import { AlertCircle } from "lucide-react"

type DisclaimerVariant = "short" | "medium" | "long"

const TEXTS: Record<DisclaimerVariant, string> = {
  short:
    "CompliScan organizează dovezi și pregătește dosare. Nu constituie opinie juridică; validarea de specialitate rămâne în responsabilitatea cabinetului DPO sau a juristului.",
  medium:
    "Acest document a fost generat automat pe baza datelor introduse. Nu constituie opinie juridică și nu garantează conformitatea. Cazul este pregătit pentru validare de specialitate — documentele și red flags sunt deja organizate.",
  long:
    "Acest dosar a fost generat automat de CompliScan. Nu constituie opinie juridică și nu garantează conformitatea. CompliScan nu este certificat de DNSC, ANSPDCP sau altă autoritate de reglementare. Dosarul servește ca instrument de organizare a dovezilor — pregătit pentru review profesionist. Specialistul intervine doar pentru validare finală sau situații sensibile.",
}

export function LegalDisclaimer({ variant = "short" }: { variant?: DisclaimerVariant }) {
  if (variant === "short") {
    return (
      <p className="text-center text-[11px] leading-relaxed text-eos-text-muted">
        {TEXTS.short}
      </p>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-eos-md border border-eos-border-subtle bg-eos-bg-inset px-4 py-3">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
      <p className="text-xs leading-relaxed text-eos-text-muted">{TEXTS[variant]}</p>
    </div>
  )
}

// Text-only export for non-React contexts (PDF templates, Markdown)
export const LEGAL_DISCLAIMER_TEXT = TEXTS
