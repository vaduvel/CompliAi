"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Clipboard, ClipboardCheck, Download, FileText, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { PillarTabs } from "@/components/compliscan/pillar-tabs"
import { FeedbackPrompt } from "@/components/compliscan/feedback-prompt"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { useTrackEvent } from "@/lib/client/use-track-event"
import { DOCUMENT_TYPES, type DocumentType, type GeneratedDocument } from "@/lib/server/document-generator"
import { ORG_SECTOR_LABELS } from "@/lib/compliance/applicability"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import { OrgKnowledgePrefill } from "@/components/compliscan/org-knowledge-prefill"
import type { ScanFinding } from "@/lib/compliance/types"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"
import {
  FindingExecutionCard,
  FindingNarrativeCard,
} from "@/components/compliscan/finding-cockpit-shared"

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

type GeneratedDocumentResponse = GeneratedDocument & {
  recordId?: string
  sourceFindingId?: string | null
}

type FindingGeneratorContext = {
  finding: ScanFinding
  linkedGeneratedDocument?: {
    id: string
    documentType: DocumentType
    title: string
    content?: string
    generatedAtISO: string
    llmUsed: boolean
    approvalStatus?: "draft" | "approved_as_evidence"
    approvedAtISO?: string
    approvedByEmail?: string
    expiresAtISO?: string
    nextReviewDateISO?: string
  } | null
  documentFlowState?: "not_required" | "draft_missing" | "draft_ready" | "attached_as_evidence"
}

const FINDING_CONFIRMATION_ITEMS = [
  {
    id: "content-reviewed",
    label: "Am citit draftul integral",
    hint: "nu închid finding-ul pe baza unui document neverificat",
  },
  {
    id: "facts-confirmed",
    label: "Datele reflectă firma reală",
    hint: "am verificat scopurile, furnizorii și particularitățile organizației",
  },
  {
    id: "approved-for-evidence",
    label: "Îl aprob ca dovadă de conformitate",
    hint: "îmi asum că poate fi prezentat mai departe în fluxul real",
  },
] as const

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
            <div key={i} className="rounded-eos-md border-l-2 border-eos-warning/40 bg-eos-warning-soft px-3 py-2 text-xs text-eos-warning">
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
  const router = useRouter()
  const searchParams = useSearchParams()
  const findingId = searchParams.get("findingId")
  const requestedDocumentType = searchParams.get("documentType")
  const findingFlowRedirect = Boolean(findingId)

  const [selectedType, setSelectedType] = useState<DocumentType>("privacy-policy")
  const [orgName, setOrgName] = useState("")
  const [orgWebsite, setOrgWebsite] = useState("")
  const [orgSector, setOrgSector] = useState("")
  const [orgCui, setOrgCui] = useState("")
  const [dpoEmail, setDpoEmail] = useState("")
  const [dataFlows, setDataFlows] = useState("")
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<GeneratedDocumentResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [findingContext, setFindingContext] = useState<FindingGeneratorContext | null>(null)
  const [findingContextLoading, setFindingContextLoading] = useState(false)
  const [attaching, setAttaching] = useState(false)
  const [confirmationChecklist, setConfirmationChecklist] = useState<string[]>([])
  const [evidenceNote, setEvidenceNote] = useState("")
  const { track } = useTrackEvent()
  const downloadedRef = useRef(false)
  const findingFlowActive = Boolean(findingId && findingContext?.finding)
  const findingContextRecipe = findingContext
    ? buildCockpitRecipe(findingContext.finding, {
        documentFlowState: findingContext.documentFlowState,
        linkedGeneratedDocument: findingContext.linkedGeneratedDocument,
      })
    : null

  // Stuck event: doc generated but never downloaded
  useEffect(() => {
    if (result) downloadedRef.current = false
  }, [result])
  useEffect(() => {
    return () => {
      if (result && !downloadedRef.current) {
        track("generated_doc_not_downloaded", { documentType: result.documentType })
      }
    }
  }) // eslint-disable-line react-hooks/exhaustive-deps

  // R-2: auto pre-fill din org state la prima încărcare
  useEffect(() => {
    if (!cockpit.data) return
    if (!orgName) setOrgName(cockpit.data.workspace.orgName)
    const profile = cockpit.data.state.orgProfile
    if (profile) {
      if (!orgSector) setOrgSector(ORG_SECTOR_LABELS[profile.sector])
      if (!orgCui && profile.cui) setOrgCui(profile.cui)
    }
  }, [cockpit.data]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!requestedDocumentType) return
    if (DOCUMENT_TYPES.some((document) => document.id === requestedDocumentType)) {
      setSelectedType(requestedDocumentType as DocumentType)
    }
  }, [requestedDocumentType])

  useEffect(() => {
    if (!findingId) return
    router.replace(`${dashboardRoutes.resolve}/${encodeURIComponent(findingId)}?action=generate`)
  }, [findingId, router])

  useEffect(() => {
    if (!findingId) {
      setFindingContext(null)
      return
    }

    setFindingContext(null)
    setFindingContextLoading(false)
  }, [findingId])

  if (findingFlowRedirect) return <LoadingScreen variant="section" />
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
    setConfirmationChecklist([])
    setEvidenceNote("")

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
          sourceFindingId: findingId || undefined,
        }),
      })

      if (!res.ok) {
        const payload = (await res.json()) as { error?: string }
        throw new Error(payload.error ?? "Generarea a eșuat.")
      }

      const doc = (await res.json()) as GeneratedDocumentResponse
      setResult(doc)
      if (findingId) {
        setFindingContext((current) =>
          current
            ? {
                ...current,
                linkedGeneratedDocument: {
                  id: doc.recordId ?? `generated-${doc.generatedAtISO}`,
                  documentType: doc.documentType,
                  title: doc.title,
                  content: doc.content,
                  generatedAtISO: doc.generatedAtISO,
                  llmUsed: doc.llmUsed,
                  approvalStatus: "draft",
                  expiresAtISO: doc.expiresAtISO,
                  nextReviewDateISO: doc.nextReviewDateISO,
                },
                documentFlowState: "draft_ready",
              }
            : current
        )
      }
      toast.success(`${doc.title} generat`)
    } catch (err) {
      toast.error("Eroare la generare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setGenerating(false)
    }
  }

  function toggleConfirmationItem(itemId: string) {
    setConfirmationChecklist((current) =>
      current.includes(itemId)
        ? current.filter((value) => value !== itemId)
        : [...current, itemId]
    )
  }

  async function handleAttachAsEvidence() {
    if (!findingId || !result?.recordId) return

    setAttaching(true)
    try {
      const res = await fetch(`/api/findings/${encodeURIComponent(findingId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "resolved",
          generatedDocumentId: result.recordId,
          confirmationChecklist,
          evidenceNote: evidenceNote || undefined,
        }),
      })

      const payload = (await res.json()) as { error?: string; feedbackMessage?: string }
      if (!res.ok) {
        throw new Error(payload.error ?? "Nu am putut atașa draftul ca dovadă.")
      }

      router.replace(
        `${dashboardRoutes.resolve}/${encodeURIComponent(findingId)}?success=dossier`
      )
    } catch (err) {
      toast.error("Nu am putut închide flow-ul.", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setAttaching(false)
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
    downloadedRef.current = true
  }

  async function handleDownloadPdf() {
    if (!result || downloadingPdf) return
    setDownloadingPdf(true)
    try {
      const res = await fetch("/api/documents/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: result.content,
          orgName: orgName || cockpit.data?.workspace.orgName,
          documentType: result.documentType,
        }),
      })
      if (!res.ok) throw new Error("PDF generation failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${result.documentType}-${new Date().toISOString().split("T")[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success("PDF descărcat!")
      downloadedRef.current = true
    } catch {
      toast.error("Eroare la generarea PDF-ului.")
    } finally {
      setDownloadingPdf(false)
    }
  }

  const selectedDocMeta = DOCUMENT_TYPES.find((d) => d.id === selectedType)
  const isChecklistComplete = FINDING_CONFIRMATION_ITEMS.every((item) =>
    confirmationChecklist.includes(item.id)
  )
  const visibleDocumentTypes =
    findingFlowActive && findingContext?.finding.suggestedDocumentType
      ? DOCUMENT_TYPES.filter((document) => document.id === findingContext.finding.suggestedDocumentType)
      : DOCUMENT_TYPES

  return (
    <div className="space-y-6">
      <PageIntro
        eyebrow={findingFlowActive ? "Flow finding -> document -> dovadă" : "Documente asistate"}
        title={
          findingFlowActive
            ? "Verifici draftul și îl atașezi ca dovadă"
            : "Creezi drafturi de politici și proceduri"
        }
        description={
          findingFlowActive
            ? "Rămâi în flow-ul ghidat al finding-ului. Generezi draftul, îl verifici, confirmi că reflectă realitatea firmei și abia apoi îl atașezi ca dovadă."
            : "Aici generezi drafturi asistate pentru politici și proceduri. Validarea umană, publicarea și atașarea dovezilor rămân pași separați."
        }
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {findingFlowActive ? "flow ghidat" : "draft asistat"}
            </Badge>
            {findingFlowActive ? (
              <Badge variant="warning" dot className="normal-case tracking-normal">
                confirmare obligatorie
              </Badge>
            ) : (
              <Badge variant="success" dot className="normal-case tracking-normal">
                Politică confidențialitate — gratuit
              </Badge>
            )}
          </>
        }
      />

      {!findingFlowActive ? <PillarTabs sectionId="politici" /> : null}

      {findingFlowActive ? (
        findingContextLoading ? (
          <Card className="border-eos-primary/30 bg-eos-primary/5">
            <CardContent className="pt-5">
              <div className="flex items-center gap-2 text-sm text-eos-text-muted">
                <Loader2 className="size-4 animate-spin" />
                Încărcăm contextul finding-ului...
              </div>
            </CardContent>
          </Card>
        ) : findingContext ? (
          <div className="space-y-4">
            <FindingExecutionCard
              finding={findingContext.finding}
              documentFlowState={findingContext.documentFlowState}
              linkedGeneratedDocument={findingContext.linkedGeneratedDocument}
              recipe={findingContextRecipe ?? undefined}
            />

            <details className="group rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-4">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-eos-text-tertiary">
                    Contextul finding-ului
                  </p>
                  <p className="mt-1 text-sm text-eos-text-muted">
                    Generatorul rămâne în urma cazului, iar contextul complet stă aici doar când ai nevoie de el.
                  </p>
                </div>
                <Badge variant="outline" className="normal-case tracking-normal">
                  Deschide
                </Badge>
              </summary>
              <div className="mt-4">
                <FindingNarrativeCard
                  finding={findingContext.finding}
                  title="Finding activ în flow-ul documentului"
                  description="Generatorul este parte din cockpit-ul finding-ului. Draftul, confirmarea și dovada rămân în același traseu."
                  recipe={findingContextRecipe ?? undefined}
                />
              </div>
            </details>
          </div>
        ) : null
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        {/* ── Left: form ── */}
        <div className="space-y-5">
          {/* Document type selector */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Tip document</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 pt-0">
              {visibleDocumentTypes.map((doc) => (
                <DocumentTypeCard
                  key={doc.id}
                  doc={doc}
                  selected={selectedType === doc.id}
                  onSelect={() => setSelectedType(doc.id)}
                />
              ))}
              {findingFlowActive ? (
                <p className="text-xs text-eos-text-muted">
                  În flow-ul din finding păstrăm doar documentul recomandat, ca să nu rupi traseul.
                </p>
              ) : null}
            </CardContent>
          </Card>

          {/* Context form */}
          <Card className="border-eos-border bg-eos-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Date organizație</CardTitle>
                <span className="text-xs text-eos-text-muted">
                  {findingFlowActive ? "Confirmi contextul înainte de aprobare" : "Pre-completat din profilul tău"}
                </span>
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
                <OrgKnowledgePrefill
                  categories={["data-categories", "vendors", "cookies", "tools", "processing-purposes"]}
                  onPrefill={(text) => setDataFlows((prev) => prev ? `${prev}\n${text}` : text)}
                  prefillLabel="Preia date confirmate anterior"
                  className="mb-2"
                />
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
                    Se generează… (poate dura 20–30s)
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
                  <Button
                    size="sm"
                    onClick={() => void handleDownloadPdf()}
                    disabled={downloadingPdf}
                    className="gap-1.5"
                  >
                    {downloadingPdf ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" strokeWidth={2} />
                    )}
                    PDF
                  </Button>
                </div>
              </div>

              <Card className="border-eos-border bg-eos-surface">
                <CardContent className="max-h-[700px] overflow-y-auto px-5 py-5">
                  <DocumentPreview content={result.content} />
                </CardContent>
              </Card>
              {findingFlowActive ? (
                <Card className="border-eos-warning-border bg-eos-warning-soft/40">
                  <CardContent className="space-y-4 pt-5">
                    <div>
                      <p className="text-sm font-semibold text-eos-text">
                        Confirmare activă înainte de atașare
                      </p>
                      <p className="mt-1 text-sm text-eos-text-muted">
                        Acest finding nu poate fi închis până când nu confirmi explicit că draftul reflectă
                        realitatea firmei și îl aprobi ca dovadă.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {FINDING_CONFIRMATION_ITEMS.map((item) => {
                        const checked = confirmationChecklist.includes(item.id)
                        return (
                          <label
                            key={item.id}
                            className={[
                              "flex cursor-pointer items-start gap-3 rounded-eos-md border px-3 py-3",
                              checked
                                ? "border-eos-primary/30 bg-eos-primary/10"
                                : "border-eos-border bg-eos-surface",
                            ].join(" ")}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleConfirmationItem(item.id)}
                              className="mt-0.5"
                            />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium text-eos-text">{item.label}</span>
                              <span className="mt-1 block text-xs text-eos-text-muted">{item.hint}</span>
                            </span>
                          </label>
                        )
                      })}
                    </div>

                    <Field label="Notă de confirmare / dovadă">
                      <textarea
                        value={evidenceNote}
                        onChange={(e) => setEvidenceNote(e.target.value)}
                        rows={3}
                        placeholder="Ex: am verificat scopurile, categoriile de date și furnizorii menționați; draftul poate fi folosit ca dovadă internă."
                        className={textareaClass}
                      />
                    </Field>

                    <Button
                      size="lg"
                      className="w-full gap-2"
                      disabled={!result.recordId || !isChecklistComplete || attaching}
                      onClick={() => void handleAttachAsEvidence()}
                    >
                      {attaching ? (
                        <>
                          <Loader2 className="size-4 animate-spin" />
                          Se atașează...
                        </>
                      ) : (
                        <>
                          Aprobă și atașează ca dovadă
                          <Sparkles className="size-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <FeedbackPrompt context="after_document" />
              )}
            </>
          ) : (
            <Card className="border-eos-border bg-eos-surface">
              <CardContent className="space-y-5 px-5 py-6">
                <div className="flex flex-col items-center gap-2 text-center">
                  <div className="grid size-10 place-items-center rounded-eos-md border border-eos-border bg-eos-surface-variant">
                    <FileText className="size-5 text-eos-text-muted" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-eos-text">Completează formularul și generează</p>
                  <p className="text-xs text-eos-text-muted">
                    Documentul va apărea aici imediat după generare.
                  </p>
                </div>
                {/* Documente recomandate pe baza applicability */}
                <div className="space-y-2">
                  <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-eos-text-tertiary">
                    Recomandate pentru tine
                  </p>
                  {((): { id: DocumentType; label: string; reason: string }[] => {
                    const tags = cockpit.data.state.applicability?.tags ?? []
                    const recs: { id: DocumentType; label: string; reason: string }[] = [
                      { id: "privacy-policy", label: "Politică de Confidențialitate", reason: "GDPR — obligatoriu pentru orice firmă" },
                    ]
                    if (tags.includes("nis2")) recs.push({ id: "nis2-incident-response", label: "Plan de Răspuns la Incidente", reason: "NIS2 Art.21 — obligatoriu pentru entități NIS2" })
                    if (tags.includes("ai-act")) recs.push({ id: "ai-governance", label: "Politică Guvernanță AI", reason: "AI Act Art.4 — literacy obligatorie din 2025" })
                    recs.push({ id: "dpa", label: "Acord Prelucrare Date (DPA)", reason: "GDPR Art.28 — obligatoriu cu fiecare procesator" })
                    return recs.slice(0, 3)
                  })().map((rec) => (
                    <button
                      key={rec.id}
                      onClick={() => setSelectedType(rec.id as DocumentType)}
                      className={`w-full rounded-eos-md border px-3 py-2 text-left transition-colors hover:border-eos-primary ${selectedType === rec.id ? "border-eos-primary bg-eos-primary/5" : "border-eos-border bg-eos-surface-variant"}`}
                    >
                      <p className="text-xs font-medium text-eos-text">{rec.label}</p>
                      <p className="mt-0.5 text-[10px] text-eos-text-muted">{rec.reason}</p>
                    </button>
                  ))}
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
