"use client";
import { PCOSResult } from "@/lib/api";
import ShapChart from "./ShapChart";

interface Props {
  result: PCOSResult;
}

export default function ResultCard({ result }: Props) {
  const isPositive = result.prediction === 1;
  const pct = Math.round(result.probability * 100);

  return (
    <div className={`rounded-2xl border-2 p-6 mt-6 ${
      isPositive
        ? "border-red-300 bg-red-50"
        : "border-green-300 bg-green-50"
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Diagnosis
          </p>
          <p className={`text-2xl font-bold mt-1 ${
            isPositive ? "text-red-600" : "text-green-600"
          }`}>
            {result.label}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Probability
          </p>
          <p className={`text-4xl font-bold mt-1 ${
            isPositive ? "text-red-600" : "text-green-600"
          }`}>
            {pct}%
          </p>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600">
          Confidence: {result.confidence}
        </span>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-white border border-slate-200 text-slate-600">
          Model AUROC: {result.model_auroc}
        </span>
      </div>

      <div className="bg-white rounded-xl p-4 border border-slate-100">
        <ShapChart shapValues={result.top_shap_values} />
      </div>

      {isPositive && (
        <p className="text-xs text-slate-500 mt-4 leading-relaxed">
          This is a clinical decision support tool only. Please consult a
          qualified gynaecologist or endocrinologist for diagnosis and treatment.
        </p>
      )}
    </div>
  );
}
