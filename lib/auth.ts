import { cookies } from "next/headers";
import {
  LOCAL_SESSION_COOKIE,
  verifyLocalSessionToken,
} from "@/lib/auth-session";

export { LOCAL_SESSION_COOKIE, createLocalSessionToken } from "@/lib/auth-session";
export { isSupabaseConfigured } from "@/lib/auth-session";

export async function isWriterAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyLocalSessionToken(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
}
