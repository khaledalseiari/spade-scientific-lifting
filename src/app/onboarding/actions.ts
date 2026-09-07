"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema, type OnboardingInput } from "@/lib/validation/onboarding";
import { insertAutoNutritionTarget } from "@/lib/nutrition/recalculate";

export async function submitOnboarding(input: OnboardingInput) {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Invalid input — please check the form and try again." };
  }
  const values = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  // Single-coach business assumption: every client onboards under whichever
  // profile has role = 'coach'. If this platform ever supports multiple
  // coaches, replace this with an explicit "choose your coach" step.
  const { data: coach } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "coach")
    .limit(1)
    .maybeSingle();

  const { error: profileError } = await supabase.from("client_profiles").insert({
    user_id: user.id,
    coach_id: coach?.id ?? null,
    sex: values.sex,
    dob: values.dob,
    height_cm: values.height_cm,
    activity_level: values.activity_level,
    goal: values.goal,
    training_experience: values.training_experience,
  });

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: bodyStatError } = await supabase.from("body_stats").insert({
    user_id: user.id,
    date: new Date().toISOString().slice(0, 10),
    weight_kg: values.weight_kg,
    body_fat_pct: values.body_fat_pct ?? null,
  });

  if (bodyStatError) {
    return { error: bodyStatError.message };
  }

  const { error: targetError } = await insertAutoNutritionTarget(supabase, {
    userId: user.id,
    sex: values.sex,
    dob: values.dob,
    heightCm: values.height_cm,
    weightKg: values.weight_kg,
    activityLevel: values.activity_level,
    goal: values.goal,
  });

  if (targetError) {
    return { error: targetError.message };
  }

  redirect("/dashboard");
}
