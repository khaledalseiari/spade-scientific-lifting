"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CORE_LIFTS, calculateEpley1RM } from "@/lib/lifting/engine";
import { addLift } from "./actions";

type FormValues = {
  lift_name: string;
  custom_lift_name: string;
  date: string;
  weight: string;
  reps: string;
  sets: string;
  rpe: string;
};

export function LiftLogForm({ existingLiftNames }: { existingLiftNames: string[] }) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      lift_name: "Squat",
      custom_lift_name: "",
      date: new Date().toISOString().slice(0, 10),
      weight: "",
      reps: "",
      sets: "1",
      rpe: "",
    },
  });

  const liftName = watch("lift_name");
  const weight = watch("weight");
  const reps = watch("reps");
  const preview =
    weight && reps ? calculateEpley1RM(Number(weight), Number(reps)) : null;

  const otherLiftNames = existingLiftNames.filter(
    (name) => !CORE_LIFTS.includes(name as (typeof CORE_LIFTS)[number]),
  );

  async function onSubmit(values: FormValues) {
    setError(null);
    const finalLiftName =
      values.lift_name === "__custom__" ? values.custom_lift_name.trim() : values.lift_name;
    if (!finalLiftName) {
      setError("Enter a name for the custom lift.");
      return;
    }

    const result = await addLift({
      lift_name: finalLiftName,
      date: values.date,
      weight: Number(values.weight),
      reps: Number(values.reps),
      sets: Number(values.sets || 1),
      rpe: values.rpe === "" ? undefined : Number(values.rpe),
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    reset({ ...values, weight: "", reps: "", rpe: "" });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Lift" htmlFor="lift_name">
          <Select id="lift_name" {...register("lift_name")}>
            {CORE_LIFTS.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            {otherLiftNames.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
            <option value="__custom__">+ Add custom lift…</option>
          </Select>
        </FormField>
        <FormField label="Date" htmlFor="date">
          <Input id="date" type="date" {...register("date")} />
        </FormField>
      </div>

      {liftName === "__custom__" && (
        <FormField label="Custom lift name" htmlFor="custom_lift_name">
          <Input id="custom_lift_name" {...register("custom_lift_name")} />
        </FormField>
      )}

      <div className="grid grid-cols-4 gap-3">
        <FormField label="Weight (kg)" htmlFor="weight">
          <Input id="weight" type="number" step="0.5" {...register("weight", { required: true })} />
        </FormField>
        <FormField label="Reps" htmlFor="reps">
          <Input id="reps" type="number" {...register("reps", { required: true })} />
        </FormField>
        <FormField label="Sets" htmlFor="sets">
          <Input id="sets" type="number" {...register("sets")} />
        </FormField>
        <FormField label="RPE (optional)" htmlFor="rpe">
          <Input id="rpe" type="number" step="0.5" min={0} max={10} {...register("rpe")} />
        </FormField>
      </div>

      {preview !== null && (
        <p className="text-xs text-gray-500">Estimated 1RM: {preview.toFixed(1)} kg</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" variant="accent" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Logging…" : "Log lift"}
      </Button>
    </form>
  );
}
