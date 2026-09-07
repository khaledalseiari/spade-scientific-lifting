"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const liftSchema = z.object({
  lift_name: z.string().min(1, "Pick or enter a lift"),
  date: z.string().min(1),
  weight: z.coerce.number().positive(),
  reps: z.coerce.number().int().positive(),
  sets: z.coerce.number().int().positive().default(1),
  rpe: z.union([z.coerce.number().min(0).max(10), z.literal("")]).optional(),
});

export async function addLift(input: z.infer<typeof liftSchema>) {
  const parsed = liftSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the lift fields and try again." };
  const values = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("lifts").insert({
    user_id: user.id,
    lift_name: values.lift_name,
    date: values.date,
    weight: values.weight,
    reps: values.reps,
    sets: values.sets,
    rpe: values.rpe === "" || values.rpe === undefined ? null : values.rpe,
  });

  if (error) return { error: error.message };
  revalidatePath("/lifting");
  revalidatePath("/dashboard");
  return { error: null };
}
