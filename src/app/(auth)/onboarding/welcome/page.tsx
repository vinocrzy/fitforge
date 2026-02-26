// ═══════════════════════════════════════════════════════════════════
// FitForge — S-02 Onboarding Welcome Screen
// Hero photo + value proposition + CTA
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springGentle } from '@/lib/motion/springs';
import { PrimaryButton } from '@/components/ui/PrimaryButton';

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background:
              i < current
                ? '#C5F74F'
                : 'rgba(255,255,255,0.25)',
          }}
        />
      ))}
    </div>
  );
}

export default function OnboardingWelcomePage() {
  const router = useRouter();

  return (
    <div className="fixed inset-0 flex flex-col bg-[#0B0B0B]">
      {/* Hero Photo — top 65% */}
      <div
        className="relative"
        style={{ height: '65vh' }}
      >
        <img
          src="https://picsum.photos/seed/fitwelcome/800/1000"
          alt="Athlete training"
          className="w-full h-full object-cover"
        />
        {/* Gradient scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 30%, #0B0B0B 80%)',
          }}
        />
      </div>

      {/* Content Card */}
      <div
        className="relative flex-1 px-6 -mt-[15vh]"
        style={{ zIndex: 10 }}
      >
        <ProgressDots current={1} total={4} />

        <motion.h1
          className="mt-6 text-[34px] font-extrabold tracking-tight leading-[1.15]"
          style={{ color: '#F5F5F5' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.1 }}
        >
          Build the
          <br />
          Body You Want.
        </motion.h1>

        <motion.p
          className="mt-3 text-[17px] leading-relaxed"
          style={{ color: 'rgba(245,245,245,0.60)' }}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.2 }}
        >
          Track every lift, rest better, grow faster.
        </motion.p>

        <motion.div
          className="mt-8"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ ...springGentle, delay: 0.3 }}
        >
          <PrimaryButton onClick={() => router.push('/onboarding/goals')}>
            GET STARTED
          </PrimaryButton>
        </motion.div>

        <motion.p
          className="mt-4 text-center text-[13px]"
          style={{ color: 'rgba(245,245,245,0.45)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Already have an account?{' '}
          <span style={{ color: '#C5F74F' }} className="cursor-pointer">
            Sign in
          </span>
        </motion.p>
      </div>
    </div>
  );
}
