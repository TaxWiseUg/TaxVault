import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { verifyFirebaseIdToken } from "@/lib/server/firebaseIdentity";

const PROFESSIONAL_ROLES = new Set([
  "Tax Consultant",
  "Accountant",
  "Tax Lawyer",
  "Finance Manager",
  "Business Owner",
  "Student",
]);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

async function findAuthUserIdByEmail(
  supabaseAdmin: SupabaseClient<any, "public", "public", any, any>,
  email: string
): Promise<string | null> {
  for (let page = 1; page <= 100; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
    if (match) return match.id;
    if (data.users.length < 1000) return null;
  }
  throw new Error("Could not safely resolve the existing Google account.");
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    const identity = idToken ? await verifyFirebaseIdToken(idToken) : null;
    if (!identity) {
      return NextResponse.json({ error: "A valid Google session is required." }, { status: 401 });
    }

    const body = await req.json();
    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    const email = identity.email;
    const fullName = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const avatarUrl = typeof body.avatar_url === "string" ? body.avatar_url : undefined;
    const googleUid = identity.id;
    const requestedRole = typeof body.role === "string" && body.role.trim() ? body.role.trim() : undefined;

    if (!rawEmail || rawEmail.toLowerCase() !== email) {
      return NextResponse.json({ error: "The Google account does not match the requested email." }, { status: 403 });
    }

    if (requestedRole && !PROFESSIONAL_ROLES.has(requestedRole)) {
      return NextResponse.json({ error: "Choose a valid professional role." }, { status: 400 });
    }

    const isAdmin = email === "taxwiseplatform@gmail.com";
    const defaultRole = isAdmin ? "Admin" : (requestedRole || "Tax Consultant");
    const defaultPlan = "professional";

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Database is not configured. Google sign-in cannot be completed." }, { status: 503 });
    }

    // ── 1. If Supabase Service Role is configured, sync directly to PostgreSQL auth & tables ──
    if (supabaseAdmin) {
      try {
        // Check if user already exists in public.users by email
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id, email, full_name, role, plan")
          .ilike("email", email)
          .maybeSingle();

        const isNewUser = !isAdmin && (!existingUser || !existingUser.role) && !requestedRole;
        let canonicalId = existingUser?.id || (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(googleUid) ? googleUid : undefined);
        const resolvedRole = isAdmin ? "Admin" : (requestedRole || existingUser?.role || defaultRole);
        const resolvedPlan = isAdmin ? "professional" : (existingUser?.plan || defaultPlan);
        const resolvedName = fullName || existingUser?.full_name || (isAdmin ? "TaxWise Platform" : email.split("@")[0]);

        // Leave new/unfinished accounts unpersisted until the user confirms a role.
        if (isNewUser) {
          return NextResponse.json({
            success: true,
            isNewUser: true,
            profile: {
              id: existingUser?.id || googleUid,
              email,
              full_name: resolvedName,
              role: existingUser?.role || "",
              plan: resolvedPlan,
              avatar_url: avatarUrl,
            },
          });
        }

        // If user is not yet registered in Supabase auth, create them via admin API
        let authCreateError: Error | null = null;
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

          const { data: createdAuthUser, error } = await supabaseAdmin.auth.admin.createUser(createPayload);
          if (error) authCreateError = error;
          else canonicalId = createdAuthUser.user?.id || canonicalId;
        } catch (error) {
          authCreateError = error instanceof Error ? error : new Error("Could not create the Supabase Auth user.");
        }

        if (!canonicalId) {
          canonicalId = await findAuthUserIdByEmail(supabaseAdmin, email) || undefined;
        }

        if (authCreateError && canonicalId) {
          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(canonicalId, {
            email_confirm: true,
            user_metadata: {
              full_name: resolvedName,
              role: resolvedRole,
              avatar_url: avatarUrl,
              provider: "google",
            },
          });
          if (updateAuthError && requestedRole) {
            console.error("[google-sync] Could not update Supabase Auth user:", updateAuthError);
            return NextResponse.json({ error: "Could not finish setting up your account. Please try again." }, { status: 500 });
          }
        }

        // Upsert into public.users without violating email uniqueness
        if (!canonicalId) {
          return NextResponse.json({ error: "Could not finish setting up your account. Please try again." }, { status: 500 });
        }
        const finalUserId = canonicalId;
        const { error: profileUpsertError } = await supabaseAdmin.from("users").upsert({
            id: finalUserId,
            email: email,
            full_name: resolvedName,
            role: resolvedRole,
            plan: resolvedPlan,
            last_login: new Date().toISOString(),
          }, { onConflict: "id" });
        if (profileUpsertError && requestedRole) {
          console.error("[google-sync] Could not persist selected professional role:", profileUpsertError);
          return NextResponse.json({ error: "Could not save your professional role. Please try again." }, { status: 500 });
        }
        if (profileUpsertError) {
          console.warn("[google-sync] public.users upsert notice:", profileUpsertError);
        }

        return NextResponse.json({
          success: true,
          isNewUser,
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
        if (requestedRole) {
          return NextResponse.json({ error: "Could not save your professional role. Please try again." }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ error: "Google account could not be synchronized with the database." }, { status: 500 });
  } catch (err: unknown) {
    console.error("[google-sync] Unhandled error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to sync Google user with Supabase." },
      { status: 500 }
    );
  }
}
