"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { C } from "../lib/constants";
import { 
  IMPORTED_CASES, 
  IMPORTED_COMPLIANCE_REPORTS, 
  IMPORTED_ENROLLMENTS 
} from "../lib/importedData";
import { Card } from "./UI";
import { 
  Scale, FileText, GraduationCap, ShieldCheck, Calculator, Brain, 
  BookOpen, Sparkles, Clock, Calendar, ShieldAlert, ArrowUpRight
} from "lucide-react";

const getIconComponent = (iconName: string, size = 18, color?: string) => {
  switch (iconName) {
    case "scale": return <Scale size={size} style={{ color }} />;
    case "file-text": return <FileText size={size} style={{ color }} />;
    case "graduation-cap": return <GraduationCap size={size} style={{ color }} />;
    case "shield-check": return <ShieldCheck size={size} style={{ color }} />;
    case "shield-alert": return <ShieldAlert size={size} style={{ color }} />;
    default: return <Scale size={size} style={{ color }} />;
  }
};

interface DashboardProps {
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    plan: string;
  };
  onNavigate: (page: string) => void;
}

interface ActivityItem {
  title: string;
  time: string;
  type: string;
}

const formatRelativeTime = (isoString: string): string => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffMins < 60) {
    return diffMins <= 1 ? "Just now" : `${diffMins} mins ago`;
  } else if (diffHours < 24) {
    return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Sparkline Component for premium SaaS visual feedback
const Sparkline = ({ type, color }: { type: string; color: string }) => {
  if (type === "line") {
    return (
      <svg width="70" height="28" viewBox="0 0 70 28" style={{ opacity: 0.85, overflow: "visible" }}>
        <path d="M0 24 Q 17 6, 35 18 T 70 4" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "bar") {
    return (
      <svg width="60" height="28" viewBox="0 0 60 28" style={{ opacity: 0.85 }}>
        <rect x="0" y="14" width="6" height="14" rx="2" fill={color} />
        <rect x="10" y="8" width="6" height="20" rx="2" fill={color} />
        <rect x="20" y="18" width="6" height="10" rx="2" fill={color} />
        <rect x="30" y="5" width="6" height="23" rx="2" fill={color} />
        <rect x="40" y="11" width="6" height="17" rx="2" fill={color} />
        <rect x="50" y="2" width="6" height="26" rx="2" fill={color} />
      </svg>
    );
  }
  if (type === "wave") {
    return (
      <svg width="70" height="28" viewBox="0 0 70 28" style={{ opacity: 0.85 }}>
        <path d="M0 14 C 12 4, 23 4, 35 14 C 47 24, 58 24, 70 14" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="30" height="30" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(15,32,68,0.08)" strokeWidth="3.5" />
      <circle cx="18" cy="18" r="16" fill="none" stroke={color} strokeWidth="3.5" strokeDasharray="100" strokeDashoffset="22" strokeLinecap="round" />
    </svg>
  );
};

// Quick Action Card
const QuickToolCard = ({ tool, onClick }: { tool: { title: string; desc: string; icon: React.ReactNode; page: string; badge?: string; color: string }; onClick: () => void }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      style={{
        background: hovered ? "rgba(15, 32, 68, 0.02)" : "#FFFFFF",
        border: `1.5px solid ${hovered ? tool.color : C.border}`,
        borderRadius: 14,
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        boxShadow: hovered ? "0 10px 25px rgba(15, 32, 68, 0.06)" : "0 2px 5px rgba(15, 32, 68, 0.02)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {hovered && (
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: tool.color }} />
      )}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div style={{ 
            width: 44, 
            height: 44, 
            borderRadius: 12, 
            background: `${tool.color}14`, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            {tool.icon}
          </div>
          {tool.badge && (
            <span style={{ 
              fontSize: "0.68rem", 
              fontWeight: 700, 
              background: `${tool.color}15`, 
              color: tool.color, 
              padding: "4px 8px", 
              borderRadius: 6,
              letterSpacing: "0.02em",
              textTransform: "uppercase"
            }}>
              {tool.badge}
            </span>
          )}
        </div>
        <div style={{ fontWeight: 800, color: C.navy, fontSize: "1rem", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          {tool.title}
        </div>
        <p style={{ fontSize: "0.83rem", color: C.muted, lineHeight: 1.4, margin: 0 }}>
          {tool.desc}
        </p>
      </div>
      <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 700, color: tool.color }}>
        <span>Launch Tool</span>
        <motion.span animate={{ x: hovered ? 5 : 0 }} transition={{ duration: 0.2 }}>
          →
        </motion.span>
      </div>
    </motion.div>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [stats, setStats] = useState([
    { label: "Cases Analyzed", value: "0", icon: "scale", color: C.teal, spark: "line" },
    { label: "Reports Generated", value: "0", icon: "file-text", color: C.navy, spark: "bar" },
    { label: "Lessons Completed", value: "0", icon: "graduation-cap", color: C.gold, spark: "wave" },
    { label: "Audit Risk Rating", value: "Low", icon: "shield-check", color: "#16A34A", spark: "circle" },
  ]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Countdown timer state to 15th of current/next month (URA filing deadline)
  const [timeLeft, setTimeLeft] = useState({ days: 4, hours: 12, mins: 45, secs: 30 });

  // Embedded Quick Calculator State
  const [calcTab, setCalcTab] = useState<"paye" | "vat" | "wht">("paye");
  // PAYE state
  const [grossSalary, setGrossSalary] = useState<number>(3500000);
  // VAT state
  const [vatAmount, setVatAmount] = useState<number>(5000000);
  const [vatType, setVatType] = useState<"exclusive" | "inclusive">("exclusive");
  // WHT state
  const [whtAmount, setWhtAmount] = useState<number>(10000000);
  const [whtRate, setWhtRate] = useState<number>(6); // 6% or 15%

  useEffect(() => {
    // Timer interval for URA statutory deadline countdown
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: 59, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, mins: 59, secs: 59 };
        return { days: 15, hours: 12, mins: 30, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        const { count: casesCount } = await supabase.from("cases").select("*", { count: "exact", head: true });
        const { count: reportsCount } = await supabase.from("compliance_reports").select("*", { count: "exact", head: true });
        const { data: enrollmentsData } = await supabase.from("enrollments").select("completed_lessons");

        let lessonsCompletedCount = 0;
        if (enrollmentsData && enrollmentsData.length > 0) {
          enrollmentsData.forEach(e => {
            lessonsCompletedCount += e.completed_lessons ? e.completed_lessons.length : 0;
          });
        } else {
          IMPORTED_ENROLLMENTS.forEach(e => {
            lessonsCompletedCount += e.completed_lessons ? e.completed_lessons.length : 0;
          });
        }

        const effectiveCases = (casesCount && casesCount > 0) ? casesCount : IMPORTED_CASES.length;
        const effectiveReports = (reportsCount && reportsCount > 0) ? reportsCount : IMPORTED_COMPLIANCE_REPORTS.length;

        setStats([
          { label: "Cases Analyzed", value: String(effectiveCases), icon: "scale", color: C.teal, spark: "line" },
          { label: "Reports Generated", value: String(effectiveReports), icon: "file-text", color: C.navy, spark: "bar" },
          { label: "Lessons Completed", value: String(lessonsCompletedCount || 4), icon: "graduation-cap", color: C.gold, spark: "wave" },
          { label: "Audit Risk Rating", value: "Low Risk", icon: "shield-check", color: "#16A34A", spark: "circle" },
        ]);

        // Recent Activity Feed
        const { data: recentCases } = await supabase.from("cases").select("title, created_at").order("created_at", { ascending: false }).limit(3);
        const { data: recentReports } = await supabase.from("compliance_reports").select("type, created_at").order("created_at", { ascending: false }).limit(3);

        const activityFeed: ActivityItem[] = [];
        const casesToDisplay = (recentCases && recentCases.length > 0) ? recentCases : IMPORTED_CASES;
        const reportsToDisplay = (recentReports && recentReports.length > 0) ? recentReports : IMPORTED_COMPLIANCE_REPORTS;

        if (casesToDisplay) {
          casesToDisplay.forEach(c => {
            activityFeed.push({
              title: c.title,
              type: "Case Analysis",
              time: formatRelativeTime(c.created_at),
            });
          });
        }

        if (reportsToDisplay) {
          reportsToDisplay.forEach(r => {
            activityFeed.push({
              title: `${r.type.toUpperCase()} Compliance Checklist`,
              type: "Compliance Check",
              time: formatRelativeTime(r.created_at),
            });
          });
        }

        setActivities(activityFeed.slice(0, 3));
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Quick PAYE Calculation
  const nssf = grossSalary * 0.05;
  const taxableIncome = grossSalary - nssf;
  let payeTax = 0;
  if (taxableIncome > 410000 && taxableIncome <= 500000) {
    payeTax = (taxableIncome - 410000) * 0.10;
  } else if (taxableIncome > 500000 && taxableIncome <= 1000000) {
    payeTax = 9000 + (taxableIncome - 500000) * 0.20;
  } else if (taxableIncome > 1000000 && taxableIncome <= 10000000) {
    payeTax = 109000 + (taxableIncome - 1000000) * 0.30;
  } else if (taxableIncome > 10000000) {
    payeTax = 2779000 + (taxableIncome - 10000000) * 0.40;
  }
  const netPay = grossSalary - nssf - payeTax;

  // Quick VAT Calculation
  const vatValue = vatType === "exclusive" ? vatAmount * 0.18 : (vatAmount * 0.18) / 1.18;
  const totalWithVat = vatType === "exclusive" ? vatAmount * 1.18 : vatAmount;

  // Quick WHT Calculation
  const whtDeducted = whtAmount * (whtRate / 100);
  const whtNet = whtAmount - whtDeducted;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.06 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 24 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column", gap: 28 }}
    >
      {/* 1. Executive Greeting & Status Bar */}
      <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-wrap", gap: 16, borderBottom: `1px solid ${C.border}`, paddingBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.9rem", color: C.navy, fontWeight: 800, letterSpacing: "-0.02em" }}>
              Welcome back, {user.full_name?.split(" ")[0] || "Practitioner"}
            </h1>
            <Sparkles size={20} style={{ color: C.gold }} />
          </div>
          <p style={{ color: C.muted, fontSize: "0.92rem", fontWeight: 500 }}>
            TaxWise Uganda Executive Command Center · Authorized Practitioner Portal
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ 
            background: "rgba(212, 175, 55, 0.1)", 
            border: "1px solid rgba(212, 175, 55, 0.3)", 
            padding: "8px 14px", 
            borderRadius: 10, 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            fontSize: "0.82rem",
            fontWeight: 700,
            color: "#9A7B1C"
          }}>
            <Calendar size={15} />
            <span>FY 2025/26 Active</span>
          </div>

          <div style={{ 
            background: "rgba(26, 123, 107, 0.08)", 
            border: `1px solid ${C.teal}30`, 
            padding: "8px 14px", 
            borderRadius: 10, 
            display: "flex", 
            alignItems: "center", 
            gap: 8,
            fontSize: "0.82rem",
            fontWeight: 700,
            color: C.teal
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: C.teal, display: "inline-block" }} />
            <span style={{ textTransform: "capitalize" }}>{user.plan || "Professional"} Tier</span>
          </div>
        </div>
      </motion.div>

      {/* 2. URA Statutory Compliance Deadline & Countdown Banner */}
      <motion.div variants={itemVariants}>
        <div style={{ 
          background: "linear-gradient(135deg, #0F2044 0%, #172D56 100%)", 
          borderRadius: 16, 
          padding: "24px 28px", 
          color: "#FFFFFF",
          boxShadow: "0 10px 30px rgba(15, 32, 68, 0.15)",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ position: "absolute", right: -20, bottom: -30, opacity: 0.07, pointerEvents: "none" }}>
            <Scale size={220} color="#FFFFFF" />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20, position: "relative", zIndex: 2 }}>
            <div style={{ maxWidth: 520 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)", padding: "4px 10px", borderRadius: 6, fontSize: "0.72rem", fontWeight: 700, color: "#FDE047", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <Clock size={13} /> URA Statutory Filing Deadline Notice
              </div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, marginBottom: 6, fontFamily: "'Playfair Display', Georgia, serif" }}>
                Monthly PAYE, VAT & Withholding Tax Returns Due
              </h2>
              <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: 0 }}>
                Section 31 & Section 123 statutory filings for the preceding month must be submitted via the URA E-Portal before midnight on the 15th to avoid ITA/VATA penalties.
              </p>
            </div>

            {/* Countdown Box */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", background: "rgba(255,255,255,0.08)", padding: "14px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.15)" }}>
              <div style={{ textAlign: "center", minWidth: 42 }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, fontFamily: "monospace", color: "#FDE047" }}>{timeLeft.days}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>Days</div>
              </div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, opacity: 0.5 }}>:</span>
              <div style={{ textAlign: "center", minWidth: 42 }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, fontFamily: "monospace", color: "#FFFFFF" }}>{String(timeLeft.hours).padStart(2, '0')}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>Hours</div>
              </div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, opacity: 0.5 }}>:</span>
              <div style={{ textAlign: "center", minWidth: 42 }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, fontFamily: "monospace", color: "#FFFFFF" }}>{String(timeLeft.mins).padStart(2, '0')}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>Mins</div>
              </div>
              <span style={{ fontSize: "1.2rem", fontWeight: 700, opacity: 0.5 }}>:</span>
              <div style={{ textAlign: "center", minWidth: 42 }}>
                <div style={{ fontSize: "1.35rem", fontWeight: 800, fontFamily: "monospace", color: "#6EE7B7" }}>{String(timeLeft.secs).padStart(2, '0')}</div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontWeight: 600 }}>Secs</div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. 4 Fintech KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {stats.map(s => (
          <motion.div key={s.label} variants={itemVariants}>
            <Card style={{ padding: "22px", display: "flex", flexDirection: "column", height: "100%" }} hover>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ 
                  width: 42, 
                  height: 42, 
                  borderRadius: 10, 
                  background: `${s.color}14`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  {getIconComponent(s.icon, 20, s.color)}
                </div>
                <Sparkline type={s.spark} color={s.color} />
              </div>
              <div style={{ marginTop: "auto" }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", fontWeight: 800, color: s.color, lineHeight: 1, fontVariantNumeric: "tabular-nums" }}>
                  {loading ? "..." : s.value}
                </div>
                <div style={{ fontSize: "0.78rem", color: C.muted, marginTop: 8, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" }}>
                  {s.label}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 4. Split Grid: Embedded Quick Tax Calculator & Quick Tools Launchpad */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: 24, alignItems: "start" }}>
        
        {/* Left Column: Embedded Quick Tax Calculator Widget */}
        <motion.div variants={itemVariants}>
          <Card style={{ padding: 26, height: "100%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div>
                <div style={{ fontWeight: 800, color: C.navy, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <Calculator size={18} style={{ color: C.teal }} /> Quick Tax Calculator Suite
                </div>
                <div style={{ fontSize: "0.8rem", color: C.muted, marginTop: 2 }}>Instant URA statutory computation (FY 2025/26)</div>
              </div>
              <button
                onClick={() => onNavigate("calculators")}
                style={{ 
                  background: "transparent", 
                  border: "none", 
                  color: C.teal, 
                  fontSize: "0.8rem", 
                  fontWeight: 700, 
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4
                }}
              >
                <span>All Calculators</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {/* Calculator Tab Switcher */}
            <div style={{ display: "flex", background: C.offwhite, padding: 4, borderRadius: 10, border: `1px solid ${C.border}`, marginBottom: 20 }}>
              {[
                { id: "paye", label: "PAYE Income Tax" },
                { id: "vat", label: "VAT (18%)" },
                { id: "wht", label: "Withholding Tax" },
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setCalcTab(t.id as any)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    border: "none",
                    background: calcTab === t.id ? "#FFFFFF" : "transparent",
                    color: calcTab === t.id ? C.navy : C.muted,
                    fontWeight: calcTab === t.id ? 800 : 600,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    boxShadow: calcTab === t.id ? "0 2px 8px rgba(15,32,68,0.06)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab 1: PAYE */}
            {calcTab === "paye" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", fontWeight: 700, color: C.navy }}>
                    <span>Gross Monthly Salary</span>
                    <span style={{ fontFamily: "monospace", color: C.teal }}>UGX {grossSalary.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="20000000"
                    step="250000"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(Number(e.target.value))}
                    style={{ width: "100%", accentColor: C.teal, cursor: "pointer" }}
                  />
                </div>

                <div style={{ background: C.offwhite, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>NSSF Contribution (5%):</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.navy }}>UGX {Math.round(nssf).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>Taxable Core Income:</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.navy }}>UGX {Math.round(taxableIncome).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>URA PAYE Tax Liability:</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}>UGX {Math.round(payeTax).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: C.navy, fontSize: "0.9rem" }}>Net Monthly Payout:</span>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace", color: C.teal }}>UGX {Math.round(netPay).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: VAT */}
            {calcTab === "vat" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", fontWeight: 700, color: C.navy }}>
                    <span>Transaction Base Amount</span>
                    <span style={{ fontFamily: "monospace", color: C.teal }}>UGX {vatAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="50000000"
                    step="500000"
                    value={vatAmount}
                    onChange={(e) => setVatAmount(Number(e.target.value))}
                    style={{ width: "100%", accentColor: C.teal, cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setVatType("exclusive")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${vatType === "exclusive" ? C.teal : C.border}`,
                      background: vatType === "exclusive" ? `${C.teal}10` : "transparent",
                      color: vatType === "exclusive" ? C.teal : C.muted,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer"
                    }}
                  >
                    Exclusive (+18% VAT)
                  </button>
                  <button
                    onClick={() => setVatType("inclusive")}
                    style={{
                      flex: 1,
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${vatType === "inclusive" ? C.teal : C.border}`,
                      background: vatType === "inclusive" ? `${C.teal}10` : "transparent",
                      color: vatType === "inclusive" ? C.teal : C.muted,
                      fontWeight: 700,
                      fontSize: "0.8rem",
                      cursor: "pointer"
                    }}
                  >
                    Inclusive (Extract 18%)
                  </button>
                </div>

                <div style={{ background: C.offwhite, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>Base Amount:</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.navy }}>UGX {Math.round(vatType === "exclusive" ? vatAmount : vatAmount - vatValue).toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>VAT Standard Rate (18%):</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.teal }}>UGX {Math.round(vatValue).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: C.navy, fontSize: "0.9rem" }}>Total Gross Invoice:</span>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace", color: C.navy }}>UGX {Math.round(totalWithVat).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: WHT */}
            {calcTab === "wht" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: "0.85rem", fontWeight: 700, color: C.navy }}>
                    <span>Payment Gross Amount</span>
                    <span style={{ fontFamily: "monospace", color: C.teal }}>UGX {whtAmount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="1000000"
                    max="50000000"
                    step="1000000"
                    value={whtAmount}
                    onChange={(e) => setWhtAmount(Number(e.target.value))}
                    style={{ width: "100%", accentColor: C.teal, cursor: "pointer" }}
                  />
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { rate: 6, label: "6% Goods & Services" },
                    { rate: 15, label: "15% Non-Resident / Repatriation" },
                  ].map(w => (
                    <button
                      key={w.rate}
                      onClick={() => setWhtRate(w.rate)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 8,
                        border: `1px solid ${whtRate === w.rate ? C.teal : C.border}`,
                        background: whtRate === w.rate ? `${C.teal}10` : "transparent",
                        color: whtRate === w.rate ? C.teal : C.muted,
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        textAlign: "center"
                      }}
                    >
                      {w.label}
                    </button>
                  ))}
                </div>

                <div style={{ background: C.offwhite, borderRadius: 12, padding: "16px", border: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>Gross Payment:</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: C.navy }}>UGX {whtAmount.toLocaleString()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem" }}>
                    <span style={{ color: C.muted }}>WHT Deducted ({whtRate}%):</span>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", color: "#DC2626" }}>UGX {Math.round(whtDeducted).toLocaleString()}</span>
                  </div>
                  <div style={{ borderTop: `1px dashed ${C.border}`, paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 800, color: C.navy, fontSize: "0.9rem" }}>Net Payout to Vendor:</span>
                    <span style={{ fontWeight: 800, fontSize: "1.1rem", fontFamily: "monospace", color: C.teal }}>UGX {Math.round(whtNet).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Right Column: Quick Tools Action Launchpad */}
        <motion.div variants={itemVariants}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontWeight: 800, color: C.navy, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
              <Sparkles size={18} style={{ color: C.gold }} /> Practitioner Launchpad
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
              {[
                { 
                  title: "AI Case Analyzer", 
                  desc: "Simulate URA tax assessments & generate TAT objection briefs instantly.", 
                  icon: <Scale size={20} style={{ color: C.teal }} />, 
                  page: "analyzer", 
                  badge: "Core AI", 
                  color: C.teal 
                },
                { 
                  title: "TAT Precedent Library", 
                  desc: "Search tribunal rulings, ratios decidendi, and Uganda tax case law.", 
                  icon: <BookOpen size={20} style={{ color: C.navy }} />, 
                  page: "library", 
                  badge: "Searchable", 
                  color: C.navy 
                },
                { 
                  title: "Compliance Audit", 
                  desc: "Run 360° VAT, PAYE & Income Tax health checks and penalty simulations.", 
                  icon: <ShieldCheck size={20} style={{ color: "#16A34A" }} />, 
                  page: "compliance", 
                  badge: "Audit Ready", 
                  color: "#16A34A" 
                },
                { 
                  title: "Tax Intelligence Portal", 
                  desc: "Analyze Uganda National Budget speeches, amendments & tax circulars.", 
                  icon: <Brain size={20} style={{ color: C.gold }} />, 
                  page: "intelligence", 
                  badge: "Insights", 
                  color: C.gold 
                },
              ].map(tool => (
                <QuickToolCard
                  key={tool.title}
                  tool={tool}
                  onClick={() => onNavigate(tool.page)}
                />
              ))}
            </div>
          </div>
        </motion.div>

      </div>

      {/* 5. Recent Activity Audit Timeline */}
      <motion.div variants={itemVariants}>
        <Card style={{ padding: 26 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontWeight: 800, color: C.navy, fontSize: "1.05rem" }}>Recent Practitioner Activity Audit Trail</div>
              <div style={{ fontSize: "0.8rem", color: C.muted, marginTop: 2 }}>Chronological log of recent case analyses and compliance checks</div>
            </div>
            <button
              onClick={() => onNavigate("analyzer")}
              style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer" }}
            >
              View All Cases →
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, position: "relative" }}>
            {loading ? (
              <div style={{ padding: "20px", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>Loading activity stream...</div>
            ) : activities.length > 0 ? (
              activities.map((r, i) => (
                <div key={i} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "14px 18px", 
                  background: C.offwhite, 
                  borderRadius: 12, 
                  border: `1px solid ${C.border}` 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ 
                      width: 36, 
                      height: 36, 
                      borderRadius: 10, 
                      background: r.type.includes("Case") ? `${C.teal}15` : `${C.navy}15`, 
                      display: "flex", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: r.type.includes("Case") ? C.teal : C.navy 
                    }}>
                      {r.type.includes("Case") ? <Scale size={18} /> : <ShieldCheck size={18} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: C.navy, fontSize: "0.9rem" }}>{r.title}</div>
                      <div style={{ fontSize: "0.76rem", color: C.muted, marginTop: 2, display: "flex", gap: 8 }}>
                        <span style={{ fontWeight: 600, color: r.type.includes("Case") ? C.teal : C.navy }}>{r.type}</span>
                        <span>•</span>
                        <span>{r.time}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate(r.type.includes("Case") ? "analyzer" : "compliance")}
                    style={{ 
                      padding: "6px 12px", 
                      borderRadius: 8, 
                      border: `1px solid ${C.border}`, 
                      background: "#FFFFFF", 
                      color: C.navy, 
                      fontSize: "0.78rem", 
                      fontWeight: 700, 
                      cursor: "pointer" 
                    }}
                  >
                    Open
                  </button>
                </div>
              ))
            ) : (
              <div style={{ padding: "30px", textAlign: "center", color: C.muted, fontSize: "0.85rem" }}>
                No recent activity recorded yet. Get started by analyzing an assessment notice or running a compliance check!
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};
