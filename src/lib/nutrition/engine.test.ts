import { describe, expect, it } from "vitest";
import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  computeNutritionTargets,
  rollingAverage,
  evaluateTrendDivergence,
} from "./engine";

describe("calculateAge", () => {
  it("computes whole years and handles birthdays not yet reached this year", () => {
    expect(calculateAge("1990-06-15", new Date("2024-06-15"))).toBe(34);
    expect(calculateAge("1990-06-15", new Date("2024-06-14"))).toBe(33);
    expect(calculateAge("1990-06-15", new Date("2024-06-16"))).toBe(34);
  });
});

describe("calculateBMR (Mifflin-St Jeor)", () => {
  it("matches the male formula", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    expect(calculateBMR({ sex: "male", weightKg: 80, heightCm: 180, age: 30 })).toBeCloseTo(1780);
  });

  it("matches the female formula", () => {
    // 10*60 + 6.25*165 - 5*25 - 161 = 600 + 1031.25 - 125 - 161 = 1345.25
    expect(calculateBMR({ sex: "female", weightKg: 60, heightCm: 165, age: 25 })).toBeCloseTo(
      1345.25,
    );
  });
});

describe("calculateTDEE", () => {
  it("applies the activity multiplier", () => {
    expect(calculateTDEE(1780, "sedentary")).toBeCloseTo(1780 * 1.2);
    expect(calculateTDEE(1780, "very_active")).toBeCloseTo(1780 * 1.725);
  });
});

describe("calculateCalorieTarget", () => {
  it("applies a ~15% default deficit for fat loss", () => {
    expect(calculateCalorieTarget(2500, "fat_loss")).toBeCloseTo(2125);
  });
  it("leaves maintenance unchanged", () => {
    expect(calculateCalorieTarget(2500, "maintenance")).toBeCloseTo(2500);
  });
  it("applies a ~10% default surplus for muscle gain", () => {
    expect(calculateCalorieTarget(2500, "muscle_gain")).toBeCloseTo(2750);
  });
  it("honors a coach-provided multiplier override", () => {
    expect(calculateCalorieTarget(2500, "fat_loss", 0.8)).toBeCloseTo(2000);
  });
});

describe("calculateMacros", () => {
  it("uses higher protein per kg on a cut than on a surplus", () => {
    const cut = calculateMacros({ calorieTarget: 2000, weightKg: 80, goal: "fat_loss" });
    const gain = calculateMacros({ calorieTarget: 2900, weightKg: 80, goal: "muscle_gain" });
    expect(cut.proteinG).toBeCloseTo(80 * 2.2);
    expect(gain.proteinG).toBeCloseTo(80 * 1.8);
  });

  it("never lets carbs go negative when protein+fat exceed the calorie target", () => {
    const macros = calculateMacros({ calorieTarget: 800, weightKg: 100, goal: "fat_loss" });
    expect(macros.carbG).toBeGreaterThanOrEqual(0);
  });

  it("floors fat at ~0.7 g/kg even on a very low-calorie target", () => {
    const macros = calculateMacros({ calorieTarget: 900, weightKg: 100, goal: "fat_loss" });
    expect(macros.fatG).toBeGreaterThanOrEqual(70);
  });
});

describe("computeNutritionTargets (end to end)", () => {
  it("produces a coherent full breakdown", () => {
    const result = computeNutritionTargets({
      sex: "male",
      dob: "1994-01-01",
      heightCm: 180,
      weightKg: 80,
      activityLevel: "moderately_active",
      goal: "fat_loss",
      asOf: new Date("2024-01-01"),
    });
    expect(result.bmr).toBeGreaterThan(1500);
    expect(result.tdee).toBeGreaterThan(result.bmr);
    expect(result.calorieTarget).toBeLessThan(result.tdee);
    // protein + carbs + fat calories should roughly reconstruct the target
    // (each macro is independently rounded to 0.1g for display, so allow a
    // couple of kcal of rounding slack rather than requiring an exact match)
    const reconstructed = result.proteinG * 4 + result.carbG * 4 + result.fatG * 9;
    expect(Math.abs(reconstructed - result.calorieTarget)).toBeLessThan(2);
  });
});

describe("rollingAverage", () => {
  it("averages only the trailing window and ignores order", () => {
    const entries = [
      { date: "2024-01-03", weightKg: 82 },
      { date: "2024-01-01", weightKg: 80 },
      { date: "2024-01-02", weightKg: 81 },
    ];
    expect(rollingAverage(entries, 7)).toBeCloseTo(81);
  });

  it("returns null for no data", () => {
    expect(rollingAverage([], 7)).toBeNull();
  });
});

describe("evaluateTrendDivergence", () => {
  it("does not flag a cut that is losing weight roughly as expected", () => {
    // Expected: -0.5%/week. 80kg -0.5% = -0.4kg -> 79.6kg
    const result = evaluateTrendDivergence({
      currentWeekAvgKg: 79.6,
      previousWeekAvgKg: 80,
      goal: "fat_loss",
      currentCalorieTarget: 2200,
    });
    expect(result.flagged).toBe(false);
  });

  it("flags a cut whose weight trend has gone flat", () => {
    const result = evaluateTrendDivergence({
      currentWeekAvgKg: 80,
      previousWeekAvgKg: 80,
      goal: "fat_loss",
      currentCalorieTarget: 2200,
    });
    expect(result.flagged).toBe(true);
    // Flat trend on a cut expecting a loss -> suggested target should drop.
    expect(result.suggestedCalorieTarget).toBeLessThan(2200);
  });

  it("flags unexpected weight loss during a lean bulk", () => {
    const result = evaluateTrendDivergence({
      currentWeekAvgKg: 79,
      previousWeekAvgKg: 80,
      goal: "muscle_gain",
      currentCalorieTarget: 2800,
    });
    expect(result.flagged).toBe(true);
    expect(result.suggestedCalorieTarget).toBeGreaterThan(2800);
  });

  it("stays within tolerance for small noisy fluctuations", () => {
    const result = evaluateTrendDivergence({
      currentWeekAvgKg: 79.9,
      previousWeekAvgKg: 80,
      goal: "maintenance",
      currentCalorieTarget: 2500,
    });
    expect(result.flagged).toBe(false);
  });
});
