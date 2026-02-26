// ═══════════════════════════════════════════════════════════════════
// FitForge — App Layout with iOS 26 Sheet Scale-Behind
// Wraps all (app) route group pages with transitions
// ═══════════════════════════════════════════════════════════════════

'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { getNavDirection } from '@/lib/motion/navDirection';
import {
  pushVariants,
  popVariants,
  sheetBackgroundVariants,
} from '@/lib/motion/variants';
import { useSheetStore } from '@/store/useSheetStore';
import { useStartupSync } from '@/hooks/useStartupSync';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  // Seed / delta-sync exercise library from static JSON on first mount
  useStartupSync();

  const pathname = usePathname();
  const direction = getNavDirection(pathname);
  const variants = direction === 'pop' ? popVariants : pushVariants;
  const sheetOpen = useSheetStore((s) => s.isOpen);

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
    </div>
  );
}
