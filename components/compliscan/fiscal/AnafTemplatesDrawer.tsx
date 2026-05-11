"use client"

// Drawer cu lista celor 8 templates răspunsuri ANAF + form pentru
// completarea placeholders și copiere text generat.

import { useState } from "react"
import { Check, Copy, FileText, X } from "lucide-react"
import { toast } from "sonner"

import {
  ANAF_RESPONSE_TEMPLATES,
  fillTemplate,
  type AnafNotificationType,
  type ResponseTemplate,
} from "@/lib/compliance/anaf-response-templates"

const ALL_PLACEHOLDERS = [
  "org_name",
  "cif",
  "period",
  "signer_name",
  "signer_role",
  "difference_explanation",
  "cause",
  "art",
  "attachments_list",
  "rectification_date",
  "corrections_list",
  "invoice_number",
  "supplier_name",
  "supplier_cif",
  "efactura_date",
  "expense_category",
  "caen_code",
  "total_amount",
  "count",
  "transmitted_count",
  "still_pending_count",
  "retransmission_date",
  "error_message",
  "root_cause",
  "accounting_software",
  "software_version",
  "redepunere_date",
  "validator_version",
  "amenda_amount",
  "pv_number",
  "pv_date",
  "outage_period",
  "transmission_date",
  "duplicate_count",
]

export function AnafTemplatesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedType, setSelectedType] = useState<AnafNotificationType | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [copiedSubject, setCopiedSubject] = useState(false)
  const [copiedBody, setCopiedBody] = useState(false)

  if (!open) return null

  const selected = ANAF_RESPONSE_TEMPLATES.find((t) => t.type === selectedType) ?? null
  const filled = selected ? fillTemplate(selected, values) : null

  // Detect care placeholders sunt în template-ul curent
  const placeholdersInTemplate = selected
    ? ALL_PLACEHOLDERS.filter((p) =>
        (selected.subject + selected.body).includes(`{{${p}}}`),
      )
    : []

  async function copyToClipboard(text: string, target: "subject" | "body") {
    try {
      await navigator.clipboard.writeText(text)
      if (target === "subject") {
        setCopiedSubject(true)
        setTimeout(() => setCopiedSubject(false), 2000)
      } else {
        setCopiedBody(true)
        setTimeout(() => setCopiedBody(false), 2000)
      }
      toast.success(`${target === "subject" ? "Subject" : "Body"} copiat.`)
    } catch {
      toast.error("Nu am putut copia.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50">
      <div className="flex h-full w-full max-w-2xl flex-col border-l border-eos-border bg-eos-surface">
        <header className="flex items-start justify-between gap-3 border-b border-eos-border-subtle px-5 py-4">
          <div>
            <p
              data-display-text="true"
              className="font-display text-[16px] font-semibold tracking-[-0.015em] text-eos-text"
            >
              Bibliotecă răspunsuri ANAF
            </p>
            <p className="mt-1 text-[12px] text-eos-text-muted">
              {ANAF_RESPONSE_TEMPLATES.length} template-uri standard pentru notificări frecvente. Completează
              placeholderii cu datele tale și copiază.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-eos-sm p-1 text-eos-text-tertiary hover:bg-eos-surface-variant hover:text-eos-text"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Lista templates */}
          <aside className="w-72 shrink-0 overflow-y-auto border-r border-eos-border-subtle bg-eos-surface-elevated">
            {ANAF_RESPONSE_TEMPLATES.map((t) => (
              <button
                key={t.type}
                onClick={() => {
                  setSelectedType(t.type)
                  setValues({})
                }}
                className={`block w-full border-b border-eos-border-subtle px-4 py-3 text-left text-[12.5px] transition-colors ${
                  selectedType === t.type
                    ? "bg-eos-primary/10 text-eos-primary"
                    : "text-eos-text-muted hover:bg-eos-secondary-hover hover:text-eos-text"
                }`}
              >
                <FileText className="mr-1 inline size-3.5 align-text-bottom" strokeWidth={2} />
                {t.label}
              </button>
            ))}
          </aside>

          {/* Detalii template */}
          <div className="flex-1 overflow-y-auto p-5">
            {!selected ? (
              <div className="flex h-full items-center justify-center text-[12.5px] text-eos-text-muted">
                Selectează un template din stânga.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface-elevated p-3">
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                    Bază legală
                  </p>
                  <p className="mt-1 text-[12px] text-eos-text">{selected.legalReference}</p>
                </div>

                {placeholdersInTemplate.length > 0 && (
                  <div>
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                      Completează câmpurile
                    </p>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {placeholdersInTemplate.map((p) => (
                        <label key={p} className="block">
                          <span className="font-mono text-[10px] text-eos-text-tertiary">{p}</span>
                          <input
                            value={values[p] ?? ""}
                            onChange={(e) => setValues((v) => ({ ...v, [p]: e.target.value }))}
                            placeholder={`{{${p}}}`}
                            className="mt-0.5 h-8 w-full rounded-eos-sm border border-eos-border bg-eos-surface-variant px-2 font-mono text-[11.5px] text-eos-text outline-none placeholder:text-eos-text-tertiary"
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {filled && (
                  <>
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                          Subject
                        </p>
                        <button
                          onClick={() => void copyToClipboard(filled.subject, "subject")}
                          className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-2 py-1 font-mono text-[10.5px] text-eos-text-muted hover:border-eos-primary hover:text-eos-primary"
                        >
                          {copiedSubject ? (
                            <>
                              <Check className="size-3" strokeWidth={2} /> Copiat
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" strokeWidth={2} /> Copiază
                            </>
                          )}
                        </button>
                      </div>
                      <p className="mt-1 rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 font-mono text-[12px] text-eos-text">
                        {filled.subject}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                          Body
                        </p>
                        <button
                          onClick={() => void copyToClipboard(filled.body, "body")}
                          className="inline-flex items-center gap-1 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-2 py-1 font-mono text-[10.5px] text-eos-text-muted hover:border-eos-primary hover:text-eos-primary"
                        >
                          {copiedBody ? (
                            <>
                              <Check className="size-3" strokeWidth={2} /> Copiat
                            </>
                          ) : (
                            <>
                              <Copy className="size-3" strokeWidth={2} /> Copiază
                            </>
                          )}
                        </button>
                      </div>
                      <pre className="mt-1 max-h-[420px] overflow-y-auto rounded-eos-sm border border-eos-border-subtle bg-eos-surface-variant px-3 py-2 font-mono text-[11.5px] text-eos-text whitespace-pre-wrap leading-[1.6]">
                        {filled.body}
                      </pre>
                    </div>

                    <div className="rounded-eos-md border border-eos-warning/30 bg-eos-warning-soft p-3 text-[12px]">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-warning">
                        Recomandare după trimitere
                      </p>
                      <p className="mt-1 text-eos-text">{selected.recommendedAction}</p>
                    </div>

                    <div className="rounded-eos-md border border-eos-border bg-eos-surface-elevated p-3">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
                        Documente de atașat
                      </p>
                      <ul className="mt-1 list-disc space-y-0.5 pl-5 text-[12px] text-eos-text">
                        {selected.attachmentsRequired.map((a, i) => (
                          <li key={i}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Trigger button ──────────────────────────────────────────────────────────

export function AnafTemplatesTrigger() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-eos-sm border border-eos-border bg-eos-surface-variant px-3 py-1.5 font-mono text-[11px] font-medium text-eos-text-muted transition-colors hover:border-eos-border-strong hover:text-eos-text"
      >
        <FileText className="size-3.5" strokeWidth={2} />
        Bibliotecă răspunsuri ANAF
      </button>
      <AnafTemplatesDrawer open={open} onClose={() => setOpen(false)} />
    </>
  )
}
