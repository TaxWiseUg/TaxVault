import { TaxCategory, TaxGuide } from "../types";

export const TAX_CATEGORIES: TaxCategory[] = [
  "All",
  "Indirect tax",
  "Income tax",
  "Employment",
  "Property",
  "Small business",
];

export const TAX_GUIDES_DATA: TaxGuide[] = [
  {
    slug: "vat",
    title: "Value Added Tax",
    short: "VAT",
    category: "Indirect tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["vat", "efris", "registration", "threshold", "input tax", "output tax", "indirect"],
    summary:
      "A consumption tax on most goods and services supplied in Uganda, charged by registered persons and filed monthly with URA via EFRIS.",
    keyFacts: [
      { label: "Standard rate", value: "18%" },
      { label: "Registration threshold", value: "UGX 300m / year" },
      { label: "Return due", value: "15th of next month" },
      { label: "Filing system", value: "Monthly · URA e-Services & EFRIS" },
    ],
    sections: {
      whatItIs:
        "Value Added Tax (VAT) is charged on taxable supplies of goods and services made by taxable persons in Uganda, on the import of taxable goods into Uganda, and on imported services (reverse charge) consumed in Uganda.",
      whoApplies: [
        "Registration is compulsory when annual taxable turnover exceeds UGX 300 million, or UGX 75 million in any three consecutive calendar months. (Note: This threshold took effect on 1 July 2026; previously it was UGX 150 million).",
        "Businesses below the threshold may apply for voluntary registration, subject to URA satisfaction and physical verification.",
        "Suppliers to government ministries, departments, and agencies, as well as designated withholding VAT agents, must operate with active VAT registration.",
      ],
      rates: [
        { name: "Standard Rate", rate: "18%", note: "Applies to most standard goods, manufacturing, trading, and commercial services." },
        { name: "Zero-Rated (0%)", rate: "0%", note: "Exports of goods and services, international transport, drugs and medicines. Input VAT is recoverable." },
        { name: "Exempt", rate: "—", note: "Financial services, unprocessed agricultural produce, passenger transport. No VAT charged and no input VAT recovery." },
      ],
      filing: [
        "Every registered business must file a monthly VAT return by the 15th day of the following month.",
        "Generate a Payment Registration Number (PRN) on URA e-Services and remit any net tax payable on or before the 15th.",
        "Fiscalize all sales receipts and commercial invoices through EFRIS in real time; buyers cannot claim input VAT without a valid e-invoice.",
        "If input tax exceeds output tax in a tax period, the excess is carried forward as an input tax credit or refunded under statutory refund conditions.",
      ],
      example: {
        scenario:
          "In March, a registered distributor makes standard sales of UGX 50,000,000 and purchases verified business inventory and utilities of UGX 30,000,000 (both figures net of VAT).",
        lines: [
          { label: "Output VAT on sales", calc: "UGX 50,000,000 × 18%", amount: 9000000 },
          { label: "Less: input VAT on purchases", calc: "UGX 30,000,000 × 18%", amount: -5400000 },
        ],
        total: { label: "Net VAT payable to URA", amount: 3600000, note: "Due by 15 April via URA e-Services PRN" },
      },
      mistakes: [
        "Applying the outdated UGX 150m threshold instead of the revised statutory UGX 300m threshold.",
        "Claiming input tax on purchases and capital assets used in the production of VAT-exempt supplies.",
        "Claiming input VAT credits on commercial invoices that were not validated and transmitted through EFRIS.",
        "Omitting the reverse-charge VAT computation on imported management, legal, IT, or consultancy services.",
      ],
      legal: [
        "Value Added Tax Act, Cap. 349 (as revised)",
        "Value Added Tax (Amendment) Act, 2026",
        "Tax Procedures Code Act, 2014 (EFRIS Penalties & Filing Rules)",
      ],
    },
    cta: {
      label: "Review a VAT return in Compliance Checker",
      page: "compliance",
    },
  },
  {
    slug: "paye",
    title: "Pay As You Earn",
    short: "PAYE",
    category: "Employment",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["paye", "salary", "payroll", "nssf", "employment", "resident", "super tax"],
    summary:
      "A statutory withholding tax that employers deduct from employees’ employment income and remit monthly to the Uganda Revenue Authority.",
    keyFacts: [
      { label: "Resident brackets", value: "0% to 40%" },
      { label: "Monthly threshold", value: "UGX 235,000 / month" },
      { label: "Return due", value: "15th of next month" },
      { label: "NSSF linkage", value: "5% employee + 10% employer" },
    ],
    sections: {
      whatItIs:
        "Pay As You Earn (PAYE) is a statutory withholding system where employers are legally mandated to deduct income tax from gross employment earnings (including basic wages, allowances, director fees, overtime, and non-cash taxable fringe benefits) and remit it to URA.",
      whoApplies: [
        "Every employer operating in Uganda with employees earning in excess of UGX 235,000 per month (or UGX 2,820,000 per annum).",
        "Applies to full-time, part-time, temporary, expatriate, and casual staff, as well as resident and non-resident directors receiving remuneration.",
        "Non-resident employees are taxed at flat progressive statutory non-resident rates (15% for the first tier, with 40% on earnings over UGX 10,000,000).",
      ],
      rates: [
        { name: "Tier 1: Up to UGX 235,000", rate: "0%", note: "Exempt threshold (NIL tax)." },
        { name: "Tier 2: UGX 235,001 – 335,000", rate: "10%", note: "10% of amount exceeding UGX 235,000." },
        { name: "Tier 3: UGX 335,001 – 410,000", rate: "20%", note: "UGX 10,000 + 20% of amount exceeding UGX 335,000." },
        { name: "Tier 4: UGX 410,001 – 10,000,000", rate: "30%", note: "UGX 25,000 + 30% of amount exceeding UGX 410,000." },
        { name: "Tier 5: Over UGX 10,000,000", rate: "40%", note: "Top super-tax rate: UGX 2,902,000 + 40% of amount exceeding UGX 10,000,000." },
      ],
      filing: [
        "Deduct PAYE from all payroll runs at the time of payment.",
        "File the electronic PAYE monthly return on URA e-Services by the 15th day of the month following payroll deduction.",
        "File NIL returns if no payroll was disbursed to avoid automatic late-filing penalties under the Tax Procedures Code Act.",
        "Remit mandatory 15% NSSF contributions (5% employee deduction + 10% employer contribution) simultaneously to the National Social Security Fund.",
      ],
      example: {
        scenario:
          "A resident employee in Kampala receives a gross monthly salary of UGX 4,500,000 with statutory 5% NSSF employee deduction.",
        lines: [
          { label: "Gross monthly salary", calc: "Contractual salary", amount: 4500000 },
          { label: "Less: Employee NSSF (5%)", calc: "UGX 4,500,000 × 5%", amount: -225000 },
          { label: "Chargeable employment income", calc: "UGX 4,500,000 - UGX 225,000", amount: 4275000 },
          { label: "Tier 1 (Up to UGX 235,000)", calc: "UGX 235,000 @ 0%", amount: 0 },
          { label: "Tier 2 (UGX 235,000 – 335,000)", calc: "UGX 100,000 @ 10%", amount: 10000 },
          { label: "Tier 3 (UGX 335,000 – 410,000)", calc: "UGX 75,000 @ 20%", amount: 15000 },
          { label: "Tier 4 (Excess over UGX 410,000)", calc: "(4,275,000 - 410,000) × 30%", amount: 1159500 },
        ],
        total: { label: "Total PAYE deducted & remitted", amount: 1184500, note: "Employee net take-home salary is UGX 3,090,500" },
      },
      mistakes: [
        "Treating taxable allowances (housing, fuel, airtime, school fees) as tax-free reimbursements without formal statutory receipts.",
        "Failing to remit PAYE on sitting allowances and compensation paid to resident or non-resident board members.",
        "Applying resident tax rate tables to non-resident expatriate staff members.",
        "Neglecting to file a NIL return during months where zero payroll was disbursed.",
      ],
      legal: [
        "Income Tax Act, Cap. 340 (Part IX, Sections 116–118)",
        "Income Tax Act Third Schedule (Rate of Income Tax for Individuals)",
        "Tax Procedures Code Act, 2014",
      ],
    },
    cta: {
      label: "Compute live payroll in Tax Calculators",
      page: "calculators",
    },
  },
  {
    slug: "rental-income-tax",
    title: "Rental Income Tax",
    short: "Rental",
    category: "Property",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["rental", "landlord", "property", "individual", "company", "provisional"],
    summary:
      "A distinct tax on income derived from leasing or renting out land, commercial premises, and residential buildings in Uganda.",
    keyFacts: [
      { label: "Individual rate", value: "12% of gross (> UGX 2.82m)" },
      { label: "Corporate rate", value: "30% on net chargeable rent" },
      { label: "Annual threshold", value: "UGX 2,820,000 (Individuals)" },
      { label: "Filing frequency", value: "Quarterly provisional + Annual" },
    ],
    sections: {
      whatItIs:
        "Rental Income Tax is assessed on the income derived by any person (individual, partnership, company, or trust) from the leasing of immovable property, including land, residential housing, warehouses, shopping malls, and office suites in Uganda.",
      whoApplies: [
        "Individuals earning gross rental income exceeding UGX 2,820,000 in a year of income are subject to a flat 12% final tax on gross receipts.",
        "Companies, incorporated entities, and trusts earning rental income are taxed at 30% on net chargeable rental income (gross rent minus allowable deductions).",
        "Property managers and designated institutional withholding agents who lease properties must also verify landlord TINs.",
      ],
      rates: [
        { name: "Resident Individual", rate: "12%", note: "12% flat rate on gross rent exceeding the statutory threshold of UGX 2,820,000. No expense deductions allowed." },
        { name: "Non-Resident Individual", rate: "15%", note: "15% flat rate on gross rental income derived from Ugandan real estate." },
        { name: "Companies & Entities", rate: "30%", note: "30% on net chargeable rental income (statutory deductions and depreciation applicable under separate accounting)." },
      ],
      filing: [
        "Rental income must be accounted for completely separately from other business or employment income (ring-fencing rule).",
        "File quarterly provisional rental income tax returns with URA by the end of each quarter.",
        "File an annual final rental tax return within 6 months following the end of the year of income (by 31 December for June year-end taxpayers).",
        "Landlords must issue electronic tenancy invoices or rent receipts and provide property identification numbers.",
      ],
      example: {
        scenario:
          "An individual landlord owns a residential apartment block in Ntinda earning gross rental income of UGX 36,000,000 for the financial year.",
        lines: [
          { label: "Gross annual rental receipts", calc: "12 months × UGX 3,000,000", amount: 36000000 },
          { label: "Less: Statutory tax-free threshold", calc: "Statutory threshold under Cap. 340", amount: -2820000 },
          { label: "Taxable rental income", calc: "UGX 36,000,000 - UGX 2,820,000", amount: 33180000 },
          { label: "Individual rental tax @ 12%", calc: "UGX 33,180,000 × 12%", amount: 3981600 },
        ],
        total: { label: "Total Annual Rental Tax", amount: 3981600, note: "Paid across quarterly provisional installments and reconciled on the annual return" },
      },
      mistakes: [
        "Attempting to deduct repairs, mortgage interest, or agent fees against individual gross rental income (individual tax is strictly on gross).",
        "Mixing rental losses with commercial trading business profits; rental operations are strictly ring-fenced under Section 5.",
        "Failing to declare all properties owned across Uganda under a single consolidated individual or entity TIN.",
        "Not filing quarterly provisional returns, triggering automatic late estimation interest penalties under the Tax Procedures Code.",
      ],
      legal: [
        "Income Tax Act, Cap. 340, Section 5 (Rental Income Tax)",
        "Income Tax (Amendment) Act, 2022 & 2023",
        "Tax Procedures Code Act, 2014",
      ],
    },
    cta: {
      label: "Evaluate rental obligations in Know Your Taxes",
      page: "know-your-taxes",
    },
  },
  {
    slug: "corporate-income-tax",
    title: "Corporate Income Tax",
    short: "CIT",
    category: "Income tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["corporate", "company", "cit", "provisional", "audited", "interest capping", "losses"],
    summary:
      "Annual tax assessed on the chargeable profits of registered companies, branches, and incorporated bodies operating in Uganda.",
    keyFacts: [
      { label: "Standard rate", value: "30%" },
      { label: "Provisional filing", value: "2 installments (6m & 12m)" },
      { label: "Final return due", value: "6 months after year-end" },
      { label: "Loss carry-forward", value: "Subject to Section 38 rules" },
    ],
    sections: {
      whatItIs:
        "Corporate Income Tax (CIT) is levied on the chargeable income (gross assessable revenue less allowable deductions wholly and exclusively incurred in the production of income) of companies, corporate partnerships, trusts, and local permanent establishments of foreign entities.",
      whoApplies: [
        "All registered private and public companies incorporated in Uganda, irrespective of whether they generated a profit or loss.",
        "Foreign companies operating in Uganda through a permanent establishment (branch).",
        "Businesses whose turnover exceeds UGX 150 million and are therefore excluded from the small business presumptive tax regime.",
      ],
      rates: [
        { name: "Standard Companies", rate: "30%", note: "Applies to chargeable income of resident and non-resident companies." },
        { name: "Mining & Petroleum", rate: "Variable", note: "Subject to specialized formula under Ninth Schedule (typically 30%–45%)." },
        { name: "Repatriated Branch Profits", rate: "15%", note: "Additional tax on after-tax profits repatriated by a non-resident branch." },
      ],
      filing: [
        "Provisional tax estimate: Submit an estimated provisional return within 6 months of the tax year start, paying the first installment.",
        "Second provisional installment: Pay remaining estimated tax by the end of the 12th month of the financial year.",
        "Final annual return: File the comprehensive return accompanied by audited financial statements within 6 months post-year-end.",
        "Transfer pricing documentation is mandatory for transactions with related nonresident parties exceeding statutory limits.",
      ],
      example: {
        scenario:
          "A manufacturing company records gross accounting net profit before tax of UGX 120,000,000 for the financial year ending 30 June.",
        lines: [
          { label: "Accounting profit before tax", calc: "From Audited Income Statement", amount: 120000000 },
          { label: "Add: Non-deductible entertainment & penalties", calc: "Incurred fines and client entertainment", amount: 15000000 },
          { label: "Add: Accounting book depreciation", calc: "Added back for tax adjustments", amount: 20000000 },
          { label: "Less: URA tax wear & tear allowances", calc: "Capital allowances under Section 27", amount: -35000000 },
          { label: "Adjusted taxable income", calc: "Chargeable income for the year", amount: 120000000 },
          { label: "Gross CIT payable @ 30%", calc: "UGX 120,000,000 × 30%", amount: 36000000 },
          { label: "Less: Provisional CIT installments paid", calc: "Two installments paid during the year", amount: -20000000 },
          { label: "Less: WHT credits suffered", calc: "Withholding tax credits on client payments", amount: -4000000 },
        ],
        total: { label: "Net CIT payable on Final Return", amount: 12000000, note: "Due by 31 December with signed audited accounts" },
      },
      mistakes: [
        "Failing to add back disallowable expenses such as non-commercial fines, staff entertainment, and general provisions.",
        "Breaching the 30% tax EBITDA interest deduction limitation on loans from non-financial institutions.",
        "Missing the 6-month statutory deadline for submitting the final return and certified audited financials.",
        "Underestimating provisional income by more than 10%, triggering mandatory penal interest under Section 66.",
      ],
      legal: [
        "Income Tax Act, Cap. 340, Part II & Section 4",
        "Income Tax (Transfer Pricing) Regulations",
        "Tax Procedures Code Act, 2014",
      ],
    },
    cta: {
      label: "Model corporate tax liabilities in Calculators",
      page: "calculators",
    },
  },
  {
    slug: "presumptive-tax",
    title: "Presumptive Tax",
    short: "Presumptive",
    category: "Small business",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["small business", "turnover", "presumptive", "micro", "traders", "simplified"],
    summary:
      "A simplified turnover-based tax system designed for small and micro businesses with annual turnover between UGX 10 million and 150 million.",
    keyFacts: [
      { label: "Turnover range", value: "UGX 10m to UGX 150m" },
      { label: "Bookkeeping", value: "Reduced / simplified records" },
      { label: "Exclusions", value: "Professionals & public bodies" },
      { label: "Return type", value: "Single annual turnover return" },
    ],
    sections: {
      whatItIs:
        "Presumptive Tax is a simplified tax regime established under Section 4(5) and the Second Schedule of the Income Tax Act. It levies a predictable lump-sum or turnover percentage tax on qualifying resident small businesses, relieving them of complex bookkeeping and audited financial reporting.",
      whoApplies: [
        "Resident individual sole proprietors and small unincorporated partnerships whose gross annual business turnover is between UGX 10,000,000 and UGX 150,000,000.",
        "Exclusions: Professionals (lawyers, doctors, certified accountants, architects, tax consultants, engineers) cannot use presumptive tax.",
        "Exclusions: Incorporated limited liability companies, public enterprises, and businesses with turnover above UGX 150 million are excluded.",
      ],
      rates: [
        { name: "UGX 10m – 30m (Without Records)", rate: "UGX 80,000 – 250,000", note: "Fixed lump sum based on location (Kampala City vs rest of Uganda)." },
        { name: "UGX 10m – 30m (With Records)", rate: "0.4% – 0.5%", note: "Calculated directly on verified turnover." },
        { name: "UGX 30m – 50m (With Records)", rate: "UGX 200,000 + 0.6%", note: "UGX 200,000 plus 0.6% of turnover exceeding UGX 30m." },
        { name: "UGX 50m – 80m (With Records)", rate: "UGX 320,000 + 0.65%", note: "UGX 320,000 plus 0.65% of turnover exceeding UGX 50m." },
        { name: "UGX 80m – 150m (With Records)", rate: "UGX 515,000 + 0.7%", note: "UGX 515,000 plus 0.7% of turnover exceeding UGX 80m." },
      ],
      filing: [
        "Maintain a daily cash book or simple ledger tracking sales receipts and inventory purchases.",
        "File the single annual Presumptive Tax return on URA e-Services by the end of the year of income.",
        "Pay the calculated tax via PRN before the filing deadline to avoid standard late payment interest.",
        "Transition to Corporate or Individual Income Tax once annual gross sales cross the UGX 150 million statutory threshold.",
      ],
      example: {
        scenario:
          "A retail grocery shop owner in Mukono maintains elementary sales receipts and achieves an annual gross turnover of UGX 45,000,000.",
        lines: [
          { label: "Annual gross turnover", calc: "Daily sales register total", amount: 45000000 },
          { label: "Statutory bracket", calc: "UGX 30,000,000 to UGX 50,000,000 band", amount: 0 },
          { label: "Base fixed tax for band", calc: "Fixed statutory base", amount: 200000 },
          { label: "Percentage tax on excess", calc: "(UGX 45,000,000 - 30,000,000) × 0.6%", amount: 90000 },
        ],
        total: { label: "Total Presumptive Tax Due", amount: 290000, note: "Paid once annually without need for certified balance sheet or audit" },
      },
      mistakes: [
        "Ineligible professional practitioners (e.g. clinics, law chambers, consultancy bureaus) attempting to file under presumptive rules.",
        "Attempting to claim business expenses, rental expenses, or cost of goods sold against presumptive rates (the rate is strictly on turnover).",
        "Remaining on presumptive tax after annual sales exceed UGX 150,000,000.",
        "Failing to maintain basic cash books to qualify for the more favorable 'with records' statutory rates.",
      ],
      legal: [
        "Income Tax Act, Cap. 340, Section 4(5)",
        "Income Tax Act, Second Schedule (Presumptive Tax Rates)",
        "Tax Procedures Code Act, 2014",
      ],
    },
    cta: {
      label: "Assess business eligibility in Know Your Taxes",
      page: "know-your-taxes",
    },
  },
  {
    slug: "withholding-tax",
    title: "Withholding Tax",
    short: "WHT",
    category: "Income tax",
    status: "published",
    lastReviewed: "2026-10-30",
    tags: ["withholding", "wht", "suppliers", "dividends", "interest", "professional fees", "deduction"],
    summary:
      "A statutory advance tax deducted at source by designated withholding agents from payments for goods, services, and investment returns.",
    keyFacts: [
      { label: "Local supplies rate", value: "6% on goods & services" },
      { label: "Professional services", value: "15% (Management / Legal)" },
      { label: "Remittance deadline", value: "15th of following month" },
      { label: "Agent status", value: "Designated by URA Gazette" },
    ],
    sections: {
      whatItIs:
        "Withholding Tax (WHT) is a collection mechanism where the payer (designated agent) is legally mandated to deduct a specific percentage from payments due to a payee (contractor, supplier, investor, professional) and remit the deducted amount directly to the URA.",
      whoApplies: [
        "Government ministries, local councils, state authorities, and designated private corporations gazetted by the URA as Withholding Agents.",
        "Any entity paying dividends, interest, natural resource royalties, or professional fees to resident or non-resident persons.",
        "Payees who suffer WHT receive a statutory WHT credit certificate which can be credited against their final annual income tax liability.",
      ],
      rates: [
        { name: "Local Supplies (Goods & Services)", rate: "6%", note: "Deducted by designated agents on payments exceeding UGX 1,000,000." },
        { name: "Professional & Management Fees", rate: "15%", note: "Consultancy, legal, accounting, audit, engineering, and architectural services." },
        { name: "Dividends & Interest", rate: "15%", note: "Resident dividend distribution (listed companies on USE enjoy reduced 10% rate)." },
        { name: "Import Withholding Tax", rate: "6%", note: "Assessed at customs on commercial imports by taxpayers without WHT exemption." },
        { name: "Non-Resident Payments", rate: "15%", note: "Unless modified by an applicable Double Taxation Agreement (DTA)." },
      ],
      filing: [
        "Deduct the applicable WHT percentage from the gross invoiced amount (excluding VAT).",
        "Generate a WHT PRN and remit the funds to URA by the 15th day of the month following deduction.",
        "Generate and issue an official URA electronic WHT certificate to the payee via the URA e-Services portal.",
        "Payees must capture the certificate number in their annual CIT or Individual return to claim the tax credit.",
      ],
      example: {
        scenario:
          "A designated corporate agent hires a software engineering consultancy firm to build a system for UGX 20,000,000 (VAT exclusive).",
        lines: [
          { label: "Gross consultancy fee (excl. VAT)", calc: "Agreed professional fee", amount: 20000000 },
          { label: "Withholding Tax deduction @ 15%", calc: "UGX 20,000,000 × 15%", amount: -3000000 },
          { label: "Net cash disbursement to consultant", calc: "UGX 20,000,000 - UGX 3,000,000", amount: 17000000 },
          { label: "WHT remitted to URA by Agent", calc: "Due by 15th of following month", amount: 3000000 },
        ],
        total: { label: "WHT Credit for Payee", amount: 3000000, note: "Consultant offsets this UGX 3,000,000 against their final Corporate Income Tax return" },
      },
      mistakes: [
        "Calculating Withholding Tax on the VAT-inclusive total rather than the net taxable supply figure.",
        "Deducting 6% WHT from suppliers who hold an active, valid URA WHT Exemption Certificate.",
        "Failing to issue statutory WHT credit certificates promptly to payees, preventing them from claiming their rightful tax credits.",
        "Missing the monthly 15th remittance deadline, triggering 2% compound monthly penal interest under Section 65 of the TPCA.",
      ],
      legal: [
        "Income Tax Act, Cap. 340, Part VIII (Sections 116–128)",
        "Tax Procedures Code Act, 2014, Section 50 & 65",
        "URA Annual Withholding Tax Agent Gazette",
      ],
    },
    cta: {
      label: "Calculate WHT deductions in Tax Calculators",
      page: "calculators",
    },
  },
];

export const findTaxGuide = (slug: string): TaxGuide | undefined => {
  return TAX_GUIDES_DATA.find((g) => g.slug === slug);
};

export const KYT_TO_GUIDE_MAP: Record<string, string> = {
  vat: "vat",
  rental: "rental-income-tax",
  paye: "paye",
  cit: "corporate-income-tax",
  presumptive: "presumptive-tax",
  wht: "withholding-tax",
};
