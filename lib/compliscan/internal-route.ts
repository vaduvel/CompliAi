const DEFAULT_FALLBACK_ROUTE = "/dashboard"

export function sanitizeInternalRoute(
  value: string | null | undefined,
  fallback = DEFAULT_FALLBACK_ROUTE
) {
  if (!value) return fallback
  if (!value.startsWith("/") || value.startsWith("//")) return fallback
  if (value === "/login" || value.startsWith("/login?")) return fallback
  return value
}

export function isWorkspaceRouteMemoryCandidate(value: string | null | undefined) {
  const sanitized = sanitizeInternalRoute(value, "")
  if (!sanitized) return false
  return (
    sanitized === "/onboarding" ||
    sanitized.startsWith("/dashboard") ||
    sanitized.startsWith("/portfolio")
  )
}
