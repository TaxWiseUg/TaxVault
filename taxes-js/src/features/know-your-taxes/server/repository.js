import "server-only";
import { prisma } from "@/lib/prisma"; // TODO: adjust to your Prisma client singleton
import { assess } from "../engine/assess";
// Every read/write here is scoped by userId. Callers never pass a bare assessment id to Prisma.
// A missing OR foreign assessment both return NotFound, so ids can't be probed.
export class NotFoundError extends Error {
  status = 404;
}
export async function loadActiveRules(asOf) {
  const ruleSet = await prisma.kytRuleSet.findFirst({
    where: { effectiveFrom: { lte: asOf }, OR: [{ effectiveTo: null }, { effectiveTo: { gt: asOf } }] },
    orderBy: { effectiveFrom: "desc" },
    include: { rules: true },
  });
  if (!ruleSet) throw new Error("No active Know Your Taxes rule set — run the seed.");
  return {
    ruleSetId: ruleSet.id,
    rules: ruleSet.rules.map((r) => ({
      code: r.code,
      version: r.version,
      effectiveFrom: r.effectiveFrom.toISOString().slice(0, 10),
      effectiveTo: r.effectiveTo?.toISOString().slice(0, 10),
      verification: r.verification,
      reviewedBy: r.reviewedBy ?? undefined,
      reviewedAt: r.reviewedAt?.toISOString(),
      params: r.params,
      content: r.content,
    })),
  };
}
export async function createCompletedAssessment(userId, answers) {
  const asOf = new Date();
  const { ruleSetId, rules } = await loadActiveRules(asOf);
  const result = assess(answers, rules, asOf.toISOString().slice(0, 10), ruleSetId);
  return prisma.kytAssessment.create({
    data: {
      userId,
      status: "COMPLETED",
      entityType: answers.entityType,
      ruleSetId,
      engineVersion: result.engineVersion,
      asOf,
      completedAt: asOf,
      result: { answers, ...result },
      responses: { create: Object.entries(answers).map(([questionId, value]) => ({ questionId, value: value })) },
      obligations: {
        create: result.obligations.map((o) => ({
          code: o.code,
          status: o.status,
          ruleVersion: o.rule.version,
          estimateAmount: o.estimate?.amount,
          estimatePeriod: o.estimate?.period,
          indicativeOnly: o.estimate?.indicativeOnly ?? true,
        })),
      },
    },
    select: { id: true },
  });
}
export async function getAssessmentForUser(userId, id) {
  const row = await prisma.kytAssessment.findFirst({ where: { id, userId } });
  if (!row || !row.result) throw new NotFoundError("Assessment not found");
  return { id: row.id, createdAt: row.createdAt, result: row.result };
}
export async function listAssessmentsForUser(userId) {
  return prisma.kytAssessment.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, createdAt: true, entityType: true, ruleSetId: true },
  });
}
export async function logReport(userId, assessmentId) {
  await prisma.kytReport.create({ data: { userId, assessmentId } });
}
export async function logQuestion(input) {
  await prisma.kytQuestion.create({ data: input });
}
export async function getSources(ids) {
  return prisma.kytLegalSource.findMany({ where: { id: { in: ids } } });
}
