# Implementation Plan — Eliminate Blurriness & Implement Tax Guides Adjustments

## 1. Problem Analysis & Root Cause

### A. Blurriness on Sticky Side Pane ("On this page") and Bottom Banner ("Actionable Workflow")
- **Cause**: Chromium & WebKit rasterize `position: sticky` and fixed/composite layers as GPU textures when nested inside parent elements with active or resolved `transform: translateY(...)` (e.g., `.page-fade-in` with `workspacePageEnter`, multiple nested `motion.div` containers in `TaxGuidesPortal` and `TaxGuideDetail`).
- **Effect**: Text and border elements in the sticky `<aside>` and the bottom gradient banner are rendered at subpixel fractional coordinates, resulting in noticeable font and edge blurriness.
- **Resolution**:
  - In `globals.css`: Update `.page-fade-in` and `workspacePageEnter` to animate purely on `opacity` without `transform`.
  - In `TaxGuidesPortal.tsx`: Animate page transitions purely via `opacity` (`initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`) so that ancestors do not retain lingering translate transforms.
  - In `TaxGuideDetail.tsx`: Remove the redundant outer `motion.div` wrapper translate transform. Add explicit hardware-compositing isolation and subpixel antialiasing properties:
    - `-webkit-font-smoothing: antialiased`
    - `-moz-osx-font-smoothing: grayscale`
    - `text-rendering: optimizeLegibility`
    - `isolation: isolate`
    - `transform: none` on static containers.

### B. Adjustments in `/taxwise-tax-guides/`
- The user has enhanced the tax guides data in `/taxwise-tax-guides/tax-guides-data.js` and structure in `tax-guides.js`/`tax-guides.css`:
  - **New sections**:
    - `changes`: "What changed on 1 July 2026" callout (with 2026 amendments for VAT, PAYE, Rental, CIT, WHT, Presumptive).
    - `rateTable` / `rateTables`: Structured tabular rate schedules (PAYE resident vs non-resident bands, Rental landlord breakdown, CIT capital allowances schedule, Presumptive turnover tier table with/without records, WHT 17-item statutory rates schedule).
    - `rateNotes`: Explanatory footnotes under rate schedules.
    - `examples`: Multiple worked examples per guide (e.g. VAT return + extracting inclusive VAT, PAYE resident + director above UGX 10m, Rental individual + company, CIT balance + provisional underestimate penalty, Presumptive UGX 40m + UGX 120m, WHT designated agent supply + non-resident consultancy).
    - `special`: Grid of cards covering special edge cases (e.g. imported services reverse charge, benefits in kind, jointly owned property, loss carry forward rules, WHT credit mechanics).
    - `penalties`: Exact statutory penalties under Tax Procedures Code Act (late return, late payment, false statements, EFRIS failures).
    - `faqs`: Frequently asked questions with interactive disclosure toggles.
    - `sources`: Direct links to official Uganda Revenue Authority and PwC statutory sources.
  - **Index View Updates**:
    - "Updated 2026" badge for guides with recent statutory changes.
    - "Reviewed [date]" and "6 of 6 guides published · Rules in force from 1 July 2026".
  - **Dynamic TOC**:
    - TOC dynamically generates links for only the sections present in the given guide.

---

## 2. Action Plan

### Step 1: Fix Visual Blurriness
1. Edit `src/app/globals.css`:
   - Change `@keyframes workspacePageEnter` and `.page-fade-in` to animate only `opacity` (remove `translateY(5px)`).
2. Edit `src/features/tax-guides/components/TaxGuidesPortal.tsx`:
   - Switch `motion.div` transitions to `initial={{ opacity: 0 }}`, `animate={{ opacity: 1 }}`, `exit={{ opacity: 0 }}` with no Y transforms.
3. Edit `src/features/tax-guides/components/TaxGuideDetail.tsx`:
   - Apply `-webkit-font-smoothing: antialiased`, `isolation: isolate`, and ensure the sticky `<aside>` and bottom banner are rendered razor-sharp.

### Step 2: Update TypeScript Types (`src/features/tax-guides/types.ts`)
- Add definitions for:
  - `TaxGuideChanges`: `{ title: string; points: string[] }`
  - `TaxGuideRateTable`: `{ caption?: string; columns: string[]; rows: string[][] }`
  - `TaxGuideSpecial`: `{ title: string; text: string }`
  - `TaxGuidePenalty`: `{ item: string; penalty: string }`
  - `TaxGuideFAQ`: `{ q: string; a: string }`
  - `TaxGuideSource`: `{ title: string; url: string }`
  - `TaxGuideExample`: `{ title?: string; scenario: string; lines: { label: string; calc: string; amount: number }[]; total: { label: string; amount: number; note: string } }`
  - Support `changes?`, `rateTable?`, `rateTables?`, `rateNotes?`, `examples: TaxGuideExample[]`, `special?`, `penalties?`, `faqs?`, `sources?` on `TaxGuideSections`.

### Step 3: Port Comprehensive Content (`src/features/tax-guides/data/taxGuidesData.ts`)
- Replace the simplified content with the complete, authoritative content from `/taxwise-tax-guides/tax-guides-data.js` across all 6 statutory guides (VAT, PAYE, Rental, CIT, Presumptive, WHT).

### Step 4: Upgrade `TaxGuideDetail.tsx` Component
- Dynamically build TOC items based on active sections.
- Render:
  - `changes`: Callout banner with green accent border and bullet points.
  - `who`: Who it applies to check items.
  - `rates`: Rate cards, tabular `rateTables` with mono figures and headers, and `rateNotes`.
  - `filing`: Step-by-step numbered instructions.
  - `examples`: All worked examples with ledger calculation lines and double-underline totals.
  - `special`: Grid of cards with subtle border and clear typography.
  - `penalties`: Ledger table displaying default vs statutory penalty.
  - `mistakes`: Common pitfalls with red warning icon.
  - `faqs`: Accessible expandable details/summary accordion.
  - `legal`: Statutory reference items with legal scale icon.
  - `sources`: Links to official URA and PwC references.
  - `related`: Quick-jump cards to other published tax guides.
  - Actionable workflow banner with crisp rendering.
- Keep smooth scrolling to container and scroll-spy synchronization.

### Step 5: Update `TaxGuidesIndex.tsx`
- Ensure cards show "Updated 2026" pill if `guide.sections.changes` exists.
- Display "Rules in force from 1 July 2026" subtext.
- Maintain unified 1400px width.

### Step 6: Verify Build & Appearance — COMPLETED
- `lint_applet` passed with 0 errors.
- `compile_applet` build succeeded.
- Text rendering on sticky "On this page" TOC and bottom "Actionable Workflow" banner is razor-sharp with subpixel antialiasing and isolation.
- Full updated tax guides schema and content from `/taxwise-tax-guides/tax-guides-data.js` are ported and working.
