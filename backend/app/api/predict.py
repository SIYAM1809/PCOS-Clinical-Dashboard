import numpy as np
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

        X_raw = np.array(feature_values)
        
        # The scaler expects 41 features, but we only have the 20 selected features.
        # We map our 20 features back to their original positions in the 41-feature array.
        n_features = artifacts["scaler"].n_features_in_
        X_full = np.zeros((1, n_features))
        
        # Get the boolean mask of selected features
        support = artifacts["selector"].get_support()
        X_full[0, support] = X_raw
        
        # Scale the full array
        X_scaled_full = artifacts["scaler"].transform(X_full)
        
        # Extract just the 20 scaled features
        X_selected = artifacts["selector"].transform(X_scaled_full)

        xgb_prob  = artifacts["xgb_calibrated"].predict_proba(X_selected)[0][1]
        lgbm_prob = artifacts["lgbm_calibrated"].predict_proba(X_selected)[0][1]
        cat_prob  = artifacts["cat_calibrated"].predict_proba(X_selected)[0][1]

        ensemble_prob = float((xgb_prob + lgbm_prob + cat_prob) / 3)
        prediction    = int(ensemble_prob >= 0.5)

        explainer = shap.TreeExplainer(
            artifacts["xgb_calibrated"].calibrated_classifiers_[0].estimator
        )
        shap_values = explainer.shap_values(X_selected)[0].tolist()

        features  = artifacts["selected_features"]
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
