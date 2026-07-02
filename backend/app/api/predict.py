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

        config            = artifacts["inference_config"]
        all_features      = config["all_features"]
        feature_medians   = config["feature_medians"]
        selected_features = config["selected_features"]

        # Start with training medians for all 41 features
        row = {f: feature_medians[f] for f in all_features}

        # Override with actual user input for the 20 collected features
        row["Age (yrs)"]              = data.age
        row["Weight (Kg)"]            = data.weight
        row["BMI"]                    = data.bmi
        row["Cycle(R/I)"]             = data.cycle
        row["Cycle length(days)"]     = data.cycle_length
        row["Marraige Status (Yrs)"]  = data.marriage_years
        row["Hip(inch)"]              = data.hip
        row["Waist(inch)"]            = data.waist
        row["AMH(ng/mL)"]             = data.amh
        row["Weight gain(Y/N)"]       = data.weight_gain
        row["hair growth(Y/N)"]       = data.hair_growth
        row["Skin darkening (Y/N)"]   = data.skin_darkening
        row["Hair loss(Y/N)"]         = data.hair_loss
        row["Pimples(Y/N)"]           = data.pimples
        row["Fast food (Y/N)"]        = data.fast_food
        row["Follicle No. (L)"]       = data.follicle_l
        row["Follicle No. (R)"]       = data.follicle_r
        row["Avg. F size (L) (mm)"]   = data.avg_fsize_l
        row["Avg. F size (R) (mm)"]   = data.avg_fsize_r
        row["Endometrium (mm)"]       = data.endometrium

        # Build DataFrame in exact column order the scaler was fitted on
        X_raw      = pd.DataFrame([row], columns=all_features)
        X_scaled   = artifacts["scaler"].transform(X_raw)
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

        shap_dict = dict(zip(selected_features, shap_values))
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
