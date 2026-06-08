"use client";
import { useState } from "react";
import { predictPCOS, PCOSInput, PCOSResult } from "./lib/api";
import ResultCard from "./components/ResultCard";

const defaultValues: PCOSInput = {
  age: 28, weight: 65, bmi: 24.0, cycle: 2, cycle_length: 35,
  marriage_years: 2, hip: 38, waist: 32, amh: 5.0, weight_gain: 1,
  hair_growth: 1, skin_darkening: 1, hair_loss: 0, pimples: 1,
  fast_food: 1, follicle_l: 13, follicle_r: 15,
  avg_fsize_l: 18, avg_fsize_r: 20, endometrium: 10,
};

const fields: { key: keyof PCOSInput; label: string; type: "number" | "select"; options?: {value: number; label: string}[] }[] = [
  { key: "age", label: "Age (years)", type: "number" },
  { key: "weight", label: "Weight (kg)", type: "number" },
  { key: "bmi", label: "BMI", type: "number" },
  { key: "cycle", label: "Cycle regularity", type: "select", options: [{value:1,label:"Regular"},{value:2,label:"Irregular"}] },
  { key: "cycle_length", label: "Cycle length (days)", type: "number" },
  { key: "marriage_years", label: "Years married", type: "number" },
  { key: "hip", label: "Hip (inches)", type: "number" },
  { key: "waist", label: "Waist (inches)", type: "number" },
  { key: "amh", label: "AMH (ng/mL)", type: "number" },
  { key: "weight_gain", label: "Weight gain", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "hair_growth", label: "Excessive hair growth", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "skin_darkening", label: "Skin darkening", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "hair_loss", label: "Hair loss", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "pimples", label: "Pimples", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "fast_food", label: "Fast food consumption", type: "select", options: [{value:0,label:"No"},{value:1,label:"Yes"}] },
  { key: "follicle_l", label: "Follicle count (left)", type: "number" },
  { key: "follicle_r", label: "Follicle count (right)", type: "number" },
  { key: "avg_fsize_l", label: "Avg follicle size left (mm)", type: "number" },
  { key: "avg_fsize_r", label: "Avg follicle size right (mm)", type: "number" },
  { key: "endometrium", label: "Endometrium thickness (mm)", type: "number" },
];

export default function Home() {
  const [form, setForm] = useState<PCOSInput>(defaultValues);
  const [result, setResult] = useState<PCOSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (key: keyof PCOSInput, value: string) => {
    setForm(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictPCOS(form);
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">
            PCOS Clinical Dashboard
          </h1>
          <p className="text-slate-500 mt-2 text-sm">
            Calibrated ensemble model · AUROC 0.94 · 20 clinical features
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-5">
            Patient data
          </h2>

          <div className="grid grid-cols-2 gap-4">
            {fields.map(({ key, label, type, options }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500">
                  {label}
                </label>
                {type === "select" ? (
                  <select
                    value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {options?.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="number"
                    step="any"
                    value={form[key]}
                    onChange={e => handleChange(key, e.target.value)}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="mt-6 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {loading ? "Analysing..." : "Run prediction"}
          </button>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">
              {error}
            </p>
          )}
        </div>

        {result && <ResultCard result={result} />}

      </div>
    </main>
  );
}
