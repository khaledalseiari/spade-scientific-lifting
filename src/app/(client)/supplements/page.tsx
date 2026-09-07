import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { SupplementForm } from "./SupplementForm";
import { SupplementChecklist } from "./SupplementChecklist";

export const metadata: Metadata = { title: "Supplements" };

export default async function SupplementsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const today = new Date().toISOString().slice(0, 10);
  const { data: supplements } = await supabase
    .from("supplements")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const supplementIds = (supplements ?? []).map((s) => s.id);
  const { data: logs } =
    supplementIds.length > 0
      ? await supabase
          .from("supplement_logs")
          .select("supplement_id, taken")
          .eq("date", today)
          .in("supplement_id", supplementIds)
      : { data: [] };

  const takenToday: Record<string, boolean> = {};
  for (const log of logs ?? []) {
    takenToday[log.supplement_id] = log.taken;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Supplements</h1>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Today&apos;s checklist</h2>
        <SupplementChecklist
          supplements={supplements ?? []}
          takenToday={takenToday}
          today={today}
        />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Add a supplement</h2>
        <SupplementForm />
      </Card>
    </div>
  );
}
