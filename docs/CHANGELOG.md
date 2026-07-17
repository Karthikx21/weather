# Changelog

All notable changes to AERISYN are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.0.0] — 2025

### Added
- Full-stack monorepo with npm workspaces
- React 19 + Vite frontend with glassmorphic dark/light theme
- Express 5 REST API backend with Pino structured logging
- OpenAPI 3.1 specification as single source of truth
- Orval-generated type-safe React Query hooks and Zod validators
- Real-time weather dashboard (temperature, humidity, pressure, UV, wind, AQI)
- 24-hour hourly forecast with weather icons
- 7-day daily forecast with precipitation probability
- Historical analytics with week/month/year periods (line, area, bar charts)
- Interactive Leaflet map with dark, satellite, precipitation, and cloud layers
- Multi-city comparison (up to 6 cities) with bar and radar charts
- 4-model TypeScript ML engine (Linear Regression, XGBoost-style EWMA, Gradient Boosting, Random Forest-style Bagging)
- ML predictions for max/min temperature, precipitation, wind speed, humidity, pressure
- Model performance metrics: RMSE, MAE, R², Confidence Score
- AI weather assistant with Gemini 2.0 Flash integration
- Rule-based assistant fallback engine with 11 intent categories
- Real-time weather alerts derived from live conditions
- City search with autocomplete (Open-Meteo Geocoding)
- GPS-based automatic location detection
- Favorite cities and search history (PostgreSQL via Drizzle ORM)
- Dark/light theme toggle with next-themes
- Responsive layout with mobile bottom navigation
- Framer Motion page and component animations
- Docker Compose stack for local PostgreSQL + pgAdmin
- GitHub Actions CI pipeline (typecheck + build)

### Security
- CORS restricted to configured `ALLOWED_ORIGIN`
- Zod validation on all API inputs
- Environment variables for all secrets
- OWM API key moved from source to `VITE_OWM_API_KEY` env var
- JSON.parse wrapped in try/catch in LocationContext
- Sanitized error logging (no raw error objects in console)

### Fixed
- Confidence score display bug (was multiplying 0–100 value by 100 again)
- Duplicate exports in `api-zod/src/index.ts`
- `PORT` env var no longer crashes server on local dev (defaults to 3001)
- `useEffect` dependency suppression removed in Compare.tsx

### Removed
- All Replit scaffolding (`.agents/`, `.local/`, `attached_assets/`, `apps/mockup-sandbox/`)
- Hardcoded OpenWeatherMap API key from MapPage.tsx
- Unused `openai` dependency from backend
- Unused `hello.ts` placeholder script
- Replit-branded comments from configuration files
- `react-icons` duplicate (replaced by `lucide-react`)
