"use client";

import { useActionState } from "react";
import { loginAction, type AuthResult } from "@/lib/actions/auth";
import { isSupabaseConfigured } from "@/lib/auth-session";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    loginAction,
    null
  );
  const useEmail = isSupabaseConfigured();

  return (
    <form action={formAction} className="mt-8 w-full max-w-sm mx-auto">
      <input type="hidden" name="next" value={nextPath} />
      {useEmail ? (
        <div className="mb-5">
          <label htmlFor="email" className="block text-sm text-muted mb-2">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground"
          />
        </div>
      ) : (
        <input type="hidden" name="email" value="writer@local" />
      )}
      <div className="mb-6">
        <label htmlFor="password" className="block text-sm text-muted mb-2">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground"
        />
      </div>
      {state?.ok === false ? (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="text-foreground font-medium hover:opacity-70 disabled:opacity-50"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
