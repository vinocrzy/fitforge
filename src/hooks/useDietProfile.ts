// ═══════════════════════════════════════════════════════════════════
// FitForge — TanStack Query hook: Diet Profile
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useQuery } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { DietProfile } from '@/types';

export function useDietProfile() {
  const { user } = useUser();
  const userId = user?.id ?? 'guest';

  return useQuery<DietProfile | null>({
    queryKey: ['diet', 'profile', userId],
    queryFn: async () => {
      try {
        return await nutritionDb.get<DietProfile>(`diet_profile_user_${userId}`);
      } catch (err: unknown) {
        const isNotFound =
          err instanceof Error &&
          (err as { status?: number }).status === 404;
        if (isNotFound) return null;
        throw err;
      }
    },
  });
}
