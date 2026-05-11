export const runtime = "nodejs"

import { NextResponse } from "next/server"

import { jsonError } from "@/lib/server/api-response"
import { AuthzError, requireFreshRole, resolveUserMode } from "@/lib/server/auth"
import {
  buildDpoSecurityContractualPack,
  renderDpoSecurityContractualPackMarkdown,
} from "@/lib/server/dpo-security-contractual-pack"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"
import { getWhiteLabelConfig } from "@/lib/server/white-label"

function safeFileSegment(value: string) {
  return (
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "cabinet"
  )
}

export async function GET(request: Request) {
  try {
    const session = await requireFreshRole(
      request,
      ["owner", "partner_manager", "compliance", "reviewer", "viewer"],
      "exportul Trust Pack DPO"
    )
    const userMode = await resolveUserMode(session)
    if (userMode !== "partner") {
      return jsonError(
        "Trust Pack-ul cabinetului este disponibil doar în modul partner.",
        403,
        "PARTNER_TRUST_PACK_FORBIDDEN"
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get("format")
    const generatedAtISO = new Date().toISOString()
    const whiteLabel = await getWhiteLabelConfig(session.orgId).catch(() => null)
    const cabinetName = whiteLabel?.partnerName?.trim() || session.orgName
    const pack = buildDpoSecurityContractualPack({
      cabinetOrgId: session.orgId,
      cabinetName,
      consultantEmail: session.email,
      consultantRole: session.role,
      generatedAtISO,
      appUrl: process.env.NEXT_PUBLIC_URL,
    })
    const markdown = renderDpoSecurityContractualPackMarkdown(pack)
    const fileStem = `compliscan-dpo-trust-pack-${safeFileSegment(cabinetName)}-${generatedAtISO.slice(0, 10)}`

    if (format === "json") {
      return new NextResponse(JSON.stringify(pack, null, 2), {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileStem}.json"`,
          "Cache-Control": "no-store",
        },
      })
    }

    if (format === "md") {
      return new NextResponse(markdown, {
        status: 200,
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Content-Disposition": `attachment; filename="${fileStem}.md"`,
          "Cache-Control": "no-store",
        },
      })
    }

    const pdf = await buildPDFFromMarkdown(markdown, {
      orgName: cabinetName,
      documentType: "dpo-trust-pack",
      generatedAt: generatedAtISO,
      signerName: session.email,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileStem}.pdf"`,
        "Content-Length": pdf.length.toString(),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    if (error instanceof AuthzError) return jsonError(error.message, error.status, error.code)
    return jsonError(
      error instanceof Error ? error.message : "Exportul Trust Pack DPO a eșuat.",
      500,
      "DPO_TRUST_PACK_EXPORT_FAILED"
    )
  }
}
