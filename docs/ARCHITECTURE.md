# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                        │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React 19 SPA (Vite)                     │  │
│  │                                                      │  │
│  │  Pages: Dashboard │ Analytics │ Map │ Compare        │  │
│  │         ML Predictions │ Assistant │ Alerts          │  │
│  │                                                      │  │
│  │  State: React Query (server) + Context (location)   │  │
│  │  UI:    shadcn/ui + Tailwind CSS v4 + Framer Motion │  │
│  └──────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼───────────────────────────────┘
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS 5 API SERVER                      │
│                                                             │
│  Routes → Controllers → Services / Repositories            │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Weather  │  │   AQI    │  │    ML    │  │Assistant │  │
│  │ Routes   │  │  Routes  │  │ Routes   │  │  Routes  │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │              │              │              │         │
│       ▼              ▼              ▼              ▼         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              External API Calls (fetch)             │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────┐    ┌──────────────────────────────┐  │
│  │  ML Controller   │    │   Cities Controller          │  │
│  │  ↓               │    │   ↓                          │  │
│  │  ml-engine.ts    │    │   Drizzle ORM → PostgreSQL   │  │
│  │  (4 models)      │    │                              │  │
│  └──────────────────┘    └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  Open-Meteo  │  │  Open-Meteo  │  │  Nominatim   │
    │  Forecast    │  │  Archive     │  │  Geocoding   │
    │  Air Quality │  │  (ML data)   │  │              │
    └──────────────┘  └──────────────┘  └──────────────┘
```

---

## Data Flow

### Weather Dashboard
```
User opens Dashboard
  → LocationContext reads GPS / localStorage
  → React Query fires: getCurrentWeather, getWeatherForecast, getAirQuality, getWeatherAlerts
  → Backend fetches from Open-Meteo APIs
  → Response cached by React Query (stale-while-revalidate)
  → Dashboard renders with live data
```

### ML Predictions
```
User opens ML Predictions page
  → React Query fires: getMlPredictions(lat, lon)
  → Backend: WeatherService.fetchHistoricalForML(lat, lon, 90 days)
    → Open-Meteo Archive API → 90 days of daily data
  → ml-engine.ts: trainAndPredict() for each variable
    → 80/20 train/test split
    → 4 models trained: LR, EWMA, GB, Bagged
    → Metrics computed: RMSE, MAE, R²
    → Best model selected by lowest RMSE
  → Response: predictions + model comparison table
```

### AI Assistant
```
User submits question
  → POST /api/assistant/query { question, lat, lon }
  → Backend fetches live weather context (current + AQI)
  → If GEMINI_API_KEY set:
      → Gemini 2.0 Flash generates contextual response
  → Else (fallback):
      → assistant-engine.ts detects intent (11 categories)
      → Generates rule-based response from weather context
  → Response: answer + recommendations + confidence
```

---

## Package Dependency Graph

```
apps/frontend
  └── @workspace/api-client-react
        └── @workspace/api-zod
              └── openapi.yaml (source)

apps/backend
  ├── @workspace/api-zod
  └── @workspace/db
        └── PostgreSQL (via Drizzle ORM)

ml/prediction/ml-engine.ts
  └── (imported by apps/backend/src/controllers/ml.controller.ts)
```

---

## Technology Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Monorepo | npm workspaces | Shared types and single install |
| API contract | OpenAPI 3.1 + Orval | Type-safe end-to-end, no manual type duplication |
| ML runtime | TypeScript (Node.js) | No Python process, simpler deployment, same type system |
| Database ORM | Drizzle | Type-safe, lightweight, SQL-first |
| Routing | Wouter | 2KB vs React Router's 50KB, sufficient for SPA |
| Styling | Tailwind CSS v4 | Zero-runtime, design tokens via CSS variables |
| Charts | Recharts | React-native, composable, good TypeScript support |
| Maps | React-Leaflet | Open-source, no API key required for base tiles |
