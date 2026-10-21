export const ugx = (n) => `UGX ${Math.round(n).toLocaleString("en-UG")}`;
export function param(rule, key) {
  const p = rule.params.find((x) => x.key === key);
  if (!p) throw new Error(`Rule ${rule.code}@${rule.version} has no param "${key}"`);
  return { value: p.value, p };
}
function used(...ps) {
  return {
    indicativeOnly: ps.some((x) => x.verification !== "VERIFIED"),
    paramsUsed: ps.map((x) => ({ key: x.key, verification: x.verification })),
  };
}
/** Progressive band tax. bands = [from, to, ratePct][] sorted ascending. */
export function bandTax(income, bands) {
  let tax = 0;
  const lines = [];
  for (const [from, to, rate] of bands) {
    if (income <= from) break;
    const slice = Math.min(income, to) - from;
    const t = (slice * rate) / 100;
    tax += t;
    if (rate > 0)
      lines.push(
        `${ugx(slice)} between ${ugx(from)} and ${to >= Number.MAX_SAFE_INTEGER ? "above" : ugx(to)} × ${rate}% = ${ugx(t)}`,
      );
    else lines.push(`First ${ugx(Math.min(income, to))} is tax-free`);
  }
  return { tax: Math.round(tax), lines };
}
export function payeEstimate(rule, monthlySalary) {
  const { value: bands, p } = param(rule, "monthlyBands");
  const { tax, lines } = bandTax(monthlySalary, bands);
  return {
    amount: tax,
    period: "MONTHLY",
    basis: "ESTIMATE",
    workings: [`Gross monthly salary: ${ugx(monthlySalary)}`, ...lines, `Estimated PAYE: ${ugx(tax)} per month`],
    ...used(p),
  };
}
export function individualIncomeTaxEstimate(rule, annualChargeable) {
  const { value: bands, p } = param(rule, "annualBands");
  const { tax, lines } = bandTax(annualChargeable, bands);
  return {
    amount: tax,
    period: "ANNUAL",
    basis: "ESTIMATE",
    workings: [
      `Estimated chargeable income: ${ugx(annualChargeable)}`,
      ...lines,
      `Estimated tax: ${ugx(tax)} per year (before credits for tax already withheld)`,
    ],
    ...used(p),
  };
}
export function rentalIndividualEstimate(rule, grossRent) {
  const { value: rate, p: pr } = param(rule, "rate");
  const { value: threshold, p: pt } = param(rule, "threshold");
  const taxable = Math.max(0, grossRent - threshold);
  const tax = Math.round((taxable * rate) / 100);
  return {
    amount: tax,
    period: "ANNUAL",
    basis: "ESTIMATE",
    workings: [
      `Gross annual rent: ${ugx(grossRent)}`,
      `Less threshold: ${ugx(threshold)}`,
      `Amount subject to tax: ${ugx(taxable)}`,
      `${ugx(taxable)} × ${rate}% = ${ugx(tax)} per year`,
    ],
    ...used(pr, pt),
  };
}
export function flatRateEstimate(rule, base, baseLabel, period) {
  const { value: rate, p } = param(rule, "rate");
  const tax = Math.round((base * rate) / 100);
  return {
    amount: tax,
    period,
    basis: "ESTIMATE",
    workings: [`${baseLabel}: ${ugx(base)}`, `${ugx(base)} × ${rate}% = ${ugx(tax)}`],
    ...used(p),
  };
}
export function nssfEstimate(rule, monthlyPayroll) {
  const { value: er, p: per } = param(rule, "employerRate");
  const { value: ee, p: pee } = param(rule, "employeeRate");
  const employer = Math.round((monthlyPayroll * er) / 100);
  const employee = Math.round((monthlyPayroll * ee) / 100);
  return {
    amount: employer + employee,
    period: "MONTHLY",
    basis: "ESTIMATE",
    workings: [
      `Gross monthly payroll: ${ugx(monthlyPayroll)}`,
      `Employer share ${er}% = ${ugx(employer)}`,
      `Employee share ${ee}% (deducted from pay) = ${ugx(employee)}`,
      `Total to remit: ${ugx(employer + employee)} per month`,
    ],
    ...used(per, pee),
  };
}
/** " (pending verification)" for unverified params, "" once a reviewer has verified them. */
export const pending = (p) => (p.verification === "VERIFIED" ? "" : " (pending verification)");
/** Presumptive tax: band is (from, to] — the upper value belongs to its band. */
export function presumptiveEstimate(rule, turnover, keepsRecords) {
  const { value: fixed, p: pf } = param(rule, "fixedBands");
  const { value: rec, p: pr } = param(rule, "recordsBands");
  const fb = fixed.find(([from, to]) => turnover > from && turnover <= to);
  const rb = rec.find(([from, to]) => turnover > from && turnover <= to);
  if (!fb || !rb) return undefined;
  const fixedAmt = fb[2];
  const [rFrom, , rBase, rPct] = rb;
  const recordsAmt = Math.round(rBase + ((turnover - rFrom) * rPct) / 100);
  const band = `Turnover ${ugx(turnover)} falls in the band above ${ugx(fb[0])} up to ${ugx(fb[1])}`;
  const recordsLine = `${rBase ? `${ugx(rBase)} + ` : ""}${rPct}% × (${ugx(turnover)} - ${ugx(rFrom)}) = ${ugx(recordsAmt)}`;
  const usesRecords = keepsRecords === "YES";
  const workings = usesRecords
    ? [
        band,
        "You keep proper books, so the records-based rate applies:",
        recordsLine,
        `Estimated presumptive tax: ${ugx(recordsAmt)} per year`,
        `(Without records it would be the fixed ${ugx(fixedAmt)}.)`,
      ]
    : [
        band,
        `Fixed amount for this band (no proper records): ${ugx(fixedAmt)}`,
        `Estimated presumptive tax: ${ugx(fixedAmt)} per year`,
        `If you keep proper books of account, the records-based amount applies instead: ${recordsLine}`,
      ];
  return {
    amount: usesRecords ? recordsAmt : fixedAmt,
    period: "ANNUAL",
    basis: "ESTIMATE",
    workings,
    ...used(usesRecords ? pr : pf),
  };
}
/** Render a rule's parameters as plain-English rate lines, flagging unverified values. */
export function rateSummary(rule) {
  return rule.params
    .filter((p) => p.unit !== "DAY_OF_MONTH")
    .map((p) => {
      const flag = p.verification === "VERIFIED" ? "" : " — pending verification";
      if (p.unit === "BANDS") {
        const bands = p.value
          .map(([f, t, r]) => `${t >= Number.MAX_SAFE_INTEGER ? `above ${ugx(f)}` : `${ugx(f)}–${ugx(t)}`}: ${r}%`)
          .join("; ");
        return `${p.label}: ${bands}${flag}`;
      }
      if (p.unit === "AMOUNT_BANDS") {
        const bands = p.value.map(([f, t, amt]) => `${ugx(f)}–${ugx(t)}: ${ugx(amt)}`).join("; ");
        return `${p.label}: ${bands}${flag}`;
      }
      if (p.unit === "RECORDS_BANDS") {
        const bands = p.value
          .map(([f, t, base, r]) => `${ugx(f)}–${ugx(t)}: ${base ? `${ugx(base)} + ` : ""}${r}% of turnover above ${ugx(f)}`)
          .join("; ");
        return `${p.label}: ${bands}${flag}`;
      }
      if (p.unit === "PERCENT") return `${p.label}: ${p.value}%${flag}`;
      if (p.unit === "UGX") return `${p.label}: ${ugx(p.value)}${flag}`;
      return `${p.label}: ${p.value}${flag}`;
    });
}
