/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { createClient } from '@supabase/supabase-js';
import {
  IMPORTED_TAT_CASES,
  IMPORTED_SITE_SETTINGS,
  IMPORTED_USERS,
  IMPORTED_ENROLLMENTS,
  IMPORTED_COMPLIANCE_REPORTS,
  IMPORTED_ADMIN_LOGS,
  IMPORTED_COURSES,
  IMPORTED_CASES
} from './importedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase environment variables are missing. Running in robust Demo / Sandbox mode.'
  );
}

export const DEFAULT_TAT_CASES = IMPORTED_TAT_CASES;
export const DEFAULT_COURSES = IMPORTED_COURSES;
export const DEFAULT_CASES = IMPORTED_CASES;
export const DEFAULT_SITE_SETTINGS = IMPORTED_SITE_SETTINGS;
export const DEFAULT_USERS = IMPORTED_USERS;
export const DEFAULT_ADMIN_LOGS = IMPORTED_ADMIN_LOGS;

// Safe in-memory fallback storage for sandboxed iframes & restrictive browser contexts
const memoryStore: Record<string, string> = {};
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Sandboxed iframe: access to localStorage denied
    }
    return memoryStore[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Sandboxed iframe
    }
    memoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Sandboxed iframe
    }
    delete memoryStore[key];
  }
};

// Helpers for mock authentication and local persistence
function getMockSession() {
  if (typeof window === "undefined") return null;
  const activeUserRaw = safeStorage.getItem("taxwise_active_user");
  if (activeUserRaw) {
    try {
      const activeUser = JSON.parse(activeUserRaw);
      if (activeUser?.email) {
        return {
          access_token: "google-synced-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "google-synced-refresh",
          user: {
            id: activeUser.id || "f8174d44-d81a-4e70-9f4b-64744f969d09",
            email: activeUser.email,
            user_metadata: {
              full_name: activeUser.full_name,
              role: activeUser.role,
            },
            app_metadata: { provider: "google" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          }
        };
      }
    } catch {}
  }
  const sessionData = safeStorage.getItem("mock_supabase_session");
  if (!sessionData) {
    // In sandbox demo mode, provide an active mock session for the current user
    const demoSession = {
      access_token: "mock-token",
      token_type: "bearer",
      expires_in: 3600,
      refresh_token: "mock-refresh",
      user: {
        id: "f8174d44-d81a-4e70-9f4b-64744f969d09",
        email: "taxwiseplatform@gmail.com",
        user_metadata: {
          full_name: "TaxWise Platform",
          role: "Admin",
        },
        app_metadata: {},
        aud: "authenticated",
        created_at: "2026-07-04 11:36:52.408438+00",
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
  const activeUserRaw = safeStorage.getItem("taxwise_active_user");
  if (activeUserRaw) {
    try {
      const activeUser = JSON.parse(activeUserRaw);
      if (activeUser?.email) return activeUser;
    } catch {}
  }
  const profile = safeStorage.getItem("mock_profile");
  if (!profile) {
    // Default admin mock user so all dashboards are accessible in preview
    const defaultProfile = {
      id: "f8174d44-d81a-4e70-9f4b-64744f969d09",
      email: "taxwiseplatform@gmail.com",
      full_name: "TaxWise Platform",
      role: "Admin",
      plan: "professional",
      created_at: "2026-07-04 11:36:52.408438+00"
    };
    safeStorage.setItem("mock_profile", JSON.stringify(defaultProfile));
    return defaultProfile;
  }
  try {
    return JSON.parse(profile);
  } catch (e) {
    return null;
  }
}

function getInitialTableData(tableName: string): any[] {
  switch (tableName) {
    case "tat_cases":
      return IMPORTED_TAT_CASES;
    case "site_settings":
      return IMPORTED_SITE_SETTINGS;
    case "users":
      return IMPORTED_USERS;
    case "enrollments":
      return IMPORTED_ENROLLMENTS;
    case "compliance_reports":
      return IMPORTED_COMPLIANCE_REPORTS;
    case "admin_logs":
      return IMPORTED_ADMIN_LOGS;
    case "courses":
      return IMPORTED_COURSES;
    case "cases":
      return IMPORTED_CASES;
    case "subscriptions":
      return [
        {
          id: "sub-1",
          user_id: "a9e5e811-1a15-4c68-be82-faa5ce05bc24",
          plan: "professional",
          status: "active",
          starts_at: "2026-07-04T20:32:52.849Z",
          expires_at: "2027-07-04T20:32:52.849Z"
        },
        {
          id: "sub-2",
          user_id: "2659af7a-7132-426d-a1fb-a3fbe5a12848",
          plan: "professional",
          status: "active",
          starts_at: "2026-06-20T08:14:34.016Z",
          expires_at: "2027-06-20T08:14:34.016Z"
        }
      ];
    default:
      return [];
  }
}

function getStoredTableData(tableName: string): any[] {
  if (typeof window === "undefined") return getInitialTableData(tableName);
  const key = `mock_${tableName}`;
  const raw = safeStorage.getItem(key);
  if (!raw) {
    const init = getInitialTableData(tableName);
    safeStorage.setItem(key, JSON.stringify(init));
    return init;
  }
  try {
    const parsed = JSON.parse(raw);
    if (tableName === "tat_cases" && Array.isArray(parsed) && parsed.length < IMPORTED_TAT_CASES.length) {
      safeStorage.setItem(key, JSON.stringify(IMPORTED_TAT_CASES));
      return IMPORTED_TAT_CASES;
    }
    if (tableName === "site_settings" && Array.isArray(parsed) && parsed.length < IMPORTED_SITE_SETTINGS.length) {
      safeStorage.setItem(key, JSON.stringify(IMPORTED_SITE_SETTINGS));
      return IMPORTED_SITE_SETTINGS;
    }
    if (tableName === "admin_logs" && Array.isArray(parsed) && parsed.length < IMPORTED_ADMIN_LOGS.length) {
      safeStorage.setItem(key, JSON.stringify(IMPORTED_ADMIN_LOGS));
      return IMPORTED_ADMIN_LOGS;
    }
    if (tableName === "users" && Array.isArray(parsed) && parsed.length < IMPORTED_USERS.length) {
      safeStorage.setItem(key, JSON.stringify(IMPORTED_USERS));
      return IMPORTED_USERS;
    }
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    const init = getInitialTableData(tableName);
    safeStorage.setItem(key, JSON.stringify(init));
    return init;
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
  private filters: { col: string; val: any; op: "eq" | "gte" | "in" }[] = [];
  private orderField: string | null = null;
  private orderAscending: boolean = true;
  private limitCount: number | null = null;
  private singleResult: boolean = false;
  private selectOptions: any = null;
  private actionType: "select" | "insert" | "update" | "delete" = "select";
  private actionData: any = null;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  select(fields?: string, options?: any) {
    this.actionType = "select";
    this.selectOptions = options;
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
    this.actionData = null;
    return this;
  }

  upsert(data: any, options?: any) {
    this.actionType = "insert";
    this.actionData = data;
    return this;
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val, op: "eq" });
    return this;
  }

  neq(col: string, val: any) { return this; }
  gt(col: string, val: any) { return this; }
  lt(col: string, val: any) { return this; }
  gte(col: string, val: any) {
    this.filters.push({ col, val, op: "gte" });
    return this;
  }
  in(col: string, values: any[]) {
    this.filters.push({ col, val: values, op: "in" });
    return this;
  }
  lte(col: string, val: any) { return this; }
  like(col: string, val: any) { return this; }
  ilike(col: string, val: any) { return this; }
  order(col: string, options?: any) {
    this.orderField = col;
    this.orderAscending = options?.ascending !== false;
    return this;
  }
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
      const initial = getInitialTableData(this.tableName);
      resultPromise = Promise.resolve({ data: this.singleResult ? (initial[0] || null) : initial, error: null, count: initial.length });
    } else {
      const key = `mock_${this.tableName}`;
      const data: any[] = getStoredTableData(this.tableName);

      const matchesFilters = (item: any) => {
        return this.filters.every(f => {
          const itemVal = item[f.col];
          if (itemVal === undefined) return false;
          if (f.op === "gte") {
            return String(itemVal) >= String(f.val);
          }
          if (f.op === "in") {
            return Array.isArray(f.val) && f.val.some(value => String(itemVal).toLowerCase() === String(value).toLowerCase());
          }
          return String(itemVal).toLowerCase() === String(f.val).toLowerCase();
        });
      };

      if (this.actionType === "insert") {
        const inputRows = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
        const insertedRows: any[] = [];

        if (this.tableName === "site_settings") {
          inputRows.forEach((row: any) => {
            const idx = data.findIndex((item: any) => item.key === row.key);
            if (idx > -1) {
              data[idx] = { ...data[idx], ...row };
              insertedRows.push(data[idx]);
            } else {
              data.push(row);
              insertedRows.push(row);
            }
          });
        } else if (this.tableName === "users") {
          inputRows.forEach((row: any) => {
            const idx = data.findIndex((item: any) => 
              (row.email && item.email && String(item.email).toLowerCase() === String(row.email).toLowerCase()) ||
              (row.id && item.id && item.id === row.id)
            );
            if (idx > -1) {
              data[idx] = { ...data[idx], ...row };
              insertedRows.push(data[idx]);
            } else {
              const newRow = {
                id: row.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
                created_at: row.created_at || new Date().toISOString(),
                ...row
              };
              data.unshift(newRow);
              insertedRows.push(newRow);
            }
          });
        } else {
          inputRows.forEach((item: any) => {
            const newRow = {
              id: item.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
              created_at: item.created_at || new Date().toISOString(),
              ...item
            };
            data.unshift(newRow);
            insertedRows.push(newRow);
          });
        }

        safeStorage.setItem(key, JSON.stringify(data));
        resultPromise = Promise.resolve({ data: insertedRows, error: null });

      } else if (this.actionType === "update") {
        const updatedRows: any[] = [];
        const updatedData = data.map((item: any) => {
          if (this.filters.length === 0 || matchesFilters(item)) {
            const updated = { ...item, ...this.actionData };
            updatedRows.push(updated);
            if (this.tableName === "users") {
              const currentProfile = getMockProfile();
              if (currentProfile && currentProfile.id === item.id) {
                safeStorage.setItem("mock_profile", JSON.stringify({ ...currentProfile, ...this.actionData }));
              }
            }
            return updated;
          }
          return item;
        });

        safeStorage.setItem(key, JSON.stringify(updatedData));
        resultPromise = Promise.resolve({ data: updatedRows, error: null });

      } else if (this.actionType === "delete") {
        const deletedRows: any[] = [];
        const remainingData = data.filter((item: any) => {
          if (this.filters.length === 0 || matchesFilters(item)) {
            deletedRows.push(item);
            return false;
          }
          return true;
        });

        safeStorage.setItem(key, JSON.stringify(remainingData));
        resultPromise = Promise.resolve({ data: deletedRows, error: null });

      } else {
        // SELECT query
        let resultList = [...data];

        if (this.filters.length > 0) {
          resultList = resultList.filter(matchesFilters);
        }

        if (this.orderField) {
          const col = this.orderField;
          const asc = this.orderAscending;
          resultList.sort((a, b) => {
            const valA = a[col] ?? "";
            const valB = b[col] ?? "";
            if (valA < valB) return asc ? -1 : 1;
            if (valA > valB) return asc ? 1 : -1;
            return 0;
          });
        }

        const totalCount = resultList.length;

        if (this.limitCount !== null) {
          resultList = resultList.slice(0, this.limitCount);
        }

        if (this.selectOptions?.head) {
          resultPromise = Promise.resolve({ data: null, error: null, count: totalCount });
        } else if (this.singleResult) {
          resultPromise = Promise.resolve({ data: resultList[0] || null, error: null, count: totalCount });
        } else {
          resultPromise = Promise.resolve({ data: resultList, error: null, count: totalCount });
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
        safeStorage.setItem("mock_supabase_session", JSON.stringify(session));
        safeStorage.setItem("mock_profile", JSON.stringify({
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
        safeStorage.setItem("mock_supabase_session", JSON.stringify(session));
        safeStorage.setItem("mock_profile", JSON.stringify({
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
        safeStorage.removeItem("mock_supabase_session");
        safeStorage.removeItem("mock_profile");
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
        safeStorage.setItem("mock_otp_code", code);
        safeStorage.setItem("mock_otp_email", email);
        console.log(`[Mock Auth] Reset code generated for ${email}: ${code}`);
        
        // Avoid window.alert in iframe environments
        console.info(`[Sandbox Mode] Password reset code for ${email}: ${code}`);
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
        const savedCode = safeStorage.getItem("mock_otp_code");
        const savedEmail = safeStorage.getItem("mock_otp_email");
        
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
          id: email === "taxwiseplatform@gmail.com" ? "f8174d44-d81a-4e70-9f4b-64744f969d09" : (email ? "user-" + btoa(email).slice(0, 12) : "f8174d44-d81a-4e70-9f4b-64744f969d09"),
          email: email || "taxwiseplatform@gmail.com",
          user_metadata: {
            full_name: (email || "taxwiseplatform@gmail.com").split("@")[0].toUpperCase(),
            role: "Admin",
          },
          app_metadata: {},
          aud: "authenticated",
          created_at: new Date().toISOString(),
        }
      };
      if (typeof window !== "undefined") {
        safeStorage.setItem("mock_supabase_session", JSON.stringify(session));
      }
      return Promise.resolve({ data: { session }, error: null });
    },
    updateUser: (options: any) => {
      const profile = getMockProfile();
      if (typeof window !== "undefined") {
        const updated = { ...profile, ...options.data };
        safeStorage.setItem("mock_profile", JSON.stringify(updated));
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
        storage: safeStorage,
        lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
          return await fn();
        },
      },
    })
  : (mockSupabase as unknown as ReturnType<typeof createClient>);
