import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Client roster" };

export default async function CoachRosterPage() {
  const supabase = createClient();
  const { data: roster } = await supabase.rpc("get_coach_roster");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-ink">Client roster</h1>

      <Card>
        {!roster || roster.length === 0 ? (
          <p className="text-sm text-gray-500">No clients yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4">Client</th>
                  <th className="py-2 pr-4">Adherence (7d)</th>
                  <th className="py-2 pr-4">Last check-in</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roster.map((r) => (
                  <tr key={r.client_id}>
                    <td className="py-3 pr-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 pr-4">
                      <Badge
                        variant={
                          r.adherence_pct >= 80
                            ? "highlight"
                            : r.adherence_pct >= 50
                              ? "support"
                              : "neutral"
                        }
                      >
                        {r.adherence_pct}%
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {r.last_check_in ? new Date(r.last_check_in).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/coach/clients/${r.client_id}`}
                        className="text-brand-primary hover:underline"
                      >
                        View →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
