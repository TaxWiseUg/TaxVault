import { Answers, AssessmentResult, Estimate, Obligation, ObligationStatus, TaxRuleVersion } from "../types";
import { ENTITY_LABEL } from "../questionnaire";
import { getRule } from "../rules/seed-rules";
import {
  flatRateEstimate,
  individualIncomeTaxEstimate,
  nssfEstimate,
  param,
  payeEstimate,
  pending,
  presumptiveEstimate,
  rateSummary,
  rentalIndividualEstimate,
  ugx,
} from "./calculators";

export const ENGINE_VERSION = "kyt-engine/1.0.0";

interface AssessContext {
  a: Answers;
  rules: TaxRuleVersion[];
  asOf: string;
  out: Obligation[];
}

function add(
  ctx: AssessContext,
  code: string,
  status: ObligationStatus,
  why: string[],
  o: {
    missing?: string[];
    followUp?: string[];
    estimate?: Estimate;
    workedExample?: string[];
  } = {}
) {
  const rule = getRule(ctx.rules, code, ctx.asOf);
  ctx.out.push({
    code,
    status,
    why,
    missing: o.missing ?? [],
    followUpQuestionIds: o.followUp ?? [],
    estimate: o.estimate,
    workedExample: o.workedExample,
    rateSummary: rateSummary(rule),
    rule: { version: rule.version, effectiveFrom: rule.effectiveFrom, verification: rule.verification },
    content: rule.content,
  });
}

const r = (ctx: AssessContext, code: string) => getRule(ctx.rules, code, ctx.asOf);

const isBusiness = (a: Answers) =>
  a.entityType === "SOLE_PROPRIETOR" ||
  a.entityType === "PARTNERSHIP" ||
  a.entityType === "COMPANY" ||
  (a.entityType === "INDIVIDUAL" && a.hasBusiness === true);

const isNaturalPerson = (a: Answers) => a.entityType === "INDIVIDUAL" || a.entityType === "SOLE_PROPRIETOR";

// ─── Individual rules ────────────────────────────────────────────────────────
function employment(ctx: AssessContext) {
  const { a } = ctx;
  if (a.entityType !== "INDIVIDUAL" || a.isEmployed === undefined) return;
  if (!a.isEmployed) {
    add(ctx, "PAYE_EMPLOYEE", "NOT_APPLICABLE", [
      "You told us you don't receive a salary or wages, so no PAYE is deducted from your income.",
    ]);
    return;
  }
  if (a.residency === "NON_RESIDENT") {
    add(ctx, "PAYE_EMPLOYEE", "PROFESSIONAL_REVIEW", [
      "You receive employment income, so PAYE applies — but non-resident employees are taxed on different bands. A professional should confirm the correct treatment.",
    ]);
    return;
  }
  const rule = r(ctx, "PAYE_EMPLOYEE");
  const why = [
    "You receive a salary from an employer. Under the Income Tax Act your employer must deduct PAYE before paying you and send it to URA — that's why you see it on your payslip rather than paying it yourself.",
  ];
  const missing: string[] = [];
  if (a.residency === "UNSURE")
    missing.push("Confirm your residency status — the PAYE bands shown are for resident individuals.");
  if (a.monthlySalary === undefined) {
    missing.push("Your gross monthly salary (to estimate PAYE).");
    add(ctx, "PAYE_EMPLOYEE", "LIKELY", why, { missing, followUp: ["monthlySalary"] });
    return;
  }
  const est = payeEstimate(rule, a.monthlySalary);
  if (est.amount === 0) {
    add(
      ctx,
      "PAYE_EMPLOYEE",
      "NOT_APPLICABLE",
      [
        `Your salary of ${ugx(a.monthlySalary)} a month is within the tax-free band, so no PAYE should be deducted.`,
      ],
      { estimate: est, missing }
    );
    return;
  }
  why.push(
    `At ${ugx(a.monthlySalary)} a month your pay is above the tax-free band, so PAYE is calculated on the portion above it, band by band.`
  );
  add(ctx, "PAYE_EMPLOYEE", "LIKELY", why, { estimate: est, missing });
}

function businessIncome(ctx: AssessContext) {
  const { a } = ctx;
  if (!isBusiness(a)) return;
  if (a.entityType === "COMPANY") {
    if (a.residency === "NON_RESIDENT") {
      add(ctx, "CORPORATE_INCOME_TAX", "PROFESSIONAL_REVIEW", [
        "A non-resident company is taxed in Uganda only on Ugandan-source income, usually through a branch. The position depends on how you operate here.",
      ]);
      return;
    }
    const why = [
      "You operate as a company. Companies are separate taxpayers and pay corporate income tax on their taxable profit, regardless of turnover size.",
    ];
    if (a.annualProfit === undefined) {
      add(ctx, "CORPORATE_INCOME_TAX", "LIKELY", why, {
        missing: ["Annual profit before tax (to estimate corporate income tax)."],
        followUp: ["annualProfit"],
      });
    } else {
      add(ctx, "CORPORATE_INCOME_TAX", "LIKELY", why, {
        estimate: {
          ...flatRateEstimate(
            r(ctx, "CORPORATE_INCOME_TAX"),
            a.annualProfit,
            "Profit before tax (used as a stand-in for chargeable income)",
            "ANNUAL"
          ),
        },
        missing: [
          "Chargeable income differs from accounting profit (capital allowances, disallowed expenses, losses brought forward) — use the CIT calculator for a full computation.",
        ],
      });
    }
    return;
  }
  if (a.entityType === "PARTNERSHIP") {
    add(ctx, "PARTNERSHIP_INCOME", "LIKELY", [
      "You operate as a partnership. The partnership files a return, but each partner pays tax on their share of the profit as part of their own income.",
    ]);
    return;
  }
  // Individuals & sole proprietors
  const pres = r(ctx, "PRESUMPTIVE_TAX");
  const { value: lower, p: pLower } = param(pres, "lowerTurnover");
  const { value: upper, p: pUpper } = param(pres, "upperTurnover");
  const professional = (a.businessActivities ?? []).includes("PROFESSIONAL");
  if (a.residency === "NON_RESIDENT") {
    add(ctx, "INDIVIDUAL_INCOME_TAX", "PROFESSIONAL_REVIEW", [
      "Non-residents can't use the presumptive regime and are taxed only on Ugandan-source business income. A professional should confirm your position.",
    ]);
    return;
  }
  if (a.annualTurnover === undefined) {
    add(
      ctx,
      "PRESUMPTIVE_TAX",
      "NEEDS_INFO",
      ["Whether presumptive tax or ordinary income tax applies depends on your annual turnover."],
      {
        missing: ["Approximate annual business turnover."],
        followUp: ["annualTurnover"],
      }
    );
    return;
  }
  if (professional) {
    add(ctx, "PRESUMPTIVE_TAX", "NOT_APPLICABLE", [
      "Professional services (such as legal, medical, accounting and engineering) are excluded from the presumptive regime, whatever the turnover.",
    ]);
  } else if (a.annualTurnover <= lower) {
    add(ctx, "PRESUMPTIVE_TAX", "NOT_APPLICABLE", [
      `Your turnover of ${ugx(a.annualTurnover)} is not above ${ugx(lower)}${pending(pLower)}, so no presumptive tax is payable. Confirm with URA whether you still need to file a return.`,
    ]);
    if (a.isEmployed) individualReturnForMixed(ctx, 0);
    return;
  } else if (a.annualTurnover <= upper) {
    const why = [
      `Your turnover of ${ugx(a.annualTurnover)} is within the presumptive range: above ${ugx(lower)} and up to ${ugx(upper)}${pending(pUpper)}. That makes you likely a 'small business taxpayer' — instead of tax on exact profit, you pay a set annual amount for your turnover band.`,
      a.keepsRecords === "YES"
        ? "Because you keep proper books of account, the lower records-based amount applies."
        : "Businesses that keep proper books of account pay a lower, percentage-based amount — worth knowing before you file.",
    ];
    if (a.residency === "UNSURE") why.push("The regime is for resident taxpayers — confirm your residency.");
    add(ctx, "PRESUMPTIVE_TAX", "LIKELY", why, {
      estimate: presumptiveEstimate(pres, a.annualTurnover, a.keepsRecords),
      missing:
        a.keepsRecords === undefined || a.keepsRecords === "UNSURE"
          ? ["Whether you keep proper books of account (decides fixed vs records-based amount)."]
          : [],
      followUp: a.keepsRecords === undefined ? ["keepsRecords"] : [],
    });
    if (a.isEmployed) individualReturnForMixed(ctx, 0);
    return;
  } else {
    add(ctx, "PRESUMPTIVE_TAX", "NOT_APPLICABLE", [
      `Your turnover of ${ugx(a.annualTurnover)} is above the presumptive limit of ${ugx(upper)}${pending(pUpper)}, so you're taxed on actual profit instead.`,
    ]);
  }
  // Ordinary individual income tax on profit
  const why = [
    professional
      ? "Because you provide professional services, your business income is taxed on actual profit under ordinary individual income tax rules."
      : "Because your turnover is above the presumptive range, your business profit is taxed under ordinary individual income tax rules.",
  ];
  if (a.annualProfit === undefined) {
    add(ctx, "INDIVIDUAL_INCOME_TAX", "LIKELY", why, {
      missing: ["Annual business profit (turnover minus expenses)."],
      followUp: ["annualProfit"],
    });
    return;
  }
  individualReturnForMixed(ctx, a.annualProfit, why);
}

/** Combines business profit with salary for an annual estimate, crediting PAYE already withheld. */
function individualReturnForMixed(ctx: AssessContext, businessProfit: number, baseWhy?: string[]) {
  const { a } = ctx;
  const salaryAnnual = a.isEmployed && a.monthlySalary ? a.monthlySalary * 12 : 0;
  if (businessProfit === 0 && !baseWhy) {
    // Employee with a small business: flag the annual return question without inventing a liability.
    add(ctx, "INDIVIDUAL_INCOME_TAX", "PROFESSIONAL_REVIEW", [
      "You have both a salary and business income. Where employment income is combined with other income, you may need to file an annual individual return rather than rely on PAYE alone.",
    ]);
    return;
  }
  const rule = r(ctx, "INDIVIDUAL_INCOME_TAX");
  const total = businessProfit + salaryAnnual;
  const est = individualIncomeTaxEstimate(rule, total);
  const why = [...(baseWhy ?? [])];
  if (salaryAnnual > 0) {
    const paye = payeEstimate(r(ctx, "PAYE_EMPLOYEE"), a.monthlySalary!).amount * 12;
    est.workings.unshift(`Salary ${ugx(salaryAnnual)} + business profit ${ugx(businessProfit)} = ${ugx(total)}`);
    est.workings.push(
      `Less PAYE already withheld (est.): ${ugx(paye)}`,
      `Estimated balance payable with the return: ${ugx(Math.max(0, est.amount - paye))}`
    );
    est.amount = Math.max(0, est.amount - paye);
    why.push(
      "You also earn a salary. Your income from all sources is added together for the annual return, and PAYE your employer already paid is credited against the total."
    );
  }
  add(ctx, "INDIVIDUAL_INCOME_TAX", "LIKELY", why, { estimate: est });
}

function rental(ctx: AssessContext) {
  const { a } = ctx;
  if (a.hasRentalIncome === undefined) return;
  if (!a.hasRentalIncome) {
    add(ctx, isNaturalPerson(a) ? "RENTAL_TAX_INDIVIDUAL" : "RENTAL_TAX_NON_INDIVIDUAL", "NOT_APPLICABLE", [
      "You told us you don't earn rental income.",
    ]);
    return;
  }
  if (!isNaturalPerson(a)) {
    add(
      ctx,
      "RENTAL_TAX_NON_INDIVIDUAL",
      a.entityType === "PARTNERSHIP" ? "PROFESSIONAL_REVIEW" : "LIKELY",
      [
        "Your entity earns rent. Non-individuals are taxed on net rental income (rent less allowable expenses) at the corporate rate, separately from other business income.",
      ],
      { missing: ["Allowable rental expenses (needed for an estimate)."] }
    );
    return;
  }
  const why = [
    "You earn rent from property in Uganda. Individuals pay rental tax as a separate flat-rate tax on gross rent above a threshold — no expenses are deducted.",
  ];
  if (a.annualRentalIncome === undefined) {
    add(ctx, "RENTAL_TAX_INDIVIDUAL", "LIKELY", why, {
      missing: ["Total gross rent received per year."],
      followUp: ["annualRentalIncome"],
    });
    return;
  }
  const est = rentalIndividualEstimate(r(ctx, "RENTAL_TAX_INDIVIDUAL"), a.annualRentalIncome);
  if (est.amount === 0) {
    add(
      ctx,
      "RENTAL_TAX_INDIVIDUAL",
      "NOT_APPLICABLE",
      [
        `Your gross rent of ${ugx(a.annualRentalIncome)} is at or below the threshold, so no rental tax is estimated.`,
      ],
      { estimate: est }
    );
    return;
  }
  add(ctx, "RENTAL_TAX_INDIVIDUAL", "LIKELY", why, { estimate: est });
}

function vat(ctx: AssessContext) {
  const { a } = ctx;
  if (!isBusiness(a)) return;
  const rule = r(ctx, "VAT");
  const { value: threshold, p: pThr } = param(rule, "registrationThreshold");
  const thr = `${ugx(threshold)}${pending(pThr)}`;
  const rate = param(rule, "rate").value;
  const example = (t: number) => [
    `Illustration only: on standard-rated sales of ${ugx(t)}, you would charge output VAT of ${ugx((t * rate) / 100)} on top.`,
    "You then deduct input VAT on your business purchases; the difference is what you pay URA. TaxWise can't estimate this without your purchase figures.",
  ];
  if (a.vatRegistered === "YES") {
    add(
      ctx,
      "VAT",
      "LIKELY",
      [
        "You're registered for VAT, so you must charge VAT on taxable sales, issue EFRIS invoices and file a monthly return — even if your turnover is now below the threshold, until you formally deregister.",
        ...(a.annualTurnover !== undefined && a.annualTurnover < threshold
          ? [
              `Your turnover (${ugx(a.annualTurnover)}) is below the new threshold of ${thr}. You may be able to deregister — weigh losing input VAT recovery first.`,
            ]
          : []),
      ],
      { workedExample: a.annualTurnover ? example(a.annualTurnover) : undefined }
    );
    return;
  }
  if (a.annualTurnover === undefined) {
    add(ctx, "VAT", "NEEDS_INFO", ["VAT registration depends on whether your taxable turnover exceeds the threshold."], {
      missing: ["Annual turnover."],
      followUp: ["annualTurnover"],
    });
    return;
  }
  if (a.annualTurnover > threshold) {
    add(
      ctx,
      "VAT",
      "LIKELY",
      [
        `Your turnover of ${ugx(a.annualTurnover)} is above the VAT registration threshold of ${thr}. Businesses above the threshold must register for VAT${a.vatRegistered === "NO" ? " — you told us you aren't registered yet, so this is urgent" : ""}.`,
      ],
      {
        missing: a.vatRegistered === "UNSURE" ? ["Check your VAT registration status on the URA portal."] : [],
        workedExample: example(a.annualTurnover),
      }
    );
    return;
  }
  const near = a.annualTurnover > threshold * 0.8;
  add(
    ctx,
    "VAT",
    "NOT_APPLICABLE",
    [
      `Your turnover of ${ugx(a.annualTurnover)} is below the VAT registration threshold of ${thr}, so registration isn't compulsory.${near ? " You're close to it — monitor turnover quarterly." : ""}`,
    ],
    { missing: a.vatRegistered === "UNSURE" ? ["Confirm on the URA portal that you aren't already VAT-registered."] : [] }
  );
}

function employer(ctx: AssessContext) {
  const { a } = ctx;
  if (a.hasEmployees === undefined) return;
  if (!a.hasEmployees) {
    add(ctx, "PAYE_EMPLOYER", "NOT_APPLICABLE", ["You don't employ staff, so you have no PAYE withholding duty."]);
    add(ctx, "NSSF", "NOT_APPLICABLE", ["You don't employ staff, so employer NSSF contributions don't arise."]);
    return;
  }
  const n = a.employeeCount ? `${a.employeeCount} employee${a.employeeCount === 1 ? "" : "s"}` : "staff";
  add(
    ctx,
    "PAYE_EMPLOYER",
    "LIKELY",
    [
      `You employ ${n}. The law makes the employer the collector: you deduct PAYE from each employee's pay and remit it to URA monthly, because you control the payment.`,
      "Each employee's PAYE depends on their own gross pay — someone below the tax-free band has nothing deducted.",
    ],
    { missing: a.monthlyPayroll === undefined ? ["Total monthly payroll (to estimate NSSF)."] : [] }
  );
  add(
    ctx,
    "NSSF",
    "LIKELY",
    [
      "As an employer you must also remit NSSF contributions. This is a statutory savings contribution, not a tax, and is paid to NSSF rather than URA.",
    ],
    {
      estimate: a.monthlyPayroll !== undefined ? nssfEstimate(r(ctx, "NSSF"), a.monthlyPayroll) : undefined,
      followUp: a.monthlyPayroll === undefined ? ["monthlyPayroll"] : [],
    }
  );
}

function withholding(ctx: AssessContext) {
  const { a } = ctx;
  if (a.paysSuppliers !== undefined) {
    if (!a.paysSuppliers) {
      add(ctx, "WHT_AGENT", "NOT_APPLICABLE", ["You don't pay suppliers or contractors, so supplier withholding doesn't arise."]);
    } else if (a.isDesignatedWhtAgent === "YES") {
      const rule = r(ctx, "WHT_AGENT");
      const min = param(rule, "minPayment").value;
      add(
        ctx,
        "WHT_AGENT",
        "LIKELY",
        [
          "URA has designated you as a withholding agent. When you pay a supplier above the minimum amount, you deduct WHT and pay it to URA; the supplier claims it as a credit.",
        ],
        {
          workedExample: [
            `Example: a supplier invoice of ${ugx(min * 5)} → WHT ${ugx((min * 5 * param(rule, "rate").value) / 100)} deducted; supplier receives the balance plus a WHT certificate.`,
          ],
        }
      );
    } else if (a.isDesignatedWhtAgent === "UNSURE" || a.isDesignatedWhtAgent === undefined) {
      add(ctx, "WHT_AGENT", "NEEDS_INFO", ["Supplier withholding only applies if URA has designated you as an agent."], {
        missing: ["Check the URA designated withholding agents list or any designation notice you've received."],
        followUp: ["isDesignatedWhtAgent"],
      });
    } else {
      add(ctx, "WHT_AGENT", "NOT_APPLICABLE", [
        "You aren't a designated withholding agent, so you don't deduct WHT on routine supplier payments.",
      ]);
    }
  }
  if (a.paysNonResidents) {
    add(
      ctx,
      "WHT_NON_RESIDENT",
      "LIKELY",
      [
        "You pay non-resident persons. Payments to non-residents for Ugandan-source income generally require you to withhold tax, because URA cannot easily collect from someone abroad.",
      ],
      {
        missing: [
          "Type of payment (services, royalties, management fees) and the recipient's country — rates and treaty relief differ.",
        ],
      }
    );
  } else if (a.paysNonResidents === false && a.importsServices) {
    add(
      ctx,
      "WHT_NON_RESIDENT",
      "NEEDS_INFO",
      ["You buy services from abroad but said you don't pay non-residents — those are usually the same thing."],
      { followUp: ["paysNonResidents"] }
    );
  }
}

function crossBorder(ctx: AssessContext) {
  const { a } = ctx;
  if (a.importsGoods) {
    add(
      ctx,
      "IMPORT_DUTIES",
      "LIKELY",
      ["You import goods. Import duty, VAT on imports and other levies are assessed by URA Customs when goods are cleared."],
      {
        missing: ["HS codes, customs value and origin of the goods (for an estimate)."],
      }
    );
    add(ctx, "WHT_IMPORTS", "LIKELY", [
      "Withholding tax is collected at customs on commercial imports unless you hold a URA exemption. It's a credit against your income tax.",
    ]);
  }
  if (a.importsServices) {
    if (a.vatRegistered === "YES") {
      add(ctx, "VAT_REVERSE_CHARGE", "LIKELY", [
        "You're VAT-registered and buy services from abroad, so you may need to account for VAT on those imported services yourself.",
      ]);
    } else if (a.vatRegistered === "UNSURE") {
      add(
        ctx,
        "VAT_REVERSE_CHARGE",
        "NEEDS_INFO",
        ["Reverse-charge VAT on imported services depends on your VAT registration."],
        { followUp: ["vatRegistered"] }
      );
    }
  }
  if (a.hasForeignIncome !== undefined) {
    if (!a.hasForeignIncome) add(ctx, "FOREIGN_INCOME", "NOT_APPLICABLE", ["You don't earn income from outside Uganda."]);
    else
      add(ctx, "FOREIGN_INCOME", "PROFESSIONAL_REVIEW", [
        a.residency === "UNSURE"
          ? "You earn foreign income, and whether Uganda taxes it depends on your residency, which you're unsure of."
          : "As a Ugandan resident, your foreign income is taxable in Uganda, at the same rates as local income from 1 July 2026. Treaty relief and foreign tax credits need professional review.",
      ]);
  }
}

function other(ctx: AssessContext) {
  const { a } = ctx;
  if (a.soldBusinessAssetsOrShares !== undefined) {
    add(ctx, "CAPITAL_GAINS", a.soldBusinessAssetsOrShares ? "PROFESSIONAL_REVIEW" : "NOT_APPLICABLE", [
      a.soldBusinessAssetsOrShares
        ? "You sold business assets, property or shares. Any gain is generally taxable, but the calculation (cost base, exemptions, timing) depends on the asset and needs review."
        : "You didn't sell business assets, commercial property or shares this year.",
    ]);
  }
  const inv = (a.otherIncome ?? []).filter((x) => x !== "NONE");
  if (inv.length) {
    add(ctx, "INVESTMENT_INCOME_WHT", "LIKELY", [
      `You receive ${inv.map((x) => x.toLowerCase()).join(" and ")}. Tax is usually withheld by the bank or company when paid — for many individuals that is the final tax and nothing more is due.`,
    ]);
  }
  const earning = isBusiness(a) || a.isEmployed;
  if (earning && isNaturalPerson(a)) {
    add(
      ctx,
      "LOCAL_SERVICE_TAX",
      "NEEDS_INFO",
      [
        "Local Service Tax is charged by local governments on people earning employment or business income above a minimum level.",
      ],
      {
        missing: ["Your local government area and income band — LST scales are set locally."],
      }
    );
  }
  if (isBusiness(a)) {
    add(ctx, "TRADING_LICENCE", "LIKELY", [
      "You run a business. Separately from tax, you'll need business registration and a local trading licence.",
    ]);
  }
  const hasAny = earning || a.hasRentalIncome || a.hasEmployees || a.importsGoods || inv.length > 0;
  if (hasAny)
    add(ctx, "TIN_REGISTRATION", "LIKELY", [
      "You have income or activities that URA tracks, so you need a TIN to file, pay or claim credits.",
    ]);
}

// ─── Public API ──────────────────────────────────────────────────────────────
const STATUS_ORDER: Record<ObligationStatus, number> = {
  LIKELY: 0,
  NEEDS_INFO: 1,
  PROFESSIONAL_REVIEW: 2,
  NOT_APPLICABLE: 3,
};

const CATEGORY_ORDER = { TAX: 0, STATUTORY_CONTRIBUTION: 1, REGISTRATION: 2 };

export function assess(
  answers: Answers,
  rules: TaxRuleVersion[],
  asOf: string,
  ruleSetVersion = "UG-2026.07"
): AssessmentResult {
  if (!answers.entityType) throw new Error("entityType is required");
  const ctx: AssessContext = { a: answers, rules, asOf, out: [] };
  employment(ctx);
  businessIncome(ctx);
  rental(ctx);
  vat(ctx);
  employer(ctx);
  withholding(ctx);
  crossBorder(ctx);
  other(ctx);

  // De-duplicate (first decision wins) and sort by status then category.
  const seen = new Set<string>();
  const obligations = ctx.out
    .filter((o) => (seen.has(o.code) ? false : (seen.add(o.code), true)))
    .sort(
      (x, y) =>
        STATUS_ORDER[x.status] - STATUS_ORDER[y.status] ||
        CATEGORY_ORDER[x.content.category] - CATEGORY_ORDER[y.content.category]
    );

  const active = obligations.filter((o) => o.status === "LIKELY");
  const missingInformation = [
    ...new Set(obligations.filter((o) => o.status !== "NOT_APPLICABLE").flatMap((o) => o.missing)),
  ];
  if (answers.residency === "UNSURE")
    missingInformation.unshift("Your tax residency status (affects which rules apply).");

  return {
    engineVersion: ENGINE_VERSION,
    asOf,
    ruleSetVersion,
    profileSummary: profile(answers),
    obligations,
    missingInformation,
    upcomingDeadlines: active
      .filter((o) => o.content.category !== "REGISTRATION")
      .flatMap((o) =>
        o.content.deadlines.slice(0, 1).map((text) => ({
          obligation: o.code,
          label: o.content.shortName,
          text,
        }))
      ),
    nextSteps: [
      ...(obligations.some((o) => o.status === "NEEDS_INFO")
        ? ["Answer the follow-up questions flagged below to firm up the 'needs more information' items."]
        : []),
      ...(obligations.some((o) => o.status === "PROFESSIONAL_REVIEW")
        ? ["Book a review with a qualified tax professional for the items marked 'professional review'."]
        : []),
      ...active.flatMap((o) => o.content.nextSteps.slice(0, 1)),
    ],
    unverifiedRuleCount: new Set(obligations.filter((o) => o.rule.verification !== "VERIFIED").map((o) => o.code)).size,
  };
}

function profile(a: Answers): string[] {
  const lines = [`Taxpayer type: ${a.entityType ? ENTITY_LABEL[a.entityType] : "Unknown"}`];
  if (a.residency)
    lines.push(
      `Residency: ${{ RESIDENT: "Resident", NON_RESIDENT: "Non-resident", UNSURE: "Not sure" }[a.residency]}`
    );
  if (a.isEmployed)
    lines.push(`Employed${a.monthlySalary !== undefined ? ` — ${ugx(a.monthlySalary)}/month gross` : ""}`);
  if (isBusiness(a)) {
    lines.push(
      `Business turnover: ${a.annualTurnover !== undefined ? `${ugx(a.annualTurnover)}/year` : "not provided"}`
    );
    if (a.businessActivities?.length)
      lines.push(`Activities: ${a.businessActivities.map((x) => x.toLowerCase()).join(", ")}`);
    if (a.vatRegistered) lines.push(`VAT registered: ${a.vatRegistered.toLowerCase()}`);
  }
  if (a.hasRentalIncome)
    lines.push(`Rental income${a.annualRentalIncome !== undefined ? `: ${ugx(a.annualRentalIncome)}/year` : ""}`);
  if (a.hasEmployees) lines.push(`Employer${a.employeeCount ? ` of ${a.employeeCount}` : ""}`);
  if (a.importsGoods || a.importsServices) lines.push("Imports goods or services");
  if (a.hasForeignIncome) lines.push("Earns foreign income");
  return lines;
}
