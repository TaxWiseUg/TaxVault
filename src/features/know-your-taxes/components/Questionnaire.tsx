"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Answers } from "../types";
import { isAnswered, pruneHiddenAnswers, visibleQuestions, QuestionDef } from "../questionnaire";
import { C } from "@/lib/constants";
import { ArrowLeft, ArrowRight, Check, HelpCircle, Shield, Sparkles } from "lucide-react";

const fmt = (n?: number) => (n === undefined ? "" : n.toLocaleString("en-UG"));

const parseMoney = (s: string): number | undefined => {
  const n = Number(s.replace(/[^\d]/g, ""));
  return s.trim() === "" || Number.isNaN(n) ? undefined : n;
};

interface QuestionnaireProps {
  initial?: Answers;
  onCompleted?: (assessmentId: string) => void;
  onCancel?: () => void;
}

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  initial = {},
  onCompleted,
  onCancel,
}) => {
  const router = useRouter();
  const [answers, setAnswers] = useState<Answers>(initial);
  const [skipped, setSkipped] = useState<Set<string>>(new Set());
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = useMemo(() => visibleQuestions(answers), [answers]);
  const onReview = step >= questions.length;
  const q = questions[Math.min(step, questions.length - 1)];
  const done = questions.filter((x) => isAnswered(x, answers) || skipped.has(x.id)).length;
  const pct = Math.round((done / questions.length) * 100);

  function setAnswer(id: keyof Answers, value: any) {
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
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Could not generate your results");
      }
      const data = await res.json();
      if (onCompleted) {
        onCompleted(data.id);
      } else {
        router.push(`/know-your-taxes/${data.id}`);
      }
    } catch (e: any) {
      setError(e?.message || "Could not generate your assessment results");
      setSubmitting(false);
    }
  }

  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Progress Indicator */}
      <div style={{ marginBottom: 12 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "0.75rem",
            color: "#64748B",
            fontWeight: 700,
            marginBottom: 6,
          }}
        >
          <span style={{ textTransform: "uppercase", letterSpacing: "0.08em", color: C.teal }}>
            {onReview ? "Final Review" : q?.section}
          </span>
          <span style={{ fontFamily: "monospace", fontSize: "0.72rem" }}>
            {onReview ? "Ready to compute" : `Step ${step + 1} of ${questions.length}`}
          </span>
        </div>
        <div
          style={{
            width: "100%",
            height: 6,
            borderRadius: 99,
            background: "#E2E8F0",
            overflow: "hidden",
          }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            style={{
              width: `${onReview ? 100 : pct}%`,
              height: "100%",
              background: `linear-gradient(90deg, ${C.teal} 0%, #0E7C5A 100%)`,
              borderRadius: 99,
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* Active Question Card */}
      {!onReview && q && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 14,
            padding: "20px 24px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 4px 16px rgba(15, 32, 68, 0.04)",
          }}
        >
          {/* Section Pill */}
          <div style={{ marginBottom: 8 }}>
            <span
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: 99,
                background: "rgba(26, 123, 107, 0.1)",
                color: C.teal,
                fontSize: "0.7rem",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {q.section}
            </span>
          </div>

          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.28rem",
              fontWeight: 800,
              color: C.navy,
              lineHeight: 1.3,
              margin: "0 0 6px 0",
            }}
          >
            {q.prompt}
          </h2>

          {q.help && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "#64748B",
                lineHeight: 1.4,
                margin: "0 0 14px 0",
                display: "flex",
                alignItems: "flex-start",
                gap: 6,
              }}
            >
              <HelpCircle size={14} style={{ color: C.teal, marginTop: 2, flexShrink: 0 }} />
              <span>{q.help}</span>
            </p>
          )}

          <div style={{ marginTop: 14 }}>
            <FieldComponent q={q} answers={answers} onChange={(v) => setAnswer(q.id, v)} />
          </div>

          {/* Action Row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 20,
              paddingTop: 14,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => {
                if (step === 0 && onCancel) {
                  onCancel();
                } else {
                  setStep((s) => Math.max(0, s - 1));
                }
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "#64748B",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                padding: "6px 4px",
              }}
            >
              <ArrowLeft size={15} />
              <span>{step === 0 ? "Cancel" : "Back"}</span>
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {q.optional && !isAnswered(q, answers) && (
                <button
                  type="button"
                  onClick={() => {
                    setSkipped((s) => new Set(s).add(q.id));
                    setStep((s) => s + 1);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#64748B",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  I don&apos;t know / Skip
                </button>
              )}
              <button
                type="button"
                disabled={!canContinue}
                onClick={() => setStep((s) => s + 1)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: canContinue ? C.navy : "#CBD5E1",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: 10,
                  padding: "10px 22px",
                  fontSize: "0.88rem",
                  fontWeight: 800,
                  cursor: canContinue ? "pointer" : "not-allowed",
                  boxShadow: canContinue ? "0 2px 8px rgba(15, 32, 68, 0.2)" : "none",
                  transition: "all 0.15s ease",
                }}
              >
                <span>Continue</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Screen */}
      {onReview && (
        <div
          style={{
            background: "#FFFFFF",
            borderRadius: 16,
            padding: "32px",
            border: `1px solid ${C.border}`,
            boxShadow: "0 6px 24px rgba(15, 32, 68, 0.05)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Sparkles size={20} style={{ color: C.gold }} />
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.55rem",
                fontWeight: 800,
                color: C.navy,
                margin: 0,
              }}
            >
              Check Your Profile Answers
            </h2>
          </div>
          <p style={{ fontSize: "0.84rem", color: "#64748B", margin: "0 0 20px 0" }}>
            Click on any item to adjust your answer before running the statutory obligation assessment.
          </p>

          <dl
            style={{
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              background: C.offwhite,
              overflow: "hidden",
              margin: "0 0 20px 0",
            }}
          >
            {questions.map((x, i) => (
              <button
                key={x.id}
                type="button"
                onClick={() => setStep(i)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 16,
                  padding: "12px 18px",
                  border: "none",
                  borderBottom: i < questions.length - 1 ? `1px solid ${C.border}` : "none",
                  background: "transparent",
                  textAlign: "left",
                  cursor: "pointer",
                  transition: "background 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <dt style={{ fontSize: "0.82rem", color: "#4B5563", fontWeight: 500, flex: 1 }}>
                  {x.prompt}
                </dt>
                <dd
                  style={{
                    fontSize: "0.84rem",
                    fontWeight: 700,
                    color: C.navy,
                    flexShrink: 0,
                    margin: 0,
                  }}
                >
                  {displayAnswer(x, answers)}
                </dd>
              </button>
            ))}
          </dl>

          {error && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: 8,
                background: "#FEF2F2",
                border: "1px solid #FCA5A5",
                color: "#991B1B",
                fontSize: "0.82rem",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
            }}
          >
            <button
              type="button"
              onClick={() => setStep(questions.length - 1)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "#64748B",
                fontSize: "0.85rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: C.teal,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 10,
                padding: "12px 26px",
                fontSize: "0.9rem",
                fontWeight: 800,
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 4px 14px rgba(26, 123, 107, 0.35)",
                opacity: submitting ? 0.7 : 1,
              }}
            >
              <Check size={16} />
              <span>{submitting ? "Evaluating 21 Tax Obligations…" : "See My Tax Obligations"}</span>
            </button>
          </div>

          <div
            style={{
              marginTop: 18,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontSize: "0.74rem",
              color: "#64748B",
              fontWeight: 600,
            }}
          >
            <Shield size={13} style={{ color: C.teal }} />
            <span>Strict Privacy: We never ask for TIN passwords, URA logins, or bank details.</span>
          </div>
        </div>
      )}
    </div>
  );
};

function displayAnswer(q: QuestionDef, a: Answers) {
  const v = a[q.id];
  if (v === undefined || v === null) return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (typeof v === "number") return q.type === "money" ? `UGX ${fmt(v)}` : String(v);
  if (Array.isArray(v))
    return v.map((x) => q.options?.find((o) => o.value === x)?.label ?? x).join(", ");
  return q.options?.find((o) => o.value === v)?.label ?? String(v);
}

function FieldComponent({
  q,
  answers,
  onChange,
}: {
  q: QuestionDef;
  answers: Answers;
  onChange: (v: any) => void;
}) {
  const v = answers[q.id];

  const getChoiceStyle = (selected: boolean): React.CSSProperties => ({
    width: "100%",
    borderRadius: 8,
    border: selected ? `2px solid ${C.teal}` : `1.5px solid ${C.border}`,
    background: selected ? "rgba(26, 123, 107, 0.08)" : "#FFFFFF",
    padding: "10px 14px",
    textAlign: "left",
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    boxShadow: selected ? "0 2px 6px rgba(26, 123, 107, 0.12)" : "none",
  });

  if (q.type === "boolean") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {[true, false].map((b) => {
          const selected = v === b;
          return (
            <button
              key={String(b)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(b)}
              style={getChoiceStyle(selected)}
            >
              <span style={{ fontSize: "1rem", fontWeight: 800, color: C.navy }}>
                {b ? "Yes" : "No"}
              </span>
              {selected && <Check size={18} style={{ color: C.teal }} />}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "single" && q.options) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.options.map((o) => {
          const selected = v === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              style={getChoiceStyle(selected)}
            >
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: C.navy }}>{o.label}</div>
                {o.hint && (
                  <div style={{ fontSize: "0.75rem", color: "#64748B", marginTop: 2 }}>{o.hint}</div>
                )}
              </div>
              {selected && <Check size={18} style={{ color: C.teal, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    );
  }

  if (q.type === "multi" && q.options) {
    const arr = (v as string[]) ?? [];
    const toggle = (x: string) => {
      if (x === "NONE") return onChange(arr.includes("NONE") ? [] : ["NONE"]);
      const next = arr.filter((y) => y !== "NONE");
      onChange(next.includes(x) ? next.filter((y) => y !== x) : [...next, x]);
    };

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 8,
        }}
      >
        {q.options.map((o) => {
          const selected = arr.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={selected}
              onClick={() => toggle(o.value)}
              style={getChoiceStyle(selected)}
            >
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: C.navy }}>{o.label}</div>
                {o.hint && (
                  <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: 2 }}>{o.hint}</div>
                )}
              </div>
              {selected && <Check size={16} style={{ color: C.teal, flexShrink: 0 }} />}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderRadius: 10,
          border: `1.5px solid ${C.border}`,
          background: "#FFFFFF",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(15, 32, 68, 0.04)",
        }}
      >
        {q.type === "money" && (
          <div
            style={{
              padding: "0 18px",
              background: "rgba(26, 123, 107, 0.1)",
              color: C.teal,
              fontWeight: 800,
              fontSize: "0.85rem",
              alignSelf: "stretch",
              display: "flex",
              alignItems: "center",
              fontFamily: "monospace",
            }}
          >
            UGX
          </div>
        )}
        <input
          inputMode="numeric"
          autoFocus
          style={{
            width: "100%",
            border: "none",
            outline: "none",
            padding: "14px 18px",
            fontSize: "1.15rem",
            fontWeight: 800,
            color: C.navy,
            fontFamily: "monospace",
          }}
          value={fmt(v as number)}
          onChange={(e) => onChange(parseMoney(e.target.value))}
          placeholder="0"
          aria-label={q.prompt}
        />
      </div>
    </div>
  );
}
