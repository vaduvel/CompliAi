"use client"

import { useEffect, useState } from "react"
import { Clipboard, ClipboardCheck, Download, FileText, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { DOCUMENT_TYPES, type DocumentType, type GeneratedDocument } from "@/lib/server/document-generator"
import { ORG_SECTOR_LABELS } from "@/lib/compliance/applicability"

// ── Input field + textarea helpers ────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-eos-text">
        {label}
        {hint && <span className="ml-1.5 text-eos-text-muted font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass =
  "ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"

const textareaClass =
  "ring-focus w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2.5 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"

// ── Document type card ─────────────────────────────────────────────────────────

function DocumentTypeCard({
  doc,
  selected,
  onSelect,
}: {
  doc: (typeof DOCUMENT_TYPES)[number]
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-eos-md border p-3 text-left transition-colors ${
        selected
          ? "border-eos-primary bg-eos-primary/5 ring-1 ring-eos-primary"
          : "border-eos-border bg-eos-surface hover:border-eos-border-hover hover:bg-eos-surface-variant"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-medium ${selected ? "text-eos-primary" : "text-eos-text"}`}>
          {doc.label}
        </p>
        {doc.free ? (
          <Badge variant="success" className="shrink-0 text-[10px] normal-case tracking-normal">
            gratuit
          </Badge>
        ) : (
          <Badge variant="secondary" className="shrink-0 text-[10px] normal-case tracking-normal">
            paid
          </Badge>
        )}
      </div>
      <p className="mt-1 text-xs text-eos-text-muted leading-5">{doc.description}</p>
      <p className="mt-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-tertiary">
        {doc.legalBasis}
      </p>
    </button>
  )
}

// ── Markdown-like preview ──────────────────────────────────────────────────────

function DocumentPreview({ content }: { content: string }) {
  const lines = content.split("\n")

  return (
    <div className="space-y-1 text-sm text-eos-text">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) {
          return (
            <h1 key={i} className="mt-4 text-base font-semibold text-eos-text first:mt-0">
              {line.slice(2)}
            </h1>
          )
        }
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-3 text-sm font-semibold text-eos-text">
              {line.slice(3)}
            </h2>
          )
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-2 text-xs font-semibold uppercase tracking-[0.1em] text-eos-text-muted">
              {line.slice(4)}
            </h3>
          )
        }
        if (line.startsWith("---")) {
          return <hr key={i} className="my-3 border-eos-border-subtle" />
        }
        if (line.startsWith("> ")) {
          return (
            <div key={i} className="rounded-eos-md border-l-2 border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {line.slice(2)}
            </div>
          )
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <div key={i} className="flex gap-2 leading-6">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-eos-text-muted" />
              <span className="text-eos-text-muted">{line.slice(2)}</span>
            </div>
          )
        }
        if (/^\d+\.\s/.test(line)) {
          const match = line.match(/^(\d+)\.\s(.*)$/)
          if (match) {
            return (
              <div key={i} className="flex gap-2 leading-6">
                <span className="shrink-0 font-medium text-eos-text-muted">{match[1]}.</span>
                <span className="text-eos-text-muted">{match[2]}</span>
              </div>
            )
          }
        }
        if (line.trim() === "") {
          return <div key={i} className="h-1.5" />
        }
        return (
          <p key={i} className="leading-6 text-eos-text-muted">
            {line}
          </p>
        )
      })}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GeneratorPage() {
  const cockpit = useCockpitData()

  const [selectedType, setSelectedType] = useState<DocumentType>("privacy-policy")
  const [orgName, setOrgName] = useState("")
  const [orgWebsite, setOrgWebsite] = useState("")
  const [orgSector, setOrgSector] = useState("")
  const [orgCui, setOrgCui] = useState("")
  const [dpoEmail, setDpoEmail] = useState("")
  const [dataFlows, setDataFlows] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedDocument | null>(null)
  const [copied, setCopied] = useState(false)

  // R-2: auto pre-fill din org state la prima încărcare
  useEffect(() => {
    if (!cockpit.data) return
    if (!orgName) setOrgName(cockpit.data.workspace.orgName)
    if (!orgSector) {
      const sector = cockpit.data.state.orgProfile?.sector
      if (sector) setOrgSector(ORG_SECTOR_LABELS[sector])
    }
  }, [cockpit.data]) // eslint-disable-line react-hooks/exhaustive-deps

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  // R-5: copiază în clipboard
  async function handleCopy() {
    if (!result) return
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(result.content)
      } else {
        // fallback pentru browsere fără Clipboard API
        const ta = document.createElement("textarea")
        ta.value = result.content
        ta.style.position = "fixed"
        ta.style.opacity = "0"
        document.body.appendChild(ta)
        ta.select()
        document.execCommand("copy")
        document.body.removeChild(ta)
      }
      setCopied(true)
      toast.success("Copiat în clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Nu am putut copia — încearcă manual.")
    }
  }

  async function handleGenerate() {
    const name = orgName.trim() || cockpit.data!.workspace.orgName
    if (!name) {
      toast.error("Introdu numele organizației")
      return
    }

    setGenerating(true)
    setResult(null)

    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: selectedType,
          orgName: name,
          orgWebsite: orgWebsite || undefined,
          orgSector: orgSector || undefined,
          orgCui: orgCui || undefined,
          dpoEmail: dpoEmail || undefined,
          dataFlows: dataFlows || undefined,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Generarea a eșuat.")
      }

      const doc = (await res.json()) as GeneratedDocument
      setResult(doc)
      toast.success(`${doc.title} generat`)
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGenerating(false)
    }
  }

  function handleDownload() {
    if (!result) return
    const blob = new Blob([result.content], { type: "text/markdown;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${result.documentType}-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  const selectedDocMeta = DOCUMENT_TYPES.find((d) => d.id === selectedType)

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow="Generator"
        title="Generator de documente de conformitate"
        description="Generează politici și proceduri personalizate cu AI — Privacy Policy, Cookie Policy, DPA, Plan de Răspuns Incidente NIS2, Politică Guvernanță AI."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Gemini AI
            </Badge>
            <Badge variant="success" dot className="normal-case tracking-normal">
              Privacy Policy gratuit
            </Badge>
          </>
        }
      />

      <PillarTabs sectionId="politici" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* ── Left: form ── */}
        <div className="space-y-5">
          {/* Document type selector */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tip document</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 pt-0">
              {DOCUMENT_TYPES.map((doc) => (
                <DocumentTypeCard
                  key={doc.id}
                  doc={doc}
                  selected={selectedType === doc.id}
                  onSelect={() => setSelectedType(doc.id)}
                />
              ))}
            </CardContent>
          </Card>

          {/* Context form */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Date organizație</CardTitle>
                <span className="text-xs text-eos-text-muted">Pre-completat din profilul tău</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <Field label="Nume organizație" hint="(obligatoriu)">
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder={cockpit.data.workspace.orgName}
                  className={inputClass}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="CUI / CIF">
                  <input
                    type="text"
                    value={orgCui}
                    onChange={(e) => setOrgCui(e.target.value)}
                    placeholder="RO12345678"
                    className={inputClass}
                  />
                </Field>
                <Field label="Website">
                  <input
                    type="text"
                    value={orgWebsite}
                    onChange={(e) => setOrgWebsite(e.target.value)}
                    placeholder="https://firma.ro"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Sector de activitate">
                  <input
                    type="text"
                    value={orgSector}
                    onChange={(e) => setOrgSector(e.target.value)}
                    placeholder="ex. e-commerce, healthcare, IT"
                    className={inputClass}
                  />
                </Field>
                <Field label="Email DPO / responsabil date">
                  <input
                    type="email"
                    value={dpoEmail}
                    onChange={(e) => setDpoEmail(e.target.value)}
                    placeholder="dpo@firma.ro"
                    className={inputClass}
                  />
                </Field>
              </div>

              <Field
                label="Fluxuri de date principale"
                hint="(opțional — crește precizia)"
              >
                <textarea
                  value={dataFlows}
                  onChange={(e) => setDataFlows(e.target.value)}
                  rows={3}
                  placeholder="ex. Colectăm: email, nume, adresă livrare. Procesori: Stripe, Google Analytics, Mailchimp. Stocăm pe servere AWS EU."
                  className={textareaClass}
                />
              </Field>

              <Button
                onClick={() => void handleGenerate()}
                disabled={generating}
                size="lg"
                className="w-full gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se generează…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" />
                    Generează {selectedDocMeta?.label}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: preview ── */}
        <div className="space-y-4">
          {result ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-eos-text">{result.title}</p>
                  <p className="text-xs text-eos-text-muted">
                    Generat{" "}
                    {new Date(result.generatedAtISO).toLocaleString("ro-RO", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {result.llmUsed ? " · AI" : " · schiță"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void handleCopy()}
                    className="gap-1.5"
                  >
                    {copied ? (
                      <ClipboardCheck className="size-3.5 text-eos-success" strokeWidth={2} />
                    ) : (
                      <Clipboard className="size-3.5" strokeWidth={2} />
                    )}
                    {copied ? "Copiat!" : "Copiază"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="gap-1.5"
                  >
                    <Download className="size-3.5" strokeWidth={2} />
                    .md
                  </Button>
                </div>
              </div>

              <Card className="border-eos-border bg-eos-surface">
                <CardContent className="max-h-[700px] overflow-y-auto px-5 py-5">
                  <DocumentPreview content={result.content} />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="border-eos-border bg-eos-surface">
              <CardContent className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
                <div className="grid size-10 place-items-center rounded-eos-md border border-eos-border bg-eos-surface-variant">
                  <FileText className="size-5 text-eos-text-muted" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-sm font-medium text-eos-text">Document pregătit</p>
                  <p className="mt-1 text-xs text-eos-text-muted">
                    {`Completează datele și apasă „Generează" pentru a obține documentul.`}
                  </p>
                </div>
                <p className="text-[10px] text-eos-text-tertiary">
                  Documentele generate de AI necesită verificare umană înainte de utilizare oficială.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
