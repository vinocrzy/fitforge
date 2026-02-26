# FitForge — Development Progress

> Auto-tracked progress for the FitForge fitness PWA.
> See `docs/05-implementation-plan.md` for the full 7-phase plan.

---

## Phase 1 — Foundation & PWA Shell

**Status:** ✅ Complete  
**Duration target:** ~2 weeks

### Tasks

- [x] Initialize Next.js 16 project with TypeScript, Tailwind CSS 4, App Router (`src/` directory)
- [x] Configure `@ducanh2912/next-pwa`, `manifest.ts`, mobile viewport meta tags
- [ ] Add PWA icons (192×192, 512×512) — *placeholder; need final assets*

**Static media setup**
- [x] Copy exercise data to `data/exercises/` and `public/data/exercises/`
- [x] Build `lib/media/athletePhotos.ts` — picsum.photos dev seeds for 8 categories
- [ ] Copy GIFs to `public/data/gifs/` — *deferred until assets available*
- [ ] Run `scripts/convert-gifs.sh` for WebP previews — *deferred until GIFs available*
- [x] Create `public/images/athletes/` directory

**Icon system**
- [x] Install `@phosphor-icons/react` v2
- [x] Build `components/ui/Icon.tsx` — SF Symbol → Phosphor mapping (28 icons)

**Database layer**
- [x] Install & configure PouchDB + pouchdb-find
- [x] Create 5 DB instances (`fitforge_exercises`, `fitforge_custom_exercises`, `fitforge_routines`, `fitforge_workouts`, `fitforge_profile`)
- [x] Build `syncExerciseLibrary()` — versioned delta sync with manifest comparison
- [x] Build `scripts/generate-exercise-manifest.ts` — SHA-1 hash manifest generator
- [x] Register `prebuild` script in `package.json`

**Workbox caching**
- [x] Configure runtime caching in `next.config.ts` — `exercise-gifs` (CacheFirst, 150), `exercise-previews` (CacheFirst, 250), `api-cache` (NetworkFirst)

**Components**
- [x] `<ExerciseGif />` — progressive loading, skeleton shimmer, WebP/GIF toggle
- [x] `<PrimaryButton />` — lime pill CTA with Framer Motion
- [x] `prefetchRoutineGifs()` — Cache Storage prefetch utility

**Layout shell**
- [x] `<AppLayout />` — AnimatePresence + push/pop variants + sheet scale-behind
- [x] `<BottomNav />` — iOS 26 floating pill tab bar, 4 tabs, layoutId indicator
- [x] `<TopBar />` — Liquid Glass nav bar with back button + right actions

**Zustand stores**
- [x] `useSessionStore` — workout session state machine
- [x] `useProfileStore` — user profile, XP, PRs, persist
- [x] `useSettingsStore` — app preferences, persist
- [x] `useSheetStore` — sheet open/close, drives scale-behind

**Hooks & queries**
- [x] TanStack Query provider + PouchDB query adapter hooks (`useDatabase.ts`)
- [x] `useOnlineStatus` hook

**TypeScript types**
- [x] All document interfaces in `src/types/index.ts`

**Framer Motion**
- [x] Spring presets: `springSnappy`, `springDefault`, `springGentle`, `springCelebration`
- [x] All variants: push, pop, sheet, sheetBackground, tab, banner, phaseTransition, stagger, fadeUp
- [x] Navigation direction tracking (`navDirection.ts`)

**Design system (CSS)**
- [x] Brand tokens, iOS semantic aliases, category gradients
- [x] 7 Liquid Glass material classes
- [x] Glow effects, hero card system, utility classes

**Onboarding screens**
- [x] S-01 — Splash (`/splash`) — wordmark, progress bar, auto-redirect
- [x] S-02 — Welcome (`/onboarding/welcome`) — hero photo, stagger animations
- [x] S-03 — Goals (`/onboarding/goals`) — 2-col grid, 6 goals, max 3 selection
- [x] S-04 — Profile Setup (`/onboarding/profile`) — weight picker, unit toggle, experience level

**Route pages**
- [x] Dashboard (`/`) — full S-05 with Recovery Meter, Hero Workout Card, Weekly Activity, Quick Stats grid
- [x] Routines (`/routines`) — routine list with create button + empty state
- [x] History (`/history`) — empty state placeholder
- [x] Profile (`/profile`) — stats grid + info cards

**Other**
- [x] `.gitignore` updated for generated/cached assets
- [x] `useScrollTitle` hook — scroll-based title collapse

---

## Phase 2 — Exercise Browser & Routine Builder

**Status:** ✅ Complete  
**Duration target:** ~2 weeks

### Tasks

**UI Primitives**
- [x] `<SearchBar />` — debounced search with clear button, 250ms default
- [x] `<FilterChip />` + `<FilterChipBar />` — horizontal scrollable chip bar
- [x] `<BottomSheet />` — iOS 26 glass sheet with drag handle, scale-behind
- [x] `<DifficultyDots />` — 3-dot visual indicator (beginner/intermediate/advanced)
- [x] `<CategoryBadge />` — gradient-bordered category pill

**Exercise Library (S-06)**
- [x] Exercise library page (`/exercises`) — search + body part filter chips + results list
- [x] GIF thumbnails, difficulty dots, body part/equipment info
- [x] Loading skeleton shimmer + empty state

**Exercise Detail (S-07)**
- [x] Exercise detail page (`/exercises/[id]`) — GIF hero, gradient scrim
- [x] Muscles Worked section (primary + secondary)
- [x] How-To numbered steps
- [x] Equipment chip display
- [x] Favourite toggle with spring celebration animation
- [x] Sticky "ADD TO ROUTINE" button

**Routine Builder (S-08)**
- [x] Three-phase routine builder (Warm-Up | Workout | Stretch tabs)
- [x] `RoutinePhaseTabs` with `layoutId` animated indicator
- [x] Drag-to-reorder with `@dnd-kit/sortable`
- [x] `RoutineExerciseRow` — per-exercise config (sets, reps, rest, weight, progression scheme)
- [x] `RoutineSummaryBar` — floating bar with time + calorie estimates, expandable per-phase breakdown
- [x] `ExercisePickerSheet` — bottom sheet with search, filters, source toggle (Library | My Exercises)
- [x] Custom exercise creation form (`CustomExerciseForm`)
- [x] Auto warm-up generator (PT Feature 4) — progressive load sets (40%×8, 60%×5, 80%×3, 90%×1)
- [x] Routine save/update with redirect to detail page
- [x] New routine (`/routines/new/edit`) + edit existing (`/routines/[id]/edit`)

**Routine Detail (S-09)**
- [x] Routine detail page (`/routines/[id]`) — hero card with gradient overlay
- [x] Collapsible phase sections with colored dots and count badges
- [x] Exercise list per phase with formatted config
- [x] Duplicate + Delete actions
- [x] Sticky "START WORKOUT" button
- [x] Edit button → `/routines/[id]/edit`

**Dashboard Upgrade (S-05)**
- [x] Recovery Meter — SVG arc ring with animated strokeDashoffset
- [x] Hero Workout Card — latest routine with START button, or Quick Start CTA
- [x] Weekly Activity Strip — 7 day circles (Mon–Sun), trained days highlighted
- [x] Quick Stats grid — workouts this month, kcal burned, day streak, PRs
- [x] Time-based greeting (morning/afternoon/evening)

**Routines List Update**
- [x] Routine cards with icon, name, exercise count, chevron
- [x] "New" button in title bar → `/routines/new/edit`
- [x] Empty state with CREATE ROUTINE CTA

**Icon System Expansion**
- [x] Added 11+ new icon mappings: magnifyingglass, pencil, trash.fill, doc.on.doc, chevron.right, chevron.up, chevron.down, slider.horizontal.3, arrow.up.arrow.down

**Infrastructure**
- [x] `useScrollTitle` hook — scroll-based title collapse
- [x] PouchDB lazy initialization via Proxy for SSR safety
- [x] `serverExternalPackages` in next.config.ts for native module exclusion

---

## Phase 3 — Workout Execution Engine

**Status:** 🔲 Not started  
**Duration target:** ~2 weeks

### Tasks

- [ ] Three-phase session flow (Warm-Up → Workout → Stretch)
- [ ] Phase transition animations
- [ ] Set logging (weight, reps, RPE)
- [ ] Rest timer with haptic feedback
- [ ] Auto rep counter (accelerometer)
- [ ] Session pause/resume
- [ ] PR detection during workout
- [ ] Trainer assessment system (fatigue, progressive overload)

---

## Phase 4 — Post-Workout Insights & Rewards ← MVP

**Status:** 🔲 Not started  
**Duration target:** ~1.5 weeks

### Tasks

- [ ] Workout summary screen
- [ ] Calorie calculation
- [ ] XP/level/gamification system
- [ ] PR celebration animations
- [ ] Coaching notes
- [ ] Streak tracking
- [ ] Save completed session to PouchDB

---

## Phase 5 — Dashboard & Analytics

**Status:** 🔲 Not started

---

## Phase 6 — Advanced Coaching

**Status:** 🔲 Not started

---

## Phase 7 — Cloud Sync (CouchDB)

**Status:** 🔲 Not started

---

## Files Created / Modified

| File | Status | Description |
|------|--------|-------------|
| **Phase 1** | | |
| `src/types/index.ts` | ✅ | All TypeScript interfaces |
| `src/app/globals.css` | ✅ | Complete design system |
| `src/app/layout.tsx` | ✅ | Root layout + QueryProvider |
| `src/app/manifest.ts` | ✅ | PWA manifest |
| `src/lib/motion/springs.ts` | ✅ | 4 spring presets |
| `src/lib/motion/variants.ts` | ✅ | All animation variants |
| `src/lib/motion/navDirection.ts` | ✅ | Route hierarchy tracking |
| `src/lib/db/pouchdb.ts` | ✅ | 5 PouchDB instances (lazy Proxy init) |
| `src/lib/db/syncExerciseLibrary.ts` | ✅ | Versioned delta sync |
| `src/lib/media/athletePhotos.ts` | ✅ | Category photo URLs |
| `src/lib/cache/prefetchRoutineGifs.ts` | ✅ | GIF prefetch utility |
| `src/lib/QueryProvider.tsx` | ✅ | TanStack Query client |
| `src/store/useSessionStore.ts` | ✅ | Workout session store |
| `src/store/useProfileStore.ts` | ✅ | Profile + XP store |
| `src/store/useSettingsStore.ts` | ✅ | Settings store |
| `src/store/useSheetStore.ts` | ✅ | Sheet control store |
| `src/hooks/useOnlineStatus.ts` | ✅ | Online/offline hook |
| `src/hooks/useDatabase.ts` | ✅ | PouchDB query hooks |
| `src/components/ui/Icon.tsx` | ✅ | SF Symbol → Phosphor (~42 icons) |
| `src/components/ui/PrimaryButton.tsx` | ✅ | Lime pill CTA |
| `src/components/ui/ExerciseGif.tsx` | ✅ | Progressive GIF loader |
| `src/components/layout/BottomNav.tsx` | ✅ | Floating tab bar |
| `src/components/layout/TopBar.tsx` | ✅ | Glass nav bar |
| `src/components/layout/AppLayout.tsx` | ✅ | Main layout wrapper |
| `src/app/(app)/layout.tsx` | ✅ | App route group layout |
| `src/app/(app)/page.tsx` | ✅ | S-05 Dashboard |
| `src/app/(app)/routines/page.tsx` | ✅ | Routines list |
| `src/app/(app)/history/page.tsx` | ✅ | History placeholder |
| `src/app/(app)/profile/page.tsx` | ✅ | Profile placeholder |
| `src/app/(auth)/splash/page.tsx` | ✅ | S-01 Splash screen |
| `src/app/(auth)/onboarding/welcome/page.tsx` | ✅ | S-02 Welcome |
| `src/app/(auth)/onboarding/goals/page.tsx` | ✅ | S-03 Goals |
| `src/app/(auth)/onboarding/profile/page.tsx` | ✅ | S-04 Profile Setup |
| `scripts/generate-exercise-manifest.ts` | ✅ | Manifest build script |
| `next.config.ts` | ✅ | PWA + Workbox + serverExternalPackages |
| `.gitignore` | ✅ | Updated for generated assets |
| **Phase 2** | | |
| `src/components/ui/SearchBar.tsx` | ✅ | Debounced search input |
| `src/components/ui/FilterChip.tsx` | ✅ | FilterChip + FilterChipBar |
| `src/components/ui/BottomSheet.tsx` | ✅ | iOS 26 glass bottom sheet |
| `src/components/ui/DifficultyDots.tsx` | ✅ | 3-dot difficulty indicator |
| `src/components/ui/CategoryBadge.tsx` | ✅ | Gradient-bordered category pill |
| `src/hooks/useScrollTitle.ts` | ✅ | Scroll-based title collapse |
| `src/components/routine/RoutinePhaseTabs.tsx` | ✅ | 3-phase animated tabs |
| `src/components/routine/RoutineExerciseRow.tsx` | ✅ | Expandable exercise config row |
| `src/components/routine/RoutineSummaryBar.tsx` | ✅ | Floating time/calorie bar |
| `src/components/routine/ExercisePickerSheet.tsx` | ✅ | Exercise picker bottom sheet |
| `src/components/routine/CustomExerciseForm.tsx` | ✅ | Custom exercise creation form |
| `src/app/(app)/exercises/page.tsx` | ✅ | S-06 Exercise Library |
| `src/app/(app)/exercises/[id]/page.tsx` | ✅ | S-07 Exercise Detail |
| `src/app/(app)/routines/[id]/edit/page.tsx` | ✅ | S-08 Routine Builder |
| `src/app/(app)/routines/[id]/page.tsx` | ✅ | S-09 Routine Detail/Preview |
