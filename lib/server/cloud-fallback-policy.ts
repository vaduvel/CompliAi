export function isLocalFallbackAllowedForCloudPrimary() {
  const explicit = process.env.COMPLISCAN_ALLOW_LOCAL_FALLBACK?.trim().toLowerCase()

  if (explicit === "1" || explicit === "true" || explicit === "yes") {
    return true
  }

  if (explicit === "0" || explicit === "false" || explicit === "no") {
    return false
  }

  return process.env.NODE_ENV !== "production"
}
