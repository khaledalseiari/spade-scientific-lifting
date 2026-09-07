import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Email verified" };

export default function EmailConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-hero-gradient px-4">
      <div className="animate-scale-in w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-highlight">
          <svg
            className="h-9 w-9 text-brand-ink"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mb-2 text-xl font-bold text-brand-ink">Email verified</h1>
        <p className="text-sm text-gray-600">
          Your {siteConfig.shortName} account is confirmed. You can now close this tab and
          continue where you left off.
        </p>
      </div>
    </div>
  );
}
