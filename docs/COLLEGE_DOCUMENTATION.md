# AERISYN — AI Weather Intelligence Platform
## College Project Documentation

---

## Title Page

**Project Title:** AERISYN — AI Weather Intelligence Platform

**Tagline:** Predicting Tomorrow, Visualizing Today

**Submitted By:** [Your Name] | [Roll Number]

**Department:** [Department Name]

**Institution:** [College/University Name]

**Academic Year:** 2024–2025

**Guide:** [Guide Name], [Designation]

---

## Abstract

AERISYN is a production-grade, full-stack AI Weather Intelligence Platform that integrates real-time atmospheric data, machine learning forecasting, air quality monitoring, and a context-aware conversational assistant. The system fetches live weather data exclusively from real-world APIs (Open-Meteo, Nominatim) and applies four statistical machine learning models — Linear Regression, Seasonal EWMA (XGBoost-style), Gradient Boosted Ensemble, and Bagged Seasonal Windows (Random Forest-style) — trained on 90 days of real historical weather data to generate next-day forecasts with confidence intervals.

The platform is built as a modern decoupled monorepo using React 19, TypeScript, Express 5, Drizzle ORM, and PostgreSQL. It features an interactive dashboard, historical analytics, a live Leaflet map, multi-city comparison, ML prediction visualization, and an AI assistant powered by Google Gemini with an offline rule-based fallback engine. The system strictly uses real data — no mock values, no hardcoded statistics, no randomly generated weather.

---

## 1. Introduction

Weather forecasting has evolved from simple barometric readings to complex numerical weather prediction models. However, most consumer-facing weather applications either rely on third-party forecast APIs without transparency, or present data in ways that don't support intelligent decision-making.

AERISYN addresses this gap by combining:
- **Real-time data** from open meteorological APIs
- **Machine learning** trained on real historical data
- **Intelligent assistance** that translates raw weather data into actionable advice
- **Professional visualization** that makes complex atmospheric data accessible

The platform is designed to demonstrate enterprise-grade software engineering practices including clean architecture, type-safe API contracts, automated code generation, and production deployment readiness.

---

## 2. Problem Statement

Existing weather applications suffer from several limitations:

1. **Black-box forecasts** — Users receive predictions without understanding the underlying models or confidence levels
2. **No actionable intelligence** — Raw temperature and humidity values don't answer practical questions like "Should I go trekking today?"
3. **Limited historical analysis** — Most apps show only current conditions without trend analysis
4. **No ML transparency** — Machine learning is used behind the scenes without exposing model performance metrics
5. **Poor developer experience** — Inconsistent APIs, no type safety, no contract-first design

---

## 3. Existing Systems and Limitations

| System | Limitations |
|---|---|
| Weather.com | Proprietary data, no ML transparency, no developer API |
| AccuWeather | Paid API, no historical analytics, no AI assistant |
| OpenWeatherMap | Raw data only, no ML predictions, no actionable insights |
| Windy.com | Visualization only, no forecasting models, no assistant |
| Dark Sky (discontinued) | Was proprietary, acquired by Apple |

**Common limitations across all:**
- No machine learning model comparison
- No confidence intervals on predictions
- No context-aware AI assistant
- No open-source, self-hostable option
- No type-safe API contracts

---

## 4. Proposed System

AERISYN proposes a unified weather intelligence platform with:

1. **Real-time Dashboard** — Live weather metrics from Open-Meteo APIs
2. **Historical Analytics** — Trend analysis over week/month/year periods
3. **Interactive Map** — Leaflet-based map with weather overlay layers
4. **City Comparison** — Side-by-side atmospheric comparison of up to 6 cities
5. **ML Predictions** — Four models trained on real data with performance metrics
6. **AI Assistant** — Context-aware advisor answering practical weather questions
7. **Weather Alerts** — Real-time alerts derived from live conditions

---

## 5. Objectives

1. Build a production-grade weather platform using only real-world data
2. Implement and compare four machine learning forecasting algorithms
3. Create a context-aware AI assistant for practical weather advice
4. Design a type-safe, contract-first API architecture
5. Demonstrate enterprise software engineering practices
6. Achieve full deployment readiness (Docker, Render, Vercel, Supabase)

---

## 6. Scope

**In Scope:**
- Real-time weather data for any global location
- Historical weather analytics (up to 1 year)
- ML-based next-day forecasting
- AI-powered weather assistant
- Interactive weather map
- Multi-city comparison
- Weather alerts
- Favorites and search history

**Out of Scope:**
- Radar imagery (requires paid API)
- Push notifications (requires mobile app)
- User authentication (stateless design)
- Severe weather SMS alerts

---

## 7. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.1.0 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.x | Build tool & dev server |
| Tailwind CSS | 4.x | Utility-first styling |
| Framer Motion | 12.x | Animations |
| Recharts | 2.x | Data visualization |
| React-Leaflet | 5.x | Interactive maps |
| TanStack React Query | 5.x | Server state management |
| Wouter | 3.x | Client-side routing |
| shadcn/ui | Latest | Accessible UI components |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 5.x | HTTP framework |
| TypeScript | 5.9 | Type safety |
| Drizzle ORM | 0.45 | Database ORM |
| PostgreSQL | 16 | Relational database |
| Pino | 9.x | Structured logging |
| Zod | 3.x | Runtime validation |

### Machine Learning
| Algorithm | Implementation | Purpose |
|---|---|---|
| Linear Regression | OLS (TypeScript) | Trend-based forecasting |
| XGBoost-style | Seasonal EWMA | Seasonality-aware forecasting |
| Gradient Boosting | 3-stage residual | Ensemble residual correction |
| Random Forest-style | Bagged windows | Variance-reduced forecasting |

### Infrastructure
| Tool | Purpose |
|---|---|
| Docker Compose | Local PostgreSQL stack |
| GitHub Actions | CI/CD pipeline |
| npm Workspaces | Monorepo management |
| Orval | OpenAPI code generation |

---

## 8. System Architecture

### High-Level Architecture

```
Browser (React SPA)
    ↕ HTTP/REST
Express API Server (Node.js)
    ↕ fetch()
Open-Meteo APIs (Weather, Archive, AQI, Geocoding)
Nominatim API (Reverse Geocoding)
Google Gemini API (AI Assistant — optional)
    ↕ Drizzle ORM
PostgreSQL Database (Favorites, Search History)
```

### Component Architecture

```
Frontend:
  App.tsx
  ├── ThemeProvider (dark/light)
  ├── QueryClientProvider (React Query)
  ├── LocationProvider (GPS + localStorage)
  └── Router (Wouter)
      ├── AppLayout (sidebar + nav)
      └── Pages (lazy-loaded)
          ├── Dashboard
          ├── Analytics
          ├── MapPage
          ├── Compare
          ├── MlPredictions
          ├── Assistant
          └── Alerts

Backend:
  app.ts (Express + CORS + logging)
  └── /api router
      ├── /weather/* → weather.ts
      ├── /air-quality → air-quality.ts
      ├── /geocoding/* → geocoding.ts
      ├── /analytics/* → analytics.ts
      ├── /ml/* → ml.ts → MlController → ml-engine.ts
      ├── /assistant/query → assistant.ts → AssistantController
      ├── /cities/* → cities.ts → CitiesController → Repositories
      └── /healthz → health.ts
```

---

## 9. Database Design

### Tables

#### `favorite_cities`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| name | TEXT | NOT NULL |
| lat | REAL | NOT NULL |
| lon | REAL | NOT NULL |
| country | TEXT | NOT NULL |
| country_code | TEXT | NULLABLE |
| admin1 | TEXT | NULLABLE |
| timezone | TEXT | NULLABLE |
| added_at | TIMESTAMP | DEFAULT NOW() |

#### `search_history`
| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| name | TEXT | NOT NULL |
| lat | REAL | NOT NULL |
| lon | REAL | NOT NULL |
| country | TEXT | NOT NULL |
| country_code | TEXT | NULLABLE |
| admin1 | TEXT | NULLABLE |
| timezone | TEXT | NULLABLE |
| searched_at | TIMESTAMP | DEFAULT NOW() |

### ER Diagram (Text)
```
favorite_cities          search_history
───────────────          ──────────────
id (PK)                  id (PK)
name                     name
lat                      lat
lon                      lon
country                  country
country_code             country_code
admin1                   admin1
timezone                 timezone
added_at                 searched_at
```

---

## 10. API Design

### Base URL
`http://localhost:3001/api`

### Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| GET | `/healthz` | Health check |
| GET | `/weather/current` | Current weather |
| GET | `/weather/forecast` | Hourly + 7-day forecast |
| GET | `/weather/historical` | Historical data |
| GET | `/weather/alerts` | Active alerts |
| GET | `/air-quality` | AQI + pollutants |
| GET | `/geocoding/search` | City search |
| GET | `/geocoding/reverse` | Reverse geocode |
| GET | `/ml/predictions` | ML forecasts |
| GET | `/ml/models` | Model metrics |
| POST | `/ml/train` | Retrain models |
| POST | `/assistant/query` | AI assistant |
| GET | `/analytics/historical-summary` | Historical stats |
| POST | `/analytics/comparison` | City comparison |
| GET | `/cities/favorites` | Get favorites |
| POST | `/cities/favorites` | Add favorite |
| DELETE | `/cities/favorites/:id` | Remove favorite |
| GET | `/cities/search-history` | Search history |

---

## 11. Machine Learning Pipeline

### Data Collection
- Source: Open-Meteo Archive API
- Period: 90 days of historical daily data
- Variables: max temperature, min temperature, precipitation, wind speed, humidity, pressure

### Preprocessing
- Null value filtering
- Daily aggregation of hourly humidity and pressure
- 80/20 train/test split

### Models

#### 1. Linear Regression (OLS)
- Time-indexed ordinary least squares
- Computes slope and intercept from training data
- Predicts next day as: `slope × n + intercept`

#### 2. XGBoost-style (Seasonal EWMA)
- Computes weekly seasonal indices from training data
- Deseasonalises the series
- Applies exponential weighted moving average (α = 0.25)
- Reseasonalises the prediction

#### 3. Gradient Boosting (3-stage residual)
- Stage 1: OLS trend as base predictor
- Stage 2: EWMA on residuals (α = 0.4)
- Stage 3: Seasonal EWMA on residuals (α = 0.3)
- Final: weighted combination (0.45 × EWMA + 0.35 × Seasonal + 0.20 × Recent momentum)

#### 4. Random Forest-style (Bagged Seasonal Windows)
- 15 bags with different window starting positions
- Each bag uses Seasonal EWMA with varying α (0.20–0.36)
- Aggregation: trimmed mean (removes top/bottom outlier bags)

### Evaluation Metrics
- **RMSE** (Root Mean Square Error) — penalises large errors
- **MAE** (Mean Absolute Error) — average prediction error
- **R²** (Coefficient of Determination) — variance explained
- **Confidence Score** — derived from MAPE relative to series mean (55–97%)

### Model Selection
Best model selected by lowest RMSE on the test set.

---

## 12. Security Features

| Feature | Implementation |
|---|---|
| CORS restriction | `ALLOWED_ORIGIN` env var |
| Input validation | Zod schemas on all endpoints |
| Request size limit | 1MB body limit |
| Environment secrets | `.env` files, never committed |
| Error sanitization | Pino structured logging, no stack traces in responses |
| Safe JSON parsing | try/catch in LocationContext |

---

## 13. Testing Strategy

### Manual Testing Checklist
- [ ] Dashboard loads with live weather data
- [ ] Location search returns real results
- [ ] GPS detection works
- [ ] Analytics charts render with real historical data
- [ ] Map loads with correct location marker
- [ ] City comparison fetches all cities in parallel
- [ ] ML predictions load within 15 seconds
- [ ] Retrain button triggers new model training
- [ ] AI assistant responds to all 11 intent categories
- [ ] Alerts page auto-refreshes every 30 seconds
- [ ] Dark/light theme toggle persists across pages
- [ ] Mobile responsive layout works on 375px viewport

### API Testing (curl examples)

```bash
# Health check
curl http://localhost:3001/api/healthz

# Current weather (London)
curl "http://localhost:3001/api/weather/current?lat=51.5074&lon=-0.1278"

# ML predictions
curl "http://localhost:3001/api/ml/predictions?lat=51.5074&lon=-0.1278"

# AI assistant
curl -X POST http://localhost:3001/api/assistant/query \
  -H "Content-Type: application/json" \
  -d '{"question":"Should I carry an umbrella?","lat":51.5074,"lon":-0.1278}'
```

---

## 14. Results

- All 7 pages functional with real live data
- ML engine trains 4 models in < 15 seconds on 90 days of data
- AI assistant handles 11 intent categories with contextual responses
- Gemini integration with graceful offline fallback
- Full TypeScript type safety end-to-end (frontend → API → backend)
- Zero mock data — every value from a real API or trained model
- CI pipeline passes on every commit

---

## 15. Advantages

1. **100% real data** — No mock values, no hardcoded statistics
2. **Type-safe end-to-end** — OpenAPI → Zod → React Query hooks
3. **ML transparency** — Users see RMSE, MAE, R² for each model
4. **Offline-capable AI** — Works without Gemini API key
5. **Production-ready** — Docker, CI/CD, environment configuration
6. **Open data sources** — No paid API keys required for core features
7. **Monorepo architecture** — Shared types, single install, consistent tooling

---

## 16. Limitations

1. ML models are statistical (not deep learning) — accuracy limited by data volume
2. Weather alerts derived from thresholds, not official meteorological services
3. No user authentication — favorites/history are shared across all users
4. Map weather overlays require an OpenWeatherMap API key
5. ML training takes 5–15 seconds per request (no model caching between requests)

---

## 17. Future Enhancements

1. **Model caching** — Persist trained models to database, retrain on schedule
2. **User authentication** — JWT-based auth for personal favorites
3. **Push notifications** — Browser notifications for severe weather alerts
4. **LSTM/Transformer models** — Deep learning for improved forecast accuracy
5. **Weather radar** — Animated precipitation radar overlays
6. **PDF export** — Download weather reports as PDF
7. **Voice search** — Web Speech API integration
8. **PWA support** — Offline-capable progressive web app
9. **Rate limiting** — express-rate-limit on ML training endpoint
10. **WebSocket updates** — Real-time dashboard without polling

---

## 18. Conclusion

AERISYN demonstrates that a production-grade weather intelligence platform can be built entirely with open-source tools and free APIs. The system combines real-time data, machine learning, and AI assistance in a type-safe, well-architected monorepo that is ready for deployment and further development.

The project showcases skills in full-stack TypeScript development, statistical machine learning, API design, database management, and modern frontend engineering — making it suitable for professional portfolio presentation and technical interviews.

---

## 19. References

1. Open-Meteo API Documentation — https://open-meteo.com/en/docs
2. Open-Meteo Archive API — https://archive-api.open-meteo.com/
3. Open-Meteo Air Quality API — https://air-quality-api.open-meteo.com/
4. Nominatim Geocoding API — https://nominatim.openstreetmap.org/
5. React 19 Documentation — https://react.dev/
6. TanStack React Query v5 — https://tanstack.com/query/v5
7. Drizzle ORM Documentation — https://orm.drizzle.team/
8. Orval OpenAPI Generator — https://orval.dev/
9. Framer Motion — https://www.framer.com/motion/
10. Recharts — https://recharts.org/
11. React-Leaflet — https://react-leaflet.js.org/
12. shadcn/ui — https://ui.shadcn.com/
13. Hyndman, R.J. & Athanasopoulos, G. (2021). *Forecasting: Principles and Practice*, 3rd ed.
14. Breiman, L. (2001). Random Forests. *Machine Learning*, 45, 5–32.
15. Friedman, J.H. (2001). Greedy Function Approximation: A Gradient Boosting Machine. *Annals of Statistics*, 29(5), 1189–1232.
