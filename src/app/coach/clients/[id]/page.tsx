import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { computePRs } from "@/lib/lifting/queries";
import { getLatestNutritionTarget } from "@/lib/nutrition/queries";
import { NoteSection } from "./NoteSection";
import { OverrideTargetForm } from "./OverrideTargetForm";
import { CoachSupplementForm } from "./CoachSupplementForm";

export const metadata: Metadata = { title: "Client detail" };

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const clientId = params.id;

  const [{ data: profile }, { data: clientProfile }, { data: lifts }, target, { data: supplements }, { data: notes }] =
    await Promise.all([
      supabase.from("profiles").select("name").eq("id", clientId).single(),
      supabase
        .from("client_profiles")
        .select("sex, goal, activity_level, training_experience")
        .eq("user_id", clientId)
        .single(),
      supabase.from("lifts").select("*").eq("user_id", clientId),
      getLatestNutritionTarget(supabase, clientId),
      supabase.from("supplements").select("*").eq("user_id", clientId),
      supabase
        .from("coach_notes")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false }),
    ]);

  // RLS already prevents reading another coach's client, so a null profile
  // here means the id doesn't resolve to one of this coach's clients.
  if (!profile || !clientProfile) notFound();

  const prs = computePRs(lifts ?? []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-ink">{profile.name}</h1>
        <p className="text-sm text-gray-500">
          {clientProfile.goal.replace("_", " ")} · {clientProfile.activity_level.replace("_", " ")} ·{" "}
          {clientProfile.training_experience}
        </p>
      </div>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Lifting PRs</h2>
        {prs.length === 0 ? (
          <p className="text-sm text-gray-500">No lifts logged yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {prs.map((pr) => (
              <div key={pr.liftName} className="rounded-lg border border-gray-200 p-3">
                <p className="text-xs font-medium text-gray-500">{pr.liftName}</p>
                <p className="text-lg font-bold text-brand-ink">{pr.est1rm} kg</p>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-brand-ink">Nutrition target</h2>
          {target?.source === "coach_override" && <Badge variant="support">Coach-adjusted</Badge>}
        </div>
        {target ? (
          <OverrideTargetForm
            clientId={clientId}
            defaults={{
              calorie_target: target.calorie_target,
              protein_g: target.protein_g,
              carb_g: target.carb_g,
              fat_g: target.fat_g,
            }}
          />
        ) : (
          <p className="text-sm text-gray-500">Client hasn&apos;t completed onboarding yet.</p>
        )}
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Supplements</h2>
        <ul className="mb-4 space-y-1 text-sm text-gray-700">
          {(supplements ?? []).map((s) => (
            <li key={s.id}>
              {s.name} — {s.dosage}, {s.frequency}
              {s.added_by === "coach" && <Badge variant="support" className="ml-2">You added</Badge>}
            </li>
          ))}
          {(supplements ?? []).length === 0 && (
            <p className="text-sm text-gray-500">No supplements yet.</p>
          )}
        </ul>
        <CoachSupplementForm clientId={clientId} />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Private notes</h2>
        <NoteSection clientId={clientId} notes={notes ?? []} />
      </Card>
    </div>
  );
}
