"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowRight, BookOpen, BriefcaseBusiness, FolderOpen, Loader2, Sparkles } from "lucide-react"

import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useDashboardRuntime } from "@/components/compliscan/dashboard-runtime"
import { CookieBannerCard } from "@/components/compliscan/cookie-banner-card"
import { HrRegesReconciliationCard } from "@/components/compliscan/hr-reges-reconciliation-card"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { V3PageHero } from "@/components/compliscan/v3/page-hero"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/evidence-os/Tabs"
import { dashboardRoutes, dashboardScanResultsRoute } from "@/lib/compliscan/dashboard-routes"
import type { HrPackKind, HrPreparedPack } from "@/lib/compliance/hr-drafts"
import type { ContractsPackKind, ContractsPreparedPack } from "@/lib/compliance/contracts-drafts"

const QUICK_DOC_TYPES = [
  { id: "privacy-policy", label: "Politică de Confidențialitate", desc: "GDPR Art. 13–14 — obligatorie", icon: "📄" },
  { id: "cookie-policy", label: "Politică de Cookies", desc: "ePrivacy + GDPR", icon: "🍪" },
  { id: "dpa", label: "Acord DPA", desc: "GDPR Art. 28 — cu procesatorii", icon: "🤝" },
  { id: "nis2-incident-response", label: "Plan Incidente NIS2", desc: "NIS2 + GDPR Art. 33–34", icon: "🛡️" },
  { id: "ai-governance", label: "Politică Guvernanță AI", desc: "EU AI Act Art. 9, 17", icon: "🤖" },
  { id: "ropa", label: "Registru RoPA", desc: "GDPR Art. 30 — obligatoriu", icon: "📋" },
  { id: "nda", label: "Acord NDA", desc: "Confidențialitate bilaterală", icon: "🔐" },
  { id: "supplier-contract", label: "Contract Furnizor", desc: "Cadru cu furnizori B2B", icon: "📦" },
] as const

type PreparedPack = HrPreparedPack | ContractsPreparedPack
type PreparedPackKind = HrPackKind | ContractsPackKind

type PreparedPackResponse = {
  pack: PreparedPack
}

const PREPARED_PACK_FALLBACKS: Record<
  PreparedPackKind,
  {
    title: string
    summary: string
    generatorDocumentType: string
    generatorLabel: string
    loadingLabel: string
    returnEvidenceNote: string
  }
> = {
  "job-descriptions": {
    title: "Pachet minim fișe de post",
    summary:
      "Pregătim modelul de fișă, inventarul de roluri și checklistul de rollout pentru ca remedierea să nu pornească de la zero.",
    generatorDocumentType: "job-description",
    generatorLabel: "Generează prima fișă",
    loadingLabel: "Încărcăm pachetul HR pregătit pentru fișe de post.",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul HR pentru fișe de post: modelul de fișă, inventarul de roluri și checklistul de rollout au fost revizuite. Următorul pas este adaptarea pe rolurile reale și semnarea internă.",
  },
  "hr-procedures": {
    title: "Pachet minim proceduri interne HR",
    summary:
      "Pregătim regulamentul intern, planul de comunicare și checklistul de rollout pentru ca remedierea să nu pornească de la zero.",
    generatorDocumentType: "hr-internal-procedures",
    generatorLabel: "Generează regulamentul",
    loadingLabel: "Încărcăm pachetul HR pregătit pentru regulamentul intern.",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul HR pentru regulament intern: structura documentului, planul de comunicare și checklistul de rollout au fost revizuite. Următorul pas este adaptarea la programul real și comunicarea către angajați.",
  },
  "reges-correction": {
    title: "Pachet minim corecție REGES",
    summary:
      "Pregătim brief-ul de corecție, checklistul pentru contabil / HR, reconcilierea snapshotului intern și mesajul de handoff, ca remedierea reală să nu pornească de la zero.",
    generatorDocumentType: "reges-correction-brief",
    generatorLabel: "Generează brief-ul",
    loadingLabel: "Încărcăm pachetul pregătit pentru corecția REGES.",
    returnEvidenceNote:
      "CompliAI a pregătit brief-ul de corecție REGES: checklistul pentru contabil / HR, snapshotul intern și mesajul de handoff au fost revizuite. Următorul pas este verificarea registrului real și întoarcerea cu exportul sau confirmarea de corecție.",
  },
  "contracts-baseline": {
    title: "Pachet minim baseline contractual",
    summary:
      "Pregătim matricea de template-uri, checklistul de clauze și planul minim de adoptare, ca baseline-ul contractual să nu pornească de la zero.",
    generatorDocumentType: "contract-template",
    generatorLabel: "Generează template-ul",
    loadingLabel: "Încărcăm pachetul pregătit pentru baseline-ul contractual.",
    returnEvidenceNote:
      "CompliAI a pregătit pachetul contractual: matricea de template-uri, checklistul de clauze și planul de adoptare au fost revizuite. Următorul pas este validarea juridică și punerea în uz a template-urilor pentru relațiile comerciale reale.",
  },
}

export function DocumentsPageSurface() {
  const runtime = useDashboardRuntime()
  const cockpit = useCockpitData()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [preparedPack, setPreparedPack] = useState<PreparedPack | null>(null)
  const [preparedPackLoading, setPreparedPackLoading] = useState(false)
  const [preparedPackError, setPreparedPackError] = useState<string | null>(null)
  const [preparedPackEvidenceNote, setPreparedPackEvidenceNote] = useState<string | null>(null)
  const focusedPack = searchParams.get("focus")
  const preparedPackKind =
    focusedPack === "job-descriptions" ||
    focusedPack === "hr-procedures" ||
    focusedPack === "reges-correction" ||
    focusedPack === "contracts-baseline"
      ? (focusedPack as PreparedPackKind)
      : null
  const preparedPackFallback = preparedPackKind ? PREPARED_PACK_FALLBACKS[preparedPackKind] : null
  const findingId = searchParams.get("findingId")
  const returnTo = searchParams.get("returnTo")

  useEffect(() => {
    setPreparedPackEvidenceNote(null)
    if (!preparedPackKind) {
      setPreparedPack(null)
      setPreparedPackError(null)
      setPreparedPackLoading(false)
      return
    }

    let cancelled = false
    setPreparedPack(null)
    setPreparedPackLoading(true)
    setPreparedPackError(null)

    const endpoint =
      preparedPackKind === "contracts-baseline"
        ? `/api/contracts/pack?kind=${encodeURIComponent(preparedPackKind)}`
        : `/api/hr/pack?kind=${encodeURIComponent(preparedPackKind)}`

    fetch(endpoint, { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as PreparedPackResponse | { error?: string } | null
        if (!response.ok) {
          throw new Error(
            payload && "error" in payload && typeof payload.error === "string"
              ? payload.error
              : "Nu am putut încărca pachetul pregătit."
          )
        }
        if (!cancelled) {
          setPreparedPack((payload as PreparedPackResponse).pack)
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setPreparedPack(null)
          setPreparedPackError(error.message)
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreparedPackLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [preparedPackKind, findingId])

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  const isSolo = runtime?.userMode === "solo"
  const generatedDocuments = cockpit.data.state.generatedDocuments
    .slice()
    .sort((left, right) => right.generatedAtISO.localeCompare(left.generatedAtISO))
  const documentScans = cockpit.data.state.scans
    .filter((scan) => scan.sourceKind === "document")
    .slice()
    .sort((left, right) => {
      const leftDate = left.analyzedAtISO ?? left.createdAtISO
      const rightDate = right.analyzedAtISO ?? right.createdAtISO
      return rightDate.localeCompare(leftDate)
    })

  function handleReturnToCockpit() {
    if (!returnTo || !preparedPackKind) return

    const target = new URL(returnTo, window.location.origin)
    target.searchParams.set(
      preparedPackKind === "job-descriptions"
        ? "jobDescriptionPackFlow"
        : preparedPackKind === "hr-procedures"
          ? "hrProcedurePackFlow"
          : preparedPackKind === "reges-correction"
            ? "regesCorrectionFlow"
            : "contractsPackFlow",
      "done"
    )
    target.searchParams.set(
      "evidenceNote",
      preparedPackEvidenceNote ??
        preparedPack?.returnEvidenceNote ??
        preparedPackFallback?.returnEvidenceNote ??
        ""
    )
    if (findingId) {
      target.searchParams.set("sourceFindingId", findingId)
    }

    router.push(`${target.pathname}?${target.searchParams.toString()}`)
  }

  return (
    <div className="space-y-8">
      <V3PageHero
        breadcrumbs={[{ label: "Dashboard" }, { label: isSolo ? "Documente" : "Documente asistate", current: true }]}
        title={isSolo ? "Politici și documente scanate" : "Documente generate și arhivă scanată"}
        description={
          isSolo
            ? "Aici găsești într-un singur loc politicile generate și documentele scanate. Intri în detaliu doar când vrei să continui analiza sau exportul."
            : "Suprafața asta grupează documentele generate și arhiva scanărilor, fără să dubleze fluxurile din Scanează și Rapoarte."
        }
        eyebrowBadges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              {generatedDocuments.length} documente generate
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              {documentScans.length} documente scanate
            </Badge>
          </>
        }
        actions={
          <>
            <Button asChild variant="outline" size="sm">
              <Link href={dashboardRoutes.auditorVault}>
                <FolderOpen className="mr-1.5 size-3.5" />
                Vault audit
              </Link>
            </Button>
            <Button asChild size="sm">
              <Link href={dashboardRoutes.generator}>
                <Sparkles className="mr-1.5 size-3.5" />
                Generator
              </Link>
            </Button>
          </>
        }
      />

      {preparedPackKind && preparedPackFallback && (
        <Card className="border-eos-primary/30 bg-eos-primary/[0.06]">
          <CardHeader className="border-b border-eos-border-subtle pb-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-eos-primary">
                  CompliAI a pregătit pentru tine
                </p>
                <CardTitle className="flex items-center gap-2 text-base">
                  <BriefcaseBusiness className="size-4 text-eos-primary" />
                  {preparedPack?.title ?? preparedPackFallback.title}
                </CardTitle>
                <p className="max-w-3xl text-sm text-eos-text-muted">
                  {preparedPack?.summary ?? preparedPackFallback.summary}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link
                    href={`${dashboardRoutes.generator}?documentType=${
                      preparedPack?.generatorDocumentType ?? preparedPackFallback.generatorDocumentType
                    }`}
                  >
                    <Sparkles className="mr-1.5 size-3.5" />
                    {preparedPack?.generatorLabel ?? preparedPackFallback.generatorLabel}
                  </Link>
                </Button>
                {returnTo ? (
                  <Button size="sm" onClick={handleReturnToCockpit}>
                    Folosește materialele și revino în cockpit
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {preparedPackLoading ? (
              <div className="flex items-center gap-2 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3 text-sm text-eos-text-muted">
                <Loader2 className="size-4 animate-spin" />
                {preparedPackFallback.loadingLabel}
              </div>
            ) : preparedPackError ? (
              <div className="rounded-eos-lg border border-eos-danger/30 bg-eos-danger/[0.08] px-4 py-3 text-sm text-eos-text">
                {preparedPackError}
              </div>
            ) : preparedPack ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="normal-case tracking-normal">
                    {preparedPack.assets.length} materiale pregătite
                  </Badge>
                  <Badge variant="outline" className="normal-case tracking-normal">
                    {preparedPack.completionChecklist.length} confirmări minime
                  </Badge>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {preparedPack.assets.map((asset) => (
                    <Card key={asset.id} className="border-eos-border bg-eos-surface">
                      <CardHeader className="border-b border-eos-border-subtle pb-3">
                        <CardTitle className="text-sm">{asset.title}</CardTitle>
                        <p className="text-xs text-eos-text-muted">{asset.summary}</p>
                      </CardHeader>
                      <CardContent className="pt-3">
                        <pre className="max-h-72 overflow-auto whitespace-pre-wrap text-xs leading-6 text-eos-text-muted">
                          {asset.content}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {preparedPackKind === "reges-correction" ? (
                  <HrRegesReconciliationCard
                    findingId={findingId}
                    onEvidenceNoteChange={setPreparedPackEvidenceNote}
                  />
                ) : null}

                <Card className="border-eos-border bg-eos-surface">
                  <CardHeader className="border-b border-eos-border-subtle pb-3">
                    <CardTitle className="text-sm">Ce trebuie să confirmi înainte să închizi cazul</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-3">
                    <ul className="space-y-2 text-sm text-eos-text-muted">
                      {preparedPack.completionChecklist.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span className="mt-1 size-1.5 shrink-0 rounded-full bg-eos-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </>
            ) : null}
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">
            <Sparkles className="mr-1.5 size-3.5" />
            Generează
          </TabsTrigger>
          <TabsTrigger value="generated">
            <BookOpen className="mr-1.5 size-3.5" />
            Politici generate
          </TabsTrigger>
          <TabsTrigger value="scanned">Documente scanate</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CookieBannerCard />
            {QUICK_DOC_TYPES.map((doc) => (
              <Link
                key={doc.id}
                href={`${dashboardRoutes.generator}?documentType=${doc.id}`}
                className="flex items-start gap-3 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3.5 transition-all hover:border-eos-primary/40 hover:bg-eos-surface-hover"
              >
                <span className="text-2xl leading-none">{doc.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-eos-text">{doc.label}</p>
                  <p className="mt-0.5 text-xs text-eos-text-muted">{doc.desc}</p>
                </div>
                <ArrowRight className="mt-0.5 size-4 shrink-0 text-eos-text-tertiary" />
              </Link>
            ))}
            <Link
              href={dashboardRoutes.generator}
              className="flex items-center justify-center gap-2 rounded-eos-lg border border-dashed border-eos-border px-4 py-3.5 text-sm text-eos-text-muted transition-all hover:border-eos-primary/40 hover:text-eos-text"
            >
              <Sparkles className="size-4" />
              Toate tipurile de documente
            </Link>
          </div>
        </TabsContent>

        <TabsContent value="generated">
          {generatedDocuments.length === 0 ? (
            <EmptyState
              title="Nu există documente generate"
              label="Generează primul document asistat — Politică de confidențialitate, DPA sau Politică Internă."
              className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-10"
              actions={
                <Button asChild size="sm">
                  <Link href={dashboardRoutes.generator}>Mergi la Generator</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {generatedDocuments.map((document) => (
                <Card key={document.id} className="border-eos-border bg-eos-surface">
                  <CardHeader className="border-b border-eos-border-subtle pb-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base">{document.title}</CardTitle>
                        <p className="mt-1 text-sm text-eos-text-muted">
                          {document.documentType} · {new Date(document.generatedAtISO).toLocaleString("ro-RO")}
                        </p>
                      </div>
                      <Badge
                        variant={document.llmUsed ? "secondary" : "outline"}
                        className="normal-case tracking-normal"
                      >
                        {document.llmUsed ? "asistat" : "standard"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Button asChild variant="outline" size="sm">
                      <Link href={dashboardRoutes.policies}>Vezi în Politici</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scanned">
          {documentScans.length === 0 ? (
            <EmptyState
              title="Nu există documente scanate"
              label="Încarcă primul document din Scanează pentru a porni istoricul firmei."
              className="rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-10"
            />
          ) : (
            <div className="space-y-4">
              {documentScans.map((scan) => (
                <Card key={scan.id} className="border-eos-border bg-eos-surface">
                  <CardContent className="flex flex-wrap items-center gap-4 px-5 py-4">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-eos-text">{scan.documentName}</p>
                      <p className="mt-1 text-xs text-eos-text-muted">
                        {new Date(scan.analyzedAtISO ?? scan.createdAtISO).toLocaleString("ro-RO")} · {scan.findingsCount} findings
                      </p>
                    </div>
                    <Button asChild variant="outline" size="sm">
                      <Link href={dashboardScanResultsRoute(scan.id)}>Deschide rezultatul</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
