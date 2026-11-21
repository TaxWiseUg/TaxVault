import React from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Scale } from "lucide-react";

interface LegalDocumentShellProps {
  activeRoute: "privacy" | "terms";
  badgeText: string;
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}

export function LegalDocumentShell({
  activeRoute,
  badgeText,
  title,
  effectiveDate,
  children,
}: LegalDocumentShellProps) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#0F2044] flex flex-col">
      <header className="sticky top-0 z-20 bg-white/95 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1A7B6B] transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
              <span>Back to TaxWise</span>
            </Link>
          </div>

          <nav aria-label="Legal navigation" className="flex items-center gap-2">
            <Link
              href="/privacy"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeRoute === "privacy"
                  ? "bg-[#1A7B6B]/10 text-[#1A7B6B]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Privacy Policy</span>
            </Link>
            <Link
              href="/terms"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                activeRoute === "terms"
                  ? "bg-[#1A7B6B]/10 text-[#1A7B6B]"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Terms of Service</span>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        <article className="bg-white border border-slate-200 rounded-xl p-8 sm:p-10 shadow-sm">
          <div className="border-b border-slate-200 pb-6 mb-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#1A7B6B]/10 border border-[#1A7B6B]/20 text-[#1A7B6B] text-[11px] font-bold uppercase tracking-wider mb-3">
              {badgeText}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#0F2044] mb-2">
              {title}
            </h1>
            <p className="text-sm text-slate-500">
              {effectiveDate} · TaxWise Uganda
            </p>
          </div>

          <div className="space-y-7 text-[15px] leading-relaxed text-slate-700">
            {children}
          </div>
        </article>
      </main>

      <footer className="border-t border-slate-200 bg-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <span>© {new Date().getFullYear()} TaxWise Uganda. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#1A7B6B] transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-[#1A7B6B] transition-colors">
              Terms of Service
            </Link>
            <a
              href="mailto:taxwiseplatform@gmail.com"
              className="hover:text-[#1A7B6B] transition-colors"
            >
              taxwiseplatform@gmail.com
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
