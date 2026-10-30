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

export interface WorkedExample {
  scenario: string;
  lines: WorkedExampleLine[];
  total: WorkedExampleTotal;
}

export interface TaxGuideSections {
  whatItIs: string;
  whoApplies: string[];
  rates: TaxRate[];
  filing: string[];
  example: WorkedExample;
  mistakes: string[];
  legal: string[];
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
