import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  getAdditionalUserInfo,
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
  // If role selection is pending, do not treat user as logged in yet
  if (typeof window !== "undefined" && safeStorage.getItem("taxwise_pending_role_setup")) {
    return null;
  }

  // 1. Check live Firebase Auth user first
  if (auth.currentUser && auth.currentUser.email) {
    const prof = getGoogleUserProfile(auth.currentUser);
    const stored = safeStorage.getItem("taxwise_active_user");
    if (stored && prof) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.email?.toLowerCase() === auth.currentUser.email.toLowerCase() && parsed.role) {
          return {
            ...prof,
            role: parsed.role,
            full_name: parsed.full_name || prof.full_name,
            plan: parsed.plan || prof.plan,
          };
        }
      } catch {
        // ignore JSON parse error
      }
    }
    return prof;
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
 * Detects whether this is a brand-new user who must be prompted to select their professional role.
 */
export const signInWithGoogle = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
  profile: UserProfile;
  isNewUser: boolean;
}> => {
  const result = await signInWithPopup(auth, provider);
  const credential = GoogleAuthProvider.credentialFromResult(result);
  const accessToken = credential?.accessToken || "";
  cachedAccessToken = accessToken;

  const fUser = result.user;
  const additionalInfo = getAdditionalUserInfo(result);
  const isNewFirebaseUser = additionalInfo?.isNewUser ?? false;

  let profile = getGoogleUserProfile(fUser)!;
  let isNewUser = isNewFirebaseUser;

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
        is_first_login: isNewFirebaseUser,
      }),
    });
    if (syncRes.ok) {
      const syncData = await syncRes.json();
      if (syncData?.isNewUser !== undefined) {
        isNewUser = syncData.isNewUser || isNewFirebaseUser;
      }
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

  // Check if an existing profile with an established non-default role exists locally
  const localStored = safeStorage.getItem("taxwise_active_user");
  if (localStored) {
    try {
      const parsed = JSON.parse(localStored);
      if (parsed?.email?.toLowerCase() === (fUser.email || "").toLowerCase() && parsed.role) {
        isNewUser = false;
        profile.role = parsed.role;
      }
    } catch {
      // ignore
    }
  }

  const isAdmin = (fUser.email || "").toLowerCase() === "taxwiseplatform@gmail.com";
  if (isAdmin) {
    isNewUser = false;
  }

  // If this is a new user (and not master admin), mark pending role setup
  if (isNewUser) {
    safeStorage.setItem("taxwise_pending_role_setup", "true");
    return { user: fUser, accessToken, profile, isNewUser: true };
  }

  // Otherwise, finalize the session immediately
  safeStorage.removeItem("taxwise_pending_role_setup");
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

  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("taxwise_auth_changed", { detail: profile }));
    } catch {
      // ignore
    }
  }

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

  return { user: fUser, accessToken, profile, isNewUser: false };
};

/**
 * Updates the user's professional role both in Supabase backend and in the local app session.
 * Used when a new Google user selects their professional role on initial registration.
 */
export const updateUserRole = async (
  email: string,
  selectedRole: string,
  fullName?: string,
  avatarUrl?: string
): Promise<UserProfile> => {
  const normEmail = email.toLowerCase();
  const isAdmin = normEmail === "taxwiseplatform@gmail.com";
  const finalRole = isAdmin ? "Admin" : selectedRole;

  let updatedProfile: UserProfile = {
    id: `google-${normEmail}`,
    email: normEmail,
    full_name: fullName || (isAdmin ? "TaxWise Platform" : normEmail.split("@")[0]),
    role: finalRole,
    plan: "professional",
    avatar_url: avatarUrl,
  };

  // 1. Sync with server route
  try {
    const res = await fetch("/api/auth/google-sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normEmail,
        role: finalRole,
        full_name: updatedProfile.full_name,
        avatar_url: avatarUrl,
        google_uid: auth.currentUser?.uid,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.profile) {
        updatedProfile = {
          id: data.profile.id || updatedProfile.id,
          email: normEmail,
          full_name: data.profile.full_name || updatedProfile.full_name,
          role: data.profile.role || finalRole,
          plan: data.profile.plan || "professional",
          avatar_url: data.profile.avatar_url || avatarUrl,
        };
      }
    }
  } catch (err) {
    console.warn("Could not sync updated role to /api/auth/google-sync:", err);
  }

  safeStorage.removeItem("taxwise_pending_role_setup");
  safeStorage.setItem(`taxwise_role_confirmed_${normEmail}`, "true");

  // 3. Update local session stores
  const session = {
    access_token: cachedAccessToken || "google-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "google-refresh",
    user: {
      id: updatedProfile.id,
      email: updatedProfile.email,
      user_metadata: {
        full_name: updatedProfile.full_name,
        avatar_url: updatedProfile.avatar_url,
        role: updatedProfile.role,
        role_confirmed: true,
      },
      app_metadata: { provider: "google" },
      aud: "authenticated",
      created_at: new Date().toISOString(),
    },
  };

  safeStorage.setItem("taxwise_active_user", JSON.stringify({ ...updatedProfile, role_confirmed: true }));
  safeStorage.setItem("mock_supabase_session", JSON.stringify(session));
  safeStorage.setItem("mock_profile", JSON.stringify({ ...updatedProfile, role_confirmed: true }));

  // 4. Notify app components
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent("taxwise_auth_changed", { detail: updatedProfile }));
    } catch {
      // ignore
    }
  }

  // 5. Upsert to Supabase public.users
  try {
    await supabase.from("users").upsert({
      id: updatedProfile.id,
      email: updatedProfile.email,
      full_name: updatedProfile.full_name,
      role: updatedProfile.role,
      plan: updatedProfile.plan,
    });
  } catch (err) {
    console.warn("Could not upsert updated role to Supabase users table:", err);
  }

  return updatedProfile;
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
