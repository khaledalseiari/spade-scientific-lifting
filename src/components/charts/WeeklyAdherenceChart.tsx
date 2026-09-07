"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function WeeklyAdherenceChart({
  data,
  target,
}: {
  data: { date: string; calories: number }[];
  target: number;
}) {
  const chartData = data.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString(undefined, { weekday: "short" }),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" fontSize={12} stroke="#6b7280" />
        <YAxis fontSize={12} stroke="#6b7280" />
        <Tooltip
          formatter={(value) => [`${Math.round(Number(value))} kcal`, "Logged"]}
          labelFormatter={(label) => label}
        />
        <ReferenceLine y={target} stroke="#065A82" strokeDasharray="4 4" label="Target" />
        <Bar dataKey="calories" fill="#75DDDD" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
