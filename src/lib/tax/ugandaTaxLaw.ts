/**
 * Uganda Tax Law Statutory Knowledge Base & Reference Engine
 * Covers:
 * - Income Tax Act (Cap 340) & Amendment Acts
 * - Value Added Tax Act (Cap 349) & Regulations
 * - Tax Procedures Code Act 2014 (TPCA)
 * - Tax Appeals Tribunal Act (Cap 345) & Procedural Rules
 * - Key Ugandan tax principles, thresholds, and judicial standards
 */

export interface TaxStatuteSection {
  act: "Income Tax Act" | "Value Added Tax Act" | "Tax Procedures Code Act" | "Tax Appeals Tribunal Act";
  section: string;
  title: string;
  summary: string;
  keyRules: string[];
  burdenOfProof?: "Taxpayer" | "Commissioner" | "Neutral" | string;
  taxTribunalNotes?: string;
  relatedSections?: string[];
}

export const UGANDA_TAX_STATUTES: TaxStatuteSection[] = [
  // ─── Income Tax Act (Cap 340) ─────────────────────────────────────────────
  {
    act: "Income Tax Act",
    section: "Section 2",
    title: "Interpretation and Statutory Definitions",
    summary: "Defines core terms including 'business asset', 'associate', 'gross income', 'chargeable income', 'resident individual', and 'withholding tax'.",
    keyRules: [
      "A 'business asset' means an asset used in or held ready for use in a business, or held for sale in a business.",
      "An asset does not become a business asset merely by having a commercial lease covenant; actual or intended nexus to business activity is legally required (see Asafali Wissanji v URA).",
      "Gross income includes business income, employment income, and property income derived during the year of income."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "URA frequently challenges asset sales as business disposals; TAT insists on strict factual test of readiness/use in an active business.",
    relatedSections: ["Section 18", "Section 21", "Section 50"]
  },
  {
    act: "Income Tax Act",
    section: "Section 18",
    title: "Business Income",
    summary: "Governs income derived by a person carrying on a business, including gains from disposal of business assets and trading stock.",
    keyRules: [
      "Includes any gain realized on disposal of business assets or cancellation of business debts.",
      "Requires an active business or adventure in the nature of trade.",
      "Excludes purely private/personal capital gains not integrated into an enterprise."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Central provision in dispute when URA assesses capital gains tax on land or share transfers.",
    relatedSections: ["Section 2", "Section 22", "Section 50", "Section 54"]
  },
  {
    act: "Income Tax Act",
    section: "Section 22",
    title: "Allowable Deductions for Business Expenditure",
    summary: "Deduction rules for expenditures incurred wholly and exclusively in the production of income included in gross income.",
    keyRules: [
      "The 'wholly and exclusively' test applies strictly.",
      "Capital expenditures, domestic or private expenses, and unauthorized provisions are non-deductible.",
      "Apportionment required if an expense has dual business and personal character."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Taxpayers must produce authentic commercial invoices, delivery notes, and eFRIS fiscal receipts to support deductions under TAT rulings.",
    relatedSections: ["Section 23", "Section 25", "Section 26"]
  },
  {
    act: "Income Tax Act",
    section: "Section 25",
    title: "Interest Deduction Limitation (Thin Capitalization / EBITDA Limit)",
    summary: "Limits interest deductions incurred by member of a group or non-resident entity to 30% of tax-adjusted EBITDA.",
    keyRules: [
      "Excess interest cannot be deducted in the current tax year but may be carried forward up to 3 tax years.",
      "Exempts licensed commercial banks and insurance institutions from the 30% EBITDA cap."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Common issue in multinational group transfer pricing disputes.",
    relatedSections: ["Section 90", "Section 91"]
  },
  {
    act: "Income Tax Act",
    section: "Section 79",
    title: "Source of Income (Uganda Source Rules)",
    summary: "Rules determining whether income has a source in Uganda for tax assessment purposes.",
    keyRules: [
      "Employment income has a Uganda source if services are rendered in Uganda, regardless of where payment occurs.",
      "Management or professional fees paid by a resident or Ugandan permanent establishment are deemed Ugandan source.",
      "Royalties paid for use of intellectual property in Uganda bear Uganda source status."
    ],
    burdenOfProof: "Neutral",
    taxTribunalNotes: "TAT has examined whether remote offshore IT services and software licensing constitute Ugandan source income.",
    relatedSections: ["Section 83", "Section 86", "Section 120"]
  },
  {
    act: "Income Tax Act",
    section: "Section 86",
    title: "Taxation of Non-Resident Withholding (International Payments)",
    summary: "Imposes 15% withholding tax on non-residents deriving Ugandan-sourced dividends, interest, royalties, rent, or management fees.",
    keyRules: [
      "Withholding rate is 15% unless modified by an applicable Double Taxation Avoidance Agreement (DTAA).",
      "Treaty relief requires valid Certificate of Tax Residency from the treaty partner country prior to payment."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Failure to withhold makes the resident payer primarily liable under Section 123.",
    relatedSections: ["Section 88", "Section 123"]
  },
  {
    act: "Income Tax Act",
    section: "Section 116",
    title: "Pay-As-You-Earn (PAYE) Withholding",
    summary: "Requires employers to withhold tax from employment income and remit to URA by the 15th day of the following calendar month.",
    keyRules: [
      "Tax brackets apply progressively (0%, 10%, 20%, 30%, and 40% top bracket on high earners exceeding UGX 10,000,000/mo).",
      "Fringe benefits (housing, motor vehicles, loans at preferential interest rates) must be grossed up and taxed."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Misclassifying employees as independent contractors to bypass PAYE triggers severe penal taxes under TPCA.",
    relatedSections: ["Section 19", "Section 123"]
  },
  {
    act: "Income Tax Act",
    section: "Section 119",
    title: "Withholding Tax on Goods and Services (6% WHT)",
    summary: "Mandates designated withholding agents and government bodies to deduct 6% WHT on domestic supplies exceeding UGX 1,000,000.",
    keyRules: [
      "Taxpayers in good standing may apply for a Withholding Tax Exemption Certificate (WHT Exemption List).",
      "Deducted WHT acts as an advance tax credit against final corporation income tax liability."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Withholding agents must issue valid URA WHT credit certs within specified statutory timeframes.",
    relatedSections: ["Section 128", "Section 130"]
  },

  // ─── Value Added Tax Act (Cap 349) ─────────────────────────────────────────
  {
    act: "Value Added Tax Act",
    section: "Section 4",
    title: "Imposition and Charge of Value Added Tax",
    summary: "Levies VAT at the standard rate of 18% on every taxable supply made by a taxable person in Uganda and every import of goods or services.",
    keyRules: [
      "Standard rate is 18%; zero-rated supplies are 0%; exempt supplies are not taxable.",
      "Every registered person must account for output tax and may claim allowable input tax credit."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Crucial starting point in VAT disputes regarding whether an activity was an exempt supply (Second Schedule) or zero-rated (Third Schedule).",
    relatedSections: ["Section 18", "Section 24"]
  },
  {
    act: "Value Added Tax Act",
    section: "Section 7",
    title: "VAT Registration Threshold & Compulsory Registration",
    summary: "Mandates VAT registration for businesses whose annual turnover exceeds UGX 150,000,000 (approx UGX 37.5M per quarter).",
    keyRules: [
      "Compulsory registration within 30 days of exceeding the threshold.",
      "Voluntary registration permitted subject to Commissioner General approval.",
      "Failure to register allows URA to backdate assessments with punitive late filing penalties."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "URA audits regularly recalculate gross receipts to establish whether unregistered vendors crossed the threshold.",
    relatedSections: ["Section 8", "Section 31"]
  },
  {
    act: "Value Added Tax Act",
    section: "Section 14 & eFRIS",
    title: "Tax Invoices, Credit Notes & Electronic Fiscal Receipting (eFRIS)",
    summary: "Governs mandatory issuance of valid tax invoices and integration with URA Electronic Fiscal Receipting and Invoicing System (eFRIS).",
    keyRules: [
      "Every VAT registered person must issue an eFRIS fiscal receipt/invoice for each supply.",
      "Input tax deduction cannot be claimed without an authentic eFRIS fiscalized invoice containing the fiscal verification code.",
      "Fictitious or non-fiscalized invoices are inadmissible for input tax deductions."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Recent TAT rulings strictly enforce that non-eFRIS invoices cannot support input tax relief.",
    relatedSections: ["Section 24", "TPCA Section 55"]
  },
  {
    act: "Value Added Tax Act",
    section: "Section 24",
    title: "Credit for Input Tax (Input Tax Deduction & Apportionment)",
    summary: "Permits registered taxpayers to deduct input VAT paid on business purchases against output VAT collected, subject to conditions.",
    keyRules: [
      "Input tax must be directly related to making taxable supplies.",
      "Disallowed input tax on passenger motor vehicles, entertainment, and non-business expenses.",
      "Partial exemption formula applies when supplying both taxable and exempt goods (mixed supplies)."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "URA often disallows input credits claiming suppliers did not declare matching output tax; TAT requires taxpayer to prove genuine commercial exchange.",
    relatedSections: ["Section 14", "Section 28"]
  },

  // ─── Tax Procedures Code Act 2014 (TPCA) ──────────────────────────────────
  {
    act: "Tax Procedures Code Act",
    section: "Section 19",
    title: "Assessments (Default, Advance & Additional Assessments)",
    summary: "Empowers the Commissioner General to issue estimated or default assessments where a taxpayer fails to file returns or understates tax.",
    keyRules: [
      "URA can issue additional assessments within a 3-year statutory limitation period.",
      "The 3-year limitation is waived in cases of fraud, gross or willful neglect by the taxpayer."
    ],
    burdenOfProof: "Commissioner for fraud; Taxpayer for assessment correctness",
    taxTribunalNotes: "If URA re-opens years beyond 3 years, URA must legally prove fraud or willful neglect; mere bookkeeping discrepancies do not constitute fraud.",
    relatedSections: ["Section 24", "Section 26"]
  },
  {
    act: "Tax Procedures Code Act",
    section: "Section 24",
    title: "Objections to Tax Decisions (Administrative Review)",
    summary: "Sets statutory requirements for lodging an objection against an assessment made by URA within 45 days.",
    keyRules: [
      "Taxpayer must file written notice of objection stating grounds within 45 calendar days of assessment service.",
      "Commissioner has 90 days to render an objection decision, failing which it may be treated as allowed or appealed.",
      "Extension of time may be granted on grounds of absence, illness, or reasonable cause."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Failure to lodge an objection within 45 days renders the assessment final and conclusive, barring Tribunal review unless time is formally enlarged.",
    relatedSections: ["Section 25", "TAT Act Section 16"]
  },
  {
    act: "Tax Procedures Code Act",
    section: "Section 26",
    title: "Burden of Proof in Tax Proceedings",
    summary: "Express statutory rule providing that the burden of proving that an assessment is excessive or incorrect lies upon the taxpayer.",
    keyRules: [
      "Taxpayer bears the legal burden on the balance of probabilities.",
      "Burden can be discharged by contemporaneous accounting books, bank statements, contracts, and export documentation."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Foundational provision cited in almost every TAT decision. Taxpayers lose if they cannot substantiate their claims with documentation.",
    relatedSections: ["Section 19", "TAT Act Section 18"]
  },
  {
    act: "Tax Procedures Code Act",
    section: "Section 40",
    title: "Penal Tax and Late Payment Interest",
    summary: "Imposes statutory interest of 2% per month compounded on unpaid taxes, and penal taxes for non-compliance.",
    keyRules: [
      "Interest runs from the due date until full settlement.",
      "Commissioner has limited statutory waiver discretion only under strict statutory conditions."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "TAT rarely waives statutory interest unless the underlying assessment itself is found to be erroneous or unlawful.",
    relatedSections: ["Section 41", "Section 42"]
  },

  // ─── Tax Appeals Tribunal Act (Cap 345) ────────────────────────────────────
  {
    act: "Tax Appeals Tribunal Act",
    section: "Section 14",
    title: "Jurisdiction of the Tax Appeals Tribunal",
    summary: "Grants TAT original judicial review jurisdiction over all tax disputes between taxpayers and the Uganda Revenue Authority.",
    keyRules: [
      "Application must be filed within 30 days of receiving the Commissioner's objection decision.",
      "Tribunal has powers equivalent to the High Court of Uganda to review questions of law and fact."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "TAT is the court of first instance for Ugandan tax litigation before appealing on points of law to the High Court.",
    relatedSections: ["Section 16", "Section 27"]
  },
  {
    act: "Tax Appeals Tribunal Act",
    section: "Section 16",
    title: "30% Tax Deposit Requirement on Appeal",
    summary: "Requires an applicant to pay 30% of the tax assessed or that part of the tax not in dispute, whichever is greater, prior to hearing.",
    keyRules: [
      "Applicant must tender 30% deposit to URA or provide acceptable security unless exempted.",
      "Tribunal retains equitable discretion to grant interim stay or determine genuine undisputed amounts.",
      "Failure to comply can result in dismissal of application without hearing on merits."
    ],
    burdenOfProof: "Taxpayer",
    taxTribunalNotes: "Critical tactical consideration for taxpayers facing large or speculative assessments.",
    relatedSections: ["Section 14", "TPCA Section 24"]
  },
  {
    act: "Tax Appeals Tribunal Act",
    section: "Section 18",
    title: "Powers and Orders of the Tribunal",
    summary: "Tribunal may confirm, reduce, set aside, remit back to the Commissioner with directions, or order costs.",
    keyRules: [
      "Tribunal rulings are legally binding on URA and taxpayer unless stayed or overturned on appeal.",
      "Tribunal may award costs to the successful litigant."
    ],
    burdenOfProof: "Neutral",
    taxTribunalNotes: "Precedents set by TAT establish administrative and judicial practice throughout Uganda.",
    relatedSections: ["Section 27"]
  }
];

/**
 * Searches the Uganda tax statutes knowledge base by keyword, section, or tax type.
 */
export function searchTaxStatutes(query: string, actFilter?: string): TaxStatuteSection[] {
  if (!query && !actFilter) return UGANDA_TAX_STATUTES;
  const q = query.toLowerCase().trim();

  return UGANDA_TAX_STATUTES.filter((item) => {
    if (actFilter && actFilter !== "All" && !item.act.toLowerCase().includes(actFilter.toLowerCase())) {
      return false;
    }
    if (!q) return true;

    return (
      item.section.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q) ||
      item.summary.toLowerCase().includes(q) ||
      item.keyRules.some((r) => r.toLowerCase().includes(q)) ||
      (item.taxTribunalNotes && item.taxTribunalNotes.toLowerCase().includes(q))
    );
  });
}

/**
 * Finds statutory provisions specifically relevant to a tax issue or dispute category.
 */
export function getTaxTopicProvisions(topic: string): TaxStatuteSection[] {
  const t = topic.toLowerCase();
  if (t.includes("vat") || t.includes("invoice") || t.includes("efris") || t.includes("input tax")) {
    return UGANDA_TAX_STATUTES.filter((s) => s.act === "Value Added Tax Act" || s.section.includes("55"));
  }
  if (t.includes("paye") || t.includes("employment") || t.includes("salary")) {
    return UGANDA_TAX_STATUTES.filter((s) => s.section.includes("116") || s.section.includes("2"));
  }
  if (t.includes("objection") || t.includes("assessment") || t.includes("appeal") || t.includes("tribunal") || t.includes("30%")) {
    return UGANDA_TAX_STATUTES.filter((s) => s.act === "Tax Procedures Code Act" || s.act === "Tax Appeals Tribunal Act");
  }
  if (t.includes("withholding") || t.includes("wht") || t.includes("international") || t.includes("treaty")) {
    return UGANDA_TAX_STATUTES.filter((s) => s.section.includes("86") || s.section.includes("119") || s.section.includes("25"));
  }
  // Default: Return key foundational statutes
  return UGANDA_TAX_STATUTES.slice(0, 6);
}
