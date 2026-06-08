"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import type { ValueType } from "recharts/types/component/DefaultTooltipContent";

interface Props { shapValues: Record<string, number>; }

export default function ShapChart({ shapValues }: Props) {
  const data = Object.entries(shapValues)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(4)) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div style={{ width: "100%" }}>
      <ResponsiveContainer width="100%" height={210}>
        <BarChart data={data} layout="vertical" margin={{ left: 0, right: 16, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.05)" />
          <XAxis type="number" tick={{ fontSize: 10, fill: "#4a5f7a" }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} width={150} axisLine={false} tickLine={false} />
          <Tooltip
            formatter={(v: ValueType | undefined) => [Number(v ?? 0).toFixed(4), "SHAP"]}
            contentStyle={{ background: "#1a2235", border: "1px solid #2a3a55", borderRadius: 8, fontSize: 12, color: "#f1f5f9" }}
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((e, i) => (
              <Cell key={i} fill={e.value > 0 ? "#ef4444" : "#10b981"} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p style={{ fontSize: 11, color: "#4a5f7a", marginTop: 6 }}>
        🔴 Increases PCOS risk &nbsp;·&nbsp; 🟢 Decreases PCOS risk
      </p>
    </div>
  );
}
