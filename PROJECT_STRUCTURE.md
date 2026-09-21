# Geomatrix Project Structure

This document explains where the Geomatrix code lives, what each important file does, and which files to edit for common tasks.

## 1. Project Overview

Geomatrix is a land-acquisition decision-support application with two application layers:

1. **Next.js frontend and web API** - the main application served by `npm run dev`.
2. **FastAPI and ML backend** - Python services under `geomatrix_v2/`, exposed for Vercel through `api/index.py`.

The browser normally calls the Next.js route handlers at `/api/...`. Those handlers provide demo data, proxy or adapt backend behavior, and support the dashboard UI. The Python service contains the database models, ingestion, map, prediction, explanation, and training logic.

## 2. Root Files

| File | Purpose |
| --- | --- |
| `package.json` | Node dependencies and commands: `dev`, `build`, `start`, and `lint`. |
| `tsconfig.json` | TypeScript compiler configuration. |
| `next.config.ts` | Next.js configuration. |
| `next-env.d.ts` | Next.js generated TypeScript declarations. |
| `eslint.config.mjs` | ESLint rules for the TypeScript and Next.js code. |
| `vercel.json` | Vercel deployment configuration. |
| `pytest.ini` | Pytest configuration for the Python tests. |
| `scripts_seed.txt` | Seed/setup command notes. |
| `tb_information_summary.txt` | Supporting project or technical information notes. |
| `generate_readme_pdf.py` | Utility for generating a PDF from README/project documentation. |
| `generate_todo_pdf.py` | Utility for generating a PDF from TODO content. |
| `PROJECT_STRUCTURE.md` | This project map. Update it when major folders or responsibilities change. |

## 3. Next.js Application

### 3.1 Global application files

| File | Purpose |
| --- | --- |
| `app/layout.tsx` | Root layout, page metadata, and the shared `Shell` wrapper. |
| `app/globals.css` | Global design tokens, layout, themes, navigation, tables, forms, and responsive styles. |
| `app/page.tsx` | Root route (`/`), usually responsible for the initial redirect or landing behavior. |
| `app/not-found.tsx` | Shared 404 page. |
| `components/Shell.tsx` | Auth guard, sidebar navigation, top bar, search, role switcher, theme switcher, service status, and logout behavior. |
| `components/ExportDropdown.tsx` | Reusable export menu used by report/data views. |

### 3.2 User-facing pages

| Route | File | Responsibility |
| --- | --- | --- |
| `/login` | `app/login/page.tsx` | Prototype authentication screen and session storage setup. |
| `/dashboard` | `app/dashboard/page.tsx` | Dashboard route wrapper. |
| `/dashboard` | `app/dashboard/CommandCenter.tsx` | Main command-center dashboard UI, metrics, charts, alerts, and project summaries. |
| `/projects` | `app/projects/page.tsx` | Project listing, filtering, search, and project selection. |
| `/projects/[id]` | `app/projects/[id]/page.tsx` | Project detail view, risk information, acquisition progress, recommendations, and actions. |
| `/map` | `app/map/page.tsx` | GIS/risk map experience. |
| `/alerts` | `app/alerts/page.tsx` | Alert list, severity filtering, and acknowledgement actions. |
| `/analytics` | `app/analytics/page.tsx` | Analytics overview, stage analysis, and driver visualizations. |
| `/reports` | `app/reports/page.tsx` | Report generation, export, and report browsing. |
| `/data` | `app/data/page.tsx` | Data management and document/import workflow. |
| `/model` | `app/model/page.tsx` | Model status, prediction, training data, and model operations. |
| `/admin/model` | `app/admin/model/page.tsx` | Administrative model-management view. |
| `/settings` | `app/settings/` | Settings route area. Add the page component here when settings functionality is implemented. |

### 3.3 Next.js route handlers

Files under `app/api/` are server-side Next.js endpoints. Add or modify a handler here when the browser needs a same-origin `/api/...` endpoint.

| Endpoint | File | Responsibility |
| --- | --- | --- |
| `/api/projects` | `app/api/projects/route.ts` | List and create project records. |
| `/api/projects/[id]` | `app/api/projects/[id]/route.ts` | Read or update one project. |
| `/api/projects/[id]/risk` | `app/api/projects/[id]/risk/route.ts` | Return project risk information. |
| `/api/projects/[id]/predict-risk` | `app/api/projects/[id]/predict-risk/route.ts` | Run or request a risk prediction for one project. |
| `/api/projects/[id]/recommendations` | `app/api/projects/[id]/recommendations/route.ts` | Return project recommendations. |
| `/api/projects/[id]/explain` | `app/api/projects/[id]/explain/route.ts` | Return an explanation for a project risk result. |
| `/api/projects/[id]/validate` | `app/api/projects/[id]/validate/route.ts` | Validate project data or a project workflow action. |
| `/api/projects/dashboard-summary` | `app/api/projects/dashboard-summary/route.ts` | Return dashboard-level project metrics. |
| `/api/alerts` | `app/api/alerts/route.ts` | List and manage alerts. |
| `/api/alerts/summary` | `app/api/alerts/summary/route.ts` | Return open and severity-based alert totals. |
| `/api/alerts/[id]/acknowledge` | `app/api/alerts/[id]/acknowledge/route.ts` | Acknowledge one alert. |
| `/api/analytics/overview` | `app/api/analytics/overview/route.ts` | Return top-level analytics. |
| `/api/analytics/stages` | `app/api/analytics/stages/route.ts` | Return acquisition-stage analytics. |
| `/api/analytics/drivers` | `app/api/analytics/drivers/route.ts` | Return risk-driver analytics. |
| `/api/map/projects` | `app/api/map/projects/route.ts` | Return projects needed by the map view. |
| `/api/map/geojson` | `app/api/map/geojson/route.ts` | Return map-ready GeoJSON. |
| `/api/model/status` | `app/api/model/status/route.ts` | Return active model status and metadata. |
| `/api/model/train` | `app/api/model/train/route.ts` | Start or simulate model training. |
| `/api/model/training-data` | `app/api/model/training-data/route.ts` | Return model training data/status information. |
| `/api/predict` | `app/api/predict/route.ts` | General prediction endpoint. |
| `/api/reports` | `app/api/reports/route.ts` | Build or return report data. |
| `/api/documents/upload` | `app/api/documents/upload/route.ts` | Handle document upload requests. |
| `/api/auth/google` | `app/api/auth/google/route.ts` | Google authentication callback/integration endpoint. |
| `/api/gemini/explain` | `app/api/gemini/explain/` | AI-assisted explanation endpoint area. |
| `-` | `app/api/_demo-data.ts` | Shared demo/fallback records used by route handlers. Keep demo-only data here. |

### 3.4 Frontend utility modules

| File | Purpose |
| --- | --- |
| `lib/api.ts` | Legacy/minimal project API helpers. Several functions are placeholders and return empty values. |
| `lib/apiClient.ts` | Shared client-side API request utilities. |
| `lib/data.ts` | Frontend data constants, transformation helpers, or seed display data. |
| `lib/exportUtils.ts` | Export/download helpers for reports and tabular data. |
| `lib/reports.ts` | Report-specific data preparation and report helpers. |

## 4. FastAPI Backend: `geomatrix_v2/`

This directory contains the Python application and ML pipeline. It is also the backend source imported by `api/index.py` for deployment.

### 4.1 Backend entry points and persistence

| File | Purpose |
| --- | --- |
| `geomatrix_v2/main.py` | Creates the FastAPI app, enables CORS, registers routers, initializes the database, and exposes `/health`. |
| `api/index.py` | Vercel entrypoint. Adds `geomatrix_v2/` to `sys.path` and exports `main.app`. |
| `geomatrix_v2/database.py` | Database engine/session setup and database initialization. |
| `geomatrix_v2/models.py` | ORM/database models. |
| `geomatrix_v2/schemas.py` | Pydantic request and response schemas. |
| `geomatrix_v2/seed_db.py` | Creates or populates local seed data. |
| `geomatrix_v2/requirements.txt` | Python dependencies for the FastAPI and ML service. |
| `geomatrix_v2/geomatrix.db` | Local SQLite database/runtime artifact when present. Do not edit manually. |

### 4.2 FastAPI routers

| File | Responsibility |
| --- | --- |
| `geomatrix_v2/routers/auth.py` | Authentication endpoints. |
| `geomatrix_v2/routers/projects.py` | Project CRUD and project-related backend operations. |
| `geomatrix_v2/routers/alerts.py` | Alert listing, status, and acknowledgement operations. |
| `geomatrix_v2/routers/ingest.py` | Data and document ingestion endpoints. |
| `geomatrix_v2/routers/map.py` | Map project and geospatial data endpoints. |
| `geomatrix_v2/routers/ml.py` | Prediction, training, model status, and ML operations. |
| `geomatrix_v2/routers/gemini.py` | Gemini/AI explanation integration. |

### 4.3 Machine-learning modules

| File | Responsibility |
| --- | --- |
| `geomatrix_v2/ml/features.py` | Converts project/database data into model features. |
| `geomatrix_v2/ml/train.py` | Trains and saves the risk model. |
| `geomatrix_v2/ml/predict.py` | Loads the active model and produces predictions. |
| `geomatrix_v2/ml/explain.py` | Produces feature-level explanations for predictions. |
| `geomatrix_v2/ml/evaluate.py` | Evaluates model quality and metrics. |
| `geomatrix_v2/ml/__init__.py` | Marks the ML directory as a Python package. |
| `geomatrix_v2/model_artifacts/active_model.json` | Identifies the active model artifact/version. |
| `geomatrix_v2/model_artifacts/meta_*.json` | Model metadata generated during training. Treat these as generated artifacts. |

### 4.4 Backend data and tests

| Path | Purpose |
| --- | --- |
| `geomatrix_v2/sample_data/` | Sample input data for local development and demonstrations. |
| `geomatrix_v2/uploads/` | Runtime upload directory for ingested documents. |
| `geomatrix_v2/static/` | FastAPI-served static assets. |
| `geomatrix_v2/templates/` | Server-rendered templates and template partials. |
| `geomatrix_v2/templates/partials/` | Reusable template fragments. |
| `geomatrix_v2/tests/test_ml_pipeline.py` | Unit/integration coverage for the ML pipeline. |
| `geomatrix_v2/tests/test_real_pipeline_api.py` | API-level coverage for the real prediction pipeline. |
| `geomatrix_v2/.pytest_cache/` | Generated pytest cache; do not edit. |
| `geomatrix_v2/__pycache__/` | Generated Python bytecode cache; do not edit. |

## 5. Database Schema

`prisma/schema.prisma` defines the PostgreSQL schema used by the Node/Prisma side of the project. Its main entities are:

- `User`, `AuditLog` - users, roles, and change history.
- `State`, `District` - geographic hierarchy.
- `Project` - core land-acquisition project record.
- `LandParcel` - parcel-level acquisition and dispute information.
- `AcquisitionStage` - stage progress, expected/actual days, and delay risk.
- `CompensationCase`, `LegalCase`, `Approval`, `Document` - project workflow records.
- `RiskPrediction`, `RiskFactor` - model outputs and explainable factors.
- `Recommendation` - suggested actions and owners.
- `Alert` - detected risks and acknowledgement status.

The Python service has its own database model layer in `geomatrix_v2/models.py`. Keep the Prisma schema and Python persistence model aligned when changing shared domain fields.

## 6. Common Change Guide

| Task | Files to change |
| --- | --- |
| Add a new page | Create `app/<route>/page.tsx`; add navigation in `components/Shell.tsx` if the page is a primary section. |
| Change global colors/layout | Edit `app/globals.css`. |
| Change the sidebar, auth guard, role switcher, or theme | Edit `components/Shell.tsx`. |
| Add a browser-facing endpoint | Add or edit `app/api/<domain>/route.ts`. |
| Change dashboard data | Edit the relevant dashboard page/component and its route handler, usually `app/dashboard/CommandCenter.tsx` plus `app/api/...`. |
| Change project details | Edit `app/projects/[id]/page.tsx` and the matching `app/api/projects/[id]/...` handlers. |
| Change map output | Edit `app/map/page.tsx` and `app/api/map/...`; edit `geomatrix_v2/routers/map.py` if the Python API is the source. |
| Change alerts | Edit `app/alerts/page.tsx`, `app/api/alerts/...`, and `geomatrix_v2/routers/alerts.py` when changing backend behavior. |
| Change prediction behavior | Edit `geomatrix_v2/ml/predict.py`, `features.py`, or `train.py`; update `geomatrix_v2/routers/ml.py` and the matching Next.js handler if the public API changes. |
| Change prediction explanations | Edit `geomatrix_v2/ml/explain.py` or `geomatrix_v2/routers/gemini.py`; update the project explain route/UI as needed. |
| Change database fields | Update `prisma/schema.prisma`, Python models/schemas as applicable, seed data, and API consumers. Run the appropriate migration or seed command. |
| Add ingestion support | Edit `app/api/documents/upload/route.ts` for the web endpoint and `geomatrix_v2/routers/ingest.py` for Python ingestion logic. |
| Add or update tests | Frontend route behavior belongs near the route/API code; Python pipeline tests belong in `geomatrix_v2/tests/`. |
| Change deployment behavior | Review `next.config.ts`, `vercel.json`, `api/index.py`, and environment variables. |

## 7. Request/Data Flow

```text
Browser page in app/
        |
        v
Next.js route handler in app/api/
        |
        +--> demo/fallback data in app/api/_demo-data.ts
        |
        +--> FastAPI service in geomatrix_v2/main.py
                    |
                    +--> routers/
                    +--> database.py and models.py
                    +--> ml/features.py, predict.py, explain.py, train.py
```

For a new feature, start at the page that renders the user experience, follow its `fetch('/api/...')` call to the Next.js route handler, then follow any backend call into the corresponding Python router and ML/database module.

## 8. Run and Validate Locally

### Next.js application

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Other available commands:

```bash
npm run lint
npm run build
npm start
```

### Python backend

Install dependencies from `geomatrix_v2/requirements.txt`, then run the FastAPI app from the repository root with the Python module path configured for `geomatrix_v2`. The health endpoint is:

```text
GET /health
```

Run Python tests with:

```bash
pytest
```

## 9. Generated and Runtime Files

The following paths are generated or runtime state and should generally not be hand-edited:

- `node_modules/`
- `.next/`
- `tsconfig.tsbuildinfo`
- `geomatrix_v2/__pycache__/`
- `geomatrix_v2/.pytest_cache/`
- `geomatrix_v2/geomatrix.db`
- `geomatrix_v2/uploads/`
- `geomatrix_v2/model_artifacts/meta_*.json`

Source changes should be made in the TypeScript/Python files described above, then validated with the relevant lint, build, API, or pytest command.