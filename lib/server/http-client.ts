import { logOperationalEvent } from "@/lib/server/operational-logger"

const DEFAULT_RETRYABLE_STATUSES = [408, 409, 425, 429, 500, 502, 503, 504]

export type OperationalFetchOptions = RequestInit & {
  timeoutMs?: number
  retries?: number
  retryDelayMs?: number
  retryOnStatuses?: number[]
  label?: string
}

export async function fetchWithOperationalGuard(
  input: string | URL,
  options: OperationalFetchOptions = {}
) {
  const {
    timeoutMs = 8_000,
    retries = 1,
    retryDelayMs = 250,
    retryOnStatuses = DEFAULT_RETRYABLE_STATUSES,
    label = typeof input === "string" ? input : input.toString(),
    ...requestInit
  } = options

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const response = await fetch(input, {
        ...requestInit,
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (retryOnStatuses.includes(response.status) && attempt < retries) {
        logOperationalEvent("warn", "http.retry.status", undefined, {
          route: "http-client",
          message: `Retrying request for ${label} after status ${response.status}.`,
          metadata: {
            attempt: attempt + 1,
            label,
            retries,
            status: response.status,
          },
        })
        await delay(retryDelayMs * (attempt + 1))
        continue
      }

      return response
    } catch (error) {
      clearTimeout(timeout)

      const normalizedError =
        error instanceof Error
          ? error
          : new Error(`Request esuat pentru ${label}.`)

      if (normalizedError.name === "AbortError") {
        lastError = new Error(`HTTP_TIMEOUT:${label}:${timeoutMs}`)
      } else {
        lastError = normalizedError
      }

      if (attempt < retries) {
        logOperationalEvent("warn", "http.retry.error", undefined, {
          route: "http-client",
          errorName: lastError.name,
          message: lastError.message,
          metadata: {
            attempt: attempt + 1,
            label,
            retries,
          },
        })
        await delay(retryDelayMs * (attempt + 1))
        continue
      }

      throw lastError
    }
  }

  throw lastError ?? new Error(`Request esuat pentru ${label}.`)
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
