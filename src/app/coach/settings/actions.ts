"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function setLeaderboardEnabled(enabled: boolean) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in." };

  const { error } = await supabase
    .from("coach_settings")
    .upsert({ coach_id: user.id, leaderboard_enabled: enabled }, { onConflict: "coach_id" });
  if (error) return { error: error.message };

  revalidatePath("/coach/settings");
  return { error: null };
}
