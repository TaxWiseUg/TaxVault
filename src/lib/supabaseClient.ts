import { createClient } from '@supabase/supabase-js';
import {
  IMPORTED_TAT_CASES,
  IMPORTED_SITE_SETTINGS,
  IMPORTED_USERS,
  IMPORTED_ENROLLMENTS,
  IMPORTED_COMPLIANCE_REPORTS,
  IMPORTED_ADMIN_LOGS,
  IMPORTED_COURSES,
  IMPORTED_CASES,
} from './importedData';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Bundled reference content is useful for offline citation/search views only.
// Database-backed screens must never use these arrays as persistence fallbacks.
export const DEFAULT_TAT_CASES = IMPORTED_TAT_CASES;
export const DEFAULT_COURSES = IMPORTED_COURSES;
export const DEFAULT_CASES = IMPORTED_CASES;
export const DEFAULT_SITE_SETTINGS = IMPORTED_SITE_SETTINGS;
export const DEFAULT_USERS = IMPORTED_USERS;
export const DEFAULT_ADMIN_LOGS = IMPORTED_ADMIN_LOGS;
export const DEFAULT_ENROLLMENTS = IMPORTED_ENROLLMENTS;
export const DEFAULT_COMPLIANCE_REPORTS = IMPORTED_COMPLIANCE_REPORTS;

const unavailableMessage = 'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.';
const unavailableError = () => new Error(unavailableMessage);

// Keep the UI renderable without credentials, but reject all database operations
// instead of pretending localStorage writes were saved to Supabase.
function unavailableQuery() {
  const chain = new Proxy({}, {
    get(_target, property) {
      if (property === 'then') {
        return (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
          Promise.resolve({ data: null, error: unavailableError(), count: null }).then(resolve, reject);
      }
      return () => chain;
    },
  });
  return chain;
}

const unavailableAuth = new Proxy({}, {
  get(_target, property) {
    if (property === 'getSession') {
      return async () => ({ data: { session: null }, error: null });
    }
    if (property === 'onAuthStateChange') {
      return (callback: (event: string, session: null) => void) => {
        const timer = setTimeout(() => callback('INITIAL_SESSION', null), 0);
        return { data: { subscription: { unsubscribe: () => clearTimeout(timer) } } };
      };
    }
    if (property === 'signOut') {
      return async () => ({ error: null });
    }
    return async () => ({ data: null, error: unavailableError() });
  },
});

const unavailableSupabase = {
  from: () => unavailableQuery(),
  auth: unavailableAuth,
} as unknown as ReturnType<typeof createClient>;

// Safe browser storage for non-authoritative session/preferences cache only.
const memoryStore: Record<string, string> = {};
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) return window.localStorage.getItem(key);
    } catch {
      // Sandboxed iframe: access to localStorage denied.
    }
    return memoryStore[key] ?? null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.setItem(key, value);
    } catch {
      // Sandboxed iframe: access to localStorage denied.
    }
    memoryStore[key] = value;
  },
  removeItem: (key: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) window.localStorage.removeItem(key);
    } catch {
      // Sandboxed iframe: access to localStorage denied.
    }
    delete memoryStore[key];
  },
};

if (!isSupabaseConfigured) {
  console.error(unavailableMessage);
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: safeStorage,
        lock: async <R>(_name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> => await fn(),
      },
    })
  : unavailableSupabase;
