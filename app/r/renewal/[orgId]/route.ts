import { NextResponse } from "next/server"
import { trackEvent } from "@/lib/server/analytics"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orgId: string }> }
) {
  const { orgId } = await params
  const pricingUrl = new URL("/pricing?source=renewal-email", request.url)

  if (orgId?.trim()) {
    void trackEvent(orgId.trim(), "renewal_email_cta_clicked", {
      source: "renewal_email",
      target: "pricing",
    })
  }

  return NextResponse.redirect(pricingUrl)
}
