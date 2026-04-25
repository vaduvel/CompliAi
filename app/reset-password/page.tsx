"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  MailCheck,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

type Mode = "forgot" | "reset" | "done"

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tokenFromUrl = searchParams.get("token")
  const accessTokenFromQuery = searchParams.get("access_token")

  const [mode, setMode] = useState<Mode>(tokenFromUrl || accessTokenFromQuery ? "reset" : "forgot")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [recoveryAccessToken, setRecoveryAccessToken] = useState(accessTokenFromQuery ?? "")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  useEffect(() => {
    if (tokenFromUrl || accessTokenFromQuery) {
      setMode("reset")
    }

    if (accessTokenFromQuery) {
      setRecoveryAccessToken(accessTokenFromQuery)
      return
    }

    if (typeof window === "undefined") return

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash
    if (!hash) return

    const hashParams = new URLSearchParams(hash)
    const accessTokenFromHash = hashParams.get("access_token")
    if (!accessTokenFromHash) return

    setRecoveryAccessToken(accessTokenFromHash)
    setMode("reset")
  }, [accessTokenFromQuery, tokenFromUrl])

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setError(data.error || "A apărut o eroare.")
        return
      }

      setEmailSent(true)
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Parolele nu coincid.")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: tokenFromUrl,
          accessToken: recoveryAccessToken || undefined,
          password,
        }),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setError(data.error || "A apărut o eroare.")
        return
      }

      setMode("done")
      setTimeout(() => router.push("/dashboard"), 2000)
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setLoading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8">
        <Link href="/" className="block">
          <CompliScanLogoLockup variant="flat" size="sm" />
        </Link>

        <div className="flex flex-1 flex-col justify-center py-10">
          {/* ── Eyebrow + icon ── */}
          <div className="mb-6 flex items-center gap-2.5">
            <span
              className={[
                "flex size-9 items-center justify-center rounded-eos-sm border",
                mode === "done"
                  ? "border-eos-success/30 bg-eos-success-soft"
                  : "border-eos-primary/25 bg-eos-primary/10",
              ].join(" ")}
            >
              {mode === "done" ? (
                <CheckCircle2 className="size-4 text-eos-success" strokeWidth={2.5} />
              ) : mode === "reset" ? (
                <KeyRound className="size-4 text-eos-primary" strokeWidth={2} />
              ) : (
                <MailCheck className="size-4 text-eos-primary" strokeWidth={2} />
              )}
            </span>
            <p
              className={[
                "font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em]",
                mode === "done" ? "text-eos-success" : "text-eos-primary",
              ].join(" ")}
            >
              {mode === "forgot" && "Recuperare cont"}
              {mode === "reset" && "Parolă nouă"}
              {mode === "done" && "Parolă schimbată"}
            </p>
          </div>

          <h1
            data-display-text="true"
            className="font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[34px]"
          >
            {mode === "forgot" && (emailSent ? "Verifică email-ul." : "Resetează parola.")}
            {mode === "reset" && "Alege o parolă nouă."}
            {mode === "done" && "Te redirecționăm..."}
          </h1>
          <p className="mt-2.5 text-[13.5px] leading-[1.65] text-eos-text-muted">
            {mode === "forgot" &&
              !emailSent &&
              "Introdu adresa de email și îți trimitem un link de resetare valabil 1 oră."}
            {mode === "forgot" &&
              emailSent &&
              "Dacă adresa există în sistem, vei primi un email cu instrucțiuni."}
            {mode === "reset" && "Setează o parolă nouă pentru contul tău. Minim 8 caractere."}
            {mode === "done" && "Sesiunea activă reflectă noua parolă. Te ducem în dashboard."}
          </p>

          {/* ── Forgot mode ─────────────────────────────────────────────── */}
          {mode === "forgot" && !emailSent && (
            <form onSubmit={(e) => void handleForgot(e)} className="mt-8 space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="resetEmail"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                >
                  Adresa de email
                </label>
                <input
                  id="resetEmail"
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

              {error && (
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm bg-eos-primary text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:bg-eos-primary/50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se trimite...
                  </>
                ) : (
                  <>
                    Trimite link de resetare
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Email sent confirmation ─────────────────────────────────── */}
          {mode === "forgot" && emailSent && (
            <div className="mt-8">
              <div className="rounded-eos-lg border border-eos-success/25 bg-eos-success-soft px-4 py-4">
                <p
                  data-display-text="true"
                  className="font-display text-[14px] font-semibold tracking-[-0.01em] text-eos-success"
                >
                  Email trimis către {email}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
                  Verifică și folderul de spam. Link-ul expiră în 1 oră.
                </p>
              </div>
            </div>
          )}

          {/* ── Reset mode ──────────────────────────────────────────────── */}
          {mode === "reset" && (
            <form onSubmit={(e) => void handleReset(e)} className="mt-8 space-y-4">
              {!tokenFromUrl && !recoveryAccessToken && (
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                  Link-ul de resetare este invalid sau incomplet. Solicită un link nou.
                </div>
              )}

              <div className="space-y-1.5">
                <label
                  htmlFor="newPassword"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                >
                  Parolă nouă
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minim 8 caractere"
                    required
                    autoComplete="new-password"
                    className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 pr-11 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                    aria-label={showPassword ? "Ascunde parola nouă" : "Arată parola nouă"}
                  >
                    {showPassword ? <EyeOff className="size-4" strokeWidth={2} /> : <Eye className="size-4" strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="confirmNewPassword"
                  className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                >
                  Confirmă parola
                </label>
                <div className="relative">
                  <input
                    id="confirmNewPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetă parola"
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
                    aria-label={showConfirmPassword ? "Ascunde confirmarea parolei" : "Arată confirmarea parolei"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="size-4" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword ? (
                  <p className="font-mono text-[11px] text-eos-error">Parolele nu coincid.</p>
                ) : null}
              </div>

              {error && (
                <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || (!tokenFromUrl && !recoveryAccessToken)}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm bg-eos-primary text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:bg-eos-primary/50 disabled:shadow-none"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Se schimbă parola...
                  </>
                ) : (
                  <>
                    Schimbă parola
                    <ArrowRight className="size-4" strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── Done mode ───────────────────────────────────────────────── */}
          {mode === "done" && (
            <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[11px] text-eos-text-tertiary">
              <Loader2 className="size-3.5 animate-spin" />
              redirecționare automată în 2 secunde
            </div>
          )}

          {/* ── Back to login link ──────────────────────────────────────── */}
          {mode !== "done" && (
            <div className="mt-8 border-t border-eos-border pt-5">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
              >
                <ArrowLeft className="size-3.5" strokeWidth={2.5} />
                Înapoi la autentificare
              </Link>
            </div>
          )}
        </div>

        <p className="mt-auto pt-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-eos-text-tertiary">
          © 2026 CompliScan · Token cu validare server-side · expirare 1h
        </p>
      </div>
    </div>
  )
}
