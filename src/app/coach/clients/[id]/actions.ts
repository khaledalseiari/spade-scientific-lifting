"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { computeNutritionTargets } from "@/lib/nutrition/engine";

export async function addCoachNote(clientId: string, note: string) {
  if (!note.trim()) return { error: "Note can't be empty." };
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("coach_notes")
    .insert({ coach_id: user.id, client_id: clientId, note });
  if (error) return { error: error.message };

  revalidatePath(`/coach/clients/${clientId}`);
  return { error: null };
}

const overrideSchema = z.object({
  calorie_target: z.coerce.number().positive(),
  protein_g: z.coerce.number().nonnegative(),
  carb_g: z.coerce.number().nonnegative(),
  fat_g: z.coerce.number().nonnegative(),
  note: z.string().optional(),
});

export async function overrideNutritionTarget(
  clientId: string,
  input: z.infer<typeof overrideSchema>,
) {
  const parsed = overrideSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the target fields and try again." };
  const values = parsed.data;

  const supabase = createClient();

  // BMR/TDEE are informational only for a coach override — recompute them
  // from the client's current profile so the row stays coherent even though
  // calorie_target/macros are the coach's explicit numbers, not derived ones.
  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("sex, dob, height_cm, activity_level, goal")
    .eq("user_id", clientId)
    .single();
  const { data: latestWeight } = await supabase
    .from("body_stats")
    .select("weight_kg")
    .eq("user_id", clientId)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!clientProfile || !latestWeight) return { error: "Client is missing profile data." };

  const base = computeNutritionTargets({
    sex: clientProfile.sex,
    dob: clientProfile.dob,
    heightCm: clientProfile.height_cm,
    weightKg: latestWeight.weight_kg,
    activityLevel: clientProfile.activity_level,
    goal: clientProfile.goal,
  });

  const { error } = await supabase.from("nutrition_targets").insert({
    user_id: clientId,
    bmr: base.bmr,
    tdee: base.tdee,
    calorie_target: values.calorie_target,
    protein_g: values.protein_g,
    carb_g: values.carb_g,
    fat_g: values.fat_g,
    source: "coach_override",
    note: values.note || null,
  });
  if (error) return { error: error.message };

  revalidatePath(`/coach/clients/${clientId}`);
  return { error: null };
}

const supplementSchema = z.object({
  name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  time_of_day: z.string().optional(),
  notes: z.string().optional(),
});

export async function addCoachSupplement(clientId: string, input: z.infer<typeof supplementSchema>) {
  const parsed = supplementSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the supplement fields and try again." };

  const supabase = createClient();
  const { error } = await supabase.from("supplements").insert({
    user_id: clientId,
    added_by: "coach",
    ...parsed.data,
  });
  if (error) return { error: error.message };

  revalidatePath(`/coach/clients/${clientId}`);
  return { error: null };
}
