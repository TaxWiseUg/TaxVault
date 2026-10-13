import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "supabase_setup_and_seed.sql");
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "SQL file not found on server." }, { status: 404 });
    }
    const sqlContent = fs.readFileSync(filePath, "utf-8");

    // Also check current Supabase tables status if credentials exist
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const tableStatus: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    if (url && key) {
      try {
        const client = createClient(url, key);
        const tables = ["users", "tat_cases", "site_settings", "courses", "enrollments", "compliance_reports", "cases", "admin_logs"];
        for (const t of tables) {
          const { count, error } = await client.from(t).select("*", { count: "exact", head: true });
          if (error) {
            tableStatus[t] = { exists: false, error: error.message };
          } else {
            tableStatus[t] = { exists: true, count: count ?? 0 };
          }
        }
      } catch (err: unknown) {
        // Ignored
      }
    }

    return NextResponse.json({
      sql: sqlContent,
      tableStatus,
      supabaseUrl: url || null,
      sizeBytes: Buffer.byteLength(sqlContent, "utf-8")
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load SQL setup script." }, { status: 500 });
  }
}
