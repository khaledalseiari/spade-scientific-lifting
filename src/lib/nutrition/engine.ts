/**
 * Standalone nutrition calculation engine — no Supabase/React imports here.
 * Pure functions only, so this is trivially unit-testable (see engine.test.ts).
 */

import type { ActivityLevel, GoalType, SexType } from "@/types/database";

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

// Center of the spec's allowed ranges (fat loss: 15-20% deficit; muscle
// gain: 10-15% surplus) — defaults, not hard limits. A coach override can
// set any value.
export const GOAL_CALORIE_MULTIPLIERS: Record<GoalType, number> = {
  fat_loss: 0.85,
  maintenance: 1.0,
  muscle_gain: 1.1,
};

// Expected bodyweight trend as %/week, used by the divergence-flagging logic.
export const EXPECTED_WEEKLY_CHANGE_PCT: Record<GoalType, number> = {
  fat_loss: -0.5,
  maintenance: 0,
  muscle_gain: 0.25,
};

const KCAL_PER_KG_BODY_MASS = 7700; // standard approximation used in sports nutrition

export function calculateAge(dob: string, asOf: Date = new Date()): number {
  const birth = new Date(dob);
  let age = asOf.getFullYear() - birth.getFullYear();
  const monthDiff = asOf.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && asOf.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(params: {
  sex: SexType;
  weightKg: number;
  heightCm: number;
  age: number;
}): number {
  const { sex, weightKg, heightCm, age } = params;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return bmr * ACTIVITY_MULTIPLIERS[activityLevel];
}

export function calculateCalorieTarget(
  tdee: number,
  goal: GoalType,
  multiplierOverride?: number,
): number {
  const multiplier = multiplierOverride ?? GOAL_CALORIE_MULTIPLIERS[goal];
  return tdee * multiplier;
}

export function calculateMacros(params: {
  calorieTarget: number;
  weightKg: number;
  goal: GoalType;
}): { proteinG: number; carbG: number; fatG: number } {
  const { calorieTarget, weightKg, goal } = params;

  // 1.6-2.2 g/kg, higher end on a cut to preserve lean mass.
  const proteinPerKg = goal === "fat_loss" ? 2.2 : 1.8;
  const proteinG = weightKg * proteinPerKg;

  // 25-30% of calories, floored at ~0.7 g/kg so fat never gets crowded out.
  const fatFromPct = (calorieTarget * 0.275) / 9;
  const fatFloor = weightKg * 0.7;
  const fatG = Math.max(fatFromPct, fatFloor);

  const remainingCalories = calorieTarget - proteinG * 4 - fatG * 9;
  const carbG = Math.max(0, remainingCalories / 4);

  return {
    proteinG: round1(proteinG),
    carbG: round1(carbG),
    fatG: round1(fatG),
  };
}

export function computeNutritionTargets(params: {
  sex: SexType;
  dob: string;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: GoalType;
  calorieMultiplierOverride?: number;
  asOf?: Date;
}) {
  const age = calculateAge(params.dob, params.asOf);
  const bmr = calculateBMR({
    sex: params.sex,
    weightKg: params.weightKg,
    heightCm: params.heightCm,
    age,
  });
  const tdee = calculateTDEE(bmr, params.activityLevel);
  const calorieTarget = calculateCalorieTarget(
    tdee,
    params.goal,
    params.calorieMultiplierOverride,
  );
  const macros = calculateMacros({ calorieTarget, weightKg: params.weightKg, goal: params.goal });

  return {
    bmr: round1(bmr),
    tdee: round1(tdee),
    calorieTarget: round1(calorieTarget),
    proteinG: macros.proteinG,
    carbG: macros.carbG,
    fatG: macros.fatG,
  };
}

/** Simple arithmetic mean of the most recent `windowDays` entries. */
export function rollingAverage(
  entries: { date: string; weightKg: number }[],
  windowDays = 7,
): number | null {
  if (entries.length === 0) return null;
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const window = sorted.slice(-windowDays);
  return round1(window.reduce((sum, e) => sum + e.weightKg, 0) / window.length);
}

export type TrendDivergence = {
  flagged: boolean;
  expectedWeeklyChangePct: number;
  actualWeeklyChangePct: number;
  suggestedCalorieTarget: number;
};

/**
 * Compares the last two rolling 7-day averages against what the current
 * goal predicts. Deliberately tolerant (±0.3 percentage points/week) so a
 * single noisy scale reading doesn't trigger a recalculation — only a
 * sustained divergence does.
 */
export function evaluateTrendDivergence(params: {
  currentWeekAvgKg: number;
  previousWeekAvgKg: number;
  goal: GoalType;
  currentCalorieTarget: number;
  toleranceBand?: number;
}): TrendDivergence {
  const { currentWeekAvgKg, previousWeekAvgKg, goal, currentCalorieTarget } = params;
  const toleranceBand = params.toleranceBand ?? 0.3;

  const actualWeeklyChangePct =
    ((currentWeekAvgKg - previousWeekAvgKg) / previousWeekAvgKg) * 100;
  const expectedWeeklyChangePct = EXPECTED_WEEKLY_CHANGE_PCT[goal];

  const diff = actualWeeklyChangePct - expectedWeeklyChangePct;
  const flagged = Math.abs(diff) > toleranceBand;

  const expectedWeeklyChangeKg = (expectedWeeklyChangePct / 100) * previousWeekAvgKg;
  const actualWeeklyChangeKg = currentWeekAvgKg - previousWeekAvgKg;
  const dailyAdjustment =
    ((expectedWeeklyChangeKg - actualWeeklyChangeKg) * KCAL_PER_KG_BODY_MASS) / 7;

  const suggestedCalorieTarget = flagged
    ? round1(currentCalorieTarget + roundToNearest(dailyAdjustment, 25))
    : currentCalorieTarget;

  return {
    flagged,
    expectedWeeklyChangePct,
    actualWeeklyChangePct: round1(actualWeeklyChangePct),
    suggestedCalorieTarget,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function roundToNearest(n: number, step: number): number {
  return Math.round(n / step) * step;
}
