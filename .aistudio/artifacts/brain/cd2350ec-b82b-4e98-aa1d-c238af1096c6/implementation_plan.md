# Top Navigation Bar Redesign & Elevation Plan (Revised)

Refining the TaxWise Uganda SaaS navigation bar to eliminate visual clutter, remove the "Enterprise" badge, remove redundant utility icons (notification, home, theme toggles), implement the user-specified dynamic **Home ⇄ Dashboard** dropdown toggle, and group the remaining platform tools into clean, organized dropdown menus.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Summary of confirmed adjustments incorporating your specific requirement:**
> - **Dynamic Home / Dashboard Switcher**:
>   - **When on Landing Page (`view === "landing"`)**: The dynamic button in the top navigation displays **"Home"** (with a home icon and chevron). Clicking opens a dropdown with a **"Dashboard"** button to enter the application workspace.
>   - **When in Dashboard / App View**: The dynamic button in the top navigation displays **"Dashboard"** (with a dashboard icon and chevron). Clicking opens a dropdown with a **"Home"** button to return to the public landing page.
> - **Badge Removal**: Completely remove the `"Enterprise"` pill badge adjacent to the TaxWise wordmark.
> - **Icon Decluttering**: Remove the standalone `Notification` (bell), `Home / Website` link, and `Theme` (sun/moon) toggle buttons from the top bar. (Theme controls and profile management remain in the user Profile dropdown).
> - **Tool Dropdown Organization**: Consolidate tool items into clean, domain-tailored dropdown menus:
>   1. **Advisory & Tools** (`Compliance Checker`, `Case Analyzer`, `Tax Calculators`)
>   2. **Legal & Insights** (`TAT Case Library`, `Tax Intelligence`, `Learning Hub`)
>   3. **Pricing** (as a clean direct nav link)

---

## 1. Overview & Core Concept

- **What It Does**: Streamlines the header into a focused, modern B2B SaaS navigation experience adhering to the strict **Top Bar Contract**:
  1. **Brand Zone**: Pure wordmark `TaxWise` with subtle subtitle (`Uganda Tax Platform`) without pill badges or tags.
  2. **Navigation Zone**:
     - **Dynamic Home ⇄ Dashboard Dropdown**:
       - On Landing Page: shows `[Home] Home ▾` $\rightarrow$ Dropdown reveals `[LayoutDashboard] Dashboard` ("Enter TaxWise Portal").
       - On Dashboard / Workspace: shows `[LayoutDashboard] Dashboard ▾` $\rightarrow$ Dropdown reveals `[Home] Home` ("Public Website & Features").
     - **Advisory & Tools Dropdown**: Groups transactional tools (`Compliance Checker`, `Case Analyzer`, `Tax Calculators`).
     - **Legal & Insights Dropdown**: Groups reference and educational resources (`TAT Precedent Library`, `Tax Intelligence`, `Learning Hub`).
     - **Pricing**: Clean direct link.
  3. **Action Zone**:
     - Live statutory clock & URA eFRIS status indicator.
     - User profile chip with dropdown (holding user info, plan details, settings, theme toggle, and sign out).
- **Target Persona**: Ugandan tax consultants, corporate accountants, CFOs, and revenue attorneys navigating complex URA statutory workflows.
- **Key Value**: Provides seamless, instant switching between the public landing page and the executive dashboard while organizing all functional modules without horizontal scroll or tab wrapping.

---

## 2. User Experience & Visual Design

### Header Structure

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│ [TW] TaxWise │ [Dynamic Home/Dashboard ▾] │ Advisory & Tools ▾ │ Legal & Insights ▾ │ Pricing │  │ Dec 15 · URA Active │ (JD) John Doe ▾ │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Dynamic Switcher Behavior Detail
- **State A: On Landing Page (`view === "landing"`)**:
  - Button label: `Home` with `Home` icon and `ChevronDown`.
  - Background: Crisp surface with subtle border.
  - Dropdown content:
    - **Header**: `Currently Viewing: Public Home`
    - **Action Item**: `[LayoutDashboard] Go to Executive Dashboard` (Switches `view` to `'app'` and `page` to `'dashboard'`).
- **State B: In Dashboard / App Workspace (`view === "app"`)**:
  - Button label: `Dashboard` with `LayoutDashboard` icon and `ChevronDown`.
  - Background: Active subtle accent (`rgba(26, 123, 107, 0.08)`), teal text `#1A7B6B`.
  - Dropdown content:
    - **Header**: `Currently in: App Workspace`
    - **Action Item**: `[Home] Return to Public Website` (Switches `view` to `'landing'`).
    - If user is currently on an inner page (like `compliance` or `analyzer`), the dropdown also allows switching straight back to `Executive Overview (Dashboard)`.

### Grouped Tool Dropdowns
- **Advisory & Tools Dropdown**:
  - `Compliance Checker` (with live URA audit indicator)
  - `Case Analyzer` (AI-assisted TAT argument drafter)
  - `Tax Calculators` (PAYE, VAT, WHT, Local Service Tax, Corporate Tax)
- **Legal & Insights Dropdown**:
  - `Case Library` (Full-text TAT rulings and High Court precedents)
  - `Tax Intelligence` (Gazette updates, URA circulars, EAC tariff updates)
  - `Learning Hub` (Uganda tax academy & CPD modules)

### Eliminated Clutter
- ❌ "Enterprise" badge removed from next to the logo.
- ❌ Standalone Website/Home button removed from right side.
- ❌ Standalone Theme toggle button removed from right side.
- ❌ Standalone Notification bell removed from right side.

---

## 3. Key Product Decisions & Rationale

- **Decision 1: Strict Context Switcher for Home ⇄ Dashboard**
  - *Chosen Approach*: Specifically toggle between `Home` and `Dashboard` based on the active view state as requested.
  - *Why*: Gives users an unambiguous, single-click pivot between the marketing/landing presentation and the operational tax dashboard, eliminating duplicate "Website" or "Home" buttons elsewhere in the interface.
- **Decision 2: Clear Categorical Grouping (Advisory vs. Legal)**
  - *Chosen Approach*: Split the 6 utility modules into two intuitive 3-item dropdowns.
  - *Why*: Eliminates navigation line breaks on medium laptop screens (1024px–1366px) while keeping related workflows logically paired.

---

## 4. Technical Implementation Outline

- **File Modified**: `src/app/page.tsx`
- **State Variables**:
  - `openNavDropdown`: `'home-dashboard' | 'advisory' | 'legal' | null`
  - Outside click and ESC key handlers to close any open dropdown.
- **Dynamic Switcher Logic**:
  ```tsx
  const isLanding = view === "landing";
  // Trigger button shows either Home or Dashboard:
  // - If isLanding: icon=<Home />, label="Home"
  // - If !isLanding: icon=<LayoutDashboard />, label="Dashboard"
  // Dropdown options offer the complementary destination!
  ```
- **Mobile Drawer**:
  - Ensure the mobile navigation drawer also groups the tools cleanly and provides the same intuitive Home ⇄ Dashboard switch.

---

## 5. Verification Plan

1. **Visual & Behavioral Verification**:
   - Confirm the "Enterprise" badge is gone next to the logo.
   - Confirm notification bell, theme toggle, and home icons are removed from the right navbar.
   - On the landing page, verify the dynamic button displays **"Home"** and its dropdown offers **"Dashboard"**.
   - On the dashboard / app views, verify the dynamic button displays **"Dashboard"** and its dropdown offers **"Home"** to return to the landing page.
   - Verify both "Advisory & Tools" and "Legal & Insights" dropdowns open smoothly and navigate correctly.
2. **Build Verification**:
   - Run `npm run lint` and `compile_applet` to confirm clean compilation and zero errors.
