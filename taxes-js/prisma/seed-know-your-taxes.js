// Seed the UG-2026.07 rule set and legal sources. Idempotent.
// Run: npx tsx prisma/seed-know-your-taxes.ts
import { PrismaClient } from "@prisma/client";
import { RULE_SET_VERSION, SEED_RULES } from "../src/features/know-your-taxes/rules/seed-rules";
import { SOURCES } from "../src/features/know-your-taxes/rules/sources";
const prisma = new PrismaClient();
/**
 * Merge seed params into what's in the database:
 * - new params (e.g. presumptive tables) are added;
 * - a param a reviewer VERIFIED in the database is never overwritten or downgraded;
 * - otherwise the seed wins (picks up value fixes and seed-level verifications such as the VAT threshold).
 */
function mergeParams(db, seed) {
  const byKey = new Map(db.map((p) => [p.key, p]));
  return seed.map((sp) => {
    const dp = byKey.get(sp.key);
    return dp && dp.verification === "VERIFIED" && sp.verification !== "VERIFIED" ? dp : sp;
  });
}
async function main() {
  for (const s of Object.values(SOURCES)) {
    await prisma.kytLegalSource.upsert({
      where: { id: s.id },
      create: { id: s.id, title: s.title, publisher: s.publisher, url: s.url, section: s.section, note: s.note },
      update: { title: s.title, publisher: s.publisher, url: s.url, section: s.section, note: s.note },
    });
  }
  await prisma.kytRuleSet.upsert({
    where: { id: RULE_SET_VERSION },
    create: {
      id: RULE_SET_VERSION,
      effectiveFrom: new Date("2026-07-01"),
      notes: "Finance Acts 2026 (effective 1 July 2026). See VERIFICATION.md for per-parameter status.",
    },
    update: {},
  });
  for (const r of SEED_RULES) {
    const sourceIds = [...new Set([...r.content.legalBasis, ...r.params.flatMap((p) => p.sourceIds)])];
    const existing = await prisma.kytTaxRule.findUnique({
      where: { ruleSetId_code: { ruleSetId: RULE_SET_VERSION, code: r.code } },
    });
    const params = existing ? mergeParams(existing.params, r.params) : r.params;
    const rule = await prisma.kytTaxRule.upsert({
      where: { ruleSetId_code: { ruleSetId: RULE_SET_VERSION, code: r.code } },
      create: {
        ruleSetId: RULE_SET_VERSION,
        code: r.code,
        version: r.version,
        effectiveFrom: new Date(r.effectiveFrom),
        verification: r.verification,
        params: params,
        content: r.content,
      },
      update: { params: params, content: r.content },
    });
    for (const sourceId of sourceIds) {
      await prisma.kytRuleSource.upsert({
        where: { ruleId_sourceId: { ruleId: rule.id, sourceId } },
        create: { ruleId: rule.id, sourceId },
        update: {},
      });
    }
  }
  console.log(`Seeded ${SEED_RULES.length} rules into ${RULE_SET_VERSION}`);
}
main().finally(() => prisma.$disconnect());
