# Task 5 — Phased Implementation Plan

---

## Dependency Map

```
Phase 1  Foundation & PWA Shell
    └── Phase 2  Exercise Browser & Routine Builder
            └── Phase 3  Workout Execution Engine
                    └── Phase 4  Post-Workout Insights & Rewards  ← MVP
                            ├── Phase 5  Dashboard & Analytics
                            │       └── Phase 6  Advanced Coaching
                            └── Phase 7  Cloud Sync (CouchDB)     ← parallel track
```

> **Phases 1–4 = shippable MVP.** All subsequent phases extend the MVP.

---

## Phase 1 — Foundation & PWA Shell

**Duration:** ~2 weeks  
**Goal:** A runnable shell with offline capability and seeded exercise data.

### Tasks

- [ ] Initialize Next.js project with TypeScript, Tailwind CSS, App Router
- [ ] Configure `@ducanh2912/next-pwa`, `manifest.ts`, mobile viewport meta tags
- [ ] Add PWA icons (192×192, 512×512) and theme color

**Static media setup** (Architecture §2.8)
- [ ] `xcopy data\gifs public\data\gifs /E /I /Y` — copy GIFs to `public/` so Next.js serves them; add `public/data/gifs/` and `public/data/previews/` to `.gitignore`
- [ ] Run `scripts/convert-gifs.sh` to generate `public/data/previews/*.webp` WebP thumbnails (320px / 15fps via `ffmpeg`). Register as `setup:previews` npm script.
- [ ] Create `public/images/athletes/` folder with 8 category photos (`strength.jpg`, `cardio.jpg`, `stretch.jpg`, `warmup.jpg`, `upper.jpg`, `lower.jpg`, `core.jpg`, `fullbody.jpg`). Use picsum.photos seeds in `lib/media/athletePhotos.ts` for dev; swap to committed JPEGs for production (Architecture §2.8).
- [ ] Build `lib/media/athletePhotos.ts` — `ATHLETE_PHOTO` record mapping each `WorkoutCategory` to its photo URL (picsum in dev, committed static in prod)

**Icon system** (Architecture §2.9)
- [ ] Install `@phosphor-icons/react` v2
- [ ] Build `components/ui/Icon.tsx` — `<Icon name={sfSymbolKey} />` wrapper backed by Phosphor. All callsites use SF Symbol naming keys (e.g. `"house.fill"`). Full mapping table in Architecture §2.9.
- [ ] Install and configure PouchDB, create the five DB instances with TypeScript types:
  - `fitforge_exercises` — seeded exercise library (read-only, static)
  - `fitforge_custom_exercises` — user-created exercises (warm-up / workout / stretch)
  - `fitforge_routines` — user-created routines
  - `fitforge_workouts` — completed session logs
  - `fitforge_profile` — user profile, preferences, PRs, XP
- [ ] Build `syncExerciseLibrary()` — versioned delta sync replacing the naive `seedExercisesIfEmpty()` pattern:
  - Write `scripts/generate-exercise-manifest.ts` build script: scans `data/exercises/*.json`, computes a per-file SHA-1 content hash and a library-level version hash, outputs `public/data/exercise-manifest.json`
  - Register script as `prebuild` in `package.json` so it runs automatically before every `next build`
  - Runtime: on every app startup, fetch manifest from SW cache, compare `version` against `_local/exercise_library_meta` in PouchDB
  - If versions match → exit in <5ms, zero writes
  - If versions differ → delta sync: INSERT new exercises, UPSERT content-changed exercises (with `_rev`), SOFT-DELETE exercises removed from the library
  - Persist updated `_local/exercise_library_meta` and `_local/exercise_hashes` after sync
  - Custom exercises in `fitforge_custom_exercises` are a separate DB — never touched by this sync
- [ ] **GIF asset optimization pipeline** — run `scripts/convert-gifs.sh` to convert `data/gifs/*.gif` to animated WebP at 320px / 15fps into `public/data/previews/`:
  - Reduces 200MB+ GIF library to ~40–70MB WebP previews
  - Original GIFs retained in `data/gifs/` for full-quality playback during active sets
  - Add `scripts/convert-gifs.sh` to the repo; document as a pre-build step in `package.json`
- [ ] Configure Workbox runtime caching in `next.config.ts`:
  - `exercise-gifs` cache: `CacheFirst`, `rangeRequests: true`, max 150 entries, LRU eviction, `purgeOnQuotaError: true`
  - `exercise-previews` cache: `CacheFirst`, max 250 entries
  - Exclude `/data/gifs/**` from SW precache manifest (never eagerly cache 200MB at install)
- [ ] Build `<ExerciseGif />` component with `loading="lazy"`, skeleton shimmer (Framer Motion `AnimatePresence`), and `animated` prop toggle (WebP thumbnail vs full GIF)
- [ ] Build `prefetchRoutineGifs()` utility — prefetches only the GIFs for exercises in the active routine into Cache Storage when user opens the routine detail page
- [ ] Scaffold `AppShell`, `BottomNav`, `TopBar` components with safe-area-inset support
- [ ] Set up Zustand stores: `useSessionStore`, `useProfileStore`, `useSettingsStore`, `useSheetStore`
  - `useSheetStore` tracks whether any bottom sheet is open; drives `sheetBackgroundVariants` iOS 26 scale-behind effect in `AppLayout` (see Design System §3.4)

**Onboarding Screens (S-01–S-04)** — *must be Phase 1: these are the first screens a user sees*
- [ ] `S-01 — Splash` (`/splash`): full-bleed athlete photo, `FITFORGE` wordmark (`#C5F74F`, 800, 42px), Framer Motion `useMotionValue` progress bar `0→100%` over 600ms, auto-transition to `/onboarding/welcome`
- [ ] `S-02 — Onboarding Welcome` (`/onboarding/welcome`): hero photo top 65vh, content card below, staggered entry animations (headline delay 0.1s, subtext 0.2s, CTA 0.3s). `PrimaryButton` CTA. Swipe-left advances.
- [ ] `S-03 — Onboarding Goals` (`/onboarding/goals`): 2-col goal card grid; SF Symbol icons (not emoji — see §3.2 SF Symbols); selected state: lime border + tint; `springSnappy` press scale. Goals saved to `fitforge_profile`.
- [ ] `S-04 — Onboarding Profile Setup` (`/onboarding/profile`): bodyweight number picker, unit toggle (kg/lbs), experience-level selector; writes initial `UserProfile` to `fitforge_profile`; transitions to Dashboard on complete
- [ ] Set up TanStack Query with a PouchDB query adapter pattern
- [ ] Implement `useOnlineStatus` hook (listens to `navigator.onLine` + network events)
- [ ] Write TypeScript interfaces for all DB document types:
  - `ExerciseRecord` (seeded library)
  - `CustomExercise` (user-created, stored in `fitforge_custom_exercises`)
  - `RoutineExerciseConfig` (shared shape used in `warmUp[]`, `workout[]`, `stretch[]`)
  - `Routine` (with `warmUp`, `workout`, `stretch` phase arrays)
  - `WorkoutSession` (log mirroring the three-phase structure)
  - `PersonalRecord`, `UserProfile`, `WorkoutSummary`

### Deliverable

App installs as a PWA, opens fully offline, exercise data is queryable from PouchDB.

---

## Phase 2 — Exercise Browser & Routine Builder

**Duration:** ~2 weeks  
**Goal:** Users can browse the exercise library and create saved routines.

### Tasks

**iOS 26 Liquid Glass UI Foundation** — *establish design system before building feature screens*
- [ ] Define all CSS custom properties in `globals.css`: brand tokens (`--brand-lime`, `--brand-bg`, etc.), iOS 26 glass tokens (`--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-specular`, `--glass-inner-shadow`, `--glass-shadow`), category gradients (`--grad-strength` through `--grad-full`), and spacing/shape tokens
- [ ] Implement the 7 Liquid Glass material classes in `globals.css`: `.glass`, `.glass-elevated`, `.glass-tab-bar`, `.glass-nav-bar`, `.glass-sheet`, `.glass-menu`, `.glass-active-pill` (full CSS recipes in Design System §3.1)
- [ ] Implement `.glow-primary` and `.glow-primary-strong` lime glow utilities
- [ ] Build `<PrimaryButton />` — lime pill (`height: 56pt`, `border-radius: 100px`, `bg: #C5F74F`, `text: #0B0B0B`, Framer Motion `whileTap scale: 0.97`). Used on all onboarding CTAs, Routine Start, and Session Complete flows.
- [ ] Build `<BottomNav />` — `.glass-tab-bar` floating pill with `layoutId="tab-indicator"` lime active pill (`<motion.div>` that spring-animates position between tabs). No text labels — SF Symbol SVGs at 24pt only.
- [ ] Build `AppLayout` with `AnimatePresence` + `pushVariants`/`popVariants` page transitions and `sheetBackgroundVariants` iOS 26 scale-behind binding — reads `useSheetStore((s) => s.isOpen)` (Design System §3.5)
- [ ] Implement all 6 Framer Motion spring presets in `lib/motion/springs.ts` and page/sheet/banner variants in `lib/motion/variants.ts` (Design System §3.5)

**Three-Phase Routine Builder**
- [ ] `RoutinePhaseTabs` — three tabs at the top of the builder: **Warm-Up | Workout | Stretch**
  - Each tab shows its own ordered exercise list independently
  - Active tab persisted in URL query param (`?phase=warmUp`) so deep links work
  - Active indicator: `<motion.div layoutId="phase-tab" />` underline/pill that spring-animates between tab positions (`springSnappy`) — do **not** use CSS class swap
- [ ] `PhaseExerciseList` — drag-to-reorder within a phase using `@dnd-kit/sortable`
- [ ] `RoutineExerciseRow` — per-exercise config row:
  - Warm-Up & Workout: sets, target reps, rest time (sec), weight (if not bodyweight)
  - Stretch: sets, hold duration (sec), rest time (sec) — reps and weight hidden
- [ ] `RoutineSummaryBar` — floating bottom bar showing per-phase time + total, and total estimated calories

**Exercise Picker (shared across all three phases)**
- [ ] `ExercisePickerSheet` — bottom sheet opened when user taps "Add Exercise" in any phase
  - `SourceToggle` — Library | My Exercises (filters between seeded and custom)
  - `ExerciseSearchBar` — debounced search across both `fitforge_exercises` and `fitforge_custom_exercises`
  - Filter panel — by `bodyPart`, `equipment`, `difficulty`, `category`
  - `ExerciseCard` — equipment badge, difficulty chip; tap to add to the currently active phase
  - `ExerciseDetail` sheet — instructions, description, target + secondary muscles

**Custom Exercise Creation**
- [ ] `CreateCustomExerciseButton` — visible in `ExercisePickerSheet`, opens `CustomExerciseForm`
- [ ] `CustomExerciseForm` — create a new exercise saved to `fitforge_custom_exercises`:
  - Fields: name, description, body part, equipment (free text or preset chips)
  - Target muscle, secondary muscles (multi-select chips)
  - Difficulty (beginner / intermediate / advanced)
  - Category (strength / cardio / stretching / plyometrics)
  - **Phase hint** (Warm-Up / Workout / Stretch) — non-binding default, pre-selects when opened from a specific tab
- [ ] Custom exercise list view in `My Exercises` — edit and delete owned exercises
- [ ] Custom exercises resolve muscle data through the same `MUSCLE_MAP` as library exercises (see Design System doc)

**PT Feature 4 — Warm-Up Set Generator (Routine Configuration)**
- [ ] `WarmUpGeneratorToggle` on every Workout-phase exercise row where `equipment` ≠ `body weight`
  - When toggled on, auto-populates the Warm-Up phase with four progressive load sets:
    - 40% of working weight × 8 reps
    - 60% × 5 reps
    - 80% × 3 reps
    - 90% × 1 rep
  - Generated warm-up rows are fully editable and deletable like any manually added item
  - Toggle state and generated sets are stored on the routine document so they persist across edits
  - If the user has already added warm-up items for that exercise, generated sets are appended, not duplicated
- [ ] `WarmUpGeneratorBadge` on `RoutineExerciseRow` — a small indicator showing "Auto warm-up on" so the user always knows the state

**PT Feature 3 — Progressive Overload Templates (Routine Configuration)**
- [ ] `ProgressionSchemeSelector` — optional per-exercise dropdown in the Workout tab:
  - **None** (default — static sets/reps/weight, no auto-progression)
  - **Linear** — configure: step size (kg/lbs) and frequency (every N sessions)
  - **Double Progression** — configure: rep range floor/ceiling and weight step on ceiling breach
  - **Undulating** — configure: Heavy / Moderate / Light day % of working weight; app rotates day types automatically
- [ ] Progression config saved into `RoutineExerciseConfig.progressionScheme` on the routine document
- [ ] `ProgressionSchemeBadge` shown on `RoutineExerciseRow` — displays active scheme name (e.g. "Linear +2.5kg") at a glance

**Misc**
- [ ] Unit toggle (kg ↔ lbs) — stored in profile, persisted to `fitforge_profile`
- [ ] Routine CRUD: save, rename, duplicate, delete (all to `fitforge_routines` PouchDB)

### Deliverable

Full routine creation flow end-to-end across all three phases, including custom exercise creation, per-phase estimated time + calorie preview, warm-up generator toggle, and progression scheme selection.

---

## Phase 3 — Workout Execution Engine

**Duration:** ~3 weeks  
**Goal:** The core daily-use workout experience.

### Tasks

**Phase Progression & Transitions**
- [ ] `WorkoutExecution` page with a three-phase progression state machine (warmUp → workout → stretch)
- [ ] `PhaseProgressBar` — persistent top indicator showing which phase is active and how many exercises remain per phase
- [ ] `PhaseTransitionBanner` — full-screen interstitial card displayed between phases:
  - e.g. *"Warm-Up Complete! Great work. Starting Workout in 10s…"*
  - Skip button to advance immediately
  - Brief summary of the just-completed phase (e.g. total warm-up time)
  - **iOS 26 sheet scale effect:** banner uses `.glass-sheet` (`border-radius: 28pt 28pt 0 0`); the underlying workout page content must apply `sheetBackgroundVariants` (`scale: 0.92, brightness(0.60)`) while the banner is open — wire via `useSheetStore.openSheet('phase-transition')` on mount and `closeSheet()` on dismiss (S-14 spec)
- [ ] Exercise queue scoped to the **current phase only** — user sees upcoming exercises within the active phase, not the entire session

**Set Execution**
- [ ] `ActiveSetCard` — large tap targets (min 64×64px); adapts layout per phase:
  - Warm-Up / Workout: shows rep counter + weight
  - Stretch: shows `HoldTimer` (countdown from `holdSec`), no weight display
- [ ] **Manual logging mode** — tappable +/− rep counter, inline weight editor
- [ ] **`useAutoCount` hook** — metronome-based rep counting with configurable duration
  - 3-second animated countdown before counting begins
  - Haptic feedback (`navigator.vibrate`) on each rep and on completion
  - User can tap to stop early if they fail before target reps
- [ ] `HoldTimer` — simple countdown for stretch holds; vibrates when hold time reached
- [ ] `RestTimer` — full-screen countdown overlay (S-13 spec):
  - Material: `.glass-sheet` applied full-screen (`position: fixed, inset: 0`), **no** top border-radius since it covers the entire viewport. `backdrop-filter: blur(60px)`. Underlying exercise GIF bleeds through the glass.
  - Ring: `180pt` diameter SVG circle, `12pt` stroke, `stroke-linecap: round`. Fill colour `#C5F74F` (lime), depleting clockwise via `strokeDashoffset` + `useMotionValue`. Background ring track `rgba(255,255,255,0.08)`.
  - Time text: SF Pro 800, 56px, `#F5F5F5`, tabular. Shifts to `#FF453A` (danger red) when ≤10s remaining.
  - Entry/exit: `sheetVariants` — `y: 100% → 0` (`springGentle`), `y: 0 → 100%` (`springSnappy`). Page content behind does **not** scale (no `sheetBackgroundVariants` here — RestTimer is a lightweight overlay, not a modal sheet).
  - +30s / −30s glass pill adjustment buttons; "SKIP REST" `.glass` outline button.
  - Auto-dismiss: ring pulses (opacity 1→0→1→0→1) when countdown reaches 0:00, then overlay dismisses. Haptic `[100,50,100]`.
  - Skip button: haptic `[100,50,100]`; vibration alert at 10s remaining.
  - Auto-advances to next set on expiry.
  - Shorter default rest: warm-up = 30s, workout = user-configured, stretch = 10s.

**PT Feature 4 — Warm-Up Set Generator (Execution)**
- [ ] During session start, inspect the routine's warm-up generator flags and auto-create the warm-up exercise entries in session state if not already present
- [ ] Auto-generated warm-up sets display their target weight in a muted style (e.g. "32kg — Auto") to distinguish them from manually set items
- [ ] If the user modifies the working weight mid-session, auto-generated warm-up percentages recompute in real time

**PT Feature 2 — RPE Collection**
- [ ] RPE prompt after each **workout** phase set only — inline bottom sheet, emoji scale (😴 🙂 😤 😰 🔥) mapping to 2 / 4 / 6 / 8 / 10
  - Appears automatically 1 second after the "Set Complete" tap; dismisses on selection or after 8 seconds (defaults to no RPE logged)
  - RPE not collected during warm-up or stretch phases
  - Running average RPE displayed on the `PhaseProgressBar` during the workout phase
- [ ] RPE values stored per-set in the workout session document
- [ ] Post-workout: surface session average RPE in `PostWorkoutSummary` alongside intensity score

**Other**
- [ ] **Freestyle mode** — user can add exercises (from library or custom) to any of the three phases on the fly during an active session
- [ ] Session **pause / resume** — full three-phase state (including current phase and exercise index) written to PouchDB on every set completion

### Deliverable

A complete workout can be started and carried through all three phases (Warm-Up → Workout → Stretch) with smooth transitions, auto-generated warm-up sets, and per-set RPE collection.

---

## Phase 4 — Post-Workout Insights & Rewards

**Duration:** ~2 weeks  
**Goal:** The feedback loop that keeps users coming back.

### Tasks

- [ ] `PostWorkoutSummary` page:
  - Actual calories (`calculateCalories()` with real reps + RPE)
  - Actual duration vs. estimated delta (`getTimeDelta()`)
  - Intensity score (average RPE × completion rate)
- [ ] **`react-body-highlighter` integration**:
  - Build `exerciseToHighlighterData()` muscle mapping (see Design System doc)
  - Render anterior + posterior body views side-by-side with color-coded intensity
- [ ] **PR detection** — `detectPRs()` comparing completed sets against historical bests stored in `fitforge_profile`
- [ ] `PRBadges` component — animated badge reveal for each record broken
- [ ] **XP calculation** — `calculateSessionXP()` including PR bonuses and streak multiplier
- [ ] `XPCelebration` animation — confetti layer using Framer Motion, level-up screen (S-15 7-step choreography):
  1. `0ms` — XP burst particles, `springCelebration`, full-screen scatter
  2. `200ms` — Hero card fade + scale `0.9 → 1.0`, `springGentle`
  3. `500ms` — XP progress bar fill `0 → {pct}%`, `springGentle` over 0.8s
  4. `700ms` — Stat cards stagger `y: 16 → 0` + opacity, 0.08s each
  5. `1200ms` — PR badges stagger scale `0 → 1.2 → 1.0`, `springCelebration`, 0.12s each
  6. `1600ms` — Muscle heatmap opacity `0 → 1`, muscle fills animate colour
  7. `2000ms` — RPE donut chart fills anti-clockwise, `springGentle`
- [ ] Workout log history — chronological list with tap-to-expand session detail view
- [ ] Share card generator — single image summarising the session (Web Share API)

### Deliverable

Full reward loop: complete workout → see muscle heatmap → earn XP → celebrate PRs.

---

## Phase 5 — Dashboard & Analytics

**Duration:** ~2 weeks  
**Goal:** The monitoring layer that builds long-term engagement.

### Tasks

**Core Dashboard**
- [ ] `WorkoutCalendar` — monthly heatmap (days trained visualised by color intensity)
  - Built on PouchDB `allDocs` with ISO-date prefix range queries
- [ ] `RecoveryMeter` card — `calculateEnergyScore()` with daily manual feel prompt on app open
- [ ] **iOS 26 Large Title collapse** — implement `useScrollTitle` hook (Design System §3.5) on the Dashboard: `largeTitleOpacity` fades `1→0` over first 56pt of scroll; `inlineTitleOpacity` fades `0→1` over 40–72pt range. Drives the `.glass-nav-bar` compact title and the hero Large Title simultaneously via `useTransform` + `useMotionValue`.
- [ ] Personal volume trend charts — sets × reps × weight over time, per exercise (Recharts)
- [ ] Body part frequency chart — which muscle groups have been trained most/least this month

**PT Feature 1 — Movement Pattern Fatigue Warnings**
- [ ] `useFatigueWarnings` hook — runs before a session starts:
  1. Pull all workout sessions from the last 72 hours from `fitforge_workouts`
  2. Flatten all `target` and `secondaryMuscles` values from the workout-phase exercises
  3. Count volume load per muscle group (`sets × reps × weight` summed per muscle)
  4. Compare against the planned routine's muscle engagement profile
  5. For any muscle group exceeding the fatigue threshold, emit a warning object
- [ ] `FatigueWarningBanner` — displayed on the routine detail page before the user taps "Start":
  - Lists each flagged muscle, its accumulated load %, and a suggested action (reduce load / substitute)
  - User can acknowledge and proceed, or swap exercises before starting
  - Dismissible; never blocks the workout entirely
- [ ] Fatigue threshold configurable in user profile (default: > 60% of personal weekly average for that muscle in a 72h window)
- [ ] In analytics: `MuscleRecoveryTimeline` chart — shows each major muscle group's last-trained date and estimated readiness %

**PT Feature 3 — Progressive Overload Templates (Live Session Target Display)**
- [ ] `SessionTargetBadge` on `ActiveSetCard` — shows today's target derived from progression scheme:
  - Linear: *"Target: 62.5kg × 10"* (last logged weight + step)
  - Double Progression: *"Target: 60kg × 12"* (push to rep ceiling before adding weight)
  - Undulating: *"Today: Heavy — Target: 65kg × 6"*
- [ ] `ProgressionHistorySheet` — tap on `SessionTargetBadge` to see the last 5 sessions for that exercise with a trend sparkline
- [ ] Progression calculations read from `fitforge_workouts` history; purely client-side, no server needed

**PT Feature 5 — Deload & Recovery Week Scheduler (Detection)**
- [ ] `useDeloadDetector` hook — evaluates after every completed session:
  1. Count consecutive training weeks in the `fitforge_workouts` DB (a week with ≥ 2 sessions counts as a training week)
  2. If ≥ 3 consecutive training weeks detected and no deload week logged: flag deload as suggested
  3. Cross-check with `RecoveryMeter` score — if score < 40 for 3 consecutive days, escalate to "strongly recommended"
- [ ] `DeloadSuggestionCard` on the dashboard:
  - Shows training block summary: *"You've completed 3 weeks of progressive loading"*
  - Projected trajectory graphic: *Accumulation × 3 → Deload × 1 → New baseline*
  - Two CTAs: **"Plan Deload Week"** (opens deload routine wizard) and **"Remind Me Later"** (snooze 3 days)
- [ ] `DeloadRoutineWizard` — generates a deload variant of the user's most recent routine:
  - Reduce all working weights by 40–50%
  - Reduce sets to 2 per exercise (was 3–4)
  - Keep movement patterns identical to preserve motor patterns
  - Saves as a separate routine named *"[Routine Name] — Deload"*
- [ ] Deload weeks logged with a `isDeload: true` flag on `WorkoutSession`; calendar view renders them in a distinct muted color

### Deliverable

Full dashboard live with recovery score, calendar, analytics, fatigue warnings, live progression targets, and deload detection.

---

## Phase 6 — Advanced Coaching Features

**Duration:** ~1 week  
**Goal:** PT-level features that differentiate from generic trackers.

### Tasks

**PT Feature 2 — RPE Adaptive Set Scaling (Suggestions)**
- [ ] `useRpeAdvisor` hook — runs after session save, analyses RPE trend:
  - If **average RPE > 9 for the last 2 sessions** on a given exercise: generate a "reduce load" suggestion (−5% or −10% of last weight)
  - If **average RPE ≤ 6 for the last 3 sessions** on a given exercise: generate a "progress load" suggestion (+2.5kg or +1 rep)
  - Suggestions are stored in `fitforge_profile.pendingCoachingNotes` — never auto-applied
- [ ] `CoachingNoteCard` on the dashboard and on the routine detail page:
  - Shows per-exercise suggestions: *"Bench Press — RPE avg 9.3 last 2 sessions. Try 57.5kg next session."*
  - Two actions per note: **"Apply to Routine"** (updates the routine's target weight) and **"Dismiss"**
  - Applied suggestions log to the session history for audit trail
- [ ] RPE trend sparkline on `ProgressionHistorySheet` (from Phase 5) — shows RPE alongside weight over time so the user can visually see correlation
- [ ] **Key principle enforced in UI copy:** every suggestion is explicitly framed as a recommendation; no automatic changes are ever applied without user confirmation

**PT Feature 5 — Deload Week Scheduler (Full UI)**
- [ ] `DeloadWeekView` — dedicated dashboard section when a deload is active:
  - Shows deload routine with reduced loads pre-filled
  - Progress bar: *"Deload Day 3 of 7"*
  - Motivational copy: *"Recovery is training. Your CNS is adapting."*
- [ ] Post-deload: `DeloadCompleteCard` shows projected new strength baseline and XP bonus earned for completing the deload block
- [ ] Deload history visible in `WorkoutCalendar` (muted teal blocks distinct from regular training days)

**PT Feature 3 — Undulating Periodization Day Indicator**
- [ ] Day-type banner on the dashboard home screen: *"Today is a Heavy Day 🏋️"* / *"Today is a Light Day 💨"*
  - Derived from the undulating scheme rotation and last session date
- [ ] Day-type indicator also shown on the routine card in the routine list before starting

**Notifications**
> **Note:** The onboarding screens (S-01–S-04: Splash, Welcome, Goals, Profile Setup) were moved to **Phase 1** — they must exist before the MVP. Web Push notifications are the only new addition here.
- [ ] **Web Push notifications**:
  - Rest day reminders (configurable schedule)
  - Streak alerts (*"Train today to keep your 7-day streak"*)
  - Deload week prompts when `useDeloadDetector` fires
  - RPE coaching notes (*"You have a new suggestion for Bench Press"*)

### Deliverable

Full adaptive coaching layer active: RPE-driven load suggestions, deload week UI, undulating day indicators, and coaching notifications.

---

## Phase 7 — Cloud Sync (CouchDB)

**Duration:** ~2 weeks (parallel track — can begin any time after Phase 1)  
**Goal:** Multi-device support and cloud backup.

### Tasks

- [ ] Deploy CouchDB instance (self-hosted) or provision IBM Cloudant
- [ ] Implement `startSync()` with JWT auth and exponential backoff (see Architecture doc)
- [ ] Listen to `online`/`offline` window events to start/pause sync automatically
- [ ] **Conflict resolution UI** — diff-style merge view for `routine` document conflicts
- [ ] User account creation and login (email + password; no social auth required for MVP)
- [ ] Sync status indicator in the app (synced / syncing / offline)
- [ ] **Export** — download all personal data as JSON or CSV (data ownership)

### Deliverable

Seamless data sync across devices with graceful offline fallback.

---

---

## PT Assessment Feature Tracking

All five features from [01-trainer-assessment.md](./01-trainer-assessment.md) are fully accounted for across the implementation phases:

| PT Feature | Phase 2 | Phase 3 | Phase 5 | Phase 6 |
|---|:---:|:---:|:---:|:---:|
| **1 — Movement Pattern Fatigue Warnings** | | | ✅ Detection + UI | |
| **2 — RPE & Adaptive Set Scaling** | | ✅ Collection per set | | ✅ Suggestions + CoachingNoteCard |
| **3 — Progressive Overload Templates** | ✅ Scheme config in builder | | ✅ Live session targets | ✅ Undulating day indicator |
| **4 — Warm-Up Set Generator** | ✅ Toggle + config in builder | ✅ Auto-execution in session | | |
| **5 — Deload & Recovery Week Scheduler** | | | ✅ Detection + wizard | ✅ Full deload week UI |

---

## Technology Checklist

| Package | Version | Purpose |
|---|---|---|
| `next` | 15.x | Framework |
| `@phosphor-icons/react` | 2.x | Icon library — SF Symbol proxy; used behind `<Icon />` wrapper (Architecture §2.9) |
| `pouchdb` | latest | Local-first database — **5 instances:** `fitforge_exercises`, `fitforge_custom_exercises`, `fitforge_routines`, `fitforge_workouts`, `fitforge_profile` |
| `pouchdb-find` | latest | PouchDB query plugin |
| `react-body-highlighter` | latest | Muscle heatmap |
| `zustand` | 5.x | Global state — stores: `useSessionStore`, `useProfileStore`, `useSettingsStore`, `useSheetStore` (iOS 26 sheet-scale background control) |
| `@tanstack/react-query` | 5.x | Async/cache state |
| `@ducanh2912/next-pwa` | latest | PWA / service worker |
| `framer-motion` | 12.x | **Primary animation layer** — page transitions, spring presets, gesture-driven sheets, layout animations |
| `recharts` | 2.x | Analytics charts |
| `@dnd-kit/sortable` | latest | Drag-to-reorder routines (Framer Motion `layout` handles the reorder animation) |
| `tailwindcss` | 4.x | Utility CSS |
| *(no icon library)* | — | SF Symbols SVG exports only — see Design System §3.2 |
| *(no custom font)* | — | `-apple-system` / `SF Pro` system stack — see Design System §3.1 |

---

## Definition of Done (per Phase)

A phase is considered **done** when:
1. All tasks are checked off
2. The app builds without TypeScript errors (`tsc --noEmit`)
3. The app installs as a PWA and the key flows work fully offline
4. PouchDB documents for new features are validated against their TypeScript interfaces
5. Tested on a real mobile device (iOS Safari + Android Chrome minimum)
