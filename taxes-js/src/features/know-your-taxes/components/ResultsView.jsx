"use client";
import { useState } from "react";
import Link from "next/link";
const UGX = (n) => `UGX ${Math.round(n).toLocaleString("en-UG")}`;
const STATUS = {
  LIKELY: { label: "Likely applicable", chip: "bg-[#E4F1EA] text-[#1F6F50]", dot: "bg-[#1F6F50]" },
  NEEDS_INFO: { label: "Needs more information", chip: "bg-[#FBF0D9] text-[#8A5A12]", dot: "bg-[#B7791F]" },
  PROFESSIONAL_REVIEW: { label: "Professional review", chip: "bg-[#E3EAF4] text-[#2B4C7E]", dot: "bg-[#2B4C7E]" },
  NOT_APPLICABLE: { label: "Not applicable", chip: "bg-[#EEECE6] text-[#5B6475]", dot: "bg-[#A3A8B3]" },
};
const CATEGORY = {
  TAX: "Tax",
  STATUTORY_CONTRIBUTION: "Statutory contribution — not a tax",
  REGISTRATION: "Registration / licence — not a tax",
};
const ORDER = ["LIKELY", "NEEDS_INFO", "PROFESSIONAL_REVIEW", "NOT_APPLICABLE"];
export function ResultsView({ id, result, sources }) {
  const [open, setOpen] = useState(result.obligations.find((o) => o.status === "LIKELY")?.code ?? null);
  const counts = Object.fromEntries(ORDER.map((s) => [s, result.obligations.filter((o) => o.status === s).length]));
  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#5B6475]">
            Know Your Taxes · Rules {result.ruleSetVersion}
          </p>
          <h1 className="mt-1 font-serif text-3xl text-[#14213D]">Your tax obligations</h1>
          <p className="mt-1 text-sm text-[#5B6475]">{result.profileSummary.join(" · ")}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/know-your-taxes" className="rounded-md border border-[#D9D4C7] px-3 py-2 text-sm">
            Edit answers
          </Link>
          <a
            href={`/api/know-your-taxes/assessments/${id}/pdf`}
            className="rounded-md bg-[#14213D] px-3 py-2 text-sm font-semibold text-white"
          >
            Download PDF
          </a>
        </div>
      </header>

      {result.unverifiedRuleCount > 0 && (
        <div className="mt-5 rounded-lg border border-[#E6C98A] bg-[#FFF8EA] p-3 text-sm text-[#7A5310]">
          <strong>Estimates, not confirmed liabilities.</strong> {result.unverifiedRuleCount} rule
          {result.unverifiedRuleCount === 1 ? "" : "s"} used here are pending verification against the 2026 amendment Acts.
          Figures marked “pending verification” may change.
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {ORDER.map((s) => (
          <div key={s} className="rounded-lg border border-[#D9D4C7] bg-white p-3">
            <div className="flex items-center gap-2 text-xs text-[#5B6475]">
              <span className={`h-2 w-2 rounded-full ${STATUS[s].dot}`} />
              {STATUS[s].label}
            </div>
            <div className="mt-1 font-serif text-2xl text-[#14213D]">{counts[s]}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-3">
          {ORDER.flatMap((s) => result.obligations.filter((o) => o.status === s)).map((o) => (
            <ObligationCard
              key={o.code}
              o={o}
              sources={sources}
              open={open === o.code}
              onToggle={() => setOpen(open === o.code ? null : o.code)}
              assessmentId={id}
            />
          ))}
        </div>
        <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Panel title="Upcoming deadlines" items={result.upcomingDeadlines.map((d) => `${d.label}: ${d.text}`)} />
          <Panel title="Information still needed" items={result.missingInformation} empty="Nothing — we had what we needed." />
          <Panel title="Next steps" items={result.nextSteps} />
        </aside>
      </div>
    </div>
  );
}
function Panel({ title, items, empty }) {
  return (
    <section className="rounded-lg border border-[#D9D4C7] bg-white p-4">
      <h3 className="font-mono text-[11px] uppercase tracking-widest text-[#5B6475]">{title}</h3>
      {items.length ? (
        <ul className="mt-2 space-y-2 text-sm text-[#14213D]">
          {items.map((x, i) => (
            <li key={i} className="leading-snug">
              {x}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-[#5B6475]">{empty}</p>
      )}
    </section>
  );
}
function ObligationCard({ o, sources, open, onToggle, assessmentId }) {
  const st = STATUS[o.status];
  const muted = o.status === "NOT_APPLICABLE";
  return (
    <article className={`rounded-xl border bg-white ${open ? "border-[#14213D] shadow-sm" : "border-[#D9D4C7]"}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-4 p-4 text-left"
      >
        <div>
          <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${st.chip}`}>{st.label}</span>
          <h3 className={`mt-1.5 font-serif text-lg ${muted ? "text-[#5B6475]" : "text-[#14213D]"}`}>{o.content.name}</h3>
          <p className="text-xs text-[#5B6475]">{CATEGORY[o.content.category]}</p>
        </div>
        {o.estimate && (
          <div className="shrink-0 text-right">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#8A5A12]">Estimate</div>
            <div className="font-mono text-base text-[#14213D]">{UGX(o.estimate.amount)}</div>
            <div className="text-[11px] text-[#5B6475]">{o.estimate.period === "MONTHLY" ? "per month" : "per year"}</div>
          </div>
        )}
      </button>

      {open && (
        <div className="space-y-5 border-t border-[#EEE9DD] p-4 text-sm text-[#14213D]">
          <p className="rounded-md bg-[#FBF8F1] p-3 text-[#3A4256]">{o.content.plainDefinition}</p>
          <Section title="Why this may apply to you">
            <List items={o.why} />
          </Section>
          {!muted && (
            <Section title="What triggers it">
              <List items={o.content.triggers} />
            </Section>
          )}
          {o.rateSummary.length > 0 && (
            <Section title={`Rates & thresholds · rule ${o.rule.version}`}>
              <List items={o.rateSummary} />
            </Section>
          )}
          {o.estimate && (
            <Section title="Worked example with your numbers">
              <div className="rounded-md border-l-2 border-[#B7791F] bg-[#F7F3E8] p-3 font-mono text-[12.5px] leading-6">
                {o.estimate.workings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
              <p className="mt-2 text-xs text-[#8A5A12]">
                Estimate only — not a confirmed liability{o.estimate.indicativeOnly ? "; uses rates pending verification" : ""}.
              </p>
            </Section>
          )}
          {o.workedExample && (
            <Section title="Worked example">
              <List items={o.workedExample} />
            </Section>
          )}
          {o.missing.length > 0 && (
            <Section title="To firm this up we need">
              <List items={o.missing} />
            </Section>
          )}
          {!muted && (
            <>
              <Section title="Records to keep">
                <List items={o.content.records} />
              </Section>
              <Section title="Deadlines">
                <List items={o.content.deadlines} />
              </Section>
              <Section title="Where to declare and pay">
                <List items={o.content.channel} />
              </Section>
              {o.content.consequences.length > 0 && (
                <Section title="If you don't comply">
                  <List items={o.content.consequences.map((c) => c.text)} />
                </Section>
              )}
              <Section title="What to do next">
                <List items={o.content.nextSteps} />
              </Section>
            </>
          )}
          <Section title="Legal basis">
            <ul className="space-y-1">
              {o.content.legalBasis.map(
                (id) =>
                  sources[id] && (
                    <li key={id}>
                      <a className="text-[#2B4C7E] underline" href={sources[id].url} target="_blank" rel="noreferrer">
                        {sources[id].title}
                        {sources[id].section ? ` (${sources[id].section})` : ""}
                      </a>
                    </li>
                  ),
              )}
            </ul>
          </Section>
          {!muted && <AskPanel assessmentId={assessmentId} code={o.code} />}
        </div>
      )}
    </article>
  );
}
const Section = ({ title, children }) => (
  <section>
    <h4 className="mb-1.5 font-mono text-[11px] uppercase tracking-widest text-[#5B6475]">{title}</h4>
    {children}
  </section>
);
const List = ({ items }) => (
  <ul className="list-disc space-y-1 pl-5 marker:text-[#C9A227]">
    {items.map((x, i) => (
      <li key={i}>{x}</li>
    ))}
  </ul>
);
const SUGGESTED = [
  "Why do I have to pay this tax?",
  "How was this amount calculated?",
  "What documents do I need?",
  "What happens if I miss the deadline?",
  "Is there an exemption for me?",
  "How can I correct a mistake?",
];
function AskPanel({ assessmentId, code }) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState([]);
  async function ask(question) {
    if (!question.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/know-your-taxes/assessments/${assessmentId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obligationCode: code, question }),
      });
      const data = await res.json();
      setThread((t) => [
        ...t,
        res.ok
          ? { q: question, a: data.answer, grounded: data.grounded, citations: data.citations }
          : { q: question, a: data.error ?? "Couldn't answer right now.", grounded: false, citations: [] },
      ]);
      setQ("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="rounded-lg border border-[#D9D4C7] bg-[#FBF8F1] p-4">
      <h4 className="font-serif text-base text-[#14213D]">Ask about this tax</h4>
      <p className="text-xs text-[#5B6475]">
        Answers come only from TaxWise's rule data and cited sources. If something isn't covered, we'll say so.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTED.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => ask(s)}
            className="rounded-full border border-[#D9D4C7] bg-white px-3 py-1 text-xs hover:border-[#14213D]"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="mt-3 space-y-3">
        {thread.map((t, i) => (
          <div key={i} className="rounded-md bg-white p-3">
            <p className="text-xs font-semibold text-[#5B6475]">{t.q}</p>
            <p className="mt-1 whitespace-pre-line">{t.a}</p>
            {!t.grounded && (
              <p className="mt-2 text-xs text-[#2B4C7E]">We recommend confirming this with a qualified tax professional.</p>
            )}
            {t.citations.length > 0 && (
              <p className="mt-2 text-xs">
                Sources:{" "}
                {t.citations.map((c, j) => (
                  <a key={c.id} href={c.url} target="_blank" rel="noreferrer" className="text-[#2B4C7E] underline">
                    {c.title}
                    {j < t.citations.length - 1 ? "; " : ""}
                  </a>
                ))}
              </p>
            )}
          </div>
        ))}
      </div>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={500}
          placeholder="Type your question…"
          className="flex-1 rounded-md border border-[#D9D4C7] bg-white px-3 py-2 text-sm"
        />
        <button
          disabled={busy || !q.trim()}
          className="rounded-md bg-[#14213D] px-3 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {busy ? "…" : "Ask"}
        </button>
      </form>
    </section>
  );
}
