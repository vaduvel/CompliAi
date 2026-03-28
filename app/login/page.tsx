"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react"
import { toast } from "sonner"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

type Mode = "login" | "register"

function resolveSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard"
  }
  return value
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginContent />
    </Suspense>
  )
}

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const nextPath = resolveSafeNextPath(searchParams.get("next"))
  const initialMode = searchParams.get("mode") === "register" ? "register" : "login"
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
      const body = mode === "login" ? { email, password } : { email, password, orgName }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string; code?: string }

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

      const destination =
        mode === "register" && nextPath === "/dashboard" ? "/onboarding" : nextPath

      toast.success(mode === "login" ? "Autentificat cu succes" : "Cont creat cu succes", {
        description:
          mode === "register"
            ? "Te ducem direct în configurarea inițială a organizației."
            : undefined,
      })
      router.push(destination)
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

  const VALUE_PROPS = [
    "NIS2, GDPR, AI Act, e-Factura — totul într-un loc",
    "Import automat din SPV / e-Factura ANAF",
    "Dosar de control gata de descărcat oricând",
  ]

  const submitDisabled =
    loading ||
    (mode === "register" &&
      (!acceptedTerms || !confirmPassword || password !== confirmPassword))

  return (
    <div className="min-h-screen bg-eos-bg px-4 py-12 text-eos-text">

      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-blue-600/[0.06] blur-[120px]" />
      </div>

      <div className="relative mx-auto w-full max-w-md">

        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Link href="/">
            <CompliScanLogoLockup variant="flat" size="md" />
          </Link>
        </div>

        {/* Tagline */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-eos-text">
            Află ce ți se aplică.{" "}
            <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
              Fii gata de control.
            </span>
          </h1>
          <ul className="mt-4 space-y-2">
            {VALUE_PROPS.map((prop) => (
              <li key={prop} className="flex items-center justify-center gap-2 text-sm text-eos-text-muted">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500/70" strokeWidth={2.5} />
                {prop}
              </li>
            ))}
          </ul>
        </div>

        {/* Card */}
        <div className="rounded-eos-xl border border-eos-border bg-eos-surface-variant shadow-[0_32px_80px_rgba(0,0,0,0.4)]">

          {/* Mode toggle */}
          <div className="flex border-b border-eos-border-subtle p-1.5">
            <button
              type="button"
              onClick={switchToLogin}
              className={[
                "flex-1 rounded-eos-lg py-2.5 text-sm font-semibold transition-all",
                mode === "login"
                  ? "bg-eos-surface-elevated text-eos-text shadow-sm"
                  : "text-eos-text-tertiary hover:text-eos-text-muted",
              ].join(" ")}
            >
              Autentificare
            </button>
            <button
              type="button"
              onClick={switchToRegister}
              className={[
                "flex-1 rounded-eos-lg py-2.5 text-sm font-semibold transition-all",
                mode === "register"
                  ? "bg-eos-surface-elevated text-eos-text shadow-sm"
                  : "text-eos-text-tertiary hover:text-eos-text-muted",
              ].join(" ")}
            >
              Cont nou
              {mode === "register" && (
                <span className="ml-2 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-eos-primary">
                  14 zile Pro
                </span>
              )}
            </button>
          </div>

          {/* Form */}
          <div className="px-6 py-7">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">

              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-eos-text-tertiary">
                    Denumirea firmei
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: BRRR SRL"
                    required
                    autoComplete="organization"
                    className="h-12 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-blue-500/50 focus:bg-eos-surface-active transition-all"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-eos-text-tertiary">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@firma.ro"
                  required
                  autoComplete="email"
                  className="h-12 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-blue-500/50 focus:bg-eos-surface-active transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-eos-text-tertiary">
                  Parolă
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minim 8 caractere" : "Parola ta"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="h-12 w-full rounded-eos-lg border border-eos-border bg-eos-surface-active px-4 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary focus:border-blue-500/50 focus:bg-eos-surface-active transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                    aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" strokeWidth={2} />
                    ) : (
                      <Eye className="h-4 w-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-eos-text-tertiary">
                    Confirmă parola
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Tastează parola încă o dată"
                      required
                      autoComplete="new-password"
                      className={[
                        "h-12 w-full rounded-eos-lg border bg-eos-surface-active px-4 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-tertiary transition-all",
                        confirmPassword && password !== confirmPassword
                          ? "border-red-500/40 focus:border-red-500/60"
                          : confirmPassword && password === confirmPassword
                            ? "border-emerald-500/40 focus:border-emerald-500/50"
                            : "border-eos-border focus:border-blue-500/50 focus:bg-eos-surface-active",
                      ].join(" ")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                      aria-label={showConfirmPassword ? "Ascunde confirmarea" : "Arată confirmarea"}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" strokeWidth={2} />
                      ) : (
                        <Eye className="h-4 w-4" strokeWidth={2} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-xs text-eos-error/80">Parolele nu coincid.</p>
                  )}
                  {confirmPassword && password === confirmPassword && password.length >= 8 && (
                    <p className="flex items-center gap-1.5 text-xs text-eos-success/80">
                      <CheckCircle2 className="h-3 w-3" strokeWidth={2.5} /> Parolele coincid
                    </p>
                  )}
                </div>
              )}

              {mode === "register" && (
                <label className="flex cursor-pointer items-start gap-3 rounded-eos-lg border border-eos-border bg-eos-surface-variant px-4 py-3.5">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500"
                  />
                  <span className="text-xs leading-relaxed text-eos-text-tertiary">
                    Am citit și accept{" "}
                    <Link href="/terms" target="_blank" className="text-eos-primary hover:text-blue-300 hover:underline">
                      Termenii și Condițiile
                    </Link>{" "}
                    și{" "}
                    <Link href="/privacy" target="_blank" className="text-eos-primary hover:text-blue-300 hover:underline">
                      Politica de Confidențialitate
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-eos-lg border border-eos-error-border bg-red-500/10 px-4 py-3 text-sm text-eos-error">
                  {error}
                </div>
              )}

              {mode === "register" && registerDuplicateEmail && (
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={switchToLogin}
                    className="text-sm text-eos-primary hover:text-blue-300 hover:underline"
                  >
                    Mergi la autentificare
                  </button>
                  <Link href="/reset-password" className="text-sm text-eos-primary hover:text-blue-300 hover:underline">
                    Resetează parola
                  </Link>
                </div>
              )}

              <button
                type="submit"
                disabled={submitDisabled}
                className="flex w-full items-center justify-center gap-2 rounded-eos-lg bg-blue-600 py-3.5 text-sm font-semibold text-eos-text shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === "login" ? "Se autentifică..." : "Se creează contul..."}
                  </>
                ) : mode === "login" ? (
                  <>
                    Autentificare
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </>
                ) : (
                  <>
                    Creează cont gratuit
                    <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
                  </>
                )}
              </button>

            </form>

            {mode === "login" && (
              <div className="mt-4 text-center">
                <Link
                  href="/reset-password"
                  className="text-xs text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
                >
                  Am uitat parola
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs leading-relaxed text-eos-text-tertiary">
          Nu oferim consiliere juridică. Oferim instrumente de pregătire.
          <br />
          Verificați cu un specialist înainte de orice raport oficial.
        </p>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-eos-bg/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-eos-xl border border-eos-border bg-eos-surface-active px-5 py-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-eos-lg bg-eos-primary-soft">
                <Loader2 className="h-5 w-5 animate-spin text-eos-primary" strokeWidth={2} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-eos-text">
                  {mode === "login" ? "Te autentificăm acum" : "Creăm contul tău"}
                </p>
                <p className="text-sm text-eos-text-tertiary">
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
