import firebaseConfig from "../../../firebase-applet-config.json";

export interface VerifiedFirebaseIdentity {
  id: string;
  email: string;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<VerifiedFirebaseIdentity | null> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
      cache: "no-store",
    }
  );

  if (!response.ok) return null;

  const result = await response.json();
  const firebaseUser = result?.users?.[0];
  if (!firebaseUser?.localId || !firebaseUser?.email || firebaseUser.emailVerified !== true) {
    return null;
  }

  return { id: firebaseUser.localId, email: String(firebaseUser.email).toLowerCase() };
}
