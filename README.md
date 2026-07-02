<div align="center">

#  PCOS Clinical Dashboard

### A production-grade, full-stack clinical AI system for PCOS detection

[![Live App](https://img.shields.io/badge/Live%20App-Vercel-black?style=for-the-badge&logo=vercel)](https://pcos-clinical-dashboard.vercel.app)
[![Backend API](https://img.shields.io/badge/Backend%20API-Render-46E3B7?style=for-the-badge&logo=render)](https://pcos-backend-quq3.onrender.com/health)
[![Models](https://img.shields.io/badge/Models-HuggingFace-FFD21E?style=for-the-badge&logo=huggingface)](https://huggingface.co/SIYAM1809/pcos-clinical-ensemble)
[![W&B](https://img.shields.io/badge/Experiments-W%26B-FFBE00?style=for-the-badge&logo=weightsandbiases)](https://wandb.ai)
[![Docker](https://img.shields.io/badge/Docker-Hub-2496ED?style=for-the-badge&logo=docker)](https://hub.docker.com/r/siyam18/pcos-backend)

[![CI](https://github.com/SIYAM1809/PCOS-Clinical-Dashboard/actions/workflows/ci.yml/badge.svg)](https://github.com/SIYAM1809/PCOS-Clinical-Dashboard/actions/workflows/ci.yml)
[![Docker Publish](https://github.com/SIYAM1809/PCOS-Clinical-Dashboard/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/SIYAM1809/PCOS-Clinical-Dashboard/actions/workflows/docker-publish.yml)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=flat&logo=python)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

<br/>

> **AUROC 0.94 · Calibrated Ensemble · SHAP Explainability · End-to-End Deployed · 100% Free Tier**

<br/>

## Screenshots

### PCOS Detected — High Confidence (88%)
![PCOS Detected](https://raw.githubusercontent.com/SIYAM1809/PCOS-Clinical-Dashboard/main/assets/demo_positive.jpeg)

### No PCOS Detected — Moderate Confidence (46%)
![No PCOS Moderate](https://raw.githubusercontent.com/SIYAM1809/PCOS-Clinical-Dashboard/main/assets/demo_negative_moderate.jpeg)

### No PCOS Detected — High Confidence (4%)
![No PCOS High](https://raw.githubusercontent.com/SIYAM1809/PCOS-Clinical-Dashboard/main/assets/demo_negative_high.jpeg)
*Clinical input form → ensemble prediction → SHAP explainability — all in one interface*

</div>

---

## 📌 Table of Contents

- [Overview](#overview)
- [Research Background](#research-background)
- [Live Demo](#live-demo)
- [Key Results](#key-results)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Dataset](#dataset)
- [ML Pipeline](#ml-pipeline)
- [SHAP Explainability](#shap-explainability)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Local Setup](#local-setup)
- [CI/CD Pipeline](#cicd-pipeline)
- [Deployment](#deployment)
- [Limitations](#limitations)
- [Author](#author)

---

## Overview

The **PCOS Clinical Dashboard** is a production-grade, full-stack machine learning application that assists clinicians in screening patients for **Polycystic Ovary Syndrome (PCOS)** a condition affecting 8–13% of women of reproductive age worldwide and a leading cause of infertility.

A clinician enters 20 routine clinical measurements into a web form. The system runs a **calibrated soft-voting ensemble** of three gradient boosting models, returns a diagnosis with a probability score, and explains the prediction using **SHAP feature attribution** — rendered as an interactive chart.

The entire system is built and deployed on **free-tier infrastructure only**: Kaggle (training), HuggingFace (model storage), Render (backend), and Vercel (frontend).

### Why this project exists

Standard PCOS diagnosis requires ultrasound imaging — expensive, specialist-dependent, and inaccessible in resource-constrained settings. This project demonstrates that **routine clinical data** (blood tests, symptoms, anthropometric measurements) is sufficient for high-accuracy screening, outperforming image-based diagnosis at a fraction of the cost.

---

## Research Background

This project is the production implementation of a peer-reviewed benchmark:

> **"Clinical vs. Ultrasound for PCOS Detection: A Calibrated, Leakage-Safe, Real-Time Benchmark"**
> *Accepted at ICCIT 2025 (International Conference on Computer and Information Technology)*

**Key finding:** The calibrated clinical ensemble (AUROC 0.976 on the full study) substantially outperformed a ConvNeXt ultrasound image model (AUROC 0.814) from the same dataset, with **2.6× higher batch throughput** — providing evidence for clinical-data-first pipelines in resource-constrained settings.

| Repository | Description |
|---|---|
| [Ultrasound-PCOS](https://github.com/SIYAM1809/Ultrasound-PCOS) | Image-based ConvNeXt pipeline |
| [Tabular-PCOS](https://github.com/SIYAM1809/Tabular-PCOS) | Clinical ensemble benchmark |

---

## Live Demo

| Service | URL | Status |
|---|---|---|
| 🌐 Frontend | [pcos-clinical-dashboard.vercel.app](https://pcos-clinical-dashboard.vercel.app) | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| ⚡ Backend API | [pcos-backend-quq3.onrender.com](https://pcos-backend-quq3.onrender.com/health) | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| 🤗 Models | [HuggingFace Hub](https://huggingface.co/SIYAM1809/pcos-clinical-ensemble) | ![Live](https://img.shields.io/badge/status-live-brightgreen) |
| 📊 Experiments | [W&B Dashboard](https://wandb.ai) | ![Logged](https://img.shields.io/badge/status-logged-blue) |

> ⚠️ **Note:** The backend runs on Render's free tier and may take **30–60 seconds** to respond after a period of inactivity (cold start). Subsequent requests are fast.

---

## Key Results

| Metric | Score |
|---|---|
| **AUROC** | **0.9401** |
| **Accuracy** | **90.83%** |
| **F1 Score** | **0.8529** |
| **Precision** | **0.9062** |
| **Recall** | **0.8056** |

| Class | Precision | Recall | F1 |
|---|---|---|---|
| No PCOS | 0.91 | 0.96 | 0.93 |
| PCOS | 0.91 | 0.81 | 0.85 |

> The high precision (0.9062) minimises false positive referrals — when the model says PCOS Detected, it is correct 90.6% of the time.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        TRAINING LAYER                           │
│  Kaggle Dataset → Preprocessing → XGBoost + LightGBM + CatBoost│
│  → Calibration → SHAP Analysis → W&B Logging                   │
└────────────────────────────┬────────────────────────────────────┘
                             │ joblib artifacts
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MODEL STORAGE                              │
│              HuggingFace Hub (SIYAM1809/pcos-clinical-ensemble) │
│     xgb.pkl · lgbm.pkl · cat.pkl · scaler.pkl · selector.pkl   │
└────────────────────────────┬────────────────────────────────────┘
                             │ hf_hub_download on startup
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND (Render)                           │
│                    FastAPI + Uvicorn                            │
│   /health · /api/v1/predict · /api/v1/metadata                  │
│   Ensemble inference → SHAP → JSON response                     │
└────────────────────────────┬────────────────────────────────────┘
                             │ REST API
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (Vercel)                           │
│                  Next.js 16 + TypeScript                        │
│   Clinical input form → Result card → SHAP bar chart            │
└─────────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                       CI/CD (GitHub Actions)                    │
│   Lint (Ruff + ESLint) → Test (pytest) → Docker → Docker Hub   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Platform |
|---|---|---|
| ML Training | XGBoost, LightGBM, CatBoost, scikit-learn, SHAP | Kaggle (free GPU) |
| Experiment Tracking | Weights & Biases | W&B Cloud (free tier) |
| Model Storage | HuggingFace Hub | HuggingFace (free tier) |
| Backend | FastAPI, Uvicorn, Python 3.12, Pydantic | Render (free tier) |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, Recharts | Vercel (free tier) |
| Containerisation | Docker, docker-compose | Docker Hub |
| CI/CD | GitHub Actions | GitHub |

---

## Dataset

**Source:** [Kaggle — polycystic-ovary-syndrome-pcos](https://www.kaggle.com/datasets/prasoonkottarathil/polycystic-ovary-syndrome-pcos)

| Property | Value |
|---|---|
| File | PCOS_data_without_infertility.xlsx (sheet: Full_new) |
| Total records | 541 patients |
| Positive cases | 177 (32.7%) |
| Negative cases | 364 (67.3%) |
| Class imbalance ratio | 2.06 : 1 |
| Original features | 44 |
| Selected features | 20 (ANOVA F-score SelectKBest) |
| Train split | 432 samples (80%, stratified) |
| Test split | 109 samples (20%, stratified) |

### Selected features (20)

| Category | Features |
|---|---|
| Anthropometric | Age, Weight, BMI, Hip, Waist, Marriage years |
| Hormonal | AMH, Cycle regularity, Cycle length |
| Symptomatic | Weight gain, Hair growth, Skin darkening, Hair loss, Pimples, Fast food |
| Ultrasound | Follicle No. (L), Follicle No. (R), Avg F size (L), Avg F size (R), Endometrium |

---

## ML Pipeline

### 1. Preprocessing

```python
# Fix object dtypes
df["AMH(ng/mL)"] = pd.to_numeric(df["AMH(ng/mL)"], errors="coerce")

# Fill missing values with median
df = df.fillna(df.median(numeric_only=True))

# Scale and select features
scaler = StandardScaler()
selector = SelectKBest(f_classif, k=20)
```

### 2. Model training

```python
# XGBoost with class imbalance handling
xgb = XGBClassifier(scale_pos_weight=2.06, n_estimators=300, max_depth=4, learning_rate=0.05)

# LightGBM
lgbm = LGBMClassifier(class_weight="balanced", n_estimators=300)

# CatBoost
cat = CatBoostClassifier(auto_class_weights="Balanced", iterations=300)

# Isotonic calibration on each model
xgb_cal = CalibratedClassifierCV(xgb, cv="prefit", method="isotonic")
```

### 3. Soft-voting ensemble

```python
ensemble_prob = (xgb_cal.predict_proba(X)[:,1] +
                 lgbm_cal.predict_proba(X)[:,1] +
                 cat_cal.predict_proba(X)[:,1]) / 3
prediction = int(ensemble_prob >= 0.5)
```

---

## SHAP Explainability

Every prediction returns the top 5 contributing features with SHAP values:

| Rank | Feature | Mean |SHAP| | Clinical Meaning |
|---|---|---|---|
| 1 | Follicle No. (R) | 1.9455 | Primary Rotterdam criterion |
| 2 | Hair growth (Y/N) | 0.9447 | Hirsutism — androgen excess |
| 3 | Follicle No. (L) | 0.6917 | Left ovary morphology |
| 4 | Weight gain (Y/N) | 0.6524 | Metabolic symptom |
| 5 | Cycle regularity | 0.5862 | Menstrual irregularity |
| 6 | Skin darkening | 0.5740 | Insulin resistance marker |
| 7 | Pimples (Y/N) | 0.5063 | Androgen-driven acne |
| 8 | AMH (ng/mL) | 0.4858 | Ovarian reserve marker |

Red bars = increases PCOS risk · Green bars = decreases PCOS risk

---

## API Reference

### POST `/api/v1/predict`

**Request body:**

```json
{
  "age": 28,
  "weight": 68,
  "bmi": 25.2,
  "cycle": 2,
  "cycle_length": 35,
  "marriage_years": 2,
  "hip": 38,
  "waist": 32,
  "amh": 7.5,
  "weight_gain": 1,
  "hair_growth": 1,
  "skin_darkening": 1,
  "hair_loss": 0,
  "pimples": 1,
  "fast_food": 1,
  "follicle_l": 13,
  "follicle_r": 15,
  "avg_fsize_l": 18,
  "avg_fsize_r": 20,
  "endometrium": 10
}
```

**Response:**

```json
{
  "prediction": 1,
  "probability": 1.0,
  "label": "PCOS Detected",
  "confidence": "High",
  "top_shap_values": {
    "Follicle No. (R)": 2.6489,
    "Follicle No. (L)": 1.3957,
    "Skin darkening (Y/N)": 1.1567,
    "hair growth(Y/N)": 0.8776,
    "Marraige Status (Yrs)": 0.8162
  },
  "model_auroc": 0.9401
}
```

### GET `/health`

```json
{ "status": "ok", "version": "1.0.0" }
```

### GET `/api/v1/metadata`

Returns full model metadata including AUROC, accuracy, F1, selected features list, dataset info.

---

## Project Structure

```
PCOS-Clinical-Dashboard/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── predict.py          # Prediction & metadata endpoints
│   │   ├── core/
│   │   │   └── config.py           # Pydantic settings management
│   │   ├── models/
│   │   │   └── pcos_input.py       # Input validation schema
│   │   └── services/
│   │       └── model_loader.py     # HuggingFace artifact downloader
│   ├── tests/
│   │   └── test_health.py          # pytest health check
│   ├── main.py                     # FastAPI app entry point
│   ├── requirements.txt            # Pinned Python dependencies
│   └── Dockerfile                  # Backend container
│
├── frontend/
│   └── app/
│       ├── components/
│       │   ├── ResultCard.tsx      # Prediction result display
│       │   └── ShapChart.tsx       # Recharts SHAP bar chart
│       ├── lib/
│       │   └── api.ts              # TypeScript API client
│       └── page.tsx                # Main dashboard page
│
├── ml/
│   ├── training/
│   │   └── train.py                # Standalone training script
│   └── explainability/
│       └── shap_explain.py         # SHAP analysis utilities
│
├── notebooks/
│   └── training/                   # Kaggle training notebooks
│
├── .github/
│   └── workflows/
│       ├── ci.yml                  # Lint + test CI
│       └── docker-publish.yml      # Docker build + push
│
├── docker-compose.yml              # Local full-stack dev environment
├── render.yaml                     # Render deployment config
└── README.md
```

---

## Local Setup

### Prerequisites

- Python 3.12+ with `uv`
- Node.js 24+
- Docker Desktop
- Git

### Clone and run

```bash
git clone https://github.com/SIYAM1809/PCOS-Clinical-Dashboard.git
cd PCOS-Clinical-Dashboard
```

**Backend:**

```bash
cd backend
uv venv .venv --python 3.12
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Mac/Linux
uv pip install -r requirements.txt
uvicorn main:app --reload
# API running at http://127.0.0.1:8000
```

**Frontend (new terminal):**

```bash
cd frontend
npm install
npm run dev
# UI running at http://localhost:3000
```

**Full stack with Docker:**

```bash
docker-compose up --build
```

### Environment variables

Create a `.env` file in the project root:

```env
HF_TOKEN=your_huggingface_write_token
HF_REPO_ID=SIYAM1809/pcos-clinical-ensemble
WANDB_API_KEY=your_wandb_api_key
KAGGLE_USERNAME=your_kaggle_username
KAGGLE_KEY=your_kaggle_api_key
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

---

## CI/CD Pipeline

Two GitHub Actions workflows run on every push to `main`:

**CI workflow** (`ci.yml`):
1. Ruff linting on Python backend
2. ESLint on Next.js frontend
3. pytest health endpoint test

**Docker workflow** (`docker-publish.yml`):
1. Build FastAPI backend Docker image
2. Push to Docker Hub as `siyam18/pcos-backend:latest`

---

## Deployment

| Service | Platform | Configuration |
|---|---|---|
| Frontend | Vercel | Root dir: `frontend`, auto-deploy on push |
| Backend | Render | Root dir: `backend`, `render.yaml` config |
| Models | HuggingFace Hub | Downloaded at backend startup |
| Container | Docker Hub | Built via GitHub Actions |

---

## Limitations

- **Cold start:** Render free tier spins down after 15 min inactivity. First request after idle takes 30–60 seconds.
- **Single dataset:** Trained on 541 Bangladeshi patients. Cross-population validation not yet performed.
- **No authentication:** Current version has no auth layer. Not intended for production clinical use without RBAC.
- **sklearn version mismatch:** Models trained on Kaggle sklearn 1.6.1, loaded on 1.9.0. Functionally correct but produces warnings.

---

## Author

<div align="center">

**Md. Aman Uddin Siyam**

BSc in Computer Science & Engineering · IUBAT, Dhaka, Bangladesh (2022–2026)

Co-Founder, CollabCircle ML Research Group

[![Portfolio](https://img.shields.io/badge/Portfolio-Visit-blue?style=flat)](https://your-portfolio-link)
[![GitHub](https://img.shields.io/badge/GitHub-SIYAM1809-black?style=flat&logo=github)](https://github.com/SIYAM1809)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-amansiyam18-0077B5?style=flat&logo=linkedin)](https://linkedin.com/in/amansiyam18)
[![Kaggle](https://img.shields.io/badge/Kaggle-amansiyam-20BEFF?style=flat&logo=kaggle)](https://kaggle.com/amansiyam)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-SIYAM1809-FFD21E?style=flat&logo=huggingface)](https://huggingface.co/SIYAM1809)

📧 amansiyam44@gmail.com

</div>

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

**⭐ If this project helped you, please consider starring the repository**


</div> 
