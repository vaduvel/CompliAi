"use client"

// FC-10 (2026-05-14) — Authority & Mandate Guardian card.
//
// Inventory + monitorizare:
//   - certificate digitale calificate (eIDAS)
//   - împuterniciri SPV ANAF (form 270) + procuri notariale
// Cu alerte automate de expirare (≤30 zile warning, ≤7 zile critical).

import { useEffect, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  KeyRound,
  Plus,
  ShieldAlert,
  Trash2,
  X,
} from "lucide-react"

type CertificateType =
  | "qualified-signature"
  | "non-qualified-signature"
  | "anaf-spv-token"
  | "cnp-cert"
  | "company-seal"

type CertificateAuthority =
  | "certSIGN"
  | "DigiSign"
  | "Trans Sped"
  | "AlfaSign"
  | "AlfaTrust"
  | "EasySign"
  | "ANAF"
  | "alt"

type MandateType =
  | "anaf-spv"
  | "edeclaratii"
  | "onrc"
  | "casa-marcat"
  | "general-notarial"

type CertStatus = "active" | "expiring-soon" | "expired" | "revoked"
type MandateStatus = "active" | "expiring-soon" | "expired" | "revoked" | "draft"

type Cert = {
  id: string
  ownerOrgId: string
  ownerOrgName: string
  holderName: string
  type: CertificateType
  authority: CertificateAuthority
  serialNumber: string
  issuedAtISO: string
  expiresAtISO: string
  status: CertStatus
  registeredByEmail: string
  notes?: string
}

type Mandate = {
  id: string
  representativeOrgId: string
  representativeOrgName: string
  representativeName: string
  clientOrgId: string
  clientOrgName: string
  type: MandateType
  scopes: string[]
  issuedAtISO: string
  expiresAtISO: string | null
  documentNumber?: string
  status: MandateStatus
  notaryName?: string
  registeredByEmail: string
}

type Alert = {
  id: string
  category: "certificate" | "mandate"
  severity: "critical" | "warning" | "info"
  refId: string
  refName: string
  refType: string
  expiresAtISO: string
  daysUntilExpiry: number
  message: string
  recommendedAction: string
  legalReference: string
}

type Summary = {
  totalCertificates: number
  totalMandates: number
  expiringCertsCount: number
  expiredCertsCount: number
  expiringMandatesCount: number
  expiredMandatesCount: number
  totalAlerts: number
  criticalAlerts: number
  clientsWithActiveMandates: number
  topRecommendation: string
}

const CERT_TYPE_LABEL: Record<CertificateType, string> = {
  "qualified-signature": "Semnătură calificată (eIDAS)",
  "non-qualified-signature": "Semnătură simplă/avansată",
  "anaf-spv-token": "Token SPV ANAF",
  "cnp-cert": "Cert. persoană fizică",
  "company-seal": "Sigiliu electronic firmă",
}

const MANDATE_TYPE_LABEL: Record<MandateType, string> = {
  "anaf-spv": "Împuternicire SPV (form 270)",
  edeclaratii: "Împuternicire eDeclarații",
  onrc: "Împuternicire ONRC",
  "casa-marcat": "Mandat casă marcat",
  "general-notarial": "Procură notarială",
}

const STATUS_CLS: Record<CertStatus | MandateStatus, string> = {
  active: "bg-emerald-100 text-emerald-700 border-emerald-300/50",
  "expiring-soon": "bg-amber-100 text-amber-700 border-amber-300/50",
  expired: "bg-red-100 text-red-700 border-red-300/50",
  revoked: "bg-gray-200 text-gray-600 border-gray-300/50",
  draft: "bg-slate-100 text-slate-600 border-slate-300/50",
}

const STATUS_LABEL: Record<CertStatus | MandateStatus, string> = {
  active: "ACTIV",
  "expiring-soon": "EXPIRĂ CURÂND",
  expired: "EXPIRAT",
  revoked: "REVOCAT",
  draft: "DRAFT",
}

type Tab = "alerts" | "certs" | "mandates"

export function AuthorityGuardianCard() {
  const [tab, setTab] = useState<Tab>("alerts")
  const [certs, setCerts] = useState<Cert[]>([])
  const [mandates, setMandates] = useState<Mandate[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createKind, setCreateKind] = useState<"certificate" | "mandate" | null>(null)

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/fiscal/authority-guardian")
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare la încărcare.")
      }
      const data = await res.json()
      setCerts(data.certificates ?? [])
      setMandates(data.mandates ?? [])
      setAlerts(data.alerts ?? [])
      setSummary(data.summary ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Eroare")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAll()
  }, [])

  const handleDelete = async (kind: "certificate" | "mandate", id: string) => {
    if (!confirm(`Ștergi acest ${kind === "certificate" ? "certificat" : "mandat"}?`)) return
    const res = await fetch("/api/fiscal/authority-guardian", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    })
    if (res.ok) await fetchAll()
  }

  return (
    <section className="space-y-4 rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-sm">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary">
            FC-10 · Authority & Mandate Guardian
          </p>
          <h3
            data-display-text="true"
            className="mt-1 font-display text-[20px] font-semibold tracking-[-0.025em] text-eos-text"
          >
            Certificate digitale + împuterniciri
          </h3>
          <p className="mt-1 max-w-3xl text-[12.5px] leading-[1.5] text-eos-text-muted">
            Inventory cert calificate (eIDAS), token SPV ANAF, împuterniciri form 270, procuri notariale. Alerte automate cu 30/7 zile înainte de expirare.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setCreateKind("certificate")}
            className="inline-flex items-center gap-1 rounded-md border border-eos-border bg-eos-surface px-2.5 py-1.5 text-[11.5px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
          >
            <Plus className="size-3.5" strokeWidth={2} /> Cert
          </button>
          <button
            type="button"
            onClick={() => setCreateKind("mandate")}
            className="inline-flex items-center gap-1 rounded-md border border-eos-primary bg-eos-primary px-2.5 py-1.5 text-[11.5px] font-semibold text-white hover:bg-eos-primary/90"
          >
            <Plus className="size-3.5" strokeWidth={2} /> Mandat
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-red-300/50 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
          {error}
        </div>
      )}

      {summary && (
        <>
          {/* Banner strategic */}
          <div
            className={`rounded-lg border p-3 ${
              summary.expiredCertsCount > 0 || summary.expiredMandatesCount > 0
                ? "border-red-300/50 bg-red-50"
                : summary.criticalAlerts > 0
                  ? "border-amber-300/50 bg-amber-50"
                  : "border-emerald-300/50 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-2">
              <ShieldAlert
                className={`mt-0.5 size-4 ${
                  summary.expiredCertsCount > 0 || summary.expiredMandatesCount > 0
                    ? "text-red-700"
                    : summary.criticalAlerts > 0
                      ? "text-amber-700"
                      : "text-emerald-700"
                }`}
                strokeWidth={2}
              />
              <p className="text-[12.5px] font-medium leading-[1.5] text-eos-text">
                {summary.topRecommendation}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
            <Tile
              icon={<KeyRound className="size-3.5" strokeWidth={2} />}
              label="Certificate"
              value={String(summary.totalCertificates)}
            />
            <Tile
              icon={<KeyRound className="size-3.5" strokeWidth={2} />}
              label="Împuterniciri"
              value={String(summary.totalMandates)}
            />
            <Tile
              icon={<AlertTriangle className="size-3.5" strokeWidth={2} />}
              label="Expiră curând"
              value={String(summary.expiringCertsCount + summary.expiringMandatesCount)}
              tone={summary.expiringCertsCount + summary.expiringMandatesCount > 0 ? "warning" : "neutral"}
            />
            <Tile
              icon={<AlertTriangle className="size-3.5" strokeWidth={2} />}
              label="Expirate"
              value={String(summary.expiredCertsCount + summary.expiredMandatesCount)}
              tone={summary.expiredCertsCount + summary.expiredMandatesCount > 0 ? "danger" : "ok"}
            />
            <Tile
              icon={<CheckCircle2 className="size-3.5" strokeWidth={2} />}
              label="Clienți cu mandat"
              value={String(summary.clientsWithActiveMandates)}
            />
          </div>
        </>
      )}

      <nav className="flex items-center gap-1 border-b border-eos-border">
        <TabBtn active={tab === "alerts"} onClick={() => setTab("alerts")} label={`Alerte (${alerts.length})`} />
        <TabBtn active={tab === "certs"} onClick={() => setTab("certs")} label={`Certificate (${certs.length})`} />
        <TabBtn active={tab === "mandates"} onClick={() => setTab("mandates")} label={`Împuterniciri (${mandates.length})`} />
      </nav>

      {tab === "alerts" && (
        <ul className="space-y-2">
          {alerts.length === 0 ? (
            <li className="rounded-lg border border-eos-border bg-eos-surface-subtle px-3 py-4 text-center text-[12.5px] text-emerald-700">
              ✓ Nicio alertă activă. Toate elementele sunt valide.
            </li>
          ) : (
            alerts.map((a) => <AlertRow key={a.id} alert={a} />)
          )}
        </ul>
      )}

      {tab === "certs" && (
        <ul className="space-y-2">
          {certs.length === 0 ? (
            <li className="rounded-lg border border-eos-border bg-eos-surface-subtle px-3 py-4 text-center text-[12.5px] text-eos-text-muted">
              Niciun certificat înregistrat. Apasă „Cert" sus pentru a adăuga.
            </li>
          ) : (
            certs.map((c) => (
              <CertRow key={c.id} cert={c} onDelete={() => handleDelete("certificate", c.id)} />
            ))
          )}
        </ul>
      )}

      {tab === "mandates" && (
        <ul className="space-y-2">
          {mandates.length === 0 ? (
            <li className="rounded-lg border border-eos-border bg-eos-surface-subtle px-3 py-4 text-center text-[12.5px] text-eos-text-muted">
              Nicio împuternicire înregistrată. Apasă „Mandat" sus pentru a adăuga.
            </li>
          ) : (
            mandates.map((m) => (
              <MandateRow key={m.id} mandate={m} onDelete={() => handleDelete("mandate", m.id)} />
            ))
          )}
        </ul>
      )}

      {createKind && (
        <CreateModal
          kind={createKind}
          onClose={() => setCreateKind(null)}
          onCreated={async () => {
            setCreateKind(null)
            await fetchAll()
          }}
        />
      )}
    </section>
  )
}

function Tile({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: "ok" | "warning" | "danger" | "neutral"
}) {
  const toneCls =
    tone === "danger"
      ? "border-red-300/50 bg-red-50"
      : tone === "warning"
        ? "border-amber-300/50 bg-amber-50"
        : tone === "ok"
          ? "border-emerald-300/50 bg-emerald-50"
          : "border-eos-border bg-eos-surface-subtle"
  return (
    <div className={`rounded-lg border ${toneCls} p-2`}>
      <div className="flex items-center gap-1.5 text-eos-text-muted">
        {icon}
        <p className="text-[10.5px] font-medium uppercase tracking-wide">{label}</p>
      </div>
      <p className="mt-1 font-display text-[16px] font-semibold tracking-[-0.02em] text-eos-text">
        {value}
      </p>
    </div>
  )
}

function TabBtn({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-3 py-2 text-[12px] font-medium transition ${
        active
          ? "border-eos-primary text-eos-text"
          : "border-transparent text-eos-text-muted hover:text-eos-text"
      }`}
    >
      {label}
    </button>
  )
}

function AlertRow({ alert }: { alert: Alert }) {
  const sevCls =
    alert.severity === "critical"
      ? "border-red-300/60 bg-red-50"
      : alert.severity === "warning"
        ? "border-amber-300/60 bg-amber-50"
        : "border-eos-border bg-eos-surface-subtle"
  return (
    <li className={`rounded-lg border ${sevCls} p-3`}>
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={`mt-0.5 size-4 ${alert.severity === "critical" ? "text-red-700" : "text-amber-700"}`}
          strokeWidth={2}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-mono text-[13px] font-semibold text-eos-text">{alert.refName}</h4>
          <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">
            <span className="font-medium text-eos-text">{alert.refType}</span> — {alert.message}
          </p>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
            <span className="font-semibold text-eos-text">Acțiune:</span> {alert.recommendedAction}
          </p>
          <p className="mt-1 text-[10.5px] text-eos-text-tertiary">
            <span className="font-medium">Referință:</span> {alert.legalReference}
          </p>
        </div>
      </div>
    </li>
  )
}

function CertRow({ cert, onDelete }: { cert: Cert; onDelete: () => void }) {
  const days = Math.round((new Date(cert.expiresAtISO).getTime() - Date.now()) / 86400000)
  return (
    <li className="rounded-lg border border-eos-border bg-eos-surface-subtle p-3">
      <div className="flex items-start gap-2.5">
        <KeyRound className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-mono text-[13px] font-semibold text-eos-text">
              {cert.holderName}
            </h4>
            <span
              className={`inline-flex shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase ${STATUS_CLS[cert.status]}`}
            >
              {STATUS_LABEL[cert.status]}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
            {CERT_TYPE_LABEL[cert.type]} · {cert.authority} · SN {cert.serialNumber}
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">
            Expiră: <span className="font-medium text-eos-text">{new Date(cert.expiresAtISO).toLocaleDateString("ro-RO")}</span>{" "}
            {days >= 0 ? `(în ${days} zile)` : `(acum ${Math.abs(days)} zile)`}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-eos-text-tertiary hover:text-red-600"
          aria-label="Șterge"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}

function MandateRow({
  mandate,
  onDelete,
}: {
  mandate: Mandate
  onDelete: () => void
}) {
  const days = mandate.expiresAtISO
    ? Math.round((new Date(mandate.expiresAtISO).getTime() - Date.now()) / 86400000)
    : null
  return (
    <li className="rounded-lg border border-eos-border bg-eos-surface-subtle p-3">
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-eos-text-muted" strokeWidth={2} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-baseline gap-2">
            <h4 className="font-mono text-[13px] font-semibold text-eos-text">
              {mandate.representativeName} → {mandate.clientOrgName}
            </h4>
            <span
              className={`inline-flex shrink-0 rounded border px-1.5 py-px font-mono text-[9.5px] font-semibold uppercase ${STATUS_CLS[mandate.status]}`}
            >
              {STATUS_LABEL[mandate.status]}
            </span>
          </div>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-eos-text-muted">
            {MANDATE_TYPE_LABEL[mandate.type]}
            {mandate.documentNumber ? ` · doc nr. ${mandate.documentNumber}` : ""}
            {mandate.notaryName ? ` · notar ${mandate.notaryName}` : ""}
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">
            Scope: <span className="font-mono text-[10.5px]">{mandate.scopes.join(", ") || "—"}</span>
          </p>
          <p className="mt-1 text-[11.5px] text-eos-text-muted">
            {mandate.expiresAtISO ? (
              <>
                Expiră:{" "}
                <span className="font-medium text-eos-text">
                  {new Date(mandate.expiresAtISO).toLocaleDateString("ro-RO")}
                </span>{" "}
                {days !== null && days >= 0 ? `(în ${days} zile)` : days !== null ? `(acum ${Math.abs(days)} zile)` : ""}
              </>
            ) : (
              <span className="italic">Nelimitat</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={onDelete}
          className="text-eos-text-tertiary hover:text-red-600"
          aria-label="Șterge"
        >
          <Trash2 className="size-3.5" strokeWidth={2} />
        </button>
      </div>
    </li>
  )
}

function CreateModal({
  kind,
  onClose,
  onCreated,
}: {
  kind: "certificate" | "mandate"
  onClose: () => void
  onCreated: () => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Cert state
  const [holderName, setHolderName] = useState("")
  const [type, setType] = useState<CertificateType>("qualified-signature")
  const [authority, setAuthority] = useState<CertificateAuthority>("certSIGN")
  const [serialNumber, setSerialNumber] = useState("")
  const [issuedAt, setIssuedAt] = useState("")
  const [expiresAt, setExpiresAt] = useState("")
  const [ownerOrgName, setOwnerOrgName] = useState("Firma curentă")

  // Mandate state
  const [mType, setMType] = useState<MandateType>("anaf-spv")
  const [repName, setRepName] = useState("")
  const [clientOrgName, setClientOrgName] = useState("")
  const [clientOrgId, setClientOrgId] = useState("")
  const [docNumber, setDocNumber] = useState("")
  const [scopes, setScopes] = useState("submit-declarations")
  const [mExpiresAt, setMExpiresAt] = useState("")

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErr(null)
    try {
      const body =
        kind === "certificate"
          ? {
              kind,
              certificate: {
                ownerOrgId: "self",
                ownerOrgName,
                holderName,
                type,
                authority,
                serialNumber,
                issuedAtISO: new Date(issuedAt).toISOString(),
                expiresAtISO: new Date(expiresAt).toISOString(),
              },
            }
          : {
              kind,
              mandate: {
                representativeOrgId: "self",
                representativeOrgName: "Cabinet curent",
                representativeName: repName,
                clientOrgId: clientOrgId || "client-unknown",
                clientOrgName,
                type: mType,
                scopes: scopes.split(",").map((s) => s.trim()).filter(Boolean),
                issuedAtISO: new Date().toISOString(),
                expiresAtISO: mExpiresAt ? new Date(mExpiresAt).toISOString() : null,
                documentNumber: docNumber || undefined,
              },
            }
      const res = await fetch("/api/fiscal/authority-guardian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? "Eroare creare")
      }
      await onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Eroare")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-eos-border bg-eos-surface p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-[18px] font-semibold tracking-tight text-eos-text">
            {kind === "certificate" ? "Adaugă certificat digital" : "Adaugă împuternicire"}
          </h4>
          <button onClick={onClose} className="text-eos-text-muted hover:text-eos-text">
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {kind === "certificate" ? (
            <>
              <Field label="Titular (persoana fizică)">
                <input
                  required
                  value={holderName}
                  onChange={(e) => setHolderName(e.target.value)}
                  placeholder="Ion Popescu"
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                />
              </Field>
              <Field label="Firmă proprietar">
                <input
                  value={ownerOrgName}
                  onChange={(e) => setOwnerOrgName(e.target.value)}
                  placeholder="Firma X SRL"
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tip">
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CertificateType)}
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  >
                    {(Object.keys(CERT_TYPE_LABEL) as CertificateType[]).map((t) => (
                      <option key={t} value={t}>
                        {CERT_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Autoritate emitentă">
                  <select
                    value={authority}
                    onChange={(e) => setAuthority(e.target.value as CertificateAuthority)}
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  >
                    {(
                      ["certSIGN", "DigiSign", "Trans Sped", "AlfaSign", "AlfaTrust", "EasySign", "ANAF", "alt"] as CertificateAuthority[]
                    ).map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Serial Number">
                <input
                  required
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="3a4b5c6d..."
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 font-mono text-[11.5px]"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data emiterii">
                  <input
                    type="date"
                    required
                    value={issuedAt}
                    onChange={(e) => setIssuedAt(e.target.value)}
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  />
                </Field>
                <Field label="Data expirării">
                  <input
                    type="date"
                    required
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  />
                </Field>
              </div>
            </>
          ) : (
            <>
              <Field label="Tip împuternicire">
                <select
                  value={mType}
                  onChange={(e) => setMType(e.target.value as MandateType)}
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                >
                  {(Object.keys(MANDATE_TYPE_LABEL) as MandateType[]).map((t) => (
                    <option key={t} value={t}>
                      {MANDATE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reprezentant (numele tău/colegului)">
                <input
                  required
                  value={repName}
                  onChange={(e) => setRepName(e.target.value)}
                  placeholder="Maria Cabinet"
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Client (firma)">
                  <input
                    required
                    value={clientOrgName}
                    onChange={(e) => setClientOrgName(e.target.value)}
                    placeholder="Firma Y SRL"
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  />
                </Field>
                <Field label="Client Org ID">
                  <input
                    value={clientOrgId}
                    onChange={(e) => setClientOrgId(e.target.value)}
                    placeholder="org-xyz"
                    className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                  />
                </Field>
              </div>
              <Field label="Număr document (form 270 sau notarial)">
                <input
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="123/2026"
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                />
              </Field>
              <Field label="Scope-uri (CSV)">
                <input
                  value={scopes}
                  onChange={(e) => setScopes(e.target.value)}
                  placeholder="submit-declarations, view-fiscal-data"
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 font-mono text-[11.5px]"
                />
              </Field>
              <Field label="Data expirării (gol = nelimitat)">
                <input
                  type="date"
                  value={mExpiresAt}
                  onChange={(e) => setMExpiresAt(e.target.value)}
                  className="w-full rounded-md border border-eos-border bg-eos-surface px-2 py-1.5 text-[12.5px]"
                />
              </Field>
            </>
          )}

          {err && <p className="text-[11.5px] text-red-700">{err}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-eos-border bg-eos-surface px-3 py-1.5 text-[12px] font-medium text-eos-text-muted hover:bg-eos-surface-hover"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md border border-eos-primary bg-eos-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-eos-primary/90 disabled:opacity-50"
            >
              {submitting ? "..." : "Salvează"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10.5px] font-medium uppercase tracking-wide text-eos-text-muted">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  )
}
