"use client";

import React, { useState } from "react";
import { motion } from "motion/react";
import { AssessmentResult, LegalSource, Obligation, ObligationStatus } from "../types";
import { C } from "@/lib/constants";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  HelpCircle,
  Info,
  MessageSquare,
  Printer,
  Scale,
  Send,
  Sparkles,
} from "lucide-react";
import { findTaxGuide, TAX_GUIDES_DATA } from "@/features/tax-guides/data/taxGuidesData";


const UGX = (n: number) => `UGX ${Math.round(n).toLocaleString("en-UG")}`;

const STATUS_CONFIG: Record<
  ObligationStatus,
  { label: string; bg: string; color: string; border: string; dot: string; icon: React.ReactNode }
> = {
  LIKELY: {
    label: "Likely applicable",
    bg: "#DCFCE7",
    color: "#15803D",
    border: "rgba(22, 163, 74, 0.3)",
    dot: "#16A34A",
    icon: <CheckCircle2 size={13} style={{ color: "#16A34A" }} />,
  },
  NEEDS_INFO: {
    label: "Needs more info",
    bg: "#FEF3C7",
    color: "#B45309",
    border: "rgba(217, 119, 6, 0.3)",
    dot: "#D97706",
    icon: <HelpCircle size={13} style={{ color: "#D97706" }} />,
  },
  PROFESSIONAL_REVIEW: {
    label: "Professional review",
    bg: "#E0E7FF",
    color: "#3730A3",
    border: "rgba(79, 70, 229, 0.3)",
    dot: "#4F46E5",
    icon: <Scale size={13} style={{ color: "#4F46E5" }} />,
  },
  NOT_APPLICABLE: {
    label: "Not applicable",
    bg: "#F1F5F9",
    color: "#64748B",
    border: "#E2E8F0",
    dot: "#94A3B8",
    icon: <Info size={13} style={{ color: "#94A3B8" }} />,
  },
};

const CATEGORY_LABEL: Record<string, string> = {
  TAX: "Tax Obligation",
  STATUTORY_CONTRIBUTION: "Statutory Contribution (not a tax)",
  REGISTRATION: "Registration / Licence (not a tax)",
};

const ORDER: ObligationStatus[] = ["LIKELY", "NEEDS_INFO", "PROFESSIONAL_REVIEW", "NOT_APPLICABLE"];

interface ResultsViewProps {
  id: string;
  result: AssessmentResult;
  sources: Record<string, LegalSource>;
  onEditAnswers?: () => void;
  onSelectGuide?: (slug: string) => void;
  onBrowseAllGuides?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  id,
  result,
  sources,
  onEditAnswers,
  onSelectGuide,
  onBrowseAllGuides,
}) => {
  const [openCode, setOpenCode] = useState<string | null>(
    result.obligations.find((o) => o.status === "LIKELY")?.code ?? null
  );

  const matchingGuides = React.useMemo(() => {
    const slugSet = new Set<string>();
    const applicableObligations = result.obligations.filter(
      (o) => o.status === "LIKELY" || o.status === "NEEDS_INFO" || o.status === "PROFESSIONAL_REVIEW"
    );

    for (const ob of applicableObligations) {
      const code = ob.code.toUpperCase();
      if (code.includes("VAT")) slugSet.add("vat");
      if (code.includes("PAYE")) slugSet.add("paye");
      if (code.includes("RENTAL")) slugSet.add("rental-income-tax");
      if (code.includes("CIT") || code.includes("CORP")) slugSet.add("corporate-income-tax");
      if (code.includes("PRESUMPTIVE")) slugSet.add("presumptive-tax");
      if (code.includes("WHT") || code.includes("WITHHOLDING")) slugSet.add("withholding-tax");
    }

    const matched = Array.from(slugSet)
      .map((slug) => findTaxGuide(slug))
      .filter((g): g is NonNullable<typeof g> => Boolean(g));

    if (matched.length > 0) return matched;
    return TAX_GUIDES_DATA.slice(0, 3);
  }, [result.obligations]);

  const counts = Object.fromEntries(
    ORDER.map((s) => [s, result.obligations.filter((o) => o.status === s).length])
  ) as Record<ObligationStatus, number>;

  const handlePrint = () => {
    window.print();
  };

  return (
    <motion.div
      className="workspace-feature-page workspace-results-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        overflowX: "hidden",
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
          paddingBottom: 20,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 760 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(26, 123, 107, 0.1)",
              color: C.teal,
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: "0.72rem",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 8,
            }}
          >
            <Sparkles size={13} />
            <span>Know Your Taxes · Ruleset {result.ruleSetVersion}</span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "2rem",
              fontWeight: 900,
              color: C.navy,
              margin: "0 0 6px 0",
              lineHeight: 1.2,
            }}
          >
            Your Statutory Tax Obligations
          </h1>
          <p style={{ fontSize: "0.84rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
            {result.profileSummary.join(" · ")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {onEditAnswers && (
            <button
              type="button"
              onClick={onEditAnswers}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "#FFFFFF",
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 16px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: C.navy,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <ArrowLeft size={14} />
              <span>Edit answers</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePrint}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: C.navy,
              color: "#FFFFFF",
              border: "none",
              borderRadius: 8,
              padding: "9px 18px",
              fontSize: "0.82rem",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(15, 32, 68, 0.2)",
            }}
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      </header>

      {/* Verification Transparency Banner */}
      {result.unverifiedRuleCount > 0 && (
        <div
          style={{
            background: "#FFFBEB",
            borderRadius: 12,
            padding: "16px 20px",
            border: "1.5px solid #F59E0B",
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            boxShadow: "0 2px 8px rgba(245, 158, 11, 0.08)",
          }}
        >
          <AlertCircle size={20} style={{ color: "#D97706", flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: "0.82rem", color: "#92400E", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 800 }}>Estimates, not final confirmed liabilities.</span>{" "}
            {result.unverifiedRuleCount} parameter{result.unverifiedRuleCount === 1 ? "" : "s"} evaluated here are pending final gazette cross-verification against the 2026/27 amendment Acts. The VAT threshold (UGX 300,000,000) is enacted and verified.
          </div>
        </div>
      )}

      {/* 4 KPI Status Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: 14,
        }}
      >
        {ORDER.map((s) => (
          <div
            key={s}
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              padding: "18px 20px",
              border: `1px solid ${C.border}`,
              boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.76rem",
                fontWeight: 700,
                color: "#64748B",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: STATUS_CONFIG[s].dot,
                }}
              />
              <span>{STATUS_CONFIG[s].label}</span>
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "2.1rem",
                fontWeight: 900,
                color: C.navy,
                marginTop: 6,
                lineHeight: 1,
              }}
            >
              {counts[s]}
            </div>
          </div>
        ))}
      </div>

      {/* Main Section Split: Left (Obligations Accordion) & Right (Sidebar) */}
      <div className="kyt-responsive-grid">
        {/* Left Column: Obligations Accordion */}
        <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {ORDER.flatMap((s) => result.obligations.filter((o) => o.status === s)).map((o) => (
            <ObligationCard
              key={o.code}
              o={o}
              sources={sources}
              open={openCode === o.code}
              onToggle={() => setOpenCode(openCode === o.code ? null : o.code)}
              assessmentId={id}
            />
          ))}
        </div>

        {/* Right Column: Sticky Sidebar Panels */}
        <aside style={{ minWidth: 0, width: "100%", display: "flex", flexDirection: "column", gap: 16 }}>
          <SidebarPanel
            title="Upcoming Deadlines"
            icon={<Calendar size={14} style={{ color: C.teal }} />}
            items={result.upcomingDeadlines.map((d) => `${d.label}: ${d.text}`)}
          />

          <SidebarPanel
            title="Information Still Needed"
            icon={<Info size={14} style={{ color: C.gold }} />}
            items={result.missingInformation}
            empty="All required data was provided."
          />

          <SidebarPanel
            title="Recommended Next Steps"
            icon={<CheckCircle2 size={14} style={{ color: C.teal }} />}
            items={result.nextSteps}
          />
        </aside>
      </div>

      {/* READ UP ON YOUR TAXES - STATUTORY GUIDES INTEGRATION */}
      {onSelectGuide && (
        <section
          style={{
            marginTop: 28,
            padding: "24px 28px",
            background: "var(--color-white)",
            border: `1.5px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: "0 2px 8px rgba(15,32,68,0.03)",
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
                color: C.teal,
                background: "rgba(26, 123, 107, 0.1)",
                padding: "3px 8px",
                borderRadius: 6,
              }}
            >
              Next step
            </span>
            <span style={{ fontSize: "0.76rem", color: C.muted, fontWeight: 600 }}>
              Statutory Learning Hub
            </span>
          </div>

          <h2
            style={{
              margin: "0 0 6px",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: C.navy,
              letterSpacing: "-0.01em",
            }}
          >
            Read up on your taxes
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "0.88rem",
              color: C.muted,
              maxWidth: 680,
              lineHeight: 1.55,
            }}
          >
            Based on your assessment, these statutory taxes apply to your operations. Each guide covers statutory thresholds, rates, deadlines, worked ledger computations, and common audit pitfalls.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              marginBottom: 16,
            }}
          >
            {matchingGuides.map((guide) => (
              <div
                key={guide.slug}
                onClick={() => onSelectGuide(guide.slug)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr auto",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 18px",
                  background: "var(--color-offwhite)",
                  border: `1px solid ${C.border}`,
                  borderRadius: 10,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = C.teal;
                  e.currentTarget.style.background = "var(--color-white)";
                  e.currentTarget.style.transform = "translateX(4px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = C.border;
                  e.currentTarget.style.background = "var(--color-offwhite)";
                  e.currentTarget.style.transform = "translateX(0)";
                }}
              >
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.95rem",
                    fontWeight: 900,
                    color: C.teal,
                    letterSpacing: "0.06em",
                  }}
                >
                  {guide.short}
                </span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: "0.95rem", color: C.navy }}>
                    {guide.title}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: C.muted, marginTop: 2 }}>
                    {guide.keyFacts[0]?.label}: <strong>{guide.keyFacts[0]?.value}</strong> · Due: {guide.keyFacts[2]?.value}
                  </div>
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    color: C.teal,
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>Read guide</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            ))}
          </div>

          {onBrowseAllGuides && (
            <button
              type="button"
              onClick={onBrowseAllGuides}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "transparent",
                color: C.teal,
                fontWeight: 700,
                fontSize: "0.84rem",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
            >
              <BookOpen size={15} />
              <span>Browse all tax guides →</span>
            </button>
          )}
        </section>
      )}
    </motion.div>
  );
};

function SidebarPanel({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon?: React.ReactNode;
  items: string[];
  empty?: string;
}) {
  return (
    <section
      style={{
        background: "#FFFFFF",
        borderRadius: 12,
        padding: "18px 20px",
        border: `1px solid ${C.border}`,
        boxShadow: "0 2px 6px rgba(15, 32, 68, 0.02)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        {icon}
        <h3
          style={{
            fontSize: "0.76rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            color: C.navy,
            margin: 0,
          }}
        >
          {title}
        </h3>
      </div>
      {items.length ? (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((x, i) => (
            <li
              key={i}
              style={{
                fontSize: "0.78rem",
                color: "#374151",
                lineHeight: 1.45,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: C.teal,
                  marginTop: 6,
                  flexShrink: 0,
                }}
              />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0, fontStyle: "italic" }}>
          {empty || "None recorded."}
        </p>
      )}
    </section>
  );
}

function ObligationCard({
  o,
  sources,
  open,
  onToggle,
  assessmentId,
}: {
  o: Obligation;
  sources: Record<string, LegalSource>;
  open: boolean;
  onToggle: () => void;
  assessmentId: string;
}) {
  const st = STATUS_CONFIG[o.status];
  const muted = o.status === "NOT_APPLICABLE";

  return (
    <article
      style={{
        background: "#FFFFFF",
        borderRadius: 14,
        border: open ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
        boxShadow: open ? "0 6px 20px rgba(15, 32, 68, 0.08)" : "0 2px 6px rgba(15, 32, 68, 0.02)",
        transition: "all 0.18s ease",
        overflow: "hidden",
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "18px 22px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                background: st.bg,
                color: st.color,
                border: `1px solid ${st.border}`,
                padding: "2px 8px",
                borderRadius: 6,
                fontSize: "0.7rem",
                fontWeight: 800,
              }}
            >
              {st.icon}
              <span>{st.label}</span>
            </span>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>
              · {CATEGORY_LABEL[o.content.category]}
            </span>
          </div>

          <h3
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "1.15rem",
              fontWeight: 800,
              color: muted ? "#64748B" : C.navy,
              margin: "0 0 4px 0",
            }}
          >
            {o.content.name}
          </h3>
          <p
            style={{
              fontSize: "0.78rem",
              color: "#64748B",
              margin: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {o.content.plainDefinition}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          {o.estimate && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: C.gold,
                  letterSpacing: "0.04em",
                }}
              >
                Estimate
              </div>
              <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 800, color: C.navy }}>
                {UGX(o.estimate.amount)}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#64748B" }}>
                {o.estimate.period === "MONTHLY" ? "per month" : "per year"}
              </div>
            </div>
          )}

          <div style={{ color: "#64748B" }}>
            {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </button>

      {/* Expanded Accordion Body */}
      {open && (
        <div
          style={{
            padding: "20px 22px 24px",
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 18,
            fontSize: "0.82rem",
            color: "#374151",
          }}
        >
          {/* Plain definition callout */}
          <div
            style={{
              background: C.offwhite,
              borderRadius: 8,
              padding: "14px 16px",
              border: `1px solid ${C.border}`,
              lineHeight: 1.5,
              color: "#1F2937",
            }}
          >
            {o.content.plainDefinition}
          </div>

          {/* Why this applies */}
          <DetailSection title="Why this applies to your situation">
            <BulletList items={o.why} />
          </DetailSection>

          {!muted && (
            <DetailSection title="Statutory triggers">
              <BulletList items={o.content.triggers} />
            </DetailSection>
          )}

          {/* Rates and thresholds */}
          {o.rateSummary.length > 0 && (
            <DetailSection title={`Statutory Rates & Thresholds (Rule ${o.rule.version})`}>
              <BulletList items={o.rateSummary} />
            </DetailSection>
          )}

          {/* Worked calculation */}
          {o.estimate && (
            <DetailSection title="Worked Calculation With Your Numbers">
              <div
                style={{
                  background: "#FEF9EE",
                  borderLeft: "4px solid #C8922A",
                  borderRadius: 6,
                  padding: "12px 16px",
                  fontFamily: "monospace",
                  fontSize: "0.78rem",
                  lineHeight: 1.6,
                  color: C.navy,
                  overflowX: "auto",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              >
                {o.estimate.workings.map((w, i) => (
                  <div key={i}>{w}</div>
                ))}
              </div>
              <p style={{ fontSize: "0.72rem", color: "#B45309", fontWeight: 600, marginTop: 6 }}>
                Note: Estimate only, not a final assessed liability{o.estimate.indicativeOnly ? " (uses rates pending verification)" : ""}.
              </p>
            </DetailSection>
          )}

          {o.workedExample && (
            <DetailSection title="Statutory Worked Example">
              <BulletList items={o.workedExample} />
            </DetailSection>
          )}

          {o.missing.length > 0 && (
            <DetailSection title="Information Still Needed">
              <BulletList items={o.missing} />
            </DetailSection>
          )}

          {!muted && (
            <>
              <DetailSection title="Mandatory Records to Maintain">
                <BulletList items={o.content.records} />
              </DetailSection>
              <DetailSection title="Filing & Remittance Deadlines">
                <BulletList items={o.content.deadlines} />
              </DetailSection>
              <DetailSection title="Declaration & Payment Channels">
                <BulletList items={o.content.channel} />
              </DetailSection>
              {o.content.consequences.length > 0 && (
                <DetailSection title="Penalties for Non-Compliance">
                  <BulletList items={o.content.consequences.map((c) => c.text)} />
                </DetailSection>
              )}
              <DetailSection title="Actionable Next Steps">
                <BulletList items={o.content.nextSteps} />
              </DetailSection>
            </>
          )}

          {/* Legal Basis */}
          <DetailSection title="Authoritative Legal Basis">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 6 }}>
              {o.content.legalBasis.map((id) => {
                const src = sources[id];
                if (!src) return null;
                return (
                  <li key={id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem" }}>
                    <ExternalLink size={13} style={{ color: C.teal, flexShrink: 0 }} />
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: C.teal, fontWeight: 700, textDecoration: "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
                      onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
                    >
                      {src.title}
                      {src.section ? ` (${src.section})` : ""}
                    </a>
                    <span style={{ color: "#64748B" }}>— {src.publisher}</span>
                  </li>
                );
              })}
            </ul>
          </DetailSection>

          {/* Grounded Q&A Panel */}
          {!muted && <AskQuestionPanel assessmentId={assessmentId} code={o.code} />}
        </div>
      )}
    </article>
  );
}

function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4
        style={{
          fontSize: "0.72rem",
          fontWeight: 800,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#64748B",
          margin: "0 0 6px 0",
        }}
      >
        {title}
      </h4>
      {children}
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul
      style={{
        margin: 0,
        paddingLeft: 18,
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: "0.82rem",
        color: "#1F2937",
        lineHeight: 1.5,
      }}
    >
      {items.map((x, i) => (
        <li key={i}>{x}</li>
      ))}
    </ul>
  );
}

const SUGGESTED_QUESTIONS = [
  "Why do I have to pay this tax?",
  "How was this amount calculated?",
  "What documents do I need to keep?",
  "What happens if I miss the deadline?",
  "Are there exemptions available?",
];

function AskQuestionPanel({ assessmentId, code }: { assessmentId: string; code: string }) {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [thread, setThread] = useState<
    { q: string; a: string; grounded: boolean; citations: { id: string; title: string; url: string }[] }[]
  >([]);

  async function handleAsk(qText: string) {
    if (!qText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/know-your-taxes/assessments/${assessmentId}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ obligationCode: code, question: qText }),
      });
      const data = await res.json();
      setThread((prev) => [
        ...prev,
        res.ok
          ? {
              q: qText,
              a: data.answer,
              grounded: data.grounded,
              citations: data.citations || [],
            }
          : {
              q: qText,
              a: data.error || "Unable to retrieve statutory answer right now.",
              grounded: false,
              citations: [],
            },
      ]);
      setQuestion("");
    } catch {
      setThread((prev) => [
        ...prev,
        {
          q: qText,
          a: "Network error. Please try again.",
          grounded: false,
          citations: [],
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        background: C.offwhite,
        borderRadius: 12,
        padding: "18px 20px",
        border: `1px solid ${C.border}`,
        marginTop: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
        <MessageSquare size={16} style={{ color: C.teal }} />
        <h4 style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, margin: 0 }}>
          Ask TaxWise About This Obligation
        </h4>
      </div>
      <p style={{ fontSize: "0.76rem", color: "#64748B", margin: "0 0 12px 0" }}>
        Answers are verified and grounded strictly against Uganda Revenue Authority legislation and rule data.
      </p>

      {/* Suggested Question Chips */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {SUGGESTED_QUESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={busy}
            onClick={() => handleAsk(s)}
            style={{
              borderRadius: 99,
              border: `1px solid ${C.border}`,
              background: "#FFFFFF",
              padding: "4px 12px",
              fontSize: "0.72rem",
              fontWeight: 600,
              color: C.navy,
              cursor: "pointer",
              transition: "all 0.12s ease",
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
            {s}
          </button>
        ))}
      </div>

      {/* Chat Thread */}
      {thread.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          {thread.map((t, i) => (
            <div
              key={i}
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                padding: "14px 16px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 1px 4px rgba(15, 32, 68, 0.02)",
              }}
            >
              <div style={{ fontSize: "0.75rem", fontWeight: 800, color: C.teal, marginBottom: 4 }}>
                Q: {t.q}
              </div>
              <div style={{ fontSize: "0.82rem", color: C.navy, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                {t.a}
              </div>
              {!t.grounded && (
                <div
                  style={{
                    marginTop: 8,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "#B45309",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <AlertCircle size={13} />
                  <span>Recommendation: Confirm with a licensed tax practitioner or URA office.</span>
                </div>
              )}
              {t.citations.length > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 8,
                    borderTop: `1px solid ${C.border}`,
                    fontSize: "0.72rem",
                    color: "#64748B",
                  }}
                >
                  <span style={{ fontWeight: 700 }}>Sources cited: </span>
                  {t.citations.map((c, j) => (
                    <a
                      key={c.id}
                      href={c.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: C.teal, textDecoration: "underline", marginRight: 8 }}
                    >
                      {c.title}
                      {j < t.citations.length - 1 ? "; " : ""}
                    </a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Ask Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        style={{ display: "flex", gap: 8 }}
      >
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          maxLength={500}
          placeholder="Ask a specific question (e.g. how to register for TIN, filing deadline)..."
          style={{
            flex: 1,
            borderRadius: 8,
            border: `1.5px solid ${C.border}`,
            background: "#FFFFFF",
            padding: "10px 14px",
            fontSize: "0.82rem",
            color: C.navy,
            outline: "none",
          }}
        />
        <button
          type="submit"
          disabled={busy || !question.trim()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            background: C.navy,
            color: "#FFFFFF",
            border: "none",
            borderRadius: 8,
            padding: "10px 18px",
            fontSize: "0.82rem",
            fontWeight: 800,
            cursor: busy || !question.trim() ? "not-allowed" : "pointer",
            opacity: busy || !question.trim() ? 0.5 : 1,
          }}
        >
          {busy ? (
            <span>Thinking…</span>
          ) : (
            <>
              <span>Ask</span>
              <Send size={13} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

