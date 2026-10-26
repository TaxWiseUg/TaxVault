"use client";

import { useState, useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import { flushSync } from "react-dom";
import { motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { User } from "@supabase/supabase-js";
import { 
  LayoutDashboard, 
  Scale, 
  BookOpen, 
  Calculator, 
  GraduationCap, 
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
import { supabase, safeStorage } from "../lib/supabaseClient";
import { auth, getGoogleUserProfile, getCurrentUserProfile, signOutGoogle } from "../lib/googleAuth";
import { onAuthStateChanged } from "firebase/auth";
import { C } from "../lib/constants";
import { getInitialTheme, applyTheme, ThemeMode } from "../lib/theme";
import { AuthPage } from "../components/AuthPage";
import { LandingPage } from "../components/LandingPage";
import { Dashboard } from "../components/Dashboard";
import { CaseAnalyzer } from "../components/CaseAnalyzer";
import { CaseLibrary } from "../components/CaseLibrary";
import { EducationHub } from "../components/EducationHub";
import { ComplianceChecker } from "../components/ComplianceChecker";
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

const FREE_TRIAL_USER: DbProfile = {
  id: "guest-free-trial-practitioner",
  email: "trial.practitioner@taxwise.ug",
  full_name: "Free Trial Practitioner",
  role: "Tax Consultant",
  plan: "trial",
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
      className="tw-nav-link"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        padding: "9px 13px",
        borderRadius: 10,
        border: "1px solid",
        borderColor: isActive ? "rgba(26, 123, 107, 0.18)" : "transparent",
        background: isActive 
          ? "rgba(26, 123, 107, 0.09)"
          : "transparent",
        color: isActive ? C.teal : "#475569",
        fontWeight: isActive ? 750 : 600,
        fontSize: "0.8rem",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontFamily: "inherit",
        transition: "all 0.18s ease",
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
    </button>
  );
};

export default function TaxWiseSaaS() {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<DbProfile | null>(null);
  const [page, setPage] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"landing" | "app" | "auth">("landing");
  const [isTrialSession, setIsTrialSession] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [openNavDropdown, setOpenNavDropdown] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>("light");
  const intendedPageRef = useRef<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const workspaceScrollProgress = useMotionValue(0);
  const workspaceParallaxBack = useTransform(workspaceScrollProgress, [0, 1], [0, prefersReducedMotion ? 0 : 260]);
  const workspaceParallaxFront = useTransform(workspaceScrollProgress, [0, 1], [0, prefersReducedMotion ? 0 : -170]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1180);
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
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [page]);

  useEffect(() => {
    if (view !== "app") return;

    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const updateProgress = () => {
      const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
      workspaceScrollProgress.set(maxScroll > 0 ? scrollContainer.scrollTop / maxScroll : 0);
    };

    updateProgress();
    scrollContainer.addEventListener("scroll", updateProgress, { passive: true });

    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateProgress);
    resizeObserver?.observe(scrollContainer);
    const pageContent = scrollContainer.querySelector("main");
    if (pageContent) resizeObserver?.observe(pageContent);

    return () => {
      scrollContainer.removeEventListener("scroll", updateProgress);
      resizeObserver?.disconnect();
    };
  }, [page, view, workspaceScrollProgress]);

  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    if (view !== "landing") return;
    const scanRoot: ParentNode | null = document.querySelector(".tw-landing-page");
    if (!scanRoot) return;

    const observed = new Set<HTMLElement>();
    const delayByGroup = new Map<Element, number>();
    const candidatesSelector = "article, div, li";
    const intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle("scroll-reveal-in-view", isIntersecting);
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: "-5% 0px -8% 0px",
    });

    const registerCard = (element: HTMLElement) => {
      if (observed.has(element) || element.closest("[data-scroll-reveal]") && element.closest("[data-scroll-reveal]") !== element) return;

      const rect = element.getBoundingClientRect();
      if (rect.width < 180 || rect.height < 90) return;

      const style = window.getComputedStyle(element);
      const radius = Number.parseFloat(style.borderTopLeftRadius) || 0;
      const hasBackground = (style.backgroundColor !== "transparent" && style.backgroundColor !== "rgba(0, 0, 0, 0)") || style.backgroundImage !== "none";
      const hasBorder = style.borderTopStyle !== "none" && Number.parseFloat(style.borderTopWidth) > 0;
      const hasCardClass = /card|panel|tile|metric|finding|score|client|summary|stat/i.test(element.className.toString());
      if (radius < 10 || !(hasBackground || hasBorder || style.boxShadow !== "none" || hasCardClass)) return;

      const group = element.closest(".dashboard-metrics, .dashboard-workbench, [class*='grid'], [class*='list'], [class*='cards'], section") ?? element.parentElement ?? element;
      const order = delayByGroup.get(group) ?? 0;
      delayByGroup.set(group, order + 1);

      element.dataset.scrollReveal = "true";
      element.style.setProperty("--scroll-reveal-delay", `${Math.min(order * 110, 330)}ms`);
      observed.add(element);
      intersectionObserver.observe(element);
    };

    const scan = (scope: ParentNode) => {
      if (scope instanceof HTMLElement && scope.matches(candidatesSelector)) registerCard(scope);
      scope.querySelectorAll<HTMLElement>(candidatesSelector).forEach(registerCard);
    };

    scan(scanRoot);
    const mutationObserver = new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) scan(node);
      }));
    });
    mutationObserver.observe(scanRoot, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      intersectionObserver.disconnect();
      observed.forEach((element) => {
        delete element.dataset.scrollReveal;
        element.classList.remove("scroll-reveal-in-view");
        element.style.removeProperty("--scroll-reveal-delay");
      });
    };
  }, [page, view]);

  const refreshUser = async () => {
    try {
      // 1. Check authentic Google user profile (Firebase Auth / persistent profile)
      const googleProfile = getCurrentUserProfile();
      if (googleProfile && googleProfile.email) {
        setDbUser(googleProfile);
        setUser({
          id: googleProfile.id,
          email: googleProfile.email,
          user_metadata: {
            full_name: googleProfile.full_name,
            role: googleProfile.role,
          },
          app_metadata: { provider: "google" },
          aud: "authenticated",
          created_at: new Date().toISOString(),
        } as unknown as User);
        setIsTrialSession(false);

        if (intendedPageRef.current) {
          setPage(intendedPageRef.current);
          intendedPageRef.current = null;
        }
        return;
      }

      // 2. Race Supabase getSession with a 3000ms timeout
      const sessionPromise = supabase.auth.getSession();
      const sessionTimeout = new Promise<{ data: { session: null }; error: null }>((resolve) =>
        setTimeout(() => resolve({ data: { session: null }, error: null }), 3000)
      );
      const { data: { session } } = await Promise.race([sessionPromise, sessionTimeout]);
      
      if (session?.user && session.user.email) {
        setUser(session.user);
        setIsTrialSession(false);
        
        // Fetch public user profile from postgres with timeout
        try {
          const profilePromise = supabase
            .from("users")
            .select("id, email, full_name, role, plan")
            .eq("id", session.user.id)
            .single();
          const profileTimeout = new Promise<{ data: null; error: unknown }>((resolve) =>
            setTimeout(() => resolve({ data: null, error: new Error("Profile timeout") }), 3000)
          );
          const { data } = await Promise.race([profilePromise, profileTimeout]);

          if (data) {
            setDbUser(data as DbProfile);
          } else {
            const email = session.user.email;
            const isAdmin = email.toLowerCase() === "taxwiseplatform@gmail.com";
            const prof: DbProfile = {
              id: session.user.id,
              email: email,
              full_name: session.user.user_metadata?.full_name || email.split("@")[0] || "User",
              role: session.user.user_metadata?.role || (isAdmin ? "Admin" : "Tax Consultant"),
              plan: "professional",
            };
            setDbUser(prof);
            safeStorage.setItem("taxwise_active_user", JSON.stringify(prof));
          }
        } catch {
          const email = session.user.email;
          const isAdmin = email.toLowerCase() === "taxwiseplatform@gmail.com";
          const prof: DbProfile = {
            id: session.user.id,
            email: email,
            full_name: session.user.user_metadata?.full_name || email.split("@")[0] || "User",
            role: session.user.user_metadata?.role || (isAdmin ? "Admin" : "Tax Consultant"),
            plan: "professional",
          };
          setDbUser(prof);
          safeStorage.setItem("taxwise_active_user", JSON.stringify(prof));
        }

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

    const failsafeTimer = setTimeout(() => setLoading(false), 1200);
    refreshUser().finally(() => {
      clearTimeout(failsafeTimer);
      setLoading(false);
    });

    // 1. Listen to Firebase Google Auth state
    const unsubscribeFirebase = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (typeof window !== "undefined" && safeStorage.getItem("taxwise_pending_role_setup")) {
          return;
        }
        let prof = getGoogleUserProfile(firebaseUser);
        if (prof) {
          const storedProfile = safeStorage.getItem("taxwise_active_user");
          if (storedProfile) {
            try {
              const parsed = JSON.parse(storedProfile);
              if (parsed?.email?.toLowerCase() === prof.email.toLowerCase()) {
                prof = {
                  ...prof,
                  role: parsed.role || prof.role,
                  full_name: parsed.full_name || prof.full_name,
                  plan: parsed.plan || prof.plan,
                };
              }
            } catch {
              safeStorage.removeItem("taxwise_active_user");
            }
          }

          // Firebase's default profile has no knowledge of the role stored in
          // Supabase. Resolve the canonical profile before choosing app access.
          try {
            const idToken = await firebaseUser.getIdToken();
            const syncResponse = await fetch("/api/auth/google-sync", {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({
                email: firebaseUser.email,
                full_name: firebaseUser.displayName || prof.full_name,
                avatar_url: firebaseUser.photoURL || undefined,
                google_uid: firebaseUser.uid,
              }),
            });
            if (syncResponse.ok) {
              const syncData = await syncResponse.json();
              if (syncData?.isNewUser) {
                safeStorage.setItem("taxwise_pending_role_setup", "true");
                safeStorage.setItem("taxwise_pending_google_role", JSON.stringify({
                  email: prof.email,
                  full_name: prof.full_name,
                  avatar_url: prof.avatar_url,
                }));
                return;
              }
              if (syncData?.profile?.role) {
                prof = {
                  ...prof,
                  id: syncData.profile.id || prof.id,
                  role: syncData.profile.role,
                  full_name: syncData.profile.full_name || prof.full_name,
                  plan: syncData.profile.plan || prof.plan,
                  avatar_url: syncData.profile.avatar_url || prof.avatar_url,
                };
              }
            }
          } catch (syncError) {
            console.warn("Could not refresh Google account profile:", syncError);
          }
        }
        if (prof) {
          setDbUser(prof);
          setIsTrialSession(false);
          safeStorage.setItem("taxwise_active_user", JSON.stringify(prof));
        }
      }
      refreshUser();
    });

    // 2. Listen to Supabase Auth state (password / magic link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovering(true);
        setView("auth");
      } else {
        refreshUser();
      }
    });

    // 3. Listen to immediate custom window auth sync event
    const handleCustomAuth = () => {
      refreshUser();
    };
    if (typeof window !== "undefined") {
      window.addEventListener("taxwise_auth_changed", handleCustomAuth);
    }

    return () => {
      clearTimeout(failsafeTimer);
      unsubscribeFirebase();
      subscription.unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener("taxwise_auth_changed", handleCustomAuth);
      }
    };
  }, []);

  const toggleTheme = (event: ReactMouseEvent<HTMLButtonElement>, afterToggle?: () => void) => {
    const next: ThemeMode = themeMode === "dark" ? "light" : "dark";
    const commitTheme = () => {
      setThemeMode(next);
      applyTheme(next);
      afterToggle?.();
    };

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = event.currentTarget.getBoundingClientRect();
    const root = document.documentElement;

    if (!reducedMotion && typeof document.startViewTransition === "function") {
      root.style.setProperty("--theme-reveal-x", `${rect.left + rect.width / 2}px`);
      root.style.setProperty("--theme-reveal-y", `${rect.top + rect.height / 2}px`);

      try {
        const transition = document.startViewTransition(() => {
          flushSync(commitTheme);
        });
        const clearRevealOrigin = () => {
          root.style.removeProperty("--theme-reveal-x");
          root.style.removeProperty("--theme-reveal-y");
        };
        void transition.finished.then(clearRevealOrigin, clearRevealOrigin);
      } catch {
        root.style.removeProperty("--theme-reveal-x");
        root.style.removeProperty("--theme-reveal-y");
        commitTheme();
      }
      return;
    }

    if (!reducedMotion) {
      root.classList.add("theme-crossfade");
      flushSync(commitTheme);
      window.setTimeout(() => root.classList.remove("theme-crossfade"), 220);
      return;
    }

    commitTheme();
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      await signOutGoogle();
    } catch (err) {
      console.warn("Sign out error:", err);
    } finally {
      safeStorage.removeItem("taxwise_active_user");
      safeStorage.removeItem("mock_supabase_session");
      safeStorage.removeItem("mock_profile");
      setUser(null);
      setDbUser(null);
      setIsTrialSession(false);
      setPage("dashboard");
      setView("landing");
      setLoading(false);
    }
  };

  const rawActiveUser: DbProfile = dbUser || (isTrialSession ? FREE_TRIAL_USER : FREE_TRIAL_USER);
  const isEmailAdmin = (rawActiveUser.email || "").toLowerCase() === "taxwiseplatform@gmail.com";
  const activeUser: DbProfile = isEmailAdmin
    ? { ...rawActiveUser, role: "Admin", plan: "professional" }
    : rawActiveUser;

  const handleNavigation = (pageId: string) => {
    if (!dbUser) {
      setIsTrialSession(true);
    }
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
    { id: "know-your-taxes", label: "Know Your Taxes", desc: "Guided statutory obligation assessment" },
    { id: "compliance", label: "Compliance Center", desc: "Filing health checks and audit reports" },
    { id: "analyzer", label: "Case Analyzer", desc: "AI-assisted TAT objection briefs & ratio" },
    { id: "calculators", label: "Tax Calculators", desc: "PAYE, Corporate Tax, WHT & Vehicle customs duties" },
  ];

  const legalItems: GroupedNavItem[] = [
    { id: "library", label: "TAT Case Library", desc: "Full-text TAT rulings & High Court precedents" },
    { id: "intelligence", label: "Tax Intelligence", desc: "Gazette updates, URA circulars & treaty rates" },
    { id: "education", label: "Learning Hub", desc: "Uganda tax academy & CPD modules" },
  ];

  const isAdmin = activeUser.role?.toLowerCase() === "admin" || isEmailAdmin;
  if (isAdmin) {
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
        return <KnowYourTaxesPortal />;
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
      case "settings":
        return <ProfileSettings user={activeUser} onRefreshUser={refreshUser} onAccountDeleted={handleSignOut} />;
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

  // Show landing page if requested
  if (view === "landing") {
    return (
      <LandingPage
        onGetStarted={() => {
          setIsTrialSession(true);
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

  if (view === "auth") {
    return (
      <AuthPage
        onLoginSuccess={() => {
          setIsTrialSession(false);
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
    <div className="tw-app-shell" style={{ display: "flex", flexDirection: "column", height: "100vh", minHeight: 0, overflow: "hidden", fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", background: C.offwhite }}>
      {/* Mobile Drawer Backdrop */}
      {isMobile && (
        <div 
          className={`tw-mobile-nav-backdrop ${isMobileMenuOpen ? "is-open" : ""}`}
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
          style={{
            background: "rgba(10, 15, 30, 0.4)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        />
      )}

      {/* TOP STICKY NAVIGATION BAR */}
      <header
        className="tw-app-header"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "var(--color-white)",
          borderTop: `3px solid ${C.teal}`,
          borderBottom: "1px solid var(--color-border)",
          boxShadow: "0 8px 24px -18px rgba(15, 32, 68, 0.28)",
        }}
      >
        <div
          className="tw-app-header-inner"
          style={{
            maxWidth: 1600,
            margin: "0 auto",
            padding: isMobile ? "0 14px" : "0 22px",
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
          }}
        >
          {/* LEFT: BRAND & WORKSPACE */}
          <div className="tw-header-brand" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
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
                <span className="tw-wordmark">
                  Tax<span>Wise</span>
                </span>
              </div>
            </div>

          </div>

          {/* CENTER: DROPDOWNS & NAVIGATION (DESKTOP) */}
          {!isMobile && (
            <nav 
              className="tw-desktop-primary-nav"
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 3,
                flexShrink: 1,
                minWidth: 0,
              }}
            >
              {/* Return to Landing Button */}
              <button
                className="tw-nav-home"
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
                <span>Home</span>
              </button>

              {/* Direct Dashboard Button */}
              <button
                className="tw-nav-dashboard"
                type="button"
                onClick={() => setPage("dashboard")}
                aria-current={isDashboardActive ? "page" : undefined}
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
                <span>Dashboard</span>
              </button>

              {/* Advisory & Tools Dropdown */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setOpenNavDropdown("advisory")}
                onMouseLeave={() => setOpenNavDropdown(null)}
              >
                <button
                  type="button"
                  onFocus={() => setOpenNavDropdown("advisory")}
                  aria-current={isAdvisoryActive ? "page" : undefined}
                  aria-haspopup="menu"
                  aria-expanded={openNavDropdown === "advisory"}
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
                  <span>Advisory</span>
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
                    <div
                      className="tw-nav-dropdown-menu"
                      role="menu"
                      aria-label="Advisory navigation"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: 220,
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
                            role="menuitem"
                            title={item.desc}
                            onClick={() => {
                              setPage(item.id);
                              setOpenNavDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
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
                            </div>
                          </button>
                        );
                      })}
                    </div>
                )}
              </div>

              {/* Legal & Insights Dropdown */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => setOpenNavDropdown("legal")}
                onMouseLeave={() => setOpenNavDropdown(null)}
              >
                <button
                  type="button"
                  onFocus={() => setOpenNavDropdown("legal")}
                  aria-current={isLegalActive ? "page" : undefined}
                  aria-haspopup="menu"
                  aria-expanded={openNavDropdown === "legal"}
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
                  <span>Legal</span>
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
                    <div
                      className="tw-nav-dropdown-menu"
                      role="menu"
                      aria-label="Legal navigation"
                      style={{
                        position: "absolute",
                        top: "calc(100% + 8px)",
                        left: 0,
                        width: 220,
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
                            role="menuitem"
                            title={item.desc}
                            onClick={() => {
                              setPage(item.id);
                              setOpenNavDropdown(null);
                            }}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
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
                            </div>
                          </button>
                        );
                      })}
                    </div>
                )}
              </div>


            </nav>
          )}

          {/* RIGHT: DATE STATUS & USER PROFILE */}
          <div className="tw-header-actions" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            {!dbUser && (
              <button
                className="tw-header-sign-in"
                type="button"
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
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
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
                className="tw-profile-trigger"
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
                    className="tw-profile-dropdown"
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
                      onClick={(event) => toggleTheme(event, () => setIsProfileMenuOpen(false))}
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

                    {!dbUser && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setView("auth");
                        }}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "none",
                          background: "rgba(26,123,107,0.08)",
                          color: C.teal,
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          textAlign: "left",
                          fontFamily: "inherit",
                          marginBottom: 4,
                        }}
                      >
                        <ShieldCheck size={14} style={{ color: C.teal }} />
                        <span>Sign In / Create Account</span>
                      </button>
                    )}

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
                        color: "#DC2626",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        fontFamily: "inherit",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                    >
                      <LogOut size={14} />
                      <span>{dbUser ? "Sign Out" : "Exit Free Trial"}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
            {isMobile && (
              <button
                className="tw-mobile-menu-trigger"
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
                aria-expanded={isMobileMenuOpen}
                aria-controls="mobile-navigation-drawer"
                title="Toggle menu"
              >
                {isMobileMenuOpen ? <X size={19} strokeWidth={2.2} /> : <Menu size={20} strokeWidth={2.2} />}
              </button>
            )}
          </div>
        </div>

        {/* MOBILE SLIDE-DOWN DRAWER */}
        {isMobile && (
          <div
            id="mobile-navigation-drawer"
            className={`tw-mobile-nav-drawer ${isMobileMenuOpen ? "is-open" : ""}`}
            role="dialog"
            aria-label="Main navigation"
            aria-hidden={!isMobileMenuOpen}
            inert={!isMobileMenuOpen}
            style={{
              background: "var(--color-white)",
              padding: "16px",
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
                  onClick={(event) => toggleTheme(event)}
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
          minHeight: 0,
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehaviorY: "contain",
          position: "relative",
          isolation: "isolate",
          background: "var(--color-offwhite)",
          backgroundImage: "radial-gradient(ellipse at 50% -15%, rgba(26,123,107,0.075), transparent 58%)",
        }}
      >
        <div aria-hidden="true" style={{ position: "sticky", top: 0, height: 0, zIndex: 0, pointerEvents: "none", overflow: "visible" }}>
          <motion.div style={{ y: workspaceParallaxBack, position: "absolute", top: "12vh", right: "-8vw", width: "min(48vw, 620px)", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,123,107,0.12), rgba(26,123,107,0.035) 46%, transparent 72%)", willChange: "transform" }} />
          <motion.div style={{ y: workspaceParallaxFront, position: "absolute", top: "58vh", left: "-12vw", width: "min(42vw, 540px)", aspectRatio: "1", borderRadius: "50%", background: "radial-gradient(circle, rgba(200,146,42,0.11), rgba(200,146,42,0.025) 48%, transparent 73%)", willChange: "transform" }} />
        </div>
        <main 
          key={page} 
          className="page-fade-in workspace-page-shell"
          style={{ 
            position: "relative",
            zIndex: 1,
            maxWidth: 1480,
            margin: "0 auto", 
            padding: isMobile ? "20px 16px 40px" : "28px 36px 56px"
          }}
        >
          <div className="workspace-page-content">{renderActivePage()}</div>
        </main>
      </div>
    </div>
  );
}
