export interface TaxRuleSet {
  effectiveFrom: string;
  individualResident: {
    threshold: number;
    rate: number;
  };
  individualNonResident: {
    rate: number;
  };
  corporate: {
    deemedDeductionRate: number;
    corporateRate: number;
  };
  vat?: {
    standardRate: number;
    registrationThresholdAnnual: number;
    registrationThresholdQuarterly: number;
    dueDay: number;
  };
  paye?: {
    monthlyTaxFreeThreshold: number;
    annualTaxFreeThreshold: number;
    topRateThresholdMonthly: number;
    topRate: number;
  };
  presumptive?: {
    lowerTurnover: number;
    upperTurnover: number;
  };
}

export const CURRENT_TAX_RULES: TaxRuleSet = {
  effectiveFrom: "2026-07-01",
  individualResident: {
    threshold: 2820000,
    rate: 0.12,
  },
  individualNonResident: {
    rate: 0.15,
  },
  corporate: {
    deemedDeductionRate: 0.50,
    corporateRate: 0.30,
  },
  vat: {
    standardRate: 0.18,
    registrationThresholdAnnual: 300000000, // Enacted in VAT (Amendment) Act 2026 (UGX 300M)
    registrationThresholdQuarterly: 75000000,
    dueDay: 15,
  },
  paye: {
    monthlyTaxFreeThreshold: 335000,
    annualTaxFreeThreshold: 4020000,
    topRateThresholdMonthly: 10000000,
    topRate: 0.40,
  },
  presumptive: {
    lowerTurnover: 10000000,
    upperTurnover: 150000000,
  },
};

export const TAX_RULE_HISTORY: TaxRuleSet[] = [
  {
    effectiveFrom: "2022-07-01",
    individualResident: {
      threshold: 2820000,
      rate: 0.12,
    },
    individualNonResident: {
      rate: 0.15,
    },
    corporate: {
      deemedDeductionRate: 0.50,
      corporateRate: 0.30,
    },
    vat: {
      standardRate: 0.18,
      registrationThresholdAnnual: 150000000,
      registrationThresholdQuarterly: 37500000,
      dueDay: 15,
    },
  },
];

