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

**Status:** ✅ Complete  
**Duration target:** ~2 weeks

### Tasks

**Calculation Utilities**
- [x] `calories.ts` — MET-based calorie calculation with phase modifiers and RPE adjustment
- [x] `time.ts` — `estimateRoutineTime()`, `getTimeDelta()`, `formatTime()`, `formatTimeLong()`
- [x] `prs.ts` — `detectPRs()` comparing max weight, max volume, max reps against existing PRs

**Custom Hooks**
- [x] `useAutoCount` — Metronome-based rep counter with state machine (idle→countdown→counting→complete)
- [x] `useElapsedTime` — Tracks elapsed seconds with pause/resume support

**Workout Components**
- [x] `PhaseProgressBar` — 3-segment bar (warmUp/workout/stretch) with animated fill + phase labels
- [x] `RepCounter` — Large tap-target ±counter with 64×64px buttons, animated number flip
- [x] `WeightSelector` — Inline stepper with long-press acceleration, direct edit mode, unit display
- [x] `HoldTimer` — SVG ring countdown for stretch holds with breathing cue text
- [x] `RestTimer` (S-13) — Full-screen glass overlay, 180pt SVG ring, ±30s adjust, SKIP REST, auto-dismiss
- [x] `PhaseTransitionBanner` (S-14) — Interstitial card with scale-behind, phase icon, stats, 10s countdown
- [x] `RpePrompt` — Emoji scale (😴🙂😤😰🔥) mapping to RPE 2/4/6/8/10, auto-dismiss after 8s
- [x] `ActiveSetCard` — Exercise GIF hero card with name, sets label, set progress bar, accent border

**Pages**
- [x] Workout execution page (`/session/[id]`) — three-phase flow integrating all components
- [x] Post-workout summary page (`/session/[id]/summary`) — XP celebration, stats, phase breakdown

**Session Flow**
- [x] Three-phase session flow (Warm-Up → Workout → Stretch)
- [x] Phase transition animations with interstitial cards
- [x] Set logging (weight, reps, RPE)
- [x] Rest timer with haptic feedback
- [x] Session pause/resume with overlay
- [x] End session early with confirmation
- [x] Workout save to PouchDB on completion
- [x] Navigation to summary page after save

**Infrastructure**
- [x] Updated START WORKOUT button route (`/session/${id}`)
- [x] Added `/session/summary` to navDirection route hierarchy

---

## Phase 4 — Post-Workout Insights & Rewards ← MVP

**Status:** ✅ Complete  
**Duration target:** ~1.5 weeks

### Tasks

**Calculation Utilities**
- [x] `xp.ts` — `calculateSessionXP()` with formula: 0.5×cal + 10×exercises + completionRate×50 + PRs×100 + time bonus + streak bonus
- [x] `energyMeter.ts` — `calculateEnergyScore()` composite 0-100 from time recovery, volume load ratio, avg RPE, manual feel
- [x] `muscleMap.ts` — Maps exercise bodyPart/target to react-body-highlighter muscles, `exercisesToHighlighterData()`, frequency heatmap

**Type Enhancements**
- [x] Added `prsAchieved?: PersonalRecord[]` and `avgRpe?: number` to `WorkoutSummary` interface

**Session End Flow**
- [x] Wired real calorie calculation via `calculatePhaseCalories()` in `doEndSession()`
- [x] PR detection via `detectPRs()` comparing against profile PRs
- [x] XP calculation via `calculateSessionXP()` with full formula
- [x] Profile updates: streak increment, PR records, XP addition
- [x] Full `WorkoutSession` document saved to PouchDB with computed summary

**Post-Workout Summary (S-15)**
- [x] 7-step celebration choreography (confetti → hero → XP bar → stats → PRs → heatmap → RPE)
- [x] ConfettiParticles — 30 reactive particles with 5 accent colors
- [x] PR badges with trophy icons and spring-stagger entry
- [x] Muscle heatmap — anterior + posterior body models via `react-body-highlighter`
- [x] RPE donut chart — animated SVG strokeDashoffset fill
- [x] XP progress bar with level thresholds
- [x] Streak indicator card with flame icon and bonus XP display

**Workout History (S-16)**
- [x] Chronological workout list grouped by week ("This Week", "Last Week", "N Weeks Ago")
- [x] Filter segmented control (All | Week | Month)
- [x] Session cards with date, routine name, duration/calories/sets, muscle chips, PR indicator
- [x] Tap to navigate to session detail

**History Session Detail (S-17)**
- [x] Read-only session breakdown with nav bar (date + workout name)
- [x] Stats grid (duration, calories, sets, reps)
- [x] XP earned + avg RPE display
- [x] PR badges for records achieved in session
- [x] Muscle heatmap (anterior + posterior)
- [x] Expandable exercise rows with per-set logs (weight × reps, RPE, PR markers)
- [x] Share Workout (Web Share API) + Repeat Workout action buttons

**Database Hooks**
- [x] `useWorkout(id)` — fetch single workout by ID

**Dependencies**
- [x] Installed `react-body-highlighter` for muscle visualization

---

## Phase 5 — Dashboard & Analytics

**Status:** ✅ Complete  
**Duration target:** ~1 week

### Tasks

**Animation Bug Fixes**
- [x] Dashboard: replaced broken `staggerContainer`/`fadeUpItem` variant propagation with direct `initial`/`animate`/`transition` props
- [x] Dashboard & Profile: replaced `{ ...springGentle, delay }` (broken in FM 12.x) with tween transitions
- [x] Updated animations across all new components to use safe tween pattern

**Type & Store Extensions**
- [x] Added `manualFeelScore`, `lastFeelPromptDate`, `fatigueThresholdPercent` to `UserProfile` interface
- [x] Added `setManualFeelScore(score)` and `setFatigueThreshold(percent)` actions to `useProfileStore`

**Database Hooks**
- [x] `useRecentWorkouts(days)` — filter workouts within last N days
- [x] `useMonthWorkouts(year, month)` — filter workouts for a specific month

**Calculation Utilities**
- [x] `analytics.ts` — `sessionVolume()`, `weeklyVolume()`, `rollingBaselineVolume()`, `averageRecentRpe()`
- [x] `analytics.ts` — `volumeTrend()` (8-week buckets), `bodyPartFrequency()`
- [x] `analytics.ts` — `calculateOverloadTarget()` (linear/double/undulating schemes)
- [x] `analytics.ts` — `detectDeloadSignals()` (volume_overload, high_rpe, plateau, streak_long)

**Custom Hooks**
- [x] `useFatigueWarnings` — muscle group overlap (48h), volume (>130% baseline), RPE, frequency warnings
- [x] `useDeloadDetector` — monitors training patterns, suggests deload weeks with volume reduction

**Dashboard Components**
- [x] `WorkoutCalendar` — monthly heatmap with intensity coloring, month navigation, today highlight
- [x] `DailyFeelPrompt` — once-daily 1-5 emoji self-report for recovery meter input
- [x] `VolumeTrendChart` — 8-week Recharts bar chart with lime bars and dark tooltip
- [x] `BodyPartChart` — horizontal bar chart showing muscle group training frequency
- [x] `FatigueWarningBanner` — severity-based banner (info/warning/danger) with dismiss
- [x] `DeloadSuggestionCard` — orange gradient card with volume reduction and duration suggestions

**Dashboard Page (S-05) Rewrite**
- [x] Real recovery scoring via `calculateEnergyScore()` pipeline (replaces mock data)
- [x] Score-based RecoveryMeter color (lime/blue/orange/red at 75/50/25 thresholds)
- [x] Integrated DailyFeelPrompt, DeloadSuggestionCard, WorkoutCalendar
- [x] Integrated VolumeTrendChart and BodyPartChart
- [x] Quick Stats with real data from workout history

**Profile & Stats Page (S-18) Rewrite**
- [x] Avatar circle with initials, lime gradient ring
- [x] XP progress bar with level thresholds and animated fill
- [x] Goals progress rings (SVG radial) per selected fitness goal
- [x] Monthly stats bar chart (Recharts) — 6-month workout count
- [x] Personal Records list with exercise name, weight/reps, date
- [x] Settings rows: Units toggle, Bodyweight, Experience, Fatigue Threshold, Edit Profile
- [x] Quick links: Exercises, History

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
| **Phase 3** | | |
| `src/lib/calculations/calories.ts` | ✅ | MET-based calorie calculator |
| `src/lib/calculations/time.ts` | ✅ | Time estimation & formatting |
| `src/lib/calculations/prs.ts` | ✅ | PR detection logic |
| `src/hooks/useAutoCount.ts` | ✅ | Metronome rep counter hook |
| `src/hooks/useElapsedTime.ts` | ✅ | Elapsed time with pause support |
| `src/components/workout/PhaseProgressBar.tsx` | ✅ | 3-segment phase progress |
| `src/components/workout/RepCounter.tsx` | ✅ | Tap-target rep counter |
| `src/components/workout/WeightSelector.tsx` | ✅ | Weight stepper with long-press |
| `src/components/workout/HoldTimer.tsx` | ✅ | SVG ring hold countdown |
| `src/components/workout/RestTimer.tsx` | ✅ | S-13 Full-screen rest timer |
| `src/components/workout/PhaseTransitionBanner.tsx` | ✅ | S-14 Phase transition card |
| `src/components/workout/RpePrompt.tsx` | ✅ | Emoji RPE collector |
| `src/components/workout/ActiveSetCard.tsx` | ✅ | Active exercise hero card |
| `src/app/(app)/session/[id]/page.tsx` | ✅ | Workout execution orchestrator |
| `src/app/(app)/session/[id]/summary/page.tsx` | ✅ | Post-workout summary screen |
| **Phase 4** | | |
| `src/lib/calculations/xp.ts` | ✅ | XP calculation with formula |
| `src/lib/calculations/energyMeter.ts` | ✅ | Energy/recovery score (0-100) |
| `src/lib/calculations/muscleMap.ts` | ✅ | Exercise→muscle heatmap mapper |
| `src/app/(app)/session/[id]/page.tsx` | 🔄 | Enhanced with real calcs in doEndSession |
| `src/app/(app)/session/[id]/summary/page.tsx` | 🔄 | Full S-15 with 7-step celebration choreography |
| `src/app/(app)/history/page.tsx` | 🔄 | S-16 Chronological history with filters |
| `src/app/(app)/history/[id]/page.tsx` | ✅ | S-17 History session detail |
| `src/hooks/useDatabase.ts` | 🔄 | Added useWorkout(id) hook |
| `src/types/index.ts` | 🔄 | Added prsAchieved, avgRpe to WorkoutSummary |
| **Phase 5** | | |
| `src/lib/calculations/analytics.ts` | ✅ | Volume trends, body part frequency, overload, deload detection |
| `src/hooks/useFatigueWarnings.ts` | ✅ | Fatigue warning analysis hook |
| `src/hooks/useDeloadDetector.ts` | ✅ | Deload recommendation hook |
| `src/components/dashboard/WorkoutCalendar.tsx` | ✅ | Monthly workout heatmap calendar |
| `src/components/dashboard/DailyFeelPrompt.tsx` | ✅ | Once-daily feel score prompt |
| `src/components/dashboard/VolumeTrendChart.tsx` | ✅ | 8-week volume bar chart (Recharts) |
| `src/components/dashboard/BodyPartChart.tsx` | ✅ | Body part frequency horizontal bars |
| `src/components/dashboard/FatigueWarningBanner.tsx` | ✅ | Severity-based fatigue warning banner |
| `src/components/dashboard/DeloadSuggestionCard.tsx` | ✅ | Deload suggestion card |
| `src/app/(app)/page.tsx` | 🔄 | Full S-05 rewrite with real analytics |
| `src/app/(app)/profile/page.tsx` | 🔄 | Full S-18 rewrite with avatar, XP bar, charts, PRs, settings |
| `src/hooks/useDatabase.ts` | 🔄 | Added useRecentWorkouts, useMonthWorkouts hooks |
| `src/types/index.ts` | 🔄 | Added manualFeelScore, lastFeelPromptDate, fatigueThresholdPercent |
| `src/store/useProfileStore.ts` | 🔄 | Added feel score & fatigue threshold actions |
