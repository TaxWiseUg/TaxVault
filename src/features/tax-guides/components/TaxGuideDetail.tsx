"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { TaxGuide } from "../types";
import { C } from "@/lib/constants";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Scale,
} from "lucide-react";

interface TaxGuideDetailProps {
  guide: TaxGuide;
  fromKyt?: boolean;
  onBack: () => void;
  onNavigatePage?: (page: string) => void;
}

const SECTION_LINKS = [
  { id: "sec-what", label: "What it is" },
  { id: "sec-who", label: "Who it applies to" },
  { id: "sec-rates", label: "Statutory rates" },
  { id: "sec-filing", label: "Deadlines & filing" },
  { id: "sec-example", label: "Worked example" },
  { id: "sec-mistakes", label: "Common pitfalls" },
  { id: "sec-legal", label: "Legal reference" },
];

export const TaxGuideDetail: React.FC<TaxGuideDetailProps> = ({
  guide,
  fromKyt = false,
  onBack,
  onNavigatePage,
}) => {
  const [activeSection, setActiveSection] = useState<string>("sec-what");

  // Scroll to top on guide change
  useEffect(() => {
    const scrollContainer = document.querySelector(".main-scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.scrollTo(0, 0);
    }
  }, [guide.slug]);

  // Scroll-spy: automatically highlight the active section while scrolling
  useEffect(() => {
    const scrollContainer = document.querySelector(".main-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const triggerY = containerRect.top + 140;

      for (let i = SECTION_LINKS.length - 1; i >= 0; i--) {
        const link = SECTION_LINKS[i];
        const el = document.getElementById(link.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= triggerY) {
            setActiveSection(link.id);
            break;
          }
        }
      }
    };

    scrollContainer.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const el = document.getElementById(id);
    if (!el) return;

    const scrollContainer = document.querySelector(".main-scroll-container");
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const targetTop = scrollContainer.scrollTop + (elRect.top - containerRect.top) - 80;
      scrollContainer.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    } else {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const fmtUGX = (n: number) => {
    const isNeg = n < 0;
    const formatted = Math.abs(n).toLocaleString("en-US");
    return isNeg ? `(${formatted})` : formatted;
  };

  const formatDate = (iso: string) => {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const s = guide.sections;
  const ex = s.example;

  return (
    <motion.div
      className="workspace-feature-page workspace-tax-guides"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ maxWidth: 1400, width: "100%", margin: "0 auto", paddingBottom: 64 }}
    >
      {/* DIRECT BACK BUTTON (STRICTLY NO BREADCRUMBS) */}
      <div style={{ paddingTop: 8, paddingBottom: 20 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 16px",
            borderRadius: 999,
            border: `1.5px solid ${C.border}`,
            background: "var(--color-white)",
            color: C.navy,
            fontSize: "0.85rem",
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
            boxShadow: "0 1px 3px rgba(15,32,68,0.06)",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = C.teal;
            e.currentTarget.style.color = C.teal;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = C.border;
            e.currentTarget.style.color = C.navy;
          }}
        >
          <ArrowLeft size={16} />
          <span>{fromKyt ? "Back to your tax results" : "Back to all tax guides"}</span>
        </button>
      </div>

      {/* HEADER SECTION */}
      <header
        style={{
          padding: "24px 28px",
          background: "var(--color-white)",
          border: `1px solid ${C.border}`,
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(15,32,68,0.04)",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "0.78rem",
                letterSpacing: "0.08em",
                fontWeight: 800,
                color: C.teal,
                textTransform: "uppercase",
                background: "rgba(26, 123, 107, 0.1)",
                padding: "3px 10px",
                borderRadius: 999,
              }}
            >
              {guide.category}
            </span>
            <span
              style={{
                fontSize: "0.76rem",
                color: C.muted,
                fontWeight: 600,
              }}
            >
              Reviewed {formatDate(guide.lastReviewed)}
            </span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.78rem",
              fontWeight: 700,
              color: "#15803D",
              background: "#DCFCE7",
              padding: "4px 10px",
              borderRadius: 999,
            }}
          >
            <ShieldCheck size={14} />
            <span>Statutory Verification Complete</span>
          </div>
        </div>

        <h1
          style={{
            margin: "0 0 10px",
            fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)",
            fontWeight: 800,
            color: C.navy,
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          {guide.title}{" "}
          <span style={{ color: C.teal, fontWeight: 700 }}>({guide.short})</span>
        </h1>

        <p
          style={{
            margin: "0 0 24px",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: C.muted,
            maxWidth: 820,
          }}
        >
          {guide.summary}
        </p>

        {/* KEY STATUTORY FACTS STRIP */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            background: "var(--color-offwhite)",
            padding: 14,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
          }}
        >
          {guide.keyFacts.map((fact, idx) => (
            <div
              key={idx}
              style={{
                background: "var(--color-white)",
                padding: "12px 14px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: C.muted,
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                {fact.label}
              </div>
              <div
                style={{
                  fontSize: "0.95rem",
                  fontWeight: 800,
                  color: C.navy,
                }}
              >
                {fact.value}
              </div>
            </div>
          ))}
        </div>
      </header>

      {/* TWO-COLUMN LAYOUT: STICKY TOC + CONTENT BODY */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "220px minmax(0, 1fr)",
          gap: 32,
          alignItems: "start",
        }}
        className="tg-detail-grid"
      >
        {/* STICKY TABLE OF CONTENTS */}
        <aside
          style={{
            position: "sticky",
            top: 96,
            background: "var(--color-white)",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "16px 14px",
            boxShadow: "0 1px 4px rgba(15,32,68,0.03)",
          }}
        >
          <div
            style={{
              fontSize: "0.72rem",
              fontFamily: "monospace",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: C.muted,
              fontWeight: 800,
              marginBottom: 12,
              paddingLeft: 8,
            }}
          >
            On this page
          </div>

          <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {SECTION_LINKS.map((link) => {
              const isSelected = activeSection === link.id;
              return (
                <button
                  key={link.id}
                  type="button"
                  onClick={() => scrollToSection(link.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 10px",
                    borderRadius: 6,
                    border: "none",
                    borderLeft: isSelected ? `3px solid ${C.teal}` : "3px solid transparent",
                    background: isSelected ? "rgba(26, 123, 107, 0.08)" : "transparent",
                    color: isSelected ? C.teal : C.muted,
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: "0.82rem",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "var(--color-offwhite)";
                      e.currentTarget.style.color = C.navy;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = C.muted;
                    }
                  }}
                >
                  <span>{link.label}</span>
                  {isSelected && <ChevronRight size={14} style={{ color: C.teal }} />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* EDITORIAL CONTENT BODY */}
        <article style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {/* SECTION 1: WHAT IT IS */}
          <section
            id="sec-what"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 14px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              What it is
            </h2>
            <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.7, color: C.navy }}>
              {s.whatItIs}
            </p>
          </section>

          {/* SECTION 2: WHO IT APPLIES TO */}
          <section
            id="sec-who"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Who it applies to
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {s.whoApplies.map((paragraph, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(26, 123, 107, 0.12)",
                      color: C.teal,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    ✓
                  </span>
                  <p style={{ margin: 0, fontSize: "0.95rem", lineHeight: 1.65, color: C.navy }}>
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 3: RATES */}
          <section
            id="sec-rates"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Statutory rates
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: 14,
              }}
            >
              {s.rates.map((rateItem, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 16,
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: "var(--color-offwhite)",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontSize: "1.45rem",
                      fontWeight: 900,
                      color: C.teal,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {rateItem.rate}
                  </span>
                  <span style={{ fontWeight: 800, fontSize: "0.92rem", color: C.navy }}>
                    {rateItem.name}
                  </span>
                  <span style={{ fontSize: "0.82rem", lineHeight: 1.5, color: C.muted }}>
                    {rateItem.note}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: DEADLINES & FILING */}
          <section
            id="sec-filing"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Deadlines & filing requirements
            </h2>
            <ol
              style={{
                margin: 0,
                paddingLeft: 20,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {s.filing.map((step, idx) => (
                <li
                  key={idx}
                  style={{
                    fontSize: "0.95rem",
                    lineHeight: 1.65,
                    color: C.navy,
                    paddingLeft: 4,
                  }}
                >
                  {step}
                </li>
              ))}
            </ol>
          </section>

          {/* SECTION 5: WORKED EXAMPLE (LEDGER STYLE) */}
          <section
            id="sec-example"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.72rem",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  fontWeight: 800,
                  color: C.gold,
                  background: "rgba(200, 146, 42, 0.12)",
                  padding: "3px 8px",
                  borderRadius: 6,
                }}
              >
                Practical Computation
              </span>
            </div>
            <h2
              style={{
                margin: "0 0 12px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Worked example
            </h2>
            <p
              style={{
                margin: "0 0 18px",
                fontSize: "0.92rem",
                lineHeight: 1.6,
                color: C.muted,
              }}
            >
              {ex.scenario}
            </p>

            {/* LEDGER TABLE */}
            <div
              style={{
                overflowX: "auto",
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                background: "var(--color-offwhite)",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: "0.88rem",
                }}
              >
                <thead>
                  <tr
                    style={{
                      background: "var(--color-white)",
                      borderBottom: `1.5px solid ${C.border}`,
                    }}
                  >
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontFamily: "monospace",
                        fontSize: "0.74rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.muted,
                      }}
                    >
                      Item Description
                    </th>
                    <th
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontFamily: "monospace",
                        fontSize: "0.74rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.muted,
                      }}
                    >
                      Working / Basis
                    </th>
                    <th
                      style={{
                        textAlign: "right",
                        padding: "12px 16px",
                        fontFamily: "monospace",
                        fontSize: "0.74rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: C.muted,
                      }}
                    >
                      UGX Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ex.lines.map((line, idx) => (
                    <tr
                      key={idx}
                      style={{
                        borderBottom: `1px dashed ${C.border}`,
                        background: idx % 2 === 0 ? "var(--color-white)" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontWeight: 600,
                          color: C.navy,
                        }}
                      >
                        {line.label}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontFamily: "monospace",
                          fontSize: "0.82rem",
                          color: C.muted,
                        }}
                      >
                        {line.calc}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          textAlign: "right",
                          fontFamily: "monospace",
                          fontWeight: 700,
                          color: line.amount < 0 ? "#DC2626" : C.navy,
                        }}
                      >
                        {fmtUGX(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr
                    style={{
                      background: "rgba(26, 123, 107, 0.09)",
                      borderTop: `2px solid ${C.navy}`,
                    }}
                  >
                    <td
                      style={{
                        padding: "14px 16px",
                        fontWeight: 800,
                        color: C.navy,
                      }}
                    >
                      {ex.total.label}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        fontFamily: "monospace",
                        fontSize: "0.82rem",
                        color: C.teal,
                        fontWeight: 700,
                      }}
                    >
                      {ex.total.note}
                    </td>
                    <td
                      style={{
                        padding: "14px 16px",
                        textAlign: "right",
                        fontFamily: "monospace",
                        fontSize: "1rem",
                        fontWeight: 900,
                        color: C.teal,
                      }}
                    >
                      UGX {fmtUGX(ex.total.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>

          {/* SECTION 6: COMMON MISTAKES */}
          <section
            id="sec-mistakes"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 16px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Common mistakes & audit pitfalls
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {s.mistakes.map((mistake, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "flex-start",
                    padding: "12px 16px",
                    background: "rgba(220, 38, 38, 0.05)",
                    border: "1px solid rgba(220, 38, 38, 0.18)",
                    borderRadius: 8,
                  }}
                >
                  <AlertTriangle
                    size={18}
                    style={{ color: "#DC2626", flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    style={{
                      fontSize: "0.92rem",
                      lineHeight: 1.6,
                      color: "#991B1B",
                      fontWeight: 600,
                    }}
                  >
                    {mistake}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 7: LEGAL REFERENCE */}
          <section
            id="sec-legal"
            style={{
              scrollMarginTop: 96,
              background: "var(--color-white)",
              border: `1px solid ${C.border}`,
              borderRadius: 12,
              padding: "24px 28px",
            }}
          >
            <h2
              style={{
                margin: "0 0 14px",
                fontSize: "1.25rem",
                fontWeight: 800,
                color: C.navy,
                letterSpacing: "-0.01em",
              }}
            >
              Statutory legal reference
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {s.legal.map((law, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "var(--color-offwhite)",
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    fontSize: "0.88rem",
                    fontFamily: "monospace",
                    fontWeight: 600,
                    color: C.navy,
                  }}
                >
                  <Scale size={16} style={{ color: C.teal, flexShrink: 0 }} />
                  <span>{law}</span>
                </div>
              ))}
            </div>
          </section>

          {/* CROSS-SERVICE ACTION CTA */}
          {guide.cta && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "20px 24px",
                background: `linear-gradient(135deg, ${C.navy} 0%, #152A4A 100%)`,
                borderRadius: 12,
                color: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(15,32,68,0.15)",
              }}
            >
              <div>
                <div style={{ fontSize: "0.74rem", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.08em", color: C.gold, fontWeight: 800, marginBottom: 4 }}>
                  Actionable Workflow
                </div>
                <div style={{ fontSize: "1.05rem", fontWeight: 800 }}>
                  {guide.cta.label}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (guide.cta?.page && onNavigatePage) {
                    onNavigatePage(guide.cta.page);
                  }
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 18px",
                  borderRadius: 8,
                  border: "none",
                  background: C.teal,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  boxShadow: "0 2px 6px rgba(26,123,107,0.3)",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#14685A"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = C.teal; }}
              >
                <span>Launch Tool</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* FOOTER STATUTORY NOTICE */}
          <footer
            style={{
              paddingTop: 16,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              fontSize: "0.78rem",
              color: C.muted,
              fontFamily: "monospace",
            }}
          >
            <span>
              Last reviewed: {formatDate(guide.lastReviewed)} · Source: Uganda Revenue Authority & Statutory Acts
            </span>
            <span>
              Disclaimer: This guide provides reference information based on current Ugandan tax legislation and does not substitute for certified statutory tax advice.
            </span>
          </footer>
        </article>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .tg-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .tg-detail-grid aside {
            display: none !important;
          }
        }
      `}</style>
    </motion.div>
  );
};
