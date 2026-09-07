import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Services & Pricing" };

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1 bg-gray-50">
        <div className="container-page py-16">
          <h1 className="mb-2 text-3xl font-bold text-brand-ink">Coaching</h1>
          <p className="mb-10 max-w-xl text-gray-600">
            One plan: full access to programming, nutrition targets, and check-ins with your
            coach.
          </p>

          <Card className="max-w-md">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-primary">
              Monthly coaching
            </p>
            <p className="mt-2 text-4xl font-bold text-brand-ink">
              $10<span className="text-lg font-medium text-gray-500">/month</span>
            </p>
            <ul className="mt-6 space-y-2 text-sm text-gray-700">
              <li>· Personalized lifting &amp; nutrition tracking</li>
              <li>· Auto-calculated calorie and macro targets</li>
              <li>· Direct check-ins and consultations with your coach</li>
              <li>· Supplement guidance</li>
            </ul>

            <div className="mt-6 space-y-4 border-t border-gray-100 pt-6">
              <div>
                <p className="text-sm font-semibold text-gray-900">Pay with Bitcoin</p>
                <p className="text-sm text-gray-600">
                  Sign up below and your account is created automatically.{" "}
                  <span className="text-gray-400">
                    (Payment address coming soon — check back or contact us.)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Pay with cash</p>
                <p className="text-sm text-gray-600">
                  Contact your coach directly at{" "}
                  <a
                    href={`mailto:${siteConfig.contactEmail}`}
                    className="text-brand-primary hover:underline"
                  >
                    {siteConfig.contactEmail}
                  </a>{" "}
                  and they&apos;ll set up your account for you.
                </p>
              </div>
            </div>

            <Button href="/sign-up" className="mt-6 w-full">
              Sign up
            </Button>
          </Card>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
