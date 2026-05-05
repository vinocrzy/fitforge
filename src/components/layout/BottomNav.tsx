// ═══════════════════════════════════════════════════════════════════
// FitForge — Bottom Navigation (iOS 26 Floating Pill Tab Bar)
// Design System §3.2 — Liquid Glass, layoutId indicator
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useIsTrainer } from '@/hooks/useIsTrainer';

const baseTabs = [
  { id: 'home', icon: 'house.fill', href: '/' },
  { id: 'routines', icon: 'list.bullet.clipboard.fill', href: '/routines' },
  { id: 'exercises', icon: 'figure.strengthtraining.traditional', href: '/exercises' },
  { id: 'diet', icon: 'fork.knife', href: '/diet' },
  { id: 'history', icon: 'clock.arrow.circlepath', href: '/history' },
  { id: 'profile', icon: 'person.crop.circle.fill', href: '/profile' },
] as const;

const trainerTab = { id: 'trainer', icon: 'briefcase.fill', href: '/trainer' } as const;

export function BottomNav() {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const isTrainer = useIsTrainer();

  const tabs = useMemo(() => {
    if (!isTrainer) return baseTabs;
    // Insert trainer tab before profile
    return [
      ...baseTabs.slice(0, 4),
      trainerTab,
      ...baseTabs.slice(4),
    ] as ReadonlyArray<{ id: string; icon: string; href: string }>;
  }, [isTrainer]);

  // Don't show nav on onboarding/splash routes
  if (
    pathname.startsWith('/splash') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/session') ||
    pathname.startsWith('/restore') ||
    pathname.startsWith('/diet/setup') ||
    pathname.startsWith('/diet/log') ||
    pathname.startsWith('/diet/food') ||
    pathname.startsWith('/diet/weight') ||
    pathname.startsWith('/diet/templates')
  ) {
    return null;
  }

  const activeTab =
    tabs.find(
      (t) =>
        t.href === pathname ||
        (t.href !== '/' && pathname.startsWith(t.href))
    )?.id ?? 'home';

  return (
    <nav
      className="fixed z-50 glass-tab-bar"
      style={{
        bottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
        left: 16,
        right: 16,
        height: 72,
        backdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%) brightness(1.05)',
      }}
    >
      <div className="flex items-center justify-around h-full px-4">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-16 h-16"
            >
              {/* Active indicator pill */}
              {isActive && (
                <motion.div
                  layoutId="tab-indicator"
                  className="glass-active-pill absolute inset-x-1 inset-y-2"
                  transition={
                    reduceMotion ? { duration: 0 } : springSnappy
                  }
                />
              )}

              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={
                  reduceMotion ? { duration: 0 } : springSnappy
                }
                className="relative z-10"
              >
                <Icon
                  name={tab.icon}
                  size={24}
                  weight={isActive ? 'fill' : 'regular'}
                  color={
                    isActive ? '#C5F74F' : 'rgba(245,245,245,0.40)'
                  }
                />
              </motion.div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
