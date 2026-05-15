import { NextResponse, type NextRequest } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import {
  createClient,
  listClients,
  type CreateClientInput,
} from "@/lib/fiscal-copilot/portfolio-store";

export const dynamic = "force-dynamic";

/**
 * GET /api/fiscal-copilot/clients — listă clienți cabinetului logat
 */
export async function GET() {
  const ctx = await getOrgContext();
  const clients = await listClients(ctx.orgId);
  return NextResponse.json({ count: clients.length, clients });
}

/**
 * POST /api/fiscal-copilot/clients — adaugă client nou
 *
 * Body: CreateClientInput (name, cui, type, vatRegime, hasEmployees, ...)
 */
export async function POST(req: NextRequest) {
  const ctx = await getOrgContext();
  const body = (await req.json()) as Partial<CreateClientInput>;

  // Validation minimă
  if (!body.name || !body.cui || !body.type || !body.vatRegime) {
    return NextResponse.json(
      { error: "Missing required fields: name, cui, type, vatRegime" },
      { status: 400 }
    );
  }
  if (!/^(RO)?\d{2,10}$/.test(body.cui)) {
    return NextResponse.json({ error: "CUI invalid" }, { status: 400 });
  }

  const client = await createClient(ctx.orgId, {
    name: body.name,
    cui: body.cui,
    type: body.type,
    vatRegime: body.vatRegime,
    hasEmployees: body.hasEmployees ?? false,
    registeredDate: body.registeredDate ?? new Date().toISOString().slice(0, 10),
    caenCodes: body.caenCodes ?? [],
    estimatedAnnualRevenueEUR: body.estimatedAnnualRevenueEUR,
    flags: body.flags ?? [],
  });

  return NextResponse.json(client, { status: 201 });
}
