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

**Status:** � In Progress (10/16 tasks complete)  
**Duration target:** ~1 week

### Tasks

**PT Feature 2 — RPE & Adaptive Set Scaling**
- [x] `useRpeAdvisor` hook — analyzes last 14 days per-exercise RPE trends
- [x] `CoachingNoteCard` component — apply/dismiss CTAs, current vs suggested comparison
- [x] Dashboard integration — shows max 3 notes with priority sorting
- [x] Routine detail page integration — filtered to exercises in viewed routine
- [ ] `ProgressionHistorySheet` — bottom sheet with sparkline visualization
- [x] Apply coaching note flow — updates routines via PouchDB
- [ ] RPE trend mini-sparkline on coaching cards

**PT Feature 5 — Deload & Recovery Week Scheduler**
- [x] `DeloadRoutineWizard` — 3-step bottom sheet wizard
- [x] Deload routine generator — reduces sets + weight, saves with `isDeload: true`
- [x] "Plan Deload Week" button opens wizard
- [x] `DeloadWeekView` — active deload progress tracker replaces hero card on dashboard
- [x] `DeloadCompleteCard` — celebration with +200 XP bonus
- [x] `WorkoutCalendar` deload visualization — muted teal color coding

**PT Feature 3 — Undulating Periodization**
- [x] `DayTypeBanner` component — Heavy/Moderate/Light day indicator
- [x] Dashboard integration with gradient backgrounds
- [x] Day type calculation from 3-day cycle (shared utility)
- [x] Routine list badge showing current day type (emoji + label)

**Web Push Notifications**
- [ ] Service worker push event listener
- [ ] `pushManager.ts` utility
- [ ] `useNotificationScheduler` hook
- [ ] Notification preferences UI

---

## Phase 7 — Cloud Sync (CouchDB)

**Status:** ✅ Complete

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
| **Phase 6** | | |
| `src/hooks/useRpeAdvisor.ts` | ✅ | RPE trend analysis, generates coaching notes |
| `src/components/coaching/CoachingNoteCard.tsx` | ✅ | Coaching suggestion card with apply/dismiss |
| `src/components/coaching/DayTypeBanner.tsx` | ✅ | Undulating day type indicator |
| `src/lib/coaching/applyCoachingNote.ts` | ✅ | Updates routines from coaching suggestions |
| `src/components/deload/DeloadRoutineWizard.tsx` | ✅ | 3-step deload routine generator |
| `src/components/dashboard/DeloadSuggestionCard.tsx` | 🔄 | Enhanced with Plan Deload Week button + wizard integration |
| `src/components/dashboard/WorkoutCalendar.tsx` | 🔄 | Enhanced with deload color-coding (muted teal) + legend |
| `src/app/(app)/page.tsx` | 🔄 | Integrated coaching notes + day type banner |
| `src/app/(app)/routines/[id]/page.tsx` | 🔄 | Integrated routine-filtered coaching notes |
| `src/types/index.ts` | 🔄 | Enhanced CoachingNote, added NotificationPreferences, isDeload to Routine |
| `src/store/useProfileStore.ts` | 🔄 | Added coaching note & notification actions |
| `src/lib/coaching/undulatingDayType.ts` | ✅ | Shared day type calculation utility + config |
| `src/components/deload/DeloadWeekView.tsx` | ✅ | Active deload progress tracker, replaces hero card |
| `src/components/deload/DeloadCompleteCard.tsx` | ✅ | Deload celebration modal with +200 XP bonus |
| `src/app/(app)/routines/page.tsx` | 🔄 | Added undulating day type badge to routine cards |
| **Phase 6 (completed)** | | |
| `src/components/coaching/ProgressionHistorySheet.tsx` | ✅ | Recharts dual-axis line chart for weight + RPE history |
| `src/components/coaching/CoachingNoteCard.tsx` | 🔄 | Added inline RPE mini-sparkline (SVG polyline + area fill) |
| `src/lib/notifications/pushManager.ts` | ✅ | Browser Notification API: permission, schedule, show, dismiss |
| `src/hooks/useNotificationScheduler.ts` | ✅ | Scheduling logic for all 4 notification types |
| `src/worker/index.ts` | ✅ | Custom SW: push event listener + notificationclick routing |
| `next.config.ts` | 🔄 | Added `customWorkerSrc` to merge push handler into generated SW |
| **Phase 7** | | |
| `src/types/index.ts` | 🔄 | Added SyncState, SyncStatus, CloudAccount, RoutineConflict |
| `src/lib/db/couchSync.ts` | ✅ | CouchDB sync engine: live replication, conflict detection, exponential backoff |
| `src/store/useAuthStore.ts` | ✅ | Cloud account auth store (persisted to localStorage) |
| `src/hooks/useSyncManager.ts` | ✅ | Sync orchestrator: auth + online/offline handling |
| `src/components/sync/SyncStatusBadge.tsx` | ✅ | Animated pill badge for 5 sync states |
| `src/components/sync/ConflictResolverSheet.tsx` | ✅ | Diff-style merge view for routine conflicts |
| `src/lib/utils/exportData.ts` | ✅ | JSON + CSV data export utilities |
| `src/app/(auth)/login/page.tsx` | ✅ | Cloud sync login screen |
| `src/app/(auth)/register/page.tsx` | ✅ | Cloud sync registration/setup screen |
| `src/components/layout/AppLayout.tsx` | 🔄 | Wired useSyncManager + ConflictResolverSheet |
| `src/app/(app)/profile/page.tsx` | 🔄 | Added Cloud Sync section with status badge + export buttons |
| `src/components/ui/Icon.tsx` | 🔄 | Added 14 new icons for cloud/sync/device UI |
| **PT Phase 1** | | |
| `src/types/index.ts` | 🔄 | Added TrainerProfile, TrainerSpecialization, TrainerCertification, TrainerStatus, AvailabilityStatus |
| `src/lib/db/trainerDb.ts` | ✅ | CouchDB server utilities for shared fitforge_trainers database |
| `src/app/api/trainers/route.ts` | ✅ | POST (enroll) + GET (list) trainers API |
| `src/app/api/trainers/me/route.ts` | ✅ | GET own trainer profile API |
| `src/app/api/trainers/[trainerId]/route.ts` | ✅ | GET + PUT single trainer API |
| `src/middleware.ts` | 🔄 | Added trainer route protection + public trainer directory |
| `src/hooks/useIsTrainer.ts` | ✅ | Clerk publicMetadata role check hook |
| `src/hooks/useTrainers.ts` | ✅ | TanStack Query hooks for trainer CRUD |
| `src/components/trainer/TrainerCard.tsx` | ✅ | Directory list item with avatar, rating, specialization chips |
| `src/components/trainer/TrainerEnrollmentForm.tsx` | ✅ | Multi-section enrollment form (name, bio, specs, certs, exp) |
| `src/components/trainer/TrainerDetailView.tsx` | ✅ | Full profile display with glass cards |
| `src/app/(app)/trainers/page.tsx` | ✅ | S-PT-01 Trainer Directory (search + filter + list) |
| `src/app/(app)/trainers/[id]/page.tsx` | ✅ | S-PT-02 Trainer Detail (profile + subscribe placeholder) |
| `src/app/(app)/trainer/enroll/page.tsx` | ✅ | S-PT-03 Trainer Enrollment page |
| `src/app/(app)/profile/page.tsx` | 🔄 | Added Personal Training section (Find a Trainer + Become a Trainer CTAs) |
| **PT Phase 2** | | |
| `src/types/index.ts` | 🔄 | Added ConnectionStatus, SharedDataSettings, TrainerConnection |
| `src/lib/db/connectionDb.ts` | ✅ | CouchDB utilities for fitforge_connections database |
| `src/app/api/connections/route.ts` | ✅ | POST (subscribe) + GET (list) connections API |
| `src/app/api/connections/active/route.ts` | ✅ | GET active connection with trainer profile |
| `src/app/api/connections/[id]/respond/route.ts` | ✅ | PATCH accept/decline connection |
| `src/app/api/connections/[id]/end/route.ts` | ✅ | PATCH end connection (either party) |
| `src/app/api/connections/[id]/privacy/route.ts` | ✅ | PATCH update shared data settings |
| `src/app/api/clients/route.ts` | ✅ | GET trainer's client list |
| `src/hooks/useConnections.ts` | ✅ | TanStack Query hooks for connections + clients |
| `src/components/trainer/SubscribeButton.tsx` | ✅ | Context-aware subscribe/unsubscribe CTA |
| `src/components/trainer/ConnectionRequestCard.tsx` | ✅ | Accept/decline request card |
| `src/components/trainer/ClientCard.tsx` | ✅ | Client list item with avatar + time |
| `src/components/trainer/TrainerDashboard.tsx` | ✅ | Stats grid + requests + client list |
| `src/components/trainer/MyTrainerCard.tsx` | ✅ | Dashboard card for active trainer |
| `src/components/trainer/PrivacySettingsSheet.tsx` | ✅ | Bottom sheet with privacy toggles |
| `src/app/(app)/trainer/page.tsx` | ✅ | S-PT-04 Trainer Dashboard |
| `src/app/(app)/trainer/clients/page.tsx` | ✅ | S-PT-05 Client List |
| `src/app/(app)/trainer/requests/page.tsx` | ✅ | S-PT-11 Pending Requests |
| `src/app/(app)/my-trainer/page.tsx` | ✅ | S-PT-10 My Trainer page |
| `src/components/layout/BottomNav.tsx` | 🔄 | Added conditional trainer tab |
| `src/components/ui/Icon.tsx` | 🔄 | Added Briefcase + UsersThree icons |
| `src/app/(app)/page.tsx` | 🔄 | Added MyTrainerCard to dashboard |
| `src/app/(app)/trainers/[id]/page.tsx` | 🔄 | Wired SubscribeButton (replaced placeholder) |
| **PT Phase 3** | | |
| `src/types/index.ts` | 🔄 | Added SuggestionStatus, RoutineSuggestion, WorkoutSummaryBrief, ClientProgressSnapshot |
| `src/lib/db/suggestionDb.ts` | ✅ | CouchDB utilities for fitforge_suggestions database |
| `src/app/api/suggestions/route.ts` | ✅ | POST (create) + GET (list) suggestions API |
| `src/app/api/suggestions/pending/route.ts` | ✅ | GET pending suggestion count |
| `src/app/api/suggestions/[id]/respond/route.ts` | ✅ | PATCH accept/decline suggestion |
| `src/app/api/clients/[clientId]/progress/route.ts` | ✅ | GET aggregated client progress |
| `src/app/api/clients/[clientId]/workouts/route.ts` | ✅ | GET client workout history |
| `src/app/api/clients/[clientId]/prs/route.ts` | ✅ | GET client personal records |
| `src/hooks/useSuggestions.ts` | ✅ | TanStack Query hooks for suggestions CRUD |
| `src/hooks/useClientProgress.ts` | ✅ | TanStack Query hooks for client progress/workouts/PRs |
| `src/components/trainer/SuggestRoutineSheet.tsx` | ✅ | Bottom sheet to select and suggest routine to client |
| `src/components/trainer/SuggestionCard.tsx` | ✅ | User-side suggestion card (preview, accept, decline) |
| `src/components/trainer/ClientProgressView.tsx` | ✅ | Trainer-side client progress with stats + charts |
| `src/components/trainer/ClientWorkoutList.tsx` | ✅ | Read-only client workout session history |
| `src/app/(app)/trainer/clients/[id]/page.tsx` | ✅ | S-PT-06 Client Detail (tabs: overview, workouts, PRs) |
| `src/app/(app)/routines/suggested/page.tsx` | ✅ | S-PT-08 Suggested Routines Inbox |
| `src/app/(app)/routines/suggested/[id]/page.tsx` | ✅ | S-PT-09 Suggestion Preview |
| `src/app/(app)/routines/page.tsx` | 🔄 | Added pending suggestion badge/banner |
| **PT Phase 4 — Notifications & Polish** | | |
| `src/types/index.ts` | 🔄 | Added TrainerNotificationType, TrainerNotification |
| `src/lib/db/notificationDb.ts` | ✅ | CouchDB utilities for fitforge_trainer_notifications |
| `src/app/api/trainer-notifications/route.ts` | ✅ | GET paginated notifications + countOnly mode |
| `src/app/api/trainer-notifications/[id]/read/route.ts` | ✅ | PATCH mark single notification read |
| `src/app/api/trainer-notifications/read-all/route.ts` | ✅ | POST mark all notifications read |
| `src/hooks/useTrainerNotifications.ts` | ✅ | TanStack Query hooks for notifications |
| `src/components/trainer/NotificationBell.tsx` | ✅ | Bell icon with unread badge |
| `src/components/trainer/NotificationItem.tsx` | ✅ | Notification row with icon, title, timeAgo |
| `src/components/trainer/NotificationList.tsx` | ✅ | Full notification feed with mark-all-read |
| `src/app/(app)/trainer/notifications/page.tsx` | ✅ | S-PT-12 Notification Center |
| `src/app/(app)/trainer/page.tsx` | 🔄 | Added NotificationBell to TopBar rightAction |
| `src/app/api/connections/route.ts` | 🔄 | Added new_connection_request notification trigger |
| `src/app/api/connections/[id]/respond/route.ts` | 🔄 | Added createTrainerNotification import |
| `src/app/api/suggestions/[id]/respond/route.ts` | 🔄 | Added suggestion_accepted/declined notification trigger |

---

## PT Phase 1 — Trainer Enrollment & Directory

**Status:** ✅ Complete
**Ref:** `docs/08-personal-trainer-portal.md`

### Tasks

**Data Layer**
- [x] Define new TypeScript interfaces in `src/types/index.ts` (TrainerProfile, TrainerSpecialization, TrainerCertification, TrainerStatus, AvailabilityStatus)
- [x] Create CouchDB shared database utilities (`src/lib/db/trainerDb.ts`) — ensureTrainerDb, getTrainerDoc, putTrainerDoc, listTrainers
- [x] Create server-side Mango index for trainer queries

**API Routes**
- [x] `POST /api/trainers` — create trainer profile (enrollment) with Clerk metadata update
- [x] `GET /api/trainers` — list trainers with pagination, search, specialization filter
- [x] `GET /api/trainers/[trainerId]` — single trainer detail
- [x] `PUT /api/trainers/[trainerId]` — update own profile (authorization enforced)
- [x] `GET /api/trainers/me` — get own trainer profile

**Clerk Integration**
- [x] Set `role: "trainer"` in Clerk `publicMetadata` on enrollment
- [x] Create `useIsTrainer()` hook (reads Clerk publicMetadata)
- [x] Update middleware — public `/api/trainers` for directory, trainer-only route guard for `/trainer/*`
- [x] Allow `/trainer/enroll` for non-trainers (enrollment page exception)

**Components**
- [x] `TrainerCard` — glass card with avatar, name, rating, client count, specialization chips
- [x] `TrainerDetailView` — full profile with About, Specializations, Certifications, Stats sections
- [x] `TrainerEnrollmentForm` — multi-field form (name, bio, specialization chips, certifications, experience stepper)

**Pages**
- [x] `/trainers` — S-PT-01 Trainer Directory (search, filter, staggered list)
- [x] `/trainers/[id]` — S-PT-02 Trainer Detail (full profile + subscribe placeholder)
- [x] `/trainer/enroll` — S-PT-03 Enrollment Form (hero + form + error handling)

**Navigation**
- [x] Added "Find a Trainer" entry point on Profile page
- [x] Added "Become a Trainer" / "Trainer Profile" CTA on Profile page (conditional on trainer role)

**TanStack Query Hooks**
- [x] `useTrainers(options)` — directory listing with search + filter
- [x] `useTrainer(id)` — single trainer detail
- [x] `useMyTrainerProfile()` — own trainer profile
- [x] `useEnrollTrainer()` — enrollment mutation with cache invalidation
- [x] `useUpdateTrainer(id)` — profile update mutation

---

## PT Phase 2 — Connections & Trainer Dashboard

**Status:** ✅ Complete
**Ref:** `docs/08-personal-trainer-portal.md`

### Tasks

**Data Layer**
- [x] Define `TrainerConnection`, `ConnectionStatus`, `SharedDataSettings` interfaces in `src/types/index.ts`
- [x] Create `fitforge_connections` CouchDB database utilities (`src/lib/db/connectionDb.ts`)
- [x] Mango indexes for trainer+status and client+status queries

**API Routes**
- [x] `POST /api/connections` — user sends subscription request (validates trainer exists, availability, no duplicate)
- [x] `GET /api/connections` — list connections (role-aware: trainer vs client filter)
- [x] `GET /api/connections/active` — user's current active connection with enriched trainer profile
- [x] `PATCH /api/connections/[id]/respond` — trainer accepts/declines (updates clientCount)
- [x] `PATCH /api/connections/[id]/end` — either party ends connection (decrements clientCount)
- [x] `PATCH /api/connections/[id]/privacy` — client updates shared data settings
- [x] `GET /api/clients` — trainer's connected client list (trainer role enforced)

**TanStack Query Hooks**
- [x] `useActiveConnection()` — user's current connection + enriched trainer profile
- [x] `useConnections(options)` — list connections with role/status filter
- [x] `useSubscribeToTrainer()` — mutation to send subscription request
- [x] `useRespondToConnection()` — mutation for trainer accept/decline
- [x] `useEndConnection()` — mutation to end connection (either party)
- [x] `useUpdatePrivacy()` — mutation for privacy settings
- [x] `useClients(status)` — trainer's client list

**Components**
- [x] `SubscribeButton` — context-aware (subscribe/pending/unsubscribe/unavailable/has-other-connection)
- [x] `ConnectionRequestCard` — accept/decline UI for trainer with time-since display
- [x] `ClientCard` — trainer's client list item with avatar, ID, connected time
- [x] `TrainerDashboard` — stats grid + request queue + client list overview
- [x] `MyTrainerCard` — dashboard card for user's active trainer connection
- [x] `PrivacySettingsSheet` — bottom sheet with toggles for shared data settings

**Pages**
- [x] `/trainer` — S-PT-04 Trainer Dashboard (greeting, stats grid, requests, clients)
- [x] `/trainer/clients` — S-PT-05 Client List (active/pending tabs, empty states)
- [x] `/trainer/requests` — S-PT-11 Pending Requests (full request list)
- [x] `/my-trainer` — S-PT-10 My Trainer (profile, privacy controls, unsubscribe)

**Navigation**
- [x] Added conditional trainer tab to BottomNav (briefcase icon, visible when `isTrainer`)
- [x] Added "My Trainer" card to Dashboard home page (shows only with active connection)
- [x] Wired SubscribeButton into Trainer Detail page (replaced placeholder)

**Icon System**
- [x] Added `Briefcase` and `UsersThree` Phosphor icons to Icon.tsx (`briefcase.fill`, `person.3.fill`)

---

## PT Phase 3 — Routine Suggestions & Client Progress

**Status:** ✅ Complete
**Ref:** `docs/08-personal-trainer-portal.md`

### Tasks

**Data Layer**
- [x] Define `RoutineSuggestion`, `SuggestionStatus`, `WorkoutSummaryBrief`, `ClientProgressSnapshot` interfaces in `src/types/index.ts`
- [x] Create `fitforge_suggestions` CouchDB database utilities (`src/lib/db/suggestionDb.ts`)
- [x] Mango indexes for trainer+suggestedAt and client+status+suggestedAt queries

**API Routes**
- [x] `POST /api/suggestions` — PT creates routine suggestion (validates active connection, freezes routine snapshot)
- [x] `GET /api/suggestions` — list suggestions (role-aware: trainer sees sent, client sees received)
- [x] `GET /api/suggestions/pending` — user's pending suggestion count (for badge)
- [x] `PATCH /api/suggestions/[id]/respond` — user accepts/declines suggestion
- [x] `GET /api/clients/[clientId]/progress` — aggregated client stats from per-user CouchDB
- [x] `GET /api/clients/[clientId]/workouts` — client workout history (paginated)
- [x] `GET /api/clients/[clientId]/prs` — client personal records

**TanStack Query Hooks**
- [x] `useSuggestions(options)` — list suggestions with status filter
- [x] `usePendingSuggestionCount()` — count for badge display
- [x] `useCreateSuggestion()` — mutation for PT to send suggestion
- [x] `useRespondToSuggestion()` — mutation for user accept/decline
- [x] `useClientProgress(clientId)` — aggregated client progress snapshot
- [x] `useClientWorkouts(options)` — paginated client workout history
- [x] `useClientPRs(clientId)` — client personal records

**Components**
- [x] `SuggestRoutineSheet` — bottom sheet for PT to select routine + add note for client
- [x] `SuggestionCard` — user-side suggestion card (status badge, preview, accept actions)
- [x] `ClientProgressView` — trainer-side client overview (stat cards, streak, volume, charts)
- [x] `ClientWorkoutList` — read-only session history with duration, calories, RPE

**Pages**
- [x] `/trainer/clients/[id]` — S-PT-06 Client Detail (tabs: overview, workouts, PRs + suggest CTA)
- [x] `/routines/suggested` — S-PT-08 Suggested Routines Inbox (sorted pending-first)
- [x] `/routines/suggested/[id]` — S-PT-09 Suggestion Preview (full routine breakdown + accept/decline)

**Flows**
- [x] PT: Client detail → Suggest routine → Select from own routines → Add note → Send
- [x] User: Accept suggestion → Copy routineSnapshot to local PouchDB → Navigate to routine
- [x] User: Decline suggestion → Update status → Return to inbox

**Modified Existing**
- [x] Routines page — Added pending suggestions banner with count badge (links to inbox)

---

## PT Phase 4 — Notifications & Polish

**Status:** ✅ Complete
**Ref:** `docs/08-personal-trainer-portal.md`

### Tasks

**Data Layer**
- [x] Define `TrainerNotificationType` (5-value union) and `TrainerNotification` interface in `src/types/index.ts`
- [x] Create `fitforge_trainer_notifications` CouchDB database utilities (`src/lib/db/notificationDb.ts`)
- [x] Mango indexes for trainer+createdAt and trainer+read+createdAt queries
- [x] Fire-and-forget `createTrainerNotification()` helper (logs errors, never throws)

**API Routes**
- [x] `GET /api/trainer-notifications` — paginated list with `countOnly=true` mode for badge
- [x] `PATCH /api/trainer-notifications/[id]/read` — mark single notification read (ownership enforced)
- [x] `POST /api/trainer-notifications/read-all` — mark all unread notifications read

**TanStack Query Hooks**
- [x] `useTrainerNotifications(limit)` — notification list (30s stale)
- [x] `useUnreadNotificationCount()` — badge count (15s stale for frequent updates)
- [x] `useMarkNotificationRead()` — mutation with cache invalidation
- [x] `useMarkAllNotificationsRead()` — mutation with cache invalidation

**Components**
- [x] `NotificationBell` — bell icon with red unread count badge, navigates to notifications page
- [x] `NotificationItem` — notification row with type-mapped icon+color, title, body, timeAgo, unread dot
- [x] `NotificationList` — full feed with mark-all-read action, empty state, smart navigation on tap

**Pages**
- [x] `/trainer/notifications` — S-PT-12 Notification Center (TopBar + back + list)

**Integration**
- [x] Wired NotificationBell into trainer dashboard TopBar (`rightAction` prop)
- [x] Added `new_connection_request` notification trigger in `POST /api/connections`
- [x] Added `suggestion_accepted` / `suggestion_declined` notification triggers in `PATCH /api/suggestions/[id]/respond`

**Notification Types**
- `new_connection_request` — green person icon, fired when user subscribes to trainer
- `connection_ended` — red person icon (type defined, trigger deferred)
- `suggestion_accepted` — lime checkmark icon, fired when user accepts routine suggestion
- `suggestion_declined` — orange xmark icon, fired when user declines routine suggestion
- `client_workout_completed` — blue dumbbell icon (type defined, trigger deferred to workout completion flow)

