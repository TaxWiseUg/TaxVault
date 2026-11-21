import type { Metadata } from "next";
import { LegalDocumentShell } from "@/components/LegalDocumentShell";

export const metadata: Metadata = {
  title: "Privacy Policy — TaxWise Uganda",
  description:
    "How TaxWise Uganda collects, protects, and processes account, Google Sign-In, and tax compliance data under the Uganda Data Protection and Privacy Act, 2019.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalDocumentShell
      activeRoute="privacy"
      badgeText="Compliance · Uganda Data Protection Act 2019"
      title="Privacy Policy"
      effectiveDate="Effective Date: July 15, 2026"
    >
      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">1. Scope and Overview</h2>
        <p>
          TaxWise Uganda (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) operates a statutory tax intelligence and compliance platform for tax consultants, accountants, legal practitioners, and business owners in Uganda. This Privacy Policy explains how we collect, store, transmit, and protect your account information and the tax records you process in our workspace, in alignment with the <strong>Uganda Data Protection and Privacy Act, 2019</strong>.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">2. Information We Collect</h2>
        <p className="mb-3">We collect and process only the data necessary to authenticate your workspace and run tax analysis tools:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>Account Credentials:</strong> Your full name, verified email address, professional role, and subscription status.
          </li>
          <li>
            <strong>Google Sign-In (OAuth) Data:</strong> When you sign in with Google, we request only basic identity scopes (<code>userinfo.email</code> and <code>userinfo.profile</code>) to retrieve your email address, display name, and profile avatar. We do not access your Gmail messages, Google Drive files, contacts, or calendar unless you explicitly initiate a separate integration.
          </li>
          <li>
            <strong>Tax &amp; Compliance Inputs:</strong> Assessment summaries, PAYE/WHT/VAT calculation parameters, compliance checklists, and documents uploaded for review inside your authenticated workspace.
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">3. How We Use Information</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>Authenticate your account, enforce role-based permissions, and maintain active sessions.</li>
          <li>Generate statutory tax calculations, filing reminders, compliance reviews, and TAT precedent briefs requested by you.</li>
          <li>Send essential account verification, security, or subscription notices.</li>
          <li>We never sell, rent, or trade your personal data or Google user data to advertisers or third-party data brokers.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">4. Storage, Security &amp; Third-Party Disclosures</h2>
        <p>
          All traffic is encrypted in transit using HTTPS/TLS, and stored records are protected on managed cloud infrastructure (Supabase PostgreSQL and Google Firebase Authentication) with access controls and row-level security. We only disclose records if expressly authorized by you or required by a valid legal order issued by a competent court or tribunal in the Republic of Uganda.
        </p>
      </section>

      <section>
        <h2 className="text-lg font-bold text-[#0F2044] mb-2">5. Data Retention &amp; Right of Deletion</h2>
        <p>
          Under Section 18 of the Uganda Data Protection and Privacy Act, you retain ownership of your records. You may delete your account and associated profile records at any time from <strong>Profile &amp; Settings</strong>, or request assistance by emailing{" "}
          <a href="mailto:taxwiseplatform@gmail.com" className="text-[#1A7B6B] font-semibold underline">
            taxwiseplatform@gmail.com
          </a>
          .
        </p>
      </section>
    </LegalDocumentShell>
  );
}
