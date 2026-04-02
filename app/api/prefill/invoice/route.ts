// POST /api/prefill/invoice — Addon 3: Smart Prefill from e-Factura invoices
// Sends recent invoice product names to Gemini for tool/service inference.
// Returns suggested prefill data — all values are 'suggested', never 'confirmed'.

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { inferPrefillFromInvoices } from "@/lib/compliance/efactura-prefill-inference"

export async function POST(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "inferența de prefill din facturi")

    const body = (await request.json()) as { invoiceItems?: string[] }
    const items = body.invoiceItems

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ prefill: null, reason: "no-items" })
    }

    const prefill = await inferPrefillFromInvoices(items)
    return NextResponse.json({ ok: true, prefill })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError("Eroare la inferența din facturi.", 500, "PREFILL_FAILED")
  }
}
