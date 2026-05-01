"use client"

// Pay Transparency — Public employee portal form
// Folosit pe /employee-portal/[token] (NO auth)

import { useState } from "react"
import { CheckCircle2, Loader2, Send } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type Question =
  | "own_salary"
  | "average_salary_role"
  | "gender_pay_gap"
  | "promotion_criteria"
  | "other"

const QUESTION_OPTIONS: { id: Question; label: string; description: string }[] = [
  {
    id: "own_salary",
    label: "Vreau informații despre salariul meu",
    description: "Detalii privind componentele salariului tău (de bază, bonusuri, beneficii).",
  },
  {
    id: "average_salary_role",
    label: "Salariul mediu pe rolul meu",
    description:
      "Grila salarială pentru rolul tău, pe niveluri (junior/mid/senior). Date agregate, nu individuale.",
  },
  {
    id: "gender_pay_gap",
    label: "Ecart salarial de gen pentru rolul meu",
    description:
      "Procent ecart între salariile bărbaților și femeilor pe același rol. Date agregate.",
  },
  {
    id: "promotion_criteria",
    label: "Criterii de promovare",
    description: "Cum se decid promovările și creșterile salariale pentru rolul tău.",
  },
  {
    id: "other",
    label: "Altă întrebare",
    description: "Detaliază în câmpul de mai jos.",
  },
]

type SubmitResponse = {
  ok: boolean
  requestId?: string
  requestToken?: string
  receivedAtISO?: string
  deadlineISO?: string
  message?: string
  error?: string
}

export function EmployeePortalForm({ token }: { token: string }) {
  const [jobRole, setJobRole] = useState("")
  const [question, setQuestion] = useState<Question | "">("")
  const [detail, setDetail] = useState("")
  const [employeeName, setEmployeeName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [submitted, setSubmitted] = useState<{
    requestToken: string
    deadlineISO: string
  } | null>(null)

  async function submit() {
    if (!jobRole.trim() || !question) {
      toast.error("Completează cel puțin rolul și întrebarea.")
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`/api/pay-transparency/requests/portal/${encodeURIComponent(token)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobRole: jobRole.trim(),
          question,
          detail: detail.trim() || undefined,
          employeeName: employeeName.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
        }),
      })
      const d: SubmitResponse = await r.json()
      if (!r.ok) throw new Error(d.error ?? "Eroare la trimiterea cererii.")
      if (d.requestToken && d.deadlineISO) {
        setSubmitted({ requestToken: d.requestToken, deadlineISO: d.deadlineISO })
        toast.success("Cerere trimisă")
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare")
    } finally {
      setBusy(false)
    }
  }

  if (submitted) {
    const deadline = new Date(submitted.deadlineISO).toLocaleDateString("ro-RO")
    return (
      <Card className="border-eos-success/30 bg-eos-success/5">
        <CardContent className="space-y-4 py-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-6 text-eos-success" />
            <p className="text-base font-semibold text-eos-text">Cerere trimisă cu succes</p>
          </div>
          <p className="text-sm text-eos-text">
            Vei primi răspunsul cel târziu pe <strong>{deadline}</strong> (30 de zile calendaristice
            de la data trimiterii).
          </p>
          <div className="rounded-eos-md border border-eos-border bg-eos-surface p-3">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-eos-text-muted">
              Cod cerere (păstrează pentru tracking)
            </p>
            <p className="mt-1 break-all font-mono text-xs text-eos-text">
              {submitted.requestToken}
            </p>
          </div>
          <p className="text-xs text-eos-text-muted">
            Salvează codul. Cu el poți reveni pe această pagină pentru a vedea statusul cererii.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-eos-border bg-eos-surface">
      <CardHeader>
        <CardTitle className="text-base">Formular cerere</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Job role */}
        <div>
          <label className="mb-1 block text-sm font-medium text-eos-text">
            Rolul tău <span className="text-eos-error">*</span>
          </label>
          <input
            type="text"
            placeholder="ex: Marketing Specialist"
            className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
          />
        </div>

        {/* Question */}
        <div>
          <p className="mb-2 text-sm font-medium text-eos-text">
            Despre ce vrei informații? <span className="text-eos-error">*</span>
          </p>
          <div className="space-y-2">
            {QUESTION_OPTIONS.map((opt) => (
              <label
                key={opt.id}
                className={`flex cursor-pointer items-start gap-3 rounded-eos-md border p-3 transition ${
                  question === opt.id
                    ? "border-eos-primary bg-eos-primary/5"
                    : "border-eos-border bg-eos-bg-inset hover:border-eos-border-strong"
                }`}
              >
                <input
                  type="radio"
                  name="question"
                  value={opt.id}
                  checked={question === opt.id}
                  onChange={(e) => setQuestion(e.target.value as Question)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-medium text-eos-text">{opt.label}</p>
                  <p className="mt-0.5 text-xs text-eos-text-muted">{opt.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Detail */}
        <div>
          <label className="mb-1 block text-sm font-medium text-eos-text">
            Detalii suplimentare (opțional)
          </label>
          <textarea
            rows={3}
            placeholder="Specifică ce informații concrete dorești."
            className="w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 py-2 text-sm text-eos-text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </div>

        {/* Optional name + email */}
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-eos-text">
              Numele tău (opțional)
            </label>
            <input
              type="text"
              placeholder="Lasă gol pentru cerere anonimă"
              className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-eos-text">
              Email pentru răspuns (opțional)
            </label>
            <input
              type="email"
              placeholder="email@firma.ro"
              className="h-10 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
            />
          </div>
        </div>

        <Button onClick={() => void submit()} disabled={busy || !jobRole || !question} className="gap-2 w-full">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          Trimite cererea
        </Button>

        <p className="text-[11px] text-eos-text-muted">
          Prin trimitere, confirmi că datele furnizate sunt corecte. Solicitarea va fi tratată
          conform Directivei (UE) 2023/970 și Regulamentului General privind Protecția Datelor
          (GDPR). Răspuns garantat în maximum 30 de zile calendaristice.
        </p>
      </CardContent>
    </Card>
  )
}
