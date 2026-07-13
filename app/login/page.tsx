import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { safeNextPath } from "@/lib/validate";

export const metadata: Metadata = {
  title: "Login",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ next?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { next } = await searchParams;
  const nextPath = safeNextPath(next || "/write");

  return (
    <div className="min-h-screen flex flex-col">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <Link
          href="/"
          className="text-3xl font-bold text-foreground no-underline mb-2"
        >
          Blessing
        </Link>
        <p className="text-muted text-sm mb-2">Writer login</p>
        <LoginForm nextPath={nextPath} />
      </main>
    </div>
  );
}
