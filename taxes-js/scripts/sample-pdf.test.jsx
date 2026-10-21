// Renders a sample report for a multi-income profile. Run: npx vitest run --config scripts/vitest.sample.config.ts
import { it } from "vitest";
import { writeFileSync } from "node:fs";
import { assess } from "../src/features/know-your-taxes/engine/assess";
import { renderReportPdf } from "../src/features/know-your-taxes/report/ReportDocument";
import { SEED_RULES } from "../src/features/know-your-taxes/rules/seed-rules";
import { SOURCES } from "../src/features/know-your-taxes/rules/sources";
it("writes sample-report.pdf", async () => {
  const r = assess(
    {
      entityType: "INDIVIDUAL",
      residency: "RESIDENT",
      isEmployed: true,
      monthlySalary: 1_500_000,
      hasBusiness: true,
      businessActivities: ["TRADING"],
      annualTurnover: 45_000_000,
      keepsRecords: "YES",
      vatRegistered: "NO",
      hasRentalIncome: true,
      annualRentalIncome: 24_000_000,
      hasEmployees: false,
      paysSuppliers: false,
      paysNonResidents: false,
      hasForeignIncome: false,
      importsGoods: false,
      importsServices: false,
      otherIncome: ["INTEREST"],
      soldBusinessAssetsOrShares: false,
    },
    SEED_RULES,
    "2026-10-19",
  );
  writeFileSync("sample-report.pdf", await renderReportPdf(r, Object.values(SOURCES)));
  writeFileSync("sample-result.json", JSON.stringify(r, null, 2));
}, 30_000);
