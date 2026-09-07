"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const slotSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z.string().min(1),
  end_time: z.string().min(1),
});

export async function addAvailabilitySlot(input: z.infer<typeof slotSchema>) {
  const parsed = slotSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the times and try again." };
  if (parsed.data.end_time <= parsed.data.start_time) {
    return { error: "End time must be after start time." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("coach_availability")
    .insert({ coach_id: user.id, ...parsed.data });
  if (error) return { error: error.message };

  revalidatePath("/coach/availability");
  return { error: null };
}

export async function removeAvailabilitySlot(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("coach_availability").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/coach/availability");
  return { error: null };
}
