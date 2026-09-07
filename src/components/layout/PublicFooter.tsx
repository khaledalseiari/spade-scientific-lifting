import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function PublicFooter() {
  return (
    <footer className="bg-brand-ink text-white/70">
      <div className="container-page flex flex-col gap-4 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-white">{siteConfig.name}</p>
          <p className="text-sm">{siteConfig.tagline}</p>
        </div>
        <div className="flex gap-6 text-sm">
          <Link href="/methodology" className="hover:text-white">
            Methodology
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <a href={`mailto:${siteConfig.contactEmail}`} className="hover:text-white">
            Contact
          </a>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs">
        © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
      </div>
    </footer>
  );
}
