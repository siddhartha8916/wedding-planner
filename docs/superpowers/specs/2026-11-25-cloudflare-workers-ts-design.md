# Wedding Planner TypeScript Cloudflare Worker — Short Design Doc

**Date:** 2026-11-25  
**Previous Spec:** [2026-11-25-wedding-planner-backend-design.md](2026-11-25-wedding-planner-backend-design.md)

## Intent & Why
Replace the Python backend in `backend/` with a pure TypeScript Cloudflare Worker so the entire application (`frontend/` + `backend/`) runs on Cloudflare Workers Free Tier and connects directly to MongoDB Atlas (`8.0.28`, AWS `ap-south-1` Mumbai). Python Workers run in Pyodide/Wasm where `pymongo` is unsupported, and MongoDB Atlas Data API reached EOL on September 30, 2025; TypeScript Workers with `nodejs_compat` support the official `mongodb` Node driver natively.

## Goals, Non-Goals & Anti-Goals
- **Goals:**
  - Replace Python files in `backend/` with a TypeScript Worker powered by **Hono**, official **`mongodb`** (`nodejs_compat`), **`jose`** (Web Crypto HS256 JWT), and **`zod`** (`>=4.5.0`).
  - Configure `backend/wrangler.jsonc` with `nodejs_compat`, `observability` (logs + traces), regional placement near `aws:ap-south-1`, and Workers Static Assets (`directory: "../frontend/dist"`, `not_found_handling: "single-page-application"`, `run_worker_first: ["/api/*", "/health"]`) so a single `wrangler deploy` deploys both UI and API on the same origin.
  - Generate binding types via `wrangler types` (`worker-configuration.d.ts`).
  - Add `frontend/.env.production` (`VITE_API_BASE_URL=/api/v1`) while keeping local Vite dev (`http://localhost:5173`) working against `wrangler dev --port 4000` and Docker MongoDB (`docker-compose.yml`).
  - Write a comprehensive root `README.md` explaining architecture, local dev, MongoDB Atlas setup (`0.0.0.0/0` IP allowlist for Workers), Wrangler secrets, and deployment steps.
- **Non-Goals:** Changing frontend UI components or REST JSON contracts, adding signup/forgot-password, or hashing the requested plaintext pre-seeded password.
- **Anti-Goals:** Hand-writing `interface Env` instead of `wrangler types`, calling `client.close()` on every Worker request, storing secrets in `wrangler.jsonc`, or using timing-unsafe string comparisons for passwords.

## Approaches Considered
1. **Hono TypeScript Worker + `mongodb` (`nodejs_compat`) + Workers Static Assets *(Selected)***: Single-origin deployment on Cloudflare Workers Free Tier, full TypeScript end-to-end, official MongoDB driver, zero CORS in production.
2. **Cloudflare Containers (`Dockerfile` + Python FastAPI)**: Keeps Python backend unmodified, but requires Workers Paid plan (\$5/month).
3. **Python Workers + Cloudflare D1**: Stays on Python + free tier, but drops MongoDB.

## Approved Design Summary
- **Backend (`backend/`):** `wrangler.jsonc`, `package.json`, `tsconfig.json`, `src/index.ts` (Hono app + CORS + structured JSON logging + error handler), `src/db.ts` (module-cached `MongoClient`, idempotent index creation & `siddhartha`/`sidd@1996` seeding), `src/security.ts` (`jose` JWT + `crypto.subtle.timingSafeEqual` SHA-256 constant-time password check), `src/schemas/`, `src/repositories/`, `src/routes/`, and Vitest tests.
- **Verification:** `wrangler types`, `tsc --noEmit`, `wrangler deploy --dry-run`, `vitest` suite against MongoDB, `frontend` build/lint/tests, and live `wrangler dev` + `frontend` E2E verification.
