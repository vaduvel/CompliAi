"use client"

import { Suspense, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--eos-accent-primary-subtle),transparent_32%),linear-gradient(180deg,var(--eos-surface-secondary),var(--eos-surface-base))] px-4 py-12">
      <div className="w-full max-w-md">
        <CompliScanLogoLockup
          className="mb-5"
          variant="gradient"
          size="md"
          subtitle=""
          titleClassName="text-eos-text"
          subtitleClassName="text-eos-text-muted"
        />

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-xl">
              {mode === "forgot" && "Resetare parolă"}
              {mode === "reset" && "Parolă nouă"}
              {mode === "done" && "Parolă schimbată"}
            </CardTitle>
            <p className="text-sm text-eos-text-muted">
              {mode === "forgot" &&
                "Introdu adresa de email și îți trimitem un link de resetare."}
              {mode === "reset" && "Alege o parolă nouă pentru contul tău."}
              {mode === "done" && "Vei fi redirecționat către dashboard."}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {/* ── Forgot mode ─────────────────── */}
            {mode === "forgot" && !emailSent && (
              <form onSubmit={(e) => void handleForgot(e)} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="resetEmail" className="text-sm text-eos-text-muted">
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
                    className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                  />
                </div>

                {error && (
                  <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    "Trimite link de resetare"
                  )}
                </Button>
              </form>
            )}

            {/* ── Email sent confirmation ────── */}
            {mode === "forgot" && emailSent && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto size-12 text-eos-success" />
                <p className="text-sm text-eos-text">
                  Dacă adresa <strong>{email}</strong> există în sistem, vei
                  primi un email cu instrucțiuni de resetare.
                </p>
                <p className="text-xs text-eos-text-muted">
                  Verifică și folderul de spam. Link-ul expiră în 1 oră.
                </p>
              </div>
            )}

            {/* ── Reset mode ──────────────────── */}
            {mode === "reset" && (
              <form onSubmit={(e) => void handleReset(e)} className="space-y-4">
                {!tokenFromUrl && !recoveryAccessToken && (
                  <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    Link-ul de resetare este invalid sau incomplet. Solicită un link nou.
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="newPassword" className="text-sm text-eos-text-muted">
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
                      className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-muted hover:text-eos-text"
                      aria-label={showPassword ? "Ascunde parola nouă" : "Arată parola nouă"}
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" strokeWidth={2} />
                      ) : (
                        <Eye className="size-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="confirmNewPassword" className="text-sm text-eos-text-muted">
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
                      className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-muted hover:text-eos-text"
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
                    <p className="text-xs text-eos-error">Parolele nu coincid.</p>
                  ) : null}
                </div>

                {error && (
                  <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={loading || (!tokenFromUrl && !recoveryAccessToken)}
                  size="lg"
                  className="w-full gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se schimbă parola...
                    </>
                  ) : (
                    "Schimbă parola"
                  )}
                </Button>
              </form>
            )}

            {/* ── Done mode ───────────────────── */}
            {mode === "done" && (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto size-12 text-eos-success" />
                <p className="text-sm text-eos-text">
                  Parola a fost schimbată. Te redirecționăm...
                </p>
              </div>
            )}

            {/* ── Back to login link ──────────── */}
            {mode !== "done" && (
              <div className="mt-6 text-center text-sm text-eos-text-muted">
                <Link href="/login" className="text-eos-primary hover:underline">
                  Înapoi la autentificare
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
