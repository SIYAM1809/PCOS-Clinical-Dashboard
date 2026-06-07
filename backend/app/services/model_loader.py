import os
import joblib
import json
from huggingface_hub import hf_hub_download
from app.core.config import get_settings

settings = get_settings()
ARTIFACTS = {}

def load_models():
    global ARTIFACTS
    if ARTIFACTS:
        return ARTIFACTS

    os.makedirs(settings.MODEL_CACHE_DIR, exist_ok=True)

    files = [
        "xgb_calibrated.pkl",
        "lgbm_calibrated.pkl",
        "cat_calibrated.pkl",
        "scaler.pkl",
        "selector.pkl",
        "selected_features.json",
        "metadata.json"
    ]

    for filename in files:
        path = hf_hub_download(
            repo_id=settings.HF_REPO_ID,
            filename=filename,
            cache_dir=settings.MODEL_CACHE_DIR,
            token=settings.HF_TOKEN
        )
        key = filename.replace(".pkl", "").replace(".json", "")
        if filename.endswith(".json"):
            with open(path) as f:
                ARTIFACTS[key] = json.load(f)
        else:
            ARTIFACTS[key] = joblib.load(path)

    print("All models loaded successfully.")
    return ARTIFACTS
