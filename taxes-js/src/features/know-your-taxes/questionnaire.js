import { SEED_RULES, getRule } from "./rules/seed-rules";
/** Read from the rule set so the questionnaire and engine never disagree on the boundaries. */
function presumptiveBound(key, asOf = new Date().toISOString().slice(0, 10)) {
  const r = getRule(SEED_RULES, "PRESUMPTIVE_TAX", asOf < "2026-07-01" ? "2026-07-01" : asOf);
  return r.params.find((p) => p.key === key).value;
}
export const presumptiveUpperBound = (asOf) => presumptiveBound("upperTurnover", asOf);
export const presumptiveLowerBound = (asOf) => presumptiveBound("lowerTurnover", asOf);
/** Natural person (or sole trader) in the presumptive turnover range, not an excluded professional. */
const inPresumptiveRange = (a) =>
  (a.entityType === "SOLE_PROPRIETOR" || (a.entityType === "INDIVIDUAL" && a.hasBusiness === true)) &&
  !(a.businessActivities ?? []).includes("PROFESSIONAL") &&
  a.annualTurnover !== undefined &&
  a.annualTurnover > presumptiveLowerBound() &&
  a.annualTurnover <= presumptiveUpperBound();
const isIndividual = (a) => a.entityType === "INDIVIDUAL";
const runsBusiness = (a) =>
  a.entityType === "SOLE_PROPRIETOR" ||
  a.entityType === "PARTNERSHIP" ||
  a.entityType === "COMPANY" ||
  (a.entityType === "INDIVIDUAL" && a.hasBusiness === true);
const always = () => true;
export const QUESTIONS = [
  {
    id: "entityType",
    section: "About you",
    type: "single",
    prompt: "How do you earn income?",
    help: "This decides which tax regime applies. A sole proprietor is one person trading in their own name; a company is a separately registered legal person.",
    options: [
      { value: "INDIVIDUAL", label: "As an individual", hint: "Employee, landlord, freelancer, or investor" },
      { value: "SOLE_PROPRIETOR", label: "Sole proprietor", hint: "A business I own and run in my own name" },
      { value: "PARTNERSHIP", label: "Partnership", hint: "Two or more people sharing a business" },
      { value: "COMPANY", label: "Company", hint: "Registered with URSB as a limited company" },
    ],
    showIf: always,
  },
  {
    id: "residency",
    section: "About you",
    type: "single",
    prompt: "Are you tax-resident in Uganda?",
    help: "Broadly, an individual is resident if they have a permanent home in Uganda or are present for 183 days or more in a year. A company is resident if incorporated or managed in Uganda. Residency decides whether worldwide income is taxed.",
    options: [
      { value: "RESIDENT", label: "Yes, resident" },
      { value: "NON_RESIDENT", label: "No, non-resident" },
      { value: "UNSURE", label: "Not sure" },
    ],
    showIf: always,
  },
  // Employment
  {
    id: "isEmployed",
    section: "Employment",
    type: "boolean",
    prompt: "Do you receive a salary or wages from an employer?",
    showIf: isIndividual,
  },
  {
    id: "monthlySalary",
    section: "Employment",
    type: "money",
    prompt: "What is your gross monthly salary (before deductions)?",
    help: "Include allowances paid in cash. Used only to estimate PAYE.",
    min: 0,
    optional: true,
    showIf: (a) => isIndividual(a) && a.isEmployed === true,
  },
  // Business
  {
    id: "hasBusiness",
    section: "Business",
    type: "boolean",
    prompt: "Do you also earn income from a business or freelance work?",
    help: "Freelance, consulting and side-hustle income counts as business income.",
    showIf: isIndividual,
  },
  {
    id: "businessActivities",
    section: "Business",
    type: "multi",
    prompt: "What kind of business activities do you carry out?",
    options: [
      { value: "TRADING", label: "Buying and selling goods" },
      { value: "SERVICES", label: "General services" },
      { value: "PROFESSIONAL", label: "Professional services", hint: "Law, accounting, medical, engineering, consulting" },
      { value: "MANUFACTURING", label: "Manufacturing / processing" },
      { value: "AGRICULTURE", label: "Agriculture" },
      { value: "TRANSPORT", label: "Transport" },
      { value: "OTHER", label: "Other" },
    ],
    showIf: runsBusiness,
  },
  {
    id: "annualTurnover",
    section: "Business",
    type: "money",
    prompt: "Roughly, what is your business's annual turnover?",
    help: "Turnover means total sales or fees before expenses. An estimate is fine.",
    min: 0,
    showIf: runsBusiness,
  },
  {
    id: "keepsRecords",
    section: "Business",
    type: "single",
    prompt: "Do you keep proper books of account for the business?",
    help: "Small businesses pay presumptive tax: a set amount for their turnover band. Those who keep proper records (sales, purchases, expenses) pay a lower, percentage-based amount.",
    options: [
      { value: "YES", label: "Yes, I keep proper books" },
      { value: "NO", label: "No, or only basic notes" },
      { value: "UNSURE", label: "Not sure" },
    ],
    showIf: inPresumptiveRange,
  },
  {
    id: "annualProfit",
    section: "Business",
    type: "money",
    prompt: "Roughly, what is the business's annual profit before tax?",
    help: "Optional. Profit is turnover minus business expenses. Lets us estimate income tax. Leave blank if you don't know.",
    min: 0,
    optional: true,
    // Only needed where profit (not turnover) drives the tax: companies, partnerships,
    // professionals, and individuals above the presumptive range.
    showIf: (a) =>
      a.entityType === "COMPANY" ||
      a.entityType === "PARTNERSHIP" ||
      (runsBusiness(a) &&
        ((a.businessActivities ?? []).includes("PROFESSIONAL") ||
          (a.annualTurnover !== undefined && a.annualTurnover > presumptiveUpperBound()))),
  },
  {
    id: "vatRegistered",
    section: "Business",
    type: "single",
    prompt: "Is the business registered for VAT?",
    help: "VAT (Value Added Tax) is a tax on sales that registered businesses charge customers and pay over to URA.",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
      { value: "UNSURE", label: "Not sure" },
    ],
    showIf: runsBusiness,
  },
  // Property
  {
    id: "hasRentalIncome",
    section: "Property",
    type: "boolean",
    prompt: "Do you earn rent from land, houses, shops or other property in Uganda?",
    showIf: always,
  },
  {
    id: "annualRentalIncome",
    section: "Property",
    type: "money",
    prompt: "What is your total gross rent received in a year?",
    min: 0,
    optional: true,
    showIf: (a) => a.hasRentalIncome === true,
  },
  // Staff & payments
  {
    id: "hasEmployees",
    section: "Staff & payments",
    type: "boolean",
    prompt: "Do you employ staff (including domestic or casual workers)?",
    showIf: (a) => runsBusiness(a) || a.hasRentalIncome === true || isIndividual(a),
  },
  {
    id: "employeeCount",
    section: "Staff & payments",
    type: "integer",
    prompt: "How many employees do you have?",
    min: 1,
    max: 100000,
    optional: true,
    showIf: (a) => a.hasEmployees === true,
  },
  {
    id: "monthlyPayroll",
    section: "Staff & payments",
    type: "money",
    prompt: "What is your total gross monthly payroll?",
    min: 0,
    optional: true,
    showIf: (a) => a.hasEmployees === true,
  },
  {
    id: "paysSuppliers",
    section: "Staff & payments",
    type: "boolean",
    prompt: "Does the business pay suppliers or contractors for goods or services?",
    showIf: runsBusiness,
  },
  {
    id: "isDesignatedWhtAgent",
    section: "Staff & payments",
    type: "single",
    prompt: "Has URA appointed you as a designated withholding agent?",
    help: "A withholding agent deducts a percentage from certain supplier payments and pays it to URA. URA publishes and notifies designated agents.",
    options: [
      { value: "YES", label: "Yes" },
      { value: "NO", label: "No" },
      { value: "UNSURE", label: "Not sure" },
    ],
    showIf: (a) => a.paysSuppliers === true,
  },
  {
    id: "paysNonResidents",
    section: "Staff & payments",
    type: "boolean",
    prompt: "Do you pay non-resident persons (e.g. foreign consultants, royalties, management fees)?",
    showIf: runsBusiness,
  },
  // Cross-border
  {
    id: "hasForeignIncome",
    section: "Cross-border",
    type: "boolean",
    prompt: "Do you earn any income from outside Uganda?",
    showIf: (a) => a.residency !== "NON_RESIDENT",
  },
  {
    id: "importsGoods",
    section: "Cross-border",
    type: "boolean",
    prompt: "Do you import goods into Uganda?",
    showIf: runsBusiness,
  },
  {
    id: "importsServices",
    section: "Cross-border",
    type: "boolean",
    prompt: "Do you buy services from suppliers outside Uganda (e.g. software, consulting)?",
    showIf: runsBusiness,
  },
  // Other income
  {
    id: "otherIncome",
    section: "Other income",
    type: "multi",
    prompt: "Do you receive any of these?",
    options: [
      { value: "DIVIDENDS", label: "Dividends from shares" },
      { value: "INTEREST", label: "Interest from banks or bonds" },
      { value: "NONE", label: "None of these" },
    ],
    optional: true,
    showIf: (a) => a.entityType === "INDIVIDUAL" || a.entityType === "SOLE_PROPRIETOR",
  },
  {
    id: "soldBusinessAssetsOrShares",
    section: "Other income",
    type: "boolean",
    prompt: "In the last year, did you sell business assets, commercial property or shares?",
    help: "Gains on these may be taxed. Selling your own home or personal car is generally treated differently.",
    showIf: always,
  },
];
export function visibleQuestions(a) {
  return QUESTIONS.filter((q) => q.showIf(a));
}
/** Drop answers to questions that are no longer visible (e.g. user went back and changed entity type). */
export function pruneHiddenAnswers(a) {
  // Iterate to a fixed point: hiding one answer can hide its dependants.
  let current = { ...a };
  for (let i = 0; i < 5; i++) {
    const visible = new Set(visibleQuestions(current).map((q) => q.id));
    const next = {};
    for (const [k, v] of Object.entries(current)) {
      if (visible.has(k)) next[k] = v;
    }
    if (Object.keys(next).length === Object.keys(current).length) return next;
    current = next;
  }
  return current;
}
export function isAnswered(q, a) {
  const v = a[q.id];
  if (v === undefined || v === null) return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}
/** Progress = answered visible / visible. Optional questions count when skipped explicitly via UI. */
export function progress(a) {
  const vis = visibleQuestions(a);
  const answered = vis.filter((q) => isAnswered(q, a)).length;
  return { answered, total: vis.length, pct: vis.length ? Math.round((answered / vis.length) * 100) : 0 };
}
export const ENTITY_LABEL = {
  INDIVIDUAL: "Individual",
  SOLE_PROPRIETOR: "Sole proprietor",
  PARTNERSHIP: "Partnership",
  COMPANY: "Company",
};
