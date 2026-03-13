type HttpMethod = "GET" | "POST" | "PATCH"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function hasSupabaseConfig() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)
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
  schema = "compliscan"
): Promise<TResult[]> {
  return request<TResult[]>("POST", table, {
    body,
    schema,
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

  const res = await fetch(url, {
    method,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Supabase error ${res.status}: ${text}`)
  }

  return (await res.json()) as T
}

