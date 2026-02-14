"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export interface WeeklySessionPoint {
  day: string; // e.g. "Mon", "Tue"
  sessions: number;
}

interface WeeklySessionsChartProps {
  data: WeeklySessionPoint[];
}

export function WeeklySessionsChart({ data }: WeeklySessionsChartProps) {
  const hasData = data.some((d) => d.sessions > 0);

  if (!hasData) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <h3 className="text-sm font-semibold mb-4">Weekly Study Activity</h3>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <p className="text-sm text-muted-foreground">
            No sessions this week. Start studying to see your weekly progress.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/50 bg-card/50 p-6">
      <h3 className="text-sm font-semibold mb-4">Weekly Study Activity</h3>

      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
              opacity={0.3}
            />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
                fontSize: "12px",
              }}
              labelStyle={{ color: "hsl(var(--foreground))" }}
              formatter={(value: number | undefined) => [value ?? 0, "Sessions"]}
            />
            <Bar
              dataKey="sessions"
              fill="hsl(var(--neon-cyan, 180 100% 50%))"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
