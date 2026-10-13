"use client";
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { supabase } from "../lib/supabaseClient";
import { LayoutDashboard, Settings, LogOut, ChevronDown, Scale, Search, Car, Calculator, GraduationCap, ShieldCheck, Mail, Check, Star, FileText, Cpu, TrendingUp, Clock, Building2, Globe, Sparkles, AlertTriangle, BookOpen, Menu, X } from "lucide-react";
import { LegalPortal } from "./LegalPortal";

// Animated Counting Number Component
const CountingNumber: React.FC<{ value: string; duration?: number }> = ({ value, duration = 1500 }) => {
  const [current, setCurrent] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // Extract digits and suffix
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
      
      // easeOutQuad
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
  topbar_text: "Engineered for Uganda's Tax & Customs Ecosystem",
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

const itemToPageMap: Record<string, string> = {
  // Products
  "Case Analyzer": "analyzer",
  "Compliance Checklists": "compliance",
  "TAT Library Search": "library",
  "Client Report Builder": "analyzer",

  // Precedents
  "TAT Case Precedents": "library",
  "Precedent Search & Rulings": "library",
  "High Court Precedents": "library",
  "Binding Holding Summaries": "library",

  // Case Analysis
  "Legal Case Analyzer": "analyzer",
  "URA Objection Review": "analyzer",
  "Procedural Timeline Scanner": "analyzer",
  "Statutory Risk Audit": "analyzer",

  // Calculators
  "PAYE Estimator": "calculators",
  "VAT Calculator": "calculators",
  "Withholding Tax Rates": "calculators",
  "Customs Import Tax": "calculators",
  "Vehicle Depreciation Duty": "calculators",
  "Corporate Income Tax": "calculators",
  "Rental Income Tax": "calculators",

  // Intelligence
  "Transfer Pricing Guide": "intelligence",
  "TAT Dispute Strategy": "intelligence",
  "WHT Treaties Map": "intelligence",
  "Monthly Tax Updates": "intelligence",
};

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSignIn, onNavigate, dbUser, onSignOut }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taxToolsOpen, setTaxToolsOpen] = useState(false);
  const [heroText, setHeroText] = useState("");
  const [showResult, setShowResult] = useState(true);
  const [previewTab, setPreviewTab] = useState<"analysis" | "calculator" | "precedents">("calculator");
  const [scrolled, setScrolled] = useState(false);
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

  // PAYE Live Calculator state (FY 2025/26 monthly rates, URA ITA Cap 340 4th Schedule)
  const [grossPaye, setGrossPaye] = useState<number>(3500000);
  const NSSF_RATE = 0.05; // 5% employee contribution

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

  const menuBtnRef = useRef<HTMLButtonElement>(null);

  // Keyboard accessibility for mobile navigation menu (Escape key closes menu)
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
    if (id === "calculator") {
      setPreviewTab("calculator");
    }
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

  // Fetch admin-controlled site settings & dynamic counts from database
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

        // Fetch live database counts dynamically
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
          console.warn("Could not retrieve exact live row counts, using defaults.", e);
        }

        // Base values: Cases analyzed = actual count in DB, Practitioners = actual count in DB, Calculators = 6
        const calculatedCases = userCasesCount + tatCasesCount;
        const calculatedPractitioners = registeredUsersCount;

        setDynamicStats({
          cases: `${calculatedCases.toLocaleString()}`,
          timeSaved: mergedSettings.stat_time_saved || "85%",
          practitioners: `${calculatedPractitioners.toLocaleString()}`,
          calculators: mergedSettings.stat_calculators || "6"
        });

      } catch {
        // silently use defaults if table doesn't exist yet
      }
    };
    fetchSettingsAndStats();
  }, []);
  const heroFull = "Uganda Clays Ltd – URA revised assessment of UGX 2,822,278,034 on VAT input disallowances & staff welfare under Section 28 & 31 VATA and Section 22 ITA. Taxpayer produced reconciled ledgers and EFRIS invoices.";
  const typingRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bento Interactive states
  const [simulatorGross, setSimulatorGross] = useState(3500000); // Default 3.5M UGX
  const [vehicleYear, setVehicleYear] = useState(2016); // Default 10 years old vehicle
  const [selectedPrecedent, setSelectedPrecedent] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setHeroText(heroFull);
    setShowResult(true);
  }, [heroFull]);

  const navStyle: React.CSSProperties = {
    background: scrolled ? "rgba(9, 13, 22, 0.96)" : "rgba(9, 13, 22, 0.88)",
    borderBottom: "1px solid rgba(22, 44, 86, 0.6)",
    position: "sticky",
    top: 0,
    zIndex: 300,
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    transition: "all .3s ease",
  };



  const testimonials = [
    { quote: "TaxWise retrieved a crucial TAT precedent in 4 seconds that would have taken me hours to search for manually. It has completely transformed our tribunal preparation.", name: "Sarah Nakato", role: "Senior Tax Consultant, Kampala", initials: "SN", color: "#162C56" },
    { quote: "The vehicle import calculator is incredibly accurate and saves our team massive amounts of time. Client estimates that used to take half a day are now completed instantly.", name: "James Opolot", role: "Customs Agent & Clearing Specialist", initials: "JO", color: "#162C56" },
    { quote: "We ran our records through the compliance checker before a URA audit. It caught a legacy PAYE discrepancy we had missed. Saved us millions in penalties.", name: "Grace Atim", role: "Finance Manager, Manufacturing Sector", initials: "GA", color: "#C8922A" },
  ];

  const plans = [
    { name: "Starter", price: "Free", period: "Forever", features: ["5 case analyses / month", "Basic TAT library search", "PAYE & VAT calculator tool", "Vehicle import calculator", "Standard email support"], cta: "Get Started Free", popular: false },
    { name: "Professional", price: "UGX 120,000", period: "/ month", features: ["Unlimited case analyses", "Full TAT case library + expert commentary", "All tax & import calculators", "eFRIS, VAT & PAYE Compliance Checker", "Exportable PDF reports for clients", "Priority chat support"], cta: "Start 14-Day Trial", popular: true, comingSoon: true },
    { name: "Firm", price: "UGX 350,000", period: "/ month", features: ["Everything in Professional", "Up to 8 team seats", "Admin portal & firm usage metrics", "API access (beta program)", "Dedicated account setup", "ICPAU CPD certificates"], cta: "Contact Sales", popular: false, comingSoon: true },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#090D16", color: "#F4F4F5", lineHeight: 1.6, WebkitFontSmoothing: "antialiased" }}>

      {/* DYNAMIC SCROLL PROGRESS BAR */}
      <div style={{ position: "fixed", top: 0, left: 0, height: "4px", background: "#C8922A", width: `${scrollProgress}%`, zIndex: 1000, transition: "width 0.1s ease-out", pointerEvents: "none" }} />

      {/* TOP BAR */}
      <div className="tw-topbar" style={{ background: "#162C56", padding: "8px 5%", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: ".72rem", color: "rgba(250,249,246,0.9)", fontWeight: 500, letterSpacing: "0.04em", borderBottom: "1px solid rgba(250,249,246,0.08)", flexWrap: "wrap", gap: 6 }}>
        <span className="tw-topbar-tagline" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Globe size={13} style={{ color: "#C8922A", flexShrink: 0 }} />
          <span>{settings.topbar_text}</span>
        </span>
        <div className="tw-topbar-actions" style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span className="tw-topbar-email" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Mail size={13} style={{ color: "#C8922A", flexShrink: 0 }} />
            <span>{settings.topbar_email}</span>
          </span>
          <button type="button" onClick={onGetStarted} style={{ color: "#FAF9F6", background: "none", border: "none", fontWeight: 700, cursor: "pointer", fontFamily: "inherit", fontSize: ".72rem", textDecoration: "underline", whiteSpace: "nowrap" }}>Start Free Trial →</button>
        </div>
      </div>

      {/* NAVIGATION */}
      <div style={navStyle}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 5%", display: "flex", alignItems: "center", justifyContent: "space-between", height: 72 }}>
          {/* Logo */}
          <button 
            type="button"
            onClick={onGetStarted} 
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.5rem", color: "#FFFFFF", display: "flex", alignItems: "center", gap: 8, background: "none", border: "none", cursor: "pointer", marginRight: 32, flexShrink: 0, fontWeight: 800, padding: 0 }}
          >
            <div style={{ width: 10, height: 10, background: "#C8922A", borderRadius: "50%", flexShrink: 0 }} />
            Tax<span style={{ color: "#C8922A" }}>Wise</span>
          </button>

          {/* Desktop Nav Links */}
          <div className="tw-nav-desktop" style={{ display: "flex", alignItems: "center", flex: 1, gap: 4, marginLeft: 8 }}>
            {/* Grouped Tax Tools Menu */}
            <div className="tw-dd" style={{ position: "relative" }} onMouseLeave={() => setTaxToolsOpen(false)}>
              <button
                type="button"
                className="tw-nav-link"
                onClick={() => setTaxToolsOpen(prev => !prev)}
                style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "rgba(255,255,255,0.85)", fontSize: ".835rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
              >
                <span>Tax Tools</span>
                <span style={{ fontSize: ".55rem", opacity: .6, transform: taxToolsOpen ? "rotate(180deg)" : "translateY(0.5px)", transition: "transform 0.2s ease" }}>▼</span>
              </button>
              <div 
                className={`tw-dropdown ${taxToolsOpen ? "force-open" : ""}`} 
                style={{ 
                  position: "absolute", 
                  top: "100%", 
                  left: 0, 
                  background: "#0E1424", 
                  borderRadius: "0 0 8px 8px", 
                  boxShadow: "0 16px 36px rgba(0,0,0,0.5)", 
                  minWidth: 280, 
                  zIndex: 400, 
                  border: "1px solid rgba(22, 44, 86, 0.8)", 
                  borderTop: "3px solid #3B82F6", 
                  padding: "8px",
                  ...(taxToolsOpen ? { opacity: 1, visibility: "visible", transform: "translateY(0)", pointerEvents: "auto" } : {})
                }}
              >
                {[
                  { name: "Case Analyzer", desc: "Evaluate URA audit assessments & objection briefs", page: "analyzer", icon: <Scale size={18} style={{ color: "#3B82F6" }} /> },
                  { name: "Tax & Duty Calculators", desc: "PAYE, VAT, Corporate, Rental & Import duties", page: "calculators", icon: <Calculator size={18} style={{ color: "#2DD4BF" }} /> },
                  { name: "Compliance Review", desc: "Statutory filing deadlines & penalty mitigation", page: "compliance", icon: <ShieldCheck size={18} style={{ color: "#C8922A" }} /> },
                  { name: "Uganda Tax Intelligence", desc: "Legal updates, treaty tax rates & dispute guides", page: "intelligence", icon: <TrendingUp size={18} style={{ color: "#60A5FA" }} /> },
                ].map((t) => (
                  <button 
                    key={t.name} 
                    type="button"
                    onClick={() => {
                      setTaxToolsOpen(false);
                      if (onNavigate) onNavigate(t.page);
                      else onGetStarted();
                    }} 
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 12px", borderRadius: 6, width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", transition: "all .15s" }}
                    onMouseOver={e => { e.currentTarget.style.background = "rgba(59,130,246,0.1)"; }}
                    onMouseOut={e => { e.currentTarget.style.background = "none"; }}
                  >
                    <span style={{ display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: ".835rem", fontWeight: 700, color: "#F4F4F5" }}>{t.name}</div>
                      <div style={{ fontSize: ".71rem", color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.3 }}>{t.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Precedents Link */}
            <button
              className="tw-nav-link"
              onClick={() => {
                if (onNavigate) onNavigate("library");
                else onGetStarted();
              }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "rgba(255,255,255,0.85)", fontSize: ".835rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              TAT Precedents
            </button>

            {/* Direct Learning Hub Link */}
            <button
              className="tw-nav-link"
              onClick={() => {
                if (onNavigate) onNavigate("education");
                else onGetStarted();
              }}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "rgba(255,255,255,0.85)", fontSize: ".835rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
            >
              Learning Hub
            </button>

            {/* Pricing Link */}
            <button
              className="tw-nav-link"
              onClick={() => scrollToId("pricing")}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "0 14px", height: 72, color: "rgba(255,255,255,0.85)", fontSize: ".835rem", fontWeight: 600, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s", whiteSpace: "nowrap" }}
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
                    background: "#162C56",
                    color: "white",
                    padding: "9px 20px",
                    borderRadius: 6,
                    fontSize: ".835rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    transition: "all .3s cubic-bezier(0.16, 1, 0.3, 1)",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(22,44,86,0.12)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6
                  }}
                >
                  <span>Dashboard</span>
                  <ChevronDown size={14} className="tw-chevron" />
                </button>
                <div className="tw-dropdown-container">
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "10px 12px 12px",
                    borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                    marginBottom: "6px"
                  }}>
                    <div style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #162C56 0%, #C8922A 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                      boxShadow: "0 2px 6px rgba(22,44,86,0.15)",
                      flexShrink: 0
                    }}>
                      {dbUser.full_name ? dbUser.full_name[0].toUpperCase() : "U"}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#FFFFFF", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", lineHeight: 1.2 }}>
                        {dbUser.full_name}
                      </span>
                      <span style={{ fontSize: "0.68rem", color: "rgba(255, 255, 255, 0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {dbUser.email || "Professional"}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => {
                    if (onNavigate) onNavigate("dashboard");
                  }} className="tw-dropdown-item">
                    <LayoutDashboard size={15} />
                    <span>Go to Dashboard</span>
                  </button>
                  <button onClick={() => {
                    if (onNavigate) onNavigate("settings");
                  }} className="tw-dropdown-item">
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
                  style={{ color: "rgba(255,255,255,0.85)", fontSize: ".835rem", fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "color .2s" }}
                >
                  Sign In
                </button>
                <button 
                  onClick={onGetStarted} 
                  className="tw-btn-hover" 
                  style={{ 
                    background: "#3B82F6", 
                    color: "white", 
                    padding: "9px 20px", 
                    borderRadius: 6, 
                    fontSize: ".835rem", 
                    fontWeight: 700, 
                    border: "none", 
                    cursor: "pointer", 
                    transition: "all .3s cubic-bezier(0.16, 1, 0.3, 1)", 
                    whiteSpace: "nowrap", 
                    fontFamily: "inherit", 
                    boxShadow: "0 4px 12px rgba(59,130,246,0.25)" 
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
            aria-controls="mainNav"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            style={{
              display: "none",
              alignItems: "center",
              gap: 6,
              padding: "8px 12px",
              background: mobileOpen ? "rgba(59, 130, 246, 0.2)" : "rgba(255, 255, 255, 0.08)",
              border: mobileOpen ? "1px solid #3B82F6" : "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: 8,
              color: "#FFFFFF",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            <span>{mobileOpen ? "Close" : "Menu"}</span>
          </button>
        </div>

        {/* Accessible Mobile Navigation Drawer */}
        <nav 
          id="mainNav"
          className={`tw-main-nav ${mobileOpen ? "open" : ""}`}
          aria-label="Main navigation menu"
          style={{ 
            display: mobileOpen ? "block" : "none",
            background: "#0C1B36", 
            borderTop: "1px solid rgba(255,255,255,.08)", 
            padding: "16px 5%", 
            borderBottom: "1px solid rgba(255,255,255,.08)" 
          }}
        >
          {dbUser && (
            <div style={{ padding: "8px 0 16px", borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: "8px" }}>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Signed in as</span>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>{dbUser.full_name}</div>
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
                if (onNavigate) {
                  onNavigate(item.page);
                } else {
                  onGetStarted();
                }
              }} 
              className="tw-mobile-link" 
              style={{ display: "block", padding: "12px 0", color: "rgba(255,255,255,.8)", background: "none", border: "none", fontSize: ".9rem", fontWeight: 600, borderBottom: "1px solid rgba(255,255,255,.06)", width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", transition: "color .2s" }}
            >
              {item.label}
            </button>
          ))}
          {!dbUser ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
              <button 
                onClick={() => { setMobileOpen(false); onSignIn(); }} 
                style={{ display: "block", padding: "11px 16px", color: "white", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 6, fontSize: ".875rem", fontWeight: 600, width: "100%", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}
              >
                Sign In
              </button>
              <button 
                onClick={() => { setMobileOpen(false); onGetStarted(); }} 
                style={{ display: "block", padding: "11px 16px", color: "white", background: "#3B82F6", border: "none", borderRadius: 6, fontSize: ".875rem", fontWeight: 700, width: "100%", textAlign: "center", cursor: "pointer", fontFamily: "inherit" }}
              >
                Start Free Trial →
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setMobileOpen(false); if (onSignOut) onSignOut(); }} 
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 0", color: "#FCA5A5", background: "none", border: "none", fontSize: ".92rem", fontWeight: 700, width: "100%", textAlign: "left", cursor: "pointer", fontFamily: "inherit", marginTop: 8 }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          )}
        </nav>
      </div>

      {/* HERO SECTION CONTAINER */}
      <div className="tw-hero-section" style={{ background: "#090D16", position: "relative", overflow: "hidden", borderBottom: "1px solid rgba(22, 44, 86, 0.6)", padding: "48px 5% 64px" }}>
        {/* Ambient Blurred Backdrop Glows */}
        <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: "600px", height: "300px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(45, 212, 191, 0.08) 50%, transparent 100%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none", zIndex: 1 }} />
        <div style={{ position: "absolute", top: "40%", left: "30%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(200, 146, 42, 0.05) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(80px)", pointerEvents: "none", zIndex: 1 }} />
        
        {/* Background Grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.02) 1px, transparent 0)", backgroundSize: "32px 32px", opacity: 0.9, zIndex: 0, pointerEvents: "none" }} />

        {/* Centered Hero Content */}
        <div style={{ maxWidth: 1040, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}>
          {/* Top Badge */}
          <div 
            style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", color: "#2DD4BF", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", padding: "6px 14px", borderRadius: 20, marginBottom: 20 }}
          >
            <span style={{ width: 6, height: 6, background: "#2DD4BF", borderRadius: "50%", display: "inline-block", boxShadow: "0 0 8px #2DD4BF" }} />
            {settings.hero_badge_text}
          </div>
          
          {/* Main Centered Title */}
          <h1 
            className="tw-hero-title"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.95rem, 5.2vw, 3.8rem)", color: "#FFFFFF", lineHeight: 1.15, marginBottom: 18, letterSpacing: "-0.03em", fontWeight: 800 }}
          >
            Professional Legal &amp;<br />
            <span style={{ background: "linear-gradient(135deg, #3B82F6 0%, #2DD4BF 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Tax Intelligence
            </span> for Uganda
          </h1>
          
          {/* Hero Subtitle */}
          <p 
            style={{ color: "rgba(255,255,255,0.78)", fontSize: "1.05rem", lineHeight: 1.65, maxWidth: 680, margin: "0 auto 24px", fontWeight: 500, padding: "0 4px" }}
          >
            {settings.hero_subtitle}
          </p>
          
          {/* Centered CTA Buttons */}
          <div 
            className="tw-hero-ctas"
            style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}
          >
            {dbUser ? (
              <button onClick={() => { if (onNavigate) onNavigate("dashboard"); else onGetStarted(); }} className="tw-btn-hover" style={{ background: "#3B82F6", color: "white", padding: "13px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", transition: "all .25s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
                Go to Dashboard →
              </button>
            ) : (
              <button onClick={onGetStarted} className="tw-btn-hover" style={{ background: "#3B82F6", color: "white", padding: "13px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".92rem", border: "none", cursor: "pointer", transition: "all .25s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 4px 14px rgba(59,130,246,0.35)" }}>
                Start 14-Day Free Trial →
              </button>
            )}
            <button onClick={() => scrollToId("features")} style={{ background: "rgba(255,255,255,0.03)", color: "#FFFFFF", padding: "13px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".92rem", border: "1px solid rgba(59, 130, 246, 0.35)", cursor: "pointer", transition: "all .25s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "inherit" }}
              onMouseOver={e => { e.currentTarget.style.background = "rgba(59,130,246,0.15)"; e.currentTarget.style.borderColor = "#2DD4BF"; }}
              onMouseOut={e => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.35)"; }}>
              Explore Platform Tools
            </button>
          </div>

          {/* COMPACT TRUST LINE & CREDIBILITY SIGNALS */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, marginBottom: 32 }}>
            <div 
              className="tw-hero-trust"
              style={{ 
                display: "inline-flex", 
                alignItems: "center", 
                gap: 12, 
                background: "rgba(255, 255, 255, 0.04)", 
                border: "1px solid rgba(255, 255, 255, 0.1)", 
                borderRadius: 30, 
                padding: "7px 20px", 
                fontSize: "0.82rem", 
                color: "rgba(255, 255, 255, 0.85)", 
                fontWeight: 600,
                boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
                flexWrap: "wrap",
                justifyContent: "center"
              }}
            >
              <span style={{ color: "#2DD4BF", fontWeight: 700 }}>Uganda-focused research</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ color: "#C8922A", fontWeight: 700 }}>Tax calculation tools</span>
              <span style={{ opacity: 0.35 }}>·</span>
              <span style={{ color: "#60A5FA", fontWeight: 700 }}>Case-law references</span>
            </div>

            <div className="tw-credibility-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, flexWrap: "wrap", fontSize: "0.74rem", color: "rgba(255, 255, 255, 0.55)", fontWeight: 500 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ShieldCheck size={14} style={{ color: "#2DD4BF" }} />
                <span>Verified TAT Tribunal Coverage (2015–2026)</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Scale size={14} style={{ color: "#C8922A" }} />
                <span>ITA Cap 340 · VATA Cap 349 · TPC Act</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Building2 size={14} style={{ color: "#60A5FA" }} />
                <span>Trusted by Ugandan Tax Practitioners &amp; Firms</span>
              </span>
            </div>
          </div>

          {/* MULTI-TAB PRODUCT PREVIEW & LIVE DEMO PANEL */}
          <div
            style={{ 
              maxWidth: 960, 
              margin: "0 auto", 
              background: "rgba(10, 15, 28, 0.9)", 
              border: "1px solid rgba(22, 44, 86, 0.9)", 
              borderRadius: 14, 
              overflow: "hidden", 
              boxShadow: "0 25px 70px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15)", 
              backdropFilter: "blur(20px)", 
              textAlign: "left" 
            }}
          >
            {/* Header: Window controls & interactive preview tabs */}
            <div className="tw-preview-header" style={{ background: "rgba(22, 44, 86, 0.5)", borderBottom: "1px solid rgba(22, 44, 86, 0.7)", padding: "10px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, maxWidth: "100%", overflowX: "auto" }}>
                <div className="tw-preview-dots" style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#EF4444" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#F59E0B" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} />
                </div>
                
                {/* Preview Navigation Tabs */}
                <div className="tw-preview-tabs" style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(5, 8, 16, 0.6)", padding: "3px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
                  {[
                    { id: "analysis", label: "Case Analysis", icon: <Scale size={13} style={{ color: "#3B82F6" }} />, badge: "Live Output" },
                    { id: "calculator", label: "Tax Calculation Suite", icon: <Calculator size={13} style={{ color: "#2DD4BF" }} />, badge: "Interactive" },
                    { id: "precedents", label: "TAT Precedent Engine", icon: <BookOpen size={13} style={{ color: "#C8922A" }} />, badge: "68+ Cases" },
                  ].map(tab => (
                    <button
                      type="button"
                      key={tab.id}
                      onClick={() => setPreviewTab(tab.id as any)}
                      className="tw-preview-tab-btn"
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: previewTab === tab.id ? "rgba(59, 130, 246, 0.25)" : "transparent",
                        color: previewTab === tab.id ? "#FFFFFF" : "rgba(255, 255, 255, 0.6)",
                        fontSize: ".75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                        flexShrink: 0
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center" }}>{tab.icon}</span>
                      <span>{tab.label}</span>
                      <span className="tw-tab-badge" style={{ 
                        fontSize: ".62rem", 
                        padding: "1px 5px", 
                        borderRadius: 4, 
                        background: previewTab === tab.id ? "rgba(45, 212, 191, 0.2)" : "rgba(255,255,255,0.05)",
                        color: previewTab === tab.id ? "#2DD4BF" : "rgba(255,255,255,0.4)" 
                      }}>
                        {tab.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="tw-preview-version" style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: "#2DD4BF", boxShadow: "0 0 6px #2DD4BF" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: ".68rem", color: "#2DD4BF", fontWeight: 600 }}>
                  URA Tax Act 2026 v4.2
                </span>
              </div>
            </div>

            {/* TAB CONTENT 1: CASE ANALYSIS OUTPUT */}
            {previewTab === "analysis" && (
              <div>
                <div className="tw-analysis-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", borderBottom: "1px solid rgba(22, 44, 86, 0.4)" }}>
                  {/* Left Column: Case Overview & Live Parsing Stream */}
                  <div className="tw-analysis-col-left" style={{ padding: "20px 24px", background: "rgba(10, 15, 28, 0.5)", borderRight: "1px solid rgba(22, 44, 86, 0.4)", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: ".7rem", color: "#3B82F6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
                        <Cpu size={13} /> Document Input &amp; Facts
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: ".65rem", color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.05)", padding: "2px 6px", borderRadius: 4 }}>
                        TAT_App_012_2023.pdf
                      </span>
                    </div>

                    <div style={{ background: "rgba(5, 8, 16, 0.8)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 8, padding: "14px", display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ fontSize: ".82rem", fontWeight: 700, color: "#FFFFFF" }}>
                        Uganda Clays Limited v. Uganda Revenue Authority
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", fontSize: ".7rem" }}>
                        <span style={{ color: "#C8922A", background: "rgba(200, 146, 42, 0.12)", padding: "2px 6px", borderRadius: 4, fontWeight: 700 }}>
                          Assessment: UGX 2,822,278,034
                        </span>
                        <span style={{ color: "#60A5FA", background: "rgba(59, 130, 246, 0.12)", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                          Taxes: VAT &amp; Corp Income Tax
                        </span>
                      </div>
                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 8, fontSize: ".75rem", color: "#94A3B8", lineHeight: 1.5, fontFamily: "'JetBrains Mono', monospace" }}>
                        {heroText || heroFull}
                      </div>
                    </div>

                    {/* Timeline Check Indicator */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", background: "rgba(45, 212, 191, 0.06)", border: "1px solid rgba(45, 212, 191, 0.2)", borderRadius: 6, fontSize: ".72rem" }}>
                      <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Procedural Window:</span>
                      <span style={{ color: "#2DD4BF", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                        <Check size={13} /> Timely filed within 30 days under Sec 14 TAT Act
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Tax Analysis Results (Immediately visible!) */}
                  <div className="tw-analysis-col-right" style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <Sparkles size={14} style={{ color: "#2DD4BF" }} />
                        <span style={{ fontSize: ".75rem", fontWeight: 700, color: "#2DD4BF", letterSpacing: "0.03em" }}>STATUTORY AUDIT &amp; RULING HOLDING</span>
                      </div>
                      <span style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#34D399", padding: "3px 8px", borderRadius: 4, fontSize: ".65rem", fontWeight: 700, letterSpacing: "0.03em", display: "inline-flex", alignItems: "center", gap: 4 }}>
                        <Check size={11} /> 89% TAXPAYER WIN PROBABILITY
                      </span>
                    </div>

                    {/* Legal Issues Card */}
                    <div style={{ background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.18)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: ".75rem", fontWeight: 700, color: "#60A5FA", marginBottom: 3 }}>
                        Core Legal Issues &amp; Statutory Points:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: 16, fontSize: ".73rem", color: "rgba(255,255,255,0.78)", lineHeight: 1.45 }}>
                        <li><strong>Sections 28 &amp; 31, VAT Act</strong>: Disallowance of capital input VAT credits despite validated EFRIS fiscal document numbers.</li>
                        <li><strong>Section 22, Income Tax Act</strong>: Staff welfare deductibility distinct from PAYE withholding obligations.</li>
                      </ul>
                    </div>

                    {/* Concise Summary & Ruling */}
                    <div style={{ background: "rgba(10, 15, 28, 0.6)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 8, padding: "10px 12px" }}>
                      <div style={{ fontSize: ".72rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase", marginBottom: 3 }}>
                        Tribunal Holding &amp; Legal Synthesis:
                      </div>
                      <p style={{ margin: 0, fontSize: ".74rem", color: "#E2E8F0", lineHeight: 1.5 }}>
                        The Tribunal set aside URA&apos;s additional assessment of Shs 2.82B. Held that where audited accounts and verified EFRIS invoices are produced, the Revenue Authority cannot base assessments on suspicion without objective transaction analysis.
                      </p>
                    </div>

                    {/* Supporting Authorities & Precedents */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ fontSize: ".7rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, textTransform: "uppercase" }}>
                        Supporting Binding Authorities:
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ fontSize: ".7rem", color: "#CBD5E1", background: "rgba(22, 44, 86, 0.6)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Scale size={11} style={{ color: "#C8922A" }} /> Tullow Uganda Operations v. URA (TAT 4/2011)
                        </span>
                        <span style={{ fontSize: ".7rem", color: "#CBD5E1", background: "rgba(22, 44, 86, 0.6)", padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.06)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          <Scale size={11} style={{ color: "#3B82F6" }} /> Kasese Cobalt Co. v. URA (HCCA 4/2020)
                        </span>
                      </div>
                    </div>

                    {/* Bottom CTA bar inside preview */}
                    <div style={{ borderTop: "1px solid rgba(22, 44, 86, 0.4)", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
                      <button 
                        onClick={() => {
                          let i = 0;
                          setHeroText("");
                          setShowResult(false);
                          if (typingRef.current) clearTimeout(typingRef.current);
                          const type = () => {
                            if (i < heroFull.length) {
                              setHeroText(heroFull.slice(0, i + 1));
                              i++;
                              typingRef.current = setTimeout(type, 16);
                            } else {
                              typingRef.current = setTimeout(() => setShowResult(true), 300);
                            }
                          };
                          type();
                        }}
                        style={{ background: "none", border: "none", color: "#3B82F6", fontSize: ".72rem", fontWeight: 700, cursor: "pointer", textDecoration: "underline", padding: 0 }}
                      >
                        Replay Parser Stream ↺
                      </button>
                      <button 
                        onClick={() => {
                          if (onNavigate) onNavigate("analyzer");
                          else onGetStarted();
                        }}
                        style={{ background: "#3B82F6", color: "white", padding: "6px 14px", borderRadius: 6, fontSize: ".73rem", fontWeight: 700, border: "none", cursor: "pointer", transition: "all 0.2s" }}
                      >
                        Try with Your Files →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: LIVE PAYE & STATUTORY CALCULATOR (FY 2025/26) */}
            {previewTab === "calculator" && (
              <div className="tw-calc-grid" style={{ padding: "24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: 24 }}>
                {/* Left Column: Interactive Inputs & Controls */}
                <div style={{ background: "rgba(5, 8, 16, 0.8)", border: "1px solid rgba(22, 44, 86, 0.7)", borderRadius: 10, padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calculator size={17} style={{ color: "#3B82F6" }} />
                      <span style={{ fontSize: ".88rem", fontWeight: 700, color: "#FFFFFF" }}>Uganda PAYE Calculator</span>
                    </div>
                    <span style={{ fontSize: ".68rem", color: "#2DD4BF", background: "rgba(45, 212, 191, 0.12)", border: "1px solid rgba(45, 212, 191, 0.3)", padding: "2px 8px", borderRadius: 4, fontWeight: 700 }}>
                      FY 2025/26 Monthly Rates
                    </span>
                  </div>

                  {/* Gross Income Input Field */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                      <label htmlFor="gross" style={{ fontSize: ".76rem", color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>
                        Gross Monthly Income
                      </label>
                      <span style={{ fontSize: ".72rem", color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace", fontWeight: 700 }}>
                        {money(currentIncome)}
                      </span>
                    </div>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: 12, fontSize: ".75rem", color: "rgba(255,255,255,0.45)", fontWeight: 700, pointerEvents: "none" }}>
                        UGX
                      </span>
                      <input
                        id="gross"
                        type="number"
                        min="0"
                        step="50000"
                        value={grossPaye}
                        onChange={(e) => setGrossPaye(Math.max(0, Number(e.target.value) || 0))}
                        style={{
                          width: "100%",
                          padding: "10px 12px 10px 48px",
                          background: "rgba(10, 15, 28, 0.9)",
                          border: "1.5px solid rgba(59, 130, 246, 0.4)",
                          borderRadius: 8,
                          color: "#FFFFFF",
                          fontSize: ".9rem",
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', monospace",
                          outline: "none",
                          transition: "border-color 0.2s"
                        }}
                      />
                    </div>
                  </div>

                  {/* Range Slider linked to gross */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
                      <span>Slide Income:</span>
                      <span style={{ color: "#2DD4BF", fontWeight: 700 }}>0 to 20,000,000+</span>
                    </div>
                    <input
                      id="slide"
                      type="range"
                      min="0"
                      max="20000000"
                      step="50000"
                      value={grossPaye}
                      onChange={(e) => setGrossPaye(Math.max(0, Number(e.target.value) || 0))}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".65rem", color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      <span>UGX 0</span>
                      <span>UGX 5M</span>
                      <span style={{ color: "#F59E0B" }}>UGX 10M (Surcharge)</span>
                      <span>UGX 20M</span>
                    </div>
                  </div>

                  {/* Preset Salary Chips */}
                  <div>
                    <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 600 }}>
                      Quick Salary Presets:
                    </span>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {[
                        { label: "500K", val: 500000 },
                        { label: "1.5M", val: 1500000 },
                        { label: "3.5M", val: 3500000 },
                        { label: "6.5M", val: 6500000 },
                        { label: "12M (Exec)", val: 12000000 },
                      ].map(p => (
                        <button
                          type="button"
                          key={p.label}
                          onClick={() => setGrossPaye(p.val)}
                          style={{
                            background: grossPaye === p.val ? "rgba(59, 130, 246, 0.3)" : "rgba(22, 44, 86, 0.4)",
                            border: grossPaye === p.val ? "1px solid #3B82F6" : "1px solid rgba(255,255,255,0.08)",
                            color: grossPaye === p.val ? "#FFFFFF" : "rgba(255,255,255,0.75)",
                            borderRadius: 4,
                            padding: "4px 8px",
                            fontSize: ".68rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.15s"
                          }}
                        >
                          UGX {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Proportion Bar */}
                  {currentIncome > 0 && (
                    <div style={{ background: "rgba(10, 15, 28, 0.6)", padding: "10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".68rem", color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
                        <span>Salary Distribution</span>
                        <span>Take-Home: <strong style={{ color: "#2DD4BF" }}>{pct(currentNet, currentIncome)}</strong></span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: "rgba(255,255,255,0.1)", display: "flex", overflow: "hidden" }}>
                        <div style={{ width: pct(currentNet, currentIncome), background: "#2DD4BF", transition: "width 0.2s" }} title="Net Take-Home" />
                        <div style={{ width: pct(currentPaye, currentIncome), background: "#3B82F6", transition: "width 0.2s" }} title="PAYE Tax" />
                        <div style={{ width: pct(currentNssf, currentIncome), background: "#F59E0B", transition: "width 0.2s" }} title="NSSF 5%" />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".62rem", color: "rgba(255,255,255,0.45)", marginTop: 6 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD4BF" }} /> Net Pay</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3B82F6" }} /> PAYE Tax</span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} /> NSSF (5%)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Instant Statutory Calculation Results */}
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {/* Hero Net Take-Home Card */}
                  <div style={{ background: "rgba(45, 212, 191, 0.08)", border: "1.5px solid rgba(45, 212, 191, 0.35)", borderRadius: 10, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontSize: ".72rem", color: "#2DD4BF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                        Net Take-Home Pay
                      </span>
                      <strong id="net" style={{ fontSize: "1.35rem", color: "#FFFFFF", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                        {money(currentNet)}
                      </strong>
                      <span style={{ fontSize: ".68rem", color: "rgba(255,255,255,0.6)" }}>
                        Direct deposit after statutory PAYE &amp; employee NSSF
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <span style={{ fontSize: ".65rem", color: "rgba(255,255,255,0.5)", display: "block" }}>Total Deductions</span>
                      <span id="trate" style={{ fontSize: ".9rem", fontWeight: 800, color: "#FCA5A5", fontFamily: "'JetBrains Mono', monospace" }}>
                        {currentTrate}
                      </span>
                    </div>
                  </div>

                  {/* Secondary Metrics Grid */}
                  <div className="tw-calc-subgrid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    {/* PAYE Tax */}
                    <div style={{ background: "rgba(10, 15, 28, 0.7)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "12px" }}>
                      <span style={{ fontSize: ".68rem", color: "#93C5FD", fontWeight: 600, display: "block" }}>Monthly PAYE Tax</span>
                      <strong id="paye" style={{ fontSize: "1rem", color: "#60A5FA", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                        {money(currentPaye)}
                      </strong>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: ".65rem", color: "rgba(255,255,255,0.5)" }}>
                        <span>Effective Rate:</span>
                        <strong id="prate" style={{ color: "#93C5FD" }}>{currentPrate}</strong>
                      </div>
                    </div>

                    {/* Employee NSSF (5%) */}
                    <div style={{ background: "rgba(10, 15, 28, 0.7)", border: "1px solid rgba(245, 158, 11, 0.25)", borderRadius: 8, padding: "12px" }}>
                      <span style={{ fontSize: ".68rem", color: "#FCD34D", fontWeight: 600, display: "block" }}>Employee NSSF (5%)</span>
                      <strong id="nssf" style={{ fontSize: "1rem", color: "#FBBF24", fontFamily: "'JetBrains Mono', monospace", display: "block", marginTop: 2 }}>
                        {money(currentNssf)}
                      </strong>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, fontSize: ".65rem", color: "rgba(255,255,255,0.5)" }}>
                        <span>Retirement fund:</span>
                        <strong style={{ color: "#FCD34D" }}>5.0%</strong>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Band Schedule Details */}
                  <div style={{ background: "rgba(5, 8, 16, 0.6)", border: "1px solid rgba(22, 44, 86, 0.5)", borderRadius: 8, padding: "12px" }}>
                    <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                      <span>Uganda Income Tax Act (ITA Cap 340) Bands:</span>
                      <span style={{ color: "#2DD4BF", fontSize: ".65rem" }}>Resident Schedule</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: ".67rem", color: "rgba(255,255,255,0.65)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span>First UGX 235,000</span>
                        <span style={{ color: "#34D399", fontWeight: 600 }}>0% (Exempt)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span>UGX 235,001 – 335,000</span>
                        <span style={{ color: "#60A5FA", fontWeight: 600 }}>10% of excess over 235k</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span>UGX 335,001 – 410,000</span>
                        <span style={{ color: "#60A5FA", fontWeight: 600 }}>20% (+UGX 10,000)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                        <span>UGX 410,001 – 10,000,000</span>
                        <span style={{ color: "#F59E0B", fontWeight: 600 }}>30% (+UGX 25,000)</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                        <span>Above UGX 10,000,000</span>
                        <span style={{ color: "#EF4444", fontWeight: 600 }}>40% (Extra 10% Surcharge)</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Navigation */}
                  <div style={{ display: "flex", gap: 10, marginTop: "auto" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigate) onNavigate("calculators");
                        else onGetStarted();
                      }}
                      style={{
                        flex: 1,
                        background: "#3B82F6",
                        color: "white",
                        padding: "10px 14px",
                        borderRadius: 6,
                        fontSize: ".8rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        textAlign: "center",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 6,
                        transition: "all 0.2s"
                      }}
                    >
                      <Calculator size={14} />
                      <span>Open Full Multi-Tax Calculator Suite →</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT 3: TAT PRECEDENT ENGINE */}
            {previewTab === "precedents" && (
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ background: "rgba(5, 8, 16, 0.8)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Search size={15} style={{ color: "#3B82F6", flexShrink: 0 }} />
                  <span style={{ fontSize: ".82rem", color: "#FFFFFF", fontFamily: "'JetBrains Mono', monospace", flex: 1, minWidth: "180px" }}>
                    &ldquo;EFRIS input tax credit disallowance reconciliation&rdquo;
                  </span>
                  <span style={{ fontSize: ".68rem", color: "#2DD4BF", background: "rgba(45, 212, 191, 0.12)", padding: "2px 8px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>
                    3 Matching Precedents
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))", gap: 12 }}>
                  <div style={{ background: "rgba(10, 15, 28, 0.6)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 8, padding: "14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#FFFFFF" }}>Uganda Clays v. URA (2024)</span>
                      <span style={{ fontSize: ".65rem", color: "#10B981", background: "rgba(16, 185, 129, 0.1)", padding: "1px 5px", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>Assessment Quashed</span>
                    </div>
                    <p style={{ margin: 0, fontSize: ".72rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
                      EFRIS fiscal document numbers provide valid documentary trail; URA cannot disallow input tax based on perceived similarity of expense description.
                    </p>
                    <span style={{ fontSize: ".68rem", color: "#3B82F6", marginTop: 4, fontWeight: 600 }}>Citations: Sec 28 VATA · Sec 22 ITA</span>
                  </div>

                  <div style={{ background: "rgba(10, 15, 28, 0.6)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 8, padding: "14px", display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#FFFFFF" }}>Edward Mwanje v. URA (2025)</span>
                      <span style={{ fontSize: ".65rem", color: "#F87171", background: "rgba(239, 68, 68, 0.1)", padding: "1px 5px", borderRadius: 3, fontWeight: 700, flexShrink: 0 }}>Jurisdiction Denied</span>
                    </div>
                    <p style={{ margin: 0, fontSize: ".72rem", color: "rgba(255,255,255,0.7)", lineHeight: 1.45 }}>
                      TAT holds zero jurisdiction to entertain late appeal without an explicit statutory extension application under Section 14(2) TAT Act.
                    </p>
                    <span style={{ fontSize: ".68rem", color: "#3B82F6", marginTop: 4, fontWeight: 600 }}>Citations: Sec 14 TAT Act · Rule 12 TAT Rules</span>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(22, 44, 86, 0.4)", paddingTop: 12, flexWrap: "wrap", gap: 10 }}>
                  <span style={{ fontSize: ".74rem", color: "rgba(255,255,255,0.5)" }}>
                    Indexed over 68 binding Uganda tax judgments from 2015 to 2026.
                  </span>
                  <button 
                    onClick={() => {
                      if (onNavigate) onNavigate("library");
                      else onGetStarted();
                    }}
                    style={{ background: "#3B82F6", color: "white", padding: "8px 16px", borderRadius: 6, fontSize: ".78rem", fontWeight: 700, border: "none", cursor: "pointer" }}
                  >
                    Search Full Case Library →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* STATS SECTION — values controlled via Admin > Site Settings */}
      <div style={{ background: "#090D16", borderBottom: "1px solid rgba(22, 44, 86, 0.6)", position: "relative" }}>
        <motion.div 
          className="tw-stats-grid" 
          style={{ maxWidth: 1000, margin: "0 auto", padding: "48px 5%", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {[
            [dynamicStats.cases, "Cases Analyzed"],
            [dynamicStats.timeSaved, "Time Saved vs Manual"],
            [dynamicStats.practitioners, "Active Practitioners"],
            [dynamicStats.calculators, "Live Tax Calculators"],
          ].map(([num, desc], i, arr) => (
            <div key={desc} className="tw-stat-item" style={{ padding: "0 10px", textAlign: "center", borderRight: i < arr.length - 1 ? "1px solid rgba(22, 44, 86, 0.4)" : "none" }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.5rem", color: "#C8922A", fontWeight: 800 }}>
                <CountingNumber value={num} />
              </div>
              <div style={{ fontSize: ".8rem", color: "rgba(255, 255, 255, 0.45)", marginTop: 8, fontWeight: 600, letterSpacing: "0.02em" }}>{desc}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* FEATURES SECTION */}
      <section id="features" className="tw-section" style={{ padding: "96px 5%", background: "#090D16", borderBottom: "1px solid rgba(22, 44, 86, 0.6)", position: "relative" }}>
        {/* Background ambient glow behind Bento */}
        <div style={{ position: "absolute", bottom: "10%", right: "5%", width: "400px", height: "400px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.04) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ maxWidth: 1150, margin: "0 auto" }}>
          <motion.div 
            style={{ textAlign: "center", marginBottom: 64 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 12, display: "inline-flex", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "4px 12px", borderRadius: 20 }}>Platform Capabilities</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.8rem)", color: "#FFFFFF", marginBottom: 14, fontWeight: 800, letterSpacing: "-0.02em" }}>Every tool a Uganda tax expert needs</h2>
            <p style={{ color: "rgba(255,255,255,0.72)", maxWidth: 580, margin: "0 auto", lineHeight: 1.7, fontSize: ".95rem", fontWeight: 500 }}>Tailored specifically for Uganda&apos;s statutory codes. Streamline advisory, calculations, and compliance instantly.</p>
          </motion.div>
          
          {/* Bento Grid Layout */}
          <div className="tw-feat-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24, marginBottom: 24 }}>
            
            {/* CARD 1: Interactive PAYE Simulator (Double Width / Left Side) */}
            <motion.div 
              className="tw-bento-card"
              style={{ background: "rgba(10, 15, 28, 0.75)", border: "1px solid rgba(22, 44, 86, 0.9)", borderRadius: 12, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3B82F6", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                    <Cpu size={14} /> Interactive PAYE Simulator
                  </div>
                  <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF" }}>Instant Uganda Payroll Tax Breakdowns</h3>
                </div>
                <span style={{ background: "rgba(16,185,129,0.12)", color: "#10B981", border: "1px solid rgba(16,185,129,0.2)", fontSize: ".65rem", fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>FY 2025/2026</span>
              </div>
              
              <p style={{ fontSize: ".84rem", color: "rgba(255,255,255,0.65)", marginBottom: 24, lineHeight: 1.5 }}>
                Slide to adjust gross monthly salary. View statutory calculations under Uganda&apos;s Income Tax Act Cap 340 (including the graduated brackets and the 10% super-tax for high earners).
              </p>

              {/* Slider Input */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".8rem", fontWeight: 600, color: "#FFFFFF", marginBottom: 10 }}>
                  <span>Gross Monthly Salary:</span>
                  <span style={{ color: "#3B82F6", fontSize: "1rem", fontWeight: 700 }}>UGX {simulatorGross.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min={100000} 
                  max={15000000} 
                  step={50000}
                  value={simulatorGross} 
                  onChange={e => setSimulatorGross(Number(e.target.value))}
                  style={{ width: "100%", height: 6, background: "rgba(22, 44, 86, 0.8)", borderRadius: 3, outline: "none", cursor: "pointer", accentColor: "#3B82F6" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: ".65rem", color: "rgba(255,255,255,0.4)", marginTop: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                  <span>100K UGX</span>
                  <span>5M UGX</span>
                  <span>10M UGX</span>
                  <span>15M UGX</span>
                </div>
              </div>

              {/* Real-time Tax Output Grid */}
              {(() => {
                const g = simulatorGross;
                const nssf = g * 0.05; // 5% Employee Contribution
                
                // Calculate Ugandan PAYE Brackets
                let paye = 0;
                if (g <= 235000) {
                  paye = 0;
                } else if (g <= 335000) {
                  paye = (g - 235000) * 0.10;
                } else if (g <= 410000) {
                  paye = 10000 + (g - 335000) * 0.20;
                } else {
                  paye = 25000 + (g - 410000) * 0.30;
                }
                
                // Extra 10% super tax for gross exceeding 10,000,000
                if (g > 10000000) {
                  paye += (g - 10000000) * 0.10;
                }
                
                const net = g - paye - nssf;
                const totalDeductions = paye + nssf;
                const effectiveRate = g > 0 ? (totalDeductions / g) * 100 : 0;

                return (
                  <div className="tw-sim-results" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                    <div style={{ background: "rgba(22, 44, 86, 0.2)", border: "1px solid rgba(22, 44, 86, 0.5)", borderRadius: 8, padding: "16px" }}>
                      <div style={{ fontSize: ".68rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>NSSF Employee (5%)</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#E4E4E7" }}>UGX {Math.round(nssf).toLocaleString()}</div>
                    </div>
                    <div style={{ background: "rgba(22, 44, 86, 0.2)", border: "1px solid rgba(22, 44, 86, 0.5)", borderRadius: 8, padding: "16px" }}>
                      <div style={{ fontSize: ".68rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>URA PAYE Deduction</div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#FCA5A5" }}>UGX {Math.round(paye).toLocaleString()}</div>
                    </div>
                    <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: 8, padding: "16px", gridColumn: "span 2", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ fontSize: ".68rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Net Take-Home Pay</div>
                        <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#2DD4BF" }}>UGX {Math.round(net).toLocaleString()}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: ".68rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 4 }}>Effective Tax Rate</div>
                        <div style={{ fontSize: "1rem", fontWeight: 700, color: "#FFFFFF" }}>{effectiveRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </motion.div>

            {/* CARD 2: Active Ugandan Court Precedents (Compact Card / Right Side) */}
            <motion.div 
              className="tw-bento-card"
              style={{ background: "rgba(10, 15, 28, 0.75)", border: "1px solid rgba(22, 44, 86, 0.9)", borderRadius: 12, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C8922A", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                  <FileText size={14} /> Court Precedents & Rulings
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 12 }}>TAT Uganda Case Index</h3>
                <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.6)", marginBottom: 18, lineHeight: 1.5 }}>
                  Click a high-profile case below to extract critical holding summaries and statutory impacts instantly.
                </p>

                {/* Case items */}
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { id: "comelsa", title: "COMELSA vs URA (2024)", excerpt: "Section 28 non-resident consultant withholding tax assessed at 15% upheld." },
                    { id: "stanchart", title: "Stanchart vs URA (2023)", excerpt: "Transfer pricing adjustments on cross-border interest rates." },
                    { id: "mtn", title: "MTN vs Commissioner (2022)", excerpt: "Telecom promotional excise tax rebate thresholds." }
                  ].map(caseItem => (
                    <button 
                      key={caseItem.id} 
                      onClick={() => setSelectedPrecedent(selectedPrecedent === caseItem.id ? null : caseItem.id)}
                      style={{ background: selectedPrecedent === caseItem.id ? "rgba(200, 146, 42, 0.12)" : "rgba(255, 255, 255, 0.02)", border: selectedPrecedent === caseItem.id ? "1px solid #C8922A" : "1px solid rgba(255, 255, 255, 0.06)", borderRadius: 6, padding: "10px 12px", width: "100%", textAlign: "left", cursor: "pointer", transition: "all 0.2s" }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: ".8rem", fontWeight: 700, color: "#FFFFFF" }}>{caseItem.title}</span>
                        <span style={{ fontSize: ".6rem", color: "#C8922A" }}>{selectedPrecedent === caseItem.id ? "Close ▲" : "View ▼"}</span>
                      </div>
                      {selectedPrecedent === caseItem.id && (
                        <p style={{ fontSize: ".76rem", color: "rgba(255,255,255,0.8)", marginTop: 8, borderTop: "1px dashed rgba(255,255,255,0.1)", paddingTop: 8, lineHeight: 1.4 }}>
                          {caseItem.excerpt}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: 18, fontSize: ".72rem", color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
                *Database synchronized with standard High Court & TAT gazettes.
              </div>
            </motion.div>
          </div>

          <div className="tw-feat-grid" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: 24 }}>
            
            {/* CARD 3: Vehicle Depreciation Import Calculator */}
            <motion.div 
              className="tw-bento-card"
              style={{ background: "rgba(10, 15, 28, 0.75)", border: "1px solid rgba(22, 44, 86, 0.9)", borderRadius: 12, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#2DD4BF", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 6 }}>
                  <TrendingUp size={14} /> Customs & Vehicle Duty
                </div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 12 }}>Vehicle Customs Duty & Environmental Levy</h3>
                <p style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.6)", marginBottom: 18, lineHeight: 1.5 }}>
                  Select manufacture year for an imported vehicle to calculate environmental surcharge tax and customs duties under the East African Customs Management Act.
                </p>

                {/* Input selector */}
                <div style={{ marginBottom: 18 }}>
                  <label style={{ display: "block", fontSize: ".74rem", fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Vehicle Manufacture Year:</label>
                  <select 
                    value={vehicleYear} 
                    onChange={e => setVehicleYear(Number(e.target.value))}
                    style={{ background: "rgba(10, 15, 28, 0.8)", border: "1px solid rgba(22, 44, 86, 0.8)", borderRadius: 6, padding: "10px", width: "100%", color: "#FFFFFF", fontSize: ".8rem", outline: "none", fontFamily: "inherit" }}
                  >
                    {[2026, 2024, 2022, 2020, 2018, 2016, 2014, 2012, 2010, 2008].map(y => (
                      <option key={y} value={y}>{y} ({2026 - y} Years Old)</option>
                    ))}
                  </select>
                </div>

                {/* Calculation Outputs */}
                {(() => {
                  const age = 2026 - vehicleYear;
                  let envLevyRate = 0;
                  if (age < 5) envLevyRate = 0;
                  else if (age <= 10) envLevyRate = 35; // 35% environmental levy
                  else envLevyRate = 50; // 50% environmental levy

                  return (
                    <div style={{ background: "rgba(22, 44, 86, 0.2)", border: "1px solid rgba(22, 44, 86, 0.5)", borderRadius: 8, padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: ".68rem", fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" }}>URA Environmental Levy</span>
                        <div style={{ fontSize: "1.1rem", fontWeight: 700, color: age >= 15 ? "#EF4444" : "#FFFFFF", marginTop: 2 }}>
                          {envLevyRate}% CIF Value
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ background: envLevyRate > 0 ? "rgba(239,68,68,0.12)" : "rgba(16,185,129,0.12)", color: envLevyRate > 0 ? "#FCA5A5" : "#10B981", fontSize: ".68rem", fontWeight: 700, padding: "4px 8px", borderRadius: 4 }}>
                          {age >= 15 ? "PROHIBITED?" : age >= 10 ? "HIGH LEVY" : "STANDARD"}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div style={{ marginTop: 18, fontSize: ".72rem", color: "rgba(255,255,255,0.4)" }}>
                *Assumes default cost, insurance, and freight (CIF) values as verified by URA guidelines.
              </div>
            </motion.div>

            {/* CARD 4: Unified Platform Features Grid (Right Side) */}
            <motion.div 
              className="tw-bento-card"
              style={{ background: "rgba(10, 15, 28, 0.75)", border: "1px solid rgba(22, 44, 86, 0.9)", borderRadius: 12, padding: 32, boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#3B82F6", fontSize: ".72rem", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", marginBottom: 12 }}>
                <Star size={14} /> Full Legal Portal Assets
              </div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 20 }}>Comprehensive Professional Features</h3>

              <div className="tw-portal-assets-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
                {[
                  { title: "Case Analyzer", desc: "Scan litigation briefs & objection templates against Cap 340/349 statutory provisions.", icon: <Search size={20} style={{ color: "#3B82F6" }} /> },
                  { title: "Compliance Checklists", desc: "Validate transaction workflows to bypass the standard UGX 6M URA penalty fine.", icon: <Check size={20} style={{ color: "#2DD4BF" }} /> },
                  { title: "WHT Treaty Maps", desc: "Track non-resident double taxation avoidance treaties active across East Africa.", icon: <Globe size={20} style={{ color: "#C8922A" }} /> },
                  { title: "Client Report Builder", desc: "Compile structured risk briefings and citations for foreign and domestic clients.", icon: <FileText size={20} style={{ color: "#60A5FA" }} /> }
                ].map(item => (
                  <div key={item.title} style={{ background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8, padding: "16px", cursor: "pointer" }} onClick={onGetStarted}>
                    <div style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>{item.icon}</div>
                    <h4 style={{ fontSize: ".85rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>{item.title}</h4>
                    <p style={{ fontSize: ".74rem", color: "rgba(255,255,255,0.55)", lineHeight: 1.45 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="tw-section" style={{ padding: "96px 5%", background: "#090D16", borderTop: "1px solid rgba(22, 44, 86, 0.4)", borderBottom: "1px solid rgba(22, 44, 86, 0.4)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div 
            style={{ textAlign: "center", marginBottom: 64 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 12, display: "inline-flex", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "4px 12px", borderRadius: 20 }}>User Workflow</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.02em" }}>Legal intelligence in three simple steps</h2>
          </motion.div>
          
          <div className="tw-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, overflow: "hidden" }}>
            {[
              { step: "01", icon: <FileText size={24} style={{ color: "#3B82F6" }} />, title: "Upload or paste your case", desc: "Upload a TAT ruling PDF, paste a URA assessment, or describe your scenario. We accept all text structures.", x: -50, y: 0 },
              { step: "02", icon: <Cpu size={24} style={{ color: "#3B82F6" }} />, title: "Analyzes in 30 seconds", desc: "The engine references Uganda tax acts, TAT precedents, and URA practice notes to deliver an interactive report.", x: 0, y: 50 },
              { step: "03", icon: <TrendingUp size={24} style={{ color: "#3B82F6" }} />, title: "Act on structured findings", desc: "Download a clean report detailing risk level, precedents, applicable rules, and next steps. Ready for clients.", x: 50, y: 0 },
            ].map(s => (
              <motion.div 
                key={s.step} 
                style={{ position: "relative", background: "rgba(10, 15, 28, 0.45)", border: "1px solid rgba(22, 44, 86, 0.5)", padding: "28px", borderRadius: 12 }}
                initial={{ opacity: 0, x: s.x, y: s.y }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.7, ease: "easeOut" }}
              >
                <div style={{ fontSize: "3.2rem", fontFamily: "'Playfair Display', Georgia, serif", color: "#C8922A", fontWeight: 800, lineHeight: 1, marginBottom: 14 }}>{s.step}</div>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 14, width: 44, height: 44, background: "rgba(59, 130, 246, 0.08)", borderRadius: "50%", justifyContent: "center" }}>{s.icon}</div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: ".875rem", color: "rgba(255,255,255,0.65)", lineHeight: 1.65, fontWeight: 500 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS SECTION */}
      <section className="tw-section" style={{ padding: "96px 5%", background: "#0E1424" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div 
            style={{ textAlign: "center", marginBottom: 64 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 12, display: "inline-flex", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "4px 12px", borderRadius: 20 }}>Practitioner Trust</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "#FFFFFF", fontWeight: 800, letterSpacing: "-0.02em" }}>Used by Uganda&apos;s tax community</h2>
          </motion.div>
          
          <div className="tw-testi-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {testimonials.map((t, idx) => (
              <motion.div 
                key={t.name} 
                className="tw-testi" 
                style={{ background: "rgba(10, 15, 28, 0.6)", border: "1px solid rgba(22, 44, 86, 0.6)", borderRadius: 12, padding: 30, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 30px rgba(0,0,0,0.25)" }}
                initial={{ opacity: 0, y: 45 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.12 }}
              >
                <div>
                  <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                    {[...Array(5)].map((_, idx) => (
                      <Star key={idx} size={14} style={{ fill: "#C8922A", color: "#C8922A" }} />
                    ))}
                  </div>
                  <blockquote style={{ fontSize: ".875rem", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, marginBottom: 24, fontStyle: "italic", fontWeight: 500 }}>&ldquo;{t.quote}&rdquo;</blockquote>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ".8rem", fontWeight: 700, color: "white", flexShrink: 0 }}>{t.initials}</div>
                  <div>
                    <div style={{ fontSize: ".875rem", fontWeight: 700, color: "#FFFFFF" }}>{t.name}</div>
                    <div style={{ fontSize: ".75rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="tw-section" style={{ padding: "96px 5%", background: "#090D16", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.03) 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        
        <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <motion.div 
            style={{ textAlign: "center", marginBottom: 64 }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div style={{ fontSize: ".72rem", fontWeight: 700, color: "#2DD4BF", textTransform: "uppercase", letterSpacing: ".15em", marginBottom: 12, display: "inline-flex", background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "4px 12px", borderRadius: 20 }}>Transparent Subscriptions</div>
            <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "#FFFFFF", marginBottom: 16, fontWeight: 800, letterSpacing: "-0.02em" }}>Choose the right plan for your firm</h2>
            <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, fontSize: ".95rem", maxWidth: 500, margin: "0 auto", fontWeight: 500 }}>Start free, upgrade as your client base scales. Billing in Uganda Shillings (UGX).</p>
          </motion.div>
          
          <div className="tw-price-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, alignItems: "stretch" }}>
            {plans.map((plan, idx) => {
              if (plan.comingSoon) {
                return (
                  <motion.div
                    key={plan.name}
                    style={{
                      background: "rgba(10, 15, 28, 0.4)",
                      border: "1px dashed rgba(22, 44, 86, 0.8)",
                      borderRadius: 12,
                      padding: "48px 28px",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      minHeight: "420px",
                    }}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ duration: 0.6, delay: idx * 0.12 }}
                  >
                    <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)", background: "#C8922A", color: "white", fontSize: ".68rem", fontWeight: 800, padding: "4px 14px", borderRadius: 4, whiteSpace: "nowrap", letterSpacing: "0.04em" }}>COMING SOON</div>
                    <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>{plan.name}</div>
                    
                    <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                      <div
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: "50%",
                          background: "rgba(200, 146, 42, 0.05)",
                          color: "#C8922A",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 16,
                        }}
                      >
                        <Clock size={24} style={{ color: "#C8922A" }} />
                      </div>
                      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.6rem", fontWeight: 700, color: "#FFFFFF", marginBottom: 8 }}>
                        Coming Soon
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.55)", maxWidth: "220px", lineHeight: "1.5", fontWeight: 500 }}>
                        We are currently finalizing this tier to bring you advanced tax analysis tools.
                      </p>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div 
                  key={plan.name} 
                  className={`tw-price-card ${plan.popular ? 'glow-border' : ''}`} 
                  style={{ background: plan.popular ? "rgba(22, 44, 86, 0.6)" : "rgba(10, 15, 28, 0.75)", border: plan.popular ? "1px solid #3B82F6" : "1px solid rgba(22, 44, 86, 0.9)", borderRadius: 12, padding: "32px 28px", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 10px 30px rgba(0,0,0,0.3)", backdropFilter: "blur(10px)" }}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                >
                  <div>
                    {plan.popular && (
                      <div style={{ position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)", background: "#3B82F6", color: "white", fontSize: ".68rem", fontWeight: 800, padding: "4px 14px", borderRadius: 4, whiteSpace: "nowrap", letterSpacing: "0.04em", boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)" }}>MOST POPULAR</div>
                    )}
                    <div style={{ fontSize: ".7rem", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: plan.popular ? "#3B82F6" : "rgba(255,255,255,0.45)", marginBottom: 10 }}>{plan.name}</div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "2.4rem", color: "#FFFFFF", fontWeight: 800 }}>{plan.price}</div>
                    <div style={{ fontSize: ".8rem", color: "rgba(255,255,255,0.5)", marginBottom: 24, fontWeight: 500 }}>{plan.period}</div>
                    <hr style={{ border: "none", borderTop: "1px solid rgba(22, 44, 86, 0.8)", margin: "20px 0" }} />
                    
                    <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
                      {plan.features.map(f => (
                        <li key={f} style={{ fontSize: ".85rem", color: "rgba(255,255,255,0.8)", display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.4, fontWeight: 500 }}>
                          <span style={{ color: "#3B82F6", flexShrink: 0, marginTop: 3 }}>
                            <Check size={14} />
                          </span>
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <button onClick={onGetStarted} style={{ display: "block", width: "100%", textAlign: "center", padding: "12px", borderRadius: 6, fontWeight: 700, fontSize: ".88rem", cursor: "pointer", fontFamily: "inherit", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", border: plan.popular ? "none" : "1.5px solid rgba(59, 130, 246, 0.4)", color: "#FFFFFF", background: plan.popular ? "#3B82F6" : "transparent" }}
                    onMouseOver={e => { 
                      if (!plan.popular) {
                        e.currentTarget.style.background = "rgba(59, 130, 246, 0.1)";
                        e.currentTarget.style.borderColor = "#3B82F6";
                      } else {
                        e.currentTarget.style.background = "#2563EB";
                        e.currentTarget.style.transform = "scale(1.02)";
                      }
                    }}
                    onMouseOut={e => { 
                      if (!plan.popular) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "rgba(59, 130, 246, 0.4)";
                      } else {
                        e.currentTarget.style.background = "#3B82F6";
                        e.currentTarget.style.transform = "none";
                      }
                    }}>
                    {plan.cta}
                  </button>
                </motion.div>
              );
            })}
          </div>
          
          <motion.div 
            style={{ background: "rgba(10, 15, 28, 0.6)", border: "1px solid rgba(22, 44, 86, 0.8)", borderRadius: 12, padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, flexWrap: "wrap", gap: 14 }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <span style={{ fontSize: ".82rem", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>Flexible Local Payments Integrated</span>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {["MTN Mobile Money", "Airtel Money", "Visa / Mastercard", "Electronic Bank Transfer"].map(m => (
                <span key={m} style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 6, padding: "6px 12px", fontSize: ".72rem", fontWeight: 700, color: "#FFFFFF" }}>{m}</span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="tw-section" style={{ padding: "80px 5%", background: "#0E1424", borderTop: "1px solid rgba(22, 44, 86, 0.5)", borderBottom: "1px solid rgba(22, 44, 86, 0.5)", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.04) 1.5px, transparent 0)", backgroundSize: "32px 32px", opacity: 0.8 }} />
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "450px", height: "450px", background: "radial-gradient(circle, rgba(59, 130, 246, 0.05) 0%, transparent 70%)", borderRadius: "50%", filter: "blur(60px)", pointerEvents: "none" }} />
        
        <motion.div 
          style={{ maxWidth: 750, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 10 }}
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", color: "white", marginBottom: 18, fontWeight: 800 }}>Ready to upgrade your practice?</h2>
          <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 36, fontWeight: 500 }}>Join leading tax firms and corporate finance departments saving hours every week. Try our full suite free.</p>
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            {dbUser ? (
              <button onClick={() => { if (onNavigate) onNavigate("dashboard"); else onGetStarted(); }} className="tw-btn-hover" style={{ background: "white", color: "#090D16", padding: "14px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".925rem", border: "none", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "inherit" }}>
                Go to Dashboard →
              </button>
            ) : (
              <>
                <button onClick={onGetStarted} className="tw-btn-hover" style={{ background: "#3B82F6", color: "white", padding: "14px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".925rem", border: "none", cursor: "pointer", transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)", fontFamily: "inherit" }}>Create Free Account →</button>
                <button onClick={onSignIn} style={{ background: "transparent", color: "white", padding: "14px 30px", borderRadius: 6, fontWeight: 700, fontSize: ".925rem", border: "1px solid rgba(255,255,255,.2)", cursor: "pointer", fontFamily: "inherit" }}
                  onMouseOver={e => (e.currentTarget.style.background = "rgba(255,255,255,.05)")}
                  onMouseOut={e => (e.currentTarget.style.background = "transparent")}>
                  Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="tw-footer" style={{ background: "#090D16", padding: "64px 5% 32px", borderTop: "1px solid rgba(22, 44, 86, 0.5)", position: "relative" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 10 }}>
          <div className="tw-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr 1fr 1fr 1fr", gap: 40, marginBottom: 48 }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.45rem", color: "white", marginBottom: 12, fontWeight: 800 }}>Tax<span style={{ color: "#3B82F6" }}>Wise</span></div>
              <p style={{ fontSize: ".8rem", color: "rgba(255,255,255,.5)", lineHeight: 1.6, maxWidth: 220, marginBottom: 16 }}>Uganda&apos;s professional tax intelligence engine. Designed for tax consultants, accountants, and customs brokers.</p>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "5px 12px", borderRadius: 4, fontSize: ".68rem", color: "#FFFFFF", fontWeight: 600 }}>
                <Building2 size={13} style={{ color: "#2DD4BF" }} />
                <span>ICPAU CPD-Eligible</span>
              </div>
            </div>
            {[
              { heading: "Products", links: ["Case Analyzer", "Compliance Check", "TAT Precedents", "Client Reports"] },
              { heading: "Calculators", links: ["PAYE Calculator", "VAT Calculator", "WHT Rates Tool", "Import Duty"] },
              { heading: "Company", links: ["Pricing Plans", "Legal Blog", "Contact Us"] },
              { heading: "Support", links: ["Knowledge Base", "hello@taxwise.cloud", "Privacy Policy", "Terms of Use"] },
            ].map(col => (
              <div key={col.heading}>
                <h5 style={{ fontSize: ".72rem", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", color: "rgba(255,255,255,.4)", marginBottom: 16 }}>{col.heading}</h5>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link}>
                      <button 
                        onClick={() => handleFooterLinkClick(link)} 
                        className="tw-footer-link" 
                        style={{ color: "rgba(255,255,255,.6)", fontSize: ".82rem", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, transition: "color .2s", textAlign: "left", fontWeight: 500 }}
                      >
                        {link}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div style={{ borderTop: "1px solid rgba(22, 44, 86, 0.5)", paddingTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: ".74rem", color: "rgba(255,255,255,.4)", flexWrap: "wrap", gap: 12, fontWeight: 500 }}>
            <span>© 2026 TaxWise Uganda. All rights reserved.</span>
            <span>Complying with URA, eFRIS, and VAT statutory regulations.</span>
          </div>
        </div>
      </footer>
      <LegalPortal isOpen={legalOpen} onClose={() => setLegalOpen(false)} initialTab={legalTab} />
    </div>
  );
};
