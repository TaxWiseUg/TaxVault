import { NextRequest, NextResponse } from "next/server";
import { searchTATPrecedents, findMatchingPrecedents, extractCitations } from "@/lib/tax/caseRetriever";
import { IMPORTED_TAT_CASES } from "@/lib/importedData";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const taxType = searchParams.get("taxType") || "All";
    const outcome = searchParams.get("outcome") || "All";
    const yearStr = searchParams.get("year");
    const year = yearStr ? parseInt(yearStr, 10) : undefined;
    const limit = parseInt(searchParams.get("limit") || "25", 10);
    const id = searchParams.get("id");
    const caseNumber = searchParams.get("caseNumber");

    // Single case lookup
    if (id || caseNumber) {
      const match = IMPORTED_TAT_CASES.find(
        (c) => (id && c.id === id) || (caseNumber && c.case_number.toLowerCase() === caseNumber.toLowerCase())
      );
      if (!match) {
        return NextResponse.json({ error: "Case precedent not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, precedent: match });
    }

    const results = searchTATPrecedents({
      query,
      taxType,
      outcome,
      year,
      limit,
    });

    return NextResponse.json({
      success: true,
      count: results.length,
      precedents: results,
    });
  } catch (err: unknown) {
    console.error("Error retrieving TAT precedents:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to retrieve precedents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { facts, maxResults = 5 } = body;

    if (!facts || typeof facts !== "string") {
      return NextResponse.json({ error: "Missing 'facts' text in request body." }, { status: 400 });
    }

    const matchedPrecedents = findMatchingPrecedents(facts, maxResults);
    const citations = extractCitations(facts);

    return NextResponse.json({
      success: true,
      citations,
      matchedPrecedents,
    });
  } catch (err: unknown) {
    console.error("Error matching precedents:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to match precedents" },
      { status: 500 }
    );
  }
}
