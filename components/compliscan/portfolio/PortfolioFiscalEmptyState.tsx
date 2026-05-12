"use client"

// PortfolioFiscalEmptyState — empty state pentru cabinet-fiscal când portofoliul
// e gol (0 clienți). Înlocuiește butonul singular "Adaugă primul client" cu 3
// căi vizibile inline (per workflow Mircea validat cu fondatorul):
//
//   1. 🏛 ANAF SPV — 1 OAuth → pull mesaje pentru toate CUI împuternicite
//   2. 📊 ERP — SmartBill / Oblio / SAGA (per cont/client, optional)
//   3. 📄 CSV — Excel propriu cabinet → drag-drop bulk (1-50 rânduri)
//
// Manual "1 CUI" e redundant cu CSV (omul scoate 1 rând din Excel și-l urcă).
// `/dashboard/scan` e pentru scanare site/documente own-org, NU pentru import
// clienți cabinet.
//
// Mircea poate combina căile (ex: ANAF SPV + restul completate din CSV).
// Nu blocăm — dacă vrea să exploreze fără date, butonul "demo data" îi
// populează 5 clienți fictivi.
//
// Faza 1.2 din fiscal-module-final-sprint-2026-05-12.md.
// Updated 2026-05-12: dropped manual 1-CUI path (redundant cu CSV).

import { useState } from "react"
import {
  ExternalLink,
  FileSpreadsheet,
  Landmark,
  Loader2,
  PlugZap,
  Sparkles,
  Upload,
} from "lucide-react"
import { toast } from "sonner"

type ImportPath = "anaf-spv" | "erp" | "csv" | "demo"

type PortfolioFiscalEmptyStateProps = {
  /** Trigger pentru deschiderea modalei CSV import (existing flow ImportWizard). */
  onOpenCsvImport: () => void
  /** True dacă plan-ul curent nu mai permite adăugare clienți (limit hit). */
  importDisabled?: boolean
  /** Mesaj custom dacă import e disabled (de ex. "Upgrade pentru a adăuga"). */
  importDisabledReason?: string
}

export function PortfolioFiscalEmptyState({
  onOpenCsvImport,
  importDisabled = false,
  importDisabledReason,
}: PortfolioFiscalEmptyStateProps) {
  const [busyPath, setBusyPath] = useState<ImportPath | null>(null)

  async function handleAnafSpvConnect() {
    if (importDisabled) {
      toast.warning(importDisabledReason ?? "Limita planului curent atinsă.")
      return
    }
    setBusyPath("anaf-spv")
    try {
      // Redirect către OAuth ANAF (existing endpoint). Returnează aici cu
      // ?anaf=connected după autorizare, apoi auto-trigger list împuterniciri
      // (vezi Faza 2).
      window.location.href = `/api/anaf/connect?returnTo=${encodeURIComponent("/portfolio?anaf=connected")}`
    } catch {
      toast.error("Nu am putut porni conectarea ANAF. Încearcă din nou.")
      setBusyPath(null)
    }
  }

  async function handleDemoData() {
    if (importDisabled) {
      toast.warning(importDisabledReason ?? "Limita planului curent atinsă.")
      return
    }
    setBusyPath("demo")
    try {
      // Endpoint demo-seed existent — populează 5 clienți fictivi cabinet-fiscal
      // cu findings + cron primă rulare.
      const res = await fetch("/api/demo/imm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ icpSegment: "cabinet-fiscal", clientCount: 5 }),
      })
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        throw new Error(data.error || "Eroare la încărcare date demo.")
      }
      toast.success("Date demo populate. Reîncarc portofoliul…")
      window.location.reload()
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Eroare la date demo."
      toast.error(msg)
    } finally {
      setBusyPath(null)
    }
  }

  return (
    <div className="flex flex-col items-center gap-5 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-eos-xl border border-eos-border bg-eos-surface-active">
        <Sparkles className="size-5 text-eos-primary" strokeWidth={1.5} />
      </div>

      <div className="max-w-xl space-y-1.5">
        <p className="text-base font-semibold text-eos-text">
          Portofoliul tău fiscal e gol — alege cum aduci primii clienți
        </p>
        <p className="text-sm leading-6 text-eos-text-tertiary">
          Combină căile cum vrei. ANAF SPV îți trage mesajele cross-client cu un singur OAuth;
          CSV-ul aduce lista din Excel-ul cabinetului; ERP-ul aduce facturile emise.
        </p>
      </div>

      {/* 3 import paths grid — Manual 1-CUI redundant cu CSV (1-50 rânduri) */}
      <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-2">
        {/* Path 1: ANAF SPV OAuth (recomandat — full-width pe mobile, primul rând) */}
        <button
          type="button"
          onClick={handleAnafSpvConnect}
          disabled={busyPath !== null || importDisabled}
          className="group relative flex flex-col items-start gap-2 overflow-hidden rounded-eos-lg border border-eos-warning/30 bg-eos-warning/[0.05] p-4 text-left transition hover:border-eos-warning hover:bg-eos-warning/[0.08] disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          <span className="absolute right-3 top-3 rounded-full bg-eos-warning/20 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
            Recomandat
          </span>
          <Landmark className="size-5 text-eos-warning" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">🏛 Conectează ANAF SPV</p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            1 OAuth la nivel cabinet → trag automat mesajele tuturor clienților unde ai
            împuternicire activă. Detectăm respingeri, e-TVA gaps, cert expirare.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-eos-warning">
            {busyPath === "anaf-spv" ? (
              <>
                <Loader2 className="size-3 animate-spin" strokeWidth={2} />
                Redirect către anaf.ro…
              </>
            ) : (
              <>
                Autorizează OAuth
                <ExternalLink className="size-3" strokeWidth={2} />
              </>
            )}
          </span>
        </button>

        {/* Path 2: ERP integration */}
        <a
          href="/dashboard/fiscal/integrari"
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition hover:border-eos-primary hover:bg-eos-primary/[0.04] aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
          aria-disabled={busyPath !== null || importDisabled}
          onClick={(e) => {
            if (importDisabled) {
              e.preventDefault()
              toast.warning(importDisabledReason ?? "Limita planului curent atinsă.")
            }
          }}
        >
          <PlugZap className="size-5 text-eos-primary" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">📊 Conectează ERP-ul tău</p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            SmartBill / Oblio / SAGA — per cont/client. Tragem facturile emise + lista
            clienților. NU înlocuim ERP-ul tău, doar validăm și reconciliem.
          </p>
          <span className="mt-1 text-[11.5px] font-medium text-eos-primary">
            Vezi opțiuni →
          </span>
        </a>

        {/* Path 3: CSV upload (handles 1 sau 50 rânduri — manual single-CUI redundant) */}
        <button
          type="button"
          onClick={() => {
            if (importDisabled) {
              toast.warning(importDisabledReason ?? "Limita planului curent atinsă.")
              return
            }
            onOpenCsvImport()
          }}
          disabled={busyPath !== null || importDisabled}
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-border bg-eos-surface p-4 text-left transition hover:border-eos-primary hover:bg-eos-primary/[0.04] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileSpreadsheet className="size-5 text-eos-text-muted" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">📄 Upload Excel / CSV</p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            Drag-drop Excel-ul cabinetului — chiar și cu 1 singur rând. Format auto-detectat:
            <code className="ml-1 font-mono text-[11px] text-eos-text-muted">
              orgName, cui, sector, employeeCount, email
            </code>
            . Auto-fill ANAF API public per CUI.
          </p>
          <span className="mt-1 text-[11.5px] font-medium text-eos-text-muted">
            Upload 1-50 firme →
          </span>
        </button>
      </div>

      {/* Demo data escape hatch */}
      <button
        type="button"
        onClick={() => void handleDemoData()}
        disabled={busyPath !== null || importDisabled}
        className="flex items-center gap-1.5 text-[11.5px] font-medium text-eos-text-tertiary transition hover:text-eos-text-muted disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyPath === "demo" ? (
          <Loader2 className="size-3 animate-spin" strokeWidth={2} />
        ) : (
          <Upload className="size-3" strokeWidth={2} />
        )}
        Sau încearcă cu 5 clienți demo (date fictive — poți reseta oricând)
      </button>
    </div>
  )
}
