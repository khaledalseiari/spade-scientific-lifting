"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { applySuggestedTarget } from "./actions";

export function TrendBanner({
  expectedPct,
  actualPct,
  suggestedCalorieTarget,
  currentCalorieTarget,
}: {
  expectedPct: number;
  actualPct: number;
  suggestedCalorieTarget: number;
  currentCalorieTarget: number;
}) {
  const [isPending, startTransition] = useTransition();
  const [applied, setApplied] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (applied || dismissed) return null;

  const direction = suggestedCalorieTarget < currentCalorieTarget ? "lower" : "raise";

  return (
    <div className="animate-slide-in-right rounded-xl border border-brand-support bg-brand-support/20 p-4">
      <p className="text-sm text-brand-ink">
        Your weight trend ({actualPct}%/week) has diverged from what your goal predicts (
        {expectedPct}%/week). Consider adjusting your target to {direction} calories to{" "}
        <strong>{Math.round(suggestedCalorieTarget)} kcal</strong>.
      </p>
      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          variant="accent"
          loading={isPending}
          onClick={() =>
            startTransition(async () => {
              await applySuggestedTarget();
              setApplied(true);
            })
          }
        >
          {isPending ? "Applying…" : "Apply suggested target"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
