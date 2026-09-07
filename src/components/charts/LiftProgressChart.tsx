"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function LiftProgressChart({ data }: { data: { date: string; est_1rm: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500">No entries logged for this lift yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" fontSize={12} stroke="#6b7280" />
        <YAxis fontSize={12} stroke="#6b7280" domain={["dataMin - 5", "dataMax + 5"]} />
        <Tooltip formatter={(value) => [`${value} kg`, "Est. 1RM"]} />
        <Line
          type="monotone"
          dataKey="est_1rm"
          stroke="#065A82"
          strokeWidth={2}
          dot={{ r: 3, fill: "#065A82" }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
