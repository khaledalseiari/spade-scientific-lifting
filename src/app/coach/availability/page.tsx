import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AvailabilityManager } from "./AvailabilityManager";

export const metadata: Metadata = { title: "Availability" };

export default async function AvailabilityPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: slots } = await supabase
    .from("coach_availability")
    .select("*")
    .eq("coach_id", user.id)
    .order("day_of_week", { ascending: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Availability</h1>
      <Card>
        <AvailabilityManager slots={slots ?? []} />
      </Card>
    </div>
  );
}
