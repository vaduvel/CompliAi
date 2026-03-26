"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CheckSquare,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  Hash,
  Loader2,
  Mail,
  Plus,
  Send,
  Shield,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { useCockpitData } from "@/components/compliscan/use-cockpit"
import { buildDNSCNotificationDraft } from "@/lib/compliance/dnsc-wizard"
import type { DnscRegistrationStatus, Nis2DnscCorrespondence } from "@/lib/server/nis2-store"
import type { ApplicabilityCertainty } from "@/lib/compliance/applicability"
import { ORG_SECTOR_LABELS, ORG_EMPLOYEE_COUNT_LABELS } from "@/lib/compliance/applicability"

type WizardStep = "eligibility" | "data-check" | "platform" | "draft" | "confirm"

const STEPS: WizardStep[] = ["eligibility", "data-check", "platform", "draft", "confirm"]
const STEP_LABELS: Record<WizardStep, string> = {
  eligibility: "Eligibilitate",
  "data-check": "Date necesare",
  platform: "Platforma DNSC",
  draft: "Draft notificare",
  confirm: "Confirmare",
}

function stepIndex(step: WizardStep) {
  return STEPS.indexOf(step) + 1
}

export default function DnscRegistrationPage() {
  const searchParams = useSearchParams()
  const cockpit = useCockpitData()
  const [step, setStep] = useState<WizardStep>("eligibility")
  const [dnscStatus, setDnscStatus] = useState<DnscRegistrationStatus>("not-started")
  const [registrationNumber, setRegistrationNumber] = useState("")
  const [correspondence, setCorrespondence] = useState<Nis2DnscCorrespondence[]>([])
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingNumber, setSavingNumber] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [draftContent, setDraftContent] = useState<string>("")
  const [showAddCorrespondence, setShowAddCorrespondence] = useState(false)
  const [newEntry, setNewEntry] = useState({ date: new Date().toISOString().slice(0, 10), direction: "received" as "sent" | "received", summary: "" })
  const [savingEntry, setSavingEntry] = useState(false)
  const sourceFindingId = searchParams.get("findingId") ?? undefined
  const fromCockpit = searchParams.get("source") === "cockpit" && Boolean(sourceFindingId)

  useEffect(() => {
    fetch("/api/nis2/dnsc-status")
      .then((r) => r.json())
      .then((data: { status: DnscRegistrationStatus; registrationNumber: string | null; correspondence: Nis2DnscCorrespondence[] }) => {
        setDnscStatus(data.status)
        setRegistrationNumber(data.registrationNumber ?? "")
        setCorrespondence(data.correspondence ?? [])
        // Dacă deja confirmed → sari direct la confirmare
        if (data.status === "confirmed") setStep("confirm")
      })
      .catch(() => {})
      .finally(() => setLoadingStatus(false))
  }, [])

  if (cockpit.loading || !cockpit.data || loadingStatus) return <LoadingScreen variant="section" />

  const { data } = cockpit
  const orgName = data.workspace.orgName
  const orgProfile = data.state.orgProfile ?? null
  const applicability = data.state.applicability ?? null

  const nis2Entry = applicability?.entries.find((e) => e.tag === "nis2")
  const nis2Certainty: ApplicabilityCertainty = nis2Entry?.certainty ?? "unlikely"
  const nis2Reason = nis2Entry?.reason ?? "Profilul organizației nu a fost completat."

  async function saveStatus(newStatus: DnscRegistrationStatus) {
    setSaving(true)
    try {
      const r = await fetch("/api/nis2/dnsc-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!r.ok) throw new Error("Eroare la salvare")
      setDnscStatus(newStatus)
    } catch {
      toast.error("Nu s-a putut salva statusul")
    } finally {
      setSaving(false)
    }
  }

  async function saveRegistrationNumber() {
    if (!registrationNumber.trim()) return
    setSavingNumber(true)
    try {
      await fetch("/api/nis2/dnsc-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber }),
      })
      toast.success("Număr înregistrare salvat")
    } catch {
      toast.error("Nu s-a putut salva numărul")
    } finally {
      setSavingNumber(false)
    }
  }

  async function addCorrespondenceEntry() {
    if (!newEntry.summary.trim()) return
    setSavingEntry(true)
    try {
      const r = await fetch("/api/nis2/dnsc-correspondence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newEntry),
      })
      const data = (await r.json()) as { correspondence: Nis2DnscCorrespondence[] }
      setCorrespondence(data.correspondence)
      setNewEntry({ date: new Date().toISOString().slice(0, 10), direction: "received", summary: "" })
      setShowAddCorrespondence(false)
    } catch {
      toast.error("Nu s-a putut adăuga înregistrarea")
    } finally {
      setSavingEntry(false)
    }
  }

  async function deleteCorrespondenceEntry(id: string) {
    try {
      const r = await fetch(`/api/nis2/dnsc-correspondence?id=${id}`, { method: "DELETE" })
      const data = (await r.json()) as { correspondence: Nis2DnscCorrespondence[] }
      setCorrespondence(data.correspondence)
    } catch {
      toast.error("Nu s-a putut șterge înregistrarea")
    }
  }

  function goTo(target: WizardStep) {
    setStep(target)
    // Dacă avansăm la "platform" → marcăm in-progress
    if (target === "platform" && dnscStatus === "not-started") {
      void saveStatus("in-progress")
    }
  }

  function generateDraft() {
    const content = buildDNSCNotificationDraft({ orgName, orgProfile })
    setDraftContent(content)
    goTo("draft")
  }

  async function downloadDraftPdf() {
    if (!draftContent) return
    setDownloading(true)
    try {
      const r = await fetch("/api/documents/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: draftContent,
          orgName,
          documentType: "Notificare DNSC NIS2",
        }),
      })
      if (!r.ok) throw new Error("Eroare export PDF")
      const blob = await r.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `notificare-dnsc-nis2-${new Date().toISOString().split("T")[0]}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Nu s-a putut genera PDF-ul")
    } finally {
      setDownloading(false)
    }
  }

  function downloadDraftMd() {
    if (!draftContent) return
    const blob = new Blob([draftContent], { type: "text/markdown;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notificare-dnsc-nis2-${new Date().toISOString().split("T")[0]}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleConfirmed() {
    await saveStatus("confirmed")
    toast.success("Înregistrare marcată ca trimisă!", {
      description: "Statusul a fost actualizat. DNSC va procesa notificarea.",
    })
  }

  // ── Bară progress ──────────────────────────────────────────────────────────
  const currentIdx = stepIndex(step)

  return (
    <div className="space-y-8">
      {fromCockpit ? (
        <div className="flex items-start gap-3 rounded-lg border border-eos-warning/30 bg-eos-warning/5 px-4 py-3">
          <Shield className="mt-0.5 size-4 shrink-0 text-eos-warning" strokeWidth={2} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-eos-text">
              Wizardul DNSC este deschis din cockpit
            </p>
            <p className="mt-0.5 text-xs text-eos-text-muted">
              Parcurge eligibilitatea, datele și confirmarea trimiterii către DNSC, apoi întoarce-te în același finding cu dovada pregătită.
            </p>
          </div>
          <Link
            href={`/dashboard/resolve/${sourceFindingId}`}
            className="shrink-0 text-xs text-eos-primary hover:underline"
          >
            Înapoi la finding
          </Link>
        </div>
      ) : null}

      <PageIntro
        eyebrow="NIS2 · Înregistrare DNSC"
        title="Wizard de înregistrare la DNSC"
        description="Ghid pas cu pas pentru notificarea obligatorie conform Directivei NIS2 (Legea 58/2023)."
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              Pas {currentIdx} / {STEPS.length}
            </Badge>
            {dnscStatus === "confirmed" ? (
              <Badge dot variant="success" className="normal-case tracking-normal">
                Trimis
              </Badge>
            ) : dnscStatus === "submitted" ? (
              <Badge dot variant="warning" className="normal-case tracking-normal">
                În așteptare confirmare
              </Badge>
            ) : dnscStatus === "in-progress" ? (
              <Badge dot variant="warning" className="normal-case tracking-normal">
                În progres
              </Badge>
            ) : (
              <Badge dot variant="outline" className="normal-case tracking-normal">
                Neînceput
              </Badge>
            )}
          </>
        }
      />

      {/* Progress bar */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                i + 1 < currentIdx
                  ? "border-eos-primary bg-eos-primary text-eos-primary-text"
                  : i + 1 === currentIdx
                    ? "border-eos-primary bg-eos-primary-soft text-eos-primary"
                    : "border-eos-border bg-eos-surface text-eos-text-muted"
              }`}
            >
              {i + 1 < currentIdx ? <CheckCircle2 className="size-4" strokeWidth={2} /> : i + 1}
            </div>
            <span
              className={`hidden text-xs sm:block ${
                i + 1 === currentIdx ? "font-medium text-eos-text" : "text-eos-text-muted"
              }`}
            >
              {STEP_LABELS[s]}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-4 flex-shrink-0 sm:w-8 ${
                  i + 1 < currentIdx ? "bg-eos-primary" : "bg-eos-border-subtle"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Pas 1: Eligibilitate ───────────────────────────────────────────────── */}
      {step === "eligibility" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-eos-primary" strokeWidth={2} />
              Verificare eligibilitate NIS2
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div
              className={`rounded-eos-md border p-4 ${
                nis2Certainty === "certain"
                  ? "border-eos-success-border bg-eos-success-soft"
                  : nis2Certainty === "probable"
                    ? "border-eos-warning-border bg-eos-warning-soft"
                    : "border-eos-border bg-eos-surface-variant"
              }`}
            >
              <div className="flex items-center gap-2">
                {nis2Certainty === "certain" || nis2Certainty === "probable" ? (
                  <CheckCircle2
                    className={`size-5 ${nis2Certainty === "certain" ? "text-eos-success" : "text-eos-warning"}`}
                    strokeWidth={2}
                  />
                ) : (
                  <AlertTriangle className="size-5 text-eos-text-muted" strokeWidth={2} />
                )}
                <span className="font-medium text-eos-text">
                  {nis2Certainty === "certain"
                    ? "NIS2 se aplică organizației tale"
                    : nis2Certainty === "probable"
                      ? "NIS2 se aplică probabil organizației tale"
                      : "NIS2 pare să nu se aplice (verifică manual)"}
                </span>
              </div>
              <p className="mt-2 text-sm text-eos-text-muted">{nis2Reason}</p>
            </div>

            {!orgProfile && (
              <div className="rounded-eos-md border border-eos-warning-border bg-eos-warning-soft p-4 text-sm text-eos-text">
                <strong>Profilul organizației nu este completat.</strong> Completează-l pentru
                analiză precisă. Poți continua oricum — draft-ul va fi parțial pre-completat.
              </div>
            )}

            <div className="text-sm text-eos-text-muted leading-relaxed">
              <strong className="text-eos-text">Termenul de înregistrare:</strong> Entitățile NIS2
              din România aveau obligația să se înregistreze la DNSC până în{" "}
              <strong className="text-eos-warning">septembrie 2025</strong>. Dacă nu ați făcut-o,
              faceți-o acum pentru a evita sancțiunile.
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/nis2">
                  <ArrowLeft className="size-4" strokeWidth={2} />
                  Înapoi la NIS2
                </Link>
              </Button>
              <Button size="sm" className="gap-2" onClick={() => goTo("data-check")}>
                {nis2Certainty === "unlikely" ? "Verific oricum" : "Continuă"}
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pas 2: Date necesare ───────────────────────────────────────────────── */}
      {step === "data-check" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-5 text-eos-primary" strokeWidth={2} />
              Date necesare pentru înregistrare
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-eos-text-muted">
              Verifică că ai aceste informații la îndemână înainte de a completa formularul pe
              platforma DNSC. Cele marcate cu ✅ sunt deja în profilul tău.
            </p>

            <div className="space-y-3">
              {[
                {
                  label: "Denumire completă organizație",
                  value: orgName,
                  ok: !!orgName,
                  hint: orgName,
                },
                {
                  label: "CUI / Cod fiscal",
                  value: orgProfile?.cui,
                  ok: !!orgProfile?.cui,
                  hint: orgProfile?.cui ?? "Adaugă CUI în profilul organizației",
                },
                {
                  label: "Sector de activitate NIS2",
                  value: orgProfile?.sector ? ORG_SECTOR_LABELS[orgProfile.sector] : null,
                  ok: !!orgProfile?.sector,
                  hint: orgProfile?.sector
                    ? ORG_SECTOR_LABELS[orgProfile.sector]
                    : "Completează profilul organizației",
                },
                {
                  label: "Dimensiune organizație",
                  value: orgProfile?.employeeCount
                    ? ORG_EMPLOYEE_COUNT_LABELS[orgProfile.employeeCount]
                    : null,
                  ok: !!orgProfile?.employeeCount,
                  hint: orgProfile?.employeeCount
                    ? ORG_EMPLOYEE_COUNT_LABELS[orgProfile.employeeCount]
                    : "Completează profilul organizației",
                },
                {
                  label: "Persoană responsabilă securitate + email + telefon",
                  value: null,
                  ok: false,
                  hint: "De completat manual pe platforma DNSC",
                },
                {
                  label: "Adresă sediu social + județ",
                  value: null,
                  ok: false,
                  hint: "De completat manual pe platforma DNSC",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-start gap-3 rounded-eos-md border border-eos-border bg-eos-surface-variant p-3"
                >
                  <CheckSquare
                    className={`mt-0.5 size-4 shrink-0 ${item.ok ? "text-eos-success" : "text-eos-text-muted"}`}
                    strokeWidth={2}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-eos-text">{item.label}</p>
                    <p className="mt-0.5 text-xs text-eos-text-muted">{item.hint}</p>
                  </div>
                  {item.ok && (
                    <Badge variant="success" className="shrink-0 text-xs normal-case">
                      ✓ disponibil
                    </Badge>
                  )}
                </div>
              ))}
            </div>

            {!orgProfile?.cui && (
              <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-sm text-eos-text-muted">
                Lipsește CUI-ul?{" "}
                <Link href="/dashboard" className="text-eos-primary underline underline-offset-2">
                  Completează profilul organizației
                </Link>{" "}
                și întoarce-te aici.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => goTo("eligibility")}>
                <ArrowLeft className="size-4" strokeWidth={2} />
                Înapoi
              </Button>
              <Button size="sm" className="gap-2" onClick={() => goTo("platform")}>
                Am înțeles, continuă
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pas 3: Platforma DNSC ─────────────────────────────────────────────── */}
      {step === "platform" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="size-5 text-eos-primary" strokeWidth={2} />
              Platforma NIS2@RO — DNSC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-sm text-eos-text-muted leading-relaxed">
              Înregistrarea oficială se face pe platforma DNSC. Generează mai întâi draft-ul cu
              datele tale pre-completate, apoi urmează pașii de pe platformă.
            </p>

            <div className="space-y-3">
              {[
                {
                  step: "1",
                  text: "Accesează platforma oficială DNSC",
                  link: "https://nis2.dnsc.ro",
                  linkLabel: "nis2.dnsc.ro →",
                },
                {
                  step: "2",
                  text: 'Creează cont sau autentifică-te cu certificat digital / user-parolă',
                },
                {
                  step: "3",
                  text: 'Completează formularul "Înregistrare entitate NIS2" cu datele din pasul anterior',
                },
                {
                  step: "4",
                  text: "Atașează documentele suport dacă sunt solicitate (organigramă, politică securitate)",
                },
                {
                  step: "5",
                  text: 'Trimite formularul și salvează numărul de înregistrare primit',
                },
              ].map((item) => (
                <div key={item.step} className="flex gap-3 rounded-eos-md border border-eos-border p-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-eos-primary text-[11px] font-bold text-eos-primary-text">
                    {item.step}
                  </span>
                  <div>
                    <p className="text-sm text-eos-text">{item.text}</p>
                    {item.link && (
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-eos-primary underline underline-offset-2"
                      >
                        {item.linkLabel}
                        <ExternalLink className="size-3" strokeWidth={2} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => goTo("data-check")}>
                <ArrowLeft className="size-4" strokeWidth={2} />
                Înapoi
              </Button>
              <Button size="sm" className="gap-2" onClick={generateDraft}>
                Generează draft notificare
                <FileText className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pas 4: Draft notificare ───────────────────────────────────────────── */}
      {step === "draft" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="size-5 text-eos-primary" strokeWidth={2} />
              Draft notificare NIS2 — DNSC
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-eos-text-muted">
              Draft-ul de mai jos este pre-completat cu datele din profilul tău. Câmpurile marcate
              cu <code className="rounded bg-eos-bg-inset px-1 text-xs">[DE COMPLETAT]</code> trebuie
              completate manual înainte de trimitere.
            </p>

            <div className="max-h-[400px] overflow-y-auto rounded-eos-md border border-eos-border bg-eos-bg-inset p-4">
              <pre className="whitespace-pre-wrap text-xs leading-relaxed text-eos-text">
                {draftContent}
              </pre>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" size="sm" className="gap-2" onClick={() => goTo("platform")}>
                <ArrowLeft className="size-4" strokeWidth={2} />
                Înapoi
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={downloadDraftMd}
              >
                <Download className="size-4" strokeWidth={2} />
                Descarcă .md
              </Button>
              <Button
                size="sm"
                className="gap-2"
                onClick={() => void downloadDraftPdf()}
                disabled={downloading}
              >
                {downloading ? (
                  <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                ) : (
                  <Download className="size-4" strokeWidth={2} />
                )}
                Descarcă PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => goTo("confirm")}
              >
                Continuă
                <ArrowRight className="size-4" strokeWidth={2} />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Pas 5: Confirmare ─────────────────────────────────────────────────── */}
      {step === "confirm" && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="size-5 text-eos-primary" strokeWidth={2} />
              Confirmare și pași următori
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {dnscStatus === "confirmed" ? (
              <div className="rounded-eos-md border border-eos-success-border bg-eos-success-soft p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-5 text-eos-success" strokeWidth={2} />
                  <span className="font-medium text-eos-text">
                    Notificarea a fost marcată ca trimisă la DNSC
                  </span>
                </div>
                <p className="mt-2 text-sm text-eos-text-muted">
                  DNSC va procesa înregistrarea și vă va confirma prin email. Păstrați numărul de
                  înregistrare primit.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-eos-text-muted leading-relaxed">
                  Ai trimis notificarea pe platforma DNSC? Marchează statusul pentru a ține
                  evidența și a opri reamintirile.
                </p>

                <div className="space-y-2">
                  {([
                    { s: "in-progress" as const, label: "Încă lucrez la asta" },
                    { s: "submitted" as const, label: "Am trimis, aștept confirmare" },
                    { s: "confirmed" as const, label: "Am primit confirmare de la DNSC" },
                  ] as const).map((opt) => (
                    <button
                      key={opt.s}
                      type="button"
                      onClick={() => void saveStatus(opt.s)}
                      disabled={saving}
                      className={`flex w-full items-center gap-3 rounded-eos-md border px-4 py-3 text-left text-sm transition hover:border-eos-primary/60 hover:bg-eos-primary-soft ${
                        dnscStatus === opt.s
                          ? "border-eos-primary bg-eos-primary-soft font-medium text-eos-primary"
                          : "border-eos-border bg-eos-surface text-eos-text"
                      }`}
                    >
                      <span
                        className={`size-4 shrink-0 rounded-full border-2 ${
                          dnscStatus === opt.s
                            ? "border-eos-primary bg-eos-primary"
                            : "border-eos-border bg-transparent"
                        }`}
                      />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <Button
                  className="gap-2"
                  onClick={() => void handleConfirmed()}
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <CheckCircle2 className="size-4" strokeWidth={2} />
                  )}
                  Salvează statusul
                </Button>
              </div>
            )}

            <div className="rounded-eos-md border border-eos-border bg-eos-bg-inset p-4 text-sm text-eos-text-muted">
              <p className="font-medium text-eos-text">Obligații post-înregistrare:</p>
              <ul className="mt-2 space-y-1">
                <li>• Raportare incidente în <strong>24h</strong> (avertizare timpurie)</li>
                <li>• Raport complet în <strong>72h</strong></li>
                <li>• Notificare clienți afectați în <strong>1 lună</strong></li>
                <li>• Actualizare anuală a datelor de contact</li>
              </ul>
            </div>

            {/* ── Corespondență DNSC ───────────────────────────────────────── */}
            {(dnscStatus === "submitted" || dnscStatus === "confirmed") && (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-eos-text flex items-center gap-2">
                  <Mail className="size-4 text-eos-primary" strokeWidth={2} />
                  Corespondență DNSC
                </p>

                {/* Număr înregistrare */}
                <div className="flex items-center gap-2">
                  <Hash className="size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Număr înregistrare DNSC (ex: DNSC-2026-00123)"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    className="flex-1 rounded-eos-md border border-eos-border bg-eos-surface px-3 py-1.5 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void saveRegistrationNumber()}
                    disabled={savingNumber || !registrationNumber.trim()}
                  >
                    {savingNumber ? <Loader2 className="size-3.5 animate-spin" /> : "Salvează"}
                  </Button>
                </div>

                {/* Lista corespondență */}
                {correspondence.length > 0 && (
                  <div className="divide-y divide-eos-border-subtle rounded-eos-md border border-eos-border bg-eos-surface">
                    {correspondence.map((entry) => (
                      <div key={entry.id} className="flex items-start gap-3 px-3 py-2.5">
                        <span
                          className={`mt-0.5 shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            entry.direction === "received"
                              ? "bg-eos-primary/10 text-eos-primary"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {entry.direction === "received" ? "Primit" : "Trimis"}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-eos-text-muted">{new Date(entry.date).toLocaleDateString("ro-RO", { day: "2-digit", month: "short", year: "numeric" })}</p>
                          <p className="text-sm text-eos-text">{entry.summary}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void deleteCorrespondenceEntry(entry.id)}
                          className="shrink-0 rounded p-1 text-eos-text-muted hover:bg-eos-surface-variant hover:text-red-500"
                          title="Șterge"
                        >
                          <Trash2 className="size-3.5" strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add entry form */}
                {showAddCorrespondence ? (
                  <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/5 p-3 space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        value={newEntry.date}
                        onChange={(e) => setNewEntry((p) => ({ ...p, date: e.target.value }))}
                        className="rounded-eos-md border border-eos-border bg-eos-surface px-2 py-1 text-xs text-eos-text focus:border-eos-primary focus:outline-none"
                      />
                      <select
                        value={newEntry.direction}
                        onChange={(e) => setNewEntry((p) => ({ ...p, direction: e.target.value as "sent" | "received" }))}
                        className="rounded-eos-md border border-eos-border bg-eos-surface px-2 py-1 text-xs text-eos-text focus:border-eos-primary focus:outline-none"
                      >
                        <option value="received">Primit de la DNSC</option>
                        <option value="sent">Trimis la DNSC</option>
                      </select>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Rezumat (ex: Confirmare înregistrare nr. DNSC-2026-00123)"
                      value={newEntry.summary}
                      onChange={(e) => setNewEntry((p) => ({ ...p, summary: e.target.value }))}
                      className="w-full rounded-eos-md border border-eos-border bg-eos-surface px-3 py-2 text-sm text-eos-text placeholder:text-eos-text-muted focus:border-eos-primary focus:outline-none resize-none"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void addCorrespondenceEntry()} disabled={savingEntry || !newEntry.summary.trim()}>
                        {savingEntry ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                        Adaugă
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setShowAddCorrespondence(false)}>Anulează</Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCorrespondence(true)}
                    className="flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline"
                  >
                    <Plus className="size-3.5" strokeWidth={2.5} />
                    Adaugă corespondență
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {dnscStatus !== "confirmed" && (
                <Button variant="outline" size="sm" className="gap-2" onClick={() => goTo("draft")}>
                  <ArrowLeft className="size-4" strokeWidth={2} />
                  Înapoi la draft
                </Button>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/nis2">
                  Mergi la modulul NIS2
                  <ArrowRight className="size-4 ml-2" strokeWidth={2} />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
