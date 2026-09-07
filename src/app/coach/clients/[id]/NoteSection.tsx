"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import type { CoachNote } from "@/types/database";
import { addCoachNote } from "./actions";

export function NoteSection({ clientId, notes }: { clientId: string; notes: CoachNote[] }) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addCoachNote(clientId, text);
      if (result?.error) setError(result.error);
      else setText("");
    });
  }

  return (
    <div className="space-y-3">
      <form onSubmit={handleAdd} className="flex items-end gap-2">
        <textarea
          rows={2}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
          placeholder="Private note — only you can see this"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <Button size="sm" variant="accent" disabled={isPending || !text.trim()}>
          Add note
        </Button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {notes.length === 0 ? (
        <p className="text-sm text-gray-500">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p>{n.note}</p>
              <p className="mt-1 text-xs text-gray-400">
                {new Date(n.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
