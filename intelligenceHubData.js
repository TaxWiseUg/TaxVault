// intelligenceHubData.js
// TaxWise Uganda — Intelligence Hub content (Uganda), last reviewed 2026-11-02.
// Pure data: no framework dependency. Render with IntelligenceHub.jsx or your own UI.
//
// Block types used in `body`:
//   { type: "h", text }                         sub-heading inside an article
//   { type: "p", text }                         paragraph
//   { type: "list", ordered?, items: [] }       bullet / numbered list
//   { type: "checklist", items: [] }            tick-box list
//   { type: "table", headers: [], rows: [[]] }  table
//   { type: "callout", tone: "action"|"warn"|"info", text }
// `flags` on an article: "verify" (single secondary source) or "sources-differ".

export const HUB_META = {
  lastReviewed: "2026-11-02",
  jurisdiction: "Uganda",
  disclaimer:
    "General information only, not legal or tax advice. Check the gazetted Act and the full judgment before relying on any figure or holding.",
  citationNote:
    "Uganda's Revised Edition of the Laws (2023) renumbered the tax Acts and many sections. Cite the revised chapters; older sources use the old ones.",
  statutes: {
    headers: ["Act", "Revised (current)", "Old citation"],
    rows: [
      ["Income Tax Act", "Cap. 338", "Cap. 340"],
      ["Value Added Tax Act", "Cap. 344", "Cap. 349"],
      ["Tax Procedures Code Act", "Cap. 343", "Act 14 of 2014"],
      ["Tax Appeals Tribunal Act", "Cap. 341", "Cap. 345"],
      ["Excise Duty Act", "Cap. 336", "Act 11 of 2014"],
      ["Stamp Duty Act", "Cap. 339", "Act 12 of 2014"],
    ],
  },
};

// ---------------------------------------------------------------------------
// Shared sources (referenced by key from articles)
// ---------------------------------------------------------------------------
export const SOURCES = {
  eyActs2026: { label: "EY — Uganda issues Tax Amendment Acts for 2026 (11 Jun 2026)", url: "https://www.ey.com/en_gl/technical/tax-alerts/uganda-issues-tax-amendment-acts-for-2026" },
  eyVeto: { label: "EY — President returns two 2026 tax bills (22 Jul 2026)", url: "https://globaltaxnews.ey.com/news/2026-1575" },
  eyEricsson: { label: "EY — Ericsson AB v URA (10 Jul 2026)", url: "https://taxnews.ey.com/news/2026-1467" },
  onyango: { label: "Onyango & Co. — Inside Uganda's 2026 Tax Amendment Acts", url: "https://onyangoadvocates.com/assets/PDF/INSIDE%20UGANDA%E2%80%99S%202026%20TAX%20AMENDMENT%20ACTS%20130526.pdf" },
  parlVeto: { label: "Parliament — President returns two tax Bills (14 Jul 2026)", url: "https://fin.parliament.go.ug/news/4488/president-museveni-returns-two-tax-bills-parliament" },
  parlAdopt: { label: "Parliament — Parliament backs President on plastics, casino levy (4 Aug 2026)", url: "https://kob.parliament.go.ug/news/4526/parliament-backs-president-plastics-tax-casino-levy" },
  accountsOsPaye: { label: "accounts-os — PAYE (Uganda), assent date", url: "https://accounts-os.com/ug/glossary/paye-uganda.md" },
  uraWhtWindow: { label: "URA notice — WHT exemption applications Jul–Dec 2026", url: "https://ground.news/article/withholding-tax-exemption-applications-for-the-period-july-to-december-2026-uganda-revenue-authority" },
  uraObjections: { label: "URA — Objections and appeals", url: "https://ura.go.ug/en/domestic-taxes/objection-appeals/" },
  uraWaiver: { label: "URA — Waiver of interest and penalty outstanding at 30 June 2024", url: "https://ura.go.ug/en/waiver-of-interest-and-penalty-outstanding-as-at-30th-june-2024/" },
  regfollower: { label: "RegFollower — URA guidance on FY 2026/27 amendments (23 Jun 2026)", url: "https://regfollower.com/uganda-publishes-guidance-on-2026-27-tax-amendments/" },
  pwcMunyanga: { label: "PwC — Munyanga 90-day rule alert", url: "https://www.pwc.com/ug/en/assets/pdf/tax-alert-90-day-rule-for-ura-objection-decisions.pdf" },
  pwcGroup: { label: "PwC Tax Summaries — Uganda group taxation", url: "https://taxsummaries.pwc.com/uganda/corporate/group-taxation" },
  ensDeposit: { label: "ENS via Legal 500 — 30% deposit rule (Jaala Higenyi)", url: "https://www.legal500.com/intelligence/uganda/tax/no-cash-no-problem-high-court-redefines-ugandas-30-tax-deposit-rule" },
  mondaqFuelex: { label: "Mondaq — Fuelex and the 30% rule", url: "https://www.mondaq.com/southafrica/constitutional-administrative-law/975376/a-pyrrhic-victory-the-constitutional-court-attempt-to-limit-the-30-deposit-rule-for-tax-appeal-tribunal-matters" },
  scUgandaProjects: { label: "Supreme Court — Uganda Projects Implementation & Management Centre v URA", url: "https://old.ulii.org/ug/judgment/supreme-court/2010/17" },
  croweDeposit: { label: "Crowe Uganda — 30% payment mandate", url: "https://www.crowe.com/ug/news/30-percent-payment-mandate" },
  btAfricaGlobal: { label: "Business Times — Africa Global Logistics v URA", url: "https://businesstimesug.com/time-waits-for-no-taxpayer-africa-global-logistics-loses-battle-at-tat/" },
  btEastAfricanInv: { label: "Business Times — East African Investments v URA", url: "https://businesstimesug.com/when-ura-keeps-your-money-it-pays-east-african-investments-wins-big/" },
  realMuloodi: { label: "Real Muloodi — 2023 TPC objection evidence limits", url: "https://realmuloodi.co.ug/?p=22788" },
  essentialAuto: { label: "ULII — Essential Auto Parts v URA, TAT App. 180 of 2022", url: "https://ulii.org/akn/ug/judgment/ugtat/2023/3/eng@2023-02-20/source" },
  gameDiscount: { label: "Business Focus — Game Discount World v URA", url: "https://businessfocus.co.ug/?p=46296" },
  gleAppealGuide: { label: "Global Law Experts — Tax appeal vs negotiation", url: "https://globallawexperts.com/?p=1517117" },
  uliiTat: { label: "ULII — Tax Appeals Tribunal judgments", url: "https://ulii.org/judgments/UGTAT/2025/" },
  uliiTatAll: { label: "ULII — Tax Appeals Tribunal judgments (all)", url: "https://ulii.org/en/judgments/UGTAT/" },
  monitorMedisell: { label: "Daily Monitor — Medisell v URA", url: "https://www.monitor.co.ug/uganda/business/finance/ura-loses-over-shs1-billion-in-medisell-tax-dispute-5580488" },
  monitorKuku: { label: "Daily Monitor — Kuku Foods v URA", url: "https://www.monitor.co.ug/uganda/business/markets/the-kfc-ura-shs4-2b-tax-fight-5506310" },
  monitorMiniBakeries: { label: "Daily Monitor — Supa Loaf maker loses Shs2b dispute", url: "https://www.monitor.co.ug/uganda/business/markets/supa-loaf-maker-loses-shs2b-tax-dispute--5585534" },
  monitorTP: { label: "Daily Monitor — Tightening the grip on transfer pricing", url: "https://www.monitor.co.ug/uganda/oped/commentary/tightening-the-grip-on-transfer-pricing-5476160" },
  eastAfrican: { label: "The EastAfrican — Firms flooding the TAT", url: "https://theeastafrican.co.ke/tea/news/southern-africa/why-uganda-firms-are-flooding-the-tax-appeals-tribunal-5377436" },
  ugandanzCanaan: { label: "Ugandanz — URA refunds Canaan Sites UGX 2.4bn", url: "https://ugandanz.com/ura-refunds-canaan-sites-shs2-4-billion-over-vat-charged-on-unimproved-land/amp/" },
  tpMiniBakeries: { label: "tpcases — Mini Bakeries v URA", url: "https://tpcases.com/uganda-vs-mini-bakeries-uganda-limited-august-2026-tax-appeals-tribunal-case-no/" },
  tpATC: { label: "tpcases — ATC Uganda v URA", url: "https://tpcases.com/uganda-vs-atc-uganda-limited-march-2026-court-of-appeal-case-no-220-of-2022/" },
  tpRwenzori: { label: "tpcases — Rwenzori Commodities v URA", url: "https://tpcases.com/uganda-vs-rwenzori-commodities-ltd-july-2025-tax-appeals-tribunal-application-no-36-of-2024/" },
  tpSMEC: { label: "tpcases — SMEC International v URA", url: "https://tpcases.com/uganda-vs-smec-international-ltd-november-2024-tax-appeals-tribunal-application-no-75-of-2019/" },
  tpAllied: { label: "tpcases — Allied Beverage Company v URA", url: "https://tpcases.com/uganda-vs-allied-beverage-company-ltd-september-2024-high-court-case-no-0039-of-2022/" },
  tpBondo: { label: "tpcases — Bondo Tea Estates v URA", url: "https://tpcases.com/tag/average-market-price/" },
  tpEABL: { label: "tpcases — East African Breweries International v URA", url: "https://tpcases.com/?p=179947" },
  bfEABL: { label: "Business Focus — EABL International ordered to pay UGX 9.78bn", url: "https://businessfocus.co.ug/?p=36920" },
  tpProfile: { label: "tpcases — Uganda country profile", url: "https://tpcases.com/pop-pages/uganda/" },
  mmaksTP: { label: "MMAKS — Legal 500 Uganda Transfer Pricing guide 2026", url: "https://mmaks.co.ug/sites/default/files/article-attachments/Legal%20500%20-%20Uganda%20Transfer%20Pricing%20Comparative%20Guide.pdf" },
  ibfdRegs: { label: "IBFD — Transfer Pricing Regulations effective 1 July 2011", url: "https://us.ibfd.org/shop/journal/transfer-pricing-regulations-effective-1-july-2011" },
  gazette2012: { label: "Uganda Gazette, 1 June 2012 — TP documentation practice note", url: "https://archive.gazettes.africa/archive/ug/2012/ug-government-gazette-dated-2012-06-01-no-30.pdf" },
  vatupdateMB: { label: "VATupdate — Mini Bakeries VAT/WHT lessons", url: "https://www.vatupdate.com/?p=368920" },
  // Added in the November 2026 expansion
  ensInterest: { label: "ENS via Mondaq — Uganda's tax interest regime under scrutiny (Jul 2026)", url: "https://www.mondaq.com/tax-authorities/1801176/ugandas-tax-interest-regime-under-scrutiny-recent-judicial-developments-and-implications-for-taxpayers-and-investors" },
  ensCentury: { label: "ENS — Century Bottling: Commissioner General's discretion", url: "https://www.ensafrica.com/news/detail/3056/tat-ruling-commissioner-generals-discretion-m" },
  pwcTreaties: { label: "PwC Tax Summaries — Uganda foreign tax relief and treaties", url: "https://taxsummaries.pwc.com/uganda/individual/foreign-tax-relief-and-tax-treaties" },
  eaMauritius: { label: "The EastAfrican — Uganda, Mauritius new treaty deal", url: "https://www.theeastafrican.co.ke/tea/business/uganda-mauritius-reach-new-deal-on-double-taxation-4282030" },
  monitorAfricaOil: { label: "Daily Monitor — Africa Oil and the interest cap", url: "https://www.monitor.co.ug/uganda/business/markets/a-tax-avoidance-rule-built-for-large-firms-is-hitting-ordinary-businesses--5563684" },
  monitorGold: { label: "Daily Monitor — IGG orders gold levy recovery", url: "https://www.monitor.co.ug/uganda/news/national/igg-orders-ura-to-recover-shs40b-from-gold-exporters-5342820" },
  matookeKuku: { label: "Matooke Republic — Kuku Foods loss reassessment", url: "https://www.matookerepublic.com/business/20250415/why-kfc-could-close-business-in-uganda-amid-tax-dispute-with-ura/" },
  regfollowerDST: { label: "RegFollower — URA notice on digital services tax", url: "https://regfollower.com/?p=56588" },
};

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------
export const HUB_TABS = [
  // =========================================================================
  {
    id: "practice-notes",
    label: "Practice notes",
    summary:
      "The FY 2026/27 Acts took effect on 1 July 2026, and the 2025–26 rulings shift the evidential burden back onto URA for reconciliation-based assessments.",
    articles: [
      {
        id: "paye-2026-bands",
        title: "PAYE: new bands from 1 July 2026",
        tags: ["PAYE", "Income Tax", "2026 amendments"],
        flags: ["verify"],
        summary: "Tax-free threshold up from UGX 235,000 to UGX 335,000 a month; 10% surcharge above UGX 120m a year.",
        body: [
          { type: "p", text: "The tax-free threshold for resident individuals rose from UGX 235,000 to UGX 335,000 a month (UGX 4.02m a year). A 10% surcharge applies above UGX 120m a year." },
          {
            type: "table",
            headers: ["Annual chargeable income (UGX)", "Monthly equivalent (UGX)", "Tax"],
            rows: [
              ["Up to 4,020,000", "Up to 335,000", "Nil"],
              ["4,020,001 – 4,920,000", "335,001 – 410,000", "20% of excess over 4.02m"],
              ["4,920,001 – 5,820,000", "410,001 – 485,000", "180,000 + 25% of excess over 4.92m"],
              ["5,820,001 – 120,000,000", "485,001 – 10,000,000", "405,000 + 30% of excess over 5.82m"],
              ["Above 120,000,000", "Above 10,000,000", "As above + extra 10% on excess over 120m"],
            ],
          },
          { type: "callout", tone: "action", text: "The Income Tax (Amendment) Act, 2026 was assented late (reported as 20 August 2026) but applies from 1 July 2026. Employers who ran July or August payroll on the old bands should amend those PAYE returns. Verify the assent date against the Gazette." },
          { type: "p", text: "Non-residents get no tax-free band." },
        ],
        sources: ["eyActs2026", "accountsOsPaye"],
      },
      {
        id: "wht-2026",
        title: "Withholding tax: five new or changed charges",
        tags: ["WHT", "Income Tax", "Software", "Gaming"],
        summary: "Software royalties at 15%, 5% on certain foreign interest, 10% final on telecom commissions, 15% on winnings, 6% on entertainers.",
        body: [
          {
            type: "table",
            headers: ["Payment", "Rate", "Provision (Cap. 338)", "Note"],
            rows: [
              ["Royalties, now expressly including software (licences, subscriptions, embedded) paid to non-residents", "15%", "s.2 \"royalty\"; s.86(7)", "Royalties taken out of the 5% digital services tax"],
              ["Interest on widely issued foreign debentures / loans from public non-resident financial institutions", "5%", "s.82(5)", "Previously exempt"],
              ["Commissions paid by telecoms for airtime, network and mobile money services", "10%, final", "s.133, s.139", "Agents no longer file on this income"],
              ["Betting and gaming winnings (payout minus stake)", "15%", "s.131", "Land-based casinos now included after the July 2026 veto"],
              ["Payments to public entertainers (stage, radio, TV, digital)", "6% of gross", "s.135B (new)", "Event promoters must withhold"],
            ],
          },
          { type: "callout", tone: "action", text: "Review every SaaS and software contract with a foreign vendor; gross-up clauses decide who bears the 15%." },
          { type: "p", text: "WHT exemption certificates now run on a six-month cycle; the July–December 2026 window opened on 7 April 2026. Diary the next window for January–June 2027." },
        ],
        sources: ["eyActs2026", "onyango", "parlAdopt", "uraWhtWindow"],
      },
      {
        id: "wht-capitalised-interest",
        title: "WHT on capitalised related-party interest",
        tags: ["WHT", "Interest", "Case law"],
        summary: "Capitalising accrued interest is a payment; WHT is due on that date (ATC Uganda, Court of Appeal 2026).",
        body: [
          { type: "p", text: "Capitalising accrued interest into a loan's principal is a \"payment\" that triggers WHT at that moment, not when cash moves. The Court of Appeal confirmed this in ATC Uganda Ltd v URA (Civil Appeal 220 of 2022, 27 March 2026), upholding an assessment of about UGX 24.2bn on interest owed to a Netherlands parent." },
          { type: "callout", tone: "action", text: "Account for WHT on the capitalisation date for any PIK or roll-up interest." },
        ],
        sources: ["tpATC"],
      },
      {
        id: "vat-2026",
        title: "VAT: threshold, withholding relief, refunds",
        tags: ["VAT", "EFRIS", "2026 amendments"],
        summary: "Registration threshold doubles to UGX 300m; no VAT withholding on EFRIS-invoiced supplies.",
        body: [
          {
            type: "list",
            items: [
              "Registration threshold: UGX 150m → UGX 300m annual turnover (VAT Act Cap. 344, s.7). First change since 2015.",
              "No VAT withholding by a designated agent where the supplier issues an EFRIS e-invoice or e-receipt (s.5).",
              "Refund interest: URA now withholds interest only where the over-claim exceeds 5% of the refund claimed (was a flat UGX 50,000) (s.36).",
              "Consumer e-receipt refund: non-taxable persons spending UGX 2m (was 5m) in 30 days with e-receipts get 5% of the VAT back (s.38).",
              "Hotel/tourism developers investing at least US$10m (foreign) or US$5m (citizen) get input credit on pre-commissioning construction costs (s.28).",
            ],
          },
          { type: "callout", tone: "action", text: "Clients near UGX 300m should test deregistration carefully; a deregistered business loses input credit and may face output VAT on stock." },
        ],
        sources: ["eyActs2026"],
      },
      {
        id: "variance-assessments",
        title: "Reconciliation-based assessments: the 2026 line of cases",
        tags: ["VAT", "Income Tax", "Audit", "Case law"],
        summary: "URA cannot tax a variance on its own; it must link it to a real supply or income.",
        body: [
          {
            type: "table",
            headers: ["Case", "Date", "Holding"],
            rows: [
              ["Ericsson AB v URA, TAT App. 60 of 2020", "29 May 2026", "VAT vs income tax variances from timing (percentage-of-completion) are not undeclared supplies. Income tax assessment vacated; VAT cut from UGX 9.72bn to 2.58bn. Agency notice during the 45-day objection window was unlawful."],
              ["Munyanga Development Ltd v URA, TAT App. 73 of 2026", "30 June 2026", "Bank-credits-vs-revenue assessment set aside because URA missed the 90-day objection deadline."],
              ["Medisell Uganda Ltd v URA", "4 Aug 2026", "UGX 1.006bn blocked; variance traced to clerical errors. URA must prove an actual undeclared transaction."],
            ],
          },
          { type: "callout", tone: "action", text: "Keep a monthly three-way reconciliation (accounts ↔ income tax return ↔ VAT returns ↔ bank), with each variance explained and evidenced before an audit starts." },
          { type: "callout", tone: "warn", text: "In Ericsson, URA switched from a VAT-inclusive to a VAT-exclusive computation during mediation; the Tribunal held the objection decision, not a new theory, is what is reviewed." },
        ],
        sources: ["eyEricsson", "pwcMunyanga", "monitorMedisell"],
      },
      {
        id: "interest-limitation",
        title: "Interest limitation (s.25 Cap. 338)",
        tags: ["Corporate tax", "Interest", "Case law"],
        summary: "30% tax-EBITDA cap applies to gross interest; 2026 redefines \"group\" at 51% and excludes dormant members.",
        body: [
          {
            type: "list",
            items: [
              "The 30% tax-EBITDA cap applies to gross interest expense, not net of interest income: Rwenzori Commodities Ltd v URA, TAT App. 36 of 2024, July 2025.",
              "Carried-forward losses count as allowable deductions in computing tax EBITDA (TAT, August 2025, per the ULII 2025 listing).",
              "2026 change: \"group\" now means at least 51% common underlying ownership, and dormant members are excluded.",
            ],
          },
        ],
        sources: ["tpRwenzori", "uliiTat", "eyActs2026"],
      },
      {
        id: "offshore-ownership-change",
        title: "Offshore share sales and change of ownership",
        tags: ["CGT", "International", "Case law"],
        summary: "Kuku Foods (TAT, May 2026): offshore ownership change taxable; UGX 4.2bn assessment to be recomputed.",
        body: [
          { type: "p", text: "A change in underlying ownership of a Ugandan company through offshore entities can trigger tax. Kuku Foods Uganda Ltd v URA, TAT 54 of 2025 (May 2026), upheld URA's position on liability but ordered the UGX 4.2bn assessment recomputed." },
          { type: "callout", tone: "action", text: "Model Ugandan exposure before any group restructuring above the Ugandan entity." },
        ],
        sources: ["monitorKuku"],
      },
      {
        id: "rental-monthly",
        title: "Rental income: monthly provisional returns",
        tags: ["Rental tax", "2026 amendments"],
        summary: "Individuals may now file rental provisional returns monthly (new s.124(1a)).",
        body: [
          { type: "p", text: "Individuals may now file rental provisional returns monthly (new s.124(1a)) instead of quarterly. Useful for landlords who collect rent monthly and want to avoid a year-end lump sum." },
        ],
        sources: ["eyActs2026"],
      },
      {
        id: "efris-penalties",
        title: "EFRIS and tax-stamp penalties (TPC Cap. 343)",
        tags: ["EFRIS", "Penalties", "2026 amendments"],
        summary: "Fixed penalty floors cut sharply; \"double the tax\" now applies.",
        body: [
          {
            type: "table",
            headers: ["Offence", "Before 1 July 2026", "From 1 July 2026"],
            rows: [
              ["Goods without tax stamps (s.21(3))", "Double the tax or UGX 50m, whichever higher", "Double the tax or UGX 2m"],
              ["Not using an EFD (s.93(1))", "Tax due or UGX 8m", "Double the tax or UGX 200,000"],
              ["Not issuing e-invoice/e-receipt, or tampering (s.93(2))", "Tax due or UGX 6m", "Double the tax or UGX 200,000"],
            ],
          },
          { type: "p", text: "The fixed floor fell sharply, but \"double the tax\" bites harder on large transactions." },
        ],
        sources: ["eyActs2026"],
      },
      {
        id: "stamp-duty-2026",
        title: "Stamp duty changes",
        tags: ["Stamp duty", "2026 amendments"],
        flags: ["sources-differ"],
        summary: "Monthly returns for financial services; motor vehicle duty introduced.",
        body: [
          {
            type: "list",
            items: [
              "Financial service providers file monthly stamp duty returns (new s.7A, Cap. 339); default costs 2% simple interest a month.",
              "Records must be kept five years (s.62).",
              "Motor vehicle registration/transfer duty introduced. Sources differ on motorcycles: UGX 30,000 (EY) vs UGX 50,000 (Onyango); other vehicles UGX 200,000 in both.",
            ],
          },
          { type: "callout", tone: "warn", text: "One firm reports transfer duty doubling from 1.5% to 3%; EY's summary of the enacted Act lists no such change. Verify before publishing." },
        ],
        sources: ["eyActs2026", "onyango"],
      },
      {
        id: "vat-unimproved-land",
        title: "VAT on unimproved land",
        tags: ["VAT", "Property", "Case law"],
        summary: "URA refunded UGX 2.4bn to Canaan Sites after VAT on unimproved land was held unlawful.",
        body: [
          { type: "p", text: "Sale of unimproved land is not a VATable supply. URA refunded UGX 2.4bn to Canaan Sites after the Tribunal declared VAT collected on such sales unlawful (2024) and URA's appeal was settled by consent." },
        ],
        sources: ["ugandanzCanaan"],
      },
      {
        id: "interest-unpaid-and-refunds",
        title: "Interest on unpaid tax and on refunds",
        tags: ["Interest", "Refunds", "VAT", "Income Tax", "Case law"],
        summary: "Penal tax accrues during disputes (Airtel, SC); refund interest rules differ between income tax and VAT.",
        body: [
          { type: "p", text: "Interest runs against the taxpayer during a dispute, while refund interest depends on which Act applies. The courts have said only Parliament can change this." },
          {
            type: "table",
            headers: ["Case", "Court", "Holding"],
            rows: [
              ["Commissioner General, URA v Airtel (Celtel liabilities)", "Supreme Court, unanimous", "Penal tax on unpaid VAT keeps accruing while an objection is before the TAT; paying the 30% does not stop it. A US$270,698 assessment grew to about US$397,000."],
              ["Mbanza Martin Kalemera v Attorney General", "Constitutional Court, unanimous", "Income tax refund interest (ITA Cap. 338 s.123) runs from the refund application, or from receipt of further information URA asks for; URA has six months to pay. No interest for the objection or appeal period."],
              ["URA v Pentecostal Assemblies of God", "High Court", "VAT refund interest (VAT Act s.36(1)) is mandatory at 2% a month, compounded, from the date of wrongful payment (June 2019)."],
              ["East African Investments Ltd v URA", "High Court (Commercial), 27 Apr 2026", "URA pays interest on money it retains; verify the judgment."],
            ],
          },
          { type: "callout", tone: "action", text: "File refund claims promptly with full support; every information request moves the income tax interest start date. Before objecting, price the penal interest that will run during the dispute against the chance of winning." },
          {
            type: "list",
            items: [
              "M&A: accrued penal interest passes to an acquirer, as in Airtel. Cover it in due diligence and warranties.",
              "2026 VAT change: no refund interest where the over-claim exceeds 5% of the refund claimed (VAT Act s.36 as amended).",
            ],
          },
        ],
        sources: ["ensInterest", "btEastAfricanInv", "eyActs2026"],
      },
      {
        id: "paying-non-residents",
        title: "Paying non-residents: WHT, treaties and digital services tax",
        tags: ["WHT", "Treaties", "DST", "International"],
        flags: ["verify"],
        summary: "15% domestic WHT on dividends, interest, royalties and fees; 5% DST; nine listed treaties.",
        body: [
          {
            type: "table",
            headers: ["Payment to a non-resident", "Domestic rate", "Note"],
            rows: [
              ["Dividends", "15%", "Treaty may reduce"],
              ["Interest", "15% (5% on qualifying foreign debentures / public FI loans from 1 July 2026)", "WHT due on capitalisation (ATC Uganda)"],
              ["Royalties, including software from 1 July 2026", "15%", "No longer under DST"],
              ["Management and technical fees", "15%", "Due whether or not deductible"],
              ["Digital services (non-resident providers)", "5% DST on gross Uganda revenue", "Quarterly returns and payment by the 15th of April, July, October and January; residents withhold if the provider is not registered"],
            ],
          },
          {
            type: "list",
            items: [
              "Treaty relief: Uganda's listed treaties are Denmark, India, Italy, Mauritius, Netherlands, Norway, South Africa, the UK and Zambia. Hold a tax residence certificate and beneficial ownership evidence before applying a reduced rate.",
              "Special relationship clauses cap treaty rates at the arm's length amount (Mini Bakeries, Article 12(6) Uganda–Mauritius).",
              "Foreign tax credit for residents is limited to the Ugandan tax on the same income, computed separately for business and other foreign income.",
            ],
          },
        ],
        sources: ["tpProfile", "eyActs2026", "regfollowerDST", "pwcTreaties"],
      },
      {
        id: "gold-export-levy",
        title: "Gold export levy",
        tags: ["Mining", "Gold", "Levies"],
        summary: "5% per kg, later US$200/kg; IGG directs recovery of UGX 38.7bn arrears (Jan 2026).",
        body: [
          { type: "p", text: "Refined gold exports carry a levy under Mining (Amendment) Act 2021 s.116A: 5% per kg, later set at US$200/kg by S.I. 30 of 2024. In January 2026 the IGG directed URA to recover UGX 38.7bn in arrears from five refineries; a 2023 civil suit challenging the levy regulations had stalled collection." },
          { type: "callout", tone: "action", text: "Refiners should reconcile export volumes to levy payments month by month." },
        ],
        sources: ["monitorGold"],
      },
    ],
  },

  // =========================================================================
  {
    id: "appeal-strategy",
    label: "Appeal strategy",
    summary:
      "Uganda tax disputes are won or lost on deadlines and on the record built at audit stage: miss a 30- or 45-day window and the merits are never heard, while URA missing its 90-day window can end the case for the taxpayer.",
    // Data for a route diagram (render however you like)
    route: {
      steps: [
        { id: "decision", name: "URA tax decision or assessment", note: "e.g. additional assessment or refund refusal" },
        { id: "objection", name: "Objection to URA", note: "within 45 days of the notice" },
        { id: "objection-decision", name: "URA objection decision", note: "served within 90 days of receipt" },
        { id: "tat", name: "Tax Appeals Tribunal", note: "apply within 30 days; pay 30% deposit", highlight: true },
        { id: "high-court", name: "High Court", note: "appeal on questions of law only" },
        { id: "higher-courts", name: "Court of Appeal, then Supreme Court", note: "further appeals" },
      ],
      branches: [
        { from: "objection-decision", name: "Objection deemed allowed", note: "taxpayer elects; late URA decision void", trigger: "no decision in 90 days" },
        { from: "objection-decision", name: "ADR with URA", note: "outcome final; TAT clock keeps running", trigger: "optional, in parallel" },
      ],
    },
    articles: [
      {
        id: "statutory-clock",
        title: "The statutory clock",
        tags: ["Objections", "TAT", "Deadlines"],
        summary: "45 days to object, 90 days for URA, 30 days to the TAT.",
        body: [
          {
            type: "table",
            headers: ["Step", "Deadline", "Authority", "Consequence of missing it"],
            rows: [
              ["Object to a tax decision", "45 days from notice", "TPC Cap. 343 (objection section)", "Decision becomes final; no route to TAT"],
              ["URA serves objection decision", "90 days, counted from the day the objection is received", "TPC s.26(6)", "Taxpayer may elect to treat the objection as allowed (s.26(7)–(8))"],
              ["Apply to TAT for review", "30 days from service of the objection decision", "TAT Act s.16(1)(c); TPC s.25(1) (2014 numbering)", "Application time-barred unless extended for reasonable cause (s.16(2))"],
              ["Pay the 30% deposit", "Before the TAT will hear the application", "TAT Act s.15(1)", "Application liable to dismissal (now softened)"],
              ["Appeal TAT decision to High Court", "On questions of law; verify current time limit in Cap. 341", "TAT Act (appeal section)", "Decision stands"],
            ],
          },
          { type: "p", text: "Time limits are substantive law, not technicalities: URA v Uganda Consolidated Properties Ltd, Court of Appeal Civil Appeal 31 of 2000, applied in Essential Auto Parts v URA, TAT App. 180 of 2022. A UGX 21.5bn dispute was lost on time alone in Game Discount World (U) Ltd v URA (TAT, early 2025)." },
        ],
        sources: ["uraObjections", "essentialAuto", "gameDiscount"],
      },
      {
        id: "ninety-day-rule",
        title: "Use the 90-day rule offensively",
        tags: ["Objections", "Case law"],
        summary: "Munyanga (TAT, 30 June 2026): day 1 is the day of receipt; the taxpayer's election is automatic.",
        body: [
          {
            type: "list",
            items: [
              "The 90 days run from the date of receipt, including that day. The TPC overrides the Interpretation Act's \"exclude the first day\" rule. An objection lodged 31 December 2025 expired on 30 March 2026.",
              "The election under s.26(7) is automatic once lodged; URA's approval is not needed.",
              "URA's decision served about eight hours after the election (6:11pm vs 9:50am the same day) was void: URA was functus officio. The additional assessment was set aside with costs.",
              "Document requests and reconciliation meetings do not extend the 90 days. A s.26(9) waiver works only if URA notifies the taxpayer before the election.",
            ],
          },
          { type: "callout", tone: "action", text: "Diary day 90 from receipt, file the election on day 91 through the portal, and keep time-stamped proof of every submission." },
        ],
        sources: ["pwcMunyanga"],
      },
      {
        id: "thirty-percent-deposit",
        title: "The 30% deposit (TAT Act s.15(1))",
        tags: ["TAT", "30% deposit", "Case law"],
        summary: "Pay 30% of tax assessed or undisputed tax, whichever is greater; case law has softened the rule in steps.",
        body: [
          {
            type: "table",
            headers: ["Case", "Court, year", "What it decided"],
            rows: [
              ["Uganda Projects Implementation & Management Centre v URA, Const. Appeal 2 of 2009", "Supreme Court", "The 30% rule (then in the VAT Act) is constitutional; the Commissioner has discretion to accept security other than cash."],
              ["Fuelex (U) Ltd v URA", "Constitutional Court, 24 July 2020", "Unconstitutional where the objection is not about the amount of tax (pure legal or liability questions). Section 15 was not struck down."],
              ["Vivo Energy v URA", "TAT", "A bank guarantee is not \"payment\"."],
              ["Eram Uganda v URA", "TAT", "A refund offset satisfied the deposit."],
              ["Dr Jaala Higenyi Alfred v URA", "High Court, reported June 2026", "An asset URA has distrained (an armoured vehicle worth over US$265,000) counts towards the 30%. A shortfall (about US$77,000) calls for a compliance order to top up, not dismissal (following A Better Place Uganda Ltd v URA)."],
            ],
          },
          { type: "callout", tone: "action", text: "Classify the objection early. Liability-only or purely legal grounds: argue the Fuelex exception. Quantum disputes: plan cash flow or propose security in writing to the Commissioner, and record the value of anything already seized." },
          { type: "p", text: "URA has been enforcing the deposit more strictly in 2026." },
        ],
        sources: ["scUgandaProjects", "mondaqFuelex", "ensDeposit", "croweDeposit"],
      },
      {
        id: "adr-clock",
        title: "ADR does not stop the clock",
        tags: ["ADR", "TAT", "Case law"],
        summary: "Africa Global Logistics (TAT, Aug 2025): the 30-day window runs from the objection decision, not the ADR outcome.",
        body: [
          {
            type: "list",
            items: [
              "The 30-day TAT window ran from the objection decision, not from the later ADR outcome. The application was out of time.",
              "ADR committee decisions are not \"taxation decisions\" the TAT can review (TAT Act s.14(1)); the High Court said the same in CIC Africa (U) Ltd v URA.",
              "A concluded ADR settlement is binding and blocks interim relief (TAT, September 2025).",
            ],
          },
          { type: "callout", tone: "action", text: "File a protective TAT application within 30 days of the objection decision even while ADR talks continue." },
        ],
        sources: ["btAfricaGlobal", "uliiTatAll"],
      },
      {
        id: "burden-and-record",
        title: "Burden of proof and the record",
        tags: ["Evidence", "TAT"],
        summary: "The taxpayer carries the burden, but URA must still show a variance is real income.",
        body: [
          {
            type: "list",
            items: [
              "The taxpayer must prove the assessment is excessive or wrong (TAT Act s.19 as cited in Mini Bakeries, 2026; s.18 in older decisions).",
              "Since 1 July 2023, the TPC limits the information a taxpayer can later rely on in an objection or ADR. Put every document in front of URA at audit stage.",
              "Burden is not a blank cheque for URA: in the 2026 variance cases the Tribunal required URA to show the variance was real income or a real supply.",
              "In mediation, URA cannot switch to a new computation; the Tribunal reviews the objection decision (Ericsson AB, 2026).",
            ],
          },
        ],
        sources: ["realMuloodi", "eyEricsson"],
      },
      {
        id: "collection-pending",
        title: "Collection while the dispute runs",
        tags: ["Recovery", "Agency notices", "Refunds"],
        flags: ["verify"],
        summary: "Agency notices inside the 45-day window are unlawful (Ericsson AB, 2026).",
        body: [
          {
            type: "list",
            items: [
              "An agency notice on the taxpayer's bank account during the 45-day objection window was held unlawful in Ericsson AB v URA (29 May 2026), with a right to a refund and interest.",
              "Courts rarely restrain URA from collecting tax by injunction; build the case for the deposit and the Tribunal instead.",
              "Refund interest: the Commercial Division ruled on 27 April 2026 that URA pays interest on money it retains (East African Investments Ltd v URA). Verify the judgment text before citing.",
            ],
          },
        ],
        sources: ["eyEricsson", "btEastAfricanInv"],
      },
      {
        id: "appeal-or-negotiate",
        title: "Appeal or negotiate: a decision checklist",
        tags: ["Strategy"],
        summary: "Five questions that decide the route.",
        body: [
          {
            type: "list",
            ordered: true,
            items: [
              "Is the dispute about law or characterisation? Favour the TAT; a ruling binds future years.",
              "Is it about evidence or arithmetic? Favour objection-stage reconciliation, then ADR.",
              "Can you fund 30% or offer security? If not, check the Fuelex exception and the Jaala Higenyi route.",
              "Has URA missed 90 days? Elect immediately.",
              "Is the exposure recurring (transfer pricing, WHT characterisation)? Litigate the principle; settle quantum.",
            ],
          },
        ],
        sources: ["gleAppealGuide"],
      },
      {
        id: "time-limits-reaudits",
        title: "Assessment time limits and re-audits",
        tags: ["Assessments", "Time limits", "Case law"],
        summary: "Three years for additional assessments, but new information reopens older years (SMEC, 2024).",
        body: [
          { type: "p", text: "URA generally has three years to issue an additional assessment (TPC s.25(2)(b) as cited in SMEC), but new information reopens older years." },
          {
            type: "list",
            items: [
              "In SMEC International v URA (TAT, Nov 2024), assessments for 2011–2016 stood because they rested on information found in a 2018 examination (the s.25(2)(a) exception). An earlier consent judgment did not bar the audit because it covered a different issue (WHT on management fees).",
              "Fraud or wilful neglect removes the time limit.",
            ],
          },
          { type: "callout", tone: "action", text: "When a settlement or consent judgment closes an audit, define its scope by tax type and period, so a later \"new information\" assessment cannot reopen the same ground." },
        ],
        sources: ["tpSMEC"],
      },
      {
        id: "thirty-percent-instalments",
        title: "Paying the 30% in instalments",
        tags: ["30% deposit", "TAT", "Case law"],
        summary: "Refusing instalments is a reviewable decision (Century Bottling, TAT 2020).",
        body: [
          { type: "p", text: "The Commissioner General's refusal to let a taxpayer pay the 30% deposit in instalments is a reviewable tax decision. In Century Bottling Company v URA (TAT, 2020), the Tribunal found the refusal irrational given COVID-19 and URA's past practice, allowed four equal instalments and restrained collection." },
          { type: "callout", tone: "action", text: "Apply in writing for instalments or security before the TAT deadline, with cash-flow evidence. A refusal can itself go to the Tribunal." },
          { type: "callout", tone: "warn", text: "Remember Airtel: penal tax still accrues on the unpaid balance." },
        ],
        sources: ["ensCentury", "ensInterest"],
      },
      {
        id: "tribunal-evidence-pack",
        title: "The Tribunal evidence pack",
        tags: ["Evidence", "TAT", "Checklist"],
        summary: "Nine items to assemble before filing at the TAT.",
        body: [
          {
            type: "checklist",
            items: [
              "Notice of assessment and all annexures; the audit findings letter.",
              "Objection with proof of the date URA received it.",
              "Objection decision with proof of service date (this starts the 30-day clock).",
              "Proof of the 30% deposit, security, distrained assets, or the Fuelex argument.",
              "Audited accounts, ledgers, bank statements and the three-way reconciliation.",
              "Contracts, invoices, EFRIS records and TP documentation.",
              "Witness statements from the people who did the work (SMEC failed for want of names and descriptions).",
              "Every document already given to URA at audit stage (the 2023 TPC restriction).",
              "Expert reports, for valuation or TP benchmarking.",
            ],
          },
        ],
        sources: ["uraObjections", "tpSMEC", "realMuloodi"],
      },
    ],
  },

  // =========================================================================
  {
    id: "transfer-pricing",
    label: "Transfer pricing",
    summary:
      "From 1 July 2026 a taxpayer must itself account for related-party transactions at arm's length (new s.115A), and the August 2026 Mini Bakeries ruling shows the Tribunal will uphold URA where the file lacks a real functional analysis.",
    articles: [
      {
        id: "tp-framework",
        title: "Legal framework",
        tags: ["TP", "Legislation"],
        summary: "s.116 Cap. 338, new s.115A, the 2011 Regulations and the 2012 Practice Note.",
        body: [
          {
            type: "table",
            headers: ["Instrument", "What it does"],
            rows: [
              ["Income Tax Act Cap. 338, s.116 (old s.90, Cap. 340)", "Commissioner may adjust transactions between associates to reflect arm's length terms, and may determine source and character of income."],
              ["s.115A (new, from 1 July 2026)", "A person in a controlled transaction (a transaction between associates) must account for it consistently with the arm's length principle."],
              ["GAAR (s.91 in the old numbering)", "Recharacterise or disregard tax avoidance schemes; URA pairs it with TP arguments."],
              ["Income Tax (Transfer Pricing) Regulations 2011", "In force 1 July 2011. Reg. 4: arm's length test; Reg. 6: apply consistently with the OECD TP Guidelines; Reg. 8: documentation."],
              ["URA Practice Note on TP documentation (2012)", "Issued under Reg. 8(3); Gazette of 1 June 2012. Sets the documentation contents and thresholds."],
              ["Income Tax Act s.25", "30% of tax-EBITDA interest cap for group members."],
            ],
          },
          { type: "callout", tone: "info", text: "Why s.115A matters: before it, URA had to show that profits reported in Uganda did not reflect economic reality. Commentators read s.115A as putting the onus on the taxpayer from the start to show pricing is commercially justified and documented." },
        ],
        sources: ["eyActs2026", "ibfdRegs", "gazette2012", "monitorTP"],
      },
      {
        id: "tp-documentation",
        title: "Who must document, and what",
        tags: ["TP", "Documentation", "Penalties"],
        flags: ["verify"],
        summary: "All MNE cross-border controlled transactions, plus domestic ones above UGX 500m a year.",
        body: [
          {
            type: "list",
            items: [
              "Scope: controlled transactions where one party is in Uganda and subject to tax there, and the other is in or outside Uganda. Employer–employee dealings fall outside the Regulations.",
              "Documentation thresholds: all cross-border controlled transactions of MNEs, and domestic controlled transactions above UGX 500m in aggregate in a year.",
              "Timing: prepare it before filing the return; produce it when URA asks.",
              "Contents (Practice Note): group structure, functional analysis (functions, assets, risks), method selection and rejection, comparables search with databases and criteria, economic analysis and conclusion.",
              "Penalty: penal tax of UGX 50m for failing to provide TP records the Commissioner requests.",
              "Master file / CbCR: one database lists a BEPS Action 13 regime but flags its own figures \"verify\". No primary source confirmed it; treat as unconfirmed.",
              "APAs: the 2011 Regulations provide for them, but no working programme is reported.",
            ],
          },
        ],
        sources: ["pwcGroup", "mmaksTP", "tpProfile"],
      },
      {
        id: "tp-methods",
        title: "Methods URA accepts",
        tags: ["TP", "Methods"],
        summary: "The five OECD methods; CUP for commodities, TNMM for distributors and service providers.",
        body: [
          { type: "p", text: "The five OECD methods: comparable uncontrolled price (CUP), resale price, cost plus, transactional net margin (TNMM) and profit split, with the most appropriate method chosen on the facts. URA tends to use CUP for commodity sales (tea, beverages) and TNMM for distributors and service providers." },
        ],
        sources: ["tpProfile"],
      },
      {
        id: "mini-bakeries-2026",
        title: "Leading case: Mini Bakeries Uganda Ltd v URA (TAT App. 330 of 2025, 21 August 2026)",
        tags: ["TP", "Royalties", "Loans", "Case law", "DEMPE"],
        summary: "SUPA LOAF maker lost on both a trademark royalty and intra-group loans; costs to URA.",
        body: [
          {
            type: "table",
            headers: ["Issue", "URA's case", "Tribunal's finding"],
            rows: [
              ["2% of net sales royalty to Mauritius trademark owner (audit July 2015–June 2023)", "Owner performed no DEMPE functions; legal title alone earns no turnover royalty (OECD TPG paras 6.34–6.59)", "Agreement put all development, maintenance and protection on Mini Bakeries; the owner merely held title. Royalty disallowed."],
              ["The taxpayer's CUP study (ktMINE database)", "Unreliable", "No functional analysis, only general assertions, so the benchmark was unreliable."],
              ["About US$2.2m unsecured loans to Kenyan and Tanzanian affiliates at 4.6–10%", "Price = USD risk-free rate + 4% lending premium (from the taxpayer's own file) + country risk premium (OECD TPG Ch. X)", "Central bank deposit rates and secured bank loans are not comparable; no \"options realistically available\" analysis (citing Chevron Australia). The taxpayer did not show the assessment was excessive (TAT Act s.19)."],
              ["Refund of WHT and VAT already paid on the disallowed royalty", "Not refundable", "Refused. The s.116 adjustment does not undo liabilities that arose independently; VAT and income tax are separate regimes; Article 12(6) of the Uganda–Mauritius treaty preserves Uganda's taxing right on the excess."],
            ],
          },
          {
            type: "list",
            ordered: true,
            items: [
              "A royalty to an IP holder needs evidence of DEMPE functions, not just a registration certificate.",
              "A benchmark without a functional analysis will be rejected however good the database.",
              "For outbound loans, document the borrower's credit rating and the lender's realistic alternatives.",
              "A TP disallowance does not refund WHT or reverse-charge VAT already paid; align TP, VAT and WHT positions before invoicing.",
            ],
          },
          { type: "p", text: "The Tribunal declined to endorse adding a country risk premium on top of a general lending premium as a universal method. That point remains open." },
        ],
        sources: ["tpMiniBakeries", "monitorMiniBakeries", "vatupdateMB"],
      },
      {
        id: "tp-other-cases",
        title: "Other Uganda TP and related-party decisions",
        tags: ["TP", "Case law"],
        flags: ["sources-differ"],
        summary: "ATC, Rwenzori, SMEC, Allied Beverage, Bondo Tea, EABL International, Kuku Foods.",
        body: [
          {
            type: "table",
            headers: ["Case", "Forum, date", "Outcome", "Point"],
            rows: [
              ["ATC Uganda Ltd v URA, CA 220 of 2022", "Court of Appeal, Mar 2026", "URA", "WHT arises when related-party interest is capitalised; about UGX 24.2bn."],
              ["Rwenzori Commodities Ltd v URA, App. 36 of 2024", "TAT, Jul 2025", "URA", "Interest cap applies to gross interest; OECD BEPS Action 4 persuasive only."],
              ["SMEC International Ltd v URA, App. 75 of 2019", "TAT, Nov 2024", "URA", "Head-office charges to a Ugandan branch failed the benefit test; no proof services were rendered."],
              ["Allied Beverage Company Ltd v URA, Case 0039 of 2022", "High Court, Sep 2024", "See summary", "Characterisation and treaty treatment of cross-border marketing and brand-service fees."],
              ["Bondo Tea Estates Ltd v URA, TAT 65 of 2018", "TAT, Mar 2021", "Taxpayer", "URA's price adjustment on green leaf sales to an associate did not conform with the law."],
              ["East African Breweries International Ltd v URA, TAT 14 of 2017", "TAT, Jul 2020", "Sources differ", "Regional distribution at a 7.5% mark-up vs 70–90% on-sale. One summary says the taxpayer won on residence; a 2025 report says it was ordered to pay UGX 9.78bn. Read the judgment before citing."],
              ["Kuku Foods Uganda Ltd v URA, TAT 54 of 2025", "TAT, May 2026", "Mixed", "Offshore ownership change taxable; UGX 4.2bn to be recomputed."],
            ],
          },
          { type: "p", text: "Pending or settled (reported): MTN Uganda paid UGX 110bn to settle a TP audit and has a separate UGX 169bn dispute; Stanbic Bank Uganda is challenging a UGX 115bn TP assessment." },
        ],
        sources: ["tpATC", "tpRwenzori", "tpSMEC", "tpAllied", "tpBondo", "tpEABL", "bfEABL", "monitorKuku", "eastAfrican"],
      },
      {
        id: "tp-regulations-detail",
        title: "Regulation-by-regulation detail",
        tags: ["TP", "Regulations", "Penalties", "APAs"],
        summary: "Associates test, Regs 4, 6, 7, 8, 8(4) and 9, branches, master file and CbCR status.",
        body: [
          {
            type: "table",
            headers: ["Rule", "What it requires", "Practical note"],
            rows: [
              ["Associates (ITA s.3)", "One person acts on the directions, requests or wishes of the other; for companies, control of 50% or more of voting power, directly or through interposed entities", "The general \"acts on directions\" test is wider than 50%; a franchisor or dominant supplier can qualify"],
              ["Reg. 4 — comparability factors", "Property or service characteristics; functions, assets and risks; contract terms; economic circumstances; business strategies", "Comparability adjustments allowed; no Ugandan interquartile-range rule, so OECD practice applies"],
              ["Reg. 6 — OECD Guidelines", "Apply consistently with Article 9 OECD Model and the TP Guidelines as updated", "If the Guidelines, the Regulations and the Income Tax Act conflict, the Act prevails"],
              ["Reg. 7 — methods", "CUP, resale price, cost plus, TNMM, profit split; no hierarchy, most appropriate method", "Reg. 7(5): another method is allowed if none of the five can reasonably apply"],
              ["Reg. 8 — documentation", "Records sufficient to verify arm's length pricing, in place by the return due date", "Produce within 30 days of a URA request"],
              ["Reg. 8(4) — offence", "Up to six months' imprisonment, a fine up to UGX 500,000, or both, on conviction", "Separate from the UGX 50m TPC penal tax"],
              ["Reg. 9 — APAs", "Unilateral, bilateral and multilateral APAs are allowed", "Rarely granted in practice; no published procedure"],
              ["Branches", "Branch and head office treated as separate persons", "Head-office recharges must pass the arm's length and benefit tests (SMEC)"],
              ["Master file / CbCR", "Master file can be requested in audit; no confirmed standing CbCR filing", "No specific TP form is filed with the corporate return"],
            ],
          },
        ],
        sources: ["mmaksTP"],
      },
      {
        id: "tp-services",
        title: "Intra-group services and head-office charges",
        tags: ["TP", "Services", "Benefit test", "Case law"],
        summary: "SMEC (TAT, 2024): no names, no deliverables, no deduction. How to pass the benefit test.",
        body: [
          { type: "p", text: "A service charge is deductible only if the Ugandan entity can prove a real service, a benefit to it, and an arm's length price. The leading Ugandan authority is SMEC International Ltd v URA, TAT App. 75 of 2019 (November 2024)." },
          {
            type: "list",
            items: [
              "Facts: the Ugandan branch of an Australian engineering consultancy deducted head-office allocations, overhead recharges and regional office charges for 2011–2016. In some years related-party charges exceeded 90% of revenue, or 167% of operating profit.",
              "What was missing: links to specific projects, descriptions of the services, names of the people who provided them, and proof of benefit to the branch.",
              "Holding: deductions disallowed; the taxpayer failed to discharge its burden. The audit was lawful despite an earlier consent judgment, because it rested on new information.",
              "Remitted to URA: an unrefunded WHT credit of over UGX 1.3bn and possible penalty waiver, with any liability to be offset against the credit.",
            ],
          },
          {
            type: "table",
            headers: ["Category", "Deductible?", "Evidence URA expects"],
            rows: [
              ["Services the Ugandan entity would buy from a third party (IT support, accounting, HR, procurement)", "Yes, at arm's length", "Service agreement, deliverables, emails, time records, allocation key"],
              ["Shareholder activities (group audit, parent's board, investor relations, group financing for the parent)", "No", "Exclude from the cost pool before allocation"],
              ["Duplicate services already performed locally", "No", "Show the services are not duplicated"],
              ["On-call services", "Only if a third party would pay a standby fee", "Evidence of actual need and use"],
              ["Low value-adding support services", "Yes; OECD simplified approach of cost + 5%", "The OECD safe harbour is available, but URA has not published its own election rules"],
            ],
          },
          { type: "callout", tone: "warn", text: "15% WHT on management or technical fees paid to non-residents applies whether or not the fee is deductible, and imported services attract reverse-charge VAT. Mini Bakeries shows neither is refunded if the deduction is later disallowed." },
          { type: "p", text: "Reference: OECD TPG Chapter VII, especially paras 7.6–7.10 (benefit) and 7.43–7.63 (low value-adding services)." },
        ],
        sources: ["tpSMEC", "mmaksTP", "tpMiniBakeries"],
      },
      {
        id: "tp-financial",
        title: "Financial transactions",
        tags: ["TP", "Loans", "Interest", "Case law"],
        summary: "Arm's length rate, then the 30% cap, then WHT. Forex is not interest (Africa Oil, 2026).",
        body: [
          { type: "p", text: "Three separate tests apply to related-party debt, in this order: the arm's length rate (s.116 and OECD TPG Chapter X), the 30% tax-EBITDA cap (s.25), then withholding tax on payment or capitalisation." },
          {
            type: "table",
            headers: ["Issue", "Ugandan position", "Authority"],
            rows: [
              ["Pricing an intra-group loan", "Start from the borrower's standalone credit rating and realistic alternatives; deposit rates and secured bank loans are poor comparables for unsecured loans", "Mini Bakeries (TAT, Aug 2026)"],
              ["Country risk premium", "Not endorsed as an automatic add-on to a lending premium; argued case by case", "Mini Bakeries"],
              ["Interest cap base", "Gross interest expense, not net of interest income", "Rwenzori Commodities (TAT, Jul 2025)"],
              ["Losses in tax EBITDA", "Carried-forward losses are allowable deductions when computing tax EBITDA", "TAT, Aug 2025"],
              ["Forex losses", "A foreign-exchange loss is not \"interest\"; it sits outside the cap if separately recorded and evidenced", "Africa Oil Ltd v URA (TAT, May 2026)"],
              ["Who is in a \"group\"", "51% common underlying ownership from 1 July 2026; dormant members excluded. Common ownership alone can bring a purely domestic borrower into the cap", "ITA s.25 as amended; Africa Oil"],
              ["Capitalised interest", "WHT due when interest is capitalised, not when cash is paid", "ATC Uganda (Court of Appeal, Mar 2026)"],
              ["Foreign debentures and public FI loans", "5% WHT on gross interest from 1 July 2026", "s.82(5) as amended"],
            ],
          },
          { type: "callout", tone: "action", text: "Show forex losses and interest on separate ledger lines. A single \"finance costs\" line invites URA to cap both. In Africa Oil, URA sought to disallow UGX 549m this way and lost only because the taxpayer could prove the split." },
          { type: "p", text: "Guarantees: no Ugandan ruling found. Under OECD TPG Chapter X a guarantee fee is justified only where the guarantee lets the borrower borrow more, or more cheaply, than its standalone rating allows; implicit support from group membership is not a chargeable service." },
        ],
        sources: ["tpMiniBakeries", "tpRwenzori", "uliiTat", "monitorAfricaOil", "tpATC", "eyActs2026"],
      },
      {
        id: "tp-commodities",
        title: "Commodities: tea, coffee, gold, beverages",
        tags: ["TP", "Commodities", "CUP", "Case law"],
        flags: ["sources-differ"],
        summary: "CUP against quoted prices; URA's own adjustment must use a recognised method (Bondo Tea).",
        body: [
          {
            type: "table",
            headers: ["Commodity / case", "What happened", "Lesson"],
            rows: [
              ["Green leaf tea — Bondo Tea Estates Ltd v URA, TAT 65 of 2018 (Mar 2021)", "URA adjusted the out-grower's green leaf sales to associate Kijura Tea using an average market price; the Tribunal held the adjustment did not conform with the law", "URA must apply a recognised method with real comparables; a broad average is attackable"],
              ["Beer for regional distribution — East African Breweries International Ltd v URA, TAT 14 of 2017 (Jul 2020)", "Uganda Breweries charged a 7.5% mark-up while the regional distributor sold on at 70–90%; the Tribunal accepted the Commissioner may apportion group income and recharacterise", "Big margin gaps between related entities invite adjustment. Outcome reported differently by sources; read the judgment"],
              ["Refined gold exports", "Levy under Mining (Amendment) Act 2021 s.116A; IGG directed recovery of UGX 38.7bn from five refineries (Jan 2026)", "Levy disputes are not TP, but export valuations of gold sold to related buyers are a URA audit focus"],
              ["Coffee and other quoted commodities", "No reported Ugandan TP case found", "Apply OECD TPG paras 2.18–2.22: quoted price on the contract pricing date, adjusted for grade, quantity, freight and timing"],
            ],
          },
          { type: "p", text: "Documentation for a commodity exporter: the sale contract and pricing date, the quoted reference price that day, a schedule of adjustments (quality differential, freight, insurance, payment terms), and the margin earned by any related trading hub with its functions." },
        ],
        sources: ["tpBondo", "tpEABL", "bfEABL", "monitorGold"],
      },
      {
        id: "tp-restructurings",
        title: "Business restructurings and changes of ownership",
        tags: ["TP", "Restructuring", "CGT", "Case law"],
        flags: ["verify"],
        summary: "Offshore ownership changes, loss restrictions, IP migrations and recharacterisation.",
        body: [
          {
            type: "list",
            items: [
              "Offshore ownership change: Kuku Foods Uganda Ltd v URA, TAT 54 of 2025 (May 2026): a change in ownership of the KFC operator through non-resident shareholders was taxable; the UGX 4.2bn assessment was sent back for recomputation.",
              "Losses after a change in control: the Income Tax Act restricts carried-forward losses where underlying ownership changes substantially; check the current section in Cap. 338 before a deal. URA also cut Kuku Foods' declared losses from UGX 16.8bn to 8.3bn in an earlier audit.",
              "Transfers of intangibles: a trademark assigned out of Uganda for no disclosed consideration, then licensed back, failed in Mini Bakeries (2026); the Tribunal looked at who performs DEMPE functions, not who holds title.",
              "Recharacterisation: URA may recharacterise or disregard a transaction that is part of an avoidance scheme or lacks substantial economic effect; from 1 July 2026, s.115A also requires the taxpayer to price the restructuring itself at arm's length.",
            ],
          },
          { type: "callout", tone: "action", text: "Before any restructuring, document the business reasons, the options realistically available to the Ugandan entity (OECD TPG Chapter IX), any exit compensation for functions or intangibles transferred, and the Ugandan tax on any change in underlying ownership." },
        ],
        sources: ["monitorKuku", "matookeKuku", "tpMiniBakeries", "mmaksTP"],
      },
      {
        id: "tp-treaties-map",
        title: "Treaties, MAP and corresponding adjustments",
        tags: ["TP", "Treaties", "MAP", "International"],
        flags: ["verify"],
        summary: "Nine listed treaties; special relationship clauses; MAP exists on paper but is rarely used.",
        body: [
          {
            type: "list",
            items: [
              "Treaties listed in force: Denmark, India, Italy, Mauritius, Netherlands, Norway, South Africa, United Kingdom, Zambia. Check rates in each treaty text.",
              "Uganda–Mauritius: amendments were agreed and reported as awaiting ratification, giving Uganda taxing rights over hydrocarbon transactions. Confirm which version applies to the year in issue.",
              "Special relationship clauses: in Mini Bakeries, Article 12(6) of the Uganda–Mauritius treaty limited the treaty royalty rate to the arm's length amount, so Uganda kept full taxing rights over the excess.",
              "Beneficial ownership and substance: URA denies treaty rates where the recipient lacks substance or is not the beneficial owner; the Income Tax Act also limits treaty relief where the treaty-country recipient is mostly owned by non-residents of that country (verify the current section). Characterisation of fees under treaties was considered in Allied Beverage Company Ltd v URA, High Court 0039 of 2022 (Sept 2024).",
              "MAP: treaties carry a mutual agreement article and the TP Regulations provide for corresponding adjustments, but URA has published no MAP guidance and MAP use is rare. MAP does not stop the 45- or 30-day domestic clocks.",
              "Information exchange: Uganda exchanges information under its treaties, the Multilateral Convention (MAAC) and the CRS agreement. In ATC Uganda, the foreign parent's books were relied on to show interest had been paid.",
            ],
          },
          { type: "callout", tone: "action", text: "Lodge a MAP request within the treaty's time limit while running the domestic objection in parallel." },
        ],
        sources: ["pwcTreaties", "eaMauritius", "tpMiniBakeries", "tpAllied", "mmaksTP", "tpATC"],
      },
      {
        id: "tp-worked-examples",
        title: "Worked examples",
        tags: ["TP", "Examples", "TNMM", "CUP", "Loans", "Services"],
        summary: "TNMM distributor, services recharge, intra-group loan and coffee CUP, with the tax effect.",
        body: [
          { type: "callout", tone: "info", text: "Illustrative figures only, at the 30% corporate rate; interest and penal tax would come on top. Uganda has no statutory rule on which point of the range URA adjusts to, so these assume the median, as URA commonly argues." },
          { type: "h", text: "Example A — TNMM for a Ugandan distributor" },
          { type: "p", text: "Kampala Distributors Ltd buys goods from its Kenyan parent and resells them." },
          {
            type: "table",
            headers: ["Item", "UGX m"],
            rows: [
              ["Sales", "10,000"],
              ["Cost of goods (from parent)", "(8,200)"],
              ["Operating expenses", "(1,500)"],
              ["Operating profit", "300"],
              ["Operating margin", "3.0%"],
              ["Comparables' interquartile range", "3.5% – 6.2%"],
              ["Median", "4.8%"],
              ["Arm's length profit at median (4.8% × 10,000)", "480"],
              ["Adjustment (480 − 300)", "180"],
              ["Additional income tax (30%)", "54"],
            ],
          },
          { type: "p", text: "If the margin had been 3.6%, it would sit inside the range and no adjustment should follow. Keep the search strategy and rejection reasons: the benchmark in Mini Bakeries failed for want of a functional analysis." },
          { type: "h", text: "Example B — Head-office services recharge" },
          { type: "p", text: "A group cost pool of UGX 400m is allocated to the Ugandan subsidiary by headcount (25%) with a 5% mark-up." },
          {
            type: "table",
            headers: ["Item", "As charged (UGX m)", "Arm's length (UGX m)"],
            rows: [
              ["Cost pool", "400", "400"],
              ["Less shareholder activities (20% of pool)", "—", "(80)"],
              ["Chargeable pool", "400", "320"],
              ["Uganda share (25%)", "100", "80"],
              ["Mark-up 5%", "5", "4"],
              ["Charge", "105", "84"],
            ],
          },
          {
            type: "list",
            items: [
              "Disallowed deduction: 105 − 84 = UGX 21m; tax at 30% = UGX 6.3m.",
              "WHT at 15% on the full 105m paid to the non-resident = UGX 15.75m, due regardless of deductibility.",
              "Reverse-charge VAT at 18% on the imported service = UGX 18.9m (claimable as input tax only if the subsidiary makes taxable supplies).",
            ],
          },
          { type: "h", text: "Example C — Intra-group loan" },
          { type: "p", text: "A Ugandan subsidiary borrows US$2m from its parent at 12%. Benchmarking on its standalone rating gives an arm's length range of 7.5%–9.0%. Tax EBITDA is US$500,000, and the subsidiary is in a group under s.25." },
          {
            type: "table",
            headers: ["Step", "US$"],
            rows: [
              ["Interest charged (12% × 2m)", "240,000"],
              ["Arm's length interest, top of range (9% × 2m)", "180,000"],
              ["1. TP disallowance (240,000 − 180,000)", "60,000"],
              ["30% cap (30% × 500,000)", "150,000"],
              ["2. Interest above cap (180,000 − 150,000), carried forward", "30,000"],
              ["Deductible this year", "150,000"],
              ["Tax on disallowed 90,000 at 30%", "27,000"],
              ["WHT at 15% on interest paid (240,000)", "36,000"],
            ],
          },
          { type: "p", text: "The US$60,000 TP excess is lost permanently; the US$30,000 above the cap can be carried forward. Following Mini Bakeries, WHT already paid on the excess is not refunded." },
          { type: "h", text: "Example D — Commodity CUP (coffee)" },
          { type: "p", text: "A Ugandan exporter sells 1,000,000 kg to a related Swiss trading company at US$3.10/kg. The quoted price on the contract date, adjusted for grade and freight, is US$3.45/kg." },
          {
            type: "table",
            headers: ["Item", "US$"],
            rows: [
              ["Price gap per kg (3.45 − 3.10)", "0.35"],
              ["Understated income (0.35 × 1,000,000)", "350,000"],
              ["Additional tax (30%)", "105,000"],
            ],
          },
          { type: "p", text: "The defence is in the detail: a different pricing date, a lower grade, or payment terms can close the gap. Bondo Tea shows that URA's own figures must use a recognised method too." },
        ],
        sources: ["tpMiniBakeries", "tpBondo", "mmaksTP"],
      },
      {
        id: "tp-local-file-template",
        title: "Local file template (2012 Practice Note)",
        tags: ["TP", "Documentation", "Template"],
        summary: "Four-part skeleton following the Practice Note, updated for what URA now tests.",
        body: [
          { type: "p", text: "The 2012 Practice Note sets four parts; this skeleton follows them and adds what the 2024–26 cases show URA now tests." },
          { type: "h", text: "Part A — Company and functional details" },
          {
            type: "list",
            ordered: true,
            items: [
              "Group structure chart with ownership percentages; identify every associate under ITA s.3.",
              "Ugandan entity's business, strategy, key competitors and economic circumstances for the year.",
              "Functional analysis per transaction: functions performed, assets used, risks assumed and who controls each risk.",
              "For intangibles: who performs each DEMPE function (development, enhancement, maintenance, protection, exploitation) and who funds it.",
            ],
          },
          { type: "h", text: "Part B — Transactions and comparables" },
          {
            type: "list",
            ordered: true,
            items: [
              "Schedule of controlled transactions: counterparty, type, amount, currency, agreement reference.",
              "Copies of intercompany agreements and amendments, checked against actual conduct.",
              "Comparables search: databases, dates, screening criteria, accept/reject matrix with reasons.",
              "Comparability adjustments (working capital, risk, accounting differences) and their basis.",
            ],
          },
          { type: "h", text: "Part C — Arm's length determination" },
          {
            type: "list",
            ordered: true,
            items: [
              "Method chosen and why the others were rejected (Reg. 7).",
              "Tested party and profit level indicator.",
              "Range, median and the entity's result for each year.",
              "Services: benefit evidence per service, shareholder-cost exclusions, allocation keys.",
              "Loans: credit rating analysis, options realistically available, interest cap computation under s.25.",
              "Cost contribution arrangements: participants, scope, contributions, sharing method, entry and exit terms.",
            ],
          },
          { type: "h", text: "Part D — Summary and conclusion" },
          {
            type: "list",
            ordered: true,
            items: [
              "Conclusion per transaction, and any year-end adjustment made in the return.",
              "Reconciliation of transaction amounts to the audited accounts and to WHT and VAT returns.",
              "Sign-off: preparer, reviewer, date (must be before the return due date).",
            ],
          },
        ],
        sources: ["gazette2012", "mmaksTP"],
      },
      {
        id: "tp-checklist",
        title: "TP compliance checklist for 2026/27",
        tags: ["TP", "Checklist"],
        summary: "Six steps before the FY 2026/27 return.",
        body: [
          {
            type: "checklist",
            items: [
              "Map every related-party flow, domestic and cross-border; test the UGX 500m domestic threshold.",
              "Refresh the local file before filing the FY 2026/27 return, with a real functional analysis per transaction.",
              "For royalties: evidence of who performs DEMPE functions; consider whether software fees now attract 15% WHT.",
              "For loans: credit rating, realistic alternatives, and the 30% EBITDA cap on gross interest.",
              "For service charges: benefit evidence (deliverables, timesheets, allocation keys).",
              "Align VAT and WHT treatment with the TP position before invoices go out.",
            ],
          },
        ],
        sources: [],
      },
    ],
  },

  // =========================================================================
  {
    id: "latest-updates",
    label: "Latest updates",
    summary:
      "The FY 2026/27 package is in force from 1 July 2026; the Income Tax and Excise Acts were vetoed in July, amended on two points, and then assented with effect from 1 July. The next deadline that matters is 30 June 2027 for the interest and penalty waiver.",
    // Update log, newest first. `date` is ISO where exact; `dateLabel` is what to display.
    updates: [
      { date: "2026-08-21", dateLabel: "21 Aug 2026", kind: "case", text: "Mini Bakeries v URA: TP royalty and loan adjustments upheld.", source: "tpMiniBakeries" },
      { date: "2026-08-20", dateLabel: "20 Aug 2026 (reported)", kind: "law", text: "Income Tax (Amendment) Act, 2026 assented, effective 1 July 2026; amend July–August PAYE returns filed at old rates.", source: "accountsOsPaye", flag: "verify" },
      { date: "2026-08-04", dateLabel: "4 Aug 2026", kind: "law", text: "Parliament adopts the President's recommendations: plastics excise stays at 2.5% or US$70/tonne; land-based casino winnings no longer exempt from the 15% WHT.", source: "parlAdopt" },
      { date: "2026-08-04", dateLabel: "4 Aug 2026", kind: "case", text: "Medisell v URA: UGX 1.006bn variance assessment rejected.", source: "monitorMedisell" },
      { date: "2026-07-14", dateLabel: "14 Jul 2026", kind: "law", text: "President returns the Income Tax and Excise Duty Bills unsigned (casino WHT exemption; 25% plastics duty).", source: "parlVeto" },
      { date: "2026-07-01", dateLabel: "1 Jul 2026", kind: "law", text: "FY 2026/27 Acts commence (VAT, TPC, Stamp Duty, External Trade, Lotteries and Gaming).", source: "eyActs2026" },
      { date: "2026-06-30", dateLabel: "30 Jun 2026", kind: "case", text: "Munyanga v URA: late objection decision void after taxpayer's election.", source: "pwcMunyanga" },
      { date: "2026-06-30", dateLabel: "30 Jun 2026", kind: "admin", text: "Deadline passed for waiver of interest and penalties on principal outstanding at 30 June 2024.", source: "uraWaiver" },
      { date: "2026-06-23", dateLabel: "23 Jun 2026", kind: "admin", text: "URA publishes guidance on the FY 2026/27 amendments.", source: "regfollower" },
      { date: "2026-06-02", dateLabel: "Jun 2026 (reported)", kind: "case", text: "Jaala Higenyi v URA (High Court): distrained asset counts towards the 30% deposit.", source: "ensDeposit" },
      { date: "2026-05-29", dateLabel: "29 May 2026", kind: "case", text: "Ericsson AB v URA: VAT/income tax variance assessment largely set aside.", source: "eyEricsson" },
      { date: "2026-05-18", dateLabel: "18 May 2026", kind: "law", text: "President assents to VAT, TPC, Stamp Duty, External Trade and Lotteries and Gaming Amendment Acts.", source: "eyActs2026" },
      { date: "2026-05-15", dateLabel: "May 2026", kind: "case", text: "Kuku Foods v URA: offshore ownership change taxable; assessment to be recomputed.", source: "monitorKuku" },
      { date: "2026-04-27", dateLabel: "27 Apr 2026", kind: "case", text: "East African Investments v URA (Commercial Division) on interest owed when URA retains taxpayer money.", source: "btEastAfricanInv" },
      { date: "2026-04-23", dateLabel: "21–23 Apr 2026", kind: "law", text: "Parliament passes the Bills; rejects a 0.5% minimum tax on businesses with losses for 7+ years, a tax on diaspora (kyeyo) remittances, and a tax on gains from personal assets.", source: "onyango" },
      { date: "2026-04-07", dateLabel: "7 Apr 2026", kind: "admin", text: "WHT exemption window opens for July–December 2026 (six-month cycle).", source: "uraWhtWindow" },
      { date: "2026-03-27", dateLabel: "27 Mar 2026", kind: "case", text: "ATC Uganda v URA (Court of Appeal): WHT due on capitalised interest.", source: "tpATC" },
    ],
    articles: [
      {
        id: "fy2026-other-changes",
        title: "FY 2026/27 changes not covered in the practice notes",
        tags: ["2026 amendments", "Excise", "Waivers", "Gaming"],
        flags: ["sources-differ"],
        summary: "Arrears waivers, gaming tax, excise rates, external trade levies, exemptions.",
        body: [
          {
            type: "table",
            headers: ["Area", "Change", "Note"],
            rows: [
              ["Arrears waiver, TPC s.47C", "All tax, penal tax and interest owed at 30 June 2016 and still outstanding is waived.", "Automatic; confirm the ledger has been cleared."],
              ["Interest/penalty waiver, TPC s.47D", "Interest and penalties outstanding at 30 June 2025 are waived if the principal is paid by 30 June 2027.", "Partial payment: check URA's notice on pro-rata relief."],
              ["Gaming tax (Lotteries and Gaming Act Cap. 334)", "Single rate of 30% of stakes less payouts; betting was 20%.", "\"Payouts\" now defined."],
              ["Excise duty (Cap. 336)", "Petrol UGX 1,750/l; diesel UGX 1,430/l; sugar UGX 200/kg; cement UGX 750 per 50kg; imported spirits 80% or UGX 3,500/l; motorcycles at first registration UGX 500,000; cooking oil UGX 400/l; cooking fat UGX 500 per l/kg; paints 3% local / 10% imported (with specific minimums).", "Plastics stays at 2.5% or US$70/tonne after the veto."],
              ["External trade (Cap. 69)", "30% environmental levy on CIF value of second-hand clothing and worn articles; vaccines, medicines, medical supplies and agro-chemicals exempt from infrastructure levy and import declaration fee.", ""],
              ["Exempt income (ITA s.21)", "Hotel/tourism developers investing US$10m (foreign) or US$5m (citizen) with 70% local sourcing and staffing; \"infrastructure bond\" widened (maturity 10+ years).", "Bujagali exemption extended; sources differ: to 2032 (EY) or 2030 (Onyango)."],
              ["Bad debts (ITA s.24)", "Deduction extended to microfinance deposit-taking and Tier 4 institutions.", ""],
              ["VAT exemptions", "Nuclear energy projects exempt; BADEA added as a public international organisation.", ""],
            ],
          },
        ],
        sources: ["eyActs2026", "onyango", "parlAdopt"],
      },
      {
        id: "dates-to-watch",
        title: "Dates to watch",
        tags: ["Deadlines"],
        summary: "WHT exemption window, s.47D waiver deadline, FY 2027/28 Bills.",
        body: [
          {
            type: "list",
            items: [
              "Next WHT exemption window for January–June 2027 (expect a URA notice in late 2026).",
              "30 June 2027: last day to pay principal and get the s.47D waiver.",
              "April 2027: FY 2027/28 Bills expected to be tabled; Parliament's review of the plastics excise was deferred pending further study.",
            ],
          },
        ],
        sources: ["uraWhtWindow", "eyActs2026", "parlAdopt"],
      },
      {
        id: "on-the-radar",
        title: "Also on the radar",
        tags: ["Interest", "Gold", "Treaties", "Case law"],
        summary: "Interest rulings, Africa Oil, gold levy recovery, Uganda–Mauritius treaty amendments.",
        body: [
          {
            type: "table",
            headers: ["Date", "Item"],
            rows: [
              ["Jul 2026 (reported)", "Supreme Court (URA v Airtel) and High Court (Pentecostal Assemblies) rulings put tax interest in the spotlight; refund interest rules differ between income tax and VAT."],
              ["May 2026", "Africa Oil Ltd v URA (TAT): forex losses are not interest under the 30% cap; UGX 549m disallowance defeated."],
              ["Jan 2026", "IGG directs URA to recover UGX 38.7bn in gold export levy arrears from five refineries."],
              ["Pending", "Uganda–Mauritius treaty amendments awaiting ratification."],
            ],
          },
        ],
        sources: ["ensInterest", "monitorAfricaOil", "monitorGold", "eaMauritius"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Case index (feeds search and judgment alerts)
// ---------------------------------------------------------------------------
export const CASE_INDEX = [
  { name: "Mini Bakeries Uganda Ltd v URA", citation: "TAT App. 330 of 2025", year: 2026, tabs: ["transfer-pricing"], topic: "DEMPE royalty; intra-group loans", source: "tpMiniBakeries" },
  { name: "Medisell Uganda Ltd v URA", citation: "TAT", year: 2026, tabs: ["practice-notes"], topic: "Variance assessments", source: "monitorMedisell" },
  { name: "Munyanga Development Ltd v URA", citation: "TAT App. 73 of 2026", year: 2026, tabs: ["appeal-strategy"], topic: "90-day deemed allowance", source: "pwcMunyanga" },
  { name: "Ericsson AB v URA", citation: "TAT App. 60 of 2020", year: 2026, tabs: ["practice-notes", "appeal-strategy"], topic: "VAT/IT variance; agency notice", source: "eyEricsson" },
  { name: "Dr Jaala Higenyi Alfred v URA", citation: "High Court", year: 2026, tabs: ["appeal-strategy"], topic: "30% deposit: distrained asset", source: "ensDeposit" },
  { name: "Kuku Foods Uganda Ltd v URA", citation: "TAT 54 of 2025", year: 2026, tabs: ["practice-notes", "transfer-pricing"], topic: "Offshore change of ownership", source: "monitorKuku" },
  { name: "East African Investments Ltd v URA", citation: "High Court (Commercial)", year: 2026, tabs: ["appeal-strategy"], topic: "Interest on retained money", source: "btEastAfricanInv" },
  { name: "ATC Uganda Ltd v URA", citation: "Court of Appeal CA 220 of 2022", year: 2026, tabs: ["transfer-pricing", "practice-notes"], topic: "WHT on capitalised interest", source: "tpATC" },
  { name: "Africa Global Logistics Uganda Ltd v URA", citation: "TAT", year: 2025, tabs: ["appeal-strategy"], topic: "ADR does not extend time", source: "btAfricaGlobal" },
  { name: "Rwenzori Commodities Ltd v URA", citation: "TAT App. 36 of 2024", year: 2025, tabs: ["transfer-pricing", "practice-notes"], topic: "30% EBITDA cap on gross interest", source: "tpRwenzori" },
  { name: "Game Discount World (U) Ltd v URA", citation: "TAT", year: 2025, tabs: ["appeal-strategy"], topic: "Time-barred application", source: "gameDiscount" },
  { name: "SMEC International Ltd v URA", citation: "TAT App. 75 of 2019", year: 2024, tabs: ["transfer-pricing"], topic: "Benefit test, head-office costs", source: "tpSMEC" },
  { name: "Allied Beverage Company Ltd v URA", citation: "High Court Case 0039 of 2022", year: 2024, tabs: ["transfer-pricing"], topic: "Brand/marketing fees, treaty", source: "tpAllied" },
  { name: "Canaan Sites v URA", citation: "TAT; settled on appeal", year: 2024, tabs: ["practice-notes"], topic: "VAT on unimproved land", source: "ugandanzCanaan" },
  { name: "Essential Auto Parts Ltd v URA", citation: "TAT App. 180 of 2022", year: 2023, tabs: ["appeal-strategy"], topic: "Timelines", source: "essentialAuto" },
  { name: "Bondo Tea Estates Ltd v URA", citation: "TAT 65 of 2018", year: 2021, tabs: ["transfer-pricing"], topic: "Commodity pricing", source: "tpBondo" },
  { name: "Fuelex (U) Ltd v URA", citation: "Constitutional Court", year: 2020, tabs: ["appeal-strategy"], topic: "30% rule: non-quantum disputes", source: "mondaqFuelex" },
  { name: "East African Breweries International Ltd v URA", citation: "TAT 14 of 2017", year: 2020, tabs: ["transfer-pricing"], topic: "Regional distribution (outcome: sources differ)", source: "tpEABL", flag: "sources-differ" },
  { name: "Uganda Projects Implementation & Management Centre v URA", citation: "SC Const. Appeal 2 of 2009", year: 2010, tabs: ["appeal-strategy"], topic: "30% rule constitutional", source: "scUgandaProjects" },
  { name: "URA v Uganda Consolidated Properties Ltd", citation: "CA Civil Appeal 31 of 2000", year: null, tabs: ["appeal-strategy"], topic: "Timelines are substantive law", source: "essentialAuto" },
  { name: "CIC Africa (U) Ltd v URA", citation: "High Court", year: null, tabs: ["appeal-strategy"], topic: "ADR outcome final", source: "btAfricaGlobal" },
  { name: "Vivo Energy v URA", citation: "TAT", year: null, tabs: ["appeal-strategy"], topic: "Bank guarantee is not payment of the 30%", source: "ensDeposit" },
  { name: "Eram Uganda v URA", citation: "TAT", year: null, tabs: ["appeal-strategy"], topic: "Refund offset satisfies the 30%", source: "ensDeposit" },
  { name: "A Better Place Uganda Ltd v URA", citation: "TAT", year: null, tabs: ["appeal-strategy"], topic: "Compliance order instead of dismissal", source: "ensDeposit" },
  // Added in the November 2026 expansion
  { name: "Africa Oil Ltd v URA", citation: "TAT", year: 2026, tabs: ["transfer-pricing", "latest-updates"], topic: "Forex loss is not interest under the 30% cap", source: "monitorAfricaOil" },
  { name: "Commissioner General, URA v Airtel (Celtel)", citation: "Supreme Court", year: null, tabs: ["practice-notes", "appeal-strategy"], topic: "Penal tax accrues during objection", source: "ensInterest" },
  { name: "Mbanza Martin Kalemera v Attorney General", citation: "Constitutional Court", year: null, tabs: ["practice-notes"], topic: "Income tax refund interest from application", source: "ensInterest" },
  { name: "URA v Pentecostal Assemblies of God", citation: "High Court", year: null, tabs: ["practice-notes"], topic: "VAT refund interest 2% a month, compounded", source: "ensInterest" },
  { name: "Century Bottling Company v URA", citation: "TAT", year: 2020, tabs: ["appeal-strategy"], topic: "Instalments for the 30% deposit", source: "ensCentury" },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
export const getTab = (tabId) => HUB_TABS.find((t) => t.id === tabId);

export const resolveSources = (keys = []) =>
  keys.map((k) => SOURCES[k]).filter(Boolean);

/** Flattens every block in an article to plain text (for search indexing). */
export const articleText = (article) =>
  [
    article.title,
    article.summary,
    ...(article.tags || []),
    ...article.body.flatMap((b) => {
      if (b.type === "p" || b.type === "h" || b.type === "callout") return [b.text];
      if (b.type === "list" || b.type === "checklist") return b.items;
      if (b.type === "table") return [...b.headers, ...b.rows.flat()];
      return [];
    }),
  ]
    .join(" ")
    .toLowerCase();

/** Case-insensitive search across all articles; returns [{ tabId, article }]. */
export const searchHub = (query) => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return HUB_TABS.flatMap((tab) =>
    tab.articles
      .filter((a) => articleText(a).includes(q))
      .map((article) => ({ tabId: tab.id, article }))
  );
};
