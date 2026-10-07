"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";
import type { CategoryPoint } from "@/lib/analysis";
import { CATEGORY_COLORS, CHART_INK } from "@/lib/chartColors";

export default function CategoryBarChart({ data }: { data: CategoryPoint[] }) {
  const chartData = data.map((d) => ({
    category: d.category,
    weighted: d.weighted ?? 0,
    hasData: d.weighted !== null,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={CHART_INK.grid} vertical={false} />
        <XAxis
          dataKey="category"
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
          formatter={(value: number, _name, props) =>
            props.payload.hasData ? [value, "Weighted GPA"] : ["no grades yet", ""]
          }
          contentStyle={{
            background: "var(--surface-1)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 13,
          }}
        />
        <Bar dataKey="weighted" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {chartData.map((d) => (
            <Cell
              key={d.category}
              fill={d.hasData ? CATEGORY_COLORS[d.category as keyof typeof CATEGORY_COLORS] : CHART_INK.grid}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
