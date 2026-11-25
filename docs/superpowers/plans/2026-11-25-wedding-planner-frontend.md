# Wedding Planner Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean the Vite starter template and build the complete, responsive, botanical-themed Indian Wedding Planner frontend backed by a REST-aligned `localStorage` Mock API, then verify all features and viewports in the browser.

**Architecture:** Strict layered React + TypeScript architecture using Tailwind CSS v4 `@theme` tokens in `src/index.css`, pure financial/date/INR utilities in `src/utils/`, a REST-shaped `services/` layer backed by `mockDb.ts` (`localStorage` + latency simulator), TanStack Query hooks in `src/hooks/`, and mobile-first UI primitives + feature components across 6 routes.

**Tech Stack:** Vite 8, React 19, TypeScript 7 (`verbatimModuleSyntax`, `erasableSyntaxOnly`), Tailwind CSS v4 (`@tailwindcss/vite`), `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `recharts`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `oxlint`, `pnpm`.

**Spec:** [2026-11-25-wedding-planner-frontend-design.md](../specs/2026-11-25-wedding-planner-frontend-design.md) and [wedding_planner_web_app_full_implementation_plan.md](../../../wedding_planner_web_app_full_implementation_plan.md).

## Global Constraints

- **Anti-AI Aesthetic:** No neon/purple/teal gradients, glowing borders, glassmorphism blur panels, heavy drop shadows, rainbow charts, or emoji UI icons (`lucide-react` with `strokeWidth={1.5}` only).
- **Typography & Numbers:** `Cormorant Garamond` (500, 600) for display/serif headings and hero amounts; `Plus Jakarta Sans` (400, 500, 600) for UI/ledger text; `tabular-nums` on every currency figure, percentage, and date.
- **Indian Currency:** `₹` with `en-IN` grouping (`₹2,00,000`) and compact variants (`₹20L`, `₹1.2Cr`) via `src/utils/currency.ts`.
- **TypeScript 7 Rules:** Obey `verbatimModuleSyntax` (`import type` for types) and `erasableSyntaxOnly` (no `enum`, no parameter properties); pass `oxlint` (`react/rules-of-hooks`, `react/only-export-components`) and `tsc -b`.
- **Service Isolation:** UI components never read/write `localStorage` directly; all persistence flows through `src/services/` and `src/hooks/`.
- **Mobile Ergonomics:** Minimum `44px × 44px` tap targets on mobile/tablet controls, `inputMode="numeric"` on `CurrencyInput`, `text-base` (`16px`) on mobile form inputs, Bottom Sheet (`< 768px`) vs Right Slide-Over (`>= 768px`).

## Review Focus

1. **Over-payment & zero-amount edge cases:** Recording a payment exceeding `upcomingAmount` must clamp `upcomingAmount` to `0` (never negative) and mark `paid` when `paidAmount >= estimatedAmount && estimatedAmount > 0`.
2. **Dirty INR inputs:** Pasting `"₹2,00,000"`, whitespace, decimals, or empty strings into `parseINRInput` / `CurrencyInput` must produce safe non-negative integers without `NaN`.
3. **Zero-denominator math:** `totalBudget === 0`, `allocatedBudget === 0`, or `estimatedAmount === 0` must yield `0%` progress/remaining percentages instead of `NaN` or `Infinity`.
4. **Corrupted `localStorage` & missing routes:** Malformed JSON in `localStorage` must recover gracefully to clean default state, and `/categories/:unknownId` must show a clear not-found card with a return link.
5. **Cascading deletes & payment voids:** Deleting a category with expenses warns with the count and removes its expenses cleanly; voiding a payment recalculates expense status (`paid` → `partial` / `unpaid` / `overdue`).

---

### Task 1: Clean Vite Starter & Configure Botanical Theme (Tailwind v4)

**Files:**
- Delete: `src/App.css`, `src/assets/hero.png`, `src/assets/react.svg`, `src/assets/vite.svg`, `public/icons.svg`
- Modify: `index.html`, `src/index.css`, `src/App.tsx`, `src/main.tsx`
- Create: `.env.example`

**Interfaces:**
- Produces: Tailwind CSS v4 `@theme` tokens (`botanical-cream`, `botanical-white`, `botanical-ivory`, `botanical-surface`, `botanical-text`, `botanical-text-secondary`, `botanical-text-tertiary`, `botanical-muted`, `botanical-disabled`, `botanical-forest`, `botanical-sage-dark`, `botanical-sage`, `botanical-sage-soft`, `botanical-gold`, `botanical-gold-light`, `botanical-terracotta`, `botanical-beige`, `botanical-taupe`), `font-serif`, `font-sans`, `.tabular-nums`, `.no-scrollbar`, `@media print` helpers.

- [ ] **Step 1: Remove unused Vite starter files**
  Delete `src/App.css`, `src/assets/` folder, and `public/icons.svg`.
- [ ] **Step 2: Update `index.html`**
  Set page title to `Bandhan — Wedding Budget Planner`, load Google Fonts `Cormorant Garamond:wght@500;600` and `Plus Jakarta Sans:wght@400;500;600`, and keep viewport meta tag (`viewport-fit=cover`).
- [ ] **Step 3: Configure `src/index.css` with Tailwind v4 `@theme` and base rules**
  Replace starter CSS with `@import "tailwindcss";`, `@theme` color & font tokens matching the spec hex table exactly, light canvas defaults (`bg-botanical-cream text-botanical-text font-sans antialiased`), `.no-scrollbar` utility, safe-area padding utility, and `@media print` rules hiding navigation shells.
- [ ] **Step 4: Create `.env.example` and minimal `src/App.tsx`**
  Add `VITE_USE_MOCK_API=true` and `VITE_API_BASE_URL=http://localhost:4000/api/v1` to `.env.example`. Replace `src/App.tsx` with a clean placeholder using `bg-botanical-cream` and `font-serif`.
- [ ] **Step 5: Verify build and lint**
  Run `pnpm run lint; pnpm run build` -> Expected exit code 0.

---

### Task 2: Config, Types & Pure Utilities (INR, Calculations, Date, CSV) + Tests

**Files:**
- Create: `src/config/env.ts`, `src/config/presets.ts`
- Create: `src/types/wedding.ts`, `src/types/summary.ts`, `src/types/api.ts`
- Create: `src/utils/currency.ts`, `src/utils/calculations.ts`, `src/utils/date.ts`, `src/utils/export.ts`
- Test: `src/utils/__tests__/currency.test.ts`, `src/utils/__tests__/calculations.test.ts`

**Interfaces:**
- Produces:
  - `WeddingProfile`, `Category`, `Expense`, `PaymentRecord`, `CeremonyTag`, `PaymentMethod`, `ContributorSide`, `ExpenseStatus`
  - `DashboardSummary`, `CategoryMetrics`, `ExpenseWithMetrics`, `ContributorBreakdown`
  - `formatINR(amount: number): string`, `formatINRCompact(amount: number): string`, `parseINRInput(raw: string): number`, `formatINRInputDisplay(amount: number): string`
  - `computeExpenseMetrics(expense: Expense, todayIso?: string): ExpenseWithMetrics`, `computeCategoryMetrics(category: Category, expenses: Expense[], todayIso?: string): CategoryMetrics`, `computeDashboardSummary(profile: WeddingProfile, categories: Category[], expenses: Expense[], todayIso?: string): DashboardSummary`
  - `getDaysRemaining(weddingDateIso: string, today?: Date): number`, `formatDisplayDate(iso: string): string`, `isDateStrictlyBeforeToday(iso: string, todayIso?: string): boolean`
  - `generateExpensesCSV(profile: WeddingProfile, categories: Category[], expenses: Expense[]): string`

- [ ] **Step 1: Write unit tests for `currency.ts` and `calculations.ts`**
  Cover `formatINR(200000)` -> `"₹2,00,000"`, `formatINRCompact(2500000)` -> `"₹25L"`, `formatINRCompact(12000000)` -> `"₹1.2Cr"`, `parseINRInput("₹2,00,000")` -> `200000`, `parseINRInput("")` -> `0`, `parseINRInput("abc")` -> `0`; plus `computeExpenseMetrics` for `unpaid`, `partial`, `paid`, `overdue`, overpayment clamping (`upcomingAmount === 0`), and `computeDashboardSummary` with zero budget (`0%` not `NaN`).
- [ ] **Step 2: Run unit tests to verify failure before implementation**
  Run `node --experimental-strip-types --test src/utils/__tests__/*.test.ts` -> Expected FAIL (modules missing).
- [ ] **Step 3: Implement `src/config/env.ts`, `src/config/presets.ts`, and `src/types/*.ts`**
  Define all TypeScript types verbatim from the spec (`wedding.ts`, `summary.ts`, `api.ts`) and starter Indian wedding categories, ceremony options, payment method labels, contributor labels, and icon keys in `presets.ts`.
- [ ] **Step 4: Implement `src/utils/currency.ts`, `calculations.ts`, `date.ts`, `export.ts`**
  Implement pure functions using `Intl.NumberFormat('en-IN')` and `date-fns`. Note `verbatimModuleSyntax` imports.
- [ ] **Step 5: Run unit tests, lint, and typecheck**
  Run `node --experimental-strip-types --test src/utils/__tests__/*.test.ts && pnpm run lint && pnpm exec tsc -b` -> Expected PASS.

---

### Task 3: Mock API Layer, Services & TanStack Query Hooks + Tests

**Files:**
- Create: `src/services/apiClient.ts`
- Create: `src/services/mock/delay.ts`, `src/services/mock/mockDb.ts`, `src/services/mock/handlers.ts`
- Create: `src/services/weddingService.ts`, `src/services/categoryService.ts`, `src/services/expenseService.ts`, `src/services/paymentService.ts`
- Create: `src/hooks/useMediaQuery.ts`, `src/hooks/useWedding.ts`, `src/hooks/useCategories.ts`, `src/hooks/useExpenses.ts`, `src/hooks/useDashboardSummary.ts`
- Test: `src/services/__tests__/mockHandlers.test.ts`

**Interfaces:**
- Consumes: `src/types/*`, `src/utils/calculations.ts`, `src/config/env.ts`, `src/config/presets.ts`
- Produces:
  - `weddingService`: `get()`, `save(payload)`, `seedDemo()`, `resetAll()`
  - `categoryService`: `list()`, `getById(id)`, `create(payload)`, `update(id, payload)`, `remove(id)`
  - `expenseService`: `list(filters?)`, `getById(id)`, `create(payload)`, `update(id, payload)`, `remove(id)`
  - `paymentService`: `create(expenseId, payload)`, `remove(expenseId, paymentId)`
  - Query hooks (`useWedding`, `useSaveWedding`, `useSeedDemo`, `useResetWedding`, `useCategories`, `useCategory`, `useCategoryMutations`, `useExpenses`, `useExpenseMutations`, `usePaymentMutations`, `useDashboardSummary`, `useMediaQuery`, `useIsMobile`).

- [ ] **Step 1: Write unit tests for `mockDb` and `handlers`**
  Test corrupted `localStorage` JSON recovery, `seedDemo()` populating realistic Indian wedding data (including multiple items under Catering like *Main Banquet & Buffet* and *Dining Area Proper Lighting*), creating an expense with `advancePayment`, adding/removing installments, and cascading category deletion.
- [ ] **Step 2: Run tests to verify failure**
  Run `node --experimental-strip-types --test src/services/__tests__/mockHandlers.test.ts` -> Expected FAIL.
- [ ] **Step 3: Implement `apiClient.ts`, `mock/delay.ts`, `mock/mockDb.ts`, `mock/handlers.ts`, and `services/*.ts`**
  Keep storage behind an injectable storage adapter in `mockDb.ts` (defaults to `window.localStorage`, works in Node tests via in-memory storage).
- [ ] **Step 4: Implement `src/hooks/*.ts`**
  Configure TanStack Query keys (`['wedding']`, `['categories']`, `['expenses']`) with clean invalidation on mutations.
- [ ] **Step 5: Run tests, lint, and typecheck**
  Run `node --experimental-strip-types --test src/utils/__tests__/*.test.ts src/services/__tests__/mockHandlers.test.ts && pnpm run lint && pnpm exec tsc -b` -> Expected PASS.

---

### Task 4: Botanical UI Primitives (`src/components/ui/`)

**Files:**
- Create: `src/components/ui/Button.tsx`, `Card.tsx`, `Input.tsx`, `CurrencyInput.tsx`, `Select.tsx`, `Accordion.tsx`, `Badge.tsx`, `ProgressBar.tsx`, `ResponsiveSheet.tsx`, `Modal.tsx`, `EmptyState.tsx`, `Skeleton.tsx`, `Toast.tsx`

**Interfaces:**
- Produces: Reusable botanical primitives matching the Component Inventory (`Button`, `Card`, `Input`, `CurrencyInput` with `inputMode="numeric"` and live `en-IN` comma formatting, `Select`, `Accordion`, `Badge`, `ProgressBar`, `ResponsiveSheet`, `Modal`, `EmptyState`, `Skeleton`, `ToastProvider` & `useToast`).

- [ ] **Step 1: Implement core form & display primitives (`Button`, `Card`, `Input`, `CurrencyInput`, `Select`, `Badge`, `ProgressBar`)**
  Use `1px` `border-botanical-beige`, `min-h-[44px]` touch targets on interactive controls, `text-base sm:text-sm` on form inputs, `tabular-nums` on numbers, and `strokeWidth={1.5}` Lucide icons.
- [ ] **Step 2: Implement overlay & feedback primitives (`Accordion`, `ResponsiveSheet`, `Modal`, `EmptyState`, `Skeleton`, `Toast`)**
  `ResponsiveSheet` uses `useIsMobile()` (`< 768px`) to render a Bottom Sheet (`inset-x-0 bottom-0 rounded-t-2xl max-h-[92dvh]`) with drag handle, sticky header, scrollable body, and sticky footer; `>= 768px` renders a Right Slide-Over (`inset-y-0 right-0 w-full max-w-lg border-l border-botanical-beige`). Escape key closes overlays.
- [ ] **Step 3: Verify lint and typecheck**
  Run `pnpm run lint && pnpm exec tsc -b` -> Expected PASS.

---

### Task 5: Responsive Navigation Shell & Onboarding Flow

**Files:**
- Create: `src/components/layout/Sidebar.tsx`, `MobileHeader.tsx`, `MobileBottomNav.tsx`, `AppShell.tsx`, `PageHeader.tsx`
- Create: `src/pages/OnboardingPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useWedding`, `useSaveWedding`, `useSeedDemo`, `useCategoryMutations`, UI primitives, `presets.ts`
- Produces: Complete `AppShell` adapting across Mobile (`<768px` top bar + bottom 4-tab bar with `env(safe-area-inset-bottom)`), Tablet (`md:` 72px collapsible icon rail with expand toggle), and Desktop (`lg:` persistent 240px `bg-botanical-ivory` sidebar); plus 2-step `OnboardingPage` and top-level routing in `App.tsx`.

- [ ] **Step 1: Build `Sidebar`, `MobileHeader`, `MobileBottomNav`, `PageHeader`, and `AppShell`**
  Include couple initials monogram, live days countdown pill, 4 primary routes (`Overview` `/`, `Categories` `/categories`, `Upcoming` `/upcoming`, `Settings` `/settings`), and quick `+ Add Expense` trigger (wiring to global quick-add sheet).
- [ ] **Step 2: Build `OnboardingPage.tsx`**
  Step 1 (*The Celebration*: Bride Name, Groom Name, Wedding Date with live countdown preview, Total Budget `CurrencyInput`, 10% contingency toggle); Step 2 (*Starter Categories*: toggle chips, custom inline category input, or blank workspace); plus *"Explore with sample wedding data"* footer button.
- [ ] **Step 3: Wire `App.tsx` with `QueryClientProvider`, `ToastProvider`, `BrowserRouter`, onboarding guard, and placeholder routes**
- [ ] **Step 4: Verify lint, typecheck, and build**
  Run `pnpm run lint && pnpm run build` -> Expected PASS.

---

### Task 6: Home Dashboard (`/`) & Categories Directory (`/categories`)

**Files:**
- Create: `src/components/dashboard/WeddingHeroBanner.tsx`, `BudgetSummaryGrid.tsx`, `MasterBudgetBar.tsx`, `CategoryBreakdownChart.tsx`, `CategorySummaryList.tsx`, `ContributorSummaryCard.tsx`, `UpcomingDuesWidget.tsx`
- Create: `src/components/categories/CategoryIconPicker.tsx`, `CategoryCard.tsx`, `CategoryFormSheet.tsx`
- Create: `src/pages/DashboardPage.tsx`, `src/pages/CategoriesPage.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useDashboardSummary`, `useCategories`, `useCategoryMutations`, `useExpenses`, `ResponsiveSheet`, `Modal`, Recharts (`ResponsiveContainer`, `BarChart`/`PieChart` in botanical hex palette)
- Produces: Full Dashboard screen and Categories Directory screen with create/edit/delete category (with warning modal if expenses exist).

- [ ] **Step 1: Build all 7 Dashboard components (`src/components/dashboard/*`)**
  Include inline Total Budget quick-edit modal on `BudgetSummaryGrid`, stacked `MasterBudgetBar` with contingency marker, List/Chart toggle (`CategorySummaryList` vs `CategoryBreakdownChart` using Recharts with `#344A32`, `#D8B978`, `#A9AC8D`, `#B98B61`), `ContributorSummaryCard` (shown when payments exist), and `UpcomingDuesWidget` (top 5 pending with one-tap `Pay`).
- [ ] **Step 2: Build `CategoryIconPicker`, `CategoryCard`, `CategoryFormSheet`**
  16 curated Lucide icons (`strokeWidth={1.5}`), optional budget cap `CurrencyInput`, description, and `react-hook-form` + `zod` validation.
- [ ] **Step 3: Implement `DashboardPage.tsx` and `CategoriesPage.tsx` and connect routes in `src/App.tsx`**
- [ ] **Step 4: Verify lint, typecheck, and build**
  Run `pnpm run lint && pnpm run build` -> Expected PASS.

---

### Task 7: Expense Ledger, Payments, Upcoming Schedule & Settings

**Files:**
- Create: `src/components/expenses/ExpenseFilterBar.tsx`, `ExpenseRow.tsx`, `ExpenseFormSheet.tsx`, `PaymentHistoryList.tsx`, `ExpenseDetailSheet.tsx`, `RecordPaymentModal.tsx`
- Create: `src/pages/CategoryDetailPage.tsx`, `src/pages/UpcomingPaymentsPage.tsx`, `src/pages/SettingsPage.tsx`
- Modify: `src/App.tsx`, `src/components/layout/AppShell.tsx` (connect global quick-add Expense button on any screen)

**Interfaces:**
- Consumes: `useExpenses`, `useExpenseMutations`, `usePaymentMutations`, `useCategories`, `useWedding`, `generateExpensesCSV`
- Produces:
  - `CategoryDetailPage`: Breadcrumb, 4-stat ribbon, filter bar (horizontal scroll pills on mobile), adaptive `ExpenseRow` (mobile vertical card w/ 3-column `Total | Paid | Upcoming` mini-ledger vs desktop aligned columns), `ExpenseFormSheet` (live advance calculator + collapsible *"More Details"* `Accordion` for Ceremony, Vendor Name, Vendor Phone), `ExpenseDetailSheet` (vendor `tel:` link, `PaymentHistoryList`, "Mark Fully Paid", void payment), `RecordPaymentModal`.
  - `UpcomingPaymentsPage`: Cross-category pending dues grouped by Timeline (*Overdue*, *Due This Month*, *Upcoming Later*, *No Due Date*) or Category, filtered by Ceremony and Paid By, with inline `Record Payment`.
  - `SettingsPage`: Couple profile & budget edit form, CSV download, Print/Save PDF (`window.print()`), Load Sample Data, Reset Local Data confirmation modal.

- [ ] **Step 1: Build `ExpenseFilterBar`, `ExpenseRow`, `PaymentHistoryList`, `RecordPaymentModal`**
- [ ] **Step 2: Build `ExpenseFormSheet` (including global category selector when opened from Sidebar/Dashboard + initial advance calculator + collapsible "More Details" Accordion) and `ExpenseDetailSheet`**
- [ ] **Step 3: Build `CategoryDetailPage`, `UpcomingPaymentsPage`, and `SettingsPage`, and wire routes + global `+ Add Expense` in `AppShell` & `App.tsx`**
- [ ] **Step 4: Run all tests, lint, and production build**
  Run `node --experimental-strip-types --test src/utils/__tests__/*.test.ts src/services/__tests__/mockHandlers.test.ts && pnpm run lint && pnpm run build` -> Expected PASS.

---

### Task 8: Live Browser Verification (Features & Responsive Viewports)

- [ ] **Step 1: Start Vite dev server outside sandbox (`BypassSandbox: true`, `IsDaemon: true`)**
- [ ] **Step 2: Run browser subagent checks across viewports & core flows**
  Verify in real browser:
  1. Onboarding flow (`375px` mobile & `1440px` desktop) + *"Explore with sample wedding data"*.
  2. Dashboard KPIs, Master Budget Bar, List/Chart toggle, Upcoming Dues quick `Pay`.
  3. Categories Directory: create category, edit category, navigate to Category Detail (`/categories/:id`).
  4. Category Detail: add new expense with initial advance + collapsible *"More Details"* (ceremony + vendor), verify live remaining calculation, open detail sheet, record second installment / mark fully paid, test search & status filter pills.
  5. Upcoming Payments page: switch Timeline vs Category grouping, filter by ceremony/side.
  6. Settings page: update wedding profile, trigger CSV download / Print preview, verify `localStorage` persistence on reload.
  7. Responsive layout audit at `375×812` (Mobile), `768×1024` (Portrait Tablet rail), `1024×768` (Landscape Tablet sidebar), and `1440×900` (Desktop) checking for zero horizontal overflow, clean `tabular-nums` alignment, and Bottom Sheet vs Slide-Over behavior.
- [ ] **Step 3: Fix any issues found during browser testing, re-run `lint`, `build`, unit tests, and stop daemon cleanly.**
