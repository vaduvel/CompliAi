const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

export function hasSupabaseStorageConfig() {
  return Boolean(SUPABASE_URL && SERVICE_ROLE_KEY)
}

export async function getSupabaseBucketStatus(bucketName: string) {
  const response = await storageRequest(`/bucket/${encodeURIComponent(bucketName)}`, {
    method: "GET",
  })

  if (response.ok) {
    return {
      ok: true,
      name: bucketName,
    }
  }

  const text = await response.text()
  const normalized = text.toLowerCase()

  if (response.status === 400 || response.status === 404) {
    if (normalized.includes("bucket not found") || normalized.includes("not found")) {
      return {
        ok: false,
        name: bucketName,
        state: "missing_bucket" as const,
        error: text,
      }
    }
  }

  return {
    ok: false,
    name: bucketName,
    state: "error" as const,
    error: text,
  }
}

export async function ensureSupabaseBucket(bucketName: string) {
  const response = await storageRequest(`/bucket`, {
    method: "POST",
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: false,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (response.ok) {
    return { bucketName, created: true }
  }

  const text = await response.text()
  if (response.status === 400 || response.status === 409) {
    const normalized = text.toLowerCase()
    if (normalized.includes("exists") || normalized.includes("duplicate")) {
      return { bucketName, created: false }
    }
  }

  throw new Error(`Supabase Storage bucket error ${response.status}: ${text}`)
}

export async function uploadSupabaseTextObject(
  bucketName: string,
  objectPath: string,
  content: string
) {
  return uploadSupabaseObject(
    bucketName,
    objectPath,
    Buffer.from(content, "utf8"),
    "text/plain; charset=utf-8"
  )
}

export async function uploadSupabaseObject(
  bucketName: string,
  objectPath: string,
  content: Buffer,
  contentType: string
) {
  const response = await storageRequest(`/object/${encodePath(bucketName, objectPath)}`, {
    method: "POST",
    body: new Uint8Array(content),
    headers: {
      "Content-Type": contentType,
      "x-upsert": "true",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase Storage upload error ${response.status}: ${text}`)
  }

  return (await response.json()) as { Key: string; Id?: string }
}

export async function downloadSupabaseObject(bucketName: string, objectPath: string) {
  const response = await storageRequest(`/object/${encodePath(bucketName, objectPath)}`, {
    method: "GET",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase Storage download error ${response.status}: ${text}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

export async function createSignedSupabaseObjectUrl(
  bucketName: string,
  objectPath: string,
  expiresInSeconds = 60
) {
  const response = await storageRequest(`/object/sign/${encodePath(bucketName, objectPath)}`, {
    method: "POST",
    body: JSON.stringify({
      expiresIn: normalizeExpiresInSeconds(expiresInSeconds),
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Supabase Storage sign error ${response.status}: ${text}`)
  }

  const payload = (await response.json()) as { signedURL?: string }
  if (!payload.signedURL) {
    throw new Error("Supabase Storage sign response lipseste signedURL.")
  }

  if (/^https?:\/\//i.test(payload.signedURL)) {
    return payload.signedURL
  }

  const normalizedBase = SUPABASE_URL?.replace(/\/$/, "")
  if (!normalizedBase) {
    throw new Error("Supabase env vars lipsa pentru storage.")
  }

  const normalizedPath = payload.signedURL.startsWith("/storage/v1")
    ? payload.signedURL
    : payload.signedURL.startsWith("/")
      ? `/storage/v1${payload.signedURL}`
      : `/storage/v1/${payload.signedURL}`

  return `${normalizedBase}${normalizedPath}`
}

export async function runSupabaseKeepalive(options?: { source?: string; note?: string }) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars lipsa pentru keepalive.")
  }

  const bucketName = process.env.COMPLISCAN_SUPABASE_KEEPALIVE_BUCKET?.trim() || "compliscan-heartbeat"
  const objectPath =
    process.env.COMPLISCAN_SUPABASE_KEEPALIVE_OBJECT?.trim() || "cron/last-ping.txt"
  const timestamp = new Date().toISOString()
  const source = options?.source?.trim() || "manual"
  const note = options?.note?.trim() || "Supabase keepalive ping"

  const bucket = await ensureSupabaseBucket(bucketName)
  const uploaded = await uploadSupabaseTextObject(
    bucketName,
    objectPath,
    [`CompliScan heartbeat`, `timestamp=${timestamp}`, `source=${source}`, `note=${note}`].join(
      "\n"
    )
  )

  return {
    bucketName,
    createdBucket: bucket.created,
    objectPath,
    objectKey: uploaded.Key,
    timestamp,
    source,
  }
}

async function storageRequest(
  endpoint: string,
  options: {
    method: "GET" | "POST"
    body?: string | Uint8Array
    headers?: Record<string, string>
  }
) {
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    throw new Error("Supabase env vars lipsa pentru storage.")
  }

  const response = await fetch(`${SUPABASE_URL.replace(/\/$/, "")}/storage/v1${endpoint}`, {
    method: options.method,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(options.headers ?? {}),
    },
    body: options.body as BodyInit | undefined,
    cache: "no-store",
  })

  return response
}

function encodePath(bucketName: string, objectPath: string) {
  return [bucketName, ...objectPath.split("/").filter(Boolean)]
    .map((segment) => encodeURIComponent(segment))
    .join("/")
}

function normalizeExpiresInSeconds(value: number) {
  if (!Number.isFinite(value)) {
    return 60
  }

  return Math.max(15, Math.min(900, Math.round(value)))
}
