"use client"

// PatternHExternalContact — Pattern H pentru EMPUTERNICIRE-MISSING.
// Mircea generează template PDF împuternicire pre-completat pentru clientul
// fără împuternicire ANAF activă + link înregistrare online + mark trimis.
//
// Faza 3.4 din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import { CheckCircle2, Download, ExternalLink, Loader2, Mail } from "lucide-react"
import { toast } from "sonner"

import type { ScanFinding } from "@/lib/compliance/types"

type PatternHProps = {
  finding: ScanFinding
  onResolved: () => void
}

export function PatternHExternalContact({ finding, onResolved }: PatternHProps) {
  const [downloading, setDownloading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleDownloadTemplate() {
    setDownloading(true)
    try {
      // Endpoint generează PDF împuternicire pre-completat cu CUI cabinet + CUI client
      const res = await fetch(
        `/api/findings/${encodeURIComponent(finding.id)}/imputernicire-pdf`,
        { method: "POST" },
      )
      if (!res.ok) throw new Error("Nu am putut genera template PDF.")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `imputernicire-${finding.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Template PDF descărcat. Trimite-l clientului spre semnare.")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setDownloading(false)
    }
  }

  async function handleMarkSent() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(finding.id)}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evidence: {
            type: "external-contact",
            action: "imputernicire-template-sent",
            note: "Mircea a trimis template PDF clientului. Va re-proba ANAF SPV după înregistrare offline.",
          },
        }),
      })
      if (!res.ok) throw new Error("Nu am putut marca rezolvat.")
      toast.success(
        "Marcat trimis. Reverifică ANAF SPV după 1-5 zile lucrătoare ANAF.",
      )
      onResolved()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning/[0.05] p-3">
        <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
          <Mail className="size-3.5" strokeWidth={1.5} />
          Împuternicire ANAF lipsă — acțiune ofline necesară
        </p>
        <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
          Pentru a putea trage mesajele SPV ale acestui client, ai nevoie de o
          împuternicire activă înregistrată la ANAF. Acest pas e ofline (1-5
          zile lucrătoare ANAF). Generăm template PDF pre-completat ca să-l
          trimiți clientului spre semnare.
        </p>
      </div>

      <ol className="space-y-3">
        <li className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface p-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-eos-primary/30 bg-eos-primary/[0.06] font-mono text-[11px] font-semibold text-eos-primary">
            1
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[12.5px] font-semibold text-eos-text">
              Descarcă template PDF împuternicire
            </p>
            <p className="text-[11px] leading-[1.5] text-eos-text-muted">
              PDF pre-completat cu CUI cabinet + CUI client + datele standard
              necesare ANAF. Semnătura clientului se adaugă ulterior.
            </p>
            <button
              type="button"
              onClick={() => void handleDownloadTemplate()}
              disabled={downloading}
              className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 text-[11.5px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text disabled:cursor-not-allowed disabled:opacity-50"
            >
              {downloading ? (
                <Loader2 className="size-3 animate-spin" strokeWidth={2} />
              ) : (
                <Download className="size-3" strokeWidth={2} />
              )}
              Descarcă PDF
            </button>
          </div>
        </li>

        <li className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface p-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-eos-primary/30 bg-eos-primary/[0.06] font-mono text-[11px] font-semibold text-eos-primary">
            2
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[12.5px] font-semibold text-eos-text">
              Trimite clientului spre semnare
            </p>
            <p className="text-[11px] leading-[1.5] text-eos-text-muted">
              Email sau WhatsApp PDF-ul către client. Clientul semnează + îți
              returnează PDF semnat (sau prin notar dacă cere ANAF formal).
            </p>
          </div>
        </li>

        <li className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface p-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-eos-primary/30 bg-eos-primary/[0.06] font-mono text-[11px] font-semibold text-eos-primary">
            3
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-[12.5px] font-semibold text-eos-text">
              Înregistrează împuternicirea la ANAF
            </p>
            <p className="text-[11px] leading-[1.5] text-eos-text-muted">
              Depune PDF semnat prin SPV (Mesaj nou → împuternicire) sau la
              ghișeu ANAF. Procesare oficială 1-5 zile lucrătoare.
            </p>
            <a
              href="https://www.anaf.ro/anaf/internet/ANAF/servicii_online/inreg_imputerniciri"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface px-2.5 py-1 text-[11.5px] font-medium text-eos-text-muted transition hover:border-eos-border-strong hover:text-eos-text"
            >
              Vezi formular ANAF online
              <ExternalLink className="size-3" strokeWidth={2} />
            </a>
          </div>
        </li>
      </ol>

      <div className="border-t border-eos-border-subtle pt-4">
        <button
          type="button"
          onClick={() => void handleMarkSent()}
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
              Am trimis template clientului — marchez pas 1 complet
            </>
          )}
        </button>
        <p className="mt-2 text-[11px] text-eos-text-tertiary">
          Reverifică ANAF SPV după 1-5 zile lucrătoare (cron-ul va re-proba
          automat). Finding se redeschide dacă tot lipsește.
        </p>
      </div>
    </div>
  )
}
