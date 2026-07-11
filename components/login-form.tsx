"use client";

import { useActionState } from "react";
import { loginAction, type AuthResult } from "@/lib/actions/auth";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const [state, formAction, pending] = useActionState<AuthResult | null, FormData>(
    loginAction,
    null
  );

  return (
    <form action={formAction} className="mt-8 w-full max-w-sm mx-auto">
      <input type="hidden" name="next" value={nextPath} />
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
