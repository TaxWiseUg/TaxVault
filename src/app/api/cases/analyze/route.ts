import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { extractDocumentText, SUPPORTED_DOCUMENT_EXTENSIONS } from "@/lib/documentExtract";
import { analyzeTaxDispute } from "@/lib/tax/caseAnalyzer";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.warn("Supabase URL or Service Role Key is missing. Running in robust Demo / Sandbox mode.");
    return null;
  }
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const contentType = req.headers.get("content-type") || "";

    let file: File | null = null;
    let rawText = "";
    let caseType = "TAT Ruling";
    let userId = "";
    let clientRole: "Taxpayer" | "Tax Consultant" | "Legal Counsel" | "URA Auditor" = "Taxpayer";
    let disputeAmount = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      file = formData.get("file") as File | null;
      rawText = (formData.get("text") as string) || "";
      caseType = (formData.get("caseType") as string) || "TAT Ruling";
      userId = (formData.get("userId") as string) || "";
      const roleStr = formData.get("clientRole") as string;
      if (roleStr === "Tax Consultant" || roleStr === "Legal Counsel" || roleStr === "URA Auditor") {
        clientRole = roleStr;
      }
      disputeAmount = (formData.get("disputeAmount") as string) || "";
    } else {
      const json = await req.json();
      rawText = json.text || "";
      caseType = json.caseType || "TAT Ruling";
      userId = json.userId || "";
      if (json.clientRole) clientRole = json.clientRole;
      disputeAmount = json.disputeAmount || "";
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized: Missing user identity" }, { status: 401 });
    }

    let textToAnalyze = rawText;
    let fileSnippet = "";

    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      try {
        const extraction = await extractDocumentText(buffer, file.name, file.type);
        if (extraction.extractedText) {
          fileSnippet = `[${extraction.sourceLabel}]\n${extraction.extractedText.slice(0, 40000)}`;
          textToAnalyze = `${fileSnippet}\n\n${rawText}`;
        }
      } catch (extractErr) {
        return NextResponse.json(
          {
            error: extractErr instanceof Error
              ? extractErr.message
              : `Unsupported file type. Supported extensions include: ${SUPPORTED_DOCUMENT_EXTENSIONS.join(", ")}`,
          },
          { status: 400 }
        );
      }
    }

    if (!textToAnalyze.trim()) {
      return NextResponse.json({ error: "No text content or file was provided for analysis." }, { status: 400 });
    }

    // Run the enriched Uganda Tax Law + TAT Precedent + Gemini 3.8 Flash analyzer
    const analysisOutput = await analyzeTaxDispute({
      text: textToAnalyze,
      caseType,
      clientRole,
      disputeAmount,
      fileSnippet,
    });

    const title = file
      ? `File Analysis: ${file.name}`
      : (rawText.split("\n")[0]?.slice(0, 80) || `Tax Scenario Analysis (${new Date().toLocaleDateString()})`);

    let insertedCase = null;
    if (supabaseAdmin) {
      const { data, error: dbError } = await supabaseAdmin
        .from("cases")
        .insert({
          user_id: userId,
          title,
          input_text: textToAnalyze.slice(0, 100000),
          pdf_path: file ? `pdfs/${userId}/${Date.now()}_${file.name}` : null,
          ai_summary: analysisOutput,
          risk_level: analysisOutput.risk || "medium",
          tags: analysisOutput.tags || [],
        })
        .select()
        .single();

      if (dbError) {
        console.error("Supabase DB error saving case:", dbError);
      } else {
        insertedCase = data;
      }

      // Check if this is a new case to store into the TAT Case Library
      const isAlreadyInLibrary = textToAnalyze.includes("[Case Library:") || textToAnalyze.includes("[Case Library ");
      if (!isAlreadyInLibrary && analysisOutput.libraryCase) {
        try {
          const libInfo = analysisOutput.libraryCase;
          const yearVal = Number(libInfo.year) || new Date().getFullYear();
          let proposedNum = libInfo.case_number || `TAT No. ${Math.floor(100 + Math.random() * 900)} of ${yearVal}`;

          const { data: duplicate } = await supabaseAdmin
            .from("tat_cases")
            .select("id")
            .eq("case_number", proposedNum)
            .maybeSingle();

          if (duplicate) {
            proposedNum = `${proposedNum} (${Math.random().toString(36).substring(2, 6).toUpperCase()})`;
          }

          await supabaseAdmin.from("tat_cases").insert({
            case_number: proposedNum,
            title: libInfo.title || title,
            year: yearVal,
            tax_type: libInfo.tax_type || (caseType === "TAT Ruling" ? "Income Tax" : caseType),
            outcome: libInfo.outcome || "Allowed",
            summary: analysisOutput.summary,
            full_text: textToAnalyze,
            ai_commentary: analysisOutput.advice,
          });
        } catch (libErr) {
          console.error("Error running auto-insertion logic for Case Library:", libErr);
        }
      }
    } else {
      insertedCase = {
        id: `mock-case-${Date.now()}`,
        user_id: userId,
        title,
        input_text: textToAnalyze.slice(0, 100),
        pdf_path: file ? `pdfs/${userId}/${Date.now()}_${file.name}` : null,
        ai_summary: analysisOutput,
        risk_level: analysisOutput.risk || "medium",
        tags: analysisOutput.tags || [],
        created_at: new Date().toISOString(),
      };
    }

    return NextResponse.json({
      success: true,
      case: insertedCase,
      analysis: analysisOutput,
    });
  } catch (error: unknown) {
    console.error("General case analyzer API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred during analysis." },
      { status: 500 }
    );
  }
}
