"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { insertAutoNutritionTarget } from "@/lib/nutrition/recalculate";
import { getLatestNutritionTarget, getRollingWeightAverages } from "@/lib/nutrition/queries";
import { calculateAge, calculateBMR, calculateTDEE, evaluateTrendDivergence } from "@/lib/nutrition/engine";

/**
 * Daily weigh-in — intentionally does NOT recalculate nutrition targets.
 * Targets only recompute on an explicit Settings change or when the client
 * applies a flagged trend suggestion (see applySuggestedTarget below) — a
 * single day's scale reading should never silently move the target.
 */
export async function logWeighIn(weightKg: number, bodyFatPct?: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("body_stats")
    .upsert(
      {
        user_id: user.id,
        date: new Date().toISOString().slice(0, 10),
        weight_kg: weightKg,
        body_fat_pct: bodyFatPct ?? null,
      },
      { onConflict: "user_id,date" },
    );

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  return { error: null };
}

export async function applySuggestedTarget() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("sex, dob, height_cm, activity_level, goal")
    .eq("user_id", user.id)
    .single();
  if (!clientProfile) return { error: "Complete onboarding first." };

  const [currentTarget, trend] = await Promise.all([
    getLatestNutritionTarget(supabase, user.id),
    getRollingWeightAverages(supabase, user.id),
  ]);
  if (!currentTarget || !trend) return { error: "Not enough data yet to adjust the target." };

  const divergence = evaluateTrendDivergence({
    currentWeekAvgKg: trend.currentWeekAvgKg,
    previousWeekAvgKg: trend.previousWeekAvgKg,
    goal: clientProfile.goal,
    currentCalorieTarget: currentTarget.calorie_target,
  });
  if (!divergence.flagged) return { error: "No adjustment currently suggested." };

  // Back-derive a multiplier from the suggested calorie target so the
  // existing goal-based engine (BMR -> TDEE -> multiplier -> macros) still
  // produces consistent macros for the new target, rather than hand-editing
  // calories alone and leaving protein/carb/fat stale.
  const bmr = calculateBMR({
    sex: clientProfile.sex,
    weightKg: trend.currentWeekAvgKg,
    heightCm: clientProfile.height_cm,
    age: calculateAge(clientProfile.dob),
  });
  const tdee = calculateTDEE(bmr, clientProfile.activity_level);
  const multiplierOverride = divergence.suggestedCalorieTarget / tdee;

  const { error } = await insertAutoNutritionTarget(supabase, {
    userId: user.id,
    sex: clientProfile.sex,
    dob: clientProfile.dob,
    heightCm: clientProfile.height_cm,
    weightKg: trend.currentWeekAvgKg,
    activityLevel: clientProfile.activity_level,
    goal: clientProfile.goal,
    calorieMultiplierOverride: multiplierOverride,
    note: `Auto-adjusted from trend: expected ${divergence.expectedWeeklyChangePct}%/week, actual ${divergence.actualWeeklyChangePct}%/week.`,
  });

  if (error) return { error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { error: null };
}
