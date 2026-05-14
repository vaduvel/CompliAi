import { NextResponse, type NextRequest } from "next/server";
import { askExpert } from "@/lib/fiscal-copilot/ai-expert";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { question?: string; topN?: number };
    const question = body.question?.trim();
    if (!question) {
      return NextResponse.json({ error: "Field 'question' required" }, { status: 400 });
    }
    if (question.length > 2_000) {
      return NextResponse.json({ error: "Question too long (max 2000 chars)" }, { status: 400 });
    }

    const answer = await askExpert(question, { topN: body.topN ?? 3 });
    return NextResponse.json(answer);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Internal error",
      },
      { status: 500 }
    );
  }
}
