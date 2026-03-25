// POST /api/cron/renewal-reminder
// TASK 3 — Email de reînnoire abonament cu date acumulate per org.
// Trimite cu 7 zile înainte de aniversarea anuală a contului.
// Invoked by Vercel Cron (daily 09:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { jsonError } from "@/lib/server/api-response"
import { listOrganizationMembers, loadOrganizations } from "@/lib/server/auth"
import { readStateForOrg } from "@/lib/server/mvp-store"
import { loadEvidenceLedgerFromSupabase } from "@/lib/server/supabase-evidence-read"
import { sendRenewalEmail } from "@/lib/server/renewal-email"
import type { RenewalEmailData } from "@/lib/server/renewal-email"

// Days before 1-year anniversary to send the renewal email
const DAYS_BEFORE_RENEWAL = 7

function isNearAnniversary(createdAtISO: string, daysAhead: number): boolean {
  const created = new Date(createdAtISO)
  const now = new Date()

  // Anniversary = same month/day but 1 year later
  const nextAnniversary = new Date(created)
  nextAnniversary.setFullYear(created.getFullYear() + 1)

  const msUntilAnniversary = nextAnniversary.getTime() - now.getTime()
  const daysUntilAnniversary = msUntilAnniversary / (24 * 60 * 60 * 1000)

  // Send if 6 < days <= 7 (hit the window once per year)
  return daysUntilAnniversary > daysAhead - 1 && daysUntilAnniversary <= daysAhead
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const results: { orgId: string; email?: string; sent: boolean; reason?: string }[] = []

  try {
    const organizations = await loadOrganizations()

    for (const org of organizations.slice(0, 100)) {
      // Only send near the 1-year anniversary
      if (!isNearAnniversary(org.createdAtISO, DAYS_BEFORE_RENEWAL)) {
        results.push({ orgId: org.id, sent: false, reason: "not in renewal window" })
        continue
      }

      let ownerEmail: string | undefined

      try {
        const members = await listOrganizationMembers(org.id)
        const owner = members.find((member) => member.role === "owner") ?? members[0]

        if (!owner?.email) {
          results.push({ orgId: org.id, sent: false, reason: "no email" })
          continue
        }
        ownerEmail = owner.email

        const [state, evidenceLedger] = await Promise.all([
          readStateForOrg(org.id),
          loadEvidenceLedgerFromSupabase({ orgId: org.id }).catch(() => null),
        ])

        const emailData: RenewalEmailData = {
          orgId: org.id,
          orgName: org.name,
          dovediiSalvate: evidenceLedger !== null ? evidenceLedger.length : null,
          rapoarteGenerate: (state?.generatedDocuments ?? []).length,
          pacheteAudit: (state?.snapshotHistory ?? []).length,
        }

        const result = await sendRenewalEmail(ownerEmail, emailData)
        results.push({ orgId: org.id, email: ownerEmail, sent: result.ok })
      } catch (err) {
        const msg = err instanceof Error ? err.message : "error"
        results.push({ orgId: org.id, email: ownerEmail, sent: false, reason: msg })
      }
    }

    return NextResponse.json({ ok: true, processed: results.length, results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unexpected error"
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
