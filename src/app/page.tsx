import Link from "next/link";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { siteConfig } from "@/lib/site-config";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const features = [
  { title: "Lifting stats", body: "Log sets, track PRs, and see est. 1RM trend automatically." },
  { title: "Nutrition targets", body: "Calorie/macro targets calculated from your data, not a template." },
  { title: "Direct coaching", body: "Request check-ins and get real feedback from your coach." },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <section className="bg-hero-gradient text-white">
          <div className="container-page flex flex-col items-start gap-6 py-24">
            <Badge variant="highlight">Science-based coaching</Badge>
            <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">
              {siteConfig.tagline}
            </h1>
            <p className="max-w-xl text-lg text-white/80">{siteConfig.description}</p>
            <div className="flex flex-wrap gap-3">
              <Button href="/sign-up" variant="support" size="lg">
                Start coaching
              </Button>
              <Button href="/methodology" variant="ghost" size="lg" className="text-white">
                See the methodology
              </Button>
            </div>
          </div>
        </section>

        <section className="container-page py-16">
          <h2 className="mb-8 text-2xl font-bold text-brand-ink">
            Everything tracked in one place
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title}>
                <h3 className="mb-2 text-lg font-semibold text-brand-ink">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section className="bg-gray-50 py-16">
          <div className="container-page">
            <h2 className="mb-8 text-2xl font-bold text-brand-ink">What clients say</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i} className="border-dashed">
                  <p className="text-sm italic text-gray-400">
                    [Placeholder — add a real client testimonial here before launch]
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container-page py-16 text-center">
          <h2 className="mb-3 text-2xl font-bold text-brand-ink">Ready to start?</h2>
          <p className="mb-6 text-gray-600">
            $10/month —{" "}
            <Link href="/pricing" className="text-brand-primary hover:underline">
              see pricing details
            </Link>
            .
          </p>
          <Button href="/sign-up" size="lg">
            Sign up
          </Button>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
