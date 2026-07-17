# AERISYN — AI Weather Intelligence Platform

> **Predicting Tomorrow, Visualizing Today.**

AERISYN is a production-grade, full-stack AI weather intelligence platform combining real-time atmospheric data, machine learning forecasting, air quality monitoring, and a context-aware conversational assistant — built as a modern decoupled monorepo.

[![CI](https://github.com/your-username/aerisyn/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/aerisyn/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

---

## Features

| Module | Description |
|---|---|
| **Dashboard** | Real-time temperature, humidity, pressure, UV index, wind, AQI, sunrise/sunset, 24h & 7-day forecasts |
| **Analytics** | Historical weather trends (week / month / year) with interactive line, area, and bar charts |
| **Live Map** | Leaflet-powered interactive map with dark, satellite, precipitation, and cloud layers |
| **City Compare** | Side-by-side comparison of up to 6 cities with bar and radar charts |
| **ML Predictions** | 4-model ensemble (Linear Regression, XGBoost, Gradient Boosting, Random Forest) trained on real historical data |
| **AI Assistant** | Context-aware weather advisor powered by Gemini API with offline rule-based fallback |
| **Alerts** | Real-time weather alerts derived from live conditions (heatwave, storm, fog, snow, wind) |

---

## Tech Stack

### Frontend
- **React 19** + **Vite** + **TypeScript**
- **Tailwind CSS v4** — glassmorphic dark/light theme
- **Framer Motion** — smooth page and component animations
- **Recharts** — animated weather analytics charts
- **React-Leaflet** + **OpenStreetMap** — interactive maps
- **TanStack React Query v5** — async data fetching and caching
- **Wouter** — lightweight client-side routing
- **shadcn/ui** — accessible component primitives

### Backend
- **Express 5** (Node.js) — REST API server
- **Drizzle ORM** + **PostgreSQL** — type-safe database layer
- **Pino** — structured JSON logging
- **Zod** — runtime request validation
- **Orval** — OpenAPI type-safe client generation

### Machine Learning
- Pure TypeScript statistical engine (no Python dependency)
- 4 algorithms: OLS Linear Regression, Seasonal EWMA (XGBoost-style), Gradient Boosted Ensemble, Bagged Seasonal Windows (Random Forest-style)
- Trained on real Open-Meteo historical archive data
- Metrics: RMSE, MAE, R², Confidence Score

### Data Sources (100% Real — No Mock Data)
| Data | Source |
|---|---|
| Current & Forecast Weather | [Open-Meteo](https://open-meteo.com/) |
| Historical Weather | [Open-Meteo Archive API](https://archive-api.open-meteo.com/) |
| Air Quality | [Open-Meteo Air Quality API](https://air-quality-api.open-meteo.com/) |
| Geocoding | [Open-Meteo Geocoding API](https://geocoding-api.open-meteo.com/) |
| Reverse Geocoding | [Nominatim / OpenStreetMap](https://nominatim.openstreetmap.org/) |
| Map Tiles | [CartoDB Dark Matter](https://carto.com/), [Esri Satellite](https://www.esri.com/) |
| Weather Overlays | [OpenWeatherMap Tiles](https://openweathermap.org/api/weathermaps) (optional) |

---

## Project Structure

```
aerisyn/
├── apps/
│   ├── frontend/          # React 19 + Vite SPA
│   │   └── src/
│   │       ├── components/    # UI, layout, weather components
│   │       ├── contexts/      # LocationContext
│   │       ├── hooks/         # useDebounce, useIsMobile, useToast
│   │       ├── pages/         # Dashboard, Analytics, Map, Compare, ML, Assistant, Alerts
│   │       └── lib/           # Utilities
│   └── backend/           # Express 5 REST API
│       └── src/
│           ├── controllers/   # ML, Assistant, Cities
│           ├── routes/        # weather, air-quality, geocoding, analytics, ml, assistant
│           ├── services/      # WeatherService, AssistantEngine
│           ├── repositories/  # Favorites, SearchHistory
│           └── lib/           # Logger, WeatherUtils
├── ml/
│   └── prediction/
│       └── ml-engine.ts   # 4-model TypeScript ML engine
├── packages/
│   ├── api-spec/          # OpenAPI 3.1 specification
│   ├── api-zod/           # Generated Zod validation schemas
│   ├── api-client-react/  # Generated React Query hooks
│   └── db/                # Drizzle ORM schema + PostgreSQL client
├── database/
│   └── migrations/        # SQL migration files
├── docs/                  # Architecture, API, ML, deployment docs
├── docker-compose.yml     # PostgreSQL + pgAdmin local stack
└── .github/workflows/     # CI pipeline
```

---

## Quick Start

### Prerequisites
- [Node.js 20+](https://nodejs.org/)
- npm 11+ (bundled with current Node.js)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (for PostgreSQL)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/aerisyn.git
cd aerisyn
npm install
```

### 2. Start the Database

```bash
docker-compose up -d
```

### 3. Configure Environment

```bash
# Backend
cp apps/backend/.env.example apps/backend/.env

# Frontend (optional — only needed for OWM map overlays)
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/backend/.env`:
```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/aerisyn
ALLOWED_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_key_here   # optional
```

### 4. Run Database Migrations

```bash
cd packages/db
npm exec drizzle-kit push
cd ../..
```

### 5. Build & Start

```bash
npm run build
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## API Reference

Full API documentation: [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md)

Base URL: `http://localhost:3001/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/weather/current` | Current weather for coordinates |
| GET | `/weather/forecast` | Hourly + 7-day forecast |
| GET | `/weather/historical` | Historical weather data |
| GET | `/weather/alerts` | Active weather alerts |
| GET | `/air-quality` | AQI + pollutant breakdown |
| GET | `/geocoding/search` | City search autocomplete |
| GET | `/geocoding/reverse` | Reverse geocode coordinates |
| GET | `/ml/predictions` | ML weather predictions |
| GET | `/ml/models` | Model performance metrics |
| POST | `/ml/train` | Retrain models with latest data |
| POST | `/assistant/query` | AI weather assistant |
| GET | `/analytics/historical-summary` | Historical statistics |
| POST | `/analytics/comparison` | Multi-city comparison |
| GET | `/cities/favorites` | Saved favorite cities |
| POST | `/cities/favorites` | Add favorite city |
| DELETE | `/cities/favorites/:id` | Remove favorite city |
| GET | `/cities/search-history` | Recent searches |

---

## Machine Learning

The ML engine (`ml/prediction/ml-engine.ts`) implements four statistical forecasting algorithms trained on 90 days of real Open-Meteo historical data:

| Model | Algorithm | Description |
|---|---|---|
| Linear Regression | OLS trend | Time-indexed ordinary least squares |
| XGBoost | Seasonal EWMA | Exponential smoothing with weekly seasonality |
| Gradient Boosting | 3-stage residual boosting | OLS base + EWMA + seasonal residual correction |
| Random Forest | Bagged seasonal windows | 15-bag ensemble with trimmed mean aggregation |

**Predicted variables:** Max temperature, Min temperature, Precipitation, Wind speed, Humidity, Pressure

**Metrics reported:** RMSE, MAE, R², Confidence Score (55–97%)

---

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full production deployment guides covering:
- **Render** (backend)
- **Vercel** (frontend)
- **Supabase** (PostgreSQL)
- **Docker** (self-hosted)

---

## Documentation

| Document | Description |
|---|---|
| [`INSTALLATION.md`](INSTALLATION.md) | Detailed local setup guide |
| [`DEPLOYMENT.md`](DEPLOYMENT.md) | Production deployment guide |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | System architecture overview |
| [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md) | Full API reference |
| [`docs/DATABASE_DOCUMENTATION.md`](docs/DATABASE_DOCUMENTATION.md) | Database schema & ER diagram |
| [`docs/ML_DOCUMENTATION.md`](docs/ML_DOCUMENTATION.md) | ML engine technical report |
| [`docs/FEATURES.md`](docs/FEATURES.md) | Feature specifications |
| [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md) | Codebase structure guide |

---

## License

MIT © 2025 — See [LICENSE](LICENSE) for details.
