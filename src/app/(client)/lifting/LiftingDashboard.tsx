"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Input";
import { LiftProgressChart } from "@/components/charts/LiftProgressChart";
import { StrengthTimelineChart } from "@/components/charts/StrengthTimelineChart";
import { LiftLogForm } from "./LiftLogForm";
import type { Lift, SexType } from "@/types/database";
import { computePRs, distinctLiftNames } from "@/lib/lifting/queries";
import { buildStrengthTimeline, calculateDotsScore, TOTAL_LIFTS } from "@/lib/lifting/engine";

export function LiftingDashboard({
  lifts,
  sex,
  bodyStats,
  latestWeightKg,
}: {
  lifts: Lift[];
  sex: SexType;
  bodyStats: { date: string; weightKg: number }[];
  latestWeightKg: number | null;
}) {
  const liftNames = useMemo(() => distinctLiftNames(lifts), [lifts]);
  const [selectedLift, setSelectedLift] = useState(liftNames[0] ?? "Squat");
  const prs = useMemo(() => computePRs(lifts), [lifts]);

  const chartData = useMemo(
    () =>
      lifts
        .filter((l) => l.lift_name === selectedLift && l.est_1rm !== null)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((l) => ({ date: l.date, est_1rm: l.est_1rm as number })),
    [lifts, selectedLift],
  );

  const timeline = useMemo(
    () => buildStrengthTimeline(lifts, bodyStats, sex),
    [lifts, bodyStats, sex],
  );

  const currentTotal = TOTAL_LIFTS.reduce((sum, name) => {
    const pr = prs.find((p) => p.liftName === name);
    return sum + (pr?.weight ?? 0);
  }, 0);
  const currentDots =
    latestWeightKg && currentTotal > 0
      ? calculateDotsScore(latestWeightKg, currentTotal, sex)
      : null;

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Log a lift</h2>
        <LiftLogForm existingLiftNames={liftNames} />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Personal records</h2>
        {prs.length === 0 ? (
          <p className="text-sm text-gray-500">Log a lift to start tracking PRs.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {prs.map((pr) => (
              <div key={pr.liftName} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">{pr.liftName}</p>
                <p className="text-lg font-bold text-brand-ink">{pr.est1rm} kg</p>
                <p className="text-xs text-gray-500">
                  {pr.weight}kg × {pr.reps} on {pr.date}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-ink">Progress</h2>
          <Select
            className="w-auto"
            value={selectedLift}
            onChange={(e) => setSelectedLift(e.target.value)}
          >
            {liftNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </Select>
        </div>
        <LiftProgressChart data={chartData} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-ink">Bodyweight-adjusted strength</h2>
          {currentDots !== null && <Badge variant="highlight">DOTS {currentDots}</Badge>}
        </div>
        {currentTotal > 0 && (
          <p className="mb-3 text-sm text-gray-600">
            Current total (Squat + Bench + Deadlift): <strong>{currentTotal} kg</strong>
          </p>
        )}
        <StrengthTimelineChart data={timeline} />
      </Card>
    </div>
  );
}
