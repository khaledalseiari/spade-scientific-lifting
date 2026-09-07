"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import type { LeaderboardRow } from "@/types/database";
import { calculateDotsScore } from "@/lib/lifting/engine";

type Row = LeaderboardRow & { dots: number | null };

export function LeaderboardTable({ rows }: { rows: LeaderboardRow[] }) {
  const [mode, setMode] = useState<"dots" | "streak">("dots");

  const enriched: Row[] = useMemo(
    () =>
      rows.map((r) => ({
        ...r,
        dots:
          r.bodyweight_kg && r.total_kg
            ? calculateDotsScore(r.bodyweight_kg, r.total_kg, r.sex)
            : null,
      })),
    [rows],
  );

  const sorted = useMemo(() => {
    if (mode === "streak") {
      return [...enriched].sort((a, b) => b.streak_days - a.streak_days);
    }
    return [...enriched].sort((a, b) => (b.dots ?? 0) - (a.dots ?? 0));
  }, [enriched, mode]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          className={`rounded-full px-3 py-1 text-sm font-medium ${mode === "dots" ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setMode("dots")}
        >
          By DOTS score
        </button>
        <button
          className={`rounded-full px-3 py-1 text-sm font-medium ${mode === "streak" ? "bg-brand-primary text-white" : "bg-gray-100 text-gray-600"}`}
          onClick={() => setMode("streak")}
        >
          By consistency streak
        </button>
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">No one has opted in yet.</p>
      ) : (
        <ol className="divide-y divide-gray-100">
          {sorted.map((r, i) => (
            <li key={`${r.display_name}-${i}`} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <span className="w-6 text-right font-bold text-gray-400">{i + 1}</span>
                <span className="font-medium text-gray-900">{r.display_name}</span>
              </div>
              <Badge variant={i === 0 ? "highlight" : "support"}>
                {mode === "dots"
                  ? r.dots !== null
                    ? `${r.dots} DOTS`
                    : "No lifts yet"
                  : `${r.streak_days} day streak`}
              </Badge>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
