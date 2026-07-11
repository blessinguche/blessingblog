import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV = [
  { href: "/who-am-i", label: "who am i ?" },
  { href: "/contact", label: "contact" },
  { href: "/subscribe", label: "subscribe" },
] as const;

export function SiteHeader({
  variant = "home",
}: {
  variant?: "home" | "page";
}) {
  if (variant === "home") {
    return (
      <header className="relative pt-16 pb-10 text-center px-6">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggle />
        </div>
        <Link
          href="/"
          className="inline-block text-foreground no-underline hover:opacity-80"
        >
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Blessing
          </h1>
        </Link>
        <p className="mt-3 text-muted text-base sm:text-lg">
          Thoughts, diary, and yaps.
        </p>
        <nav className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-muted no-underline hover:text-foreground transition-colors lowercase"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
    );
  }

  return (
    <header className="px-6 pt-6 pb-8 sm:px-10">
      <div className="mx-auto max-w-2xl flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <Link
            href="/"
            className="text-foreground no-underline font-bold text-xl hover:opacity-80"
          >
            Blessing
          </Link>
          <nav className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-muted no-underline hover:text-foreground transition-colors lowercase"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
