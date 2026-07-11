import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { ContactForm } from "@/components/contact-form";

export const metadata: Metadata = {
  title: "contact",
  description: "Get in touch with Blessing.",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="text-3xl font-bold mb-4 text-link lowercase">contact</h1>
        <p className="text-[1.1rem] leading-relaxed text-foreground/90">
          Say hi — leave a note and I&apos;ll get back to you.
        </p>
        <ContactForm />
      </main>
    </div>
  );
}
