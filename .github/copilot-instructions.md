# FitForge PWA — Workspace Instructions

> High-level development guidelines that apply to all work in the FitForge codebase.

---

## Project Overview

FitForge is a **local-first fitness tracking PWA** built with Next.js 15, PouchDB, and iOS 26 Liquid Glass design language. The app enables users to create workout routines, execute workouts with real-time tracking, and analyze performance — all fully offline-capable.

**Key characteristics:**
- **Local-first architecture** — all data operations hit PouchDB first, sync to CouchDB in background
- **Three-phase workout model** — every routine has warmUp → workout → stretch phases
- **iOS 26 design language** — Liquid Glass materials, lime accent (`#C5F74F`), SF Symbol icons
- **Framer Motion animations** — six calibrated spring presets, no CSS transitions/keyframes

---

## Code Style

### TypeScript

- **Strict mode enabled** — all functions have explicit return types
- **Prefer interfaces** over types for object shapes
- **String literal unions** over enums (better tree-shaking)
- **No `any`** — use `unknown` if truly dynamic, narrow with type guards

### React Patterns

- **Server Components by default** — add `"use client"` only when needed (state, effects, Framer Motion)
- **Explicit props interfaces** — export for reuse, never inline
- **Early returns** for loading/error states (avoid deep nesting)
- **Memoize expensive calculations** with `useMemo`
- **Functional updates** for state that depends on previous value

### Naming Conventions

```typescript
// Components: PascalCase
export function WorkoutTimer() {}

// Hooks: camelCase, "use" prefix
export function useAutoCount() {}

// Stores: camelCase, "use" prefix
export const useSessionStore = create(...);

// Constants: UPPER_SNAKE_CASE
const BASE_MET = { ... };

// Files: Match export name
WorkoutTimer.tsx  → export function WorkoutTimer()
useAutoCount.ts   → export function useAutoCount()
```

### Import Order

```typescript
// 1. External packages
import { motion } from "framer-motion";
import { create } from "zustand";

// 2. Absolute imports (lib, components, types)
import { springDefault } from "@/lib/motion/springs";
import { PrimaryButton } from "@/components/ui/Button";
import type { Routine } from "@/types";

// 3. Relative imports
import { FormField } from "./FormField";
import type { FormProps } from "./types";
```

---

## Architecture Rules

### Data Flow

1. **All writes go to PouchDB first** — never wait for network
2. **UI updates optimistically** — assume success, rollback on error
3. **CouchDB sync is background only** — user never sees sync status (it just works)
4. **TanStack Query wraps PouchDB** — provides caching + invalidation

### Database Conventions

- **Document IDs are composite, human-readable** — `"routine_{name}_{id}"`, `"workout_{ISO8601}_{id}"`
- **Use `allDocs` for simple queries** — faster than `find()`
- **Create indexes before using `find()`** — prevents full scans
- **Always include `_rev` on updates** — PouchDB handles conflicts automatically

### Phase Management

- **All three phases always exist** — `warmUp`, `workout`, `stretch` are never undefined
- **Empty phases are `[]`** — not `null` or `undefined`
- **Phase transitions show banners** — full-screen glass sheet with summary
- **Each phase has independent metrics** — time, calories, exercise count

---

## Design System Rules

### Colors

- **Use CSS custom properties** — never hardcode hex values
- **Primary accent is lime (`#C5F74F`)** — use sparingly (CTAs, progress, active)
- **Text is off-white (`#F5F5F5`)** — never pure white (OLED-optimized)
- **Backgrounds are near-black (`#0B0B0B`)** — OLED-optimized

### Glass Materials

- **Apply `.glass` classes from `globals.css`** — don't recreate backdrop-filter manually
- **Seven material variants available** — `.glass`, `.glass-elevated`, `.glass-tab-bar`, `.glass-nav-bar`, `.glass-sheet`, `.glass-menu`, `.glass-active-pill`
- **Never mix glass with opaque backgrounds** — defeats translucency

### Icons

- **Use `<Icon name="..." />` wrapper only** — never import Phosphor directly
- **SF Symbol naming keys** — e.g., `"house.fill"`, `"dumbbell.fill"` (28 symbols mapped)
- **Icon sizes** — 24pt default, 28pt large, 20pt small

### Typography

- **All weights use `-apple-system`** (SF Pro) — zero FOUT
- **Display scale is heavy** — 800-900 weight for titles
- **Letter-spacing is tight** — negative tracking on display/title sizes
- **Body text is 17px / 400** — iOS native size

### Safe Areas

- **Always apply safe area insets** on shell UI (tab bar, top bar, full-screen overlays)
- **Use `env(safe-area-inset-*)` custom properties**

---

## Animation Rules

### Framer Motion Only

- **No CSS `transition`, `@keyframes`, or `.animate-*` classes** — Framer Motion handles all motion
- **Use spring presets from `lib/motion/springs.ts`** — six calibrated options
- **Apply variants from `lib/motion/variants.ts`** — pushVariants, sheetVariants, etc.

### Layout Animations

- **Use `layoutId` for shared element transitions** — tab indicators, cards morphing
- **Only one element per `layoutId` at a time** — React key uniqueness rule
- **Wrap in `<AnimatePresence>`** for exit animations

### Performance

- **Avoid animating `height: auto`** — use `scaleY` or fixed heights
- **Use `will-change` sparingly** — only on active animations
- **Prefer `transform` + `opacity`** over layout properties

---

## Component Guidelines

### Structure

```
ComponentName/
├── index.tsx          # Export barrel (if multi-file)
├── ComponentName.tsx  # Main component
├── types.ts           # Local types (if >50 lines)
└── utils.ts           # Helper functions (if >50 lines)
```

Single-file for simple components (<100 lines):

```
Icon.tsx
```

### Props

- **Export interface** for reuse across parent/child/sibling components
- **Optional props with `?`** — not `| undefined`
- **Allow `className` override** on container elements (use `cn()` utility)
- **Destructure in function signature** — avoid `props.x` dot access

### Event Handlers

```typescript
// ✅ CORRECT: "handle" prefix in component, "on" prefix in props
interface CardProps {
  onPress: () => void;
}

function Card({ onPress }: CardProps) {
  const handlePress = () => {
    // Local logic
    onPress();
  };
  
  return <button onClick={handlePress}>...</button>;
}
```

### Conditional Rendering

- **Early return** for loading/error/empty states
- **Logical `&&`** for optional UI
- **Ternary** for A/B state (keep simple, no nesting)
- **Separate component** if logic >3 lines

---

## State Management

### When to Use Each Store

- **`useSessionStore`** — workout execution state (active routine, phase, timers, logs)
- **`useProfileStore`** — user data (weight, XP, PRs) — persisted to localStorage
- **`useSettingsStore`** — app preferences (unit, haptics, defaults) — persisted to localStorage
- **`useSheetStore`** — bottom sheet open/close (drives scale-behind effect)
- **TanStack Query** — async data (PouchDB queries, remote fetches)
- **Local `useState`** — ephemeral UI state (form inputs, toggles, modals)

### Zustand Patterns

```typescript
// ✅ CORRECT: Select specific slices to avoid re-renders
const phase = useSessionStore(s => s.currentPhase);

// ✅ CORRECT: Multiple selectors with shallow comparison
const { phase, exerciseIndex } = useSessionStore(
  s => ({ phase: s.currentPhase, exerciseIndex: s.exerciseIndex }),
  shallow
);

// ❌ WRONG: Selecting entire store (re-renders on any change)
const store = useSessionStore();
```

---

## Testing Philosophy

### Manual Testing Checklist

Before committing:

1. **Offline mode** — DevTools → Application → Service Workers → Offline
2. **Safe area simulation** — DevTools device toolbar, iPhone 15 Pro
3. **Dark mode only** — no light mode testing needed (MVP)
4. **Portrait orientation** — no landscape testing needed (MVP)
5. **Animation smoothness** — disable "Prefer reduced motion" in OS settings

### Key Scenarios

- **Create routine** → all three phases populated → saved to PouchDB
- **Start workout** → progresses through phases → shows transition banners → logs saved
- **Rest timer** → countdown accurate → skip/adjust works → auto-dismiss at 0:00
- **Auto-count** → vibrates per rep → stops early on tap
- **Phase transition** → background scales to 0.92 → banner animates from bottom

---

## Performance Priorities

1. **Startup <1s** — versioned delta sync ensures <5ms if no changes
2. **60fps animations** — use `transform` + `opacity`, spring presets calibrated
3. **Zero network blocking** — all writes to PouchDB, sync in background
4. **Efficient queries** — `allDocs` with key ranges, not full `find()` scans
5. **Image optimization** — WebP previews for GIF thumbnails, lazy load full GIFs

---

## Git Workflow

### Commit Messages

```
feat: add double progression scheme to routine builder
fix: rest timer vibration not firing on iOS Safari
refactor: extract calorie calculation to lib/calculations
docs: update design system with new glass variants
chore: regenerate exercise manifest after adding 10 new exercises
```

### Branch Strategy

```
main          # Production-ready, deployed
develop       # Integration branch
feature/*     # New features (merge to develop)
fix/*         # Bug fixes (merge to develop or main)
```

---

## Common Pitfalls

### ❌ Don't Wait for Network

```typescript
// ❌ WRONG
const res = await fetch("/api/save-routine");
if (res.ok) setIsSaved(true);

// ✅ CORRECT
await routinesDb.put(routine);
setIsSaved(true);  // UI updates immediately
```

### ❌ Don't Mix Animation Libraries

```tsx
// ❌ WRONG
<motion.div className="transition-all duration-300" />

// ✅ CORRECT
<motion.div transition={springDefault} />
```

### ❌ Don't Omit Phases

```typescript
// ❌ WRONG
const routine = { workout: [...] };

// ✅ CORRECT
const routine = { warmUp: [], workout: [...], stretch: [] };
```

### ❌ Don't Hardcode Colors

```tsx
// ❌ WRONG
<div style={{ background: "#C5F74F" }}>

// ✅ CORRECT
<div style={{ background: "var(--brand-lime)" }}>
```

### ❌ Don't Import Phosphor Directly

```tsx
// ❌ WRONG
import { House } from "@phosphor-icons/react";

// ✅ CORRECT
<Icon name="house.fill" />
```

---

## Resources

- **Detailed skill documentation:** Use `/fitforge-dev` slash command to load the full development guide
- **Architecture:** `docs/02-architecture.md`
- **Design System:** `docs/03-design-system.md`
- **Business Logic:** `docs/04-business-logic.md`
- **Implementation Plan:** `docs/05-implementation-plan.md`
- **UI/UX Screens:** `docs/06-ui-ux-screens.md`

---

## When in Doubt

1. **Check existing code first** — consistent patterns already established
2. **Consult `/docs` folder** — comprehensive architecture + design docs
3. **Load `/fitforge-dev` skill** — detailed development guide with examples
4. **Test offline** — if it doesn't work offline, it's not ready

---

**Maintain these principles in all contributions to ensure consistency, performance, and user experience quality.**
