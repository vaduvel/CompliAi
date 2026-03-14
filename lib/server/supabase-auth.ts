import { getConfiguredAuthBackend } from "@/lib/server/auth"
import { fetchWithOperationalGuard } from "@/lib/server/http-client"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

export type SupabaseIdentity = {
  id: string
  email: string
}

export function hasSupabaseAuthConfig() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_SERVICE_ROLE_KEY)
}

export function shouldUseSupabaseAuth(userAuthProvider?: "local" | "supabase"): boolean {
  if (!hasSupabaseAuthConfig()) return false

  const backend = getConfiguredAuthBackend()
  if (userAuthProvider === "supabase") return true
  return backend === "supabase" || backend === "hybrid"
}

export async function signInSupabaseIdentity(
  email: string,
  password: string
): Promise<SupabaseIdentity> {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("SUPABASE_AUTH_NOT_CONFIGURED")
  }

  const response = await fetchWithOperationalGuard(
    `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      timeoutMs: 8_000,
      retries: 1,
      label: "supabase-auth-login",
    }
  )

  if (!response.ok) {
    if (response.status === 400 || response.status === 401) {
      throw new Error("AUTH_INVALID_CREDENTIALS")
    }
    const text = await response.text()
    throw new Error(`SUPABASE_AUTH_LOGIN_FAILED:${response.status}:${text}`)
  }

  const payload = (await response.json()) as {
    user?: { id?: string; email?: string | null }
  }
  if (!payload.user?.id || !payload.user.email) {
    throw new Error("SUPABASE_AUTH_LOGIN_INVALID_RESPONSE")
  }

  return {
    id: payload.user.id,
    email: payload.user.email,
  }
}

export async function registerSupabaseIdentity(
  email: string,
  password: string
): Promise<SupabaseIdentity> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_AUTH_NOT_CONFIGURED")
  }

  const response = await fetchWithOperationalGuard(
    `${SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`,
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
      }),
      cache: "no-store",
      timeoutMs: 8_000,
      retries: 1,
      label: "supabase-auth-register",
    }
  )

  if (!response.ok) {
    const text = await response.text()
    const normalized = text.toLowerCase()
    if (response.status === 400 || response.status === 422) {
      if (
        normalized.includes("already") ||
        normalized.includes("exists") ||
        normalized.includes("registered")
      ) {
        throw new Error("AUTH_EMAIL_ALREADY_REGISTERED")
      }
    }
    throw new Error(`SUPABASE_AUTH_REGISTER_FAILED:${response.status}:${text}`)
  }

  const payload = (await response.json()) as {
    id?: string
    email?: string | null
    user?: { id?: string; email?: string | null }
  }

  const userId = payload.user?.id || payload.id
  const userEmail = payload.user?.email || payload.email
  if (!userId || !userEmail) {
    throw new Error("SUPABASE_AUTH_REGISTER_INVALID_RESPONSE")
  }

  return {
    id: userId,
    email: userEmail,
  }
}
