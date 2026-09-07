"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { requestMeeting } from "./actions";

type FormValues = {
  type: string;
  slot1: string;
  slot2: string;
  slot3: string;
  notes: string;
};

export function MeetingRequestForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { type: "check_in", slot1: "", slot2: "", slot3: "", notes: "" },
  });

  async function onSubmit(values: FormValues) {
    setError(null);
    setSuccess(false);
    const slots = [values.slot1, values.slot2, values.slot3].filter(Boolean);
    const result = await requestMeeting({ type: values.type as never, slots, notes: values.notes });
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
    reset();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
      <FormField label="Meeting type" htmlFor="type">
        <Select id="type" {...register("type")}>
          <option value="check_in">Check-in</option>
          <option value="form_review">Form review</option>
          <option value="nutrition_consult">Nutrition consult</option>
          <option value="general_question">General question</option>
        </Select>
      </FormField>

      <div className="grid gap-3 sm:grid-cols-3">
        <FormField label="Preferred slot 1" htmlFor="slot1">
          <Input id="slot1" type="datetime-local" {...register("slot1", { required: true })} />
        </FormField>
        <FormField label="Preferred slot 2" htmlFor="slot2">
          <Input id="slot2" type="datetime-local" {...register("slot2", { required: true })} />
        </FormField>
        <FormField label="Preferred slot 3 (optional)" htmlFor="slot3">
          <Input id="slot3" type="datetime-local" {...register("slot3")} />
        </FormField>
      </div>

      <FormField label="Notes (optional)" htmlFor="notes">
        <textarea
          id="notes"
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          {...register("notes")}
        />
      </FormField>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-700">Request sent to your coach.</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Request meeting"}
      </Button>
    </form>
  );
}
