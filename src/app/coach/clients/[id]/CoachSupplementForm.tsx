"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { addCoachSupplement } from "./actions";

type FormValues = {
  name: string;
  dosage: string;
  frequency: string;
  time_of_day: string;
  notes: string;
};

export function CoachSupplementForm({ clientId }: { clientId: string }) {
  const [error, setError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { name: "", dosage: "", frequency: "", time_of_day: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    const result = await addCoachSupplement(clientId, values);
    if (result?.error) {
      setError(result.error);
      return;
    }
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Name" htmlFor="c_name">
          <Input id="c_name" {...register("name", { required: true })} />
        </FormField>
        <FormField label="Dosage" htmlFor="c_dosage">
          <Input id="c_dosage" {...register("dosage", { required: true })} />
        </FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Frequency" htmlFor="c_frequency">
          <Input id="c_frequency" {...register("frequency", { required: true })} />
        </FormField>
        <FormField label="Time of day" htmlFor="c_time">
          <Input id="c_time" {...register("time_of_day")} />
        </FormField>
      </div>
      <FormField label="Rationale (science-based note)" htmlFor="c_notes">
        <Input id="c_notes" placeholder="Why you're recommending this" {...register("notes")} />
      </FormField>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="sm" variant="accent" loading={isSubmitting}>
        {isSubmitting ? "Adding…" : "Recommend supplement"}
      </Button>
    </form>
  );
}
