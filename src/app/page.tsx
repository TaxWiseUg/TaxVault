"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  Scale, 
  BookOpen, 
  Calculator, 
  GraduationCap, 
  CreditCard, 
  Shield, 
  LogOut, 
  ChevronDown,
  Menu,
  X,
  Calendar,
  User as UserIcon,
  ShieldCheck,
  Sun,
  Moon,
  Sparkles,
  Home,
  Compass,
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { C } from "../lib/constants";
import { getInitialTheme, applyTheme, ThemeMode } from "../lib/theme";
import { AuthPage } from "../components/AuthPage";
import { LandingPage } from "../components/LandingPage";
import { Dashboard } from "../components/Dashboard";
import { CaseAnalyzer } from "../components/CaseAnalyzer";
import { CaseLibrary } from "../components/CaseLibrary";
import { EducationHub } from "../components/EducationHub";
import { ComplianceChecker } from "../components/ComplianceChecker";
import { PricingPage } from "../components/PricingPage";
import { AdminPortal } from "../components/AdminPortal";
import { ProfileSettings } from "../components/ProfileSettings";
import { CalculatorsPortal } from "../components/CalculatorsPortal";
import { IntelligencePortal } from "../components/IntelligencePortal";
import { KnowYourTaxesPortal } from "../features/know-your-taxes/components/KnowYourTaxesPortal";
import { setScrollLocked } from "../components/UI";

interface DbProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan: string;
}

export const SANDBOX_USER: DbProfile = {
  id: "f8174d44-d81a-4e70-9f4b-64744f969d09",
  email: "taxwiseplatform@gmail.com",
  full_name: "TaxWise Practitioner",
  role: "Admin",
  plan: "professional",
};

const getNavItemIcon = (id: string, size = 15) => {
  switch (id) {
    case "dashboard": return <LayoutDashboard size={size} />;
    case "know-your-taxes": return <Compass size={size} />;
    case "compliance": return <ShieldCheck size={size} />;
    case "analyzer": return <Scale size={size} />;
    case "library": return <BookOpen size={size} />;
    case "calculators": return <Calculator size={size} />;
    case "intelligence": return <Sparkles size={size} />;
    case "education": return <GraduationCap size={size} />;
    case "pricing": return <CreditCard size={size} />;
    case "admin": return <Shield size={size} />;
    default: return <LayoutDashboard size={size} />;
  }
};

interface NavItemDef {
  id: string;
  label: string;
  badge?: string;
}

const TopNavItem = ({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: NavItemDef; 
  isActive: boolean; 
  onClick: () => void; 
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "7px 12px",
        borderRadius: 8,
        border: "1.5px solid",
        borderColor: isActive ? "rgba(26, 123, 107, 0.45)" : "transparent",
        background: isActive 
          ? "rgba(26, 123, 107, 0.12)" 
          : "transparent",
        color: isActive ? "#0E7C5A" : C.navy,
        fontWeight: isActive ? 800 : 700,
        fontSize: "0.84rem",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        transition: "all 0.15s ease",
        position: "relative",
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(15, 32, 68, 0.06)";
          e.currentTarget.style.color = C.navy;
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = C.navy;
        }
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", color: isActive ? C.teal : "#64748B" }}>
        {getNavItemIcon(item.id, 16)}
      </span>
      <span>{item.label}</span>
      {item.badge && (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1px 6px",
            borderRadius: 999,
            fontSize: "0.66rem",
            fontWeight: 800,
            background: isActive ? C.teal : "#C8922A",
            color: "#FFFFFF",
            marginLeft: 2,
            lineHeight: 1.2,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
          }}
        >
          {item.badge}
        </span>
      )}
      {isActive && (
        <span
          style={{
            position: "absolute",
            bottom: -6,
            left: "50%",
            transform: "translateX(-50%)",
            width: 26,
            height: 3,
            borderRadius: 99,
            background: C.teal,
          }}
        />
      )}
    </button>
  );
};

export default function TaxWiseSaaS() {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbProfile | null>(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"landing" | "app" | "auth">("landing");
  const [isRecovering, setIsRecovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [openNavDropdown, setOpenNavDropdown] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const intendedPageRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isMobileMenuOpen) {
      setScrollLocked(true);
      return () => {
        setScrollLocked(false);
      };
    }
  }, [isMobile, isMobileMenuOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  const refreshUser = async () => {
    try {
      // Race getSession with a 5000ms timeout so it never hangs in iframe or offline contexts
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<{ data: { session: null }; error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null }, error: null }), 5000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
      
      if (session?.user) {
        setUser(session.user);
        
        // Fetch public user profile from postgres with timeout
        try {
          const profilePromise = supabase
            .from("users")
            .select("id, email, full_name, role, plan")
            .eq("id", session.user.id)
            .single();
          const profileTimeout = new Promise<{ data: null; error: unknown }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error("Profile timeout") }), 5000)
          );
          const { data, error } = await Promise.race([profilePromise, profileTimeout]);

          if (error && (error as Error)?.message !== "Profile timeout") {
            console.warn("Could not load database profile, falling back to auth metadata:", error);
          }

          if (data) {
            setDbUser(data as DbProfile);
          } else {
            // Fallback to auth metadata if public profile record sync is delayed
            setDbUser({
              id: session.user.id,
              email: session.user.email || "",
              full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
              role: session.user.user_metadata?.role || (session.user.email === "taxwiseplatform@gmail.com" ? "Admin" : "Student"),
              plan: "free",
            });
          }
        } catch (profileErr) {
          console.warn("Profile fetch error, using auth metadata:", profileErr);
          setDbUser({
            id: session.user.id,
            email: session.user.email || "",
            full_name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
            role: session.user.user_metadata?.role || (session.user.email === "taxwiseplatform@gmail.com" ? "Admin" : "Student"),
            plan: "free",
          });
        }

        // If there's an intended page (from nav dropdown), navigate to it after login
        if (intendedPageRef.current) {
          setPage(intendedPageRef.current);
          intendedPageRef.current = null;
        }
      } else {
        setUser(null);
        setDbUser(null);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
      setUser(null);
      setDbUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initial = getInitialTheme();
    setThemeMode(initial);
    applyTheme(initial);

    // Failsafe timer: loading state MUST clear within 1200ms so the UI is immediately responsive
    const failsafeTimer = setTimeout(() => {
      setLoading(false);
    }, 1200);

    refreshUser().finally(() => {
      clearTimeout(failsafeTimer);
      setLoading(false);
    });
    
    // Subscribe to auth state updates (login, logout, token refresh, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
        setView("auth");
      } else {
        refreshUser();
      }
    });

    return () => {
      clearTimeout(failsafeTimer);
      subscription.unsubscribe();
    };
  }, []);

  const toggleTheme = () => {
    const next: ThemeMode = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    applyTheme(next);
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("page") === "pricing" || params.get("status")) {
        setPage("pricing");
      }
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      setUser(null);
      setDbUser(null);
      setPage("dashboard");
      setView("landing");
      setLoading(false);
    }
  };

  const activeUser = dbUser || SANDBOX_USER;

  const handleNavigation = (pageId: string) => {
    setPage(pageId);
    setView("app");
  };

  const handleGoHome = () => {
    setView("landing");
  };

  interface GroupedNavItem extends NavItemDef {
    desc?: string;
  }

  const advisoryItems: GroupedNavItem[] = [
    { id: "know-your-taxes", label: "Know Your Taxes", badge: "2026", desc: "Guided statutory obligation assessment" },
    { id: "analyzer", label: "Case Analyzer", desc: "AI-assisted TAT objection briefs & ratio" },
    { id: "calculators", label: "Tax Calculators", desc: "PAYE, VAT, WHT & Vehicle customs duties" },
  ];

  const legalItems: GroupedNavItem[] = [
    { id: "library", label: "TAT Case Library", desc: "Full-text TAT rulings & High Court precedents" },
    { id: "intelligence", label: "Tax Intelligence", desc: "Gazette updates, URA circulars & treaty rates" },
    { id: "education", label: "Learning Hub", desc: "Uganda tax academy & CPD modules" },
  ];

  if (activeUser.role?.toLowerCase() === "admin") {
    legalItems.push({ id: "admin", label: "Admin Portal", desc: "User permissions & audit controls" });
  }

  const primaryNavItems: NavItemDef[] = [
    { id: "dashboard", label: "Dashboard" },
    ...advisoryItems,
    ...legalItems,
  ];

  const secondaryNavItems: NavItemDef[] = [];

  const allNavItems: NavItemDef[] = [...primaryNavItems, ...secondaryNavItems];
  const isAdvisoryActive = advisoryItems.some(i => i.id === page);
  const isLegalActive = legalItems.some(i => i.id === page);
  const isPricingActive = page === "pricing";
  const isDashboardActive = page === "dashboard";

  // Dynamic page title helper and document title effect
  const getPageTitle = (targetPage: string) => {
    if (targetPage === "settings") return "Profile & Settings";
    const activeItem = allNavItems.find(n => n.id === targetPage);
    return activeItem ? activeItem.label : "Dashboard";
  };

  useEffect(() => {
    if (typeof document !== "undefined" && view === "app") {
      document.title = `${getPageTitle(page)} — TaxWise Uganda`;
    }
  }, [page, view]);

  const renderActivePage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard user={activeUser} onNavigate={setPage} />;
      case "know-your-taxes":
        return <KnowYourTaxesPortal onNavigateHome={() => setPage("dashboard")} />;
      case "analyzer":
        return <CaseAnalyzer user={activeUser} />;
      case "library":
        return <CaseLibrary />;
      case "calculators":
        return <CalculatorsPortal />;
      case "intelligence":
        return <IntelligencePortal />;
      case "education":
        return <EducationHub user={activeUser} />;
      case "compliance":
        return <ComplianceChecker user={activeUser} />;
      case "pricing":
        return <PricingPage user={activeUser} onRefreshUser={refreshUser} />;
      case "settings":
        return <ProfileSettings user={activeUser} onRefreshUser={refreshUser} onNavigateToPricing={() => setPage("pricing")} onAccountDeleted={handleSignOut} />;
      case "admin":
        return <AdminPortal onNavigate={setPage} currentAdminId={activeUser.id} />;
      default:
        return <Dashboard user={activeUser} onNavigate={setPage} />;
    }
  };

  // Show loading screen while auth state is being determined
  if (loading) {
    return (
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FAFAF8", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", animation: "fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards" }}>
          {/* Logo Branding */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <div style={{ width: 12, height: 12, background: "#C8922A", borderRadius: 3, transform: "rotate(45deg)", flexShrink: 0, boxShadow: "0 0 12px rgba(200, 146, 42, 0.4)" }} />
            <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.85rem", color: "#0F2044", fontWeight: 800, letterSpacing: "-0.01em" }}>
              Tax<span style={{ color: "#1A7B6B" }}>Wise</span>
            </span>
          </div>

          {/* Premium CSS/SVG Spinner */}
          <div style={{ position: "relative", width: 44, height: 44, marginBottom: 20 }}>
            {/* Outer glowing pulsed ring */}
            <div style={{ position: "absolute", inset: -4, borderRadius: "50%", border: "2px solid rgba(26, 123, 107, 0.05)", animation: "pulseGlow 2s infinite ease-in-out" }} />
            {/* SVG Spinner */}
            <svg width="44" height="44" viewBox="0 0 44 44" style={{ display: "block" }}>
              <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(15, 32, 68, 0.04)" strokeWidth="3" />
              <circle cx="22" cy="22" r="18" fill="none" stroke="url(#spinner-gradient)" strokeWidth="3" strokeDasharray="113" strokeDashoffset="40" strokeLinecap="round" style={{ transformOrigin: "center", animation: "spin 0.9s cubic-bezier(0.4, 0, 0.2, 1) infinite" }} />
              <defs>
                <linearGradient id="spinner-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1A7B6B" />
                  <stop offset="100%" stopColor="#4DD9C0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Loading Text */}
          <div style={{ fontSize: "0.72rem", color: "#6B7280", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", animation: "pulse 1.8s infinite ease-in-out" }}>
            Syncing session
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(15, 32, 68, 0.45)", marginTop: 6, fontWeight: 500 }}>
            Securing your connection...
          </div>
        </div>
      </div>
    );
  }

  // Show update-password screen if user clicked recovery link
  if (isRecovering) {
    return (
      <AuthPage
        initialMode="update-password"
        onLoginSuccess={() => {
          setIsRecovering(false);
          refreshUser();
        }}
        onBack={() => {
          setIsRecovering(false);
          supabase.auth.signOut();
          setView("landing");
        }}
      />
    );
  }

  // Show landing page if requested
  if (view === "landing") {
    return (
      <LandingPage
        onGetStarted={() => {
          setPage("dashboard");
          setView("app");
        }}
        onSignIn={() => setView("auth")}
        onNavigate={handleNavigation}
        dbUser={dbUser}
        onSignOut={handleSignOut}
      />
    );
  }

  // Show auth page if requested
  if (view === "auth") {
    return (
      <AuthPage 
        onLoginSuccess={() => {
          refreshUser();
          setView("app");
        }} 
        onBack={() => setView("landing")}
      />
    );
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", background: C.offwhite }}>
      {/* Mobile Drawer Backdrop */}
      {isMobile && isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(10, 15, 30, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            zIndex: 90,
            animation: "fadeIn 0.2s ease-out"
          }}
        />
      )}

      {/* TOP STICKY NAVIGATION BAR */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#FFFFFF",
          borderTop: `3px solid ${C.teal}`,
          borderBottom: "1.5px solid rgba(15, 32, 68, 0.12)",
          boxShadow: "0 4px 20px -2px rgba(15, 32, 68, 0.08)",
        }}
      >
        <div
          style={{
            maxWidth: 1440,
            margin: "0 auto",
            padding: isMobile ? "0 14px" : "0 22px",
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          {/* LEFT: BRAND & WORKSPACE */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {isMobile && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.navy,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "6px",
                  borderRadius: 6,
                }}
                title="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            )}

            <div 
              onClick={() => setPage("dashboard")}
              style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
              title="TaxWise Platform — Go to Dashboard"
            >
              <div 
                style={{ 
                  width: 36, 
                  height: 36, 
                  borderRadius: 9, 
                  background: `linear-gradient(135deg, ${C.navy} 0%, #155F52 50%, ${C.teal} 100%)`, 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  color: "#FFFFFF", 
                  fontWeight: 900, 
                  fontSize: "0.92rem",
                  boxShadow: "0 3px 10px rgba(15,32,68,0.22)",
                  border: "1.5px solid rgba(200, 146, 42, 0.35)",
                  letterSpacing: "-0.03em",
                  flexShrink: 0,
                }}
              >
                TW
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "1.3rem", color: C.navy, fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.1, whiteSpace: "nowrap" }}>
                    Tax<span style={{ color: C.teal }}>Wise</span>
                  </span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 800, background: "rgba(200,146,42,0.15)", color: C.gold, border: "1px solid rgba(200,146,42,0.3)", padding: "1px 5px", borderRadius: 4, letterSpacing: "0.04em" }}>
                    2026
                  </span>
                </div>
                {!isMobile && (
                  <div style={{ fontSize: "0.62rem", color: "#64748B", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                    Uganda Tax &amp; Compliance Platform
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* CENTER: DROPDOWNS & NAVIGATION (DESKTOP) */}
          {!isMobile && (
            <nav 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 6, 
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              {/* Return to Landing Button */}
              <button
                type="button"
                onClick={() => setView("landing")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(15, 32, 68, 0.12)",
                  background: "#FFFFFF",
                  color: C.navy,
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(15,32,68,0.04)",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#FFFFFF"; }}
                title="Return to public landing page"
              >
                <Home size={14} style={{ color: C.teal }} />
                <span>Home</span>
              </button>

              {/* Direct Dashboard Button */}
              <button
                type="button"
                onClick={() => setPage("dashboard")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 14px",
                  borderRadius: 8,
                  border: isDashboardActive 
                    ? "1.5px solid rgba(26, 123, 107, 0.45)" 
                    : "1px solid rgba(15, 32, 68, 0.12)",
                  background: isDashboardActive 
                    ? "rgba(26, 123, 107, 0.12)" 
                    : "#FFFFFF",
                  color: isDashboardActive ? "#0E7C5A" : C.navy,
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(15,32,68,0.04)",
                }}
                onMouseEnter={(e) => {
                  if (!isDashboardActive) {
                    e.currentTarget.style.background = C.offwhite;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDashboardActive) {
                    e.currentTarget.style.background = "#FFFFFF";
                  }
                }}
              >
                <LayoutDashboard size={15} style={{ color: isDashboardActive ? C.teal : "#4C5C68" }} />
                <span>Dashboard</span>
              </button>

              {/* Advisory & Tools Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setOpenNavDropdown(openNavDropdown === "advisory" ? null : "advisory")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 8,
                    border: isAdvisoryActive 
                      ? "1.5px solid rgba(26, 123, 107, 0.45)" 
                      : (openNavDropdown === "advisory" ? "1px solid rgba(15, 32, 68, 0.2)" : "1px solid transparent"),
                    background: isAdvisoryActive 
                      ? "rgba(26, 123, 107, 0.12)" 
                      : (openNavDropdown === "advisory" ? "rgba(15, 32, 68, 0.05)" : "transparent"),
                    color: isAdvisoryActive ? "#0E7C5A" : C.navy,
                    fontWeight: 800,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isAdvisoryActive) {
                      e.currentTarget.style.background = "rgba(15, 32, 68, 0.06)";
                      e.currentTarget.style.color = C.navy;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isAdvisoryActive && openNavDropdown !== "advisory") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = C.navy;
                    }
                  }}
                >
                  <ShieldCheck size={15} style={{ color: isAdvisoryActive ? C.teal : "#64748B" }} />
                  <span>Advisory &amp; Tools</span>
                  <ChevronDown 
                    size={13} 
                    style={{ 
                      transform: openNavDropdown === "advisory" ? "rotate(180deg)" : "none", 
                      transition: "transform 0.2s",
                      color: isAdvisoryActive ? C.teal : C.navy
                    }} 
                  />
                </button>

                {openNavDropdown === "advisory" && (
                  <>
                    <div 
                      onClick={() => setOpenNavDropdown(null)} 
                      style={{ position: "fixed", inset: 0, zIndex: 110 }} 
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: 290,
                        background: "#FFFFFF",
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        boxShadow: "0 12px 30px rgba(15, 32, 68, 0.12)",
                        padding: "6px",
                        zIndex: 120,
                        animation: "fadeInUp 0.15s ease-out",
                      }}
                    >
                      {advisoryItems.map((item) => {
                        const isActive = page === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPage(item.id);
                              setOpenNavDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "9px 10px",
                              borderRadius: 7,
                              border: "none",
                              background: isActive ? "rgba(26, 123, 107, 0.08)" : "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "inherit",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.offwhite; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ color: isActive ? C.teal : C.muted, marginTop: 2, flexShrink: 0 }}>
                              {getNavItemIcon(item.id, 16)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                <span style={{ fontSize: "0.82rem", fontWeight: isActive ? 700 : 600, color: isActive ? C.teal : C.navy }}>
                                  {item.label}
                                </span>
                                {item.badge && (
                                  <span style={{ background: C.gold, color: "#FFFFFF", fontSize: "0.62rem", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>
                                    {item.badge}
                                  </span>
                                )}
                              </div>
                              {item.desc && (
                                <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: 1, lineHeight: 1.3 }}>
                                  {item.desc}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Legal & Insights Dropdown */}
              <div style={{ position: "relative" }}>
                <button
                  type="button"
                  onClick={() => setOpenNavDropdown(openNavDropdown === "legal" ? null : "legal")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: 8,
                    border: isLegalActive 
                      ? "1.5px solid rgba(26, 123, 107, 0.45)" 
                      : (openNavDropdown === "legal" ? "1px solid rgba(15, 32, 68, 0.2)" : "1px solid transparent"),
                    background: isLegalActive 
                      ? "rgba(26, 123, 107, 0.12)" 
                      : (openNavDropdown === "legal" ? "rgba(15, 32, 68, 0.05)" : "transparent"),
                    color: isLegalActive ? "#0E7C5A" : C.navy,
                    fontWeight: 800,
                    fontSize: "0.84rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    fontFamily: "inherit",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    if (!isLegalActive) {
                      e.currentTarget.style.background = "rgba(15, 32, 68, 0.06)";
                      e.currentTarget.style.color = C.navy;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLegalActive && openNavDropdown !== "legal") {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.color = C.navy;
                    }
                  }}
                >
                  <BookOpen size={15} style={{ color: isLegalActive ? C.teal : "#64748B" }} />
                  <span>Legal &amp; Insights</span>
                  <ChevronDown 
                    size={13} 
                    style={{ 
                      transform: openNavDropdown === "legal" ? "rotate(180deg)" : "none", 
                      transition: "transform 0.2s",
                      color: isLegalActive ? C.teal : C.navy
                    }} 
                  />
                </button>

                {openNavDropdown === "legal" && (
                  <>
                    <div 
                      onClick={() => setOpenNavDropdown(null)} 
                      style={{ position: "fixed", inset: 0, zIndex: 110 }} 
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: 290,
                        background: "#FFFFFF",
                        borderRadius: 10,
                        border: `1px solid ${C.border}`,
                        boxShadow: "0 12px 30px rgba(15, 32, 68, 0.12)",
                        padding: "6px",
                        zIndex: 120,
                        animation: "fadeInUp 0.15s ease-out",
                      }}
                    >
                      {legalItems.map((item) => {
                        const isActive = page === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setPage(item.id);
                              setOpenNavDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                              padding: "9px 10px",
                              borderRadius: 7,
                              border: "none",
                              background: isActive ? "rgba(26, 123, 107, 0.08)" : "transparent",
                              cursor: "pointer",
                              textAlign: "left",
                              fontFamily: "inherit",
                              transition: "background 0.12s",
                            }}
                            onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = C.offwhite; }}
                            onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <span style={{ color: isActive ? C.teal : C.muted, marginTop: 2, flexShrink: 0 }}>
                              {getNavItemIcon(item.id, 16)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "0.82rem", fontWeight: isActive ? 700 : 600, color: isActive ? C.teal : C.navy }}>
                                {item.label}
                              </div>
                              {item.desc && (
                                <div style={{ fontSize: "0.7rem", color: C.muted, marginTop: 1, lineHeight: 1.3 }}>
                                  {item.desc}
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {/* Pricing Direct Link */}
              <button
                type="button"
                onClick={() => setPage("pricing")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 8,
                  border: isPricingActive ? "1.5px solid rgba(26, 123, 107, 0.45)" : "1px solid transparent",
                  background: isPricingActive ? "rgba(26, 123, 107, 0.12)" : "transparent",
                  color: isPricingActive ? "#0E7C5A" : C.navy,
                  fontWeight: 800,
                  fontSize: "0.84rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isPricingActive) {
                    e.currentTarget.style.background = "rgba(15, 32, 68, 0.06)";
                    e.currentTarget.style.color = C.navy;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isPricingActive) {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.color = C.navy;
                  }
                }}
              >
                <CreditCard size={14} style={{ color: isPricingActive ? C.teal : "#7A889B" }} />
                <span>Pricing</span>
              </button>
            </nav>
          )}

          {/* RIGHT: DATE STATUS & USER PROFILE */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!dbUser && (
              <button
                onClick={() => setView("auth")}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  padding: "5px 12px",
                  borderRadius: 6,
                  fontSize: "0.78rem",
                  color: C.navy,
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                Sign In
              </button>
            )}

            {/* Statutory Date & URA Online Beacon */}
            {!isMobile && (
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 9px",
                  borderRadius: 6,
                  background: "rgba(15, 32, 68, 0.03)",
                  border: "1px solid rgba(15, 32, 68, 0.07)",
                  fontSize: "0.73rem",
                  fontWeight: 600,
                  color: "#4C5C68",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                title="URA eFRIS Services Online • System Clock Active"
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "#10B981",
                    boxShadow: "0 0 0 2px rgba(16, 185, 129, 0.25)",
                    flexShrink: 0,
                  }}
                />
                <Calendar size={12} style={{ color: C.teal, flexShrink: 0 }} />
                <span style={{ whiteSpace: "nowrap" }}>{formattedDate}</span>
              </div>
            )}

            {/* Profile Dropdown Chip */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  padding: "3px 8px 3px 3px",
                  borderRadius: 999,
                  border: `1px solid ${isProfileMenuOpen ? C.teal : C.border}`,
                  background: isProfileMenuOpen ? "rgba(26,123,107,0.05)" : C.white,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: "0 1px 2px rgba(15,32,68,0.03)",
                }}
                title={activeUser.full_name}
              >
                <div 
                  style={{ 
                    width: 28, 
                    height: 28, 
                    borderRadius: "50%", 
                    background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealDark} 100%)`, 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    color: "#FFFFFF", 
                    fontSize: "0.74rem", 
                    fontWeight: 700,
                    boxShadow: "0 2px 6px rgba(26,123,107,0.25)",
                    flexShrink: 0,
                  }}
                >
                  {getInitials(activeUser.full_name)}
                </div>
                {!isMobile && (
                  <div style={{ textAlign: "left", marginRight: 2 }}>
                    <div style={{ fontSize: "0.75rem", fontWeight: 700, color: C.navy, lineHeight: 1.2, maxWidth: 95, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {activeUser.full_name}
                    </div>
                    <div style={{ fontSize: "0.6rem", color: C.teal, fontWeight: 700, textTransform: "uppercase" }}>
                      {activeUser.plan}
                    </div>
                  </div>
                )}
                <ChevronDown size={12} style={{ color: C.muted, transform: isProfileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>

              {/* Profile Dropdown Menu */}
              {isProfileMenuOpen && (
                <>
                  <div 
                    onClick={() => setIsProfileMenuOpen(false)}
                    style={{ position: "fixed", inset: 0, zIndex: 110 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 8px)",
                      right: 0,
                      width: 230,
                      background: "#FFFFFF",
                      borderRadius: 12,
                      border: `1px solid ${C.border}`,
                      boxShadow: "0 10px 30px rgba(15, 32, 68, 0.12)",
                      padding: "8px",
                      zIndex: 120,
                      animation: "fadeInUp 0.15s ease-out",
                    }}
                  >
                    <div style={{ padding: "8px 10px 10px", borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>
                      <div style={{ fontSize: "0.82rem", fontWeight: 700, color: C.navy }}>{activeUser.full_name}</div>
                      <div style={{ fontSize: "0.72rem", color: C.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{activeUser.email}</div>
                      <div style={{ marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 8px", borderRadius: 4, background: "rgba(26,123,107,0.1)", color: C.teal, fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase" }}>
                        {activeUser.role} • {activeUser.plan}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setPage("settings");
                        setIsProfileMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: page === "settings" ? "rgba(26,123,107,0.08)" : "transparent",
                        color: C.navy,
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = page === "settings" ? "rgba(26,123,107,0.08)" : "transparent"; }}
                    >
                      <UserIcon size={14} style={{ color: C.teal }} />
                      <span>Profile &amp; Settings</span>
                    </button>

                    <button
                      onClick={() => {
                        setPage("pricing");
                        setIsProfileMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: page === "pricing" ? "rgba(26,123,107,0.08)" : "transparent",
                        color: C.navy,
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = page === "pricing" ? "rgba(26,123,107,0.08)" : "transparent"; }}
                    >
                      <CreditCard size={14} style={{ color: C.gold }} />
                      <span>Subscription &amp; Plans</span>
                    </button>

                    <button
                      onClick={() => {
                        toggleTheme();
                        setIsProfileMenuOpen(false);
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        color: C.navy,
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = C.offwhite; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      {themeMode === "dark" ? <Sun size={14} style={{ color: "#F59E0B" }} /> : <Moon size={14} style={{ color: C.navy }} />}
                      <span>{themeMode === "dark" ? "Light Mode" : "Dark Mode"}</span>
                    </button>

                    <div style={{ height: 1, background: C.border, margin: "6px 0" }} />

                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        handleSignOut();
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "8px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: "transparent",
                        color: "#EF4444",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {isMobile && isMobileMenuOpen && (
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              background: "#FFFFFF",
              padding: "16px",
              boxShadow: "0 12px 24px rgba(15, 32, 68, 0.08)",
              animation: "fadeInDown 0.2s ease-out",
            }}
          >
            {/* Dynamic Home ⇄ Dashboard Switcher in Mobile */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16, padding: "4px", background: "rgba(15, 32, 68, 0.04)", borderRadius: 10 }}>
              <button
                type="button"
                onClick={() => {
                  setPage("dashboard");
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: isDashboardActive ? "1px solid rgba(26,123,107,0.3)" : "1px solid transparent",
                  background: isDashboardActive ? "#FFFFFF" : "transparent",
                  color: isDashboardActive ? C.teal : C.navy,
                  fontWeight: 700,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  boxShadow: isDashboardActive ? "0 2px 6px rgba(0,0,0,0.06)" : "none",
                }}
              >
                <LayoutDashboard size={15} style={{ color: isDashboardActive ? C.teal : "#7A889B" }} />
                <span>Dashboard</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setView("landing");
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "8px 10px",
                  borderRadius: 7,
                  border: "1px solid transparent",
                  background: "transparent",
                  color: C.navy,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                }}
              >
                <Home size={15} style={{ color: C.teal }} />
                <span>Go to Home</span>
              </button>
            </div>

            {/* Advisory & Tools Section */}
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Advisory &amp; Tools
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 5, marginBottom: 14 }}>
              {advisoryItems.map((n) => {
                const isActive = page === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setPage(n.id);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: isActive ? "1px solid rgba(26,123,107,0.3)" : `1px solid ${C.border}`,
                      background: isActive ? "rgba(26, 123, 107, 0.08)" : C.white,
                      color: isActive ? C.teal : C.navy,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: isActive ? C.teal : C.muted }}>
                      {getNavItemIcon(n.id, 15)}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.label}
                    </span>
                    {n.badge && (
                      <span style={{ marginLeft: "auto", background: C.gold, color: "#FFF", fontSize: "0.62rem", padding: "1px 5px", borderRadius: 99, fontWeight: 700 }}>
                        {n.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legal & Insights Section */}
            <div style={{ fontSize: "0.68rem", fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>
              Legal &amp; Insights
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 5, marginBottom: 14 }}>
              {legalItems.map((n) => {
                const isActive = page === n.id;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      setPage(n.id);
                      setIsMobileMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: isActive ? "1px solid rgba(26,123,107,0.3)" : `1px solid ${C.border}`,
                      background: isActive ? "rgba(26, 123, 107, 0.08)" : C.white,
                      color: isActive ? C.teal : C.navy,
                      fontWeight: isActive ? 700 : 500,
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      textAlign: "left",
                      fontFamily: "inherit",
                    }}
                  >
                    <span style={{ color: isActive ? C.teal : C.muted }}>
                      {getNavItemIcon(n.id, 15)}
                    </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {n.label}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  setPage("pricing");
                  setIsMobileMenuOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: isPricingActive ? "1px solid rgba(26,123,107,0.3)" : `1px solid ${C.border}`,
                  background: isPricingActive ? "rgba(26, 123, 107, 0.08)" : C.white,
                  color: isPricingActive ? C.teal : C.navy,
                  fontWeight: isPricingActive ? 700 : 500,
                  fontSize: "0.8rem",
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "inherit",
                }}
              >
                <CreditCard size={15} style={{ color: isPricingActive ? C.teal : C.muted }} />
                <span>Pricing &amp; Plans</span>
              </button>
            </div>

            <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: C.teal, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", fontSize: "0.72rem", fontWeight: 700 }}>
                  {getInitials(activeUser.full_name)}
                </div>
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 600, color: C.navy }}>{activeUser.full_name}</div>
                  <div style={{ fontSize: "0.65rem", color: C.teal, fontWeight: 700 }}>{activeUser.plan.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={toggleTheme}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: C.navy,
                    fontSize: "0.74rem",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {themeMode === "dark" ? <Sun size={12} style={{ color: "#F59E0B" }} /> : <Moon size={12} />}
                  <span>{themeMode === "dark" ? "Light" : "Dark"}</span>
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    handleSignOut();
                  }}
                  style={{
                    background: "rgba(239, 68, 68, 0.08)",
                    border: "none",
                    color: "#EF4444",
                    fontSize: "0.74rem",
                    fontWeight: 600,
                    padding: "6px 10px",
                    borderRadius: 6,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  <LogOut size={12} />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <div 
        ref={scrollContainerRef} 
        className="main-scroll-container" 
        style={{ 
          flex: 1, 
          overflowY: "auto",
          background: C.offwhite,
        }}
      >
        <main 
          key={page} 
          className="page-fade-in" 
          style={{ 
            maxWidth: 1400, 
            margin: "0 auto", 
            padding: isMobile ? "14px 12px 36px" : "18px 24px 48px" 
          }}
        >
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
}
