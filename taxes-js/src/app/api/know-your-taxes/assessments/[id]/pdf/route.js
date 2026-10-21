import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { handle } from "@/features/know-your-taxes/server/http";
import { getAssessmentForUser, getSources, logReport } from "@/features/know-your-taxes/server/repository";
import { renderReportPdf } from "@/features/know-your-taxes/report/ReportDocument";
export const runtime = "nodejs";
export const GET = handle(async (_req, ctx) => {
  const userId = await requireUserId();
  const { id } = await ctx.params;
  const a = await getAssessmentForUser(userId, id); // 404s for other users' ids
  const ids = [...new Set(a.result.obligations.flatMap((o) => o.content.legalBasis))];
  const sources = await getSources(ids);
  const pdf = await renderReportPdf(a.result, sources);
  await logReport(userId, a.id);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="taxwise-know-your-taxes-${a.createdAt.toISOString().slice(0, 10)}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
