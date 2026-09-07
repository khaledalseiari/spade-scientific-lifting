import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LeaderboardToggle } from "./LeaderboardToggle";

export const metadata: Metadata = { title: "Coach settings" };

export default async function CoachSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: settings } = await supabase
    .from("coach_settings")
    .select("leaderboard_enabled")
    .eq("coach_id", user.id)
    .maybeSingle();

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Coach settings</h1>
      <Card>
        <LeaderboardToggle initialEnabled={settings?.leaderboard_enabled ?? true} />
      </Card>
    </div>
  );
}
