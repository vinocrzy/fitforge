# Task 6 — Screen-by-Screen UI/UX Specifications

> **Senior Designer's Note:** Every screen in this document is grounded in three things simultaneously: the **iOS 26 Liquid Glass** design language (§3.1–3.2), the **FitForge brand identity** (§3.0 — lime `#C5F74F`, OLED black `#0B0B0B`, bold SF Pro), and the **reference design** (dark-first fitness UI with full-bleed athlete photography, glassmorphism overlays, and oversized stat numerals). A developer reading this document should be able to build every screen without further design input.

---

## Screen Inventory

| # | Screen | Route | Phase |
|---|--------|--------|-------|
| S-01 | Launch / Splash | `/splash` | Phase 1 |
| S-02 | Onboarding — Welcome | `/onboarding/welcome` | Phase 1 |
| S-03 | Onboarding — Goals | `/onboarding/goals` | Phase 1 |
| S-04 | Onboarding — Profile Setup | `/onboarding/profile` | Phase 1 |
| S-05 | Dashboard (Home) | `/` | Phase 2 |
| S-06 | Exercise Library | `/exercises` | Phase 2 |
| S-07 | Exercise Detail | `/exercises/[id]` | Phase 2 |
| S-08 | Routine Builder | `/routines/[id]/edit` | Phase 2 |
| S-09 | Routine Detail (Preview) | `/routines/[id]` | Phase 2 |
| S-10 | Workout Execution — Warm-Up | `/session/[id]/warmup` | Phase 3 |
| S-11 | Workout Execution — Main Workout | `/session/[id]/workout` | Phase 3 |
| S-12 | Workout Execution — Stretch | `/session/[id]/stretch` | Phase 3 |
| S-13 | Rest Timer (overlay) | overlay on S-11 | Phase 3 |
| S-14 | Phase Transition Banner | overlay on S-10/S-11 | Phase 3 |
| S-15 | Post-Workout Summary | `/session/[id]/summary` | Phase 4 |
| S-16 | Workout History | `/history` | Phase 5 |
| S-17 | History — Session Detail | `/history/[id]` | Phase 5 |
| S-18 | Profile & Stats | `/profile` | Phase 5 |

---

## Global Layout Rules

Applied to every screen without exception:

```
Viewport:    375 × 812pt (iPhone 14 base; scales fluidly)
Safe area:   env(safe-area-inset-top/bottom) — never clip under notch or home bar
H margin:    16pt left/right on all page content
Bottom nav:  72pt pill, fixed, bottom: calc(8pt + env(safe-area-inset-bottom))
             left: 16pt, right: 16pt — floating, NOT edge-to-edge
Top bar:     Liquid Glass (.glass-nav-bar), transparent, floats over content
             Height: 44pt + env(safe-area-inset-top)
```

---

## S-01 — Launch / Splash

**Purpose:** Brand moment. Sub-second. Must load and hand off within 300ms of JS hydration.

### Layout

```
┌─────────────────────────────┐
│                              │  ← full-bleed background
│   [ATHLETE FULL-BLEED IMG]   │     GIF frame 1 (static, no animation)
│   (covers entire screen)     │
│                              │
│  ┌──────────────────────┐   │
│  │  ░░░░  FITFORGE  ░░░░│   │  ← wordmark, vertically centred, slightly above mid
│  └──────────────────────┘   │
│                              │
│  [████████░░░░░░░░░░░░░░]   │  ← linear progress bar, 2pt height, lime
│                              │     bottom: 80pt from screen bottom
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Background | Full-bleed athlete photo — dark, desaturated. Overlay: `linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)` |
| Wordmark | `FITFORGE` — SF Pro 800, 42px, `#C5F74F`, letter-spacing `-0.04em` |
| Wordmark glow | `text-shadow: 0 0 40px rgba(197,247,79,0.5)` |
| Tagline | *"Build. Track. Dominate."* — SF Pro 400, 15px, `rgba(245,245,245,0.60)`, margin-top 8pt |
| Progress bar | `width: calc(100% - 64pt)`, `height: 2pt`, `border-radius: 2pt`, bg `rgba(255,255,255,0.12)`, fill `#C5F74F` |
| Progress bar animation | Framer Motion `useMotionValue` 0→100% over 600ms, `easeOut` |
| Duration | 600–800ms then push-transition to `/onboarding/welcome` or `/` |
| Transition out | `pushVariants` — content exits left, next screen enters from right |

---

## S-02 — Onboarding: Welcome

**Purpose:** First impression. Sell the value proposition. Single CTA.

### Layout

```
┌─────────────────────────────┐
│  [FULL-BLEED ATHLETE PHOTO] │  ← takes up top 65% of screen
│                              │
│  ████████████████████████   │  ← gradient scrim over bottom 50% of photo
│                              │
├─────────────────────────────┤
│  ●  ○  ○  ○                 │  ← progress dots (step 1 of 4), top-left of card
│                              │
│  Build the                   │  ← Large Title, 34px, 800, #F5F5F5
│  Body You Want.              │
│                              │
│  Track every lift, rest      │  ← Body, 17px, 400, rgba(245,245,245,0.60)
│  better, grow faster.        │
│                              │
│  [  GET STARTED  ]           │  ← Primary pill button, full-width, lime
│                              │
│  Already have an account?    │  ← Footnote, centred, rgba(245,245,245,0.45)
│  Sign in                     │    "Sign in" is lime
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Photo | Top `65vh`, `object-fit: cover`, athlete mid-rep or sprint. Scrim: `linear-gradient(to bottom, transparent 30%, #0B0B0B 80%)` |
| Content card | Starts at y: 60vh (overlaps photo). Background `#0B0B0B`. Top padding `32pt`. |
| Progress dots | 4 dots, 6×6pt circles. Active: lime filled. Inactive: `rgba(255,255,255,0.25)` outline. Gap `6pt`. |
| Headline | SF Pro 800, 34px, `#F5F5F5`, line-height 1.15 |
| Subtext | SF Pro 400, 17px, `rgba(245,245,245,0.60)`, line-height 1.5, margin-top 12pt |
| CTA button | `PrimaryButton` — height 56pt, `border-radius: 100px`, bg `#C5F74F`, text `#0B0B0B` 600 weight 17px. Lime glow. Margin-top 32pt. |
| Swipe hint | Footnote 13px centred below button at bottom, `rgba(245,245,245,0.35)` |
| Entry animation | Headline: `y: 20 → 0`, opacity `0 → 1`, delay 0.1s. Subtext: delay 0.2s. Button: delay 0.3s. All `springGentled`. |
| Gesture | Swipe left = advance to S-03 |

---

## S-03 — Onboarding: Goals

**Purpose:** Personalise experience. Choose 1–3 primary fitness goals.

### Layout

```
┌─────────────────────────────┐
│  ←                           │  ← back chevron, top-left, safe area
│  ●  ●  ○  ○                 │  ← progress dots
│                              │
│  What's your                 │  ← Large Title 34px 800
│  main goal?                  │
│  Choose up to 3.             │  ← Body 17px 400 muted
│                              │
│  ┌──────────┐ ┌──────────┐  │  ← 2-column goal cards
│  │[figure.  │ │[figure.  │  │    icons are SF Symbol SVGs (not emoji)
│  │ strength │ │ run]     │  │    see Icon column in Goal Card table below
│  │ training]│ │  Cardio  │  │
│  │  Muscle  │ │          │  │
│  │  Gain    │ │          │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │[bolt.    │ │[figure.  │  │
│  │ fill]    │ │flexibil- │  │
│  │ Athletic │ │ ity]     │  │
│  │          │ │Flexibility│ │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │[flame.   │ │[scale.3d]│  │
│  │ fill]    │ │          │  │
│  │ Fat Loss │ │ Maintain │  │
│  └──────────┘ └──────────┘  │
│                              │
│  [  CONTINUE  ] (inactive)   │  ← disabled until ≥1 selected
└─────────────────────────────┘
```

### Goal Card SF Symbol Icons

> Per Design System §3.0 and §3.2: **SF Symbols only** — no emoji. Export SVGs at 28pt.

| Goal | SF Symbol | 
|------|-----------|
| Muscle Gain | `figure.strengthtraining.traditional` |
| Cardio | `figure.run` |
| Athletic | `bolt.fill` |
| Flexibility | `figure.flexibility` |
| Fat Loss | `flame.fill` |
| Maintain | `scale.3d` |

### Goal Card States & Dimensions

| State | Background | Border | Text |
|-------|-----------|--------|------|
| Default | `--color-surface` `#141414` | `1px solid rgba(255,255,255,0.08)` | `#F5F5F5` |
| Selected | `rgba(197,247,79,0.12)` | `1.5px solid #C5F74F` | `#C5F74F` |
| Pressed | scale `0.96` via `springSnappy` | — | — |

| Element | Spec |
|---------|------|
| Card size | `(50% - 24pt)` wide, `88pt` tall, `border-radius: 20pt` |
| Grid gap | `12pt` col, `12pt` row |
| Icon | SF Symbol SVG, 28pt, in rounded square `32×32pt`, `border-radius: 10pt`. Default bg `rgba(255,255,255,0.06)`, selected bg lime 15% opacity |
| Label | SF Pro 600, 15px |
| Selection animation | border colour morphs via Framer Motion `animate={{ borderColor }}`, background cross-fades |
| Continue button | Disabled: bg `rgba(197,247,79,0.25)`, text `rgba(11,11,11,0.45)`. Active: full lime + glow |

---

## S-04 — Onboarding: Profile Setup

**Purpose:** Collect bodyweight, unit preference, experience level.

### Layout

```
┌─────────────────────────────┐
│  ←                           │
│  ●  ●  ●  ○                 │
│                              │
│  Tell us about               │  ← Large Title
│  yourself.                   │
│  We'll personalise           │  ← Body muted
│  your experience.            │
│                              │
│  ┌─────────────────────────┐ │
│  │  Bodyweight      75 kg  │ │  ← Number picker row
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │  Unit          kg / lbs │ │  ← Toggle switch row
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │  Experience     Beginner│ │  ← Segmented control row
│  │              [B][I][A]  │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │  Date of birth  —/—/—  │ │  ← Tappable row → date picker sheet
│  └─────────────────────────┘ │
│                              │
│  [  LET'S GO  ]              │
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Form rows | `border-radius: 14pt`, bg `--color-surface` (#141414), `height: 56pt`, `padding: 0 16pt`. Separator `rgba(255,255,255,0.08)` 1px between adjacent rows |
| Row label | SF Pro 400, 17px, `#F5F5F5` |
| Row value | SF Pro 500, 17px, `#C5F74F` (lime), right-aligned |
| Number picker | Inline drum-roller style — Framer Motion `drag="y"` with snapping, tabular numerals |
| kg / lbs toggle | Custom switch — pill shaped `48×28pt`, lime when on. Framer Motion `layout` transition on thumb |
| [B][I][A] segmented | `border-radius: 10pt`, selected segment bg `#C5F74F`, text `#0B0B0B`, 600 weight. Unselected: `rgba(255,255,255,0.10)` bg |
| LET'S GO button | Disabled until all fields filled. Same `PrimaryButton` spec. |
| Entry | Each row staggers in `y: 16 → 0`, opacity `0 → 1`, 0.05s per row |

---

## S-05 — Dashboard (Home)

**Purpose:** Daily hub. Recovery status, today's workout, recent activity, quick start.

### Layout

```
┌─────────────────────────────┐  ← status bar
│  [LIQUID GLASS NAV BAR]      │  ← "Good morning, Alex" + avatar/initials
├─────────────────────────────┤
│  SCROLL CONTENT:             │
│                              │
│  ┌─────────────────────────┐ │  ← Recovery / Energy Meter card
│  │  ██████████░░  82%       │ │    lime arc ring, large "82" numeral
│  │  Recovery Score          │ │    subtitle: "Great — train hard today"
│  └─────────────────────────┘ │
│                              │
│  ─ TODAY'S WORKOUT ──────── │  ← Section header
│  ┌─────────────────────────┐ │
│  │ [ATHLETE PHOTO BG]       │ │  ← Hero card: today's scheduled routine
│  │ ░░░ scrim overlay        │ │
│  │ Push Day A               │ │    Title 28px 800, bottom-left
│  │ 8 exercises • 45 min     │ │    muted caption
│  │            [▶ START]     │ │    lime pill button bottom-right
│  └─────────────────────────┘ │
│                              │
│  ─ WEEKLY ACTIVITY ─────── │
│  [M][T][W][T][F][S][S]       │  ← Calendar ring strip
│                              │
│  ─ QUICK STATS ──────────── │
│  ┌──────────┐ ┌──────────┐  │  ← 2-up stat cards
│  │  12       │ │  3,840   │  │
│  │  Workouts │ │  kcal    │  │
│  │  This Mo. │ │  Burned  │  │
│  └──────────┘ └──────────┘  │
│  ┌──────────┐ ┌──────────┐  │
│  │  14       │ │  6       │  │
│  │  Day      │ │  PRs     │  │
│  │  Streak 🔥│ │  This Mo.│  │
│  └──────────┘ └──────────┘  │
│                              │
│  ─ RECENT WORKOUTS ─────── │
│  [last 3 session cards]      │
│                              │
└─────────────────────────────┘
│  [  BOTTOM NAV — GLASS  ]    │  ← Liquid Glass pill
```

### Component Specs

**Recovery Meter Card**

| Element | Spec |
|---------|------|
| Card | Full-width, `border-radius: 20pt`, bg `--color-surface`, `padding: 20pt` |
| Arc ring | SVG, `r: 52pt`, `stroke-width: 8pt`, bg stroke `rgba(255,255,255,0.08)`, fill `#C5F74F`. Animated on mount: `strokeDashoffset` 0 → value over 0.8s `springGentle` |
| Score numeral | SF Pro 800, 48px, `#C5F74F`, tabular, centred in ring |
| Score label | SF Pro 500, 14px, `rgba(245,245,245,0.55)`, below numeral |
| Status text | SF Pro 400, 15px, `#F5F5F5`, below ring |

**Hero Workout Card**

| Element | Spec |
|---------|------|
| Card | Full-width, `height: 200pt`, `border-radius: 20pt`, `overflow: hidden` |
| Photo | `object-fit: cover`, `width: 100%`, `height: 100%` |
| Scrim | `linear-gradient(to bottom, rgba(0,0,0,0) 20%, rgba(0,0,0,0.92) 100%)` |
| Title | SF Pro 800, 28px, `#F5F5F5`, `position: absolute`, bottom `52pt`, left `16pt` |
| Meta | SF Pro 400, 14px, `rgba(245,245,245,0.60)`, bottom `36pt`, left `16pt` |
| Start button | Lime pill `height: 40pt`, `padding: 0 20pt`, `border-radius: 100px`, bottom `16pt`, right `16pt`. SF Pro 600, 15px, `#0B0B0B`. On press: `scale: 0.96`, lime glow |
| Category badge | Floating glass pill top-left `16pt` margins. Category gradient as border using `background: linear-gradient(#0B0B0B, #0B0B0B) padding-box, var(--grad-*) border-box` |

**Weekly Activity Strip**

| Element | Spec |
|---------|------|
| 7 day circles | `40×40pt`, `border-radius: 50%`. Trained: filled with category gradient. Today: lime outline `2pt`. Future: `rgba(255,255,255,0.06)` |
| Day label | SF Pro 500, 11px, `rgba(245,245,245,0.45)`, centred below |
| Volume tooltip | Long-press shows callout with sets/reps — Liquid Glass popover |

**Quick Stat Cards**

| Element | Spec |
|---------|------|
| Card | `(50% - 20pt)` wide, `100pt` tall, `border-radius: 20pt`, bg `--color-surface` |
| Numeral | SF Pro 800, 34px, `#F5F5F5` |
| Label | SF Pro 400, 13px, `rgba(245,245,245,0.55)` |
| Icon | SF Symbol 22pt, top-right corner, `rgba(197,247,79,0.60)` |
| Streak card | Numeral colour `#FF9F0A` (orange, matches fire energy) |
| PR card | Numeral colour `#C5F74F` |

**Nav Bar Large Title Collapse**

The nav bar shows "Good morning, Alex" (Large Title 34px) at the top of scroll. It collapses to compact "FitForge" wordmark (17px) as user scrolls past `y: 56pt` — using `useScrollTitle` hook from §3.5.

---

## S-06 — Exercise Library

**Purpose:** Browse and search 207+ exercises. Filter by muscle, equipment, category.

### Layout

```
┌─────────────────────────────┐
│  [LIQUID GLASS NAV — "Exercises"]
│  [SEARCH BAR]                │  ← below nav bar, always visible, sticky
├─────────────────────────────┤
│  [FILTER CHIPS — horizontal scroll]
│  All | Chest | Back | Legs  │
│  Shoulders | Arms | Core…   │
│                              │
│  ┌─────────────────────────┐ │
│  │ [GIF]  Bench Press       │ │  ← Exercise row
│  │ 3×     Chest • Barbell   │ │
│  │        ●●○ Intermediate  │ │
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ [GIF]  Pull-Up           │ │
│  │        Back • Bodyweight │ │
│  └─────────────────────────┘ │
│  ... (virtualised list)      │
│                              │
└─────────────────────────────┘
│  [BOTTOM NAV]                │
```

### Specs

**Search Bar**

| Element | Spec |
|---------|------|
| Container | Full-width `height: 44pt`, `border-radius: 14pt`, bg `--color-surface-2` (#1E1E1E), `padding: 0 14pt` |
| Icon | SF Symbol `magnifyingglass`, 17pt, `rgba(245,245,245,0.40)`, left |
| Placeholder | SF Pro 400, 17px, `rgba(245,245,245,0.30)` |
| Clear button | SF Symbol `xmark.circle.fill`, appears on input: opacity `0 → 1`, `springSnappy` |
| Keyboard | `type="search"`, `returnKeyType="search"`, debounce 250ms |

**Filter Chips**

| Element | Spec |
|---------|------|
| Scroll container | `overflow-x: auto`, `scrollbar-width: none`, `padding: 12pt 0`, gap `8pt` |
| Chip default | `height: 34pt`, `border-radius: 100px`, bg `rgba(255,255,255,0.07)`, border `1px solid rgba(255,255,255,0.10)`, SF Pro 500 14px `#F5F5F5` |
| Chip active | bg `rgba(197,247,79,0.15)`, border `1.5px solid #C5F74F`, text `#C5F74F` |
| Chip icon | SF Symbol muscle/equipment icon 15pt, left of label, gap `4pt` |
| Active animation | `animate={{ backgroundColor, borderColor }}`, `springSnappy` |

**Exercise Row**

| Element | Spec |
|---------|------|
| Row height | `72pt` |
| Row bg | Transparent (list bg is `#0B0B0B`) |
| Separator | `rgba(255,255,255,0.07)` 1px, inset `72pt` from left (after GIF) |
| GIF thumbnail | `56×56pt`, `border-radius: 12pt`, `object-fit: cover`. Lazy-loaded (`<ExerciseGif />`). Skeleton shimmer while loading: `animate={{ opacity: [0.3, 0.7, 0.3] }}` loop |
| Exercise name | SF Pro 600, 17px, `#F5F5F5` |
| Meta line | SF Pro 400, 14px, `rgba(245,245,245,0.50)` — "{bodyPart} • {equipment}" |
| Difficulty dots | 3 circles `6×6pt`, gap `3pt`. Filled count = difficulty (1=beginner, 2=inter, 3=adv). Filled colour: lime, unfilled `rgba(255,255,255,0.20)` |
| Swipe right | Add to active routine — green pill slides in from right |
| Swipe left | Add to favourites — lime star badge |
| Press | Scale `0.98`, push-navigate to S-07 |
| Row mount | Stagger: `y: 8 → 0`, opacity `0 → 1`, delay `index × 0.03s`, `springSnappy` |

---

## S-07 — Exercise Detail

**Purpose:** Full exercise knowledge card — GIF demo, muscles worked, instructions.

### Layout

```
┌─────────────────────────────┐
│  ← Exercises                 │  ← nav bar, back chevron
│  [  ♡  ]  [  +  ]           │    right actions: favourite, add to routine
├─────────────────────────────┤
│  ┌─────────────────────────┐ │  ← GIF hero — large, autoplay
│  │                          │ │
│  │   [EXERCISE GIF — LARGE] │ │  height: 280pt
│  │                          │ │  border-radius: 0 (full bleed at top)
│  └─────────────────────────┘ │
│                              │
│  Bench Press                 │  ← Title 1, 28px, 800
│  ●●○ Intermediate            │  ← difficulty + category badge (gradient chip)
│                              │
│  ─ MUSCLES WORKED ─────── │
│  ┌─────┐    ┌─────┐          │  ← react-body-highlighter front + back, 40% width each
│  │ 🔴  │    │ 🔴  │          │    Primary: lime fill, Secondary: lime 40% opacity
│  │front│    │back │          │
│  └─────┘    └─────┘          │
│  ● Chest (primary)           │  ← Legend
│  ○ Triceps, Front Delts      │
│                              │
│  ─ HOW TO ───────────────── │
│  1. Lie flat on bench…       │  ← Numbered instruction steps
│  2. Grip bar shoulder-width… │    SF Pro 400, 17px, line-height 1.6
│  3. Lower bar to chest…      │    Step number in lime circle 22×22pt
│  …                           │
│                              │
│  ─ EQUIPMENT ────────────── │
│  [Barbell]  [Bench]          │  ← Equipment pill chips
│                              │
│  [  ADD TO ROUTINE  ]        │  ← Primary button, sticky bottom
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| GIF hero | `width: 100%`, `height: 280pt`, `object-fit: cover`. Loop autoplay. Gradient scrim at bottom: `rgba(0,0,0,0) → rgba(11,11,11,1)` over `40pt` |
| Title | SF Pro 800, 28px, `#F5F5F5`, `margin-top: 20pt`, `padding: 0 16pt` |
| Difficulty row | Dots + gradient category chip: SF Pro 500, 13px, chip `height: 26pt`, `border-radius: 100px`, gradient border |
| Muscle diagram | `react-body-highlighter`, `width: 45%` each model. Custom colours: primary `#C5F74F`, secondary `rgba(197,247,79,0.40)` |
| Instructions | `counter-reset: steps`. Each step: flex row, step-number circle (`22×22pt`, `border-radius: 50%`, bg `rgba(197,247,79,0.15)`, text `#C5F74F` 600), text right. `gap: 12pt`. `margin-bottom: 16pt` per step |
| Equipment chips | Same style as filter chips but non-interactive. Gap `8pt`, `flex-wrap: wrap` |
| Sticky CTA | `position: fixed`, `bottom: calc(16pt + 72pt + env(safe-area-inset-bottom))`, full-width `padding: 0 16pt`. `PrimaryButton` |
| ♡ favourite | Toggle animation: `scale 0 → 1.3 → 1.0`, `springCelebration`, fill changes from outline to `#FF453A` |
| Scroll | `overscroll-behavior: contain` — doesn't trigger pull-to-refresh |

---

## S-08 — Routine Builder

**Purpose:** Assemble exercises into a named 3-phase routine.

### Layout

```
┌─────────────────────────────┐
│  ← Routines    [Save]        │  ← nav bar
│  "Routine name…" (editable)  │  ← large title, tap to edit inline
├─────────────────────────────┤
│  ┌──────────────────────┐   │  ← Phase tab bar
│  │ Warm-Up│ Workout│Stretch│  │    3 segments, swipe-able
│  └──────────────────────┘   │
│                              │
│  [PHASE CONTENT — EXERCISE LIST]
│                              │
│  ┌─────────────────────────┐ │  ← Exercise row (draggable)
│  │ ⠿  Treadmill Walk        │ │    ⠿ = drag handle (SF: line.3.horizontal)
│  │    10 min • Warm-Up      │ │    swipe left to delete
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ ⠿  Arm Circles           │ │
│  │    2×15 reps             │ │
│  └─────────────────────────┘ │
│                              │
│  [+  Add Exercise]           │  ← Secondary button — opens ExercisePicker sheet
│                              │
│  ─────────────────────────── │
│  ┌──────────────────────────┐│  ← Summary bar (sticky bottom, above nav)
│  │ Est. 47 min • ~380 kcal  ││
│  └──────────────────────────┘│
└─────────────────────────────┘
│  [BOTTOM NAV]                │
```

### Phase Tab Bar

| Element | Spec |
|---------|------|
| Container | `border-radius: 14pt`, bg `--color-surface`, `height: 44pt`, `padding: 4pt` |
| Segment | `border-radius: 10pt`, `height: 36pt`. Active: bg `#C5F74F`, text `#0B0B0B` 600. Inactive: transparent, text `rgba(245,245,245,0.55)` |
| Active indicator | `motion.div` with `layoutId="phase-tab"` — slides between segments, `springSnappy`. NOT a CSS class toggle. |
| Phase icons | Warm-Up: `flame.fill` orange. Workout: `figure.strengthtraining.traditional` lime. Stretch: `figure.flexibility` purple. |
| Swipe | `drag="x"` on content panel to switch phase |

### Exercise Row (Routine)

| Element | Spec |
|---------|------|
| Row height | `64pt` |
| Background | `--color-surface`, `border-radius: 14pt`, `margin-bottom: 8pt` |
| Drag handle | `line.3.horizontal` SF Symbol, left, `rgba(245,245,245,0.30)`. On drag-start: row bg shifts to `--color-surface-2`, slight scale `1.02`, shadow `0 8px 32px rgba(0,0,0,0.5)` |
| Name | SF Pro 600, 17px, `#F5F5F5` |
| Sub-row | Sets × reps / duration — SF Pro 400, 14px, `rgba(245,245,245,0.50)` |
| Swipe-left delete | `x: 0 → -80pt`, reveals red trash pill. Confirm: row height animates to 0, `springSnappy`. Framer Motion `layout` on siblings so they close the gap |
| Tap (not drag) | Inline expand: row height 64 → 140pt, shows set/rep/rest config. `springGentle`. |

### Add Exercise Button

| Element | Spec |
|---------|------|
| Style | Full-width, `height: 52pt`, `border-radius: 14pt`, bg `rgba(197,247,79,0.08)`, border `1.5px dashed rgba(197,247,79,0.35)` |
| Icon | `plus.circle` lime, 22pt |
| Label | SF Pro 500, 17px, `#C5F74F` |
| Action | Opens `<ExercisePickerSheet />` (S-06 in sheet form), filtered to active phase's recommended category |

### Summary Bar

| Element | Spec |
|---------|------|
| Container | `.glass` Liquid Glass, `border-radius: 16pt`, `height: 52pt`, `margin: 0 0 12pt`, `padding: 0 20pt`. Sticky above bottom nav. |
| Content | "Est. {time} • ~{kcal} kcal" — SF Pro 500, 15px, `#F5F5F5`. Per-phase breakdown on tap (expands) |
| Phase breakdown | Framer Motion height `52 → 120pt`, shows Warm-Up / Workout / Stretch split |

---

## S-09 — Routine Detail (Preview)

**Purpose:** Read-only preview of a routine before starting. One-tap launch.

### Layout

```
┌─────────────────────────────┐
│  ← Routines   [Edit]         │
├─────────────────────────────┤
│  [HERO CARD — full width]    │  ← Category gradient overlay, routine title
│  Push Day A                  │
│  8 exercises • 47 min        │
│                              │
│  ─ MUSCLES TARGETED ─────── │
│  [react-body-highlighter]    │  ← compact front+back, width 35% each
│                              │
│  ─ WARM-UP  (3) ──────────── │  ← Collapsible section header
│  • Treadmill Walk  10 min    │
│  • Arm Circles     2×15      │
│  • Band Pull-Apart 2×12      │
│                              │
│  ─ WORKOUT  (5) ──────────── │
│  • Bench Press     4×8       │
│  • Incline DB      3×10      │
│  • Cable Fly       3×12      │
│  • Tricep Pushdown 3×15      │
│  • Push-Up         2×fail    │
│                              │
│  ─ STRETCH  (2) ──────────── │
│  • Chest Doorway   30s       │
│  • Tricep Overhead 30s       │
│                              │
│  [  START WORKOUT  ]         │  ← Sticky primary button, lime glow
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Hero card | `height: 180pt`, full-width, `border-radius: 20pt`, category gradient overlay. Routine title SF Pro 800, 28px, bottom-left of card |
| Section header | SF Pro 600, 15px, `rgba(245,245,245,0.50)`, uppercase, letter-spacing `0.06em`. Lime count badge right |
| Exercise line | SF Pro 400, 17px, `#F5F5F5`. Value (sets×reps) right-aligned, `rgba(245,245,245,0.55)` |
| Collapsible | Tap section header to collapse/expand. Height animated with `springGentle`, `overflow: hidden` |
| Muscle diagram | Highlights all muscles across all 3 phases. Primary = lime, secondary = lime 40% |
| Start button | Sticky, `position: fixed`, bottom `calc(16pt + 72pt + env(safe-area-inset-bottom))`. `PrimaryButton`. On press: push-transition to S-10 |

---

## S-10 — Workout Execution: Warm-Up

**Purpose:** Guide through warm-up phase. Low-intensity, focus on form and readiness.

### Layout

```
┌─────────────────────────────┐
│  ╳  FitForge     [00:04:32] │  ← glass nav: close (end session) + elapsed timer
├─────────────────────────────┤
│  [PHASE PROGRESS BAR]        │
│  [●──────────] Warm-Up       │  ← 3-segment bar: filled, upcoming, upcoming
│                              │
│  ┌─────────────────────────┐ │  ← Active exercise card (DOMINANT)
│  │  [GIF — autoplay]        │ │    height: 240pt
│  │                          │ │
│  │  Arm Circles             │ │  ← SF Pro 800, 28px
│  │  2 × 15 reps             │ │  ← SF Pro 400, 17px muted
│  └─────────────────────────┘ │
│                              │
│  ┌─────┐  ┌──────────┐  ┌──┐│
│  │ −   │  │    12    │  │+ ││  ← Rep counter
│  └─────┘  └──────────┘  └──┘│  64×64pt touch targets
│                              │
│  [████████████░░░░░░░░]  2/2 │  ← Set progress bar (current set / total)
│                              │
│  ┌─────────────────────────┐ │  ← COMPLETE SET — primary button
│  │      DONE WITH SET       │ │    height: 64pt (gym-glance optimised)
│  └─────────────────────────┘ │
│                              │
│  NEXT UP:  Band Pull-Apart   │  ← muted footnote with next exercise name
│                              │
│  ─── QUEUE ───────────────── │  ← upcoming exercises in phase (mini list)
│  • Band Pull-Apart   2×12    │
│  • Treadmill Walk    10m     │
└─────────────────────────────┘
```

### Specs

**Phase Progress Bar**

| Element | Spec |
|---------|------|
| Track | Full-width `height: 4pt`, `border-radius: 4pt`, 3 equal segments separated by `4pt` gap |
| Warm-Up segment | bg `#C5F74F` when active, `rgba(197,247,79,0.25)` when complete, `rgba(255,255,255,0.12)` upcoming |
| Workout segment | bg `#C5F74F` active, `rgba(255,255,255,0.12)` upcoming |
| Stretch segment | bg `#A18CD1` (purple, matches stretch gradient) active |
| Phase label | SF Pro 600, 13px, uppercase, letter-spacing `0.05em`. Active: lime. Upcoming: muted 30% |
| Entry animation | Active segment fills left-to-right over 0.4s `easeOut` on phase start |

**Active Exercise Card**

| Element | Spec |
|---------|------|
| Card | `border-radius: 20pt`, bg `--color-surface`, `overflow: hidden` |
| GIF | `height: 240pt`, `width: 100%`, `object-fit: cover`. Loop autoplay, pauses when app is backgrounded |
| Name | SF Pro 800, 28px, `#F5F5F5`, padding `16pt`, below GIF |
| Sets × reps | SF Pro 400, 17px, `rgba(245,245,245,0.55)` |
| Card swap animation | When exercise changes: `x: 0 → -100%` exit, next card `x: 100% → 0` enter, `springDefault` |

**Rep Counter**

| Element | Spec |
|---------|------|
| Minus / Plus buttons | `64×64pt` squares, `border-radius: 20pt`, bg `--color-surface-2`. Long-press enables repeat-increment |
| Count display | Container `(screen-width - 204pt) × 64pt`, `border-radius: 20pt`, bg `--color-surface`. SF Pro 800, 48px, `#C5F74F`, tabular, centred |
| Number change animation | `y: -12 → 0`, opacity `0 → 1`, `springSnappy` — "flips" like an iOS picker |
| Haptic | `navigator.vibrate(30)` on each tap |
| Auto-count override | If `useAutoCount` detects motion, number updates automatically with slight pulse animation |

**Complete Set Button**

| Element | Spec |
|---------|------|
| Style | Full-width, `height: 64pt`, `border-radius: 20pt` (gym-glance: larger than standard pill), bg `#C5F74F`, text `#0B0B0B` 700 weight, 18px |
| Glow | `.glow-primary-strong` |
| Press animation | `scale: 1.0 → 0.96`, haptic `navigator.vibrate(50)`, lime flash |
| Success animation | Background flashes `#30D158` (green) briefly on set completion, then returns to lime. `duration: 0.3s` |
| Last set | Button text changes to "FINISH EXERCISE →" — animated text cross-fade |

---

## S-11 — Workout Execution: Main Workout

**Purpose:** Core workout experience. Max efficiency — minimal taps between sets.

Identical structural layout to S-10 with these differences:

| Element | Δ from S-10 |
|---------|-------------|
| Phase bar | Workout segment is active (lime fill) |
| Phase label | "Workout" in lime, warm-up shows filled/complete |
| Active card bg | `--color-surface` same but GIF has 2pt lime left-border accent |
| Rest timer trigger | After "DONE WITH SET": automatically triggers S-13 (Rest Timer overlay) unless rest is 0 |
| Weight selector | Visible between − / COUNT / + row and the Complete button: `[⚖ 80 kg ∧∨]` inline stepper |
| RPE prompt | After each set: inline 1-10 RPE badge slides up from bottom — `bannerVariants`, auto-dismisses in 4s. Not blocking. |
| Swipe left | Skip to next exercise (with confirmation vibration `[30,30,60]`) |
| Swipe right | View exercise instructions (slides up instruction sheet) |

### Weight Selector

| Element | Spec |
|---------|------|
| Container | `height: 52pt`, `border-radius: 14pt`, bg `--color-surface-2`, `padding: 0 16pt`, centred between counter and button |
| Icon | `scalemass.fill` SF Symbol, 18pt, `rgba(245,245,245,0.45)` |
| Weight display | SF Pro 700, 22px, `#F5F5F5`, tabular |
| Unit | SF Pro 400, 15px, `rgba(245,245,245,0.50)` |
| Increment buttons | `∧` `∨` chevron arrows, `32×32pt`, `border-radius: 10pt`, bg `rgba(255,255,255,0.06)`. Press: `rgba(255,255,255,0.12)` |
| Long-press `∧` / `∨` | Accelerated increment (×5kg/lb after 600ms hold) |

---

## S-12 — Workout Execution: Stretch

**Purpose:** Cool-down. Hold-time countdowns, not rep counting.

Identical to S-10/S-11 structure with:

| Element | Δ from S-11 |
|---------|-------------|
| Phase bar | Stretch segment active. Purple (`#A18CD1`) fill instead of lime |
| Rep counter | Replaced by `<HoldTimer />` — large countdown circle ring (same ring style as RestTimer) |
| Count display | Countdown from `holdSec` (e.g. "30") to 0. Ring depletes anti-clockwise. Ring colour purple not lime |
| Complete set button | Text: "HELD IT" instead of "DONE WITH SET". bg: `#A18CD1` (purple) instead of lime |
| Auto-advance | Option to auto-advance after hold completes with 2s delay + cancel button |
| Breathing cue | Subtle text below hold timer: "Inhale 4s • Hold 4s • Exhale 4s" — SF Pro 400, 14px, `rgba(245,245,245,0.35)` |
| No weight selector | Hidden during stretch phase |
| No RPE prompt | Not shown during stretch |

---

## S-13 — Rest Timer (Full-Screen Overlay)

**Purpose:** Timed rest between sets. Full-screen takeover so athletes can see countdown at a distance.

### Layout

```
┌─────────────────────────────┐
│  [LIQUID GLASS FULL OVERLAY] │  ← .glass-sheet but full-screen
│  ←← drag down to close ←←   │     drag handle 36×4pt at top
│                              │
│  REST                        │  ← SF Pro 800, 17px, uppercase, muted lime
│                              │
│              ╭──────╮        │  ← Outer ring: 180pt diameter, 12pt stroke
│           ╭──┤      ├──╮     │    depleting clockwise, lime
│           │  │  1:30 │  │     │    inner: elapsed indicator (complement)
│           ╰──┤      ├──╯     │
│              ╰──────╯        │
│                              │
│  NEXT: Incline DB Press      │  ← SF Pro 600, 17px, #F5F5F5, centred
│  3 × 10 reps                 │  ← SF Pro 400, 15px, muted
│                              │
│  [ −30s ]      [ +30s ]      │  ← Adjust rest duration, glass pill buttons
│                              │
│  [  SKIP REST  ]             │  ← Secondary button: glass outline, lime text
│                              │
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Overlay | `position: fixed, inset: 0`. `.glass-sheet` but full-screen (no top border-radius). `backdrop-filter: blur(60px)`. Presented over S-11. |
| Background bleed | Content of S-11 is VISIBLE through glass — athlete GIF blurs through the overlay |
| Entry | `y: 100% → 0`, `springGentle`. Page content behind stays in place (no scale). |
| Exit | `y: 0 → 100%`, `springSnappy`. Haptic: `[100,50,100]` |
| Ring diameter | `180pt` — large enough to read at arm's length in a gym |
| Ring stroke | `12pt`, `stroke-linecap: round` |
| Ring bg | `rgba(255,255,255,0.08)` full circle |
| Ring fill | `#C5F74F` depleting clockwise (SVG `strokeDashoffset` animated with `useMotionValue`) |
| Time text | SF Pro 800, 56px, `#F5F5F5`, tabular, centred in ring. Colour shifts `#F5F5F5 → #FF453A` when ≤10s remaining |
| "NEXT" label | SF Pro 800, 13px, `rgba(245,245,245,0.40)`, uppercase, letter-spacing `0.1em`, 16pt above exercise name |
| Adjust buttons | `height: 40pt`, `padding: 0 20pt`, `border-radius: 100px`, `.glass`, text lime. Tapping +30s: ring resets its depletion with a brief spring-swell animation |
| Skip button | `.glass`, `height: 52pt`, full-width, `border-radius: 14pt`. No background fill. Border `rgba(197,247,79,0.35)`. Text `#C5F74F` 600 |
| Auto-dismiss | When countdown hits 00:00: ring pulses (opacity 1→0→1→0→1), haptic `[100,50,100]`, overlay dismisses automatically |

---

## S-14 — Phase Transition Banner

**Purpose:** Celebrate phase completion. Pause before the next phase. Can be skipped.

### Layout

```
┌─────────────────────────────┐
│  [DIMMED / BLURRED CONTENT]  │  ← S-10/S-11 behind at scale 0.92, brightness 0.6
│                              │
├──────────── SHEET ───────────┤  ← .glass-sheet, slides up from bottom
│  ████████ drag handle ██████ │
│                              │
│  [ICON — large SF Symbol]    │  ← e.g. flame.fill for warm-up complete, 64pt lime
│                              │
│  Warm-Up Complete!           │  ← SF Pro 800, 28px, #F5F5F5
│  Great work. Time to lift.   │  ← SF Pro 400, 17px, muted
│                              │
│  ┌─────────┐  ┌───────────┐ │
│  │ Phase   │  │  Workout  │ │  ← Stats: exercises completed / rest time
│  │ 3 ex.   │  │  Time     │ │
│  │ done    │  │  8:42     │ │
│  └─────────┘  └───────────┘ │
│                              │
│  [  START WORKOUT  ]         │  ← Primary lime button
│  Starting in 10s…            │  ← counter below, tap button or wait
│  [ Skip countdown ]          │  ← ghost link, lime text
│                              │
└─────────────────────────────┘
```

### Specs

| Element | Spec |
|---------|------|
| Backdrop | `sheetBackgroundVariants` — page behind scales to 0.92, `filter: brightness(0.60)` |
| Sheet | `.glass-sheet`, `border-radius: 28pt 28pt 0 0`, `padding: 24pt 20pt 40pt` |
| Icon | SF Symbol 64pt in `80×80pt` circle: bg gradient matching completed phase category. `springCelebration` scale `0 → 1.2 → 1.0` |
| Headline | `springCelebration` entry, delay 0.15s after sheet opens |
| Stat cards | 2-up, `border-radius: 14pt`, bg `rgba(255,255,255,0.06)`, `.glass`. Values SF Pro 800, 24px, lime |
| Countdown text | SF Pro 500, 14px, `rgba(245,245,245,0.50)`. Tick: `useMotionValue` driving number with `springSnappy` |
| Haptic on open | `navigator.vibrate(40)` |

---

## S-15 — Post-Workout Summary

**Purpose:** Celebrate completion. Show what was achieved. Award XP and PR badges.

### Layout

```
┌─────────────────────────────┐
│  ╳   Session Complete        │  ← nav bar. X = close/done (no back)
├─────────────────────────────┤
│  [✦ XP CELEBRATION BURST]   │  ← confetti/particle overlay, full-screen, 2s
│                              │
│  ┌─────────────────────────┐ │  ← Summary hero card
│  │  💎 +450 XP              │ │    XP badge, large
│  │  Great session, Alex!    │ │    SF Pro 800, 24px
│  │  Level 12 → 13?  ██░░░   │ │    XP progress bar (lime)
│  └─────────────────────────┘ │
│                              │
│  ─ SESSION STATS ──────────  │
│  ┌──────────┐  ┌──────────┐ │
│  │  47:32   │  │  412 cal  │ │  ← Duration / Calories
│  └──────────┘  └──────────┘ │
│  ┌──────────┐  ┌──────────┐ │
│  │  16 sets │  │  82 reps  │ │  ← Volume stats
│  └──────────┘  └──────────┘ │
│                              │
│  ─ PR BADGES ──────────────  │
│  [🏆 Bench Press +5kg]       │  ← PR badge chips, spring-in staggered
│  [🏆 Push-Up +3 reps]        │
│                              │
│  ─ MUSCLES WORKED ─────────  │
│  [HEATMAP — front + back]    │  ← react-body-highlighter
│                              │
│  ─ RPE SUMMARY ────────────  │
│  Average RPE: 7.2 / 10       │  ← donut chart (Recharts)
│                              │
│  [  DONE  ]                  │  ← Primary button, goes to Dashboard
└─────────────────────────────┘
```

### Animation Sequence (choreographed)

Order matters — staggered entries create a trophy-room reveal:

| Step | Delay | Element | Animation |
|------|-------|---------|-----------|
| 1 | 0ms | XP burst particles | `springCelebration`, full-screen scatter |
| 2 | 200ms | Hero card | Fade + scale `0.9 → 1.0`, `springGentle` |
| 3 | 500ms | XP progress bar | Fill `0 → {pct}%`, `springGentle` over 0.8s |
| 4 | 700ms | Stat cards | Stagger `y: 16 → 0` + opacity, 0.08s each |
| 5 | 1200ms | PR badges | Stagger scale `0 → 1.2 → 1.0`, `springCelebration`, 0.12s each |
| 6 | 1600ms | Muscle heatmap | Opacity `0 → 1`, muscle fills animate colour |
| 7 | 2000ms | RPE chart | Donut fills anti-clockwise, `springGentle` |

### PR Badge Spec

| Element | Spec |
|---------|------|
| Badge | `height: 40pt`, `padding: 0 16pt`, `border-radius: 100px`, bg `rgba(197,247,79,0.12)`, border `1.5px solid #C5F74F` |
| Icon | `trophy.fill` SF Symbol, 18pt, `#C5F74F` |
| Text | Exercise name + delta (+5kg, +3 reps) — SF Pro 600, 15px, `#C5F74F` |
| Haptic | `navigator.vibrate([30,30,80])` on each badge entry |

---

## S-16 — Workout History

**Purpose:** Chronological log of all past sessions.

### Layout

```
┌─────────────────────────────┐
│  [NAV — "History"]          │
│  [FILTER: All | Week | Month]│  ← segmented control below nav
├─────────────────────────────┤
│  ─ THIS WEEK ──────────────  │
│  ┌─────────────────────────┐ │
│  │ Mon 24 Feb              │ │  ← Session card
│  │ Push Day A              │ │    SF Pro 600, 17px
│  │ 47:32 • 412 kcal        │ │    Meta line
│  │ [Chest][Triceps][Delts]  │ │    Muscle group pills
│  └─────────────────────────┘ │
│  ┌─────────────────────────┐ │
│  │ Wed 22 Feb  …           │ │
│  └─────────────────────────┘ │
│                              │
│  ─ LAST WEEK ──────────────  │
│  …                           │
│                              │
│  [LOAD MORE]                 │
└─────────────────────────────┘
│  [BOTTOM NAV]                │
```

### Session Card

| Element | Spec |
|---------|------|
| Card | Full-width, `border-radius: 16pt`, bg `--color-surface`, `padding: 16pt` |
| Date | SF Pro 500, 14px, `rgba(245,245,245,0.50)`, top-left |
| Workout name | SF Pro 700, 17px, `#F5F5F5` |
| Meta | SF Pro 400, 14px, `rgba(245,245,245,0.55)` — duration • calories |
| Muscle chips | `height: 26pt`, `padding: 0 10pt`, `border-radius: 100px`, bg `rgba(197,247,79,0.10)`, text `#C5F74F` 500 13px. Max 3 chips + "+N more" |
| PR indicator | If session had PRs: `trophy.fill` lime icon, top-right corner of card |
| Press | push-navigate to S-17 |
| Section header | SF Pro 700, 15px, `rgba(245,245,245,0.40)`, uppercase, letter-spacing `0.08em` |

---

## S-17 — History: Session Detail

**Purpose:** Full breakdown of a past session. Identical structure to S-15 but read-only (no animations, no XP burst).

Differences from S-15:

| Element | Δ |
|---------|---|
| Nav | Shows date and workout name. Back chevron to History. |
| XP Burst | No celebratory animation — already claimed |
| CTA | "Share Workout" → system share sheet. Secondary: "Repeat This Workout →" |
| Expandable sets | Each exercise row expands to show per-set weight/reps/RPE log |

### Per-Set Log Row

```
Bench Press          (expand ∨)
├── Set 1  80kg × 8  RPE 7
├── Set 2  80kg × 8  RPE 8
├── Set 3  82.5kg × 7  RPE 9  🏆 PR
└── Set 4  82.5kg × 6  RPE 9
```

| Element | Spec |
|---------|------|
| Set row | `height: 40pt`, `padding: 0 16pt 0 32pt` (indented). Border-left `2pt solid rgba(255,255,255,0.08)` |
| Label | "Set {n}" SF Pro 400, 15px, `rgba(245,245,245,0.50)` |
| Weight × reps | SF Pro 600, 15px, `#F5F5F5`, right-aligned |
| RPE | SF Pro 400, 13px, `rgba(245,245,245,0.40)`, after weight |
| PR marker | `trophy.fill` lime 14pt, far right |

---

## S-18 — Profile & Stats

**Purpose:** Personal stats, goal progress, settings entry point.

### Layout

```
┌─────────────────────────────┐
│  [NAV — "Profile"]  [⚙]    │
├─────────────────────────────┤
│  ┌─────────────────────────┐ │  ← Profile card
│  │  [Avatar circle 72pt]   │ │
│  │  Alex Johnson            │ │    SF Pro 800, 22px
│  │  Level 12 • 3,240 XP    │ │    SF Pro 500, 15px lime
│  │  [████████░░░░]  640/…   │ │    XP progress to next level
│  └─────────────────────────┘ │
│                              │
│  ─ GOALS ──────────────────  │
│  ┌─────────────┐  ┌────────┐ │  ← Goal progress rings
│  │ Muscle Gain │  │Cardio  │ │    Recharts radial + custom SVG
│  │  [ring 75%] │  │[ring50%│ │
│  └─────────────┘  └────────┘ │
│                              │
│  ─ MONTHLY STATS ──────────  │
│  [BAR CHART — workouts/week] │  ← Recharts BarChart, lime bars, dark bg
│                              │
│  ─ PERSONAL RECORDS ───────  │
│  [PR list — exercise + weight│
│   + date]                    │
│                              │
│  ─ SETTINGS ───────────────  │
│  • Units (kg / lbs)          │  ← Standard iOS list rows
│  • Bodyweight                │
│  • Notifications             │
│  • About FitForge            │
└─────────────────────────────┘
│  [BOTTOM NAV]                │
```

### Specs

**Profile Card**

| Element | Spec |
|---------|------|
| Card | `border-radius: 20pt`, bg `--color-surface`. Subtle gradient overlay: `linear-gradient(135deg, rgba(197,247,79,0.04) 0%, transparent 60%)` — lime corner tint |
| Avatar | `72×72pt`, `border-radius: 50%`. Initials fallback: bg lime gradient, text `#0B0B0B` 700. 2pt lime ring around it |
| Name | SF Pro 800, 22px, `#F5F5F5` |
| Level/XP | SF Pro 500, 15px. "Level 12" in `#C5F74F`. Separator `•`. XP in `rgba(245,245,245,0.55)` |
| XP bar | `height: 6pt`, `border-radius: 6pt`. Track: `rgba(255,255,255,0.10)`. Fill: lime. Animated on mount. |

**Monthly Bar Chart (Recharts)**

| Element | Spec |
|---------|------|
| Chart bg | Transparent (inherits `#0B0B0B`) |
| Bars | Fill `#C5F74F`. `borderRadius: [4,4,0,0]`. `barSize: 24` |
| Grid | `stroke: rgba(255,255,255,0.07)`, horizontal only, no vertical |
| Axes | No Y-axis line. X-axis: month labels SF Pro 400, 12px, `rgba(245,245,245,0.40)` |
| Tooltip | Liquid Glass: `background: rgba(20,20,20,0.9)`, `backdropFilter: blur(20px)`, `borderRadius: 10pt`, `border: 1px solid rgba(255,255,255,0.12)`. SF Pro 600, 14px, lime value |

**Settings Rows**

| Element | Spec |
|---------|------|
| Row | `height: 52pt`, bg `--color-surface`. Separator `rgba(255,255,255,0.08)` 1px, inset `16pt` |
| Label | SF Pro 400, 17px, `#F5F5F5` |
| Value / chevron | `rgba(245,245,245,0.45)`, right-aligned, SF Pro 400 17px. Chevron `chevron.right` SF Symbol 13pt |
| Grouped | Rows in a group share a `border-radius: 14pt` outer container (`--color-surface`). Top and bottom rows clip to container radius. |

---

## Interaction Patterns Summary

| Pattern | Used On | Framer Motion | Haptic |
|---------|---------|--------------|--------|
| Push navigation | All drill-downs | `pushVariants` | none |
| Pop navigation | Back | `popVariants` | none |
| Sheet present | Picker, rest timer, transition banner | `sheetVariants` + bg `scale 0.92` | `vibrate(20)` |
| Sheet dismiss | Drag down | `sheetVariants` exit | none |
| Tab switch | Bottom nav | `tabVariants` + `layoutId` pill | `vibrate(30)` light |
| Card press | All tappable cards | `scale 0.97` `springSnappy` | `vibrate(20)` |
| Set complete | Complete Set button | flash green → lime `springSnappy` | `vibrate(50)` |
| PR detected | Post-workout | badge `scale 0 → 1.2 → 1` `springCelebration` | `vibrate([30,30,80])` |
| Phase advance | Phase transition | `sheetVariants` + bg `scale 0.92` | `vibrate(40)` |
| Rest end | Rest timer expiry | ring pulse, auto-dismiss | `vibrate([100,50,100])` |
| Drag reorder | Routine exercise rows | Framer Motion `layout` drag | `vibrate(40)` on pick-up |
| Swipe delete | Routine rows, history | `x: 0 → -80pt`, confirm = height → 0 | `vibrate(60)` on confirm |
| Number increment | Rep counter | `y: -12 → 0` flip | `vibrate(30)` per tap |

---

## Accessibility Checklist

| Requirement | Implementation |
|-------------|---------------|
| Touch targets min 44×44pt | All buttons and interactive elements |
| Gym-glance overrides | Set controls at 64×64pt, Rest Timer ring 180pt |
| `prefers-reduced-motion` | All `Variants` wrapped in `useReducedMotion()` guard — instant opacity swap |
| WCAG AA contrast | Lime `#C5F74F` on black `#0B0B0B` = 10.1:1 (exceeds AAA). All text on surfaces meets AA |
| Dynamic Type | `font-size` in `pt` not `px` in native contexts; on web use `rem` scaled from `16px` root |
| `aria-live` regions | Rep counter, rest timer, phase label — announced to screen readers on change |
| Keyboard nav | All interactive elements have `focus-visible` ring `2pt solid #C5F74F` |
