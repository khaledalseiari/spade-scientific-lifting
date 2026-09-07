import type { Metadata } from "next";
import { PublicNav } from "@/components/layout/PublicNav";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Methodology" };

const principles = [
  {
    title: "Progressive overload, tracked",
    body: "Every set is logged with weight, reps, and RPE. Estimated 1-rep max is calculated automatically (Epley formula) so trend lines — not memory — tell you whether a lift is actually moving.",
  },
  {
    title: "Nutrition targets calculated, not guessed",
    body: "Calorie and macro targets come from your logged bodyweight, height, age, and activity level (Mifflin-St Jeor + activity multiplier), not a generic template. Targets update when your data changes — not on a whim.",
  },
  {
    title: "Bodyweight-adjusted strength",
    body: "Raw totals aren't comparable across bodyweights or across a cut/bulk. We track a DOTS score alongside your total so progress stays legible even as bodyweight moves.",
  },
  {
    title: "Trends over noise",
    body: "A single scale reading is noise. We use rolling 7-day averages to decide whether a target actually needs to change — and flag it for a conversation with your coach rather than silently moving the goalposts.",
  },
];

export default function MethodologyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <PublicNav />
      <main className="flex-1">
        <section className="bg-hero-gradient py-16 text-white">
          <div className="container-page">
            <h1 className="text-3xl font-bold sm:text-4xl">Methodology</h1>
            <p className="mt-3 max-w-2xl text-white/80">
              {siteConfig.name} is built around one idea: decisions about your training and
              nutrition should come from your data, not from habit or hunch.
            </p>
          </div>
        </section>

        <section className="container-page py-14">
          <div className="grid gap-6 sm:grid-cols-2">
            {principles.map((p) => (
              <Card key={p.title}>
                <h2 className="mb-2 text-lg font-semibold text-brand-ink">{p.title}</h2>
                <p className="text-sm text-gray-600">{p.body}</p>
              </Card>
            ))}
          </div>

          <Card className="mt-6 bg-gray-50">
            <h2 className="mb-2 text-lg font-semibold text-brand-ink">About your coach</h2>
            <p className="text-sm text-gray-600">{siteConfig.coach.bioPlaceholder}</p>
          </Card>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
