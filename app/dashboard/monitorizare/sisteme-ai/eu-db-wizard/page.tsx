"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Loader2,
  Shield,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import type { AISystemPurpose } from "@/lib/compliance/types"
import type { EUDatabaseEntry } from "@/lib/compliance/ai-act-exporter"

const PURPOSE_LABELS: Record<AISystemPurpose, string> = {
  "hr-screening": "HR Screening / Recrutare",
  "credit-scoring": "Credit Scoring / Evaluare creditară",
  "biometric-identification": "Identificare biometrică",
  "fraud-detection": "Detectare fraudă",
  "marketing-personalization": "Personalizare marketing",
  "support-chatbot": "Chatbot suport",
  "document-assistant": "Asistent documente",
  "other": "Altul",
}

type WizardStep = 1 | 2 | 3 | 4

export default function EUDatabaseWizardPage() {
  const [step, setStep] = useState<WizardStep>(1)
  const [loading, setLoading] = useState(false)
  const [entry, setEntry] = useState<EUDatabaseEntry | null>(null)

  const [form, setForm] = useState({
    systemName: "",
    purpose: "other" as AISystemPurpose,
    description: "",
    orgName: "",
    orgAddress: "",
    orgEmail: "",
    memberStates: "RO",
    humanOversightMeasures: "",
  })

  async function handleGenerate() {
    setLoading(true)
    try {
      const res = await fetch("/api/ai-act/prepare-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          memberStates: form.memberStates.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Eroare")
      }
      const { entry: e } = await res.json()
      setEntry(e)
      setStep(3)
    } catch (err) {
      toast.error("Eroare la generare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setLoading(false)
    }
  }

  function copyJSON() {
    if (!entry) return
    navigator.clipboard.writeText(JSON.stringify(entry, null, 2))
    toast.success("JSON copiat în clipboard")
  }

  function downloadJSON() {
    if (!entry) return
    const blob = new Blob([JSON.stringify(entry, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `eu-ai-database-${entry.systemName.toLowerCase().replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-6">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/monitorizare/sisteme-ai" className="text-xs text-eos-text-muted hover:text-eos-text">
          <ArrowLeft className="inline size-3.5" /> Inventar AI
        </Link>
      </div>

      <PageIntro
        title="Înregistrare EU AI Database"
        description="Wizard pentru pregătirea înregistrării sistemului AI high-risk conform Art. 71 AI Act. Deadline: 2 august 2026."
      />

      {/* Stepper */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-1.5 flex-1 rounded-full ${
              s < step ? "bg-eos-success" : s === step ? "bg-eos-primary" : "bg-eos-surface-variant"
            }`}
          />
        ))}
      </div>

      {/* Step 1: System data */}
      {step === 1 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Pas 1: Datele sistemului AI</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Numele sistemului</label>
              <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" placeholder="HR Scorer, Chatbot Intern..." value={form.systemName} onChange={(e) => setForm((p) => ({ ...p, systemName: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Scop / Categorie</label>
              <select className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={form.purpose} onChange={(e) => setForm((p) => ({ ...p, purpose: e.target.value as AISystemPurpose }))}>
                {Object.entries(PURPOSE_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Descriere sistem</label>
              <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" rows={3} placeholder="Ce face sistemul, ce date procesează..." value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="flex justify-end">
              <Button size="sm" className="gap-2" onClick={() => setStep(2)} disabled={!form.systemName.trim()}>
                Continuă <ArrowRight className="size-3.5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Provider + deployment */}
      {step === 2 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Pas 2: Provider și deployment</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Numele organizației</label>
                <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={form.orgName} onChange={(e) => setForm((p) => ({ ...p, orgName: e.target.value }))} />
              </div>
              <div>
                <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Email contact</label>
                <input type="email" className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={form.orgEmail} onChange={(e) => setForm((p) => ({ ...p, orgEmail: e.target.value }))} />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Adresa sediului social</label>
              <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" value={form.orgAddress} onChange={(e) => setForm((p) => ({ ...p, orgAddress: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">State membre UE (unde e folosit sistemul)</label>
              <input className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" placeholder="RO, DE, FR" value={form.memberStates} onChange={(e) => setForm((p) => ({ ...p, memberStates: e.target.value }))} />
            </div>
            <div>
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-eos-text-muted">Măsuri de supraveghere umană (human oversight)</label>
              <textarea className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-xs text-eos-text" rows={2} placeholder="Confirmare umană obligatorie, audit periodic..." value={form.humanOversightMeasures} onChange={(e) => setForm((p) => ({ ...p, humanOversightMeasures: e.target.value }))} />
            </div>
            <div className="flex justify-between">
              <Button size="sm" variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="size-3.5" /> Înapoi
              </Button>
              <Button size="sm" className="gap-2" onClick={handleGenerate} disabled={loading}>
                {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Shield className="size-3.5" />}
                Generează JSON
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Preview + missing fields */}
      {step === 3 && entry && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              Pas 3: Preview înregistrare
              <Badge variant={entry.completenessPercent >= 80 ? "success" : "warning"}>
                {entry.completenessPercent}% completat
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {entry.missingFields.length > 0 && (
              <div className="rounded-eos-md border border-eos-warning/20 bg-eos-warning-soft/50 px-3 py-2">
                <p className="text-[10px] font-medium uppercase text-eos-warning">Câmpuri lipsă</p>
                <ul className="mt-1 space-y-0.5">
                  {entry.missingFields.map((f) => (
                    <li key={f} className="text-xs text-eos-warning">• {f}</li>
                  ))}
                </ul>
              </div>
            )}

            <pre className="max-h-80 overflow-auto rounded-eos-md border border-eos-border bg-eos-bg-inset p-3 text-[11px] text-eos-text">
              {JSON.stringify(entry, null, 2)}
            </pre>

            <div className="flex justify-between">
              <Button size="sm" variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="size-3.5" /> Editează
              </Button>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-2" onClick={copyJSON}>
                  <ClipboardCopy className="size-3.5" /> Copiază JSON
                </Button>
                <Button size="sm" variant="outline" className="gap-2" onClick={downloadJSON}>
                  <Download className="size-3.5" /> Descarcă
                </Button>
                <Button size="sm" className="gap-2" onClick={() => setStep(4)}>
                  Continuă <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Submit instructions */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <CheckCircle2 className="size-4 text-eos-success" />
              Pas 4: Instrucțiuni de submit
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Sprint 10: Boundary clarity — legal safety */}
            <div className="rounded-eos-md border border-eos-error/20 bg-eos-error-soft/50 px-4 py-3 space-y-1">
              <p className="text-xs font-semibold text-eos-error">Limitele acestui instrument</p>
              <p className="text-xs text-eos-error">
                JSON-ul generat este un <strong>draft de pregătire</strong>, nu o înregistrare validată oficial.
                CompliScan nu este certificat ca organism de evaluare a conformității EU AI Act.
                Înainte de submit, documentația trebuie verificată de un expert legal sau consultant
                certificat în AI Act.
              </p>
            </div>

            <div className="rounded-eos-md border border-eos-primary/30 bg-eos-primary/5 px-4 py-3 space-y-2">
              <p className="text-xs font-semibold text-eos-text">Pași pentru submit MANUAL pe EU AI Database:</p>
              <ol className="list-decimal pl-4 space-y-1 text-xs text-eos-text-muted">
                <li>Verifică documentația tehnică Annex IV (descarcă din inventar)</li>
                <li>Consultă un expert legal pentru validarea clasificării de risc</li>
                <li>Accesează platforma EU AI Database (euaidb.eu)</li>
                <li>Autentifică-te cu credențialele organizației</li>
                <li>Selectează &quot;Register a new AI system&quot; (buton în interfața EU AI Database) și completează cu datele din JSON</li>
                <li>Verifică toate câmpurile, atașează Annex IV și trimite formularul</li>
              </ol>
            </div>

            <div className="rounded-eos-md border border-eos-warning/20 bg-eos-warning-soft/50 px-4 py-3">
              <p className="text-xs font-semibold text-eos-warning">Important</p>
              <p className="mt-1 text-xs text-eos-warning">
                CompliScan NU trimite automat la EU AI Database. Submiterea este responsabilitatea organizației.
                Deadline pentru sisteme high-risk existente: <strong>2 august 2026</strong>.
              </p>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="gap-2" onClick={copyJSON}>
                <ClipboardCopy className="size-3.5" /> Copiază JSON
              </Button>
              <Button size="sm" variant="outline" className="gap-2" onClick={downloadJSON}>
                <Download className="size-3.5" /> Descarcă JSON
              </Button>
            </div>

            <div className="flex justify-between pt-2">
              <Button size="sm" variant="outline" onClick={() => setStep(3)}>
                <ArrowLeft className="size-3.5" /> Înapoi la preview
              </Button>
              <Link href="/dashboard/monitorizare/sisteme-ai">
                <Button size="sm" variant="outline">Înapoi la inventar</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
