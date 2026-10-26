import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyFirebaseIdToken } from "@/lib/server/firebaseIdentity";

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    const body = await req.json();
    const authProvider = body?.authProvider;
    const targetId = typeof body?.userId === "string" ? body.userId : "";

    if (!accessToken || !targetId || !["firebase", "supabase"].includes(authProvider)) {
      return NextResponse.json({ error: "Missing or invalid deletion request." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey || (authProvider === "supabase" && !anonKey)) {
      return NextResponse.json({ error: "Supabase is not configured for account deletion." }, { status: 503 });
    }

    let actor: { id: string; email: string } | null = null;
    if (authProvider === "firebase") {
      actor = await verifyFirebaseIdToken(accessToken);
    } else {
      const anon = createClient(url, anonKey!);
      const { data: { user }, error } = await anon.auth.getUser(accessToken);
      if (user?.email && !error) actor = { id: user.id, email: user.email.toLowerCase() };
    }
    if (!actor) return NextResponse.json({ error: "Admin session is invalid or expired." }, { status: 401 });

    const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: adminProfile, error: adminProfileError } = await admin
      .from("users")
      .select("id, role")
      .eq("email", actor.email)
      .maybeSingle();
    if (adminProfileError || adminProfile?.role?.toLowerCase() !== "admin") {
      return NextResponse.json({ error: "Only an administrator can delete user accounts." }, { status: 403 });
    }

    const { data: target, error: targetError } = await admin
      .from("users")
      .select("id, email")
      .eq("id", targetId)
      .maybeSingle();
    if (targetError) throw targetError;
    if (!target) return NextResponse.json({ error: "User no longer exists in Supabase." }, { status: 404 });
    if (target.email?.toLowerCase() === actor.email) {
      return NextResponse.json({ error: "You cannot delete the currently signed-in administrator." }, { status: 400 });
    }

    // Supabase Auth is the source of login identities. Remove it as well as the
    // public profile so the user cannot remain as an active Supabase account.
    let authUserId: string | null = null;
    for (let page = 1; page <= 100; page += 1) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) throw error;
      const match = data.users.find((user) => user.email?.toLowerCase() === target.email?.toLowerCase());
      if (match) {
        authUserId = match.id;
        break;
      }
      if (data.users.length < 1000) break;
    }

    if (authUserId) {
      const { error } = await admin.auth.admin.deleteUser(authUserId);
      if (error) throw error;
    }

    const { error: profileDeleteError } = await admin.from("users").delete().eq("id", target.id);
    if (profileDeleteError) throw profileDeleteError;

    return NextResponse.json({ success: true, deletedUserId: target.id });
  } catch (error: unknown) {
    console.error("Admin user deletion failed:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not delete user from Supabase." },
      { status: 500 }
    );
  }
}
