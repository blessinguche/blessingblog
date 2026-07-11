import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: "who am i ?",
  description: "About Blessing.",
};

export default function WhoAmIPage() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-2xl px-6 pb-24">
        <h1 className="text-3xl font-bold mb-6 text-link lowercase">who am i ?</h1>
        <div className="prose-blessing">
          <p>
            I&apos;m Blessing. This is my own place on the internet.
            It is sort of like a diary, where I can share my thoughts 💭, notes 📝, and yaps 🎙️ to the internet void.
            I know it may feel like dead internet theory is real, but at least I&apos;m real, with my own human hands 🤚 typing on my own keyboard ⌨️.
          </p>
          <p>
            No audience is required. If you found this, hello and welcome. Stay as long as you like.
            I&apos;m happy you&apos;re here 💞.
          </p>
          <p className="text-sm text-muted-soft">
            p.s I love to use ALOT of emojis 🤩!
          </p>
        </div>
      </main>
    </div>
  );
}
