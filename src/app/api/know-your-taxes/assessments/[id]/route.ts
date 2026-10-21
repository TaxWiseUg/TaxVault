import { NextRequest, NextResponse } from "next/server";
import { getAssessmentForUser, getSources, NotFoundError } from "@/features/know-your-taxes/server/repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = "f8174d44-d81a-4e70-9f4b-64744f969d09";
    const assessment = await getAssessmentForUser(userId, id);
    const ids = [...new Set(assessment.result.obligations.flatMap((o) => o.content.legalBasis))];
    const sources = Object.fromEntries((await getSources(ids)).map((s) => [s.id, s]));

    return NextResponse.json({
      assessment,
      sources,
    });
  } catch (error: any) {
    if (error instanceof NotFoundError) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }
    return NextResponse.json({ error: error?.message || "Failed to load assessment" }, { status: 500 });
  }
}
