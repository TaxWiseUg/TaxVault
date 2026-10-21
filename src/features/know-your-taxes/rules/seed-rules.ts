// Seed rule set UG-2026.07 (effective 1 July 2026).
import { RuleContent, RuleParam, TaxRuleVersion, VerificationStatus } from "../types";

export const RULE_SET_VERSION = "UG-2026.07";
const EFFECTIVE_FROM = "2026-07-01";
const MAX = Number.MAX_SAFE_INTEGER;

const p = (
  key: string,
  value: any,
  unit: RuleParam["unit"],
  label: string,
  sourceIds: string[],
  note?: string,
  verification: VerificationStatus = "NEEDS_VERIFICATION"
): RuleParam => ({
  key,
  value,
  unit,
  label,
  verification,
  sourceIds,
  note,
});

const PENALTY_GENERIC = {
  text: "Late registration, filing or payment can attract penalties and interest under the Tax Procedures Code Act. The amounts are set in the Act — check the current figures with URA or your tax adviser.",
  sourceIds: ["TPCA"],
  verification: "NEEDS_VERIFICATION" as VerificationStatus,
};

const URA_CHANNEL = [
  "File returns on the URA web portal (ura.go.ug) using your TIN.",
  "Generate a Payment Registration Number (PRN) on the portal, then pay at a URA-designated bank or approved mobile money channel.",
];

function rule(code: string, params: RuleParam[], content: RuleContent): TaxRuleVersion {
  return {
    code,
    version: "2026.07",
    effectiveFrom: EFFECTIVE_FROM,
    verification: "NEEDS_VERIFICATION",
    params,
    content,
  };
}

export const SEED_RULES: TaxRuleVersion[] = [
  rule("TIN_REGISTRATION", [], {
    name: "Taxpayer Identification Number (TIN) Registration",
    shortName: "TIN Registration",
    category: "REGISTRATION",
    plainDefinition:
      "A TIN is your unique number with URA. You need it before you can file returns, register for VAT, or clear goods at customs.",
    legalBasis: ["TPCA", "URA-PORTAL"],
    triggers: ["You earn income that must be declared to URA, run a business, employ staff, or import goods."],
    records: [
      "National ID (individuals) or certificate of incorporation (companies)",
      "Business registration documents from URSB where applicable",
    ],
    deadlines: ["Register before you start filing or trading. Registration is free on the URA portal."],
    channel: ["Apply online at ura.go.ug (TIN registration)."],
    consequences: [PENALTY_GENERIC],
    nextSteps: ["Check whether you already have a TIN before applying — duplicate TINs cause problems later."],
  }),
  rule(
    "PAYE_EMPLOYEE",
    [
      p(
        "monthlyBands",
        [
          [0, 335_000, 0],
          [335_000, 410_000, 20],
          [410_000, 485_000, 25],
          [485_000, 10_000_000, 30],
          [10_000_000, MAX, 40],
        ],
        "BANDS",
        "Resident individual monthly PAYE bands [from, to, rate %]",
        ["ITA-AMEND-2026", "ITA-S116"],
        "Tax-free threshold of UGX 335,000/month and the 25% band (410,000–485,000) are widely reported."
      ),
    ],
    {
      name: "Pay As You Earn (PAYE) — as an employee",
      shortName: "PAYE",
      category: "TAX",
      plainDefinition:
        "PAYE (Pay As You Earn) is income tax on your salary that your employer deducts before paying you, and sends to URA on your behalf. You usually don't file it yourself.",
      legalBasis: ["ITA-S116", "ITA-AMEND-2026"],
      triggers: ["You receive employment income (salary, wages, cash allowances) from an employer."],
      records: ["Monthly payslips", "Your employment contract", "Any PAYE certificate or annual statement from your employer"],
      deadlines: ["Your employer must pay the PAYE it deducts to URA by the 15th day of the following month."],
      channel: ["Your employer files and pays. You can view your PAYE credits on your URA portal account (Ledger)."],
      consequences: [
        {
          text: "If your employer fails to withhold, URA can hold the employer liable; you may still need to declare the income yourself.",
          sourceIds: ["ITA-S116"],
          verification: "NEEDS_VERIFICATION",
        },
      ],
      nextSteps: [
        "Check each payslip shows a PAYE deduction once your pay is above the tax-free threshold.",
        "Log in to the URA portal and confirm your employer's PAYE remittances appear against your TIN.",
        "If you have a second employer or other income, ask a tax adviser whether you need to file an annual return.",
      ],
    }
  ),
  rule(
    "PAYE_EMPLOYER",
    [p("dueDay", 15, "DAY_OF_MONTH", "PAYE remittance due day of following month", ["ITA-S116", "TPCA"])],
    {
      name: "PAYE — your duty as an employer",
      shortName: "PAYE (employer)",
      category: "TAX",
      plainDefinition:
        "As an employer you are a 'withholding agent': the law makes you deduct PAYE from each employee's pay and send it to URA, because the employer is the one actually holding the money when salary is paid.",
      legalBasis: ["ITA-S116", "ITA-AMEND-2026"],
      triggers: ["You pay salaries or wages to one or more employees, including casual and domestic workers."],
      records: [
        "Payroll register",
        "Employment contracts",
        "Monthly PAYE returns and payment receipts",
        "Records of benefits in kind",
      ],
      deadlines: ["File the monthly PAYE return and pay the tax by the 15th day of the month after the salary month."],
      channel: URA_CHANNEL,
      consequences: [
        {
          text: "An employer who fails to withhold or remit PAYE can be made personally liable for the tax not withheld, plus penalties and interest.",
          sourceIds: ["ITA-S116", "TPCA"],
          verification: "NEEDS_VERIFICATION",
        },
      ],
      nextSteps: [
        "Update your payroll for the 2026/27 bands (effective 1 July 2026). TaxWise's PAYE calculator uses the same rule set.",
        "Register each employee's TIN in your payroll records.",
        "Set a calendar reminder for the 15th of every month.",
      ],
    }
  ),
  rule(
    "INDIVIDUAL_INCOME_TAX",
    [
      p(
        "annualBands",
        [
          [0, 4_020_000, 0],
          [4_020_000, 4_920_000, 20],
          [4_920_000, 5_820_000, 25],
          [5_820_000, 120_000_000, 30],
          [120_000_000, MAX, 40],
        ],
        "BANDS",
        "Resident individual annual bands [from, to, rate %]",
        ["ITA-AMEND-2026"],
        "Annualised from the monthly PAYE bands. Exempt threshold UGX 4,020,000 is widely reported."
      ),
    ],
    {
      name: "Individual income tax (business, freelance and other income)",
      shortName: "Individual income tax",
      category: "TAX",
      plainDefinition:
        "Individual income tax is tax on an individual's chargeable income for the year — business or freelance profit and other income not already fully taxed at source. You declare it yourself in an annual return.",
      legalBasis: ["ITA", "ITA-AMEND-2026"],
      triggers: [
        "You earn business or freelance income above the presumptive tax range, or you are excluded from the presumptive regime (e.g. professional services).",
      ],
      records: [
        "Sales invoices and receipts (EFRIS where applicable)",
        "Expense receipts",
        "Bank statements",
        "Books of account",
      ],
      deadlines: [
        "Uganda's tax year runs 1 July – 30 June. The annual return is due within six months after year-end (31 December).",
        "Provisional (estimated) returns and payments may be due during the year — confirm the dates for your situation.",
      ],
      channel: URA_CHANNEL,
      consequences: [PENALTY_GENERIC],
      nextSteps: [
        "Keep separate books for your business income.",
        "Estimate your profit (income minus allowable expenses) so you can file a provisional return.",
      ],
    }
  ),
  rule(
    "PRESUMPTIVE_TAX",
    [
      p("lowerTurnover", 10_000_000, "UGX", "Presumptive regime lower turnover bound", ["ITA-PRESUMPTIVE"]),
      p(
        "upperTurnover",
        150_000_000,
        "UGX",
        "Presumptive regime upper turnover bound",
        ["ITA-PRESUMPTIVE", "UNU-WIDER-PRESUMPTIVE"]
      ),
      p(
        "fixedBands",
        [
          [10_000_000, 30_000_000, 80_000],
          [30_000_000, 50_000_000, 200_000],
          [50_000_000, 80_000_000, 400_000],
          [80_000_000, 150_000_000, 900_000],
        ],
        "AMOUNT_BANDS",
        "Annual presumptive tax where no proper records are kept [turnover above, up to and including, UGX payable]",
        ["ITA-PRESUMPTIVE", "UNU-WIDER-PRESUMPTIVE"]
      ),
      p(
        "recordsBands",
        [
          [10_000_000, 30_000_000, 0, 0.4],
          [30_000_000, 50_000_000, 80_000, 0.5],
          [50_000_000, 80_000_000, 180_000, 0.6],
          [80_000_000, 150_000_000, 360_000, 0.7],
        ],
        "RECORDS_BANDS",
        "Annual presumptive tax where proper records are kept [turnover above, up to, base UGX, % of turnover above band start]",
        ["ITA-PRESUMPTIVE", "UNU-WIDER-PRESUMPTIVE"]
      ),
    ],
    {
      name: "Presumptive Tax (Small Business Taxpayers)",
      shortName: "Presumptive Tax",
      category: "TAX",
      plainDefinition:
        "Presumptive tax is a simplified regime for small businesses: instead of working out exact profit, you pay a set annual amount based on your turnover band — or a lower percentage-based amount if you keep proper books of account. It is a final tax: no deductions for expenses.",
      legalBasis: ["ITA-PRESUMPTIVE", "UNU-WIDER-PRESUMPTIVE"],
      triggers: [
        "You are a resident small business with annual turnover inside the presumptive range.",
        "You are not in an excluded profession (e.g. medical, legal, accounting, engineering and similar professional services).",
      ],
      records: [
        "A record of daily sales (needed to show your turnover band)",
        "Purchase receipts",
        "Books of account, if you want the lower records-based rate",
        "Withholding tax certificates and provisional tax receipts — the only credits allowed against presumptive tax",
      ],
      deadlines: ["File the annual return after the tax year ends (by 31 December). Confirm payment timing with URA."],
      channel: URA_CHANNEL,
      consequences: [PENALTY_GENERIC],
      nextSteps: [
        "Keep proper books of account — the records-based amount is lower than the fixed amount in every band.",
        "If your turnover is close to the top of a band, track it monthly: crossing the band limit moves you to the next amount.",
        "If you keep full books and have high expenses, ask an adviser whether electing out of presumptive tax would cost less.",
      ],
    }
  ),
  rule("CORPORATE_INCOME_TAX", [p("rate", 30, "PERCENT", "Corporate income tax rate", ["ITA"])], {
    name: "Corporate Income Tax (CIT)",
    shortName: "Corporate Income Tax",
    category: "TAX",
    plainDefinition:
      "Corporate income tax is tax on a company's chargeable income — its taxable profit after allowable deductions and capital allowances.",
    legalBasis: ["ITA"],
    triggers: ["The business is a company resident in Uganda or a non-resident with a branch (permanent establishment) here."],
    records: [
      "Audited or management financial statements",
      "Fixed-asset register (for capital allowances)",
      "General ledger and trial balance",
      "EFRIS invoices",
    ],
    deadlines: [
      "Provisional tax is paid in instalments during the accounting year.",
      "The final return is due within six months after the end of the accounting year.",
    ],
    channel: URA_CHANNEL,
    consequences: [PENALTY_GENERIC],
    nextSteps: [
      "Use TaxWise's Corporate Income Tax calculator for a fuller computation (capital allowances, losses brought forward).",
      "File provisional returns on time — under-estimating can attract a penalty.",
    ],
  }),
  rule("PARTNERSHIP_INCOME", [], {
    name: "Partnership income (taxed in partners' hands)",
    shortName: "Partnership",
    category: "TAX",
    plainDefinition:
      "A partnership files a return showing its income, but the partnership itself is generally not taxed — each partner is taxed on their share of the profit.",
    legalBasis: ["ITA"],
    triggers: ["You carry on business as a partnership."],
    records: ["Partnership accounts", "Partnership agreement showing profit shares"],
    deadlines: ["Partnership and partners' returns are due within six months after year-end."],
    channel: URA_CHANNEL,
    consequences: [PENALTY_GENERIC],
    nextSteps: ["Each partner should confirm their own TIN and file their return including their share."],
  }),
  rule(
    "RENTAL_TAX_INDIVIDUAL",
    [
      p("rate", 12, "PERCENT", "Rental tax rate for individuals", ["ITA-S5"]),
      p(
        "threshold",
        2_820_000,
        "UGX",
        "Annual rental income threshold for individuals",
        ["ITA-S5"],
        "Long-standing statutory threshold."
      ),
    ],
    {
      name: "Rental Income Tax (Individuals)",
      shortName: "Rental Tax (Individual)",
      category: "TAX",
      plainDefinition:
        "Individual landlords pay rental tax as a flat percentage of gross rent above a threshold. It is a separate tax — rent isn't mixed with your salary or business income.",
      legalBasis: ["ITA-S5"],
      triggers: ["You are an individual earning rent from property in Uganda."],
      records: [
        "Tenancy agreements",
        "Rent receipts / rent book",
        "Property ownership documents",
        "Bank records of rent received",
      ],
      deadlines: ["Rental income return is due within six months after the end of the tax year (31 December)."],
      channel: URA_CHANNEL,
      consequences: [PENALTY_GENERIC],
      nextSteps: [
        "Register each property under your TIN on the URA portal.",
        "Use TaxWise's Rental Income Tax calculator for property-by-property detail.",
      ],
    }
  ),
  rule(
    "RENTAL_TAX_NON_INDIVIDUAL",
    [p("rate", 30, "PERCENT", "Rental tax rate for companies/non-individuals (on chargeable rental income)", ["ITA"])],
    {
      name: "Rental Income Tax (Companies & Non-Individuals)",
      shortName: "Rental Tax (Company)",
      category: "TAX",
      plainDefinition:
        "Companies and other non-individuals are taxed on net rental income — rent less allowable expenses — at the corporate rate, subject to rules limiting some deductions.",
      legalBasis: ["ITA"],
      triggers: ["A company or other non-individual earns rent from property in Uganda."],
      records: ["Tenancy agreements", "Rental expense receipts", "Interest and financing records"],
      deadlines: ["Declared in the annual return within six months after year-end."],
      channel: URA_CHANNEL,
      consequences: [PENALTY_GENERIC],
      nextSteps: ["Confirm which rental expenses are deductible — there are caps. Professional review recommended."],
    }
  ),
  rule(
    "VAT",
    [
      p("rate", 18, "PERCENT", "Standard VAT rate", ["VATA"]),
      p(
        "registrationThreshold",
        300_000_000,
        "UGX",
        "Annual VAT registration threshold",
        ["VATA-S7", "VATA-AMEND-2026"],
        "VAT (Amendment) Act 2026, effective 1 July 2026 (UGX 75m per quarter).",
        "VERIFIED"
      ),
      p("dueDay", 15, "DAY_OF_MONTH", "VAT return & payment due day of following month", ["VATA"]),
    ],
    {
      name: "Value Added Tax (VAT)",
      shortName: "VAT",
      category: "TAX",
      plainDefinition:
        "VAT is a tax on sales. A VAT-registered business adds VAT to its prices (output VAT), deducts the VAT it paid on business purchases (input VAT), and pays URA the difference every month.",
      legalBasis: ["VATA-S7", "VATA", "VATA-AMEND-2026", "URA-EFRIS"],
      triggers: [
        "Your taxable turnover exceeds, or is expected to exceed, the registration threshold (UGX 300,000,000) — or you are already registered (voluntarily or otherwise).",
      ],
      records: [
        "EFRIS e-invoices / e-receipts for every sale",
        "Purchase invoices showing input VAT",
        "Import entries (for VAT on imports)",
        "Monthly VAT returns",
      ],
      deadlines: ["File the monthly VAT return and pay by the 15th day of the following month — even in months with no sales."],
      channel: ["Issue invoices through EFRIS.", ...URA_CHANNEL],
      consequences: [PENALTY_GENERIC],
      nextSteps: [
        "Issue every sale through EFRIS.",
        "Reconcile EFRIS sales to your VAT return each month — TaxWise's Compliance Review can check this.",
      ],
    }
  ),
  rule("VAT_REVERSE_CHARGE", [p("rate", 18, "PERCENT", "VAT rate applied to imported services", ["VATA"])], {
    name: "VAT on imported services (reverse charge)",
    shortName: "Reverse-charge VAT",
    category: "TAX",
    plainDefinition:
      "When a business buys services from a supplier abroad, the business itself may have to account for the VAT (a 'reverse charge'), because the foreign supplier isn't in the Ugandan VAT system.",
    legalBasis: ["VATA"],
    triggers: ["You buy services (software, consulting, licences) from non-resident suppliers."],
    records: ["Foreign supplier invoices", "Proof of payment", "Contracts"],
    deadlines: ["Accounted for in the VAT return for the month of the supply."],
    channel: URA_CHANNEL,
    consequences: [PENALTY_GENERIC],
    nextSteps: [
      "Ask an adviser whether input credit is available — rules restrict credit on some imported services.",
    ],
  }),
  rule(
    "WHT_AGENT",
    [
      p("rate", 6, "PERCENT", "WHT on payments by designated agents", ["ITA-S119"]),
      p("minPayment", 1_000_000, "UGX", "Minimum payment subject to WHT", ["ITA-S119"]),
      p("dueDay", 15, "DAY_OF_MONTH", "WHT remittance due day of following month", ["ITA-S119"]),
    ],
    {
      name: "Withholding tax (WHT) as a designated agent",
      shortName: "WHT (agent)",
      category: "TAX",
      plainDefinition:
        "Withholding tax is tax deducted at the point of payment. URA designates certain businesses to deduct a percentage from qualifying payments to suppliers and pay it to URA; the supplier gets a credit against their own tax.",
      legalBasis: ["ITA-S119"],
      triggers: [
        "URA has designated you as a withholding agent and you pay suppliers for goods or services above the minimum amount.",
      ],
      records: [
        "Supplier invoices",
        "WHT certificates issued to suppliers",
        "Monthly WHT returns",
        "List of suppliers exempted from WHT",
      ],
      deadlines: ["Pay the tax withheld by the 15th day of the following month."],
      channel: URA_CHANNEL,
      consequences: [
        {
          text: "A withholding agent who fails to withhold is generally personally liable for the tax not withheld, plus penalties.",
          sourceIds: ["ITA-S119", "TPCA"],
          verification: "NEEDS_VERIFICATION",
        },
      ],
      nextSteps: [
        "Check each supplier's WHT exemption status on the URA portal before paying.",
        "Issue WHT certificates promptly.",
      ],
    }
  ),
  rule(
    "WHT_NON_RESIDENT",
    [p("rate", 15, "PERCENT", "General WHT rate on payments to non-residents", ["ITA-S83"])],
    {
      name: "Withholding tax on payments to non-residents",
      shortName: "WHT (non-residents)",
      category: "TAX",
      plainDefinition:
        "When you pay a non-resident for things like services, royalties, management fees, dividends or interest, you usually must deduct tax and pay it to URA, because URA can't easily collect from the foreign recipient.",
      legalBasis: ["ITA-S83", "ITA-AMEND-2026"],
      triggers: ["You pay non-resident persons for income sourced in Uganda."],
      records: ["Contracts and invoices", "Proof of non-residency / tax residence certificates", "WHT returns"],
      deadlines: ["Remit by the 15th day of the following month."],
      channel: URA_CHANNEL,
      consequences: [PENALTY_GENERIC],
      nextSteps: [
        "Check whether a double taxation agreement reduces the rate.",
        "Professional review recommended — rates differ by payment type.",
      ],
    }
  ),
  rule("WHT_IMPORTS", [p("rate", 6, "PERCENT", "WHT on importation of goods (customs value)", ["ITA"])], {
    name: "Withholding tax on imported goods",
    shortName: "WHT on imports",
    category: "TAX",
    plainDefinition:
      "Withholding tax is collected at customs on most commercial imports and credited against your income tax for the year.",
    legalBasis: ["ITA"],
    triggers: ["You import goods for business, unless you hold a valid WHT exemption."],
    records: ["Customs entries", "Commercial invoices", "Bills of lading / airway bills"],
    deadlines: ["Paid at the time goods are cleared."],
    channel: ["Paid through URA customs (ASYCUDA) on clearance."],
    consequences: [PENALTY_GENERIC],
    nextSteps: ["Keep customs receipts — the WHT is a credit in your annual return."],
  }),
  rule("IMPORT_DUTIES", [], {
    name: "Import duties and taxes",
    shortName: "Import duties",
    category: "TAX",
    plainDefinition:
      "Goods imported into Uganda may attract import duty under the EAC Common External Tariff, plus VAT on imports, excise duty on certain goods, and other levies, all collected by URA Customs.",
    legalBasis: ["EACCMA", "VATA"],
    triggers: ["You import goods into Uganda."],
    records: [
      "Commercial invoice",
      "Packing list",
      "Bill of lading / airway bill",
      "Certificate of origin",
      "Import permits where required",
    ],
    deadlines: ["Payable before goods are released from customs."],
    channel: ["Declared and paid through URA customs (ASYCUDA)."],
    consequences: [PENALTY_GENERIC],
    nextSteps: ["Use TaxWise's customs calculators to estimate duties for a specific consignment."],
  }),
  rule("CAPITAL_GAINS", [], {
    name: "Tax on gains from selling business assets or shares",
    shortName: "Capital gains",
    category: "TAX",
    plainDefinition:
      "Uganda doesn't have a separate capital gains tax Act; gains on disposing of business assets, commercial property or shares are generally included in income and taxed under the Income Tax Act.",
    legalBasis: ["ITA"],
    triggers: ["You sold business assets, commercial property or shares at a gain."],
    records: [
      "Purchase and sale agreements",
      "Cost records and improvement costs",
      "Valuation reports",
      "Share transfer documents",
    ],
    deadlines: ["Included in the annual return for the year of disposal."],
    channel: URA_CHANNEL,
    consequences: [PENALTY_GENERIC],
    nextSteps: ["The treatment depends on the asset and your status — have a professional review the transaction."],
  }),
  rule("FOREIGN_INCOME", [], {
    name: "Tax on foreign-source income",
    shortName: "Foreign income",
    category: "TAX",
    plainDefinition:
      "Uganda taxes residents on worldwide income. Foreign-source income of resident individuals is taxed at the same rates as Ugandan income. A foreign tax credit may reduce double taxation.",
    legalBasis: ["ITA", "ITA-AMEND-2026"],
    triggers: ["You are resident in Uganda and earn income from outside Uganda."],
    records: ["Foreign income statements", "Proof of foreign tax paid", "Exchange-rate records"],
    deadlines: ["Declared in your annual return (due 31 December)."],
    channel: URA_CHANNEL,
    consequences: [PENALTY_GENERIC],
    nextSteps: ["Have a professional confirm source, treaty position and foreign tax credits."],
  }),
  rule("INVESTMENT_INCOME_WHT", [], {
    name: "Withholding tax on dividends and interest",
    shortName: "Dividends & interest",
    category: "TAX",
    plainDefinition:
      "Banks and companies usually deduct withholding tax when they pay you interest or dividends. For many individuals this is a final tax.",
    legalBasis: ["ITA"],
    triggers: ["You receive dividends or interest."],
    records: ["Bank interest certificates", "Dividend vouchers"],
    deadlines: ["Withheld by the payer at the time of payment."],
    channel: ["Withheld and paid by the bank or company."],
    consequences: [],
    nextSteps: ["Keep certificates showing tax deducted, in case you need to show it was a final tax."],
  }),
  rule(
    "NSSF",
    [
      p("employeeRate", 5, "PERCENT", "Employee NSSF contribution", ["NSSF-ACT"]),
      p("employerRate", 10, "PERCENT", "Employer NSSF contribution", ["NSSF-ACT"]),
      p("dueDay", 15, "DAY_OF_MONTH", "NSSF remittance due day of following month", ["NSSF-ACT"]),
    ],
    {
      name: "NSSF contributions (statutory social security — not a tax)",
      shortName: "NSSF",
      category: "STATUTORY_CONTRIBUTION",
      plainDefinition:
        "NSSF contributions are retirement savings that employers must remit for employees. They are not a tax and are not paid to URA, but they are a legal obligation that runs alongside PAYE.",
      legalBasis: ["NSSF-ACT"],
      triggers: ["You employ staff. Employers remit 10% employer share and 5% employee deduction (15% total)."],
      records: ["Payroll", "NSSF schedules and payment receipts", "Employee NSSF numbers"],
      deadlines: ["Remit by the 15th day of the following month."],
      channel: ["NSSF employer portal (nssfug.org)."],
      consequences: [
        {
          text: "Late remittance attracts surcharges under the NSSF Act.",
          sourceIds: ["NSSF-ACT"],
          verification: "NEEDS_VERIFICATION",
        },
      ],
      nextSteps: ["Register as an employer with NSSF and enrol each employee."],
    }
  ),
  rule("LOCAL_SERVICE_TAX", [], {
    name: "Local Service Tax (local government)",
    shortName: "LST",
    category: "TAX",
    plainDefinition:
      "Local Service Tax is a small annual tax collected by your local government (e.g. KCCA in Kampala) from people in gainful employment or business, graduated by income.",
    legalBasis: ["LGA-LST"],
    triggers: [
      "You earn employment or business income above the local exemption level, or you employ staff.",
    ],
    records: ["LST receipts", "Payroll LST deductions"],
    deadlines: ["Collected in instalments at the start of the financial year."],
    channel: ["Local government / KCCA revenue system."],
    consequences: [],
    nextSteps: ["Check your local government's current LST scale."],
  }),
  rule("TRADING_LICENCE", [], {
    name: "Business registration and trading licence (not a tax)",
    shortName: "Licences",
    category: "REGISTRATION",
    plainDefinition:
      "Separate from tax, most businesses must be registered with URSB and hold a trading licence from their local government.",
    legalBasis: ["LGA-LST"],
    triggers: ["You run a business from premises in Uganda."],
    records: ["URSB registration certificate", "Trading licence", "Sector licences"],
    deadlines: ["Trading licences are renewed annually."],
    channel: ["URSB (business registration); local government / KCCA (trading licence)."],
    consequences: [],
    nextSteps: ["Confirm your licence is current for this financial year."],
  }),
];

export function getRule(rules: TaxRuleVersion[], code: string, asOf: string): TaxRuleVersion {
  const candidates = rules
    .filter((r) => r.code === code && r.effectiveFrom <= asOf && (!r.effectiveTo || asOf < r.effectiveTo))
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  if (!candidates[0]) throw new Error(`No rule for ${code} effective at ${asOf}`);
  return candidates[0];
}
