"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function acceptMeeting(id: string, clientId: string, scheduledAt: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("meeting_requests")
    .update({ status: "accepted", scheduled_at: scheduledAt })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "meeting_scheduled",
    message: `Your meeting was scheduled for ${new Date(scheduledAt).toLocaleString()}.`,
  });

  revalidatePath("/coach/meetings");
  return { error: null };
}

export async function proposeReschedule(
  id: string,
  clientId: string,
  proposedAt: string,
  note: string,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("meeting_requests")
    .update({ status: "rescheduled_proposed", scheduled_at: proposedAt, coach_note: note || null })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "meeting_reschedule_proposed",
    message: `Your coach proposed a new time: ${new Date(proposedAt).toLocaleString()}.`,
  });

  revalidatePath("/coach/meetings");
  return { error: null };
}

export async function declineMeeting(id: string, clientId: string, note: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("meeting_requests")
    .update({ status: "declined", coach_note: note || null })
    .eq("id", id);
  if (error) return { error: error.message };

  await supabase.from("notifications").insert({
    user_id: clientId,
    type: "meeting_declined",
    message: note ? `Your meeting request was declined: ${note}` : "Your meeting request was declined.",
  });

  revalidatePath("/coach/meetings");
  return { error: null };
}
