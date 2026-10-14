"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { 
  LayoutDashboard, Settings, LogOut, ChevronDown, Scale, Search, 
  Car, Calculator, ShieldCheck, Mail, Check, Copy, CheckCircle2,
  FileText, Cpu, TrendingUp, Building2, Globe, Sparkles, 
  Menu, X, ArrowRight, Receipt, FileCheck
} from "lucide-react";
import { LegalPortal } from "./LegalPortal";

// Animated Counting Number Component
const CountingNumber: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1500 }) => {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const numericString = value.replace(/[^0-9]/g, "");
  const target = parseInt(numericString, 10) || 0;
  const suffix = value.replace(/[0-9,]/g, "");
  const hasCommas = value.includes(",");

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 150);
    if (typeof IntersectionObserver !== "undefined" && ref.current) {
      try {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setIsVisible(true);
            }
          },
          { threshold: 0.1 }
        );
        observer.observe(ref.current);
        return () => {
          clearTimeout(timer);
          observer.disconnect();
        };
      } catch {
        setIsVisible(true);
      }
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = progress * (2 - progress);
      const currentVal = Math.floor(easeProgress * target);
      
      setCurrent(currentVal);
      
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    
    requestAnimationFrame(step);
  }, [isVisible, target, duration]);

  const formatNumber = (num: number) => {
    if (hasCommas) {
      return num.toLocaleString();
    }
    return num.toString();
  };

  return (
    <span ref={ref}>
      {`${formatNumber(current)}${suffix}`}
    </span>
  );
};

interface SiteSettings {
  stat_cases: string;
  stat_time_saved: string;
  stat_practitioners: string;
  stat_calculators: string;
  hero_badge_text: string;
  hero_title_line1: string;
  hero_title_line2: string;
  hero_title_line3: string;
  hero_subtitle: string;
  topbar_text: string;
  topbar_email: string;
}

const DEFAULTS: SiteSettings = {
  stat_cases: "4,200+",
  stat_time_saved: "85%",
  stat_practitioners: "350+",
  stat_calculators: "6",
  hero_badge_text: "Built for Uganda Tax & Customs Professionals",
  hero_title_line1: "The tax intelligence",
  hero_title_line2: "platform your practice",
  hero_title_line3: "actually needs",
  hero_subtitle: "Statutory case analysis, TAT precedent research, live tax & import calculators, and compliance checking tools — purpose-built for Uganda's tax ecosystem.",
  topbar_text: "Engineered for Uganda's Tax & Customs Ecosystem · FY 2025/26 Updated",
  topbar_email: "hello@taxwise.cloud",
};

interface LandingPageProps {
  onGetStarted: () => void;
  onSignIn: () => void;
  onNavigate?: (page: string) => void;
  dbUser?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    plan: string;
  } | null;
  onSignOut?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ 
  onGetStarted, 
  onSignIn, 
  onNavigate, 
  dbUser, 
  onSignOut 
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taxToolsOpen, setTaxToolsOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [dynamicStats, setDynamicStats] = useState({
    cases: "120",
    timeSaved: "85%",
    practitioners: "35",
    calculators: "6"
  });

  const [legalOpen, setLegalOpen] = useState(false);
  const [legalTab, setLegalTab] = useState<"privacy" | "terms" | "blog">("privacy");

  // Hero interactive calculator mode
  const [heroCalcTab, setHeroCalcTab] = useState<"paye" | "vat" | "customs">("paye");

  // Hero PAYE Calculator state
  const [grossPaye, setGrossPaye] = useState<number>(3500000);
  const NSSF_RATE = 0.05;

  function calcPaye(income: number): number {
    let tax = 0;
    if (income > 235000) tax += (Math.min(income, 335000) - 235000) * 0.10;
    if (income > 335000) tax += (Math.min(income, 410000) - 335000) * 0.20;
    if (income > 410000) tax += (income - 410000) * 0.30;
    if (income > 10000000) tax += (income - 10000000) * 0.10;
    return Math.round(tax);
  }

  function money(n: number): string {
    return "UGX " + Math.round(n).toLocaleString("en-US");
  }

  function pct(part: number, whole: number): string {
    return whole ? ((part / whole) * 100).toFixed(1) + "%" : "0%";
  }

  const currentIncome = Math.max(0, Number(grossPaye) || 0);
  const currentNssf = Math.round(currentIncome * NSSF_RATE);
  const currentPaye = calcPaye(currentIncome);
  const currentNet = currentIncome - currentNssf - currentPaye;
  const currentPrate = pct(currentPaye, currentIncome);
  const currentTrate = pct(currentNssf + currentPaye, currentIncome);

  // Hero VAT Calculator state
  const [vatAmount, setVatAmount] = useState<number>(10000000); // 10M UGX
  const [vatMode, setVatMode] = useState<"exclusive" | "inclusive">("exclusive");
  const vatCalculated = vatMode === "exclusive" 
    ? Math.round(vatAmount * 0.18) 
    : Math.round(vatAmount - (vatAmount / 1.18));
  const whtCalculated = Math.round(vatAmount * 0.06); // 6% WHT

  // Hero Customs Calculator state
  const [cifUsd, setCifUsd] = useState<number>(8500); // 8,500 USD CIF
  const [vehicleYear, setVehicleYear] = useState<number>(2017);
  const USD_UGX = 3780;
  const cifUgx = cifUsd * USD_UGX;
  const vehicleAge = Math.max(0, 2026 - vehicleYear);
  const importDuty = Math.round(cifUgx * 0.25); // 25% EAC CET
  const envLevyRate = vehicleAge > 8 ? 0.35 : (vehicleAge > 5 ? 0.20 : 0.0);
  const envLevy = Math.round(cifUgx * envLevyRate);
  const vatCustoms = Math.round((cifUgx + importDuty) * 0.18);
  const whtCustoms = Math.round(cifUgx * 0.06);
  const totalCustomsTax = importDuty + envLevy + vatCustoms + whtCustoms;

  // Precedent Search & Interactive Workflow State
  const [precedentSearch, setPrecedentSearch] = useState<string>("");
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<number>(1);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [copiedCitation, setCopiedCitation] = useState<string | null>(null);
  const [expandedPrecedentId, setExpandedPrecedentId] = useState<string | null>(null);
  const [copiedObjection, setCopiedObjection] = useState<boolean>(false);

  const menuBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && mobileOpen) {
        setMobileOpen(false);
        menuBtnRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen]);

  const scrollToId = (id: string) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
        return;
      }
    }
    if (id === "pricing" && onNavigate) {
      onNavigate("pricing");
    }
  };

  const handleFooterLinkClick = (link: string) => {
    if (link === "hello@taxwise.cloud") {
      window.location.href = `mailto:${settings.topbar_email || "hello@taxwise.cloud"}`;
      return;
    }
    if (link === "Contact Us") {
      window.location.href = `mailto:${settings.topbar_email || "hello@taxwise.cloud"}`;
      return;
    }
    if (link === "Privacy Policy") {
      setLegalTab("privacy");
      setLegalOpen(true);
      return;
    }
    if (link === "Terms of Use" || link === "Terms of Service") {
      setLegalTab("terms");
      setLegalOpen(true);
      return;
    }
    if (link === "Legal Blog") {
      setLegalTab("blog");
      setLegalOpen(true);
      return;
    }

    const pageMap: Record<string, string> = {
      "Case Analyzer": "analyzer",
      "Compliance Check": "compliance",
      "TAT Precedents": "library",
      "Client Reports": "analyzer",
      "PAYE Calculator": "calculators",
      "VAT Calculator": "calculators",
      "WHT Rates Tool": "calculators",
      "Import Duty": "calculators",
      "Pricing Plans": "pricing",
      "Knowledge Base": "education"
    };

    const targetPage = pageMap[link];
    if (targetPage && onNavigate) {
      onNavigate(targetPage);
    } else {
      onGetStarted();
    }
  };

  useEffect(() => {
    const fetchSettingsAndStats = async () => {
      try {
        const { data } = await supabase.from("site_settings").select("key,value");
        let mergedSettings = { ...DEFAULTS };
        if (data && data.length > 0) {
          const map: Partial<SiteSettings> = {};
          data.forEach(({ key, value }: { key: string; value: string }) => {
            (map as Record<string, string>)[key] = value;
          });
          mergedSettings = { ...DEFAULTS, ...map };
          setSettings(mergedSettings);
        }

        let userCasesCount = 0;
        let registeredUsersCount = 0;
        let tatCasesCount = 0;

        try {
          const [casesRes, usersRes, tatRes] = await Promise.all([
            supabase.from("cases").select("*", { count: "exact", head: true }),
            supabase.from("users").select("*", { count: "exact", head: true }),
            supabase.from("tat_cases").select("*", { count: "exact", head: true })
          ]);
          userCasesCount = casesRes.count || 0;
          registeredUsersCount = usersRes.count || 0;
          tatCasesCount = tatRes.count || 0;
        } catch (e) {
          console.warn("Live count fetch warning, using defaults:", e);
        }

        const calculatedCases = userCasesCount + tatCasesCount;
        const calculatedPractitioners = registeredUsersCount;

        setDynamicStats({
          cases: `${calculatedCases > 0 ? calculatedCases.toLocaleString() : "140"}`,
          timeSaved: mergedSettings.stat_time_saved || "85%",
          practitioners: `${calculatedPractitioners > 0 ? calculatedPractitioners.toLocaleString() : "350+"}`,
          calculators: mergedSettings.stat_calculators || "6"
        });
      } catch {
        // Fallback to default
      }
    };
    fetchSettingsAndStats();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const precedentsData = [
    {
      id: "uganda-clays",
      title: "Uganda Clays Limited v. Uganda Revenue Authority",
      citation: "TAT Application No. 012 of 2023 · Rulings 2024",
      tag: "VAT & eFRIS Reconciliation",
      holding: "The Tribunal set aside URA's UGX 2.82B assessment. Held that validly validated eFRIS document numbers and reconciled purchase ledgers satisfy input VAT statutory requirements under Sections 28 & 31 VATA.",
      legalRatio: "A taxpayer cannot be penalized for downstream supplier system non-compliance where valid fiscal receipts and verified banking disbursements demonstrate genuine commercial transactions.",
      tacticalAdvice: "Cite when URA disallows input tax credits due to third-party supplier eFRIS discrepancies beyond the buyer's control.",
      taxpayerWin: "89% Win Rate",
      statute: "Sec 28 & 31 VATA · Sec 22 ITA",
    },
    {
      id: "edward-mwanje",
      title: "Edward Mwanje & Co. v. Uganda Revenue Authority",
      citation: "TAT Application No. 034 of 2024 · Judgment 2025",
      tag: "TAT Jurisdiction & Late Appeals",
      holding: "TAT held zero jurisdiction to entertain late objections without an explicit statutory extension application filed within 30 days under Section 14(2) of the Tax Appeals Tribunal Act.",
      legalRatio: "The 30-day objection timeline is strictly jurisdictional. The Tribunal lacks statutory discretion to waive delays unless a formal extension summons is registered prior to expiration.",
      tacticalAdvice: "Always register a protective notice of appeal or formal extension request with the Registrar prior to Day 30.",
      taxpayerWin: "Procedural Strictness",
      statute: "Sec 14(2) TAT Act · Rule 12 Rules",
    },
    {
      id: "tullow-uganda",
      title: "Tullow Uganda Operations Pty v. Uganda Revenue Authority",
      citation: "TAT Application No. 004 of 2011 · Precedent Authority",
      tag: "Capital Deductions & Exploration Costs",
      holding: "Pre-production statutory exploration and evaluation expenses qualify as deductible capital expenditure, preventing arbitrary taxable base disallowances.",
      legalRatio: "Capital investment incurred directly towards extractive exploration establishes statutory cost base deductions under the Sixth Schedule of the Income Tax Act.",
      tacticalAdvice: "Applicable to industrial, energy, and infrastructure clients facing arbitrary disallowance of pre-operational feasibility and setup costs.",
      taxpayerWin: "Binding Precedent",
      statute: "Part IX & 6th Schedule ITA",
    },
    {
      id: "vivo-energy",
      title: "Vivo Energy Uganda Ltd v. Commissioner General, URA",
      citation: "High Court Commercial Division HCCA No. 018 of 2022",
      tag: "WHT on Management & Service Fees",
      holding: "Management and technical service fees paid to non-resident entities are subject to bilateral Double Taxation Agreements (DTA) rate ceilings over domestic standard rates.",
      legalRatio: "By virtue of Section 88 of the Income Tax Act, international treaty provisions override domestic statutory withholding tax rates where the foreign payee is a genuine tax resident.",
      tacticalAdvice: "Deploy this citation in cross-border group recharge disputes and technical assistance agreement audits.",
      taxpayerWin: "DTA Precedence",
      statute: "Sec 83 & 88 Income Tax Act",
    }
  ];

  const filteredPrecedents = precedentsData.filter(p => {
    if (!precedentSearch.trim()) return true;
    const q = precedentSearch.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.tag.toLowerCase().includes(q) ||
      p.statute.toLowerCase().includes(q) ||
      p.holding.toLowerCase().includes(q)
    );
  });

  const plans = [
    { 
      name: "Starter", 
      price: "Free", 
      period: "Forever", 
      desc: "Essential tools for students, independent accountants, and quick checks.",
      features: [
        "5 Case analyses per month", 
        "Basic TAT library precedent search", 
        "Live PAYE, VAT & WHT calculators", 
        "Vehicle customs duty estimator", 
        "Community email support"
      ], 
      cta: "Get Started Free", 
      popular: false,
      comingSoon: false
    },
    { 
      name: "Professional", 
      price: "Coming Soon", 
      period: "/ month", 
      desc: "Designed for active tax consultants, auditors, and finance managers.",
      features: [
        "Unlimited case law & notice analyses", 
        "Full TAT 68+ precedent archive with holdings", 
        "All 6 statutory tax & import calculators", 
        "eFRIS, VAT & PAYE statutory compliance checklists", 
        "Downloadable PDF advisory defense briefs", 
        "Priority live support"
      ], 
      cta: "Coming Soon", 
      popular: false,
      comingSoon: true,
      badge: "COMING SOON"
    },
    { 
      name: "Firm & Enterprise", 
      price: "Coming Soon", 
      period: "/ month", 
      desc: "Complete statutory intelligence engine for multi-partner accounting & legal practices.",
      features: [
        "Everything in Professional", 
        "Up to 8 team member seats", 
        "Practice-wide precedent sharing & notes", 
        "Dedicated firm account onboarding", 
        "ICPAU CPD-eligible certificates", 
        "Custom API & integration support"
      ], 
      cta: "Coming Soon", 
      popular: false,
      comingSoon: true,
      badge: "COMING SOON"
    },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "var(--landing-bg)", color: "var(--landing-text)", lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>

      {/* DYNAMIC SCROLL PROGRESS BAR */}
      <div style={{ position: "fixed", top: 0, left: 0, height: "3.5px", background: "#1A7B6B", width: `${scrollProgress}%`, zIndex: 1000, transition: "width 0.1s ease-out", pointerEvents: "none" }} />

      {/* TOP ANNOUNCEMENT BAR */}
      <div className="tw-topbar" style={{ background: "#0F2044", padding: "8px 5%", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".72rem", color: "#F8FAFC", fontWeight: 500, letterSpacing: "0.04em", borderBottom: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 6 }}>
        <span className="tw-topbar-tagline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Globe size={13} style={{ color: "#C8922A", flexShrink: 0 }} />
          <span>{settings.topbar_text}</span>
        </span>
        <div className="tw-topbar-actions" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="tw-topbar-email" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#CBD5E1" }}>
            <Mail size={13} style={{ color: "#1A7B6B", flexShrink: 0 }} />
            <span>{settings.topbar_email}</span>
          </span>
          <button type="button" onClick={onGetStarted} style={{ color: "#C8922A", background: "none", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: ".72rem", textDecoration: "underline", whiteSpace: "nowrap" }}>
            Start Free Trial →
          </button>
        </div>
      </div>

      {/* STICKY MAIN NAVIGATION */}
      <nav 
        className={isScrolled ? "tw-nav-sticky-scrolled" : ""}
        style={{ 
          background: isScrolled ? undefined : "var(--landing-surface)", 
          borderBottom: "1px solid var(--landing-border)", 
          position: "sticky", 
          top: 0, 
          zIndex: 300, 
          backdropFilter: "blur(16px)", 
          WebkitBackdropFilter: "blur(16px)",
          transition: "all 0.25s ease"
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <button 
            type="button"
            onClick={onGetStarted} 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: "var(--landing-text)", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginRight: 32, flexShrink: 0, fontWeight: 800, padding: 0 }}
          >
            <div style={{ width: 11, height: 11, background: "#C8922A", borderRadius: 3, transform: "rotate(45deg)", flexShrink: 0, boxShadow: "0 0 10px rgba(200,146,42,0.4)" }} />
            Tax<span style={{ color: "#1A7B6B" }}>Wise</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="tw-nav-desktop" style={{ display: "flex", alignItems: "center", flex: 1, gap: 4, marginLeft: 8 }}>
            {/* Grouped Tax Tools Menu */}
            <div className="tw-dd" style={{ position: "relative" }} onMouseLeave={() => setTaxToolsOpen(false)}>
              <button
                type="button"
                className="tw-nav-link"
                onClick={() => setTaxToolsOpen(prev => !prev)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "var(--landing-text)", fontSize: ".84rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
              >
                <span>Tax Tools</span>
                <ChevronDown size={13} style={{ transform: taxToolsOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
              <div 
                className={`tw-dropdown ${taxToolsOpen ? "force-open" : ""}`} 
                style={{ 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  background: "var(--landing-surface)", 
                  borderRadius: "0 0 10px 10px", 
                  boxShadow: "0 16px 36px rgba(0,0,0,0.12)", 
                  minWidth: 290, 
                  zIndex: 400, 
                  border: "1px solid var(--landing-border)", 
                  borderTop: "3px solid #1A7B6B", 
                  padding: "8px",
                  ...(taxToolsOpen ? { opacity: 1, visibility: "visible", transform: "translateY(0)", pointerEvents: "auto" } : {})
                }}
              >
                {[
                  { name: "Case Analyzer", desc: "Evaluate URA audit assessments & objection briefs", page: "analyzer", icon: <Scale size={17} style={{ color: "#1A7B6B" }} /> },
                  { name: "Tax & Duty Calculators", desc: "PAYE, VAT, Corporate, Rental & Import duties", page: "calculators", icon: <Calculator size={17} style={{ color: "#1A7B6B" }} /> },
                  { name: "Compliance Review", desc: "Statutory filing deadlines & penalty mitigation", page: "compliance", icon: <ShieldCheck size={17} style={{ color: "#C8922A" }} /> },
                  { name: "Uganda Tax Intelligence", desc: "Legal updates, treaty tax rates & dispute guides", page: "intelligence", icon: <TrendingUp size={17} style={{ color: "#0F2044" }} /> },
                ].map((t) => (
                  <button 
                    key={t.name} 
                    type="button"
                    onClick={() => {
                      setTaxToolsOpen(false);
                      if (onNavigate) onNavigate(t.page);
                      else onGetStarted();
                    }} 
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 8, width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "var(--landing-bg)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "none"; }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: ".835rem", fontWeight: 700, color: "var(--landing-text)" }}>{t.name}</div>
                      <div style={{ fontSize: ".71rem", color: "var(--landing-muted)", marginTop: 2, lineHeight: 1.3 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Precedents Link */}
            <button
              className="tw-nav-link"
              onClick={() => scrollToId("precedents-section")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "var(--landing-text)", fontSize: ".84rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              TAT Precedents
            </button>

            {/* Direct Workflow Link */}
            <button
              className="tw-nav-link"
              onClick={() => scrollToId("workflow-section")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "var(--landing-text)", fontSize: ".84rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              3-Step Workflow
            </button>

            {/* Direct Calculators Link */}
            <button
              className="tw-nav-link"
              onClick={() => scrollToId("calculators-showcase")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "var(--landing-text)", fontSize: ".84rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              Calculators
            </button>

            {/* Pricing Link */}
            <button
              className="tw-nav-link"
              onClick={() => scrollToId("pricing-section")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "var(--landing-text)", fontSize: ".84rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              Pricing
            </button>
          </div>

          {/* Desktop Nav Actions */}
          <div className="tw-nav-desktop" style={{ display: "flex", alignItems: "center", gap: 14, marginLeft: "auto" }}>
            {dbUser ? (
              <div className="tw-dd" style={{ position: "relative" }}>
                <button
                  onClick={() => {
                    if (onNavigate) onNavigate("dashboard");
                    else onGetStarted();
                  }}
                  className="tw-btn-hover"
                  style={{
                    background: "#1A7B6B",
                    color: "white",
                    padding: "9px 20px",
                    borderRadius: 8,
                    fontSize: ".835rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(26,123,107,0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>Dashboard</span>
                  <ChevronDown size={14} />
                </button>
                <div className="tw-dropdown-container">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px 12px",
                    borderBottom: "1px solid var(--landing-border)",
                    marginBottom: "6px"
                  }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #1A7B6B 0%, #C8922A 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 6px rgba(26,123,107,0.2)",
                      flexShrink: 0
                    }}>
                      {dbUser.full_name ? dbUser.full_name[0].toUpperCase() : "U"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--landing-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                        {dbUser.full_name}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "var(--landing-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dbUser.email || "Professional"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => { if (onNavigate) onNavigate("dashboard"); }} className="tw-dropdown-item">
                    <LayoutDashboard size={15} />
                    <span>Go to Dashboard</span>
                  </button>
                  <button onClick={() => { if (onNavigate) onNavigate("settings"); }} className="tw-dropdown-item">
                    <Settings size={15} />
                    <span>Settings</span>
                  </button>
                  <button onClick={onSignOut} className="tw-dropdown-item-logout">
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button 
                  onClick={onSignIn} 
                  className="tw-nav-link" 
                  style={{ color: "var(--landing-text)", fontSize: ".835rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s" }}
                >
                  Sign In
                </button>
                <button 
                  onClick={onGetStarted} 
                  className="tw-btn-hover" 
                  style={{ 
                    background: "#1A7B6B", 
                    color: "white", 
                    padding: "10px 22px", 
                    borderRadius: 8, 
                    fontSize: ".835rem", 
                    fontWeight: 700, 
                    border: "none", 
                    cursor: "pointer", 
                    whiteSpace: "nowrap", 
                    fontFamily: "inherit", 
                    boxShadow: "0 4px 14px rgba(26,123,107,0.25)" 
                  }}
                >
                  Start Free Trial →
                </button>
              </>
            )}
          </div>

          {/* Accessible Mobile Menu Button */}
          <button 
            ref={menuBtnRef}
            id="menuBtn"
            className="tw-hamburger" 
            onClick={() => setMobileOpen(v => !v)} 
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{
              display: "none",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: mobileOpen ? "rgba(26, 123, 107, 0.12)" : "var(--landing-surface)",
              border: mobileOpen ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
              borderRadius: 8,
              color: "var(--landing-text)",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{mobileOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <nav 
          id="mainNav"
          className={`tw-main-nav ${mobileOpen ? "open" : ""}`}
          style={{ 
            display: mobileOpen ? "block" : "none",
            background: "var(--landing-surface)", 
            borderTop: "1px solid var(--landing-border)", 
            padding: "16px 5%", 
            borderBottom: "1px solid var(--landing-border)" 
          }}
        >
          {dbUser && (
            <div style={{ padding: "8px 0 16px", borderBottom: "1px solid var(--landing-border)", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "var(--landing-muted)" }}>Signed in as</span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--landing-text)" }}>{dbUser.full_name}</div>
            </div>
          )}
          {[
            { label: "Case Analyzer", page: "analyzer" },
            { label: "TAT Case Precedents Library", page: "library" },
            { label: "Tax & Customs Calculators", page: "calculators" },
            { label: "Uganda Tax Intelligence", page: "intelligence" },
            { label: "Compliance Checklists", page: "compliance" },
            { label: "Learning & Education Hub", page: "education" },
            { label: "Pricing Plans", page: "pricing" },
          ].map(item => (
            <button 
              key={item.label} 
              onClick={() => {
                setMobileOpen(false);
                if (onNavigate) onNavigate(item.page);
                else onGetStarted();
              }} 
              className="tw-mobile-link" 
              style={{ display: "block", padding: "12px 0", color: "var(--landing-text)", background: "none", border: "none", fontSize: ".9rem", fontWeight: 600, borderBottom: "1px solid var(--landing-border)", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}
            >
              {item.label}
            </button>
          ))}
          {!dbUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <button 
                onClick={() => { setMobileOpen(false); onSignIn(); }} 
                style={{ display: "block", padding: "11px 16px", color: "var(--landing-text)", background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 6, fontSize: ".875rem", fontWeight: 600, width: "100%", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMobileOpen(false); onGetStarted(); }} 
                style={{ display: "block", padding: "11px 16px", color: "white", background: "#1A7B6B", border: "none", borderRadius: 6, fontSize: ".875rem", fontWeight: 700, width: "100%", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}
              >
                Start Free Trial →
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setMobileOpen(false); if (onSignOut) onSignOut(); }} 
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#DC2626", background: "none", border: "none", fontSize: ".92rem", fontWeight: 700, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </nav>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          1. SPLIT HERO SECTION (PROPOSITION ON LEFT, CALCULATOR ON RIGHT)
      ══════════════════════════════════════════════════════════════ */}
      <section className="tw-section" style={{ padding: "64px 5% 72px", background: "var(--landing-bg)", borderBottom: "1px solid var(--landing-border)", position: "relative", overflow: "hidden" }}>
        {/* Subtle decorative background gradient */}
        <div style={{ position: "absolute", top: "-100px", right: "-50px", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(26, 123, 107, 0.06) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "-50px", left: "10%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(200, 146, 42, 0.05) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1240, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div className="tw-split-hero">
            
            {/* LEFT COLUMN: Authority Proposition & Proof */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              {/* Pill Tag */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(26, 123, 107, 0.08)", border: "1px solid rgba(26, 123, 107, 0.25)", color: "#1A7B6B", fontSize: ".74rem", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 24, width: "fit-content" }}>
                <Sparkles size={13} style={{ color: "#C8922A" }} />
                <span>Uganda Statutory Tax Intelligence · FY 2025/26</span>
              </div>

              {/* Main Headline */}
              <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(2.2rem, 3.8vw, 3.4rem)", fontWeight: 800, color: "var(--landing-text)", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
                Statutory Tax Defense &amp; Precision Calculators for Uganda.
              </h1>

              {/* Subheadline */}
              <p style={{ fontSize: "1.05rem", color: "var(--landing-muted)", lineHeight: 1.68, maxWidth: 560 }}>
                Instant PAYE, VAT, and vehicle customs valuations backed by 68+ binding Tax Appeals Tribunal (TAT) rulings, ITA Cap 340, and VATA Cap 349 statutory provisions.
              </p>

              {/* CTA Row */}
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center", marginTop: 4 }}>
                {dbUser ? (
                  <button 
                    onClick={() => { if (onNavigate) onNavigate("dashboard"); else onGetStarted(); }}
                    style={{ background: "#1A7B6B", color: "#FFFFFF", padding: "14px 28px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(26,123,107,0.3)", transition: "all 0.2s" }}
                  >
                    <span>Go to Dashboard</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <>
                    <button 
                      onClick={onGetStarted}
                      style={{ background: "#1A7B6B", color: "#FFFFFF", padding: "14px 28px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(26,123,107,0.3)", transition: "all 0.2s" }}
                    >
                      <span>Start 14-Day Free Trial</span>
                      <ArrowRight size={16} />
                    </button>
                    <button 
                      onClick={() => scrollToId("precedents-section")}
                      style={{ background: "var(--landing-surface)", color: "var(--landing-text)", padding: "14px 24px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "1.5px solid var(--landing-border)", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      Browse Precedents ↓
                    </button>
                  </>
                )}
              </div>

              {/* Trust Strip */}
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", fontSize: ".76rem", color: "var(--landing-muted)", fontWeight: 600, borderTop: "1px solid var(--landing-border)", paddingTop: 20, marginTop: 10 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} style={{ color: "#1A7B6B" }} />
                  <span>Verified TAT Tribunal Coverage (2015–2026)</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Building2 size={16} style={{ color: "#C8922A" }} />
                  <span>ICPAU CPD-Eligible Training</span>
                </span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Scale size={16} style={{ color: "#0F2044" }} />
                  <span>ITA Cap 340 · VATA Cap 349</span>
                </span>
              </div>

              {/* Mini Client Testimonial Pill */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--landing-surface)", border: "1px solid var(--landing-border)", padding: "10px 14px", borderRadius: 12, marginTop: 4 }}>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#1A7B6B", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".75rem", fontWeight: 700, flexShrink: 0 }}>
                  SN
                </div>
                <div style={{ fontSize: ".76rem", color: "var(--landing-text)", lineHeight: 1.4 }}>
                  <span style={{ fontStyle: "italic" }}>&ldquo;TaxWise retrieved a vital TAT precedent in 4 seconds during our URA objection.&rdquo;</span>
                  <div style={{ fontWeight: 700, color: "var(--landing-muted)", fontSize: ".7rem", marginTop: 2 }}>
                    Sarah Nakato — Senior Tax Consultant, Kampala
                  </div>
                </div>
              </div>
            </motion.div>

            {/* RIGHT COLUMN: Interactive Live Calculator Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              style={{
                background: "var(--landing-surface)",
                border: "1px solid var(--landing-border)",
                borderRadius: 20,
                boxShadow: "0 20px 40px -15px rgba(15, 32, 68, 0.1), 0 0 0 1px var(--landing-border)",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Card Header & Tab Switcher */}
              <div style={{ background: "var(--landing-bg)", borderBottom: "1px solid var(--landing-border)", padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#16A34A", boxShadow: "0 0 8px rgba(22, 163, 74, 0.6)" }} />
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)" }}>Interactive Tool Preview</span>
                </div>

                {/* Sub-tabs for the hero card */}
                <div style={{ display: "flex", gap: 4, background: "var(--landing-surface)", padding: "3px", borderRadius: 8, border: "1px solid var(--landing-border)" }}>
                  {[
                    { id: "paye", label: "PAYE", icon: <Calculator size={12} /> },
                    { id: "vat", label: "VAT 18%", icon: <Receipt size={12} /> },
                    { id: "customs", label: "Customs", icon: <Car size={12} /> },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setHeroCalcTab(tab.id as any)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: heroCalcTab === tab.id ? "rgba(26, 123, 107, 0.12)" : "transparent",
                        color: heroCalcTab === tab.id ? "#1A7B6B" : "var(--landing-muted)",
                        fontSize: ".72rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.15s ease"
                      }}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CARD BODY: ANIMATED TABS */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={heroCalcTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.22, ease: "easeOut" }}
                >
                  {/* TAB 1 - LIVE PAYE */}
                  {heroCalcTab === "paye" && (
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <label htmlFor="hero-gross" style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)" }}>
                            Gross Monthly Income
                          </label>
                          <span style={{ fontSize: ".82rem", fontWeight: 800, color: "#1A7B6B", fontFamily: "'JetBrains Mono', monospace" }}>
                            {money(currentIncome)}
                          </span>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: 14, fontSize: ".76rem", color: "var(--landing-muted)", fontWeight: 700, pointerEvents: "none" }}>
                            UGX
                          </span>
                          <input
                            id="hero-gross"
                            type="number"
                            min="0"
                            step="50000"
                            value={grossPaye}
                            onChange={(e) => setGrossPaye(Math.max(0, Number(e.target.value) || 0))}
                            style={{
                              width: "100%",
                              padding: "10px 14px 10px 50px",
                              background: "var(--landing-bg)",
                              border: "1.5px solid var(--landing-border)",
                              borderRadius: 10,
                              fontSize: ".9rem",
                              fontWeight: 700,
                              color: "var(--landing-text)",
                              fontFamily: "'JetBrains Mono', monospace",
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>

                      {/* Range Slider */}
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "var(--landing-muted)", marginBottom: 6 }}>
                          <span>Slide Income Level</span>
                          <span style={{ color: "#1A7B6B", fontWeight: 700 }}>0 to 20,000,000+</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20000000"
                          step="50000"
                          value={grossPaye}
                          onChange={(e) => setGrossPaye(Math.max(0, Number(e.target.value) || 0))}
                          className="tw-slider"
                          style={{
                            width: "100%",
                            background: `linear-gradient(to right, #1A7B6B ${Math.min(100, (grossPaye / 20000000) * 100)}%, var(--landing-border) ${Math.min(100, (grossPaye / 20000000) * 100)}%)`
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".65rem", color: "var(--landing-muted)", marginTop: 4 }}>
                          <span>0</span>
                          <span>5M</span>
                          <span style={{ color: "#C8922A", fontWeight: 600 }}>10M (Surcharge)</span>
                          <span>20M</span>
                        </div>
                      </div>

                      {/* Preset Quick Chips */}
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {[
                          { label: "1.5M", val: 1500000 },
                          { label: "3.5M", val: 3500000 },
                          { label: "6.5M", val: 6500000 },
                          { label: "12M Exec", val: 12000000 },
                        ].map(p => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={() => setGrossPaye(p.val)}
                            style={{
                              padding: "5px 11px",
                              borderRadius: 6,
                              fontSize: ".7rem",
                              fontWeight: 600,
                              cursor: "pointer",
                              background: grossPaye === p.val ? "rgba(26, 123, 107, 0.15)" : "var(--landing-bg)",
                              border: grossPaye === p.val ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
                              color: grossPaye === p.val ? "#1A7B6B" : "var(--landing-text)",
                              transition: "all 0.15s ease",
                              boxShadow: grossPaye === p.val ? "0 2px 6px rgba(26, 123, 107, 0.15)" : "none"
                            }}
                          >
                            UGX {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Net Take-Home Highlight Card */}
                      <div style={{ background: "rgba(26, 123, 107, 0.08)", border: "1.5px solid rgba(26, 123, 107, 0.25)", borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: ".7rem", color: "#1A7B6B", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "block" }}>
                            Net Take-Home Pay
                          </span>
                          <strong style={{ fontSize: "1.3rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                            {money(currentNet)}
                          </strong>
                          <span style={{ fontSize: ".68rem", color: "var(--landing-muted)" }}>
                            After statutory PAYE tax &amp; employee NSSF
                          </span>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: ".65rem", color: "var(--landing-muted)", display: "block" }}>Statutory Rate</span>
                          <span style={{ fontSize: "1rem", fontWeight: 800, color: "#1A7B6B", fontFamily: "'JetBrains Mono', monospace" }}>
                            {currentTrate}
                          </span>
                          <span style={{ fontSize: ".62rem", color: "var(--landing-muted)", display: "block" }}>PAYE: {currentPrate}</span>
                        </div>
                      </div>

                      {/* Breakdown Metrics */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 8, padding: "10px 12px" }}>
                          <span style={{ fontSize: ".68rem", color: "#1A7B6B", fontWeight: 700, display: "block" }}>Monthly PAYE Tax</span>
                          <strong style={{ fontSize: ".92rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {money(currentPaye)}
                          </strong>
                        </div>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 8, padding: "10px 12px" }}>
                          <span style={{ fontSize: ".68rem", color: "#C8922A", fontWeight: 700, display: "block" }}>Employee NSSF (5%)</span>
                          <strong style={{ fontSize: ".92rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {money(currentNssf)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2 - LIVE VAT & WHT */}
                  {heroCalcTab === "vat" && (
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                          <label htmlFor="hero-vat" style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)" }}>
                            Commercial Invoice Value
                          </label>
                          <span style={{ fontSize: ".82rem", fontWeight: 800, color: "#1A7B6B", fontFamily: "'JetBrains Mono', monospace" }}>
                            {money(vatAmount)}
                          </span>
                        </div>
                        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                          <span style={{ position: "absolute", left: 14, fontSize: ".76rem", color: "var(--landing-muted)", fontWeight: 700, pointerEvents: "none" }}>
                            UGX
                          </span>
                          <input
                            id="hero-vat"
                            type="number"
                            min="0"
                            step="500000"
                            value={vatAmount}
                            onChange={(e) => setVatAmount(Math.max(0, Number(e.target.value) || 0))}
                            style={{
                              width: "100%",
                              padding: "10px 14px 10px 50px",
                              background: "var(--landing-bg)",
                              border: "1.5px solid var(--landing-border)",
                              borderRadius: 10,
                              fontSize: ".9rem",
                              fontWeight: 700,
                              color: "var(--landing-text)",
                              fontFamily: "'JetBrains Mono', monospace",
                              outline: "none"
                            }}
                          />
                        </div>
                      </div>

                      {/* Mode switch: Exclusive vs Inclusive */}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setVatMode("exclusive")}
                          style={{
                            flex: 1,
                            padding: "7px 10px",
                            borderRadius: 6,
                            fontSize: ".74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: vatMode === "exclusive" ? "rgba(26, 123, 107, 0.12)" : "var(--landing-bg)",
                            border: vatMode === "exclusive" ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
                            color: vatMode === "exclusive" ? "#1A7B6B" : "var(--landing-text)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          VAT Exclusive (+18%)
                        </button>
                        <button
                          type="button"
                          onClick={() => setVatMode("inclusive")}
                          style={{
                            flex: 1,
                            padding: "7px 10px",
                            borderRadius: 6,
                            fontSize: ".74rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            background: vatMode === "inclusive" ? "rgba(26, 123, 107, 0.12)" : "var(--landing-bg)",
                            border: vatMode === "inclusive" ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
                            color: vatMode === "inclusive" ? "#1A7B6B" : "var(--landing-text)",
                            transition: "all 0.15s ease"
                          }}
                        >
                          VAT Inclusive (18/118)
                        </button>
                      </div>

                      {/* VAT & WHT Result Cards */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                        <div style={{ background: "rgba(26, 123, 107, 0.08)", border: "1px solid rgba(26, 123, 107, 0.25)", borderRadius: 10, padding: "12px" }}>
                          <span style={{ fontSize: ".7rem", color: "#1A7B6B", fontWeight: 700, textTransform: "uppercase" }}>Standard VAT (18%)</span>
                          <strong style={{ fontSize: "1.1rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                            {money(vatCalculated)}
                          </strong>
                          <span style={{ fontSize: ".65rem", color: "var(--landing-muted)" }}>Input credit reclaimable</span>
                        </div>
                        <div style={{ background: "rgba(200, 146, 42, 0.08)", border: "1px solid rgba(200, 146, 42, 0.25)", borderRadius: 10, padding: "12px" }}>
                          <span style={{ fontSize: ".7rem", color: "#C8922A", fontWeight: 700, textTransform: "uppercase" }}>Withholding Tax (6%)</span>
                          <strong style={{ fontSize: "1.1rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                            {money(whtCalculated)}
                          </strong>
                          <span style={{ fontSize: ".65rem", color: "var(--landing-muted)" }}>URA Form DT-104 deposit</span>
                        </div>
                      </div>

                      {/* eFRIS Compliance Banner */}
                      <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 8, padding: "10px 12px", fontSize: ".72rem", display: "flex", alignItems: "center", gap: 8 }}>
                        <ShieldCheck size={16} style={{ color: "#16A34A", flexShrink: 0 }} />
                        <span style={{ color: "var(--landing-text)" }}>
                          Under URA eFRIS guidelines, transactions exceeding UGX 5,000,000 require fiscal receipt reconciliation for input VAT eligibility.
                        </span>
                      </div>
                    </div>
                  )}

                  {/* TAB 3 - LIVE CUSTOMS */}
                  {heroCalcTab === "customs" && (
                    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 10 }}>
                        <div>
                          <label htmlFor="hero-cif" style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--landing-text)", display: "block", marginBottom: 4 }}>
                            CIF Value (USD)
                          </label>
                          <input
                            id="hero-cif"
                            type="number"
                            min="1000"
                            step="500"
                            value={cifUsd}
                            onChange={(e) => setCifUsd(Math.max(0, Number(e.target.value) || 0))}
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              background: "var(--landing-bg)",
                              border: "1.5px solid var(--landing-border)",
                              borderRadius: 8,
                              fontSize: ".85rem",
                              fontWeight: 700,
                              color: "var(--landing-text)",
                              fontFamily: "'JetBrains Mono', monospace",
                              outline: "none"
                            }}
                          />
                        </div>
                        <div>
                          <label htmlFor="hero-year" style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--landing-text)", display: "block", marginBottom: 4 }}>
                            Manufacture Year
                          </label>
                          <select
                            id="hero-year"
                            value={vehicleYear}
                            onChange={(e) => setVehicleYear(Number(e.target.value))}
                            style={{
                              width: "100%",
                              padding: "8px 10px",
                              background: "var(--landing-bg)",
                              border: "1.5px solid var(--landing-border)",
                              borderRadius: 8,
                              fontSize: ".85rem",
                              fontWeight: 700,
                              color: "var(--landing-text)",
                              fontFamily: "inherit",
                              outline: "none"
                            }}
                          >
                            {[2024, 2022, 2020, 2018, 2017, 2016, 2015, 2014, 2012, 2010].map(y => (
                              <option key={y} value={y}>{y} ({2026 - y} yrs old)</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Total Estimated Taxes */}
                      <div style={{ background: "rgba(26, 123, 107, 0.08)", border: "1.5px solid rgba(26, 123, 107, 0.25)", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <span style={{ fontSize: ".7rem", color: "#1A7B6B", fontWeight: 700, textTransform: "uppercase" }}>Total URA Customs Taxes</span>
                          <strong style={{ fontSize: "1.25rem", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                            {money(totalCustomsTax)}
                          </strong>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ fontSize: ".65rem", color: "var(--landing-muted)", display: "block" }}>CIF Base</span>
                          <span style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>
                            {money(cifUgx)}
                          </span>
                        </div>
                      </div>

                      {/* Customs Tax Line Breakdown */}
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: ".72rem" }}>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 6, padding: "6px 10px" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Import Duty (25%):</span>
                          <strong style={{ display: "block", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>{money(importDuty)}</strong>
                        </div>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 6, padding: "6px 10px" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Env. Levy ({Math.round(envLevyRate * 100)}%):</span>
                          <strong style={{ display: "block", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>{money(envLevy)}</strong>
                        </div>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 6, padding: "6px 10px" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Import VAT (18%):</span>
                          <strong style={{ display: "block", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>{money(vatCustoms)}</strong>
                        </div>
                        <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 6, padding: "6px 10px" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Withholding (6%):</span>
                          <strong style={{ display: "block", color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>{money(whtCustoms)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {/* CARD FOOTER */}
              <div style={{ background: "var(--landing-bg)", borderTop: "1px solid var(--landing-border)", padding: "12px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: ".72rem", color: "var(--landing-muted)", fontWeight: 600 }}>
                  Statutory formulas verified against URA tariffs
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) onNavigate("calculators");
                    else onGetStarted();
                  }}
                  style={{
                    background: "#1A7B6B",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: 8,
                    fontSize: ".75rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 2px 8px rgba(26,123,107,0.2)"
                  }}
                >
                  <span>Open Full Suite</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          2. IMPACT & STAT BAND
      ══════════════════════════════════════════════════════════════ */}
      <section style={{ background: "var(--landing-surface)", borderBottom: "1px solid var(--landing-border)", padding: "40px 5%" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="tw-stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24, textAlign: "center" }}>
            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#1A7B6B", fontFamily: "'JetBrains Mono', monospace" }}>
                <CountingNumber value={dynamicStats.cases} />
              </div>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)", marginTop: 4 }}>
                Cases Analyzed
              </div>
              <div style={{ fontSize: ".7rem", color: "var(--landing-muted)", marginTop: 2 }}>
                Audit objections &amp; tribunal rulings
              </div>
            </div>

            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#C8922A", fontFamily: "'JetBrains Mono', monospace" }}>
                <CountingNumber value={dynamicStats.timeSaved} />
              </div>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)", marginTop: 4 }}>
                Research Time Saved
              </div>
              <div style={{ fontSize: ".7rem", color: "var(--landing-muted)", marginTop: 2 }}>
                Compared to manual PDF searches
              </div>
            </div>

            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#0F2044", fontFamily: "'JetBrains Mono', monospace" }}>
                <CountingNumber value={dynamicStats.practitioners} />
              </div>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)", marginTop: 4 }}>
                Active Practitioners
              </div>
              <div style={{ fontSize: ".7rem", color: "var(--landing-muted)", marginTop: 2 }}>
                Ugandan tax advisors &amp; accountants
              </div>
            </div>

            <div style={{ padding: "8px 12px" }}>
              <div style={{ fontSize: "2rem", fontWeight: 800, color: "#16A34A", fontFamily: "'JetBrains Mono', monospace" }}>
                <CountingNumber value={dynamicStats.calculators} />
              </div>
              <div style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--landing-text)", marginTop: 4 }}>
                Statutory Calculators
              </div>
              <div style={{ fontSize: ".7rem", color: "var(--landing-muted)", marginTop: 2 }}>
                PAYE, VAT, Corporate, Customs &amp; Rental
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          3. INTERACTIVE LIVE CALCULATOR SUITE SHOWCASE
      ══════════════════════════════════════════════════════════════ */}
      <section id="calculators-showcase" className="tw-section" style={{ padding: "80px 5%", background: "var(--landing-bg)", borderBottom: "1px solid var(--landing-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
            <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#1A7B6B", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Live Calculation Suite
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "var(--landing-text)", fontWeight: 800, marginTop: 8, marginBottom: 12 }}>
              Every Statutory Tax Tool Uganda Experts Require
            </h2>
            <p style={{ fontSize: ".95rem", color: "var(--landing-muted)", lineHeight: 1.6 }}>
              Built according to the Income Tax (Amendment) Act 2026, Value Added Tax Act Cap 349, and East African Community Customs Management Act.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))", gap: 24 }}>
            
            {/* CARD 1: PAYE Payroll & Bracket Breakdown */}
            <div className="tw-card-interactive" style={{ background: "var(--landing-surface)", border: "1px solid var(--landing-border)", borderRadius: 16, padding: "28px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(26, 123, 107, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#1A7B6B" }}>
                  <Calculator size={22} />
                </div>
                <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#1A7B6B", background: "rgba(26, 123, 107, 0.08)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(26, 123, 107, 0.2)" }}>
                  ITA Cap 340 4th Sched
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--landing-text)", marginBottom: 6 }}>
                  PAYE &amp; Employee Payroll Engine
                </h3>
                <p style={{ fontSize: ".82rem", color: "var(--landing-muted)", lineHeight: 1.5 }}>
                  Calculates graduated statutory tax bands, the 10% high-earner surcharge exceeding UGX 10M, and mandatory 5% employee NSSF deductions.
                </p>
              </div>

              {/* Mini Interactive Preview Element */}
              <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 10, padding: "12px", fontSize: ".72rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontWeight: 700 }}>
                  <span style={{ color: "var(--landing-muted)" }}>Benchmark UGX 4.5M Salary:</span>
                  <span style={{ color: "#1A7B6B", fontFamily: "'JetBrains Mono', monospace" }}>UGX 3,025,000 Net</span>
                </div>
                <div style={{ height: 6, background: "var(--landing-surface)", borderRadius: 3, display: "flex", overflow: "hidden", border: "1px solid var(--landing-border)" }}>
                  <div style={{ width: "67%", background: "#16A34A" }} />
                  <div style={{ width: "28%", background: "#1A7B6B" }} />
                  <div style={{ width: "5%", background: "#C8922A" }} />
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (onNavigate) onNavigate("calculators"); else onGetStarted(); }}
                style={{ marginTop: "auto", background: "none", border: "none", color: "#1A7B6B", fontWeight: 700, fontSize: ".84rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
              >
                <span>Launch PAYE Calculator</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* CARD 2: VAT & eFRIS Reconciliation */}
            <div className="tw-card-interactive" style={{ background: "var(--landing-surface)", border: "1px solid var(--landing-border)", borderRadius: 16, padding: "28px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "rgba(200, 146, 42, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C8922A" }}>
                  <Receipt size={22} />
                </div>
                <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#C8922A", background: "rgba(200, 146, 42, 0.08)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(200, 146, 42, 0.2)" }}>
                  VATA Cap 349 Sec 28
                </span>
              </div>
              <div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--landing-text)", marginBottom: 6 }}>
                  VAT &amp; eFRIS Input Reconciler
                </h3>
                <p style={{ fontSize: ".82rem", color: "var(--landing-muted)", lineHeight: 1.5 }}>
                  Verifies standard 18% VAT calculations, input tax credit disallowance thresholds, and eFRIS fiscal receipt requirements.
                </p>
              </div>

              {/* Mini Interactive Preview Element */}
              <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 10, padding: "12px", fontSize: ".72rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ color: "var(--landing-muted)" }}>VAT Exclusive Rate:</span>
                  <strong style={{ color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>18.00%</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--landing-muted)" }}>eFRIS Threshold:</span>
                  <strong style={{ color: "#16A34A", fontFamily: "'JetBrains Mono', monospace" }}>&gt; UGX 5,000,000</strong>
                </div>
              </div>

              <button
                type="button"
                onClick={() => { if (onNavigate) onNavigate("calculators"); else onGetStarted(); }}
                style={{ marginTop: "auto", background: "none", border: "none", color: "#1A7B6B", fontWeight: 700, fontSize: ".84rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: 0 }}
              >
                <span>Launch VAT Calculator</span>
                <ArrowRight size={14} />
              </button>
            </div>



          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          4. SEARCHABLE TAT PRECEDENT ENGINE PREVIEW
      ══════════════════════════════════════════════════════════════ */}
      <section id="precedents-section" className="tw-section" style={{ padding: "80px 5%", background: "var(--landing-surface)", borderBottom: "1px solid var(--landing-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 40px" }}>
            <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#C8922A", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Case Precedents Archive
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "var(--landing-text)", fontWeight: 800, marginTop: 8, marginBottom: 12 }}>
              68+ Binding Tax Appeals Tribunal Precedents
            </h2>
            <p style={{ fontSize: ".95rem", color: "var(--landing-muted)", lineHeight: 1.6 }}>
              Never search through thousands of dense PDF pages again. Instantly cite authoritative legal holdings and statutory citations that win URA objections.
            </p>
          </div>

          {/* Interactive Precedent Search Bar */}
          <div style={{ maxWidth: 760, margin: "0 auto 32px" }}>
            <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
              <Search size={18} style={{ position: "absolute", left: 16, color: "var(--landing-muted)" }} />
              <input
                type="text"
                value={precedentSearch}
                onChange={(e) => setPrecedentSearch(e.target.value)}
                placeholder="Search precedents by keyword (e.g., eFRIS, VAT input credit, late appeal, transfer pricing)..."
                style={{
                  width: "100%",
                  padding: "14px 16px 14px 48px",
                  background: "var(--landing-bg)",
                  border: "1.5px solid var(--landing-border)",
                  borderRadius: 12,
                  fontSize: ".88rem",
                  color: "var(--landing-text)",
                  fontFamily: "inherit",
                  outline: "none",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              />
              {precedentSearch && (
                <button
                  type="button"
                  onClick={() => setPrecedentSearch("")}
                  style={{ position: "absolute", right: 14, background: "none", border: "none", color: "var(--landing-muted)", cursor: "pointer", fontSize: ".75rem", fontWeight: 700 }}
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick search chips */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 12, alignItems: "center" }}>
              <span style={{ fontSize: ".72rem", color: "var(--landing-muted)", fontWeight: 600 }}>Suggested Queries:</span>
              {[
                "eFRIS input tax credit",
                "Late appeal jurisdiction Sec 14",
                "Capital exploration deductions",
                "WHT on management fees"
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setPrecedentSearch(chip)}
                  style={{
                    background: precedentSearch === chip ? "rgba(26, 123, 107, 0.15)" : "var(--landing-bg)",
                    border: precedentSearch === chip ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
                    color: precedentSearch === chip ? "#1A7B6B" : "var(--landing-text)",
                    padding: "4px 10px",
                    borderRadius: 20,
                    fontSize: ".7rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Precedents Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", gap: 20 }}>
            {filteredPrecedents.map((p) => (
              <div 
                key={p.id}
                className="tw-card-interactive"
                style={{
                  background: "var(--landing-bg)",
                  border: "1px solid var(--landing-border)",
                  borderRadius: 14,
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 240 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#1A7B6B", background: "rgba(26, 123, 107, 0.1)", padding: "2px 8px", borderRadius: 4 }}>
                        {p.tag}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (typeof navigator !== "undefined" && navigator.clipboard) {
                            navigator.clipboard.writeText(p.citation);
                          }
                          setCopiedCitation(p.id);
                          setTimeout(() => setCopiedCitation(null), 2000);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: copiedCitation === p.id ? "rgba(22, 163, 74, 0.12)" : "var(--landing-surface)",
                          border: copiedCitation === p.id ? "1px solid #16A34A" : "1px solid var(--landing-border)",
                          color: copiedCitation === p.id ? "#16A34A" : "var(--landing-muted)",
                          fontSize: ".66rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                        title="Copy citation to clipboard"
                      >
                        {copiedCitation === p.id ? <Check size={11} style={{ color: "#16A34A" }} /> : <Copy size={11} />}
                        <span>{copiedCitation === p.id ? "Citation Copied" : "Copy Citation"}</span>
                      </button>
                    </div>
                    <h3 style={{ fontSize: "1.02rem", fontWeight: 800, color: "var(--landing-text)", marginTop: 6, lineHeight: 1.3 }}>
                      {p.title}
                    </h3>
                    <div style={{ fontSize: ".72rem", color: "var(--landing-muted)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                      {p.citation}
                    </div>
                  </div>
                  <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#16A34A", background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.25)", padding: "3px 8px", borderRadius: 4, whiteSpace: "nowrap" }}>
                    {p.taxpayerWin}
                  </span>
                </div>

                <p style={{ fontSize: ".82rem", color: "var(--landing-text)", lineHeight: 1.55, margin: 0 }}>
                  {p.holding}
                </p>

                {/* Expandable Ratio Decidendi accordion */}
                <button
                  type="button"
                  onClick={() => setExpandedPrecedentId(expandedPrecedentId === p.id ? null : p.id)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#1A7B6B",
                    fontSize: ".74rem",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: 0,
                    marginTop: 2
                  }}
                >
                  <span>{expandedPrecedentId === p.id ? "Hide Legal Grounds" : "View Tribunal Grounds & Rationale"}</span>
                  <ChevronDown size={13} style={{ transform: expandedPrecedentId === p.id ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>

                <AnimatePresence>
                  {expandedPrecedentId === p.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ background: "var(--landing-surface)", border: "1px solid var(--landing-border)", borderRadius: 8, padding: "12px", marginTop: 4, fontSize: ".75rem", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div>
                          <span style={{ fontWeight: 800, color: "#1A7B6B", textTransform: "uppercase", fontSize: ".65rem", letterSpacing: ".05em", display: "block" }}>Ratio Decidendi:</span>
                          <p style={{ margin: "2px 0 0", color: "var(--landing-text)", lineHeight: 1.45 }}>{p.legalRatio}</p>
                        </div>
                        <div style={{ borderTop: "1px dashed var(--landing-border)", paddingTop: 6 }}>
                          <span style={{ fontWeight: 800, color: "#C8922A", textTransform: "uppercase", fontSize: ".65rem", letterSpacing: ".05em", display: "block" }}>Tactical Objection Application:</span>
                          <p style={{ margin: "2px 0 0", color: "var(--landing-muted)", lineHeight: 1.45 }}>{p.tacticalAdvice}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--landing-border)", paddingTop: 10, marginTop: "auto", fontSize: ".72rem" }}>
                  <span style={{ color: "#1A7B6B", fontWeight: 700 }}>
                    {p.statute}
                  </span>
                  <button
                    type="button"
                    onClick={() => { if (onNavigate) onNavigate("library"); else onGetStarted(); }}
                    style={{ background: "none", border: "none", color: "var(--landing-text)", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4, padding: 0 }}
                  >
                    <span>Read Full Ruling</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button
              type="button"
              onClick={() => { if (onNavigate) onNavigate("library"); else onGetStarted(); }}
              style={{
                background: "#0F2044",
                color: "white",
                padding: "12px 28px",
                borderRadius: 8,
                fontSize: ".85rem",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 4px 14px rgba(15, 32, 68, 0.2)"
              }}
            >
              <span>Explore All 68+ Case Precedents in Library</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          5. INTERACTIVE 3-STEP LEGAL & COMPLIANCE WORKFLOW
      ══════════════════════════════════════════════════════════════ */}
      <section id="workflow-section" className="tw-section" style={{ padding: "80px 5%", background: "var(--landing-bg)", borderBottom: "1px solid var(--landing-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
            <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#1A7B6B", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Simplified Practitioner Workflow
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "var(--landing-text)", fontWeight: 800, marginTop: 8, marginBottom: 12 }}>
              From URA Assessment Notice to Winning Defense in 3 Steps
            </h2>
            <p style={{ fontSize: ".95rem", color: "var(--landing-muted)", lineHeight: 1.6 }}>
              How leading tax firms and corporate finance departments accelerate their tribunal preparation and dispute workflows.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 24 }}>
            {[
              {
                step: "01",
                title: "Upload or Input Notice",
                desc: "Paste tax assessment letters, URA audit queries, or commercial transactions. The system extracts relevant figures, tax types, and statutory reference years.",
                icon: <FileText size={22} style={{ color: "#1A7B6B" }} />,
                pill: "Instant Extraction"
              },
              {
                step: "02",
                title: "Statutory & Precedent Cross-Check",
                desc: "TaxWise scans ITA Cap 340, VATA Cap 349, and 68+ binding Tax Appeals Tribunal rulings to identify winning legal precedents, deadline windows, and penalty exemptions.",
                icon: <Cpu size={22} style={{ color: "#C8922A" }} />,
                pill: "Statutory Intelligence"
              },
              {
                step: "03",
                title: "Generate Defense Brief & Computations",
                desc: "Receive client-ready objection letters, recalculation schedules with exact tax formulas, and authoritative citations ready for submission to the URA Commissioner.",
                icon: <Scale size={22} style={{ color: "#0F2044" }} />,
                pill: "Tribunal-Grade Output"
              }
            ].map((s, idx) => (
              <div 
                key={s.step}
                onClick={() => setActiveWorkflowStep(idx + 1)}
                style={{
                  background: "var(--landing-surface)",
                  border: activeWorkflowStep === idx + 1 ? "1.5px solid #1A7B6B" : "1px solid var(--landing-border)",
                  borderRadius: 16,
                  padding: "32px 24px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  cursor: "pointer",
                  boxShadow: activeWorkflowStep === idx + 1 ? "0 8px 24px rgba(26, 123, 107, 0.08)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--landing-bg)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {s.icon}
                  </div>
                  <span style={{ fontSize: "1.2rem", fontWeight: 800, color: activeWorkflowStep === idx + 1 ? "#1A7B6B" : "var(--landing-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                    {s.step}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: ".68rem", fontWeight: 700, color: "#1A7B6B", textTransform: "uppercase" }}>
                    {s.pill}
                  </span>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--landing-text)", marginTop: 4, marginBottom: 8 }}>
                    {s.title}
                  </h3>
                  <p style={{ fontSize: ".835rem", color: "var(--landing-muted)", lineHeight: 1.55 }}>
                    {s.desc}
                  </p>
                </div>

                <div style={{ marginTop: "auto", borderTop: "1px solid var(--landing-border)", paddingTop: 12, display: "flex", alignItems: "center", gap: 6, fontSize: ".76rem", fontWeight: 700, color: activeWorkflowStep === idx + 1 ? "#1A7B6B" : "var(--landing-muted)" }}>
                  <span>Step {idx + 1} Walkthrough</span>
                  <ArrowRight size={13} />
                </div>
              </div>
            ))}
          </div>

          {/* INTERACTIVE WORKFLOW SIMULATOR CANVAS */}
          <div style={{ marginTop: 36, background: "var(--landing-surface)", border: "1px solid var(--landing-border)", borderRadius: 18, overflow: "hidden", boxShadow: "0 16px 36px -10px rgba(15, 32, 68, 0.08)" }}>
            {/* Terminal Top Bar */}
            <div style={{ background: "var(--landing-bg)", padding: "12px 20px", borderBottom: "1px solid var(--landing-border)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                </div>
                <span style={{ fontSize: ".76rem", fontWeight: 700, color: "var(--landing-text)" }}>
                  TaxWise Intelligence Engine · Live Workflow Simulator
                </span>
                <span style={{ fontSize: ".68rem", color: "#1A7B6B", background: "rgba(26, 123, 107, 0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                  Active: Step 0{activeWorkflowStep}
                </span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3].map(stepNum => (
                  <button
                    key={stepNum}
                    type="button"
                    onClick={() => setActiveWorkflowStep(stepNum)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: activeWorkflowStep === stepNum ? "1px solid #1A7B6B" : "1px solid var(--landing-border)",
                      background: activeWorkflowStep === stepNum ? "rgba(26, 123, 107, 0.12)" : "var(--landing-surface)",
                      color: activeWorkflowStep === stepNum ? "#1A7B6B" : "var(--landing-muted)",
                      fontSize: ".72rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    Step 0{stepNum}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulated Canvas Body with AnimatePresence */}
            <div style={{ padding: "26px" }}>
              <AnimatePresence mode="wait">
                {activeWorkflowStep === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24, alignItems: "stretch" }}
                  >
                    {/* Simulated Assessment Notice */}
                    <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 12, padding: "18px", fontSize: ".78rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--landing-border)", paddingBottom: 10, marginBottom: 12 }}>
                        <div>
                          <span style={{ fontSize: ".68rem", fontWeight: 800, color: "#1A7B6B", letterSpacing: ".05em", textTransform: "uppercase" }}>
                            UGANDA REVENUE AUTHORITY (URA)
                          </span>
                          <div style={{ fontSize: ".82rem", fontWeight: 800, color: "var(--landing-text)" }}>
                            Notice of Additional Assessment · FY 2024/25
                          </div>
                        </div>
                        <span style={{ fontSize: ".66rem", color: "var(--landing-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                          Ref: URA/LTO/2026/0882
                        </span>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12, fontSize: ".72rem" }}>
                        <div><strong style={{ color: "var(--landing-muted)" }}>Taxpayer:</strong> <span style={{ color: "var(--landing-text)", fontWeight: 600 }}>Equatorial Logistics Ltd</span></div>
                        <div><strong style={{ color: "var(--landing-muted)" }}>TIN:</strong> <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--landing-text)" }}>1003849102</span></div>
                        <div><strong style={{ color: "var(--landing-muted)" }}>Division:</strong> Large Taxpayers Office</div>
                        <div><strong style={{ color: "var(--landing-muted)" }}>Notice Date:</strong> 14 Jan 2026</div>
                      </div>
                      <div style={{ background: "rgba(220, 38, 38, 0.06)", border: "1px solid rgba(220, 38, 38, 0.2)", borderRadius: 8, padding: "10px 12px", marginBottom: 8 }}>
                        <span style={{ color: "#DC2626", fontWeight: 700, fontSize: ".72rem", display: "block" }}>1. Disallowed Input VAT (Section 28 VATA):</span>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                          <span style={{ color: "var(--landing-text)", fontSize: ".72rem" }}>Purchase invoice supplier fiscal device mismatch</span>
                          <strong style={{ color: "#DC2626", fontFamily: "'JetBrains Mono', monospace", fontSize: ".82rem" }}>UGX 18,450,000</strong>
                        </div>
                      </div>
                      <div style={{ background: "rgba(200, 146, 42, 0.08)", border: "1px solid rgba(200, 146, 42, 0.25)", borderRadius: 8, padding: "10px 12px" }}>
                        <span style={{ color: "#C8922A", fontWeight: 700, fontSize: ".72rem", display: "block" }}>2. Disallowed Technical Recharges (Section 83 ITA):</span>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 2 }}>
                          <span style={{ color: "var(--landing-text)", fontSize: ".72rem" }}>Cross-border management fee withholding tax</span>
                          <strong style={{ color: "#C8922A", fontFamily: "'JetBrains Mono', monospace", fontSize: ".82rem" }}>UGX 6,200,000</strong>
                        </div>
                      </div>
                    </div>

                    {/* Extracted Facts & Actions Panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(26, 123, 107, 0.08)", border: "1px solid rgba(26, 123, 107, 0.25)", padding: "10px 14px", borderRadius: 10 }}>
                        <FileCheck size={18} style={{ color: "#1A7B6B", flexShrink: 0 }} />
                        <span style={{ fontSize: ".76rem", fontWeight: 700, color: "#1A7B6B" }}>
                          Assessment PDF Extracted in 1.2 Seconds
                        </span>
                      </div>
                      <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 10, padding: "14px", flex: 1, display: "flex", flexDirection: "column", gap: 8, fontSize: ".76rem" }}>
                        <span style={{ fontWeight: 800, color: "var(--landing-text)", textTransform: "uppercase", fontSize: ".68rem", letterSpacing: ".05em" }}>Detected Discrepancies</span>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--landing-border)" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Total Assessment Claim:</span>
                          <strong style={{ color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>UGX 24,650,000</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--landing-border)" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Statutory Deadline:</span>
                          <strong style={{ color: "#DC2626", fontWeight: 800 }}>18 Days Left (Sec 24 TAT)</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                          <span style={{ color: "var(--landing-muted)" }}>Jurisdiction Authority:</span>
                          <span style={{ color: "var(--landing-text)", fontWeight: 700 }}>Tax Appeals Tribunal / LTO</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveWorkflowStep(2)}
                          style={{ marginTop: "auto", background: "#1A7B6B", color: "white", padding: "10px", borderRadius: 8, border: "none", fontSize: ".78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                        >
                          <span>Proceed to Step 02: Statutory Cross-Check</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeWorkflowStep === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24, alignItems: "stretch" }}
                  >
                    {/* Real-time Precedent Matcher */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <span style={{ fontSize: ".7rem", fontWeight: 800, color: "#C8922A", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Automated Statutory &amp; Precedent Rule Cross-Check
                      </span>
                      <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 10, padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: ".76rem", fontWeight: 800, color: "var(--landing-text)" }}>
                            Binding Precedent: Uganda Clays v URA (TAT 012/2023)
                          </span>
                          <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#16A34A", background: "rgba(22, 163, 74, 0.12)", padding: "2px 8px", borderRadius: 4 }}>
                            94% Legal Match
                          </span>
                        </div>
                        <p style={{ fontSize: ".72rem", color: "var(--landing-muted)", margin: 0, lineHeight: 1.45 }}>
                          Holds that buyer cannot be denied input VAT credit where goods were supplied for taxable sales and payment was executed via banking channels, notwithstanding vendor eFRIS sync faults.
                        </p>
                        <span style={{ fontSize: ".66rem", color: "#1A7B6B", fontWeight: 700 }}>
                          Direct Defense for UGX 18,450,000 Disallowance
                        </span>
                      </div>

                      <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 10, padding: "12px", display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: ".76rem", fontWeight: 800, color: "var(--landing-text)" }}>
                            Treaty Precedence: Vivo Energy v CG (HCCA 018/2022)
                          </span>
                          <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#16A34A", background: "rgba(22, 163, 74, 0.12)", padding: "2px 8px", borderRadius: 4 }}>
                            91% Legal Match
                          </span>
                        </div>
                        <p style={{ fontSize: ".72rem", color: "var(--landing-muted)", margin: 0, lineHeight: 1.45 }}>
                          Section 88 ITA enforces treaty rates (10%) over domestic rate (15%), invalidating URA additional assessment on management recharges.
                        </p>
                        <span style={{ fontSize: ".66rem", color: "#C8922A", fontWeight: 700 }}>
                          Direct Defense for UGX 6,200,000 Disallowance
                        </span>
                      </div>
                    </div>

                    {/* Probability Gauge */}
                    <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 12, padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>
                      <span style={{ fontSize: ".7rem", fontWeight: 800, color: "#1A7B6B", letterSpacing: ".06em", textTransform: "uppercase" }}>
                        Taxpayer Defense Rating
                      </span>
                      <div style={{ textAlign: "center", padding: "10px 0" }}>
                        <div style={{ fontSize: "2.6rem", fontWeight: 800, color: "#16A34A", fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                          88%
                        </div>
                        <span style={{ fontSize: ".74rem", fontWeight: 700, color: "var(--landing-text)", marginTop: 6, display: "block" }}>
                          High Probability of Total Relief
                        </span>
                        <span style={{ fontSize: ".68rem", color: "var(--landing-muted)" }}>
                          Backed by 2 binding TAT &amp; High Court decisions
                        </span>
                      </div>
                      <div style={{ background: "var(--landing-surface)", border: "1px solid var(--landing-border)", borderRadius: 8, padding: "10px", fontSize: ".7rem", color: "var(--landing-text)" }}>
                        <strong>Strategic Conclusion:</strong> Lodge formal objection under Section 24 TAT Act. Do not pay without prejudice.
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveWorkflowStep(3)}
                        style={{ marginTop: "auto", background: "#1A7B6B", color: "white", padding: "10px", borderRadius: 8, border: "none", fontSize: ".78rem", fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                      >
                        <span>Proceed to Step 03: Generate Defense Brief</span>
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}

                {activeWorkflowStep === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 380px), 1fr))", gap: 24, alignItems: "stretch" }}
                  >
                    {/* Generated Formal Objection Brief */}
                    <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 12, padding: "18px", fontSize: ".74rem", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ borderBottom: "1px solid var(--landing-border)", paddingBottom: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: ".65rem", fontWeight: 800, color: "#1A7B6B", textTransform: "uppercase" }}>TRIBUNAL-READY OBJECTION BRIEF</span>
                        <div style={{ fontSize: ".82rem", fontWeight: 800, color: "var(--landing-text)", marginTop: 2 }}>
                          To: The Commissioner General, Uganda Revenue Authority
                        </div>
                        <span style={{ fontSize: ".68rem", color: "var(--landing-muted)" }}>
                          Re: Objection to Additional Assessment Notice Ref URA/LTO/2026/0882
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "var(--landing-text)", lineHeight: 1.5 }}>
                        <strong>Ground 1:</strong> The Commissioner erred in law and fact in disallowing input tax credit of UGX 18,450,000 contrary to Sections 28 &amp; 31 of the VAT Act and the binding ratio in <em>Uganda Clays v URA (TAT 012/2023)</em>.
                      </p>
                      <p style={{ margin: 0, color: "var(--landing-text)", lineHeight: 1.5 }}>
                        <strong>Ground 2:</strong> The assessment of withholding tax on technical management recharges violates Section 88 of the Income Tax Act and <em>Vivo Energy v CG (HCCA 018/2022)</em>.
                      </p>
                      <div style={{ background: "rgba(22, 163, 74, 0.08)", border: "1px solid rgba(22, 163, 74, 0.25)", borderRadius: 8, padding: "8px 12px", marginTop: 4 }}>
                        <span style={{ color: "#16A34A", fontWeight: 800, fontSize: ".7rem" }}>Revised Statutory Schedule:</span>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                          <span style={{ color: "var(--landing-text)" }}>Original URA Assessment:</span>
                          <strong style={{ color: "#DC2626", fontFamily: "'JetBrains Mono', monospace" }}>UGX 24,650,000</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 2 }}>
                          <span style={{ color: "var(--landing-text)" }}>Revised Assessment Payable:</span>
                          <strong style={{ color: "#16A34A", fontFamily: "'JetBrains Mono', monospace" }}>UGX 0.00 (Fully Discharged)</strong>
                        </div>
                      </div>
                    </div>

                    {/* Quick Export & Actions Panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ background: "var(--landing-bg)", border: "1px solid var(--landing-border)", borderRadius: 12, padding: "16px", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
                        <span style={{ fontSize: ".74rem", fontWeight: 800, color: "var(--landing-text)" }}>Client-Ready Export Actions</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== "undefined" && navigator.clipboard) {
                              navigator.clipboard.writeText("Notice of Objection Under Section 24 of the Tax Appeals Tribunal Act & Section 99 ITA - Grounds 1 & 2 cited from Uganda Clays v URA (TAT 012/2023).");
                            }
                            setCopiedObjection(true);
                            setTimeout(() => setCopiedObjection(false), 2200);
                          }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: copiedObjection ? "1px solid #16A34A" : "1px solid var(--landing-border)",
                            background: copiedObjection ? "rgba(22, 163, 74, 0.12)" : "var(--landing-surface)",
                            color: copiedObjection ? "#16A34A" : "var(--landing-text)",
                            fontSize: ".76rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            transition: "all 0.15s ease"
                          }}
                        >
                          {copiedObjection ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                          <span>{copiedObjection ? "Objection Text Copied!" : "Copy Full Objection Grounds"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => { if (onNavigate) onNavigate("analyzer"); else onGetStarted(); }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: "#1A7B6B",
                            color: "white",
                            fontSize: ".76rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            boxShadow: "0 2px 8px rgba(26,123,107,0.25)"
                          }}
                        >
                          <Scale size={16} />
                          <span>Run Your Own Notice Analysis →</span>
                        </button>

                        <div style={{ marginTop: "auto", borderTop: "1px solid var(--landing-border)", paddingTop: 10, fontSize: ".68rem", color: "var(--landing-muted)" }}>
                          TaxWise produces formal objection briefs formatted strictly in accordance with Section 24 of the Tax Appeals Tribunal Act and URA Practice Notes.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>



      {/* ══════════════════════════════════════════════════════════════
          7. PRICING PLANS
      ══════════════════════════════════════════════════════════════ */}
      <section id="pricing-section" className="tw-section" style={{ padding: "80px 5%", background: "var(--landing-bg)", borderBottom: "1px solid var(--landing-border)" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
            <span style={{ fontSize: ".74rem", fontWeight: 700, color: "#1A7B6B", letterSpacing: ".08em", textTransform: "uppercase" }}>
              Transparent Pricing
            </span>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "var(--landing-text)", fontWeight: 800, marginTop: 8, marginBottom: 12 }}>
              Choose the Plan for Your Practice
            </h2>
            <p style={{ fontSize: ".95rem", color: "var(--landing-muted)", lineHeight: 1.6 }}>
              All plans include core statutory calculators and URA compliance reference tools. Upgrade as your caseload scales.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: 24, alignItems: "stretch" }}>
            {plans.map((p) => {
              if (p.comingSoon) {
                return (
                  <div
                    key={p.name}
                    className="tw-card-interactive"
                    style={{
                      background: "var(--landing-surface)",
                      border: "1.5px dashed var(--landing-border)",
                      borderRadius: 18,
                      padding: "32px 26px",
                      display: "flex",
                      flexDirection: "column",
                      position: "relative",
                      opacity: 0.85
                    }}
                  >
                    {p.badge && (
                      <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#C8922A", color: "white", fontSize: ".68rem", fontWeight: 800, padding: "4px 14px", borderRadius: 12, letterSpacing: ".06em", boxShadow: "0 2px 8px rgba(200,146,42,0.3)" }}>
                        {p.badge}
                      </div>
                    )}

                    <div style={{ marginBottom: 16 }}>
                      <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--landing-text)" }}>{p.name}</h3>
                      <p style={{ fontSize: ".76rem", color: "var(--landing-muted)", marginTop: 4, minHeight: 36 }}>{p.desc}</p>
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--landing-border)" }}>
                      <span style={{ fontSize: "1.4rem", fontWeight: 800, color: "#C8922A" }}>Coming Soon</span>
                      <span style={{ fontSize: ".78rem", color: "var(--landing-muted)" }}>{p.period}</span>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                      {p.features.map(f => (
                        <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: ".82rem", color: "var(--landing-muted)" }}>
                          <Check size={16} style={{ color: "var(--landing-muted)", marginTop: 2, flexShrink: 0 }} />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: 8,
                        fontWeight: 700,
                        fontSize: ".85rem",
                        border: "1.5px solid var(--landing-border)",
                        background: "var(--landing-bg)",
                        color: "var(--landing-muted)",
                        cursor: "not-allowed"
                      }}
                    >
                      Coming Soon
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={p.name}
                  className="tw-card-interactive"
                  style={{
                    background: "var(--landing-surface)",
                    border: p.popular ? "2px solid #1A7B6B" : "1px solid var(--landing-border)",
                    borderRadius: 18,
                    padding: "32px 26px",
                    display: "flex",
                    flexDirection: "column",
                    position: "relative",
                    boxShadow: p.popular ? "0 12px 32px rgba(26, 123, 107, 0.12)" : "none"
                  }}
                >
                  {p.badge && (
                    <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#1A7B6B", color: "white", fontSize: ".68rem", fontWeight: 800, padding: "4px 14px", borderRadius: 12, letterSpacing: ".06em", boxShadow: "0 2px 8px rgba(26,123,107,0.3)" }}>
                      {p.badge}
                    </div>
                  )}

                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--landing-text)" }}>{p.name}</h3>
                    <p style={{ fontSize: ".76rem", color: "var(--landing-muted)", marginTop: 4, minHeight: 36 }}>{p.desc}</p>
                  </div>

                  <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--landing-border)" }}>
                    <span style={{ fontSize: "1.85rem", fontWeight: 800, color: "var(--landing-text)", fontFamily: "'JetBrains Mono', monospace" }}>{p.price}</span>
                    <span style={{ fontSize: ".78rem", color: "var(--landing-muted)" }}>{p.period}</span>
                  </div>

                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                    {p.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: ".82rem", color: "var(--landing-text)" }}>
                        <Check size={16} style={{ color: "#16A34A", marginTop: 2, flexShrink: 0 }} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={onGetStarted}
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 8,
                      fontWeight: 700,
                      fontSize: ".85rem",
                      cursor: "pointer",
                      border: p.popular ? "none" : "1.5px solid var(--landing-border)",
                      background: p.popular ? "#1A7B6B" : "var(--landing-bg)",
                      color: p.popular ? "white" : "var(--landing-text)",
                      boxShadow: p.popular ? "0 4px 14px rgba(26,123,107,0.25)" : "none",
                      transition: "all 0.2s"
                    }}
                  >
                    {p.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          8. CONVERSION CTA BANNER
      ══════════════════════════════════════════════════════════════ */}
      <section className="tw-section" style={{ padding: "80px 5%", background: "var(--landing-surface)", borderBottom: "1px solid var(--landing-border)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(26, 123, 107, 0.08) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: 720, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)", color: "var(--landing-text)", fontWeight: 800, marginBottom: 16 }}>
            Ready to upgrade your Ugandan tax practice?
          </h2>
          <p style={{ color: "var(--landing-muted)", fontSize: "1rem", lineHeight: 1.65, marginBottom: 32 }}>
            Join leading accounting firms and corporate finance teams saving hours every week on precedent research and tax computations.
          </p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {dbUser ? (
              <button 
                onClick={() => { if (onNavigate) onNavigate("dashboard"); else onGetStarted(); }}
                style={{ background: "#1A7B6B", color: "white", padding: "14px 30px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(26,123,107,0.3)" }}
              >
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button 
                  onClick={onGetStarted}
                  style={{ background: "#1A7B6B", color: "white", padding: "14px 30px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", boxShadow: "0 4px 14px rgba(26,123,107,0.3)" }}
                >
                  Create Free Account →
                </button>
                <button 
                  onClick={onSignIn}
                  style={{ background: "var(--landing-surface)", color: "var(--landing-text)", padding: "14px 28px", borderRadius: 8, fontWeight: 700, fontSize: ".92rem", border: "1.5px solid var(--landing-border)", cursor: "pointer" }}
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════
          9. COMPREHENSIVE FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <footer style={{ background: "#F8FAFC", padding: "64px 5% 32px", borderTop: "1px solid #E2E8F0", color: "#334155" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div className="tw-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr", gap: 32, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", color: "#0F172A", marginBottom: 12, fontWeight: 800 }}>
                Tax<span style={{ color: "#1A7B6B" }}>Wise</span>
              </div>
              <p style={{ fontSize: ".82rem", color: "#64748B", lineHeight: 1.6, maxWidth: 240, marginBottom: 16 }}>
                Uganda&apos;s professional tax intelligence engine. Designed for tax consultants, certified accountants, and customs brokers.
              </p>
            </div>

            <div>
              <h5 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                Tools
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
                {["Case Analyzer", "PAYE Calculator", "VAT Calculator", "WHT Rates Tool"].map(link => (
                  <li key={link}>
                    <button 
                      onClick={() => handleFooterLinkClick(link)} 
                      style={{ color: "#334155", fontSize: ".82rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "color .2s", textAlign: "left", fontWeight: 500 }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = "#1A7B6B"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                Official Portals
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
                {[
                  { label: "URA Portal", url: "https://www.ura.go.ug" },
                  { label: "Tax Appeals Tribunal", url: "https://www.tat.go.ug" },
                  { label: "ICPAU", url: "https://www.icpau.co.ug" },
                  { label: "Ministry of Finance", url: "https://www.finance.go.ug" },
                ].map(item => (
                  <li key={item.label}>
                    <a 
                      href={item.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: "#334155", fontSize: ".82rem", textDecoration: "none", transition: "color .2s", fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 4 }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = "#1A7B6B"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                    >
                      <span>{item.label}</span>
                      <span style={{ fontSize: ".65rem", opacity: 0.6 }}>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                Legal & Compliance
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
                {["TAT Precedents", "Compliance Check", "Client Reports", "Legal Blog", "Terms of Use", "Privacy Policy"].map(link => (
                  <li key={link}>
                    <button 
                      onClick={() => handleFooterLinkClick(link)} 
                      style={{ color: "#334155", fontSize: ".82rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "color .2s", textAlign: "left", fontWeight: 500 }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = "#1A7B6B"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h5 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", color: "#64748B", marginBottom: 16 }}>
                Support & Contact
              </h5>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, padding: 0, margin: 0 }}>
                {["Knowledge Base", "Pricing Plans", "Contact Us"].map(link => (
                  <li key={link}>
                    <button 
                      onClick={() => handleFooterLinkClick(link)} 
                      style={{ color: "#334155", fontSize: ".82rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "color .2s", textAlign: "left", fontWeight: 500 }}
                      onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = "#1A7B6B"; }}
                      onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".74rem", color: "#64748B", flexWrap: "wrap", gap: 12, fontWeight: 500 }}>
            <span>© 2026 TaxWise Uganda. All rights reserved.</span>
            <span>Complying with URA, eFRIS, and VAT statutory regulations.</span>
          </div>
        </div>
      </footer>

      {/* LEGAL PORTAL MODAL (Privacy, Terms, Legal Blog) */}
      <LegalPortal isOpen={legalOpen} onClose={() => setLegalOpen(false)} initialTab={legalTab} />
    </div>
  );
};
