"use client"

import { useMemo, useState } from "react"
import { Archive, CheckCircle2, FileSpreadsheet, Loader2, UploadCloud } from "lucide-react"
import { toast } from "sonner"

import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import type { DpoMigrationImportKind } from "@/lib/compliance/types"

const IMPORT_OPTIONS: Array<{
  value: DpoMigrationImportKind
  label: string
  description: string
  columns: string
}> = [
  {
    value: "dsar-log",
    label: "Registru DSAR",
    description: "Cereri istorice Art. 15-22, deadline-uri, status și dovezi de răspuns.",
    columns: "solicitant, email, tip cerere, data primire, status, dovadă",
  },
  {
    value: "ropa-register",
    label: "RoPA Art. 30",
    description: "Activități de prelucrare vechi din Excel/Word, păstrate ca RoPA draft pentru revizie.",
    columns: "activitate, scop, temei, categorii date, persoane vizate, destinatari, retenție",
  },
  {
    value: "vendor-dpa-register",
    label: "Vendor / DPA",
    description: "Furnizori, procesatori, DPA semnat/lipsă, transferuri și review-uri viitoare.",
    columns: "furnizor, serviciu, DPA, date personale, transfer, review",
  },
  {
    value: "training-tracker",
    label: "Training GDPR",
    description: "Traininguri vechi, participanți, dovadă și status de finalizare.",
    columns: "training, audiență, participanți, data, dovadă",
  },
  {
    value: "breach-log",
    label: "Breach / ANSPDCP",
    description: "Incidente istorice cu date personale, deadline 72h și tracking ANSPDCP.",
    columns: "incident, data, severitate, date personale, categorii date, măsuri",
  },
  {
    value: "approval-history",
    label: "Aprobări email/Word",
    description: "Aprobări vechi importate ca dovezi istorice, fără să pretindem magic-link nativ.",
    columns: "document, aprobat de, data aprobare, sursă/dovadă",
  },
  {
    value: "evidence-archive",
    label: "Arhivă dovezi",
    description: "Index/arhivă de fișiere vechi păstrată ca referință, nu structurată automat.",
    columns: "fișier, categorie, client, note",
  },
]

type ImportResult = {
  ok: true
  importedCount: number
  skippedCount: number
  structuredCount: number
  archiveOnlyCount: number
  warnings: string[]
  errors: string[]
  importRecord: {
    kind: DpoMigrationImportKind
    fileName: string
    importedAtISO: string
    notes: string[]
  }
}

export default function DpoMigrationPage() {
  const [kind, setKind] = useState<DpoMigrationImportKind>("dsar-log")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  const activeOption = useMemo(
    () => IMPORT_OPTIONS.find((option) => option.value === kind) ?? IMPORT_OPTIONS[0],
    [kind]
  )

  async function submitImport() {
    if (!file) {
      toast.error("Alege un fișier .xlsx/.xls/.csv.")
      return
    }
    setLoading(true)
    setResult(null)
    try {
      const form = new FormData()
      form.set("kind", kind)
      form.set("file", file)
      const response = await fetch("/api/dpo/migration/import", {
        method: "POST",
        body: form,
      })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error ?? "Import eșuat.")
      setResult(payload as ImportResult)
      toast.success("Import istoric DPO finalizat.", {
        description: `${payload.importedCount} importate, ${payload.skippedCount} ignorate.`,
      })
    } catch (error) {
      toast.error("Nu am putut importa istoricul.", {
        description: error instanceof Error ? error.message : "Încearcă din nou.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: "Migrare istoric", current: true }]}
        eyebrowBadges={
          <span className="rounded-eos-sm border border-eos-primary/30 bg-eos-primary-soft px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
            DPO Cabinet OS
          </span>
        }
        title="Migrare istoric cabinet"
        description="Importă registrele Dianei din Excel/CSV: DSAR, RoPA, vendor/DPA, training, breach ANSPDCP și aprobări istorice. Ce poate fi structurat intră în registre; ce nu poate fi dovedit nativ rămâne marcat clar ca istoric."
      />

      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileSpreadsheet className="size-4 text-eos-primary" strokeWidth={2} />
              Alege registrul de importat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {IMPORT_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setKind(option.value)}
                className={`w-full rounded-eos-md border p-3 text-left transition ${
                  kind === option.value
                    ? "border-eos-primary bg-eos-primary-soft"
                    : "border-eos-border bg-eos-bg hover:border-eos-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-eos-text">{option.label}</p>
                  {kind === option.value ? <Badge variant="success">selectat</Badge> : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-eos-text-muted">{option.description}</p>
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UploadCloud className="size-4 text-eos-primary" strokeWidth={2} />
              Încarcă fișierul Dianei
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-eos-md border border-eos-border bg-eos-bg p-4">
              <p className="text-sm font-semibold text-eos-text">{activeOption.label}</p>
              <p className="mt-1 text-xs text-eos-text-muted">Coloane acceptate natural: {activeOption.columns}.</p>
              <p className="mt-2 text-xs leading-relaxed text-eos-text-muted">
                Nu cerem format CompliScan rigid. Importerul caută denumiri românești și englezești, iar rezultatul spune
                explicit ce a intrat structurat și ce a rămas istoric.
              </p>
            </div>

            <label className="block rounded-eos-lg border border-dashed border-eos-border bg-eos-bg p-5 text-center">
              <Archive className="mx-auto size-7 text-eos-primary" strokeWidth={2} />
              <span className="mt-2 block text-sm font-semibold text-eos-text">
                {file ? file.name : "Alege fișier .xlsx, .xls sau .csv"}
              </span>
              <span className="mt-1 block text-xs text-eos-text-muted">
                Importul se aplică pe clientul activ din workspace.
              </span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <Button onClick={() => void submitImport()} disabled={loading || !file} className="w-full gap-2">
              {loading ? <Loader2 className="size-4 animate-spin" strokeWidth={2} /> : <UploadCloud className="size-4" strokeWidth={2} />}
              Importă istoric în CompliScan
            </Button>

            {result ? (
              <div className="rounded-eos-lg border border-eos-success/30 bg-eos-success-soft p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-eos-success" strokeWidth={2} />
                  <p className="text-sm font-semibold text-eos-text">Import finalizat</p>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-eos-text-muted sm:grid-cols-4">
                  <Stat label="Importate" value={result.importedCount} />
                  <Stat label="Structurate" value={result.structuredCount} />
                  <Stat label="Arhivă" value={result.archiveOnlyCount} />
                  <Stat label="Ignorate" value={result.skippedCount} />
                </div>
                {result.importRecord.notes.length > 0 ? (
                  <ul className="mt-3 space-y-1 text-xs text-eos-text-muted">
                    {result.importRecord.notes.map((note) => (
                      <li key={note}>• {note}</li>
                    ))}
                  </ul>
                ) : null}
                {result.warnings.length > 0 ? (
                  <details className="mt-3 text-xs text-eos-text-muted">
                    <summary className="cursor-pointer font-semibold text-eos-text">Avertismente import</summary>
                    <ul className="mt-2 space-y-1">
                      {result.warnings.slice(0, 12).map((warning) => (
                        <li key={warning}>• {warning}</li>
                      ))}
                    </ul>
                  </details>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-eos-sm border border-eos-border bg-eos-surface px-3 py-2">
      <p className="font-mono text-[10px] uppercase tracking-[0.12em]">{label}</p>
      <p className="mt-1 text-lg font-semibold text-eos-text">{value}</p>
    </div>
  )
}
