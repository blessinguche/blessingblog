import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { SubscribeForm } from "@/components/subscribe-form";

export const metadata: Metadata = {
  title: "subscribe",
  description: "Get an email when Blessing publishes something new.",
};

export default function SubscribePage() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="text-3xl font-bold mb-4 text-link lowercase">subscribe</h1>
        <p className="text-[1.1rem] leading-relaxed text-foreground/90">
          Put your email below and I&apos;ll email you when I publish something new.
          I won&apos;t spam you, I promise 💞
        </p>
        <SubscribeForm />
      </main>
    </div>
  );
}
