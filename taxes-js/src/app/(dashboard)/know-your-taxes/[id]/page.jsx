import { notFound, redirect } from "next/navigation";
import { ResultsView } from "@/features/know-your-taxes/components/ResultsView";
import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { getAssessmentForUser, getSources, NotFoundError } from "@/features/know-your-taxes/server/repository";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your tax obligations · TaxWise" };
export default async function ResultsPage({ params }) {
  let userId;
  try {
    userId = await requireUserId();
  } catch {
    redirect("/login");
  }
  const { id } = await params;
  try {
    const a = await getAssessmentForUser(userId, id); // scoped to owner
    const ids = [...new Set(a.result.obligations.flatMap((o) => o.content.legalBasis))];
    const sources = Object.fromEntries((await getSources(ids)).map((s) => [s.id, s]));
    return (
      <main className="min-h-screen bg-[#FBF8F1] px-4 py-8">
        <ResultsView id={a.id} result={a.result} sources={sources} />
      </main>
    );
  } catch (e) {
    if (e instanceof NotFoundError) notFound();
    throw e;
  }
}
