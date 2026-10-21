-- Know Your Taxes. Generated to match prisma/schema.know-your-taxes.prisma.
-- Prefer regenerating with `npx prisma migrate dev --name know_your_taxes` after merging the
-- models, so Prisma reconciles it with your existing schema. Assumes "User"."id" is TEXT.

CREATE TYPE "KytEntityType" AS ENUM ('INDIVIDUAL', 'SOLE_PROPRIETOR', 'PARTNERSHIP', 'COMPANY');
CREATE TYPE "KytAssessmentStatus" AS ENUM ('DRAFT', 'COMPLETED');
CREATE TYPE "KytVerificationStatus" AS ENUM ('VERIFIED', 'NEEDS_VERIFICATION', 'SUPERSEDED');
CREATE TYPE "KytObligationStatus" AS ENUM ('LIKELY', 'NEEDS_INFO', 'NOT_APPLICABLE', 'PROFESSIONAL_REVIEW');

CREATE TABLE "KytLegalSource" (
  "id" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "publisher" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "section" TEXT,
  "note" TEXT,
  "lastCheckedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "KytRuleSet" (
  "id" TEXT PRIMARY KEY,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "notes" TEXT
);

CREATE TABLE "KytTaxRule" (
  "id" TEXT PRIMARY KEY,
  "ruleSetId" TEXT NOT NULL REFERENCES "KytRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "code" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "effectiveFrom" TIMESTAMP(3) NOT NULL,
  "effectiveTo" TIMESTAMP(3),
  "verification" "KytVerificationStatus" NOT NULL DEFAULT 'NEEDS_VERIFICATION',
  "reviewedBy" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "params" JSONB NOT NULL,
  "content" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "KytTaxRule_ruleSetId_code_key" ON "KytTaxRule"("ruleSetId", "code");
CREATE INDEX "KytTaxRule_code_effectiveFrom_idx" ON "KytTaxRule"("code", "effectiveFrom");

CREATE TABLE "KytRuleSource" (
  "ruleId" TEXT NOT NULL REFERENCES "KytTaxRule"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "sourceId" TEXT NOT NULL REFERENCES "KytLegalSource"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  PRIMARY KEY ("ruleId", "sourceId")
);

CREATE TABLE "KytAssessment" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "status" "KytAssessmentStatus" NOT NULL DEFAULT 'DRAFT',
  "entityType" "KytEntityType",
  "ruleSetId" TEXT REFERENCES "KytRuleSet"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  "engineVersion" TEXT,
  "asOf" TIMESTAMP(3),
  "result" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3)
);
CREATE INDEX "KytAssessment_userId_createdAt_idx" ON "KytAssessment"("userId", "createdAt");

CREATE TABLE "KytQuestionResponse" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "KytAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "questionId" TEXT NOT NULL,
  "value" JSONB NOT NULL,
  "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "KytQuestionResponse_assessmentId_questionId_key" ON "KytQuestionResponse"("assessmentId", "questionId");

CREATE TABLE "KytObligationResult" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "KytAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "code" TEXT NOT NULL,
  "status" "KytObligationStatus" NOT NULL,
  "ruleVersion" TEXT NOT NULL,
  "estimateAmount" DECIMAL(18,0),
  "estimatePeriod" TEXT,
  "indicativeOnly" BOOLEAN NOT NULL DEFAULT true
);
CREATE UNIQUE INDEX "KytObligationResult_assessmentId_code_key" ON "KytObligationResult"("assessmentId", "code");
CREATE INDEX "KytObligationResult_code_status_idx" ON "KytObligationResult"("code", "status");

CREATE TABLE "KytReport" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "KytAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT NOT NULL,
  "format" TEXT NOT NULL DEFAULT 'PDF',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "KytReport_userId_idx" ON "KytReport"("userId");

CREATE TABLE "KytQuestion" (
  "id" TEXT PRIMARY KEY,
  "assessmentId" TEXT NOT NULL REFERENCES "KytAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "userId" TEXT NOT NULL,
  "obligationCode" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "citedSourceIds" TEXT[],
  "grounded" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "KytQuestion_assessmentId_idx" ON "KytQuestion"("assessmentId");
