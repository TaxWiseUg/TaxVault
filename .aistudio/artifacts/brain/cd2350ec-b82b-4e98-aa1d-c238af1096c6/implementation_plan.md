# Implementation Plan — Refined Brand Quote & Optimized Mobile Auth Form

Upgrade the authentication screen (`src/components/AuthPage.tsx`) with an authoritative, brand-aligned showcase quote and a dedicated mobile layout that drops the background image in favor of a clean, well-proportioned warm ivory form.

---

## 1. Updated Showcase Quote & Subtitles

- **Primary Display Headline**:
  - Replace *"Every big practice starts small"* with:
    **"Precision in every precedent,<br />clarity in every tax position"**
  - Font: `'Playfair Display', Georgia, serif`, with graceful line-height, letter-spacing, and subtle text shadow for high readability against the abstract background.
- **Dynamic Mode Subtitles**:
  - Login: *"Log in to access your statutory tax intelligence workspace."*
  - Signup: *"Join leading Ugandan practitioners and start analyzing cases."*
  - Forgot / Reset: *"Verify your credentials and regain access to your workspace."*
  - Verify Email: *"Enter your activation code to complete verification."*

---

## 2. Mobile Responsive Overhaul (< 992px)

- **Complete Background Image Removal**:
  - For viewports `@media (max-width: 992px)`:
    - Set `.auth-root` to `background-image: none !important; background: #FFF7F0 !important; min-height: 100vh; height: auto;`.
    - No background image will load or display on mobile screens, saving bandwidth and creating a clean, professional native-like interface.
- **Top Brand & Back Navigation on Mobile**:
  - Invert text colors from white to deep slate (`#1F1914`) for mobile:
    - Back button: warm pill button with dark text and subtle warm border (`background: #FFFFFF; color: #2D241E; border: 1px solid #E8DFD8;`).
    - Logo: "TaxWise" in rich dark obsidian with the signature green accent.
- **Well-Sized Form Card on Mobile**:
  - On mobile, eliminate double-shadowing or awkward nested boxes by styling `.auth-card-sprout` seamlessly with the `#FFF7F0` background:
    - `background: transparent; box-shadow: none; border: none; padding: 20px 4px; max-width: 420px; width: 100%;`.
  - Maintain the crisp white pill inputs (`#FFFFFF` background, `#E8DFD8` subtle border, 13px padding) which pop beautifully against the `#FFF7F0` background.
  - Buttons (`#4AA41B` green CTA, Google SSO) remain full-width with comfortable 48px touch targets for mobile usability.
  - Form spacing and typography scaled proportionally for mobile (`1.4rem` card title, compact error and success alerts).

---

## 3. Verification & Build Confirmation

- Verify `src/components/AuthPage.tsx` with `lint_applet` to confirm 0 lint issues.
- Build with `compile_applet` to ensure 0 TypeScript or Next.js build errors.
- Confirm both desktop (abstract wave background + locked viewport) and mobile (clean ivory, no background, well-sized form) render as expected.
