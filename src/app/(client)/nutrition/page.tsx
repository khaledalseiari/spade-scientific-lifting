import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { WeeklyAdherenceChart } from "@/components/charts/WeeklyAdherenceChart";
import {
  getFoodLogsForDate,
  getLatestNutritionTarget,
  getRecentDailyTotals,
  sumFoodLogs,
} from "@/lib/nutrition/queries";
import { FoodLogForm } from "./FoodLogForm";
import { FoodLogList } from "./FoodLogList";

export const metadata: Metadata = { title: "Nutrition" };

export default async function NutritionPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [target, todayLogs, weeklyTotals] = await Promise.all([
    getLatestNutritionTarget(supabase, user.id),
    getFoodLogsForDate(supabase, user.id, today),
    getRecentDailyTotals(supabase, user.id, 7),
  ]);

  const totals = sumFoodLogs(todayLogs);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand-ink">Nutrition</h1>
        {target?.source === "coach_override" && (
          <Badge variant="support">Coach-adjusted target</Badge>
        )}
      </div>

      {!target ? (
        <Card>
          <p className="text-sm text-gray-600">
            No target calculated yet — complete onboarding in Settings to generate one.
          </p>
        </Card>
      ) : (
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-ink">Today vs. target</h2>
          <ProgressBar
            label={`Calories — ${Math.round(totals.calories)} / ${Math.round(target.calorie_target)} kcal`}
            value={totals.calories}
            max={target.calorie_target}
          />
          <ProgressBar
            label={`Protein — ${Math.round(totals.proteinG)} / ${Math.round(target.protein_g)} g`}
            value={totals.proteinG}
            max={target.protein_g}
          />
          <ProgressBar
            label={`Carbs — ${Math.round(totals.carbG)} / ${Math.round(target.carb_g)} g`}
            value={totals.carbG}
            max={target.carb_g}
          />
          <ProgressBar
            label={`Fat — ${Math.round(totals.fatG)} / ${Math.round(target.fat_g)} g`}
            value={totals.fatG}
            max={target.fat_g}
          />
        </Card>
      )}

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Log food</h2>
        <FoodLogForm />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Today&apos;s log</h2>
        <FoodLogList logs={todayLogs} />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Weekly adherence</h2>
        <WeeklyAdherenceChart data={weeklyTotals} target={target?.calorie_target ?? 0} />
      </Card>
    </div>
  );
}
