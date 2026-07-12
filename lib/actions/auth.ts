"use server";

import { timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createLocalSessionToken,
  LOCAL_SESSION_COOKIE,
} from "@/lib/auth-session";
import { getWriterPassword } from "@/lib/env";
import { safeNextPath } from "@/lib/validate";

export type AuthResult = { ok: true } | { ok: false; error: string };

function passwordsMatch(input: string, expected: string): boolean {
  const a = Buffer.from(input);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function loginAction(
  _prev: AuthResult | null,
  formData: FormData
): Promise<AuthResult> {
  const password = String(formData.get("password") || "");
  const next = safeNextPath(String(formData.get("next") || "/write"));

  if (!passwordsMatch(password, getWriterPassword())) {
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

  redirect(next);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_SESSION_COOKIE);
  redirect("/");
}
