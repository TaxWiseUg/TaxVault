import { NextRequest, NextResponse } from "next/server";
import { searchTaxStatutes, getTaxTopicProvisions, UGANDA_TAX_STATUTES } from "@/lib/tax/ugandaTaxLaw";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const act = searchParams.get("act") || "All";
    const topic = searchParams.get("topic");
    const section = searchParams.get("section");

    if (section) {
      const match = UGANDA_TAX_STATUTES.find(
        (s) => s.section.toLowerCase().includes(section.toLowerCase()) || section.toLowerCase().includes(s.section.toLowerCase())
      );
      if (match) {
        return NextResponse.json({ success: true, statute: match });
      }
    }

    if (topic) {
      const provisions = getTaxTopicProvisions(topic);
      return NextResponse.json({ success: true, statutes: provisions });
    }

    const statutes = searchTaxStatutes(query, act);
    return NextResponse.json({
      success: true,
      count: statutes.length,
      statutes,
    });
  } catch (err: unknown) {
    console.error("Error retrieving statutes:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to retrieve statutes" },
      { status: 500 }
    );
  }
}
