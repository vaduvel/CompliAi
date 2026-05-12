"use client"

// PatternGUpload — Pattern G (upload-evidence) pentru finding-uri unde
// rezolvarea cere upload fișier (cert nou, SAF-T XML, dovadă manuală).
//
// Aplicabilitate:
//   • CERT-EXPIRING / CERT-EXPIRED — upload cert .p12/.pfx cu parolă
//   • CERT-AUTH-FAILED — upload cert nou + test ping ANAF
//   • SAFT-DEADLINE — upload SAF-T XML + validare hygiene
//   • EF-005 (alternativ) — upload XML factură + retransmit
//
// Faza 3.2 din fiscal-module-final-sprint-2026-05-12.md.

import { useMemo } from "react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"
import { UploadEvidenceBlock } from "@/components/compliscan/fiscal/resolve/UploadEvidenceBlock"

type PatternGProps = {
  finding: ScanFinding
  onResolved: () => void
}

type UploadConfig = {
  accept: string
  label: string
  hint: string
  endpoint: string
  extraFields?: {
    name: string
    label: string
    type?: "text" | "password"
    placeholder?: string
    required?: boolean
  }[]
}

function resolveUploadConfig(finding: ScanFinding): UploadConfig {
  const typeId = finding.findingTypeId ?? ""
  if (typeId === "CERT-EXPIRING" || typeId === "CERT-EXPIRED" || typeId === "CERT-AUTH-FAILED") {
    return {
      accept: ".p12,.pfx",
      label: "Drag-drop cert nou (.p12 sau .pfx)",
      hint: "Cert digital cabinet emis de certSIGN / TransFonD / DigiSign. După upload, activăm tokenul nou la ANAF și rulăm un test ping să confirmăm.",
      endpoint: `/api/fiscal/cert-spv?findingId=${encodeURIComponent(finding.id)}`,
      extraFields: [
        {
          name: "password",
          label: "Parola certificatului",
          type: "password",
          placeholder: "******",
          required: true,
        },
      ],
    }
  }
  if (typeId === "SAFT-DEADLINE" || finding.detail.toLowerCase().includes("saf-t")) {
    return {
      accept: ".xml",
      label: "Drag-drop SAF-T XML (D406)",
      hint: "Validăm structural XML-ul, calculăm scor hygiene și marcăm depunerea ca evidence.",
      endpoint: `/api/fiscal/d406-evidence?findingId=${encodeURIComponent(finding.id)}`,
    }
  }
  // Default — upload XML factură generic
  return {
    accept: ".xml",
    label: "Drag-drop XML factură reparat",
    hint: "Validăm contra regulilor CIUS-RO și retransmitem la ANAF SPV.",
    endpoint: `/api/efactura/validate?findingId=${encodeURIComponent(finding.id)}`,
  }
}

export function PatternGUpload({ finding, onResolved }: PatternGProps) {
  const config = useMemo(() => resolveUploadConfig(finding), [finding])

  async function handleUploaded(result: Record<string, unknown>) {
    // După upload + procesare, marchez finding-ul ca rezolvat cu evidence.
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: { type: "upload", source: config.endpoint, result },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut marca finding-ul ca rezolvat.")
      toast.success("Finding rezolvat. Dovadă salvată la dosar.")
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la salvare.")
    }
  }

  return (
    <div className="space-y-3">
      <div className="rounded-eos-md border border-eos-primary/20 bg-eos-primary/[0.04] p-3">
        <p className="text-[12.5px] leading-[1.55] text-eos-text-muted">
          <strong className="text-eos-text">Cum se rezolvă:</strong> încărci fișierul cerut,
          CompliScan îl procesează, validează și salvează ca dovadă la dosar. Finding-ul
          intră automat în „Rezolvat”.
        </p>
      </div>
      <UploadEvidenceBlock
        accept={config.accept}
        label={config.label}
        hint={config.hint}
        uploadEndpoint={config.endpoint}
        extraFields={config.extraFields}
        onUploaded={handleUploaded}
      />
    </div>
  )
}
