import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { MeetingRequestRow } from "./MeetingRequestRow";

export const metadata: Metadata = { title: "Meeting requests" };

export default async function CoachMeetingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("meeting_requests")
    .select("*")
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const clientIds = Array.from(new Set((requests ?? []).map((r) => r.client_id)));
  const { data: clients } =
    clientIds.length > 0
      ? await supabase.from("profiles").select("id, name").in("id", clientIds)
      : { data: [] };
  const nameById = new Map((clients ?? []).map((c) => [c.id, c.name]));

  const pending = (requests ?? []).filter((r) => r.status === "pending");
  const resolved = (requests ?? []).filter((r) => r.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Meeting requests</h1>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">
          Pending ({pending.length})
        </h2>
        {pending.length === 0 ? (
          <p className="text-sm text-gray-500">No pending requests.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pending.map((r) => (
              <MeetingRequestRow key={r.id} request={r} clientName={nameById.get(r.client_id) ?? "Client"} />
            ))}
          </ul>
        )}
      </Card>

      {resolved.length > 0 && (
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-brand-ink">History</h2>
          <ul className="divide-y divide-gray-100">
            {resolved.map((r) => (
              <MeetingRequestRow key={r.id} request={r} clientName={nameById.get(r.client_id) ?? "Client"} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
