# Implementation Complete: Remove Withholding Tax and Motor Vehicle Calculators

The Withholding Tax and Vehicle Import Duty calculators have been successfully removed from the dashboard's Tax Calculators page (`CalculatorsPortal.tsx`), keeping PAYE, VAT, Corporate Tax, and Rental Tax calculators intact.

---

## Completed Changes

### 1. `src/components/CalculatorsPortal.tsx`
- **Removed Calculator Tabs**: Deleted `wht` (Withholding Tax) and `import` (Vehicle Import Duty) tab definitions from `calculatorTabs`.
- **Cleaned Up Rate State**: Removed `wht` and `import` defaults and queries (`calc_wht_rate`, `calc_import_rate`).
- **Removed Calculations & Formula Previews**: Removed `case "wht":` and `case "import":` from calculation logic and cleaned up the quick formula display.
- **Updated Page Copy**: Subtitle now states: *"Switch between practical calculators for payroll, VAT, corporate planning, and rental income tax."*

### 2. `src/components/AdminPortal.tsx`
- Removed obsolete inputs for `calc_wht_rate` and `calc_import_rate` from the Calculator Rates settings card.
- Updated description to: *"Update the country tax rates used by the PAYE, VAT, and corporate tax calculators."*

---

## Verification
- `compile_applet`: Succeeded without errors.
- `lint_applet`: Completed with 0 errors.
- Dev server verified and returning HTTP 200 OK.
