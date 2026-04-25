"use client"

import Link from "next/link"
import { Suspense, useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import { CompliScanLogoLockup } from "@/components/compliscan/logo"

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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-eos-bg text-eos-text">
      <div className="grid min-h-screen lg:grid-cols-[1fr_minmax(380px,440px)]">
        {/* ── LEFT — Context panel (V3 ambient) ───────────────────────────── */}
        <div className="relative hidden overflow-hidden border-r border-eos-border bg-gradient-to-br from-eos-surface via-eos-bg to-eos-bg lg:block">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute right-[10%] top-[10%] size-[400px] rounded-full bg-eos-primary/15 blur-[100px]" />
          </div>

          <div className="relative flex h-full flex-col px-12 py-14 xl:px-16">
            <Link href="/" className="block w-fit">
              <CompliScanLogoLockup variant="flat" size="sm" />
            </Link>

            <div className="my-auto max-w-md">
              <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                Transfer ownership · invitație consultant
              </p>
              <h2
                data-display-text="true"
                className="mt-4 font-display text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] text-eos-text xl:text-[38px]"
                style={{ textWrap: "balance" }}
              >
                Preia controlul firmei tale.
                <br />
                Consultantul rămâne ca suport.
              </h2>
              <p className="mt-4 text-[14px] leading-[1.65] text-eos-text-muted">
                Cabinetul ți-a configurat conformitatea ca pre-setup. Acum poți deveni
                owner și gestiona membrii, exporturile și billing-ul.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    title: "Tu devii proprietar",
                    desc: "Drepturi complete pe organizație, inclusiv gestionare echipă.",
                  },
                  {
                    icon: CheckCircle2,
                    title: "Consultantul rămâne onboarded",
                    desc: "Continuă să lucreze ca operator — îl poți elimina oricând.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-eos-lg border border-eos-border bg-eos-surface/60 p-3.5 backdrop-blur-md"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10">
                      <item.icon className="size-4 text-eos-primary" strokeWidth={1.75} />
                    </div>
                    <div>
                      <p
                        data-display-text="true"
                        className="font-display text-[13.5px] font-semibold tracking-[-0.01em] text-eos-text"
                      >
                        {item.title}
                      </p>
                      <p className="mt-1 text-[12px] leading-[1.5] text-eos-text-muted">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-8 font-mono text-[10px] uppercase tracking-[0.06em] text-eos-text-tertiary">
              Conexiune securizată · token cu validare server-side
            </div>
          </div>
        </div>

        {/* ── RIGHT — Form ─────────────────────────────────────────────────── */}
        <div className="flex flex-col px-6 py-8 md:px-10 md:py-10">
          <div className="flex items-center justify-between gap-3 lg:hidden">
            <Link href="/">
              <CompliScanLogoLockup variant="flat" size="sm" />
            </Link>
          </div>

          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
            {done ? (
              <div className="text-center">
                <div className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full border border-eos-success/30 bg-eos-success-soft">
                  <CheckCircle2 className="size-6 text-eos-success" strokeWidth={2} />
                </div>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-success">
                  Ownership revendicat
                </p>
                <h1
                  data-display-text="true"
                  className="mt-3 font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.025em] text-eos-text"
                >
                  Te ducem în dashboard...
                </h1>
                <p className="mt-3 text-[13.5px] leading-[1.55] text-eos-text-muted">
                  Sesiunea activă reflectă noul rol de owner. Poți gestiona acum
                  membrii, exporturile și billing-ul.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 font-mono text-[11px] text-eos-text-tertiary">
                  <Loader2 className="size-3.5 animate-spin" />
                  redirecționare automată
                </div>
              </div>
            ) : (
              <>
                <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-eos-primary">
                  Pasul final
                </p>
                <h1
                  data-display-text="true"
                  className="mt-2 font-display text-[30px] font-semibold leading-[1.1] tracking-[-0.025em] text-eos-text md:text-[34px]"
                >
                  Revendică organizația
                </h1>
                <p className="mt-3 text-[13.5px] leading-[1.65] text-eos-text-muted">
                  Confirmă că vrei să preiei dreptul de proprietar al firmei
                  partajate de consultantul tău.
                </p>

                <form onSubmit={(event) => void handleAccept(event)} className="mt-8 space-y-4">
                  {!token && (
                    <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                      Link-ul de claim este invalid sau lipsește tokenul.
                    </div>
                  )}

                  {loadingCurrentUser ? (
                    <div className="flex items-center gap-2.5 rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-2.5 font-mono text-[11.5px] text-eos-text-muted">
                      <Loader2 className="size-3.5 animate-spin" />
                      Verificăm dacă ai deja o sesiune activă...
                    </div>
                  ) : currentUserEmail ? (
                    <div className="rounded-eos-sm border border-eos-primary/25 bg-eos-primary/10 px-3.5 py-3 text-[12.5px] leading-[1.55] text-eos-text-muted">
                      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-eos-primary">
                        Sesiune activă
                      </p>
                      <p className="mt-1.5">
                        Vei revendica organizația cu contul:{" "}
                        <strong className="text-eos-text">{currentUserEmail}</strong>
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="rounded-eos-sm border border-eos-border bg-white/[0.02] px-3.5 py-2.5 text-[12.5px] leading-[1.55] text-eos-text-muted">
                        Dacă nu ai încă acces, alege acum parola pentru contul care
                        va deveni owner.
                      </div>
                      <div className="space-y-1.5">
                        <label
                          htmlFor="claimPassword"
                          className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                        >
                          Parola nouă
                        </label>
                        <div className="relative">
                          <input
                            id="claimPassword"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Minim 8 caractere"
                            autoComplete="new-password"
                            className="h-11 w-full rounded-eos-sm border border-eos-border bg-eos-surface px-3 pr-11 text-[13.5px] text-eos-text outline-none transition-colors placeholder:text-eos-text-tertiary focus:border-eos-primary/50"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-eos-text-tertiary transition-colors hover:text-eos-text-muted"
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
                        <label
                          htmlFor="claimConfirmPassword"
                          className="block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-eos-text-tertiary"
                        >
                          Confirmă parola
                        </label>
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
                            onClick={() => setShowConfirmPassword((value) => !value)}
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
                          <p className="font-mono text-[11px] text-eos-error">
                            Parolele nu coincid.
                          </p>
                        ) : null}
                      </div>
                    </>
                  )}

                  {error ? (
                    <div className="rounded-eos-sm border border-eos-error/30 bg-eos-error-soft px-3.5 py-2.5 font-mono text-[11.5px] text-eos-error">
                      {error}
                      {loginRequired ? (
                        <div className="mt-2.5">
                          <Link
                            href={loginHref}
                            className="font-mono text-[11px] uppercase tracking-[0.06em] text-eos-primary underline-offset-2 hover:underline"
                          >
                            → Autentifică-te și revino la claim
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={submitting || loadingCurrentUser || !token}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-eos-sm bg-eos-primary text-[13.5px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)] transition-all hover:bg-eos-primary/90 disabled:cursor-not-allowed disabled:bg-eos-primary/50 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Se procesează...
                      </>
                    ) : (
                      <>
                        Revendică organizația
                        <ArrowRight className="size-4" strokeWidth={2.5} />
                      </>
                    )}
                  </button>

                  <p className="text-[11.5px] leading-[1.55] text-eos-text-tertiary">
                    Claim-ul nu mută automat billing-ul și nu schimbă consultantul
                    curent. După acceptare, vei putea gestiona membrii și elimina
                    consultantul dacă este necesar.
                  </p>
                </form>
              </>
            )}
          </div>

          <p className="mt-auto pt-6 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-eos-text-tertiary">
            © 2026 CompliScan · Token cu validare server-side
          </p>
        </div>
      </div>
    </div>
  )
}
