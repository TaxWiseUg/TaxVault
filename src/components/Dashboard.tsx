"use client";

import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { C } from "../lib/constants";
import { 
  Calendar, Search, ExternalLink, Plus, Square, ChevronLeft, ChevronRight, ChevronDown, ChevronUp
} from "lucide-react";

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

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [timeLeft, setTimeLeft] = useState({ hours: 10, mins: 6, secs: 45 });
  const [calendarMonth, setCalendarMonth] = useState("October 2026");
  const [isComingUpExpanded, setIsComingUpExpanded] = useState(false);

  // Timer interval for URA statutory deadline countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.secs > 0) return { ...prev, secs: prev.secs - 1 };
        if (prev.mins > 0) return { ...prev, mins: prev.mins - 1, secs: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, mins: 59, secs: 59 };
        return { hours: 10, mins: 6, secs: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 380, damping: 24 } }
  };

  const userName = user.full_name?.split(" ")[0] || "Eric";

  const comingUpDeadlines = [
    { date: "15 OCT", title: "Monthly returns — September 2026", sub: "PAYE · WHT · VAT", badge: "Due today", highlight: true },
    { date: "15 NOV", title: "Monthly returns — October 2026", sub: "PAYE · WHT · VAT", badge: "31 days" },
    { date: "15 DEC", title: "Monthly returns — November 2026", sub: "PAYE · WHT · VAT", badge: "61 days" },
    { date: "31 DEC", title: "Annual Income tax return — FY 2025/26", sub: "Income tax", badge: "77 days" },
    { date: "15 JAN", title: "Monthly returns — December 2026", sub: "PAYE · WHT · VAT", badge: "92 days" },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400, margin: "0 auto", width: "100%", paddingBottom: 40 }}
    >
      {/* 1. Greeting & Search / CTA Header */}
      <motion.div variants={itemVariants} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2rem", color: C.navy, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 4 }}>
            Good afternoon, {userName}
          </h1>
          <p style={{ color: "#64748B", fontSize: "0.85rem", fontWeight: 500 }}>
            Thu, 15 Oct 2026 · 1 filing due in the next 7 days · 1 case waiting for your review
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Search Box */}
          <div style={{ position: "relative", minWidth: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              type="text"
              placeholder="Ask TaxWise, or search cases, rulings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "9px 62px 9px 36px",
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                background: "#FFFFFF",
                fontSize: "0.82rem",
                color: C.navy,
                outline: "none",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
                fontFamily: "inherit"
              }}
            />
            <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: "0.68rem", background: "rgba(15,32,68,0.06)", padding: "2px 6px", borderRadius: 4, color: "#64748B", fontWeight: 700 }}>
              Ctrl K
            </span>
          </div>

          {/* Analyze a case CTA */}
          <button
            onClick={() => onNavigate("analyzer")}
            style={{
              background: "#1A7B6B",
              color: "#FFFFFF",
              border: "none",
              padding: "9px 18px",
              borderRadius: 8,
              fontSize: "0.83rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 4px 12px rgba(26,123,107,0.25)",
              whiteSpace: "nowrap",
              fontFamily: "inherit"
            }}
          >
            <Plus size={15} />
            <span>Analyze a case</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Urgent Statutory Filing Deadline Banner */}
      <motion.div variants={itemVariants}>
        <div style={{ 
          background: "#FFFFFF", 
          borderRadius: 12, 
          padding: "20px 24px", 
          border: "1px solid rgba(239, 68, 68, 0.25)", 
          boxShadow: "0 4px 16px rgba(15, 32, 68, 0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Date Badge */}
            <div style={{ 
              background: "#C8922A", 
              color: "#FFFFFF", 
              borderRadius: 10, 
              padding: "10px 12px", 
              textAlign: "center",
              minWidth: 54,
              boxShadow: "0 2px 8px rgba(200,146,42,0.25)",
              flexShrink: 0
            }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>OCT</div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1, marginTop: 2 }}>15</div>
            </div>

            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, marginBottom: 4 }}>
                Monthly returns — September 2026 — due Thursday 15 October
              </div>
              <p style={{ fontSize: "0.81rem", color: "#64748B", margin: 0, lineHeight: 1.4, maxWidth: 650 }}>
                File and pay PAYE, withholding tax and VAT for September 2026. Penalties and interest accrue after the due date.
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#D97706", fontFamily: "monospace" }}>
              {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.mins).padStart(2, '0')}m left
            </span>

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                onClick={() => alert("Added URA filing reminder to Google Calendar!")}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${C.border}`,
                  color: C.navy,
                  padding: "7px 12px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Add to Google Calendar
              </button>
              <button
                onClick={() => alert("Marked September 2026 returns as filed successfully!")}
                style={{
                  background: C.navy,
                  color: "#FFFFFF",
                  border: "none",
                  padding: "7px 14px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit"
                }}
              >
                Mark as filed
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. 4 KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* Card 1: Active cases */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)", height: "100%" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Active cases
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: 8 }}>
              3
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
              <span style={{ color: "#D97706", fontWeight: 700 }}>1 needs review</span> · 2 in progress
            </div>
          </div>
        </motion.div>

        {/* Card 2: Reports generated */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)", height: "100%" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Reports generated
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: 8 }}>
              2
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
              Last: Mukwano PAYE review - 6 Jul
            </div>
          </div>
        </motion.div>

        {/* Card 3: Learning progress */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)", height: "100%" }}>
            <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>
              Learning progress
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: 8 }}>
              4 <span style={{ fontSize: "1.1rem", fontWeight: 600, color: "#64748B" }}>lessons</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748B", fontWeight: 600, marginBottom: 8 }}>
              Advanced VAT course · 4 of 12
            </div>
            <div style={{ width: "100%", height: 5, background: "#E2E8F0", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "33%", height: "100%", background: C.teal, borderRadius: 99 }} />
            </div>
          </div>
        </motion.div>

        {/* Card 4: Compliance score */}
        <motion.div variants={itemVariants}>
          <div 
            onClick={() => onNavigate("compliance")}
            style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)", height: "100%", cursor: "pointer", transition: "all 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 6 }}>
                  Compliance score
                </div>
                <div style={{ fontSize: "0.75rem", color: "#D97706", fontWeight: 700, marginBottom: 6 }}>
                  2 items to fix
                </div>
                <div style={{ fontSize: "0.76rem", color: C.teal, fontWeight: 700, display: "flex", alignItems: "center", gap: 3 }}>
                  <span>See what&apos;s missing</span>
                  <span>→</span>
                </div>
              </div>

              {/* Circular Gauge */}
              <div style={{ position: "relative", width: 50, height: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="50" height="50" viewBox="0 0 36 36" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E2E8F0" strokeWidth="3.5" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke={C.teal} strokeWidth="3.5" strokeDasharray="100" strokeDashoffset="12" strokeLinecap="round" />
                </svg>
                <span style={{ position: "absolute", fontSize: "0.75rem", fontWeight: 800, color: C.navy }}>88%</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 4. Main Section Split: Left (Your cases) & Right (Filing calendar) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr", gap: 24, alignItems: "start" }}>
        
        {/* Left: Your cases */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Your cases</h3>
              <button
                onClick={() => onNavigate("analyzer")}
                style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
              >
                View all
              </button>
            </div>

            {/* Cases Table */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "8px 0", borderBottom: `1px solid ${C.border}`, fontSize: "0.72rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <div>Case</div>
                <div>Tax</div>
                <div>Status</div>
                <div style={{ textAlign: "right" }}>Next step</div>
              </div>

              {/* Row 1 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: C.navy }}>Uganda Clays — VAT input audit</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 2 }}>Updated 5 Jul</div>
                </div>
                <div>
                  <span style={{ background: "rgba(15,32,68,0.06)", color: C.navy, fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>VAT</span>
                </div>
                <div>
                  <span style={{ background: "rgba(239, 68, 68, 0.1)", color: "#DC2626", fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                    Needs review
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    onClick={() => onNavigate("analyzer")} 
                    style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Review AI findings →
                  </button>
                </div>
              </div>

              {/* Row 2 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: C.navy }}>Mukwano — PAYE on casual workers</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 2 }}>Updated 8 Jul</div>
                </div>
                <div>
                  <span style={{ background: "rgba(15,32,68,0.06)", color: C.navy, fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>PAYE</span>
                </div>
                <div>
                  <span style={{ background: "rgba(22, 163, 74, 0.1)", color: "#16A34A", fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                    Report ready
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    onClick={() => onNavigate("analyzer")} 
                    style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Send to client →
                  </button>
                </div>
              </div>

              {/* Row 3 */}
              <div style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: C.navy }}>EFRIS compliance checklist</div>
                  <div style={{ fontSize: "0.7rem", color: "#64748B", marginTop: 2 }}>Updated 15 Jul</div>
                </div>
                <div>
                  <span style={{ background: "rgba(15,32,68,0.06)", color: C.navy, fontSize: "0.68rem", fontWeight: 700, padding: "2px 6px", borderRadius: 4 }}>EFRIS</span>
                </div>
                <div>
                  <span style={{ background: "rgba(217, 119, 6, 0.1)", color: "#D97706", fontSize: "0.7rem", fontWeight: 700, padding: "3px 8px", borderRadius: 99 }}>
                    Items open
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    onClick={() => onNavigate("compliance")} 
                    style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.78rem", cursor: "pointer" }}
                  >
                    Finish checklist →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Filing calendar */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Filing calendar</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => alert("Added deadline to calendar")}
                  style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, color: C.navy, cursor: "pointer" }}
                >
                  + Add deadline
                </button>
                <button
                  onClick={() => alert("Exported calendar (.ics)")}
                  style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, color: C.navy, cursor: "pointer" }}
                >
                  Export to calendar
                </button>
              </div>
            </div>

            {/* Calendar Controls & Month */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: C.navy }}>{calendarMonth}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <button onClick={() => setCalendarMonth("September 2026")} style={{ background: "#FFFFFF", border: "none", padding: "4px 8px", cursor: "pointer" }}><ChevronLeft size={14} /></button>
                  <button onClick={() => setCalendarMonth("October 2026")} style={{ background: "#FFFFFF", border: "none", padding: "4px 8px", borderLeft: `1px solid ${C.border}`, cursor: "pointer" }}><ChevronRight size={14} /></button>
                </div>
                <button onClick={() => setCalendarMonth("October 2026")} style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}>Today</button>
              </div>
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginBottom: 8 }}>
              <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", fontSize: "0.8rem", color: C.navy, marginBottom: 16 }}>
              {/* Week 1 */}
              <div style={{ padding: "8px 0", color: "#CBD5E1" }}>28</div>
              <div style={{ padding: "8px 0", color: "#CBD5E1" }}>29</div>
              <div style={{ padding: "8px 0", color: "#CBD5E1" }}>30</div>
              <div style={{ padding: "8px 0" }}>1</div>
              <div style={{ padding: "8px 0" }}>2</div>
              <div style={{ padding: "8px 0" }}>3</div>
              <div style={{ padding: "8px 0" }}>4</div>

              {/* Week 2 */}
              <div style={{ padding: "8px 0" }}>5</div>
              <div style={{ padding: "8px 0" }}>6</div>
              <div style={{ padding: "8px 0" }}>7</div>
              <div style={{ padding: "8px 0" }}>8</div>
              <div style={{ padding: "8px 0" }}>9</div>
              <div style={{ padding: "8px 0" }}>10</div>
              <div style={{ padding: "8px 0" }}>11</div>

              {/* Week 3 */}
              <div style={{ padding: "8px 0" }}>12</div>
              <div style={{ padding: "8px 0" }}>13</div>
              <div style={{ padding: "8px 0" }}>14</div>
              <div style={{ padding: "8px 0", background: "rgba(200, 146, 42, 0.12)", border: `2px solid #C8922A`, borderRadius: 8, fontWeight: 800, color: "#C8922A" }}>
                15
                <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#C8922A", margin: "2px auto 0" }} />
              </div>
              <div style={{ padding: "8px 0" }}>16</div>
              <div style={{ padding: "8px 0" }}>17</div>
              <div style={{ padding: "8px 0" }}>18</div>

              {/* Week 4 */}
              <div style={{ padding: "8px 0" }}>19</div>
              <div style={{ padding: "8px 0" }}>20</div>
              <div style={{ padding: "8px 0" }}>21</div>
              <div style={{ padding: "8px 0" }}>22</div>
              <div style={{ padding: "8px 0" }}>23</div>
              <div style={{ padding: "8px 0" }}>24</div>
              <div style={{ padding: "8px 0" }}>25</div>

              {/* Week 5 */}
              <div style={{ padding: "8px 0" }}>26</div>
              <div style={{ padding: "8px 0" }}>27</div>
              <div style={{ padding: "8px 0" }}>28</div>
              <div style={{ padding: "8px 0" }}>29</div>
              <div style={{ padding: "8px 0" }}>30</div>
              <div style={{ padding: "8px 0" }}>31</div>
              <div style={{ padding: "8px 0", color: "#CBD5E1" }}>1</div>
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "#64748B", fontWeight: 600, marginBottom: 16 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8922A" }} /> Due</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} /> Filed</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#DC2626" }} /> Overdue</span>
            </div>

            {/* Coming Up Collapsible Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Coming up {!isComingUpExpanded && `(${comingUpDeadlines.length - 1} more)`}
              </div>
              <button
                onClick={() => setIsComingUpExpanded(!isComingUpExpanded)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: C.teal,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: 0
                }}
              >
                <span>{isComingUpExpanded ? "Collapse" : "Show all deadlines"}</span>
                {isComingUpExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {/* Always display top/mediate item */}
              {comingUpDeadlines.slice(0, isComingUpExpanded ? comingUpDeadlines.length : 1).map((item, idx) => (
                <div key={idx} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "10px 12px", 
                  background: item.highlight ? "rgba(200, 146, 42, 0.08)" : C.offwhite, 
                  borderRadius: 8,
                  border: `1px solid ${item.highlight ? "rgba(200, 146, 42, 0.25)" : C.border}`
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: item.highlight ? "#C8922A" : "#64748B", minWidth: 46 }}>{item.date}</span>
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: 700, color: C.navy }}>{item.title}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748B", marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: item.highlight ? "#D97706" : "#64748B" }}>{item.badge}</span>
                    <Square size={15} style={{ color: "#CBD5E1", cursor: "pointer" }} />
                    <Calendar size={14} style={{ color: "#94A3B8", cursor: "pointer" }} />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </motion.div>

      </div>

      {/* 5. Lower Section Split: Left ("Intelligence for you") & Right ("Quick calculators") */}
      <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: 24, alignItems: "start" }}>
        
        {/* Left: Intelligence for you */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Intelligence for you</h3>
              <button
                onClick={() => onNavigate("intelligence")}
                style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
              >
                All updates
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Card 1 */}
              <div 
                onClick={() => onNavigate("analyzer")}
                style={{ padding: "16px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: C.teal, background: "rgba(26,123,107,0.1)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>TAT RULING</span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Matches: Uganda Clays</span>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: C.navy, marginBottom: 4 }}>
                  [Ruling title] — VAT input credit on disputed invoices
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  AI summary: what the Tribunal decided and how it affects your open VAT case.
                </p>
              </div>

              {/* Card 2 */}
              <div 
                onClick={() => onNavigate("compliance")}
                style={{ padding: "16px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: C.gold, background: "rgba(200,146,42,0.1)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>URA PUBLIC NOTICE</span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Matches: EFRIS checklist</span>
                </div>
                <div style={{ fontSize: "0.9rem", fontWeight: 800, color: C.navy, marginBottom: 4 }}>
                  [Notice title] — EFRIS e-invoicing update
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  What changed, who it applies to, and the effective date.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Quick calculators */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Quick calculators</h3>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <div 
                onClick={() => onNavigate("calculators")}
                style={{ padding: "14px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: C.navy, marginBottom: 2 }}>PAYE</div>
                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>2026 bands</div>
              </div>

              <div 
                onClick={() => onNavigate("calculators")}
                style={{ padding: "14px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: C.navy, marginBottom: 2 }}>Corporate tax</div>
                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>With loss carry-forward</div>
              </div>

              <div 
                onClick={() => onNavigate("calculators")}
                style={{ padding: "14px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: C.navy, marginBottom: 2 }}>Rental income</div>
                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Individuals &amp; companies</div>
              </div>

              <div 
                onClick={() => onNavigate("calculators")}
                style={{ padding: "14px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.teal}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <div style={{ fontSize: "0.85rem", fontWeight: 800, color: C.navy, marginBottom: 2 }}>VAT</div>
                <div style={{ fontSize: "0.72rem", color: "#64748B" }}>Output vs input</div>
              </div>
            </div>

            <button
              onClick={() => onNavigate("calculators")}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 10,
                border: `1px dashed ${C.border}`,
                background: "transparent",
                color: C.teal,
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "center",
                fontFamily: "inherit"
              }}
            >
              + Pin a calculator
            </button>
          </div>
        </motion.div>

      </div>

      {/* 6. Official Portals Footer Section */}
      <motion.div variants={itemVariants}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: C.navy, margin: 0 }}>Official portals</h3>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Open in a new tab · links checked 13 Oct 2026</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { title: "URA portal login", sub: "File returns & pay", url: "https://ura.go.ug", badge: "URA" },
              { title: "EFRIS", sub: "E-invoicing & e-receipts", url: "https://efris.ura.go.ug", badge: "URA" },
              { title: "URA website", sub: "Public notices & guides", url: "https://ura.go.ug", badge: "URA" },
              { title: "Tax Appeals Tribunal", sub: "Appeals & cause lists", url: "https://tat.go.ug", badge: "TAT" },
              { title: "TAT judgments", sub: "Full-text decisions", url: "https://tat.go.ug/judgments", badge: "ULII" },
              { title: "NSSF Uganda", sub: "Contributions", url: "https://nssfug.org", badge: "NSSF" },
              { title: "Ministry of Finance", sub: "Budget & tax policy", url: "https://finance.go.ug", badge: "MoFPED" },
            ].map((p, idx) => (
              <a
                key={idx}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px 14px",
                  background: C.offwhite,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  textDecoration: "none",
                  transition: "all 0.15s"
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = "#FFFFFF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offwhite; }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(15,32,68,0.06)", padding: "1px 5px", borderRadius: 3, color: "#64748B" }}>{p.badge}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: C.navy }}>{p.title}</span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748B" }}>{p.sub}</div>
                </div>
                <ExternalLink size={14} style={{ color: "#94A3B8" }} />
              </a>
            ))}
          </div>
        </div>
      </motion.div>

    </motion.div>
  );
};
