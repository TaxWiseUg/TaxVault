import { safeStorage } from "./supabaseClient";

export interface UserCaseItem {
  id: string;
  title: string;
  tax: string;
  status: "Needs review" | "Report ready" | "In progress" | "Drafting";
  statusColor: string;
  nextStep: string;
  page: string;
  updatedAt: string;
}

export interface UserDeadlineItem {
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

export interface PinnedCalculator {
  id: string;
  title: string;
  sub: string;
  page: string;
}

export interface UserDashboardMetrics {
  roleBadge: string;
  roleDescription: string;
  activeCasesCount: number;
  activeCasesSub: string;
  reportsCount: number;
  reportsSub: string;
  learningLessonsCount: number;
  learningCourseName: string;
  learningProgressPercent: number;
  complianceScore: number;
  complianceSub: string;
  cases: UserCaseItem[];
  deadlines: UserDeadlineItem[];
  pinnedCalculators: PinnedCalculator[];
  isReturnFiled: boolean;
  isAdmin: boolean;
}

const DEFAULT_DEADLINES: UserDeadlineItem[] = [
  { id: "dl-1", date: "15 OCT", dayNumber: 15, monthIndex: 9, year: 2026, title: "Monthly returns — September 2026", sub: "PAYE · WHT · VAT", badge: "Due today", highlight: true, taxType: "Monthly Returns" },
  { id: "dl-2", date: "15 NOV", dayNumber: 15, monthIndex: 10, year: 2026, title: "Monthly returns — October 2026", sub: "PAYE · WHT · VAT", badge: "31 days", taxType: "Monthly Returns" },
  { id: "dl-3", date: "15 DEC", dayNumber: 15, monthIndex: 11, year: 2026, title: "Monthly returns — November 2026", sub: "PAYE · WHT · VAT", badge: "61 days", taxType: "Monthly Returns" },
  { id: "dl-4", date: "31 DEC", dayNumber: 31, monthIndex: 11, year: 2026, title: "Annual Income tax return — FY 2025/26", sub: "Income tax · Corporation & Individual", badge: "77 days", taxType: "Income Tax" },
  { id: "dl-5", date: "15 JAN", dayNumber: 15, monthIndex: 0, year: 2027, title: "Monthly returns — December 2026", sub: "PAYE · WHT · VAT", badge: "92 days", taxType: "Monthly Returns" },
];

/**
 * Generates initial role-specific dashboard metrics and datasets.
 */
function getRoleDefaults(user: { email?: string; role?: string; plan?: string }): Omit<UserDashboardMetrics, "isReturnFiled"> {
  const email = (user.email || "").toLowerCase();
  const rawRole = (user.role || "").toLowerCase();
  const isAdmin = email === "taxwiseplatform@gmail.com" || rawRole === "admin";

  if (isAdmin) {
    return {
      isAdmin: true,
      roleBadge: "Super Administrator · Managing Partner",
      roleDescription: "Executive Practice Oversight & Statutory TAT Precedent Center",
      activeCasesCount: 14,
      activeCasesSub: "3 awaiting TAT hearing · 11 in advisory",
      reportsCount: 18,
      reportsSub: "Firm audit memos & advisory briefs",
      learningLessonsCount: 16,
      learningCourseName: "Advanced Tax Dispute & High Court Advocacy",
      learningProgressPercent: 92,
      complianceScore: 96,
      complianceSub: "1 item under partner review",
      cases: [
        {
          id: "case-admin-1",
          title: "Bank of Uganda — Interbank WHT Exemption Ruling",
          tax: "WHT",
          status: "In progress",
          statusColor: "#2563EB",
          nextStep: "Review TAT appeal draft →",
          page: "analyzer",
          updatedAt: "Updated 2h ago",
        },
        {
          id: "case-admin-2",
          title: "Roofings Rolling Mills — Excise Duty Remission Audit",
          tax: "Excise",
          status: "Needs review",
          statusColor: "#DC2626",
          nextStep: "Audit URA objection brief →",
          page: "analyzer",
          updatedAt: "Updated yesterday",
        },
        {
          id: "case-admin-3",
          title: "MTN Uganda — Telecom Roaming VAT Apportionment",
          tax: "VAT",
          status: "Report ready",
          statusColor: "#16A34A",
          nextStep: "Issue partner clearance →",
          page: "compliance",
          updatedAt: "Updated 3 days ago",
        },
        {
          id: "case-admin-4",
          title: "SBC Uganda — Hoima Airport Customs Machinery Import",
          tax: "Customs",
          status: "Drafting",
          statusColor: "#D97706",
          nextStep: "Check 5th Schedule tariff →",
          page: "calculators",
          updatedAt: "Updated 4 days ago",
        },
      ],
      deadlines: DEFAULT_DEADLINES,
      pinnedCalculators: [
        { id: "corporate", title: "Corporate Tax", sub: "With loss carry-forward", page: "calculators" },
        { id: "vat", title: "VAT (18%)", sub: "Output vs input reconciliation", page: "calculators" },
        { id: "paye", title: "PAYE", sub: "2026 statutory brackets", page: "calculators" },
        { id: "customs", title: "Customs Duty", sub: "EAC Common External Tariff", page: "calculators" },
      ],
    };
  }

  if (rawRole.includes("law") || rawRole.includes("consultant")) {
    return {
      isAdmin: false,
      roleBadge: "Licensed Tax Consultant",
      roleDescription: "Client Portfolio & Precedent Research Workbench",
      activeCasesCount: 5,
      activeCasesSub: "2 need client review · 3 active",
      reportsCount: 5,
      reportsSub: "Last: Mukwano PAYE review",
      learningLessonsCount: 8,
      learningCourseName: "TAT Case Law & Statutory Interpretations",
      learningProgressPercent: 65,
      complianceScore: 91,
      complianceSub: "2 items pending reconciliation",
      cases: [
        {
          id: "case-consultant-1",
          title: "Uganda Clays — VAT Input Tax Credit Verification",
          tax: "VAT",
          status: "Needs review",
          statusColor: "#DC2626",
          nextStep: "Review AI audit findings →",
          page: "analyzer",
          updatedAt: "Updated 5 Jul",
        },
        {
          id: "case-consultant-2",
          title: "Mukwano Industries — PAYE Casual Workers Classification",
          tax: "PAYE",
          status: "Report ready",
          statusColor: "#16A34A",
          nextStep: "Send to client →",
          page: "compliance",
          updatedAt: "Updated 8 Jul",
        },
        {
          id: "case-consultant-3",
          title: "Kakira Sugar — Corporate Interest Limitation S.25",
          tax: "CIT",
          status: "In progress",
          statusColor: "#2563EB",
          nextStep: "Draft TAT ratio analysis →",
          page: "analyzer",
          updatedAt: "Updated 12 Jul",
        },
      ],
      deadlines: DEFAULT_DEADLINES,
      pinnedCalculators: [
        { id: "paye", title: "PAYE", sub: "2026 statutory bands", page: "calculators" },
        { id: "corporate", title: "Corporate tax", sub: "With loss carry-forward", page: "calculators" },
        { id: "rental", title: "Rental income", sub: "Individuals & companies", page: "calculators" },
        { id: "vat", title: "VAT", sub: "Output vs input (18%)", page: "calculators" },
      ],
    };
  }

  if (rawRole.includes("finance") || rawRole.includes("business") || rawRole.includes("accountant")) {
    return {
      isAdmin: false,
      roleBadge: "Corporate Finance & Tax Lead",
      roleDescription: "Statutory EFRIS Compliance & Monthly Returns Dashboard",
      activeCasesCount: 2,
      activeCasesSub: "1 filing review · 1 open",
      reportsCount: 3,
      reportsSub: "Last: Monthly EFRIS reconciliation",
      learningLessonsCount: 5,
      learningCourseName: "Corporate Tax Withholding & eFRIS Audits",
      learningProgressPercent: 42,
      complianceScore: 86,
      complianceSub: "3 open eFRIS invoice discrepancies",
      cases: [
        {
          id: "case-finance-1",
          title: "Monthly EFRIS Electronic Invoicing Reconciliation",
          tax: "EFRIS",
          status: "Needs review",
          statusColor: "#DC2626",
          nextStep: "Reconcile fiscal invoices →",
          page: "compliance",
          updatedAt: "Updated yesterday",
        },
        {
          id: "case-finance-2",
          title: "Q3 Corporate Income Tax Provisional Assessment",
          tax: "CIT",
          status: "Drafting",
          statusColor: "#D97706",
          nextStep: "Review estimated revenue →",
          page: "calculators",
          updatedAt: "Updated 4 days ago",
        },
      ],
      deadlines: DEFAULT_DEADLINES,
      pinnedCalculators: [
        { id: "vat", title: "VAT Output vs Input", sub: "18% statutory formula", page: "calculators" },
        { id: "paye", title: "Payroll PAYE", sub: "Monthly employee schedules", page: "calculators" },
        { id: "wht", title: "WHT 6% & 15%", sub: "Goods & professional services", page: "calculators" },
        { id: "rental", title: "Rental Income Tax", sub: "12% non-individual rate", page: "calculators" },
      ],
    };
  }

  if (rawRole.includes("student")) {
    return {
      isAdmin: false,
      roleBadge: "Tax Academy Scholar",
      roleDescription: "Uganda Tax Law Curriculum & Professional Certification Track",
      activeCasesCount: 1,
      activeCasesSub: "1 moot court analysis in progress",
      reportsCount: 1,
      reportsSub: "Last: Academic Case Analysis",
      learningLessonsCount: 11,
      learningCourseName: "Principles of Uganda Tax Law (TPCA 2014)",
      learningProgressPercent: 78,
      complianceScore: 74,
      complianceSub: "5 study modules remaining for CPD",
      cases: [
        {
          id: "case-student-1",
          title: "Moot Court: Asafali Wissanji v URA Capital Gains Analysis",
          tax: "Study",
          status: "In progress",
          statusColor: "#2563EB",
          nextStep: "Complete lesson review →",
          page: "education",
          updatedAt: "Updated 1h ago",
        },
      ],
      deadlines: DEFAULT_DEADLINES,
      pinnedCalculators: [
        { id: "paye", title: "PAYE Calculator", sub: "Step-by-step bracket breakdown", page: "calculators" },
        { id: "vat", title: "VAT Computation", sub: "Input credit rule practice", page: "calculators" },
        { id: "rental", title: "Rental Tax", sub: "Threshold & rate analysis", page: "calculators" },
        { id: "corporate", title: "Corporate Tax", sub: "30% standard assessment", page: "calculators" },
      ],
    };
  }

  // Default: Free Trial / General User
  return {
    isAdmin: false,
    roleBadge: "Free Trial Practitioner",
    roleDescription: "14-Day Full Platform Evaluation Workspace",
    activeCasesCount: 1,
    activeCasesSub: "1 sample interactive case",
    reportsCount: 1,
    reportsSub: "Sample statutory health check",
    learningLessonsCount: 2,
    learningCourseName: "TaxWise Platform Masterclass",
    learningProgressPercent: 20,
    complianceScore: 82,
    complianceSub: "Trial benchmark assessment",
    cases: [
      {
        id: "case-trial-1",
        title: "Sample Trial Client — Comprehensive Tax Health Check",
        tax: "Audit",
        status: "Needs review",
        statusColor: "#DC2626",
        nextStep: "Explore AI case summary →",
        page: "analyzer",
        updatedAt: "Updated today",
      },
    ],
    deadlines: DEFAULT_DEADLINES,
    pinnedCalculators: [
      { id: "paye", title: "PAYE", sub: "2026 statutory bands", page: "calculators" },
      { id: "corporate", title: "Corporate tax", sub: "With loss carry-forward", page: "calculators" },
      { id: "rental", title: "Rental income", sub: "Individuals & companies", page: "calculators" },
      { id: "vat", title: "VAT", sub: "Output vs input (18%)", page: "calculators" },
    ],
  };
}

/**
 * Returns the individual user's dashboard metrics and state from local storage or defaults.
 */
export function getUserDashboardData(user: { id?: string; email?: string; role?: string; plan?: string }): UserDashboardMetrics {
  const userKey = (user.email || user.id || "guest").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const storageKey = `taxwise_user_metrics_${userKey}`;
  const filedKey = `taxwise_user_filed_${userKey}`;

  const defaults = getRoleDefaults(user);

  let isReturnFiled = false;
  if (typeof window !== "undefined") {
    isReturnFiled = safeStorage.getItem(filedKey) === "true";
  }

  if (typeof window !== "undefined") {
    const saved = safeStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...defaults,
          ...parsed,
          isAdmin: defaults.isAdmin,
          isReturnFiled,
        };
      } catch {
        // use defaults
      }
    }
  }

  return {
    ...defaults,
    isReturnFiled,
  };
}

/**
 * Persists user-specific dashboard metrics and customized lists.
 */
export function saveUserDashboardData(
  user: { id?: string; email?: string },
  data: Partial<UserDashboardMetrics>
) {
  if (typeof window === "undefined") return;
  const userKey = (user.email || user.id || "guest").toLowerCase().replace(/[^a-z0-9_]/g, "_");
  const storageKey = `taxwise_user_metrics_${userKey}`;
  const filedKey = `taxwise_user_filed_${userKey}`;

  if (typeof data.isReturnFiled === "boolean") {
    safeStorage.setItem(filedKey, String(data.isReturnFiled));
  }

  const existingRaw = safeStorage.getItem(storageKey);
  let existing = {};
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw);
    } catch {}
  }

  const merged = { ...existing, ...data };
  safeStorage.setItem(storageKey, JSON.stringify(merged));
}
