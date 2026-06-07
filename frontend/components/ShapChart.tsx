"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";

interface Props {
  shapValues: Record<string, number>;
}

export default function ShapChart({ shapValues }: Props) {
  const data = Object.entries(shapValues)
    .map(([name, value]) => ({ name, value: parseFloat(value.toFixed(4)) }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold text-slate-600 mb-3">
        Top contributing factors
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fontSize: 11 }}
            width={160}
          />
          <Tooltip
            formatter={(v: any) => [Number(v).toFixed(4), "SHAP value"]}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? "#ef4444" : "#22c55e"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-400 mt-2">
        Red = increases PCOS risk · Green = decreases PCOS risk
      </p>
    </div>
  );
}
