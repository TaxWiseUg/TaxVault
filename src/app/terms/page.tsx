import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/LegalDocumentShell";

export const metadata: Metadata = {
  title: "Terms of Service — TaxWise Uganda",
  description:
    "Terms of Service governing access to TaxWise Uganda statutory calculators, TAT precedent library, and compliance decision-support tools.",
};

export default function TermsOfServicePage() {
  return (
    <LegalDocumentShell
      activeRoute="terms"
      badgeText="Governing Jurisdiction · Republic of Uganda"
      title="Terms of Service"
      effectiveDate="Effective Date: July 15, 2026"
    >
      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">1. Acceptance &amp; Decision-Support Scope</h2>
        <p>
          By accessing or creating an account on TaxWise Uganda, you agree to these Terms of Service. TaxWise provides statutory calculators, compliance checklists, filing reminders, and a Tax Appeals Tribunal (TAT) precedents library strictly as a <strong>Decision-Support Tool</strong>. Outputs do not constitute formal legal advice, certified tax opinions, or official Uganda Revenue Authority (URA) assessments. Users should verify figures and legal positions with a qualified tax practitioner or advocate before filing returns or objections.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">2. Acceptable Professional Use</h2>
        <p className="mb-3">You are granted a limited, non-exclusive, non-transferable license to use the platform. You agree:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>Not to run automated scraping tools or bulk crawlers against our TAT Precedents Library or Tax Guides.</li>
          <li>Not to upload unlawful, counterfeit, or malicious files into document analysis features.</li>
          <li>To safeguard your account credentials and refrain from unauthorized sharing of paid firm seats.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">3. Subscriptions &amp; Billing</h2>
        <p>
          Paid subscription plans are billed in Uganda Shillings (UGX) on a recurring monthly basis through supported payment channels. You may cancel a paid subscription at any time; access continues through the end of the current paid billing cycle.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">4. Limitation of Liability</h2>
        <p>
          To the fullest extent permitted by law, TaxWise Uganda and its operators shall not be liable for any direct, indirect, incidental, or consequential damages, statutory penalties, interest, or assessment liabilities arising from URA audits, objection rejections, or missed filing deadlines (including the 15th monthly return due date and the 30-day TAT appeal window).
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">5. Governing Law &amp; Contact</h2>
        <p>
          These Terms are governed by the laws of the Republic of Uganda, and any disputes shall be subject to the jurisdiction of competent courts in Kampala, Uganda. Questions regarding these Terms may be directed to{" "}
          <a href="mailto:taxwiseplatform@gmail.com" className="text-[#1A7B6B] font-semibold underline">
            taxwiseplatform@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalDocumentShell>
  );
}
