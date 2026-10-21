# Know Your Taxes — TaxWise feature

Guided questionnaire → deterministic rules engine → plain-English explanations → PDF report → grounded Q&A.
Built for Next.js (App Router) + **JavaScript** + PostgreSQL + Prisma.

This is the plain-JavaScript edition (`.js` / `.jsx`), converted from the TypeScript version and re-tested: all 54 tests pass.
Types are kept as JSDoc in `types.js`, so VS Code still gives autocomplete and hover hints.

## What's in the box

```
prisma/
  schema.know-your-taxes.prisma        models to merge into schema.prisma (+ User back-relation)
  migrations/20261019000000_know_your_taxes/migration.sql
  seed-know-your-taxes.js              seeds rule set UG-2026.07 + legal sources (idempotent)
src/features/know-your-taxes/
  types.js                             Answers, Obligation, AssessmentResult, rule types
  questionnaire.js                     23 questions, each with showIf(); pruning when answers change
  validation.js                        zod (.strict() — rejects credentials / unknown fields)
  rules/sources.js                     legal sources (Acts, URA, NSSF, KCCA)
  rules/seed-rules.js                  versioned params + explanation content for 21 obligations
  engine/assess.js                     pure engine: (answers, rules, asOf) → result. No AI.
  engine/calculators.js                band tax, PAYE, rental, flat-rate, NSSF; rate summaries
  server/auth.js                       ADAPTER → point at your existing auth
  server/repository.js                 Prisma access, always scoped by userId
  server/qa.js                         grounded Q&A + number/citation verifier + deterministic fallback
  server/http.js                       error mapping + simple rate limiter
  report/ReportDocument.jsx            @react-pdf/renderer report
  components/KnowYourTaxesCard.jsx     dashboard card
  components/Questionnaire.jsx         stepper with progress, back, review screen
  components/ResultsView.jsx           results, obligation cards (A–K), ask panel
  __tests__/                           54 tests (7 profiles, presumptive bands & edges, VAT threshold, conditionals, citations, PDF, Q&A guards, access control)
src/app/(dashboard)/know-your-taxes/page.jsx        questionnaire
src/app/(dashboard)/know-your-taxes/[id]/page.jsx   results
src/app/api/know-your-taxes/assessments/...         POST/GET, /[id], /[id]/pdf, /[id]/ask
VERIFICATION.md                        every rule value that must be checked before marking VERIFIED
jsconfig.json                          `@/` path alias (merge into yours if you already have one)
```

## Install

1. **Inspect first.** I haven't seen your repo, so before copying: check `prisma/schema.prisma` for an existing
   `User` model and id type, your auth helper, your Prisma singleton path, and your existing PAYE/CIT/rental
   calculators and report module. Adjust the three `TODO` imports:
   - `server/auth.js` → your `getCurrentUserId()` (NextAuth / Supabase / Clerk examples in the file)
   - `server/repository.js` → `@/lib/prisma`
   - sign-in redirect path in `know-your-taxes/page.jsx`
2. Copy `src/` and `prisma/` files into the project.
3. Merge the models from `schema.know-your-taxes.prisma`, add `kytAssessments KytAssessment[] @relation("KytAssessments")` to `User`, then
   `npx prisma migrate dev --name know_your_taxes` (preferred over the hand-written SQL).
4. `npm i zod @react-pdf/renderer server-only` and `npm i -D vitest` if missing.
5. Seed rules: `node prisma/seed-know-your-taxes.js` (needs `"type": "module"` in package.json, or run it with `npx tsx`)
6. Add `<KnowYourTaxesCard />` to the dashboard grid.
7. Optional AI answers: set `ANTHROPIC_API_KEY` (and `KYT_MODEL`, default `claude-sonnet-5-5`). Without it the
   Ask panel uses deterministic answers from rule data.
8. Tests: `npx vitest run src/features/know-your-taxes`. The access-control test mocks `@/lib/prisma`, so that path must exist.

## Design decisions

- **Logic in code, numbers in data.** Each obligation's triggers are TypeScript (testable, reviewable);
  rates, thresholds and wording live in versioned `KytTaxRule` rows with per-parameter verification status.
- **Assessments are frozen.** Each stores its rule-set id, engine version, `asOf` date and full result snapshot,
  so a 2026/27 assessment stays reproducible after 2027/28 rules are published.
- **AI cannot invent law.** The model sees only a packet built from the user's obligation + rule data. The
  server rejects any answer containing a number not in that packet or a citation not in its source list, and
  falls back to deterministic text with a professional-review recommendation.
- **Four statuses**, never a blanket list: Likely · Needs more information (with the follow-up question ids) ·
  Professional review · Not applicable (with the reason). NSSF is labelled a statutory contribution and
  URSB/trading licences a registration obligation — neither is presented as a tax.
- **Unknown = unknown.** LST scales and penalty amounts are not encoded; the engine explains the rule and points
  to URA rather than producing a made-up figure.
- **Presumptive tax** uses the 2020/21+ national schedule: a fixed amount per turnover band, or the lower
  records-based amount if the user says they keep proper books. If they're unsure, the fixed amount is shown
  with the records option beside it.
- **Verification is per parameter.** The VAT registration threshold (UGX 300m) is VERIFIED and shown without a
  caveat; everything else still says "pending verification" until signed off (see VERIFICATION.md).
- **Privacy.** No TIN, NIN, passwords, URA logins or bank details are collected; `.strict()` validation rejects them.
  All queries filter on `userId`; foreign ids return 404.

## Reuse instead of duplicate

- PAYE bands: point `PAYE_EMPLOYEE.monthlyBands` and your existing PAYE calculator at the same source.
- Rental / CIT: the obligation cards link users onward to your existing calculators for full computations.
- PDF: if your multi-format compliance report module already registers Fraunces/Inter/Plex Mono, register
  them in `ReportDocument.jsx` with `Font.register` to match.
- VAT/EFRIS: the VAT card points users to the Compliance Review tool.
