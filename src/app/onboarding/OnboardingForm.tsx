"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  onboardingSchema,
  type OnboardingFormValues,
  type OnboardingInput,
  activityLevelOptions,
  goalOptions,
  trainingExperienceOptions,
} from "@/lib/validation/onboarding";
import { FormField } from "@/components/ui/FormField";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { submitOnboarding } from "./actions";

export function OnboardingForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OnboardingFormValues, unknown, OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
  });

  async function onSubmit(values: OnboardingInput) {
    setServerError(null);
    const result = await submitOnboarding(values);
    if (result?.error) {
      setServerError(result.error);
    }
    // On success the action redirects server-side, so there's nothing else to do here.
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <FormField label="Sex" htmlFor="sex" error={errors.sex?.message}>
          <Select id="sex" {...register("sex")}>
            <option value="">Select…</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </FormField>
        <FormField label="Date of birth" htmlFor="dob" error={errors.dob?.message}>
          <Input id="dob" type="date" {...register("dob")} />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="Height (cm)"
          htmlFor="height_cm"
          error={errors.height_cm?.message}
          hint="We use metric units for precise calculations."
        >
          <Input id="height_cm" type="number" step="0.1" {...register("height_cm")} />
        </FormField>
        <FormField
          label="Current bodyweight (kg)"
          htmlFor="weight_kg"
          error={errors.weight_kg?.message}
        >
          <Input id="weight_kg" type="number" step="0.1" {...register("weight_kg")} />
        </FormField>
      </div>

      <FormField
        label="Body fat % (optional)"
        htmlFor="body_fat_pct"
        error={errors.body_fat_pct?.message}
      >
        <Input id="body_fat_pct" type="number" step="0.1" {...register("body_fat_pct")} />
      </FormField>

      <FormField
        label="Activity level"
        htmlFor="activity_level"
        error={errors.activity_level?.message}
      >
        <Select id="activity_level" {...register("activity_level")}>
          <option value="">Select…</option>
          {activityLevelOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Primary goal" htmlFor="goal" error={errors.goal?.message}>
        <Select id="goal" {...register("goal")}>
          <option value="">Select…</option>
          {goalOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      <FormField
        label="Training experience"
        htmlFor="training_experience"
        error={errors.training_experience?.message}
      >
        <Select id="training_experience" {...register("training_experience")}>
          <option value="">Select…</option>
          {trainingExperienceOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </FormField>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <Button type="submit" className="w-full" loading={isSubmitting}>
        {isSubmitting ? "Saving…" : "Finish setup"}
      </Button>
    </form>
  );
}
