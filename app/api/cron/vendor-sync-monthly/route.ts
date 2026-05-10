// POST /api/cron/vendor-sync-monthly
// B5 — Monthly vendor sync from e-Factura signals.
// Detects new vendors (by CUI diff), creates finding candidates for missing DPA.
// Invoked by Vercel Cron (15th of month, 09:00 UTC).

export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { loadOrganizations } from "@/lib/server/auth"
import { readStateForOrg, writeStateForOrg } from "@/lib/server/mvp-store"
import { readNis2State } from "@/lib/server/nis2-store"
import { normalizeComplianceState } from "@/lib/compliance/engine"
import { collectSupplierImports } from "@/lib/server/efactura-vendor-signals"
import { createNotification } from "@/lib/server/notifications-store"
import { captureCronError, flushCronTelemetry } from "@/lib/server/sentry-cron"
import { safeRecordCronRun } from "@/lib/server/cron-status-store"
import type { ScanFinding } from "@/lib/compliance/types"

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

export async function POST(request: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get("Authorization")
    if (auth !== `Bearer ${cronSecret}`) {
      return jsonError("Unauthorized.", 401, "UNAUTHORIZED")
    }
  }

  const nowISO = new Date().toISOString()
  const startMs = Date.now()
  const results: { orgId: string; newVendors: number; findingsCreated: number }[] = []
  let capturedCronErrors = false

  try {
    const organizations = await loadOrganizations()

    for (const org of organizations.slice(0, 50)) {
      try {
        const rawState = await readStateForOrg(org.id)
        if (!rawState) {
          results.push({ orgId: org.id, newVendors: 0, findingsCreated: 0 })
          continue
        }

        const state = normalizeComplianceState(rawState)
        const nis2State = await readNis2State(org.id)

        // Collect current vendors from e-Factura validation history
        const efacturaValidations = (state as Record<string, unknown>).efacturaValidations as
          | Array<{ supplierName?: string; supplierCui?: string }>
          | undefined
        if (!efacturaValidations || efacturaValidations.length === 0) {
          results.push({ orgId: org.id, newVendors: 0, findingsCreated: 0 })
          continue
        }

        const importedSuppliers = collectSupplierImports(efacturaValidations)

        // Build set of known vendor CUIs from NIS2 vendors
        const knownCuis = new Set(
          nis2State.vendors
            .filter((v) => v.cui)
            .map((v) => v.cui!)
        )

        // Detect new vendors (not in NIS2 vendor list)
        const newVendors = importedSuppliers.filter(
          (s) => s.cui && !knownCuis.has(s.cui)
        )

        if (newVendors.length === 0) {
          results.push({ orgId: org.id, newVendors: 0, findingsCreated: 0 })
          continue
        }

        // Create finding candidates for new vendors
        let findingsCreated = 0
        const newFindings: ScanFinding[] = newVendors.slice(0, 10).map((vendor) => ({
          id: uid("finding"),
          title: `Furnizor nou detectat: ${vendor.name}${vendor.cui ? ` (CUI: ${vendor.cui})` : ""}`,
          detail: `Furnizorul ${vendor.name} a fost detectat din facturile e-Factura dar nu există în lista de furnizori NIS2. Evaluează riscul și adaugă DPA dacă procesează date personale.`,
          category: "GDPR" as const,
          severity: "medium" as const,
          risk: "low" as const,
          principles: [],
          createdAtISO: nowISO,
          sourceDocument: "e-Factura vendor sync",
          findingStatus: "open" as const,
          suggestedDocumentType: "dpa",
          confidenceScore: 70,
          requiresHumanReview: true,
          provenance: {
            ruleId: "vendor-sync-missing-dpa",
            matchedKeyword: "efactura-vendor-detected",
            excerpt: `Furnizor: ${vendor.name}, CUI: ${vendor.cui ?? "N/A"}, facturi: ${vendor.invoiceCount ?? 1}`,
            signalSource: "keyword" as const,
            verdictBasis: "inferred_signal" as const,
            signalConfidence: "medium" as const,
          },
        }))

        findingsCreated = newFindings.length

        // Append findings to state
        await writeStateForOrg(org.id, {
          ...state,
          findings: [...newFindings, ...state.findings].slice(0, 100),
        })

        // Notify about new vendors
        if (newVendors.length > 0) {
          await createNotification(org.id, {
            type: "info",
            title: `${newVendors.length} furnizor(i) noi detectați din e-Factura`,
            message: `Am identificat ${newVendors.length} furnizor(i) noi care nu sunt în lista de furnizori NIS2. Verifică și adaugă DPA unde e necesar.`,
            linkTo: "/dashboard/resolve",
          }).catch(() => {})
        }

        results.push({ orgId: org.id, newVendors: newVendors.length, findingsCreated })
      } catch (err) {
        captureCronError(err, {
          cron: "/api/cron/vendor-sync-monthly",
          orgId: org.id,
          step: "org-run",
        })
        capturedCronErrors = true
        results.push({ orgId: org.id, newVendors: 0, findingsCreated: 0 })
      }
    }

    if (capturedCronErrors) await flushCronTelemetry()

    const totalNew = results.reduce((s, r) => s + r.newVendors, 0)
    const totalFindings = results.reduce((s, r) => s + r.findingsCreated, 0)
    console.log(`[VendorSyncMonthly] ${totalNew} furnizori noi detectați, ${results.length} organizații procesate`)

    await safeRecordCronRun({
      name: "vendor-sync-monthly",
      lastRunAtISO: nowISO,
      ok: !capturedCronErrors,
      durationMs: Date.now() - startMs,
      summary: `${totalNew} furnizori noi detectați, ${totalFindings} findings create în ${results.length} orgs.`,
      stats: {
        orgsProcessed: results.length,
        totalNew,
        totalFindings,
      },
      errorMessage: capturedCronErrors ? "One or more orgs failed (see Sentry)" : undefined,
    })

    return NextResponse.json({ ok: true, results })
  } catch (error) {
    captureCronError(error, { cron: "/api/cron/vendor-sync-monthly", step: "critical" })
    await flushCronTelemetry()
    const msg = error instanceof Error ? error.message : "unknown"
    await safeRecordCronRun({
      name: "vendor-sync-monthly",
      lastRunAtISO: nowISO,
      ok: false,
      durationMs: Date.now() - startMs,
      summary: `Eroare critică: ${msg}`,
      stats: { orgsProcessed: results.length },
      errorMessage: msg,
    })
    return jsonError("Eroare la vendor sync monthly.", 500, "VENDOR_SYNC_FAILED")
  }
}
