# Project Structure

```
aerisyn/
├── apps/
│   ├── frontend/                     # React 19 + Vite SPA
│   │   ├── src/
│   │   │   ├── assets/               # Static assets (logo)
│   │   │   ├── components/
│   │   │   │   ├── layout/AppLayout.tsx
│   │   │   │   ├── ui/               # shadcn/ui primitives
│   │   │   │   ├── LocationSearch.tsx
│   │   │   │   ├── WeatherIcon.tsx
│   │   │   │   └── theme-provider.tsx
│   │   │   ├── contexts/
│   │   │   │   └── LocationContext.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-debounce.ts
│   │   │   │   ├── use-mobile.tsx
│   │   │   │   └── use-toast.ts
│   │   │   ├── lib/utils.ts
│   │   │   ├── pages/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── Analytics.tsx
│   │   │   │   ├── MapPage.tsx
│   │   │   │   ├── Compare.tsx
│   │   │   │   ├── MlPredictions.tsx
│   │   │   │   ├── Assistant.tsx
│   │   │   │   ├── Alerts.tsx
│   │   │   │   └── not-found.tsx
│   │   │   ├── App.tsx
│   │   │   ├── main.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── .env.example
│   │   └── package.json
│   │
│   └── backend/                      # Express 5 REST API
│       ├── src/
│       │   ├── controllers/
│       │   │   ├── assistant.controller.ts
│       │   │   ├── cities.controller.ts
│       │   │   └── ml.controller.ts
│       │   ├── lib/
│       │   │   ├── logger.ts
│       │   │   └── weather-utils.ts
│       │   ├── repositories/
│       │   │   ├── favorites.repository.ts
│       │   │   └── search-history.repository.ts
│       │   ├── routes/
│       │   │   ├── index.ts
│       │   │   ├── weather.ts
│       │   │   ├── air-quality.ts
│       │   │   ├── geocoding.ts
│       │   │   ├── analytics.ts
│       │   │   ├── ml.ts
│       │   │   ├── assistant.ts
│       │   │   ├── cities.ts
│       │   │   └── health.ts
│       │   ├── services/
│       │   │   ├── assistant-engine.ts
│       │   │   └── weather.service.ts
│       │   ├── app.ts
│       │   └── index.ts
│       ├── build.mjs
│       ├── .env.example
│       └── package.json
│
├── ml/
│   └── prediction/
│       └── ml-engine.ts              # 4-model TypeScript ML engine
│
├── packages/
│   ├── api-spec/openapi.yaml         # OpenAPI 3.1 — source of truth
│   ├── api-zod/                      # Generated Zod schemas
│   ├── api-client-react/             # Generated React Query hooks
│   └── db/                           # Drizzle ORM + PostgreSQL
│
├── database/migrations/
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── package-lock.json
└── README.md
```

## Architecture Overview

- **OpenAPI-first**: `packages/api-spec/openapi.yaml` is the single source of truth. Orval generates both Zod validators and React Query hooks from it.
- **TypeScript ML**: The ML engine runs in Node.js — no Python required. Four genuine statistical models trained on real Open-Meteo archive data.
- **Offline-capable AI**: The assistant tries Gemini first; falls back to the built-in rule-based engine if the API key is absent.
- **Real data only**: Every number displayed comes from a live API or a trained ML model. No mock data anywhere.
