import { NextRequest, NextResponse } from "next/server";
import { getAssessmentForUser, getSources, logQuestion, NotFoundError } from "@/features/know-your-taxes/server/repository";
import { answerQuestion } from "@/features/know-your-taxes/server/qa";
import { AskSchema } from "@/features/know-your-taxes/validation";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = "f8174d44-d81a-4e70-9f4b-64744f969d09";
    const { id } = await params;
    const body = await req.json();
    const { obligationCode, question } = AskSchema.parse(body);

    const a = await getAssessmentForUser(userId, id);
    const ob = a.result.obligations.find((o) => o.code === obligationCode);
    if (!ob) {
      return NextResponse.json({ error: "Obligation not in this assessment" }, { status: 404 });
    }

    const sourceIds = [
      ...new Set([...ob.content.legalBasis, ...ob.content.consequences.flatMap((c) => c.sourceIds)]),
    ];
    const sources = await getSources(sourceIds);
    const out = await answerQuestion(ob, sources, question);

    await logQuestion({
      userId,
      assessmentId: a.id,
      obligationCode,
      question,
      answer: out.answer,
      citedSourceIds: out.citations.map((c) => c.id),
      grounded: out.grounded,
    });

    return NextResponse.json(out);
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error?.message || "Failed to process question" }, { status: 500 });
  }
}
