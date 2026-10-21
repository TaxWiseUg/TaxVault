import { describe, expect, it } from "vitest";
import { pruneHiddenAnswers, progress, QUESTIONS, visibleQuestions } from "../questionnaire";
import { AnswersSchema, parseAnswers } from "../validation";
const ids = (a) => visibleQuestions(a).map((q) => q.id);
describe("conditional questions", () => {
  it("salaried individual is never asked about VAT, turnover or imports", () => {
    const v = ids({ entityType: "INDIVIDUAL", isEmployed: true, hasBusiness: false });
    expect(v).toContain("monthlySalary");
    expect(v).not.toContain("vatRegistered");
    expect(v).not.toContain("annualTurnover");
    expect(v).not.toContain("importsGoods");
  });
  it("company is not asked employment or personal investment questions", () => {
    const v = ids({ entityType: "COMPANY" });
    expect(v).toContain("annualTurnover");
    expect(v).toContain("annualProfit");
    expect(v).not.toContain("isEmployed");
    expect(v).not.toContain("otherIncome");
  });
  it("follow-ups appear only after the parent answer", () => {
    expect(ids({ entityType: "INDIVIDUAL" })).not.toContain("annualRentalIncome");
    expect(ids({ entityType: "INDIVIDUAL", hasRentalIncome: true })).toContain("annualRentalIncome");
    expect(ids({ entityType: "COMPANY", paysSuppliers: true })).toContain("isDesignatedWhtAgent");
  });
  it("profit is asked of sole proprietors only when it matters", () => {
    expect(ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 50_000_000 })).not.toContain("annualProfit");
    expect(ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 400_000_000 })).toContain("annualProfit");
    expect(ids({ entityType: "SOLE_PROPRIETOR", businessActivities: ["PROFESSIONAL"] })).toContain("annualProfit");
  });
  it("books-of-account question only appears in the presumptive range for non-professionals", () => {
    expect(ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 60_000_000 })).toContain("keepsRecords");
    expect(ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 5_000_000 })).not.toContain("keepsRecords");
    expect(ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 400_000_000 })).not.toContain("keepsRecords");
    expect(
      ids({ entityType: "SOLE_PROPRIETOR", annualTurnover: 60_000_000, businessActivities: ["PROFESSIONAL"] }),
    ).not.toContain("keepsRecords");
    expect(ids({ entityType: "COMPANY", annualTurnover: 60_000_000 })).not.toContain("keepsRecords");
    expect(ids({ entityType: "INDIVIDUAL", hasBusiness: true, annualTurnover: 60_000_000 })).toContain("keepsRecords");
  });
  it("raising turnover out of the range drops a stale records answer", () => {
    expect(
      pruneHiddenAnswers({ entityType: "SOLE_PROPRIETOR", annualTurnover: 400_000_000, keepsRecords: "YES" }).keepsRecords,
    ).toBeUndefined();
  });
  it("going back and changing entity type drops now-hidden answers", () => {
    const pruned = pruneHiddenAnswers({ entityType: "COMPANY", isEmployed: true, monthlySalary: 2_000_000, annualTurnover: 5 });
    expect(pruned.isEmployed).toBeUndefined();
    expect(pruned.monthlySalary).toBeUndefined();
    expect(pruned.annualTurnover).toBe(5);
  });
  it("progress counts only visible questions", () => {
    const p = progress({ entityType: "INDIVIDUAL" });
    expect(p.answered).toBe(1);
    expect(p.total).toBe(visibleQuestions({ entityType: "INDIVIDUAL" }).length);
  });
});
describe("validation & data minimisation", () => {
  it("rejects unknown fields such as credentials", () => {
    expect(() => AnswersSchema.parse({ entityType: "INDIVIDUAL", uraPassword: "x" })).toThrow();
    expect(() => AnswersSchema.parse({ entityType: "INDIVIDUAL", tin: "1000000000" })).toThrow();
  });
  it("rejects negative money and bad enums", () => {
    expect(() => AnswersSchema.parse({ entityType: "INDIVIDUAL", monthlySalary: -1 })).toThrow();
    expect(() => AnswersSchema.parse({ entityType: "TRUST" })).toThrow();
  });
  it("no question asks for credentials or account numbers", () => {
    const text = QUESTIONS.map((q) => q.prompt)
      .join(" ")
      .toLowerCase();
    for (const w of ["password", "pin", "account number", "tin"]) expect(text.includes(` ${w}`)).toBe(false);
  });
  it("parseAnswers prunes hidden answers", () => {
    expect(parseAnswers({ entityType: "COMPANY", isEmployed: true }).isEmployed).toBeUndefined();
  });
});
