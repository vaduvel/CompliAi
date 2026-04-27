// White-label configuration for partner orgs.
// Stores logo, brand color, partner name, tagline.
// Used in report headers and exported documents.

import { promises as fs } from "node:fs"
import path from "node:path"

import { writeFileSafe } from "@/lib/server/fs-safe"
import { hasSupabaseConfig, supabaseSelect, supabaseUpsert } from "@/lib/server/supabase-rest"

export type WhiteLabelConfig = {
  orgId: string
  partnerName: string
  tagline: string | null
  logoUrl: string | null
  brandColor: string
  // S1.3 — AI ON/OFF toggle per client.
  // Default true (AI enabled). Cabinet poate seta `false` pentru clienți
  // care cer template-only (ex: clienți sensibili / banking / public sector).
  aiEnabled: boolean
  // S1.5 — Signature upload în brand setup.
  // URL imagine semnătură consultant (PNG transparent recomandat). Apare
  // în footer document generat când e setat. NULL = nu se afișează semnătură.
  signatureUrl: string | null
  // Numele afișat sub semnătură (ex: "Diana Popescu, DPO")
  signerName: string | null
  // S1.6 — ICP segment selectat la onboarding (Doc 06 cere 5 segmente Faza 1).
  // Mapare la userMode tehnic:
  //   "solo"          → userMode: solo (owner/manager IMM mic)
  //   "cabinet-dpo"   → userMode: partner (DPO/Privacy Manager consultant)
  //   "cabinet-fiscal"→ userMode: partner (contabil CECCAR + GDPR lite)
  //   "imm-internal"  → userMode: compliance (responsabil intern IMM)
  //   "enterprise"    → userMode: compliance (CISO/multi-framework, sales-led)
  icpSegment: IcpSegment | null
  // S2B.1 — AI provider override per cabinet (EU sovereignty option).
  // null/undefined → default env (gemini). "mistral" doar pentru Pro+ tiers.
  aiProvider: "gemini" | "mistral" | null
  updatedAtISO: string | null
  storageBackend?: "supabase" | "local_fallback"
  persistenceStatus?: "synced" | "fallback"
}

export type IcpSegment =
  | "solo"
  | "cabinet-dpo"
  | "cabinet-fiscal"
  | "imm-internal"
  | "enterprise"

type WhiteLabelRow = {
  org_id: string
  partner_name: string
  tagline: string | null
  logo_url: string | null
  brand_color: string
  ai_enabled: boolean | null
  signature_url: string | null
  signer_name: string | null
  icp_segment: string | null
  ai_provider: string | null
  updated_at: string | null
}

const ICP_SEGMENTS: readonly IcpSegment[] = [
  "solo",
  "cabinet-dpo",
  "cabinet-fiscal",
  "imm-internal",
  "enterprise",
] as const

function parseIcpSegment(value: unknown): IcpSegment | null {
  if (typeof value !== "string") return null
  return (ICP_SEGMENTS as readonly string[]).includes(value) ? (value as IcpSegment) : null
}

function parseAiProvider(value: unknown): "gemini" | "mistral" | null {
  if (value === "gemini" || value === "mistral") return value
  return null
}

const DEFAULT_BRAND_COLOR = "#6366f1"
const DATA_DIR = path.join(process.cwd(), ".data")

function getLocalWhiteLabelFile(orgId: string) {
  const safeOrgId = orgId.replace(/[^a-zA-Z0-9._-]+/g, "-")
  return path.join(DATA_DIR, `white-label-${safeOrgId}.json`)
}

function rowToConfig(row: WhiteLabelRow): WhiteLabelConfig {
  return {
    orgId: row.org_id,
    partnerName: row.partner_name,
    tagline: row.tagline ?? null,
    logoUrl: row.logo_url ?? null,
    brandColor: row.brand_color ?? DEFAULT_BRAND_COLOR,
    aiEnabled: row.ai_enabled !== false, // null/undefined → true (default ON)
    signatureUrl: row.signature_url ?? null,
    signerName: row.signer_name ?? null,
    icpSegment: parseIcpSegment(row.icp_segment),
    aiProvider: parseAiProvider(row.ai_provider),
    updatedAtISO: row.updated_at ?? null,
    storageBackend: "supabase",
    persistenceStatus: "synced",
  }
}

// ── Local Map fallback ─────────────────────────────────────────────────────────

const configCache = new Map<string, WhiteLabelConfig>()

async function readLocalWhiteLabelConfig(orgId: string): Promise<WhiteLabelConfig | null> {
  try {
    const raw = await fs.readFile(getLocalWhiteLabelFile(orgId), "utf8")
    const parsed = JSON.parse(raw) as Partial<WhiteLabelConfig>
    if (parsed.orgId !== orgId || typeof parsed.partnerName !== "string") return null

    return {
      orgId,
      partnerName: parsed.partnerName,
      tagline: typeof parsed.tagline === "string" ? parsed.tagline : null,
      logoUrl: typeof parsed.logoUrl === "string" ? parsed.logoUrl : null,
      brandColor:
        typeof parsed.brandColor === "string" && /^#[0-9a-fA-F]{6}$/.test(parsed.brandColor)
          ? parsed.brandColor
          : DEFAULT_BRAND_COLOR,
      aiEnabled: parsed.aiEnabled !== false, // missing/true → true; only false disables AI
      signatureUrl: typeof parsed.signatureUrl === "string" ? parsed.signatureUrl : null,
      signerName: typeof parsed.signerName === "string" ? parsed.signerName : null,
      icpSegment: parseIcpSegment(parsed.icpSegment),
      aiProvider: parseAiProvider(parsed.aiProvider),
      updatedAtISO: typeof parsed.updatedAtISO === "string" ? parsed.updatedAtISO : null,
      storageBackend: "local_fallback",
      persistenceStatus: "fallback",
    }
  } catch {
    return null
  }
}

async function writeLocalWhiteLabelConfig(config: WhiteLabelConfig) {
  await writeFileSafe(getLocalWhiteLabelFile(config.orgId), JSON.stringify(config, null, 2))
}

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

  const cached = configCache.get(orgId)
  if (cached) return cached

  const localConfig = await readLocalWhiteLabelConfig(orgId)
  if (localConfig) {
    configCache.set(orgId, localConfig)
    return localConfig
  }

  return {
      orgId,
      partnerName: "",
      tagline: null,
      logoUrl: null,
      brandColor: DEFAULT_BRAND_COLOR,
      aiEnabled: true, // default ON; cabinet trebuie să dezactiveze explicit
      signatureUrl: null,
      signerName: null,
      icpSegment: null,
      aiProvider: null,
      updatedAtISO: null,
      storageBackend: "local_fallback",
      persistenceStatus: "fallback",
    }
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
    storageBackend: hasSupabaseConfig() ? "supabase" : "local_fallback",
    persistenceStatus: hasSupabaseConfig() ? "synced" : "fallback",
  }

  configCache.set(orgId, updated)
  await writeLocalWhiteLabelConfig(updated)

  if (hasSupabaseConfig()) {
    try {
      const row: WhiteLabelRow = {
        org_id: updated.orgId,
        partner_name: updated.partnerName,
        tagline: updated.tagline,
        logo_url: updated.logoUrl,
        brand_color: updated.brandColor,
        ai_enabled: updated.aiEnabled,
        signature_url: updated.signatureUrl,
        signer_name: updated.signerName,
        icp_segment: updated.icpSegment,
        ai_provider: updated.aiProvider,
        updated_at: updated.updatedAtISO,
      }
      await supabaseUpsert<WhiteLabelRow, WhiteLabelRow>("partner_white_label", row)
    } catch {
      updated.storageBackend = "local_fallback"
      updated.persistenceStatus = "fallback"
      // local cache already updated
    }
  }

  return updated
}
