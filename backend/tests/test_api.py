from fastapi.testclient import TestClient

from app.data import build_market_summary, load_properties, load_training_data
from app.main import app
from app.model import load_or_train_model, predict_price


def test_model_returns_positive_price_and_range():
    model = load_or_train_model()
    result = predict_price(model, {
        "sqft": 2100,
        "bedrooms": 3,
        "bathrooms": 2,
        "year_built": 2005,
        "lot_sqft": 5000,
        "zipcode": 98103,
    })

    assert result["predicted_price"] > 150000
    assert result["lower_bound"] < result["predicted_price"] < result["upper_bound"]
    assert result["model_name"] == "Random Forest"


def test_real_dataset_has_expected_records_and_training_features():
    properties = load_properties()
    features, prices = load_training_data()

    assert len(properties) > 20000
    assert features.shape == (len(properties), 6)
    assert prices.shape == (len(properties),)
    assert properties[0]["zipcode"].startswith("9")
    assert properties[0]["sale_date"]


def test_market_summary_is_computed_from_real_sales():
    summary = build_market_summary(load_properties())

    assert summary["records_analyzed"] > 20000
    assert summary["median_sale_price"] > 100000
    assert len(summary["monthly"]) >= 12
    assert summary["top_areas"]


def test_api_prediction_and_property_search():
    with TestClient(app) as client:
        prediction = client.post("/api/predict", json={
            "sqft": 1900,
            "bedrooms": 3,
            "bathrooms": 2,
            "year_built": 2000,
            "lot_sqft": 4500,
            "zipcode": 98103,
        })
        properties = client.get("/api/properties", params={"search": "Seattle", "limit": 3})
        summary = client.get("/api/market-summary")

    assert prediction.status_code == 200
    assert prediction.json()["predicted_price"] > 0
    assert properties.status_code == 200
    assert properties.json()["items"]
    assert all("Seattle" in item["city"] for item in properties.json()["items"])
    assert summary.json()["records_analyzed"] > 20000