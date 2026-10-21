import "server-only";
// ADAPTER — point this at TaxWise's existing auth. Nothing else in the feature touches auth directly.
// Examples:
//   NextAuth:  const s = await getServerSession(authOptions); return s?.user?.id ?? null;
//   Supabase:  const { data } = await createServerClient(...).auth.getUser(); return data.user?.id ?? null;
//   Clerk:     return auth().userId;
import { getCurrentUserId as existingGetCurrentUserId } from "@/lib/auth"; // TODO: adjust import to your project
export class UnauthorizedError extends Error {
  status = 401;
}
export async function requireUserId() {
  const id = await existingGetCurrentUserId();
  if (!id) throw new UnauthorizedError("Sign in to use Know Your Taxes");
  return id;
}
