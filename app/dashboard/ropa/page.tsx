"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"

import Link from "next/link"
import { Badge } from "@/components/evidence-os/Badge"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"
import { EmptyState } from "@/components/evidence-os/EmptyState"
import { PageIntro } from "@/components/evidence-os/PageIntro"
import { SimpleTooltip } from "@/components/evidence-os"
import { LoadingScreen } from "@/components/compliscan/route-sections"
import { OrgKnowledgePrefill } from "@/components/compliscan/org-knowledge-prefill"
import { useCockpitData, useCockpitMutations } from "@/components/compliscan/use-cockpit"
import { dashboardRoutes } from "@/lib/compliscan/dashboard-routes"
import type { ScanFinding } from "@/lib/compliance/types"
import { buildCockpitRecipe } from "@/lib/compliscan/finding-kernel"

const LEGAL_BASIS_OPTIONS = [
  { value: "6(1)(a)", label: "Art. 6(1)(a) — consimțământ" },
  { value: "6(1)(b)", label: "Art. 6(1)(b) — contract" },
  { value: "6(1)(c)", label: "Art. 6(1)(c) — obligație legală" },
  { value: "6(1)(d)", label: "Art. 6(1)(d) — interes vital" },
  { value: "6(1)(e)", label: "Art. 6(1)(e) — interes public" },
  { value: "6(1)(f)", label: "Art. 6(1)(f) — interes legitim" },
]

const DATA_CATEGORY_OPTIONS = [
  "Nume și prenume",
  "Adresă email",
  "Număr de telefon",
  "Adresă poștală",
  "CNP / CNP UE",
  "Date bancare",
  "Date de plată (card)",
  "Adresă IP",
  "Cookie-uri",
  "Date de localizare",
  "Date profesionale",
  "Date financiare",
  "Date de sănătate",
  "Date biometrice",
  "Date genetice",
  "Date de navigare",
  "Alte date personale",
]

const DATA_SUBJECT_OPTIONS = [
  "Clienți / Utilizatori",
  "Angajați",
  "Furnizori",
  "Parteneri de afaceri",
  "Vizitatori website",
  "Candidați angajare",
  "Public larg",
]

const RETENTION_OPTIONS = [
  "3 ani",
  "5 ani",
  "7 ani",
  "10 ani",
  "Durata contractului + 5 ani",
  "Durata raportului de muncă + 50 ani",
  "Pe durata consimțământului",
  "Nelimitat (arhivare istorică)",
]

const SECURITY_OPTIONS = [
  "Criptare date în tranzit (TLS/SSL)",
  "Criptare date în repaus",
  "Control acces roluri (RBAC)",
  "Autentificare multi-factor (MFA)",
  "Backup zilnic criptat",
  "Test de penetrare anual",
  "Audit log access",
  "Anonimizare / pseudonimizare",
  "Minimizare date",
  "Acord de confidențialitate cu angajații",
]

export interface RopaActivity {
  id: string
  activityName: string
  purpose: string
  dataCategories: string[]
  legalBasis: string
  dataSubjects: string[]
  recipients: string
  thirdCountryTransfer: boolean
  thirdCountryName: string
  retentionPeriod: string
  securityMeasures: string[]
  notes: string
}

const EMPTY_ACTIVITY = (): RopaActivity => ({
  id: Math.random().toString(36).slice(2, 10),
  activityName: "",
  purpose: "",
  dataCategories: [],
  legalBasis: "",
  dataSubjects: [],
  recipients: "",
  thirdCountryTransfer: false,
  thirdCountryName: "",
  retentionPeriod: "",
  securityMeasures: [],
  notes: "",
})

function generateRopaMarkdown(activities: RopaActivity[], orgName: string): string {
  const now = new Date().toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  let table = `| Activitate | Scop | Categorii date | Bază legală | Subiecți | Destinatari | Transfer țări terțe | Retenție | Măsuri securitate |\n`
  table += `|---|---|---|---|---|---|---|---|---|\n`

  for (const a of activities) {
    const cats = a.dataCategories.join(", ") || "—"
    const subjects = a.dataSubjects.join(", ") || "—"
    const transfer = a.thirdCountryTransfer
      ? `Da${a.thirdCountryName ? ` (${a.thirdCountryName})` : ""}`
      : "Nu"
    const security = a.securityMeasures.join("; ") || "—"

    table += `| ${a.activityName || "—"} | ${a.purpose || "—"} | ${cats} | ${a.legalBasis || "—"} | ${subjects} | ${a.recipients || "—"} | ${transfer} | ${a.retentionPeriod || "—"} | ${security} |\n`
  }

  return `# Registru de Prelucrări (RoPA)

**Organizație:** ${orgName}
**Bază legală:** GDPR Art. 30
**Ultima actualizare:** ${now}

---

## Introducere

Prezentul registru descrie toate activitățile de prelucrare a datelor cu caracter personal desfășurate de ${orgName}, în conformitate cu cerințele Art. 30 din Regulamentul General privind Protecția Datelor (GDPR).

## Registru de Prelucrări

${table}

---

## Note

Acest registru trebuie actualizat de fiecare dată când se inițiază o nouă activitate de prelucrare sau când se modifică semnificativ o activitate existentă.

Document generat de CompliAI — ${now}
`
}

function MultiSelectField({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: string[]
  selected: string[]
  onChange: (v: string[]) => void
}) {
  const [open, setOpen] = useState(false)

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-eos-text">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-9 w-full items-center justify-between rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
        >
          <span className={selected.length ? "text-eos-text" : "text-eos-text-muted"}>
            {selected.length === 0 ? "Selectează..." : `${selected.length} selectate`}
          </span>
          {open ? <ChevronDown className="size-3.5 text-eos-text-muted" /> : <ChevronRight className="size-3.5 text-eos-text-muted" />}
        </button>
        {open && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-eos-md border border-eos-border bg-eos-surface shadow-lg">
            {options.map((opt) => (
              <label
                key={opt}
                className="flex cursor-pointer items-center gap-2 px-3 py-2 text-xs hover:bg-eos-surface-variant"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="rounded"
                />
                {opt}
              </label>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s)}
              className="inline-flex items-center gap-1 rounded-eos-md bg-eos-primary/10 px-1.5 py-0.5 text-[10px] text-eos-primary hover:bg-eos-primary/20"
            >
              {s}
              <X className="size-2.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ActivityRow({
  activity,
  index,
  onUpdate,
  onDelete,
}: {
  activity: RopaActivity
  index: number
  onUpdate: (updated: RopaActivity) => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(index === 0)

  function set<K extends keyof RopaActivity>(key: K, value: RopaActivity[K]) {
    onUpdate({ ...activity, [key]: value })
  }

  return (
    <Card className={`border ${expanded ? "border-eos-primary/30" : "border-eos-border"}`}>
      <CardContent className="px-4 py-3 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <button
            type="button"
            className="flex flex-1 items-start gap-2 text-left"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <ChevronDown className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            ) : (
              <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-eos-text-muted" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-eos-text">
                {activity.activityName || <span className="text-eos-text-muted italic">Activitate nouă</span>}
              </p>
              {activity.purpose && (
                <p className="mt-0.5 text-xs text-eos-text-muted line-clamp-1">{activity.purpose}</p>
              )}
              <div className="mt-1 flex flex-wrap gap-1">
                {activity.dataCategories.slice(0, 3).map((c) => (
                  <Badge key={c} variant="secondary" className="text-[10px] normal-case tracking-normal">
                    {c}
                  </Badge>
                ))}
                {activity.dataCategories.length > 3 && (
                  <Badge variant="secondary" className="text-[10px] normal-case tracking-normal">
                    +{activity.dataCategories.length - 3}
                  </Badge>
                )}
                {activity.legalBasis && (
                  <Badge variant="outline" className="text-[10px] normal-case tracking-normal">
                    {activity.legalBasis}
                  </Badge>
                )}
                {activity.thirdCountryTransfer && (
                  <Badge variant="warning" className="text-[10px] normal-case tracking-normal">
                    Transfer 3rd party
                  </Badge>
                )}
              </div>
            </div>
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-eos-md p-1.5 text-eos-text-muted hover:bg-eos-error-soft hover:text-eos-error shrink-0"
            title="Șterge activitatea"
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {expanded && (
          <div className="space-y-3 border-t border-eos-border-subtle pt-3">
            <div>
              <label className="block text-xs font-medium text-eos-text">Nume activitate *</label>
              <input
                type="text"
                value={activity.activityName}
                onChange={(e) => set("activityName", e.target.value)}
                placeholder="ex. Facturare clienți"
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-eos-text">Scopul prelucrării</label>
              <textarea
                value={activity.purpose}
                onChange={(e) => set("purpose", e.target.value)}
                placeholder="ex. Emiterea facturilor și gestionarea plăților"
                rows={2}
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"
              />
            </div>

            <MultiSelectField
              label="Categorii de date personale"
              options={DATA_CATEGORY_OPTIONS}
              selected={activity.dataCategories}
              onChange={(v) => set("dataCategories", v)}
            />

            <div>
              <label className="block text-xs font-medium text-eos-text">Bază legală (GDPR Art. 6)</label>
              <select
                value={activity.legalBasis}
                onChange={(e) => set("legalBasis", e.target.value)}
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
              >
                <option value="">Selectează...</option>
                {LEGAL_BASIS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <MultiSelectField
              label="Categorii de subiecți ai datelor"
              options={DATA_SUBJECT_OPTIONS}
              selected={activity.dataSubjects}
              onChange={(v) => set("dataSubjects", v)}
            />

            <div>
              <label className="block text-xs font-medium text-eos-text">Destinatari (categorii)</label>
              <input
                type="text"
                value={activity.recipients}
                onChange={(e) => set("recipients", e.target.value)}
                placeholder="ex. Furnizori de plăți, contabilitate, autorități fiscale"
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
              />
            </div>

            <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant/50 p-3 space-y-3">
              <label className="flex items-center gap-2 text-xs font-medium text-eos-text">
                <input
                  type="checkbox"
                  checked={activity.thirdCountryTransfer}
                  onChange={(e) => set("thirdCountryTransfer", e.target.checked)}
                  className="rounded"
                />
                Transfer către țări din afara UE/SEE
              </label>
              {activity.thirdCountryTransfer && (
                <input
                  type="text"
                  value={activity.thirdCountryName}
                  onChange={(e) => set("thirdCountryName", e.target.value)}
                  placeholder="ex. SUA (SUA SCCs), UK"
                  className="h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-eos-text">Perioadă de retenție</label>
              <select
                value={activity.retentionPeriod}
                onChange={(e) => set("retentionPeriod", e.target.value)}
                className="mt-1 h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none"
              >
                <option value="">Selectează...</option>
                {RETENTION_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <MultiSelectField
              label="Măsuri de securitate"
              options={SECURITY_OPTIONS}
              selected={activity.securityMeasures}
              onChange={(v) => set("securityMeasures", v)}
            />

            <div>
              <label className="block text-xs font-medium text-eos-text">Note (opțional)</label>
              <textarea
                value={activity.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Detalii suplimentare, riscuri identificate..."
                rows={2}
                className="mt-1 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function RopaPage() {
  const cockpit = useCockpitData()
  const { reloadDashboard } = useCockpitMutations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const sourceFindingId = searchParams.get("findingId")
  const returnTo = sourceFindingId
    ? `/dashboard/actiuni/remediere/${encodeURIComponent(sourceFindingId)}`
    : null

  const [activities, setActivities] = useState<RopaActivity[]>([EMPTY_ACTIVITY()])
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [findingChecklist, setFindingChecklist] = useState<string[]>([])
  const [evidenceNote, setEvidenceNote] = useState("")

  const isFindingFlow = Boolean(sourceFindingId)

  const FINDING_CONFIRMATION_ITEMS = [
    { id: "content-reviewed", label: "Am verificat toate câmpurile", hint: "activitățile sunt complete și corecte" },
    { id: "facts-confirmed", label: "Datele reflectă firma reală", hint: "am verificat scopurile, categoriile și destinatarii" },
    { id: "approved-for-evidence", label: "Îl aprob ca dovadă de conformitate", hint: "registrul poate fi prezentat în audit" },
  ]

  const isFindingChecklistComplete = FINDING_CONFIRMATION_ITEMS.every((item) =>
    findingChecklist.includes(item.id)
  )

  function addActivity() {
    setActivities((prev) => [...prev, EMPTY_ACTIVITY()])
  }

  function updateActivity(id: string, updated: RopaActivity) {
    setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)))
  }

  function deleteActivity(id: string) {
    setActivities((prev) => prev.filter((a) => a.id !== id))
  }

  function toggleFindingItem(itemId: string) {
    setFindingChecklist((current) =>
      current.includes(itemId)
        ? current.filter((v) => v !== itemId)
        : [...current, itemId]
    )
  }

  function validateActivities(): boolean {
    return activities.every(
      (a) => a.activityName.trim() && a.legalBasis.trim()
    )
  }

  async function handlePreview() {
    if (!validateActivities()) {
      toast.error("Completează numele și baza legală pentru fiecare activitate.")
      return
    }
    const orgName = cockpit.data?.workspace.orgName ?? ""
    setPreview(generateRopaMarkdown(activities, orgName))
    setPreviewLoading(true)
    setTimeout(() => setPreviewLoading(false), 100)
  }

  async function handleSave() {
    if (!validateActivities()) {
      toast.error("Completează numele și baza legală pentru fiecare activitate.")
      return
    }

    const orgName = cockpit.data?.workspace.orgName ?? ""
    const content = generateRopaMarkdown(activities, orgName)

    setSaving(true)
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentType: "ropa",
          orgName,
          pregeneratedContent: content,
          sourceFindingId: sourceFindingId || undefined,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Eroare la salvare")
      }

      const doc = await res.json()

      if (isFindingFlow) {
        await fetch(`/api/documents/${doc.recordId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ validationStatus: "passed" }),
        })
      }

      toast.success("RoPA salvat cu succes")
      void reloadDashboard()

      if (isFindingFlow && returnTo) {
        const note = evidenceNote.trim() || `RoPA generat: ${activities.length} activități de prelucrare.`
        const checklistParam = findingChecklist.length === FINDING_CONFIRMATION_ITEMS.length
          ? `&checklist=${findingChecklist.join(",")}`
          : ""
        router.push(
          `${returnTo}?ropaFlow=done&ropaDocId=${doc.recordId}&evidenceNote=${encodeURIComponent(note)}${checklistParam}`
        )
      }
    } catch (err) {
      toast.error("Eroare la salvare", {
        description: err instanceof Error ? err.message : "Încearcă din nou.",
      })
    } finally {
      setSaving(false)
    }
  }

  if (cockpit.loading || !cockpit.data) return <LoadingScreen variant="section" />

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <PageIntro
        eyebrow={
          <>
            <SimpleTooltip content="Record of Processing Activities — Art. 30 GDPR">
              <span className="cursor-help border-b border-dotted border-current">GDPR</span>
            </SimpleTooltip>{" · "}
            <SimpleTooltip content="Registrul de Prelucrări">
              <span className="cursor-help border-b border-dotted border-current">RoPA</span>
            </SimpleTooltip>
          </>
        }
        title="Registru de Prelucrări"
        description="Gestionează și menține registrul activităților de prelucrare a datelor personale conform GDPR Art. 30."
        badges={
          <Link href="/dashboard/calendar" className="inline-flex items-center gap-1.5 text-xs font-medium text-eos-primary hover:underline">
            <FileText className="size-3.5" strokeWidth={2} />
            Vezi și celelalte documente
          </Link>
        }
      />

      {isFindingFlow ? (
        <Card className="border-eos-primary/30 bg-eos-primary-soft/20">
          <CardContent className="px-5 py-4">
            <p className="text-sm text-eos-text">
              Flow GDPR-004/GDPR-006: Completezi registrul de prelucrări, salvezi documentul și te întorci în cockpit cu dovada atașată.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="default">{activities.length} activități</Badge>
        <Badge variant="secondary">
          {activities.filter((a) => a.thirdCountryTransfer).length} cu transfer 3rd party
        </Badge>
        {activities.some((a) => a.dataCategories.includes("Date de sănătate")) && (
          <Badge variant="warning">Date de sănătate detectate</Badge>
        )}
      </div>

      {/* Activity list */}
      <div className="space-y-3">
        {activities.map((activity, index) => (
          <ActivityRow
            key={activity.id}
            activity={activity}
            index={index}
            onUpdate={(updated) => updateActivity(activity.id, updated)}
            onDelete={() => deleteActivity(activity.id)}
          />
        ))}
      </div>

      {/* Add activity */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" className="gap-2" onClick={addActivity}>
          <Plus className="size-3.5" />
          Adaugă activitate
        </Button>
      </div>

      {/* Actions */}
      <Card className="border-eos-border bg-eos-surface">
        <CardContent className="space-y-4 px-5 py-4">
          {!isFindingFlow ? (
            <div className="space-y-3">
              <OrgKnowledgePrefill
                categories={["data-categories", "processing-purposes", "tools"]}
                onPrefill={(text) => {
                  const newActivity = EMPTY_ACTIVITY()
                  newActivity.purpose = text
                  newActivity.activityName = "Activitate din baza de cunoștințe"
                  setActivities((prev) => [...prev, newActivity])
                  toast.success("Activitate adăugată din cunoștințele organizației")
                }}
                prefillLabel="Adaugă activitate din datele confirmate"
                className="mb-2"
              />
              <Button
                onClick={() => void handleSave()}
                disabled={saving || !validateActivities()}
                size="lg"
                className="w-full gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Salvează RoPA ca document
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-3">
                {FINDING_CONFIRMATION_ITEMS.map((item) => {
                  const checked = findingChecklist.includes(item.id)
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
                        onChange={() => toggleFindingItem(item.id)}
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

              <div>
                <label className="block text-xs font-medium text-eos-text mb-1.5">Notă de confirmare (opțional)</label>
                <textarea
                  value={evidenceNote}
                  onChange={(e) => setEvidenceNote(e.target.value)}
                  rows={2}
                  placeholder="Ex: RoPA conține 5 activități de prelucrare, actualizat la data de azi."
                  className="w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 py-2 text-sm text-eos-text outline-none placeholder:text-eos-text-muted resize-none"
                />
              </div>

              <Button
                onClick={() => void handleSave()}
                disabled={saving || !validateActivities() || !isFindingChecklistComplete}
                size="lg"
                className="w-full gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se salvează...
                  </>
                ) : (
                  <>
                    <Save className="size-4" />
                    Salvează RoPA și revino în cockpit
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview && (
        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Previzualizare RoPA</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    const blob = new Blob([preview], { type: "text/markdown;charset=utf-8;" })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = `ropa-${new Date().toISOString().split("T")[0]}.md`
                    a.click()
                    URL.revokeObjectURL(url)
                    toast.success("Descărcat!")
                  }}
                >
                  <Download className="size-3.5" />
                  .md
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreview(null)}>
                  <X className="size-3.5" />
                  Închide
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="max-h-[500px] overflow-y-auto">
            {previewLoading ? (
              <div className="flex items-center gap-2 py-4 text-sm text-eos-text-muted">
                <Loader2 className="size-4 animate-spin" />
                Se generează previzualizarea...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-xs text-eos-text-muted leading-relaxed">{preview}</pre>
            )}
          </CardContent>
        </Card>
      )}

      {/* Show preview toggle */}
      {!preview && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => void handlePreview()}
          >
            <FileText className="size-3.5" />
            Previzualizează RoPA
          </Button>
        </div>
      )}

      {/* Empty state if no activities */}
      {activities.length === 0 && (
        <EmptyState
          icon={FileText}
          title="Nicio activitate în registru"
          label="Adaugă prima activitate de prelucrare pentru a începe completarea RoPA."
        />
      )}
    </div>
  )
}
