import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { LeaderboardTable } from "./LeaderboardTable";

export const metadata: Metadata = { title: "Leaderboard" };

export default async function LeaderboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: clientProfile } = await supabase
    .from("client_profiles")
    .select("leaderboard_opt_in")
    .eq("user_id", user.id)
    .single();

  const { data: rows } = await supabase.rpc("get_leaderboard");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Leaderboard</h1>
      {!clientProfile?.leaderboard_opt_in && (
        <Card className="bg-brand-support/10">
          <p className="text-sm text-gray-600">
            You&apos;re not opted in, so you won&apos;t appear below. Turn it on in{" "}
            <Link href="/settings" className="text-brand-primary hover:underline">
              Settings
            </Link>{" "}
            — only your first name/username and DOTS score are ever shown.
          </p>
        </Card>
      )}
      <Card>
        <LeaderboardTable rows={rows ?? []} />
      </Card>
    </div>
  );
}
