// ═══════════════════════════════════════════════════════════════════
// FitForge — S-PT-03: Trainer Enrollment Page
// User enrolls as a personal trainer
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TopBar } from '@/components/layout/TopBar';
import { TrainerEnrollmentForm } from '@/components/trainer/TrainerEnrollmentForm';
import { Icon } from '@/components/ui/Icon';
import { useUser } from '@clerk/nextjs';
import { useEnrollTrainer } from '@/hooks/useTrainers';
import { useIsTrainer } from '@/hooks/useIsTrainer';
import { springGentle } from '@/lib/motion/springs';

export default function TrainerEnrollPage(): React.ReactElement {
  const router = useRouter();
  const { user } = useUser();
  const isTrainer = useIsTrainer();
  const enrollMutation = useEnrollTrainer();

  // Already enrolled — redirect to trainer dashboard (Phase 2)
  if (isTrainer) {
    return (
      <div className="min-h-screen bg-[#0B0B0B]">
        <TopBar title="Trainer Portal" showBack />
        <div className="px-6 pt-[calc(44px+env(safe-area-inset-top,0px)+32px)] pb-28">
          <motion.div
            className="flex flex-col items-center justify-center py-16"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springGentle}
          >
            <Icon name="checkmark.circle.fill" size={56} color="#C5F74F" weight="fill" />
            <h2
              className="text-[22px] font-extrabold mt-4"
              style={{ color: '#F5F5F5' }}
            >
              You&apos;re a Trainer!
            </h2>
            <p
              className="text-[15px] mt-2 text-center"
              style={{ color: 'rgba(245,245,245,0.55)' }}
            >
              Your trainer profile is live. The trainer dashboard is coming in the next update.
            </p>
          </motion.div>
        </div>
      </div>
    );
  }

  const defaultName = user?.fullName ?? user?.firstName ?? '';

  return (
    <div className="min-h-screen bg-[#0B0B0B]">
      <TopBar title="Become a Trainer" showBack />

      <div
        className="px-6 pb-8"
        style={{ paddingTop: 'calc(44px + env(safe-area-inset-top, 0px) + 16px)' }}
      >
        {/* Hero */}
        <motion.div
          className="mb-6"
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          <h1
            className="text-[28px] font-extrabold"
            style={{ color: '#F5F5F5', letterSpacing: '-0.025em' }}
          >
            Share Your Expertise
          </h1>
          <p
            className="text-[15px] mt-2 leading-relaxed"
            style={{ color: 'rgba(245,245,245,0.55)' }}
          >
            Help others reach their fitness goals. Create your trainer profile and start connecting with clients.
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.08 }}
        >
          <TrainerEnrollmentForm
            defaultName={defaultName}
            isSubmitting={enrollMutation.isPending}
            onSubmit={(data) => {
              enrollMutation.mutate(data, {
                onSuccess: () => {
                  // Force a page reload to refresh Clerk session claims with new role
                  window.location.href = '/trainers';
                },
              });
            }}
          />
        </motion.div>

        {/* Error display */}
        {enrollMutation.isError && (
          <motion.div
            className="mt-4 rounded-[12px] p-3 flex items-center gap-2"
            style={{
              background: 'rgba(255,69,58,0.12)',
              border: '1px solid rgba(255,69,58,0.25)',
            }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Icon name="exclamationmark.circle.fill" size={16} color="#FF453A" />
            <span className="text-[14px]" style={{ color: '#FF453A' }}>
              {enrollMutation.error?.message ?? 'Something went wrong. Please try again.'}
            </span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
