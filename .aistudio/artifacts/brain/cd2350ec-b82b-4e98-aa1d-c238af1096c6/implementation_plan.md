# Implementation Plan — Page Width Alignment & "On This Page" Navigation Fix

## Root Cause Analysis

1. **"On this page" nav pane not scrolling**:
   - The root scroll container is `.main-scroll-container` inside `src/app/page.tsx` (`overflow-y: auto`), whereas `TaxGuideDetail.tsx` called `window.scrollTo()`, which has no effect since `window.scrollY` is always 0.
   - Section targets lacked `scroll-margin-top` / container offset computation.
   - No scroll-spy or intersection observer existed to sync active TOC items as the user scrolls.

2. **Page width disparity & navigation transitions**:
   - `Dashboard.tsx` uses `maxWidth: 1400` with `width: 100%`.
   - `TaxGuideDetail.tsx` was artificially constrained to `maxWidth: 1100`, `TaxGuidesIndex.tsx` to `maxWidth: 1280`, and `ResultsView.tsx` to `maxWidth: 1200`, causing jarring visual width jumps when switching pages.
   - Navigation transitions between guides and other sections needed unified `motion.div` entrance animations matching the rest of TaxWise (`opacity: 0 -> 1`, subtle vertical translation, easeOut).

---

## Action Plan

### 1. Fix "On this page" Navigation Pane (`TaxGuideDetail.tsx`)
- Compute target offset relative to `.main-scroll-container`:
  ```ts
  const container = document.querySelector('.main-scroll-container');
  if (container) {
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const targetScroll = container.scrollTop + (elRect.top - containerRect.top) - 84;
    container.scrollTo({ top: targetScroll, behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  ```
- Set `scrollMarginTop: 90` on all 7 sections (`sec-what`, `sec-who`, `sec-rates`, `sec-filing`, `sec-example`, `sec-mistakes`, `sec-legal`).
- Attach an `IntersectionObserver` or scroll listener on `.main-scroll-container` to automatically update `activeSection` as the user scrolls through the guide.

### 2. Unify Page Widths Across All Pages (`100%`, `maxWidth: 1400`, `margin: "0 auto"`)
- Update `TaxGuideDetail.tsx` root container to `maxWidth: 1400, width: "100%", margin: "0 auto"`.
- Update `TaxGuidesIndex.tsx` root container to `maxWidth: 1400, width: "100%", margin: "0 auto"`.
- Update `ResultsView.tsx` root container to `maxWidth: 1400, width: "100%", margin: "0 auto"`.
- Update `KnowYourTaxesPortal.tsx` to ensure all views (`intro`, `questionnaire`, `result`) share the identical `maxWidth: 1400, width: "100%"`.

### 3. Unified Navigation Transitions / Animations
- Wrap `TaxGuidesPortal`, `TaxGuidesIndex`, and `TaxGuideDetail` with `motion.div` using standard TaxWise page entrance variants:
  ```ts
  const pageVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: "easeOut" } }
  };
  ```
- Ensure smooth route transitions when moving between Dashboard, Know Your Taxes, and Tax Guides.

### 4. Verification
- Verify clicking each item in "On this page" ("What it is", "Who it applies to", "Statutory rates", "Deadlines & filing", "Worked example", "Common pitfalls", "Legal reference") smoothly scrolls `.main-scroll-container` to the exact section with the heading properly positioned.
- Verify scrolling manually highlights the active section on the left sticky pane.
- Verify page switching between Dashboard, Tax Guides index, Tax Guide detail, and Know Your Taxes maintains the exact same width and transition.
- Verify `compile_applet` and `lint_applet` pass with 0 errors.
