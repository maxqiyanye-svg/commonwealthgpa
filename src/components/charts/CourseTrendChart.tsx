"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { CHART_INK } from "@/lib/chartColors";

export interface CoursePoint {
  period: string;
  points: number | null;
  letter: string | null;
}

export default function CourseTrendChart({
  data,
  color,
}: {
  data: CoursePoint[];
  color: string;
}) {
  const hasAny = data.some((d) => d.points !== null);
  if (!hasAny) {
    return (
      <p className="text-sm text-ink-secondary py-10 text-center">
        No grades entered yet for this course.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey="period"
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
        />
        <YAxis
          domain={[0, 5]}
          tick={{ fill: CHART_INK.muted, fontSize: 12 }}
          axisLine={{ stroke: CHART_INK.axis }}
          tickLine={false}
          width={32}
        />
        <Tooltip
          formatter={(value: number, _name, props) => [
            props.payload.letter ? `${props.payload.letter} (${value} pts)` : "no grade",
            "Grade",
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
          dataKey="points"
          name="Weighted points"
          stroke={color}
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
