import { NextRequest, NextResponse } from "next/server";
import { createCompletedAssessment, listAssessmentsForUser } from "@/features/know-your-taxes/server/repository";
import { CreateAssessmentSchema, parseAnswers } from "@/features/know-your-taxes/validation";

export async function GET() {
  try {
    const userId = "f8174d44-d81a-4e70-9f4b-64744f969d09";
    const assessments = await listAssessmentsForUser(userId);
    return NextResponse.json({ assessments });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to list assessments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = "f8174d44-d81a-4e70-9f4b-64744f969d09";
    const body = await req.json();
    const parsed = CreateAssessmentSchema.parse(body);
    const answers = parseAnswers(parsed.answers);
    const { id } = await createCompletedAssessment(userId, answers);
    return NextResponse.json({ id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Invalid assessment data" }, { status: 400 });
  }
}
