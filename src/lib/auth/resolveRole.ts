// ═══════════════════════════════════════════════════════════════════
// FitForge — Role Resolution Helper
// Server-side only. Resolves a user's role with a two-path strategy:
//  1. Fast: read from JWT session claims (zero extra network calls)
//  2. Slow: if JWT doesn't show 'trainer', fall back to live Clerk API
//     (handles stale tokens right after trainer enrollment)
// ═══════════════════════════════════════════════════════════════════

import { clerkClient } from '@clerk/nextjs/server';

/**
 * Resolves the Clerk role for a user. Guards against stale JWTs by
 * falling back to a live Clerk API call when the JWT claim is missing.
 *
 * @param userId - The authenticated Clerk user ID
 * @param sessionClaims - The session claims from auth() (may be stale)
 * @returns The resolved role string, or undefined if not set
 */
export async function resolveRole(
  userId: string,
  sessionClaims: Record<string, unknown> | null | undefined,
): Promise<string | undefined> {
  const jwtRole = (sessionClaims?.metadata as Record<string, unknown> | undefined)
    ?.role as string | undefined;

  if (jwtRole) return jwtRole;

  // JWT doesn't have a role — check live Clerk data (handles post-enrollment staleness)
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return (user.publicMetadata as Record<string, unknown>)?.role as string | undefined;
  } catch {
    return undefined;
  }
}
