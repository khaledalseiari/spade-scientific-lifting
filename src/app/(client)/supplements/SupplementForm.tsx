"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addSupplement } from "./actions";

type FormValues = {
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
};

export function SupplementForm() {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: "", dosage: "", frequency: "", time_of_day: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await addSupplement(values);
    if (result?.error) {
      setError(result.error);
      return;
    }
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" htmlFor="name">
          <Input id="name" placeholder="e.g. Creatine monohydrate" {...register("name", { required: true })} />
        </FormField>
        <FormField label="Dosage" htmlFor="dosage">
          <Input id="dosage" placeholder="e.g. 5g" {...register("dosage", { required: true })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Frequency" htmlFor="frequency">
          <Input id="frequency" placeholder="e.g. Daily" {...register("frequency", { required: true })} />
        </FormField>
        <FormField label="Time of day (optional)" htmlFor="time_of_day">
          <Input id="time_of_day" placeholder="e.g. With breakfast" {...register("time_of_day")} />
        </FormField>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" variant="accent" size="sm" disabled={isSubmitting}>
        {isSubmitting ? "Adding…" : "Add supplement"}
      </Button>
    </form>
  );
}
