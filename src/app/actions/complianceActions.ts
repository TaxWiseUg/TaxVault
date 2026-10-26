"use server";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { TaxPeriodBundle } from "../../lib/validation/helpers";
import { runComplianceEngine } from "../../lib/engine/complianceEngine";
import { calculateRisk } from "../../lib/engine/riskEngine";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/**
 * Resolves the authenticated Supabase user. No mock identity is returned when
 * the request has no valid server-side session.
 */
async function getServerUser() {
  if (!supabaseUrl || !serviceRoleKey || !anonKey) return null;

  try {
    const cookieStore = await cookies();
    // Search for Supabase authentication cookie
    const authCookie = cookieStore.getAll().find(c => c.name.includes("-auth-token"));

    if (authCookie) {
      const tokenData = JSON.parse(authCookie.value);
      const accessToken = tokenData.access_token;
      if (accessToken) {
        const client = createClient(supabaseUrl, anonKey);
        const { data: { user }, error } = await client.auth.getUser(accessToken);
        if (user && !error) {
          return {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User"
          };
        }
      }
    }
  } catch (err) {
    console.warn("Failed to retrieve server user via cookies, checking token direct:", err);
  }

  return null;
}

/**
 * Gets a Supabase Admin client that bypasses RLS for service operations.
 */
function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) throw new Error("Supabase is not configured for database actions.");
  return createClient(supabaseUrl, serviceRoleKey);
}

// ==========================================
// 1. Company / Tenancy Actions
// ==========================================

export async function getCompaniesAction() {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized: Please log in first.");

  const admin = getSupabaseAdmin();

  try {
    // Fetch companies user belongs to via company_members table
    const { data: members, error } = await admin
      .from("company_members")
      .select("company_id, role, companies(id, name, created_at)")
      .eq("user_id", user.id);

    if (error) {
      throw new Error(error.message);
    }

    if (!members || members.length === 0) return [];

    return (members || [])
      .map((m: any) => m.companies ? ({
        id: m.companies.id,
        name: m.companies.name,
        created_at: m.companies.created_at,
        role: m.role
      }) : null)
      .filter(Boolean);
  } catch (err) {
    throw err;
  }
}

export async function createCompanyAction(name: string) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const admin = getSupabaseAdmin();

  // Insert company
  const { data: company, error: compErr } = await admin
    .from("companies")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (compErr) {
    console.error("Error creating company:", compErr);
    throw new Error(compErr.message);
  }

  // Insert membership
  const { error: memErr } = await admin
    .from("company_members")
    .insert({
      company_id: company.id,
      user_id: user.id,
      role: "Admin"
    });

  if (memErr) {
    console.error("Error creating company membership:", memErr);
    throw new Error(memErr.message);
  }

  return company;
}

// ==========================================
// 2. Tax Period Actions
// ==========================================

export async function getTaxPeriodsAction(companyId: string) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await getSupabaseAdmin()
    .from("tax_periods")
    .select("*")
    .eq("company_id", companyId)
    .order("period_name", { ascending: false });
  if (error) throw new Error(error.message);
  return data || [];
}
export async function saveTaxPeriodAction(
  companyId: string,
  periodName: string,
  bundle: Partial<TaxPeriodBundle>
) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");

  const record = {
    company_id: companyId,
    period_name: periodName,
    vat_declared_output: bundle.vat_declared_output ?? 0,
    vat_declared_input: bundle.vat_declared_input ?? 0,
    efris_sales_total: bundle.efris_sales_total ?? 0,
    vat_input_invalid_tin: bundle.vat_input_invalid_tin ?? 0,
    payroll_register_count: bundle.payroll_register_count ?? 0,
    payroll_register_gross: bundle.payroll_register_gross ?? 0,
    paye_schedule_count: bundle.paye_schedule_count ?? 0,
    paye_schedule_tax: bundle.paye_schedule_tax ?? 0,
    financial_gross_margin: bundle.financial_gross_margin ?? 0,
    financial_sales: bundle.financial_sales ?? 0,
    supplier_tins_total_count: bundle.supplier_tins_total_count ?? 0,
    supplier_tins_invalid_count: bundle.supplier_tins_invalid_count ?? 0,
    nssf_contribution_total: bundle.nssf_contribution_total ?? 0,
    is_nil_return: bundle.is_nil_return ?? false,
    supporting_documents_present: bundle.supporting_documents_present ?? true,
    duplicate_invoices_count: bundle.duplicate_invoices_count ?? 0,
    negative_balances_present: bundle.negative_balances_present ?? false,
  };

  const { data, error } = await getSupabaseAdmin()
    .from("tax_periods")
    .upsert(record, { onConflict: "company_id,period_name" })
    .select()
    .single();
  if (error) throw new Error(error.message);
  return { success: true, data };
}
export async function runComplianceReviewAction(
  companyId: string,
  periodName: string,
  enableAi: boolean = true
) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const admin = getSupabaseAdmin();

  const { data: currentPeriod, error: periodError } = await admin
    .from("tax_periods")
    .select("*")
    .eq("company_id", companyId)
    .eq("period_name", periodName)
    .single();
  if (periodError) throw new Error(periodError.message);
  if (!currentPeriod) throw new Error("Tax period not found.");

  const { data: historicalPeriods, error: historyError } = await admin
    .from("tax_periods")
    .select("*")
    .eq("company_id", companyId)
    .neq("period_name", periodName)
    .order("period_name", { ascending: false })
    .limit(3);
  if (historyError) throw new Error(historyError.message);

  const result = await runComplianceEngine({ ...currentPeriod, historicalPeriods: historicalPeriods || [] }, enableAi);
  const { data: review, error: reviewError } = await admin
    .from("compliance_reviews")
    .upsert({
      company_id: companyId,
      period: periodName,
      status: result.risk.status,
      estimated_exposure: result.risk.estimated_exposure,
      confidence: result.risk.confidence,
      ai_summary: result.professionalSummary,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    }, { onConflict: "company_id,period" })
    .select()
    .single();
  if (reviewError) throw new Error(reviewError.message);

  const { error: clearError } = await admin.from("findings").delete().eq("review_id", review.id);
  if (clearError) throw new Error(clearError.message);

  const findingsToInsert = result.findings.map((finding) => ({
    review_id: review.id,
    code: finding.code,
    severity: finding.severity,
    area: finding.area,
    title: finding.title,
    description: finding.description,
    reason: finding.reason,
    impact: finding.impact,
    recommendation: finding.recommendation,
    legislation_ref: finding.legislation_ref || null,
    exposure: finding.exposure,
    confidence: finding.confidence,
    status: "open",
  }));

  if (findingsToInsert.length === 0) return { review, findings: [] };
  const { data: findings, error: findingsError } = await admin
    .from("findings")
    .insert(findingsToInsert)
    .select();
  if (findingsError) throw new Error(findingsError.message);
  return { review, findings: findings || [] };
}
export async function updateFindingStatusAction(
  reviewId: string,
  findingId: string,
  action: "resolve" | "ignore" | "reopen",
  notes?: string
) {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const admin = getSupabaseAdmin();
  const mappedStatus = action === "reopen" ? "open" : action === "resolve" ? "resolved" : "ignored";

  const { data: finding, error: findingError } = await admin
    .from("findings")
    .update({ status: mappedStatus })
    .eq("id", findingId)
    .eq("review_id", reviewId)
    .select()
    .single();
  if (findingError) throw new Error(findingError.message);

  const { error: actionError } = await admin.from("finding_actions").insert({
    finding_id: findingId,
    action_by: user.id,
    action,
    notes: notes || null,
  });
  if (actionError) throw new Error(actionError.message);

  const { data: allFindings, error: findingsError } = await admin
    .from("findings")
    .select("*")
    .eq("review_id", reviewId);
  if (findingsError) throw new Error(findingsError.message);

  const risk = calculateRisk(allFindings || []);
  const { data: updatedReview, error: reviewError } = await admin
    .from("compliance_reviews")
    .update({
      status: risk.status,
      estimated_exposure: risk.estimated_exposure,
      confidence: risk.confidence,
    })
    .eq("id", reviewId)
    .select()
    .single();
  if (reviewError) throw new Error(reviewError.message);

  return { success: true, review: updatedReview, finding, findings: allFindings || [] };
}
export interface ComplianceHistoryRecord {
  id: string;
  company_id: string;
  company_name?: string;
  period: string;
  status: string;
  estimated_exposure: number;
  confidence: number;
  ai_summary?: string;
  reviewed_at: string;
  findings?: Array<{
    id: string;
    code: string;
    severity: string;
    area: string;
    title: string;
    description: string;
    reason: string;
    impact: string;
    recommendation: string;
    legislation_ref?: string;
    exposure: number;
    confidence: number;
    status: string;
  }>;
}

export async function getComplianceHistoryAction(
  companyId?: string
): Promise<ComplianceHistoryRecord[]> {
  const user = await getServerUser();
  if (!user) throw new Error("Unauthorized");
  const admin = getSupabaseAdmin();

  let query = admin
    .from("compliance_reviews")
    .select("*, companies(name)")
    .order("reviewed_at", { ascending: false })
    .limit(20);

  if (companyId) {
    query = query.eq("company_id", companyId);
  } else {
    const { data: memberships, error: membershipError } = await admin
      .from("company_members")
      .select("company_id")
      .eq("user_id", user.id);
    if (membershipError) throw new Error(membershipError.message);
    const companyIds = (memberships || []).map((membership) => membership.company_id);
    if (companyIds.length === 0) return [];
    query = query.in("company_id", companyIds);
  }

  const { data: reviews, error } = await query;
  if (error) throw new Error(error.message);
  if (!reviews?.length) return [];

  return Promise.all(reviews.map(async (review): Promise<ComplianceHistoryRecord> => {
    const { data: findings, error: findingsError } = await admin
      .from("findings")
      .select("*")
      .eq("review_id", review.id)
      .order("severity", { ascending: true });
    if (findingsError) throw new Error(findingsError.message);

    return {
      id: review.id,
      company_id: review.company_id,
      company_name: review.companies?.name,
      period: review.period,
      status: review.status,
      estimated_exposure: review.estimated_exposure,
      confidence: review.confidence,
      ai_summary: review.ai_summary,
      reviewed_at: review.reviewed_at,
      findings: findings || [],
    };
  }));
}
