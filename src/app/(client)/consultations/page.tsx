import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { MeetingRequestForm } from "./MeetingRequestForm";

export const metadata: Metadata = { title: "Consultations" };

const TYPE_LABELS: Record<string, string> = {
  check_in: "Check-in",
  form_review: "Form review",
  nutrition_consult: "Nutrition consult",
  general_question: "General question",
};

const STATUS_VARIANT: Record<string, "neutral" | "support" | "highlight" | "danger"> = {
  pending: "neutral",
  accepted: "highlight",
  declined: "danger",
  rescheduled_proposed: "support",
};

export default async function ConsultationsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: requests } = await supabase
    .from("meeting_requests")
    .select("*")
    .eq("client_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Consultations</h1>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">Request a meeting</h2>
        <MeetingRequestForm />
      </Card>

      <Card>
        <h2 className="mb-3 text-lg font-semibold text-brand-ink">My requests</h2>
        {!requests || requests.length === 0 ? (
          <p className="text-sm text-gray-500">No meeting requests yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {requests.map((r) => (
              <li key={r.id} className="space-y-1 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    {TYPE_LABELS[r.type] ?? r.type}
                  </span>
                  <Badge variant={STATUS_VARIANT[r.status]}>{r.status.replace(/_/g, " ")}</Badge>
                </div>
                {r.scheduled_at && (
                  <p className="text-sm text-gray-600">
                    {r.status === "rescheduled_proposed" ? "Coach proposed: " : "Scheduled: "}
                    {new Date(r.scheduled_at).toLocaleString()}
                  </p>
                )}
                {r.coach_note && (
                  <p className="text-sm text-gray-500 italic">Coach note: {r.coach_note}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
