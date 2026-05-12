"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import {
  getAccentBlobClasses,
  getAccentBorderClass,
  getAccentTextClass,
  getLoginPaneContent,
  parseLoginIcp,
} from "@/lib/compliscan/login-icp-content"
import { sanitizeInternalRoute } from "@/lib/compliscan/internal-route"

type Mode = "login" | "register"

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const searchParams = useSearchParams()
  const nextPath = sanitizeInternalRoute(searchParams.get("next"), "/dashboard")
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
  // S3.4 — ICP-aware right-pane: detectează ?icp= din landing pages.
  const icpSegment = parseLoginIcp(searchParams.get("icp"))
  const paneContent = getLoginPaneContent(icpSegment)
  const accentBlob = getAccentBlobClasses(paneContent.accent)
  const accentText = getAccentTextClass(paneContent.accent)
  const accentBorder = getAccentBorderClass(paneContent.accent)
  const [mode, setMode] = useState<Mode>(initialMode)
  const [orgName, setOrgName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registerDuplicateEmail, setRegisterDuplicateEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setRegisterDuplicateEmail(false)

    if (mode === "register" && !orgName.trim()) {
      setError("Denumirea firmei este obligatorie.")
      return
    }

    if (mode === "register" && password !== confirmPassword) {
      setError("Parolele nu coincid. Verifică parola și confirmarea ei.")
      return
    }

    setLoading(true)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body =
        mode === "login"
          ? { email, password, next: searchParams.get("next") }
          : { email, password, orgName }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as {
        ok?: boolean
        error?: string
        code?: string
        destination?: string
      }

      if (!response.ok) {
        if (mode === "register" && data.code === "AUTH_EMAIL_ALREADY_REGISTERED") {
          setRegisterDuplicateEmail(true)
          setError(
            "Emailul are deja un cont creat. Dacă ai tastat greșit parola la prima încercare, autentifică-te sau resetează parola."
          )
          return
        }
        setError(data.error || "A apărut o eroare.")
        return
      }

      // Faza 0.4 fix (2026-05-12): propagăm ?icp= la /onboarding pentru ca
      // OnboardingForm să-l poată citi (urlParam → skip Pas 1 + auto-submit
      // Pas 2 pentru cabinet-fiscal). Fără asta, /onboarding pierde contextul
      // ICP din register și utilizatorul vede iar ecranul de selecție rol.
      const onboardingDestination = icpSegment
        ? `/onboarding?icp=${encodeURIComponent(icpSegment)}`
        : "/onboarding"
      const destination =
        mode === "login"
          ? sanitizeInternalRoute(data.destination, nextPath)
          : mode === "register" && nextPath === "/dashboard"
            ? onboardingDestination
            : nextPath

      toast.success(mode === "login" ? "Autentificat cu succes" : "Cont creat cu succes", {
        description:
          mode === "register"
            ? "Te ducem direct în configurarea inițială a organizației."
            : undefined,
      })
      window.location.href = destination
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  function switchToLogin() {
    setMode("login")
    setOrgName("")
    setError(null)
    setConfirmPassword("")
    setRegisterDuplicateEmail(false)
  }

  function switchToRegister() {
    setMode("register")
    setOrgName("")
    setError(null)
    setRegisterDuplicateEmail(false)
  }

  const submitDisabled =
    loading ||
    (mode === "register" &&
      (!acceptedTerms || !confirmPassword || password !== confirmPassword))

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* ── LEFT — Form ──────────────────────────────────────────────────── */}
        <div className="flex flex-col px-6 py-8 md:px-12 md:py-10 lg:px-16">
          {/* Top bar */}
          <div className="flex items-center gap-3">
            <Link href="/" className="block">
              <CompliScanLogoLockup variant="flat" size="sm" />
            </Link>
            <span className="ml-auto font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-eos-text-tertiary">
              {icpSegment === "cabinet-fiscal"
                ? "e-Factura · SAF-T · RO e-TVA · CECCAR"
                : icpSegment === "cabinet-dpo"
                  ? "GDPR · DPO · DSAR · Audit"
                  : "Conformitate · GDPR · NIS2 · AI Act"}
            </span>
          </div>

          {/* Center — form column */}
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            <h1
              data-display-text="true"
              className="font-display text-[32px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[36px]"
            >
              {mode === "login" ? "Bun venit înapoi." : "Creează-ți contul."}
            </h1>
            <p className="mt-2.5 text-[14px] leading-[1.55] text-eos-text-muted">
              {mode === "login"
                ? "Continuă pe firma ta sau pe portofoliul cabinetului."
                : "Începi cu snapshot-ul firmei tale. Primul scan rulează în 3 minute."}
            </p>

            {/* Mode toggle — V3 segmented */}
            <div
              role="tablist"
              aria-label="Mod autentificare"
              className="mt-7 inline-flex w-full items-center gap-0.5 rounded-eos-sm bg-white/[0.03] p-0.5"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mode === "login"}
                onClick={switchToLogin}
                className={[
                  "flex flex-1 items-center justify-center rounded-eos-sm px-3 py-2 text-[12.5px] font-medium transition-colors duration-100",
                  mode === "login"
                    ? "bg-white/[0.06] font-semibold text-eos-text"
                    : "text-eos-text-muted hover:text-eos-text",
                ].join(" ")}
              >
                Autentificare
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "register"}
                onClick={switchToRegister}
                className={[
                  "flex flex-1 items-center justify-center gap-1.5 rounded-eos-sm px-3 py-2 text-[12.5px] font-medium transition-colors duration-100",
                  mode === "register"
                    ? "bg-white/[0.06] font-semibold text-eos-text"
                    : "text-eos-text-muted hover:text-eos-text",
                ].join(" ")}
              >
                Cont nou
                <span className="inline-flex items-center rounded-sm border border-eos-success/25 bg-eos-success-soft px-1 py-0 font-mono text-[9px] font-bold uppercase tracking-[0.05em] text-eos-success">
                  14z PRO
                </span>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={(e) => void handleSubmit(e)} className="mt-6 space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="orgName"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                  >
                    {icpSegment === "cabinet-fiscal" || icpSegment === "cabinet-dpo"
                      ? "Numele cabinetului tău"
                      : "Denumirea firmei"}
                  </label>
                  <input
                    id="orgName"
                    name="orgName"
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder={
                      icpSegment === "cabinet-fiscal"
                        ? "Ex: Cabinet Contabil Popescu SRL"
                        : icpSegment === "cabinet-dpo"
                          ? "Ex: Cabinet DPO Ionescu SRL"
                          : "Ex: Apex Logistic SRL"
                    }
                    required
                    autoComplete="organization"
                    className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@firma.ro"
                  required
                  autoComplete="email"
                  className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-3">
                  <label
                    htmlFor="password"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                  >
                    Parolă
                  </label>
                  {mode === "login" && (
                    <Link
                      href="/reset-password"
                      className="font-mono text-[10.5px] uppercase tracking-[0.06em] text-eos-primary transition-colors hover:text-eos-primary/80"
                    >
                      Am uitat parola
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minim 8 caractere" : "Parola ta"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 pr-11 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                    aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                  >
                    {showPassword ? <EyeOff className="size-4" strokeWidth={2} /> : <Eye className="size-4" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                  >
                    Confirmă parola
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Tastează parola încă o dată"
                      required
                      autoComplete="new-password"
                      aria-invalid={Boolean(confirmPassword && password !== confirmPassword)}
                      className={[
                        "h-11 w-full rounded-eos-sm border bg-eos-surface px-3 pr-11 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary",
                        confirmPassword && password !== confirmPassword
                          ? "border-eos-error/50 focus:border-eos-error/70"
                          : confirmPassword && password === confirmPassword
                            ? "border-eos-success/40 focus:border-eos-success/60"
                            : "border-eos-border focus:border-eos-primary/50",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                      aria-label={showConfirmPassword ? "Ascunde confirmarea" : "Arată confirmarea"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="size-4" strokeWidth={2} />
                      ) : (
                        <Eye className="size-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="font-mono text-[11px] text-eos-error">
                      Parolele nu coincid.
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && password.length >= 8 && (
                    <p className="flex items-center gap-1.5 font-mono text-[11px] text-eos-success">
                      <CheckCircle2 className="size-3" strokeWidth={2.5} />
                      Parolele coincid
                    </p>
                  )}
                </div>
              )}

              {mode === "register" && (
                <label className="flex cursor-pointer items-start gap-3 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-3">
                  <input
                    id="acceptedTerms"
                    name="acceptedTerms"
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 accent-eos-primary"
                  />
                  <span className="text-[12px] leading-[1.55] text-eos-text-muted">
                    Am citit și accept{" "}
                    <Link
                      href="/terms"
                      target="_blank"
                      className="text-eos-primary underline-offset-2 hover:underline"
                    >
                      Termenii și Condițiile
                    </Link>{" "}
                    și{" "}
                    <Link
                      href="/privacy"
                      target="_blank"
                      className="text-eos-primary underline-offset-2 hover:underline"
                    >
                      Politica de Confidențialitate
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                  {error}
                </div>
              )}

              {mode === "register" && registerDuplicateEmail && (
                <div className="flex flex-wrap items-center gap-3 font-mono text-[11px] uppercase tracking-[0.06em]">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-eos-primary transition-colors hover:text-eos-primary/80"
                  >
                    → Mergi la autentificare
                  </button>
                  <span className="text-eos-border-strong">·</span>
                  <Link
                    href="/reset-password"
                    className="text-eos-primary transition-colors hover:text-eos-primary/80"
                  >
                    Resetează parola
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={submitDisabled}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm bg-eos-primary text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:bg-eos-primary/50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === "login" ? "Se autentifică..." : "Se creează contul..."}
                  </>
                ) : mode === "login" ? (
                  <>
                    Intră în CompliScan
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    Creează cont gratuit
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </>
                )}
              </button>

              <p className="text-center font-mono text-[10px] uppercase tracking-[0.08em] text-eos-text-tertiary">
                Conectare securizată · 2FA disponibil · Date stocate în UE
              </p>
            </form>
          </div>

          {/* Footer note */}
          <p className="mt-auto pt-6 text-center text-[11.5px] leading-[1.55] text-eos-text-tertiary">
            Nu oferim consiliere juridică. Oferim instrumente de pregătire.
            <br />
            Verificați cu un specialist înainte de orice raport oficial.
          </p>
        </div>

        {/* ── RIGHT — Ambient panel (V3 frozen pattern) ───────────────────── */}
        <div className="relative hidden overflow-hidden border-l border-eos-border bg-gradient-to-br from-eos-surface via-eos-bg to-eos-bg lg:flex">
          {/* radial glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className={`absolute right-[15%] top-[15%] size-[480px] rounded-full blur-[100px] ${accentBlob.primary}`} />
            <div className={`absolute bottom-[10%] left-[10%] size-[380px] rounded-full blur-[100px] ${accentBlob.secondary}`} />
          </div>

          <div className="relative flex flex-col px-12 py-14 xl:px-16">
            <p className={`font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] ${accentText}`}>
              {paneContent.eyebrow}
            </p>
            <h2
              data-display-text="true"
              className="mt-4 max-w-md font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text xl:text-[38px]"
              style={{ textWrap: "balance" }}
            >
              {paneContent.title}
            </h2>

            {/* Framework grid (V3 ambient cards) — ICP-aware */}
            <div className="mt-10 grid max-w-md grid-cols-2 gap-3">
              {paneContent.kpis.map((kpi) => (
                <div
                  key={kpi.framework}
                  className="rounded-eos-lg border border-eos-border bg-eos-surface/60 p-3.5 backdrop-blur-md"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={[
                        "inline-flex items-center rounded-sm border px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.05em]",
                        kpi.tone === "ok"
                          ? "border-eos-success/25 bg-eos-success-soft text-eos-success"
                          : "border-eos-warning/25 bg-eos-warning-soft text-eos-warning",
                      ].join(" ")}
                    >
                      {kpi.framework}
                    </span>
                    <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.06em] text-eos-text-tertiary">
                      monitor
                    </span>
                  </div>
                  <div
                    data-display-text="true"
                    className="font-display text-[22px] font-medium leading-none tabular-nums tracking-[-0.025em] text-eos-text"
                  >
                    {kpi.value}
                  </div>
                  <p className="mt-1.5 text-[11px] leading-tight text-eos-text-muted">{kpi.label}</p>
                </div>
              ))}
            </div>

            <blockquote className={`mt-12 max-w-md border-l-2 pl-5 ${accentBorder}`}>
              <p className="text-[15px] italic leading-[1.6] text-eos-text-muted">
                „{paneContent.testimonial.quote}&rdquo;
              </p>
              <footer className="mt-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.08em] text-eos-text-tertiary">
                — {paneContent.testimonial.author} · {paneContent.testimonial.role}
              </footer>
            </blockquote>

            <div className="mt-auto pt-12 font-mono text-[10px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              <span>© 2026 CompliScan</span>
              <span className="mx-2 text-eos-border-strong">·</span>
              <Link href="/terms" className="hover:text-eos-text-muted">
                Termeni
              </Link>
              <span className="mx-2 text-eos-border-strong">·</span>
              <Link href="/privacy" className="hover:text-eos-text-muted">
                Confidențialitate
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-eos-bg/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-eos-lg border border-eos-border bg-eos-surface px-5 py-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10">
                <Loader2 className="size-5 animate-spin text-eos-primary" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p
                  data-display-text="true"
                  className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-text"
                >
                  {mode === "login" ? "Te autentificăm acum" : "Creăm contul tău"}
                </p>
                <p className="text-[12px] leading-[1.55] text-eos-text-muted">
                  {mode === "login"
                    ? "Îți păstrăm contextul și te trimitem direct în workspace."
                    : "Creăm organizația, activăm sesiunea și te ducem în onboarding."}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
