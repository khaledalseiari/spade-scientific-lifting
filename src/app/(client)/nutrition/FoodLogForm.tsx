"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { Input, Select } from "@/components/ui/Input";
import { FormField } from "@/components/ui/FormField";
import { Button } from "@/components/ui/Button";
import { addFoodLog } from "./actions";

type FormValues = {
  meal: string;
  food_item: string;
  calories: string;
  protein_g: string;
  carb_g: string;
  fat_g: string;
};

export function FoodLogForm() {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      meal: "breakfast",
      food_item: "",
      calories: "",
      protein_g: "",
      carb_g: "",
      fat_g: "",
    },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await addFoodLog({
      meal: values.meal,
      food_item: values.food_item,
      calories: Number(values.calories),
      protein_g: Number(values.protein_g || 0),
      carb_g: Number(values.carb_g || 0),
      fat_g: Number(values.fat_g || 0),
    });
    if (result?.error) {
      setError(result.error);
      return;
    }
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Meal" htmlFor="meal">
          <Select id="meal" {...register("meal")}>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snack">Snack</option>
          </Select>
        </FormField>
        <FormField label="Food item" htmlFor="food_item">
          <Input id="food_item" placeholder="e.g. Chicken breast" {...register("food_item", { required: true })} />
        </FormField>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <FormField label="Calories" htmlFor="calories">
          <Input id="calories" type="number" min={0} {...register("calories", { required: true })} />
        </FormField>
        <FormField label="Protein (g)" htmlFor="protein_g">
          <Input id="protein_g" type="number" min={0} {...register("protein_g")} />
        </FormField>
        <FormField label="Carbs (g)" htmlFor="carb_g">
          <Input id="carb_g" type="number" min={0} {...register("carb_g")} />
        </FormField>
        <FormField label="Fat (g)" htmlFor="fat_g">
          <Input id="fat_g" type="number" min={0} {...register("fat_g")} />
        </FormField>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="accent" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Logging…" : "Log food"}
      </Button>
      <p className="text-xs text-gray-500">
        Search/autofill from a food database (USDA FoodData Central / Open Food Facts) is a
        planned integration — this is manual entry for now.
      </p>
    </form>
  );
}
