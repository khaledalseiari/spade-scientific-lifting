import { describe, expect, it } from "vitest";
import { calculateEpley1RM, calculateDotsScore, buildStrengthTimeline } from "./engine";

describe("calculateEpley1RM", () => {
  it("returns the weight itself for a 1-rep set", () => {
    expect(calculateEpley1RM(100, 1)).toBeCloseTo(100 * (1 + 1 / 30));
  });
  it("estimates a higher 1RM for more reps at the same weight", () => {
    expect(calculateEpley1RM(100, 5)).toBeGreaterThan(calculateEpley1RM(100, 1));
  });
  it("matches the textbook formula", () => {
    // 100kg x 5 reps -> 100 * (1 + 5/30) = 116.67
    expect(calculateEpley1RM(100, 5)).toBeCloseTo(116.67, 1);
  });
});

describe("calculateDotsScore", () => {
  it("increases as total increases at a fixed bodyweight", () => {
    const low = calculateDotsScore(80, 400, "male");
    const high = calculateDotsScore(80, 500, "male");
    expect(high).toBeGreaterThan(low);
  });

  it("gives a lighter lifter a higher score for the same total", () => {
    const lighter = calculateDotsScore(70, 500, "male");
    const heavier = calculateDotsScore(100, 500, "male");
    expect(lighter).toBeGreaterThan(heavier);
  });

  it("produces a plausible score for a solid male raw total", () => {
    // ~500kg total at 83kg bodyweight is a strong-but-realistic raw total.
    const score = calculateDotsScore(83, 500, "male");
    expect(score).toBeGreaterThan(300);
    expect(score).toBeLessThan(500);
  });

  it("scores male and female differently for identical inputs", () => {
    const male = calculateDotsScore(70, 400, "male");
    const female = calculateDotsScore(70, 400, "female");
    expect(male).not.toBeCloseTo(female, 0);
  });
});

describe("buildStrengthTimeline", () => {
  it("tracks running best-to-date per lift and pairs with the nearest bodyweight", () => {
    const lifts = [
      { lift_name: "Squat", date: "2024-01-01", weight: 100 },
      { lift_name: "Bench Press", date: "2024-01-01", weight: 80 },
      { lift_name: "Deadlift", date: "2024-01-01", weight: 120 },
      { lift_name: "Squat", date: "2024-02-01", weight: 110 },
    ];
    const bodyStats = [
      { date: "2024-01-01", weightKg: 80 },
      { date: "2024-01-20", weightKg: 82 },
    ];

    const timeline = buildStrengthTimeline(lifts, bodyStats, "male");
    expect(timeline).toHaveLength(2);
    expect(timeline[0].totalKg).toBe(300); // 100+80+120
    expect(timeline[1].totalKg).toBe(310); // 110+80+120, squat PR carries forward
    // Second point should use the Jan 20 bodyweight (82kg), the most recent as of Feb 1.
    expect(timeline[1].dots).toBeCloseTo(calculateDotsScore(82, 310, "male"), 1);
  });

  it("ignores lifts outside the total (e.g. Overhead Press) when computing totalKg", () => {
    const lifts = [
      { lift_name: "Overhead Press", date: "2024-01-01", weight: 60 },
      { lift_name: "Squat", date: "2024-01-01", weight: 100 },
    ];
    const bodyStats = [{ date: "2024-01-01", weightKg: 80 }];
    const timeline = buildStrengthTimeline(lifts, bodyStats, "male");
    expect(timeline[0].totalKg).toBe(100);
  });

  it("returns no points when there's no bodyweight data at all", () => {
    const lifts = [{ lift_name: "Squat", date: "2024-01-01", weight: 100 }];
    expect(buildStrengthTimeline(lifts, [], "male")).toHaveLength(0);
  });
});
