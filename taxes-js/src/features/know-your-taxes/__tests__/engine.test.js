import { describe, expect, it } from "vitest";
import { assess } from "../engine/assess";
import { bandTax } from "../engine/calculators";
import { SEED_RULES } from "../rules/seed-rules";
import { SOURCES } from "../rules/sources";
const AS_OF = "2026-10-19";
const run = (a) => assess(a, SEED_RULES, AS_OF);
const status = (r, code) => r.obligations.find((o) => o.code === code)?.status;
const likely = (r) =>
  r.obligations
    .filter((o) => o.status === "LIKELY")
    .map((o) => o.code)
    .sort();
// ── Seven reference profiles ────────────────────────────────────────────────
const salaried = {
  entityType: "INDIVIDUAL",
  residency: "RESIDENT",
  isEmployed: true,
  monthlySalary: 1_500_000,
  hasBusiness: false,
  hasRentalIncome: false,
  hasEmployees: false,
  hasForeignIncome: false,
  soldBusinessAssetsOrShares: false,
};
const smallBusiness = {
  entityType: "SOLE_PROPRIETOR",
  residency: "RESIDENT",
  businessActivities: ["TRADING"],
  annualTurnover: 60_000_000,
  vatRegistered: "NO",
  hasRentalIncome: false,
  hasEmployees: false,
  paysSuppliers: true,
  isDesignatedWhtAgent: "NO",
  paysNonResidents: false,
  hasForeignIncome: false,
  importsGoods: false,
  importsServices: false,
  soldBusinessAssetsOrShares: false,
};
const vatCompany = {
  entityType: "COMPANY",
  residency: "RESIDENT",
  businessActivities: ["TRADING"],
  annualTurnover: 900_000_000,
  annualProfit: 120_000_000,
  vatRegistered: "YES",
  hasRentalIncome: false,
  hasEmployees: false,
  paysSuppliers: true,
  isDesignatedWhtAgent: "YES",
  paysNonResidents: false,
  hasForeignIncome: false,
  importsGoods: true,
  importsServices: true,
  soldBusinessAssetsOrShares: false,
};
const landlord = {
  entityType: "INDIVIDUAL",
  residency: "RESIDENT",
  isEmployed: false,
  hasBusiness: false,
  hasRentalIncome: true,
  annualRentalIncome: 24_000_000,
  hasEmployees: false,
  hasForeignIncome: false,
  soldBusinessAssetsOrShares: false,
};
const freelancer = {
  entityType: "INDIVIDUAL",
  residency: "RESIDENT",
  isEmployed: false,
  hasBusiness: true,
  businessActivities: ["PROFESSIONAL"],
  annualTurnover: 80_000_000,
  annualProfit: 50_000_000,
  vatRegistered: "NO",
  hasRentalIncome: false,
  hasEmployees: false,
  paysSuppliers: false,
  paysNonResidents: false,
  hasForeignIncome: true,
  importsGoods: false,
  importsServices: false,
  soldBusinessAssetsOrShares: false,
};
const employerCo = {
  entityType: "COMPANY",
  residency: "RESIDENT",
  businessActivities: ["SERVICES"],
  annualTurnover: 200_000_000,
  vatRegistered: "NO",
  hasRentalIncome: false,
  hasEmployees: true,
  employeeCount: 12,
  monthlyPayroll: 18_000_000,
  paysSuppliers: true,
  isDesignatedWhtAgent: "UNSURE",
  paysNonResidents: false,
  hasForeignIncome: false,
  importsGoods: false,
  importsServices: false,
  soldBusinessAssetsOrShares: false,
};
const multi = {
  entityType: "INDIVIDUAL",
  residency: "RESIDENT",
  isEmployed: true,
  monthlySalary: 3_000_000,
  hasBusiness: true,
  businessActivities: ["SERVICES"],
  annualTurnover: 200_000_000,
  annualProfit: 40_000_000,
  vatRegistered: "NO",
  hasRentalIncome: true,
  annualRentalIncome: 12_000_000,
  hasEmployees: false,
  paysSuppliers: false,
  paysNonResidents: false,
  hasForeignIncome: false,
  importsGoods: false,
  importsServices: false,
  otherIncome: ["INTEREST"],
  soldBusinessAssetsOrShares: true,
};
describe("reference profiles", () => {
  it("salaried employee: PAYE only, no business taxes", () => {
    const r = run(salaried);
    expect(status(r, "PAYE_EMPLOYEE")).toBe("LIKELY");
    for (const c of ["VAT", "CORPORATE_INCOME_TAX", "PRESUMPTIVE_TAX", "PAYE_EMPLOYER"]) {
      expect(status(r, c) === undefined || status(r, c) === "NOT_APPLICABLE").toBe(true);
    }
  });
  it("small business: presumptive, no VAT, no CIT", () => {
    const r = run(smallBusiness);
    expect(status(r, "PRESUMPTIVE_TAX")).toBe("LIKELY");
    expect(status(r, "VAT")).toBe("NOT_APPLICABLE");
    expect(status(r, "CORPORATE_INCOME_TAX")).toBeUndefined();
    expect(status(r, "WHT_AGENT")).toBe("NOT_APPLICABLE");
    const pres = r.obligations.find((o) => o.code === "PRESUMPTIVE_TAX");
    expect(pres.estimate.amount).toBe(400_000); // 60m, no records answer → fixed amount
    expect(pres.followUpQuestionIds).toContain("keepsRecords");
  });
  it("VAT-registered company: CIT, VAT, WHT agent, imports, reverse charge", () => {
    const r = run(vatCompany);
    for (const c of ["CORPORATE_INCOME_TAX", "VAT", "WHT_AGENT", "IMPORT_DUTIES", "WHT_IMPORTS", "VAT_REVERSE_CHARGE"]) {
      expect(status(r, c)).toBe("LIKELY");
    }
    expect(status(r, "PRESUMPTIVE_TAX")).toBeUndefined();
    expect(r.obligations.find((o) => o.code === "CORPORATE_INCOME_TAX").estimate.amount).toBe(36_000_000);
  });
  it("landlord: rental tax estimated on gross above threshold", () => {
    const r = run(landlord);
    const o = r.obligations.find((x) => x.code === "RENTAL_TAX_INDIVIDUAL");
    expect(o.status).toBe("LIKELY");
    expect(o.estimate.amount).toBe(Math.round((24_000_000 - 2_820_000) * 0.12));
    expect(o.estimate.indicativeOnly).toBe(true);
    expect(status(r, "VAT")).toBeUndefined();
  });
  it("freelancer (professional): excluded from presumptive, taxed on profit, foreign income → review", () => {
    const r = run(freelancer);
    expect(status(r, "PRESUMPTIVE_TAX")).toBe("NOT_APPLICABLE");
    expect(status(r, "INDIVIDUAL_INCOME_TAX")).toBe("LIKELY");
    expect(status(r, "FOREIGN_INCOME")).toBe("PROFESSIONAL_REVIEW");
  });
  it("company with employees: employer PAYE + NSSF (as non-tax), WHT needs info", () => {
    const r = run(employerCo);
    expect(status(r, "PAYE_EMPLOYER")).toBe("LIKELY");
    const nssf = r.obligations.find((o) => o.code === "NSSF");
    expect(nssf.content.category).toBe("STATUTORY_CONTRIBUTION");
    expect(nssf.estimate.amount).toBe(18_000_000 * 0.15);
    expect(status(r, "WHT_AGENT")).toBe("NEEDS_INFO");
    expect(r.missingInformation.join(" ")).toMatch(/withholding agents/);
  });
  it("multiple sources: salary + business + rent + interest + asset sale", () => {
    const r = run(multi);
    expect(status(r, "PAYE_EMPLOYEE")).toBe("LIKELY");
    expect(status(r, "INDIVIDUAL_INCOME_TAX")).toBe("LIKELY");
    expect(status(r, "RENTAL_TAX_INDIVIDUAL")).toBe("LIKELY");
    expect(status(r, "INVESTMENT_INCOME_WHT")).toBe("LIKELY");
    expect(status(r, "CAPITAL_GAINS")).toBe("PROFESSIONAL_REVIEW");
    const iit = r.obligations.find((o) => o.code === "INDIVIDUAL_INCOME_TAX");
    expect(iit.estimate.workings.join(" ")).toMatch(/PAYE already withheld/);
  });
  it("does not assign the same obligations to every profile", () => {
    const sets = [salaried, smallBusiness, vatCompany, landlord, freelancer, employerCo, multi].map((p) =>
      likely(run(p)).join(","),
    );
    expect(new Set(sets).size).toBe(sets.length);
  });
});
describe("missing information", () => {
  it("unknown turnover → NEEDS_INFO with follow-up, never a guess", () => {
    const r = run({ entityType: "SOLE_PROPRIETOR", residency: "RESIDENT" });
    const pres = r.obligations.find((o) => o.code === "PRESUMPTIVE_TAX");
    expect(pres.status).toBe("NEEDS_INFO");
    expect(pres.followUpQuestionIds).toContain("annualTurnover");
    expect(status(r, "VAT")).toBe("NEEDS_INFO");
  });
  it("VAT turnover above threshold but not registered → LIKELY (must register)", () => {
    const r = run({ ...smallBusiness, annualTurnover: 400_000_000 });
    expect(status(r, "VAT")).toBe("LIKELY");
    expect(status(r, "PRESUMPTIVE_TAX")).toBe("NOT_APPLICABLE");
  });
  it("non-resident employee → professional review rather than resident bands", () => {
    expect(status(run({ ...salaried, residency: "NON_RESIDENT" }), "PAYE_EMPLOYEE")).toBe("PROFESSIONAL_REVIEW");
  });
});
describe("presumptive tax", () => {
  const est = (turnover, keepsRecords) =>
    run({ ...smallBusiness, annualTurnover: turnover, keepsRecords }).obligations.find((o) => o.code === "PRESUMPTIVE_TAX");
  it.each([
    // turnover,      fixed,    records
    [10_000_001, 80_000, 0],
    [25_000_000, 80_000, 60_000],
    [30_000_000, 80_000, 80_000], // upper value stays in its band
    [30_000_001, 200_000, 80_000],
    [45_000_000, 200_000, 155_000],
    [60_000_000, 400_000, 240_000],
    [80_000_000, 400_000, 360_000],
    [120_000_000, 900_000, 640_000],
    [150_000_000, 900_000, 850_000],
  ])("turnover %i → fixed %i, with records %i", (t, fixed, records) => {
    expect(est(t, "NO").estimate.amount).toBe(fixed);
    expect(est(t, "YES").estimate.amount).toBe(records);
  });
  it("records-based amount never exceeds the fixed amount", () => {
    for (let t = 10_500_000; t <= 150_000_000; t += 500_000) {
      expect(est(t, "YES").estimate.amount).toBeLessThanOrEqual(est(t, "NO").estimate.amount);
    }
  });
  it("exactly UGX 10m or below → not applicable; above 150m → ordinary income tax", () => {
    expect(est(10_000_000).status).toBe("NOT_APPLICABLE");
    expect(est(150_000_001).status).toBe("NOT_APPLICABLE");
    expect(status(run({ ...smallBusiness, annualTurnover: 150_000_001 }), "INDIVIDUAL_INCOME_TAX")).toBe("LIKELY");
  });
  it("unsure about records → fixed amount, records option shown, follow-up flagged as missing", () => {
    const o = est(60_000_000, "UNSURE");
    expect(o.estimate.amount).toBe(400_000);
    expect(o.estimate.workings.join(" ")).toMatch(/records-based amount applies instead.*UGX 240,000/);
    expect(o.missing.join(" ")).toMatch(/books of account/);
  });
  it("professionals are excluded regardless of turnover", () => {
    const r = run({ ...smallBusiness, businessActivities: ["PROFESSIONAL"], annualTurnover: 40_000_000 });
    expect(status(r, "PRESUMPTIVE_TAX")).toBe("NOT_APPLICABLE");
    expect(status(r, "INDIVIDUAL_INCOME_TAX")).toBe("LIKELY");
  });
  it("estimate is indicative (schedule pending verification) and cites the schedule source", () => {
    const o = est(60_000_000, "YES");
    expect(o.estimate.indicativeOnly).toBe(true);
    expect(o.content.legalBasis).toContain("UNU-WIDER-PRESUMPTIVE");
  });
});
describe("calculations", () => {
  it("band tax is progressive and correct", () => {
    const bands = [
      [0, 100, 0],
      [100, 200, 10],
      [200, Number.MAX_SAFE_INTEGER, 20],
    ];
    expect(bandTax(50, bands).tax).toBe(0);
    expect(bandTax(150, bands).tax).toBe(5);
    expect(bandTax(300, bands).tax).toBe(30);
  });
  it("PAYE at 1,500,000/month uses seed bands", () => {
    const o = run(salaried).obligations.find((x) => x.code === "PAYE_EMPLOYEE");
    // 75,000×20% + 75,000×25% + 1,015,000×30%
    expect(o.estimate.amount).toBe(15_000 + 18_750 + 304_500);
    expect(o.estimate.basis).toBe("ESTIMATE");
  });
  it("salary below tax-free band → not applicable, zero estimate", () => {
    const o = run({ ...salaried, monthlySalary: 300_000 }).obligations.find((x) => x.code === "PAYE_EMPLOYEE");
    expect(o.status).toBe("NOT_APPLICABLE");
    expect(o.estimate.amount).toBe(0);
  });
});
describe("legal citations & verification flags", () => {
  it("every rule's legal basis and param sources resolve to a known source", () => {
    for (const rule of SEED_RULES) {
      for (const id of rule.content.legalBasis) expect(SOURCES[id], `${rule.code} → ${id}`).toBeDefined();
      for (const p of rule.params)
        for (const id of p.sourceIds) expect(SOURCES[id], `${rule.code}.${p.key} → ${id}`).toBeDefined();
      for (const c of rule.content.consequences) for (const id of c.sourceIds) expect(SOURCES[id]).toBeDefined();
    }
  });
  it("only reviewer-signed params are VERIFIED (currently just the VAT threshold)", () => {
    const verified = SEED_RULES.flatMap((r) => r.params.map((p) => ({ code: r.code, ...p }))).filter(
      (p) => p.verification === "VERIFIED",
    );
    expect(verified.map((p) => `${p.code}.${p.key}`)).toEqual(["VAT.registrationThreshold"]);
    for (const p of verified) {
      expect(p.verifiedBy).toBeTruthy();
      expect(p.verifiedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
  it("verified VAT threshold is stated without a 'pending' caveat", () => {
    const r = run({ ...smallBusiness, annualTurnover: 400_000_000 });
    const vat = r.obligations.find((o) => o.code === "VAT");
    expect(vat.why[0]).toMatch(/UGX 300,000,000\./);
    expect(vat.why[0]).not.toMatch(/pending/);
    expect(vat.rateSummary.find((l) => l.startsWith("Annual VAT registration threshold"))).toBe(
      "Annual VAT registration threshold: UGX 300,000,000",
    );
    expect(vat.rateSummary.find((l) => l.startsWith("Standard VAT rate"))).toMatch(/pending verification/);
  });
  it("VAT threshold boundary: 300m is not above, 300m + 1 is", () => {
    expect(status(run({ ...smallBusiness, annualTurnover: 300_000_000 }), "VAT")).toBe("NOT_APPLICABLE");
    expect(status(run({ ...smallBusiness, annualTurnover: 300_000_001 }), "VAT")).toBe("LIKELY");
  });
  it("estimates using unverified params are flagged indicative and rate lines say so", () => {
    const o = run(salaried).obligations.find((x) => x.code === "PAYE_EMPLOYEE");
    expect(o.estimate.indicativeOnly).toBe(true);
    expect(o.rateSummary.every((l) => l.includes("pending verification"))).toBe(true);
  });
  it("rule lookup respects effective dates", () => {
    expect(() => assess(salaried, SEED_RULES, "2025-01-01")).toThrow(/No rule/);
  });
});
