"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import {
  activityLevelOptions,
  goalOptions,
} from "@/lib/validation/onboarding";
import type { ActivityLevel, GoalType } from "@/types/database";
import { updateSettings } from "./actions";

type FormValues = {
  height_cm: number;
  weight_kg: number;
  activity_level: ActivityLevel;
  goal: GoalType;
  leaderboard_opt_in: boolean;
};

export function SettingsForm({ defaults }: { defaults: FormValues }) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: defaults });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSaved(false);
    const result = await updateSettings(values);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Height (cm)" htmlFor="height_cm">
          <Input id="height_cm" type="number" step="0.1" {...register("height_cm")} />
        </FormField>
        <FormField label="Current bodyweight (kg)" htmlFor="weight_kg">
          <Input id="weight_kg" type="number" step="0.1" {...register("weight_kg")} />
        </FormField>
      </div>

      <FormField label="Activity level" htmlFor="activity_level">
        <Select id="activity_level" {...register("activity_level")}>
          {activityLevelOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Primary goal" htmlFor="goal">
        <Select id="goal" {...register("goal")}>
          {goalOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" className="h-4 w-4" {...register("leaderboard_opt_in")} />
        Show me on the leaderboard (first name/username only, ranked by DOTS score)
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && !error && <p className="text-sm text-green-700">Saved — targets recalculated.</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
