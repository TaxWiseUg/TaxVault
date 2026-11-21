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
  filedMonths?: Record<string, boolean>;
  isAdmin: boolean;
}

export interface MonthlyFilingPeriod {
  periodKey: string;
  periodLabel: string;
  periodShort: string;
  dueDate: Date;
  dueYear: number;
  dueMonthIndex: number;
  dueDay: number;
  dueMonthShort: string;
  dueFullLabel: string;
  dueShortLabel: string;
  title: string;
}

const MONTH_SHORT_UPPER = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

function formatMonthPeriod(periodDate: Date, dueDate: Date): MonthlyFilingPeriod {
  const periodYear = periodDate.getFullYear();
  const periodMonthIndex = periodDate.getMonth();
  const periodKey = `${periodYear}-${String(periodMonthIndex + 1).padStart(2, "0")}`;
  const periodLabel = periodDate.toLocaleDateString("en-UG", { month: "long", year: "numeric" });
  const periodShort = periodDate.toLocaleDateString("en-UG", { month: "short", year: "numeric" });

  const dueEndOfDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), 15, 23, 59, 59);
  const dueFullLabel = dueEndOfDay.toLocaleDateString("en-UG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const dueShortLabel = dueEndOfDay.toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return {
    periodKey,
    periodLabel,
    periodShort,
    dueDate: dueEndOfDay,
    dueYear: dueEndOfDay.getFullYear(),
    dueMonthIndex: dueEndOfDay.getMonth(),
    dueDay: 15,
    dueMonthShort: MONTH_SHORT_UPPER[dueEndOfDay.getMonth()],
    dueFullLabel,
    dueShortLabel,
    title: `Monthly returns — ${periodLabel}`,
  };
}

/**
 * Computes the active and previous URA monthly statutory filing periods for any date.
 * Days 1–15 target the 15th of the current month (for the previous month's returns).
 * Days 16–end target the 15th of next month (for the current month's returns).
 */
export function getMonthlyFilingCycle(now: Date = new Date()): {
  current: MonthlyFilingPeriod;
  previous: MonthlyFilingPeriod;
} {
  const y = now.getFullYear();
  const m = now.getMonth();
  const afterCutoff = now.getDate() > 15;

  const currentPeriodDate = afterCutoff ? new Date(y, m, 1) : new Date(y, m - 1, 1);
  const currentDueDate = afterCutoff ? new Date(y, m + 1, 15) : new Date(y, m, 15);

  const prevPeriodDate = new Date(currentPeriodDate.getFullYear(), currentPeriodDate.getMonth() - 1, 1);
  const prevDueDate = new Date(currentPeriodDate.getFullYear(), currentPeriodDate.getMonth(), 15);

  return {
    current: formatMonthPeriod(currentPeriodDate, currentDueDate),
    previous: formatMonthPeriod(prevPeriodDate, prevDueDate),
  };
}

export function getPeriodKeyFromDeadline(item: Pick<UserDeadlineItem, "year" | "monthIndex" | "dayNumber" | "taxType">): string | null {
  if (item.dayNumber !== 15 && item.taxType !== "Monthly Returns") return null;
  const periodDate = new Date(item.year, item.monthIndex - 1, 1);
  return `${periodDate.getFullYear()}-${String(periodDate.getMonth() + 1).padStart(2, "0")}`;
}

export function buildDefaultDeadlines(now: Date = new Date()): UserDeadlineItem[] {
  const { current, previous } = getMonthlyFilingCycle(now);
  const next1Period = new Date(current.dueYear, current.dueMonthIndex, 1);
  const next1Due = new Date(current.dueYear, current.dueMonthIndex + 1, 15);
  const next1 = formatMonthPeriod(next1Period, next1Due);

  const next2Period = new Date(current.dueYear, current.dueMonthIndex + 1, 1);
  const next2Due = new Date(current.dueYear, current.dueMonthIndex + 2, 15);
  const next2 = formatMonthPeriod(next2Period, next2Due);

  const annualYear = now.getFullYear();
  const fyStart = annualYear - 1;
  const fyEndShort = String(annualYear).slice(-2);

  return [
    {
      id: `dl-monthly-${current.periodKey}`,
      date: `${current.dueDay} ${current.dueMonthShort}`,
      dayNumber: current.dueDay,
      monthIndex: current.dueMonthIndex,
      year: current.dueYear,
      title: current.title,
      sub: "PAYE · WHT · VAT",
      badge: "Active cycle",
      highlight: true,
      taxType: "Monthly Returns",
    },
    {
      id: `dl-annual-${annualYear}`,
      date: "31 DEC",
      dayNumber: 31,
      monthIndex: 11,
      year: annualYear,
      title: `Annual Income tax return — FY ${fyStart}/${fyEndShort}`,
      sub: "Income tax · Corporation & Individual",
      badge: "Annual",
      taxType: "Income Tax",
    },
    {
      id: `dl-monthly-${next1.periodKey}`,
      date: `${next1.dueDay} ${next1.dueMonthShort}`,
      dayNumber: next1.dueDay,
      monthIndex: next1.dueMonthIndex,
      year: next1.dueYear,
      title: next1.title,
      sub: "PAYE · WHT · VAT",
      badge: "Upcoming",
      taxType: "Monthly Returns",
    },
    {
      id: `dl-monthly-${next2.periodKey}`,
      date: `${next2.dueDay} ${next2.dueMonthShort}`,
      dayNumber: next2.dueDay,
      monthIndex: next2.dueMonthIndex,
      year: next2.dueYear,
      title: next2.title,
      sub: "PAYE · WHT · VAT",
      badge: "Upcoming",
      taxType: "Monthly Returns",
    },
    {
      id: `dl-monthly-${previous.periodKey}`,
      date: `${previous.dueDay} ${previous.dueMonthShort}`,
      dayNumber: previous.dueDay,
      monthIndex: previous.dueMonthIndex,
      year: previous.dueYear,
      title: previous.title,
      sub: "PAYE · WHT · VAT",
      badge: "Previous cycle",
      taxType: "Monthly Returns",
    },
  ];
}

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
      deadlines: buildDefaultDeadlines(),
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
      deadlines: buildDefaultDeadlines(),
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
      deadlines: buildDefaultDeadlines(),
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
      deadlines: buildDefaultDeadlines(),
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
    deadlines: buildDefaultDeadlines(),
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
        const savedFiledMonths: Record<string, boolean> =
          parsed.filedMonths && typeof parsed.filedMonths === "object"
            ? { ...parsed.filedMonths }
            : isReturnFiled
              ? { "2026-09": true }
              : {};

        // Replace frozen legacy default deadlines (dl-1..dl-5 with no custom/completed items)
        const legacyIds = new Set(["dl-1", "dl-2", "dl-3", "dl-4", "dl-5"]);
        const savedDeadlines = Array.isArray(parsed.deadlines) ? (parsed.deadlines as UserDeadlineItem[]) : null;
        const isOnlyLegacyDefaults =
          savedDeadlines &&
          savedDeadlines.length > 0 &&
          savedDeadlines.every((d) => legacyIds.has(d.id) && !d.completed);

        const resolvedDeadlines = (isOnlyLegacyDefaults || !savedDeadlines || savedDeadlines.length === 0
          ? buildDefaultDeadlines()
          : savedDeadlines
        ).map((dl) => {
          const pk = getPeriodKeyFromDeadline(dl);
          if (pk && typeof savedFiledMonths[pk] === "boolean") {
            return { ...dl, completed: savedFiledMonths[pk] };
          }
          return dl;
        });

        const { current } = getMonthlyFilingCycle();
        const currentFiled = Boolean(savedFiledMonths[current.periodKey]);

        return {
          ...defaults,
          ...parsed,
          deadlines: resolvedDeadlines,
          filedMonths: savedFiledMonths,
          isAdmin: defaults.isAdmin,
          isReturnFiled: currentFiled,
        };
      } catch {
        // use defaults
      }
    }
  }

  return {
    ...defaults,
    filedMonths: isReturnFiled ? { "2026-09": true } : {},
    isReturnFiled: false,
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
  let existing: Record<string, unknown> = {};
  if (existingRaw) {
    try {
      existing = JSON.parse(existingRaw);
    } catch {}
  }

  const merged = { ...existing, ...data };
  safeStorage.setItem(storageKey, JSON.stringify(merged));
}
