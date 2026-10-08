/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Running in robust Demo / Sandbox mode.'
  );
}

const DEFAULT_TAT_CASES = [
  {
    id: "tat-1",
    case_number: "TAT No. 145 of 2025",
    title: "Edward Mwanje v Uganda Revenue Authority",
    year: 2025,
    tax_type: "Jurisdiction",
    outcome: "Dismissed",
    summary: "Appeal dismissed for lack of jurisdiction. Taxpayer filed 45 days after URA assessment notice, exceeding the mandatory 30-day filing window under Section 14 of the TAT Act.",
    ai_commentary: "This case underscores the strictness of the statutory time limits under Section 14 of the TAT Act. The Tribunal cannot exercise discretion to extend the time if the application is filed late without a formal application for extension on strong legal grounds. Practitioners must diarize the 30-day window the moment an objection decision is received."
  },
  {
    id: "tat-2",
    case_number: "TAT No. 112 of 2024",
    title: "Kampala Hardware Ltd v URA",
    year: 2024,
    tax_type: "VAT",
    outcome: "Allowed",
    summary: "Tribunal ruled in favour of taxpayer on input VAT claims for capital equipment imported for manufacturing. URA's denial of credits was found to be inconsistent with the VAT Act provisions.",
    ai_commentary: "A major win for manufacturers. The Tribunal clarified that input VAT on capital goods imported for business operations is fully claimable under Section 28 of the VAT Act. URA's attempt to restrict credits based on timing or incomplete internal system records was rejected because physical custom declarations and invoices were intact."
  },
  {
    id: "tat-3",
    case_number: "TAT No. 089 of 2024",
    title: "Grace Tumwine v Commissioner General",
    year: 2024,
    tax_type: "Income Tax",
    outcome: "Partial",
    summary: "Partial relief granted. Tribunal upheld URA's assessment on business income but struck down penalties imposed without proper notice under Section 52 of the Income Tax Act.",
    ai_commentary: "This ruling emphasizes that administrative penalties must comply with procedural fairness. While the underlying tax liability was upheld, the Tribunal struck down the penalties because URA failed to show detailed calculations and did not issue a warning notice. Taxpayers should always scrutinize the penalty assessment documents for procedural defects."
  },
  {
    id: "tat-4",
    case_number: "TAT No. 067 of 2023",
    title: "Nile Breweries Ltd v URA",
    year: 2023,
    tax_type: "Excise Duty",
    outcome: "Dismissed",
    summary: "Appeal dismissed. Tribunal found that excise duty on locally manufactured beverages was correctly applied. Taxpayer's argument on discriminatory treatment was not supported by evidence.",
    ai_commentary: "Demonstrates that challenges based on constitutional arguments (like discrimination in excise tax rates) require a high standard of empirical proof. The Tribunal will defer to the policy intent of Parliament unless there is a clear, unconstitutional violation."
  },
  {
    id: "tat-5",
    case_number: "TAT No. 201 of 2024",
    title: "MTN Uganda v Commissioner Domestic Taxes",
    year: 2024,
    tax_type: "WHT",
    outcome: "Allowed",
    summary: "Withholding tax on cross-border digital services set aside. Tribunal found URA failed to issue proper notice and the assessment was statute-barred under the 5-year limitation rule.",
    ai_commentary: "This sets a strong precedent regarding the statute of limitations. Under the Tax Procedures Code Act, URA is barred from raising new assessments after 5 years unless fraud is proven."
  },
  {
    id: "tat-6",
    case_number: "TAT No. 033 of 2023",
    title: "Kiboga Farmers Cooperative v URA",
    year: 2023,
    tax_type: "PAYE",
    outcome: "Partial",
    summary: "PAYE assessment partially upheld. Seasonal workers found to be employees for tax purposes, but penalties reduced due to taxpayer's good faith reliance on professional advice.",
    ai_commentary: "A crucial case on employment status. The Tribunal ruled that the frequency and integration of casual workers into the cooperative's core business made them employees under the Income Tax Act."
  }
];

const DEFAULT_COURSES = [
  {
    id: 1,
    title: "Uganda Tax Fundamentals",
    level: "Beginner",
    emoji: "📘",
    color: "#E6F5F2",
    accent_color: "#1A7B6B",
    description: "Master Income Tax, VAT, PAYE, and withholding tax from scratch. Built for new business owners and accounting students.",
    lessons: [
      {
        id: "1a",
        title: "Introduction to Uganda's Tax System",
        duration: "15 min",
        content: "Uganda's tax system is administered by the Uganda Revenue Authority (URA), established under the Uganda Revenue Authority Act, Cap 196. The main taxes include: **Income Tax** (governed by the Income Tax Act, Cap 340), **Value Added Tax** (VAT Act, Cap 349), **Pay As You Earn** (PAYE — a form of Income Tax), **Withholding Tax**, and **Excise Duty**.\n\nThe URA is divided into the Domestic Taxes Department (handling income tax, VAT, PAYE) and the Customs Department (handling import/export duties)."
      },
      {
        id: "1b",
        title: "Income Tax — Who Pays & How Much",
        duration: "20 min",
        content: "**Individual Income Tax** applies to all income earned by residents and non-residents from Ugandan sources. Rates for individuals (2024/25):\n\n- Income up to UGX 2,820,000/year: **0% (exempt)**\n- UGX 2,820,001 – 4,920,000: **10%**\n- UGX 4,920,001 – 120,000,000: **20%**\n- Above UGX 120,000,000: **30%**\n\n**Corporate Tax** is charged at **30%** of chargeable income for resident companies. Agribusiness companies enjoy a reduced rate of **25%**."
      },
      {
        id: "1c",
        title: "VAT — Registration, Rates & Filing",
        duration: "25 min",
        content: "**VAT Registration** is mandatory when taxable turnover exceeds **UGX 150 million** in any 12-month period. Voluntary registration is allowed below this threshold.\n\n**VAT Rates:**\n- Standard rate: **18%** on most goods and services\n- Zero-rated (0%): Exports, some foodstuffs, educational materials\n- Exempt: Medical services, financial services, residential accommodation\n\n**Input VAT:** Registered taxpayers can claim back VAT paid on business purchases (input tax) against VAT collected on sales (output tax)."
      },
      {
        id: "1d",
        title: "PAYE — Employer Obligations",
        duration: "20 min",
        content: "**PAYE (Pay As You Earn)** requires every employer to deduct income tax from employees' salaries and remit to URA by the **15th of the following month**.\n\n**Employer Duties:**\n1. Register with URA as an employer\n2. Obtain Tax Identification Numbers (TINs) for all employees\n3. Calculate tax on gross pay minus allowable deductions\n4. Deduct NSSF (10% employee, 10% employer)\n5. File PAYE return and pay by the 15th"
      }
    ]
  },
  {
    id: 2,
    title: "TAT Appeals: Process & Strategy",
    level: "Intermediate",
    emoji: "⚖️",
    color: "#FEF3CD",
    accent_color: "#C8922A",
    description: "Master the Tax Appeals Tribunal process — from objections to appeals, jurisdiction rules, and building a winning case.",
    lessons: [
      {
        id: "2a",
        title: "The TAT — Structure & Jurisdiction",
        duration: "20 min",
        content: "The **Tax Appeals Tribunal (TAT)** was established under the Tax Appeals Tribunal Act, Cap 345. It provides an independent forum for taxpayers to challenge URA decisions without going to the High Court first.\n\n**Jurisdiction:** The TAT hears appeals against:\n- URA assessments and amended assessments\n- Refusal to grant refunds\n- Penalties and interest charges\n- Decisions on objections"
      },
      {
        id: "2b",
        title: "The 30-Day Rule — Uganda's Most Critical Tax Deadline",
        duration: "25 min",
        content: "Under Section 14 of the Tax Appeals Tribunal Act, an appeal must be lodged within **30 days** of receiving URA's objection decision.\n\n**Strict Enforcement:** The TAT consistently rules that the 30-day timeline is jurisdictional. Missing it without a formal extension granted before expiry usually means your appeal is dismissed automatically."
      }
    ]
  },
  {
    id: 3,
    title: "URA eFRIS & Invoicing Compliance",
    level: "Professional",
    emoji: "🏛️",
    color: "#E8EDF5",
    accent_color: "#0F2044",
    description: "Practical guide to eFRIS integration, fiscal receipts, reconciliation, and audit defense in Uganda.",
    lessons: [
      {
        id: "3a",
        title: "eFRIS Architecture & Invoicing Rules",
        duration: "25 min",
        content: "The **Electronic Fiscal Receipting and Invoicing Solution (eFRIS)** is mandatory for all VAT-registered taxpayers in Uganda. All transactions must be fiscalized in real time with unique URA fiscal verification QR codes."
      }
    ]
  }
];

const DEFAULT_CASES = [
  {
    id: "case-demo-1",
    user_id: "demo-user",
    title: "Uganda Clays VAT Input Audit Assessment",
    input_text: "Taxpayer disputed disallowed input tax on industrial machinery purchased in 2024.",
    ai_summary: {
      summary: "Assessment of VAT input credit eligibility on imported capital equipment.",
      keyIssues: ["Input VAT deductibility", "Customs clearance documentation", "Statutory time limits"],
      verdict: "High probability of success on appeal",
      risk: "low",
      riskNote: "Valid bills of entry and custom receipts exist.",
      tags: ["VAT", "Input Tax", "Machinery"],
      advice: "Proceed with formal objection under Section 24 of Tax Procedures Code Act.",
      applicableLaw: ["VAT Act Section 28", "Tax Procedures Code Act Section 24"]
    },
    risk_level: "low",
    tags: ["VAT", "Input Tax", "Machinery"],
    created_at: new Date().toISOString()
  },
  {
    id: "case-demo-2",
    user_id: "demo-user",
    title: "Mukwano Industries PAYE Casual Workers Review",
    input_text: "Audit regarding tax treatment of seasonal agricultural labor.",
    ai_summary: {
      summary: "Review of casual laborers classification under Income Tax Act Section 19.",
      keyIssues: ["Employee vs independent contractor", "Withholding tax obligations", "NSSF liability"],
      verdict: "Moderate exposure, recommend penalty waiver application",
      risk: "medium",
      riskNote: "Documentation of casual engagement duration is incomplete.",
      tags: ["PAYE", "Employment Tax", "WHT"],
      advice: "Standardize contract terms and apply for interest remission under Section 89.",
      applicableLaw: ["Income Tax Act Section 19", "Income Tax Act Section 89"]
    },
    risk_level: "medium",
    tags: ["PAYE", "Employment Tax", "WHT"],
    created_at: new Date().toISOString()
  }
];

// Helpers for mock authentication and local persistence
function getMockSession() {
  if (typeof window === "undefined") return null;
  const sessionData = localStorage.getItem("mock_supabase_session");
  if (!sessionData) {
    // In sandbox demo mode, provide an active mock session
    const demoSession = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user: {
        id: "demo-user",
        email: "demo.taxwise@example.com",
        user_metadata: {
          full_name: "Demo Professional",
          role: "Admin",
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      }
    };
    return demoSession;
  }
  try {
    return JSON.parse(sessionData);
  } catch (e) {
    return null;
  }
}

function getMockProfile() {
  if (typeof window === "undefined") return null;
  const profile = localStorage.getItem("mock_profile");
  if (!profile) {
    // Default admin mock user so all dashboards are accessible in preview
    const defaultProfile = {
      id: "demo-user",
      email: "demo.taxwise@example.com",
      full_name: "Demo Professional",
      role: "Admin",
      plan: "premium",
      created_at: new Date().toISOString()
    };
    localStorage.setItem("mock_profile", JSON.stringify(defaultProfile));
    return defaultProfile;
  }
  try {
    return JSON.parse(profile);
  } catch (e) {
    return null;
  }
}

let authCallbacks: any[] = [];
function triggerCallbacks(event: string, session: any) {
  authCallbacks.forEach(cb => {
    try {
      cb(event, session);
    } catch (e) {
      console.error("Error in mock auth callback:", e);
    }
  });
}

// Mock query builder mimicking Supabase postgrest syntax
class MockQueryBuilder {
  private tableName: string;
  private filters: { col: string; val: any }[] = [];
  private limitCount: number | null = null;
  private singleResult: boolean = false;
  private actionType: "select" | "insert" | "update" | "delete" = "select";
  private actionData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string, options?: any) {
    this.actionType = "select";
    return this;
  }

  insert(data: any) {
    this.actionType = "insert";
    this.actionData = data;
    return this;
  }

  update(data: any) {
    this.actionType = "update";
    this.actionData = data;
    return this;
  }

  delete() {
    this.actionType = "delete";
    return this;
  }

  upsert(data: any, options?: any) {
    this.actionType = "insert";
    this.actionData = data;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val });
    return this;
  }

  neq(col: string, val: any) { return this; }
  gt(col: string, val: any) { return this; }
  lt(col: string, val: any) { return this; }
  gte(col: string, val: any) { return this; }
  lte(col: string, val: any) { return this; }
  like(col: string, val: any) { return this; }
  ilike(col: string, val: any) { return this; }
  order(col: string, options?: any) { return this; }
  limit(n: number) {
    this.limitCount = n;
    return this;
  }

  single() {
    this.singleResult = true;
    return this;
  }

  // Promise-compatible then method
  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any): Promise<any> {
    let resultPromise: Promise<any>;

    if (typeof window === "undefined") {
      resultPromise = Promise.resolve({ data: this.singleResult ? null : [], error: null });
    } else {
      const key = `mock_${this.tableName}`;

      if (this.tableName === "users") {
        const profile = getMockProfile();
        if (this.actionType === "update") {
          const updated = { ...profile, ...this.actionData };
          localStorage.setItem("mock_profile", JSON.stringify(updated));
          resultPromise = Promise.resolve({ data: updated, error: null });
        } else if (this.actionType === "delete") {
          localStorage.removeItem("mock_profile");
          localStorage.removeItem("mock_supabase_session");
          resultPromise = Promise.resolve({ data: null, error: null });
        } else {
          if (this.singleResult) {
            resultPromise = Promise.resolve({ data: profile, error: null });
          } else {
            resultPromise = Promise.resolve({ data: [profile], error: null });
          }
        }
      } else if (this.tableName === "site_settings") {
        if (this.actionType === "insert" || this.actionType === "update") {
          const data = JSON.parse(localStorage.getItem(key) || "[]");
          const inputRows = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
          inputRows.forEach((row: any) => {
            const idx = data.findIndex((item: any) => item.key === row.key);
            if (idx > -1) {
              data[idx] = { ...data[idx], ...row };
            } else {
              data.push(row);
            }
          });
          localStorage.setItem(key, JSON.stringify(data));
          resultPromise = Promise.resolve({ data: inputRows, error: null });
        } else {
          resultPromise = Promise.resolve({ data: [], error: null });
        }
      } else {
        try {
          let stored = localStorage.getItem(key);
          if (!stored) {
            if (this.tableName === "tat_cases") {
              stored = JSON.stringify(DEFAULT_TAT_CASES);
              localStorage.setItem(key, stored);
            } else if (this.tableName === "courses") {
              stored = JSON.stringify(DEFAULT_COURSES);
              localStorage.setItem(key, stored);
            } else if (this.tableName === "cases") {
              stored = JSON.stringify(DEFAULT_CASES);
              localStorage.setItem(key, stored);
            }
          }
          const data = JSON.parse(stored || "[]");

          const matchesFilters = (item: any) => {
            return this.filters.every(f => {
              const itemVal = item[f.col];
              if (itemVal === undefined) return false;
              return String(itemVal) === String(f.val);
            });
          };

          if (this.actionType === "insert") {
            const itemsToInsert = Array.isArray(this.actionData)
              ? this.actionData.map((item: any) => ({ id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)), created_at: new Date().toISOString(), ...item }))
              : [{ id: this.actionData.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)), created_at: new Date().toISOString(), ...this.actionData }];
            
            data.push(...itemsToInsert);
            localStorage.setItem(key, JSON.stringify(data));
            resultPromise = Promise.resolve({ data: itemsToInsert, error: null });

          } else if (this.actionType === "update") {
            const updatedItems: any[] = [];
            const updatedData = data.map((item: any) => {
              if (this.filters.length === 0 || matchesFilters(item)) {
                const updatedItem = { ...item, ...this.actionData };
                updatedItems.push(updatedItem);
                return updatedItem;
              }
              return item;
            });
            localStorage.setItem(key, JSON.stringify(updatedData));
            resultPromise = Promise.resolve({ data: updatedItems, error: null });

          } else if (this.actionType === "delete") {
            const deletedItems: any[] = [];
            const remainingData = data.filter((item: any) => {
              if (this.filters.length === 0 || matchesFilters(item)) {
                deletedItems.push(item);
                return false;
              }
              return true;
            });
            localStorage.setItem(key, JSON.stringify(remainingData));
            resultPromise = Promise.resolve({ data: deletedItems, error: null });

          } else {
            let filteredData = data;
            if (this.filters.length > 0) {
              filteredData = data.filter(matchesFilters);
            }
            if (this.limitCount !== null) {
              filteredData = filteredData.slice(0, this.limitCount);
            }
            if (this.singleResult) {
              resultPromise = Promise.resolve({ data: filteredData[0] || null, error: null });
            } else {
              resultPromise = Promise.resolve({ data: filteredData, error: null, count: filteredData.length });
            }
          }
        } catch (e) {
          resultPromise = Promise.resolve({ data: this.singleResult ? null : [], error: null });
        }
      }
    }

    return resultPromise.then(onfulfilled, onrejected);
  }
}

// Fully custom Mock Supabase Client
const mockSupabase = {
  auth: {
    getSession: () => {
      const session = getMockSession();
      return Promise.resolve({ data: { session }, error: null });
    },
    onAuthStateChange: (callback: any) => {
      authCallbacks.push(callback);
      const session = getMockSession();
      // Invoke callback on a macro-task tick to prevent dispatching during rendering
      setTimeout(() => {
        try {
          callback("INITIAL_SESSION", session);
        } catch (e) {}
      }, 0);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authCallbacks = authCallbacks.filter(cb => cb !== callback);
            }
          }
        }
      };
    },
    signInWithPassword: ({ email }: any) => {
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user: {
          id: "demo-user",
          email: email,
          user_metadata: {
            full_name: email.split("@")[0].toUpperCase(),
            role: "Admin",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("mock_supabase_session", JSON.stringify(session));
        localStorage.setItem("mock_profile", JSON.stringify({
          id: "demo-user",
          email: email,
          full_name: email.split("@")[0].toUpperCase(),
          role: "Admin",
          plan: "premium",
          created_at: new Date().toISOString()
        }));
      }
      triggerCallbacks("SIGNED_IN", session);
      return Promise.resolve({ data: { user: session.user, session }, error: null });
    },
    signUp: ({ email, options }: any) => {
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user: {
          id: "demo-user",
          email: email,
          user_metadata: {
            full_name: options?.data?.full_name || email.split("@")[0],
            role: options?.data?.role || "Student",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("mock_supabase_session", JSON.stringify(session));
        localStorage.setItem("mock_profile", JSON.stringify({
          id: "demo-user",
          email: email,
          full_name: options?.data?.full_name || email.split("@")[0],
          role: options?.data?.role || "Student",
          plan: "free",
          created_at: new Date().toISOString()
        }));
      }
      triggerCallbacks("SIGNED_IN", session);
      return Promise.resolve({ data: { user: session.user, session }, error: null });
    },
    signOut: () => {
      if (typeof window !== "undefined") {
        localStorage.removeItem("mock_supabase_session");
        localStorage.removeItem("mock_profile");
      }
      triggerCallbacks("SIGNED_OUT", null);
      return Promise.resolve({ error: null });
    },
    resetPasswordForEmail: (email: string, options?: any) => {
      if (typeof window !== "undefined") {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        let code = "";
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        localStorage.setItem("mock_otp_code", code);
        localStorage.setItem("mock_otp_email", email);
        console.log(`[Mock Auth] Reset code generated for ${email}: ${code}`);
        
        // Show a clear instructions alert with the code
        try {
          if (typeof window !== "undefined" && typeof window.alert === "function") {
            window.alert(`[DEBUG - Sandbox Mode]\n\nPassword reset code generated for: ${email}\n\nReset Code: ${code}\n\nThis code has been copied to your clipboard. Please paste it into the 8-Character Reset Code field to proceed.`);
          }
        } catch (e) {
          console.warn("Alert blocked in iframe environment:", e);
        }
        try {
          navigator.clipboard.writeText(code);
        } catch (e) {}
      }
      return Promise.resolve({ data: {}, error: null });
    },
    verifyOtp: (options: any) => {
      const email = options?.email;
      const token = options?.token;
      
      if (typeof window !== "undefined") {
        const savedCode = localStorage.getItem("mock_otp_code");
        const savedEmail = localStorage.getItem("mock_otp_email");
        
        if (savedCode && savedEmail && savedEmail.toLowerCase() === email?.toLowerCase()) {
          if (savedCode.trim().toUpperCase() !== token?.trim().toUpperCase()) {
            return Promise.resolve({
              data: { session: null },
              error: new Error("Invalid reset code. Please check and try again.")
            });
          }
        }
      }
      
      const session = {
        access_token: "mock-token",
        token_type: "bearer",
        expires_in: 3600,
        refresh_token: "mock-refresh",
        user: {
          id: "demo-user",
          email: email || "demo.taxwise@example.com",
          user_metadata: {
            full_name: (email || "demo.taxwise@example.com").split("@")[0].toUpperCase(),
            role: "Admin",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("mock_supabase_session", JSON.stringify(session));
      }
      return Promise.resolve({ data: { session }, error: null });
    },
    updateUser: (options: any) => {
      const profile = getMockProfile();
      if (typeof window !== "undefined") {
        const updated = { ...profile, ...options.data };
        localStorage.setItem("mock_profile", JSON.stringify(updated));
      }
      return Promise.resolve({ data: { user: getMockSession()?.user }, error: null });
    }
  },
  from: (tableName: string) => {
    return new MockQueryBuilder(tableName);
  }
};

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        },
      },
    })
  : (mockSupabase as unknown as ReturnType<typeof createClient>);
