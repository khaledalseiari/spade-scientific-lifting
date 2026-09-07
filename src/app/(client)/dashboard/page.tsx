import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import {
  getFoodLogsForDate,
  getLatestNutritionTarget,
  getRollingWeightAverages,
  sumFoodLogs,
} from "@/lib/nutrition/queries";
import { evaluateTrendDivergence } from "@/lib/nutrition/engine";
import { computePRs } from "@/lib/lifting/queries";
import { WeighInForm } from "./WeighInForm";
import { TrendBanner } from "./TrendBanner";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const [target, todayLogs, clientProfile, trend, { data: recentLifts }, { data: meetings }] =
    await Promise.all([
      getLatestNutritionTarget(supabase, user.id),
      getFoodLogsForDate(supabase, user.id, today),
      supabase.from("client_profiles").select("goal").eq("user_id", user.id).single(),
      getRollingWeightAverages(supabase, user.id),
      supabase.from("lifts").select("*").eq("user_id", user.id),
      supabase
        .from("meeting_requests")
        .select("*")
        .eq("client_id", user.id)
        .eq("status", "accepted")
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true }),
    ]);
  const totals = sumFoodLogs(todayLogs);
  const prs = computePRs(recentLifts ?? []).slice(0, 3);

  const divergence =
    target && trend && clientProfile.data
      ? evaluateTrendDivergence({
          currentWeekAvgKg: trend.currentWeekAvgKg,
          previousWeekAvgKg: trend.previousWeekAvgKg,
          goal: clientProfile.data.goal,
          currentCalorieTarget: target.calorie_target,
        })
      : null;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Dashboard</h1>

      {divergence?.flagged && target && (
        <TrendBanner
          expectedPct={divergence.expectedWeeklyChangePct}
          actualPct={divergence.actualWeeklyChangePct}
          suggestedCalorieTarget={divergence.suggestedCalorieTarget}
          currentCalorieTarget={target.calorie_target}
        />
      )}

      <Card>
        <h2 className="mb-2 text-sm font-semibold text-brand-ink">Quick weigh-in</h2>
        <WeighInForm />
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-ink">Today&apos;s nutrition</h2>
            <Link href="/nutrition" className="text-sm text-brand-primary hover:underline">
              Log food →
            </Link>
          </div>
          {target ? (
            <ProgressBar
              label={`${Math.round(totals.calories)} / ${Math.round(target.calorie_target)} kcal`}
              value={totals.calories}
              max={target.calorie_target}
            />
          ) : (
            <p className="text-sm text-gray-600">Finish onboarding to see your targets.</p>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-ink">Recent PRs</h2>
            <Link href="/lifting" className="text-sm text-brand-primary hover:underline">
              View lifting →
            </Link>
          </div>
          {prs.length === 0 ? (
            <p className="text-sm text-gray-600">Log a lift to start tracking PRs.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {prs.map((pr) => (
                <li key={pr.liftName}>
                  <strong>{pr.liftName}</strong>: {pr.est1rm} kg est. 1RM
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-brand-ink">Upcoming meetings</h2>
            <Link href="/consultations" className="text-sm text-brand-primary hover:underline">
              Request a meeting →
            </Link>
          </div>
          {!meetings || meetings.length === 0 ? (
            <p className="text-sm text-gray-600">No meetings scheduled.</p>
          ) : (
            <ul className="space-y-1 text-sm text-gray-700">
              {meetings.map((m) => (
                <li key={m.id}>
                  {m.type.replace(/_/g, " ")} —{" "}
                  {m.scheduled_at && new Date(m.scheduled_at).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold text-brand-ink">Quick actions</h2>
          <div className="flex flex-wrap gap-2">
            <Button href="/nutrition" variant="support" size="sm">
              Log food
            </Button>
            <Button href="/lifting" variant="support" size="sm">
              Log a lift
            </Button>
            <Button href="/supplements" variant="support" size="sm">
              Log supplements
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
