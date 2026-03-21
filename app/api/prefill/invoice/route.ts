// POST /api/prefill/invoice — Addon 3: Smart Prefill from e-Factura invoices
// Sends recent invoice product names to Gemini for tool/service inference.
// Returns suggested prefill data — all values are 'suggested', never 'confirmed'.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { getOrgContext } from "@/lib/server/org-context"
import { inferPrefillFromInvoices } from "@/lib/compliance/efactura-prefill-inference"

export async function POST(request: Request) {
  try {
    const ctx = await getOrgContext()
    if (!ctx?.orgId) return jsonError("Neautorizat.", 401, "UNAUTHORIZED")

    const body = (await request.json()) as { invoiceItems?: string[] }
    const items = body.invoiceItems

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ prefill: null, reason: "no-items" })
    }

    const prefill = await inferPrefillFromInvoices(items)
    return NextResponse.json({ ok: true, prefill })
  } catch {
    return jsonError("Eroare la inferența din facturi.", 500, "PREFILL_FAILED")
  }
}
