# Task 3 — Design System Document

> **Design Mandate:** The app must feel indistinguishable from a native **iOS 26** app. iOS 26 introduced **Liquid Glass** — the most significant visual design language shift since iOS 7. Every chrome surface (tab bar, navigation bar, sheets, menus, controls) uses the Liquid Glass material: a refractive, multi-layer translucent treatment with specular edge highlights and dynamic content tinting. Framer Motion is the single animation library; no CSS `transition`, `@keyframes`, or `animate` class competes with it.

---

## 3.0 Brand Identity

### Reference Design

Visual language derived from the **Outcrowd Fitness App** Figma community file — a high-energy, dark-first fitness UI characterised by:

- Deep near-black surfaces with OLED-optimised backgrounds
- **Lime `#C5F74F`** as the single primary accent — punchy, readable, energetic
- Full-bleed athlete photography behind frosted/gradient card overlays
- Ultra-bold typography at display sizes (800–900 weight)
- Floating pill tab bar, not edge-to-edge
- Gradient category chips (per-muscle-group or workout-type colour coding)
- Circular progress rings and oversized stat numerals

### App Name & Wordmark

| Property | Value |
|---|---|
| App name | **FitForge** |
| Wordmark font | `-apple-system` Bold (800), all-caps, `letter-spacing: -0.04em` |
| Wordmark colour | `#C5F74F` on dark, `#0B0B0B` on lime |
| Tagline | *"Build. Track. Dominate."* |
| Icon concept | Anvil / forge hammer silhouette in lime on black — SF Symbol `hammer.fill` as MVP placeholder |

### Brand Colour Palette

| Role | Token | Hex | Usage |
|---|---|---|---|
| **Primary / Lime** | `--brand-lime` | `#C5F74F` | CTAs, active states, progress rings, key stats |
| Primary Dim | `--brand-lime-dim` | `#A8D93D` | Pressed/active state of lime elements |
| Primary Dark | `--brand-lime-dark` | `#6B9E1F` | Disabled states, low-contrast contexts |
| **Background** | `--brand-bg` | `#0B0B0B` | App chrome, OLED black |
| Surface 1 | `--brand-surface` | `#141414` | Default card background |
| Surface 2 | `--brand-surface-2` | `#1E1E1E` | Elevated cards, input fields |
| Surface 3 | `--brand-surface-3` | `#282828` | Nested surfaces, secondary inputs |
| **Text Primary** | `--brand-text` | `#F5F5F5` | Body copy, headings |
| Text Secondary | `--brand-text-2` | `rgba(245,245,245,0.55)` | Labels, captions, meta |
| Text Tertiary | `--brand-text-3` | `rgba(245,245,245,0.30)` | Placeholder, disabled |
| **Danger / Red** | `--brand-danger` | `#FF453A` | Errors, destructive actions |
| Warning / Orange | `--brand-warning` | `#FF9F0A` | RPE alerts, deload prompts |
| Success / Green | `--brand-success` | `#30D158` | Completion states |
| Info / Teal | `--brand-info` | `#64D2FF` | Rest timer, coaching tips |

### Category Gradient Chips

Each workout category gets a unique gradient used on hero cards and filter pills:

| Category | Gradient | From → To |
|---|---|---|
| Strength | `--grad-strength` | `#FF6B35 → #FF9A3C` (fire orange) |
| Cardio | `--grad-cardio` | `#00C6FB → #005BEA` (electric blue) |
| Flexibility / Stretch | `--grad-stretch` | `#A18CD1 → #FBC2EB` (soft purple-pink) |
| Warm-Up | `--grad-warmup` | `#F7971E → #FFD200` (golden yellow) |
| Upper Body | `--grad-upper` | `#7B61FF → #B06BFF` (violet-purple) |
| Lower Body | `--grad-lower` | `#11998E → #38EF7D` (emerald) |
| Core | `--grad-core` | `#FC5C7D → #6A3093` (magenta-plum) |
| Full Body | `--grad-full` | `#4776E6 → #8E54E9` (indigo-purple) |

```css
/* globals.css — category gradient custom properties */
:root {
  --grad-strength: linear-gradient(135deg, #FF6B35, #FF9A3C);
  --grad-cardio:   linear-gradient(135deg, #00C6FB, #005BEA);
  --grad-stretch:  linear-gradient(135deg, #A18CD1, #FBC2EB);
  --grad-warmup:   linear-gradient(135deg, #F7971E, #FFD200);
  --grad-upper:    linear-gradient(135deg, #7B61FF, #B06BFF);
  --grad-lower:    linear-gradient(135deg, #11998E, #38EF7D);
  --grad-core:     linear-gradient(135deg, #FC5C7D, #6A3093);
  --grad-full:     linear-gradient(135deg, #4776E6, #8E54E9);
}
```

### Glassmorphism Card System

Hero cards (dashboard workout starters, featured routines) use full-bleed athlete photography behind a glassmorphism overlay:

```css
/* Hero photo card */
.card-hero {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
  background: var(--brand-surface);
}
.card-hero__overlay {
  position: absolute;
  inset: 0;
  /* Gradient scrim: transparent top → opaque black bottom for text legibility */
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0.10) 0%,
    rgba(0,0,0,0.55) 55%,
    rgba(0,0,0,0.90) 100%
  );
}
.card-hero__glass-pill {
  /* Category badge floating on the card */
  backdrop-filter: blur(12px);
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.18);
  border-radius: 100px;
  padding: 4px 12px;
}
```

```typescript
// components/HeroCard.tsx — reference structure
interface HeroCardProps {
  imageUrl: string;
  category: WorkoutCategory;   // maps to --grad-* token
  title: string;
  subtitle: string;            // e.g. "32 min  •  Intermediate"
  onStart: () => void;
}
```

### Typography — Brand Scale

All weights use variable-font optical sizing via `-apple-system`. Fitness UIs skew heavy:

| Role | Size | Weight | Letter-spacing | Usage |
|---|---|---|---|---|
| Display | `48px` | 900 | `-0.04em` | Splash / onboarding hero |
| Large Title | `34px` | 800 | `-0.03em` | Dashboard greeting, screen titles |
| Title | `28px` | 800 | `-0.025em` | Card headlines, workout name |
| Title 2 | `22px` | 700 | `-0.02em` | Section headers |
| Headline | `17px` | 600 | `0` | List item primary text |
| Body | `17px` | 400 | `0` | Instructions, descriptions |
| Stat / Big Number | contextual | 800 | `-0.04em` | Rep counters, timer, weight |
| Caption | `12px` | 500 | `0.02em` | Labels, badges, chips |

### Iconography & Visual Language Rules

1. **SF Symbols only** — no third-party icon library. Export as SVG at `22pt` / `28pt` / `32pt`.
2. **Lime on black for primary actions** — any CTA button or active tab icon uses `#C5F74F`.
3. **Photos are props, not decoration** — every hero card that uses a photo must show a real movement (not generic stock gym). The GIF library `data/gifs/` doubles as the hero media source.
4. **No pure white** — use `#F5F5F5` for primary text; true `#FFFFFF` reserved for the wordmark only.
5. **Lime glow effect** on key interactive elements (start button, active ring):
   ```css
   box-shadow: 0 0 24px rgba(197, 247, 79, 0.35);
   ```
6. **Pill buttons** — primary CTA always a full-width pill (`border-radius: 100px`, `height: 56px`), filled `#C5F74F`, text `#0B0B0B` at 600 weight.
7. **iOS 26 Floating Tab Bar** — Liquid Glass pill, `height: 72px`, `border-radius: 26px`, `margin: 0 16px 8px`, `backdrop-filter: blur(40px) saturate(180%) brightness(1.05)`, `background: rgba(255,255,255,0.06)`, specular top edge highlight. Active icon gets a filled lime indicator pill. Not edge-to-edge. See §3.1 Liquid Glass Material System for full CSS recipe.

---

## 3.1 Thematic Guidelines

A fitness app lives in gyms: low light, sweaty hands, glancing at a phone between sets. Every design decision must optimize for **speed of interaction** and **legibility at a distance**. The visual language is iOS dark-mode native.

### Color Tokens

> Tokens now aligned with the FitForge brand palette (§3.0). The primary accent has changed from teal to **lime `#C5F74F`** to match the reference design.

| Token | Value | Rationale |
|---|---|---|
| `--color-primary` | `#C5F74F` | Lime — brand accent; high contrast on OLED black, energetic |
| `--color-primary-pressed` | `#A8D93D` | Darken 15% for active/pressed states |
| `--color-bg` | `#0B0B0B` | True OLED black — matches brand background |
| `--color-surface` | `#141414` | Default card / container |
| `--color-surface-2` | `#1E1E1E` | Elevated cards, input fields |
| `--color-surface-3` | `#282828` | Nested surfaces |
| `--color-danger` | `#FF453A` | iOS system red (dark mode) |
| `--color-warning` | `#FF9F0A` | iOS system orange (dark mode) |
| `--color-success` | `#30D158` | iOS system green (dark mode) |
| `--color-info` | `#64D2FF` | iOS system teal — rest timer, tips |
| `--color-text-primary` | `#F5F5F5` | Body text — off-white (not pure white) |
| `--color-text-secondary` | `rgba(245,245,245,0.55)` | Labels, captions |
| `--color-text-tertiary` | `rgba(245,245,245,0.30)` | Placeholders, disabled |

### Typography — iOS System Font Stack

Use the iOS system font (`-apple-system`, `SF Pro`) exclusively. This is the single biggest contributor to a native iOS feel; any third-party font immediately reads as "web app".

| Role | Font Stack | Size | Weight | iOS Equivalent |
|---|---|---|---|---|
| Large Title | `-apple-system, BlinkMacSystemFont` | `34px` | 700 | `largeTitle` |
| Title 1 | `-apple-system, BlinkMacSystemFont` | `28px` | 700 | `title` |
| Title 2 | `-apple-system, BlinkMacSystemFont` | `22px` | 700 | `title2` |
| Headline | `-apple-system, BlinkMacSystemFont` | `17px` | 600 | `headline` |
| Body | `-apple-system, BlinkMacSystemFont` | `17px` | 400 | `body` |
| Callout | `-apple-system, BlinkMacSystemFont` | `16px` | 400 | `callout` |
| Subheadline | `-apple-system, BlinkMacSystemFont` | `15px` | 400 | `subheadline` |
| Footnote | `-apple-system, BlinkMacSystemFont` | `13px` | 400 | `footnote` |
| Caption | `-apple-system, BlinkMacSystemFont` | `12px` | 400 | `caption` |
| Stats / Numbers | `-apple-system, BlinkMacSystemFont` | contextual | 700 | `title` + tabular nums |

```css
/* globals.css */
:root {
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display',
               'SF Pro Text', 'Helvetica Neue', sans-serif;
  font-feature-settings: 'tnum'; /* tabular numbers for timers/stats */
  -webkit-font-smoothing: antialiased;
}
```

### Spacing & Shape — iOS 26 Grid

iOS 26 uses an 8pt base grid but pushed corner radii larger everywhere — "squircle" continuous curves are more pronounced than iOS 17.

| Token | Value | Notes |
|---|---|---|
| Base grid unit | `8pt` | All layout spacing is ×1, ×2, ×3… |
| Touch target minimum | `44 × 44 pt` | Apple HIG minimum |
| Active set controls | `64 × 64 pt` | Gym-glance override |
| Page horizontal margin | `16pt` | Matches iOS safe-area edge |
| Card border radius | `20pt` | iOS 26 — rounder than iOS 17's `13pt` |
| Card border radius (small) | `14pt` | Compact list cards, inline chips |
| Inner card radius | `16pt` | Nested cards subtract 4pt from parent |
| Input border radius | `12pt` | |
| Button border radius | `16pt` (filled), `100px` (pill) | |
| Sheet corner radius | `28pt` | iOS 26 sheet top corners — noticeably rounder |
| Tab bar radius | `26pt` | iOS 26 floating pill tab bar |
| Context menu radius | `16pt` | iOS 26 menus use Liquid Glass with 16pt radius |
| SF Symbol size | `24pt` | iOS 26 tab bar — slightly larger than before |

### Additional iOS 26 Visual Tokens

> iOS 26 replaces the single-layer blur ("vibrancy") system with **Liquid Glass** — a multi-layer stack. All chrome surfaces use these tokens.

| Token | Value | Usage |
|---|---|---|
| `--glass-bg` | `rgba(255,255,255,0.06)` | Liquid Glass base fill (dark mode) |
| `--glass-bg-elevated` | `rgba(255,255,255,0.10)` | Pressed / active Liquid Glass state |
| `--glass-blur` | `blur(40px) saturate(180%) brightness(1.05)` | Core `backdrop-filter` recipe |
| `--glass-border` | `rgba(255,255,255,0.14)` | Edge border on all glass surfaces |
| `--glass-specular` | `inset 0 1px 0 rgba(255,255,255,0.28)` | Top-edge specular highlight (box-shadow) |
| `--glass-inner-shadow` | `inset 0 -1px 0 rgba(0,0,0,0.25)` | Bottom inner shadow for depth |
| `--glass-shadow` | `0 8px 32px rgba(0,0,0,0.55)` | Outer elevation shadow |
| `--separator` | `rgba(255,255,255,0.10)` | List row separators, dividers |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.5)` | Non-glass card shadow |

### Liquid Glass Material System

This is the defining visual characteristic of iOS 26. Apply it to any surface that floats above content.

```css
/* globals.css — Liquid Glass base recipe */

/* ─── Core material ─────────────────────────────────────────────── */
.glass {
  background:      rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
  -webkit-backdrop-filter: blur(40px) saturate(180%) brightness(1.05);
  border:          1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    inset 0  1px 0   rgba(255, 255, 255, 0.28),   /* specular top */
    inset 0 -1px 0   rgba(0,   0,   0,   0.25),   /* depth bottom */
          0  8px 32px rgba(0,   0,   0,   0.55);  /* elevation    */
}

/* ─── Elevated state (pressed, active) ─────────────────────────── */
.glass-elevated {
  background: rgba(255, 255, 255, 0.10);
  box-shadow:
    inset 0  1px 0   rgba(255, 255, 255, 0.34),
    inset 0 -1px 0   rgba(0,   0,   0,   0.20),
          0  4px 16px rgba(0,   0,   0,   0.40);
}

/* ─── Tab bar ───────────────────────────────────────────────────── */
.glass-tab-bar {
  composes: glass;
  border-radius:   26px;
  height:          72px;
  /* Subtly tinted with lime — refracts brand colour from below */
  background: rgba(197, 247, 79, 0.04);
}

/* ─── Navigation bar (floating, iOS 26) ────────────────────────── */
.glass-nav-bar {
  composes: glass;
  border-radius: 0 0 20px 20px;
  /* Bridges to status bar — no top border, only specular on sides/bottom */
  box-shadow:
    inset 1px  0   0 rgba(255,255,255,0.12),
    inset -1px 0   0 rgba(255,255,255,0.12),
    inset 0   -1px 0 rgba(255,255,255,0.18),
        0 8px 24px rgba(0,0,0,0.45);
}

/* ─── Sheet (bottom sheet presentation) ────────────────────────── */
.glass-sheet {
  composes: glass;
  border-radius:    28px 28px 0 0;
  /* Stronger blur — sheet sits higher in z-stack */
  backdrop-filter: blur(60px) saturate(200%) brightness(1.08);
  -webkit-backdrop-filter: blur(60px) saturate(200%) brightness(1.08);
}

/* ─── Context menu / popover ────────────────────────────────────── */
.glass-menu {
  composes: glass;
  border-radius: 16px;
  background:    rgba(255, 255, 255, 0.08);
}

/* ─── Active indicator pill (inside tab bar) ────────────────────── */
.glass-active-pill {
  background:    rgba(197, 247, 79, 0.18);  /* lime tint */
  border:        1px solid rgba(197, 247, 79, 0.30);
  border-radius: 14px;
  padding:       6px 16px;
  box-shadow:    inset 0 1px 0 rgba(197, 247, 79, 0.25);
}
```

```typescript
// hooks/useLiquidGlass.ts — React hook for Liquid Glass tinting
// iOS 26 Liquid Glass dynamically tints from content below.
// Web approximation: sample dominant color of underlying element
// and apply as a very low-opacity rgba tint to the glass background.
import { useEffect, useState } from 'react';

export function useLiquidGlassTint(underlayRef: React.RefObject<HTMLElement>) {
  const [tint, setTint] = useState('rgba(255,255,255,0.06)');

  useEffect(() => {
    // For MVP: use brand lime as a fixed tint for the tab bar,
    // and neutral glass for all other surfaces.
    // Full implementation: canvas pixel-sample the scroll content
    // underneath and extract dominant hue via color-thief.
    setTint('rgba(197, 247, 79, 0.04)'); // lime refraction
  }, []);

  return tint;
}
```

### Energy Meter Color Scale

| Score | Color | Label |
|---|---|---|
| 75–100 | `#C5F74F` `--color-primary` | Ready to crush it |
| 50–74 | `#64D2FF` `--color-info` | Good to train |
| 25–49 | `#FF9F0A` `--color-warning` | Take it easy today |
| 0–24 | `#FF453A` `--color-danger` | Rest day recommended |

---

## 3.2 iOS 26 Native Design Language

### Navigation Model — iOS 26 / UINavigationController

iOS 26 keeps the same push/pop model but the navigation bar now **floats** over content (Liquid Glass, not solid). As content scrolls underneath, the glass refracts it in real time.

| Navigation Type | iOS 26 Equivalent | Framer Motion Pattern |
|---|---|---|
| Drill-down (list → detail) | `push` | Slide in from right (x: 100% → 0), parent simultaneously slides to x: -30% |
| Go back | `pop` | Slide out to right (x: 0 → 100%), parent slides back from x: -30% → 0 |
| Modal sheet | `present modally` | Slide up from bottom (y: 100% → 0); background content scales to 0.92 + dims |
| Dismiss sheet | `dismiss` | Slide down (y: 0 → 100%); background scales back 0.92 → 1.0 |
| Tab switch | `UITabBarController` | Cross-fade; active-pill inside tab bar spring-animates position |
| Phase transition (workout) | `UIPageViewController` | Slide left within page boundary; Liquid Glass phase header morphs |

### iOS 26 Sheet Behaviour — Scale Background

iOS 26 sheets scale the underlying content when presenting, creating a "peek behind the curtain" depth effect:

```typescript
// lib/motion/variants.ts — updated for iOS 26

/** iOS 26 modal sheet — background scales down as sheet rises */
export const sheetBackgroundVariants: Variants = {
  initial:  { scale: 1,    borderRadius: 0,    filter: 'brightness(1)' },
  // While sheet is open: content zooms out slightly, top-corners round
  dimmed:   { scale: 0.92, borderRadius: '16px', filter: 'brightness(0.7)',
               transition: springGentle },
  hidden:   { scale: 1,    borderRadius: 0,    filter: 'brightness(1)',
               transition: springGentle },
};

export const sheetVariants: Variants = {
  initial:  { y: '100%' },
  animate:  { y: 0,       transition: springGentle },
  exit:     { y: '100%',  transition: springSnappy },
};
```

### iOS 26 Component Patterns

Every chrome surface uses `.glass` or a variant. Flat opaque backgrounds are only used for content (cards with photos, data cells):

| Component | iOS 26 Material | Key Behaviours |
|---|---|---|
| `<BottomNav />` | `.glass-tab-bar` (Liquid Glass pill) | Active tab: lime indicator pill spring-animates between icons using `layoutId`; icon scales 1.0→1.1 on select; **no text labels** |
| `<TopBar />` | `.glass-nav-bar` (floating Liquid Glass bar) | Floats over scroll content; large title lives in page hero, not the bar; bar shows only compact title + actions |
| `<ExercisePickerSheet />` | `.glass-sheet` (Liquid Glass, 28px top radius) | Drag handle: 36×4 glass pill; snap points at 50% and 95%; background content scales to 0.92 on expand |
| `<RestTimer />` | `.glass` full-screen overlay | Full-screen with Liquid Glass overlay; circular ring uses `--color-primary` (lime); background content visible through glass |
| `<RoutineExerciseRow />` | Flat card (`--color-surface`) | Swipe left → delete (red, `.glass` pill); swipe right → edit; no buttons at rest |
| `<ActiveSetCard />` | `.glass-elevated` on press | Press → `.glass-elevated` + scale 0.97; release springs back; lime glow on active |
| `<ContextMenu />` | `.glass-menu` (Liquid Glass popover) | Long-press: scale-down 0.95 + depth blur + glass menu springs in from touch point |
| `<PhaseTransitionBanner />` | `.glass-sheet` action sheet | Slides up; Liquid Glass surface with gradient category colour as subtle tint |
| `<CoachingNoteCard />` | `.glass` notification banner | Slides down from top; glass surface with lime left-border accent; auto-dismiss 6s |

### Color System — iOS Dark Mode Semantic Colors

Mirror iOS's semantic color roles and map to FitForge brand tokens:

| Custom Token | iOS Semantic Color | Value (Dark Mode) | Brand Note |
|---|---|---|---|
| `--color-bg` | `systemBackground` | `#0B0B0B` | Deeper than iOS default — OLED brand black |
| `--color-surface` | `secondarySystemBackground` | `#141414` | |
| `--color-surface-2` | `tertiarySystemBackground` | `#1E1E1E` | |
| `--color-surface-3` | `systemGroupedBackground` (secondary) | `#282828` | |
| `--color-text-primary` | `label` | `#F5F5F5` | Off-white, not pure white |
| `--color-text-secondary` | `secondaryLabel` | `rgba(245,245,245,0.55)` | |
| `--color-text-tertiary` | `tertiaryLabel` | `rgba(245,245,245,0.30)` | |
| `--color-separator` | `separator` | `rgba(255,255,255,0.10)` | Slightly lighter on brand black |
| `--color-primary` | — (brand accent) | `#C5F74F` | **Lime — core brand colour** |
| `--color-primary-pressed` | — | `#A8D93D` | Pressed state |
| `--color-danger` | `systemRed` (dark) | `#FF453A` | |
| `--color-warning` | `systemOrange` (dark) | `#FF9F0A` | |
| `--color-success` | `systemGreen` (dark) | `#30D158` | |
| `--color-info` | `systemTeal` (dark) | `#64D2FF` | Rest timer, coaching |

### iOS 26 Tab Bar — Full Implementation Spec

```tsx
// components/BottomNav.tsx — iOS 26 Liquid Glass floating pill
// The active-pill indicator uses Framer Motion layoutId so it
// spring-animates smoothly between tabs without manual position math.

const tabs = [
  { id: 'home',     icon: 'house.fill',                    href: '/' },
  { id: 'routines', icon: 'list.bullet.clipboard.fill',    href: '/routines' },
  { id: 'history',  icon: 'clock.arrow.circlepath',        href: '/history' },
  { id: 'profile',  icon: 'person.crop.circle.fill',       href: '/profile' },
];

// CSS positioning:
// position: fixed
// bottom: calc(8px + env(safe-area-inset-bottom))
// left: 16px; right: 16px
// height: 72px; border-radius: 26px
// Apply .glass-tab-bar

// Per tab:
// - SF Symbol SVG at 24pt
// - Inactive: rgba(245,245,245,0.40)
// - Active:   #C5F74F (lime)
// - On select: icon scale 1.0 → 1.1 via springSnappy, then 1.1 → 1.0
// - Active pill: <motion.div layoutId="tab-indicator" className="glass-active-pill" />
//   positioned below/behind the icon, spring-animates x-position
```

### Lime Glow — Primary Interactive Effect

Key interactive elements (primary CTA button, active progress ring, active set card) emit a subtle lime glow to signal focus:

```css
/* Applied to primary buttons and active rings */
.glow-primary {
  box-shadow: 0 0 24px rgba(197, 247, 79, 0.35),
              0 0  8px rgba(197, 247, 79, 0.20);
}
/* Stronger variant for the main Start Workout button */
.glow-primary-strong {
  box-shadow: 0 0 40px rgba(197, 247, 79, 0.45),
              0 0 16px rgba(197, 247, 79, 0.30);
}
```

### Primary Button — Lime Pill

```tsx
// components/ui/PrimaryButton.tsx
export function PrimaryButton({ children, onPress }: ButtonProps) {
  return (
    <motion.button
      className="
        w-full h-14 rounded-full
        bg-[#C5F74F] text-[#0B0B0B]
        font-semibold text-[17px] tracking-tight
        glow-primary
      "
      whileTap={{ scale: 0.97, boxShadow: '0 0 12px rgba(197,247,79,0.25)' }}
      transition={springSnappy}
      onClick={onPress}
    >
      {children}
    </motion.button>
  );
}
```

### Floating Tab Bar

The tab bar is a floating pill, not edge-to-edge, positioned 16pt from the bottom safe area:

```tsx
// components/BottomNav.tsx — structural spec
// Position: fixed, bottom: calc(16pt + env(safe-area-inset-bottom))
// Width: calc(100% - 32px), margin: 0 16px
// Height: 64px, border-radius: 24px
// Background: rgba(20, 20, 20, 0.85)
// backdrop-filter: blur(24px)
// border: 1px solid rgba(255,255,255,0.08)
// box-shadow: 0 8px 32px rgba(0,0,0,0.6)

// Active tab icon: #C5F74F (lime)
// Inactive tab icon: rgba(245,245,245,0.40)
// No text labels — icon only (SF Symbols)
// Active indicator: small 4×4 lime dot below icon, spring-animated
```

### SF Symbols Usage

Use [react-native-sf-symbols](https://github.com/birkir/react-native-sf-symbols) or SVG exports of SF Symbols for all icons. Never use a third-party icon library (Font Awesome, Heroicons, etc.) — it immediately reads as non-native.

| Context | Symbol Name |
|---|---|
| Home tab | `house.fill` |
| Routines tab | `list.bullet.clipboard.fill` |
| History tab | `clock.arrow.circlepath` |
| Profile tab | `person.crop.circle.fill` |
| Add exercise | `plus.circle.fill` |
| Start workout | `play.fill` |
| Complete set | `checkmark.circle.fill` |
| Rest timer | `timer` |
| Weight | `scalemass.fill` |
| Drag handle | `line.3.horizontal` |
| PR badge | `trophy.fill` |
| Back navigation | `chevron.left` |

---

## 3.3 Component Hierarchy

```
<AppShell>                           ← viewport, safe-area-inset, bottom nav
├── <TopBar />                       ← contextual: title, back button, actions
├── <PageContent />                  ← scrollable body with overscroll bounce
│   │
│   ├── Dashboard
│   │   ├── <RecoveryMeter />        ← prominent top card
│   │   ├── <WorkoutCalendar />      ← heatmap calendar strip
│   │   ├── <QuickStartButton />     ← primary CTA: start freestyle session
│   │   └── <RecentWorkoutCard />
│   │
│   ├── RoutineBuilder
│   │   ├── <RoutinePhaseTabs />      ← 3 tabs: Warm-Up | Workout | Stretch
│   │   │   ├── [Warm-Up tab]
│   │   │   │   ├── <PhaseExerciseList />   ← ordered list of added warm-up items
│   │   │   │   │   └── <RoutineExerciseRow /> ← sets/reps/rest config + drag handle
│   │   │   │   └── <AddExerciseButton />   ← opens search sheet filtered to warmUp
│   │   │   ├── [Workout tab]              ← same structure as Warm-Up tab
│   │   │   └── [Stretch tab]              ← same structure; holdSec replaces restTimeSec
│   │   ├── <ExercisePickerSheet />   ← bottom sheet: search + filter for any phase
│   │   │   ├── <ExerciseSearchBar /> ← debounced search across library + custom
│   │   │   ├── <SourceToggle />      ← Library | My Exercises
│   │   │   ├── <ExerciseList />
│   │   │   │   └── <ExerciseCard />  ← tap to add to the active phase
│   │   │   └── <CreateCustomButton /> ← opens CustomExerciseForm
│   │   ├── <CustomExerciseForm />    ← create a new exercise from scratch
│   │   │   ├── Name, description, body part, equipment (free text or presets)
│   │   │   ├── Target muscle, secondary muscles
│   │   │   ├── Difficulty, category
│   │   │   └── Phase hint (Warm-Up / Workout / Stretch) — non-binding default
│   │   └── <RoutineSummaryBar />     ← floating bottom bar: est. time + calories per phase
│   │
│   ├── WorkoutExecution             ← THE most-used screen; optimize ruthlessly
│   │   ├── <PhaseProgressBar />     ← shows current phase: [WARM-UP] [WORKOUT] [STRETCH]
│   │   ├── <ExerciseQueue />        ← current + upcoming exercises within the active phase
│   │   ├── <ActiveSetCard />        ← DOMINANT card with large tap targets
│   │   │   ├── <RepCounter />       ← manual +/− or auto-count display
│   │   │   ├── <HoldTimer />        ← replaces RepCounter during stretch phase (countdown)
│   │   │   └── <WeightSelector />   ← inline weight edit, unit aware (hidden for bodyweight)
│   │   ├── <RestTimer />            ← full-screen countdown takeover
│   │   ├── <PhaseTransitionBanner /> ← full-screen card between phases
│   │   │   │    e.g. "Warm-Up Complete! Starting Workout in 10s…" with skip button
│   │   └── <QuickLogControls />     ← swipe gestures: skip / complete set
│   │
│   └── PostWorkoutSummary
│       ├── <XPCelebration />        ← confetti animation layer (Framer Motion)
│       ├── <MuscleHeatmap />        ← react-body-highlighter front + back views
│       ├── <SessionStats />         ← calories, duration, intensity, est. delta
│       └── <PRBadges />             ← personal record achievement badges
│
└── <BottomNav />                    ← 4 tabs: Home | Routines | History | Profile
```

---

## 3.4 State Management Strategy

Three-layer model — each layer owns clearly separated concerns:

| Layer | Tool | Holds |
|---|---|---|
| **Server / Async State** | TanStack Query | PouchDB query results, treated as server state for cache invalidation and stale-while-revalidate |
| **Global App State** | Zustand | Active workout session, kg/lbs unit preference, user profile, online/offline status |
| **Local UI State** | `useState` / `useReducer` | Timer ticking, modal open/closed, RPE input value, current set index |

### Active Workout Session Store (Zustand)

```typescript
// store/useSessionStore.ts
type SessionPhase = 'warmUp' | 'workout' | 'stretch';

interface WorkoutSessionState {
  sessionId: string | null;
  routineId: string | null;
  mode: 'structured' | 'freestyle';

  // Phase tracking
  currentPhase: SessionPhase;           // which of the three phases is active
  currentExerciseIndex: number;         // index within currentPhase array
  currentSetIndex: number;

  // The three exercise lists, pre-populated from the routine
  warmUp: ActiveExercise[];
  workout: ActiveExercise[];
  stretch: ActiveExercise[];

  startedAt: Date | null;
  isPaused: boolean;
  isResting: boolean;
  restEndAt: Date | null;
  isTransitioning: boolean;             // true while PhaseTransitionBanner is shown

  // Actions
  startSession: (routine?: Routine) => void;
  completeSet: (set: CompletedSet) => void;
  startRest: (durationSec: number) => void;
  skipRest: () => void;
  advancePhase: () => void;             // warmUp → workout → stretch → end
  skipPhaseTransition: () => void;      // immediately dismisses the transition banner
  pauseSession: () => void;
  endSession: () => WorkoutSummary;
}
```

### Profile Store (Zustand)

```typescript
// store/useProfileStore.ts
interface ProfileState {
  weightKg: number;
  unitPreference: 'kg' | 'lbs';
  xp: number;
  level: number;
  prs: Record<string, PersonalRecord>; // keyed by exerciseId

  setUnitPreference: (unit: 'kg' | 'lbs') => void;
  addXP: (amount: number) => void;
  updatePR: (exerciseId: string, pr: PersonalRecord) => void;
}
```

### Sheet Store (Zustand) — iOS 26 Background Scale

Tracks whether any bottom sheet is currently open. Used by `AppLayout` to apply `sheetBackgroundVariants` ("dimmed" state) to the underlying page content, replicating the iOS 26 sheet-presentation scale-behind depth effect.

```typescript
// store/useSheetStore.ts
interface SheetState {
  isOpen: boolean;
  /** The identifier of the currently open sheet, or null */
  activeSheet: string | null;

  openSheet:  (id: string) => void;
  closeSheet: ()           => void;
}

export const useSheetStore = create<SheetState>((set) => ({
  isOpen:      false,
  activeSheet: null,

  openSheet:  (id) => set({ isOpen: true,  activeSheet: id }),
  closeSheet: ()   => set({ isOpen: false, activeSheet: null }),
}));
```

**Usage pattern:**

```tsx
// Any sheet component — call on mount/unmount
const { openSheet, closeSheet } = useSheetStore();

useEffect(() => {
  openSheet('exercise-picker');
  return () => closeSheet();
}, []);
```

`AppLayout` (see §3.5) reads `useSheetStore((s) => s.isOpen)` and toggles the `sheetBackgroundVariants` between `"normal"` and `"dimmed"` states on the page content wrapper.

---

## 3.5 Framer Motion Animation System

Framer Motion is the **exclusive** animation layer. All motion — layout shifts, page transitions, component mounts/unmounts, gesture feedback, progress indicators — is handled by Framer Motion. No CSS `transition`, `@keyframes`, or `animate` class directly competes with it.

### Spring Presets — iOS-Calibrated

iOS animations are spring-based, not easing-based. These four presets cover every use case in the app:

```typescript
// lib/motion/springs.ts
import type { Spring } from 'framer-motion';

/** Fast, snappy — button taps, checkmarks, small state changes */
export const springSnappy: Spring = {
  type: 'spring', stiffness: 500, damping: 36, mass: 1,
};

/** Default iOS navigation feel — push/pop, card reveals */
export const springDefault: Spring = {
  type: 'spring', stiffness: 320, damping: 32, mass: 1,
};

/** Smooth, gentle — sheet presentations, large element entrances */
export const springGentle: Spring = {
  type: 'spring', stiffness: 200, damping: 26, mass: 1,
};

/** Slow, deliberate — phase transition banners, celebration screens */
export const springCelebration: Spring = {
  type: 'spring', stiffness: 120, damping: 16, mass: 1,
};
```

### Page Transition Variants

Wrap every route in a `<PageTransition>` layout wrapper. Framer Motion's `AnimatePresence` in the root layout drives all push/pop behaviour.

```typescript
// lib/motion/variants.ts
import type { Variants } from 'framer-motion';
import { springDefault } from './springs';

/** iOS push navigation — new page slides in from right */
export const pushVariants: Variants = {
  initial:  { x: '100%', opacity: 0 },
  animate:  { x: 0, opacity: 1,   transition: springDefault },
  exit:     { x: '-30%', opacity: 0, transition: springDefault },
};

/** iOS pop navigation — page slides out to right */
export const popVariants: Variants = {
  initial:  { x: '-30%', opacity: 0 },
  animate:  { x: 0, opacity: 1,   transition: springDefault },
  exit:     { x: '100%', opacity: 0, transition: springDefault },
};

/** iOS 26 modal sheet — slides up from bottom; use sheetBackgroundVariants on the page content behind it */
export const sheetVariants: Variants = {
  initial:  { y: '100%' },
  animate:  { y: 0,      transition: springGentle },
  exit:     { y: '100%', transition: springSnappy },
};

/** iOS 26 — background page scales down while sheet is open */
export const sheetBackgroundVariants: Variants = {
  normal: { scale: 1,    borderRadius: '0px',  filter: 'brightness(1)',   transition: springGentle },
  dimmed: { scale: 0.92, borderRadius: '16px', filter: 'brightness(0.65)', transition: springGentle },
};

/** Tab switch — cross-fade only (no slide) */
export const tabVariants: Variants = {
  initial:  { opacity: 0 },
  animate:  { opacity: 1, transition: { duration: 0.18 } },
  exit:     { opacity: 0, transition: { duration: 0.12 } },
};

/** Coaching banner — slides down from top */
export const bannerVariants: Variants = {
  initial:  { y: -80, opacity: 0 },
  animate:  { y: 0,   opacity: 1, transition: springSnappy },
  exit:     { y: -80, opacity: 0, transition: springSnappy },
};

/** Phase transition banner — slides up from bottom (action-sheet style) */
export const phaseTransitionVariants: Variants = {
  initial:  { y: '100%', opacity: 0 },
  animate:  { y: 0, opacity: 1, transition: springGentle },
  exit:     { y: '100%', opacity: 0, transition: springSnappy },
};
```

```tsx
// app/(app)/layout.tsx — iOS 26 sheet-aware layout
'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getNavDirection } from '@/lib/motion/navDirection';
import { pushVariants, popVariants, sheetBackgroundVariants } from '@/lib/motion/variants';
import { useSheetStore } from '@/store/useSheetStore'; // tracks if any sheet is open

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const direction = getNavDirection(pathname);
  const variants  = direction === 'pop' ? popVariants : pushVariants;
  const sheetOpen = useSheetStore((s) => s.isOpen);

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {/* Page content — scales back when a sheet is open (iOS 26 behaviour) */}
      <motion.div
        key={pathname}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{ position: 'absolute', inset: 0, overflowY: 'auto' }}
      >
        <motion.div
          variants={sheetBackgroundVariants}
          animate={sheetOpen ? 'dimmed' : 'normal'}
          style={{ minHeight: '100%' }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

### Component-Level Animation Specs

| Component | Trigger | Animation |
|---|---|---|
| `<ActiveSetCard />` | Press (any tap area) | Scale `1.0 → 0.97` on press, `0.97 → 1.0` on release — `springSnappy` |
| `<RepCounter />` number | Rep increment | `y: -12 → 0`, `opacity: 0 → 1` — `springSnappy` (number flips like iOS picker) |
| `<RestTimer />` circle | Mount | Scale `0.6 → 1.0`, opacity `0 → 1` — `springGentle`; full-screen Liquid Glass (`.glass`) overlay; lime (`#C5F74F`) SVG ring |
| `<RestTimer />` ring | Tick | `strokeDashoffset` animated with `useMotionValue` + `useTransform`, no spring (linear countdown) |
| `<PRBadge />` | PR detected | Scale `0 → 1.15 → 1.0` — `springCelebration`; stagger 0.12s per badge |
| `<XPCelebration />` | Session end | Staggered particle burst via `motion.div` array; `springCelebration` |
| `<PhaseTransitionBanner />` | Phase end | `phaseTransitionVariants`; background dims via `motion.div` opacity `0 → 0.6` |
| `<RoutineExerciseRow />` | Swipe (left) | `x: 0 → −80px` revealing delete button; rubber-band past −80px |
| `<RoutineExerciseRow />` | Drag reorder | `layoutId` on each row so Framer Motion animates position changes automatically |
| `<ExercisePickerSheet />` | Open | `sheetVariants`; snap points via `drag="y"` with `dragConstraints` and `onDragEnd` snap logic |
| `<CoachingNoteCard />` | Mount | `bannerVariants`; auto-exit after 6s via `useEffect` + `AnimatePresence` |
| `<WorkoutCalendar />` day | Mount | Stagger all 30 day cells `opacity 0 → 1`, `y: 4 → 0`, 0.015s per cell |
| `<MuscleHeatmap />` model | Mount | Fade in `opacity: 0 → 1` — 0.4s ease; each highlighted muscle SVG path transitions fill color |
| `<RecoveryMeter />` arc | Mount | `strokeDashoffset` animates from 0 to final score value — 0.8s, `springGentle` |
| `<FatigueWarningBanner />` | Mount | `bannerVariants` — same as coaching note |
| `<SessionTargetBadge />` | Routine target changes | Number cross-fades; `AnimatePresence mode="wait"` |

### Drag Gesture — Sheet Snap Points

```tsx
// components/ExercisePickerSheet.tsx (excerpt)
const SNAP_HALF = window.innerHeight * 0.5;
const SNAP_FULL = window.innerHeight * 0.95;

<motion.div
  drag="y"
  dragConstraints={{ top: -SNAP_FULL, bottom: 0 }}
  dragElastic={0.2}               // rubber-band feel past constraints
  onDragEnd={(_, info) => {
    if (info.offset.y > 120) onDismiss();          // flick/drag down → close
    else if (info.offset.y < -60) snapTo(SNAP_FULL); // flick up → full height
    else snapTo(SNAP_HALF);                         // centre → half height
  }}
  style={{ y }}                   // y is a useMotionValue
>
```

### `useMotionValue` Scroll-Reactive Large Title

Replicates the iOS `UINavigationBar` large title → inline title collapse on scroll:

```tsx
// hooks/useScrollTitle.ts
import { useMotionValueEvent, useScroll, useTransform } from 'framer-motion';

export function useScrollTitle(scrollRef: RefObject<HTMLElement>) {
  const { scrollY } = useScroll({ container: scrollRef });
  const largeTitleOpacity = useTransform(scrollY, [0, 56], [1, 0]);
  const inlineTitleOpacity = useTransform(scrollY, [40, 72], [0, 1]);
  const largeTitleY       = useTransform(scrollY, [0, 56], [0, -12]);
  return { largeTitleOpacity, inlineTitleOpacity, largeTitleY };
}
```

### `layout` prop — Reorder Animations

All sortable lists (routine exercise rows within a phase) use Framer Motion's `layout` prop so reorders animate automatically without manual position tracking:

```tsx
// Each draggable exercise row
<motion.div layout layoutId={`exercise-${ex.id}`} transition={springDefault}>
  <RoutineExerciseRow exercise={ex} />
</motion.div>
```

### Haptic + Animation Pairing

Every meaningful animation is paired with a corresponding haptic pattern so the interaction feels native:

| Interaction | Haptic | Animation |
|---|---|---|
| Set complete | `navigator.vibrate(50)` — success | `<ActiveSetCard />` scale down then spring back |
| PR detected | `navigator.vibrate([30,30,80])` — notification | `<PRBadge />` spring-scale in |
| Rest timer end | `navigator.vibrate([100,50,100])` — alert | `<RestTimer />` ring flash + dismiss |
| Phase transition | `navigator.vibrate(40)` — light | `<PhaseTransitionBanner />` slides up |
| Rep counted (auto) | `navigator.vibrate(30)` — light tick | `<RepCounter />` number flip |
| Swipe delete confirm | `navigator.vibrate(60)` — medium | Row snaps and collapses with `layout` animation |

---

## 3.6 `react-body-highlighter` Muscle Mapping

The library accepts specific muscle name constants. The exercise JSON uses natural-language names. A mapping table bridges the two:

```typescript
// lib/muscleMapping.ts
import type { MuscleType } from 'react-body-highlighter';

export const MUSCLE_MAP: Record<string, MuscleType[]> = {
  'abs':               ['abs'],
  'obliques':          ['obliques'],
  'delts':             ['front-deltoids', 'back-deltoids'],
  'deltoids':          ['front-deltoids', 'back-deltoids'],
  'quads':             ['quadriceps'],
  'hamstrings':        ['hamstring'],
  'glutes':            ['gluteal'],
  'biceps':            ['biceps'],
  'triceps':           ['triceps'],
  'chest':             ['chest'],
  'upper back':        ['upper-back'],
  'trapezius':         ['trapezius'],
  'lower back':        ['lower-back'],
  'calves':            ['calves'],
  'hip flexors':       ['adductor'],     // closest library approximation
  'serratus anterior': ['chest'],        // library limitation
  'core':              ['abs'],
};

// Build the data array for <Model /> component
export function exerciseToHighlighterData(
  exercises: ExerciseRecord[]
): { slug: MuscleType; intensity: number }[] {
  const map = new Map<MuscleType, number>();

  exercises.forEach((ex) => {
    // Primary muscle → intensity 2 (dark highlight)
    (MUSCLE_MAP[ex.target] ?? []).forEach((m) =>
      map.set(m, Math.max(map.get(m) ?? 0, 2))
    );
    // Secondary muscles → intensity 1 (lighter highlight)
    ex.secondaryMuscles
      .flatMap((s) => MUSCLE_MAP[s] ?? [])
      .forEach((m) => map.set(m, Math.max(map.get(m) ?? 0, 1)));
  });

  return Array.from(map.entries()).map(([slug, intensity]) => ({ slug, intensity }));
}
```

### Usage in PostWorkoutSummary

```tsx
// components/MuscleHeatmap.tsx
import { Model } from 'react-body-highlighter';
import { exerciseToHighlighterData } from '@/lib/muscleMapping';

export function MuscleHeatmap({ exercises }: { exercises: ExerciseRecord[] }) {
  const data = exerciseToHighlighterData(exercises);
  return (
    <div className="flex gap-4 justify-center">
      <Model data={data} style={{ width: '45%' }} type="anterior" />
      <Model data={data} style={{ width: '45%' }} type="posterior" />
    </div>
  );
}
```

---

## 3.7 iOS 26 UX Principles

1. **Thumb zone first** — primary actions (Complete Set, Start Rest) sit in the bottom 40% of the screen; mirror iOS reachability intent
2. **One-handed operation** — no gestures requiring two hands during a live workout
3. **Haptic feedback paired with every animation** — `navigator.vibrate()` fires synchronously with the Framer Motion animation start; they are never decoupled (see §3.5 pairing table)
4. **Persistent session state** — intermediate workout state written to PouchDB on every set completion; recovers from backgrounding, system kill, or Safari tab eviction
5. **No blocking dialogs during execution** — all confirmations use swipe-to-confirm, `.glass-sheet` bottom sheets, or inline banners; `window.alert` / `window.confirm` are forbidden
6. **System font is non-negotiable** — `-apple-system` loads at zero cost; no FOUT, no font fetch on slow connections
7. **`prefers-reduced-motion` respected** — all Framer Motion variants check `useReducedMotion()`; if true, replace springs with instant opacity transitions
8. **`overscroll-behavior: none`** — applied to workout execution screen; prevents accidental elastic scroll from exposing the background during a set
9. **Safe area insets on every screen** — `env(safe-area-inset-bottom)` on all fixed chrome (BottomNav at `bottom: calc(8px + env(...))`, RoutineSummaryBar, RestTimer)
10. **No hover states in primary UI** — hover is a touch anti-pattern; all feedback is `active:` press state only
11. **Liquid Glass on chrome, flat on content** — chrome (navigation, tab bar, sheets, menus) = `.glass*` classes; content surfaces (exercise cards, stat cells, list rows) = flat `--color-surface` / `--color-surface-2`; never mix glass material onto data-dense content rows
12. **Sheet scale effect** — every sheet presentation uses `sheetBackgroundVariants` to scale the background content to 0.92; creates genuine depth, not just dimming
13. **Active tab indicator** — uses `motion.div` with `layoutId="tab-indicator"` so it physically moves between tabs; never use opacity toggle or CSS class swap alone
14. **Glass tinting follows brand** — the Liquid Glass tab bar carries a `rgba(197, 247, 79, 0.04)` lime tint at rest; on active-tab change it briefly pulses to `rgba(197, 247, 79, 0.10)` before settling

```tsx
// Reduced-motion guard — wrap every animated component
import { useReducedMotion } from 'framer-motion';

export function AnimatedCard({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      whileTap={reduceMotion ? undefined : { scale: 0.97 }}
      transition={reduceMotion ? { duration: 0 } : springSnappy}
    >
      {children}
    </motion.div>
  );
}
```
