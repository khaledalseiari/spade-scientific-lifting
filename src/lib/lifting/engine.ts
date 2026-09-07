/**
 * Standalone lifting calculations — Epley 1RM estimate and the DOTS
 * bodyweight-adjusted strength score. Pure functions, unit-tested in
 * engine.test.ts, no DB/React imports.
 */

import type { SexType } from "@/types/database";

export const CORE_LIFTS = ["Squat", "Bench Press", "Deadlift", "Overhead Press"] as const;
export const TOTAL_LIFTS = ["Squat", "Bench Press", "Deadlift"] as const;

/** Epley formula: 1RM = weight * (1 + reps / 30). Mirrors the DB trigger in 0001_schema.sql. */
export function calculateEpley1RM(weight: number, reps: number): number {
  return Math.round(weight * (1 + reps / 30) * 100) / 100;
}

// Published DOTS coefficients (Sprague et al.), sex-specific quintic in bodyweight.
const DOTS_COEFFICIENTS: Record<SexType, [number, number, number, number, number]> = {
  male: [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093],
  female: [-57.96288, 13.6175032, -0.1126655, 0.0005158568, -0.0000010706],
};

/**
 * DOTS score — a modern, sex-specific replacement for the Wilks formula that
 * normalizes a total by bodyweight so strength is comparable across
 * different bodyweights (and over time as bodyweight changes).
 */
export function calculateDotsScore(bodyweightKg: number, totalKg: number, sex: SexType): number {
  const [a, b, c, d, e] = DOTS_COEFFICIENTS[sex];
  const bw = bodyweightKg;
  const denominator = a + b * bw + c * bw ** 2 + d * bw ** 3 + e * bw ** 4;
  return Math.round(((totalKg * 500) / denominator) * 10) / 10;
}

export type LiftEntry = { lift_name: string; date: string; weight: number };

/** Best (max) weight ever logged for a given lift name, as of a cutoff date. */
export function bestWeightAsOf(
  entries: LiftEntry[],
  liftName: string,
  cutoffDate: string,
): number {
  return entries
    .filter((e) => e.lift_name === liftName && e.date <= cutoffDate)
    .reduce((max, e) => Math.max(max, e.weight), 0);
}

/**
 * Builds a strength-over-time timeline: one point for every date any of the
 * three total lifts (Squat/Bench/Deadlift) was logged, using the running
 * best-to-date for each lift and the closest bodyweight reading known at
 * that point (so the total/DOTS trend stays comparable even as bodyweight
 * fluctuates between weigh-ins).
 */
export function buildStrengthTimeline(
  lifts: LiftEntry[],
  bodyStats: { date: string; weightKg: number }[],
  sex: SexType,
): { date: string; totalKg: number; dots: number }[] {
  const totalLiftEntries = lifts.filter((l) =>
    (TOTAL_LIFTS as readonly string[]).includes(l.lift_name),
  );
  const eventDates = Array.from(new Set(totalLiftEntries.map((l) => l.date))).sort();
  const sortedBodyStats = [...bodyStats].sort((a, b) => a.date.localeCompare(b.date));

  function bodyweightAsOf(date: string): number | null {
    const priorOrSame = sortedBodyStats.filter((b) => b.date <= date);
    if (priorOrSame.length > 0) return priorOrSame[priorOrSame.length - 1].weightKg;
    return sortedBodyStats.length > 0 ? sortedBodyStats[0].weightKg : null;
  }

  return eventDates.flatMap((date) => {
    const bodyweight = bodyweightAsOf(date);
    if (bodyweight === null) return [];

    const totalKg = TOTAL_LIFTS.reduce(
      (sum, liftName) => sum + bestWeightAsOf(totalLiftEntries, liftName, date),
      0,
    );
    return [{ date, totalKg, dots: calculateDotsScore(bodyweight, totalKg, sex) }];
  });
}
