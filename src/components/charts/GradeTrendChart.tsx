"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { CHART_INK } from "@/lib/chartColors";

export interface GradeTrendPoint {
  t: number; // ms timestamp
  pct: number;
  letter: string;
  label: string; // assignment name
}

const fmt = (t: number) =>
  new Date(t).toLocaleDateString("en-US", { month: "short", day: "numeric" });

export default function GradeTrendChart({
  data,
  quarterLines,
  color,
}: {
  data: GradeTrendPoint[];
  quarterLines: { t: number; label: string }[];
  color: string;
}) {
  if (data.length < 2) {
    return (
      <p className="text-sm text-ink-secondary py-10 text-center">
        Log a couple of assignments to see your grade over time.
      </p>
    );
  }
  const min = Math.max(0, Math.floor(Math.min(...data.map((d) => d.pct)) / 10) * 10 - 10);
  const domainX: [number, number] = [
    Math.min(quarterLines[0]?.t ?? data[0].t, data[0].t),
    Math.max(data[data.length - 1].t, quarterLines[quarterLines.length - 1]?.t ?? 0),
  ];

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={domainX}
          tickFormatter={fmt}
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          domain={[min, 100]}
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          width={36}
          unit="%"
        />
        {quarterLines.map((q) => (
          <ReferenceLine
            key={q.label}
            x={q.t}
            stroke={CHART_INK.axis}
            strokeDasharray="3 3"
            label={{ value: q.label, position: "top", fill: CHART_INK.muted, fontSize: 11 }}
          />
        ))}
        <Tooltip
          labelFormatter={(t: number) => fmt(t)}
          formatter={(value: number, _n, props) => [
            `${value}% (${props.payload.letter})`,
            `After ${props.payload.label}`,
          ]}
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Line
          type="monotone"
          dataKey="pct"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 3, fill: color }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
