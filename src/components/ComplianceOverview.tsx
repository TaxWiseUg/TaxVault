"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  X,
  ArrowRight,
  Plus,
  Search,
  Copy,
  Check,
  Filter,
} from "lucide-react";

export interface ClientScorecard {
  id: string;
  name: string;
  tin: string;
  sector: string;
  vatScore: number;
  vatRisk: "watch" | "low" | "act_now";
  trendPoints: number[];
  finalScore: number;
  finalRisk: "watch" | "low" | "act_now";
  openExposureUgx: number;
  highFindingsCount: number;
  status: "Needs attention" | "Compliant" | "Action required" | "Critical attention";
  lastReviewDate: string;
}

export interface StatutoryFinding {
  id: string;
  title: string;
  clientName: string;
  clientId: string;
  taxType: string;
  exposureUgx: number;
  severity: "high" | "medium" | "low";
  statutoryBasis: string;
  period: string;
  description: string;
  precedent: string;
  penaltyRisk: string;
  remediation: string;
}

const REFERENCE_CLIENTS: ClientScorecard[] = [
  {
    id: "ref-kato",
    name: "Kato Hardware Ltd",
    tin: "1002948192",
    sector: "General Retail & Building Supplies",
    vatScore: 52,
    vatRisk: "watch",
    trendPoints: [68, 65, 61, 56, 52],
    finalScore: 78,
    finalRisk: "low",
    openExposureUgx: 17250000,
    highFindingsCount: 3,
    status: "Action required",
    lastReviewDate: "2026-06-15",
  },
  {
    id: "ref-mbarara",
    name: "Mbarara Agro Processors Ltd",
    tin: "1008472910",
    sector: "Agricultural Value Addition & Export",
    vatScore: 88,
    vatRisk: "low",
    trendPoints: [72, 76, 80, 84, 88],
    finalScore: 91,
    finalRisk: "low",
    openExposureUgx: 0,
    highFindingsCount: 0,
    status: "Compliant",
    lastReviewDate: "2026-06-10",
  },
  {
    id: "ref-lira",
    name: "Lira Pharmacy Ltd",
    tin: "1014920481",
    sector: "Pharmaceutical Wholesale & Retail",
    vatScore: 41,
    vatRisk: "act_now",
    trendPoints: [58, 52, 49, 44, 41],
    finalScore: 54,
    finalRisk: "watch",
    openExposureUgx: 23212000,
    highFindingsCount: 3,
    status: "Critical attention",
    lastReviewDate: "2026-05-30",
  },
];

const REFERENCE_FINDINGS: StatutoryFinding[] = [
  {
    id: "f-efris-1",
    title: "Unreconciled EFRIS vs VAT sales output discrepancy",
    clientName: "Kato Hardware Ltd",
    clientId: "ref-kato",
    taxType: "VAT / EFRIS",
    exposureUgx: 18240000,
    severity: "high",
    statutoryBasis: "Section 73A VAT Act Cap 349 & EFRIS Regulations 2020",
    period: "June 2026",
    description:
      "Monthly VAT return declares UGX 142,500,000 in gross standard-rated supplies, while fiscal receipts transmitted to URA EFRIS portal total UGX 124,260,000. An unexplained variance of UGX 18,240,000 output tax exposes the entity to immediate reassessment.",
    precedent:
      "Tax Appeals Tribunal Application No. 42 of 2022 (Steel Rolling Mills v URA) - Failure to transmit sales through fiscal devices permits the Commissioner to raise an estimated assessment without prior notice.",
    penaltyRisk:
      "Section 86 Tax Procedures Code Act (TPCA 2014): 2% per month compounding statutory interest on unpaid tax, plus Section 65 penal tax of up to 100% of the tax shortfall for false or misleading statements.",
    remediation:
      "1. Reconcile offline/queue fiscal device receipts with the URA server.\n2. Verify voided and credit note records for proper fiscal issuance.\n3. If genuine discrepancy exists, submit a voluntary disclosure under Section 66 TPCA to seek 100% interest and penal tax waiver before URA issues an audit letter.",
  },
  {
    id: "f-wht-1",
    title: "Withholding Tax (WHT) non-deduction on professional & technical fees",
    clientName: "Lira Pharmacy Ltd",
    clientId: "ref-lira",
    taxType: "Withholding Tax",
    exposureUgx: 12450000,
    severity: "high",
    statutoryBasis: "Section 117 Income Tax Act",
    period: "May 2026",
    description:
      "Audit trail indicates management consultancy, ERP software integration, and legal retainers totaling UGX 207,500,000 were settled without deducting the mandatory 6% resident WHT.",
    precedent:
      "Uganda Telecom Ltd v URA [2016] UGCommC 14 - Statutory obligation of a withholding agent is absolute and non-negotiable; failure to withhold makes the agent personally liable.",
    penaltyRisk:
      "Under Section 123 Income Tax Act, the withholding agent is personally liable to pay the full tax not withheld plus statutory penal interest of 2% per month.",
    remediation:
      "1. Check if service providers held valid URA WHT exemption certificates for the 2025/2026 tax year.\n2. Where exempt certificates are absent, recover the 6% deduction from subsequent invoices or remit principal directly to URA under statutory voluntary disclosure.",
  },
  {
    id: "f-paye-1",
    title: "PAYE vs NSSF payroll variance & unregistered casual wages",
    clientName: "Kato Hardware Ltd",
    clientId: "ref-kato",
    taxType: "PAYE / NSSF",
    exposureUgx: 9772000,
    severity: "high",
    statutoryBasis: "Section 116 Income Tax Act & NSSF Act",
    period: "June 2026",
    description:
      "Wages paid to 14 warehouse offloading and logistics workers were classified as informal casual expenses without TIN registration, PAYE deduction, or NSSF contribution (10% employer + 5% employee).",
    precedent:
      "Mukwano Enterprises Ltd v URA TAT Appeal No. 18 of 2018 - Individuals engaged on regular recurring tasks within core business premises constitute employees under tax law regardless of label.",
    penaltyRisk:
      "Section 116(5) ITA statutory interest of 2% per month; NSSF Act Section 14 penalty of 10% per month on delayed social security remittances.",
    remediation:
      "1. Enrol casual staff for URA TINs and NSSF numbers.\n2. Standardize payroll through URA Form 5 and reconcile monthly NSSF return.\n3. Settle payroll tax liability before fiscal year-end closing.",
  },
];

const fmtUGX = (n: number) => {
  return "UGX " + Math.round(n).toLocaleString("en-UG");
};

// Trend Sparkline SVG Component
const SparklineTrend: React.FC<{ points: number[]; risk: "watch" | "low" | "act_now" }> = ({
  points,
  risk,
}) => {
  const width = 84;
  const height = 24;
  const min = Math.min(...points) - 5;
  const max = Math.max(...points) + 5;
  const range = max - min || 1;

  const strokeColor =
    risk === "low"
      ? "var(--cx-emerald, #0E7C5A)"
      : risk === "watch"
      ? "var(--cx-amber, #A96A0B)"
      : "var(--cx-brick, #A23F2C)";

  const coords = points.map((p, idx) => {
    const x = (idx / (points.length - 1)) * (width - 8) + 4;
    const y = height - 4 - ((p - min) / range) * (height - 8);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${coords.join(" L ")}`;
  const lastCoord = coords[coords.length - 1].split(",");
  const lastX = parseFloat(lastCoord[0]);
  const lastY = parseFloat(lastCoord[1]);

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={lastX} cy={lastY} r="3" fill={strokeColor} />
      </svg>
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          fontFamily: "var(--font-mono, monospace)",
          color: strokeColor,
        }}
      >
        {points[points.length - 1]}%
      </span>
    </div>
  );
};

// Risk Tag Component
const RiskBadge: React.FC<{ risk: "watch" | "low" | "act_now" }> = ({ risk }) => {
  if (risk === "low") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: "0.72rem",
          fontWeight: 700,
          background: "var(--cx-emerald-soft, #E4F1EA)",
          color: "var(--cx-emerald, #0E7C5A)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--cx-emerald, #0E7C5A)",
          }}
        />
        Low risk
      </span>
    );
  }
  if (risk === "watch") {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 6,
          fontSize: "0.72rem",
          fontWeight: 700,
          background: "var(--cx-amber-soft, #F6EBD8)",
          color: "var(--cx-amber, #A96A0B)",
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--cx-amber, #A96A0B)",
          }}
        />
        Watch
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 6,
        fontSize: "0.72rem",
        fontWeight: 700,
        background: "var(--cx-brick-soft, #F5E4DF)",
        color: "var(--cx-brick, #A23F2C)",
        letterSpacing: "0.02em",
        textTransform: "uppercase",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "var(--cx-brick, #A23F2C)",
        }}
      />
      Act now
    </span>
  );
};

interface ComplianceOverviewProps {
  user: {
    id: string;
    full_name?: string;
  };
  onOpenClientReview: (client: ClientScorecard) => void;
  onNewReview: () => void;
}

export const ComplianceOverview: React.FC<ComplianceOverviewProps> = ({
  user,
  onOpenClientReview,
  onNewReview,
}) => {
  const [showExampleData, setShowExampleData] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState<StatutoryFinding | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<"all" | "act_now" | "watch" | "low" | "has_exposure">("all");
  const [copiedCitation, setCopiedCitation] = useState(false);

  const handleCopyCitation = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCitation(true);
    setTimeout(() => setCopiedCitation(false), 2000);
  };

  const sourceClients = showExampleData ? REFERENCE_CLIENTS : [];
  const sourceFindings = showExampleData ? REFERENCE_FINDINGS : [];

  const clients = sourceClients.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.tin.includes(q) ||
      c.sector.toLowerCase().includes(q);
    if (!matchesSearch) return false;
    if (riskFilter === "act_now") {
      return (
        c.vatRisk === "act_now" ||
        c.finalRisk === "act_now" ||
        c.status.toLowerCase().includes("action") ||
        c.status.toLowerCase().includes("critical")
      );
    }
    if (riskFilter === "watch") {
      return (
        c.vatRisk === "watch" ||
        c.finalRisk === "watch" ||
        c.status.toLowerCase().includes("attention")
      );
    }
    if (riskFilter === "low") {
      return c.vatRisk === "low" && c.finalRisk === "low";
    }
    if (riskFilter === "has_exposure") {
      return c.openExposureUgx > 0;
    }
    return true;
  });

  // Dynamically compute executive KPI figures
  const avgScore =
    sourceClients.length > 0
      ? Math.round(
          sourceClients.reduce((acc, c) => acc + (c.vatScore + c.finalScore) / 2, 0) /
            sourceClients.length
        )
      : 0;
  const totalExposure = sourceClients.reduce((acc, c) => acc + c.openExposureUgx, 0);
  const highFindingsCount = sourceClients.reduce((acc, c) => acc + c.highFindingsCount, 0);
  const clientsToActCount = sourceClients.filter(
    (c) =>
      c.vatRisk === "act_now" ||
      c.finalRisk === "act_now" ||
      c.highFindingsCount > 0
  ).length;

  return (
    <div
      style={{
        width: "100%",
        color: "var(--cx-ink, #101E30)",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ── Top Header Section ── */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "flex-end",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <div>
          <div
            style={{
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--cx-emerald, #0E7C5A)",
              fontFamily: "var(--font-mono, monospace)",
              marginBottom: 6,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>DASHBOARD</span>
            <span style={{ opacity: 0.5 }}>•</span>
            <span>
              {new Date().toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).toUpperCase()}
            </span>
          </div>

          <h1
            style={{
              fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
              fontSize: "2.15rem",
              fontWeight: 800,
              color: "var(--cx-ink, #101E30)",
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Compliance overview
          </h1>

          <p
            style={{
              fontSize: "0.92rem",
              color: "var(--cx-ink-soft, #4C5C68)",
              marginTop: 6,
              marginBottom: 0,
            }}
          >
            Portfolio compliance health across your clients
            {user?.full_name ? ` • Lead: ${user.full_name}` : ""}
          </p>
        </div>

        {/* Right Header Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            type="button"
            onClick={() => setShowExampleData(!showExampleData)}
            title="Toggle reference demo portfolio on or off"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 14px",
              borderRadius: 8,
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
              background: showExampleData
                ? "var(--cx-surface, #FFFFFF)"
                : "transparent",
              color: "var(--cx-ink, #101E30)",
              border: "1px solid var(--cx-line, #DADFD6)",
              boxShadow: showExampleData ? "0 1px 3px rgba(16, 30, 48, 0.05)" : "none",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: showExampleData
                  ? "var(--cx-emerald, #0E7C5A)"
                  : "var(--cx-ink-faint, #8B98A0)",
              }}
            />
            <span>Example data {showExampleData ? "(On)" : "(Off)"}</span>
          </button>

          <button
            type="button"
            onClick={onNewReview}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 16px",
              borderRadius: 8,
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              background: "var(--color-navy, #0F2044)",
              color: "#FFFFFF",
              border: "none",
              boxShadow: "0 2px 8px rgba(15, 32, 68, 0.2)",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-1px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(15, 32, 68, 0.25)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 2px 8px rgba(15, 32, 68, 0.2)";
            }}
          >
            <Plus size={15} />
            <span>New review</span>
          </button>
        </div>
      </div>

      {/* ── 4 Executive KPI Metric Cards (Interactive Filters) ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {/* Card 1: Average Compliance Score */}
        <div
          onClick={() => setRiskFilter("all")}
          title="Click to view all clients"
          style={{
            background: "var(--cx-surface, #FFFFFF)",
            border: `1.5px solid ${riskFilter === "all" ? "var(--cx-emerald, #0E7C5A)" : "var(--cx-line, #DADFD6)"}`,
            borderRadius: 12,
            padding: "20px",
            boxShadow: riskFilter === "all" ? "0 4px 14px rgba(14, 124, 90, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 30, 48, 0.08)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = riskFilter === "all" ? "0 4px 14px rgba(14, 124, 90, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)";
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--cx-ink-soft, #4C5C68)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Average Compliance Score</span>
              {riskFilter === "all" && (
                <span style={{ fontSize: "0.68rem", color: "var(--cx-emerald, #0E7C5A)", fontWeight: 800 }}>ACTIVE</span>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  color: "var(--cx-ink, #101E30)",
                  fontFamily: "var(--font-mono, monospace)",
                }}
              >
                {avgScore}
              </span>
              <span
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: "var(--cx-ink-faint, #8B98A0)",
                }}
              >
                / 100
              </span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: avgScore >= 80 ? "var(--cx-emerald, #0E7C5A)" : "var(--cx-amber, #A96A0B)",
                background: avgScore >= 80 ? "var(--cx-emerald-soft, #E4F1EA)" : "var(--cx-amber-soft, #F6EBD8)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              {avgScore >= 80 ? "Compliant range" : avgScore > 0 ? "Needs attention" : "No active clients"}
            </span>
            <span style={{ fontSize: "0.74rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              Across {sourceClients.length} {sourceClients.length === 1 ? "client" : "clients"}
            </span>
          </div>
        </div>

        {/* Card 2: Open Tax Exposure */}
        <div
          onClick={() => setRiskFilter(riskFilter === "has_exposure" ? "all" : "has_exposure")}
          title="Click to filter clients with open tax exposure"
          style={{
            background: "var(--cx-surface, #FFFFFF)",
            border: `1.5px solid ${riskFilter === "has_exposure" ? "var(--cx-brick, #A23F2C)" : "var(--cx-line, #DADFD6)"}`,
            borderRadius: 12,
            padding: "20px",
            boxShadow: riskFilter === "has_exposure" ? "0 4px 14px rgba(162, 63, 44, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 30, 48, 0.08)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = riskFilter === "has_exposure" ? "0 4px 14px rgba(162, 63, 44, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)";
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--cx-ink-soft, #4C5C68)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Open Tax Exposure</span>
              {riskFilter === "has_exposure" && (
                <span style={{ fontSize: "0.68rem", color: "var(--cx-brick, #A23F2C)", fontWeight: 800 }}>FILTERED</span>
              )}
            </div>
            <div
              style={{
                fontSize: "1.5rem",
                fontWeight: 800,
                color: totalExposure > 0 ? "var(--cx-brick, #A23F2C)" : "var(--cx-emerald, #0E7C5A)",
                fontFamily: "var(--font-mono, monospace)",
                letterSpacing: "-0.01em",
                marginBottom: 8,
              }}
            >
              {fmtUGX(totalExposure)}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--cx-brick, #A23F2C)",
                background: "var(--cx-brick-soft, #F5E4DF)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              Principal + Penalties
            </span>
            <span style={{ fontSize: "0.74rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              {sourceClients.filter(c => c.openExposureUgx > 0).length} unhedged entities
            </span>
          </div>
        </div>

        {/* Card 3: High-Severity Findings */}
        <div
          onClick={() => {
            const el = document.getElementById("largest-findings");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          title="Click to jump to Largest Open Findings"
          style={{
            background: "var(--cx-surface, #FFFFFF)",
            border: "1px solid var(--cx-line, #DADFD6)",
            borderRadius: 12,
            padding: "20px",
            boxShadow: "0 2px 8px rgba(16, 30, 48, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 30, 48, 0.08)";
            e.currentTarget.style.borderColor = "var(--cx-brick, #A23F2C)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 30, 48, 0.03)";
            e.currentTarget.style.borderColor = "var(--cx-line, #DADFD6)";
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--cx-ink-soft, #4C5C68)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>High-Severity Findings</span>
              <span style={{ fontSize: "0.68rem", color: "var(--cx-ink-faint, #8B98A0)" }}>VIEW ↓</span>
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--cx-ink, #101E30)",
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: 8,
              }}
            >
              {highFindingsCount}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--cx-brick, #A23F2C)",
                background: "var(--cx-brick-soft, #F5E4DF)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              Immediate audit risk
            </span>
            <span style={{ fontSize: "0.74rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              URA Section 86
            </span>
          </div>
        </div>

        {/* Card 4: Clients to Act On */}
        <div
          onClick={() => setRiskFilter(riskFilter === "act_now" ? "all" : "act_now")}
          title="Click to filter clients requiring immediate action"
          style={{
            background: "var(--cx-surface, #FFFFFF)",
            border: `1.5px solid ${riskFilter === "act_now" ? "var(--cx-amber, #A96A0B)" : "var(--cx-line, #DADFD6)"}`,
            borderRadius: 12,
            padding: "20px",
            boxShadow: riskFilter === "act_now" ? "0 4px 14px rgba(169, 106, 11, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 30, 48, 0.08)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = riskFilter === "act_now" ? "0 4px 14px rgba(169, 106, 11, 0.12)" : "0 2px 8px rgba(16, 30, 48, 0.03)";
          }}
        >
          <div>
            <div
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--cx-ink-soft, #4C5C68)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                marginBottom: 8,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Clients to Act On</span>
              {riskFilter === "act_now" && (
                <span style={{ fontSize: "0.68rem", color: "var(--cx-amber, #A96A0B)", fontWeight: 800 }}>FILTERED</span>
              )}
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                color: "var(--cx-ink, #101E30)",
                fontFamily: "var(--font-mono, monospace)",
                marginBottom: 8,
              }}
            >
              {clientsToActCount}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "var(--cx-amber, #A96A0B)",
                background: "var(--cx-amber-soft, #F6EBD8)",
                padding: "2px 7px",
                borderRadius: 4,
              }}
            >
              Action required
            </span>
            <span style={{ fontSize: "0.74rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              Within 15 days
            </span>
          </div>
        </div>
      </div>

      {/* ── Section: Compliance scores by client ── */}
      <div
        style={{
          background: "var(--cx-surface, #FFFFFF)",
          border: "1px solid var(--cx-line, #DADFD6)",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(16, 30, 48, 0.03)",
          marginBottom: 36,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid var(--cx-line, #DADFD6)",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--cx-ink, #101E30)",
                margin: 0,
              }}
            >
              Compliance scores by client
            </h2>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--cx-ink-soft, #4C5C68)",
                margin: "4px 0 0",
              }}
            >
              Real-time scores calculated from statutory filings, EFRIS reconciliations, and payroll returns
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Risk Filter Pills */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Filter size={13} style={{ color: "var(--cx-ink-soft, #4C5C68)" }} />
              {([
                { key: "all", label: "All", color: "var(--cx-ink, #101E30)" },
                { key: "act_now", label: "Act now", color: "var(--cx-brick, #A23F2C)" },
                { key: "watch", label: "Watch", color: "var(--cx-amber, #A96A0B)" },
                { key: "low", label: "Low risk", color: "var(--cx-emerald, #0E7C5A)" },
              ] as const).map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setRiskFilter(f.key)}
                  style={{
                    padding: "3px 9px",
                    borderRadius: 6,
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    border: `1px solid ${riskFilter === f.key ? f.color : "var(--cx-line, #DADFD6)"}`,
                    background: riskFilter === f.key ? `${f.color}15` : "transparent",
                    color: riskFilter === f.key ? f.color : "var(--cx-ink-soft, #4C5C68)",
                    transition: "all 0.12s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 8,
                background: "var(--cx-bg, #F3F5F1)",
                border: "1px solid var(--cx-line, #DADFD6)",
                fontSize: "0.8rem",
              }}
            >
              <Search size={14} style={{ color: "var(--cx-ink-soft, #4C5C68)" }} />
              <input
                type="text"
                placeholder="Filter clients or TIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "var(--cx-ink, #101E30)",
                  fontSize: "0.8rem",
                  width: 140,
                }}
              />
            </div>

            <button
              type="button"
              onClick={onNewReview}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: "0.78rem",
                fontWeight: 700,
                cursor: "pointer",
                background: "var(--cx-bg, #F3F5F1)",
                color: "var(--cx-ink, #101E30)",
                border: "1px solid var(--cx-line, #DADFD6)",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.borderColor = "var(--cx-emerald, #0E7C5A)";
                e.currentTarget.style.color = "var(--cx-emerald, #0E7C5A)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.borderColor = "var(--cx-line, #DADFD6)";
                e.currentTarget.style.color = "var(--cx-ink, #101E30)";
              }}
            >
              <Plus size={14} />
              <span>New review</span>
            </button>
          </div>
        </div>

        {/* Client Table */}
        <div style={{ overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
              fontSize: "0.84rem",
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--cx-line, #DADFD6)",
                  background: "var(--cx-bg, #F3F5F1)",
                }}
              >
                <th
                  style={{
                    padding: "12px 24px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Client
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  VAT Review
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Trend
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Final Return
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Open Exposure
                </th>
                <th
                  style={{
                    padding: "12px 20px",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  High Findings
                </th>
                <th
                  style={{
                    padding: "12px 24px",
                    textAlign: "right",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "40px 24px", textAlign: "center" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>🔍</div>
                    <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--cx-ink, #101E30)", marginBottom: 4 }}>
                      {showExampleData ? "No clients match the current filter" : "No client data loaded"}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
                      {showExampleData
                        ? `Try clearing the "${riskFilter !== "all" ? riskFilter.replace("_", " ") : ""}" filter or search term`
                        : "Enable \"Example data\" to explore the reference portfolio, or click \"New review\" to add a real client"}
                    </div>
                    {!showExampleData && (
                      <button
                        type="button"
                        onClick={onNewReview}
                        style={{
                          marginTop: 16,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 7,
                          padding: "8px 18px",
                          borderRadius: 8,
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          background: "var(--color-navy, #0F2044)",
                          color: "#FFFFFF",
                          border: "none",
                        }}
                      >
                        <Plus size={14} />
                        <span>New review</span>
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                clients.map((client, idx) => (
                  <tr
                    key={client.id}
                    onClick={() => onOpenClientReview(client)}
                    style={{
                      borderBottom:
                        idx === clients.length - 1
                          ? "none"
                          : "1px solid var(--cx-line, #DADFD6)",
                      transition: "background 0.15s ease",
                      cursor: "pointer",
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = "var(--cx-bg, #F3F5F1)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    {/* Client Info */}
                    <td style={{ padding: "16px 24px" }}>
                      <div style={{ fontWeight: 700, color: "var(--cx-ink, #101E30)", fontSize: "0.9rem" }}>
                        {client.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.74rem",
                          color: "var(--cx-ink-faint, #8B98A0)",
                          fontFamily: "var(--font-mono, monospace)",
                          marginTop: 2,
                        }}
                      >
                        TIN {client.tin} • {client.sector}
                      </div>
                    </td>

                    {/* VAT Review */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono, monospace)",
                            color: "var(--cx-ink, #101E30)",
                          }}
                        >
                          {client.vatScore}%
                        </span>
                        <RiskBadge risk={client.vatRisk} />
                      </div>
                    </td>

                    {/* Trend Sparkline */}
                    <td style={{ padding: "16px 20px" }}>
                      <SparklineTrend points={client.trendPoints} risk={client.vatRisk} />
                    </td>

                    {/* Final Return */}
                    <td style={{ padding: "16px 20px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            fontFamily: "var(--font-mono, monospace)",
                            color: "var(--cx-ink, #101E30)",
                          }}
                        >
                          {client.finalScore}%
                        </span>
                        <RiskBadge risk={client.finalRisk} />
                      </div>
                    </td>

                    {/* Open Exposure */}
                    <td style={{ padding: "16px 20px" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: "var(--font-mono, monospace)",
                          color:
                            client.openExposureUgx > 0
                              ? "var(--cx-brick, #A23F2C)"
                              : "var(--cx-emerald, #0E7C5A)",
                        }}
                      >
                        {client.openExposureUgx > 0
                          ? fmtUGX(client.openExposureUgx)
                          : "UGX 0"}
                      </span>
                    </td>

                    {/* High Findings */}
                    <td style={{ padding: "16px 20px" }}>
                      {client.highFindingsCount > 0 ? (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: "var(--cx-brick, #A23F2C)",
                          }}
                        >
                          <ShieldAlert size={14} />
                          <span>{client.highFindingsCount} high</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: "var(--cx-emerald, #0E7C5A)",
                          }}
                        >
                          <CheckCircle2 size={14} />
                          <span>0 high</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td style={{ padding: "16px 24px", textAlign: "right" }}>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onOpenClientReview(client); }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6,
                          padding: "6px 14px",
                          borderRadius: 6,
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          background: "var(--cx-bg, #F3F5F1)",
                          color: "var(--cx-ink, #101E30)",
                          border: "1px solid var(--cx-line, #DADFD6)",
                          transition: "all 0.15s ease",
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = "var(--color-navy, #0F2044)";
                          e.currentTarget.style.color = "#FFFFFF";
                          e.currentTarget.style.borderColor = "var(--color-navy, #0F2044)";
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = "var(--cx-bg, #F3F5F1)";
                          e.currentTarget.style.color = "var(--cx-ink, #101E30)";
                          e.currentTarget.style.borderColor = "var(--cx-line, #DADFD6)";
                        }}
                      >
                        <span>Open</span>
                        <ChevronRight size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section: Largest open findings ── */}
      <div id="largest-findings" style={{ marginBottom: 40, scrollMarginTop: 80 }}>
        <div style={{ marginBottom: 18 }}>
          <h2
            style={{
              fontFamily: "'Playfair Display', 'Fraunces', Georgia, serif",
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "var(--cx-ink, #101E30)",
              margin: 0,
            }}
          >
            Largest open findings
          </h2>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--cx-ink-soft, #4C5C68)",
              margin: "4px 0 0",
            }}
          >
            Prioritized tax exposures requiring practitioner resolution or voluntary disclosure
          </p>
        </div>

        {sourceFindings.length === 0 ? (
          <div
            style={{
              padding: "40px 24px",
              textAlign: "center",
              background: "var(--cx-surface, #FFFFFF)",
              border: "1px solid var(--cx-line, #DADFD6)",
              borderRadius: 12,
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: 8 }}>✅</div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--cx-ink, #101E30)", marginBottom: 4 }}>
              No open findings to display
            </div>
            <div style={{ fontSize: "0.8rem", color: "var(--cx-ink-soft, #4C5C68)" }}>
              Enable example data to explore reference statutory findings, or run a new AI audit review
            </div>
          </div>
        ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: 18,
          }}
        >
          {sourceFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => setSelectedFinding(finding)}
              style={{
                background: "var(--cx-surface, #FFFFFF)",
                border: "1px solid var(--cx-line, #DADFD6)",
                borderRadius: 12,
                padding: "22px",
                boxShadow: "0 2px 8px rgba(16, 30, 48, 0.03)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                position: "relative",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 6px 16px rgba(16, 30, 48, 0.08)";
                e.currentTarget.style.borderColor = "var(--cx-emerald, #0E7C5A)";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 8px rgba(16, 30, 48, 0.03)";
                e.currentTarget.style.borderColor = "var(--cx-line, #DADFD6)";
              }}
            >
              <div>
                {/* Card Top: Entity & Severity */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--cx-ink-soft, #4C5C68)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {finding.clientName}
                  </span>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "2px 7px",
                      borderRadius: 4,
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      background: "var(--cx-brick-soft, #F5E4DF)",
                      color: "var(--cx-brick, #A23F2C)",
                      textTransform: "uppercase",
                    }}
                  >
                    High Risk
                  </span>
                </div>

                {/* Finding Title */}
                <h3
                  style={{
                    fontSize: "0.98rem",
                    fontWeight: 700,
                    color: "var(--cx-ink, #101E30)",
                    lineHeight: 1.35,
                    marginBottom: 10,
                  }}
                >
                  {finding.title}
                </h3>

                {/* Exposure Amount */}
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      color: "var(--cx-ink-faint, #8B98A0)",
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    Assessed Exposure
                  </div>
                  <div
                    style={{
                      fontSize: "1.35rem",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono, monospace)",
                      color: "var(--cx-brick, #A23F2C)",
                    }}
                  >
                    {fmtUGX(finding.exposureUgx)}
                  </div>
                </div>

                {/* Statutory Basis Quote */}
                <div
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    background: "var(--cx-bg, #F3F5F1)",
                    borderLeft: "3px solid var(--cx-amber, #A96A0B)",
                    padding: "8px 10px",
                    borderRadius: "0 6px 6px 0",
                    marginBottom: 18,
                    lineHeight: 1.4,
                  }}
                >
                  <strong>Statutory Basis:</strong> {finding.statutoryBasis}
                </div>
              </div>

              {/* Card Footer: View Button */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 14,
                  borderTop: "1px solid var(--cx-line, #DADFD6)",
                }}
              >
                <span
                  style={{
                    fontSize: "0.74rem",
                    color: "var(--cx-ink-faint, #8B98A0)",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {finding.period} • {finding.taxType}
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFinding(finding);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "6px 12px",
                    borderRadius: 6,
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--cx-emerald, #0E7C5A)",
                    border: "1px solid var(--cx-line, #DADFD6)",
                    transition: "all 0.15s ease",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = "var(--cx-emerald-soft, #E4F1EA)";
                    e.currentTarget.style.borderColor = "var(--cx-emerald, #0E7C5A)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.borderColor = "var(--cx-line, #DADFD6)";
                  }}
                >
                  <span>View</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>

      {/* ── Finding Inspection Modal Drawer ── */}
      <AnimatePresence>
        {selectedFinding && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedFinding(null)}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(16, 30, 48, 0.45)",
                backdropFilter: "blur(4px)",
              }}
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 680,
                maxHeight: "90vh",
                overflowY: "auto",
                background: "var(--cx-surface, #FFFFFF)",
                border: "1px solid var(--cx-line, #DADFD6)",
                borderRadius: 14,
                boxShadow: "0 20px 40px rgba(16, 30, 48, 0.15)",
                padding: "28px",
                zIndex: 1000,
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 16,
                  borderBottom: "1px solid var(--cx-line, #DADFD6)",
                  paddingBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      color: "var(--cx-emerald, #0E7C5A)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    {selectedFinding.clientName} • {selectedFinding.period}
                  </div>
                  <h3
                    style={{
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: "1.35rem",
                      fontWeight: 800,
                      color: "var(--cx-ink, #101E30)",
                      lineHeight: 1.25,
                      margin: 0,
                    }}
                  >
                    {selectedFinding.title}
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedFinding(null)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--cx-ink-soft, #4C5C68)",
                    padding: 4,
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Assessed Exposure Banner */}
              <div
                style={{
                  background: "var(--cx-brick-soft, #F5E4DF)",
                  border: "1px solid var(--cx-brick, #A23F2C)22",
                  borderRadius: 10,
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 20,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      color: "var(--cx-brick, #A23F2C)",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Quantified Tax Shortfall
                  </div>
                  <div
                    style={{
                      fontSize: "1.65rem",
                      fontWeight: 800,
                      fontFamily: "var(--font-mono, monospace)",
                      color: "var(--cx-brick, #A23F2C)",
                    }}
                  >
                    {fmtUGX(selectedFinding.exposureUgx)}
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: 6,
                    background: "var(--cx-brick, #A23F2C)",
                    color: "#FFFFFF",
                    textTransform: "uppercase",
                  }}
                >
                  High Priority
                </span>
              </div>

              {/* Description */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  Factual Context & Audit Discrepancy
                </div>
                <p
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--cx-ink, #101E30)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {selectedFinding.description}
                </p>
              </div>

              {/* Statutory Ground */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color: "var(--cx-ink-soft, #4C5C68)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Legislation &amp; Governing Provision
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyCitation(selectedFinding.statutoryBasis)}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      padding: "3px 8px",
                      borderRadius: 4,
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      background: copiedCitation ? "var(--cx-emerald-soft, #E4F1EA)" : "var(--cx-bg, #F3F5F1)",
                      color: copiedCitation ? "var(--cx-emerald, #0E7C5A)" : "var(--cx-ink-soft, #4C5C68)",
                      border: "1px solid var(--cx-line, #DADFD6)",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {copiedCitation ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedCitation ? "Copied" : "Copy citation"}</span>
                  </button>
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--cx-ink, #101E30)",
                    background: "var(--cx-bg, #F3F5F1)",
                    borderLeft: "3px solid var(--cx-emerald, #0E7C5A)",
                    padding: "10px 14px",
                    borderRadius: "0 6px 6px 0",
                    fontFamily: "var(--font-mono, monospace)",
                  }}
                >
                  {selectedFinding.statutoryBasis}
                </div>
              </div>

              {/* Case Precedent */}
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  Tax Appeals Tribunal (TAT) Precedent
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--cx-ink, #101E30)",
                    background: "var(--cx-bg, #F3F5F1)",
                    borderLeft: "3px solid var(--color-navy, #0F2044)",
                    padding: "10px 14px",
                    borderRadius: "0 6px 6px 0",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                  }}
                >
                  {selectedFinding.precedent}
                </div>
              </div>

              {/* Penalty Risk under TPCA */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  Statutory Interest & Penalties
                </div>
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--cx-brick, #A23F2C)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {selectedFinding.penaltyRisk}
                </p>
              </div>

              {/* Action Plan */}
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--cx-ink-soft, #4C5C68)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    marginBottom: 6,
                  }}
                >
                  Recommended Remediation Action
                </div>
                <div
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--cx-ink, #101E30)",
                    whiteSpace: "pre-line",
                    lineHeight: 1.55,
                    background: "var(--cx-bg, #F3F5F1)",
                    padding: "12px 14px",
                    borderRadius: 8,
                  }}
                >
                  {selectedFinding.remediation}
                </div>
              </div>

              {/* Modal Buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 12,
                  borderTop: "1px solid var(--cx-line, #DADFD6)",
                  paddingTop: 16,
                }}
              >
                <button
                  type="button"
                  onClick={() => setSelectedFinding(null)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    background: "transparent",
                    color: "var(--cx-ink, #101E30)",
                    border: "1px solid var(--cx-line, #DADFD6)",
                  }}
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const client = REFERENCE_CLIENTS.find(
                      (c) => c.id === selectedFinding.clientId
                    ) || REFERENCE_CLIENTS[0];
                    setSelectedFinding(null);
                    onOpenClientReview(client);
                  }}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "8px 18px",
                    borderRadius: 8,
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    background: "var(--cx-emerald, #0E7C5A)",
                    color: "#FFFFFF",
                    border: "none",
                  }}
                >
                  <span>Open in Audit Workspace</span>
                  <ExternalLink size={14} />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComplianceOverview;
