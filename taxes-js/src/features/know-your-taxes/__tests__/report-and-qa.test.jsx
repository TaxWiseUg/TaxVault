import { describe, expect, it } from "vitest";
import { assess } from "../engine/assess";
import { renderReportPdf } from "../report/ReportDocument";
import { SEED_RULES } from "../rules/seed-rules";
import { SOURCES } from "../rules/sources";
import { buildPacket, fallbackAnswer, verifyAnswer } from "../server/qa";
const result = assess(
  {
    entityType: "INDIVIDUAL",
    residency: "RESIDENT",
    isEmployed: true,
    monthlySalary: 1_500_000,
    hasRentalIncome: true,
    annualRentalIncome: 24_000_000,
    hasEmployees: false,
  },
  SEED_RULES,
  "2026-10-19",
);
describe("PDF report", () => {
  it("renders a non-empty PDF", async () => {
    const buf = await renderReportPdf(result, Object.values(SOURCES));
    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(5_000);
  }, 30_000);
});
describe("grounded Q&A guardrails", () => {
  const paye = result.obligations.find((o) => o.code === "PAYE_EMPLOYEE");
  const sources = paye.content.legalBasis.map((id) => SOURCES[id]);
  const packet = buildPacket(paye, sources);
  const allowed = new Set(sources.map((s) => s.id));
  it("accepts an answer whose numbers and citations come from the packet", () => {
    expect(verifyAnswer("Your employer deducts PAYE monthly by the 15th [S:ITA-S116].", packet, allowed).ok).toBe(true);
  });
  it("rejects invented numbers", () => {
    expect(verifyAnswer("The penalty is UGX 2,000,000 [S:ITA-S116].", packet, allowed).ok).toBe(false);
  });
  it("rejects unknown citations", () => {
    expect(verifyAnswer("See [S:MADE-UP].", packet, allowed).ok).toBe(false);
  });
  it("fallback explains calculation from workings and admits unknowns", () => {
    expect(fallbackAnswer(paye, "How was this amount calculated?")).toMatch(/Gross monthly salary/);
    expect(fallbackAnswer(paye, "Can I amend a return from 2019?")).toMatch(/professional/);
  });
});
