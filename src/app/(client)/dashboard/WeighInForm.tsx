"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { logWeighIn } from "./actions";

export function WeighInForm() {
  const [weight, setWeight] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!weight) return;
    setSaving(true);
    await logWeighIn(Number(weight));
    setSaving(false);
    setSaved(true);
    setWeight("");
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <label htmlFor="weigh-in" className="mb-1 block text-xs font-medium text-gray-600">
          Today&apos;s weight (kg)
        </label>
        <Input
          id="weigh-in"
          type="number"
          step="0.1"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <Button type="submit" variant="support" size="sm" disabled={saving}>
        {saving ? "Saving…" : saved ? "Logged ✓" : "Log weight"}
      </Button>
    </form>
  );
}
