export type TaxCategory =
  | "All"
  | "Indirect tax"
  | "Income tax"
  | "Employment"
  | "Property"
  | "Small business";

export interface KeyFact {
  label: string;
  value: string;
}

export interface TaxRate {
  name: string;
  rate: string;
  note: string;
}

export interface TaxGuideRateTable {
  caption?: string;
  columns: string[];
  rows: string[][];
}

export interface WorkedExampleLine {
  label: string;
  calc: string;
  amount: number;
}

export interface WorkedExampleTotal {
  label: string;
  amount: number;
  note: string;
}

export interface TaxGuideExample {
  title?: string;
  scenario: string;
  lines: WorkedExampleLine[];
  total: WorkedExampleTotal;
}

export interface TaxGuideSpecial {
  title: string;
  text: string;
}

export interface TaxGuidePenalty {
  item: string;
  penalty: string;
}

export interface TaxGuideFAQ {
  q: string;
  a: string;
}

export interface TaxGuideSource {
  title: string;
  url: string;
}

export interface TaxGuideSections {
  whatItIs: string;
  changes?: {
    title: string;
    points: string[];
  };
  whoApplies: string[];
  rates?: TaxRate[];
  rateTable?: TaxGuideRateTable;
  rateTables?: TaxGuideRateTable[];
  rateNotes?: string[];
  filing: string[];
  example?: TaxGuideExample;
  examples?: TaxGuideExample[];
  special?: TaxGuideSpecial[];
  penalties?: TaxGuidePenalty[];
  mistakes: string[];
  faqs?: TaxGuideFAQ[];
  legal: string[];
  sources?: TaxGuideSource[];
}

export interface TaxGuideCTA {
  label: string;
  href?: string;
  page?: string;
}

export interface TaxGuide {
  slug: string;
  title: string;
  short: string;
  category: TaxCategory;
  status: "published" | "draft";
  lastReviewed: string;
  tags: string[];
  summary: string;
  keyFacts: KeyFact[];
  sections: TaxGuideSections;
  cta?: TaxGuideCTA;
}
