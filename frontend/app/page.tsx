"use client";
import { useState, useEffect } from "react";
import { predictPCOS, getMetadata, PCOSInput, PCOSResult } from "./lib/api";
import ShapChart from "./components/ShapChart";

type Panel = "result" | "audit" | "model" | "about";

interface AuditEntry {
  id: string; ts: string; label: string;
  probability: number; isPositive: boolean; confidence: string;
}

interface Meta {
  auroc: number; accuracy: number; f1: number;
  precision: number; recall: number; n_features: number;
  selected_features: string[]; models: string[]; n_samples: number;
}

const DEFAULT: PCOSInput = {
  age: 28, weight: 65, bmi: 24.0, cycle: 2, cycle_length: 35,
  marriage_years: 2, hip: 38, waist: 32, amh: 5.0, weight_gain: 1,
  hair_growth: 1, skin_darkening: 1, hair_loss: 0, pimples: 1,
  fast_food: 1, follicle_l: 13, follicle_r: 15,
  avg_fsize_l: 18, avg_fsize_r: 20, endometrium: 10,
};

const NUMERIC = [
  { key: "age" as keyof PCOSInput, label: "Age (years)" },
  { key: "weight" as keyof PCOSInput, label: "Weight (kg)" },
  { key: "bmi" as keyof PCOSInput, label: "BMI" },
  { key: "cycle_length" as keyof PCOSInput, label: "Cycle length (days)" },
  { key: "amh" as keyof PCOSInput, label: "AMH (ng/mL)" },
  { key: "follicle_l" as keyof PCOSInput, label: "Follicle count (L)" },
  { key: "follicle_r" as keyof PCOSInput, label: "Follicle count (R)" },
  { key: "avg_fsize_l" as keyof PCOSInput, label: "Avg F size L (mm)" },
  { key: "avg_fsize_r" as keyof PCOSInput, label: "Avg F size R (mm)" },
  { key: "endometrium" as keyof PCOSInput, label: "Endometrium (mm)" },
  { key: "waist" as keyof PCOSInput, label: "Waist (inches)" },
  { key: "hip" as keyof PCOSInput, label: "Hip (inches)" },
  { key: "marriage_years" as keyof PCOSInput, label: "Years married" },
];

const SYMPTOMS = [
  { key: "weight_gain" as keyof PCOSInput, label: "Weight gain", icon: "⚖️" },
  { key: "hair_growth" as keyof PCOSInput, label: "Hair growth", icon: "🌿" },
  { key: "skin_darkening" as keyof PCOSInput, label: "Skin darkening", icon: "🔆" },
  { key: "hair_loss" as keyof PCOSInput, label: "Hair loss", icon: "💇" },
  { key: "pimples" as keyof PCOSInput, label: "Pimples", icon: "🔴" },
  { key: "fast_food" as keyof PCOSInput, label: "Fast food", icon: "🍔" },
];

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return new Date(iso).toLocaleDateString();
}

export default function Home() {
  const [form, setForm] = useState<PCOSInput>(DEFAULT);
  const [result, setResult] = useState<PCOSResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("result");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [meta, setMeta] = useState<Meta | null>(null);

  useEffect(() => {
    getMetadata().then(setMeta).catch(() => null);
    try {
      const s = localStorage.getItem("pcos-audit");
      if (s) setAudit(JSON.parse(s));
    } catch { /* ignore */ }
  }, []);

  const set = (k: keyof PCOSInput, v: number) => setForm(p => ({ ...p, [k]: v }));
  const toggle = (k: keyof PCOSInput) => setForm(p => ({ ...p, [k]: p[k] === 1 ? 0 : 1 }));

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const res = await predictPCOS(form);
      setResult(res); setPanel("result");
      const entry: AuditEntry = {
        id: Date.now().toString(), ts: new Date().toISOString(),
        label: res.label, probability: res.probability,
        isPositive: res.prediction === 1, confidence: res.confidence,
      };
      const next = [entry, ...audit].slice(0, 30);
      setAudit(next);
      localStorage.setItem("pcos-audit", JSON.stringify(next));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Prediction failed");
    } finally { setLoading(false); }
  };

  const TABS: { id: Panel; label: string }[] = [
    { id: "result", label: "Prediction" },
    { id: "audit", label: "Audit log" },
    { id: "model", label: "Model info" },
    { id: "about", label: "About" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* ── Navbar ── */}
      <nav style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="pulse-dot" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", display: "inline-block" }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>PCOS Clinical Dashboard</span>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>
              Calibrated soft-voting ensemble · AUROC {meta?.auroc ?? "—"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setPanel(t.id)}
                className={`nav-tab${panel === t.id ? " active" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 24px", display: "flex", gap: 20, alignItems: "flex-start" }}>

        {/* ── LEFT: Form ── */}
        <div style={{ width: "42%", flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Metrics bar */}
          {meta && (
            <div className="card fade-in">
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>
                Model Performance
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { label: "AUROC", val: meta.auroc, color: "var(--cyan)" },
                  { label: "Accuracy", val: `${(meta.accuracy * 100).toFixed(1)}%`, color: "var(--purple)" },
                  { label: "F1 score", val: meta.f1.toFixed(3), color: "var(--amber)" },
                ].map(m => (
                  <div key={m.label} className="metric-chip">
                    <p style={{ fontSize: 22, fontWeight: 700, color: m.color }}>{m.val}</p>
                    <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Patient inputs */}
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase" }}>
                Patient Data
              </p>
              <select value={form.cycle} onChange={e => set("cycle", +e.target.value)} className="input-field" style={{ width: "auto", fontSize: 12, padding: "4px 8px" }}>
                <option value={1}>Regular cycle</option>
                <option value={2}>Irregular cycle</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {NUMERIC.map(({ key, label }) => (
                <div key={key}>
                  <label style={{ fontSize: 11, color: "var(--text-muted)", display: "block", marginBottom: 4 }}>{label}</label>
                  <input type="number" step="any" value={form[key] as number}
                    onChange={e => set(key, parseFloat(e.target.value) || 0)}
                    className="input-field" />
                </div>
              ))}
            </div>

            {/* Symptom badges */}
            <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Symptoms present</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {SYMPTOMS.map(({ key, label, icon }) => (
                  <button key={key} onClick={() => toggle(key)}
                    className={`badge${form[key] === 1 ? " active" : ""}`}>
                    <span>{icon}</span>{label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run button */}
            <button onClick={run} disabled={loading} className="run-btn" style={{ marginTop: 20 }}>
              {loading
                ? (<><span className="spin" style={{ width: 16, height: 16, border: "2px solid currentColor", borderTopColor: "transparent", borderRadius: "50%", display: "inline-block" }} />Analysing…</>)
                : "Run prediction"}
            </button>

            {error && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "var(--red)", fontSize: 12 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT: Panels ── */}
        <div style={{ flex: 1 }}>
          {/* Panel tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 20 }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setPanel(t.id)}
                className={`panel-tab${panel === t.id ? " active" : ""}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* ── Result panel ── */}
          {panel === "result" && (
            <div className="fade-in">
              {!result && !loading && (
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 12 }}>
                  <div style={{ fontSize: 40 }}>🔬</div>
                  <p style={{ color: "var(--text-secondary)", fontWeight: 600 }}>No prediction yet</p>
                  <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center" }}>
                    Fill in the patient data on the left and click <strong>Run prediction</strong> to get a diagnosis.
                  </p>
                </div>
              )}

              {loading && (
                <div className="card" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 280, gap: 16 }}>
                  <span className="spin" style={{ width: 40, height: 40, border: "3px solid var(--border)", borderTopColor: "var(--cyan)", borderRadius: "50%", display: "inline-block" }} />
                  <p style={{ color: "var(--text-muted)", fontSize: 13 }}>Running ensemble inference…</p>
                </div>
              )}

              {result && !loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {/* Result card */}
                  <div className={`card glow-card ${result.prediction === 1 ? "result-positive" : "result-negative"}`}
                    style={{ border: "1px solid" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                      <div>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>DIAGNOSIS</p>
                        <p style={{ fontSize: 26, fontWeight: 800, color: result.prediction === 1 ? "var(--red)" : "var(--green)" }}>
                          {result.label}
                        </p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>PROBABILITY</p>
                        <p style={{ fontSize: 40, fontWeight: 800, color: result.prediction === 1 ? "var(--red)" : "var(--green)", lineHeight: 1 }}>
                          {Math.round(result.probability * 100)}%
                        </p>
                      </div>
                    </div>
                    {/* Probability bar */}
                    <div style={{ background: "var(--bg-secondary)", borderRadius: 100, height: 6, marginBottom: 16, overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 100,
                        width: `${Math.round(result.probability * 100)}%`,
                        background: result.prediction === 1 ? "var(--red)" : "var(--green)",
                        transition: "width 0.8s ease-out",
                      }} />
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {[
                        { label: "Confidence", val: result.confidence },
                        { label: "AUROC", val: result.model_auroc },
                        { label: "Models", val: "3 ensemble" },
                      ].map(b => (
                        <span key={b.label} style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "var(--bg-secondary)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                          {b.label}: {b.val}
                        </span>
                      ))}
                    </div>
                    {result.prediction === 1 && (
                      <p style={{ marginTop: 14, fontSize: 11, color: "var(--text-muted)", lineHeight: 1.6, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
                        ⚠️ Clinical decision support tool only. Consult a qualified gynaecologist or endocrinologist for diagnosis and treatment.
                      </p>
                    )}
                  </div>

                  {/* SHAP chart */}
                  <div className="card">
                    <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>
                      Explainability — SHAP Values
                    </p>
                    <ShapChart shapValues={result.top_shap_values} />
                  </div>

                  {/* Recent audit preview */}
                  {audit.length > 0 && (
                    <div className="card">
                      <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 14 }}>
                        Recent Predictions
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {audit.slice(0, 4).map(e => (
                          <div key={e.id} className="slide-in" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderRadius: 8, background: "var(--bg-secondary)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <span style={{ width: 7, height: 7, borderRadius: "50%", background: e.isPositive ? "var(--red)" : "var(--green)", display: "inline-block", flexShrink: 0 }} />
                              <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{e.label} — {Math.round(e.probability * 100)}%</span>
                            </div>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{timeAgo(e.ts)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Audit log panel ── */}
          {panel === "audit" && (
            <div className="fade-in">
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
                    Prediction history ({audit.length})
                  </p>
                  {audit.length > 0 && (
                    <button onClick={() => { setAudit([]); localStorage.removeItem("pcos-audit"); }}
                      style={{ fontSize: 12, color: "var(--red)", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "4px 10px", cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>
                {audit.length === 0
                  ? <p style={{ color: "var(--text-muted)", fontSize: 13, textAlign: "center", padding: "40px 0" }}>No predictions yet. Run a prediction to see the audit log.</p>
                  : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {audit.map((e, i) => (
                        <div key={e.id} className="slide-in" style={{ animationDelay: `${i * 30}ms`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderRadius: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.isPositive ? "var(--red)" : "var(--green)", display: "inline-block", flexShrink: 0 }} />
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: e.isPositive ? "var(--red)" : "var(--green)" }}>{e.label}</p>
                              <p style={{ fontSize: 11, color: "var(--text-muted)" }}>Probability: {Math.round(e.probability * 100)}% · Confidence: {e.confidence}</p>
                            </div>
                          </div>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", flexShrink: 0 }}>{timeAgo(e.ts)}</span>
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* ── Model info panel ── */}
          {panel === "model" && meta && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 16 }}>Performance Metrics</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "AUROC", val: meta.auroc, color: "var(--cyan)" },
                    { label: "Accuracy", val: `${(meta.accuracy * 100).toFixed(1)}%`, color: "var(--purple)" },
                    { label: "F1 Score", val: meta.f1.toFixed(3), color: "var(--amber)" },
                    { label: "Precision", val: meta.precision.toFixed(3), color: "var(--green)" },
                    { label: "Recall", val: meta.recall.toFixed(3), color: "var(--red)" },
                    { label: "Features", val: meta.n_features, color: "var(--text-secondary)" },
                  ].map(m => (
                    <div key={m.label} className="metric-chip" style={{ textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</span>
                      <span style={{ fontSize: 16, fontWeight: 700, color: m.color }}>{m.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Architecture</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    { icon: "🤖", title: "Ensemble method", desc: "Calibrated soft-voting of XGBoost, LightGBM, and CatBoost" },
                    { icon: "📊", title: "Dataset", desc: `${meta.n_samples} clinical records — PCOS data without infertility` },
                    { icon: "🔬", title: "Feature selection", desc: `${meta.n_features} features selected via ANOVA F-score from full clinical panel` },
                    { icon: "🧠", title: "Explainability", desc: "SHAP TreeExplainer for per-prediction feature attribution" },
                    { icon: "☁️", title: "Model hosting", desc: "HuggingFace Hub — SIYAM1809/pcos-clinical-ensemble" },
                  ].map(i => (
                    <div key={i.title} style={{ display: "flex", gap: 12, padding: "12px 14px", borderRadius: 10, background: "var(--bg-secondary)" }}>
                      <span style={{ fontSize: 20, flexShrink: 0 }}>{i.icon}</span>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2 }}>{i.title}</p>
                        <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{i.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── About panel ── */}
          {panel === "about" && (
            <div className="fade-in" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="card">
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                  <span className="pulse-dot" style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--red)", display: "inline-block", flexShrink: 0 }} />
                  <div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>PCOS Clinical Dashboard</p>
                    <p style={{ fontSize: 12, color: "var(--text-muted)" }}>Production-grade clinical ML system · v1.0.0</p>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 16 }}>
                  This dashboard provides a calibrated ensemble machine learning model for detecting Polycystic Ovary Syndrome (PCOS) from 20 clinical parameters. The system uses an explainable AI approach through SHAP values to explain individual predictions.
                </p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { label: "Model type", val: "Ensemble (XGB + LGBM + Cat)" },
                    { label: "Calibration", val: "Isotonic regression" },
                    { label: "AUROC", val: "0.9401" },
                    { label: "Training samples", val: "432 records" },
                    { label: "Framework", val: "FastAPI + Next.js 16" },
                    { label: "Deployment", val: "Render + Vercel" },
                  ].map(s => (
                    <div key={s.label} style={{ padding: "10px 14px", borderRadius: 8, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 2 }}>{s.label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{s.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 12 }}>Disclaimer</p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.7 }}>
                  This tool is designed to assist clinical professionals in decision making. It is not a replacement for professional medical diagnosis. All predictions should be reviewed by a qualified healthcare provider before any clinical action is taken.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
