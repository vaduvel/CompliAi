import { NextResponse } from "next/server"
import { getOrgContext } from "@/lib/server/org-context"
import { AuthzError, requireFreshAuthenticatedSession } from "@/lib/server/auth"
import { buildPDFFromMarkdown } from "@/lib/server/pdf-generator"

export async function POST(req: Request) {
  try {
    const session = await requireFreshAuthenticatedSession(req, "exportul PDF")
    const baseWorkspace = await getOrgContext({ request: req })
    const { orgId } = session
    void orgId // used for future auth/logging

    const body = (await req.json()) as {
      content?: string
      orgName?: string
      documentType?: string
    }

    const content = typeof body.content === "string" ? body.content.trim() : ""
    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 })
    }

    const resolvedOrgName =
      (typeof body.orgName === "string" && body.orgName.trim()) ||
      session.orgName ||
      baseWorkspace.orgName
    const documentType = typeof body.documentType === "string" ? body.documentType : "document"

    const pdfBuffer = await buildPDFFromMarkdown(content, {
      orgName: resolvedOrgName,
      documentType,
      generatedAt: new Date().toISOString(),
    })

    const fileName = `${documentType}-${new Date().toISOString().split("T")[0]}.pdf`

    return new Response(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    })
  } catch (err) {
    if (err instanceof AuthzError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status })
    }
    console.error("[export-pdf]", err)
    return NextResponse.json({ error: "PDF generation failed" }, { status: 500 })
  }
}
