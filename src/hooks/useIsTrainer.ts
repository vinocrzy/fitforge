// ═══════════════════════════════════════════════════════════════════
// FitForge — useIsTrainer Hook
// Returns whether the current Clerk user has the trainer role
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useUser } from '@clerk/nextjs';

export function useIsTrainer(): boolean {
  const { user } = useUser();
  return (user?.publicMetadata as Record<string, unknown> | undefined)?.role === 'trainer';
}
