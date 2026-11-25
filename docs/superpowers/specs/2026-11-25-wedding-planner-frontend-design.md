# Wedding Planner Frontend — Short Design Doc

**Date:** 2026-11-25  
**Source Spec:** [wedding_planner_web_app_full_implementation_plan.md](../../wedding_planner_web_app_full_implementation_plan.md)

## Intent & Why
Build a calm, editorial-grade Indian wedding budget workspace (`₹` `en-IN` formatting, multi-installment payment ledger, collapsible ceremony/contributor/vendor fields, and responsive Mobile/Tablet/Desktop layouts) using the already-initialized Vite + React 19 + TypeScript 7 + Tailwind CSS v4 project.

## Goals, Non-Goals & Anti-Goals
- **Goals:** Clean out Vite starter boilerplate; install planned packages via `pnpm`; implement the complete 6-screen UI (`Onboarding`, `Dashboard`, `Categories`, `Category Detail`, `Upcoming Payments`, `Settings`) with a REST-aligned `localStorage` Mock API + TanStack Query hooks; verify features and responsive layouts (`375px`, `768px`, `1024px`, `1440px`) in a live browser.
- **Non-Goals:** Building a real backend server or database in Phase 1 (the `services/` layer remains REST-ready via `VITE_USE_MOCK_API`).
- **Anti-Goals:** Neon/gradient/glassmorphism AI styling, heavy shadows, emoji UI icons, non-`tabular-nums` currency rows, or UI components reading `localStorage` directly.

## Constraints
- React 19.3, Vite 8, TypeScript 7 (`verbatimModuleSyntax` and `erasableSyntaxOnly` enabled), `oxlint` for linting, `pnpm` for package management.
- Tailwind CSS v4 (`@tailwindcss/vite`) — no `tailwind.config.js` v3 downgrade.

## Approaches Considered
1. **Stay on Tailwind CSS v4 with `@theme` tokens in `src/index.css` (Selected):** Defines all `botanical-*` color tokens and `Cormorant Garamond` / `Plus Jakarta Sans` font tokens natively in CSS `@theme`, matching the existing `@tailwindcss/vite` setup with zero config churn.
2. **Downgrade to Tailwind CSS v3 + `tailwind.config.js`:** Matches the older plan wording literally, but adds unnecessary dependency churn and conflicts with the initialized v4 template.

## Approved Design Summary
- **Theme & Typography:** Load `Cormorant Garamond` (500, 600) and `Plus Jakarta Sans` (400, 500, 600) in `index.html`; configure `@theme` botanical colors, fonts, `tabular-nums`, safe-area padding, and `@media print` styles in `src/index.css`.
- **Architecture:** Strict separation between `src/types/`, `src/utils/` (INR formatting, pure calculations, date helpers, CSV export), `src/services/` (mock DB + REST-shaped service modules), `src/hooks/` (TanStack Query), `src/components/` (`ui/`, `layout/`, `dashboard/`, `categories/`, `expenses/`), and `src/pages/`.
- **Verification:** `pnpm run lint`, `pnpm run build`, and end-to-end browser verification across mobile, tablet, and desktop viewports.
