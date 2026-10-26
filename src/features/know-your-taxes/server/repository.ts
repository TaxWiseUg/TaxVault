import { supabase } from "@/lib/supabaseClient";
import { Answers, AssessmentResult, LegalSource } from "../types";
import { SEED_RULES, RULE_SET_VERSION } from "../rules/seed-rules";
import { SOURCES } from "../rules/sources";
import { assess } from "../engine/assess";

export class NotFoundError extends Error {
  status = 404;
}

export async function loadActiveRules() {
  return {
    ruleSetId: RULE_SET_VERSION,
    rules: SEED_RULES,
  };
}

export interface StoredAssessment {
  id: string;
  userId: string;
  status: "COMPLETED" | "DRAFT";
  entityType?: string;
  ruleSetId: string;
  engineVersion: string;
  asOf: string;
  result: AssessmentResult & { answers: Answers };
  createdAt: string;
  completedAt: string;
}

export async function createCompletedAssessment(
  userId: string,
  answers: Answers
): Promise<{ id: string }> {
  const asOf = new Date();
  const asOfStr = asOf.toISOString().slice(0, 10);
  const result = assess(answers, SEED_RULES, asOfStr, RULE_SET_VERSION);
  const id = crypto.randomUUID();
  const item: StoredAssessment = {
    id,
    userId,
    status: "COMPLETED",
    entityType: answers.entityType,
    ruleSetId: RULE_SET_VERSION,
    engineVersion: result.engineVersion,
    asOf: asOfStr,
    result: { answers, ...result },
    createdAt: asOf.toISOString(),
    completedAt: asOf.toISOString(),
  };

  const { error } = await supabase.from("kyt_assessments").insert({
    id,
    user_id: userId,
    status: item.status,
    entity_type: item.entityType,
    rule_set_id: item.ruleSetId,
    engine_version: item.engineVersion,
    as_of: item.asOf,
    result: item.result,
    created_at: item.createdAt,
    completed_at: item.completedAt,
  });
  if (error) throw new Error(`Could not save assessment to Supabase: ${error.message}`);
  return { id };
}

export async function getAssessmentForUser(
  userId: string,
  id: string
): Promise<{ id: string; createdAt: string; result: AssessmentResult & { answers: Answers } }> {
  const { data, error } = await supabase
    .from("kyt_assessments")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw new NotFoundError("Assessment not found");
  return {
    id: data.id,
    createdAt: data.created_at,
    result: data.result || data,
  };
}

export async function listAssessmentsForUser(userId: string) {
  const { data, error } = await supabase
    .from("kyt_assessments")
    .select("id, created_at, entity_type, rule_set_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Could not load assessments from Supabase: ${error.message}`);

  return (data || []).map((item) => ({
    id: item.id,
    createdAt: item.created_at,
    entityType: item.entity_type,
    ruleSetId: item.rule_set_id,
  }));
}
export async function getSources(ids: string[]): Promise<LegalSource[]> {
  return ids.map((id) => SOURCES[id]).filter(Boolean);
}

export async function logQuestion(input: {
  userId: string;
  assessmentId: string;
  obligationCode: string;
  question: string;
  answer: string;
  citedSourceIds: string[];
  grounded: boolean;
}) {
  const { error } = await supabase.from("kyt_questions").insert(input);
  if (error) throw new Error(`Could not save assessment question to Supabase: ${error.message}`);
}
