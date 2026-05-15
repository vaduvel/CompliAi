import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import {
  deleteClient,
  getClient,
  updateClient,
} from "@/lib/fiscal-copilot/portfolio-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const org = await getOrgContext();
  const client = await getClient(org.orgId, id);
  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(client);
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const org = await getOrgContext();
  const patch = await req.json();
  const updated = await updateClient(org.orgId, id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const org = await getOrgContext();
  const removed = await deleteClient(org.orgId, id);
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ deleted: true, id });
}
