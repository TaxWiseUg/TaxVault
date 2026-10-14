# Footer Section Refinement Plan

Refine the application footer section to align with user preferences: clean light neutral background matching the page theme, multi-column layout with official government & regulatory links, tax calculators & quick tools, copyright, and legal information.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **Confirmed Choices**: Light neutral background matching page theme, Official Government & Regulatory Links (URA, Tax Appeals Tribunal, ICPAU, Ministry of Finance), Tax Calculators and Quick Tools.
> - **Layout**: Clean multi-column layout with structured sections for quick navigation, tools, and regulatory resources.

## 1. Overview & Core Concept
- **What It Does**: Replaces/refines the footer section to provide quick access to key tax calculators, official regulatory bodies (URA, ICPAU, TAT, Ministry of Finance), legal resources, and copyright info with a light neutral background matching the platform aesthetic.
- **Key Value**: Professional finish with reliable statutory links and quick tools right at the bottom of the page.

## 2. User Experience & Visual Design
- **Visual Theme**: Light neutral background (`bg-slate-50` or `bg-gray-50` with subtle border-t `border-slate-200`), dark slate text for high legibility (`text-slate-900`, `text-slate-600`), and clean hover underlines.
- **Columns Structure**:
  1. **Brand & Mission**: TaxWise Uganda branding and brief professional tagline.
  2. **Official Regulatory Links**: URA Portal, ICPAU, Tax Appeals Tribunal, Ministry of Finance.
  3. **Tax Tools & Calculators**: PAYE Calculator, VAT Calculator, Withholding Tax Estimator, Tax Calendar.
  4. **Legal & Compliance**: Terms of Service, Privacy Policy, Security & Compliance.

## 3. Key Technical Architecture & Implementation Steps
- Locate `src/components/LandingPage.tsx` where the footer component is defined.
- Update the footer JSX to use a light neutral background (`bg-slate-50 border-t border-slate-200`) and the requested link groups.
- Ensure all links have active click handlers or working external URLs.
- Verify build and lint.
