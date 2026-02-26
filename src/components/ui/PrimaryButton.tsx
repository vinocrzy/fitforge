// ═══════════════════════════════════════════════════════════════════
// FitForge — Primary Button Component
// Lime pill CTA — Design System §3.2
// ═══════════════════════════════════════════════════════════════════

'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';

interface PrimaryButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}

export function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: PrimaryButtonProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        w-full h-14 rounded-full
        font-semibold text-[17px] tracking-tight
        transition-colors
        ${
          disabled
            ? 'bg-[rgba(197,247,79,0.25)] text-[rgba(11,11,11,0.45)] cursor-not-allowed'
            : 'bg-[#C5F74F] text-[#0B0B0B] glow-primary active:bg-[#A8D93D]'
        }
        ${className}
      `}
      whileTap={
        !disabled && !reduceMotion
          ? { scale: 0.97, boxShadow: '0 0 12px rgba(197,247,79,0.25)' }
          : undefined
      }
      transition={reduceMotion ? { duration: 0 } : springSnappy}
    >
      {children}
    </motion.button>
  );
}
