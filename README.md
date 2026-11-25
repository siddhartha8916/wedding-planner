# Bandhan — Wedding Budget Planner

Full-stack TypeScript wedding budget planner built with **React + Vite + Tailwind CSS v4** on the frontend and a **Hono + MongoDB** API running on **Cloudflare Workers** (with Workers Static Assets serving both the UI and `/api/v1/*` from one deployment).

## Architecture

- **[frontend/](frontend)** — Vite + React 19 + TypeScript + Tailwind CSS v4 (`botanical` palette), TanStack Query, React Hook Form, and Zod.
  - Production builds read [frontend/.env.production](frontend/.env.production) (`VITE_API_BASE_URL=/api/v1`) so the SPA and API run on the **same origin** in Cloudflare Workers.
  - Local Vite dev reads `frontend/.env` (`VITE_API_BASE_URL=http://localhost:4000/api/v1`).
- **[backend/](backend)** — TypeScript Cloudflare Worker powered by **Hono**, official **`mongodb`** Node driver (`nodejs_compat`), **`jose`** (HS256 JWT), and **`zod`**.
  - Configured via [backend/wrangler.jsonc](backend/wrangler.jsonc) with `nodejs_compat`, observability logs & traces, regional placement hint `aws:ap-south-1` (Mumbai), and Workers Static Assets (`../frontend/dist`, `not_found_handling: "single-page-application"`, `run_worker_first: ["/api/*", "/health"]`).
- **[docker-compose.yml](docker-compose.yml)** — Local MongoDB 8.0 container (`wedding-planner-mongodb`) on port `27017` for development and integration testing.

---

## Prerequisites

- **Node.js** 22+ and **pnpm** (`corepack enable` or `npm install -g pnpm`)
- **Docker Desktop** (for local MongoDB)
- **Cloudflare account** (Workers Free Tier works for both the API and Static Assets)
- **MongoDB Atlas cluster** (configured for `AWS / Mumbai (ap-south-1)` to match `wrangler.jsonc` placement)

---

## Local Development

### 1. Start Local MongoDB

```bash
docker compose up -d
```

### 2. Install Dependencies

```bash
pnpm --dir frontend install
pnpm --dir backend install
```

### 3. Configure Local Worker Secrets

Create `backend/.dev.vars` from the example file (never commit `.dev.vars`):

```bash
cp backend/.dev.vars.example backend/.dev.vars
```

Default `backend/.dev.vars` values for local Docker MongoDB:

```dotenv
MONGODB_URI=mongodb://localhost:27017
JWT_SECRET=local-dev-secret-change-in-production-min-32-bytes
SEED_PASSWORD=sidd@1996
```

### 4. Run Locally

**Option A — Single local Worker server (matches production routing):**

```bash
pnpm --dir frontend run build
pnpm --dir backend run dev
```

Open `http://localhost:4000`. The Worker serves the built React app and `/api/v1/*` on the same port.

**Option B — Hot-reload Vite dev server + Worker API:**

Terminal 1 (API on `:4000`):
```bash
pnpm --dir backend run dev
```

Terminal 2 (React SPA on `:5173`):
```bash
pnpm --dir frontend run dev
```

Open `http://localhost:5173`. Sign in with the pre-seeded account (`siddhartha` / `sidd@1996`).

### 5. Run Tests & Checks

```bash
# Backend typecheck + real workerd/Miniflare integration tests (requires local MongoDB running)
pnpm --dir backend run typecheck
pnpm --dir backend test

# Frontend unit tests, lint, typecheck & production build
node --experimental-strip-types --test frontend/src/utils/__tests__/*.test.ts frontend/src/services/__tests__/*.test.ts
pnpm --dir frontend run lint
pnpm --dir frontend run build
```

---

## Deploying to Cloudflare Workers

One `wrangler deploy` deploys **both** the React frontend (`frontend/dist`) and the TypeScript API (`backend/src/index.ts`) onto a single `*.workers.dev` URL on Cloudflare's free tier.

### Step 1: Prepare MongoDB Atlas

1. In MongoDB Atlas, go to **Database -> Connect -> Drivers -> Node.js** and copy your connection string (`mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority`).
2. Under **Security -> Network Access**, allow `0.0.0.0/0`.
   - *Why:* Cloudflare Workers run across edge locations without a fixed static outbound IP on the free tier, so Atlas must accept connections from any Worker IP (protected by TLS and your database user credentials).
3. [backend/wrangler.jsonc](backend/wrangler.jsonc) is already configured with `"placement": { "region": "aws:ap-south-1" }` to execute your Worker close to your Mumbai Atlas cluster.

### Step 2: Log In to Cloudflare with Wrangler

```bash
pnpm --dir backend exec wrangler login
pnpm --dir backend exec wrangler whoami
```

### Step 3: Set Production Secrets

Non-secret configuration (`MONGODB_DB_NAME`, `JWT_EXPIRE_MINUTES`, `SEED_USERNAME`, `CORS_ORIGINS`) lives in `vars` inside [backend/wrangler.jsonc](backend/wrangler.jsonc).  
Sensitive values must be stored as encrypted Cloudflare Worker secrets (never in `wrangler.jsonc`):

```bash
# 1. Paste your MongoDB Atlas mongodb+srv://... connection string
pnpm --dir backend exec wrangler secret put MONGODB_URI

# 2. Paste a strong random 32+ character string (e.g. output of `openssl rand -hex 32`)
pnpm --dir backend exec wrangler secret put JWT_SECRET

# 3. Paste the initial seeded login password (e.g. sidd@1996)
pnpm --dir backend exec wrangler secret put SEED_PASSWORD
```

> **Note:** On the very first request after deploy (e.g. `GET /health` or `POST /api/v1/auth/login`), the Worker automatically creates MongoDB indexes and seeds the default user (`SEED_USERNAME` / `SEED_PASSWORD`) if it does not exist yet.

### Step 4: Build & Deploy

Run the combined build and deploy script from the repo root:

```bash
pnpm --dir backend run deploy
```

This runs:
1. `pnpm --dir ../frontend run build` (using `frontend/.env.production`, which points API calls to same-origin `/api/v1`)
2. `wrangler deploy` (uploads static assets from `frontend/dist` and your TypeScript Worker bundle)

Wrangler will output your live URL, such as:
`https://wedding-planner.<your-subdomain>.workers.dev`

### Step 5: Verify & Monitor

1. Check health: open `https://wedding-planner.<your-subdomain>.workers.dev/health` — should return `{"status":"ok","database":"ok"}`.
2. Open the root URL, sign in with `siddhartha` and your `SEED_PASSWORD`, and complete onboarding.
3. Stream live production logs anytime with:
   ```bash
   pnpm --dir backend exec wrangler tail
   ```

> **Optional Custom Domain:** If you attach a custom domain in the Cloudflare Dashboard (Workers & Pages -> `wedding-planner` -> Settings -> Domains & Routes), same-origin `/api/v1` continues working automatically with no CORS changes needed. If you host a separate frontend origin, add it to `CORS_ORIGINS` in [backend/wrangler.jsonc](backend/wrangler.jsonc) and redeploy.
