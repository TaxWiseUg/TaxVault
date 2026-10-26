import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseIdToken } from "@/lib/server/firebaseIdentity";

export async function GET(req: NextRequest) {
  try {
    const accessToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const authProvider = req.headers.get("x-auth-provider");
    if (!accessToken || !["firebase", "supabase"].includes(authProvider || "")) {
      return NextResponse.json({ error: "A valid administrator session is required." }, { status: 401 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey || (authProvider === "supabase" && !anonKey)) {
      return NextResponse.json({ error: "Supabase is not configured for admin user access." }, { status: 503 });
    }

    let actor: { id: string; email: string } | null = null;
    if (authProvider === "firebase") {
      actor = await verifyFirebaseIdToken(accessToken);
    } else {
      const anon = createClient(url, anonKey!);
      const { data: { user }, error } = await anon.auth.getUser(accessToken);
      if (user?.email && !error) {
        actor = { id: user.id, email: user.email.toLowerCase() };
      }
    }
    if (!actor) return NextResponse.json({ error: "Your admin session is invalid or expired. Sign in again." }, { status: 401 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: adminProfile, error: adminProfileError } = await admin
      .from("users")
      .select("role")
      .ilike("email", actor.email)
      .maybeSingle();
    if (adminProfileError) throw adminProfileError;
    if (adminProfile?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Only administrators can view the user directory." }, { status: 403 });
    }

    const { data: users, error } = await admin
      .from("users")
      .select("id,full_name,email,role,plan,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;

    return NextResponse.json({ users: users || [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (error: unknown) {
    console.error("Admin user directory fetch failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load users from Supabase." },
      { status: 500 }
    );
  }
}
