// ═══════════════════════════════════════════════════════════════════
// FitForge — Framer Motion Animation Variants
// iOS 26 page transitions, sheets, banners
// ═══════════════════════════════════════════════════════════════════

import type { Variants } from 'framer-motion';
import { springDefault, springGentle, springSnappy } from './springs';

/** iOS push navigation — new page slides in from right */
export const pushVariants: Variants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springDefault },
  exit: { x: '-30%', opacity: 0, transition: springDefault },
};

/** iOS pop navigation — page slides out to right */
export const popVariants: Variants = {
  initial: { x: '-30%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: springDefault },
  exit: { x: '100%', opacity: 0, transition: springDefault },
};

/** iOS 26 modal sheet — slides up from bottom */
export const sheetVariants: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: springGentle },
  exit: { y: '100%', transition: springSnappy },
};

/** iOS 26 — background page scales down while sheet is open */
export const sheetBackgroundVariants: Variants = {
  normal: {
    scale: 1,
    borderRadius: '0px',
    filter: 'brightness(1)',
    transition: springGentle,
  },
  dimmed: {
    scale: 0.92,
    borderRadius: '16px',
    filter: 'brightness(0.65)',
    transition: springGentle,
  },
};

/** Tab switch — cross-fade only (no slide) */
export const tabVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18 } },
  exit: { opacity: 0, transition: { duration: 0.12 } },
};

/** Coaching banner — slides down from top */
export const bannerVariants: Variants = {
  initial: { y: -80, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springSnappy },
  exit: { y: -80, opacity: 0, transition: springSnappy },
};

/** Phase transition banner — slides up from bottom (action-sheet style) */
export const phaseTransitionVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springGentle },
  exit: { y: '100%', opacity: 0, transition: springSnappy },
};

/** Stagger children for list animations */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

/** Fade-up item for staggered lists */
export const fadeUpItem: Variants = {
  initial: { y: 16, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: springDefault },
};
