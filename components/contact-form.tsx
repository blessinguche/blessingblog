"use client";

import { useActionState } from "react";
import {
  contactAction,
  type ContactResult,
} from "@/lib/actions/contact";

export function ContactForm() {
  const [state, formAction, pending] = useActionState<
    ContactResult | null,
    FormData
  >(contactAction, null);

  return (
    <form action={formAction} className="mt-8 space-y-6 max-w-md">
      {/* Honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
        aria-hidden="true"
      />

      <div>
        <label htmlFor="name" className="block text-sm text-muted mb-2">
          Name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground placeholder:text-muted-soft"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm text-muted mb-2">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground placeholder:text-muted-soft"
        />
      </div>

      <div>
        <label htmlFor="subject" className="block text-sm text-muted mb-2">
          Subject
        </label>
        <input
          id="subject"
          name="subject"
          type="text"
          required
          className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground placeholder:text-muted-soft"
        />
      </div>

      <div>
        <label htmlFor="body" className="block text-sm text-muted mb-2">
          Message
        </label>
        <textarea
          id="body"
          name="body"
          required
          rows={6}
          className="w-full bg-transparent border-b border-border px-0 py-2 outline-none focus:border-foreground resize-y min-h-[8rem] placeholder:text-muted-soft"
        />
      </div>

      {state?.ok === false ? (
        <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>
      ) : null}
      {state?.ok === true ? (
        <p className="text-sm text-muted">{state.message}</p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="text-foreground font-medium hover:opacity-70 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send"}
      </button>
    </form>
  );
}
