// ═══════════════════════════════════════════════════════════════════
// FitForge — Navigation Direction Tracker
// Determines push vs pop for page transition variants
// ═══════════════════════════════════════════════════════════════════

// Route hierarchy for determining direction
const ROUTE_ORDER: string[] = [
  '/splash',
  '/onboarding/welcome',
  '/onboarding/goals',
  '/onboarding/profile',
  '/',
  '/routines',
  '/exercises',
  '/history',
  '/profile',
  '/session',
];

let previousPathIndex = -1;

/**
 * Determine navigation direction based on route depth.
 * Returns 'push' for forward navigation, 'pop' for back.
 */
export function getNavDirection(pathname: string): 'push' | 'pop' {
  // Find the closest matching route
  const currentIndex = ROUTE_ORDER.findIndex(
    (route) => pathname === route || pathname.startsWith(route + '/')
  );

  const direction =
    currentIndex >= 0 && currentIndex < previousPathIndex ? 'pop' : 'push';

  if (currentIndex >= 0) {
    previousPathIndex = currentIndex;
  }

  return direction;
}
