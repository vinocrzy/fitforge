// ═══════════════════════════════════════════════════════════════════
// FitForge — Data Restore Screen (Phase 8 — Clerk)
//
// Shown when navigating to /restore (e.g. after first sign-in on
// a new device). Subscribes to sync status and navigates home once
// the initial pull from CouchDB completes or the user skips.
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springGentle, springCelebration } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@clerk/nextjs';
import { useSyncManager } from '@/hooks/useSyncManager';

/** Max time we wait for CouchDB before allowing the user to continue. */
const SYNC_TIMEOUT_MS = 45_000;

const DB_LABELS: Record<string, string> = {
  fitforge_custom_exercises: 'Custom Exercises',
  fitforge_routines: 'Routines',
  fitforge_workouts: 'Workout History',
  fitforge_profile: 'Profile & Settings',
};

export default function RestorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { syncStatus } = useSyncManager();

  const [timedOut, setTimedOut] = useState(false);
  const [done, setDone] = useState(false);
  const navigatedRef = useRef(false);

  // Timeout fallback — after SYNC_TIMEOUT_MS let the user proceed anyway
  useEffect(() => {
    const id = setTimeout(() => setTimedOut(true), SYNC_TIMEOUT_MS);
    return () => clearTimeout(id);
  }, []);

  // Navigate home when sync completes
  useEffect(() => {
    if (navigatedRef.current) return;
    if (syncStatus.state === 'synced' || syncStatus.state === 'idle') {
      setDone(true);
      const id = setTimeout(() => {
        if (navigatedRef.current) return;
        navigatedRef.current = true;
        router.replace('/');
      }, 900); // brief "All done" moment
      return () => clearTimeout(id);
    }
  }, [syncStatus.state, router]);

  const handleSkip = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    router.replace('/');
  };

  const isSyncing = syncStatus.state === 'syncing';
  const isError = syncStatus.state === 'error';

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0B0B] px-8"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
      }}
    >
      <AnimatePresence mode="wait">
        {done ? (
          /* ── All done ── */
          <motion.div
            key="done"
            className="flex flex-col items-center gap-5 text-center"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springCelebration}
          >
            <motion.div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(48,209,88,0.15)' }}
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ ...springCelebration, repeat: 0 }}
            >
              <Icon name="checkmark.icloud.fill" size={38} color="#30D158" />
            </motion.div>
            <div>
              <h2 className="text-[28px] font-extrabold" style={{ color: '#F5F5F5' }}>
                All synced!
              </h2>
              <p className="text-[15px] mt-1" style={{ color: 'rgba(245,245,245,0.45)' }}>
                Your data is ready on this device.
              </p>
            </div>
          </motion.div>
        ) : (
          /* ── Syncing ── */
          <motion.div
            key="syncing"
            className="flex flex-col items-center gap-8 text-center w-full max-w-[320px]"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={springGentle}
          >
            {/* Animated cloud icon */}
            <div className="relative">
              <motion.div
                className="w-24 h-24 rounded-[28px] flex items-center justify-center"
                style={{ background: 'rgba(100,210,255,0.10)' }}
                animate={isSyncing ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Icon
                  name={isError ? 'exclamationmark.icloud.fill' : 'icloud.fill'}
                  size={44}
                  color={isError ? '#FF453A' : '#64D2FF'}
                />
              </motion.div>

              {/* Spinning ring while actively syncing */}
              {isSyncing && (
                <motion.div
                  className="absolute inset-0 rounded-[28px]"
                  style={{
                    border: '2px solid transparent',
                    borderTopColor: '#64D2FF',
                    borderRightColor: 'rgba(100,210,255,0.25)',
                  }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'linear' }}
                />
              )}
            </div>

            {/* Title */}
            <div className="flex flex-col gap-2">
              <h1 className="text-[28px] font-extrabold tracking-tight" style={{ color: '#F5F5F5' }}>
                {isError
                  ? 'Sync error'
                  : timedOut
                  ? 'Still syncing…'
                  : 'Restoring your data'}
              </h1>
              <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(245,245,245,0.50)' }}>
                {isError
                  ? syncStatus.errorMessage ?? 'Could not reach your CouchDB server.'
                  : user
                  ? `Pulling ${user.firstName ?? 'your'}'s workouts, routines, and history from your CouchDB server.`
                  : 'Pulling your workouts, routines, and history from your CouchDB server.'}
              </p>
            </div>

            {/* Database progress rows */}
            <div className="w-full flex flex-col gap-2">
              {Object.entries(DB_LABELS).map(([, label], i) => (
                <motion.div
                  key={label}
                  className="flex items-center gap-3 px-4 py-3 rounded-[14px]"
                  style={{ background: '#141414' }}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ ...springDefault, delay: i * 0.08 }}
                >
                  <motion.div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: isError ? '#FF453A' : '#64D2FF' }}
                    animate={
                      isSyncing
                        ? { opacity: [1, 0.3, 1] }
                        : { opacity: 1, background: '#30D158' }
                    }
                    transition={{
                      duration: 1.0,
                      delay: i * 0.15,
                      repeat: isSyncing ? Infinity : 0,
                      ease: 'easeInOut',
                    }}
                  />
                  <span className="text-[14px] font-medium" style={{ color: 'rgba(245,245,245,0.70)' }}>
                    {label}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Skip / continue button */}
            <AnimatePresence>
              {(timedOut || isError) && (
                <motion.div
                  className="flex flex-col items-center gap-3 w-full"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springDefault}
                >
                  {isError && (
                    <p className="text-[13px]" style={{ color: 'rgba(245,245,245,0.40)' }}>
                      Check your CouchDB server and internet connection.
                    </p>
                  )}
                  <motion.button
                    className="h-14 w-full rounded-[18px] text-[17px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#F5F5F5' }}
                    whileTap={{ scale: 0.97 }}
                    transition={springDefault}
                    onClick={handleSkip}
                  >
                    Continue anyway
                  </motion.button>
                  <p className="text-[12px]" style={{ color: 'rgba(245,245,245,0.30)' }}>
                    Sync will finish in the background.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Subtle skip link — always visible after a moment */}
            <motion.button
              className="text-[14px]"
              style={{ color: 'rgba(245,245,245,0.25)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 5 }}
              onClick={handleSkip}
            >
              Skip for now
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
