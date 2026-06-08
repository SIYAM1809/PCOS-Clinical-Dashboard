const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export interface PCOSInput {
  age: number;
  weight: number;
  bmi: number;
  cycle: number;
  cycle_length: number;
  marriage_years: number;
  hip: number;
  waist: number;
  amh: number;
  weight_gain: number;
  hair_growth: number;
  skin_darkening: number;
  hair_loss: number;
  pimples: number;
  fast_food: number;
  follicle_l: number;
  follicle_r: number;
  avg_fsize_l: number;
  avg_fsize_r: number;
  endometrium: number;
}

export interface PCOSResult {
  prediction: number;
  probability: number;
  label: string;
  confidence: string;
  top_shap_values: Record<string, number>;
  model_auroc: number;
}

export async function predictPCOS(input: PCOSInput): Promise<PCOSResult> {
  const res = await fetch(`${API_BASE}/api/v1/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Prediction failed");
  }
  return res.json();
}

export async function getMetadata() {
  const res = await fetch(`${API_BASE}/api/v1/metadata`);
  return res.json();
}
