"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { overrideNutritionTarget } from "./actions";

type FormValues = {
  calorie_target: string;
  protein_g: string;
  carb_g: string;
  fat_g: string;
  note: string;
};

export function OverrideTargetForm({
  clientId,
  defaults,
}: {
  clientId: string;
  defaults: { calorie_target: number; protein_g: number; carb_g: number; fat_g: number };
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      calorie_target: String(defaults.calorie_target),
      protein_g: String(defaults.protein_g),
      carb_g: String(defaults.carb_g),
      fat_g: String(defaults.fat_g),
      note: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSaved(false);
    const result = await overrideNutritionTarget(clientId, {
      calorie_target: Number(values.calorie_target),
      protein_g: Number(values.protein_g),
      carb_g: Number(values.carb_g),
      fat_g: Number(values.fat_g),
      note: values.note,
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <FormField label="Calories" htmlFor="calorie_target">
          <Input id="calorie_target" type="number" {...register("calorie_target")} />
        </FormField>
        <FormField label="Protein (g)" htmlFor="protein_g">
          <Input id="protein_g" type="number" {...register("protein_g")} />
        </FormField>
        <FormField label="Carbs (g)" htmlFor="carb_g">
          <Input id="carb_g" type="number" {...register("carb_g")} />
        </FormField>
        <FormField label="Fat (g)" htmlFor="fat_g">
          <Input id="fat_g" type="number" {...register("fat_g")} />
        </FormField>
      </div>
      <FormField label="Rationale (optional)" htmlFor="note">
        <Input id="note" placeholder="Why you're adjusting this" {...register("note")} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {saved && <p className="text-sm text-green-700">Target overridden.</p>}
      <Button type="submit" size="sm" variant="accent" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Override target"}
      </Button>
    </form>
  );
}
