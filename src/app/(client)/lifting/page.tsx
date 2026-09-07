import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { LiftingDashboard } from "./LiftingDashboard";

export const metadata: Metadata = { title: "Lifting Stats" };

export default async function LiftingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: lifts }, { data: clientProfile }, { data: bodyStatsRows }] = await Promise.all([
    supabase
      .from("lifts")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
    supabase.from("client_profiles").select("sex").eq("user_id", user.id).single(),
    supabase
      .from("body_stats")
      .select("date, weight_kg")
      .eq("user_id", user.id)
      .order("date", { ascending: true }),
  ]);

  if (!clientProfile) return null;

  const bodyStats = (bodyStatsRows ?? []).map((b) => ({ date: b.date, weightKg: b.weight_kg }));
  const latestWeightKg = bodyStats.length > 0 ? bodyStats[bodyStats.length - 1].weightKg : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Lifting Stats</h1>
      <LiftingDashboard
        lifts={lifts ?? []}
        sex={clientProfile.sex}
        bodyStats={bodyStats}
        latestWeightKg={latestWeightKg}
      />
    </div>
  );
}
