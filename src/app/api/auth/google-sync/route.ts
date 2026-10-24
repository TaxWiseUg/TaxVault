import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email = rawEmail.toLowerCase();
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url : undefined;
    const googleUid = typeof body.google_uid === "string" ? body.google_uid : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const isAdmin = email === "taxwiseplatform@gmail.com";
    const defaultRole = isAdmin ? "Admin" : "Tax Consultant";
    const defaultPlan = "professional";

    const supabaseAdmin = getSupabaseAdmin();

    // ── 1. If Supabase Service Role is configured, sync directly to PostgreSQL auth & tables ──
    if (supabaseAdmin) {
      try {
        // Check if user already exists in public.users by email
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id, email, full_name, role, plan")
          .ilike("email", email)
          .maybeSingle();

        const canonicalId = existingUser?.id || (googleUid.length === 36 ? googleUid : undefined);
        const resolvedRole = isAdmin ? "Admin" : (existingUser?.role || defaultRole);
        const resolvedPlan = isAdmin ? "professional" : (existingUser?.plan || defaultPlan);
        const resolvedName = fullName || existingUser?.full_name || (isAdmin ? "TaxWise Platform" : email.split("@")[0]);

        // If user is not yet registered in Supabase auth, create them via admin API
        try {
          const createPayload: {
            id?: string;
            email: string;
            email_confirm: boolean;
            user_metadata: {
              full_name: string;
              role: string;
              avatar_url?: string;
              provider: string;
            };
          } = {
            email,
            email_confirm: true,
            user_metadata: {
              full_name: resolvedName,
              role: resolvedRole,
              avatar_url: avatarUrl,
              provider: "google",
            },
          };

          if (canonicalId) {
            createPayload.id = canonicalId;
          }

          await supabaseAdmin.auth.admin.createUser(createPayload);
        } catch {
          // If auth user already exists, update their metadata
          try {
            if (canonicalId) {
              await supabaseAdmin.auth.admin.updateUserById(canonicalId, {
                email_confirm: true,
                user_metadata: {
                  full_name: resolvedName,
                  role: resolvedRole,
                  avatar_url: avatarUrl,
                  provider: "google",
                },
              });
            }
          } catch {
            // ignore update failure
          }
        }

        // Upsert into public.users without violating email uniqueness
        const finalUserId = canonicalId || googleUid || `google-${email}`;
        try {
          await supabaseAdmin.from("users").upsert({
            id: finalUserId,
            email: email,
            full_name: resolvedName,
            role: resolvedRole,
            plan: resolvedPlan,
            last_login: new Date().toISOString(),
          }, { onConflict: "id" });
        } catch (upsertErr) {
          console.warn("[google-sync] public.users upsert notice:", upsertErr);
        }

        return NextResponse.json({
          success: true,
          profile: {
            id: finalUserId,
            email: email,
            full_name: resolvedName,
            role: resolvedRole,
            plan: resolvedPlan,
            avatar_url: avatarUrl,
          },
        });
      } catch (dbErr) {
        console.warn("[google-sync] Supabase sync error, falling back to normalized profile:", dbErr);
      }
    }

    // ── 2. Demo / Sandbox Mode (or fallback) ──
    const fallbackId = isAdmin ? "f8174d44-d81a-4e70-9f4b-64744f969d09" : (googleUid || `user-${email}`);
    const resolvedName = fullName || (isAdmin ? "TaxWise Platform" : email.split("@")[0]);

    return NextResponse.json({
      success: true,
      profile: {
        id: fallbackId,
        email: email,
        full_name: resolvedName,
        role: defaultRole,
        plan: defaultPlan,
        avatar_url: avatarUrl,
      },
    });
  } catch (err: unknown) {
    console.error("[google-sync] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync Google user with Supabase." },
      { status: 500 }
    );
  }
}
