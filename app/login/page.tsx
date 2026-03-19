"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { CheckCircle2, Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type Mode = "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgName, setOrgName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register"
      const body = mode === "login" ? { email, password } : { email, password, orgName }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = (await response.json()) as { ok?: boolean; error?: string }

      if (!response.ok) {
        setError(data.error || "A aparut o eroare.")
        return
      }

      toast.success(mode === "login" ? "Autentificat cu succes" : "Cont creat cu succes")
      router.push("/dashboard")
    } catch {
      setError("Eroare de retea. Incearca din nou.")
    } finally {
      setLoading(false)
    }
  }

  const VALUE_PROPS = [
    "NIS2, GDPR, AI Act, e-Factura — totul într-un loc",
    "Import automat din SPV / e-Factura ANAF",
    "Dosar de control gata de descărcat pentru orice inspecție",
  ]

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

        {/* Tagline */}
        <p className="mb-3 text-lg font-semibold leading-snug text-eos-text">
          Află ce ți se aplică. Pregătește dovezile.{" "}
          <span className="text-eos-primary">Fii gata de control.</span>
        </p>

        {/* Value props */}
        <ul className="mb-8 space-y-2">
          {VALUE_PROPS.map((prop) => (
            <li key={prop} className="flex items-center gap-2 text-sm text-eos-text-muted">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-500" strokeWidth={2} />
              {prop}
            </li>
          ))}
        </ul>

        <Card className="border-eos-border bg-eos-surface">
          <CardHeader className="border-b border-eos-border pb-5">
            <CardTitle className="text-xl">
              {mode === "login" ? "Autentificare" : "Creeaza cont"}
            </CardTitle>
            <p className="text-sm text-eos-text-muted">
              {mode === "login"
                ? "Introdu credentialele tale pentru a accesa dashboard-ul."
                : "Creeaza un cont nou pentru organizatia ta."}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-sm text-eos-text-muted">
                    Nume organizatie
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Magazin Online S.R.L."
                    className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm text-eos-text-muted">
                  Adresa de email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@firma.ro"
                  required
                  autoComplete="email"
                  className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-eos-text-muted">Parola</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minim 8 caractere" : "Parola ta"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-muted hover:text-eos-text"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {mode === "register" && (
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 size-4 shrink-0 rounded border-eos-border accent-eos-primary"
                  />
                  <span className="text-xs leading-relaxed text-eos-text-muted">
                    Am citit și accept{" "}
                    <Link href="/terms" target="_blank" className="text-eos-primary hover:underline">
                      Termenii și Condițiile
                    </Link>{" "}
                    și{" "}
                    <Link href="/privacy" target="_blank" className="text-eos-primary hover:underline">
                      Politica de Confidențialitate
                    </Link>
                    .
                  </span>
                </label>
              )}

              {error && (
                <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || (mode === "register" && !acceptedTerms)}
                size="lg"
                className="w-full gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {mode === "login" ? "Se autentifica..." : "Se creeaza contul..."}
                  </>
                ) : mode === "login" ? (
                  "Autentificare"
                ) : (
                  "Creeaza cont"
                )}
              </Button>
            </form>

            {mode === "login" && (
              <div className="mt-4 text-center">
                <Link
                  href="/reset-password"
                  className="text-sm text-eos-text-muted hover:text-eos-primary hover:underline"
                >
                  Am uitat parola
                </Link>
              </div>
            )}

            <div className="mt-4 text-center text-sm text-eos-text-muted">
              {mode === "login" ? (
                <>
                  Nu ai cont?{" "}
                  <button
                    onClick={() => {
                      setMode("register")
                      setError(null)
                    }}
                    className="text-eos-primary hover:underline"
                  >
                    Inregistreaza-te
                  </button>
                </>
              ) : (
                <>
                  Ai deja cont?{" "}
                  <button
                    onClick={() => {
                      setMode("login")
                      setError(null)
                    }}
                    className="text-eos-primary hover:underline"
                  >
                    Autentifica-te
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-eos-text-muted">
          Nu oferim consiliere juridică. Oferim instrumente de pregătire.
          <br />
          Verificați cu un specialist înainte de orice raport oficial.
        </p>
      </div>
    </div>
  )
}
