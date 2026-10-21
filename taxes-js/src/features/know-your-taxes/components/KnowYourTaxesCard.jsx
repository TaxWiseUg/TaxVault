import Link from "next/link";
// Drop into the dashboard grid. Uses The Ledger tokens (Fraunces display, Inter body).
// Map the arbitrary colours below to your Tailwind theme names if you have them.
export function KnowYourTaxesCard() {
  return (
    <section className="relative overflow-hidden rounded-xl border border-[#D9D4C7] bg-[#14213D] p-6 text-[#FBF8F1] shadow-sm md:col-span-2">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full border-[18px] border-[#C9A227]/20"
      />
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#C9A227]">New · Guided</p>
      <h2 className="mt-2 font-serif text-2xl leading-tight md:text-3xl">Know Your Taxes</h2>
      <p className="mt-2 max-w-xl text-sm text-[#FBF8F1]/80">
        Answer a few simple questions to understand your tax obligations, why they apply to you, and what you need to do next.
      </p>
      <Link
        href="/know-your-taxes"
        className="mt-5 inline-flex items-center gap-2 rounded-md bg-[#C9A227] px-4 py-2.5 text-sm font-semibold text-[#14213D] transition hover:bg-[#d8b33a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FBF8F1]"
      >
        Discover My Tax Obligations
        <span aria-hidden>→</span>
      </Link>
    </section>
  );
}
