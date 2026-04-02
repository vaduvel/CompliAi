import { NextResponse } from "next/server"

import { initialComplianceState, normalizeComplianceState } from "@/lib/compliance/engine"
import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole } from "@/lib/server/auth"
import { readFreshStateForOrg } from "@/lib/server/mvp-store"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { buildVendorTrustPack, buildVendorTrustPackMarkdown } from "@/lib/server/vendor-trust-pack"
import { readNis2State } from "@/lib/server/nis2-store"

function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "vendor-trust-pack"
  )
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "export Vendor Trust Pack"
    )

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")
    const state =
      (await readFreshStateForOrg(session.orgId, session.orgName)) ??
      normalizeComplianceState(initialComplianceState)
    const [resolvedState, nis2State] = await Promise.all([
      Promise.resolve(state),
      readNis2State(session.orgId),
    ])
    const pack = await buildVendorTrustPack(session.orgId, {
      orgName: session.orgName,
      state: resolvedState,
      nis2State,
    })
    const fileStem = `vendor-trust-pack-${slugify(pack.orgName)}-${pack.generatedAtISO.slice(0, 10)}`

    if (format === "pdf") {
      const pdfBuffer = await buildPDFFromMarkdown(
        buildVendorTrustPackMarkdown(pack),
        {
          orgName: pack.orgName,
          documentType: "vendor-trust-pack",
          generatedAt: pack.generatedAtISO,
        }
      )

      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${fileStem}.pdf"`,
          "Content-Length": pdfBuffer.length.toString(),
          "Cache-Control": "no-store",
        },
      })
    }

    return new Response(JSON.stringify(pack, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileStem}.json"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) {
      return jsonError(error.message, error.status, error.code)
    }
    return jsonError(
      error instanceof Error ? error.message : "Exportul Vendor Trust Pack a eșuat.",
      500,
      "VENDOR_TRUST_PACK_EXPORT_FAILED"
    )
  }
}
