"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { TimelinePoint } from "@/lib/analysis";
import { CHART_INK, SERIES_UNWEIGHTED, SERIES_WEIGHTED } from "@/lib/chartColors";

export default function GpaTrendChart({ data }: { data: TimelinePoint[] }) {
  if (data.length === 0) {
    return (
      <p className="text-sm text-ink-secondary py-12 text-center">
        No grades entered yet — add a grade to start the trend.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
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
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 13 }} />
        <Line
          type="monotone"
          dataKey="unweighted"
          name="Unweighted"
          stroke={SERIES_UNWEIGHTED}
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
        <Line
          type="monotone"
          dataKey="weighted"
          name="Weighted"
          stroke={SERIES_WEIGHTED}
          strokeWidth={2}
          dot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
