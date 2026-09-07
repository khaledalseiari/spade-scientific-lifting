"use client";

import { useState, useTransition } from "react";
import { setLeaderboardEnabled } from "./actions";

export function LeaderboardToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [, startTransition] = useTransition();

  return (
    <label className="flex items-center gap-3 text-sm text-gray-700">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={enabled}
        onChange={(e) => {
          const next = e.target.checked;
          setEnabled(next);
          startTransition(() => {
            void setLeaderboardEnabled(next);
          });
        }}
      />
      Enable the leaderboard site-wide (clients still opt in individually)
    </label>
  );
}
