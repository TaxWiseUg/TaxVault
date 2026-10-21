// Know Your Taxes — TypeScript definitions.
// The engine is pure: (answers, ruleSet, asOf) -> AssessmentResult. No I/O, no AI.

export type EntityType = "INDIVIDUAL" | "SOLE_PROPRIETOR" | "PARTNERSHIP" | "COMPANY";
export type YesNoUnsure = "YES" | "NO" | "UNSURE";
export type BusinessActivity =
  | "TRADING"
  | "SERVICES"
  | "PROFESSIONAL"
  | "MANUFACTURING"
  | "AGRICULTURE"
  | "TRANSPORT"
  | "OTHER";

export interface Answers {
  entityType?: EntityType;
  residency?: "RESIDENT" | "NON_RESIDENT" | "UNSURE";
  isEmployed?: boolean;
  monthlySalary?: number; // gross monthly employment income, UGX
  hasBusiness?: boolean; // only asked of INDIVIDUAL
  businessActivities?: BusinessActivity[];
  annualTurnover?: number; // UGX
  keepsRecords?: YesNoUnsure; // proper books — selects the presumptive records-based rate
  annualProfit?: number; // UGX
  vatRegistered?: YesNoUnsure;
  hasRentalIncome?: boolean;
  annualRentalIncome?: number; // gross, UGX
  hasEmployees?: boolean;
  employeeCount?: number;
  monthlyPayroll?: number; // UGX
  paysSuppliers?: boolean;
  isDesignatedWhtAgent?: YesNoUnsure;
  paysNonResidents?: boolean;
  hasForeignIncome?: boolean;
  importsGoods?: boolean;
  importsServices?: boolean;
  soldBusinessAssetsOrShares?: boolean;
  otherIncome?: ("DIVIDENDS" | "INTEREST" | "NONE")[];
}

export type ObligationStatus = "LIKELY" | "NEEDS_INFO" | "NOT_APPLICABLE" | "PROFESSIONAL_REVIEW";
export type ObligationCategory = "TAX" | "STATUTORY_CONTRIBUTION" | "REGISTRATION";
export type VerificationStatus = "VERIFIED" | "NEEDS_VERIFICATION" | "SUPERSEDED";

export interface LegalSource {
  id: string; // stable key, e.g. "ITA-S116"
  title: string;
  publisher: "URA" | "Parliament of Uganda" | "ULII" | "MoFPED" | "NSSF" | "Other";
  url: string;
  section?: string;
  note?: string;
}

export interface RuleParam {
  key: string;
  value: any;
  unit: "UGX" | "PERCENT" | "DAY_OF_MONTH" | "TEXT" | "BANDS" | "AMOUNT_BANDS" | "RECORDS_BANDS";
  label: string;
  verification: VerificationStatus;
  sourceIds: string[];
  note?: string;
  verifiedBy?: string;
  verifiedAt?: string;
}

export interface RuleContent {
  name: string;
  shortName: string;
  category: ObligationCategory;
  plainDefinition: string;
  legalBasis: string[]; // source ids
  triggers: string[];
  records: string[];
  deadlines: string[];
  channel: string[];
  consequences: { text: string; sourceIds: string[]; verification: VerificationStatus }[];
  nextSteps: string[];
}

export interface TaxRuleVersion {
  code: string;
  version: string; // e.g. "2026.07"
  effectiveFrom: string; // ISO date
  effectiveTo?: string; // ISO date, exclusive
  verification: VerificationStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  params: RuleParam[];
  content: RuleContent;
}

export interface Estimate {
  amount: number;
  period: "MONTHLY" | "ANNUAL";
  basis: "ESTIMATE";
  indicativeOnly: boolean;
  workings: string[];
  paramsUsed: { key: string; verification: VerificationStatus }[];
}

export interface Obligation {
  code: string;
  status: ObligationStatus;
  why: string[];
  missing: string[];
  followUpQuestionIds: string[];
  estimate?: Estimate;
  workedExample?: string[];
  rateSummary: string[];
  rule: { version: string; effectiveFrom: string; verification: VerificationStatus };
  content: RuleContent;
}

export interface AssessmentResult {
  engineVersion: string;
  asOf: string;
  ruleSetVersion: string;
  profileSummary: string[];
  obligations: Obligation[];
  missingInformation: string[];
  upcomingDeadlines: { obligation: string; label: string; text: string }[];
  nextSteps: string[];
  unverifiedRuleCount: number;
}
