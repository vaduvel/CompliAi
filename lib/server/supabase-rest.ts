import { fetchWithOperationalGuard } from "@/lib/server/http-client"

type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Circuit breaker: după un ENOTFOUND / fetch failed, marcăm Supabase ca
// indisponibil X secunde și aruncăm imediat eroarea fără a face fetch real.
// Asta previne ca fiecare API call să aștepte 8s timeout + retry când URL-ul
// e nereachable (offline dev, DNS spart). Caller-ul cu fallback local devine
// instantaneu rapid.
const CIRCUIT_OPEN_MS = 60_000
let circuitOpenedAt = 0

export function hasSupabaseConfig() {
  // Circuit open ⇒ pretindem că nu există config, ca toți consumatorii cu
  // pattern `if (hasSupabaseConfig()) {...} else {local}` să meargă pe ramura
  // locală automat. După CIRCUIT_OPEN_MS Supabase devine din nou eligibil.
  if (isCircuitOpen()) return false
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)
}

// Helper pentru testare: forțează închiderea circuitului.
export function _resetSupabaseCircuit() {
  circuitOpenedAt = 0
}

function isCircuitOpen(): boolean {
  if (!circuitOpenedAt) return false
  if (Date.now() - circuitOpenedAt > CIRCUIT_OPEN_MS) {
    circuitOpenedAt = 0
    return false
  }
  return true
}

function tripCircuit(): void {
  circuitOpenedAt = Date.now()
}

function isNetworkFailure(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  if (msg.includes("fetch failed")) return true
  if (msg.includes("enotfound")) return true
  if (msg.includes("econnrefused")) return true
  if (msg.includes("network error")) return true
  if (msg.includes("etimedout")) return true
  const cause = (err as { cause?: unknown }).cause
  if (cause && cause !== err) return isNetworkFailure(cause)
  return false
}

export async function supabaseSelect<T>(
  table: string,
  queryString: string,
  schema = "compliscan"
): Promise<T[]> {
  return request<T[]>("GET", table, { queryString, schema })
}

export async function supabaseInsert<TBody extends object, TResult>(
  table: string,
  body: TBody | TBody[],
  schema = "compliscan"
): Promise<TResult[]> {
  return request<TResult[]>("POST", table, {
    body,
    schema,
    prefer: "return=representation",
  })
}

export async function supabaseUpsert<TBody extends object, TResult>(
  table: string,
  body: TBody | TBody[],
  schema = "compliscan",
  queryString?: string
): Promise<TResult[]> {
  return request<TResult[]>("POST", table, {
    body,
    schema,
    queryString,
    prefer: "resolution=merge-duplicates,return=representation",
  })
}

export async function supabaseUpdate<TResult>(
  table: string,
  queryString: string,
  body: object,
  schema = "compliscan"
): Promise<TResult[]> {
  return request<TResult[]>("PATCH", table, {
    body,
    queryString,
    schema,
    prefer: "return=representation",
  })
}

export async function supabaseDelete(
  table: string,
  queryString: string,
  schema = "compliscan"
): Promise<void> {
  await request<unknown>("DELETE", table, { queryString, schema })
}

async function request<T>(
  method: HttpMethod,
  table: string,
  options: {
    body?: object | object[]
    queryString?: string
    schema: string
    prefer?: string
  }
): Promise<T> {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars lipsă.")
  }

  if (isCircuitOpen()) {
    throw new Error("Supabase circuit open: fetch failed recently, skipping retry")
  }

  const url = new URL(`${SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${table}`)
  if (options.queryString) {
    const query = new URLSearchParams(options.queryString)
    query.forEach((value, key) => url.searchParams.set(key, value))
  }

  const headers: HeadersInit = {
    apikey: SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    Accept: "application/json",
    "Accept-Profile": options.schema,
    "Content-Profile": options.schema,
    "Content-Type": "application/json",
  }
  if (options.prefer) headers.Prefer = options.prefer

  let res: Response
  try {
    res = await fetchWithOperationalGuard(url, {
      method,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      timeoutMs: 8_000,
      retries: 1,
      label: `supabase-rest:${table}`,
    })
  } catch (err) {
    if (isNetworkFailure(err)) tripCircuit()
    throw err
  }

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }

  return (await res.json()) as T
}
