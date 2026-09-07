"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function StrengthTimelineChart({
  data,
}: {
  data: { date: string; totalKg: number; dots: number }[];
}) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Log squat, bench, and deadlift entries to see your bodyweight-adjusted trend.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" fontSize={12} stroke="#6b7280" />
        <YAxis yAxisId="left" fontSize={12} stroke="#610F7F" />
        <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="#065A82" />
        <Tooltip />
        <Legend />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="dots"
          name="DOTS score"
          stroke="#610F7F"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="totalKg"
          name="Total (kg)"
          stroke="#065A82"
          strokeDasharray="4 4"
          dot={{ r: 3 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
