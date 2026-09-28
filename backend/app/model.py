from pathlib import Path
import os

import joblib
from sklearn.ensemble import RandomForestRegressor

from app.data import FEATURES, load_training_data

MODEL_DIR = Path(os.getenv("HOUSEANALYTICS_MODEL_DIR", "/tmp" if os.getenv("VERCEL") else Path(__file__).resolve().parents[1] / "models"))
MODEL_PATH = MODEL_DIR / "house_price_model_v2.joblib"
MODEL_NAME = "Random Forest"


def load_or_train_model():
    if MODEL_PATH.exists():
        return joblib.load(MODEL_PATH)

    features, prices = load_training_data()
    model = RandomForestRegressor(
        n_estimators=120,
        min_samples_leaf=2,
        max_features=0.9,
        random_state=42,
        n_jobs=1,
    )
    model.fit(features, prices)
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, MODEL_PATH)
    return model


def predict_price(model, property_features: dict[str, float]) -> dict[str, float | str]:
    import numpy as np

    row = np.array([[property_features[name] for name in FEATURES]])
    estimate = float(model.predict(row)[0])
    trees = np.array([tree.predict(row)[0] for tree in model.estimators_])
    low, high = np.percentile(trees, [10, 90])
    spread = max((high - low) / 2, estimate * 0.06)
    return {
        "predicted_price": round(estimate, 2),
        "lower_bound": round(max(150000, estimate - spread), 2),
        "upper_bound": round(estimate + spread, 2),
        "model_name": MODEL_NAME,
    }