// ═══════════════════════════════════════════════════════════════════
// FitForge — Fatigue Warning Banner
// Shows on routine detail when fatigue warnings are detected
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { FatigueWarning } from '@/hooks/useFatigueWarnings';

const SEVERITY_CONFIG = {
  info: {
    bg: 'rgba(100,210,255,0.08)',
    border: 'rgba(100,210,255,0.20)',
    icon: 'info.circle.fill',
    iconColor: '#64D2FF',
  },
  warning: {
    bg: 'rgba(255,159,10,0.08)',
    border: 'rgba(255,159,10,0.20)',
    icon: 'exclamationmark.triangle.fill',
    iconColor: '#FF9F0A',
  },
  danger: {
    bg: 'rgba(255,69,58,0.08)',
    border: 'rgba(255,69,58,0.20)',
    icon: 'exclamationmark.octagon.fill',
    iconColor: '#FF453A',
  },
};

interface FatigueWarningBannerProps {
  warnings: FatigueWarning[];
}

export function FatigueWarningBanner({ warnings }: FatigueWarningBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || warnings.length === 0) return null;

  // Show highest severity warning first
  const sorted = [...warnings].sort((a, b) => {
    const order = { danger: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });

  const primary = sorted[0];
  const config = SEVERITY_CONFIG[primary.severity];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="rounded-[16px] p-4"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        <div className="flex items-start gap-3">
          <Icon name={config.icon} size={20} color={config.iconColor} weight="fill" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold" style={{ color: '#F5F5F5' }}>
              {primary.title}
            </p>
            <p className="text-[13px] mt-0.5" style={{ color: 'rgba(245,245,245,0.60)' }}>
              {primary.message}
            </p>
            {sorted.length > 1 && (
              <p className="text-[12px] mt-2" style={{ color: 'rgba(245,245,245,0.40)' }}>
                +{sorted.length - 1} more warning{sorted.length > 2 ? 's' : ''}
              </p>
            )}
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            transition={springSnappy}
            onClick={() => setDismissed(true)}
            className="w-6 h-6 flex items-center justify-center rounded-full"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <Icon name="xmark" size={10} color="rgba(245,245,245,0.50)" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
