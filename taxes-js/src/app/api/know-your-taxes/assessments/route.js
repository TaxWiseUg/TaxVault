import { NextResponse } from "next/server";
import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { handle } from "@/features/know-your-taxes/server/http";
import { createCompletedAssessment, listAssessmentsForUser } from "@/features/know-your-taxes/server/repository";
import { CreateAssessmentSchema, parseAnswers } from "@/features/know-your-taxes/validation";
export const runtime = "nodejs";
export const GET = handle(async () => {
  const userId = await requireUserId();
  return NextResponse.json({ assessments: await listAssessmentsForUser(userId) });
});
export const POST = handle(async (req) => {
  const userId = await requireUserId();
  const body = CreateAssessmentSchema.parse(await req.json());
  const answers = parseAnswers(body.answers);
  const { id } = await createCompletedAssessment(userId, answers);
  return NextResponse.json({ id }, { status: 201 });
});
