import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { parseUblInvoice, renderUblInvoiceAsHtml } from "@/lib/compliance/ubl-renderer"

/**
 * POST /api/efactura/preview — convert UBL XML to a human-readable HTML view.
 *
 * Body: { xml: string, format?: "html" | "json" }
 *
 * - format=html (default): returns text/html ready to inject in an iframe or
 *   print directly. Sanitized — user-supplied XML fields are escaped.
 * - format=json: returns the parsed UblParsedInvoice object for client-side
 *   rendering.
 */
export async function POST(request: Request) {
  try {
    await requireFreshAuthenticatedSession(request, "vizualizarea facturii UBL")
    const body = (await request.json().catch(() => ({}))) as {
      xml?: string
      format?: "html" | "json"
    }
    if (!body.xml || typeof body.xml !== "string") {
      return jsonError("Body trebuie să conțină câmpul `xml`.", 400, "PREVIEW_NO_XML")
    }
    if (body.xml.length > 10 * 1024 * 1024) {
      return jsonError("XML-ul depășește 10 MB.", 413, "PREVIEW_TOO_LARGE")
    }
    const parsed = parseUblInvoice(body.xml)
    if (body.format === "json") {
      return NextResponse.json({ invoice: parsed })
    }
    const html = renderUblInvoiceAsHtml(parsed)
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    if (error && typeof error === "object" && "status" in error) {
      const e = error as { message: string; status: number; code: string }
      return jsonError(e.message, e.status, e.code)
    }
    return jsonError("Nu am putut genera preview.", 500, "PREVIEW_FAILED")
  }
}
