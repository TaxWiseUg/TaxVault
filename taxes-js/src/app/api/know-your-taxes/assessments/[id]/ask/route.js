import { NextResponse } from "next/server";
import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { handle, rateLimit } from "@/features/know-your-taxes/server/http";
import { getAssessmentForUser, getSources, logQuestion, NotFoundError } from "@/features/know-your-taxes/server/repository";
import { answerQuestion } from "@/features/know-your-taxes/server/qa";
import { AskSchema } from "@/features/know-your-taxes/validation";
export const runtime = "nodejs";
export const POST = handle(async (req, ctx) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  const { obligationCode, question } = AskSchema.parse(await req.json());
  if (!rateLimit(`kyt-ask:${userId}`))
    return NextResponse.json({ error: "Too many questions — try again in an hour." }, { status: 429 });
  const a = await getAssessmentForUser(userId, id);
  const ob = a.result.obligations.find((o) => o.code === obligationCode);
  if (!ob) throw new NotFoundError("Obligation not in this assessment");
  const sourceIds = [...new Set([...ob.content.legalBasis, ...ob.content.consequences.flatMap((c) => c.sourceIds)])];
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
});
