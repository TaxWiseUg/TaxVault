"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAnswered, pruneHiddenAnswers, visibleQuestions } from "../questionnaire";
const fmt = (n) => (n === undefined ? "" : n.toLocaleString("en-UG"));
const parseMoney = (s) => {
  const n = Number(s.replace(/[^\d]/g, ""));
  return s.trim() === "" || Number.isNaN(n) ? undefined : n;
};
export function Questionnaire({ initial = {} }) {
  const router = useRouter();
  const [answers, setAnswers] = useState(initial);
  const [skipped, setSkipped] = useState(new Set());
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const onReview = step >= questions.length;
  const q = questions[Math.min(step, questions.length - 1)];
  const done = questions.filter((x) => isAnswered(x, answers) || skipped.has(x.id)).length;
  const pct = Math.round((done / questions.length) * 100);
  function set(id, value) {
    // Changing an answer can hide later questions; prune their answers so they don't leak into the result.
    setAnswers((prev) => pruneHiddenAnswers({ ...prev, [id]: value }));
    setSkipped((s) => {
      const n = new Set(s);
      n.delete(id);
      return n;
    });
  }
  const canContinue = q && (isAnswered(q, answers) || q.optional);
  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/know-your-taxes/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not generate your results");
      const { id } = await res.json();
      router.push(`/know-your-taxes/${id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate your results");
      setSubmitting(false);
    }
  }
  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex items-baseline justify-between text-xs text-[#5B6475]">
          <span className="font-mono uppercase tracking-widest">{onReview ? "Review" : q?.section}</span>
          <span className="font-mono">{onReview ? "Ready" : `Question ${step + 1} of ${questions.length}`}</span>
        </div>
        <div
          className="mt-2 h-1.5 w-full rounded-full bg-[#E9E4D8]"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-1.5 rounded-full bg-[#1F6F50] transition-all" style={{ width: `${onReview ? 100 : pct}%` }} />
        </div>
      </div>

      {!onReview && q && (
        <div className="rounded-xl border border-[#D9D4C7] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-xl text-[#14213D] md:text-2xl">{q.prompt}</h2>
          {q.help && <p className="mt-2 text-sm text-[#5B6475]">{q.help}</p>}
          <div className="mt-5">
            <Field q={q} answers={answers} onChange={(v) => set(q.id, v)} />
          </div>
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm text-[#5B6475] disabled:opacity-40"
            >
              ← Back
            </button>
            <div className="flex gap-3">
              {q.optional && !isAnswered(q, answers) && (
                <button
                  type="button"
                  onClick={() => {
                    setSkipped((s) => new Set(s).add(q.id));
                    setStep((s) => s + 1);
                  }}
                  className="text-sm text-[#5B6475] underline"
                >
                  I don't know
                </button>
              )}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
                className="rounded-md bg-[#14213D] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {onReview && (
        <div className="rounded-xl border border-[#D9D4C7] bg-white p-6 shadow-sm">
          <h2 className="font-serif text-2xl text-[#14213D]">Check your answers</h2>
          <p className="mt-1 text-sm text-[#5B6475]">Tap any answer to change it before we generate your results.</p>
          <dl className="mt-4 divide-y divide-[#EEE9DD]">
            {questions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setStep(i)}
                className="flex w-full items-start justify-between gap-4 py-3 text-left hover:bg-[#FBF8F1]"
              >
                <dt className="text-sm text-[#5B6475]">{x.prompt}</dt>
                <dd className="shrink-0 text-sm font-medium text-[#14213D]">{display(x, answers)}</dd>
              </button>
            ))}
          </dl>
          {error && (
            <p role="alert" className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-800">
              {error}
            </p>
          )}
          <div className="mt-6 flex justify-between">
            <button type="button" onClick={() => setStep(questions.length - 1)} className="text-sm text-[#5B6475]">
              ← Back
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="rounded-md bg-[#1F6F50] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? "Working it out…" : "See my tax obligations"}
            </button>
          </div>
          <p className="mt-4 text-xs text-[#5B6475]">We never ask for passwords, URA logins or bank details.</p>
        </div>
      )}
    </div>
  );
}
function display(q, a) {
  const v = a[q.id];
  if (v === undefined) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return q.type === "money" ? `UGX ${fmt(v)}` : String(v);
  if (Array.isArray(v)) return v.map((x) => q.options?.find((o) => o.value === x)?.label ?? x).join(", ");
  return q.options?.find((o) => o.value === v)?.label ?? String(v);
}
function Field({ q, answers, onChange }) {
  const v = answers[q.id];
  const choice = (selected) =>
    `w-full rounded-lg border px-4 py-3 text-left transition ${selected ? "border-[#14213D] bg-[#14213D]/5 ring-1 ring-[#14213D]" : "border-[#D9D4C7] hover:border-[#14213D]/50"}`;
  if (q.type === "boolean")
    return (
      <div className="grid grid-cols-2 gap-3">
        {[true, false].map((b) => (
          <button key={String(b)} type="button" aria-pressed={v === b} onClick={() => onChange(b)} className={choice(v === b)}>
            {b ? "Yes" : "No"}
          </button>
        ))}
      </div>
    );
  if (q.type === "single")
    return (
      <div className="grid gap-2">
        {q.options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={v === o.value}
            onClick={() => onChange(o.value)}
            className={choice(v === o.value)}
          >
            <span className="font-medium text-[#14213D]">{o.label}</span>
            {o.hint && <span className="block text-xs text-[#5B6475]">{o.hint}</span>}
          </button>
        ))}
      </div>
    );
  if (q.type === "multi") {
    const arr = v ?? [];
    const toggle = (x) => {
      if (x === "NONE") return onChange(arr.includes("NONE") ? [] : ["NONE"]);
      const next = arr.filter((y) => y !== "NONE");
      onChange(next.includes(x) ? next.filter((y) => y !== x) : [...next, x]);
    };
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        {q.options.map((o) => (
          <button
            key={o.value}
            type="button"
            aria-pressed={arr.includes(o.value)}
            onClick={() => toggle(o.value)}
            className={choice(arr.includes(o.value))}
          >
            <span className="font-medium text-[#14213D]">{o.label}</span>
            {o.hint && <span className="block text-xs text-[#5B6475]">{o.hint}</span>}
          </button>
        ))}
      </div>
    );
  }
  return (
    <label className="block">
      <div className="flex items-center rounded-lg border border-[#D9D4C7] focus-within:ring-2 focus-within:ring-[#14213D]">
        {q.type === "money" && <span className="pl-4 font-mono text-sm text-[#5B6475]">UGX</span>}
        <input
          inputMode="numeric"
          autoFocus
          className="w-full rounded-lg bg-transparent px-3 py-3 font-mono text-lg text-[#14213D] outline-none"
          value={fmt(v)}
          onChange={(e) => onChange(parseMoney(e.target.value))}
          placeholder="0"
          aria-label={q.prompt}
        />
      </div>
    </label>
  );
}
