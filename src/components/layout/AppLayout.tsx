// ═══════════════════════════════════════════════════════════════════
// FitForge — App Layout with iOS 26 Sheet Scale-Behind
// Wraps all (app) route group pages with transitions
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { getNavDirection } from '@/lib/motion/navDirection';
import {
  pushVariants,
  popVariants,
  sheetBackgroundVariants,
} from '@/lib/motion/variants';
import { useSheetStore } from '@/store/useSheetStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useStartupSync } from '@/hooks/useStartupSync';
import { useSyncManager } from '@/hooks/useSyncManager';
import { ConflictResolverSheet } from '@/components/sync/ConflictResolverSheet';
import { BottomNav } from './BottomNav';
import type { RoutineConflict } from '@/types';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const router = useRouter();
  const accounts = useAuthStore((s) => s.accounts);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const skippedAuth = useAuthStore((s) => s.skippedAuth);

  // Auth guard: redirect unauthenticated users before rendering app content.
  // We gate on a hydration flag so we don’t redirect during SSR or before
  // Zustand’s persisted state has been loaded from localStorage.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setHydrated(true); }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skippedAuth) return;           // local-only mode — no redirect
    if (accounts.length === 0) {
      router.replace('/register');
    } else if (!isAuthenticated) {
      router.replace('/user-select');
    }
  }, [hydrated, skippedAuth, accounts.length, isAuthenticated, router]);

  // Seed / delta-sync exercise library from static JSON on first mount
  useStartupSync();

  // Start CouchDB sync if authenticated; expose conflicts for resolution
  const { conflicts, dismissConflict } = useSyncManager();
  const [activeConflict, setActiveConflict] = useState<RoutineConflict | null>(
    conflicts[0] ?? null,
  );

  // When a new conflict arrives and none is shown yet, surface it
  if (conflicts.length > 0 && !activeConflict) {
    setActiveConflict(conflicts[0]);
  }

  const pathname = usePathname();
  const direction = getNavDirection(pathname);
  const variants = direction === 'pop' ? popVariants : pushVariants;
  const sheetOpen = useSheetStore((s) => s.isOpen);

  // Render nothing until hydrated and auth state resolved to avoid content flash
  if (!hydrated || (!isAuthenticated && !skippedAuth)) {
    return <div className="min-h-screen bg-[#0B0B0B]" />;
  }

  return (
    <div className="relative min-h-screen bg-[#0B0B0B]">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.div
          key={pathname}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          /* 
           * transformTemplate removes residual transform: translateX(0px)
           * at rest, which would otherwise break backdrop-filter on 
           * child elements like TopBar (new stacking context issue).
           */
          transformTemplate={(_transform, generated) => {
            // If transform is identity (at rest), return 'none' so the
            // browser doesn't create a containing block.
            if (
              generated === 'translateX(0px)' ||
              generated === 'translateX(0)' ||
              generated === 'none' ||
              generated === ''
            )
              return 'none';
            return generated;
          }}
          style={{
            position: 'absolute',
            inset: 0,
            overflowY: 'auto',
          }}
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

      <BottomNav />

      {/* Conflict resolver — shown when PouchDB sync detects conflicting revisions */}
      <ConflictResolverSheet
        conflict={activeConflict}
        onClose={() => setActiveConflict(null)}
        onResolved={(id) => {
          dismissConflict(id);
          setActiveConflict(null);
        }}
      />
    </div>
  );
}
