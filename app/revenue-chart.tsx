"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function RevenueChart({ data }: { data: { month: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis
          dataKey="month"
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={{ stroke: "#E2E8F0" }}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748B" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
        />
        <Tooltip
          formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Revenue"]}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #E2E8F0",
            fontSize: 13,
            boxShadow: "0 4px 12px rgba(15,23,42,0.08)",
          }}
        />
        <Bar dataKey="revenue" fill="#2563EB" radius={[6, 6, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
