---
name: fitforge-dev
description: "Development guide for FitForge PWA — iOS 26 Liquid Glass fitness app. USE FOR: adding features, fixing bugs, refactoring components, implementing new screens, workout logic, routine builder, exercise browser, animation work, database queries. CONTAINS: architecture patterns (local-first PouchDB, three-phase workout model), design system (Liquid Glass materials, brand tokens, Framer Motion springs), component conventions, business logic (calorie/time calculations), TypeScript patterns, Zustand state management. DO NOT USE FOR: general React questions, unrelated projects, or tasks outside FitForge codebase."
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
9. [Common Tasks](#common-tasks)

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

Always apply iOS safe area insets:

```css
/* Bottom nav */
padding-bottom: calc(8px + env(safe-area-inset-bottom));

/* Top bar */
padding-top: calc(16px + env(safe-area-inset-top));

/* Full-screen overlays */
inset: env(safe-area-inset-top) 0 env(safe-area-inset-bottom) 0;
```

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

Six calibrated spring presets in `lib/motion/springs.ts`:

```typescript
export const springSnappy = { type: "spring", stiffness: 400, damping: 30 };
export const springDefault = { type: "spring", stiffness: 300, damping: 28 };
export const springGentle = { type: "spring", stiffness: 200, damping: 24 };
export const springBouncy = { type: "spring", stiffness: 350, damping: 18 };
export const springCelebration = { type: "spring", stiffness: 500, damping: 20 };
export const springSheet = { type: "spring", stiffness: 380, damping: 32 };
```

**Usage:**
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={springGentle}
>
```

### Reusable Variants

Defined in `lib/motion/variants.ts`:

```typescript
// Page transitions (left/right swipe)
pushVariants = {
  initial: { x: "100%", opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: "-40%", opacity: 0 },
};

// Bottom sheets
sheetVariants = {
  hidden: { y: "100%" },
  visible: { y: 0 },
};

// iOS 26 scale-behind when sheet opens
sheetBackgroundVariants = {
  closed: { scale: 1, filter: "brightness(1)" },
  open: { scale: 0.92, filter: "brightness(0.6)" },
};

// Tab indicator pill
tabVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
};
```

**Usage:**
```tsx
<motion.div
  variants={sheetVariants}
  initial="hidden"
  animate="visible"
  transition={springSheet}
>
  {/* Bottom sheet content */}
</motion.div>
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

## Anti-Patterns

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
springSnappy      // Button press, quick interactions
springDefault     // General UI, cards
springGentle      // Large movements, sheets
springBouncy      // Playful UI (badges, counters)
springCelebration // Completion animations
springSheet       // Bottom sheets specifically
```

### Core Stores

```typescript
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

**Last Updated:** March 23, 2026  
**Skill Version:** 1.0
