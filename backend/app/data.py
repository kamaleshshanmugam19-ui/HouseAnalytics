import csv
from pathlib import Path

import numpy as np

DATA_PATH = Path(__file__).resolve().parents[1] / "data" / "kc_house_data.csv"
FEATURES = ["sqft", "bedrooms", "bathrooms", "year_built", "lot_sqft", "zipcode"]

ZIP_CITIES = {
    "98004": "Bellevue", "98005": "Bellevue", "98006": "Bellevue",
    "98007": "Bellevue", "98008": "Bellevue", "98033": "Kirkland",
    "98034": "Kirkland", "98052": "Redmond", "98053": "Redmond",
    "98074": "Sammamish", "98075": "Sammamish", "98027": "Issaquah",
    "98029": "Issaquah", "98038": "Maple Valley", "98039": "Medina",
    "98040": "Mercer Island", "98055": "Renton", "98056": "Renton",
    "98058": "Renton", "98059": "Renton", "98001": "Auburn",
    "98002": "Auburn", "98023": "Federal Way", "98003": "Federal Way",
    "98030": "Kent", "98031": "Kent", "98103": "Seattle",
    "98105": "Seattle", "98107": "Seattle", "98109": "Seattle",
    "98115": "Seattle", "98117": "Seattle", "98118": "Seattle",
    "98122": "Seattle", "98125": "Seattle", "98126": "Seattle",
    "98133": "Seattle", "98136": "Seattle", "98144": "Seattle",
    "98116": "Seattle", "98199": "Seattle", "98178": "Seattle",
}


def _records():
    with DATA_PATH.open(newline="", encoding="utf-8") as source:
        return list(csv.DictReader(source))


def load_properties() -> list[dict]:
    properties = []
    for row in _records():
        zipcode = row["zipcode"]
        sale_date = row["date"][:8]
        properties.append({
            "id": int(row["id"]),
            "address": f"King County sale #{row['id']}",
            "city": ZIP_CITIES.get(zipcode, "King County"),
            "zipcode": zipcode,
            "type": "Single family",
            "beds": int(float(row["bedrooms"])),
            "baths": float(row["bathrooms"]),
            "sqft": int(row["sqft_living"]),
            "year_built": int(row["yr_built"]),
            "price": int(float(row["price"])),
            "grade": int(row["grade"]),
            "sale_date": f"{sale_date[:4]}-{sale_date[4:6]}-{sale_date[6:8]}",
        })
    return sorted(properties, key=lambda item: item["sale_date"], reverse=True)


def load_training_data() -> tuple[np.ndarray, np.ndarray]:
    rows = _records()
    features = np.array([
        [float(row["sqft_living"]), float(row["bedrooms"]), float(row["bathrooms"]),
         float(row["yr_built"]), float(row["sqft_lot"]), float(row["zipcode"])]
        for row in rows
    ])
    prices = np.array([float(row["price"]) for row in rows])
    return features, prices


def build_market_summary(properties: list[dict]) -> dict:
    prices = np.array([item["price"] for item in properties])
    price_per_sqft = np.array([item["price"] / item["sqft"] for item in properties])
    months: dict[str, list[int]] = {}
    areas: dict[str, list[int]] = {}
    grades = {"Needs work": 0, "Standard": 0, "Quality": 0, "Premium": 0}

    for item in properties:
        month = item["sale_date"][:7]
        months.setdefault(month, []).append(item["price"])
        areas.setdefault(item["zipcode"], []).append(item["price"])
        grade = item["grade"]
        grades["Needs work" if grade <= 5 else "Standard" if grade <= 7 else "Quality" if grade <= 9 else "Premium"] += 1

    monthly = [{
        "month": month,
        "median": round(float(np.median(values)) / 1000, 1),
        "volume": len(values),
    } for month, values in sorted(months.items())]
    top_zips = sorted(areas.items(), key=lambda entry: float(np.median(entry[1])), reverse=True)[:4]
    return {
        "records_analyzed": len(properties),
        "median_sale_price": round(float(np.median(prices))),
        "median_price_per_sqft": round(float(np.median(price_per_sqft))),
        "median_year_built": int(np.median([item["year_built"] for item in properties])),
        "monthly": monthly,
        "top_areas": [{
            "name": ZIP_CITIES.get(zipcode, "King County"),
            "zipcode": zipcode,
            "price": round(float(np.median(values)) / 1000),
            "sales": len(values),
        } for zipcode, values in top_zips],
        "grade_mix": [{
            "name": name,
            "value": round(count / len(properties) * 100, 1),
            "color": color,
        } for (name, count), color in zip(grades.items(), ["#286de0", "#68a5e5", "#a5c6df", "#d4dee8"])],
    }