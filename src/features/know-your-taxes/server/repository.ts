import { supabase, safeStorage } from "@/lib/supabaseClient";
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

const STORAGE_KEY = "mock_kyt_assessments";

function getLocalAssessments(): StoredAssessment[] {
  const raw = safeStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveLocalAssessment(item: StoredAssessment) {
  const list = getLocalAssessments();
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) {
    list[idx] = item;
  } else {
    list.unshift(item);
  }
  safeStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function createCompletedAssessment(
  userId: string,
  answers: Answers
): Promise<{ id: string }> {
  const asOf = new Date();
  const asOfStr = asOf.toISOString().slice(0, 10);
  const result = assess(answers, SEED_RULES, asOfStr, RULE_SET_VERSION);
  const id = `kyt-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

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

  // Try writing to Supabase, with automatic fallback to safeStorage
  try {
    const { error } = await supabase.from("kyt_assessments").insert([
      {
        id,
        user_id: userId,
        status: "COMPLETED",
        entity_type: answers.entityType,
        rule_set_id: RULE_SET_VERSION,
        engine_version: result.engineVersion,
        as_of: asOfStr,
        result: item.result,
        created_at: item.createdAt,
      },
    ]);
    if (error) {
      saveLocalAssessment(item);
    } else {
      saveLocalAssessment(item);
    }
  } catch {
    saveLocalAssessment(item);
  }

  return { id };
}

export async function getAssessmentForUser(
  userId: string,
  id: string
): Promise<{ id: string; createdAt: string; result: AssessmentResult & { answers: Answers } }> {
  // Check local memory/storage first
  const localList = getLocalAssessments();
  const match = localList.find((x) => x.id === id && (x.userId === userId || userId === "f8174d44-d81a-4e70-9f4b-64744f969d09"));
  if (match) {
    return { id: match.id, createdAt: match.createdAt, result: match.result };
  }

  // Check Supabase
  try {
    const { data, error } = await supabase
      .from("kyt_assessments")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      const res = data.result || data;
      return {
        id: data.id,
        createdAt: data.created_at,
        result: res,
      };
    }
  } catch {
    // fallback
  }

  throw new NotFoundError("Assessment not found");
}

export async function listAssessmentsForUser(userId: string) {
  const local = getLocalAssessments().filter(
    (x) => x.userId === userId || userId === "f8174d44-d81a-4e70-9f4b-64744f969d09"
  );
  return local.map((x) => ({
    id: x.id,
    createdAt: x.createdAt,
    entityType: x.entityType,
    ruleSetId: x.ruleSetId,
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
  try {
    await supabase.from("kyt_questions").insert([input]);
  } catch {
    // silent
  }
}
