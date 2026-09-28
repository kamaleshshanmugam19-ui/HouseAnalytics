import csv
import io
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from app.data import build_market_summary, load_properties
from app.model import FEATURES, load_or_train_model, predict_price


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.model = load_or_train_model()
    app.state.properties = load_properties()
    yield


app = FastAPI(title="HouseAnalytics API", version="1.0.0", lifespan=lifespan)
frontend_origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in frontend_origins.split(",") if origin.strip()],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class PropertyFeatures(BaseModel):
    sqft: float = Field(gt=300, le=15000)
    bedrooms: float = Field(ge=1, le=10)
    bathrooms: float = Field(ge=1, le=10)
    year_built: float = Field(ge=1850, le=2026)
    lot_sqft: float = Field(ge=500, le=100000)
    zipcode: float = Field(ge=98001, le=98199)


@app.get("/api/health")
def health():
    return {"status": "ok", "model": "Random Forest"}


@app.post("/api/predict")
def predict(features: PropertyFeatures):
    values = {name: getattr(features, name) for name in FEATURES}
    return predict_price(app.state.model, values)


@app.get("/api/properties")
def list_properties(
    search: str = "",
    property_type: str = "",
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
):
    properties = app.state.properties
    if search:
        needle = search.casefold()
        properties = [item for item in properties if needle in item["address"].casefold() or needle in item["city"].casefold() or needle in item["zipcode"]]
    if property_type:
        properties = [item for item in properties if item["type"] == property_type]
    return {"items": properties[offset:offset + limit], "total": len(properties), "limit": limit, "offset": offset}


@app.get("/api/market-summary")
def market_summary():
    return build_market_summary(app.state.properties)


@app.get("/api/properties/export")
def export_properties():
    output = io.StringIO()
    fields = ["id", "address", "city", "zipcode", "type", "beds", "baths", "sqft", "year_built", "grade", "sale_date", "price"]
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(app.state.properties)
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=houseanalytics-properties.csv"},
    )