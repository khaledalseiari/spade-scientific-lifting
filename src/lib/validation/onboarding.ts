import { z } from "zod";

export const activityLevelOptions = [
  { value: "sedentary", label: "Sedentary (little to no exercise)" },
  { value: "lightly_active", label: "Lightly active (1-3 days/week)" },
  { value: "moderately_active", label: "Moderately active (3-5 days/week)" },
  { value: "very_active", label: "Very active (6-7 days/week)" },
  { value: "extra_active", label: "Extra active (physical job + training)" },
] as const;

export const goalOptions = [
  { value: "fat_loss", label: "Fat loss" },
  { value: "maintenance", label: "Maintenance" },
  { value: "muscle_gain", label: "Muscle gain" },
] as const;

export const trainingExperienceOptions = [
  { value: "beginner", label: "Beginner (< 1 year)" },
  { value: "intermediate", label: "Intermediate (1-3 years)" },
  { value: "advanced", label: "Advanced (3+ years)" },
] as const;

export const onboardingSchema = z.object({
  sex: z.enum(["male", "female"], { message: "Select a sex" }),
  dob: z
    .string()
    .min(1, "Enter your date of birth")
    .refine((val) => {
      const age = (Date.now() - new Date(val).getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      return age >= 13 && age <= 100;
    }, "Enter a valid date of birth"),
  height_cm: z.coerce.number().min(100, "Too low").max(250, "Too high"),
  weight_kg: z.coerce.number().min(30, "Too low").max(300, "Too high"),
  body_fat_pct: z
    .union([z.coerce.number().min(3).max(60), z.literal("")])
    .optional()
    .transform((val) => (val === "" || val === undefined ? undefined : val)),
  activity_level: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]),
  goal: z.enum(["fat_loss", "maintenance", "muscle_gain"]),
  training_experience: z.enum(["beginner", "intermediate", "advanced"]),
});
// z.coerce fields (height_cm, weight_kg, body_fat_pct) mean the *input* type
// (what HTML inputs actually produce — strings) differs from the *output*
// type (numbers, after zodResolver parses them). react-hook-form needs both:
// the form state is typed as the input shape, but onSubmit receives the
// parsed output shape.
export type OnboardingFormValues = z.input<typeof onboardingSchema>;
export type OnboardingInput = z.output<typeof onboardingSchema>;
