"use client"

// PatternFallback — folosit pentru findings fiscale unde nu avem încă pattern
// dedicat (Pattern B/C/D/E/F/G/H/I — vor fi implementate în Faze 3.2-3.5).
//
// Oferă acțiuni minimale:
//   • Deep-link la workflow-ul fiscal corespunzător (validare / transmitere /
//     tva-declaratii / integrari / deadline-urgent) bazat pe findingTypeId
//   • Buton "Marchez rezolvat manual" cu evidence upload (pentru flow extern)
//
// Faza 3.1 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import Link from "next/link"
import { CheckCircle2, ExternalLink, FileText, Upload } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternFallbackProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternFallback({ finding, onResolved }: PatternFallbackProps) {
  const [marking, setMarking] = useState(false)
  const deepLink = resolveDeepLink(finding)

  async function handleMarkResolved() {
    setMarking(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: { type: "manual-attest", note: "Rezolvat manual din cockpit" },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut marca rezolvat. Încearcă din nou.")
      toast.success("Finding marcat ca rezolvat (manual).")
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setMarking(false)
    }
  }

  return (
    <div className="space-y-3">
      {deepLink && (
        <Link
          href={deepLink.href}
          className="group flex items-start gap-3 rounded-eos-md border border-eos-primary/30 bg-eos-primary/[0.06] p-4 transition hover:border-eos-primary hover:bg-eos-primary/[0.08]"
        >
          <FileText className="mt-0.5 size-4 shrink-0 text-eos-primary" strokeWidth={1.5} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-eos-text">
              {deepLink.label}
            </p>
            <p className="mt-0.5 text-[11.5px] leading-[1.5] text-eos-text-muted">
              {deepLink.hint}
            </p>
          </div>
          <ExternalLink className="size-3.5 shrink-0 text-eos-text-muted" strokeWidth={2} />
        </Link>
      )}

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 px-4 py-3">
        <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
          Acest tip de finding ({finding.findingTypeId ?? "fără tip"}) folosește încă
          flow-ul generic. Pattern-ul dedicat (compare-decide / upload-evidence /
          generate-doc) va fi disponibil în Faza 3.2+.
          {finding.remediationHint && (
            <>
              <br />
              <strong className="text-eos-text">Sugestie:</strong> {finding.remediationHint}
            </>
          )}
        </p>
      </div>

      <button
        type="button"
        onClick={() => void handleMarkResolved()}
        disabled={marking}
        className="inline-flex items-center gap-2 rounded-eos-md border border-eos-border bg-eos-surface px-3.5 py-2 text-[12.5px] font-medium text-eos-text transition hover:border-eos-border-strong hover:bg-eos-surface-elevated disabled:cursor-not-allowed disabled:opacity-50"
      >
        {marking ? (
          <>
            <Upload className="size-3.5 animate-pulse" strokeWidth={2} />
            Marchez…
          </>
        ) : (
          <>
            <CheckCircle2 className="size-3.5" strokeWidth={2} />
            Marchez rezolvat manual
          </>
        )}
      </button>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function resolveDeepLink(finding: ScanFinding): { href: string; label: string; hint: string } | null {
  const typeId = finding.findingTypeId ?? ""
  const detailLower = `${finding.title} ${finding.detail}`.toLowerCase()

  // EF-001 / EF-005 — flow transmitere
  if (typeId === "EF-001" || typeId === "EF-005") {
    return {
      href: "/dashboard/fiscal/transmitere",
      label: "Deschide Transmitere & SPV",
      hint: "Workflow dedicat pentru autorizare SPV + retransmitere XML.",
    }
  }
  // EF-004 — în prelucrare, verifică status
  if (typeId === "EF-004") {
    return {
      href: "/dashboard/fiscal/transmitere?tab=status",
      label: "Verifică status SPV",
      hint: "Factura e în coada ANAF. Verifică statusul cu poll manual.",
    }
  }
  // ETVA / D300 — flow TVA
  if (
    detailLower.includes("etva") ||
    detailLower.includes("d300") ||
    detailLower.includes("p300") ||
    typeId.startsWith("ETVA")
  ) {
    return {
      href: "/dashboard/fiscal/tva-declaratii",
      label: "Deschide TVA & declarații",
      hint: "Compare D300 vs P300, draft răspuns ANAF, depunere rectificativă.",
    }
  }
  // Cert SPV expirare
  if (typeId === "CERT-EXPIRING" || typeId === "CERT-EXPIRED" || detailLower.includes("certificat")) {
    return {
      href: "/dashboard/fiscal/transmitere?tab=cert",
      label: "Manager certificate SPV",
      hint: "Upload cert nou + activare + test ping ANAF.",
    }
  }
  // SAF-T
  if (typeId.startsWith("SAFT") || detailLower.includes("saf-t") || detailLower.includes("d406")) {
    return {
      href: "/dashboard/fiscal/tva-declaratii?tab=saft",
      label: "SAF-T Hygiene & Upload",
      hint: "Validează XML SAF-T + score hygiene + upload depunere.",
    }
  }
  // PFA Form 082
  if (typeId === "PFA-FORM082" || detailLower.includes("form 082") || detailLower.includes("pfa")) {
    return {
      href: "/dashboard/fiscal/deadline-urgent?tab=pfa082",
      label: "PFA Form 082 generator",
      hint: "Generator + depunere + countdown deadline.",
    }
  }
  // Default — validare
  return {
    href: "/dashboard/fiscal/validare",
    label: "Deschide Validator XML",
    hint: "Manual: încarcă XML și validează contra regulilor ANAF.",
  }
}
