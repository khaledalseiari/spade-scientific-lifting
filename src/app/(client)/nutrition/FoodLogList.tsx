"use client";

import { useTransition } from "react";
import type { FoodLog } from "@/types/database";
import { deleteFoodLog } from "./actions";

export function FoodLogList({ logs }: { logs: FoodLog[] }) {
  const [isPending, startTransition] = useTransition();

  if (logs.length === 0) {
    return <p className="text-sm text-gray-500">No food logged yet today.</p>;
  }

  return (
    <ul className="divide-y divide-gray-100">
      {logs.map((log) => (
        <li key={log.id} className="flex items-center justify-between py-2 text-sm">
          <div>
            <span className="font-medium text-gray-900">{log.food_item}</span>
            <span className="ml-2 text-gray-500">
              {log.calories} kcal · P{log.protein_g}g C{log.carb_g}g F{log.fat_g}g
            </span>
          </div>
          <button
            className="text-xs text-gray-400 hover:text-red-600 disabled:opacity-50"
            disabled={isPending}
            onClick={() =>
              startTransition(() => {
                deleteFoodLog(log.id);
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
