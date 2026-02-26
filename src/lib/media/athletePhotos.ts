// ═══════════════════════════════════════════════════════════════════
// FitForge — Athlete Hero Photos (Architecture §2.8)
// Category → photo URL mapping
// ═══════════════════════════════════════════════════════════════════

const isProd = process.env.NODE_ENV === 'production';

export const ATHLETE_PHOTO: Record<string, string> = {
  strength: isProd
    ? '/images/athletes/strength.jpg'
    : 'https://picsum.photos/seed/fitstrength/800/500',
  cardio: isProd
    ? '/images/athletes/cardio.jpg'
    : 'https://picsum.photos/seed/fitcardio/800/500',
  stretching: isProd
    ? '/images/athletes/stretch.jpg'
    : 'https://picsum.photos/seed/fitstretch/800/500',
  warmup: isProd
    ? '/images/athletes/warmup.jpg'
    : 'https://picsum.photos/seed/fitwarmup/800/500',
  upper: isProd
    ? '/images/athletes/upper.jpg'
    : 'https://picsum.photos/seed/fitupper/800/500',
  lower: isProd
    ? '/images/athletes/lower.jpg'
    : 'https://picsum.photos/seed/fitlower/800/500',
  core: isProd
    ? '/images/athletes/core.jpg'
    : 'https://picsum.photos/seed/fitcore/800/500',
  fullbody: isProd
    ? '/images/athletes/fullbody.jpg'
    : 'https://picsum.photos/seed/fitfull/800/500',
};

export const ATHLETE_PHOTO_FALLBACK = isProd
  ? '/images/placeholder-athlete.jpg'
  : 'https://picsum.photos/seed/fitdefault/800/500';

/**
 * Get the hero photo URL for a workout category.
 */
export function getAthletePhoto(category: string): string {
  return ATHLETE_PHOTO[category] ?? ATHLETE_PHOTO_FALLBACK;
}
