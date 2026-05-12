"use client"

// SetupImportStep — Pas 1 setup-fiscal: aducerea listei de clienți.
//
// 4 căi vizibile inline (oricare valid, oricare poate fi prima):
//   📄 Excel / CSV — drag-drop ImportWizard (1-50 rânduri), auto-fill ANAF
//   📊 Oblio — OAuth → API trage lista clienților Oblio
//   📊 SmartBill — OAuth → API trage lista clienților SmartBill
//   📊 SAGA — upload SAF-T XML local → parser scoate CUI-urile
//
// Manual single-CUI redundant cu CSV (utilizatorul scoate 1 rând Excel și
// urcă). NU mai apare ca path separat.
//
// Refs Faza 1.5a din fiscal-module-final-sprint-2026-05-12.md.

import { useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  FileSpreadsheet,
  PlugZap,
  Upload,
} from "lucide-react"

import { ImportWizard } from "@/components/compliscan/import-wizard"

export function SetupImportStep() {
  const [showCsvWizard, setShowCsvWizard] = useState(false)

  return (
    <div className="space-y-6">
      {showCsvWizard ? (
        <ImportWizard
          onClose={() => setShowCsvWizard(false)}
          // ImportWizard re-fresh-uiește server state automat la sfârșit
          // (Phase 3 baseline-scan). Page-ul setup-fiscal e SSR cu
          // dynamic="force-dynamic" — refresh URL face re-evaluation step.
          onSuccess={() => {
            setShowCsvWizard(false)
            // Hard refresh ca SSR să re-evalueze portfolio count → trecem la
            // step=anaf automat.
            window.location.reload()
          }}
        />
      ) : null}

      <header className="space-y-1.5">
        <h2
          data-display-text="true"
          className="font-display text-[18px] font-semibold tracking-[-0.015em] text-eos-text"
        >
          Pas 1 — Adu lista clienților
        </h2>
        <p className="text-[13.5px] leading-[1.6] text-eos-text-muted">
          Alege oricare cale (sau combină mai multe). Pentru fiecare CUI primit
          completăm automat denumirea oficială, statusul TVA și sectorul CAEN
          din ANAF API public (gratuit, fără autentificare).
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* CSV / Excel — full-width hero */}
        <button
          type="button"
          onClick={() => setShowCsvWizard(true)}
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-primary/30 bg-eos-primary/[0.05] p-4 text-left transition hover:border-eos-primary hover:bg-eos-primary/[0.08] sm:col-span-2"
        >
          <FileSpreadsheet className="size-5 text-eos-primary" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">
            📄 Upload Excel / CSV
          </p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            Drag-drop Excel-ul cabinetului — chiar și cu 1 singur rând. Format
            auto-detectat:{" "}
            <code className="font-mono text-[11px] text-eos-text-muted">
              orgName, cui, sector, employeeCount, email
            </code>
            . Maxim 50 rânduri per import.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-eos-primary">
            <Upload className="size-3" strokeWidth={2} />
            Începe upload-ul
          </span>
        </button>

        {/* Oblio */}
        <Link
          href="/dashboard/fiscal/integrari?focus=oblio"
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition hover:border-eos-primary hover:bg-eos-primary/[0.04]"
        >
          <PlugZap className="size-5 text-eos-text-muted" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">📊 Conectează Oblio</p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            OAuth 2.0 — token valid 1h, refresh automat la sync. API trage
            lista clienților + facturile emise recent.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-eos-text-muted">
            Vezi opțiuni
            <ArrowRight className="size-3" strokeWidth={2} />
          </span>
        </Link>

        {/* SmartBill */}
        <Link
          href="/dashboard/fiscal/integrari?focus=smartbill"
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition hover:border-eos-primary hover:bg-eos-primary/[0.04]"
        >
          <PlugZap className="size-5 text-eos-text-muted" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">📊 Conectează SmartBill</p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            API key SmartBill Cloud → trage lista contactelor + facturi emise.
            170k+ firme RO folosesc SmartBill — probabil al doilea cel mai des.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-eos-text-muted">
            Vezi opțiuni
            <ArrowRight className="size-3" strokeWidth={2} />
          </span>
        </Link>

        {/* SAGA */}
        <Link
          href="/dashboard/fiscal/integrari?focus=saga"
          className="group flex flex-col items-start gap-2 rounded-eos-lg border border-eos-border bg-eos-surface p-4 transition hover:border-eos-primary hover:bg-eos-primary/[0.04] sm:col-span-2"
        >
          <PlugZap className="size-5 text-eos-text-muted" strokeWidth={1.5} />
          <p className="text-sm font-semibold text-eos-text">
            📊 SAGA — upload SAF-T XML
          </p>
          <p className="text-xs leading-5 text-eos-text-tertiary">
            SAGA e desktop fără API public. Exportă SAF-T XML local și trage-l
            aici — parserul scoate CUI-urile clienților + tranzacții relevante.
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11.5px] font-medium text-eos-text-muted">
            Vezi opțiuni
            <ArrowRight className="size-3" strokeWidth={2} />
          </span>
        </Link>
      </div>

      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-variant/40 p-3 text-[11.5px] leading-[1.55] text-eos-text-tertiary">
        <strong className="text-eos-text">După acest pas:</strong> portofoliul
        tău are CUI-uri și date ANAF, dar 0 findings — pentru că nu am scanat
        încă mesajele SPV ale clienților. Următorul pas va fi conectarea la
        ANAF SPV cu certificatul tău digital.
      </div>
    </div>
  )
}
