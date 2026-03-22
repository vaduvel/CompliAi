import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireRole } from "@/lib/server/auth"
import { getOrgContext } from "@/lib/server/org-context"
import { readPolicyAcknowledgments } from "@/lib/server/policy-store"

export async function GET(request: Request) {
  try {
    requireRole(request, ["owner", "partner_manager", "compliance", "reviewer", "viewer"], "vizualizarea politicilor")
    const { orgId } = await getOrgContext()
    let acknowledgments = {}

    try {
      acknowledgments = await readPolicyAcknowledgments(orgId)
    } catch {
      // Politicile trebuie să rămână vizibile chiar dacă storage-ul de confirmări
      // nu este încă provisionat în cloud.
      acknowledgments = {}
    }

    return NextResponse.json({ acknowledgments })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError("Politicile nu au putut fi incarcate.", 500, "POLICIES_LOAD_FAILED")
  }
}
