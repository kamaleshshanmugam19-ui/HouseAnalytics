# HouseAnalytics

A real-estate market analytics dashboard with a React, TypeScript, Vite, Tailwind, Recharts, and React Router frontend, plus a FastAPI service backed by a scikit-learn Random Forest model serialized with joblib.

## Requirements

- Node.js 20 or newer
- Python 3.10 or newer

## Run locally

In the project root, install frontend dependencies and start Vite:

```powershell
npm install
npm run dev
```

In a second terminal, create and activate a Python environment, then install backend requirements and start FastAPI:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

Vite proxies `/api` requests to FastAPI on port 8000. The API uses the bundled King County House Sales dataset (May 2014–May 2015) for the browser, market summaries, and Random Forest training. On first startup, the model is trained from those records and saved to `backend/models/house_price_model_v2.joblib`. This is historical data, not current listings or financial advice; source details are in [backend/data/README.md](backend/data/README.md).

## Verify

```powershell
npm run build
cd backend
python -m compileall -q app tests
python -m pytest
```

## API

- `GET /api/health`
- `POST /api/predict`
- `GET /api/market-summary`
- `GET /api/properties`
- `GET /api/properties/export`

## Deploy

The production frontend is [houseanalytics-site.vercel.app](https://houseanalytics-site.vercel.app), and the FastAPI service is [houseanalytics-api.vercel.app](https://houseanalytics-api.vercel.app). Vercel production settings persist `VITE_API_URL` and `FRONTEND_ORIGINS` for future deployments. `vercel.json` enables client-side React Router routes; `.vercelignore` keeps the independent frontend deployment static-only. `render.yaml` is an optional alternative backend configuration.