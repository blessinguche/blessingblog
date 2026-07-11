"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createLocalSessionToken,
  LOCAL_SESSION_COOKIE,
  isSupabaseConfigured,
} from "@/lib/auth-session";

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function loginAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/write");

  if (isSupabaseConfigured()) {
    const email = process.env.WRITER_EMAIL?.trim();
    if (!email) {
      return { ok: false, error: "Login is not configured." };
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { ok: false, error: "Invalid password." };
    }
    redirect(next.startsWith("/") ? next : "/write");
  }

  const expected = process.env.WRITER_PASSWORD || "blessing";
  if (password !== expected) {
    return { ok: false, error: "Invalid password." };
  }

  const cookieStore = await cookies();
  cookieStore.set(LOCAL_SESSION_COOKIE, await createLocalSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(next.startsWith("/") ? next : "/write");
}

export async function logoutAction() {
  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_SESSION_COOKIE);
  redirect("/");
}
