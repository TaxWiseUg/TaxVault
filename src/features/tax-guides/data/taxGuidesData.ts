import { TaxCategory, TaxGuide } from "../types";

// Standard statutory penalties under the Tax Procedures Code Act
const LATE_RETURN = {
  item: "Late return",
  penalty:
    "The higher of 2% of the tax payable or UGX 200,000, for each month the return is outstanding",
};
const LATE_PAYMENT = {
  item: "Late payment",
  penalty: "Interest of 2% per month on the unpaid tax",
};
const FALSE_STATEMENT = {
  item: "False or misleading statement (knowingly or recklessly)",
  penalty: "200% of the tax underpaid or overclaimed",
};
const NO_RECORDS = {
  item: "Deliberately failing to keep proper records",
  penalty: "Double the tax payable for the period",
};

// Official statutory sources
const SRC = {
  pwcDev: {
    title: "PwC Tax Summaries: Uganda significant developments (reviewed 22 Oct 2026)",
    url: "https://taxsummaries.pwc.com/uganda/corporate/significant-developments",
  },
  pwcInd: {
    title: "PwC Tax Summaries: Uganda taxes on personal income",
    url: "https://taxsummaries.pwc.com/Uganda/Individual/Taxes-on-personal-income",
  },
  pwcCorp: {
    title: "PwC Tax Summaries: Uganda taxes on corporate income",
    url: "https://taxsummaries.pwc.com/uganda/corporate/taxes-on-corporate-income",
  },
  pwcAdmin: {
    title: "PwC Tax Summaries: Uganda tax administration",
    url: "https://taxsummaries.pwc.com/uganda/corporate/tax-administration",
  },
  pwcCard: {
    title: "PwC Uganda Tax Data Card 2025/26",
    url: "https://www.pwc.com/ug/en/assets/pdf/tax-datacard-2025-2026.pdf",
  },
  pwcYearEnd: {
    title: "PwC Uganda: Year-end tax filing obligations",
    url: "https://www.pwc.com/ug/en/press-room/understanding-year-end-tax-filing-obligations.html",
  },
  uraRental: {
    title: "URA Taxman: A simplified guide on rental income tax",
    url: "https://thetaxman.ura.go.ug/?p=2138",
  },
  ura: {
    title: "Uganda Revenue Authority",
    url: "https://ura.go.ug",
  },
};

export const CATEGORIES: TaxCategory[] = [
  "All",
  "Indirect tax",
  "Income tax",
  "Employment",
  "Property",
  "Small business",
];
export const TAX_CATEGORIES = CATEGORIES;

export const KYT_GUIDE_MAP: Record<string, string> = {
  vat: "vat",
  paye: "paye",
  rental: "rental-income-tax",
  cit: "corporate-income-tax",
  presumptive: "presumptive-tax",
  wht: "withholding-tax",
};

export const TAX_GUIDES: TaxGuide[] = [
  // ====================================================================
  // 1. VAT (Value Added Tax)
  // ====================================================================
  {
    slug: "vat",
    title: "Value Added Tax",
    short: "VAT",
    category: "Indirect tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: [
      "vat",
      "efris",
      "registration",
      "threshold",
      "input tax",
      "output tax",
      "reverse charge",
      "imported services",
    ],
    summary:
      "A tax on most goods and services supplied in Uganda. Registered businesses charge it on sales, recover it on purchases and file monthly with URA.",
    keyFacts: [
      { label: "Standard rate", value: "18%" },
      { label: "Registration threshold", value: "UGX 300m / year" },
      { label: "Return and payment due", value: "15th of next month" },
      { label: "Invoicing", value: "Through EFRIS" },
    ],
    sections: {
      whatItIs:
        "VAT is charged on taxable supplies made by taxable persons, on imports of goods (unless exempt), and on imported services received by any person in Uganda. A registered business charges output VAT on its sales, deducts the input VAT it paid on business purchases, and pays URA the difference.",
      changes: {
        title: "What changed on 1 July 2026 (VAT Amendment Act 2026)",
        points: [
          "The annual registration threshold doubled from UGX 150 million to UGX 300 million.",
          "The three-month trigger rose from UGX 37.5 million to UGX 75 million.",
          "Designated persons who receive an EFRIS e-invoice or e-receipt for a taxable supply no longer withhold VAT on it.",
          "Interest on delayed refunds is now triggered at 5% of the total refund claimed, instead of a fixed amount.",
          "A new penal tax applies for EFRIS failures (see Penalties).",
        ],
      },
      whoApplies: [
        "Registration is compulsory once annual taxable turnover exceeds UGX 300 million, or exceeds UGX 75 million in any three consecutive months.",
        "Businesses below the threshold may apply for voluntary registration, subject to URA approval. This can make sense if most of your customers are VAT-registered and can claim back the VAT you charge.",
        "Anyone who receives imported services may have to account for VAT on them, even if they are not registered.",
      ],
      rates: [
        {
          name: "Standard",
          rate: "18%",
          note: "All supplies not listed as exempt or zero-rated in the VAT Act schedules.",
        },
        {
          name: "Zero-rated",
          rate: "0%",
          note: "Includes exports. No VAT is charged, but input VAT can be recovered.",
        },
        {
          name: "Exempt",
          rate: "—",
          note: "No VAT is charged and input VAT cannot be recovered.",
        },
      ],
      filing: [
        "Issue every invoice and receipt through EFRIS. Your customers need EFRIS invoices to claim input VAT.",
        "File the VAT return on URA e-Services every month, by the 15th day of the following month, even if no VAT is due.",
        "Pay any net VAT by the same date, using a PRN.",
        "If input VAT exceeds output VAT, the excess is carried forward or claimed as a refund.",
        "Keep VAT records for at least five years.",
      ],
      examples: [
        {
          title: "Monthly VAT return",
          scenario:
            "In March, a registered business makes sales of UGX 50,000,000 and buys business inputs of UGX 30,000,000, both VAT-exclusive and backed by EFRIS invoices.",
          lines: [
            { label: "Output VAT on sales", calc: "50,000,000 × 18%", amount: 9000000 },
            { label: "Less: input VAT on purchases", calc: "30,000,000 × 18%", amount: -5400000 },
          ],
          total: { label: "Net VAT payable", amount: 3600000, note: "Due by 15 April" },
        },
        {
          title: "Extracting VAT from an inclusive price",
          scenario: "A customer pays UGX 1,180,000 including VAT. How much of that is VAT?",
          lines: [
            { label: "VAT-inclusive price", calc: "", amount: 1180000 },
            { label: "VAT fraction", calc: "1,180,000 × 18/118", amount: 180000 },
          ],
          total: { label: "VAT-exclusive value", amount: 1000000, note: "1,180,000 − 180,000" },
        },
      ],
      special: [
        {
          title: "Imported services (reverse charge)",
          text: "When you buy services from a supplier outside Uganda, you account for VAT on them yourself at 18%. Leaving these out is one of the most common audit findings.",
        },
        {
          title: "Mixed supplies",
          text: "If you make both taxable and exempt supplies, only the input VAT that relates to taxable supplies is recoverable. Input VAT on shared costs has to be apportioned.",
        },
        {
          title: "Deregistration",
          text: "Falling below the new UGX 300 million threshold does not cancel your registration automatically. You must apply to URA to deregister.",
        },
      ],
      penalties: [
        LATE_RETURN,
        LATE_PAYMENT,
        {
          item: "EFRIS failures (no e-invoice or e-receipt, or tampering with a device)",
          penalty: "The higher of UGX 200,000 or double the tax due (from 1 July 2026)",
        },
        FALSE_STATEMENT,
      ],
      mistakes: [
        "Applying the old UGX 150 million threshold, which many websites still quote.",
        "Claiming input VAT on invoices that were not issued through EFRIS.",
        "Claiming input VAT on purchases used to make exempt supplies.",
        "Forgetting the reverse charge on imported services.",
        "Not filing a nil return in a month with no sales.",
      ],
      faqs: [
        {
          q: "My turnover is UGX 200 million. Do I have to register?",
          a: "Not from 1 July 2026, unless you cross UGX 75 million in any three consecutive months. You can still choose to register voluntarily.",
        },
        {
          q: "Can I claim VAT on a car for the business?",
          a: "Input VAT on passenger vehicles and their running costs is generally not recoverable unless dealing in vehicles is your business. Check the specific rules before claiming.",
        },
        {
          q: "Is VAT charged on rent?",
          a: "Commercial rent is generally a taxable supply for a registered landlord. Residential rent is exempt.",
        },
      ],
      legal: [
        "Value Added Tax Act, Cap. 349",
        "Value Added Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcDev, SRC.pwcCard, SRC.ura],
    },
    cta: {
      label: "Review a VAT return in Compliance Review",
      page: "compliance",
      href: "/compliance-review?type=vat",
    },
  },

  // ====================================================================
  // 2. PAYE (Pay As You Earn)
  // ====================================================================
  {
    slug: "paye",
    title: "Pay As You Earn",
    short: "PAYE",
    category: "Employment",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: [
      "paye",
      "salary",
      "employer",
      "payroll",
      "employment income",
      "bands",
      "benefits in kind",
      "non-resident",
      "2026 amendment",
    ],
    summary:
      "Income tax that employers withhold from employees’ pay every month and remit to URA. New bands apply from 1 July 2026.",
    keyFacts: [
      { label: "Tax-free band", value: "UGX 335,000 / month" },
      { label: "Top rate", value: "30% + 10% over UGX 10m" },
      { label: "Return and payment due", value: "15th of next month" },
      { label: "Current bands from", value: "1 July 2026" },
    ],
    sections: {
      whatItIs:
        "PAYE is how income tax on employment income is collected. The employer calculates the tax on each employee’s monthly pay, deducts it before paying salary, and remits it to URA on the employee’s behalf. For an employee with no other income, the tax withheld is final.",
      changes: {
        title: "What changed on 1 July 2026 (Income Tax Amendment Act 2026)",
        points: [
          "The tax-free band rose from UGX 235,000 to UGX 335,000 a month (UGX 4,020,000 a year).",
          "The old 10% band is gone. People who were in it now pay no PAYE.",
          "A new 25% band applies between UGX 410,001 and 485,000 a month.",
          "The 30% rate now starts at UGX 485,001 instead of UGX 410,001.",
          "Employees earning above UGX 410,000 a month now pay UGX 10,000 to 13,750 less each month.",
          "The non-resident scale and the extra 10% above UGX 10 million are unchanged.",
        ],
      },
      whoApplies: [
        "Every employer must operate PAYE on payments to employees. That includes salary, wages, overtime, bonuses, leave pay, allowances and taxable benefits in kind.",
        "Residents and non-residents are taxed on different scales. Non-resident employees get no tax-free band.",
      ],
      rateTables: [
        {
          caption: "Resident individuals, monthly chargeable income:",
          columns: ["Monthly income (UGX)", "Tax"],
          rows: [
            ["0 – 335,000", "Nil"],
            ["335,001 – 410,000", "20% of the amount over 335,000"],
            ["410,001 – 485,000", "15,000 + 25% of the amount over 410,000"],
            ["485,001 – 10,000,000", "33,750 + 30% of the amount over 485,000"],
            ["Above 10,000,000", "As above + a further 10% of the amount over 10,000,000"],
          ],
        },
        {
          caption: "Non-resident individuals, monthly chargeable income:",
          columns: ["Monthly income (UGX)", "Tax"],
          rows: [
            ["0 – 335,000", "10% of the total"],
            ["335,001 – 410,000", "33,500 + 20% of the amount over 335,000"],
            ["410,001 – 10,000,000", "48,500 + 30% of the amount over 410,000"],
            ["Above 10,000,000", "As above + a further 10% of the amount over 10,000,000"],
          ],
        },
      ],
      rateNotes: [
        "Annual equivalents for residents: nil up to UGX 4,020,000, then 20% to 4,920,000, 25% to 5,820,000 and 30% above that, with the extra 10% above UGX 120 million.",
      ],
      filing: [
        "Calculate PAYE on each employee’s chargeable pay, including allowances and benefits, when salary is paid.",
        "File the monthly PAYE return on URA e-Services by the 15th day of the following month.",
        "Pay the PAYE withheld by the same date, using a PRN.",
        "Give each employee a record of tax withheld.",
        "Reconcile payroll to the monthly returns at year end, and keep payroll records for at least five years.",
      ],
      examples: [
        {
          title: "Resident employee on UGX 1,000,000",
          scenario: "A resident employee earns UGX 1,000,000 a month with no benefits in kind.",
          lines: [
            { label: "First 335,000", calc: "335,000 × 0%", amount: 0 },
            { label: "Next 75,000 (to 410,000)", calc: "75,000 × 20%", amount: 15000 },
            { label: "Next 75,000 (to 485,000)", calc: "75,000 × 25%", amount: 18750 },
            { label: "Balance of 515,000", calc: "515,000 × 30%", amount: 154500 },
          ],
          total: { label: "PAYE for the month", amount: 188250, note: "Old bands: 202,000" },
        },
        {
          title: "High earner above UGX 10 million",
          scenario: "A resident director earns UGX 12,000,000 a month.",
          lines: [
            { label: "Fixed tax up to 485,000", calc: "15,000 + 18,750", amount: 33750 },
            { label: "30% on 485,001 – 12,000,000", calc: "11,515,000 × 30%", amount: 3454500 },
            { label: "Extra 10% above 10,000,000", calc: "2,000,000 × 10%", amount: 200000 },
          ],
          total: { label: "PAYE for the month", amount: 3688250, note: "30.7% effective rate" },
        },
      ],
      special: [
        {
          title: "Benefits in kind",
          text: "A car, housing, free meals, school fees paid for an employee’s children, or a loan below market rate are all taxable. Each is valued under the Income Tax Act and added to chargeable income.",
        },
        {
          title: "Directors",
          text: "A director who is paid a salary or fees is an employee for PAYE purposes. Directors’ fees cannot be left off the payroll.",
        },
        {
          title: "Casual workers",
          text: "PAYE applies to casual and short-term workers too. Pay above the tax-free band is taxable even if the worker is with you for one month.",
        },
        {
          title: "Lump sums and termination pay",
          text: "Bonuses, gratuity and terminal benefits are employment income. Check the specific rules on how lump sums are spread or taxed before processing them.",
        },
      ],
      penalties: [LATE_RETURN, LATE_PAYMENT, FALSE_STATEMENT, NO_RECORDS],
      mistakes: [
        "Payroll software still using the old UGX 235,000 tax-free band. If any 2026/27 returns were filed at the old rates, check whether they need amending.",
        "Leaving allowances and benefits in kind out of chargeable income.",
        "Giving non-resident employees the tax-free band.",
        "Treating directors’ fees or casual pay as outside PAYE.",
        "Remitting PAYE late, which brings penalties and interest on top of the tax.",
      ],
      faqs: [
        {
          q: "Does the new tax-free band apply from January 2027?",
          a: "No. The new bands took effect on 1 July 2026, at the start of the 2026/27 year of income.",
        },
        {
          q: "Is PAYE my final tax?",
          a: "For an employee with no other income, yes. If you also have business or other income, you file an individual return and the PAYE withheld counts as a credit.",
        },
        {
          q: "Who pays PAYE if the employer fails to withhold it?",
          a: "The employer is liable for the tax it should have withheld, plus penalties and interest.",
        },
      ],
      legal: [
        "Income Tax Act, Cap. 338",
        "Income Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcDev, SRC.pwcInd, SRC.pwcCard],
    },
    cta: {
      label: "Calculate PAYE with the PAYE Calculator",
      page: "paye",
      href: "/calculators/paye",
    },
  },

  // ====================================================================
  // 3. Rental income tax
  // ====================================================================
  {
    slug: "rental-income-tax",
    title: "Rental Income Tax",
    short: "Rental",
    category: "Property",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["rental", "landlord", "property", "rent", "tenant", "partnership", "company"],
    summary:
      "Tax on income from renting out land and buildings. Individuals pay 12% on gross rent above a threshold; companies pay 30% after allowable expenses.",
    keyFacts: [
      { label: "Individuals", value: "12% of gross rent" },
      { label: "Tax-free amount", value: "UGX 2,820,000 / year" },
      { label: "Companies", value: "30%, expenses capped at 50%" },
      { label: "New from 1 July 2026", value: "Monthly filing option" },
    ],
    sections: {
      whatItIs:
        "Rental income tax applies to income earned from renting out land, buildings or other immovable property in Uganda. Rental income is taxed separately from other income, so business losses cannot be set off against it.",
      changes: {
        title: "What changed on 1 July 2026",
        points: [
          "Individual landlords can now choose to file and pay rental income tax monthly, instead of only once a year.",
          "The 12% rate and the UGX 2,820,000 tax-free amount for individuals are unchanged.",
        ],
      },
      whoApplies: [
        "Any person who earns rent from property in Uganda, whether an individual, a partnership, a company or a trust.",
        "The UGX 2,820,000 tax-free amount (UGX 235,000 a month) applies once per individual, against total rent from all their properties combined.",
      ],
      rateTable: {
        caption: "How each type of landlord is taxed:",
        columns: ["Landlord", "Tax"],
        rows: [
          ["Individual", "12% of gross rent above UGX 2,820,000. No expenses deductible."],
          ["Partnership", "Each partner taxed as an individual on their share of the rent."],
          [
            "Company, trustee or retirement fund",
            "30% of rent after expenses, which are capped at 50% of gross rent.",
          ],
          ["Non-resident landlord", "The tenant withholds 15% of gross rent (see Withholding Tax)."],
        ],
      },
      filing: [
        "Register for rental income tax with URA and get a TIN if you do not already have one.",
        "Individuals: file and pay either monthly (from 1 July 2026) or through an annual return.",
        "The annual return is due within six months after the year of income ends, so by 31 December for a year ending 30 June.",
        "Declare the rent from every property, with tenancy agreements or rent receipts as support.",
        "Any rental tax paid in advance is credited only against your rental tax, not against other income tax.",
      ],
      examples: [
        {
          title: "Individual landlord",
          scenario:
            "An individual earns UGX 500,000 a month (UGX 6,000,000 a year) from renting out two rooms.",
          lines: [
            { label: "Annual gross rent", calc: "500,000 × 12", amount: 6000000 },
            { label: "Less: tax-free amount", calc: "", amount: -2820000 },
            { label: "Chargeable rental income", calc: "", amount: 3180000 },
          ],
          total: { label: "Rental tax at 12%", amount: 381600, note: "3,180,000 × 12%" },
        },
        {
          title: "Company landlord with high expenses",
          scenario:
            "A company earns UGX 15,000,000 in rent for the year and spends UGX 11,000,000 on repairs, rates and management.",
          lines: [
            { label: "Gross rent", calc: "", amount: 15000000 },
            {
              label: "Less: expenses, capped at 50%",
              calc: "Actual 11,000,000; cap 7,500,000",
              amount: -7500000,
            },
            { label: "Chargeable rental income", calc: "", amount: 7500000 },
          ],
          total: { label: "Tax at 30%", amount: 2250000, note: "7,500,000 × 30%" },
        },
      ],
      special: [
        {
          title: "Jointly owned property",
          text: "Co-owners are generally taxed like partners: each is taxed on their share of the rent, and each individual gets their own UGX 2,820,000 tax-free amount.",
        },
        {
          title: "VAT on commercial rent",
          text: "A landlord registered for VAT charges 18% VAT on commercial rent. Residential rent is exempt from VAT.",
        },
        {
          title: "Excess expenses for companies",
          text: "Company expenses above the 50% cap are lost. They cannot be carried forward to a later year.",
        },
      ],
      penalties: [LATE_RETURN, LATE_PAYMENT, FALSE_STATEMENT],
      mistakes: [
        "Individuals deducting repairs, loan interest or agent fees. None are allowed for individuals.",
        "Applying the UGX 2,820,000 tax-free amount separately to each property instead of once against total rent.",
        "Companies claiming expenses above 50% of gross rent.",
        "Setting business losses off against rental income.",
        "Leaving out rent received in cash or from informal tenancies.",
      ],
      faqs: [
        {
          q: "I rent out one house for UGX 200,000 a month. Do I pay tax?",
          a: "No. That is UGX 2,400,000 a year, which is below the UGX 2,820,000 tax-free amount.",
        },
        {
          q: "Should I file monthly or annually?",
          a: "Monthly filing spreads the cost and avoids one large bill in December. The total tax for the year is the same either way.",
        },
        {
          q: "Does the tenant have to withhold tax?",
          a: "The main case is a non-resident landlord, where the tenant withholds 15% of gross rent. Tenants of resident individual landlords generally do not withhold; the landlord pays the rental tax.",
        },
      ],
      legal: [
        "Income Tax Act, Cap. 338 (rental income provisions)",
        "Income Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcInd, SRC.pwcDev, SRC.uraRental, SRC.pwcCard],
    },
    cta: {
      label: "Calculate rental tax with the Rental Income Tax Calculator",
      page: "rental",
      href: "/calculators/rental",
    },
  },

  // ====================================================================
  // 4. Corporate income tax
  // ====================================================================
  {
    slug: "corporate-income-tax",
    title: "Corporate Income Tax",
    short: "CIT",
    category: "Income tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: [
      "corporate",
      "company",
      "cit",
      "provisional",
      "losses",
      "capital allowances",
      "interest",
      "final return",
    ],
    summary:
      "Tax on the chargeable income of companies at 30%, paid through two provisional instalments and settled with a final annual return.",
    keyFacts: [
      { label: "Rate", value: "30%" },
      { label: "Provisional tax", value: "2 × 50% instalments" },
      { label: "Final return", value: "6 months after year end" },
      { label: "Losses", value: "7 years, then 50%" },
    ],
    sections: {
      whatItIs:
        "Corporate income tax is charged at 30% on a company’s chargeable income: gross income less the deductions allowed by the Income Tax Act. Resident companies are taxed on worldwide income; non-resident companies only on income from Uganda.",
      changes: {
        title: "What changed on 1 July 2026",
        points: [
          "The 30% rate is unchanged.",
          "For the interest deduction rules, a 'group' now means entities with at least 51% common underlying ownership, and dormant entities are excluded.",
          "Brought-forward losses are now excluded from tax EBITDA when working out how much interest is deductible.",
          "Microfinance deposit-taking and tier 4 institutions now qualify for the bad debt deduction.",
          "New income tax exemptions apply to qualifying ultra-luxury tourism developments.",
        ],
      },
      whoApplies: [
        "Every company, whether resident or non-resident, that earns chargeable income in Uganda.",
        "Small resident companies with turnover up to UGX 150 million are generally taxed under presumptive tax instead, unless they elect to be taxed at 30% of chargeable income.",
      ],
      rateTable: {
        caption: "Main capital allowance rates:",
        columns: ["Asset", "Allowance"],
        rows: [
          ["Plant and machinery, class 1", "40% reducing balance"],
          ["Plant and machinery, class 2", "30% reducing balance"],
          ["Plant and machinery, class 3 (includes farm works)", "20% reducing balance"],
          ["Other buildings", "5% straight line"],
          ["Horticultural plant or greenhouse", "20% straight line"],
          ["Start-up costs", "25% straight line"],
          ["Minor equipment under UGX 1,000,000", "100%"],
        ],
      },
      rates: [
        {
          name: "Standard rate",
          rate: "30%",
          note: "Resident and non-resident companies.",
        },
        {
          name: "Provisional estimate",
          rate: "90%",
          note: "Estimates below 90% of actual chargeable income attract a penalty.",
        },
      ],
      filing: [
        "The year of income runs 1 July to 30 June, unless URA has approved a substituted year.",
        "File a provisional return and pay 50% of the estimated tax by the end of month 6 of the year.",
        "Pay the second 50% by the end of month 12.",
        "File the final self-assessment return and pay any balance by the end of the sixth month after year end (31 December for a June year end).",
        "Withholding tax suffered and provisional tax paid are credited against the final liability.",
        "Keep records for at least five years. URA in practice reviews up to five years back.",
      ],
      examples: [
        {
          title: "Final return balance",
          scenario:
            "A company with a 30 June year end has gross income of UGX 1,200,000,000 and allowable deductions of UGX 800,000,000. It paid provisional tax of UGX 100,000,000 and suffered WHT of UGX 6,000,000.",
          lines: [
            { label: "Chargeable income", calc: "1,200m − 800m", amount: 400000000 },
            { label: "Tax at 30%", calc: "400,000,000 × 30%", amount: 120000000 },
            { label: "Less: provisional tax paid", calc: "", amount: -100000000 },
            { label: "Less: WHT credits", calc: "", amount: -6000000 },
          ],
          total: { label: "Balance due with final return", amount: 14000000, note: "Due by 31 December" },
        },
        {
          title: "Provisional tax underestimate",
          scenario:
            "The same company estimated chargeable income at UGX 300,000,000 for its provisional returns.",
          lines: [
            {
              label: "Tax on 90% of actual (360m × 30%)",
              calc: "360,000,000 × 30%",
              amount: 108000000,
            },
            {
              label: "Less: tax on the estimate (300m × 30%)",
              calc: "300,000,000 × 30%",
              amount: -90000000,
            },
            { label: "Shortfall", calc: "", amount: 18000000 },
          ],
          total: { label: "Penalty at 20%", amount: 3600000, note: "18,000,000 × 20%" },
        },
      ],
      special: [
        {
          title: "Carrying losses forward",
          text: "Tax losses can be carried forward for seven years. After that, only 50% of the remaining loss can be carried forward each year.",
        },
        {
          title: "Interest deduction limit",
          text: "Interest deductions for members of a group are limited by reference to tax EBITDA. From 1 July 2026, brought-forward losses are excluded from that calculation.",
        },
        {
          title: "Dividends",
          text: "Dividends to a resident company that controls 25% or more of the voting power are exempt from WHT. Other dividends attract 15% WHT, or 10% to an individual from a USE-listed company.",
        },
        {
          title: "Extensions",
          text: "If you expect to miss the final return deadline, apply to URA for an extension before the due date passes.",
        },
      ],
      penalties: [
        LATE_RETURN,
        LATE_PAYMENT,
        {
          item: "Provisional estimate below 90% of actual chargeable income",
          penalty:
            "20% of the difference between the tax on 90% of actual income and the tax on the estimate",
        },
        FALSE_STATEMENT,
        NO_RECORDS,
      ],
      mistakes: [
        "Underestimating provisional tax to protect cash flow, which triggers the 20% penalty.",
        "Not claiming WHT credits because the certificates were never collected from customers.",
        "Carrying forward losses older than seven years in full instead of at 50%.",
        "Deducting private, capital or non-business expenses.",
        "Missing the second provisional instalment at month 12.",
      ],
      faqs: [
        {
          q: "Our year end is 31 December. When is everything due?",
          a: "Provisional instalments are due by 30 June and 31 December. The final return for the year is due by 30 June of the following year.",
        },
        {
          q: "Are there lower rates for small companies?",
          a: "Not at 30%. Small resident companies with turnover up to UGX 150 million usually fall under presumptive tax instead.",
        },
        {
          q: "Can we pay in instalments if we cannot afford the balance?",
          a: "URA may agree a payment plan, but interest keeps running on the unpaid amount.",
        },
      ],
      legal: [
        "Income Tax Act, Cap. 338",
        "Income Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcCorp, SRC.pwcAdmin, SRC.pwcYearEnd, SRC.pwcDev, SRC.pwcCard],
    },
    cta: {
      label: "Calculate CIT with the Corporate Income Tax Calculator",
      page: "cit",
      href: "/calculators/cit",
    },
  },

  // ====================================================================
  // 5. Presumptive tax
  // ====================================================================
  {
    slug: "presumptive-tax",
    title: "Presumptive Tax",
    short: "Presumptive",
    category: "Small business",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["small business", "turnover", "presumptive", "sme", "records"],
    summary:
      "A simplified tax for small resident businesses with turnover up to UGX 150 million, based on turnover instead of profit.",
    keyFacts: [
      { label: "Turnover range", value: "UGX 10m – 150m" },
      { label: "Below UGX 10m", value: "Nil" },
      { label: "Top band (with records)", value: "360,000 + 0.7%" },
      { label: "Type of tax", value: "Final tax" },
    ],
    sections: {
      whatItIs:
        "Presumptive tax replaces profit-based income tax for small businesses. It is calculated on gross turnover, using either a fixed amount or a small percentage, depending on whether the business keeps proper records. It is a final tax: there are no deductions, no credits and no provisional tax.",
      changes: {
        title: "Status from 1 July 2026",
        points: [
          "No changes to presumptive tax were made in the 2026/27 amendments. The UGX 150 million turnover limit and the rates below still apply.",
          "Note the gap with VAT: the VAT threshold is now UGX 300 million, so a business can leave presumptive tax without having to register for VAT.",
        ],
      },
      whoApplies: [
        "Resident individuals and companies with annual business turnover up to UGX 150 million.",
        "It applies by default. A business can instead elect in writing, by the return due date, to be taxed on actual profit.",
        "Excluded: medical, dental, legal, accounting, engineering and architectural services, other professional services, public entertainment, public utilities and construction.",
      ],
      rateTable: {
        caption: "Annual tax by turnover (UGX):",
        columns: ["Annual turnover", "Without records", "With records"],
        rows: [
          ["Up to 10,000,000", "Nil", "Nil"],
          ["10,000,001 – 30,000,000", "80,000", "0.4% of turnover above 10m"],
          ["30,000,001 – 50,000,000", "200,000", "80,000 + 0.5% above 30m"],
          ["50,000,001 – 80,000,000", "400,000", "180,000 + 0.6% above 50m"],
          ["80,000,001 – 150,000,000", "900,000", "360,000 + 0.7% above 80m"],
        ],
      },
      rateNotes: [
        "\"With records\" means the business keeps books that support its turnover figure. Keeping records almost always gives a lower bill.",
      ],
      filing: [
        "Register with URA and get a TIN.",
        "Keep sales records, such as a sales book, receipts or EFRIS invoices, so you can use the lower \"with records\" rates.",
        "File the annual return and pay the tax within six months after the year of income ends (by 31 December for a year ending 30 June).",
        "Review your turnover each year. Once it exceeds UGX 150 million, you move to profit-based income tax.",
      ],
      examples: [
        {
          title: "Retail shop with UGX 40 million turnover",
          scenario:
            "A resident shop has annual turnover of UGX 40,000,000. Here is the tax with and without records.",
          lines: [
            { label: "Without records", calc: "Fixed amount", amount: 200000 },
            { label: "With records: fixed part", calc: "", amount: 80000 },
            { label: "With records: 0.5% above 30m", calc: "10,000,000 × 0.5%", amount: 50000 },
          ],
          total: { label: "Tax with records", amount: 130000, note: "Saves 70,000 a year" },
        },
        {
          title: "Trader with UGX 120 million turnover",
          scenario: "A wholesaler with records has annual turnover of UGX 120,000,000.",
          lines: [
            { label: "Fixed part", calc: "", amount: 360000 },
            { label: "0.7% above 80m", calc: "40,000,000 × 0.7%", amount: 280000 },
          ],
          total: { label: "Presumptive tax", amount: 640000, note: "900,000 without records" },
        },
      ],
      special: [
        {
          title: "Electing out",
          text: "A business with high costs and low margins may pay less under normal 30% income tax. You must elect in writing by the return due date.",
        },
        {
          title: "Crossing the limit mid-year",
          text: "If turnover grows past UGX 150 million, you leave presumptive tax and are taxed on profit. Start keeping full accounts early so the switch is painless.",
        },
        {
          title: "Other taxes still apply",
          text: "Presumptive tax covers business income only. Employees’ PAYE and rental income are taxed separately.",
        },
      ],
      penalties: [LATE_RETURN, LATE_PAYMENT, FALSE_STATEMENT],
      mistakes: [
        "Professionals such as accountants, lawyers and engineers using presumptive tax. They are excluded.",
        "Not keeping records and paying the higher fixed amount.",
        "Assuming the new UGX 300 million VAT threshold also raised the presumptive limit. It did not.",
        "Claiming WHT credits against presumptive tax. It is a final tax.",
      ],
      faqs: [
        {
          q: "My turnover is UGX 8 million. Do I file anything?",
          a: "You pay no presumptive tax below UGX 10 million. You should still register with URA and file your return.",
        },
        {
          q: "Is it better to keep records?",
          a: "In almost every band, yes. At UGX 40 million turnover, records cut the tax from UGX 200,000 to UGX 130,000.",
        },
        {
          q: "Can a company use presumptive tax?",
          a: "Yes, if it is resident, its turnover is up to UGX 150 million and its activity is not excluded.",
        },
      ],
      legal: [
        "Income Tax Act, Cap. 338 (presumptive tax provisions and schedule)",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcCorp, SRC.pwcDev, SRC.ura],
    },
    cta: {
      label: "Check which taxes apply with Know Your Taxes",
      page: "kyt",
      href: "/know-your-taxes",
    },
  },

  // ====================================================================
  // 6. Withholding tax
  // ====================================================================
  {
    slug: "withholding-tax",
    title: "Withholding Tax",
    short: "WHT",
    category: "Income tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: [
      "withholding",
      "wht",
      "suppliers",
      "dividends",
      "interest",
      "professional fees",
      "non-resident",
      "royalties",
      "betting",
      "designated agent",
    ],
    summary:
      "Tax deducted at source from specified payments, such as supplies, professional fees, dividends, interest and payments to non-residents, and paid to URA by the payer.",
    keyFacts: [
      { label: "Supplies over UGX 1m", value: "6%" },
      { label: "Dividends and interest", value: "15%" },
      { label: "Non-residents", value: "15% (most payments)" },
      { label: "Return and payment due", value: "15th of next month" },
    ],
    sections: {
      whatItIs:
        "With withholding tax, the person making a payment deducts tax from it and pays that tax to URA. For residents it is usually a credit against their final income tax. For non-residents and some specific payments it is the final tax.",
      changes: {
        title: "What changed on 1 July 2026 (Income Tax Amendment Act 2026)",
        points: [
          "Software is now included in the definition of royalties: 15% WHT for non-residents and 6% for residents who are not exempt.",
          "Interest paid by a resident company to a non-resident public financial institution now attracts 5% WHT. It was previously exempt.",
          "Payments to resident public entertainers attract 6% WHT, whether or not the payer is a designated agent.",
          "Gaming winnings join betting winnings at 15%.",
          "The 10% WHT on telecom commissions now covers all retail and mobile network services, not just airtime and mobile money.",
          "WHT on insurance agent and telecom commissions is now a final tax.",
        ],
      },
      whoApplies: [
        "Government, local governments and designated withholding agents must withhold 6% on payments to suppliers of goods and services above UGX 1 million.",
        "Any resident person must withhold on payments to non-residents, and on dividends, interest and other payments listed in the Act.",
        "Suppliers with a valid URA withholding exemption certificate are not subject to the 6%. The payer must see the certificate before paying.",
      ],
      rateTable: {
        caption: "Main WHT rates:",
        columns: ["Payment", "Resident", "Non-resident"],
        rows: [
          ["Goods and services over UGX 1m (by government or designated agent)", "6%", "—"],
          ["Management and professional fees", "6%", "15%"],
          ["Royalties, including software (from 1 July 2026)", "6%", "15%"],
          ["Dividends: general", "15%", "15%"],
          ["Dividends: USE-listed company to an individual", "10%", "15%"],
          ["Dividends: to a company with 25%+ voting control", "0%", "15%"],
          ["Interest: general", "15%", "15%"],
          ["Interest: government securities under 10 years", "20%", "20%"],
          ["Interest: government securities 10 years or more", "10%", "10%"],
          ["Interest to non-resident public financial institution (new)", "—", "5%"],
          ["Public entertainers and sports persons", "6% (new)", "15%"],
          ["Betting and gaming winnings", "15%", "15%"],
          ["Commissions: insurance, payment service, advertising agents", "10%", "10%"],
          ["Commissions: telecom retail, network and mobile money", "10% (final)", "—"],
          ["Rent", "—", "15%"],
          ["Imports of goods", "6%", "6%"],
          ["Purchase of a business or business asset", "6%", "6%"],
          ["Purchase of an asset from a non-resident", "—", "10%"],
          ["Transport of goods or passengers from Uganda", "—", "2%"],
        ],
      },
      rateNotes: [
        "Rates for non-residents may be reduced under a double taxation agreement, if the payee provides a valid certificate of residence.",
      ],
      filing: [
        "Withhold the tax when you make the payment, calculated on the VAT-exclusive amount.",
        "File the WHT return and pay the tax to URA by the 15th day of the following month.",
        "Give the payee a withholding tax certificate so they can claim the credit.",
        "Check and keep copies of any exemption certificates before paying a supplier without WHT. Certificates expire.",
      ],
      examples: [
        {
          title: "Paying a supplier as a designated agent",
          scenario: "You receive a supplier invoice for UGX 26,000,000, including 18% VAT.",
          lines: [
            { label: "Invoice total (VAT-inclusive)", calc: "", amount: 26000000 },
            { label: "VAT-exclusive value", calc: "26,000,000 ÷ 1.18", amount: 22033898 },
            { label: "WHT at 6%", calc: "22,033,898 × 6%", amount: 1322034 },
          ],
          total: { label: "Amount paid to supplier", amount: 24677966, note: "Remit 1,322,034 to URA" },
        },
        {
          title: "Consultancy fee to a non-resident",
          scenario:
            "A Ugandan company pays a Kenyan consultant UGX 10,000,000 in fees, with no treaty relief claimed.",
          lines: [
            { label: "Gross fee", calc: "", amount: 10000000 },
            { label: "WHT at 15%", calc: "10,000,000 × 15%", amount: 1500000 },
          ],
          total: { label: "Paid to the consultant", amount: 8500000, note: "WHT is final tax" },
        },
      ],
      special: [
        {
          title: "For the supplier: WHT is a credit, not a cost",
          text: "If a customer withholds UGX 120,000 from a UGX 2,000,000 invoice, you record the full UGX 2,000,000 as income and claim the UGX 120,000 as a credit in your income tax return. Collect the certificates.",
        },
        {
          title: "Failing to withhold",
          text: "A payer who should have withheld but did not is personally liable for the tax, plus penalties and interest.",
        },
        {
          title: "Exemption certificates",
          text: "URA issues WHT exemption certificates to suppliers with a good compliance record. If the payee has no valid certificate at the time of payment, withhold at the full rate.",
        },
      ],
      penalties: [
        LATE_RETURN,
        LATE_PAYMENT,
        {
          item: "Failing to withhold",
          penalty:
            "The payer becomes liable for the tax not withheld, plus penalties and interest",
        },
        FALSE_STATEMENT,
      ],
      mistakes: [
        "Calculating WHT on the VAT-inclusive amount instead of the VAT-exclusive amount.",
        "Not withholding on payments to non-residents because the work was done abroad.",
        "Paying a supplier without WHT on the strength of an expired exemption certificate.",
        "Suppliers expensing the WHT deducted instead of claiming it as a credit.",
        "Not applying the new 2026 categories: software royalties, resident entertainers and gaming winnings.",
      ],
      faqs: [
        {
          q: "We are not a designated agent. Do we still withhold?",
          a: "Not on routine local supplies. You still withhold on dividends, interest, payments to non-residents and the other specific payments in the table.",
        },
        {
          q: "Can WHT be refunded?",
          a: "WHT that is a credit reduces your final income tax. If credits exceed the tax due, the excess can be carried forward or claimed as a refund.",
        },
        {
          q: "Does WHT apply to payments under UGX 1 million?",
          a: "The 6% on supplies by designated agents applies only above UGX 1 million. Other WHT categories, such as professional fees, dividends and payments to non-residents, have no such threshold.",
        },
      ],
      legal: [
        "Income Tax Act, Cap. 338 (withholding tax provisions)",
        "Income Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act",
      ],
      sources: [SRC.pwcDev, SRC.pwcCard, SRC.pwcInd],
    },
    cta: {
      label: "Review WHT in Compliance Review",
      page: "compliance",
      href: "/compliance-review?type=wht",
    },
  },
];

export const findTaxGuide = (slug: string): TaxGuide | undefined => {
  return TAX_GUIDES.find((g) => g.slug === slug);
};

export const TAX_GUIDES_DATA = TAX_GUIDES;
