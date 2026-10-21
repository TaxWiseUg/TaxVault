// Know Your Taxes — shared types (JSDoc).
// The engine is pure: (answers, ruleSet, asOf) -> AssessmentResult. No I/O, no AI.
// These typedefs give editor autocomplete/hover in plain JavaScript; they have no runtime effect.

/** @typedef {"INDIVIDUAL" | "SOLE_PROPRIETOR" | "PARTNERSHIP" | "COMPANY"} EntityType */
/** @typedef {"YES" | "NO" | "UNSURE"} YesNoUnsure */
/** @typedef {"TRADING" | "SERVICES" | "PROFESSIONAL" | "MANUFACTURING" | "AGRICULTURE" | "TRANSPORT" | "OTHER"} BusinessActivity */

/**
 * Everything the questionnaire can collect. All optional: conditional questions may never be shown.
 * @typedef {Object} Answers
 * @property {EntityType} [entityType]
 * @property {"RESIDENT" | "NON_RESIDENT" | "UNSURE"} [residency]
 * @property {boolean} [isEmployed]
 * @property {number} [monthlySalary]          gross monthly employment income, UGX
 * @property {boolean} [hasBusiness]           only asked of INDIVIDUAL
 * @property {BusinessActivity[]} [businessActivities]
 * @property {number} [annualTurnover]         UGX
 * @property {YesNoUnsure} [keepsRecords]      proper books — selects the presumptive records-based rate
 * @property {number} [annualProfit]           UGX
 * @property {YesNoUnsure} [vatRegistered]
 * @property {boolean} [hasRentalIncome]
 * @property {number} [annualRentalIncome]     gross, UGX
 * @property {boolean} [hasEmployees]
 * @property {number} [employeeCount]
 * @property {number} [monthlyPayroll]         UGX
 * @property {boolean} [paysSuppliers]
 * @property {YesNoUnsure} [isDesignatedWhtAgent]
 * @property {boolean} [paysNonResidents]
 * @property {boolean} [hasForeignIncome]
 * @property {boolean} [importsGoods]
 * @property {boolean} [importsServices]
 * @property {boolean} [soldBusinessAssetsOrShares]
 * @property {("DIVIDENDS" | "INTEREST" | "NONE")[]} [otherIncome]
 */

/** @typedef {"LIKELY" | "NEEDS_INFO" | "NOT_APPLICABLE" | "PROFESSIONAL_REVIEW"} ObligationStatus */
/** @typedef {"TAX" | "STATUTORY_CONTRIBUTION" | "REGISTRATION"} ObligationCategory */
/** @typedef {"VERIFIED" | "NEEDS_VERIFICATION" | "SUPERSEDED"} VerificationStatus */

/**
 * @typedef {Object} LegalSource
 * @property {string} id         stable key, e.g. "ITA-S116"
 * @property {string} title
 * @property {"URA" | "Parliament of Uganda" | "ULII" | "MoFPED" | "NSSF" | "Other"} publisher
 * @property {string} url
 * @property {string} [section]
 * @property {string} [note]
 */

/**
 * One parameter of a rule. Verification is tracked per parameter.
 * unit BANDS: [from, to, rate%] · AMOUNT_BANDS: [from, to, fixedUGX] · RECORDS_BANDS: [from, to, baseUGX, rate% above from]
 * @typedef {Object} RuleParam
 * @property {string} key
 * @property {number | string | number[][]} value
 * @property {"UGX" | "PERCENT" | "DAY_OF_MONTH" | "TEXT" | "BANDS" | "AMOUNT_BANDS" | "RECORDS_BANDS"} unit
 * @property {string} label
 * @property {VerificationStatus} verification
 * @property {string[]} sourceIds
 * @property {string} [note]
 * @property {string} [verifiedBy]
 * @property {string} [verifiedAt]   ISO date
 */

/**
 * Plain-English explanation content for an obligation.
 * @typedef {Object} RuleContent
 * @property {string} name
 * @property {string} shortName
 * @property {ObligationCategory} category
 * @property {string} plainDefinition
 * @property {string[]} legalBasis    source ids
 * @property {string[]} triggers
 * @property {string[]} records
 * @property {string[]} deadlines
 * @property {string[]} channel
 * @property {{ text: string, sourceIds: string[], verification: VerificationStatus }[]} consequences
 * @property {string[]} nextSteps
 */

/**
 * A versioned parameter set for one obligation. Logic lives in code; numbers live in data.
 * @typedef {Object} TaxRuleVersion
 * @property {string} code
 * @property {string} version         "2026.07"
 * @property {string} effectiveFrom   ISO date
 * @property {string} [effectiveTo]   ISO date, exclusive
 * @property {VerificationStatus} verification
 * @property {string} [reviewedBy]
 * @property {string} [reviewedAt]
 * @property {RuleParam[]} params
 * @property {RuleContent} content
 */

/**
 * @typedef {Object} Estimate
 * @property {number} amount
 * @property {"MONTHLY" | "ANNUAL"} period
 * @property {"ESTIMATE"} basis        never "CONFIRMED"
 * @property {boolean} indicativeOnly  true when any parameter used is not VERIFIED
 * @property {string[]} workings
 * @property {{ key: string, verification: VerificationStatus }[]} paramsUsed
 */

/**
 * @typedef {Object} Obligation
 * @property {string} code
 * @property {ObligationStatus} status
 * @property {string[]} why
 * @property {string[]} missing
 * @property {string[]} followUpQuestionIds
 * @property {Estimate} [estimate]
 * @property {string[]} [workedExample]
 * @property {string[]} rateSummary
 * @property {{ version: string, effectiveFrom: string, verification: VerificationStatus }} rule
 * @property {RuleContent} content
 */

/**
 * @typedef {Object} AssessmentResult
 * @property {string} engineVersion
 * @property {string} asOf
 * @property {string} ruleSetVersion
 * @property {string[]} profileSummary
 * @property {Obligation[]} obligations
 * @property {string[]} missingInformation
 * @property {{ obligation: string, label: string, text: string }[]} upcomingDeadlines
 * @property {string[]} nextSteps
 * @property {number} unverifiedRuleCount
 */

export {};
