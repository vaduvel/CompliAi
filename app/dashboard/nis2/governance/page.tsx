"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  Trash2,
  Users,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/evidence-os/Badge"
import { Breadcrumb } from "@/components/evidence-os"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import type { BoardMember } from "@/lib/server/nis2-store"

// ── Helpers ────────────────────────────────────────────────────────────────────

function trainingStatus(member: BoardMember): { label: string; expired: boolean; missing: boolean } {
  if (!member.nis2TrainingCompleted) return { label: "Lipsă", expired: false, missing: true }
  const expiry = member.nis2TrainingExpiry
  if (expiry && new Date(expiry).getTime() < Date.now()) {
    return { label: `Expirat ${expiry.slice(0, 10)}`, expired: true, missing: false }
  }
  return { label: `${member.nis2TrainingCompleted.slice(0, 10)}`, expired: false, missing: false }
}

function certStatus(member: BoardMember): { label: string; expired: boolean } | null {
  if (!member.cisoCertification) return null
  const expiry = member.cisoCertExpiry
  if (expiry && new Date(expiry).getTime() < Date.now()) {
    return { label: `${member.cisoCertification} — Expirat ${expiry.slice(0, 10)}`, expired: true }
  }
  if (expiry) {
    return { label: `${member.cisoCertification} (până ${expiry.slice(0, 10)})`, expired: false }
  }
  return { label: member.cisoCertification, expired: false }
}

function TrainingBadge({ status }: { status: ReturnType<typeof trainingStatus> }) {
  if (status.missing) return <Badge variant="destructive">Lipsă</Badge>
  if (status.expired) return <Badge variant="warning">Expirat</Badge>
  return <Badge variant="success">Completat</Badge>
}

function deriveGovernanceMemberId(findingId?: string | null) {
  if (!findingId) return ""
  const prefixes = [
    "nis2-gov-training-expired-",
    "nis2-gov-training-",
    "nis2-gov-cert-expired-",
  ]
  for (const prefix of prefixes) {
    if (findingId.startsWith(prefix)) {
      return findingId.slice(prefix.length)
    }
  }
  return ""
}

// ── Add member form ────────────────────────────────────────────────────────────

const ROLE_SUGGESTIONS = [
  "Administrator",
  "Director General",
  "Director IT",
  "CISO",
  "Responsabil Securitate",
  "Director Financiar",
  "Director Operațional",
]

const CERT_OPTIONS = [
  "",
  "CISA",
  "CISSP",
  "CISM",
  "CompTIA Security+",
  "CEH",
  "ISO 27001 Lead Auditor",
  "ISO 27001 Lead Implementer",
]

type FormState = {
  name: string
  role: string
  nis2TrainingCompleted: string
  cisoCertification: string
  cisoCertExpiry: string
  notes: string
}

const emptyForm = (): FormState => ({
  name: "",
  role: "",
  nis2TrainingCompleted: "",
  cisoCertification: "",
  cisoCertExpiry: "",
  notes: "",
})

// ── Main page ──────────────────────────────────────────────────────────────────

export default function GovernancePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const findingId = searchParams.get("findingId")?.trim()
  const returnTo = searchParams.get("returnTo")?.trim()
  const source = (searchParams.get("source") ?? searchParams.get("from") ?? "").toLowerCase()
  const openedFromCockpit = Boolean(findingId) && (source.includes("cockpit") || source.includes("resolve"))
  const focus = (searchParams.get("focus") ?? "").toLowerCase()
  const focusCopy =
    focus === "certification"
      ? "Actualizează aici certificarea sau expirarea CISO, apoi întoarce-te în cockpit cu registrul salvat."
      : "Actualizează aici training-ul sau contextul boardului, apoi întoarce-te în cockpit cu registrul salvat."

  const [members, setMembers] = useState<BoardMember[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm())
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [inlineTrainingDate, setInlineTrainingDate] = useState("")
  const [inlineCertification, setInlineCertification] = useState("")
  const [inlineCertExpiry, setInlineCertExpiry] = useState("")
  const [inlineSaving, setInlineSaving] = useState(false)

  useEffect(() => {
    fetch("/api/nis2/governance", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { members: BoardMember[] }) => setMembers(d.members ?? []))
      .catch(() => null)
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!form.name.trim() || !form.role.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/nis2/governance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          role: form.role.trim(),
          ...(form.nis2TrainingCompleted && { nis2TrainingCompleted: form.nis2TrainingCompleted }),
          ...(form.cisoCertification && { cisoCertification: form.cisoCertification }),
          ...(form.cisoCertExpiry && { cisoCertExpiry: form.cisoCertExpiry }),
          ...(form.notes.trim() && { notes: form.notes.trim() }),
        }),
      })
      const data = (await res.json()) as { member?: BoardMember; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Eroare la creare.")
      setMembers((prev) => [data.member!, ...prev])
      setForm(emptyForm())
      setShowForm(false)
      toast.success(`${form.name} adăugat în registrul de guvernanță`)
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete(id: string, name: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/nis2/governance/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Ștergerea a eșuat.")
      setMembers((prev) => prev.filter((m) => m.id !== id))
      toast.success(`${name} eliminat din registru`)
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setDeleting(null)
    }
  }

  const missingTraining = members.filter((m) => !m.nis2TrainingCompleted)
  const expiredIssues = members.filter((m) => {
    const t = trainingStatus(m)
    const c = certStatus(m)
    return t.expired || c?.expired
  })
  const totalIssues = missingTraining.length + expiredIssues.length
  const targetedMemberId = deriveGovernanceMemberId(findingId)
  const targetedMember = targetedMemberId ? members.find((member) => member.id === targetedMemberId) ?? null : null

  useEffect(() => {
    if (!targetedMember) return
    setInlineTrainingDate(targetedMember.nis2TrainingCompleted?.slice(0, 10) ?? new Date().toISOString().slice(0, 10))
    setInlineCertification(targetedMember.cisoCertification ?? "")
    setInlineCertExpiry(targetedMember.cisoCertExpiry?.slice(0, 10) ?? "")
  }, [targetedMember])

  async function handleInlineSave() {
    if (!targetedMember) return
    setInlineSaving(true)
    try {
      const patch =
        focus === "certification"
          ? {
              cisoCertification: inlineCertification.trim(),
              cisoCertExpiry: inlineCertExpiry || undefined,
            }
          : {
              nis2TrainingCompleted: inlineTrainingDate || new Date().toISOString().slice(0, 10),
            }

      const res = await fetch(`/api/nis2/governance/${targetedMember.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const data = (await res.json()) as { member?: BoardMember; error?: string }
      if (!res.ok) throw new Error(data.error ?? "Actualizarea a eșuat.")

      setMembers((prev) => prev.map((member) => (member.id === targetedMember.id ? data.member! : member)))
      const evidenceNote =
        focus === "certification"
          ? `Registrul Board & CISO actualizat pentru ${data.member!.name}. Certificare ${data.member!.cisoCertification ?? "actualizată"} cu expirare ${data.member!.cisoCertExpiry?.slice(0, 10) ?? "nedefinită"} salvată în registru.`
          : `Training NIS2 actualizat pentru ${data.member!.name} la data ${data.member!.nis2TrainingCompleted?.slice(0, 10) ?? inlineTrainingDate}. Registrul Board & CISO a fost salvat.`

      toast.success("Registrul de guvernanță a fost actualizat")
      if (findingId && returnTo) {
        const params = new URLSearchParams({
          governanceFlow: "done",
          evidenceNote,
        })
        router.push(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params.toString()}`)
      }
    } catch (err) {
      toast.error("Eroare", { description: err instanceof Error ? err.message : "Încearcă din nou." })
    } finally {
      setInlineSaving(false)
    }
  }

  if (loading) return <LoadingScreen variant="section" />

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: "NIS2", href: "/dashboard/nis2" },
        { label: "Guvernanță" },
      ]} />

      <PageIntro
        eyebrow="NIS2 — Guvernanță"
        title="Training Board & CISO"
        description="Monitorizare training-uri de securitate cibernetică pentru conducere. Bază: OUG 155/2024 Art. 14 ✅"
        badges={
          <>
            <Badge variant="outline" className="normal-case tracking-normal">
              OUG 155/2024 Art. 14
            </Badge>
            <Badge variant="outline" className="normal-case tracking-normal">
              NIS2 Art.20
            </Badge>
          </>
        }
      />

      {openedFromCockpit && findingId && (
        <div className="rounded-eos-md border border-eos-border bg-eos-surface px-4 py-3">
          <p className="text-sm font-semibold text-eos-text">Deschis din cockpit</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            {focusCopy}
          </p>
          <div className="mt-3">
            <Link
              href={returnTo || `/dashboard/resolve/${findingId}`}
              className="inline-flex h-9 items-center justify-center rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm font-medium text-eos-text transition-colors hover:bg-eos-surface-hover"
            >
              Înapoi la finding
            </Link>
          </div>
        </div>
      )}

      {openedFromCockpit && targetedMember ? (
        <Card className="border-eos-primary/30 bg-eos-primary/5">
          <CardHeader className="px-5 pt-4 pb-0">
            <CardTitle className="text-sm font-semibold">
              {focus === "certification" ? "Actualizează certificarea în acest pas" : "Actualizează training-ul în acest pas"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 pt-3">
            <p className="text-sm text-eos-text-muted">
              {targetedMember.name} · {targetedMember.role}
            </p>
            {focus === "certification" ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
                <div>
                  <label className="mb-1 block text-xs text-eos-text-muted">Certificare CISO</label>
                  <select
                    value={inlineCertification}
                    onChange={(e) => setInlineCertification(e.target.value)}
                    className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  >
                    {CERT_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c || "— Fără certificare —"}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-eos-text-muted">Data expirare</label>
                  <input
                    type="date"
                    value={inlineCertExpiry}
                    onChange={(e) => setInlineCertExpiry(e.target.value)}
                    className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Data training-ului NIS2</label>
                <input
                  type="date"
                  value={inlineTrainingDate}
                  onChange={(e) => setInlineTrainingDate(e.target.value)}
                  className="h-9 w-full max-w-56 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
            )}
            <div className="flex justify-end">
              <Button
                size="sm"
                className="gap-2"
                disabled={inlineSaving || (focus === "certification" && (!inlineCertification.trim() || !inlineCertExpiry))}
                onClick={() => void handleInlineSave()}
              >
                {inlineSaving && <Loader2 className="size-3.5 animate-spin" />}
                Salvează și revino în cockpit
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary strip */}
      {members.length > 0 && (
        <div className="flex flex-wrap gap-4 rounded-eos-lg border border-eos-border bg-eos-surface px-4 py-3">
          <div className="text-center">
            <p className="text-2xl font-semibold text-eos-text">{members.length}</p>
            <p className="text-xs text-eos-text-muted">Membri conducere</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-semibold ${missingTraining.length > 0 ? "text-eos-error" : "text-eos-success"}`}>
              {missingTraining.length}
            </p>
            <p className="text-xs text-eos-text-muted">Fără training</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-semibold ${expiredIssues.length > 0 ? "text-eos-warning" : "text-eos-success"}`}>
              {expiredIssues.length}
            </p>
            <p className="text-xs text-eos-text-muted">Expirate</p>
          </div>
        </div>
      )}

      {totalIssues > 0 && (
        <div className="flex items-center gap-2 rounded-eos-md border border-eos-warning/20 bg-eos-warning-soft px-4 py-2.5 text-sm text-eos-warning">
          <AlertTriangle className="size-4 shrink-0" />
          <span>
            {totalIssues} problemă{totalIssues > 1 ? "i" : ""} detectată{totalIssues > 1 ? "e" : ""} — findings automate generate în tabloul de remediere
          </span>
        </div>
      )}

      {/* Add member button */}
      <div className="flex justify-end">
        <Button
          size="sm"
          variant={showForm ? "outline" : "default"}
          className="gap-2"
          onClick={() => {
            setShowForm((v) => !v)
            setForm(emptyForm())
          }}
        >
          <Plus className="size-4" strokeWidth={2} />
          {showForm ? "Anulează" : "Adaugă membru conducere"}
        </Button>
      </div>

      {/* Add member form */}
      {showForm && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="px-5 pt-4 pb-0">
            <CardTitle className="text-sm font-semibold">Adaugă membru conducere</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5 pt-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Nume *</label>
                <input
                  type="text"
                  placeholder="ex: Ion Popescu"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Rol *</label>
                <input
                  type="text"
                  list="role-suggestions"
                  placeholder="ex: Administrator"
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
                <datalist id="role-suggestions">
                  {ROLE_SUGGESTIONS.map((r) => <option key={r} value={r} />)}
                </datalist>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">
                  Training NIS2 completat (dată)
                </label>
                <input
                  type="date"
                  value={form.nis2TrainingCompleted}
                  onChange={(e) => setForm((f) => ({ ...f, nis2TrainingCompleted: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">Certificare CISO</label>
                <select
                  value={form.cisoCertification}
                  onChange={(e) => setForm((f) => ({ ...f, cisoCertification: e.target.value }))}
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                >
                  {CERT_OPTIONS.map((c) => (
                    <option key={c} value={c}>
                      {c || "— Fără certificare —"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {form.cisoCertification && (
              <div>
                <label className="mb-1 block text-xs text-eos-text-muted">
                  Data expirare certificare
                </label>
                <input
                  type="date"
                  value={form.cisoCertExpiry}
                  onChange={(e) => setForm((f) => ({ ...f, cisoCertExpiry: e.target.value }))}
                  className="h-9 w-48 rounded-eos-md border border-eos-border bg-eos-bg-inset px-3 text-sm text-eos-text outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                Anulează
              </Button>
              <Button
                size="sm"
                disabled={creating || !form.name.trim() || !form.role.trim()}
                onClick={() => void handleCreate()}
                className="gap-2"
              >
                {creating && <Loader2 className="size-3.5 animate-spin" />}
                Salvează
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members list */}
      {members.length === 0 ? (
        <div className="rounded-eos-md border border-eos-border bg-eos-surface p-8 text-center">
          <Users className="mx-auto mb-3 size-10 text-eos-text-muted" strokeWidth={1.5} />
          <p className="font-semibold text-eos-text">Niciun membru adăugat</p>
          <p className="mt-1 text-sm text-eos-text-muted">
            Adaugă membrii conducerii pentru a monitoriza training-urile de securitate cibernetică.
          </p>
        </div>
      ) : (
        <Card className="divide-y divide-eos-border-subtle border-eos-border bg-eos-surface">
          {members.map((member) => {
            const ts = trainingStatus(member)
            const cs = certStatus(member)
            return (
              <div key={member.id} className="flex flex-wrap items-start gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-eos-text">{member.name}</p>
                    <span className="text-xs text-eos-text-muted">{member.role}</span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      {ts.missing || ts.expired ? (
                        <XCircle className="size-3.5 text-eos-error" />
                      ) : (
                        <CheckCircle2 className="size-3.5 text-eos-success" />
                      )}
                      <span className="text-eos-text-muted">Training NIS2:</span>
                      <TrainingBadge status={ts} />
                      {!ts.missing && (
                        <span className="text-eos-text-muted">{ts.label}</span>
                      )}
                    </div>

                    {cs !== null && (
                      <div className="flex items-center gap-1.5">
                        {cs.expired ? (
                          <XCircle className="size-3.5 text-eos-warning" />
                        ) : (
                          <CheckCircle2 className="size-3.5 text-eos-success" />
                        )}
                        <span className={`text-xs ${cs.expired ? "text-eos-warning" : "text-eos-text-muted"}`}>
                          {cs.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {member.notes && (
                    <p className="mt-1 text-xs text-eos-text-muted">{member.notes}</p>
                  )}
                </div>

                <button
                  type="button"
                  className="mt-0.5 shrink-0 text-eos-text-muted transition-colors hover:text-eos-error disabled:opacity-40"
                  disabled={deleting === member.id}
                  onClick={() => void handleDelete(member.id, member.name)}
                  title="Elimină din registru"
                >
                  {deleting === member.id ? (
                    <Loader2 className="size-4 animate-spin" strokeWidth={2} />
                  ) : (
                    <Trash2 className="size-4" strokeWidth={2} />
                  )}
                </button>
              </div>
            )
          })}
        </Card>
      )}

      {/* Legal notice */}
      <div className="rounded-eos-md border border-eos-border-subtle bg-eos-surface px-4 py-3 text-xs text-eos-text-muted">
        <p className="font-medium text-eos-text">
          Bază legală: OUG 155/2024 Art. 14 ✅
        </p>
        <p className="mt-1">
          Managementul trebuie să asigure supraveghere și formare în securitate cibernetică. Training-ul se
          reînnojește anual. Cerințe suplimentare de certificare CISO sunt în consultare publică la DNSC (ian. 2026)
          — neobligatorii încă. 📝
        </p>
      </div>
    </div>
  )
}
