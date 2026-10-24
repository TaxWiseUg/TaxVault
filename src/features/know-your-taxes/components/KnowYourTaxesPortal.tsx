"use client";

import React, { useState, useEffect } from "react";
import { Questionnaire } from "./Questionnaire";
import { ResultsView } from "./ResultsView";
import { KnowYourTaxesCard } from "./KnowYourTaxesCard";
import { AssessmentResult, LegalSource } from "../types";
import { C } from "@/lib/constants";
import {
  FileCheck,
  History,
  Plus,
  RefreshCw,
  Scale,
  Shield,
} from "lucide-react";

interface AssessmentSummary {
  id: string;
  createdAt: string;
  entityType?: string;
  ruleSetId: string;
}

interface KnowYourTaxesPortalProps {
  initialAssessmentId?: string;
}

export const KnowYourTaxesPortal: React.FC<KnowYourTaxesPortalProps> = ({
  initialAssessmentId,
}) => {
  const [viewState, setViewState] = useState<"intro" | "questionnaire" | "result">("intro");
  const [activeAssessmentId, setActiveAssessmentId] = useState<string | null>(
    initialAssessmentId || null
  );
  const [activeResult, setActiveResult] = useState<AssessmentResult | null>(null);
  const [activeSources, setActiveSources] = useState<Record<string, LegalSource>>({});
  const [history, setHistory] = useState<AssessmentSummary[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch assessment history on mount
  const loadHistory = async () => {
    try {
      const res = await fetch("/api/know-your-taxes/assessments");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.assessments || []);
      }
    } catch {
      // silent
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Fetch assessment if an ID is active
  useEffect(() => {
    if (!activeAssessmentId) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/know-your-taxes/assessments/${activeAssessmentId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.assessment?.result) {
          setActiveResult(data.assessment.result);
          setActiveSources(data.sources || {});
          setViewState("result");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeAssessmentId]);

  const handleAssessmentCompleted = (id: string) => {
    setActiveAssessmentId(id);
    loadHistory();
  };

  const handleSelectHistorical = (id: string) => {
    setActiveAssessmentId(id);
  };

  return (
    <div
      className="workspace-feature-page workspace-know-taxes"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 1200,
        margin: "0 auto",
        width: "100%",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Intro Overview Screen */}
      {viewState === "intro" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <KnowYourTaxesCard onStart={() => setViewState("questionnaire")} />

          {/* Historical Saved Assessments */}
          <section className="kyt-history-panel">
          {history.length > 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "22px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 8px rgba(15, 32, 68, 0.04)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 16,
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <History size={18} style={{ color: C.teal }} />
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.15rem",
                      fontWeight: 800,
                      color: C.navy,
                      margin: 0,
                    }}
                  >
                    Your Previous Tax Assessments
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewState("questionnaire")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: C.teal,
                    color: "#FFFFFF",
                    border: "none",
                    borderRadius: 8,
                    padding: "7px 14px",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={14} />
                  <span>New Assessment</span>
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 12,
                }}
              >
                {history.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectHistorical(item.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: C.offwhite,
                      padding: "14px 16px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.teal;
                      e.currentTarget.style.background = "#FFFFFF";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.background = C.offwhite;
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.7rem",
                          color: C.muted,
                          fontFamily: "monospace",
                          marginBottom: 4,
                        }}
                      >
                        <span>Rules {item.ruleSetId}</span>
                        <span>{new Date(item.createdAt).toLocaleDateString("en-UG")}</span>
                      </div>
                      <div
                        style={{
                          fontSize: "0.92rem",
                          fontWeight: 800,
                          color: C.navy,
                        }}
                      >
                        {item.entityType ? item.entityType.replace(/_/g, " ") : "Tax Assessment"}
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        color: C.teal,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span>View Obligations →</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="kyt-history-empty">
              <div className="kyt-history-empty-icon"><History size={20} /></div>
              <div>
                <h3>Your previous assessments</h3>
                <p>Completed obligation assessments will appear here so you can review your filing requirements again.</p>
              </div>
              <button type="button" onClick={() => setViewState("questionnaire")}>
                <Plus size={15} /> Start an assessment
              </button>
            </div>
          )}
          </section>

          <section className="kyt-how-it-works" aria-labelledby="kyt-how-heading">
            <div className="kyt-section-heading">
              <span>YOUR NEXT STEPS</span>
              <h2 id="kyt-how-heading">A clear path from profile to filing</h2>
              <p>Answer a short set of questions, review the rules that apply, then use the results to plan your next filing actions.</p>
            </div>
            <div className="kyt-steps-grid">
              {[
                ["01", "Tell us about your activity", "Share the basics about your work, business, or rental income."],
                ["02", "Review matched obligations", "See the taxes, thresholds, deadlines, and records identified by the rules engine."],
                ["03", "Plan your next filing", "Use the grounded explanations and statutory sources to prepare your next step."],
              ].map(([step, title, description]) => (
                <article className="kyt-step-card" key={step}>
                  <span className="kyt-step-number">{step}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="kyt-obligations-preview" aria-labelledby="kyt-obligations-heading">
            <div className="kyt-section-heading">
              <span>RULES COVERED</span>
              <h2 id="kyt-obligations-heading">Explore the areas the assessment checks</h2>
              <p>The questionnaire uses your answers to identify relevant obligations across these tax areas.</p>
            </div>
            <div className="kyt-obligation-grid">
              {["Employment income · PAYE and NSSF", "Business activity · VAT and presumptive tax", "Rental income · individual and company obligations", "Company profits · corporate income tax"].map((item) => (
                <div className="kyt-obligation-item" key={item}><Shield size={17} /><span>{item}</span></div>
              ))}
            </div>
          </section>

          {/* 3 Key Feature Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 18,
            }}
          >
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "22px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(26, 123, 107, 0.1)",
                  color: C.teal,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Shield size={18} />
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, margin: "0 0 6px 0" }}>
                Deterministic Engine
              </h4>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Statutory parameters and triggers are strictly encoded into tested algorithms. Calculations do not rely on LLM math guesses.
              </p>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "22px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(200, 146, 42, 0.15)",
                  color: C.gold,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <Scale size={18} />
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, margin: "0 0 6px 0" }}>
                2026/27 Gazette Rules
              </h4>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Includes the enacted UGX 300M VAT registration threshold, resident PAYE brackets, and dual-schedule presumptive tax.
              </p>
            </div>

            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "22px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "rgba(15, 32, 68, 0.08)",
                  color: C.navy,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 12,
                }}
              >
                <FileCheck size={18} />
              </div>
              <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, margin: "0 0 6px 0" }}>
                Grounded Explanations
              </h4>
              <p style={{ fontSize: "0.82rem", color: "#64748B", margin: 0, lineHeight: 1.5 }}>
                Clear, actionable guidance detailing why each tax applies, required recordkeeping, filing channels, and statutory deadlines.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Questionnaire View */}
      {viewState === "questionnaire" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Questionnaire
            onCompleted={handleAssessmentCompleted}
            onCancel={() => setViewState("intro")}
          />
        </div>
      )}

      {/* Assessment Results View */}
      {viewState === "result" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 12 }}>

            <button
              type="button"
              onClick={() => {
                setActiveAssessmentId(null);
                setActiveResult(null);
                setViewState("questionnaire");
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: C.teal,
                color: "#FFFFFF",
                border: "none",
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(26, 123, 107, 0.25)",
              }}
            >
              <Plus size={14} />
              <span>Start Another Assessment</span>
            </button>
          </div>

          {loading || !activeResult ? (
            <div
              style={{
                background: "#FFFFFF",
                borderRadius: 14,
                padding: "60px 20px",
                border: `1px solid ${C.border}`,
                textAlign: "center",
              }}
            >
              <RefreshCw
                size={26}
                style={{
                  color: C.teal,
                  margin: "0 auto 12px",
                  animation: "spin 1s linear infinite",
                }}
              />
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: C.navy }}>
                Loading assessment results…
              </div>
            </div>
          ) : (
            <ResultsView
              id={activeAssessmentId!}
              result={activeResult}
              sources={activeSources}
              onEditAnswers={() => setViewState("questionnaire")}
            />
          )}
        </div>
      )}
    </div>
  );
};
