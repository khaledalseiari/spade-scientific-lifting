"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { CoachAvailability } from "@/types/database";
import { addAvailabilitySlot, removeAvailabilitySlot } from "./actions";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function AvailabilityManager({ slots }: { slots: CoachAvailability[] }) {
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const grouped = DAYS.map((label, index) => ({
    label,
    slots: slots.filter((s) => s.day_of_week === index),
  }));

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const result = await addAvailabilitySlot({
      day_of_week: Number(dayOfWeek),
      start_time: startTime,
      end_time: endTime,
    });
    if (result?.error) setError(result.error);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-2">
        <select
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={dayOfWeek}
          onChange={(e) => setDayOfWeek(e.target.value)}
        >
          {DAYS.map((label, index) => (
            <option key={label} value={index}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="time"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
        <span className="text-sm text-gray-500">to</span>
        <input
          type="time"
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        <Button type="submit" size="sm" variant="accent">
          Add slot
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-3 sm:grid-cols-2">
        {grouped.map((day) => (
          <div key={day.label} className="rounded-lg border border-gray-200 p-3">
            <p className="mb-2 text-sm font-semibold text-gray-700">{day.label}</p>
            {day.slots.length === 0 ? (
              <p className="text-xs text-gray-400">No availability</p>
            ) : (
              <ul className="space-y-1">
                {day.slots.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm">
                    <span>
                      {s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)}
                    </span>
                    <button
                      className="text-xs text-gray-400 hover:text-red-600"
                      disabled={isPending}
                      onClick={() =>
                        startTransition(() => {
                          void removeAvailabilitySlot(s.id);
                        })
                      }
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
