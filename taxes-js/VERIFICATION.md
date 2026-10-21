# Rule verification checklist — UG-2026.07

Every parameter in `src/features/know-your-taxes/rules/seed-rules.js` ships as **NEEDS_VERIFICATION** except those
listed under *Verified* below.
The UI and PDF label any figure built on an unverified parameter as *"pending verification"* and every
estimate as *"indicative"*. Nothing below should be flipped to `VERIFIED` until a qualified reviewer has
checked it against the **gazetted** Act (not a press summary) and replaced the landing-page URL with a deep link.

To verify, follow *How to mark a parameter verified* at the end. Set the rule's overall `verification` (and
`reviewedBy` / `reviewedAt` on the rule) to `VERIFIED` only once all of its params are.

## Verified

| Rule | Parameter | Value | Verified by / on |
|---|---|---|---|
| VAT | registrationThreshold | UGX 300,000,000 annual taxable turnover (UGX 75m per quarter), from 1 July 2026 — VAT (Amendment) Act 2026 | TaxWise (E. Bakulumpagi), 2026-10-19 |

## Pending verification

| Rule | Parameter | Seed value | Why it's flagged |
|---|---|---|---|
| PAYE_EMPLOYEE | monthlyBands | 0–335k: 0% · 335k–410k: 20% · 410k–485k: 25% · 485k–10m: 30% · >10m: 40% | Tax-free UGX 335,000 and the 25% band are widely reported for the Income Tax (Amendment) Act 2026. **The 20% first band and the 40% top band (>UGX 10m/month) need confirming.** Cross-check against TaxWise's existing PAYE calculator — they must use one source of truth. |
| INDIVIDUAL_INCOME_TAX | annualBands | Annualised PAYE bands; exempt UGX 4,020,000 | Same as above; top annual band (>UGX 120m) assumed. |
| VAT | rate / dueDay | 18% / 15th | Long-standing; confirm. |
| PRESUMPTIVE_TAX | lowerTurnover / upperTurnover | above UGX 10m, up to UGX 150m | Confirm whether the 2026 amendments moved the upper bound (VAT moved to 300m; presumptive did not appear in the 2026 summaries reviewed). |
| PRESUMPTIVE_TAX | fixedBands (no records) | >10m–30m: 80,000 · >30m–50m: 200,000 · >50m–80m: 400,000 · >80m–150m: 900,000 | Schedule in force from 2020/21 as described in UNU-WIDER Technical Note 2024/1 (URA data). Single national table — no location columns. Confirm against the Act's schedule. |
| PRESUMPTIVE_TAX | recordsBands (proper records) | >10m–30m: 0.4% of turnover above 10m · >30m–50m: 80,000 + 0.5% above 30m · >50m–80m: 180,000 + 0.6% above 50m · >80m–150m: 360,000 + 0.7% above 80m | Same source. The upper value of each band belongs to that band. |
| RENTAL_TAX_INDIVIDUAL | rate / threshold | 12% / UGX 2,820,000 | Threshold may have changed with the 2026 increase of the individual exemption to UGX 4,020,000. |
| RENTAL_TAX_NON_INDIVIDUAL | rate | 30% | Confirm deduction caps. |
| CORPORATE_INCOME_TAX | rate | 30% | Long-standing; confirm. |
| WHT_AGENT | rate / minPayment | 6% / UGX 1,000,000 | Confirm threshold and any 2026 changes (e.g. new 6% WHT on entertainers). |
| WHT_NON_RESIDENT | rate | 15% | Rate varies by payment type (2026 Act adds 5% on interest to foreign lenders). Professional-review wording kept. |
| WHT_IMPORTS | rate | 6% | Confirm. |
| NSSF | employee / employer | 5% / 10% | Confirm with NSSF Act; coverage of small employers. |
| All | Section numbers | pre-revision (e.g. ITA s.116, s.5, s.119, s.83; VAT Act s.7) | Uganda's Revised Edition (2023) renumbered sections — confirm. |
| All | Penalties | Not encoded | Penalty amounts are intentionally omitted; text refers users to the Tax Procedures Code Act. Add figures only once verified. |
| LOCAL_SERVICE_TAX | — | Not encoded | LST scales are set locally; add per local government if needed. |

Deadlines encoded as text: monthly PAYE / WHT / VAT / NSSF by the 15th of the following month; annual
individual return by 31 December; company return within six months of year-end. Confirm each with URA.

## How to mark a parameter verified

Set `verification: "VERIFIED"`, `verifiedBy` and `verifiedAt` on the param in `seed-rules.js` (see the VAT
threshold for the pattern), then re-run `node prisma/seed-know-your-taxes.js`. The seed merges params: it adds
new ones and applies seed-level verifications, but never downgrades a param already VERIFIED in the database.
