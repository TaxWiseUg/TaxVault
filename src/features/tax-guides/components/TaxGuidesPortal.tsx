"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { TaxGuidesIndex } from "./TaxGuidesIndex";
import { TaxGuideDetail } from "./TaxGuideDetail";
import { findTaxGuide } from "../data/taxGuidesData";

interface TaxGuidesPortalProps {
  initialSlug?: string | null;
  fromKyt?: boolean;
  onBackToKyt?: () => void;
  onNavigate?: (pageId: string) => void;
}

export const TaxGuidesPortal: React.FC<TaxGuidesPortalProps> = ({
  initialSlug = null,
  fromKyt = false,
  onBackToKyt,
  onNavigate,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string | null>(initialSlug);

  useEffect(() => {
    if (initialSlug) {
      setSelectedSlug(initialSlug);
    }
  }, [initialSlug]);

  const activeGuide = selectedSlug ? findTaxGuide(selectedSlug) : null;

  const handleBack = () => {
    if (fromKyt && onBackToKyt) {
      onBackToKyt();
    } else {
      setSelectedSlug(null);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 1400, margin: "0 auto" }}>
      <AnimatePresence mode="wait">
        {activeGuide ? (
          <motion.div
            key={activeGuide.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: "100%" }}
          >
            <TaxGuideDetail
              guide={activeGuide}
              fromKyt={fromKyt}
              onBack={handleBack}
              onNavigatePage={onNavigate}
            />
          </motion.div>
        ) : (
          <motion.div
            key="index"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{ width: "100%" }}
          >
            <TaxGuidesIndex onSelectGuide={(slug) => setSelectedSlug(slug)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
