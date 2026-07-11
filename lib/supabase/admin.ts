import { createClient } from "@supabase/supabase-js";
import {
  getSupabaseSecretKey,
  getSupabaseUrl,
  isSupabaseWriterConfigured,
} from "@/lib/supabase/env";

export function createAdminClient() {
  if (!isSupabaseWriterConfigured()) {
    throw new Error("Supabase writer credentials are not configured.");
  }

  return createClient(getSupabaseUrl()!, getSupabaseSecretKey()!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
