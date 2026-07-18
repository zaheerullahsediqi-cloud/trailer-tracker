"use client";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const COLORS = ["#2563EB", "#E2E8F0"];
const COLLECTION_COLORS = ["#16A34A", "#DC2626"];

export function OccupancyPie({ rented, available }: { rented: number; available: number }) {
  const data = [
    { name: "Rented", value: rented },
    { name: "Available", value: available },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend verticalAlign="bottom" height={24} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function CollectionsPie({ collected, outstanding }: { collected: number; outstanding: number }) {
  const data = [
    { name: "Collected", value: collected },
    { name: "Outstanding", value: outstanding },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLLECTION_COLORS[i % COLLECTION_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
        <Legend verticalAlign="bottom" height={24} iconSize={8} />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function UtilizationBar({ data }: { data: { vin: string; revenue: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
        <YAxis type="category" dataKey="vin" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} width={90} />
        <Tooltip formatter={(v: any) => `$${Number(v).toFixed(2)}`} />
        <Bar dataKey="revenue" fill="#2563EB" radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function PaymentHistoryArea({ data }: { data: { month: string; count: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ left: -20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
        <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#64748B" }} axisLine={{ stroke: "#E2E8F0" }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: "#64748B" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip formatter={(v: any) => [`${v}`, "Invoices sent"]} />
        <Area type="monotone" dataKey="count" stroke="#2563EB" fill="#2563EB" fillOpacity={0.15} strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
