"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { insertAutoNutritionTarget } from "@/lib/nutrition/recalculate";

const settingsSchema = z.object({
  height_cm: z.coerce.number().min(100).max(250),
  weight_kg: z.coerce.number().min(30).max(300),
  activity_level: z.enum([
    "sedentary",
    "lightly_active",
    "moderately_active",
    "very_active",
    "extra_active",
  ]),
  goal: z.enum(["fat_loss", "maintenance", "muscle_gain"]),
  leaderboard_opt_in: z.boolean(),
});

/**
 * Any Settings change to weight/activity/goal recomputes nutrition targets
 * immediately — this is the one explicit path that's allowed to do that
 * (contrast with the daily quick weigh-in on the dashboard, which never
 * recalculates on its own — see dashboard/actions.ts).
 */
export async function updateSettings(input: z.infer<typeof settingsSchema>) {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the form and try again." };
  const values = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("sex, dob")
    .eq("user_id", user.id)
    .single();
  if (!clientProfile) return { error: "Complete onboarding first." };

  const { error: profileError } = await supabase
    .from("client_profiles")
    .update({
      height_cm: values.height_cm,
      activity_level: values.activity_level,
      goal: values.goal,
      leaderboard_opt_in: values.leaderboard_opt_in,
    })
    .eq("user_id", user.id);
  if (profileError) return { error: profileError.message };

  const today = new Date().toISOString().slice(0, 10);
  const { error: bodyStatError } = await supabase
    .from("body_stats")
    .upsert(
      { user_id: user.id, date: today, weight_kg: values.weight_kg },
      { onConflict: "user_id,date" },
    );
  if (bodyStatError) return { error: bodyStatError.message };

  const { error: targetError } = await insertAutoNutritionTarget(supabase, {
    userId: user.id,
    sex: clientProfile.sex,
    dob: clientProfile.dob,
    heightCm: values.height_cm,
    weightKg: values.weight_kg,
    activityLevel: values.activity_level,
    goal: values.goal,
    note: "Recalculated after a Settings update.",
  });
  if (targetError) return { error: targetError.message };

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { error: null };
}
