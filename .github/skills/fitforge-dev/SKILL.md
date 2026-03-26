---
name: fitforge-dev
description: "Development guide for FitForge PWA — iOS 26 Liquid Glass fitness app. USE FOR: adding features, fixing bugs, refactoring components, implementing new screens, workout logic, routine builder, exercise browser, animation work, database queries, cloud sync, authentication, Personal Trainer Portal, trainer enrollment, connections, routine suggestions, client progress, notifications. CONTAINS: architecture patterns (local-first PouchDB, server-authoritative CouchDB for PT Portal, three-phase workout model), design system (Liquid Glass materials, brand tokens, Framer Motion springs), component conventions, business logic (calorie/time calculations), TypeScript patterns, Zustand state management, Clerk authentication, CouchDB proxy sync, PT Portal patterns (couchFetch, shared DBs, role-aware APIs, fire-and-forget notifications, TanStack Query hooks). DO NOT USE FOR: general React questions, unrelated projects, or tasks outside FitForge codebase."
---

# FitForge PWA Development Guide

> **FitForge** is a Next.js 16 PWA for fitness tracking with local-first offline capability, iOS 26 Liquid Glass design language, Clerk authentication, and a three-phase workout model (warm-up → workout → stretch).

---

## Table of Contents

1. [Architecture Patterns](#architecture-patterns)
2. [Design System](#design-system)
3. [Component Conventions](#component-conventions)
4. [State Management](#state-management)
5. [Database Patterns](#database-patterns)
6. [Business Logic](#business-logic)
7. [Animation System](#animation-system)
8. [TypeScript Patterns](#typescript-patterns)
9. [Personal Trainer Portal](#personal-trainer-portal)
10. [Common Tasks](#common-tasks)
11. [Authentication (Clerk)](#authentication-clerk)
12. [Cloud Sync (CouchDB Proxy)](#cloud-sync-couchdb-proxy)
13. [Anti-Patterns](#anti-patterns)

---

## Architecture Patterns

### Local-First Data Flow

**CRITICAL:** All data operations go to PouchDB first. Never wait for network. UI updates optimistically.

```typescript
// ✅ CORRECT: Write to PouchDB, UI updates immediately
await routinesDb.put(routine);
useProfileStore.setState({ lastSaved: Date.now() });

// ❌ WRONG: Never wait for network before updating UI
await fetch('/api/save-routine'); // Don't do this
```

### Three-Phase Workout Model

Every routine and workout session has exactly three phases:

```typescript
interface Routine {
  warmUp: RoutineExerciseConfig[];   // Pre-workout activation
  workout: RoutineExerciseConfig[];  // Main working sets
  stretch: RoutineExerciseConfig[];  // Cool-down flexibility
}
```

**Rules:**
- All three arrays always exist (may be empty)
- Each phase has independent time/calorie calculations
- Phase transitions show full-screen banner with summary
- Phase hint on custom exercises is non-binding (user can add anywhere)

### PouchDB Database Strategy

Five separate database instances:

| Database | Purpose | Syncs? | ID Pattern |
|----------|---------|--------|------------|
| `fitforge_exercises` | Seeded library (read-only) | No | `"0001"` numeric |
| `fitforge_custom_exercises` | User-created exercises | Yes | `"custom_exercise_user_{id}"` |
| `fitforge_routines` | User routines | Yes | `"routine_{name}_{id}"` |
| `fitforge_workouts` | Completed sessions | Yes | `"workout_{ISO8601}_{id}"` |
| `fitforge_profile` | User profile + settings | Yes | `"profile_user_001"` |

**Document versioning:** Use `_rev` for updates. PouchDB handles conflicts automatically.

### Exercise Data Profile

Every exercise (seeded or custom) must have:

```typescript
interface ExerciseRecord {
  id: string;
  name: string;
  bodyPart: string;           // "chest", "legs", "back", etc.
  equipment: string;          // "barbell", "dumbbell", "body weight"
  target: string;             // Primary muscle (e.g., "pectorals")
  secondaryMuscles: string[]; // ["deltoids", "triceps"]
  instructions: string[];     // Step-by-step
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: "strength" | "cardio" | "stretching" | "plyometrics";
  gifUrl?: string;            // Optional: "0001.gif"
}
```

### Next.js Conventions

- **App Router only** — no Pages directory
- All routes in `src/app/`
- Components in `src/components/` organized by domain:
  - `ui/` — design system primitives (`Button`, `Icon`, `SearchBar`)
  - `workout/` — workout execution components
  - `routine/` — routine builder components
  - `exercise/` — exercise browser components
  - `layout/` — shell components (`AppLayout`, `BottomNav`)
- Server Components by default, add `"use client"` only when needed (state, effects, Framer Motion)

---

## Design System

### Brand Identity

**App name:** FitForge  
**Wordmark:** SF Pro 800, `-0.04em` tracking, `#C5F74F` on dark  
**Primary accent:** Lime `#C5F74F` — use sparingly for CTAs, progress, active states

### Color Tokens

Use CSS custom properties defined in `globals.css`:

```typescript
// Primary colors
--brand-lime: #C5F74F;        // CTAs, active, progress
--brand-lime-dim: #A8D93D;    // Pressed state
--brand-lime-dark: #6B9E1F;   // Disabled state

// Backgrounds (OLED-optimized)
--brand-bg: #0B0B0B;          // App chrome
--brand-surface: #141414;     // Default cards
--brand-surface-2: #1E1E1E;   // Elevated cards
--brand-surface-3: #282828;   // Nested surfaces

// Text
--brand-text: #F5F5F5;        // Primary text (NOT pure white)
--brand-text-2: rgba(245,245,245,0.55);  // Secondary
--brand-text-3: rgba(245,245,245,0.30);  // Tertiary

// Semantic
--brand-danger: #FF453A;      // Errors, destructive
--brand-warning: #FF9F0A;     // RPE alerts
--brand-success: #30D158;     // Completion
--brand-info: #64D2FF;        // Tips, rest timer
```

### iOS 26 Liquid Glass Materials

Seven core glass classes in `globals.css`:

```css
.glass               /* Default glass — sheets, cards */
.glass-elevated      /* Higher elevation, brighter */
.glass-tab-bar       /* Floating pill tab bar (72pt height) */
.glass-nav-bar       /* Top navigation (88pt with safe area) */
.glass-sheet         /* Bottom sheets (28pt top radius) */
.glass-menu          /* Dropdowns, popovers */
.glass-active-pill   /* Tab indicator pill */
```

**Recipe (full-spec in Design System §3.1):**
```css
backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
background: rgba(255,255,255,0.06);
border: 1px solid rgba(255,255,255,0.12);
box-shadow:
  0 0 0 0.5px rgba(255,255,255,0.18) inset,  /* specular edge */
  0 1px 3px rgba(0,0,0,0.08) inset,           /* inner shadow */
  0 8px 24px rgba(0,0,0,0.40);                 /* outer shadow */
```

**Usage:**
```tsx
// ✅ CORRECT: Apply glass class to container
<div className="glass rounded-2xl p-4">...</div>

// ❌ WRONG: Don't mix with opaque backgrounds
<div className="glass bg-black">...</div>  // Defeats translucency
```

### Category Gradients

Eight category gradients for hero cards and chips:

```typescript
const CATEGORY_GRADIENT: Record<WorkoutCategory, string> = {
  strength:    "var(--grad-strength)",   // Fire orange
  cardio:      "var(--grad-cardio)",     // Electric blue
  stretching:  "var(--grad-stretch)",    // Purple-pink
  warmup:      "var(--grad-warmup)",     // Golden yellow
  upper:       "var(--grad-upper)",      // Violet
  lower:       "var(--grad-lower)",      // Emerald
  core:        "var(--grad-core)",       // Magenta
  fullbody:    "var(--grad-full)",       // Indigo
};
```

### Typography Scale

All weights use `-apple-system` (SF Pro):

```typescript
// Display (splash, hero) — 48px / 900 / -0.04em
<h1 className="text-5xl font-black tracking-tighter">

// Large Title (dashboard greeting) — 34px / 800 / -0.03em
<h1 className="text-4xl font-extrabold tracking-tight">

// Title (card headlines) — 28px / 800 / -0.025em
<h2 className="text-3xl font-extrabold">

// Headline (list primary) — 17px / 600
<span className="text-base font-semibold">

// Body — 17px / 400
<p className="text-base">

// Caption — 12px / 500 / 0.02em
<span className="text-xs font-medium tracking-wide">
```

### Iconography

**CRITICAL:** Use SF Symbol naming keys via `<Icon />` wrapper. Never import Phosphor directly.

```tsx
// ✅ CORRECT: SF Symbol key
<Icon name="house.fill" size={24} />
<Icon name="dumbbell.fill" weight="fill" />

// ❌ WRONG: Don't import Phosphor directly
import { House } from '@phosphor-icons/react';  // Don't do this
```

**Mapping in `components/ui/Icon.tsx` — 28 symbols implemented.**

### Button Conventions

```tsx
// Primary CTA — lime pill, 56pt height, 100px radius
<PrimaryButton onClick={handleStart}>
  Start Workout
</PrimaryButton>

// Secondary — glass outline, black text
<button className="glass rounded-full px-6 py-3 text-sm font-semibold">
  Skip
</button>

// Ghost — text only, lime on dark
<button className="text-[var(--brand-lime)] font-semibold">
  Edit
</button>
```

### Safe Area Support

**CRITICAL — Always use inline `style` for safe area, NOT Tailwind utility classes.**  
Tailwind classes like `pt-safe-top` do NOT exist in this project and will silently have no effect.

```tsx
// ✅ CORRECT: Inline style with env()
<div
  className="fixed inset-0 overflow-y-auto bg-[#0B0B0B] px-6"
  style={{
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
  }}
>

// ❌ WRONG: pt-safe-top is not defined in this project
<div className="pt-safe-top pb-8">

// ✅ CORRECT: Bottom nav / fixed footers
<div style={{ paddingBottom: 'calc(8px + env(safe-area-inset-bottom))' }}>
```

**Two CSS utility classes exist in `globals.css` (apply as className, not pt-*):**
```css
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
```

**Full-screen auth/onboarding pages checklist:**
- `overflow-y-auto` — required so tall content can scroll
- `paddingTop: 'env(safe-area-inset-top)'` — notch/Dynamic Island clearance
- `paddingBottom: 'max(32px, env(safe-area-inset-bottom))'` — home bar clearance + fallback

---

## Component Conventions

### Client vs Server Components

```tsx
// ✅ Server Component (default) — data fetching, static
export default function RoutineListPage() {
  // Can call async functions, read DB directly
  return <RoutineList />;
}

// ✅ Client Component — state, effects, animations
"use client";
export function WorkoutTimer() {
  const [seconds, setSeconds] = useState(0);
  return <motion.div>...</motion.div>;
}
```

### Component File Structure

```
ComponentName/
├── index.tsx          // Export barrel
├── ComponentName.tsx  // Main component
├── types.ts           // Local types (if >50 lines)
└── utils.ts           // Helper functions
```

Small components can be single-file:

```
Icon.tsx               // Simple wrapper, <100 lines
```

### Prop Patterns

```typescript
// ✅ CORRECT: Explicit interface, exported for reuse
export interface ExerciseCardProps {
  exercise: ExerciseRecord;
  onPress: () => void;
  selected?: boolean;        // Optional with '?'
  className?: string;        // Allow style override
}

export function ExerciseCard({ 
  exercise, 
  onPress, 
  selected,
  className 
}: ExerciseCardProps) {
  return (
    <motion.div 
      className={cn("glass p-4", selected && "border-lime", className)}
      whileTap={{ scale: 0.97 }}
      onClick={onPress}
    >
      {/* ... */}
    </motion.div>
  );
}
```

### Conditional Rendering

```tsx
// ✅ CORRECT: Early return for loading/error
if (isLoading) return <Skeleton />;
if (error) return <ErrorState />;

// ✅ CORRECT: Logical && for optional UI
{canEdit && <EditButton />}

// ✅ CORRECT: Ternary for A/B state
{isActive ? <ActiveIcon /> : <InactiveIcon />}

// ❌ WRONG: Nested ternaries
{a ? (b ? c : d) : (e ? f : g)}  // Hard to read
```

### List Rendering

```tsx
// ✅ CORRECT: Stable key from ID
{exercises.map(ex => (
  <ExerciseCard key={ex.id} exercise={ex} />
))}

// ❌ WRONG: Index as key (unstable on reorder)
{exercises.map((ex, i) => (
  <ExerciseCard key={i} exercise={ex} />
))}
```

---

## State Management

### Zustand Stores

Four global stores:

#### `useSessionStore` — Workout execution state

```typescript
interface SessionState {
  // Active session
  activeRoutine: Routine | null;
  currentPhase: "warmUp" | "workout" | "stretch";
  exerciseIndex: number;
  setIndex: number;
  
  // Timers
  restStartTime: number | null;
  restTargetSec: number;
  
  // Logs
  completedSets: CompletedSet[];
  
  // Actions
  startWorkout: (routine: Routine) => void;
  completeSet: (set: CompletedSet) => void;
  advancePhase: () => void;
  endWorkout: () => Promise<WorkoutSession>;
}
```

**Usage:**
```tsx
const { activeRoutine, completeSet } = useSessionStore();

// ✅ CORRECT: Use shallow for multiple selectors
const { phase, exerciseIndex } = useSessionStore(
  state => ({ phase: state.currentPhase, exerciseIndex: state.exerciseIndex }),
  shallow
);
```

#### `useProfileStore` — User profile + persist

```typescript
interface ProfileState {
  profile: UserProfile | null;
  xp: number;
  level: number;
  personalRecords: PersonalRecord[];
  
  updateWeight: (kg: number) => void;
  addXP: (points: number) => void;
  updatePR: (exerciseId: string, weightKg: number) => void;
}
```

**Persisted to localStorage via Zustand persist middleware.**

#### `useSettingsStore` — App preferences

```typescript
interface SettingsState {
  unitPreference: "kg" | "lbs";
  darkMode: boolean;           // Always true for MVP
  haptics: boolean;
  autoCountEnabled: boolean;
  defaultRestSec: number;
  
  toggleUnit: () => void;
  setHaptics: (enabled: boolean) => void;
}
```

#### `useSheetStore` — Bottom sheet state (drives scale-behind)

```typescript
interface SheetState {
  isOpen: boolean;
  activeSheet: string | null;  // "exercise-picker", "rest-timer", etc.
  
  openSheet: (id: string) => void;
  closeSheet: () => void;
}
```

**Critical for iOS 26 scale-behind effect:**

```tsx
// AppLayout reads this to scale background
const isSheetOpen = useSheetStore(s => s.isOpen);

return (
  <motion.div 
    variants={sheetBackgroundVariants}
    animate={isSheetOpen ? "open" : "closed"}
  >
    {children}
  </motion.div>
);
```

### TanStack Query Patterns

```typescript
// ✅ CORRECT: PouchDB query with cache
const { data: routines } = useQuery({
  queryKey: ["routines"],
  queryFn: async () => {
    const result = await routinesDb.allDocs({ include_docs: true });
    return result.rows.map(r => r.doc as Routine);
  },
  staleTime: 5 * 60 * 1000,  // 5min cache
});

// ✅ CORRECT: Mutation with optimistic update
const mutation = useMutation({
  mutationFn: async (routine: Routine) => {
    return await routinesDb.put(routine);
  },
  onMutate: async (newRoutine) => {
    await queryClient.cancelQueries({ queryKey: ["routines"] });
    const prev = queryClient.getQueryData(["routines"]);
    queryClient.setQueryData(["routines"], old => [...old, newRoutine]);
    return { prev };
  },
  onError: (err, vars, context) => {
    queryClient.setQueryData(["routines"], context.prev);
  },
});
```

---

## Database Patterns

### Querying PouchDB

```typescript
// ✅ CORRECT: Use allDocs for simple queries
const routines = await routinesDb.allDocs({
  include_docs: true,
  startkey: "routine_",
  endkey: "routine_\ufff0",
});

// ✅ CORRECT: Use pouchdb-find for complex filters
await routinesDb.createIndex({
  index: { fields: ["createdAt"] }
});

const result = await routinesDb.find({
  selector: { 
    type: "routine",
    createdAt: { $gt: lastWeek }
  },
  sort: [{ createdAt: "desc" }],
});
```

### Updating Documents

```typescript
// ✅ CORRECT: Fetch, modify, put with _rev
const doc = await db.get(id);
const updated = { ...doc, name: "New Name" };
await db.put(updated);  // PouchDB auto-handles _rev

// ❌ WRONG: Don't create new doc without _rev
await db.put({ _id: id, name: "New Name" });  // Conflict!
```

### Syncing Exercise Library

**Versioned delta sync** runs on app startup:

```typescript
// scripts/generate-exercise-manifest.ts generates:
{
  "version": "sha1_of_all_files",
  "exercises": {
    "0001": "sha1_of_0001_json",
    "0002": "sha1_of_0002_json"
  }
}

// Runtime: lib/db/syncExerciseLibrary.ts
// 1. Fetch manifest from SW cache
// 2. Compare version with _local/exercise_library_meta
// 3. If match → exit (zero writes)
// 4. If differ → delta sync: INSERT/UPSERT/SOFT-DELETE
// 5. Persist new meta
```

**This ensures <5ms startup when data is unchanged.**

---

## Business Logic

### Calorie Calculation

MET-based formula with RPE modifier:

```typescript
const BASE_MET = {
  strength:    { beginner: 3.5, intermediate: 5.0, advanced: 6.0 },
  cardio:      { beginner: 7.0, intermediate: 9.0, advanced: 11.0 },
  stretching:  { beginner: 2.5, intermediate: 2.5, advanced: 2.5 },
  plyometrics: { beginner: 7.0, intermediate: 8.5, advanced: 10.0 },
};

const PHASE_MET_MODIFIER = {
  warmUp:  0.6,   // Sub-maximal
  workout: 1.0,   // Full effort
  stretch: 1.0,   // Base MET already low
};

// Calories = MET × weight_kg × duration_hours × RPE_modifier
// RPE modifier: RPE 7 = 1.0, RPE 10 = +20%, RPE 5 = -6.6%
const rpeMod = 1 + (rpe - 7) * 0.033;
```

**Custom exercises:** Use MET fallback based on `phaseHint`:
- `stretch` → 2.5 MET
- `warmUp` → 2.1 MET (3.5 × 0.6)
- `workout` → 4.0 MET (conservative default)

### Time Estimation

```typescript
const AVG_REP_DURATION_SEC = 3;

function estimatePhaseTime(items: RoutineExerciseConfig[]): number {
  return items.reduce((total, ex) => {
    // Stretch uses holdSec, others use reps × 3sec
    const activePerSet = ex.holdSec 
      ? ex.holdSec 
      : (ex.targetReps ?? 0) * AVG_REP_DURATION_SEC;
    
    return total + ex.sets * (activePerSet + ex.restTimeSec);
  }, 0);
}

// Add overhead: 10% on workout phase, 20s transition buffers
const totalSec = warmUpSec + workoutSec * 1.1 + stretchSec + 40;
```

### Progressive Overload Schemes

Three schemes available in routine builder:

1. **Linear** — add fixed weight every N sessions
   ```typescript
   newWeight = prevWeight + stepKg;
   ```

2. **Double Progression** — increase reps, then weight
   ```typescript
   if (actualReps >= ceilingReps) {
     weight += stepKg;
     reps = floorReps;
   } else {
     reps++;
   }
   ```

3. **Undulating** — rotate Heavy/Moderate/Light days
   ```typescript
   const dayWeights = {
     heavy:    baseWeight * 1.0,
     moderate: baseWeight * 0.85,
     light:    baseWeight * 0.70,
   };
   ```

**Applied automatically on routine re-execution based on `progressionScheme` config.**

### Warm-Up Set Generator

When enabled on a workout-phase exercise:

```typescript
const workingWeight = exercise.weightKg;
const warmUpSets = [
  { weight: workingWeight * 0.4, reps: 8 },
  { weight: workingWeight * 0.6, reps: 5 },
  { weight: workingWeight * 0.8, reps: 3 },
  { weight: workingWeight * 0.9, reps: 1 },
];
```

**Prepended to the warm-up phase array, fully editable.**

---

## Animation System

### Framer Motion Springs

Four calibrated spring presets in `lib/motion/springs.ts`:

```typescript
// Fast, snappy — button taps, checkmarks, small state changes
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 36, mass: 1 };

// Default iOS nav feel — push/pop, card reveals
export const springDefault: Transition = { type: "spring", stiffness: 320, damping: 32, mass: 1 };

// Smooth, gentle — sheet presentations, large entrances
export const springGentle: Transition = { type: "spring", stiffness: 200, damping: 26, mass: 1 };

// Slow, deliberate — phase transitions, celebration, error shakes
export const springCelebration: Transition = { type: "spring", stiffness: 120, damping: 16, mass: 1 };
```

**No `springBouncy` or `springSheet` — these do NOT exist.** Use `springGentle` for sheets and `springCelebration` for playful/error animations.

**Usage:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springGentle}
>
```

### Reusable Variants

Defined in `lib/motion/variants.ts`. All keys are `initial / animate / exit` (not `hidden/visible` or `closed/open`):

```typescript
// iOS push navigation — new page slides in from right
export const pushVariants: Variants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springDefault },
  exit: { x: "-30%", opacity: 0, transition: springDefault },
};

// iOS pop navigation — page slides back out to right
export const popVariants: Variants = {
  initial: { x: "-30%", opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springDefault },
  exit: { x: "100%", opacity: 0, transition: springDefault },
};

// iOS 26 modal sheet — slides up from bottom
export const sheetVariants: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: springGentle },
  exit: { y: "100%", transition: springSnappy },
};

// iOS 26 — background scales down while sheet is open
// States: "normal" and "dimmed" (NOT "closed"/"open")
export const sheetBackgroundVariants: Variants = {
  normal: { scale: 1, borderRadius: "0px", filter: "brightness(1)", transition: springGentle },
  dimmed: { scale: 0.92, borderRadius: "16px", filter: "brightness(0.65)", transition: springGentle },
};

// Tab switching — cross-fade only (no slide)
export const tabVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

// Coaching banner — slides down from top
export const bannerVariants: Variants = {
  initial: { y: -80, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springSnappy },
  exit: { y: -80, opacity: 0, transition: springSnappy },
};

// Phase transition banner — slides up from bottom
export const phaseTransitionVariants: Variants = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springGentle },
  exit: { y: "100%", opacity: 0, transition: springSnappy },
};

// Staggered lists
export const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const fadeUpItem: Variants = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springDefault },
};
```

**Usage:**
```tsx
<motion.div
  variants={sheetVariants}
  initial="initial"
  animate="animate"
  exit="exit"
>
  {/* Bottom sheet content */}
</motion.div>

// ✅ CORRECT: sheetBackground uses "normal" / "dimmed"
<motion.div
  variants={sheetBackgroundVariants}
  animate={isSheetOpen ? "dimmed" : "normal"}
/>
```

### Layout Animations

Use `layoutId` for shared element transitions:

```tsx
// Active tab indicator pill
<motion.div
  layoutId="tab-indicator"
  className="glass-active-pill"
  transition={springSnappy}
/>
```

**Critical:** Only ONE element with a given `layoutId` can be rendered at a time.

### AnimatePresence

Required for exit animations:

```tsx
<AnimatePresence mode="wait">
  {isOpen && (
    <motion.div
      key="sheet"
      variants={sheetVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
    />
  )}
</AnimatePresence>
```

**`mode="wait"` prevents overlapping animations.**

---

## TypeScript Patterns

### Strict Typing

```typescript
// ✅ CORRECT: Explicit return types on public functions
export function calculateCalories(
  exercises: ExerciseLog[],
  userWeightKg: number
): number {
  // ...
}

// ✅ CORRECT: Discriminated unions for phase
type SessionPhase = "warmUp" | "workout" | "stretch";

// ✅ CORRECT: Readonly arrays when immutable
interface Routine {
  readonly warmUp: readonly RoutineExerciseConfig[];
}
```

### Utility Types

```typescript
// Extract nested type
type ExerciseDifficulty = ExerciseRecord["difficulty"];

// Partial for optional fields
type PartialRoutine = Partial<Routine>;

// Pick subset of keys
type RoutineMeta = Pick<Routine, "id" | "name" | "createdAt">;

// Omit keys
type RoutineWithoutId = Omit<Routine, "id">;
```

### Enums vs String Unions

**Prefer string unions** for better tree-shaking:

```typescript
// ✅ CORRECT: String literals
type WorkoutCategory = 
  | "strength" 
  | "cardio" 
  | "stretching" 
  | "plyometrics";

// ❌ AVOID: Enums (unless you need reverse mapping)
enum WorkoutCategory {
  Strength = "strength",
  Cardio = "cardio",
}
```

---

## Personal Trainer Portal

### Architecture — Server-Authoritative vs Local-First

The PT Portal uses a **fundamentally different data pattern** from the main app:

| Aspect | Main App | PT Portal |
|--------|----------|-----------|
| **Data Store** | Local-first PouchDB | Server-authoritative CouchDB |
| **Access Pattern** | Direct PouchDB reads + background sync | REST API routes + TanStack Query |
| **Authorization** | Clerk middleware (route-level) | Clerk metadata `role: "trainer"` (route + API) |
| **Offline Support** | Full | None (requires network) |
| **Data Scope** | Per-user (own routines, workouts) | Cross-user (trainer-client relationships) |

**Why server-authoritative?** PT data (connections, suggestions, notifications) is inherently cross-user — a trainer needs to see multiple clients' data, and clients need to see trainer profiles. Local-first PouchDB doesn't work for cross-user queries.

### Shared CouchDB Databases

Four server-side databases (NOT per-user prefixed, unlike sync databases):

| Database | Purpose | Doc ID Pattern |
|----------|---------|----------------|
| `fitforge_trainers` | Trainer profiles | `trainer_{clerkUserId}` |
| `fitforge_connections` | PT-client subscriptions | `connection_{trainerId}_{clientId}_{timestamp}` |
| `fitforge_suggestions` | Routine recommendations | `suggestion_{trainerId}_{clientId}_{timestamp}` |
| `fitforge_trainer_notifications` | Trainer alerts | `notif_{trainerId}_{timestamp}` |

Each database has its own utility module in `src/lib/db/`:

```
src/lib/db/
├── trainerDb.ts        # couchFetch() + trainer CRUD
├── connectionDb.ts     # Connection CRUD + client list
├── suggestionDb.ts     # Suggestion CRUD
└── notificationDb.ts   # Notification CRUD + fire-and-forget helper
```

### `couchFetch` — Server-Side CouchDB Client

All PT database modules share `couchFetch()` from `trainerDb.ts`:

```typescript
// src/lib/db/trainerDb.ts — server-side only, never import in client components
export async function couchFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const url = new URL(process.env.COUCHDB_ADMIN_URL!);
  const authHeader = 'Basic ' + Buffer.from(`${url.username}:${url.password}`).toString('base64');
  const base = `${url.protocol}//${url.host}`;
  
  return fetch(`${base}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: authHeader,
      ...options.headers,
    },
  });
}
```

**Usage in other DB modules:**
```typescript
// connectionDb.ts, suggestionDb.ts, notificationDb.ts all import from trainerDb
import { couchFetch } from '@/lib/db/trainerDb';

const res = await couchFetch(`/${DB_NAME}/_find`, {
  method: 'POST',
  body: JSON.stringify({ selector, sort, limit, skip }),
});
```

### `ensureDb` Pattern — Idempotent DB + Index Creation

Every DB module has an `ensure*Db()` function that creates the database and Mango indexes:

```typescript
let dbReady = false;

export async function ensureNotificationDb(): Promise<void> {
  if (dbReady) return;
  
  // Create DB (409 = already exists, that's fine)
  await couchFetch(`/${DB_NAME}`, { method: 'PUT' });
  
  // Create Mango indexes
  await couchFetch(`/${DB_NAME}/_index`, {
    method: 'POST',
    body: JSON.stringify({
      index: { fields: ['type', 'trainerId', 'createdAt'] },
      ddoc: 'trainer-created',
      type: 'json',
    }),
  });
  
  dbReady = true;
}
```

**Pattern:** Module-level `let dbReady = false` flag prevents redundant DB/index creation after the first successful run within a server process.

### Middleware — Trainer Route Protection

The middleware uses three route matchers for PT-related access control:

```typescript
// src/middleware.ts
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)', '/sign-up(.*)', '/api/trainers',  // trainer directory is public
]);

const isTrainerRoute = createRouteMatcher([
  '/trainer(.*)',                      // All trainer pages
  '/api/clients(.*)',                  // Client list API
  '/api/trainer-notifications(.*)',    // Notification API
]);

const isTrainerApiRoute = createRouteMatcher([
  '/api/trainers/(.*)',               // Individual trainer CRUD
]);
```

**Logic flow:**
1. Public routes → pass through
2. Non-public routes → `auth.protect()` (require login)
3. Trainer routes → check `sessionClaims.metadata.role === 'trainer'`
4. Exception: `/trainer/enroll` is allowed for non-trainers (enrollment page)

### API Route Auth Pattern

All PT API routes follow this authentication pattern:

```typescript
import { auth } from '@clerk/nextjs/server';

export async function GET(request: Request): Promise<Response> {
  const { userId, sessionClaims } = await auth();
  if (!userId) {
    return Response.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
      { status: 401 }
    );
  }
  
  // For trainer-only endpoints:
  const role = (sessionClaims?.metadata as Record<string, unknown> | undefined)?.role;
  if (role !== 'trainer') {
    return Response.json(
      { success: false, error: { code: 'FORBIDDEN', message: 'Trainer role required' } },
      { status: 403 }
    );
  }
  
  // ... route logic
}
```

**Role-aware queries** — some endpoints return different data based on role:

```typescript
const isTrainer = role === 'trainer';
const connections = await listConnections(
  isTrainer ? { trainerId: userId } : { clientId: userId }
);
```

### Standard API Response Shape

```typescript
// Success
{ success: true, data: T, pagination?: { total, page, pageSize, hasMore } }

// Error
{ success: false, error: { code: string, message: string } }
```

### TanStack Query Hooks for PT

PT hooks live in `src/hooks/` alongside main app hooks. Key patterns:

**Query key conventions:**
```typescript
['trainers', search, specialization]       // Directory listing
['trainer', trainerId]                      // Single trainer
['trainerProfile', 'me']                   // Own profile
['connections', role, status]               // Connection list
['active-connection']                       // User's current connection
['clients', status]                         // Trainer's client list
['suggestions', status]                     // Suggestion list
['pending-suggestions-count']               // Badge count
['client-progress', clientId]              // Aggregated stats
['client-workouts', clientId, limit]       // Workout history
['client-prs', clientId]                   // Personal records
['trainer-notifications', limit]           // Notification list
['trainer-notifications', 'unread-count']  // Badge count
```

**Stale time tiers:**
```typescript
staleTime: 15_000    // Notification badge — needs frequent updates
staleTime: 30_000    // Notification list, active connection
staleTime: 60_000    // Connections, suggestions, clients
staleTime: 120_000   // Trainer directory (changes infrequently)
staleTime: 300_000   // Own trainer profile
```

**Mutation + invalidation pattern:**
```typescript
export function useRespondToConnection(): UseMutationResult<...> {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ connectionId, action }) => {
      const res = await fetch(`/api/connections/${connectionId}/respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['connections'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
  });
}
```

### Fire-and-Forget Notifications

Notifications are created as side effects in API routes. They must **never block** the main response:

```typescript
// src/lib/db/notificationDb.ts
export async function createTrainerNotification(params: {
  trainerId: string;
  notificationType: TrainerNotificationType;
  title: string;
  body: string;
  referenceId?: string;
  clientId?: string;
}): Promise<void> {
  try {
    await ensureNotificationDb();
    await putNotificationDoc({ ...params, read: false, createdAt: new Date().toISOString() });
  } catch (error) {
    console.error('[createTrainerNotification] Error:', error);
    // Don't throw — fire-and-forget
  }
}
```

**Usage in API routes — `void` prefix, never `await`:**
```typescript
await putConnectionDoc(connectionDoc);  // Main operation — await this

void createTrainerNotification({        // Side effect — fire-and-forget
  trainerId,
  notificationType: 'new_connection_request',
  title: 'New Connection Request',
  body: 'A new client wants to connect with you.',
  referenceId: connectionDoc._id,
  clientId: userId,
});

return Response.json({ success: true, data: connectionDoc });
```

**Five notification types:**

| Type | Trigger | Icon |
|------|---------|------|
| `new_connection_request` | Client subscribes to trainer | Green person |
| `connection_ended` | Either party ends connection | Red person |
| `suggestion_accepted` | Client accepts routine suggestion | Lime checkmark |
| `suggestion_declined` | Client declines routine suggestion | Orange xmark |
| `client_workout_completed` | Client finishes a workout | Blue dumbbell |

### PT Component Organization

```
src/components/trainer/
├── TrainerCard.tsx           # Directory listing card
├── TrainerDetailView.tsx     # Full trainer profile
├── TrainerEnrollmentForm.tsx # Enrollment form
├── TrainerDashboard.tsx      # Dashboard stats + overview
├── SubscribeButton.tsx       # Subscribe/unsubscribe CTA
├── ConnectionRequestCard.tsx # Accept/decline request
├── ClientCard.tsx            # Client list item
├── MyTrainerCard.tsx         # User's active trainer
├── PrivacySettingsSheet.tsx  # Shared data toggles
├── SuggestRoutineSheet.tsx   # PT routine suggestion
├── SuggestionCard.tsx        # User suggestion card
├── ClientProgressView.tsx    # Trainer client overview
├── ClientWorkoutList.tsx     # Client workout history
├── NotificationBell.tsx      # Bell icon + badge
├── NotificationItem.tsx      # Notification row
└── NotificationList.tsx      # Notification feed
```

### PT Page Routes

```
src/app/(app)/
├── trainers/
│   ├── page.tsx              # S-PT-01 Trainer Directory
│   └── [id]/page.tsx         # S-PT-02 Trainer Detail
├── trainer/
│   ├── enroll/page.tsx       # S-PT-03 Enrollment
│   ├── page.tsx              # S-PT-04 Dashboard
│   ├── clients/
│   │   ├── page.tsx          # S-PT-05 Client List
│   │   └── [id]/page.tsx     # S-PT-06 Client Detail
│   ├── requests/page.tsx     # S-PT-11 Pending Requests
│   └── notifications/page.tsx# S-PT-12 Notification Center
├── my-trainer/page.tsx       # S-PT-10 My Trainer
└── routines/
    └── suggested/
        ├── page.tsx          # S-PT-08 Suggestion Inbox
        └── [id]/page.tsx     # S-PT-09 Suggestion Preview
```

### PT API Routes

```
src/app/api/
├── trainers/
│   ├── route.ts              # POST create, GET list
│   ├── me/route.ts           # GET own profile
│   └── [trainerId]/route.ts  # GET detail, PUT update
├── connections/
│   ├── route.ts              # POST subscribe, GET list
│   ├── active/route.ts       # GET user's active connection
│   └── [id]/
│       ├── respond/route.ts  # PATCH accept/decline
│       ├── end/route.ts      # PATCH end connection
│       └── privacy/route.ts  # PATCH shared data settings
├── clients/
│   ├── route.ts              # GET trainer's client list
│   └── [clientId]/
│       ├── progress/route.ts # GET aggregated stats
│       ├── workouts/route.ts # GET workout history
│       └── prs/route.ts      # GET personal records
├── suggestions/
│   ├── route.ts              # POST create, GET list
│   ├── pending/route.ts      # GET pending count
│   └── [id]/
│       └── respond/route.ts  # PATCH accept/decline
└── trainer-notifications/
    ├── route.ts              # GET list (+ countOnly mode)
    ├── read-all/route.ts     # POST mark all read
    └── [id]/
        └── read/route.ts     # PATCH mark single read
```

### Adding a New PT Feature

Follow this checklist when extending the PT Portal:

1. **Types** — Add interfaces to `src/types/index.ts` (after existing PT types)
2. **DB module** — Create `src/lib/db/newFeatureDb.ts` (import `couchFetch` from `trainerDb`)
3. **API routes** — Create in `src/app/api/` with standard auth pattern
4. **Middleware** — Add new trainer-only routes to `isTrainerRoute` or `isTrainerApiRoute` matcher
5. **Hooks** — Create `src/hooks/useNewFeature.ts` with TanStack Query
6. **Components** — Create in `src/components/trainer/`
7. **Pages** — Create in `src/app/(app)/trainer/` or relevant route group
8. **Notifications** — Add `void createTrainerNotification(...)` calls in relevant API routes

---

## Common Tasks

### Adding a New Screen

1. **Create route in `src/app/`:**
   ```
   src/app/new-feature/page.tsx
   ```

2. **Add to `BottomNav` if primary:**
   ```tsx
   const tabs = [
     { id: "home", icon: "house.fill", href: "/" },
     { id: "new", icon: "star.fill", href: "/new-feature" },
   ];
   ```

3. **Apply page transition variants:**
   ```tsx
   "use client";
   export default function NewFeaturePage() {
     return (
       <motion.div
         variants={pushVariants}
         initial="initial"
         animate="animate"
         exit="exit"
       >
         {/* Screen content */}
       </motion.div>
     );
   }
   ```

### Adding a New Global State

1. **Create store in `src/store/`:**
   ```typescript
   // useNewStore.ts
   import { create } from "zustand";
   import { persist } from "zustand/middleware";
   
   interface NewState {
     data: string;
     setData: (val: string) => void;
   }
   
   export const useNewStore = create<NewState>()(
     persist(
       (set) => ({
         data: "",
         setData: (val) => set({ data: val }),
       }),
       { name: "new-store" }
     )
   );
   ```

2. **Use in components:**
   ```tsx
   const { data, setData } = useNewStore();
   ```

### Adding a New Exercise Field

1. **Update `ExerciseRecord` type in `src/types/index.ts`:**
   ```typescript
   interface ExerciseRecord {
     // ... existing fields
     newField: string;  // Add here
   }
   ```

2. **Update exercise manifest script:**
   ```typescript
   // scripts/generate-exercise-manifest.ts
   // Script auto-picks up new fields
   ```

3. **Update custom exercise form:**
   ```tsx
   // components/exercise/CustomExerciseForm.tsx
   <input name="newField" />
   ```

4. **Update display components:**
   ```tsx
   // components/exercise/ExerciseCard.tsx
   <span>{exercise.newField}</span>
   ```

### Adding a New Zustand Action

```typescript
// src/store/useSessionStore.ts
export const useSessionStore = create<SessionState>((set, get) => ({
  // ... existing state
  
  // ✅ CORRECT: Action with get() for current state
  newAction: (param: string) => {
    const { currentPhase } = get();
    set({ 
      currentPhase: currentPhase === "warmUp" ? "workout" : "warmUp"
    });
  },
  
  // ✅ CORRECT: Async action
  saveRoutineAsync: async (routine: Routine) => {
    await routinesDb.put(routine);
    set({ lastSaved: Date.now() });
  },
}));
```

### Adding a New Variant

```typescript
// lib/motion/variants.ts
export const newVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.9 
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: springDefault,
  },
};
```

### Debugging Animation Issues

1. **Check `AnimatePresence` is present** if exit animations don't work
2. **Verify unique `key` prop** on animated elements
3. **Ensure `layoutId` is unique** across all rendered elements
4. **Use `transition` prop** to override default spring
5. **Check for conflicting CSS** — disable `transition`, `@keyframes` in component CSS

### Performance Optimization

```typescript
// ✅ CORRECT: Memoize expensive calculations
const estimatedTime = useMemo(
  () => estimateRoutineTime(routine),
  [routine]
);

// ✅ CORRECT: Debounce search
const debouncedSearch = useDebouncedValue(searchQuery, 250);

// ✅ CORRECT: Virtual list for 1000+ items
import { useVirtualizer } from "@tanstack/react-virtual";
```

### Testing Offline Behavior

1. Open DevTools → Application → Service Workers
2. Check "Offline"
3. Reload page — should work fully
4. Create routine → should save to PouchDB
5. Check Network tab — zero requests (all cached)

---

## Authentication (Clerk)

### Overview

Authentication is handled entirely by **Clerk** (`@clerk/nextjs`). There is no custom auth system, no PIN, no multi-account store. Clerk manages sign-up, sign-in, session tokens, and user identity.

**Key files:**

| File | Role |
|---|---|
| `src/middleware.ts` | Clerk route protection (public vs authenticated) |
| `src/app/layout.tsx` | `ClerkProvider` with dark theme config |
| `src/app/(auth)/sign-in/[[...sign-in]]/page.tsx` | Clerk `<SignIn />` component |
| `src/app/(auth)/sign-up/[[...sign-up]]/page.tsx` | Clerk `<SignUp />` component |

### Middleware (`src/middleware.ts`)

Clerk middleware protects all routes by default. Public routes (no auth required):

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/splash(.*)',
  '/onboarding(.*)',
  '/api/auth(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect();
  }
});
```

**Important:** The middleware file MUST live in `src/middleware.ts` (not project root) because FitForge uses the `src/` directory structure.

**Route protection:**
- `/api/couch/*` is NOT public — Clerk auth is required for the CouchDB proxy
- `/api/auth/*` IS public — the provision endpoint itself checks `auth()` internally

### ClerkProvider Appearance

Root layout wraps the app with `ClerkProvider` using dark theme + lime accent:

```typescript
<ClerkProvider
  appearance={{
    baseTheme: dark,
    variables: {
      colorPrimary: "#C5F74F",
      colorBackground: "#1A1A1A",
      colorText: "#FFFFFF",
      colorNeutral: "#FFFFFF",
      colorInputBackground: "#141414",
      colorInputText: "#FFFFFF",
      borderRadius: "0.75rem",
    },
    elements: {
      card: "bg-[#1A1A1A] text-white shadow-xl border border-white/10",
      headerTitle: "text-white",
      headerSubtitle: "text-gray-400",
      formFieldLabel: "text-gray-300",
      formFieldInput: "bg-[#141414] text-white border-white/10",
      formButtonPrimary: "bg-[#C5F74F] text-[#0B0B0B] hover:bg-[#d4ff6e]",
      footerActionLink: "text-[#C5F74F] hover:text-[#d4ff6e]",
      socialButtonsBlockButton: "bg-[#141414] text-white border-white/10",
    },
  }}
>
```

### Sign-In / Sign-Up Pages

Minimal wrappers around Clerk components:

```tsx
'use client';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage(): React.ReactElement {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0B0B] px-4">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/" />
    </div>
  );
}
```

### Using Clerk in Components

```tsx
// ✅ CORRECT: Get user info from Clerk hooks
import { useUser, useClerk } from '@clerk/nextjs';

const { user } = useUser();
const displayName = user?.fullName ?? user?.firstName ?? 'FitForge Athlete';

// ✅ CORRECT: Sign out via Clerk
const { signOut } = useClerk();
await signOut();

// ✅ CORRECT: Server-side auth check in API routes
import { auth } from '@clerk/nextjs/server';
const { userId } = await auth();

// ❌ WRONG: Don't use useAuthStore — it no longer exists
const { account } = useAuthStore(); // DELETED
```

### Environment Variables

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
COUCHDB_ADMIN_URL=https://admin:password@your-couchdb-host.com
```

**CRITICAL:** `COUCHDB_ADMIN_URL` contains admin credentials — it's server-side only (no `NEXT_PUBLIC_` prefix). Never expose to the browser.

---

## Cloud Sync (CouchDB Proxy)

### Architecture Overview

All CouchDB sync flows through a Next.js API proxy. **No CouchDB credentials ever reach the browser.**

```
Browser PouchDB ──> /api/couch/{dbName}/... ──> CouchDB (admin credentials)
     │                     │                            │
     │  Clerk session      │  auth() check              │  Authorization header
     │  cookie             │  DB name validation         │  via COUCHDB_ADMIN_URL
     └─ same-origin ───────┘  userId → DB prefix ───────┘
```

**Data flow:**
1. PouchDB in browser syncs to `/api/couch/{dbName}`
2. Next.js proxy authenticates via Clerk session cookie
3. Maps local DB name → per-user CouchDB DB: `{sanitizedUserId}_{dbName}`
4. Forwards request to CouchDB with admin Authorization header

### Key Files

| File | Role |
|---|---|
| `src/app/api/couch/route.ts` | Root endpoint — CouchDB welcome response for PouchDB connectivity check |
| `src/app/api/couch/[...path]/route.ts` | Catch-all proxy — forwards PouchDB requests to CouchDB |
| `src/app/api/auth/provision-couch/route.ts` | Creates per-user CouchDB databases on first login |
| `src/lib/db/couchSync.ts` | PouchDB sync engine — syncs to proxy URLs |
| `src/hooks/useSyncManager.ts` | Orchestrates sync lifecycle from AppLayout |
| `src/hooks/useProvisionCouch.ts` | Auto-provisions CouchDB DBs after Clerk sign-in |
| `src/store/useSyncConfigStore.ts` | Stores provisioning state (localStorage) |

### CouchDB Proxy (`/api/couch/[...path]`)

The proxy is a catch-all Next.js API route that:
1. Requires Clerk authentication (middleware enforces this)
2. Validates the DB name against an allowlist
3. Maps to per-user CouchDB database
4. Forwards with admin credentials from `COUCHDB_ADMIN_URL`

```typescript
const ALLOWED_DBS = new Set([
  'fitforge_custom_exercises',
  'fitforge_routines',
  'fitforge_workouts',
  'fitforge_profile',
]);

// URL mapping: /api/couch/fitforge_routines/doc123
//   → https://couchdb-host/{sanitizedUserId}_fitforge_routines/doc123
```

**Root endpoint (`/api/couch`):** PouchDB pings the remote root to verify connectivity. Returns a CouchDB-compatible welcome JSON `{ couchdb: "Welcome" }`.

### CouchDB Sync Engine (`couchSync.ts`)

Bidirectional live sync for four databases:

```typescript
export interface SyncConfig {
  onStatusChange: (status: SyncStatus) => void;
  onConflict: (conflict: RoutineConflict) => void;
}

// No credentials needed — proxy handles auth via Clerk cookies
export function startSync(config: SyncConfig): void;
export function stopSync(): void;
export function getSyncStatus(): SyncStatus;
```

**How it works:**
```typescript
// Proxy URL: /api/couch/{dbName}
function buildProxyUrl(dbName: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  return `${origin}/api/couch/${dbName}`;
}

// PouchDB remote uses custom fetch for Clerk cookie auth
const remote = new PouchDB(proxyUrl, {
  fetch: (url, opts) => fetch(url, { ...opts, credentials: 'same-origin' }),
});

// Live bidirectional sync with retry
const handle = local.sync(remote, { live: true, retry: true });
```

### Provisioning (`useProvisionCouch`)

Runs once after Clerk sign-in. Creates per-user CouchDB databases server-side.

```typescript
// Called from AppLayout → useProvisionCouch()
// 1. Check if syncConfig.clerkUserId === user.id → already provisioned
// 2. POST /api/auth/provision-couch → creates DBs
// 3. Store { clerkUserId, provisionedAt } in useSyncConfigStore
```

**The provision route creates databases named:** `{sanitizedUserId}_fitforge_routines`, etc.

### useSyncConfigStore

```typescript
// Replaces the old useAuthStore. Minimal — no credentials, no multi-account.
interface SyncConfigState {
  syncConfig: CouchSyncConfig | null;  // { clerkUserId, provisionedAt }
  setSyncConfig: (config: CouchSyncConfig) => void;
  clearSyncConfig: () => void;
}

// localStorage key: "fitforge-sync"
```

### useSyncManager

Orchestrates sync lifecycle in AppLayout:

```typescript
export function useSyncManager() {
  // Reads: useAuth().isSignedIn, useSyncConfigStore.syncConfig
  // When both are present → startSync()
  // On sign-out or offline → stopSync()
  // Returns: { syncStatus, conflicts, dismissConflict }
}
```

### CouchDB Database Namespacing

Each user's remote databases are prefixed with their sanitized Clerk userId:

```typescript
function sanitizeUserId(userId: string): string {
  return userId.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
}

// user_2abc123_fitforge_routines
// user_2abc123_fitforge_workouts
// user_2abc123_fitforge_profile
// user_2abc123_fitforge_custom_exercises
```

### Conflict Detection & Resolution

Conflicts in `fitforge_routines` are detected after sync and surfaced via `ConflictResolverSheet`:

```typescript
export async function resolveConflictKeepLocal(conflict: RoutineConflict): Promise<void>;
export async function resolveConflictKeepRemote(conflict: RoutineConflict): Promise<void>;
```

### Profile Page — Auth-Aware UI

Uses Clerk hooks for user info:

```tsx
const { user } = useUser();
const { signOut } = useClerk();

// Display name from Clerk
const displayName = user?.fullName ?? user?.firstName ?? 'FitForge Athlete';

// Avatar initials
const initials = getInitials(displayName);
```

### AppLayout — No Auth Guard

Auth is handled by Clerk middleware, NOT by AppLayout. AppLayout focuses on:
1. `useProvisionCouch()` — ensure CouchDB DBs exist
2. `useStartupSync()` — seed exercise library
3. `useSyncManager()` — start/stop CouchDB sync
4. Layout transitions and conflict resolver

```tsx
export function AppLayout({ children }: AppLayoutProps) {
  useProvisionCouch();
  useStartupSync();
  const { conflicts, dismissConflict } = useSyncManager();
  // ... layout rendering
}
```

### Deleted Files (from old auth system)

These files NO LONGER EXIST — do not reference them:
- `src/store/useAuthStore.ts` → replaced by `useSyncConfigStore.ts`
- `src/lib/auth/pin.ts` → Clerk handles auth, no PIN needed
- `src/app/(auth)/register/` → replaced by Clerk `<SignUp />`
- `src/app/(auth)/login/` → replaced by Clerk `<SignIn />`
- `src/app/(auth)/user-select/` → no multi-account profile picker
- `src/app/(auth)/splash/` → removed
- `src/lib/db/testCouchConnection.ts` → proxy handles connectivity
- `EditSyncSheet` component → removed (no user-facing CouchDB config)

---

## Anti-Patterns

### ❌ Don't Use `springBouncy` or `springSheet` — They Don't Exist

```tsx
// ❌ WRONG: These exports do NOT exist in lib/motion/springs.ts
transition={springBouncy}
transition={springSheet}

// ✅ CORRECT: Use the four actual presets
transition={springSnappy}      // fast, for button taps
transition={springDefault}     // standard UI, cards
transition={springGentle}      // sheets, large movements
transition={springCelebration} // playful, error shakes, celebrations
```

### ❌ Don't Use Old Auth Stores or Types

```tsx
// ❌ WRONG: These no longer exist
import { useAuthStore } from '@/store/useAuthStore'; // DELETED
const { account } = useAuthStore();                 // DELETED
const account: CloudAccount = { ... };              // Type DELETED

// ✅ CORRECT: Use Clerk hooks for auth
import { useUser, useAuth, useClerk } from '@clerk/nextjs';
const { user } = useUser();
const { isSignedIn } = useAuth();
const { signOut } = useClerk();

// ✅ CORRECT: Use useSyncConfigStore for sync state
import { useSyncConfigStore } from '@/store/useSyncConfigStore';
const syncConfig = useSyncConfigStore(s => s.syncConfig);
```

### ❌ Don't Expose CouchDB Credentials to the Browser

```typescript
// ❌ WRONG: CouchDB URL with credentials in the browser
const remote = new PouchDB('https://user:pass@couchdb.example.com/db');

// ✅ CORRECT: Sync through the proxy — credentials stay server-side
const remote = new PouchDB('/api/couch/fitforge_routines', {
  fetch: (url, opts) => fetch(url, { ...opts, credentials: 'same-origin' }),
});
```

### ❌ Don't Put middleware.ts in Project Root

```
// ❌ WRONG: Won't be detected by Next.js when using src/ directory
./middleware.ts

// ✅ CORRECT: Must be inside src/ when using src/ directory structure
./src/middleware.ts
```

### ❌ Don't Use Tailwind `pt-safe-top`

```tsx
// ❌ WRONG: pt-safe-top is not defined — has zero effect
<div className="pt-safe-top">

// ✅ CORRECT: Use inline style
<div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
```

### ❌ Don't Forget `overflow-y-auto` on tall auth pages

```tsx
// ❌ WRONG: Fixed container with no scroll → bottom button unreachable
<div className="fixed inset-0 flex flex-col">

// ✅ CORRECT: Always scrollable, safe-area-aware
<div
  className="fixed inset-0 flex flex-col overflow-y-auto"
  style={{
    paddingTop: 'env(safe-area-inset-top)',
    paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
  }}
>
```

### ❌ Don't Mix Animation Libraries

```tsx
// ❌ WRONG: CSS transition competes with Framer Motion
<motion.div 
  className="transition-all duration-300"  // Don't do this
  animate={{ opacity: 1 }}
/>

// ✅ CORRECT: Use Framer Motion only
<motion.div animate={{ opacity: 1 }} transition={springDefault} />
```

### ❌ Don't Block on Network

```tsx
// ❌ WRONG: Waiting for fetch before UI update
const res = await fetch("/api/save");
setIsSaved(true);

// ✅ CORRECT: Update PouchDB, sync in background
await db.put(doc);
setIsSaved(true);  // UI updates immediately
```

### ❌ Don't Use Pure White

```tsx
// ❌ WRONG: Pure white on OLED
<p className="text-white">Text</p>

// ✅ CORRECT: Off-white (#F5F5F5)
<p className="text-[var(--brand-text)]">Text</p>
```

### ❌ Don't Hardcode Colors

```tsx
// ❌ WRONG: Hardcoded hex
<div style={{ background: "#C5F74F" }}>

// ✅ CORRECT: CSS custom property
<div style={{ background: "var(--brand-lime)" }}>
```

### ❌ Don't Skip Phase Arrays

```tsx
// ❌ WRONG: Omitting phases
const routine = {
  workout: [...],
  // Missing warmUp and stretch!
};

// ✅ CORRECT: All three always present
const routine = {
  warmUp: [],
  workout: [...],
  stretch: [],
};
```

### ❌ Don't Import `couchFetch` in Client Components

```typescript
// ❌ WRONG: couchFetch uses server-only env vars + Node Buffer
'use client';
import { couchFetch } from '@/lib/db/trainerDb';  // Will crash in browser

// ✅ CORRECT: Use fetch to call API routes from client
const res = await fetch('/api/trainers');
```

### ❌ Don't `await` Fire-and-Forget Notifications

```typescript
// ❌ WRONG: Blocks API response on notification creation
await createTrainerNotification({ trainerId, ... });
return Response.json({ success: true, data });

// ✅ CORRECT: Use void prefix — non-blocking
void createTrainerNotification({ trainerId, ... });
return Response.json({ success: true, data });
```

### ❌ Don't Use PouchDB for Cross-User PT Data

```typescript
// ❌ WRONG: PouchDB is per-user, can't query across users
const connections = await connectionsDb.allDocs({ include_docs: true });

// ✅ CORRECT: Use server-authoritative CouchDB via couchFetch
const res = await couchFetch(`/${DB_NAME}/_find`, {
  method: 'POST',
  body: JSON.stringify({ selector: { trainerId } }),
});
```

### ❌ Don't Forget to Update Middleware for New Trainer Routes

```typescript
// ❌ WRONG: New trainer API accessible to non-trainers
// (forgot to add to isTrainerRoute matcher)
// src/app/api/trainer-schedule/route.ts ← unprotected!

// ✅ CORRECT: Add to middleware matcher
const isTrainerRoute = createRouteMatcher([
  '/trainer(.*)',
  '/api/clients(.*)',
  '/api/trainer-notifications(.*)',
  '/api/trainer-schedule(.*)',        // ← Add new routes here
]);
```

### ❌ Don't Create Shared DBs with Per-User Prefix

```typescript
// ❌ WRONG: PT data is shared, not per-user
const DB_NAME = `${sanitizeUserId(userId)}_fitforge_connections`;

// ✅ CORRECT: Shared database, no user prefix
const DB_NAME = 'fitforge_connections';
```

---

## Quick Reference

### File Paths

```
src/
├── app/
│   ├── (app)/                # Protected routes (Clerk middleware)
│   │   ├── trainer/          # PT dashboard, clients, requests, notifications
│   │   ├── trainers/         # PT directory + detail
│   │   ├── my-trainer/       # User's active trainer view
│   │   └── routines/suggested/ # Suggested routine inbox
│   ├── (auth)/               # Sign-in, sign-up (Clerk components)
│   ├── api/
│   │   ├── auth/provision-couch/  # CouchDB DB provisioning
│   │   ├── couch/                 # CouchDB proxy (root + catch-all)
│   │   ├── trainers/              # PT profile CRUD
│   │   ├── connections/           # PT-client subscription management
│   │   ├── clients/               # Trainer's client list + progress
│   │   ├── suggestions/           # Routine suggestion CRUD
│   │   └── trainer-notifications/ # Notification list + mark read
│   └── layout.tsx            # ClerkProvider + dark theme
├── components/
│   ├── ui/                   # Design system primitives
│   ├── workout/              # Workout execution
│   ├── routine/              # Routine builder
│   ├── exercise/             # Exercise browser
│   ├── trainer/              # PT Portal components (16 files)
│   ├── sync/                 # ConflictResolverSheet
│   └── layout/               # Shell (AppLayout, BottomNav)
├── store/
│   ├── useSyncConfigStore.ts # CouchDB sync config (Clerk, no credentials)
│   ├── useSessionStore.ts    # Workout execution
│   ├── useProfileStore.ts    # User data, XP, PRs
│   ├── useSettingsStore.ts   # Preferences
│   └── useSheetStore.ts      # Bottom sheet open/close
├── hooks/
│   ├── useProvisionCouch.ts  # Auto-provision CouchDB DBs after Clerk sign-in
│   ├── useSyncManager.ts     # Orchestrates PouchDB↔CouchDB sync lifecycle
│   ├── useStartupSync.ts     # Seeds exercise library on first mount
│   ├── useTrainers.ts        # PT directory + profile hooks
│   ├── useConnections.ts     # Connection management hooks
│   ├── useClients.ts         # Trainer's client list hook
│   ├── useSuggestions.ts     # Routine suggestion hooks
│   ├── useClientProgress.ts  # Client progress/workouts/PRs hooks
│   └── useTrainerNotifications.ts # Notification hooks
├── lib/
│   ├── db/couchSync.ts       # PouchDB sync engine (proxy-based)
│   ├── db/trainerDb.ts       # couchFetch() + trainer CRUD (server-only)
│   ├── db/connectionDb.ts    # Connection CRUD (server-only)
│   ├── db/suggestionDb.ts    # Suggestion CRUD (server-only)
│   ├── db/notificationDb.ts  # Notification CRUD + fire-and-forget (server-only)
│   ├── calculations/         # Calorie, time, progression
│   ├── motion/               # Springs, variants
│   └── utils/                # General helpers
├── middleware.ts             # Clerk route protection + trainer role guard
└── types/                    # TypeScript interfaces (includes PT types)

data/exercises/               # Seeded JSON (prebuild input)
public/
├── data/
│   ├── exercises/            # Copied from data/ (SW cached)
│   ├── gifs/                 # Full-quality GIFs (gitignored)
│   └── previews/             # WebP thumbnails (gitignored)
└── images/athletes/          # Category hero photos
```

### Key Commands

```bash
# Development
npm run dev

# Build (runs prebuild → generate manifest)
npm run build

# Generate exercise manifest
npm run prebuild

# Convert GIFs to WebP previews (run once)
npm run setup:previews
```

### Design Tokens

```css
Primary:    var(--brand-lime)        #C5F74F
Background: var(--brand-bg)          #0B0B0B
Text:       var(--brand-text)        #F5F5F5
Surface:    var(--brand-surface)     #141414
```

### Spring Presets

```typescript
springSnappy      // Button taps, checkmarks, fast state changes
springDefault     // General UI, cards, push/pop navigation
springGentle      // Sheets, large entrances, slow movements
springCelebration // Phase transitions, error shakes, celebrations
```

**`springBouncy` and `springSheet` do NOT exist — do not use them.**

### Core Stores

```typescript
useSyncConfigStore // CouchDB sync config (Clerk userId, provision state)
useSessionStore    // Workout execution
useProfileStore    // User data, XP, PRs
useSettingsStore   // Preferences
useSheetStore      // Bottom sheet open/close
```

**Deleted stores:** `useAuthStore` no longer exists — Clerk handles auth.

### PT Portal Databases

```typescript
fitforge_trainers              // Trainer profiles (shared)
fitforge_connections           // PT-client subscriptions (shared)
fitforge_suggestions           // Routine recommendations (shared)
fitforge_trainer_notifications // Trainer alerts (shared)
```

**Unlike sync databases, these are NOT per-user prefixed.** They use server-side `couchFetch()` with admin credentials, not PouchDB replication.

---

## Resources

- **Full Architecture:** `docs/02-architecture.md`
- **Design System:** `docs/03-design-system.md`
- **Business Logic:** `docs/04-business-logic.md`
- **Implementation Plan:** `docs/05-implementation-plan.md`
- **UI/UX Screens:** `docs/06-ui-ux-screens.md`
- **Personal Trainer Portal:** `docs/08-personal-trainer-portal.md`

---

**Last Updated:** March 2026 (PT Portal Phases 1-4 Complete)  
**Skill Version:** 4.0
