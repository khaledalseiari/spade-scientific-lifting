import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getLatestNutritionTarget } from "@/lib/nutrition/queries";
import { SettingsForm } from "./SettingsForm";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: clientProfile }, { data: latestWeight }, target] = await Promise.all([
    supabase
      .from("client_profiles")
      .select("height_cm, activity_level, goal, leaderboard_opt_in")
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("body_stats")
      .select("weight_kg")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getLatestNutritionTarget(supabase, user.id),
  ]);

  if (!clientProfile) return null;

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Settings</h1>

      {target && (
        <Card className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Current target: <strong>{Math.round(target.calorie_target)} kcal</strong> · P
            {Math.round(target.protein_g)}g C{Math.round(target.carb_g)}g F
            {Math.round(target.fat_g)}g
          </div>
          {target.source === "coach_override" && <Badge variant="support">Coach-adjusted</Badge>}
        </Card>
      )}

      <Card>
        <SettingsForm
          defaults={{
            height_cm: clientProfile.height_cm,
            weight_kg: latestWeight?.weight_kg ?? 70,
            activity_level: clientProfile.activity_level,
            goal: clientProfile.goal,
            leaderboard_opt_in: clientProfile.leaderboard_opt_in,
          }}
        />
      </Card>
    </div>
  );
}
