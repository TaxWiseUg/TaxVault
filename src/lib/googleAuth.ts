import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User as FirebaseUser,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";
import { safeStorage, supabase } from "./supabaseClient";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  plan: string;
  avatar_url?: string;
}

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/userinfo.email");
provider.addScope("https://www.googleapis.com/auth/userinfo.profile");
provider.setCustomParameters({
  prompt: "select_account",
});

let cachedAccessToken: string | null = null;

export const getGoogleAccessToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Extracts normalized profile attributes from a Firebase Google User.
 */
export const getGoogleUserProfile = (fUser?: FirebaseUser | null): UserProfile | null => {
  const target = fUser || auth.currentUser;
  if (!target || !target.email) return null;

  const email = target.email.toLowerCase();
  const isAdmin = email === "taxwiseplatform@gmail.com";
  const displayName = target.displayName?.trim();
  const fullName = displayName || (isAdmin ? "TaxWise Platform" : target.email.split("@")[0]);

  return {
    id: target.uid,
    email: target.email,
    full_name: fullName,
    role: isAdmin ? "Admin" : "Tax Consultant",
    plan: "professional",
    avatar_url: target.photoURL || undefined,
  };
};

/**
 * Retrieves the currently active user profile across Firebase Auth and local storage.
 */
export const getCurrentUserProfile = (): UserProfile | null => {
  // 1. Check live Firebase Auth user first
  if (auth.currentUser && auth.currentUser.email) {
    return getGoogleUserProfile(auth.currentUser);
  }

  // 2. Check local persistent store
  const stored = safeStorage.getItem("taxwise_active_user") || safeStorage.getItem("mock_profile");
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed?.email && parsed.email !== "trial.practitioner@taxwise.ug") {
        const isAdmin = parsed.email.toLowerCase() === "taxwiseplatform@gmail.com";
        return {
          id: parsed.id || "google-user",
          email: parsed.email,
          full_name: parsed.full_name || (isAdmin ? "TaxWise Platform" : parsed.email.split("@")[0]),
          role: isAdmin ? "Admin" : (parsed.role || "Tax Consultant"),
          plan: parsed.plan || "professional",
          avatar_url: parsed.avatar_url,
        };
      }
    } catch {
      // ignore JSON parse error
    }
  }

  return null;
};

export const initGoogleAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (user) {
      if (cachedAccessToken && onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Initiates authentic Google OAuth popup flow via Firebase Auth.
 * Syncs the verified Google profile and credentials into the TaxWise application session.
 */
export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
  profile: UserProfile;
}> => {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || "";
  cachedAccessToken = accessToken;

  const fUser = result.user;
  let profile = getGoogleUserProfile(fUser)!;

  // Sync & register Google user with Supabase backend to avoid email duplicates and errors
  try {
    const syncRes = await fetch("/api/auth/google-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: fUser.email,
        full_name: fUser.displayName || profile.full_name,
        avatar_url: fUser.photoURL || undefined,
        google_uid: fUser.uid,
      }),
    });
    if (syncRes.ok) {
      const syncData = await syncRes.json();
      if (syncData?.profile) {
        profile = {
          ...profile,
          id: syncData.profile.id || profile.id,
          full_name: syncData.profile.full_name || profile.full_name,
          role: syncData.profile.role || profile.role,
          plan: syncData.profile.plan || profile.plan,
        };
      }
    }
  } catch (syncErr) {
    console.warn("Could not sync with /api/auth/google-sync:", syncErr);
  }

  // Sync to local application session (safeStorage)
  const session = {
    access_token: accessToken || "google-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "google-refresh",
    user: {
      id: profile.id,
      email: profile.email,
      user_metadata: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        role: profile.role,
      },
      app_metadata: { provider: "google" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };

  safeStorage.setItem("taxwise_active_user", JSON.stringify(profile));
  safeStorage.setItem("mock_supabase_session", JSON.stringify(session));
  safeStorage.setItem("mock_profile", JSON.stringify(profile));

  // Dispatch custom window event so page listeners update synchronously
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("taxwise_auth_changed", { detail: profile }));
    } catch {
      // ignore
    }
  }

  // Sync with Supabase users table if available
  try {
    await supabase.from("users").upsert({
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
      plan: profile.plan,
    });
  } catch (err) {
    console.warn("Could not upsert user to Supabase table:", err);
  }

  return { user: fUser, accessToken, profile };
};

export const signOutGoogle = async () => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error("Error signing out of Firebase Google Auth:", err);
  }
  cachedAccessToken = null;
  safeStorage.removeItem("taxwise_active_user");
  safeStorage.removeItem("mock_supabase_session");
  safeStorage.removeItem("mock_profile");

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("taxwise_auth_changed", { detail: null }));
    } catch {
      // ignore
    }
  }
};
