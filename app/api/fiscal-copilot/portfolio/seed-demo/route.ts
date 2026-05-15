import { NextResponse } from "next/server";
import { getOrgContext } from "@/lib/server/org-context";
import { seedDemoPortfolio, isPortfolioEmpty } from "@/lib/fiscal-copilot/portfolio-store";
import { seedDefaultProcedures } from "@/lib/fiscal-copilot/memory/procedural";

export const dynamic = "force-dynamic";

/**
 * POST /api/fiscal-copilot/portfolio/seed-demo
 *
 * Pre-populate portofoliul curent cu 5 clienți demo + 3 proceduri standard.
 * Util pentru onboarding rapid sau demo prezentări.
 *
 * NU șterge clienții existenți — refuză dacă portofoliul nu e gol (force=true override).
 */
export async function POST(req: Request) {
  const ctx = await getOrgContext();
  const url = new URL(req.url);
  const force = url.searchParams.get("force") === "true";

  if (!force && !(await isPortfolioEmpty(ctx.orgId))) {
    return NextResponse.json(
      {
        error: "portfolio_not_empty",
        hint: "Portofoliul are deja clienți. Trimite ?force=true pentru a sări check-ul.",
      },
      { status: 409 }
    );
  }

  await seedDemoPortfolio(ctx.orgId);
  await seedDefaultProcedures(ctx.orgId);

  return NextResponse.json({
    seeded: true,
    orgId: ctx.orgId,
    clients: 5,
    procedures: 3,
    message: "Demo portfolio + proceduri standard seeded.",
  });
}
