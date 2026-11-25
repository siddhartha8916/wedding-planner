# Wedding Planner Python Backend & Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `uv`-managed FastAPI + async PyMongo backend backed by Docker MongoDB (Atlas-ready via `.env`), add botanical-themed Login/Logout auth against the pre-seeded user (`siddhartha` / `sidd@1996`), wire Reset Data to MongoDB, comment out sample-data UI triggers, and clean up Tailwind v4 canonical spacing warnings across `frontend/`.

**Architecture:** A modular FastAPI application in `backend/app/` connects to MongoDB via `pymongo.AsyncMongoClient`, validates/serializes `camelCase` DTOs with Pydantic v2, and secures `/api/v1` endpoints with HS256 Bearer JWT (`PyJWT`). On the frontend, `apiClient.ts` attaches the Bearer token and handles `401` expiry, `AuthContext` + `LoginPage` gate routes in `App.tsx`, and `VITE_USE_MOCK_API=false` switches all services to `http://localhost:4000/api/v1`.

**Tech Stack:** Python 3.13, `uv`, FastAPI, Uvicorn, `pymongo` (`AsyncMongoClient`), Pydantic v2, `pydantic-settings`, `PyJWT`, `pytest`, `httpx`, Docker Compose (`mongo:7`), React 19, TypeScript 7, Tailwind CSS v4, TanStack Query, `oxlint`, `pnpm`.

**Spec:** [2026-11-25-wedding-planner-backend-design.md](../specs/2026-11-25-wedding-planner-backend-design.md)

## Global Constraints

- **Python & `uv`:** Python 3.13 managed via `uv` (`backend/pyproject.toml`, `backend/uv.lock`).
- **MongoDB Portability:** Local development runs MongoDB via Docker Compose (`mongodb://localhost:27017`); switching to MongoDB Atlas (`mongodb+srv://...`) in production must require only `.env` changes (`MONGODB_URI`, `MONGODB_DB_NAME`) and must not rely on replica-set-only transactions.
- **Pre-Seeded Plaintext Credential:** Startup seeds `users` collection if missing with `username: "siddhartha"` and plaintext `password: "sidd@1996"` (configurable via `SEED_USERNAME` / `SEED_PASSWORD`). No self-signup, no forgot-password, and no credentials hardcoded in `frontend/src/`.
- **Exact JSON Contracts:** API JSON uses `camelCase` field names and string `id` values matching `frontend/src/types/wedding.ts` and `frontend/src/types/api.ts`; `DELETE` category/expense endpoints return `204 No Content`.
- **Frontend Rules:** TypeScript 7 (`verbatimModuleSyntax`, `erasableSyntaxOnly`), botanical Tailwind v4 theme (no arbitrary `px` classes that trigger canonical class warnings), `oxlint` and `tsc -b` must pass with zero errors.
- **Sample Data & Reset:** Comment out *"Explore with sample wedding data"* (`OnboardingPage.tsx`) and *"Load Sample Indian Wedding"* (`SettingsPage.tsx`); wire Reset Data to `POST /api/v1/wedding/reset` while keeping `users` intact.

## Review Focus

1. **Unauthenticated & expired-token handling:** Missing, malformed, or expired Bearer tokens (or tokens for nonexistent users) must return `401` on protected routes, and `apiClient.ts` must clear auth state and redirect to `/login` without triggering a redirect loop on `/auth/login`.
2. **Status & filter parity with frontend:** Server-side `GET /api/v1/expenses` filtering (`status`, `ceremony`, `paidBy`, `search`, `categoryId`) must match `frontend/src/utils/calculations.ts` (`paid` when `estimatedAmount > 0 && paidAmount >= estimatedAmount`, `overdue` when `upcomingAmount > 0 && dueDate < todayIso`, `partial` when `paidAmount > 0`, `unpaid` otherwise).
3. **Missing resource & invalid foreign keys:** Creating an expense under a nonexistent `categoryId`, or operating on an unknown `categoryId` / `expenseId` / `paymentId`, must return `404` cleanly.
4. **Cascade delete & Reset safety:** Deleting a category deletes its expenses; `POST /api/v1/wedding/reset` clears `weddings`, `categories`, and `expenses` for that user while keeping the `users` credential document intact.
5. **Input normalization & validation:** Empty optional strings (`""` for `description`, `dueDate`, `vendorName`, `vendorPhone`, `note`) normalize to `None` (omitted), `allocatedBudget <= 0` clears the cap, and whitespace-only required strings (`title`, `name`, `brideName`, `groomName`) fail with `422`.

---

### Task 1: Docker MongoDB, Backend `uv` Scaffold, Config & Startup Seeding

**Files:**
- Create: `docker-compose.yml`
- Modify: `.gitignore`
- Create: `backend/pyproject.toml`, `backend/.env.example`, `backend/.env`
- Create: `backend/app/__init__.py`, `backend/app/config.py`, `backend/app/db.py`, `backend/app/main.py`
- Create: `backend/tests/__init__.py`, `backend/tests/conftest.py`, `backend/tests/test_health_and_seed.py`

**Interfaces:**
- Produces:
  - `Settings` in `backend/app/config.py` (`mongodb_uri`, `mongodb_db_name`, `jwt_secret`, `jwt_algorithm`, `jwt_expire_minutes`, `cors_origins_list`, `seed_username`, `seed_password`, `port`)
  - `DatabaseManager` / `get_db(request: Request) -> AsyncDatabase` in `backend/app/db.py`
  - `create_app() -> FastAPI` in `backend/app/main.py` with lifespan index creation & user seeding, CORS middleware, and `GET /health`
  - Pytest fixtures `client` (async `httpx.AsyncClient` against isolated test DB `wedding_planner_test`) and `auth_headers` (in Task 2) in `backend/tests/conftest.py`

- [ ] **Step 1: Create `docker-compose.yml` and update `.gitignore`**
  Add `mongo:7` service exposed on `27017:27017` with named volume `mongodb_data:/data/db` and healthcheck (`mongosh --eval "db.adminCommand('ping')"`). Add `.venv/`, `__pycache__/`, `*.pyc`, `.pytest_cache/`, `backend/.env` to `.gitignore`.

- [ ] **Step 2: Initialize `backend/` `uv` project and environment files**
  Create `backend/pyproject.toml` (`requires-python = ">=3.13"`, dependencies: `fastapi`, `uvicorn[standard]`, `pymongo`, `pydantic-settings`, `pyjwt`; dev dependencies: `pytest`, `pytest-asyncio`, `httpx`, `ruff`) and `backend/.env.example` + `backend/.env` (`MONGODB_URI=mongodb://localhost:27017`, `MONGODB_DB_NAME=wedding_planner`, `JWT_SECRET`, `SEED_USERNAME=siddhartha`, `SEED_PASSWORD=sidd@1996`, `PORT=4000`, `CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173`). Run `uv sync` in `backend/`.

- [ ] **Step 3: Write failing test `backend/tests/test_health_and_seed.py`**

```python
@pytest.mark.asyncio
async def test_health_and_seeded_user(client, test_db):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "ok"}

    user = await test_db["users"].find_one({"username": "siddhartha"})
    assert user is not None
    assert user["password"] == "sidd@1996"
    assert isinstance(user["_id"], str) and user["_id"].startswith("usr-")
```

- [ ] **Step 4: Run test to verify it fails**
  Run `uv run pytest tests/test_health_and_seed.py -v` in `backend/` -> Expected FAIL (`ModuleNotFoundError: No module named 'app'`).

- [ ] **Step 5: Implement `config.py`, `db.py`, `main.py`, and `conftest.py`**
  - `config.py`: `Settings(BaseSettings)` reading `backend/.env` with `cors_origins_list` property splitting comma-separated `CORS_ORIGINS`.
  - `db.py`: `AsyncMongoClient(settings.mongodb_uri)` lifecycle, `ensure_indexes(db)` (unique indexes on `users.username` and `weddings.userId`; compound indexes on `categories(userId, sortOrder)` and `expenses(userId, categoryId)`), `seed_default_user(db, settings)` idempotently inserting `usr-<uuid8>` if username missing, and `get_db(request: Request) -> AsyncDatabase`.
  - `main.py`: `create_app(settings_override: Settings | None = None) -> FastAPI` with lifespan, `CORSMiddleware`, and `GET /health` pinging MongoDB (returning `503` if ping raises). Also expose module-level `app = create_app()`.
  - `conftest.py`: Start app lifespan against `MONGODB_DB_NAME=wedding_planner_test`, drop test collections before/after test session or per test, yield `httpx.AsyncClient(transport=ASGITransport(app=app), base_url="http://test")`.

- [ ] **Step 6: Start Docker MongoDB and verify test passes**
  Run `docker compose up -d` at root, wait for healthy MongoDB, then run `uv run pytest tests/test_health_and_seed.py -v` in `backend/` -> Expected PASS.

- [ ] **Step 7: Commit**
  Commit `docker-compose.yml`, `.gitignore`, and `backend/` scaffold.

---

### Task 2: Auth & JWT Security (`/api/v1/auth/login`, `/api/v1/auth/me`)

**Files:**
- Create: `backend/app/schemas/__init__.py`, `backend/app/schemas/auth.py`
- Create: `backend/app/security.py`
- Create: `backend/app/repositories/__init__.py`, `backend/app/repositories/user_repo.py`
- Create: `backend/app/routers/__init__.py`, `backend/app/routers/auth.py`
- Modify: `backend/app/main.py`, `backend/tests/conftest.py`
- Test: `backend/tests/test_auth.py`

**Interfaces:**
- Consumes: `get_db`, `Settings`
- Produces:
  - `LoginRequest(username: str, password: str)`, `UserPublic(id: str, username: str)`, `TokenResponse(accessToken: str, tokenType: str, user: UserPublic)`
  - `create_access_token(user_id: str, username: str, settings: Settings) -> str`
  - `get_current_user(...) -> UserPublic` FastAPI dependency (reads `HTTPBearer` / `Authorization: Bearer <token>`, verifies JWT signature & expiry, confirms user exists in `users`, else raises `401`)
  - `auth_headers` fixture in `backend/tests/conftest.py`

- [ ] **Step 1: Write failing auth tests in `backend/tests/test_auth.py`**

```python
@pytest.mark.asyncio
async def test_login_success_and_me(client):
    res = await client.post("/api/v1/auth/login", json={"username": "siddhartha", "password": "sidd@1996"})
    assert res.status_code == 200
    body = res.json()
    assert body["tokenType"] == "bearer"
    assert body["user"]["username"] == "siddhartha"
    assert body["accessToken"]

    me = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {body['accessToken']}"})
    assert me.status_code == 200
    assert me.json() == body["user"]

@pytest.mark.asyncio
async def test_login_invalid_and_missing_token_return_401(client):
    bad = await client.post("/api/v1/auth/login", json={"username": "siddhartha", "password": "wrong"})
    assert bad.status_code == 401
    unauth = await client.get("/api/v1/auth/me")
    assert unauth.status_code == 401
    tampered = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert tampered.status_code == 401
```

- [ ] **Step 2: Run test to verify failure**
  Run `uv run pytest tests/test_auth.py -v` -> Expected FAIL (`404 Not Found`).

- [ ] **Step 3: Implement `schemas/auth.py`, `security.py`, `repositories/user_repo.py`, `routers/auth.py`, wire into `main.py`, and add `auth_headers` to `conftest.py`**
  - Plaintext equality check (`hmac.compare_digest` or `==`) against `users` document (`username.strip()`).
  - Return `401` (`WWW-Authenticate: Bearer`) for missing/malformed/expired token or missing user record.

- [ ] **Step 4: Run tests to verify pass**
  Run `uv run pytest tests/test_auth.py tests/test_health_and_seed.py -v` -> Expected PASS.

- [ ] **Step 5: Commit**

---

### Task 3: Wedding Profile & Reset Endpoints (`/api/v1/wedding`, `/api/v1/wedding/reset`)

**Files:**
- Create: `backend/app/schemas/wedding.py`
- Create: `backend/app/repositories/wedding_repo.py`
- Create: `backend/app/routers/wedding.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_wedding.py`

**Interfaces:**
- Consumes: `get_current_user`, `get_db`, `UserPublic`
- Produces:
  - `WeddingProfile(id, brideName, groomName, weddingDate, totalBudget, contingencyPercent, currency, isOnboarded, createdAt, updatedAt)`
  - `SaveWeddingPayload(brideName, groomName, weddingDate, totalBudget, contingencyPercent, isOnboarded=None)`
  - `get_or_bootstrap_wedding(db: AsyncDatabase, user_id: str) -> dict`

- [ ] **Step 1: Write failing tests in `backend/tests/test_wedding.py`**
  Cover:
  - `test_wedding_requires_auth`: `GET /api/v1/wedding` without token returns `401`.
  - `test_get_wedding_bootstraps_unonboarded`: returns `isOnboarded: False`, `currency: "INR"`, `totalBudget: 2500000`, `contingencyPercent: 10`.
  - `test_put_wedding_saves_profile`: updates `brideName`, `groomName`, `weddingDate`, `totalBudget`, `contingencyPercent`, `isOnboarded: True`, clamps `contingencyPercent` to `0..50` and `totalBudget >= 0`, rejects whitespace-only names (`422`).
  - `test_reset_wedding_clears_data_preserves_user`: after creating wedding + category + expense, `POST /api/v1/wedding/reset` returns fresh `isOnboarded: False` profile, `categories` and `expenses` for that user are empty, and `GET /api/v1/auth/me` still returns `siddhartha`.

- [ ] **Step 2: Run test to verify failure**
  Run `uv run pytest tests/test_wedding.py -v` -> Expected FAIL.

- [ ] **Step 3: Implement `schemas/wedding.py`, `repositories/wedding_repo.py`, `routers/wedding.py`, and include router in `main.py`**

- [ ] **Step 4: Run tests to verify pass**
  Run `uv run pytest tests/test_wedding.py -v` -> Expected PASS.

- [ ] **Step 5: Commit**

---

### Task 4: Categories CRUD & Cascade Delete (`/api/v1/categories`)

**Files:**
- Create: `backend/app/schemas/category.py`
- Create: `backend/app/repositories/category_repo.py`
- Create: `backend/app/routers/categories.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_categories.py`

**Interfaces:**
- Consumes: `get_current_user`, `get_db`, `get_or_bootstrap_wedding`
- Produces:
  - `Category(id, weddingId, name, description?, icon, allocatedBudget?, sortOrder, createdAt)`
  - `CreateCategoryPayload`, `UpdateCategoryPayload`

- [ ] **Step 1: Write failing tests in `backend/tests/test_categories.py`**
  Cover:
  - `test_category_crud_and_sort_order`: create 2 categories -> `sortOrder` `0` and `1`; `GET /categories` sorted ascending; `GET /categories/{id}` returns item (`404` on unknown); `PATCH` updates fields and clears `allocatedBudget` when `<= 0`; whitespace-only `name` fails `422`.
  - `test_delete_category_cascades_expenses`: insert an expense doc referencing that `categoryId`, call `DELETE /categories/{id}` -> `204`, verify category and its expenses are removed from MongoDB, and deleting unknown ID returns `404`.

- [ ] **Step 2: Run test to verify failure**
  Run `uv run pytest tests/test_categories.py -v` -> Expected FAIL.

- [ ] **Step 3: Implement `schemas/category.py`, `repositories/category_repo.py`, `routers/categories.py`, and include router in `main.py`**

- [ ] **Step 4: Run tests to verify pass**
  Run `uv run pytest tests/test_categories.py -v` -> Expected PASS.

- [ ] **Step 5: Commit**

---

### Task 5: Expenses, Embedded Payments & Filtering (`/api/v1/expenses`)

**Files:**
- Create: `backend/app/schemas/expense.py`
- Create: `backend/app/services/__init__.py`, `backend/app/services/calculations.py`
- Create: `backend/app/repositories/expense_repo.py`
- Create: `backend/app/routers/expenses.py`
- Modify: `backend/app/main.py`
- Test: `backend/tests/test_expenses.py`

**Interfaces:**
- Consumes: `get_current_user`, `get_db`, `get_or_bootstrap_wedding`, `categories` collection check
- Produces:
  - `PaymentRecord`, `Expense`, `CreatePaymentPayload`, `CreateExpensePayload`, `UpdateExpensePayload`
  - `compute_expense_status(expense: dict, today_iso: str) -> Literal["unpaid", "partial", "paid", "overdue"]`

- [ ] **Step 1: Write failing tests in `backend/tests/test_expenses.py`**
  Cover:
  - `test_create_expense_with_advance_and_invalid_category`: creating with `advancePayment` populates `payments[0]`; nonexistent `categoryId` returns `404`; empty optional strings normalize to omitted/`None`.
  - `test_expense_filters_and_status_math`: verify `status` filter (`unpaid`, `partial`, `paid` including overpayment clamping and `estimatedAmount == 0` -> `unpaid`, `overdue` when `dueDate < today` and `upcomingAmount > 0`), `ceremony`, `paidBy`, `categoryId`, and case-insensitive `search` across `title`/`description`/`vendorName`.
  - `test_patch_delete_and_payments`: `PATCH /expenses/{id}` preserves `payments[]`; `POST /expenses/{id}/payments` appends installment; `DELETE /expenses/{id}/payments/{paymentId}` removes installment (`404` on unknown expense or payment); `DELETE /expenses/{id}` returns `204`.

- [ ] **Step 2: Run test to verify failure**
  Run `uv run pytest tests/test_expenses.py -v` -> Expected FAIL.

- [ ] **Step 3: Implement `schemas/expense.py`, `services/calculations.py`, `repositories/expense_repo.py`, `routers/expenses.py`, and include router in `main.py`**

- [ ] **Step 4: Run full backend test suite & linter**
  Run `uv run pytest -v && uv run ruff check app tests` in `backend/` -> Expected PASS.

- [ ] **Step 5: Commit**

---

### Task 6: Frontend Auth Flow, Login Page, Reset Wiring & Sample Data Removal

**Files:**
- Create: `frontend/src/types/auth.ts`, `frontend/src/services/authService.ts`, `frontend/src/hooks/useAuth.tsx`, `frontend/src/pages/LoginPage.tsx`
- Modify: `frontend/src/services/apiClient.ts`, `frontend/src/services/weddingService.ts`, `frontend/src/App.tsx`, `frontend/src/components/layout/Sidebar.tsx`, `frontend/src/pages/OnboardingPage.tsx`, `frontend/src/pages/SettingsPage.tsx`
- Modify: `frontend/.env.example`, Create: `frontend/.env`
- Test: `frontend/src/services/__tests__/authAndApiClient.test.ts`

**Interfaces:**
- Consumes: `POST /api/v1/auth/login`, `GET /api/v1/auth/me`, `POST /api/v1/wedding/reset`
- Produces:
  - `AuthUser`, `LoginPayload`, `LoginResponse` in `frontend/src/types/auth.ts`
  - `authService` (`login`, `me`, `getToken`, `setToken`, `clearToken`) and `setUnauthorizedHandler` in `apiClient.ts`
  - `AuthProvider` & `useAuth` in `frontend/src/hooks/useAuth.tsx`
  - `LoginPage` in `frontend/src/pages/LoginPage.tsx`

- [ ] **Step 1: Write failing unit test `frontend/src/services/__tests__/authAndApiClient.test.ts`**
  Test `apiRequest` attaches `Authorization: Bearer <token>`, invokes unauthorized callback and clears token on `401` for protected routes (but NOT on `/auth/login`), and `weddingService.resetAll()` posts to `/api/v1/wedding/reset` when `useMockApi` is false.

- [ ] **Step 2: Run unit test to verify failure**
  Run `node --experimental-strip-types --test src/services/__tests__/authAndApiClient.test.ts` in `frontend/` -> Expected FAIL.

- [ ] **Step 3: Implement auth types, `authService.ts`, `apiClient.ts` Bearer/401 handling, `weddingService.resetAll()`, `useAuth.tsx`, `LoginPage.tsx`, and `App.tsx` route gating**
  - `LoginPage.tsx`: Botanical card (`bg-botanical-cream`, `bg-botanical-white`, `Cormorant Garamond` heading, username + password fields, inline error message, no signup/forgot-password, no hardcoded credentials).
  - `App.tsx`: Wrap in `AuthProvider`; if auth loading show skeleton; if `!user` route to `/login` (`*` -> `/login`); if authenticated render wedding onboarding/app routes.

- [ ] **Step 4: Add Logout buttons (`Sidebar.tsx`, `SettingsPage.tsx`), comment out Load Sample Data (`OnboardingPage.tsx`, `SettingsPage.tsx`), update Reset wording & `.env` files**
  - `Sidebar.tsx`: Add **Log Out** button in footer (respecting collapsed tablet icon rail + expanded/desktop states).
  - `SettingsPage.tsx`: Add **Log Out** button in Account / Workspace section (accessible on mobile too), comment out *"Load Sample Indian Wedding"* button/handler, update Reset Data copy from `localStorage` / *"Reset Local Data"* to *"Reset Wedding Data"* / *"Reset Data"*.
  - `OnboardingPage.tsx`: Comment out *"Explore with sample wedding data"* button/handler.
  - `frontend/.env.example` & `frontend/.env`: `VITE_USE_MOCK_API=false`, `VITE_API_BASE_URL=http://localhost:4000/api/v1`.

- [ ] **Step 5: Run frontend unit tests, lint, and typecheck**
  Run `node --experimental-strip-types --test src/utils/__tests__/*.test.ts src/services/__tests__/*.test.ts && pnpm run lint && pnpm run build` in `frontend/` -> Expected PASS.

- [ ] **Step 6: Commit**

---

### Task 7: Fix Tailwind v4 Canonical Class Warnings & Full-Stack End-to-End Verification

**Files:**
- Modify: `frontend/src/components/categories/CategoryCard.tsx`, `CategoryIconPicker.tsx`, `frontend/src/components/dashboard/UpcomingDuesWidget.tsx`, `frontend/src/components/expenses/ExpenseDetailSheet.tsx`, `ExpenseFilterBar.tsx`, `PaymentHistoryList.tsx`, `frontend/src/components/layout/AppShell.tsx`, `MobileHeader.tsx`, `Sidebar.tsx`, `frontend/src/components/ui/Accordion.tsx`, `Button.tsx`, `CurrencyInput.tsx`, `Input.tsx`, `Modal.tsx`, `ResponsiveSheet.tsx`, `Select.tsx`, `frontend/src/pages/CategoriesPage.tsx`, `DashboardPage.tsx`, `OnboardingPage.tsx`, `UpcomingPaymentsPage.tsx`

- [ ] **Step 1: Replace arbitrary pixel spacing classes with Tailwind v4 canonical numeric utilities**
  Map:
  - `min-h-[34px]` -> `min-h-8.5`
  - `min-w-[36px]` / `min-h-[36px]` -> `min-w-9` / `min-h-9`
  - `min-h-[38px]` -> `min-h-9.5`
  - `min-h-[40px]` -> `min-h-10`
  - `min-w-[44px]` / `min-h-[44px]` -> `min-w-11` / `min-h-11`
  - `min-h-[48px]` -> `min-h-12`
  - `w-[72px]` / `pl-[72px]` -> `w-18` / `pl-18`
  - `min-h-[168px]` -> `min-h-42`
  Also check with Tailwind/build tools that zero arbitrary-pixel spacing warnings remain.

- [ ] **Step 2: Run full frontend & backend automated checks**
  - `backend/`: `uv run pytest -v && uv run ruff check app tests`
  - `frontend/`: `node --experimental-strip-types --test src/utils/__tests__/*.test.ts src/services/__tests__/*.test.ts && pnpm run lint && pnpm run build`

- [ ] **Step 3: Live end-to-end verification in browser (Docker MongoDB + FastAPI on `:4000` + Vite on `:5173`)**
  Verify:
  1. Unauthenticated visit redirects to `/login`; bad password shows error; `siddhartha` / `sidd@1996` logs in.
  2. Onboarding creates wedding profile + starter categories in MongoDB (no Load Sample Data button visible).
  3. Create expense with advance payment, record second installment, reload page -> data persists from MongoDB.
  4. Settings -> **Reset Data** clears wedding/categories/expenses back to Onboarding while user remains logged in.
  5. **Log Out** returns to `/login`.

- [ ] **Step 4: Commit**
