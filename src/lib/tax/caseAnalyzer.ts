/**
 * Uganda Tax Case Analyzer Module
 * Combines Uganda Tax Law knowledge base, TAT Precedent Retriever,
 * and Google Gemini (gemini-3.8-flash) for deep statutory analysis and litigation strategy.
 */

import { GoogleGenAI } from "@google/genai";
import { findMatchingPrecedents, PrecedentMatch } from "./caseRetriever";
import { getTaxTopicProvisions, TaxStatuteSection } from "./ugandaTaxLaw";

export interface CaseAnalysisInput {
  text: string;
  caseType?: string;
  clientRole?: "Taxpayer" | "Tax Consultant" | "Legal Counsel" | "URA Auditor";
  disputeAmount?: string;
  fileSnippet?: string;
}

export interface StatutoryReference {
  act: string;
  section: string;
  title: string;
  relevance: string;
}

export interface DetailedPrecedentCitation {
  caseNumber: string;
  title: string;
  year: number;
  outcome: string;
  ratio: string;
  howToDistinguishOrApply: string;
}

export interface CaseAnalysisOutput {
  summary: string;
  keyIssues: string[];
  verdict: string;
  risk: "low" | "medium" | "high";
  riskNote: string;
  advice: string;
  applicableLaw: string[];
  statutoryDetails: StatutoryReference[];
  matchedPrecedents: DetailedPrecedentCitation[];
  proceduralSteps: string[];
  winProbabilityEstimate?: string;
  tags: string[];
  libraryCase?: {
    case_number: string;
    title: string;
    year: number;
    tax_type: string;
    outcome: "Allowed" | "Dismissed" | "Partial";
  };
  aiProvider: "gemini-3.8-flash" | "uganda-statutory-engine";
}

/**
 * High-level case analysis orchestration using Gemini + Uganda Tax Law + TAT Precedents
 */
export async function analyzeTaxDispute(input: CaseAnalysisInput): Promise<CaseAnalysisOutput> {
  const combinedText = `${input.fileSnippet ? `[ATTACHED EVIDENCE / RULING]:\n${input.fileSnippet}\n\n` : ""}${input.text}`.trim();
  const caseType = input.caseType || "Tax Dispute / TAT Appeal";

  // 1. Retrieve applicable statutory provisions
  const relevantStatutes = getTaxTopicProvisions(`${caseType} ${combinedText.slice(0, 300)}`);

  // 2. Retrieve matched TAT precedents
  const precedentMatches = findMatchingPrecedents(combinedText, 4);

  // 3. Try Google Gemini analysis first
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const result = await runGeminiAnalysis(combinedText, caseType, input.clientRole, relevantStatutes, precedentMatches);
      return result;
    } catch (err) {
      console.warn("Gemini API call failed, falling back to local Uganda statutory engine:", err);
    }
  }

  // 5. Fallback offline heuristic engine if no API key or network error
  return generateStatutoryFallback(combinedText, caseType, relevantStatutes, precedentMatches);
}

/**
 * Runs server-side Gemini 3.8 Flash model with groundings on Uganda statutes & TAT cases
 */
async function runGeminiAnalysis(
  text: string,
  caseType: string,
  clientRole = "Taxpayer",
  relevantStatutes: TaxStatuteSection[],
  precedents: PrecedentMatch[]
): Promise<CaseAnalysisOutput> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

  const statutoryContext = relevantStatutes
    .map((s) => `• ${s.act} ${s.section} (${s.title}): ${s.summary} Rules: ${s.keyRules.join("; ")} [TAT Note: ${s.taxTribunalNotes || "N/A"}]`)
    .join("\n");

  const precedentContext = precedents
    .map((p) => `• Case ${p.caseRecord.case_number} (${p.caseRecord.title}, ${p.caseRecord.year}): Outcome: ${p.caseRecord.outcome}. Tax: ${p.caseRecord.tax_type}. Ratio: ${p.ratioDecidendi}`)
    .join("\n");

  const systemPrompt = `You are TaxWise, a senior Ugandan Tax Attorney and former Tax Appeals Tribunal (TAT) legal researcher.
You are analyzing a dispute involving the Uganda Revenue Authority (URA), Income Tax Act (Cap 340), Value Added Tax Act (Cap 349), Tax Procedures Code Act 2014 (TPCA), and Tax Appeals Tribunal Act.

You must ground your reasoning strictly in Ugandan statutes and Tax Appeals Tribunal precedents.
Return ONLY a valid JSON object matching the requested schema. No code fences.

MANDATORY JSON FORMAT:
{
  "summary": "2-3 sentence clear, objective summary of the dispute and legal nexus",
  "keyIssues": ["Issue 1 framed legally", "Issue 2 framed legally", "Issue 3"],
  "verdict": "Clear forecast on likely outcome before TAT (e.g., Favorable for Taxpayer / Likely URA Confirmation / Partial Relief)",
  "risk": "low" | "medium" | "high",
  "riskNote": "One concise sentence pinpointing the highest legal exposure (e.g., 30% deposit requirement, missing eFRIS fiscal verification, or 3-year audit limitation)",
  "advice": "3-4 sentences of direct, actionable tactical advice for ${clientRole} (objection filing deadlines under S.24 TPCA, documentary proof required, alternative dispute resolution)",
  "applicableLaw": ["Section and Act names cited"],
  "statutoryDetails": [
    {
      "act": "Income Tax Act | Value Added Tax Act | TPCA | TAT Act",
      "section": "Section number",
      "title": "Title of section",
      "relevance": "Why this specific section applies to the dispute"
    }
  ],
  "matchedPrecedents": [
    {
      "caseNumber": "TAT No. ...",
      "title": "Case title",
      "year": 2025,
      "outcome": "Allowed | Dismissed | Partial",
      "ratio": "The primary legal holding / ratio decidendi",
      "howToDistinguishOrApply": "How the taxpayer or practitioner can apply this precedent to win"
    }
  ],
  "proceduralSteps": [
    "Step 1 with statutory deadline (e.g., File Notice of Objection within 45 days under S.24 TPCA)",
    "Step 2 (e.g., Secure eFRIS fiscal invoices or bank statements)",
    "Step 3 (e.g., Appeal to TAT within 30 days of objection decision under S.14 TAT Act)"
  ],
  "winProbabilityEstimate": "e.g., 75% Taxpayer Win Probability (or 40% based on documentation gaps)",
  "tags": ["3-5 legal tags"],
  "libraryCase": {
    "case_number": "Realistic TAT case number",
    "title": "Formal legal title Appellant v URA",
    "year": 2026,
    "tax_type": "${caseType}",
    "outcome": "Allowed" | "Dismissed" | "Partial"
  }
}`;

  const prompt = `Tax Dispute Category: ${caseType}
Client Role: ${clientRole}

AVAILABLE STATUTORY BENCHMARKS:
${statutoryContext || "Refer to Income Tax Act, VAT Act, and TPCA 2014."}

RETRIEVED TAT PRECEDENTS:
${precedentContext || "Refer to established TAT rulings on burden of proof (S.26 TPCA) and statutory construction."}

DISPUTE FACTS & EVIDENCE TO ANALYZE:
${text}
`;

  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: prompt,
    config: {
      systemInstruction: systemPrompt,
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });

  const rawJson = response.text || "{}";
  const parsed = JSON.parse(rawJson.trim());

  return {
    summary: parsed.summary || "Summary of tax dispute under Ugandan statutory review.",
    keyIssues: Array.isArray(parsed.keyIssues) ? parsed.keyIssues : ["Statutory compliance under URA provisions"],
    verdict: parsed.verdict || "Assessment subject to administrative review.",
    risk: parsed.risk === "high" || parsed.risk === "medium" ? parsed.risk : "low",
    riskNote: parsed.riskNote || "Review documentation against statutory burden of proof.",
    advice: parsed.advice || "File an objection within 45 days under S.24 of the Tax Procedures Code Act.",
    applicableLaw: Array.isArray(parsed.applicableLaw) ? parsed.applicableLaw : ["Income Tax Act", "Tax Procedures Code Act 2014"],
    statutoryDetails: Array.isArray(parsed.statutoryDetails) ? parsed.statutoryDetails : relevantStatutes.slice(0, 3).map((s) => ({
      act: s.act,
      section: s.section,
      title: s.title,
      relevance: s.summary
    })),
    matchedPrecedents: Array.isArray(parsed.matchedPrecedents) && parsed.matchedPrecedents.length > 0
      ? parsed.matchedPrecedents
      : precedents.slice(0, 3).map((p) => ({
          caseNumber: p.caseRecord.case_number,
          title: p.caseRecord.title,
          year: p.caseRecord.year,
          outcome: p.caseRecord.outcome,
          ratio: p.ratioDecidendi,
          howToDistinguishOrApply: p.recommendedUse
        })),
    proceduralSteps: Array.isArray(parsed.proceduralSteps) ? parsed.proceduralSteps : [
      "Lodge objection in writing within 45 calendar days under Section 24 of the TPCA.",
      "Consolidate contemporaneously fiscalized eFRIS receipts and payment logs.",
      "If dissatisfied, file Application for Review before TAT within 30 days under Section 14 TAT Act."
    ],
    winProbabilityEstimate: parsed.winProbabilityEstimate || (parsed.risk === "high" ? "35% favorable" : parsed.risk === "medium" ? "60% favorable" : "80% favorable"),
    tags: Array.isArray(parsed.tags) ? parsed.tags : ["Uganda Tax", "TAT Precedent", caseType],
    libraryCase: parsed.libraryCase,
    aiProvider: "gemini-3.8-flash"
  };
}

/**
 * Fallback statutory analysis when offline or when Gemini API is unconfigured
 */
function generateStatutoryFallback(
  text: string,
  caseType: string,
  statutes: TaxStatuteSection[],
  precedents: PrecedentMatch[]
): CaseAnalysisOutput {
  const isVat = text.toLowerCase().includes("vat") || caseType.toLowerCase().includes("vat");
  const isWht = text.toLowerCase().includes("withholding") || text.toLowerCase().includes("wht");
  const isEfris = text.toLowerCase().includes("efris") || text.toLowerCase().includes("invoice");
  const isLand = text.toLowerCase().includes("land") || text.toLowerCase().includes("property");

  let risk: "low" | "medium" | "high" = "medium";
  let verdict = "Favorable prospect upon furnishing verified documentary evidence";
  let winProb = "65% Likelihood of Success before TAT";

  if (isEfris && text.toLowerCase().includes("no receipt")) {
    risk = "high";
    verdict = "High risk of URA assessment confirmation due to missing fiscalized eFRIS documentation";
    winProb = "30% Likelihood of Success";
  } else if (isLand) {
    risk = "low";
    verdict = "Strong taxpayer defense under TAT precedent (Asafali Wissanji v URA)";
    winProb = "80% Likelihood of Success";
  }

  const statutoryDetails: StatutoryReference[] = statutes.slice(0, 3).map((s) => ({
    act: s.act,
    section: s.section,
    title: s.title,
    relevance: s.summary
  }));

  const matchedPrecedents: DetailedPrecedentCitation[] = precedents.slice(0, 3).map((p) => ({
    caseNumber: p.caseRecord.case_number,
    title: p.caseRecord.title,
    year: p.caseRecord.year,
    outcome: p.caseRecord.outcome,
    ratio: p.ratioDecidendi,
    howToDistinguishOrApply: p.recommendedUse
  }));

  return {
    summary: `Tax dispute in Uganda under ${caseType}. Primary legal assessment addresses statutory liability, evidentiary burden under TPCA Section 26, and applicable tribunal standards.`,
    keyIssues: [
      `Whether the assessed transaction constitutes taxable income or supply under Uganda revenue law`,
      `Whether the taxpayer satisfied the statutory burden of proof under Section 26 of the Tax Procedures Code Act`,
      `Compliance with procedural objection and appeal timelines under TPCA and TAT Act`
    ],
    verdict,
    risk,
    riskNote: `Taxpayer must establish strict contemporaneous documentation to counter URA's administrative assessment.`,
    advice: `Lodge a formal objection within 45 days under Section 24 of the TPCA. Gather stamped bank confirmations, contracts, and eFRIS logs before scheduling an objection conference with URA.`,
    applicableLaw: statutes.map((s) => `${s.section} of the ${s.act}`),
    statutoryDetails,
    matchedPrecedents,
    proceduralSteps: [
      "File objection notice within 45 days of assessment receipt (TPCA S.24).",
      "Collate eFRIS invoices, bank statements, and relevant commercial agreements.",
      "If objection is rejected, file application with the Tax Appeals Tribunal within 30 days (TAT Act S.14)."
    ],
    winProbabilityEstimate: winProb,
    tags: [caseType, "Tax Appeals Tribunal", isEfris ? "eFRIS" : isWht ? "Withholding Tax" : isVat ? "VAT Compliance" : "Assessment Review"],
    aiProvider: "uganda-statutory-engine"
  };
}
