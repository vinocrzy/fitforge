// ═══════════════════════════════════════════════════════════════════
// FitForge — Framer Motion Spring Presets (iOS-calibrated)
// ═══════════════════════════════════════════════════════════════════

import type { Transition } from 'framer-motion';

/** Fast, snappy — button taps, checkmarks, small state changes */
export const springSnappy: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 36,
  mass: 1,
};

/** Default iOS navigation feel — push/pop, card reveals */
export const springDefault: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 32,
  mass: 1,
};

/** Smooth, gentle — sheet presentations, large element entrances */
export const springGentle: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 26,
  mass: 1,
};

/** Slow, deliberate — phase transition banners, celebration screens */
export const springCelebration: Transition = {
  type: 'spring',
  stiffness: 120,
  damping: 16,
  mass: 1,
};
