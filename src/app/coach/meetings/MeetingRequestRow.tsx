"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { MeetingRequest } from "@/types/database";
import { acceptMeeting, declineMeeting, proposeReschedule } from "./actions";

const TYPE_LABELS: Record<string, string> = {
  check_in: "Check-in",
  form_review: "Form review",
  nutrition_consult: "Nutrition consult",
  general_question: "General question",
};

export function MeetingRequestRow({
  request,
  clientName,
}: {
  request: MeetingRequest;
  clientName: string;
}) {
  const [mode, setMode] = useState<"idle" | "propose" | "decline">("idle");
  const [proposedAt, setProposedAt] = useState("");
  const [note, setNote] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  if (done) return null;

  const isPending_ = request.status === "pending";

  return (
    <li className="space-y-3 py-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {clientName} — {TYPE_LABELS[request.type] ?? request.type}
          </p>
          {request.notes && <p className="text-sm text-gray-500">{request.notes}</p>}
        </div>
        <Badge variant={isPending_ ? "neutral" : "support"}>
          {request.status.replace(/_/g, " ")}
        </Badge>
      </div>

      {isPending_ && (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-gray-700">Preferred times:</p>
          <ul className="space-y-1">
            {request.requested_slots.map((slot) => (
              <li key={slot} className="flex items-center justify-between">
                <span className="text-gray-600">{new Date(slot).toLocaleString()}</span>
                <Button
                  size="sm"
                  variant="accent"
                  loading={isPending}
                  onClick={() =>
                    startTransition(async () => {
                      await acceptMeeting(request.id, request.client_id, slot);
                      setDone(true);
                    })
                  }
                >
                  Accept this time
                </Button>
              </li>
            ))}
          </ul>

          {mode === "idle" && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setMode("propose")}>
                Propose different time
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setMode("decline")}>
                Decline
              </Button>
            </div>
          )}

          {mode === "propose" && (
            <div className="animate-slide-down flex flex-wrap items-end gap-2 overflow-hidden pt-2">
              <input
                type="datetime-local"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={proposedAt}
                onChange={(e) => setProposedAt(e.target.value)}
              />
              <input
                type="text"
                placeholder="Note (optional)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                size="sm"
                variant="accent"
                disabled={!proposedAt}
                loading={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await proposeReschedule(request.id, request.client_id, proposedAt, note);
                    setDone(true);
                  })
                }
              >
                Send proposal
              </Button>
            </div>
          )}

          {mode === "decline" && (
            <div className="animate-slide-down flex flex-wrap items-end gap-2 overflow-hidden pt-2">
              <input
                type="text"
                placeholder="Reason (optional)"
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                size="sm"
                variant="outline"
                loading={isPending}
                onClick={() =>
                  startTransition(async () => {
                    await declineMeeting(request.id, request.client_id, note);
                    setDone(true);
                  })
                }
              >
                Confirm decline
              </Button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
