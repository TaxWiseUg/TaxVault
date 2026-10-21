import { NextResponse } from "next/server";
import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { handle } from "@/features/know-your-taxes/server/http";
import { getAssessmentForUser } from "@/features/know-your-taxes/server/repository";
export const runtime = "nodejs";
export const GET = handle(async (_req, ctx) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  const a = await getAssessmentForUser(userId, id);
  return NextResponse.json(
    { id: a.id, createdAt: a.createdAt, result: a.result },
    { headers: { "Cache-Control": "private, no-store" } },
  );
});
