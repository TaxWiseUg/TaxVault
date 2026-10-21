import { z } from "zod";
import { pruneHiddenAnswers } from "./questionnaire";
import { Answers } from "./types";

const money = z.number().finite().min(0).max(1e14);
const yesNoUnsure = z.enum(["YES", "NO", "UNSURE"]);

export const AnswersSchema = z
  .object({
    entityType: z.enum(["INDIVIDUAL", "SOLE_PROPRIETOR", "PARTNERSHIP", "COMPANY"]),
    residency: z.enum(["RESIDENT", "NON_RESIDENT", "UNSURE"]).optional(),
    isEmployed: z.boolean().optional(),
    monthlySalary: money.optional(),
    hasBusiness: z.boolean().optional(),
    businessActivities: z
      .array(z.enum(["TRADING", "SERVICES", "PROFESSIONAL", "MANUFACTURING", "AGRICULTURE", "TRANSPORT", "OTHER"]))
      .max(7)
      .optional(),
    annualTurnover: money.optional(),
    keepsRecords: yesNoUnsure.optional(),
    annualProfit: z.number().finite().min(-1e14).max(1e14).optional(),
    vatRegistered: yesNoUnsure.optional(),
    hasRentalIncome: z.boolean().optional(),
    annualRentalIncome: money.optional(),
    hasEmployees: z.boolean().optional(),
    employeeCount: z.number().int().min(1).max(100_000).optional(),
    monthlyPayroll: money.optional(),
    paysSuppliers: z.boolean().optional(),
    isDesignatedWhtAgent: yesNoUnsure.optional(),
    paysNonResidents: z.boolean().optional(),
    hasForeignIncome: z.boolean().optional(),
    importsGoods: z.boolean().optional(),
    importsServices: z.boolean().optional(),
    soldBusinessAssetsOrShares: z.boolean().optional(),
    otherIncome: z
      .array(z.enum(["DIVIDENDS", "INTEREST", "NONE"]))
      .max(3)
      .optional(),
  })
  .strict();

export const CreateAssessmentSchema = z.object({ answers: AnswersSchema }).strict();

export const AskSchema = z
  .object({
    obligationCode: z.string().regex(/^[A-Z_]{2,40}$/),
    question: z.string().trim().min(3).max(500),
  })
  .strict();

export function parseAnswers(input: unknown): Answers {
  return pruneHiddenAnswers(AnswersSchema.parse(input) as Answers);
}
