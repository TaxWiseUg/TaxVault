# Implementation Plan: App-Wide Layout, Typography, Breadcrumb Cleanup & Content Fit (Completed & Verified)

## 1. User Feedback & Problem Diagnosis
- **Breadcrumb Overload**: Two duplicate back links (`Back to Dashboard` and `← ← Back to Know Your Taxes Overview`) were stacked on top of each other.
- **Content Cut-Off**:
  - Questionnaire options and the action bar ("Back", "Next") were pushed below the viewport fold due to tall option button heights and excessive paddings.
  - In Results View, a rigid `gridTemplateColumns: "1fr 320px"` grid pushed the sidebar off the right screen edge on typical laptop displays and split-screen previews. Top KPI numbers were clipped against the viewport top.
- **Typography & Font**: Platform previously defaulted to generic `Inter`, while `Plus Jakarta Sans` is loaded in Google Fonts.
- **Navigation & Layout**: Dashboard had an unnecessary nested popup with redundant links.

---

## 2. Changes Implemented & Verified

### A. Unified Breadcrumb Trail
- In `src/features/know-your-taxes/components/KnowYourTaxesPortal.tsx`:
  - Replaced the stacked back buttons with a single unified breadcrumb row:
    `Dashboard / Know Your Taxes` (or `... / Statutory Questionnaire` or `... / Assessment Results`).
  - Removed duplicate back buttons from `Questionnaire.tsx` and `ResultsView.tsx`.

### B. Viewport Fit & Compact Questionnaire
- In `src/features/know-your-taxes/components/Questionnaire.tsx`:
  - Reduced outer card padding from `32px` to `20px 24px`.
  - Reduced option button padding from `14px 18px` to `10px 14px`, and gap from `10px` to `8px`.
  - Reduced progress bar height from `8px` to `6px` and vertical margins.
  - The entire card, prompt, choices, and action buttons now fit cleanly on screen without awkward cut-off.

### C. Responsive Grid & Overflow Protection in Results View
- In `src/app/globals.css`:
  - Added `.kyt-responsive-grid`: uses `minmax(0, 1fr) 320px` for desktop and `@media (max-width: 1080px)` stacking for tablet/laptop split-screen.
- In `src/features/know-your-taxes/components/ResultsView.tsx`:
  - Left column uses `minWidth: 0` to prevent wide text or calculations from blowing out the grid.
  - Right sidebar uses `width: "100%", minWidth: 0`.
  - Worked calculations box includes `wordBreak: "break-word"`, `whiteSpace: "pre-wrap"`, and `overflowX: "auto"`.
  - Top margin and container padding tuned to give KPI summary cards clear top headroom.

### D. Typography Upgrade Across Platform
- In `src/app/globals.css`:
  - Body and root font set to `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`.
  - Added tabular numbers (`.tabular-nums`) and smooth anti-aliasing.
- In all components: standardized to `'Plus Jakarta Sans', sans-serif`.

### E. Header & Navigation Refinement
- In `src/app/page.tsx`:
  - Replaced the awkward nested "Dashboard" popup with a direct, high-contrast navigation button.
  - Decreased main scroll container vertical padding from 32px/64px to 18px/48px, reclaiming ~40px of screen space.

### F. Grammar & Legal Title Polish
- In `src/features/know-your-taxes/rules/seed-rules.ts`:
  - Capitalized obligation titles to standard legal title case:
    - "Taxpayer Identification Number (TIN) Registration"
    - "Presumptive Tax (Small Business Taxpayers)"
    - "Corporate Income Tax (CIT)"
    - "Rental Income Tax (Individuals)"
    - "Rental Income Tax (Companies & Non-Individuals)"

---

## 3. Verification & Validation
- **`compile_applet`**: Build succeeded (0 errors).
- **`lint_applet`**: 0 ESLint errors across all files.
- **Dev Server**: Fresh server restarted on port 3000.
