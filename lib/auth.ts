import { cookies } from "next/headers";
import {
  LOCAL_SESSION_COOKIE,
  verifyLocalSessionToken,
  isSupabaseConfigured,
} from "@/lib/auth-session";

export { LOCAL_SESSION_COOKIE, createLocalSessionToken } from "@/lib/auth-session";
export { isSupabaseConfigured } from "@/lib/auth-session";

export async function isWriterAuthenticated(): Promise<boolean> {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return Boolean(user);
  }

  const cookieStore = await cookies();
  return verifyLocalSessionToken(cookieStore.get(LOCAL_SESSION_COOKIE)?.value);
}
