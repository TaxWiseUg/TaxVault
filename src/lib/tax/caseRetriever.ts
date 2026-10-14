/**
 * Uganda Tax Appeals Tribunal (TAT) Precedent Retriever Engine
 * Provides intelligent search, statutory citation extraction, and precedent matching
 * for tax disputes and legal analysis.
 */

import { IMPORTED_TAT_CASES, ImportedTatCase } from "../importedData";

export interface PrecedentMatch {
  caseRecord: ImportedTatCase;
  relevanceScore: number; // 0 - 100
  matchedKeywords: string[];
  matchedSections: string[];
  ratioDecidendi: string;
  recommendedUse: string;
}

export interface ExtractedCitation {
  citation: string;
  type: "statute" | "tat_case" | "high_court";
  actOrCourt?: string;
  sectionOrNumber?: string;
  contextSnippet?: string;
}

/**
 * Common Ugandan tax legal keywords used for semantic scoring
 */
const LEGAL_TAX_TERMS = [
  "business asset",
  "capital gains",
  "withholding tax",
  "wht",
  "input tax",
  "output tax",
  "efris",
  "tax invoice",
  "objection",
  "30% deposit",
  "penal tax",
  "interest",
  "transfer pricing",
  "ebitda",
  "thin capitalization",
  "employment income",
  "paye",
  "fringe benefit",
  "exempt supply",
  "zero-rated",
  "burden of proof",
  "limitation period",
  "fraud",
  "nexus",
  "wholly and exclusively"
];

/**
 * Extracts statutory and case citations from text using regex patterns
 */
export function extractCitations(text: string): ExtractedCitation[] {
  if (!text) return [];
  const results: ExtractedCitation[] = [];
  const seen = new Set<string>();

  // Pattern 1: Statutory sections (e.g., "Section 18(1)(a) of the Income Tax Act", "S. 24 of the VAT Act", "Section 26 TPCA")
  const statuteRegex = /\b(?:Section|Sec\.|S\.)\s*([0-9]+(?:\([0-9a-zA-Z]+\))*)\s*(?:of the)?\s*(Income Tax Act|VAT Act|Value Added Tax Act|Tax Procedures Code Act|TPCA|Tax Appeals Tribunal Act|TAT Act)?/gi;
  let match: RegExpExecArray | null;

  while ((match = statuteRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!seen.has(raw.toLowerCase())) {
      seen.add(raw.toLowerCase());
      results.push({
        citation: raw,
        type: "statute",
        actOrCourt: match[2] || "Tax Legislation",
        sectionOrNumber: match[1],
        contextSnippet: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + match[0].length + 40)).trim()
      });
    }
  }

  // Pattern 2: TAT Case Numbers (e.g., "TAT No. 274 of 2025", "Application No. 125 of 2024")
  const tatRegex = /\b(?:TAT\s+(?:No\.|Application\s+No\.)|Application\s+No\.)\s*([0-9]+)\s+of\s+([0-9]{4})\b/gi;
  while ((match = tatRegex.exec(text)) !== null) {
    const raw = match[0].trim();
    if (!seen.has(raw.toLowerCase())) {
      seen.add(raw.toLowerCase());
      results.push({
        citation: raw,
        type: "tat_case",
        actOrCourt: "Tax Appeals Tribunal",
        sectionOrNumber: `${match[1]} of ${match[2]}`,
        contextSnippet: text.substring(Math.max(0, match.index - 20), Math.min(text.length, match.index + match[0].length + 40)).trim()
      });
    }
  }

  return results;
}

/**
 * Search TAT Precedents with full text, filters, and relevance ranking
 */
export function searchTATPrecedents(options: {
  query?: string;
  taxType?: string;
  outcome?: string;
  year?: number;
  limit?: number;
}): ImportedTatCase[] {
  const { query = "", taxType = "All", outcome = "All", year, limit = 20 } = options;
  const q = query.toLowerCase().trim();
  const searchTerms = q.split(/\s+/).filter((t) => t.length > 2);

  const cases = [...IMPORTED_TAT_CASES];

  const filtered = cases.filter((c) => {
    if (taxType !== "All" && c.tax_type?.toLowerCase() !== taxType.toLowerCase()) {
      return false;
    }
    if (outcome !== "All" && c.outcome?.toLowerCase() !== outcome.toLowerCase()) {
      return false;
    }
    if (year && c.year !== year) {
      return false;
    }

    if (!q) return true;

    const fullBlob = `${c.title} ${c.case_number} ${c.summary} ${c.full_text || ""} ${c.ai_commentary || ""}`.toLowerCase();
    // Match any search term or full query
    return fullBlob.includes(q) || searchTerms.some((term) => fullBlob.includes(term));
  });

  // Rank by match frequency and title weighting
  if (q) {
    filtered.sort((a, b) => {
      const scoreA = computeRelevanceScore(a, searchTerms, q);
      const scoreB = computeRelevanceScore(b, searchTerms, q);
      return scoreB - scoreA;
    });
  }

  return filtered.slice(0, limit);
}

function computeRelevanceScore(c: ImportedTatCase, terms: string[], fullQuery: string): number {
  let score = 0;
  const title = (c.title || "").toLowerCase();
  const summary = (c.summary || "").toLowerCase();
  const fullText = (c.full_text || "").toLowerCase();
  const commentary = (c.ai_commentary || "").toLowerCase();

  if (title.includes(fullQuery)) score += 50;
  if (summary.includes(fullQuery)) score += 30;
  if (commentary.includes(fullQuery)) score += 20;

  for (const term of terms) {
    if (title.includes(term)) score += 15;
    if (summary.includes(term)) score += 10;
    if (commentary.includes(term)) score += 8;
    if (fullText.includes(term)) score += 3;
  }

  return score;
}

/**
 * Intelligent precedent matcher: Finds the best TAT precedents for a given dispute text
 */
export function findMatchingPrecedents(disputeFacts: string, maxResults = 5): PrecedentMatch[] {
  if (!disputeFacts || disputeFacts.trim().length === 0) return [];

  const textLower = disputeFacts.toLowerCase();

  // 1. Identify present legal terms
  const presentKeywords = LEGAL_TAX_TERMS.filter((term) => textLower.includes(term));

  // 2. Identify sections mentioned in dispute facts
  const extracted = extractCitations(disputeFacts);
  const sectionsCited = extracted.map((e) => e.citation);

  const matched: PrecedentMatch[] = [];

  for (const caseRec of IMPORTED_TAT_CASES) {
    let score = 0;
    const caseText = `${caseRec.title} ${caseRec.summary} ${caseRec.ai_commentary || ""} ${caseRec.full_text || ""}`.toLowerCase();
    const matchedTerms: string[] = [];
    const matchedSecs: string[] = [];

    // Keyword overlap
    for (const kw of presentKeywords) {
      if (caseText.includes(kw)) {
        matchedTerms.push(kw);
        score += 15;
      }
    }

    // Tax type match
    if (caseRec.tax_type && textLower.includes(caseRec.tax_type.toLowerCase())) {
      score += 25;
      matchedTerms.push(caseRec.tax_type);
    }

    // Section overlap
    for (const sec of sectionsCited) {
      const secSimple = sec.replace(/\s+/g, " ").toLowerCase();
      if (caseText.includes(secSimple) || caseText.includes(sec.toLowerCase())) {
        matchedSecs.push(sec);
        score += 30;
      }
    }

    // High relevance if the summary contains identical concepts
    if (textLower.includes("land") && (caseRec.summary.toLowerCase().includes("land") || caseRec.title.toLowerCase().includes("wissanji"))) {
      score += 25;
    }
    if (textLower.includes("efris") && caseText.includes("efris")) {
      score += 30;
    }
    if (textLower.includes("withholding") && caseText.includes("withholding")) {
      score += 20;
    }

    // Normalize score to 0 - 98
    const finalScore = Math.min(98, Math.max(10, score));

    if (finalScore >= 20 || matchedTerms.length > 0) {
      // Extract ratio decidendi from summary or ai_commentary
      const ratio = extractRatioFromCase(caseRec);
      const recommendedUse = caseRec.outcome === "Allowed"
        ? `Cite to support taxpayer relief against URA assessment under ${caseRec.tax_type}.`
        : `Consider URA's counter-arguments regarding compliance burden and statutory requirements.`;

      matched.push({
        caseRecord: caseRec,
        relevanceScore: finalScore,
        matchedKeywords: Array.from(new Set(matchedTerms)),
        matchedSections: Array.from(new Set(matchedSecs)),
        ratioDecidendi: ratio,
        recommendedUse
      });
    }
  }

  // Sort descending by score
  matched.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return matched.slice(0, maxResults);
}

function extractRatioFromCase(caseRec: ImportedTatCase): string {
  if (caseRec.ai_commentary) {
    const firstPara = caseRec.ai_commentary.split("\n\n")[0];
    if (firstPara && firstPara.length > 50) return firstPara;
  }
  const summarySentences = (caseRec.summary || "").split(". ");
  return summarySentences.slice(0, 2).join(". ") + (summarySentences.length > 2 ? "." : "");
}
