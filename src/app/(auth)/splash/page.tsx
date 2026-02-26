// ═══════════════════════════════════════════════════════════════════
// FitForge — S-01 Splash Screen
// Brand moment with progress bar animation
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useProfileStore } from '@/store/useProfileStore';

export default function SplashPage() {
  const router = useRouter();
  const onboardingComplete = useProfileStore((s) => s.onboardingComplete);
  const progress = useMotionValue(0);
  const width = useTransform(progress, [0, 100], ['0%', '100%']);

  useEffect(() => {
    // Animate progress 0→100 over 600ms
    const startTime = Date.now();
    const duration = 600;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      progress.set(pct);

      if (pct < 100) {
        requestAnimationFrame(animate);
      } else {
        // Navigate after a brief pause
        setTimeout(() => {
          if (onboardingComplete) {
            router.replace('/');
          } else {
            router.replace('/onboarding/welcome');
          }
        }, 200);
      }
    };

    requestAnimationFrame(animate);
  }, [progress, router, onboardingComplete]);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#0B0B0B]">
      {/* Background overlay */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(https://picsum.photos/seed/fitsplash/800/1200)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.85) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Wordmark */}
        <h1
          className="text-[42px] font-extrabold uppercase tracking-[-0.04em]"
          style={{
            color: '#C5F74F',
            textShadow: '0 0 40px rgba(197,247,79,0.5)',
          }}
        >
          FITFORGE
        </h1>

        {/* Tagline */}
        <p
          className="mt-2 text-[15px]"
          style={{ color: 'rgba(245,245,245,0.60)' }}
        >
          Build. Track. Dominate.
        </p>
      </div>

      {/* Progress bar */}
      <div
        className="absolute z-10 rounded-full overflow-hidden"
        style={{
          bottom: 80,
          left: 32,
          right: 32,
          height: 2,
          background: 'rgba(255,255,255,0.12)',
        }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            width,
            background: '#C5F74F',
          }}
        />
      </div>
    </div>
  );
}
