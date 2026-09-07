import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, FoodLog, NutritionTarget } from "@/types/database";
import { rollingAverage } from "./engine";

export async function getLatestNutritionTarget(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<NutritionTarget | null> {
  const { data } = await supabase
    .from("nutrition_targets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

export async function getFoodLogsForDate(
  supabase: SupabaseClient<Database>,
  userId: string,
  date: string,
): Promise<FoodLog[]> {
  const { data } = await supabase
    .from("food_logs")
    .select("*")
    .eq("user_id", userId)
    .eq("date", date)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export function sumFoodLogs(logs: FoodLog[]) {
  return logs.reduce(
    (totals, log) => ({
      calories: totals.calories + log.calories,
      proteinG: totals.proteinG + log.protein_g,
      carbG: totals.carbG + log.carb_g,
      fatG: totals.fatG + log.fat_g,
    }),
    { calories: 0, proteinG: 0, carbG: 0, fatG: 0 },
  );
}

/** Daily logged-calorie totals for the last N days, oldest first. */
export async function getRecentDailyTotals(
  supabase: SupabaseClient<Database>,
  userId: string,
  days = 7,
): Promise<{ date: string; calories: number }[]> {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("food_logs")
    .select("date, calories")
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .order("date", { ascending: true });

  const byDate = new Map<string, number>();
  for (const row of data ?? []) {
    byDate.set(row.date, (byDate.get(row.date) ?? 0) + row.calories);
  }

  const result: { date: string; calories: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, calories: byDate.get(key) ?? 0 });
  }
  return result;
}

/**
 * Rolling 7-day bodyweight averages for this week vs. last week, used by the
 * trend-divergence check. Returns null if there isn't enough history yet
 * (fewer than ~2 weigh-ins) to compare.
 */
export async function getRollingWeightAverages(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<{ currentWeekAvgKg: number; previousWeekAvgKg: number } | null> {
  const since = new Date();
  since.setDate(since.getDate() - 13);
  const sinceStr = since.toISOString().slice(0, 10);

  const { data } = await supabase
    .from("body_stats")
    .select("date, weight_kg")
    .eq("user_id", userId)
    .gte("date", sinceStr)
    .order("date", { ascending: true });

  const rows = data ?? [];
  if (rows.length < 4) return null;

  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - 7);
  const midpointStr = midpoint.toISOString().slice(0, 10);

  const previousWeek = rows.filter((r) => r.date < midpointStr);
  const currentWeek = rows.filter((r) => r.date >= midpointStr);
  if (previousWeek.length === 0 || currentWeek.length === 0) return null;

  const currentWeekAvgKg = rollingAverage(
    currentWeek.map((r) => ({ date: r.date, weightKg: r.weight_kg })),
    7,
  );
  const previousWeekAvgKg = rollingAverage(
    previousWeek.map((r) => ({ date: r.date, weightKg: r.weight_kg })),
    7,
  );
  if (currentWeekAvgKg === null || previousWeekAvgKg === null) return null;

  return { currentWeekAvgKg, previousWeekAvgKg };
}
