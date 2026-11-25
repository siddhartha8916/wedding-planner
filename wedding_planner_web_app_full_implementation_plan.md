# Wedding Planner Web App — Full Implementation Plan

> **Scope & Confirmed Architecture:** Phase 1 delivers the complete, production-ready frontend UI built with **Vite + React + TypeScript + Tailwind CSS**, backed by a realistic **Mock API layer** (`localStorage` persistence + simulated latency). Every service call follows clean REST contracts so swapping to a real backend and database later requires zero changes to UI components.

## Confirmed Decisions

* **Language & Tooling:** Vite + React + **TypeScript** + Tailwind CSS (`botanical` palette).
* **Currency:** Indian Rupee (`₹`) with native Indian numbering (`en-IN`, e.g., `₹2,00,000`, `₹50,000`).
* **Payment Model:** Multi-installment ledger per expense (log an initial advance during creation, then record subsequent installments or final settlement over time).
* **Indian Wedding Optional Details (Confirmed):** Ceremony tags (*Haldi*, *Mehendi*, *Sangeet*, *Engagement*, *Wedding*, *Reception*, *General*), Paid By (*Joint*, *Bride's Side*, *Groom's Side*), Payment Mode (*UPI*, *Bank Transfer*, *Cash*, *Card*, *Cheque*), and Vendor Name & Phone—tucked cleanly inside a collapsible **"More Details"** section so everyday entry remains fast and uncluttered.
* **Budget Controls:** Master Wedding Budget plus optional per-category budget caps.
* **Responsiveness:** First-class adaptive layouts designed specifically for **Mobile**, **Tablet**, and **Desktop** viewports.

---

## 1. Product Vision & Core User Flow

The application is a calm, editorial-grade financial workspace for planning a wedding. Instead of feeling like a cluttered spreadsheet or a loud vendor marketplace, it treats your wedding budget like bespoke stationery paired with a crisp personal finance ledger.

### Primary User Journey

1. **First Launch (Onboarding):** Enter the Bride's name, Groom's name, Wedding Date, and Total Target Budget (e.g., `₹25,00,000`). Optionally select starter Indian wedding categories or begin with a blank workspace.
2. **Homepage Dashboard (Budget Summary):** Immediately view the wedding countdown, a high-level financial summary (**Total Budget**, **Budget Left**, **Paid So Far**, and **Upcoming Payments**), a category spending breakdown, and imminent payment dues.
3. **Categories Hub:** Create, edit, and organize budget categories (e.g., *Catering*, *Venue*, *Decor & Lighting*, *Photography*, *Attire & Jewellery*) with optional per-category budget limits.
4. **Category Detail & Expense Tracking:** Under any category, add multiple distinct expenses—for instance, under **Catering**:
   * *Main Banquet & Buffet* — Total `₹2,00,000`, Advance Paid `₹50,000` $\rightarrow$ Upcoming Balance `₹1,50,000`.
   * *Dining Area Proper Lighting* (separate line item with description & amount) — Total `₹35,000`, Paid `₹0` $\rightarrow$ Upcoming Balance `₹35,000`.
5. **Payment Recording:** Record an initial advance while creating an expense, and log subsequent installments or final settlements at any time with date, payment mode, contributor side, and notes.

---

## 2. Feature Set & Scope

### Core MVP (Built in Phase 1)

* **Couple Profile & Wedding Countdown:** Personalized header with live days-remaining counter.
* **Indian Currency Formatting (`en-IN`):** Native `₹` formatting (`₹2,00,000`, `₹50,000`) plus compact formatting (`₹20L`, `₹1.2Cr`) where space is tight on mobile charts and cards.
* **Master Budget vs. Committed vs. Paid vs. Left:** Clearly distinguishes between:
  * **Budget Left:** $\text{Total Budget} - \text{Total Estimated Expenses}$
  * **Paid So Far:** Sum of all advances and installments paid
  * **Upcoming / Pending Payments:** $\text{Total Estimated Expenses} - \text{Total Paid So Far}$
* **Multi-Item Categories:** Unlimited line-item expenses per category, each with its own title, description, estimated cost, and payment timeline.
* **Advance & Multi-Installment Ledger:** Entering an "Advance Paid" when creating an expense automatically logs the first payment entry, allowing 2nd/3rd installments or full settlement later.
* **Upcoming Payments Schedule:** A cross-category chronological list of all unpaid and partially paid items with due dates and one-click **"Record Payment"**.
* **Search, Filter & Sort:** Filter by status (*All*, *Unpaid*, *Partial / Advance Paid*, *Settled*, *Overdue*), Ceremony, or Contributor Side, and search by title, description, or vendor name.

### Smart Indian-Wedding Enhancements (Collapsible / Non-Intrusive)

* **Event / Ceremony Tagging:** Tag expenses by ceremony (*General*, *Engagement*, *Haldi*, *Mehendi*, *Sangeet*, *Wedding*, *Reception*).
* **Payment Mode & Contributor Tracking:** Record how and by whom each payment was made (`UPI`, `Bank Transfer`, `Cash`, `Card`, `Cheque` and `Joint`, `Bride's Side`, `Groom's Side`), with a subtle contribution breakdown visible in the Dashboard/Settings.
* **Vendor Quick-Info:** Optional Vendor Name and Phone Number attached to an expense with one-tap `tel:` dialing on mobile.
* **Contingency Buffer Toggle:** Optional 5%–10% emergency reserve shown subtly on the master budget bar so you know your safe spendable ceiling.
* **Export & Print Summary:** One-click CSV export and a clean print stylesheet (`@media print`) to save/share a PDF snapshot with family.

---

## 3. Design System & Anti-AI Aesthetic Guidelines

To ensure the app feels like a bespoke, human-crafted digital heirloom—**never** like a generic AI-generated template—strict visual rules govern every component.

### Strict Anti-AI Rules

* **No** neon/purple/teal gradients, glowing borders, or glassmorphism blur panels.
* **No** heavy drop shadows; rely on subtle surface tint steps and crisp `1px` hairline borders.
* **No** emojis as UI icons; use refined thin-stroke vector icons (`lucide-react` at `strokeWidth={1.5}`).
* **No** rainbow charts; all visualizations use tonal harmony within the `botanical` palette.
* **Always** apply `tabular-nums` (`font-variant-numeric: tabular-nums`) to every currency figure, percentage, and date so numbers align cleanly across rows.

### Color Token Mapping (`botanical` Palette)

| Semantic Role | Tailwind Token | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Page Canvas** | `bg-botanical-cream` | `#F9F4E9` | Main application background |
| **Elevated Card / Sheet** | `bg-botanical-white` | `#FFFCF5` | Primary cards, drawers, bottom sheets, modals |
| **Secondary Panel / Sidebar** | `bg-botanical-ivory` | `#F5EBD8` | Navigation rail, table/list headers, subtle stat strips |
| **Hover / Active Surface** | `bg-botanical-surface` | `#F0E8D9` | Row hover states, muted pills, progress tracks |
| **Primary Headings & Amounts** | `text-botanical-text` | `#1C1C19` | Primary headings & high-contrast monetary figures |
| **Secondary Copy** | `text-botanical-text-secondary` | `#292923` | Card titles, nav labels |
| **Tertiary Copy** | `text-botanical-text-tertiary` | `#414139` | Expense descriptions, notes |
| **Muted Metadata** | `text-botanical-muted` | `#626157` | Labels, timestamps, column captions |
| **Placeholders / Disabled** | `text-botanical-disabled` | `#858477` | Empty input placeholders, disabled icons |
| **Primary Brand / CTA** | `bg-botanical-forest` | `#344A32` | Primary buttons, active nav states, paid progress bar |
| **Paid / Healthy Status** | `text-botanical-sage-dark` / `bg-botanical-sage` | `#656C49` / `#858B64` | Settled badges, healthy budget indicators |
| **Soft Botanical Fill** | `bg-botanical-sage-soft` | `#A9AC8D` | Subtle badge tints (20% opacity), secondary chart series |
| **Advance / Partial / Accent** | `text-botanical-gold` / `bg-botanical-gold-light` | `#C49A52` / `#D8B978` | Partial payment status, upcoming balances, countdown highlights |
| **Over-Budget / Overdue Alert** | `text-botanical-terracotta` | `#B98B61` | Overdue tags, over-limit warnings, destructive confirmations |
| **Primary Border** | `border-botanical-beige` | `#D8C6A5` | Card frames, button outlines, inputs |
| **Subtle Divider** | `border-botanical-taupe` | `#D7C9B5` | Horizontal rules, list row separators |

### Typography System

Load two complementary Google Fonts in `index.html`:

* **Display & Editorial Serif:** `Cormorant Garamond` (weights 500, 600) — Couple monogram/names, page headings, and hero budget amounts.
* **UI & Ledger Sans:** `Plus Jakarta Sans` (weights 400, 500, 600) — Navigation, forms, badges, filter controls, and expense rows.

---

## 4. Responsive Design Specification (Mobile, Tablet & Desktop)

The app is engineered **mobile-first** with deliberate layout shifts at Tailwind breakpoints so every screen feels native—never squished on phones and never overly stretched on wide monitors.

### Breakpoint Matrix

| Tier | Tailwind Prefix | Viewport Width | Layout Shell | Content Container |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile** | Default (`< sm`) | `360px – 639px` | Compact Top Bar (`56px`) + Fixed Bottom Tab Bar (`64px + safe-area`) | `px-4 py-5 pb-24` |
| **Large Mobile / Phablet** | `sm:` | `640px – 767px` | Compact Top Bar + Fixed Bottom Tab Bar | `px-5 py-6 pb-24` |
| **Tablet (Portrait)** | `md:` | `768px – 1023px` | Collapsible Slim Left Rail (`72px` icon rail with expand toggle) | `px-6 py-8` |
| **Tablet (Landscape) / Laptop** | `lg:` | `1024px – 1279px` | Persistent Left Sidebar (`240px`) | `px-8 py-9 max-w-5xl mx-auto` |
| **Desktop** | `xl:` / `2xl:` | `1280px+` | Persistent Left Sidebar (`240px`) | `px-10 py-10 max-w-6xl mx-auto` |

### Component-Level Responsive Adaptations

1. **Navigation (`AppShell`, `Sidebar`, `MobileNav`):**
   * **Mobile (`< 768px`):** Sticky translucent-free `bg-botanical-white` top bar with couple initials (`A & R`), current screen title, and a contextual `+` icon button. Docked bottom bar (`bg-botanical-ivory border-t border-botanical-beige`) with 4 destinations: *Overview*, *Categories*, *Upcoming*, *Settings*. Respects iOS `env(safe-area-inset-bottom)`.
   * **Tablet (`768px – 1023px`):** Slim `72px` vertical rail on the left with clear icons + tooltips and a toggle button to expand to the full `240px` sidebar over content when needed—maximizing horizontal room for ledgers and charts.
   * **Desktop (`1024px+`):** Full `240px` fixed sidebar (`bg-botanical-ivory`) displaying the wedding monogram, countdown pill, primary navigation links, and quick `+ Add Expense` button.

2. **Dashboard KPI Strip (`BudgetSummaryGrid`):**
   * **Mobile:** `grid-cols-2 gap-3` (4 compact cards in a balanced 2×2 grid, compact font scaling so `₹25,00,000` never wraps or truncates).
   * **Tablet:** `md:grid-cols-2 lg:grid-cols-4 gap-4`.
   * **Desktop:** `xl:grid-cols-4 gap-5`.

3. **Dashboard Analytical Split:**
   * **Mobile & Portrait Tablet:** Single column stack (`grid-cols-1 gap-6`) — Master Budget Bar $\rightarrow$ Upcoming Dues $\rightarrow$ Category Breakdown.
   * **Landscape Tablet & Desktop:** 12-column editorial split (`lg:grid-cols-12 gap-6`) — Category Breakdown (`lg:col-span-7`) beside Upcoming Dues (`lg:col-span-5`).

4. **Categories Directory (`CategoriesPage`):**
   * **Mobile:** `grid-cols-1 gap-3.5`.
   * **Tablet:** `sm:grid-cols-2 gap-4`.
   * **Desktop:** `xl:grid-cols-3 gap-5`.

5. **Expense Ledger Rows (`ExpenseRow`):**
   * **Mobile (`< 768px`):** Structured vertical card layout:
     * Top row: Expense Title + Status Badge.
     * Middle strip: Clean 3-column mini-ledger (`Total` | `Paid` | `Upcoming`) inside a subtle `bg-botanical-ivory/60` band.
     * Footer row: Due date / ceremony pill on the left + full-touch **`+ Pay`** button on the right.
   * **Tablet & Desktop (`md:` and up):** Crisp horizontal ledger row with aligned `tabular-nums` financial columns and inline quick actions.

6. **Drawers & Forms (`SlideOver`, `ExpenseFormDrawer`, `ExpenseDetailDrawer`, `CategoryFormDrawer`):**
   * **Mobile (`< 768px`):** Renders as a **Bottom Sheet** (`inset-x-0 bottom-0 rounded-t-2xl max-h-[92dvh]`) with a subtle drag handle bar, sticky header, independently scrollable form body, and sticky footer CTA bar above the keyboard.
   * **Tablet & Desktop (`md:` and up):** Renders as a **Right-Hand Editorial Slide-Over Panel** (`inset-y-0 right-0 w-full max-w-lg border-l border-botanical-beige`) so you keep visual context of the category behind the form.

7. **Filter Bars (`ExpenseFilterBar`):**
   * **Mobile:** Full-width search input stacked above a horizontally scrollable single-line pill strip (`overflow-x-auto`) so filter pills stay tidy and never stack into clunky multi-row blocks.
   * **Tablet & Desktop:** Single horizontal toolbar row combining search, status pills, and ceremony dropdown.

8. **Touch & Mobile Input Ergonomics:**
   * All interactive buttons, tabs, and icon triggers enforce a minimum `44px × 44px` tap target on mobile/tablet (`min-h-[44px]`).
   * `CurrencyInput` sets `inputMode="numeric"` so mobile devices open the numeric keypad immediately.
   * All form inputs use at least `16px` (`text-base`) on mobile to prevent iOS Safari from auto-zooming on focus.

---

## 5. Tech Stack & Project Structure

### Dependencies

* **Build Tool:** Vite (`react-ts` template)
* **Language:** TypeScript (strict mode enabled)
* **Styling:** Tailwind CSS v3 (using your exact `botanical` theme + extended font families)
* **Routing:** `react-router-dom`
* **Async State & Caching:** `@tanstack/react-query` — makes mock API calls behave identically to real REST endpoints (loading skeletons, cache invalidation, optimistic updates).
* **Icons:** `lucide-react`
* **Charts:** `recharts` (responsive containers, strictly styled with `botanical` hex tokens)
* **Forms & Validation:** `react-hook-form` + `zod` + `@hookform/resolvers`
* **Dates:** `date-fns`

### Folder Structure

```text
src/
├── main.tsx
├── App.tsx
├── index.css                      # Tailwind directives, font utilities, safe-area & print styles
├── config/
│   ├── env.ts                     # VITE_USE_MOCK_API & VITE_API_BASE_URL flags
│   └── presets.ts                 # Starter Indian wedding categories, ceremony tags & icons
├── types/
│   ├── wedding.ts                 # WeddingProfile, Category, Expense, PaymentRecord
│   ├── summary.ts                 # DashboardSummary, CategoryMetrics, ContributorBreakdown
│   └── api.ts                     # Standard ApiResponse & ApiError contracts
├── utils/
│   ├── currency.ts                # formatINR(), formatINRCompact(), parseINRInput()
│   ├── calculations.ts            # Pure budget math functions (paid, remaining, status)
│   ├── date.ts                    # Countdown days, due date formatting, overdue checks
│   └── export.ts                  # CSV export generator
├── services/
│   ├── apiClient.ts               # Fetch wrapper ready for real REST backend
│   ├── mock/
│   │   ├── mockDb.ts              # localStorage persistence + rich Indian wedding sample seed
│   │   ├── delay.ts               # Configurable 150-250ms latency simulator
│   │   └── handlers.ts            # Mock handlers mirroring exact REST endpoints
│   ├── weddingService.ts          # getWedding(), saveWedding(), seedDemo(), resetAll()
│   ├── categoryService.ts         # list(), getById(), create(), update(), remove()
│   ├── expenseService.ts          # list(), getById(), create(), update(), remove()
│   └── paymentService.ts          # addPayment(), deletePayment()
├── hooks/
│   ├── useWedding.ts              # TanStack Query hooks for wedding profile
│   ├── useCategories.ts           # Queries & mutations for categories
│   ├── useExpenses.ts             # Queries & mutations for expenses & payments
│   ├── useDashboardSummary.ts     # Aggregated financial summary & contributor totals
│   └── useMediaQuery.ts           # Responsive helper for bottom-sheet vs slide-over behavior
├── components/
│   ├── ui/                        # Reusable botanical design primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── CurrencyInput.tsx      # Indian comma formatting + mobile numeric keypad
│   │   ├── Select.tsx
│   │   ├── Accordion.tsx          # Collapsible "More Details" container
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx        # Single & stacked (Paid + Upcoming) tracks
│   │   ├── ResponsiveSheet.tsx    # Bottom Sheet on mobile, Slide-Over on tablet/desktop
│   │   ├── Modal.tsx              # Centered dialog for payments & delete confirmations
│   │   ├── EmptyState.tsx
│   │   ├── Skeleton.tsx
│   │   └── Toast.tsx
│   ├── layout/
│   │   ├── AppShell.tsx           # Orchestrates Desktop Sidebar, Tablet Rail & Mobile Nav
│   │   ├── Sidebar.tsx
│   │   ├── MobileHeader.tsx
│   │   ├── MobileBottomNav.tsx
│   │   └── PageHeader.tsx
│   ├── dashboard/
│   │   ├── WeddingHeroBanner.tsx
│   │   ├── BudgetSummaryGrid.tsx
│   │   ├── MasterBudgetBar.tsx
│   │   ├── CategoryBreakdownChart.tsx
│   │   ├── CategorySummaryList.tsx
│   │   ├── ContributorSummaryCard.tsx
│   │   └── UpcomingDuesWidget.tsx
│   ├── categories/
│   │   ├── CategoryCard.tsx
│   │   ├── CategoryFormSheet.tsx
│   │   └── CategoryIconPicker.tsx
│   └── expenses/
│       ├── ExpenseRow.tsx         # Adaptive mobile card / desktop ledger row
│       ├── ExpenseDetailSheet.tsx
│       ├── ExpenseFormSheet.tsx   # Includes live advance calculator + collapsible Point #3 fields
│       ├── PaymentHistoryList.tsx
│       ├── RecordPaymentModal.tsx
│       └── ExpenseFilterBar.tsx
└── pages/
    ├── OnboardingPage.tsx
    ├── DashboardPage.tsx
    ├── CategoriesPage.tsx
    ├── CategoryDetailPage.tsx
    ├── UpcomingPaymentsPage.tsx
    └── SettingsPage.tsx
```

---

## 6. Data Models & Financial Calculation Logic

### Core TypeScript Interfaces (`src/types/wedding.ts`)

```ts
export type CeremonyTag =
  | 'general'
  | 'engagement'
  | 'haldi'
  | 'mehendi'
  | 'sangeet'
  | 'wedding'
  | 'reception';

export type PaymentMethod = 'upi' | 'bank_transfer' | 'cash' | 'card' | 'cheque';
export type ContributorSide = 'joint' | 'bride' | 'groom';
export type ExpenseStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';

export interface WeddingProfile {
  id: string;
  brideName: string;
  groomName: string;
  weddingDate: string;          // ISO date: "2027-02-14"
  totalBudget: number;          // Raw INR integer, e.g., 2500000
  contingencyPercent: number;   // Default 0 or 10
  currency: 'INR';
  isOnboarded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  weddingId: string;
  name: string;                 // e.g., "Catering", "Decor & Lighting"
  description?: string;
  icon: string;                 // Lucide icon key, e.g., "utensils", "sparkles"
  allocatedBudget?: number;     // Optional per-category target cap
  sortOrder: number;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  expenseId: string;
  amount: number;               // e.g., 50000
  paidDate: string;             // ISO date
  label: string;                // e.g., "Advance Deposit", "2nd Installment", "Final Settlement"
  method: PaymentMethod;
  paidBy: ContributorSide;
  note?: string;
}

export interface Expense {
  id: string;
  weddingId: string;
  categoryId: string;
  title: string;                // e.g., "Main Wedding Feast" or "Proper Dining Lighting"
  description?: string;         // Detailed notes on deliverables/inclusions
  estimatedAmount: number;      // Total agreed/expected cost, e.g., 200000
  dueDate?: string;             // Next payment due date (ISO)
  ceremony?: CeremonyTag;       // Optional (Point #3)
  vendorName?: string;          // Optional (Point #3)
  vendorPhone?: string;         // Optional (Point #3)
  payments: PaymentRecord[];    // All advances & installments toward this expense
  createdAt: string;
  updatedAt: string;
}
```

### Derived Financial Calculations (`src/utils/calculations.ts`)

All financial figures are computed from pure TypeScript functions so totals never drift out of sync:

* **Per Expense:**
  * $\text{paidAmount} = \sum_{i} \text{payments}_i.\text{amount}$
  * $\text{upcomingAmount} = \max(0, \text{estimatedAmount} - \text{paidAmount})$
  * **Status Rules:**
    * `paid` when $\text{paidAmount} \ge \text{estimatedAmount}$ (and $\text{estimatedAmount} > 0$)
    * `overdue` when $\text{upcomingAmount} > 0$ and `dueDate` is strictly before today
    * `partial` when $\text{paidAmount} > 0$ and $\text{upcomingAmount} > 0$
    * `unpaid` when $\text{paidAmount} = 0$
* **Per Category:**
  * $\text{categoryEstimated} = \sum \text{expenses.estimatedAmount}$
  * $\text{categoryPaid} = \sum \text{expenses.paidAmount}$
  * $\text{categoryUpcoming} = \sum \text{expenses.upcomingAmount}$
  * $\text{categoryVariance} = \text{allocatedBudget} - \text{categoryEstimated}$ (when a cap is configured)
* **Overall Wedding Summary:**
  * $\text{totalEstimated} = \sum \text{all expenses.estimatedAmount}$
  * $\text{totalPaid} = \sum \text{all expenses.paidAmount}$
  * $\text{totalUpcoming} = \sum \text{all expenses.upcomingAmount}$
  * $\text{budgetLeft} = \text{totalBudget} - \text{totalEstimated}$ *(negative values clearly styled in `botanical-terracotta`)*
  * $\text{paidBySide} = \text{sum of payments grouped by Joint, Bride's Side, and Groom's Side}$

---

## 7. Backend-Ready Mock API Architecture

Components **never** read or write `localStorage` directly. Every read and mutation passes through `/src/services/` and TanStack Query hooks.

### Environment Configuration

```env
VITE_USE_MOCK_API=true
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

### REST Endpoint Contracts

| Service Method | Future REST Endpoint | Purpose |
| :--- | :--- | :--- |
| `weddingService.get()` | `GET /api/v1/wedding` | Fetch couple profile, wedding date, and master budget |
| `weddingService.save(payload)` | `PUT /api/v1/wedding` | Save onboarding setup or update wedding profile/budget |
| `categoryService.list()` | `GET /api/v1/categories` | Fetch all categories |
| `categoryService.getById(id)` | `GET /api/v1/categories/:id` | Fetch single category metadata |
| `categoryService.create(payload)` | `POST /api/v1/categories` | Create a new category |
| `categoryService.update(id, payload)` | `PATCH /api/v1/categories/:id` | Update name, icon, description, or budget cap |
| `categoryService.remove(id)` | `DELETE /api/v1/categories/:id` | Delete category (warns if expenses exist) |
| `expenseService.list(filters)` | `GET /api/v1/expenses?categoryId=&status=&ceremony=` | List filtered expenses |
| `expenseService.create(payload)` | `POST /api/v1/expenses` | Add expense (optionally with initial `advancePayment`) |
| `expenseService.update(id, payload)` | `PATCH /api/v1/expenses/:id` | Edit expense title, description, amount, due date, vendor, ceremony |
| `expenseService.remove(id)` | `DELETE /api/v1/expenses/:id` | Delete an expense item |
| `paymentService.create(expenseId, payload)` | `POST /api/v1/expenses/:id/payments` | Log an advance, installment, or final settlement |
| `paymentService.remove(expenseId, paymentId)` | `DELETE /api/v1/expenses/:id/payments/:paymentId` | Void/delete a payment record |
| `weddingService.seedDemo()` | *(Mock preview only)* | Load realistic pre-filled Indian wedding dataset |

When your backend and database are ready, flip `VITE_USE_MOCK_API=false` and set `VITE_API_BASE_URL`—the UI layer remains completely untouched.

---

## 8. Screen-by-Screen Blueprint

### Screen 1: Onboarding & Wedding Setup (`/onboarding`)

* **Trigger:** Automatically presented when `weddingProfile.isOnboarded === false`.
* **Responsive Layout:** Full-height centered canvas (`bg-botanical-cream`) with a refined card (`max-w-xl w-full bg-botanical-white border-botanical-beige`), fluid edge padding on mobile.
* **Step 1 — The Celebration:**
  * Bride's Name & Groom's Name (stacked on mobile, side-by-side on `sm:` and above).
  * Wedding Date picker with live preview (*"14 February 2027 · 446 days to go"*).
  * Total Wedding Budget (`CurrencyInput` with live `₹` Indian formatting).
  * Optional toggle: *"Reserve 10% contingency buffer"*.
* **Step 2 — Starter Categories:**
  * Tap-friendly toggle chips (*Venue*, *Catering*, *Decor & Lighting*, *Photography & Film*, *Bridal & Groom Attire*, *Jewellery*, *Makeup & Mehendi*, *Invitations & Gifts*, *Entertainment & DJ*).
  * Quick inline custom category input or *"Start with blank workspace"*.
* **Preview Helper:** Subtle footer link *"Explore with sample wedding data"* to immediately populate realistic categories, advances, and upcoming dues.

### Screen 2: Home Dashboard — Budget Overview (`/`)

* **Section A — Editorial Header (`WeddingHeroBanner`):**
  * Couple display heading (*"Aanya & Rohan"*), wedding date, live countdown pill (`142 Days to Go`), and primary `+ Add Expense` + secondary `+ Add Category` triggers.
* **Section B — 4-Card KPI Strip (`BudgetSummaryGrid`):**
  1. **Total Budget** (with quick inline edit icon).
  2. **Budget Left** (`% left` in `botanical-sage-dark`, or `Over by ₹...` in `botanical-terracotta`).
  3. **Paid So Far** (`% of committed total paid`).
  4. **Upcoming Payments** (count of pending items; tapping jumps to `/upcoming`).
* **Section C — Master Stacked Progress Bar (`MasterBudgetBar`):**
  * Horizontal stacked bar comparing **Paid** (`bg-botanical-forest`), **Upcoming Committed** (`bg-botanical-gold-light`), and **Remaining Budget** (`bg-botanical-surface`), with optional subtle contingency tick mark.
* **Section D — Analytical Split (Stacked on Mobile/Portrait Tablet, 7/5 Grid on Landscape Tablet/Desktop):**
  * **Category Breakdown (`CategorySummaryList` & `CategoryBreakdownChart`):** Switch seamlessly between a scannable category list (with dual-tone Paid/Upcoming bars) and a botanical-toned Recharts chart.
  * **Upcoming Dues Widget (`UpcomingDuesWidget`):** Next 5 pending payments sorted by due date with one-tap **`Pay`** trigger.
  * **Optional Compact Contributor Strip (`ContributorSummaryCard`):** Subtle summary bar showing paid totals across *Joint*, *Bride's Side*, and *Groom's Side* (only displayed when payments exist).

### Screen 3: Categories Directory (`/categories`)

* **Header:** *"Budget Categories"*, search box, sort selector (*Highest Spend*, *Most Pending*, *Alphabetical*), and `+ New Category` CTA.
* **Responsive Card Grid (`1 col` mobile / `2 cols` tablet / `3 cols` desktop):**
  * Each `CategoryCard` shows icon, name, expense count, **Total Estimated** (and optional budget cap), stacked Paid/Pending progress bar, and footer split (`Paid` vs `Upcoming`).
  * Subtle menu for Edit / Delete Category.
  * Final card slot: Dashed `+ Add New Category` prompt card.
* **Add/Edit Sheet (`CategoryFormSheet`):** Category Name, Icon Picker (16 curated minimalist icons), Optional Budget Cap, Short Note.

### Screen 4: Category Detail & Expense Ledger (`/categories/:categoryId`)

* **Header & Category Summary Strip:**
  * Breadcrumb (`Categories / Catering`), Category Title, `Edit Category` button, and `+ Add Expense` CTA.
  * Compact 4-stat ribbon (*Category Cap*, *Total Committed*, *Paid / Advances*, *Upcoming Balance*) — 2×2 on mobile, 4-column on tablet/desktop.
* **Filter & Search Toolbar (`ExpenseFilterBar`):**
  * Search by item title, description, or vendor.
  * Horizontally scrollable status pills on mobile: `All`, `Unpaid`, `Advance Paid`, `Settled`, `Overdue`.
  * Optional Ceremony filter dropdown.
* **Expense Ledger (`ExpenseRow`):**
  * Clearly showcases separate line items under the same category (e.g., *Main Banquet Catering* alongside *Proper Dining Lighting*).
  * Displays Title, Description snippet, Ceremony badge, Vendor name (if added), `Total`, `Paid`, `Upcoming Balance`, Status badge, Due Date, and **`+ Pay`** action.
* **Add / Edit Expense Sheet (`ExpenseFormSheet`):**
  * **Core Fields (Always Visible):**
    * Expense Title (required)
    * Description / Notes (optional)
    * Total Estimated Amount (`₹`) (required)
    * **Initial Advance Payment (on creation):** Toggle/input for *"Advance Paid Now (`₹`)"* with live calculation preview (*"Remaining upcoming balance: `₹1,50,000`"*), plus Payment Date, Mode (`UPI`, `Bank Transfer`, `Cash`, `Card`, `Cheque`), and Paid By (`Joint`, `Bride's Side`, `Groom's Side`).
    * Upcoming Payment Due Date (optional)
  * **Collapsible "More Details" Accordion (Point #3 Optional Fields):**
    * Ceremony / Event Tag (*General*, *Engagement*, *Haldi*, *Mehendi*, *Sangeet*, *Wedding*, *Reception*)
    * Vendor Name
    * Vendor Phone Number
* **Expense Detail Sheet (`ExpenseDetailSheet`):**
  * Full description, click-to-call vendor contact, visual payment progress bar, and full **Payment History Timeline** (`PaymentHistoryList`) showing each advance/installment with payment mode & contributor badge.
  * One-tap **"Mark Fully Paid"** action that pre-fills the exact remaining balance in `RecordPaymentModal`.

### Screen 5: Upcoming Payments Schedule (`/upcoming`)

* **Header Summary:** Total Pending Balance across all categories + count of Overdue vs. Upcoming items.
* **Controls:** Group by **Timeline** (*Overdue*, *Due This Month*, *Upcoming Later*, *No Due Date*) or **Category**, plus filters for Ceremony and Contributor Side.
* **Actionable Ledger:** Shows Expense Title, Category pill, Ceremony pill, Due Date, Vendor Name, Total vs. Already Paid, **Balance Due**, and inline **`Record Payment`** button.

### Screen 6: Wedding Settings & Data Tools (`/settings`)

* **Wedding Profile Form:** Edit Bride Name, Groom Name, Wedding Date, Total Budget Limit, and Contingency Reserve %.
* **Export & Print:**
  * **Download CSV Report:** Full export of categories, line items, ceremony tags, vendor info, estimated amounts, paid totals, and balances.
  * **Print / Save PDF Summary:** Clean `@media print` ledger stylesheet.
* **Mock Data Controls (Phase 1 Preview Tools):**
  * **Load Sample Indian Wedding Data**
  * **Reset Local Data** (clears `localStorage` and returns to Onboarding)

---

## 9. Complete Component Inventory

### A. UI Primitives (`src/components/ui/`)

| Component | Key Props | Responsive & Visual Behavior |
| :--- | :--- | :--- |
| `Button` | `variant`, `size`, `loading`, `icon`, `fullWidth` | Min `44px` tap height on mobile; Primary uses `bg-botanical-forest text-botanical-white` |
| `Card` | `padding`, `interactive`, `surface` (`white` \| `ivory`) | Crisp `1px` `border-botanical-beige`, `rounded-xl`, zero heavy shadows |
| `CurrencyInput` | `value`, `onChange`, `label`, `error`, `helperText` | Fixed `₹` prefix, live Indian comma formatting (`2,00,000`), `inputMode="numeric"`, `tabular-nums` |
| `Accordion` | `title`, `subtitle`, `defaultOpen`, `badge` | Smooth collapsible container for Point #3 optional fields |
| `ProgressBar` | `segments[]`, `max`, `height`, `showOverBudget` | Smooth animated widths supporting stacked Paid + Upcoming tracks |
| `Badge` | `tone` (`forest` \| `sage` \| `gold` \| `terracotta` \| `neutral`) | Subtle tinted background + crisp text for payment statuses & ceremonies |
| `ResponsiveSheet` | `open`, `onClose`, `title`, `subtitle`, `footer` | Renders Bottom Sheet on mobile (`< 768px`) and Right Slide-Over on tablet/desktop (`>= 768px`) |
| `Modal` | `open`, `onClose`, `title`, `children` | Compact centered dialog for recording payments & delete confirmations |
| `EmptyState` | `icon`, `title`, `description`, `action` | Centered botanical icon + helpful next step CTA |
| `Skeleton` | `variant` (`card` \| `row` \| `text`) | Warm pulsing `bg-botanical-surface` placeholders during mock API latency |
| `Toast` | `message`, `tone`, `action` | Positioned above bottom nav on mobile, bottom-right on desktop |

### B. Domain & Feature Components

| Component | Location | Responsibility |
| :--- | :--- | :--- |
| `AppShell` / `Sidebar` / `MobileHeader` / `MobileBottomNav` | `layout/` | Adaptive navigation frame across mobile, tablet, and desktop |
| `WeddingHeroBanner` | `dashboard/` | Couple names, wedding date, live countdown, quick actions |
| `BudgetSummaryGrid` | `dashboard/` | Responsive 2×2 / 4-column KPI cards |
| `MasterBudgetBar` | `dashboard/` | Stacked budget allocation & spend visualization |
| `CategoryBreakdownChart` | `dashboard/` | Responsive Recharts Donut/Bar breakdown in botanical tones |
| `CategorySummaryList` | `dashboard/` | Scannable list of categories with dual-tone progress bars |
| `ContributorSummaryCard` | `dashboard/` | Subtle paid breakdown by Joint / Bride's Side / Groom's Side |
| `UpcomingDuesWidget` | `dashboard/` | Next 5 pending payments with inline `Pay` action |
| `CategoryCard` | `categories/` | Rich category summary card for the directory grid |
| `CategoryFormSheet` | `categories/` | Add/edit category drawer/sheet with icon picker & optional cap |
| `ExpenseRow` | `expenses/` | Mobile card / Desktop horizontal ledger row with Total, Paid, Upcoming |
| `ExpenseFormSheet` | `expenses/` | Add/edit expense with live advance calculator & collapsible Point #3 fields |
| `ExpenseDetailSheet` | `expenses/` | Full expense view, vendor click-to-call, and payment timeline |
| `RecordPaymentModal` | `expenses/` | Log installment or settle full remaining balance with mode & paid-by |
| `ExpenseFilterBar` | `expenses/` | Responsive search, horizontally scrollable pills, ceremony filter |

---

## 10. Phased Implementation Roadmap

1. **Milestone 1 — Project Setup, Tailwind Botanical Theme & UI Primitives**
   * Initialize Vite + React + TypeScript + Tailwind CSS with your exact `botanical` palette and Google Fonts.
   * Implement INR formatting, budget math utilities, `ResponsiveSheet` (Bottom Sheet / Slide-Over), `CurrencyInput`, `Accordion`, `ProgressBar`, `Badge`, `Card`, `Button`, `Modal`, and `Toast`.
2. **Milestone 2 — Mock API Layer & TanStack Query Hooks**
   * Build strict TypeScript models, `mockDb.ts` (`localStorage` + realistic sample Indian wedding seed), simulated network delay, REST-aligned services, and React Query hooks.
3. **Milestone 3 — Responsive Navigation Shell & Onboarding**
   * Build `OnboardingPage` (2-step setup + demo loader) and `AppShell` (`MobileHeader`, `MobileBottomNav`, Tablet collapsible rail, Desktop `Sidebar`).
4. **Milestone 4 — Home Dashboard & Categories Directory**
   * Build `DashboardPage` (Hero Countdown, KPI Grid, Master Budget Bar, List/Chart toggle, Contributor Strip, Upcoming Dues) and `CategoriesPage` + `CategoryFormSheet`.
5. **Milestone 5 — Category Expense Ledger, Payments, Upcoming Schedule & Settings**
   * Build `CategoryDetailPage`, `ExpenseRow`, `ExpenseFormSheet` (with advance calculator + collapsible Point #3 optional fields), `ExpenseDetailSheet`, `RecordPaymentModal`, `UpcomingPaymentsPage`, and `SettingsPage` (CSV export + print view).
   * Verify responsive ergonomics across mobile (`375px`), tablet (`768px`, `1024px`), and desktop (`1440px`) viewports.