import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";

export function PublicNav() {
  return (
    <header className="bg-brand-ink text-white">
      <nav className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          {siteConfig.shortName}
        </Link>
        <div className="hidden items-center gap-6 sm:flex">
          {siteConfig.nav.public.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/sign-in"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Sign in
          </Link>
          <Button href="/sign-up" variant="support" size="sm">
            Get started
          </Button>
        </div>
      </nav>
    </header>
  );
}
