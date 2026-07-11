"use client";

import { useActionState } from "react";
import {
  subscribeAction,
  type SubscribeResult,
} from "@/lib/actions/posts";

export function SubscribeForm() {
  const [state, formAction, pending] = useActionState<
    SubscribeResult | null,
    FormData
  >(subscribeAction, null);

  return (
    <form action={formAction} className="mt-8 max-w-md">
      <label htmlFor="email" className="block text-sm text-muted mb-2">
        Email
      </label>
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="you@example.com"
          className="flex-1 bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground placeholder:text-muted-soft"
        />
        <button
          type="submit"
          disabled={pending}
          className="text-foreground hover:opacity-70 transition-opacity disabled:opacity-50 py-2"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state?.ok === false ? (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
      {state?.ok === true ? (
        <p className="mt-3 text-sm text-muted">{state.message}</p>
      ) : null}
    </form>
  );
}
