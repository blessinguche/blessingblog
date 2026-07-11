import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="page" />
      <main className="mx-auto max-w-2xl px-6 pb-24 text-center">
        <h1 className="text-3xl font-bold mb-4">Not found</h1>
        <p className="text-muted mb-6">That page isn&apos;t here.</p>
        <Link href="/" className="text-muted hover:text-foreground no-underline">
          Back home
        </Link>
      </main>
    </div>
  );
}
