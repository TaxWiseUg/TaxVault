"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { X, Scale, Check, Copy, Search, ShieldCheck, ArrowRight } from "lucide-react";
import { C } from "../lib/constants";
import { UGANDA_TAX_STATUTES } from "../lib/tax/ugandaTaxLaw";
import { IMPORTED_TAT_CASES, ImportedTatCase } from "../lib/importedData";
import { Badge, Button } from "./UI";

export interface CitationItem {
  type: "statute" | "tat_case";
  title: string;
  actOrCourt?: string;
  sectionOrNumber?: string;
  summary?: string;
  keyRules?: string[];
  burdenOfProof?: string;
  notes?: string;
  fullText?: string;
  outcome?: string;
  year?: number;
}

interface CitationViewerModalProps {
  open: boolean;
  citation: CitationItem | null;
  onClose: () => void;
  onInsertToDispute?: (citationText: string) => void;
}

export const CitationViewerModal: React.FC<CitationViewerModalProps> = ({
  open,
  citation,
  onClose,
  onInsertToDispute,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open || !citation) return null;
  if (typeof window === "undefined") return null;

  const handleCopy = () => {
    const textToCopy = citation.type === "statute"
      ? `${citation.sectionOrNumber} of the ${citation.actOrCourt} - ${citation.title}`
      : `${citation.sectionOrNumber}: ${citation.title} (${citation.year})`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 15, 30, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 1200,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          style={{
            background: C.white,
            borderRadius: 16,
            maxWidth: 680,
            width: "100%",
            maxHeight: "88vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(10, 20, 45, 0.28)",
            border: `1px solid ${C.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              background: citation.type === "statute" ? "linear-gradient(135deg, #0F2044 0%, #17346A 100%)" : "linear-gradient(135deg, #0F2044 0%, #1A7B6B 100%)",
              color: C.textWhite,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", opacity: 0.85 }}>
                  {citation.type === "statute" ? "Uganda Tax Statute Provision" : "Tax Appeals Tribunal Precedent"}
                </span>
                {citation.outcome && (
                  <Badge
                    color={citation.outcome === "Allowed" ? "#065F46" : citation.outcome === "Dismissed" ? "#991B1B" : "#854D0E"}
                    bg={citation.outcome === "Allowed" ? "#D1FAE5" : citation.outcome === "Dismissed" ? "#FEE2E2" : "#FEF3C7"}
                    style={{ fontWeight: 800, fontSize: "0.68rem" }}
                  >
                    {citation.outcome}
                  </Badge>
                )}
              </div>
              <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, lineHeight: 1.35, color: C.textWhite }}>
                {citation.sectionOrNumber ? `${citation.sectionOrNumber}: ` : ""}
                {citation.title}
              </h3>
              <div style={{ fontSize: "0.82rem", opacity: 0.85, marginTop: 4 }}>
                {citation.actOrCourt} {citation.year ? `· ${citation.year}` : ""}
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textWhite,
                cursor: "pointer",
                transition: "background 0.2s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.25)")}
              onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "24px 28px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Summary */}
            {citation.summary && (
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: C.navy, marginBottom: 6 }}>
                  Statutory Summary & Ratio
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: C.text, lineHeight: 1.65, background: C.offwhite, padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.border}` }}>
                  {citation.summary}
                </p>
              </div>
            )}

            {/* Key Statutory Rules */}
            {citation.keyRules && citation.keyRules.length > 0 && (
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: C.navy, marginBottom: 8 }}>
                  Key Principles & Judicial Standards
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {citation.keyRules.map((rule, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 10, fontSize: "0.85rem", color: C.text, lineHeight: 1.55 }}>
                      <span style={{ color: C.teal, fontWeight: 800, flexShrink: 0 }}>✓</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Burden of Proof Badge */}
            {citation.burdenOfProof && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(26,123,107,0.06)", padding: "10px 14px", borderRadius: 8, border: `1px solid rgba(26,123,107,0.18)` }}>
                <ShieldCheck size={18} style={{ color: C.teal, flexShrink: 0 }} />
                <div style={{ fontSize: "0.82rem", color: C.navy }}>
                  <strong>Burden of Proof:</strong> {citation.burdenOfProof} (Section 26, Tax Procedures Code Act 2014)
                </div>
              </div>
            )}

            {/* Tribunal Application Notes */}
            {citation.notes && (
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: C.gold, marginBottom: 6 }}>
                  Tax Appeals Tribunal Application Notes
                </div>
                <div style={{ fontSize: "0.84rem", color: C.text, background: "#FEF9EE", borderLeft: `3.5px solid ${C.gold}`, padding: "12px 16px", borderRadius: "0 8px 8px 0", lineHeight: 1.6 }}>
                  {citation.notes}
                </div>
              </div>
            )}

            {/* Full text snippet for TAT rulings */}
            {citation.fullText && (
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em", color: C.navy, marginBottom: 6 }}>
                  Tribunal Ruling Excerpt
                </div>
                <div style={{ fontSize: "0.8rem", color: C.muted, maxHeight: 160, overflowY: "auto", background: C.offwhite, padding: "12px 14px", borderRadius: 8, border: `1px solid ${C.border}`, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
                  {citation.fullText}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div
            style={{
              padding: "16px 24px",
              borderTop: `1px solid rgba(15, 32, 68, 0.08)`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: C.offwhite,
            }}
          >
            <button
              onClick={handleCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: C.white,
                border: `1.5px solid ${C.border}`,
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: C.navy,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {copied ? <Check size={14} style={{ color: C.green }} /> : <Copy size={14} />}
              <span>{copied ? "Copied!" : "Copy Citation"}</span>
            </button>

            <div style={{ display: "flex", gap: 10 }}>
              {onInsertToDispute && (
                <Button
                  small
                  onClick={() => {
                    const text = citation.type === "statute"
                      ? `[Statutory Reference: ${citation.sectionOrNumber} of the ${citation.actOrCourt} - ${citation.title}]`
                      : `[TAT Precedent: ${citation.sectionOrNumber} - ${citation.title} (${citation.year})]`;
                    onInsertToDispute(text);
                    onClose();
                  }}
                  style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <ArrowRight size={14} />
                  <span>Insert into Case Notes</span>
                </Button>
              )}
              <Button small variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

// ─── TAT Precedent Search Modal ────────────────────────────────────────────────
interface TATPrecedentSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectCase: (caseRecord: ImportedTatCase) => void;
  onViewCitation: (citation: CitationItem) => void;
}

export const TATPrecedentSearchModal: React.FC<TATPrecedentSearchModalProps> = ({
  open,
  onClose,
  onSelectCase,
  onViewCitation,
}) => {
  const [query, setQuery] = useState("");
  const [taxType, setTaxType] = useState("All");
  const [outcome, setOutcome] = useState("All");

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  if (!open) return null;
  if (typeof window === "undefined") return null;

  const filtered = IMPORTED_TAT_CASES.filter((c) => {
    const q = query.toLowerCase().trim();
    const matchesQ =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.case_number.toLowerCase().includes(q) ||
      c.summary.toLowerCase().includes(q) ||
      (c.ai_commentary && c.ai_commentary.toLowerCase().includes(q));

    const matchesType = taxType === "All" || c.tax_type?.toLowerCase() === taxType.toLowerCase();
    const matchesOutcome = outcome === "All" || c.outcome?.toLowerCase() === outcome.toLowerCase();

    return matchesQ && matchesType && matchesOutcome;
  });

  const outcomeColors: Record<string, [string, string]> = {
    Allowed: [C.green, "#DCFCE7"],
    Dismissed: [C.red, "#FEE2E2"],
    Partial: [C.gold, "#FEF3CD"],
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(10, 15, 30, 0.65)",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          zIndex: 1150,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "36px 20px",
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          style={{
            background: C.white,
            borderRadius: 16,
            maxWidth: 820,
            width: "100%",
            maxHeight: "86vh",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 60px rgba(10, 20, 45, 0.28)",
            border: `1px solid ${C.border}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${C.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "linear-gradient(135deg, #0F2044 0%, #1A7B6B 100%)",
              color: C.textWhite,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Scale size={18} style={{ color: C.tealLight }} />
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: C.textWhite }}>
                  Tax Appeals Tribunal Precedent Search
                </h3>
              </div>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", opacity: 0.85 }}>
                Search official Ugandan TAT rulings, ratio decidendi, and legal precedents
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.12)",
                border: "none",
                borderRadius: 8,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.textWhite,
                cursor: "pointer",
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Filters Bar */}
          <div style={{ padding: "16px 24px", background: C.offwhite, borderBottom: `1px solid ${C.border}`, display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 240, position: "relative" }}>
              <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.muted }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search precedents, parties, 'business asset', 'eFRIS', 'WHT'..."
                style={{
                  width: "100%",
                  padding: "9px 12px 9px 36px",
                  borderRadius: 8,
                  border: `1.5px solid ${C.border}`,
                  fontSize: "0.85rem",
                  fontFamily: "inherit",
                  outline: "none",
                  background: C.white,
                }}
              />
            </div>

            <select
              value={taxType}
              onChange={(e) => setTaxType(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: "0.82rem",
                fontFamily: "inherit",
                background: C.white,
                fontWeight: 600,
                color: C.navy,
              }}
            >
              <option value="All">All Tax Types</option>
              <option value="Income Tax">Income Tax</option>
              <option value="Value Added Tax">VAT</option>
              <option value="Customs Duty">Customs Duty</option>
              <option value="PAYE">PAYE</option>
            </select>

            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              style={{
                padding: "9px 12px",
                borderRadius: 8,
                border: `1.5px solid ${C.border}`,
                fontSize: "0.82rem",
                fontFamily: "inherit",
                background: C.white,
                fontWeight: 600,
                color: C.navy,
              }}
            >
              <option value="All">All Outcomes</option>
              <option value="Allowed">Allowed</option>
              <option value="Dismissed">Dismissed</option>
              <option value="Partial">Partial</option>
            </select>

            <span style={{ fontSize: "0.78rem", color: C.muted, fontWeight: 700, marginLeft: "auto" }}>
              {filtered.length} Precedent{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Results List */}
          <div style={{ padding: "16px 24px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
                <Search size={36} style={{ color: C.muted, opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>No matching TAT precedents found</div>
                <p style={{ fontSize: "0.8rem", marginTop: 4 }}>Try clearing search keywords or selecting &ldquo;All Tax Types&rdquo;.</p>
              </div>
            ) : (
              filtered.map((c) => (
                <div
                  key={c.id}
                  style={{
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "16px 20px",
                    background: C.white,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 16,
                    transition: "all 0.2s",
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = C.teal;
                    e.currentTarget.style.background = "rgba(26,123,107,0.03)";
                    e.currentTarget.style.boxShadow = "0 6px 18px rgba(15,32,68,0.06)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.background = C.white;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, color: C.navy, fontSize: "0.92rem", marginBottom: 3 }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: C.muted, fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: C.teal, fontWeight: 700 }}>{c.case_number}</span>
                      <span>·</span>
                      <span>{c.year}</span>
                      <span>·</span>
                      <span style={{ color: C.navy }}>{c.tax_type}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.82rem", color: C.text, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                      {c.summary}
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end", flexShrink: 0 }}>
                    <Badge
                      color={outcomeColors[c.outcome]?.[0] || C.muted}
                      bg={outcomeColors[c.outcome]?.[1] || C.offwhite}
                      style={{ fontWeight: 800 }}
                    >
                      {c.outcome}
                    </Badge>
                    <Badge
                      color={c.tax_type.toLowerCase().includes("vat") ? "#065F46" : c.tax_type.toLowerCase().includes("income") ? "#1E3A8A" : c.tax_type.toLowerCase().includes("customs") ? "#78350F" : "#4C1D95"}
                      bg={c.tax_type.toLowerCase().includes("vat") ? "#D1FAE5" : c.tax_type.toLowerCase().includes("income") ? "#DBEAFE" : c.tax_type.toLowerCase().includes("customs") ? "#FEF3C7" : "#EDE9FE"}
                      style={{ fontWeight: 800 }}
                    >
                      {c.tax_type}
                    </Badge>

                    <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                      <button
                        onClick={() =>
                          onViewCitation({
                            type: "tat_case",
                            title: c.title,
                            actOrCourt: "Tax Appeals Tribunal",
                            sectionOrNumber: c.case_number,
                            summary: c.summary,
                            outcome: c.outcome,
                            year: c.year,
                            notes: c.ai_commentary,
                            fullText: c.full_text,
                          })
                        }
                        style={{
                          background: C.offwhite,
                          border: `1px solid ${C.border}`,
                          borderRadius: 6,
                          padding: "5px 10px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: C.navy,
                          cursor: "pointer",
                        }}
                      >
                        View Citation
                      </button>

                      <Button
                        small
                        onClick={() => {
                          onSelectCase(c);
                          onClose();
                        }}
                      >
                        Load Case →
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

/**
 * Helper to match any arbitrary citation text (e.g. "Section 18 ITA" or "TAT No. 274") to a citation item
 */
export function resolveCitationItem(rawCitation: string): CitationItem {
  const clean = rawCitation.trim();

  // Check if it's a statute section
  const statuteMatch = UGANDA_TAX_STATUTES.find(
    (s) =>
      clean.toLowerCase().includes(s.section.toLowerCase()) ||
      s.section.toLowerCase().includes(clean.toLowerCase())
  );

  if (statuteMatch) {
    return {
      type: "statute",
      title: statuteMatch.title,
      actOrCourt: statuteMatch.act,
      sectionOrNumber: statuteMatch.section,
      summary: statuteMatch.summary,
      keyRules: statuteMatch.keyRules,
      burdenOfProof: statuteMatch.burdenOfProof,
      notes: statuteMatch.taxTribunalNotes,
    };
  }

  // Check if it's a TAT case
  const caseMatch = IMPORTED_TAT_CASES.find(
    (c) =>
      clean.toLowerCase().includes(c.case_number.toLowerCase()) ||
      c.case_number.toLowerCase().includes(clean.toLowerCase()) ||
      clean.toLowerCase().includes(c.title.toLowerCase().slice(0, 15))
  );

  if (caseMatch) {
    return {
      type: "tat_case",
      title: caseMatch.title,
      actOrCourt: "Tax Appeals Tribunal",
      sectionOrNumber: caseMatch.case_number,
      summary: caseMatch.summary,
      outcome: caseMatch.outcome,
      year: caseMatch.year,
      notes: caseMatch.ai_commentary,
      fullText: caseMatch.full_text,
    };
  }

  // Generic fallback citation item
  return {
    type: "statute",
    title: rawCitation,
    actOrCourt: "Uganda Tax Law",
    sectionOrNumber: rawCitation,
    summary: `Statutory reference or legal authority cited in Ugandan tax proceedings (${rawCitation}). Refer to the Income Tax Act (Cap 340), VAT Act (Cap 349), or Tax Procedures Code Act 2014 for exhaustive legislative wording.`,
    burdenOfProof: "Taxpayer (Section 26 TPCA)",
  };
}
