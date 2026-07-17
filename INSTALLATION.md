# Installation Guide

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20+ | https://nodejs.org/ |
| npm | 11+ | Bundled with current Node.js |
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop/ |
| Git | Latest | https://git-scm.com/ |

---

## Step 1 — Clone the Repository

```bash
git clone https://github.com/your-username/aerisyn.git
cd aerisyn
```

---

## Step 2 — Install Dependencies

```bash
npm install
```

This installs all workspace packages including frontend, backend, and shared packages.

---

## Step 3 — Start PostgreSQL

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL 16** on port `5432`
- **pgAdmin 4** on port `5050` (admin@aerisyn.local / admin)

---

## Step 4 — Configure Environment Variables

### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```env
PORT=3001
DATABASE_URL=postgresql://postgres:password@localhost:5432/aerisyn
ALLOWED_ORIGIN=http://localhost:5173
GEMINI_API_KEY=your_gemini_api_key_here
```

> `GEMINI_API_KEY` is optional. Without it, the AI Assistant uses the built-in rule-based engine.
> Get a free key at https://aistudio.google.com/

### Frontend (Optional)

```bash
cp apps/frontend/.env.example apps/frontend/.env
```

Edit `apps/frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_OWM_API_KEY=your_owm_key_here
```

> `VITE_OWM_API_KEY` is optional. Without it, map weather overlays are disabled.
> Get a free key at https://openweathermap.org/api

---

## Step 5 — Run Database Migrations

```bash
cd packages/db
npm exec drizzle-kit push
cd ../..
```

---

## Step 6 — Build the Backend

```bash
cd apps/backend
npm run build
```

---

## Step 7 — Start the Application

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd apps/backend
npm start
```
Backend runs at: http://localhost:3001

**Terminal 2 — Frontend:**
```bash
cd apps/frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## Verify Installation

1. Open http://localhost:5173
2. The dashboard should load with live weather data for London (default location)
3. Allow location access for automatic GPS detection
4. Navigate to **ML Predictions** — models train automatically on first load
5. Navigate to **AI Assistant** — test a question like "Should I carry an umbrella?"

---

## Troubleshooting

### `DATABASE_URL` connection error
Ensure Docker is running: `docker-compose up -d`

### Port already in use
Change `PORT` in `apps/backend/.env` and update `VITE_API_BASE_URL` in `apps/frontend/.env` accordingly.

### ML predictions timeout
The first ML prediction request fetches 90 days of historical data and trains 4 models — this takes 5–15 seconds. Subsequent requests are faster.

### npm install fails
Use the current LTS or newer Node.js release, then rerun `npm install`.
