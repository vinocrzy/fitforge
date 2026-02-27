# FitForge PWA — Documentation Index

> **Exercise Data Profile:** Each exercise record contains `id`, `name`, `bodyPart`, `equipment`, `target` (primary muscle), `secondaryMuscles[]`, `instructions[]`, `description`, `difficulty` (`beginner`/`intermediate`/`advanced`), and `category` (`strength`/`cardio`/etc.). All architecture decisions are grounded in this schema.

---

## Documents

| # | File | Description |
|---|------|-------------|
| 1 | [01-trainer-assessment.md](./01-trainer-assessment.md) | Personal Trainer's feature assessment & recommended additions |
| 2 | [02-architecture.md](./02-architecture.md) | High-level system architecture, local-first data flow, PouchDB/CouchDB sync strategy, Next.js PWA setup |
| 3 | [03-design-system.md](./03-design-system.md) | iOS 26 Liquid Glass design system — brand identity (lime `#C5F74F`), color tokens, component hierarchy, Zustand stores, Framer Motion spring system |
| 4 | [04-business-logic.md](./04-business-logic.md) | Calorie calculation, time estimation, auto-count rep logic, Recovery/Energy Meter |
| 5 | [05-implementation-plan.md](./05-implementation-plan.md) | Phased step-by-step implementation plan (Phase 1–7) |
| 6 | [06-ui-ux-screens.md](./06-ui-ux-screens.md) | Screen-by-screen UI/UX specifications — layout, typography, colour, animations, interactions for all 18 screens |

---

## Tech Stack Summary

| Concern | Technology |
|---|---|
| Framework | Next.js 15.x (App Router, TypeScript) |
| Styling | Tailwind CSS 4.x + iOS 26 Liquid Glass CSS classes (`.glass`, `.glass-tab-bar`, `.glass-sheet`, etc.) |
| Local Database | PouchDB (IndexedDB) — 5 instances |
| Cloud Sync (future) | CouchDB / IBM Cloudant |
| Global State | Zustand 5.x (`useSessionStore`, `useProfileStore`, `useSettingsStore`, `useSheetStore`) |
| Async/Cache State | TanStack Query 5.x |
| PWA | `@ducanh2912/next-pwa` + Workbox |
| Muscle Visualization | `react-body-highlighter` |
| Animations | Framer Motion 12.x — iOS-calibrated spring presets, page/sheet/banner variants |
| Charts | Recharts 2.x |
| Drag to Reorder | `@dnd-kit/sortable` |
| Icons | `@phosphor-icons/react` v2 behind `<Icon />` wrapper — SF Symbol naming keys, swappable to SVG exports (Architecture §2.9) |
| Hero Photos | `picsum.photos` (dev) → `public/images/athletes/*.jpg` (prod) — 8 category photos (Architecture §2.8) |
| Exercise Media | `data/gifs/*.gif` copied to `public/data/gifs/` + WebP previews in `public/data/previews/` (Architecture §2.7–2.8) |
| Font | `-apple-system` / SF Pro — native stack, zero FOUT |

---

## Phase Overview

```
Phase 1  Foundation & PWA shell
Phase 2  Exercise browser & Routine builder
Phase 3  Workout execution engine        ← MVP complete
Phase 4  Post-workout insights & rewards
Phase 5  Dashboard & analytics
Phase 6  Advanced coaching features
Phase 7  Cloud sync (CouchDB)            ← parallel track
```

Phases 1–4 constitute the **shippable MVP**.
