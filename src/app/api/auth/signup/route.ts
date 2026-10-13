import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getSupabaseAdmin() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL or Service Role Key is missing from environment variables.");
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const full_name = typeof body.full_name === "string" ? body.full_name.trim() : "";
    const role = typeof body.role === "string" ? body.role : "Student";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Check if the user profile already exists in public.users (e.g. from seeded database tables)
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id, email, full_name, role, plan")
      .ilike("email", email)
      .maybeSingle();

    // 2. Prepare user creation payload.
    // If the user was already seeded into public.users, we MUST pass their existing UUID!
    // If not passed, Supabase auth generates a random new UUID, which triggers on_auth_user_created
    // and causes PostgreSQL to fail with a unique constraint violation on public.users(email).
    const createPayload: {
      id?: string;
      email: string;
      password: string;
      email_confirm: boolean;
      user_metadata: {
        full_name: string;
        role: string;
      };
    } = {
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || existingUser?.full_name || email.split("@")[0],
        role: role || existingUser?.role || "Tax Consultant",
      },
    };

    if (existingUser?.id) {
      createPayload.id = existingUser.id;
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser(createPayload);

    if (error) {
      // If the auth account already exists in auth.users
      if (
        error.message?.toLowerCase().includes("already been registered") ||
        error.message?.toLowerCase().includes("already registered") ||
        (error as { code?: string })?.code === "email_exists"
      ) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please sign in instead." },
          { status: 400 }
        );
      }

      console.error("[signup error]", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // 3. Ensure public profile is updated with the latest user details
    if (data.user) {
      try {
        await supabaseAdmin.from("users").upsert({
          id: data.user.id,
          email: data.user.email || email,
          full_name: full_name || existingUser?.full_name || email.split("@")[0],
          role: role || existingUser?.role || "Tax Consultant",
          plan: existingUser?.plan || "free",
        }, { onConflict: "id" });
      } catch (upsertErr) {
        console.warn("Public profile sync warning:", upsertErr);
      }
    }

    return NextResponse.json({ user: data.user });
  } catch (err: unknown) {
    console.error("[signup exception]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create user." }, { status: 500 });
  }
}
