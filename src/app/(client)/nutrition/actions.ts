"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const foodLogSchema = z.object({
  meal: z.string().min(1),
  food_item: z.string().min(1, "Enter a food name"),
  calories: z.coerce.number().min(0),
  protein_g: z.coerce.number().min(0),
  carb_g: z.coerce.number().min(0),
  fat_g: z.coerce.number().min(0),
});

export async function addFoodLog(input: z.infer<typeof foodLogSchema>) {
  const parsed = foodLogSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "Check the food log fields and try again." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("food_logs").insert({
    user_id: user.id,
    date: new Date().toISOString().slice(0, 10),
    ...parsed.data,
  });

  if (error) return { error: error.message };

  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteFoodLog(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("food_logs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { error: null };
}
