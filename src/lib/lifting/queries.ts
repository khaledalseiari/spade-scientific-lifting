import type { Lift } from "@/types/database";

export type PersonalRecord = {
  liftName: string;
  est1rm: number;
  weight: number;
  reps: number;
  date: string;
};

/** Best est_1rm per lift name, plus the entry that achieved it. */
export function computePRs(lifts: Lift[]): PersonalRecord[] {
  const bestByLift = new Map<string, PersonalRecord>();
  for (const lift of lifts) {
    if (lift.est_1rm === null) continue;
    const current = bestByLift.get(lift.lift_name);
    if (!current || lift.est_1rm > current.est1rm) {
      bestByLift.set(lift.lift_name, {
        liftName: lift.lift_name,
        est1rm: lift.est_1rm,
        weight: lift.weight,
        reps: lift.reps,
        date: lift.date,
      });
    }
  }
  return Array.from(bestByLift.values()).sort((a, b) => a.liftName.localeCompare(b.liftName));
}

export function distinctLiftNames(lifts: Lift[]): string[] {
  return Array.from(new Set(lifts.map((l) => l.lift_name))).sort();
}
