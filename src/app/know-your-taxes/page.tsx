import React from "react";
import { KnowYourTaxesPortal } from "@/features/know-your-taxes/components/KnowYourTaxesPortal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Know Your Taxes · TaxWise Uganda",
  description: "Guided questionnaire and deterministic statutory rules engine for Ugandan tax obligations.",
};

export default function KnowYourTaxesPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F1] px-4 py-8">
      <div className="mx-auto max-w-6xl mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#5B6475] hover:text-[#0F2044]"
        >
          <ArrowLeft size={14} />
          <span>Back to TaxWise Dashboard</span>
        </Link>
      </div>
      <KnowYourTaxesPortal />
    </div>
  );
}
