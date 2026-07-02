import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, HTTPException
from app.models.pcos_input import PCOSInput
from app.services.model_loader import load_models

router = APIRouter()

@router.post("/predict")
async def predict(data: PCOSInput):
    try:
        artifacts = load_models()

        feature_values = [
            data.age, data.weight, data.bmi, data.cycle,
            data.cycle_length, data.marriage_years, data.hip,
            data.waist, data.amh, data.weight_gain, data.hair_growth,
            data.skin_darkening, data.hair_loss, data.pimples,
            data.fast_food, data.follicle_l, data.follicle_r,
            data.avg_fsize_l, data.avg_fsize_r, data.endometrium
        ]

        features = artifacts["selected_features"]

        # Use named DataFrame to match training environment exactly
        X_raw = pd.DataFrame([feature_values], columns=features)
        X_scaled = artifacts["scaler"].transform(X_raw)
        X_selected = artifacts["selector"].transform(X_scaled)

        xgb_prob  = artifacts["xgb_calibrated"].predict_proba(X_selected)[0][1]
        lgbm_prob = artifacts["lgbm_calibrated"].predict_proba(X_selected)[0][1]
        cat_prob  = artifacts["cat_calibrated"].predict_proba(X_selected)[0][1]

        ensemble_prob = float((xgb_prob + lgbm_prob + cat_prob) / 3)
        prediction    = int(ensemble_prob >= 0.5)

        explainer = shap.TreeExplainer(
            artifacts["xgb_calibrated"].calibrated_classifiers_[0].estimator
        )
        shap_values = explainer.shap_values(X_selected)[0].tolist()

        shap_dict = dict(zip(features, shap_values))
        top_shap  = dict(
            sorted(shap_dict.items(), key=lambda x: abs(x[1]), reverse=True)[:5]
        )

        return {
            "prediction":      prediction,
            "probability":     round(ensemble_prob, 4),
            "label":           "PCOS Detected" if prediction == 1 else "No PCOS Detected",
            "confidence":      "High" if ensemble_prob > 0.75 or ensemble_prob < 0.25 else "Moderate",
            "top_shap_values": top_shap,
            "model_auroc":     artifacts["metadata"]["auroc"]
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metadata")
async def get_metadata():
    artifacts = load_models()
    return artifacts["metadata"]
