import { LegalSource } from "../types";

const NUMBERING_NOTE =
  "Section reference uses commonly cited pre-revision numbering — confirm against the Revised Edition before verifying.";

export const SOURCES: Record<string, LegalSource> = {
  ITA: {
    id: "ITA",
    title: "Income Tax Act (as amended)",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    note: "Link to the consolidated Act on ULII during verification.",
  },
  "ITA-AMEND-2026": {
    id: "ITA-AMEND-2026",
    title: "Income Tax (Amendment) Act, 2026 — effective 1 July 2026",
    publisher: "Parliament of Uganda",
    url: "https://www.parliament.go.ug/",
    note: "Changes individual/PAYE bands (tax-free threshold UGX 335,000 per month), WHT measures and foreign-source income rules.",
  },
  "ITA-S116": {
    id: "ITA-S116",
    title: "Income Tax Act — PAYE: employer's duty to withhold tax from employment income",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    section: "s.116",
    note: NUMBERING_NOTE,
  },
  "ITA-S5": {
    id: "ITA-S5",
    title: "Income Tax Act — rental tax for individuals",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    section: "s.5",
    note: NUMBERING_NOTE,
  },
  "ITA-S119": {
    id: "ITA-S119",
    title: "Income Tax Act — withholding by Government and designated persons",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    section: "s.119",
    note: NUMBERING_NOTE,
  },
  "ITA-S83": {
    id: "ITA-S83",
    title: "Income Tax Act — tax on payments to non-residents",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    section: "s.83",
    note: NUMBERING_NOTE,
  },
  "ITA-PRESUMPTIVE": {
    id: "ITA-PRESUMPTIVE",
    title: "Income Tax Act — small business taxpayers (presumptive regime) and its Schedule of rates",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    note: NUMBERING_NOTE,
  },
  VATA: {
    id: "VATA",
    title: "Value Added Tax Act (as amended)",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
  },
  "VATA-S7": {
    id: "VATA-S7",
    title: "Value Added Tax Act — registration requirement and threshold",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
    section: "s.7",
    note: NUMBERING_NOTE,
  },
  "VATA-AMEND-2026": {
    id: "VATA-AMEND-2026",
    title: "Value Added Tax (Amendment) Act, 2026 — effective 1 July 2026",
    publisher: "Parliament of Uganda",
    url: "https://www.parliament.go.ug/",
    note: "Raises the VAT registration threshold to UGX 300m annual turnover (UGX 75m per quarter) from 1 July 2026.",
  },
  "UNU-WIDER-PRESUMPTIVE": {
    id: "UNU-WIDER-PRESUMPTIVE",
    title: "UNU-WIDER Technical Note 2024/1 — Uganda Revenue Authority presumptive tax data (schedule from 2020/21)",
    publisher: "Other",
    url: "https://wider.unu.edu/sites/default/files/Publications/Technical-note/PDF/tn2024-1-Uganda-Revenue-Authority-presumptive-tax-data.pdf",
    note: "Secondary source describing the schedule in the Income Tax Act; the Act itself is authoritative.",
  },
  TPCA: {
    id: "TPCA",
    title: "Tax Procedures Code Act (as amended) — registration, returns, penalties and interest",
    publisher: "ULII",
    url: "https://ulii.org/legislation/",
  },
  EACCMA: {
    id: "EACCMA",
    title: "East African Community Customs Management Act and EAC Common External Tariff",
    publisher: "Other",
    url: "https://www.eac.int/",
  },
  "URA-PORTAL": {
    id: "URA-PORTAL",
    title: "URA web portal — registration, returns and payment registration (PRN)",
    publisher: "URA",
    url: "https://ura.go.ug/",
  },
  "URA-EFRIS": {
    id: "URA-EFRIS",
    title: "URA EFRIS — Electronic Fiscal Receipting and Invoicing System",
    publisher: "URA",
    url: "https://efris.ura.go.ug/",
  },
  "NSSF-ACT": {
    id: "NSSF-ACT",
    title: "National Social Security Fund Act (as amended)",
    publisher: "NSSF",
    url: "https://www.nssfug.org/",
  },
  "LGA-LST": {
    id: "LGA-LST",
    title: "Local Governments Act — Local Service Tax and trading licences (administered by local governments / KCCA)",
    publisher: "Other",
    url: "https://www.kcca.go.ug/",
  },
};
