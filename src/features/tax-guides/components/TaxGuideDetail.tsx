"use client";

import React, { useState, useEffect, useMemo } from "react";
import { TaxGuide, TaxGuideRateTable, TaxGuideExample } from "../types";
import { TAX_GUIDES } from "../data/taxGuidesData";
import { C } from "@/lib/constants";
import {
  ArrowLeft,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Scale,
  Sparkles,
  ExternalLink,
  ChevronDown,
} from "lucide-react";

interface TaxGuideDetailProps {
  guide: TaxGuide;
  fromKyt?: boolean;
  onBack: () => void;
  onSelectGuide?: (slug: string) => void;
  onNavigatePage?: (page: string) => void;
}

export const TaxGuideDetail: React.FC<TaxGuideDetailProps> = ({
  guide,
  fromKyt = false,
  onBack,
  onSelectGuide,
  onNavigatePage,
}) => {
  const s = guide.sections;

  // Build dynamic section links based on sections present in the guide
  const sectionLinks = useMemo(() => {
    const links: { id: string; label: string }[] = [];

    if (s.whatItIs) {
      links.push({ id: "sec-what", label: "What it is" });
    }
    if (s.changes) {
      links.push({ id: "sec-changes", label: "What changed" });
    }
    if (s.whoApplies && s.whoApplies.length > 0) {
      links.push({ id: "sec-who", label: "Who it applies to" });
    }
    if (
      (s.rates && s.rates.length > 0) ||
      s.rateTable ||
      (s.rateTables && s.rateTables.length > 0)
    ) {
      links.push({ id: "sec-rates", label: "Rates & schedules" });
    }
    if (s.filing && s.filing.length > 0) {
      links.push({ id: "sec-filing", label: "Deadlines & filing" });
    }
    const examples = s.examples || (s.example ? [s.example] : []);
    if (examples.length > 0) {
      links.push({ id: "sec-examples", label: "Worked examples" });
    }
    if (s.special && s.special.length > 0) {
      links.push({ id: "sec-special", label: "Special cases" });
    }
    if (s.penalties && s.penalties.length > 0) {
      links.push({ id: "sec-penalties", label: "Statutory penalties" });
    }
    if (s.mistakes && s.mistakes.length > 0) {
      links.push({ id: "sec-mistakes", label: "Common pitfalls" });
    }
    if (s.faqs && s.faqs.length > 0) {
      links.push({ id: "sec-faqs", label: "Frequently asked questions" });
    }
    if (s.legal && s.legal.length > 0) {
      links.push({ id: "sec-legal", label: "Legal reference" });
    }
    if (s.sources && s.sources.length > 0) {
      links.push({ id: "sec-sources", label: "Statutory sources" });
    }

    return links;
  }, [s]);

  const [activeSection, setActiveSection] = useState<string>(
    sectionLinks[0]?.id || "sec-what"
  );

  // Scroll to top on guide change
  useEffect(() => {
    const scrollContainer = document.querySelector(".main-scroll-container");
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: "instant" });
    } else {
      window.scrollTo(0, 0);
    }
    if (sectionLinks.length > 0) {
      setActiveSection(sectionLinks[0].id);
    }
  }, [guide.slug, sectionLinks]);

  // Scroll-spy: automatically highlight the active section while scrolling
  useEffect(() => {
    const scrollContainer = document.querySelector(".main-scroll-container");
    if (!scrollContainer) return;

    const handleScroll = () => {
      const containerRect = scrollContainer.getBoundingClientRect();
      const triggerY = containerRect.top + 140;

      for (let i = sectionLinks.length - 1; i >= 0; i--) {
        const link = sectionLinks[i];
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
  }, [sectionLinks]);

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

  const renderTable = (t: TaxGuideRateTable, index: number) => {
    return (
      <div key={index} style={{ marginBottom: 20 }}>
        {t.caption && (
          <p
            style={{
              margin: "0 0 8px",
              fontWeight: 700,
              fontSize: "0.88rem",
              color: C.navy,
            }}
          >
            {t.caption}
          </p>
        )}
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
                {t.columns.map((c, idx) => (
                  <th
                    key={idx}
                    style={{
                      textAlign: idx === 0 ? "left" : "left",
                      padding: "10px 14px",
                      fontFamily: "monospace",
                      fontSize: "0.72rem",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      color: C.muted,
                      fontWeight: 700,
                    }}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {t.rows.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  style={{
                    borderBottom:
                      rIdx === t.rows.length - 1 ? "none" : `1px dashed ${C.border}`,
                    background: rIdx % 2 === 0 ? "var(--color-white)" : "transparent",
                  }}
                >
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      style={{
                        padding: "11px 14px",
                        fontFamily:
                          cIdx === 0 && /^(\d|Up to|Above)/.test(cell)
                            ? "monospace"
                            : "inherit",
                        fontWeight: cIdx === 0 ? 600 : 500,
                        color: C.navy,
                        verticalAlign: "top",
                        fontSize: "0.88rem",
                        lineHeight: 1.5,
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderWorkedExample = (ex: TaxGuideExample, idx: number) => {
    return (
      <div
        key={idx}
        style={{
          marginTop: idx > 0 ? 28 : 0,
          borderTop: idx > 0 ? `1px solid ${C.border}` : "none",
          paddingTop: idx > 0 ? 24 : 0,
        }}
      >
        {ex.title && (
          <h3
            style={{
              margin: "0 0 8px",
              fontSize: "1.05rem",
              fontWeight: 800,
              color: C.navy,
            }}
          >
            {ex.title}
          </h3>
        )}
        <p
          style={{
            margin: "0 0 16px",
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
                    fontSize: "0.72rem",
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
                    fontSize: "0.72rem",
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
                    fontSize: "0.72rem",
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
              {ex.lines.map((line, lIdx) => (
                <tr
                  key={lIdx}
                  style={{
                    borderBottom: `1px dashed ${C.border}`,
                    background: lIdx % 2 === 0 ? "var(--color-white)" : "transparent",
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
                    fontSize: "0.95rem",
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
      </div>
    );
  };

  // Other guides recommendations
  const otherGuides = TAX_GUIDES.filter(
    (g) => g.slug !== guide.slug && g.status === "published"
  ).slice(0, 3);

  const examples = s.examples || (s.example ? [s.example] : []);
  const allRateTables = s.rateTables || (s.rateTable ? [s.rateTable] : []);

  return (
    <div
      className="workspace-feature-page workspace-tax-guides"
      style={{
        maxWidth: 1400,
        width: "100%",
        margin: "0 auto",
        paddingBottom: 64,
        WebkitFontSmoothing: "antialiased",
        MozOsxFontSmoothing: "grayscale",
        textRendering: "optimizeLegibility",
      }}
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
            WebkitFontSmoothing: "antialiased",
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
          }}
        >
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
            {s.changes && (
              <span
                style={{
                  fontFamily: "monospace",
                  fontSize: "0.74rem",
                  letterSpacing: "0.05em",
                  fontWeight: 800,
                  color: "#166534",
                  background: "#DCFCE7",
                  padding: "3px 10px",
                  borderRadius: 999,
                }}
              >
                Updated 2026
              </span>
            )}
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
          gridTemplateColumns: "240px minmax(0, 1fr)",
          gap: 32,
          alignItems: "start",
        }}
        className="tg-detail-grid"
      >
        {/* STICKY TABLE OF CONTENTS - CRISP, NO-BLUR RENDERING */}
        <aside
          style={{
            position: "sticky",
            top: 96,
            background: "var(--color-white)",
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            padding: "16px 14px",
            boxShadow: "0 1px 4px rgba(15,32,68,0.03)",
            isolation: "isolate",
            transform: "translateZ(0)",
            backfaceVisibility: "hidden",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            textRendering: "optimizeLegibility",
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

          <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {sectionLinks.map((link) => {
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
                    padding: "7px 10px",
                    borderRadius: 6,
                    border: "none",
                    borderLeft: isSelected
                      ? `3px solid ${C.teal}`
                      : "3px solid transparent",
                    background: isSelected
                      ? "rgba(26, 123, 107, 0.08)"
                      : "transparent",
                    color: isSelected ? C.teal : C.muted,
                    fontWeight: isSelected ? 800 : 600,
                    fontSize: "0.82rem",
                    textAlign: "left",
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                    WebkitFontSmoothing: "antialiased",
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
                  <span style={{ lineHeight: 1.35 }}>{link.label}</span>
                  {isSelected && (
                    <ChevronRight
                      size={14}
                      style={{ color: C.teal, flexShrink: 0, marginLeft: 6 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* EDITORIAL CONTENT BODY */}
        <article style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {/* SECTION: WHAT IT IS */}
          {s.whatItIs && (
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
              <p
                style={{
                  margin: 0,
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                  color: C.navy,
                }}
              >
                {s.whatItIs}
              </p>
            </section>
          )}

          {/* SECTION: WHAT CHANGED */}
          {s.changes && (
            <section
              id="sec-changes"
              style={{
                scrollMarginTop: 96,
                background: "rgba(26, 123, 107, 0.06)",
                border: "1px solid rgba(26, 123, 107, 0.22)",
                borderLeft: `4px solid ${C.teal}`,
                borderRadius: "0 12px 12px 0",
                padding: "22px 26px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 10,
                }}
              >
                <Sparkles size={18} style={{ color: C.teal }} />
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.12rem",
                    fontWeight: 800,
                    color: C.navy,
                  }}
                >
                  {s.changes.title}
                </h2>
              </div>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {s.changes.points.map((pt, idx) => (
                  <li
                    key={idx}
                    style={{
                      fontSize: "0.92rem",
                      lineHeight: 1.6,
                      color: C.navy,
                    }}
                  >
                    {pt}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* SECTION: WHO IT APPLIES TO */}
          {s.whoApplies && s.whoApplies.length > 0 && (
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
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.95rem",
                        lineHeight: 1.65,
                        color: C.navy,
                      }}
                    >
                      {paragraph}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: STATUTORY RATES & SCHEDULES */}
          {((s.rates && s.rates.length > 0) ||
            allRateTables.length > 0 ||
            (s.rateNotes && s.rateNotes.length > 0)) && (
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
                Statutory rates & bands
              </h2>

              {/* Rate cards if present */}
              {s.rates && s.rates.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: 14,
                    marginBottom: allRateTables.length > 0 ? 20 : 0,
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
                      <span
                        style={{ fontWeight: 800, fontSize: "0.92rem", color: C.navy }}
                      >
                        {rateItem.name}
                      </span>
                      <span
                        style={{ fontSize: "0.82rem", lineHeight: 1.5, color: C.muted }}
                      >
                        {rateItem.note}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Rate tables if present */}
              {allRateTables.map((table, idx) => renderTable(table, idx))}

              {/* Rate notes if present */}
              {s.rateNotes && s.rateNotes.length > 0 && (
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {s.rateNotes.map((note, idx) => (
                    <p
                      key={idx}
                      style={{
                        margin: 0,
                        fontSize: "0.85rem",
                        color: C.muted,
                        lineHeight: 1.6,
                        fontStyle: "italic",
                      }}
                    >
                      * {note}
                    </p>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* SECTION: DEADLINES & FILING */}
          {s.filing && s.filing.length > 0 && (
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
                  paddingLeft: 22,
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
          )}

          {/* SECTION: WORKED EXAMPLES */}
          {examples.length > 0 && (
            <section
              id="sec-examples"
              style={{
                scrollMarginTop: 96,
                background: "var(--color-white)",
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "24px 28px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
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
                  margin: "0 0 18px",
                  fontSize: "1.25rem",
                  fontWeight: 800,
                  color: C.navy,
                  letterSpacing: "-0.01em",
                }}
              >
                Worked examples
              </h2>

              {examples.map((ex, idx) => renderWorkedExample(ex, idx))}
            </section>
          )}

          {/* SECTION: SPECIAL CASES */}
          {s.special && s.special.length > 0 && (
            <section
              id="sec-special"
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
                Special cases & treatment
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: 14,
                }}
              >
                {s.special.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "16px 18px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      background: "var(--color-offwhite)",
                    }}
                  >
                    <h3
                      style={{
                        margin: "0 0 8px",
                        fontSize: "0.96rem",
                        fontWeight: 800,
                        color: C.navy,
                      }}
                    >
                      {item.title}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.88rem",
                        lineHeight: 1.6,
                        color: C.muted,
                      }}
                    >
                      {item.text}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: STATUTORY PENALTIES */}
          {s.penalties && s.penalties.length > 0 && (
            <section
              id="sec-penalties"
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
                Statutory penalties (Tax Procedures Code Act)
              </h2>
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
                          padding: "11px 16px",
                          fontFamily: "monospace",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: C.muted,
                          width: "42%",
                        }}
                      >
                        Default / Offense
                      </th>
                      <th
                        style={{
                          textAlign: "left",
                          padding: "11px 16px",
                          fontFamily: "monospace",
                          fontSize: "0.72rem",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                          color: C.muted,
                        }}
                      >
                        Statutory Penalty
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.penalties.map((p, idx) => (
                      <tr
                        key={idx}
                        style={{
                          borderBottom:
                            idx === s.penalties!.length - 1
                              ? "none"
                              : `1px dashed ${C.border}`,
                          background: idx % 2 === 0 ? "var(--color-white)" : "transparent",
                        }}
                      >
                        <td
                          style={{
                            padding: "12px 16px",
                            fontWeight: 700,
                            color: C.navy,
                            verticalAlign: "top",
                          }}
                        >
                          {p.item}
                        </td>
                        <td
                          style={{
                            padding: "12px 16px",
                            color: C.muted,
                            lineHeight: 1.5,
                            verticalAlign: "top",
                          }}
                        >
                          {p.penalty}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* SECTION: COMMON MISTAKES */}
          {s.mistakes && s.mistakes.length > 0 && (
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
          )}

          {/* SECTION: FAQS */}
          {s.faqs && s.faqs.length > 0 && (
            <section
              id="sec-faqs"
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
                Frequently asked questions
              </h2>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                {s.faqs.map((faq, idx) => (
                  <details
                    key={idx}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      padding: "14px 0",
                    }}
                  >
                    <summary
                      style={{
                        cursor: "pointer",
                        fontWeight: 700,
                        fontSize: "0.95rem",
                        color: C.navy,
                        listStyle: "none",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        size={16}
                        style={{ color: C.teal, flexShrink: 0 }}
                      />
                    </summary>
                    <p
                      style={{
                        margin: "12px 0 4px",
                        fontSize: "0.92rem",
                        lineHeight: 1.65,
                        color: C.muted,
                        paddingLeft: 4,
                      }}
                    >
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: LEGAL REFERENCE */}
          {s.legal && s.legal.length > 0 && (
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
          )}

          {/* SECTION: STATUTORY SOURCES */}
          {s.sources && s.sources.length > 0 && (
            <section
              id="sec-sources"
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
                Official statutory & technical sources
              </h2>
              <ul
                style={{
                  margin: 0,
                  paddingLeft: 22,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {s.sources.map((src, idx) => (
                  <li key={idx}>
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        color: C.teal,
                        textDecoration: "none",
                        fontWeight: 600,
                        fontSize: "0.9rem",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = "underline";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = "none";
                      }}
                    >
                      <span>{src.title}</span>
                      <ExternalLink size={13} style={{ flexShrink: 0 }} />
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* CROSS-SERVICE ACTION CTA BANNER - CRISP, NO-BLUR */}
          {guide.cta && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                padding: "22px 26px",
                background: `linear-gradient(135deg, ${C.navy} 0%, #152A4A 100%)`,
                borderRadius: 12,
                color: "#FFFFFF",
                boxShadow: "0 4px 16px rgba(15,32,68,0.12)",
                isolation: "isolate",
                transform: "translateZ(0)",
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                textRendering: "optimizeLegibility",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "0.74rem",
                    fontFamily: "monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: C.gold,
                    fontWeight: 800,
                    marginBottom: 4,
                  }}
                >
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
                  WebkitFontSmoothing: "antialiased",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#14685A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.teal;
                }}
              >
                <span>Launch Tool</span>
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* OTHER GUIDES RECOMMENDATION GRID */}
          {otherGuides.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: "0.74rem",
                  fontFamily: "monospace",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: C.muted,
                  fontWeight: 800,
                  marginBottom: 10,
                }}
              >
                Other statutory guides
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: 12,
                }}
              >
                {otherGuides.map((other) => (
                  <button
                    key={other.slug}
                    type="button"
                    onClick={() => {
                      if (onSelectGuide) {
                        onSelectGuide(other.slug);
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "var(--color-white)",
                      border: `1px solid ${C.border}`,
                      borderRadius: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = C.teal;
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = C.border;
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: C.teal,
                        background: "rgba(26,123,107,0.1)",
                        padding: "3px 8px",
                        borderRadius: 6,
                        flexShrink: 0,
                      }}
                    >
                      {other.short}
                    </span>
                    <span
                      style={{
                        fontSize: "0.88rem",
                        fontWeight: 700,
                        color: C.navy,
                        lineHeight: 1.3,
                      }}
                    >
                      {other.title}
                    </span>
                  </button>
                ))}
              </div>
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
              Last reviewed: {formatDate(guide.lastReviewed)} · Rules in force from 1 July 2026
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
    </div>
  );
};
