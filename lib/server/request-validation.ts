export class RequestValidationError extends Error {
  status: number
  code: string

  constructor(message: string, status = 400, code = "INVALID_REQUEST") {
    super(message)
    this.name = "RequestValidationError"
    this.status = status
    this.code = code
  }
}

export function asTrimmedString(value: unknown, maxLength: number) {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  if (!trimmed) return undefined
  return trimmed.slice(0, maxLength)
}

export function requirePlainObject(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Payload-ul trebuie sa fie un obiect JSON valid.")
  }

  return value as Record<string, unknown>
}

export function ensureMaxLength(value: string, maxLength: number, message: string) {
  if (value.length > maxLength) {
    throw new RequestValidationError(message)
  }
}

export function ensureAllowedPattern(value: string, pattern: RegExp, message: string) {
  if (!pattern.test(value)) {
    throw new RequestValidationError(message)
  }
}

export function normalizeOptionalNote(value: unknown, maxLength: number) {
  if (value == null) return null
  if (typeof value !== "string") {
    throw new RequestValidationError("Nota trebuie sa fie text simplu.")
  }

  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.length > maxLength) {
    throw new RequestValidationError(`Nota este prea lunga. Limita curenta este ${maxLength} caractere.`)
  }

  return trimmed
}

export function estimateBase64Size(base64: string) {
  const sanitized = base64.replace(/\s+/g, "")
  const padding = sanitized.endsWith("==") ? 2 : sanitized.endsWith("=") ? 1 : 0
  return Math.max(0, Math.floor((sanitized.length * 3) / 4) - padding)
}

export function ensureBase64Like(value: string, message: string) {
  if (!/^[a-z0-9+/=\s_-]+$/i.test(value)) {
    throw new RequestValidationError(message)
  }
}
