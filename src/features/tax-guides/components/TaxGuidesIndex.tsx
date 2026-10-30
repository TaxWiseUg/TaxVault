"use client";

import React, { useState, useMemo } from "react";
import { motion } from "motion/react";
import { TaxCategory } from "../types";
import { TAX_CATEGORIES, TAX_GUIDES_DATA } from "../data/taxGuidesData";
import { WorkspacePageHero } from "@/components/WorkspacePageHero";
import { C } from "@/lib/constants";
import {
  Search,
  X,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  ShieldCheck,
} from "lucide-react";

interface TaxGuidesIndexProps {
  onSelectGuide: (slug: string) => void;
}

export const TaxGuidesIndex: React.FC<TaxGuidesIndexProps> = ({ onSelectGuide }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TaxCategory>("All");

  const filteredGuides = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return TAX_GUIDES_DATA.filter((guide) => {
      const matchCat =
        selectedCategory === "All" || guide.category === selectedCategory;
      if (!matchCat) return false;
      if (!q) return true;

      const haystack = [
        guide.title,
        guide.short,
        guide.summary,
        guide.category,
        ...(guide.tags || []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [searchQuery, selectedCategory]);

  const formatDate = (iso: string) => {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <motion.div
      className="workspace-feature-page workspace-tax-guides-index"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1400, width: "100%", margin: "0 auto" }}
    >
      {/* SIGNATURE TAXWISE HEADER BANNER */}
      <WorkspacePageHero
        eyebrow="STATUTORY REFERENCE & LEARNING HUB"
        title="Tax Guides & Statutory Reference"
        description="Plain-language statutory guides on Uganda’s main tax regimes: registration thresholds, rates, deadlines, worked numerical examples, and common audit pitfalls."
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: 700,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <CheckCircle2 size={13} style={{ color: "#7FC3A3" }} />
            <span>6 Regimes Published</span>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: 700,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <ShieldCheck size={13} style={{ color: C.gold }} />
            <span>FY 2025/26 Statutory Baseline</span>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 999,
              background: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              fontSize: "0.78rem",
              fontWeight: 700,
              backdropFilter: "blur(4px)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <FileText size={13} style={{ color: "#93C5FD" }} />
            <span>EFRIS & TAT Aligned</span>
          </div>
        </div>
      </WorkspacePageHero>

      {/* TOOLBAR: SEARCH & CATEGORY CHIPS */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          background: "var(--color-white)",
          padding: "16px 20px",
          borderRadius: 12,
          border: `1px solid ${C.border}`,
          boxShadow: "0 1px 4px rgba(15,32,68,0.03)",
        }}
      >
        {/* Search Bar */}
        <div
          style={{
            position: "relative",
            flex: "1 1 280px",
            maxWidth: 440,
          }}
        >
          <Search
            size={16}
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: C.muted,
              pointerEvents: "none",
            }}
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search VAT, PAYE, rental, presumptive..."
            style={{
              width: "100%",
              height: 42,
              padding: "0 36px 0 38px",
              borderRadius: 8,
              border: `1.5px solid ${C.border}`,
              background: "var(--color-offwhite)",
              color: C.navy,
              fontSize: "0.85rem",
              outline: "none",
              fontFamily: "inherit",
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = C.teal; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = C.border; }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: 10,
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                color: C.muted,
                cursor: "pointer",
                padding: 4,
                display: "flex",
              }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Category Chips */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {TAX_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  height: 36,
                  padding: "0 14px",
                  borderRadius: 999,
                  border: isSelected
                    ? `1.5px solid ${C.navy}`
                    : `1px solid ${C.border}`,
                  background: isSelected ? C.navy : "var(--color-offwhite)",
                  color: isSelected ? "#FFFFFF" : C.navy,
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: "0.82rem",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.15s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = C.teal;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = C.border;
                  }
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* RESULTS COUNT & DIRECTORY GRID */}
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
            padding: "0 4px",
          }}
        >
          <span
            style={{
              fontSize: "0.78rem",
              fontFamily: "monospace",
              color: C.muted,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Showing {filteredGuides.length} of {TAX_GUIDES_DATA.length} statutory guides
          </span>
          {searchQuery && (
            <span style={{ fontSize: "0.82rem", color: C.muted }}>
              Filtered by &ldquo;{searchQuery}&rdquo;
            </span>
          )}
        </div>

        {filteredGuides.length === 0 ? (
          <div
            style={{
              padding: "48px 24px",
              textAlign: "center",
              background: "var(--color-white)",
              borderRadius: 12,
              border: `1px dashed ${C.border}`,
            }}
          >
            <BookOpen size={36} style={{ color: C.muted, margin: "0 auto 12px", opacity: 0.5 }} />
            <div style={{ fontWeight: 800, fontSize: "1rem", color: C.navy, marginBottom: 6 }}>
              No tax guides match your search
            </div>
            <p style={{ margin: "0 0 16px", color: C.muted, fontSize: "0.88rem" }}>
              Try searching with another tax keyword, acronym, or clear your category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All");
              }}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                background: C.teal,
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
              }}
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
              gap: 20,
            }}
          >
            {filteredGuides.map((guide) => {
              const primaryFact = guide.keyFacts[0];
              return (
                <div
                  key={guide.slug}
                  onClick={() => onSelectGuide(guide.slug)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    background: "var(--color-white)",
                    borderRadius: 12,
                    border: `1.5px solid ${C.border}`,
                    padding: "22px 24px",
                    cursor: "pointer",
                    boxShadow: "0 2px 6px rgba(15,32,68,0.03)",
                    transition: "transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease",
                    position: "relative",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-3px)";
                    e.currentTarget.style.borderColor = C.teal;
                    e.currentTarget.style.boxShadow = "0 8px 20px rgba(26,123,107,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.borderColor = C.border;
                    e.currentTarget.style.boxShadow = "0 2px 6px rgba(15,32,68,0.03)";
                  }}
                >
                  {/* Top Bar: Code & Key Rate Badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 14,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.95rem",
                        fontWeight: 900,
                        color: C.teal,
                        letterSpacing: "0.06em",
                      }}
                    >
                      {guide.short}
                    </span>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "3px 10px",
                        borderRadius: 999,
                        background: "rgba(26, 123, 107, 0.1)",
                        color: C.teal,
                      }}
                    >
                      {primaryFact?.value || "Statutory Guide"}
                    </span>
                  </div>

                  {/* Title & Summary */}
                  <h3
                    style={{
                      margin: "0 0 8px",
                      fontSize: "1.2rem",
                      fontWeight: 800,
                      color: C.navy,
                      lineHeight: 1.25,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {guide.title}
                  </h3>

                  <p
                    style={{
                      margin: "0 0 16px",
                      fontSize: "0.88rem",
                      lineHeight: 1.6,
                      color: C.muted,
                      flex: 1,
                    }}
                  >
                    {guide.summary}
                  </p>

                  {/* Key Fact Highlight */}
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "var(--color-offwhite)",
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                      fontSize: "0.78rem",
                    }}
                  >
                    <span style={{ color: C.muted, fontWeight: 600 }}>Due:</span>
                    <span style={{ color: C.navy, fontWeight: 800 }}>{guide.keyFacts[2]?.value}</span>
                  </div>

                  {/* Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingTop: 14,
                      borderTop: `1px dashed ${C.border}`,
                      fontSize: "0.76rem",
                      fontFamily: "monospace",
                      color: C.muted,
                    }}
                  >
                    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      <span style={{ textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 700 }}>
                        {guide.category}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: C.muted }}>
                        {formatDate(guide.lastReviewed)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: C.teal,
                        fontWeight: 800,
                      }}
                    >
                      <span>Read Guide</span>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
