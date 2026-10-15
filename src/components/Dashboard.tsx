"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { C } from "../lib/constants";
import { 
  Calendar as CalendarIcon, 
  Search, 
  ExternalLink, 
  Plus, 
  Square, 
  CheckSquare, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown, 
  ChevronUp,
  Check,
  X,
  Clock,
  ArrowRight,
  BookOpen,
  Calculator,
  ShieldCheck,
  Scale,
  Sparkles,
  Download,
  CalendarPlus
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

interface DeadlineItem {
  id: string;
  date: string;
  dayNumber: number;
  monthIndex: number; // 0-11
  year: number;
  title: string;
  sub: string;
  badge: string;
  highlight?: boolean;
  completed?: boolean;
  taxType: string;
}

const INITIAL_DEADLINES: DeadlineItem[] = [
  { id: "dl-1", date: "15 OCT", dayNumber: 15, monthIndex: 9, year: 2026, title: "Monthly returns — September 2026", sub: "PAYE · WHT · VAT", badge: "Due today", highlight: true, taxType: "Monthly Returns" },
  { id: "dl-2", date: "15 NOV", dayNumber: 15, monthIndex: 10, year: 2026, title: "Monthly returns — October 2026", sub: "PAYE · WHT · VAT", badge: "31 days", taxType: "Monthly Returns" },
  { id: "dl-3", date: "15 DEC", dayNumber: 15, monthIndex: 11, year: 2026, title: "Monthly returns — November 2026", sub: "PAYE · WHT · VAT", badge: "61 days", taxType: "Monthly Returns" },
  { id: "dl-4", date: "31 DEC", dayNumber: 31, monthIndex: 11, year: 2026, title: "Annual Income tax return — FY 2025/26", sub: "Income tax · Corporation & Individual", badge: "77 days", taxType: "Income Tax" },
  { id: "dl-5", date: "15 JAN", dayNumber: 15, monthIndex: 0, year: 2027, title: "Monthly returns — December 2026", sub: "PAYE · WHT · VAT", badge: "92 days", taxType: "Monthly Returns" },
];

const SEARCH_CATALOG = [
  { title: "PAYE Calculator (2026 Bands)", category: "Calculator", page: "calculators", keywords: "paye salary income employment tax bands" },
  { title: "Corporate Tax Calculator (Loss carry-forward)", category: "Calculator", page: "calculators", keywords: "corporate business company profit 30% 25%" },
  { title: "Rental Income Tax Calculator", category: "Calculator", page: "calculators", keywords: "rental property deemed deduction landlord" },
  { title: "VAT Output vs Input Calculator", category: "Calculator", page: "calculators", keywords: "vat 18% efris invoice credit sales" },
  { title: "Compliance Health Checker & Audit Engine", category: "Compliance", page: "compliance", keywords: "compliance uat audit efris penalty reconciliation" },
  { title: "Case Analyzer — TAT Objection Briefs", category: "Advisory", page: "analyzer", keywords: "analyzer objections appeals tat brief dispute legal" },
  { title: "TAT Precedents & Ruling Library", category: "Case Law", page: "library", keywords: "library rulings court judgments high court tat ulii" },
  { title: "ETA Engineering Works v URA", category: "TAT Precedent", page: "library", keywords: "eta engineering ifmis variance loan addback" },
  { title: "Registered Trustees of Entebbe Golf Club v URA", category: "TAT Precedent", page: "library", keywords: "entebbe golf club membership subscription non-profit" },
  { title: "Learning Academy & CPD Modules", category: "Education", page: "education", keywords: "learning course education cpd training certificate" },
];

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 10, mins: 6, secs: 45 });
  const [isComingUpExpanded, setIsComingUpExpanded] = useState(false);
  const [isSeptemberFiled, setIsSeptemberFiled] = useState(false);
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(INITIAL_DEADLINES);
  
  // Dynamic Calendar Navigation state (defaults to October 2026)
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(9); // 0-indexed: 9 is October
  const [selectedDay, setSelectedDay] = useState<number | null>(15);

  // Modal for Adding Custom Deadline
  const [isAddDeadlineOpen, setIsAddDeadlineOpen] = useState(false);
  const [newDeadlineTitle, setNewDeadlineTitle] = useState("");
  const [newDeadlineDate, setNewDeadlineDate] = useState("2026-10-31");
  const [newDeadlineTax, setNewDeadlineTax] = useState("PAYE");

  // Pinned Calculators State
  const [pinnedCalculators, setPinnedCalculators] = useState([
    { id: "paye", title: "PAYE", sub: "2026 statutory bands", page: "calculators" },
    { id: "corporate", title: "Corporate tax", sub: "With loss carry-forward", page: "calculators" },
    { id: "rental", title: "Rental income", sub: "Individuals & companies", page: "calculators" },
    { id: "vat", title: "VAT", sub: "Output vs input (18%)", page: "calculators" },
  ]);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Global Ctrl+K / Cmd+K shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
      if (e.key === "Escape") {
        setIsSearchFocused(false);
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  const userName = user.full_name?.split(" ")[0] || "Tax";

  // Google Calendar Link Generator
  const openGoogleCalendar = (title: string, details: string, dateStr: string) => {
    const cleanDate = dateStr.replace(/-/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&details=${encodeURIComponent(
      `${details}\n\nGenerated by TaxWise Uganda Platform (https://taxwise.ug)`
    )}&dates=${cleanDate}T090000Z/${cleanDate}T170000Z`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Export all deadlines as an .ics file
  const handleExportIcs = () => {
    const icsLines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TaxWise Uganda//Statutory Filing Calendar//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    deadlines.forEach((dl) => {
      const monthPadded = String(dl.monthIndex + 1).padStart(2, "0");
      const dayPadded = String(dl.dayNumber).padStart(2, "0");
      const dtDate = `${dl.year}${monthPadded}${dayPadded}`;
      
      icsLines.push("BEGIN:VEVENT");
      icsLines.push(`UID:${dl.id}-${dtDate}@taxwise.ug`);
      icsLines.push(`DTSTAMP:${dtDate}T090000Z`);
      icsLines.push(`DTSTART;VALUE=DATE:${dtDate}`);
      icsLines.push(`SUMMARY:URA Deadline: ${dl.title}`);
      icsLines.push(`DESCRIPTION:${dl.sub} - Filing due via URA portal. TaxWise Uganda Statutory Reminder.`);
      icsLines.push(`STATUS:CONFIRMED`);
      icsLines.push("END:VEVENT");
    });

    icsLines.push("END:VCALENDAR");

    const blob = new Blob([icsLines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `TaxWise_Uganda_Tax_Calendar_${calYear}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Toggle Deadline Completion
  const toggleDeadline = (id: string) => {
    setDeadlines(prev => prev.map(dl => {
      if (dl.id === id) {
        return { ...dl, completed: !dl.completed };
      }
      return dl;
    }));
  };

  // Add Custom Deadline Handler
  const handleAddCustomDeadline = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeadlineTitle.trim() || !newDeadlineDate) return;

    const parts = newDeadlineDate.split("-");
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);

    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const formattedDate = `${d} ${monthNames[m]}`;

    const newDl: DeadlineItem = {
      id: `custom-${Date.now()}`,
      date: formattedDate,
      dayNumber: d,
      monthIndex: m,
      year: y,
      title: newDeadlineTitle.trim(),
      sub: `${newDeadlineTax} Statutory Obligation`,
      badge: "Custom",
      taxType: newDeadlineTax,
      completed: false
    };

    setDeadlines(prev => [newDl, ...prev]);
    setCalYear(y);
    setCalMonth(m);
    setSelectedDay(d);
    setIsAddDeadlineOpen(false);
    setNewDeadlineTitle("");
  };

  // Calendar Engine Helper
  const monthNamesFull = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
    setSelectedDay(null);
  };

  const goToToday = () => {
    setCalYear(2026);
    setCalMonth(9);
    setSelectedDay(15);
  };

  // Days calculation for current month
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = (new Date(calYear, calMonth, 1).getDay() + 6) % 7; // Convert Sunday=0 to Monday=0

  // Filter search results
  const filteredSearch = searchQuery.trim() === "" 
    ? [] 
    : SEARCH_CATALOG.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.keywords.toLowerCase().includes(searchQuery.toLowerCase())
      );

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
            Thu, 15 Oct 2026 · {isSeptemberFiled ? "September returns filed" : "1 filing due in the next 7 days"} · 1 case waiting for your review
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {/* Interactive Search Box */}
          <div style={{ position: "relative", minWidth: 320 }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Ask TaxWise, search cases, calculators..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              style={{
                width: "100%",
                padding: "9px 68px 9px 36px",
                borderRadius: 8,
                border: `1px solid ${isSearchFocused ? C.teal : C.border}`,
                background: "#FFFFFF",
                fontSize: "0.82rem",
                color: C.navy,
                outline: "none",
                boxShadow: isSearchFocused ? "0 0 0 3px rgba(26,123,107,0.15)" : "0 1px 2px rgba(0,0,0,0.03)",
                fontFamily: "inherit",
                transition: "all 0.15s ease"
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredSearch.length > 0) {
                  onNavigate(filteredSearch[0].page);
                  setIsSearchFocused(false);
                }
              }}
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  searchInputRef.current?.focus();
                }}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#94A3B8",
                  padding: 4,
                  display: "flex",
                  alignItems: "center"
                }}
              >
                <X size={14} />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => searchInputRef.current?.focus()}
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  fontSize: "0.68rem",
                  background: "rgba(15,32,68,0.06)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  color: "#64748B",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                Ctrl K
              </button>
            )}

            {/* Live Search Auto-suggestions Dropdown */}
            {isSearchFocused && filteredSearch.length > 0 && (
              <>
                <div 
                  onClick={() => setIsSearchFocused(false)} 
                  style={{ position: "fixed", inset: 0, zIndex: 120 }} 
                />
                <div style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  background: "#FFFFFF",
                  borderRadius: 8,
                  boxShadow: "0 10px 30px rgba(15,32,68,0.15)",
                  border: `1px solid ${C.border}`,
                  zIndex: 130,
                  maxHeight: 320,
                  overflowY: "auto",
                  padding: "6px 0"
                }}>
                  <div style={{ padding: "6px 12px 4px", fontSize: "0.68rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase" }}>
                    Matching Tools &amp; Rulings
                  </div>
                  {filteredSearch.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        onNavigate(item.page);
                        setIsSearchFocused(false);
                        setSearchQuery("");
                      }}
                      style={{
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        borderBottom: idx < filteredSearch.length - 1 ? `1px solid ${C.offwhite}` : "none",
                        transition: "background 0.12s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = C.offwhite}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: "0.65rem", padding: "2px 6px", borderRadius: 4, background: "rgba(26,123,107,0.1)", color: C.teal, fontWeight: 700 }}>
                          {item.category}
                        </span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600, color: C.navy }}>{item.title}</span>
                      </div>
                      <ArrowRight size={13} style={{ color: "#94A3B8" }} />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Analyze a case CTA */}
          <button
            type="button"
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
              fontFamily: "inherit",
              transition: "transform 0.15s ease, background 0.15s ease"
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <Plus size={15} />
            <span>Analyze a case</span>
          </button>
        </div>
      </motion.div>

      {/* 2. Urgent Statutory Filing Deadline Banner */}
      <motion.div variants={itemVariants}>
        <div style={{ 
          background: isSeptemberFiled ? "#F0FDF4" : "#FFFFFF", 
          borderRadius: 12, 
          padding: "20px 24px", 
          border: `1px solid ${isSeptemberFiled ? "rgba(34, 197, 94, 0.4)" : "rgba(239, 68, 68, 0.25)"}`, 
          boxShadow: "0 4px 16px rgba(15, 32, 68, 0.04)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 20,
          transition: "all 0.25s ease"
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
            {/* Date Badge */}
            <div style={{ 
              background: isSeptemberFiled ? "#16A34A" : "#C8922A", 
              color: "#FFFFFF", 
              borderRadius: 10, 
              padding: "10px 12px", 
              textAlign: "center",
              minWidth: 54,
              boxShadow: isSeptemberFiled ? "0 2px 8px rgba(22,163,74,0.25)" : "0 2px 8px rgba(200,146,42,0.25)",
              flexShrink: 0
            }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {isSeptemberFiled ? "DONE" : "OCT"}
              </div>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, lineHeight: 1, marginTop: 2 }}>
                {isSeptemberFiled ? "✓" : "15"}
              </div>
            </div>

            <div>
              <div style={{ fontSize: "0.95rem", fontWeight: 800, color: C.navy, marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
                <span>Monthly returns — September 2026 — due Thursday 15 October</span>
                {isSeptemberFiled && (
                  <span style={{ fontSize: "0.7rem", background: "rgba(22,163,74,0.15)", color: "#16A34A", padding: "2px 8px", borderRadius: 99, fontWeight: 700 }}>
                    Filed Successfully
                  </span>
                )}
              </div>
              <p style={{ fontSize: "0.81rem", color: "#64748B", margin: 0, lineHeight: 1.4, maxWidth: 650 }}>
                {isSeptemberFiled 
                  ? "September 2026 PAYE, withholding tax and VAT returns recorded as filed with URA."
                  : "File and pay PAYE, withholding tax and VAT for September 2026. Penalties and interest accrue after the due date."}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            {!isSeptemberFiled ? (
              <span style={{ fontSize: "0.95rem", fontWeight: 800, color: "#D97706", fontFamily: "monospace" }}>
                {String(timeLeft.hours).padStart(2, '0')}h {String(timeLeft.mins).padStart(2, '0')}m {String(timeLeft.secs).padStart(2, '0')}s left
              </span>
            ) : (
              <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#16A34A" }}>
                Zero outstanding exposure
              </span>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  setNewDeadlineTitle("Monthly returns — September 2026 (PAYE, WHT, VAT)");
                  setNewDeadlineDate("2026-10-15");
                  setNewDeadlineTax("VAT");
                  setIsAddDeadlineOpen(true);
                }}
                style={{
                  background: "#FFFFFF",
                  border: `1px solid ${C.border}`,
                  color: C.navy,
                  padding: "7px 12px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
                title="Add to Filing Calendar"
              >
                <CalendarPlus size={14} style={{ color: C.teal }} />
                <span>Add to calendar</span>
              </button>
              
              <button
                type="button"
                onClick={() => setIsSeptemberFiled(!isSeptemberFiled)}
                style={{
                  background: isSeptemberFiled ? "#FFFFFF" : C.navy,
                  color: isSeptemberFiled ? "#DC2626" : "#FFFFFF",
                  border: isSeptemberFiled ? "1px solid rgba(220,38,38,0.3)" : "none",
                  padding: "7px 14px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5
                }}
              >
                {isSeptemberFiled ? (
                  <>
                    <X size={13} />
                    <span>Undo</span>
                  </>
                ) : (
                  <>
                    <Check size={13} />
                    <span>Mark as filed</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 3. 4 Interactive KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
        {/* Card 1: Active cases */}
        <motion.div variants={itemVariants}>
          <div 
            onClick={() => onNavigate("analyzer")}
            style={{ 
              background: "#FFFFFF", 
              borderRadius: 12, 
              padding: "20px", 
              border: `1px solid ${C.border}`, 
              boxShadow: "0 2px 6px rgba(15,32,68,0.02)", 
              height: "100%",
              cursor: "pointer",
              transition: "all 0.18s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Active cases
              </div>
              <Scale size={16} style={{ color: C.teal }} />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: 8 }}>
              3
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
              <span><span style={{ color: "#D97706", fontWeight: 700 }}>1 needs review</span> · 2 in progress</span>
              <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.75rem" }}>View →</span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Reports generated */}
        <motion.div variants={itemVariants}>
          <div 
            onClick={() => onNavigate("compliance")}
            style={{ 
              background: "#FFFFFF", 
              borderRadius: 12, 
              padding: "20px", 
              border: `1px solid ${C.border}`, 
              boxShadow: "0 2px 6px rgba(15,32,68,0.02)", 
              height: "100%",
              cursor: "pointer",
              transition: "all 0.18s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Reports generated
              </div>
              <ShieldCheck size={16} style={{ color: C.teal }} />
            </div>
            <div style={{ fontSize: "2rem", fontWeight: 800, color: C.navy, fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1, marginBottom: 8 }}>
              2
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "#64748B", fontWeight: 600 }}>
              <span>Last: Mukwano PAYE review</span>
              <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.75rem" }}>Audit →</span>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Learning progress */}
        <motion.div variants={itemVariants}>
          <div 
            onClick={() => onNavigate("education")}
            style={{ 
              background: "#FFFFFF", 
              borderRadius: 12, 
              padding: "20px", 
              border: `1px solid ${C.border}`, 
              boxShadow: "0 2px 6px rgba(15,32,68,0.02)", 
              height: "100%",
              cursor: "pointer",
              transition: "all 0.18s ease"
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: "0.76rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                Learning progress
              </div>
              <BookOpen size={16} style={{ color: C.teal }} />
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
            style={{ 
              background: "#FFFFFF", 
              borderRadius: 12, 
              padding: "20px", 
              border: `1px solid ${C.border}`, 
              boxShadow: "0 2px 6px rgba(15,32,68,0.02)", 
              height: "100%", 
              cursor: "pointer", 
              transition: "all 0.18s ease" 
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = "translateY(0)"; }}
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
                type="button"
                onClick={() => onNavigate("analyzer")}
                style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
              >
                View all →
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

              {/* Row 1: Uganda Clays */}
              <div 
                onClick={() => onNavigate("analyzer")}
                style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center", cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(15,32,68,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
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
                  <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.78rem" }}>
                    Review AI findings →
                  </span>
                </div>
              </div>

              {/* Row 2: Mukwano */}
              <div 
                onClick={() => onNavigate("analyzer")}
                style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", borderBottom: `1px solid ${C.border}`, alignItems: "center", cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(15,32,68,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
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
                  <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.78rem" }}>
                    Send to client →
                  </span>
                </div>
              </div>

              {/* Row 3: EFRIS */}
              <div 
                onClick={() => onNavigate("compliance")}
                style={{ display: "grid", gridTemplateColumns: "1.6fr 0.6fr 0.9fr 1fr", padding: "14px 0", alignItems: "center", cursor: "pointer", transition: "background 0.12s" }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(15,32,68,0.02)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
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
                  <span style={{ color: C.teal, fontWeight: 700, fontSize: "0.78rem" }}>
                    Finish checklist →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Filing calendar with Interactive Month Engine */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Filing calendar</h3>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setIsAddDeadlineOpen(true)}
                  style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                >
                  <Plus size={13} style={{ color: C.teal }} />
                  <span>Add deadline</span>
                </button>
                <button
                  type="button"
                  onClick={handleExportIcs}
                  style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "5px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, color: C.navy, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
                  title="Download .ics file for Apple, Google, or Outlook Calendar"
                >
                  <Download size={13} style={{ color: C.teal }} />
                  <span>Export to calendar</span>
                </button>
              </div>
            </div>

            {/* Calendar Controls & Month */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: C.navy }}>
                {monthNamesFull[calMonth]} {calYear}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
                  <button 
                    type="button"
                    onClick={prevMonth} 
                    style={{ background: "#FFFFFF", border: "none", padding: "4px 8px", cursor: "pointer" }}
                    title="Previous month"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button 
                    type="button"
                    onClick={nextMonth} 
                    style={{ background: "#FFFFFF", border: "none", padding: "4px 8px", borderLeft: `1px solid ${C.border}`, cursor: "pointer" }}
                    title="Next month"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={goToToday} 
                  style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, padding: "4px 10px", borderRadius: 6, fontSize: "0.75rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Today
                </button>
              </div>
            </div>

            {/* Calendar Day Headers */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", textAlign: "center", fontSize: "0.72rem", fontWeight: 700, color: "#64748B", marginBottom: 8 }}>
              <div>MON</div><div>TUE</div><div>WED</div><div>THU</div><div>FRI</div><div>SAT</div><div>SUN</div>
            </div>

            {/* Dynamic Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center", fontSize: "0.8rem", color: C.navy, marginBottom: 16 }}>
              {/* Empty offset padding for days before the 1st of month */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`empty-${idx}`} style={{ padding: "8px 0", color: "#CBD5E1" }} />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                // Check if this date has a statutory or custom deadline
                const hasDeadline = deadlines.some(dl => dl.dayNumber === dayNum && dl.monthIndex === calMonth && dl.year === calYear);
                const isToday = dayNum === 15 && calMonth === 9 && calYear === 2026;
                const isSelected = selectedDay === dayNum;

                let bg = "transparent";
                let borderColor = "transparent";
                let textColor = C.navy;

                if (isToday) {
                  bg = "rgba(200, 146, 42, 0.12)";
                  borderColor = "#C8922A";
                  textColor = "#C8922A";
                } else if (hasDeadline) {
                  bg = "rgba(26, 123, 107, 0.08)";
                  borderColor = "rgba(26, 123, 107, 0.3)";
                  textColor = C.teal;
                } else if (isSelected) {
                  bg = C.offwhite;
                  borderColor = C.border;
                }

                return (
                  <div
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedDay(dayNum)}
                    style={{
                      padding: "8px 0",
                      background: bg,
                      border: `1px solid ${borderColor}`,
                      borderRadius: 8,
                      fontWeight: isToday || hasDeadline ? 800 : 500,
                      color: textColor,
                      cursor: "pointer",
                      position: "relative",
                      transition: "all 0.12s ease"
                    }}
                  >
                    {dayNum}
                    {hasDeadline && (
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: isToday ? "#C8922A" : C.teal, margin: "2px auto 0" }} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: 16, fontSize: "0.72rem", color: "#64748B", fontWeight: 600, marginBottom: 16 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C8922A" }} /> Due Today</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: C.teal }} /> Upcoming</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16A34A" }} /> Completed</span>
            </div>

            {/* Selected Day Info Callout */}
            {selectedDay && (
              <div style={{ background: C.offwhite, padding: "8px 12px", borderRadius: 6, marginBottom: 12, fontSize: "0.76rem", color: C.navy, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>
                  <strong>{selectedDay} {monthNamesFull[calMonth]} {calYear}:</strong>{" "}
                  {deadlines.find(dl => dl.dayNumber === selectedDay && dl.monthIndex === calMonth && dl.year === calYear)?.title || "No statutory filings scheduled for this date."}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}
                >
                  <X size={12} />
                </button>
              </div>
            )}

            {/* Coming Up Collapsible Section */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Coming up {!isComingUpExpanded && `(${deadlines.length - 1} more)`}
              </div>
              <button
                type="button"
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
              {deadlines.slice(0, isComingUpExpanded ? deadlines.length : 1).map((item) => (
                <div key={item.id} style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "10px 12px", 
                  background: item.completed ? "#F0FDF4" : item.highlight ? "rgba(200, 146, 42, 0.08)" : C.offwhite, 
                  borderRadius: 8,
                  border: `1px solid ${item.completed ? "rgba(34,197,94,0.3)" : item.highlight ? "rgba(200, 146, 42, 0.25)" : C.border}`,
                  transition: "all 0.15s ease"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 800, color: item.completed ? "#16A34A" : item.highlight ? "#C8922A" : "#64748B", minWidth: 46 }}>
                      {item.completed ? "DONE" : item.date}
                    </span>
                    <div>
                      <div style={{ 
                        fontSize: "0.8rem", 
                        fontWeight: 700, 
                        color: C.navy,
                        textDecoration: item.completed ? "line-through" : "none" 
                      }}>
                        {item.title}
                      </div>
                      <div style={{ fontSize: "0.68rem", color: "#64748B", marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: item.completed ? "#16A34A" : item.highlight ? "#D97706" : "#64748B" }}>
                      {item.completed ? "Completed" : item.badge}
                    </span>
                    
                    {/* Interactive Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleDeadline(item.id)}
                      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                      title={item.completed ? "Mark as pending" : "Mark as completed"}
                    >
                      {item.completed ? (
                        <CheckSquare size={16} style={{ color: "#16A34A" }} />
                      ) : (
                        <Square size={16} style={{ color: "#CBD5E1" }} />
                      )}
                    </button>

                    {/* Interactive Add to Calendar Icon */}
                    <button
                      type="button"
                      onClick={() => {
                        const monthPadded = String(item.monthIndex + 1).padStart(2, "0");
                        const dayPadded = String(item.dayNumber).padStart(2, "0");
                        setNewDeadlineTitle(item.title);
                        setNewDeadlineDate(`${item.year}-${monthPadded}-${dayPadded}`);
                        setNewDeadlineTax(item.taxType || "PAYE");
                        setIsAddDeadlineOpen(true);
                      }}
                      style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
                      title="Add to calendar"
                    >
                      <CalendarIcon size={14} style={{ color: "#94A3B8" }} />
                    </button>
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={16} style={{ color: C.teal }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Intelligence for you</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("intelligence")}
                style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
              >
                All updates →
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Card 1: ETA Engineering */}
              <div 
                onClick={() => onNavigate("library")}
                style={{ padding: "16px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = "#FFFFFF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offwhite; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: C.teal, background: "rgba(26,123,107,0.1)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                    TAT RULING · 2026
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Matches: Uganda Clays Case</span>
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: C.navy, marginBottom: 4 }}>
                  ETA Engineering Works &amp; Supply Co. v URA (TAT App No. 81/2024)
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  Tribunal confirms taxpayer carries strict burden of proof under Section 19. Disallowed IFMIS variance and unsupported loan added back to taxable income.
                </p>
              </div>

              {/* Card 2: Entebbe Golf Club */}
              <div 
                onClick={() => onNavigate("library")}
                style={{ padding: "16px", borderRadius: 10, background: C.offwhite, border: `1px solid ${C.border}`, cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = "#FFFFFF"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offwhite; }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.68rem", fontWeight: 800, color: C.gold, background: "rgba(200,146,42,0.1)", padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>
                    TAT RULING · ALLOWED
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>VAT on Memberships</span>
                </div>
                <div style={{ fontSize: "0.88rem", fontWeight: 800, color: C.navy, marginBottom: 4 }}>
                  Registered Trustees of Entebbe Golf Club v URA (TAT App No. 128/2025)
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748B", margin: 0, lineHeight: 1.4 }}>
                  Subscription &amp; membership fees of non-profit associations held not to constitute consideration for a taxable supply under Sections 4 &amp; 18 of the VAT Act.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Quick calculators */}
        <motion.div variants={itemVariants}>
          <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "22px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calculator size={16} style={{ color: C.teal }} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: C.navy, margin: 0 }}>Quick calculators</h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("calculators")}
                style={{ background: "transparent", border: "none", color: C.teal, fontWeight: 700, fontSize: "0.8rem", cursor: "pointer" }}
              >
                All calculators →
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              {pinnedCalculators.map((calc) => (
                <div 
                  key={calc.id}
                  onClick={() => onNavigate(calc.page)}
                  style={{ 
                    padding: "14px", 
                    borderRadius: 10, 
                    background: C.offwhite, 
                    border: `1px solid ${C.border}`, 
                    cursor: "pointer", 
                    transition: "all 0.15s ease" 
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = C.teal; e.currentTarget.style.background = "#FFFFFF"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.offwhite; }}
                >
                  <div style={{ fontSize: "0.85rem", fontWeight: 800, color: C.navy, marginBottom: 2 }}>{calc.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{calc.sub}</div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsPinModalOpen(true)}
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
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Plus size={14} />
              <span>Pin a calculator</span>
            </button>
          </div>
        </motion.div>

      </div>

      {/* 6. Official Portals Footer Section */}
      <motion.div variants={itemVariants}>
        <div style={{ background: "#FFFFFF", borderRadius: 12, padding: "20px 24px", border: `1px solid ${C.border}`, boxShadow: "0 2px 6px rgba(15,32,68,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 800, color: C.navy, margin: 0 }}>Official portals</h3>
            <span style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: 600 }}>Open in a new tab · Verified official Uganda portals</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {[
              { title: "URA portal login", sub: "File returns & pay", url: "https://ura.go.ug", badge: "URA" },
              { title: "EFRIS", sub: "E-invoicing & e-receipts", url: "https://efris.ura.go.ug", badge: "URA" },
              { title: "URA website", sub: "Public notices & guides", url: "https://ura.go.ug", badge: "URA" },
              { title: "Tax Appeals Tribunal", sub: "Appeals & cause lists", url: "https://tat.go.ug", badge: "TAT" },
              { title: "TAT judgments", sub: "Full-text decisions", url: "https://tat.go.ug", badge: "ULII" },
              { title: "NSSF Uganda", sub: "15% contributions portal", url: "https://nssfug.org", badge: "NSSF" },
              { title: "Ministry of Finance", sub: "Budget & tax acts", url: "https://finance.go.ug", badge: "MoFPED" },
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
                  transition: "all 0.15s ease"
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

      {/* MODAL 1: Add Custom Deadline */}
      <AnimatePresence>
        {isAddDeadlineOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 15, 30, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "24px",
                width: "100%",
                maxWidth: 440,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: `1px solid ${C.border}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, margin: 0 }}>Add Tax Deadline</h3>
                <button
                  type="button"
                  onClick={() => setIsAddDeadlineOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCustomDeadline} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                    Deadline Title
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Provisional Income Tax Q3"
                    value={newDeadlineTitle}
                    onChange={e => setNewDeadlineTitle(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      fontSize: "0.82rem",
                      outline: "none"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                      Tax Category
                    </label>
                    <select
                      value={newDeadlineTax}
                      onChange={e => setNewDeadlineTax(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        fontSize: "0.82rem",
                        outline: "none",
                        background: "#FFF"
                      }}
                    >
                      <option value="PAYE">PAYE</option>
                      <option value="VAT">VAT</option>
                      <option value="WHT">WHT (Withholding)</option>
                      <option value="Income Tax">Income Tax</option>
                      <option value="EFRIS">EFRIS Reconciliation</option>
                      <option value="NSSF">NSSF Contribution</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 700, color: C.navy, marginBottom: 4 }}>
                      Due Date
                    </label>
                    <input
                      type="date"
                      required
                      value={newDeadlineDate}
                      onChange={e => setNewDeadlineDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: 6,
                        border: `1px solid ${C.border}`,
                        fontSize: "0.82rem",
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsAddDeadlineOpen(false)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 6,
                      border: `1px solid ${C.border}`,
                      background: "#FFFFFF",
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      borderRadius: 6,
                      border: "none",
                      background: C.teal,
                      color: "#FFFFFF",
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Save Deadline
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Pin Calculators Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 15, 30, 0.45)",
            backdropFilter: "blur(4px)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}>
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              style={{
                background: "#FFFFFF",
                borderRadius: 12,
                padding: "24px",
                width: "100%",
                maxWidth: 420,
                boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
                border: `1px solid ${C.border}`
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 800, color: C.navy, margin: 0 }}>Pin Quick Calculator</h3>
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  style={{ background: "transparent", border: "none", cursor: "pointer", color: "#94A3B8" }}
                >
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { id: "wht", title: "Withholding Tax (WHT 6%)", sub: "Standard supply deductions" },
                  { id: "customs", title: "Vehicle Customs & Excise Duty", sub: "East African Community CET rates" },
                  { id: "stamp", title: "Stamp Duty & Property Transfer", sub: "1% transfer & legal document stamps" },
                  { id: "presumptive", title: "Small Business Presumptive Tax", sub: "Schedule 2 turnover rates" },
                ].map((item) => {
                  const isPinned = pinnedCalculators.some(p => p.id === item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isPinned) {
                          setPinnedCalculators(prev => prev.filter(p => p.id !== item.id));
                        } else {
                          setPinnedCalculators(prev => [...prev, { ...item, page: "calculators" }]);
                        }
                      }}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        border: `1px solid ${isPinned ? C.teal : C.border}`,
                        background: isPinned ? "rgba(26,123,107,0.06)" : C.offwhite,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        cursor: "pointer"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "0.83rem", fontWeight: 700, color: C.navy }}>{item.title}</div>
                        <div style={{ fontSize: "0.72rem", color: "#64748B" }}>{item.sub}</div>
                      </div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: isPinned ? C.teal : "#64748B" }}>
                        {isPinned ? "Pinned ✓" : "+ Pin"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                style={{
                  width: "100%",
                  marginTop: 16,
                  padding: "9px",
                  borderRadius: 6,
                  border: "none",
                  background: C.navy,
                  color: "#FFFFFF",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};
