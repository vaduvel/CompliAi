"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Mode = "login" | "register"

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orgName, setOrgName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_right,var(--focus-ring-outer),transparent_32%),linear-gradient(180deg,var(--bg-subtle),var(--bg-canvas))] px-4">
      <div className="w-full max-w-md">
        <CompliScanLogoLockup
          className="mb-8"
          variant="gradient"
          size="md"
          subtitle="control operational pentru documente si sisteme AI"
          titleClassName="text-[var(--color-on-surface)]"
          subtitleClassName="text-[var(--color-muted)]"
        />

        <Card className="border-[var(--color-border)] bg-[var(--color-surface)]">
          <CardHeader className="border-b border-[var(--color-border)] pb-5">
            <CardTitle className="text-xl">
              {mode === "login" ? "Autentificare" : "Creeaza cont"}
            </CardTitle>
            <p className="text-sm text-[var(--color-on-surface-muted)]">
              {mode === "login"
                ? "Introdu credentialele tale pentru a accesa dashboard-ul."
                : "Creeaza un cont nou pentru organizatia ta."}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-sm text-[var(--color-on-surface-muted)]">
                    Nume organizatie
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ex: Magazin Online S.R.L."
                    className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm text-[var(--color-on-surface-muted)]">
                  Adresa de email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@firma.ro"
                  required
                  autoComplete="email"
                  className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm text-[var(--color-on-surface-muted)]">Parola</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === "register" ? "Minim 8 caractere" : "Parola ta"}
                    required
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    className="ring-focus h-11 w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-variant)] px-4 pr-12 text-sm text-[var(--color-on-surface)] outline-none placeholder:text-[var(--color-muted)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-muted)] hover:text-[var(--color-on-surface)]"
                  >
                    {showPassword ? (
                      <EyeOff className="size-4" strokeWidth={2} />
                    ) : (
                      <Eye className="size-4" strokeWidth={2} />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-[var(--color-error)] bg-[var(--color-error-muted)] px-4 py-3 text-sm text-[var(--color-error)]">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="h-11 w-full rounded-xl bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
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

            <div className="mt-6 text-center text-sm text-[var(--color-on-surface-muted)]">
              {mode === "login" ? (
                <>
                  Nu ai cont?{" "}
                  <button
                    onClick={() => {
                      setMode("register")
                      setError(null)
                    }}
                    className="text-[var(--color-primary)] hover:underline"
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
                    className="text-[var(--color-primary)] hover:underline"
                  >
                    Autentifica-te
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Scorul si recomandarile sunt sugestii operationale, nu sfat juridic.
          <br />
          Verifica uman inainte de orice raport oficial.
        </p>
      </div>
    </div>
  )
}
