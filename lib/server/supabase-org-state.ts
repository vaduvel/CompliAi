import type { ComplianceState } from "@/lib/compliance/types"
import { hasSupabaseConfig, supabaseSelect, supabaseUpsert } from "@/lib/server/supabase-rest"
import { getConfiguredDataBackend } from "@/lib/server/supabase-tenancy"

type OrgStateRow = {
  org_id: string
  state: ComplianceState
  updated_at?: string
}

export function shouldMirrorOrgStateToSupabase() {
  const backend = getConfiguredDataBackend()
  return hasSupabaseConfig() && (backend === "supabase" || backend === "hybrid")
}

export function shouldUseSupabaseOrgStateAsPrimary() {
  return hasSupabaseConfig() && getConfiguredDataBackend() === "supabase"
}

export async function loadOrgStateFromSupabase(orgId: string): Promise<ComplianceState | null> {
  if (!shouldMirrorOrgStateToSupabase()) return null

  const rows = await supabaseSelect<OrgStateRow>(
    "org_state",
    `select=org_id,state,updated_at&org_id=eq.${orgId}&limit=1`,
    "public"
  )

  return rows[0]?.state ?? null
}

export async function persistOrgStateToSupabase(orgId: string, state: ComplianceState) {
  if (!shouldMirrorOrgStateToSupabase()) {
    return { synced: false, reason: "DATA_BACKEND_LOCAL" as const }
  }

  await supabaseUpsert(
    "org_state",
    {
      org_id: orgId,
      state,
    },
    "public"
  )

  return { synced: true as const }
}
