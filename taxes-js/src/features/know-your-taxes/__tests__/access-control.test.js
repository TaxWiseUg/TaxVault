import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
// Fake Prisma that honours the `where` filter like Postgres would.
const rows = [
  { id: "a-alice", userId: "alice", result: { obligations: [] }, createdAt: new Date() },
  { id: "a-bob", userId: "bob", result: { obligations: [] }, createdAt: new Date() },
];
vi.mock("@/lib/prisma", () => ({
  prisma: {
    kytAssessment: {
      findFirst: vi.fn(async ({ where }) => rows.find((r) => r.id === where.id && r.userId === where.userId) ?? null),
    },
  },
}));
const { getAssessmentForUser, NotFoundError } = await import("../server/repository");
describe("access control", () => {
  it("owner can read their assessment", async () => {
    await expect(getAssessmentForUser("alice", "a-alice")).resolves.toMatchObject({ id: "a-alice" });
  });
  it("another user gets NotFound (not Forbidden) so ids can't be probed", async () => {
    await expect(getAssessmentForUser("bob", "a-alice")).rejects.toBeInstanceOf(NotFoundError);
  });
  it("queries always include userId", async () => {
    const { prisma } = await import("@/lib/prisma");
    await getAssessmentForUser("alice", "a-alice").catch(() => {});
    const calls = prisma.kytAssessment.findFirst.mock.calls;
    expect(calls.every(([arg]) => arg.where.userId)).toBe(true);
  });
});
