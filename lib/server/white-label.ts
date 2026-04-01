// White-label configuration for partner orgs.
// Stores logo, brand color, partner name, tagline.
// Used in report headers and exported documents.

import { hasSupabaseConfig, supabaseSelect, supabaseUpdate } from "@/lib/server/supabase-rest"

export type WhiteLabelConfig = {
  orgId: string
  partnerName: string
  tagline: string | null
  logoUrl: string | null
  brandColor: string
  updatedAtISO: string | null
}

type WhiteLabelRow = {
  org_id: string
  partner_name: string
  tagline: string | null
  logo_url: string | null
  brand_color: string
  updated_at: string | null
}

const DEFAULT_BRAND_COLOR = "#6366f1"

function rowToConfig(row: WhiteLabelRow): WhiteLabelConfig {
  return {
    orgId: row.org_id,
    partnerName: row.partner_name,
    tagline: row.tagline ?? null,
    logoUrl: row.logo_url ?? null,
    brandColor: row.brand_color ?? DEFAULT_BRAND_COLOR,
    updatedAtISO: row.updated_at ?? null,
  }
}

// ── Local Map fallback ─────────────────────────────────────────────────────────

const configCache = new Map<string, WhiteLabelConfig>()

// ── Public API ─────────────────────────────────────────────────────────────────

export async function getWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig> {
  if (hasSupabaseConfig()) {
    try {
      const rows = await supabaseSelect<WhiteLabelRow>(
        "partner_white_label",
        `org_id=eq.${orgId}&limit=1`
      )
      if (rows.length > 0) return rowToConfig(rows[0])
    } catch {
      // fall through to local
    }
  }

  return (
    configCache.get(orgId) ?? {
      orgId,
      partnerName: "",
      tagline: null,
      logoUrl: null,
      brandColor: DEFAULT_BRAND_COLOR,
      updatedAtISO: null,
    }
  )
}

export async function saveWhiteLabelConfig(
  orgId: string,
  patch: Partial<Omit<WhiteLabelConfig, "orgId" | "updatedAtISO">>
): Promise<WhiteLabelConfig> {
  const existing = await getWhiteLabelConfig(orgId)
  const updated: WhiteLabelConfig = {
    ...existing,
    ...patch,
    orgId,
    updatedAtISO: new Date().toISOString(),
  }

  configCache.set(orgId, updated)

  if (hasSupabaseConfig()) {
    try {
      const row: WhiteLabelRow = {
        org_id: updated.orgId,
        partner_name: updated.partnerName,
        tagline: updated.tagline,
        logo_url: updated.logoUrl,
        brand_color: updated.brandColor,
        updated_at: updated.updatedAtISO,
      }
      await supabaseUpdate<WhiteLabelRow>("partner_white_label", `org_id=eq.${orgId}`, row)
    } catch {
      // local cache already updated
    }
  }

  return updated
}
