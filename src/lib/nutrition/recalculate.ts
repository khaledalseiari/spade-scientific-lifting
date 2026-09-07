import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, SexType, ActivityLevel, GoalType } from "@/types/database";
import { computeNutritionTargets } from "./engine";

/**
 * Computes a fresh auto target and inserts it as a new nutrition_targets
 * row (rows are immutable/append-only — see 0002_rls.sql — so "updating"
 * a target always means inserting the next one; the latest row per user
 * wins when reading).
 */
export async function insertAutoNutritionTarget(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    sex: SexType;
    dob: string;
    heightCm: number;
    weightKg: number;
    activityLevel: ActivityLevel;
    goal: GoalType;
    note?: string;
    calorieMultiplierOverride?: number;
  },
) {
  const calc = computeNutritionTargets({
    sex: params.sex,
    dob: params.dob,
    heightCm: params.heightCm,
    weightKg: params.weightKg,
    activityLevel: params.activityLevel,
    goal: params.goal,
    calorieMultiplierOverride: params.calorieMultiplierOverride,
  });

  return supabase.from("nutrition_targets").insert({
    user_id: params.userId,
    bmr: calc.bmr,
    tdee: calc.tdee,
    calorie_target: calc.calorieTarget,
    protein_g: calc.proteinG,
    carb_g: calc.carbG,
    fat_g: calc.fatG,
    source: "auto",
    note: params.note ?? null,
  });
}
