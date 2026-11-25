# Wedding Planner Python Backend & Auth — Design Spec

**Date:** 2026-11-25  
**Frontend Reference:** [wedding_planner_web_app_full_implementation_plan.md](../../../wedding_planner_web_app_full_implementation_plan.md)  
**Approach Selected:** Approach 1 — FastAPI + Native Async PyMongo (`AsyncMongoClient`) + Pydantic v2 + Bearer JWT (`PyJWT`)

---

## 1. Intent & Why

The frontend in `frontend/` is complete and already isolated behind REST-shaped service modules (`weddingService`, `categoryService`, `expenseService`, `paymentService`) controlled by `VITE_USE_MOCK_API` and `VITE_API_BASE_URL`. Today, everything persists only in browser `localStorage`.

This project replaces that temporary `localStorage` layer with a real, persistent Python backend managed by `uv` in `backend/`, backed by MongoDB (run in a local Docker container for development and switched to MongoDB Atlas in production purely via environment variables). It also adds a botanical-styled Login screen backed by a pre-seeded MongoDB user so the workspace is gated before planning or resetting a wedding.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Python + `uv` Backend (`backend/`):** Initialize a Python 3.13 project managed by `uv` (`pyproject.toml`, `uv.lock`) using FastAPI, official `pymongo` (`AsyncMongoClient`), Pydantic v2, `pydantic-settings`, and `PyJWT`.
- **Docker MongoDB & Atlas-Ready Config:** Provide a `docker-compose.yml` running MongoDB locally with persistent volume storage, plus `.env.example` / environment configuration (`MONGODB_URI`, `MONGODB_DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, etc.) so switching to MongoDB Atlas in production requires only changing `.env`.
- **Pre-Seeded Login & Auth:** Seed a `users` collection in MongoDB on startup if missing (`username: "siddhartha"`, plaintext `password: "sidd@1996"` as explicitly requested), expose `POST /api/v1/auth/login` and `GET /api/v1/auth/me`, and protect all wedding/category/expense/payment routes with Bearer JWT.
- **Full REST Contract Compatibility:** Implement every `/api/v1` endpoint expected by `frontend/src/services/*.ts` with matching `camelCase` JSON shapes, filtering, cascade deletes, and `204 No Content` deletes.
- **Frontend Auth, Reset & UI Updates:**
  - Add a botanical-styled `LoginPage` (`/login`) and route guard in `App.tsx`, plus **Log Out** triggers in both Desktop/Tablet `Sidebar` and `SettingsPage` (so mobile users can log out cleanly without changing the 4-tab bottom bar).
  - Comment out the "Explore with sample wedding data" / "Load Sample Indian Wedding" buttons in `OnboardingPage.tsx` and `SettingsPage.tsx`.
  - Wire **Reset Data** (`weddingService.resetAll()`) to `POST /api/v1/wedding/reset` so wedding/category/expense data is cleared in MongoDB while preserving the user login account.
  - Flip `frontend/.env` to `VITE_USE_MOCK_API=false` pointing at `http://localhost:4000/api/v1`.

### Non-Goals
- Self-signup / user registration, forgot-password / password-reset flows, or multi-tenant user administration.
- Password hashing (user explicitly requested plaintext storage for the pre-seeded credential).
- Automatic migration of existing browser `localStorage` data into MongoDB.
- Email/SMS reminders or vendor integrations.

### Anti-Goals
- Hardcoding credentials inside frontend source files or pre-filling the password input in `LoginPage`.
- Leaking MongoDB `_id` / `ObjectId` types into JSON responses instead of string `id` fields matching TypeScript types.
- Deleting the `users` collection record during **Reset Data** (which would lock the user out).
- Using MongoDB features unavailable on standard standalone Docker MongoDB (e.g., requiring replica-set multi-document transactions for single-collection writes).

---

## 3. Constraints

- **Package & Runtime Management:** `uv` with Python 3.13 (`backend/pyproject.toml`, `uv.lock`).
- **Ports & Origins:** Backend listens on port `4000` (`http://localhost:4000/api/v1`) to match `frontend/.env.example`; CORS allows `http://localhost:5173` (and configurable `CORS_ORIGINS` for production).
- **MongoDB Compatibility:** Must work identically with `mongodb://localhost:27017` (Docker `mongo:7` or `mongo:8`) and `mongodb+srv://...` (MongoDB Atlas).
- **Frontend Stack:** React 19.3, TypeScript 7 (`verbatimModuleSyntax`, `erasableSyntaxOnly`), Tailwind CSS v4 (`botanical` palette), TanStack Query, `oxlint`, `pnpm`.

---

## 4. Approaches Considered

1. **Approach 1 — FastAPI + Native Async PyMongo (`AsyncMongoClient`) + Pydantic v2 + Bearer JWT (`PyJWT`) *(Selected)***
   - Uses PyMongo's built-in async client directly with thin repository functions and Pydantic v2 models (`populate_by_name=True` + `camelCase` aliases).
   - Stateless `Authorization: Bearer <jwt>` avoids cross-origin `SameSite`/`Secure` cookie issues between Vite (`:5173`) and FastAPI (`:4000`) or separate frontend/backend production hosts.
   - Minimal dependency surface and zero ODM coupling over a 4-collection schema.
2. **Approach 2 — FastAPI + Beanie ODM + MongoDB Cookie Sessions *(Rejected)***
   - Adds Beanie/Motor ODM abstraction over a small schema and requires cross-origin `HttpOnly` cookie configuration (`SameSite=None; Secure`, `credentials: 'include'`) when frontend and backend run on different origins in production.

---

## 5. Backend Architecture & Data Model

### Project Layout (`backend/`)
- `docker-compose.yml` (at repo root `d:\Wedding-Planner\docker-compose.yml` or `backend/docker-compose.yml` — placed at repo root `docker-compose.yml` so `docker compose up -d` starts MongoDB for the whole workspace)
- `backend/pyproject.toml` & `backend/uv.lock`
- `backend/.env.example` & `backend/.env` (gitignored)
- `backend/app/` — modular layout (internal file organization left to builder: config/settings, database lifespan & indexes/seeding, Pydantic schemas, auth utilities/dependencies, repositories, routers)
- `backend/tests/` — pytest suite covering auth, wedding profile/reset, categories + cascade delete, expenses + filtering/status, and payment records

### Environment Variables (`backend/.env.example`)
- `MONGODB_URI=mongodb://localhost:27017`
- `MONGODB_DB_NAME=wedding_planner`
- `JWT_SECRET=change-me-in-production`
- `JWT_ALGORITHM=HS256`
- `JWT_EXPIRE_MINUTES=10080` (7 days)
- `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`
- `SEED_USERNAME=siddhartha`
- `SEED_PASSWORD=sidd@1996`
- `PORT=4000`

### MongoDB Collections & Schema

All documents use string IDs stored in `_id` (mapped to `id` in API JSON responses) so IDs match the frontend's string `id` contracts without `ObjectId` conversion issues.

1. **`users`**
   - `_id`: string (e.g. `usr-<uuid8>`)
   - `username`: string (unique index)
   - `password`: string (plaintext, per user requirement)
   - `createdAt`, `updatedAt`: ISO-8601 UTC strings
   - **Startup seed:** On FastAPI lifespan startup, ensure indexes exist and check `users.find_one({"username": settings.seed_username})`; if missing, insert `siddhartha` / `sidd@1996`.

2. **`weddings`**
   - `_id`: string (e.g. `wed-<uuid8>`)
   - `userId`: string (unique index — one active wedding workspace per user)
   - `brideName`: string
   - `groomName`: string
   - `weddingDate`: string (`YYYY-MM-DD` or `""` before onboarding)
   - `totalBudget`: integer (`>= 0`)
   - `contingencyPercent`: integer (`0..50`)
   - `currency`: `"INR"`
   - `isOnboarded`: boolean
   - `createdAt`, `updatedAt`: ISO-8601 UTC strings
   - **Default bootstrap:** If `GET /api/v1/wedding` finds no `weddings` doc for the authenticated user, create and return a fresh un-onboarded document (`brideName: ""`, `groomName: ""`, `weddingDate: ""`, `totalBudget: 2500000`, `contingencyPercent: 10`, `currency: "INR"`, `isOnboarded: false`).

3. **`categories`**
   - `_id`: string (e.g. `cat-<uuid8>`)
   - `userId`: string
   - `weddingId`: string
   - `name`: string
   - `description`: optional string
   - `icon`: string
   - `allocatedBudget`: optional integer (`> 0`)
   - `sortOrder`: integer (auto-incremented after current max `sortOrder` for that user)
   - `createdAt`: ISO-8601 UTC string
   - Index on `(userId, sortOrder)`.

4. **`expenses`**
   - `_id`: string (e.g. `exp-<uuid8>`)
   - `userId`: string
   - `weddingId`: string
   - `categoryId`: string
   - `title`: string
   - `description`: optional string
   - `estimatedAmount`: integer (`>= 0`)
   - `dueDate`: optional string (`YYYY-MM-DD`)
   - `ceremony`: `"general" | "engagement" | "haldi" | "mehendi" | "sangeet" | "wedding" | "reception"` (default `"general"`)
   - `vendorName`: optional string
   - `vendorPhone`: optional string
   - `payments`: array of embedded `PaymentRecord` objects:
     - `id`: string (`pay-<uuid8>`)
     - `expenseId`: string
     - `amount`: integer (`>= 1`)
     - `paidDate`: string (`YYYY-MM-DD`)
     - `label`: string
     - `method`: `"upi" | "bank_transfer" | "cash" | "card" | "cheque"`
     - `paidBy`: `"joint" | "bride" | "groom"`
     - `note`: optional string
   - `createdAt`, `updatedAt`: ISO-8601 UTC strings
   - Index on `(userId, categoryId)` and `(userId, createdAt)`.

---

## 6. REST API Contracts

All endpoints except `/health` and `/api/v1/auth/login` require `Authorization: Bearer <token>` and return `401 Unauthorized` when missing, malformed, or expired. Every resource query/mutation is scoped to `current_user.id`.

| Method & Path | Request / Query | Response | Behavior Notes |
| :--- | :--- | :--- | :--- |
| `GET /health` | — | `200 { status, database }` / `503` | Pings MongoDB (`client.admin.command("ping")`) |
| `POST /api/v1/auth/login` | `{ username, password }` | `200 { accessToken, tokenType, user: { id, username } }` | Verifies against `users` doc; `401` on mismatch |
| `GET /api/v1/auth/me` | — | `200 { id, username }` | Validates current JWT and returns user |
| `GET /api/v1/wedding` | — | `200 WeddingProfile` | Returns or bootstraps un-onboarded wedding |
| `PUT /api/v1/wedding` | `SaveWeddingPayload` | `200 WeddingProfile` | Upserts couple profile & budget |
| `POST /api/v1/wedding/reset` | — | `200 WeddingProfile` | Deletes user's `expenses`, `categories`, `weddings`; returns fresh un-onboarded profile |
| `GET /api/v1/categories` | — | `200 Category[]` | Sorted ascending by `sortOrder` |
| `GET /api/v1/categories/{id}` | — | `200 Category` / `404` | Returns single category |
| `POST /api/v1/categories` | `CreateCategoryPayload` | `201 Category` | Assigns next `sortOrder` |
| `PATCH /api/v1/categories/{id}` | `UpdateCategoryPayload` | `200 Category` / `404` | Partial update; `allocatedBudget <= 0` clears cap |
| `DELETE /api/v1/categories/{id}` | — | `204 No Content` / `404` | Cascade-deletes expenses in that category |
| `GET /api/v1/expenses` | `?categoryId=&status=&ceremony=&paidBy=&search=` | `200 Expense[]` | Sorted newest first; `status` computed identically to frontend (`paid`, `overdue`, `partial`, `unpaid`); `search` matches `title`/`description`/`vendorName`; `paidBy` matches any embedded payment |
| `GET /api/v1/expenses/{id}` | — | `200 Expense` / `404` | Returns single expense |
| `POST /api/v1/expenses` | `CreateExpensePayload` | `201 Expense` | Validates `categoryId` exists; creates optional `advancePayment` in `payments[]` |
| `PATCH /api/v1/expenses/{id}` | `UpdateExpensePayload` | `200 Expense` / `404` | Partial update (preserves `payments[]`) |
| `DELETE /api/v1/expenses/{id}` | — | `204 No Content` / `404` | Deletes expense |
| `POST /api/v1/expenses/{id}/payments` | `CreatePaymentPayload` | `200 Expense` / `404` | Appends `PaymentRecord` via `$push` and updates `updatedAt` |
| `DELETE /api/v1/expenses/{id}/payments/{paymentId}` | — | `200 Expense` / `404` | Removes matching payment via `$pull` and updates `updatedAt` |

---

## 7. Frontend Integration Changes

1. **Auth Layer & Client (`frontend/src/`)**
   - Add `authService` (`login`, `me`, `logout`, token storage in `localStorage` under `wedding_planner_auth_token`). In `VITE_USE_MOCK_API=true` mode, `authService` can validate against mock credentials or remain optional, while `VITE_USE_MOCK_API=false` hits `/api/v1/auth/*`.
   - Update `apiClient.ts` to read the stored Bearer token and attach `Authorization: Bearer <token>`. On `401` (excluding `/auth/login`), clear stored token and notify auth state so the app redirects to `/login` cleanly.
   - Add `AuthContext` / `useAuth` hook managing authenticated user state (`loading`, `user`, `login`, `logout`). On logout, clear token and clear TanStack Query cache (`queryClient.clear()`).

2. **Botanical Login Screen (`LoginPage.tsx` & `App.tsx`)**
   - Create `LoginPage.tsx` matching the `botanical` aesthetic (`bg-botanical-cream` canvas, `bg-botanical-white` card, `border-botanical-beige`, `Cormorant Garamond` title, `Plus Jakarta Sans` inputs, `Button variant="primary"`).
   - Contains **only** Username + Password fields and Sign In button (no self-signup, no forgot-password, no pre-filled password).
   - Gate `AppRoutes` in `App.tsx`: unauthenticated users see `/login` (with `*` redirecting to `/login`); authenticated users proceed to `useWedding()` onboarding/app shell.
   - Add **Log Out** button in `Sidebar.tsx` and in `SettingsPage.tsx` (ensuring mobile users can log out cleanly without altering the 4-tab `MobileBottomNav`).

3. **Sample Data & Reset Wiring**
   - Comment out the *"Explore with sample wedding data"* block in `OnboardingPage.tsx` and the *"Load Sample Indian Wedding"* button in `SettingsPage.tsx` (keep commented JSX/handlers cleanly marked rather than deleting, per request).
   - Update `weddingService.resetAll()` so when `VITE_USE_MOCK_API=false` it calls `POST /api/v1/wedding/reset`. Update `SettingsPage.tsx` wording from *"Reset Local Data"* / *"localStorage"* to *"Reset Data"* / *"Reset Wedding Data"* describing that all wedding, category, and expense data in the database will be cleared so a new wedding can be planned.

4. **Environment Files**
   - Update `frontend/.env.example` / create `frontend/.env` with `VITE_USE_MOCK_API=false` and `VITE_API_BASE_URL=http://localhost:4000/api/v1`.

---

## 8. Left to the Builder

- Internal module naming and structure under `backend/app/` and `backend/tests/`.
- `ruff` / `pytest` configuration in `backend/pyproject.toml`.
- Exact validation constraints and HTTP `422` / `400` / `404` / `401` error payload details (consistent `{ detail: ... }` FastAPI error shape; `apiClient.ts` parses JSON error messages cleanly).
- Exact local Docker MongoDB credentials or unauthenticated local dev container config (default `mongodb://localhost:27017` works smoothly for local Docker `mongo:7` without extra setup, while `MONGODB_URI` supports full auth/SRV strings for Atlas).
