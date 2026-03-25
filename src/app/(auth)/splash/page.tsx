// ═══════════════════════════════════════════════════════════════════
// FitForge — Splash Screen
// First screen the user sees — branding + auto-continue to sign-up
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springGentle, springCelebration } from '@/lib/motion/springs';

export default function SplashPage(): React.ReactElement {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  // Auto-navigate to sign-up after splash animation completes
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), 2200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (ready) {
      router.replace('/sign-up');
    }
  }, [ready, router]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0B0B]">
      {/* Logo / Brand Mark */}
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={springCelebration}
        className="flex flex-col items-center"
      >
        {/* Icon glow ring */}
        <motion.div
          className="relative flex items-center justify-center"
          style={{ width: 120, height: 120 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...springGentle, delay: 0.2 }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(197,247,79,0.20) 0%, transparent 70%)',
            }}
          />
          <svg
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Dumbbell icon */}
            <rect x="8" y="22" width="10" height="20" rx="3" fill="#C5F74F" />
            <rect x="46" y="22" width="10" height="20" rx="3" fill="#C5F74F" />
            <rect x="18" y="28" width="28" height="8" rx="2" fill="#C5F74F" />
            <rect x="4" y="26" width="4" height="12" rx="2" fill="rgba(197,247,79,0.5)" />
            <rect x="56" y="26" width="4" height="12" rx="2" fill="rgba(197,247,79,0.5)" />
          </svg>
        </motion.div>

        {/* Wordmark */}
        <motion.h1
          className="mt-4 text-[40px] font-extrabold tracking-[-0.04em]"
          style={{ color: '#C5F74F' }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.3 }}
        >
          FitForge
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="mt-2 text-[15px] tracking-wide"
          style={{ color: 'rgba(245,245,245,0.50)' }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.5 }}
        >
          Build. Track. Dominate.
        </motion.p>
      </motion.div>

      {/* Loading pulse */}
      <motion.div
        className="absolute bottom-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
      >
        <div
          className="w-8 h-1 rounded-full"
          style={{ background: 'rgba(197,247,79,0.40)' }}
        />
      </motion.div>
    </div>
  );
}
