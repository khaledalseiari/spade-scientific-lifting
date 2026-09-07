import Link from "next/link";
import { siteConfig } from "@/lib/site-config";
import { SignOutButton } from "@/components/layout/SignOutButton";

const links = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Lifting", href: "/lifting" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Supplements", href: "/supplements" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Consultations", href: "/consultations" },
  { label: "Settings", href: "/settings" },
];

export function ClientNav({ name }: { name: string }) {
  return (
    <header className="bg-brand-ink text-white">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/dashboard" className="shrink-0 text-lg font-bold tracking-tight">
          {siteConfig.shortName}
        </Link>
        <div className="hidden flex-1 items-center gap-5 overflow-x-auto text-sm font-medium md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-white/80 hover:text-white">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="hidden text-white/70 sm:inline">{name}</span>
          <SignOutButton />
        </div>
      </nav>
      <div className="flex gap-4 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs font-medium md:hidden">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="whitespace-nowrap text-white/80">
            {link.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
