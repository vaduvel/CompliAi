import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { READ_ROLES } from "@/lib/server/rbac"
import { readPolicyAcknowledgments } from "@/lib/server/policy-store"

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(request, READ_ROLES, "vizualizarea politicilor")
    let acknowledgments = {}

    try {
      acknowledgments = await readPolicyAcknowledgments(session.orgId)
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
