"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const supplementSchema = z.object({
  name: z.string().min(1, "Enter a supplement name"),
  dosage: z.string().min(1, "Enter a dosage"),
  frequency: z.string().min(1, "Enter a frequency"),
  time_of_day: z.string().optional(),
});

export async function addSupplement(input: z.infer<typeof supplementSchema>) {
  const parsed = supplementSchema.safeParse(input);
  if (!parsed.success) return { error: "Check the supplement fields and try again." };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase.from("supplements").insert({
    user_id: user.id,
    added_by: "client",
    ...parsed.data,
  });
  if (error) return { error: error.message };

  revalidatePath("/supplements");
  return { error: null };
}

export async function deleteSupplement(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from("supplements").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/supplements");
  return { error: null };
}

export async function toggleSupplementLog(supplementId: string, date: string, taken: boolean) {
  const supabase = createClient();
  const { error } = await supabase
    .from("supplement_logs")
    .upsert({ supplement_id: supplementId, date, taken }, { onConflict: "supplement_id,date" });
  if (error) return { error: error.message };
  revalidatePath("/supplements");
  revalidatePath("/dashboard");
  return { error: null };
}
