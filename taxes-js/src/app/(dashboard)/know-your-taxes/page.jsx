import { Questionnaire } from "@/features/know-your-taxes/components/Questionnaire";
import { requireUserId } from "@/features/know-your-taxes/server/auth";
import { redirect } from "next/navigation";
export const metadata = { title: "Know Your Taxes · TaxWise" };
export default async function KnowYourTaxesPage() {
  try {
    await requireUserId();
  } catch {
    redirect("/login?next=/know-your-taxes"); // TODO: match your sign-in route
  }
  return (
    <main className="min-h-screen bg-[#FBF8F1] px-4 py-8 md:py-12">
      <div className="mx-auto mb-8 max-w-2xl">
        <h1 className="font-serif text-3xl text-[#14213D]">Know Your Taxes</h1>
        <p className="mt-1 text-sm text-[#5B6475]">A few questions about how you earn — we'll only ask what's relevant to you.</p>
      </div>
      <Questionnaire />
    </main>
  );
}
