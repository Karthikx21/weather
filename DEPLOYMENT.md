# Deployment Guide

AERISYN supports multiple deployment targets. The recommended production stack is:

| Layer | Service |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Supabase (PostgreSQL) |

---

## Option A — Vercel (Frontend) + Render (Backend) + Supabase (DB)

### 1. Database — Supabase

1. Create a free project at https://supabase.com/
2. Go to **Settings → Database → Connection string** and copy the URI
3. Run migrations against Supabase:
   ```bash
   DATABASE_URL=your_supabase_url npm --workspace @workspace/db exec drizzle-kit push
   ```

### 2. Backend — Render

1. Create a new **Web Service** at https://render.com/
2. Connect your GitHub repository
3. Configure:
   - **Root Directory:** `apps/backend`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start:backend`
   - **Node Version:** 20
4. Add environment variables:
   ```
   PORT=3001
   DATABASE_URL=your_supabase_connection_string
   ALLOWED_ORIGIN=https://your-app.vercel.app
   GEMINI_API_KEY=your_key (optional)
   ```
5. Deploy — note your Render service URL (e.g. `https://aerisyn-api.onrender.com`)

### 3. Frontend — Vercel

1. Import your repository at https://vercel.com/new
2. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist/public`
3. Add environment variables:
   ```
   VITE_API_BASE_URL=https://aerisyn-api.onrender.com
   VITE_OWM_API_KEY=your_key (optional)
   ```
4. Deploy

---

## Option B — Docker (Self-Hosted)

### Build Images

```bash
# Backend
docker build -f apps/backend/Dockerfile -t aerisyn-api .

# Frontend
docker build -f apps/frontend/Dockerfile -t aerisyn-web .
```

### docker-compose.yml (Production)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: aerisyn
    volumes:
      - postgres_data:/var/lib/postgresql/data

  api:
    image: aerisyn-api
    environment:
      PORT: 3001
      DATABASE_URL: postgresql://postgres:${DB_PASSWORD}@postgres:5432/aerisyn
      ALLOWED_ORIGIN: ${FRONTEND_URL}
      GEMINI_API_KEY: ${GEMINI_API_KEY}
    depends_on:
      - postgres
    ports:
      - "3001:3001"

  web:
    image: aerisyn-web
    ports:
      - "80:80"

volumes:
  postgres_data:
```

---

## Environment Variables Reference

### Backend (`apps/backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `PORT` | Yes | Server port (default: 3001) |
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `ALLOWED_ORIGIN` | Yes | Frontend URL for CORS |
| `GEMINI_API_KEY` | No | Google Gemini API key for AI assistant |

### Frontend (`apps/frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_BASE_URL` | No | Backend API URL (default: proxied via Vite) |
| `VITE_OWM_API_KEY` | No | OpenWeatherMap key for map overlays |

---

## CI/CD

The included GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push to `main`:
1. Installs dependencies with npm
2. Runs TypeScript type checking across all packages
3. Builds the entire workspace

To enable automatic deployment, connect your Render and Vercel projects to your GitHub repository for auto-deploy on push.
