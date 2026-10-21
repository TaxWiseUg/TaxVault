"use client";

import React from "react";
import { ArrowRight, Compass, ShieldCheck, Sparkles } from "lucide-react";

interface KnowYourTaxesCardProps {
  onStart?: () => void;
  style?: React.CSSProperties;
}

export const KnowYourTaxesCard: React.FC<KnowYourTaxesCardProps> = ({ onStart, style }) => {
  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 16,
        padding: "26px 28px",
        background: "linear-gradient(135deg, #0F2044 0%, #142E57 55%, #155F52 100%)",
        border: "1.5px solid rgba(200, 146, 42, 0.4)",
        boxShadow: "0 10px 32px rgba(15, 32, 68, 0.16)",
        color: "#FFFFFF",
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
        ...style,
      }}
    >
      {/* Decorative Gold Radial Rings */}
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          right: -45,
          top: -45,
          width: 220,
          height: 220,
          borderRadius: "50%",
          border: "22px solid rgba(200, 146, 42, 0.12)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          pointerEvents: "none",
          position: "absolute",
          right: 30,
          bottom: -60,
          width: 170,
          height: 170,
          borderRadius: "50%",
          border: "16px solid rgba(26, 123, 107, 0.15)",
        }}
      />

      <div style={{ position: "relative", zIndex: 2 }}>
        {/* Top Badges */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(200, 146, 42, 0.2)",
              color: "#FCD34D",
              border: "1px solid rgba(200, 146, 42, 0.45)",
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: "0.72rem",
              fontWeight: 800,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            <Sparkles size={13} style={{ color: "#FCD34D" }} />
            <span>New · 2026/27 Statutory Rule Engine</span>
          </div>

          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontSize: "0.74rem",
              color: "rgba(255, 255, 255, 0.75)",
              fontWeight: 600,
            }}
          >
            <ShieldCheck size={14} style={{ color: "#4DD9C0" }} />
            <span>Deterministic Rules · Zero Hallucination</span>
          </div>
        </div>

        {/* Content & Action Row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 20,
          }}
        >
          <div style={{ maxWidth: 760 }}>
            <h2
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: "1.85rem",
                fontWeight: 900,
                color: "#FFFFFF",
                lineHeight: 1.2,
                margin: "0 0 8px 0",
                letterSpacing: "-0.01em",
              }}
            >
              Know Your Taxes
            </h2>
            <p
              style={{
                fontSize: "0.88rem",
                color: "rgba(255, 255, 255, 0.85)",
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Answer a few guided questions about your earnings, business activities, or rental properties. Our deterministic rules engine maps all 21 Ugandan statutory obligations—with exact rates, filing dates, and verified 2026 amendments.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "6px 16px",
                marginTop: 12,
                fontSize: "0.75rem",
                color: "#FDE68A",
                fontWeight: 600,
              }}
            >
              <span>✓ PAYE &amp; NSSF 2026 Bands</span>
              <span>✓ VAT UGX 300M Threshold (Enacted)</span>
              <span>✓ Presumptive vs Records-Based Tax</span>
              <span>✓ Rental &amp; Corporate CIT</span>
            </div>
          </div>

          <div>
            <button
              type="button"
              onClick={onStart}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "linear-gradient(135deg, #C8922A 0%, #E5A93C 100%)",
                color: "#0F2044",
                border: "none",
                borderRadius: 10,
                padding: "12px 20px",
                fontSize: "0.88rem",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 4px 16px rgba(200, 146, 42, 0.4)",
                transition: "all 0.18s ease",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(200, 146, 42, 0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(200, 146, 42, 0.4)";
              }}
            >
              <Compass size={17} />
              <span>Discover My Tax Obligations</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
