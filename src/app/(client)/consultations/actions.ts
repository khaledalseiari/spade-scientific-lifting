"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  type: z.enum(["check_in", "form_review", "nutrition_consult", "general_question"]),
  slots: z.array(z.string().min(1)).min(2).max(3),
  notes: z.string().optional(),
});

export async function requestMeeting(input: z.infer<typeof requestSchema>) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) return { error: "Pick at least 2 preferred time slots." };
  const values = parsed.data;

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("coach_id")
    .eq("user_id", user.id)
    .single();
  if (!clientProfile?.coach_id) return { error: "No coach assigned to your account yet." };

  const { error } = await supabase.from("meeting_requests").insert({
    client_id: user.id,
    coach_id: clientProfile.coach_id,
    type: values.type,
    requested_slots: values.slots,
    notes: values.notes || null,
    status: "pending",
  });
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: clientProfile.coach_id,
    type: "meeting_requested",
    message: "A client requested a new meeting.",
  });

  revalidatePath("/consultations");
  return { error: null };
}
