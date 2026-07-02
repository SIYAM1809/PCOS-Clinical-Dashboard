import numpy as np
import pandas as pd
import shap
from fastapi import APIRouter, HTTPException
from app.models.pcos_input import PCOSInput
from app.services.model_loader import load_models

router = APIRouter()

# All 41 features in the exact order the scaler was fitted on
ALL_FEATURES = [
    "Age (yrs)", "Weight (Kg)", "Height(Cm)", "BMI", "Blood Group",
    "Pulse rate(bpm)", "RR (breaths/min)", "Hb(g/dl)", "Cycle(R/I)",
    "Cycle length(days)", "Marraige Status (Yrs)", "Pregnant(Y/N)",
    "No. of aborptions", "I   beta-HCG(mIU/mL)", "II    beta-HCG(mIU/mL)",
    "FSH(mIU/mL)", "LH(mIU/mL)", "FSH/LH", "Hip(inch)", "Waist(inch)",
    "Waist:Hip Ratio", "TSH (mIU/L)", "AMH(ng/mL)", "PRL(ng/mL)",
    "Vit D3 (ng/mL)", "PRG(ng/mL)", "RBS(mg/dl)", "Weight gain(Y/N)",
    "hair growth(Y/N)", "Skin darkening (Y/N)", "Hair loss(Y/N)",
    "Pimples(Y/N)", "Fast food (Y/N)", "Reg.Exercise(Y/N)",
    "BP _Systolic (mmHg)", "BP _Diastolic (mmHg)", "Follicle No. (L)",
    "Follicle No. (R)", "Avg. F size (L) (mm)", "Avg. F size (R) (mm)",
    "Endometrium (mm)"
]

@router.post("/predict")
async def predict(data: PCOSInput):
    try:
        artifacts = load_models()
        selected_features = artifacts["selected_features"]

        # Build full 41-feature vector with median/default values for non-input features
        # These defaults are the training set medians for features not collected in the form
        feature_defaults = {f: 0.0 for f in ALL_FEATURES}

        # Fill in the 20 features we actually collect
        feature_defaults["Age (yrs)"]              = data.age
        feature_defaults["Weight (Kg)"]            = data.weight
        feature_defaults["BMI"]                    = data.bmi
        feature_defaults["Cycle(R/I)"]             = data.cycle
        feature_defaults["Cycle length(days)"]     = data.cycle_length
        feature_defaults["Marraige Status (Yrs)"]  = data.marriage_years
        feature_defaults["Hip(inch)"]              = data.hip
        feature_defaults["Waist(inch)"]            = data.waist
        feature_defaults["AMH(ng/mL)"]             = data.amh
        feature_defaults["Weight gain(Y/N)"]       = data.weight_gain
        feature_defaults["hair growth(Y/N)"]       = data.hair_growth
        feature_defaults["Skin darkening (Y/N)"]   = data.skin_darkening
        feature_defaults["Hair loss(Y/N)"]         = data.hair_loss
        feature_defaults["Pimples(Y/N)"]           = data.pimples
        feature_defaults["Fast food (Y/N)"]        = data.fast_food
        feature_defaults["Follicle No. (L)"]       = data.follicle_l
        feature_defaults["Follicle No. (R)"]       = data.follicle_r
        feature_defaults["Avg. F size (L) (mm)"]   = data.avg_fsize_l
        feature_defaults["Avg. F size (R) (mm)"]   = data.avg_fsize_r
        feature_defaults["Endometrium (mm)"]       = data.endometrium

        # Fill non-collected features with training medians
        feature_defaults["Height(Cm)"]             = 158.0
        feature_defaults["Blood Group"]            = 15.0
        feature_defaults["Pulse rate(bpm)"]        = 78.0
        feature_defaults["RR (breaths/min)"]       = 18.0
        feature_defaults["Hb(g/dl)"]               = 12.2
        feature_defaults["Pregnant(Y/N)"]          = 0.0
        feature_defaults["No. of aborptions"]      = 0.0
        feature_defaults["I   beta-HCG(mIU/mL)"]  = 17.5
        feature_defaults["II    beta-HCG(mIU/mL)"] = 17.5
        feature_defaults["FSH(mIU/mL)"]            = 6.4
        feature_defaults["LH(mIU/mL)"]             = 6.2
        feature_defaults["FSH/LH"]                 = 1.0
        feature_defaults["Waist:Hip Ratio"]        = 0.8
        feature_defaults["TSH (mIU/L)"]            = 2.2
        feature_defaults["PRL(ng/mL)"]             = 16.5
        feature_defaults["Vit D3 (ng/mL)"]         = 19.0
        feature_defaults["PRG(ng/mL)"]             = 0.7
        feature_defaults["RBS(mg/dl)"]             = 89.0
        feature_defaults["Reg.Exercise(Y/N)"]      = 0.0
        feature_defaults["BP _Systolic (mmHg)"]    = 120.0
        feature_defaults["BP _Diastolic (mmHg)"]   = 80.0

        # Build full DataFrame in correct column order
        X_raw = pd.DataFrame([[feature_defaults[f] for f in ALL_FEATURES]], columns=ALL_FEATURES)

        # Scale all 41 features, then select top 20
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
