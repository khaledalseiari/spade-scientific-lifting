"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import type { Supplement } from "@/types/database";
import { deleteSupplement, toggleSupplementLog } from "./actions";

export function SupplementChecklist({
  supplements,
  takenToday,
  today,
}: {
  supplements: Supplement[];
  takenToday: Record<string, boolean>;
  today: string;
}) {
  const [optimisticTaken, setOptimisticTaken] = useState(takenToday);
  const [, startTransition] = useTransition();

  if (supplements.length === 0) {
    return <p className="text-sm text-gray-500">No supplements added yet.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {supplements.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-3 py-3">
          <label className="flex flex-1 cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4"
              checked={optimisticTaken[s.id] ?? false}
              onChange={(e) => {
                const taken = e.target.checked;
                setOptimisticTaken((prev) => ({ ...prev, [s.id]: taken }));
                startTransition(() => {
                  void toggleSupplementLog(s.id, today, taken);
                });
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{s.name}</span>
                {s.added_by === "coach" && <Badge variant="support">Coach-recommended</Badge>}
              </div>
              <p className="text-xs text-gray-500">
                {s.dosage} · {s.frequency}
                {s.time_of_day ? ` · ${s.time_of_day}` : ""}
              </p>
              {s.notes && <p className="mt-0.5 text-xs text-gray-500 italic">{s.notes}</p>}
            </div>
          </label>
          <button
            className="text-xs text-gray-400 hover:text-red-600"
            onClick={() =>
              startTransition(() => {
                void deleteSupplement(s.id);
              })
            }
          >
            Remove
          </button>
        </li>
      ))}
    </ul>
  );
}
