"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"
import { Button } from "@/components/evidence-os/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/evidence-os/Card"

type ClaimResponse = {
  ok?: boolean
  message?: string
  error?: string
  code?: string
}

export default function ClaimPage() {
  return (
    <Suspense fallback={null}>
      <ClaimContent />
    </Suspense>
  )
}

function ClaimContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")?.trim() || ""
  const loginHref = useMemo(
    () => `/login?next=${encodeURIComponent(token ? `/claim?token=${token}` : "/claim")}`,
    [token]
  )

  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null)
  const [loadingCurrentUser, setLoadingCurrentUser] = useState(true)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loginRequired, setLoginRequired] = useState(false)

  useEffect(() => {
    let active = true

    const loadCurrentUser = async () => {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const data = (await response.json()) as { user?: { email?: string | null } | null }
        if (!active) return
        setCurrentUserEmail(data.user?.email ?? null)
      } catch {
        if (!active) return
        setCurrentUserEmail(null)
      } finally {
        if (active) {
          setLoadingCurrentUser(false)
        }
      }
    }

    void loadCurrentUser()

    return () => {
      active = false
    }
  }, [])

  async function handleAccept(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setLoginRequired(false)

    if (!token) {
      setError("Link-ul de claim este incomplet sau invalid.")
      return
    }

    if (!currentUserEmail) {
      if (!password || password.length < 8) {
        setError("Alege o parolă de cel puțin 8 caractere pentru a revendica organizația.")
        return
      }
      if (password !== confirmPassword) {
        setError("Parolele nu coincid.")
        return
      }
    }

    setSubmitting(true)
    try {
      const response = await fetch("/api/auth/claim-accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          password: currentUserEmail ? undefined : password,
        }),
      })

      const data = (await response.json()) as ClaimResponse
      if (!response.ok) {
        if (data.code === "CLAIM_LOGIN_REQUIRED") {
          setLoginRequired(true)
        }
        setError(data.error || "Claim-ul nu a putut fi acceptat.")
        return
      }

      setDone(true)
      setTimeout(() => router.push("/dashboard"), 1600)
    } catch {
      setError("Eroare de rețea. Încearcă din nou.")
    } finally {
      setSubmitting(false)
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
              {done ? "Ownership revendicat" : "Revendică organizația"}
            </CardTitle>
            <p className="text-sm text-eos-text-muted">
              {done
                ? "Te redirecționăm către spațiul de lucru al firmei revendicate."
                : "Confirmă că vrei să preiei dreptul de proprietar al firmei partajate de consultantul tău."}
            </p>
          </CardHeader>

          <CardContent className="pt-6">
            {done ? (
              <div className="space-y-4 text-center">
                <CheckCircle2 className="mx-auto size-12 text-eos-success" />
                <p className="text-sm text-eos-text">
                  Ownership-ul a fost revendicat cu succes. Vei fi dus direct în dashboard.
                </p>
              </div>
            ) : (
              <form onSubmit={(event) => void handleAccept(event)} className="space-y-4">
                {!token && (
                  <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    Link-ul de claim este invalid sau lipsește tokenul.
                  </div>
                )}

                {loadingCurrentUser ? (
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3 text-sm text-eos-text-muted">
                    Verificăm dacă ai deja o sesiune activă...
                  </div>
                ) : currentUserEmail ? (
                  <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3 text-sm text-eos-text-muted">
                    Vei revendica organizația cu sesiunea activă: <strong>{currentUserEmail}</strong>
                  </div>
                ) : (
                  <>
                    <div className="rounded-eos-md border border-eos-border bg-eos-surface-variant px-4 py-3 text-sm text-eos-text-muted">
                      Dacă nu ai încă acces, alege acum parola pentru contul care va deveni owner.
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="claimPassword" className="text-sm text-eos-text-muted">Parola</label>
                      <div className="relative">
                        <input
                          id="claimPassword"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Minim 8 caractere"
                          autoComplete="new-password"
                          className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-muted hover:text-eos-text"
                          aria-label={showPassword ? "Ascunde parola" : "Arată parola"}
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
                      <label htmlFor="claimConfirmPassword" className="text-sm text-eos-text-muted">Confirmă parola</label>
                      <div className="relative">
                        <input
                          id="claimConfirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Repetă parola"
                          autoComplete="new-password"
                          aria-invalid={Boolean(confirmPassword && password !== confirmPassword)}
                          className="ring-focus h-9 w-full rounded-eos-md border border-eos-border bg-eos-surface-variant px-3 pr-12 text-sm text-eos-text outline-none placeholder:text-eos-text-muted"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
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
                  </>
                )}

                {error ? (
                  <div className="rounded-eos-md border border-eos-error-border bg-eos-error-soft px-4 py-3 text-sm text-eos-error">
                    {error}
                    {loginRequired ? (
                      <div className="mt-3">
                        <Link href={loginHref} className="text-sm text-eos-primary hover:underline">
                          Autentifică-te și revino la claim
                        </Link>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Button
                  type="submit"
                  disabled={submitting || loadingCurrentUser || !token}
                  size="lg"
                  className="w-full gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Se procesează...
                    </>
                  ) : (
                    "Revendică organizația"
                  )}
                </Button>

                <p className="text-xs leading-5 text-eos-text-muted">
                  Claim-ul nu mută automat billing-ul și nu schimbă consultantul curent. După acceptare, vei putea
                  gestiona membrii și elimina consultantul dacă este necesar.
                </p>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
