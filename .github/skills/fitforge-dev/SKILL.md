---
name: fitforge-dev
description: "Development guide for FitForge PWA — iOS 26 Liquid Glass fitness app. USE FOR: adding features, fixing bugs, refactoring components, implementing new screens, workout logic, routine builder, exercise browser, animation work, database queries, cloud sync / CouchDB auth. CONTAINS: architecture patterns (local-first PouchDB, three-phase workout model), design system (Liquid Glass materials, brand tokens, Framer Motion springs), component conventions, business logic (calorie/time calculations), TypeScript patterns, Zustand state management, Phase 7 cloud sync (CloudAccount, useAuthStore, SyncConfig, testCouchDbConnection, EditSyncSheet). DO NOT USE FOR: general React questions, unrelated projects, or tasks outside FitForge codebase."
---

# FitForge PWA Development Guide

> **FitForge** is a Next.js 15 PWA for fitness tracking with local-first offline capability, iOS 26 Liquid Glass design language, and a three-phase workout model (warm-up → workout → stretch).

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
9. [Phase 7 — Cloud Sync (CouchDB)](#phase-7--cloud-sync-couchdb)
10. [Common Tasks](#common-tasks)
11. [Anti-Patterns](#anti-patterns)

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

## Phase 7 — Cloud Sync (CouchDB)

### CloudAccount Type

App identity and CouchDB credentials are **completely separate concerns**. Never use email/username as both.

```typescript
// src/types/index.ts  (v2 — multi-account)
export interface CloudAccount {
  /** Stable device identity. crypto.randomUUID() at registration. NEVER changes.
   *  Used as PBKDF2 salt for PIN hashing. Partitions this user's remote databases. */
  userId: string;
  /** App-level identity — displayed in UI. NOT used for CouchDB auth. */
  displayName: string;
  /** Optional app email — shown in UI only. Never used for CouchDB auth. */
  email?: string;
  /** CouchDB username — the actual database auth credential. */
  couchUsername: string;
  /** Full CouchDB URL with embedded Basic-Auth. NEVER display raw. */
  couchDbUrl: string;   // format: https://user:pass@host/db
  createdAt: string;
  /** PBKDF2-SHA-256 hash of user's 4-6 digit PIN. Stored on-device only. Never synced. */
  appPinHash?: string;
}
```

**Key rules:**
- `userId` is the partition/identity key — never re-use it from another account, never mutate it
- `displayName` is for display only — two family members can have the same display name
- `@couchUsername · serverHost` is the guaranteed-unique identifier (CouchDB enforces username uniqueness per server)
- `appPinHash` is device-local only — not synced to CouchDB, not sent over network

### useAuthStore

```typescript
// src/store/useAuthStore.ts — v2 (multi-account)
// localStorage key: 'fitforge-auth'  |  Zustand persist version: 2
// Auto-migrates from v1 (single account field) → v2 (accounts array)

interface AuthState {
  // Persisted
  accounts: CloudAccount[];
  activeUserId: string | null;

  // Derived (not stored directly)
  account: CloudAccount | null;    // accounts.find(a => a.userId === activeUserId)
  isAuthenticated: boolean;        // account !== null

  // Session-only — excluded from partialize (not written to localStorage)
  justLoggedIn: boolean;           // true immediately after login/register → drives /restore page

  // Actions
  login: (account: CloudAccount) => void;          // upserts account, sets activeUserId + justLoggedIn=true
  logout: () => void;                              // clears activeUserId; keeps accounts[] intact
  setActiveUser: (userId: string) => void;         // call AFTER PIN is verified externally on /user-select
  removeAccount: (userId: string) => void;
  updateDisplayName: (name: string) => void;
  updateCouchCredentials: (couchUsername: string, couchDbUrl: string) => void;
  updatePinHash: (hash: string) => void;           // called after PIN is set or changed
  clearJustLoggedIn: () => void;                   // called before navigating away from /restore
}
```

**Usage in components:**
```tsx
// ✅ CORRECT: Select only what you need — avoid re-renders
const { account, isAuthenticated } = useAuthStore(
  s => ({ account: s.account, isAuthenticated: s.isAuthenticated }),
  shallow
);

// Display name (not couchUsername — it's the CouchDB credential)
const name = account?.displayName ?? 'FitForge Athlete';

// CouchDB info shown in settings only — always mask the URL
const couchInfo = `@${account?.couchUsername} · ${maskServerUrl(account?.couchDbUrl ?? '')}`;

// Check all accounts (e.g. for profile switcher badge)
const allAccounts = useAuthStore(s => s.accounts);
```

**v1 → v2 migration** runs automatically on first open after upgrade:
```typescript
migrate: (persistedState, version) => {
  if (version === 1) {
    const old = persistedState as { account?: CloudAccount };
    const accounts = old.account
      ? [{ ...old.account, userId: old.account.userId ?? crypto.randomUUID() }]
      : [];
    return { accounts, activeUserId: accounts[0]?.userId ?? null };
  }
  return persistedState;
},
```

### Building the couchDbUrl

CouchDB Basic Auth is embedded in the URL (standard CouchDB convention):

```typescript
// ✅ CORRECT: Build from parts using encodeURIComponent
const urlObj = new URL(serverUrl.trim().replace(/\/$/, ''));
const couchDbUrl = `${urlObj.protocol}//${encodeURIComponent(couchUsername)}:${encodeURIComponent(couchPassword)}@${urlObj.host}${urlObj.pathname}`;

// ✅ CORRECT: Extract parts for re-use (e.g. connection test)
const u = new URL(account.couchDbUrl);
const username = decodeURIComponent(u.username);
const password = decodeURIComponent(u.password);
const baseUrl  = `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`;

// ✅ CORRECT: Safe display (strip credentials)
function maskServerUrl(couchDbUrl: string): string {
  try {
    const u = new URL(couchDbUrl);
    return `${u.protocol}//${u.host}${u.pathname === '/' ? '' : u.pathname}`;
  } catch {
    return couchDbUrl;
  }
}
```

### Testing CouchDB Connection

Use `src/lib/db/testCouchConnection.ts` — always test before saving credentials.

```typescript
import { testCouchDbConnection, type ConnectionResult } from '@/lib/db/testCouchConnection';

// Returns:
// { ok: true;  username: string; serverVersion: string }
// { ok: false; reason: string }

const result = await testCouchDbConnection(serverBaseUrl, couchUsername, couchPassword);
```

**Test state machine pattern (used on login, register, and EditSyncSheet):**
```tsx
type TestState = 'idle' | 'testing' | 'ok' | 'fail';
const [testState, setTestState]   = useState<TestState>('idle');
const [testResult, setTestResult] = useState<ConnectionResult | null>(null);

const handleTestConnection = async () => {
  setTestState('testing');
  setTestResult(null);
  const result = await testCouchDbConnection(url, username, password);
  setTestResult(result);
  setTestState(result.ok ? 'ok' : 'fail');
};

// Gate the primary CTA when using own server:
const isValid = couchUsername.trim().length > 0 &&
                couchPassword.length >= 1 &&
                resolvedUrl.trim().length > 0 &&
                (!useOwnServer || testState === 'ok');
```

**Test button color states:**
```tsx
style={{
  background:
    testState === 'ok'   ? 'rgba(48,209,88,0.15)'  :
    testState === 'fail' ? 'rgba(255,69,58,0.12)'  :
    'rgba(255,255,255,0.08)',
  color:
    testState === 'ok'   ? '#30D158' :
    testState === 'fail' ? '#FF453A' :
    'rgba(245,245,245,0.70)',
}}
```

### Managed vs Self-Hosted Server Toggle

```typescript
// Read from env at module level (not inside component)
const MANAGED_SERVER    = process.env.NEXT_PUBLIC_COUCHDB_URL ?? '';
const HAS_MANAGED_SERVER = MANAGED_SERVER.length > 0;

// In component:
const [useOwnServer, setUseOwnServer] = useState(!HAS_MANAGED_SERVER);
const resolvedUrl = useOwnServer ? customUrl : MANAGED_SERVER;

// For managed server: test is optional (server is trusted)
// For own server:     test must pass before CTA is enabled
const isValid = ... && (!useOwnServer || testState === 'ok');
```

### Auth Pages Form Structure

Login and Register pages have two visually separated sections:

```tsx
// 1. App identity (display name, optional email — just for the app UI)
<SectionDivider label="Your Profile" />
<FormField label="Display Name" ... />       // stored as account.displayName
<FormField label="Email (optional)" ... />   // stored as account.email

// 2. CouchDB credentials (used for actual DB auth)
<SectionDivider label="CouchDB Access" />
<FormField label="CouchDB Username" ... />   // stored as account.couchUsername
<FormField label="CouchDB Password" ... />   // embedded in account.couchDbUrl

// 3. Server selection
<SectionDivider label="Server" />
{HAS_MANAGED_SERVER && <ServerToggle ... />}
<AnimatePresence>{useOwnServer && <CustomUrlField + TestButton />}</AnimatePresence>
```

**`SectionDivider` component pattern:**
```tsx
function SectionDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
      <span className="text-[11px] font-semibold uppercase tracking-[0.08em]"
            style={{ color: 'rgba(245,245,245,0.30)' }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
    </div>
  );
}
```

### Sync Pipeline

```
useAuthStore (account) → useSyncManager (useEffect) → startSync(SyncConfig) → couchSync.ts
```

```typescript
// src/lib/db/couchSync.ts
export interface SyncConfig {
  couchDbUrl: string;       // Full URL with embedded credentials
  couchUsername: string;    // For DB namespacing (NOT display — not logged)
  onStatusChange: (status: SyncStatus) => void;
  onConflict: (conflict: RoutineConflict) => void;
}
```

```typescript
// src/hooks/useSyncManager.ts — auto-starts/stops based on auth state
startSync({
  couchDbUrl: account.couchDbUrl,
  couchUsername: account.couchUsername,  // NOT account.email or account.userId
  onStatusChange: setSyncStatus,
  onConflict: handleConflict,
});
```

### CouchDB Database Namespacing

Each user's remote databases are prefixed with their sanitized CouchDB username so family members on the same CouchDB server never overwrite each other's data:

```typescript
// src/lib/db/couchSync.ts — internal helper
function buildRemoteUrl(baseUrl: string, dbName: string, couchUsername: string): string {
  // Strip characters not allowed in CouchDB database names
  const safePrefix = couchUsername.toLowerCase().replace(/[^a-z0-9_$()+-]/g, '_');
  return `${baseUrl.replace(/\/$/, '')}/${safePrefix}_${dbName}`;
}

// alice's databases: alice_fitforge_routines, alice_fitforge_workouts, alice_fitforge_profile
// bob's databases:   bob_fitforge_routines,   bob_fitforge_workouts,   bob_fitforge_profile
```

**CouchDB admin setup required:** Each `{username}_{dbName}` database must exist on the server and the CouchDB user must have read/write access (set via `_security` document). See `docs/02-architecture.md` for the setup guide.

### Profile Page — Auth-Aware UI

When `isAuthenticated`:
- Avatar shows `getInitials(account)` derived from `account.displayName`
- Subtitle shows `account.email ?? '@' + account.couchUsername`
- Cloud Sync section shows masked server URL + "Edit Sync Settings" row
- `EditSyncSheet` lets user: edit display name, re-test connection, change credentials (→ /login), sign out

```typescript
// Initials from displayName (not email)
function getInitials(account: CloudAccount): string {
  const parts = account.displayName.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return account.displayName.slice(0, 2).toUpperCase();
}
```

### Worker tsconfig Pitfall

If `src/worker/tsconfig.json` has `"extends": "../../tsconfig.json"` and the root excludes `"src/worker"`, the worker tsconfig inherits that exclusion and TypeScript finds no inputs.

**Fix:** Override `exclude` in the worker tsconfig to break inheritance:
```json
{
  "extends": "../../tsconfig.json",
  "exclude": ["../../node_modules"]
}
```

Verify with: `npx tsc --project src/worker/tsconfig.json --noEmit`

---

## Phase 8 — Multi-Account Auth, PIN & Privacy

### Overview

Multiple family members can share one device (or one CouchDB server), each with fully isolated data and an optional PIN to lock their profile. Key files:

| File | Role |
|---|---|
| `src/types/index.ts` | `CloudAccount` v2 interface |
| `src/store/useAuthStore.ts` | Multi-account Zustand store (v2) |
| `src/lib/auth/pin.ts` | PBKDF2-SHA-256 PIN hashing |
| `src/lib/db/couchSync.ts` | `buildRemoteUrl` — per-user DB namespacing |
| `src/app/(auth)/user-select/page.tsx` | "Who's working out?" profile picker |
| `src/app/(app)/restore/page.tsx` | Cross-device data restore after login |
| `src/components/layout/AppLayout.tsx` | Auth guard with hydration protection |

### PIN System (`src/lib/auth/pin.ts`)

Web Crypto API — PBKDF2-SHA-256, 100 000 iterations. PIN **never** leaves the device.

```typescript
export async function hashPin(pin: string, userId: string): Promise<string>
export async function verifyPin(pin: string, userId: string, storedHash: string): Promise<boolean>
// salt = userId (stable UUID) — same PIN produces a different hash for each user
```

**Usage flow:**
```tsx
// Setting a PIN during register / first launch:
const hash = await hashPin(pin, newUserId);
store.updatePinHash(hash);

// Verifying on user-select page:
const ok = await verifyPin(enteredPin, selectedAccount.userId, selectedAccount.appPinHash!);
if (ok) {
  store.setActiveUser(selectedAccount.userId);
  router.push('/');
} else {
  // shake with springCelebration, clear input
}
```

### User-Select Screen (`/user-select`)

Shown whenever `accounts.length > 0 && !isAuthenticated`. On mount: if `accounts.length === 0` redirect immediately to `/register`.

**Account card disambiguation:**
```tsx
// ✅ CORRECT: Always show @couchUsername · host — guaranteed unique by CouchDB
function AccountSubtitle({ account }: { account: CloudAccount }) {
  return <span>@{account.couchUsername} · {maskServerUrl(account.couchDbUrl)}</span>;
}

// ❌ WRONG: email may be missing, empty, or shared between family members
<span>{account.email}</span>
```

**PIN flow:**
```tsx
// Lock icon appears when account.appPinHash is set
// Tap card → inline 6-dot PIN pad opens
// On submit → verifyPin() → success: setActiveUser + navigate
//                          → fail: springCelebration shake, clear input
```

**Add Account button:** Routes to `/register` — lets a new family member add their profile on the same device.

### Restore Screen (`/restore`)

Shown right after login or register on a new device. Lives in the `(app)` route group so `AppLayout` has already started `useSyncManager`.

```tsx
// Route: src/app/(app)/restore/page.tsx

// Guard: redirect to '/' immediately if justLoggedIn flag is false
// (prevents users navigating here manually mid-session)
const { justLoggedIn, clearJustLoggedIn } = useAuthStore(s => ({...}), shallow);
useEffect(() => {
  if (!justLoggedIn) router.replace('/');
}, [justLoggedIn]);

// Subscribes to sync status
const { syncStatus } = useSyncManager();

// Auto-navigate when synced:
useEffect(() => {
  if (syncStatus.state === 'synced') {
    clearJustLoggedIn();
    setTimeout(() => router.replace('/'), 900);
  }
}, [syncStatus.state]);

// 45s timeout: show "Continue anyway" button
// 5s: fade in "Skip for now" button
```

**After login or register, always redirect to `/restore`:**
```tsx
router.push('/restore');  // not '/profile', not '/'
```

**BottomNav exclusion:** `/restore` is in the hidden routes list — no tab bar during restore:
```typescript
pathname.startsWith('/restore')
```

### Auth Guard in AppLayout

Protects all `(app)` routes. Hydration guard prevents flash of wrong content because Zustand reads localStorage asynchronously.

```tsx
// src/components/layout/AppLayout.tsx
const [hydrated, setHydrated] = useState(false);
useEffect(() => { setHydrated(true); }, []);

const { accounts, isAuthenticated } = useAuthStore(
  s => ({ accounts: s.accounts, isAuthenticated: s.isAuthenticated }),
  shallow
);

useEffect(() => {
  if (!hydrated) return;
  if (accounts.length === 0) router.replace('/register');
  else if (!isAuthenticated) router.replace('/user-select');
}, [hydrated, accounts.length, isAuthenticated, router]);

// Blank screen until both hydrated AND authenticated — zero content flash
if (!hydrated || !isAuthenticated) {
  return <div className="min-h-screen bg-[#0B0B0B]" />;
}
```

### Duplicate Account Detection

Both Login and Register detect an existing account by **CouchDB identity** — `(couchUsername + server host)`. This is the only truly unique identifier; `displayName` and `email` can collide.

```typescript
// Matching logic used in both login.tsx and register.tsx
const parsedNew = new URL(couchDbUrl);
const existing = accounts.find(a => {
  try {
    const u = new URL(a.couchDbUrl);
    return decodeURIComponent(u.username) === couchUsername
        && u.host === parsedNew.host;
  } catch { return false; }
});

// Login:    if found → reuse existing.userId (preserves PIN hash + createdAt)
// Register: if found → hard-block with error ("@alice on host already added as 'Alice Smith'")
```

**Always use `decodeURIComponent` when reading `.username` or `.password` from a URL object** — credentials are percent-encoded in the stored URL.

### Shared-Password Privacy Check

A shared CouchDB password means anyone on the same server can query all namespaced databases via the HTTP API, bypassing the device PIN entirely.

```typescript
// Helper — extract decoded password from a stored couchDbUrl
function extractPassword(url: string): string {
  try { return decodeURIComponent(new URL(url).password); }
  catch { return ''; }
}

// Helper — are two couchDbUrls on the same CouchDB host?
function sameHost(a: string, b: string): boolean {
  try { return new URL(a).host === new URL(b).host; }
  catch { return false; }
}

// Check: does the entered password match any existing account on the same server?
const passwordCollision = accounts.some(
  a => sameHost(a.couchDbUrl, resolvedUrl) && extractPassword(a.couchDbUrl) === couchPassword
);
```

| Page | Behavior on collision |
|---|---|
| Register | **Hard-block** — cannot proceed. Error explains the security risk. |
| Login | **Soft amber warning** — non-blocking (may be a legitimate credential update). |

### Profile Page — Multi-Account Actions

The Cloud Sync section exposes three actions after Phase 8:

```
1. Edit Sync Settings   → opens EditSyncSheet
2. Switch Profile       → logout() + router.push('/user-select')
                          badge shows accounts.length when > 1
3. Add Account          → router.push('/register')
```

Profile subtitle shows `email ?? '@' + couchUsername` (never just `email` — it may be absent):
```tsx
const subtitle = account?.email ?? `@${account?.couchUsername}`;
```

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

### ❌ Don't Use Email to Disambiguate Accounts

```tsx
// ❌ WRONG: email may be missing or identical between family members
<span>{account.email}</span>

// ✅ CORRECT: @couchUsername · host is always unique (CouchDB enforces it)
<span>@{account.couchUsername} · {maskServerUrl(account.couchDbUrl)}</span>
```

### ❌ Don't Forget `decodeURIComponent` on URL Credentials

```typescript
// ❌ WRONG: u.username and u.password are percent-encoded
const username = new URL(account.couchDbUrl).username;  // "alice%40example.com" ← wrong

// ✅ CORRECT: Always decode before comparing or displaying
const username = decodeURIComponent(new URL(account.couchDbUrl).username);
const password = decodeURIComponent(new URL(account.couchDbUrl).password);
```

### ❌ Don't Navigate to `/restore` Without Setting `justLoggedIn`

```tsx
// ❌ WRONG: The restore page guards on justLoggedIn — navigating directly will bounce back to '/'
router.push('/restore');  // without calling login() first

// ✅ CORRECT: login() / register flow sets justLoggedIn=true before pushing
store.login(account);     // sets justLoggedIn internally
router.push('/restore');
```

### ❌ Don't Use Email as CouchDB Username

```typescript
// ❌ WRONG: Email is app identity, not a CouchDB credential
const account: CloudAccount = {
  userId: email,          // Field no longer exists
  email: email,
  couchDbUrl: `...${email}:${password}@...`,   // Wrong — email ≠ couchUsername
};

// ✅ CORRECT: Separate the two
const account: CloudAccount = {
  displayName: displayName || couchUsername,
  email: email || undefined,       // Optional, UI only
  couchUsername,                   // The actual DB user
  couchDbUrl: `...${encodeURIComponent(couchUsername)}:${encodeURIComponent(couchPassword)}@...`,
};
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

### ❌ Don't Display Raw couchDbUrl

```tsx
// ❌ WRONG: Exposes embedded username:password in URL
<span>{account.couchDbUrl}</span>

// ✅ CORRECT: Always mask
<span>{maskServerUrl(account.couchDbUrl)}</span>
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

---

## Quick Reference

### File Paths

```
src/
├── app/                      # Routes (App Router)
├── components/
│   ├── ui/                   # Design system primitives
│   ├── workout/              # Workout execution
│   ├── routine/              # Routine builder
│   ├── exercise/             # Exercise browser
│   └── layout/               # Shell (AppLayout, BottomNav)
├── store/                    # Zustand stores
├── lib/
│   ├── db/                   # PouchDB utilities
│   ├── calculations/         # Calorie, time, progression
│   ├── motion/               # Springs, variants
│   └── utils/                # General helpers
├── hooks/                    # Custom React hooks
└── types/                    # TypeScript interfaces

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
useAuthStore      // Multi-account auth (v2), active user, justLoggedIn
useSessionStore   // Workout execution
useProfileStore   // User data, XP, PRs
useSettingsStore  // Preferences
useSheetStore     // Bottom sheet open/close
```

---

## Resources

- **Full Architecture:** `docs/02-architecture.md`
- **Design System:** `docs/03-design-system.md`
- **Business Logic:** `docs/04-business-logic.md`
- **Implementation Plan:** `docs/05-implementation-plan.md`
- **UI/UX Screens:** `docs/06-ui-ux-screens.md`

---

**Last Updated:** July 2025 (Phase 8 — Multi-Account Auth, PIN & Privacy)  
**Skill Version:** 2.0
