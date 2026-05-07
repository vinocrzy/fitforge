'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';

interface MacroRingProps {
  label: string;
  consumed: number;
  target: number;
  color: string;
  size?: number;
  delay?: number;
}

function MacroRing({ label, consumed, target, color, size = 72, delay = 0 }: MacroRingProps) {
  const strokeWidth = 6;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillFraction = target > 0 ? Math.min(consumed / target, 1) : 0;

  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, [0, 1], [circumference, 0]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(progress, fillFraction, springDefault);
      return controls.stop;
    }, delay);
    return () => clearTimeout(timer);
  }, [fillFraction, progress, delay]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={0.2}
          />
          {/* Progress ring */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ gap: 1 }}>
          <span
            className="font-bold tabular-nums leading-none"
            style={{ fontSize: 14, color: 'var(--brand-text)' }}
          >
            {r2(consumed)}g
          </span>
          <span style={{ fontSize: 10, color: 'var(--brand-text-2)' }}>{label}</span>
        </div>
      </div>
    </div>
  );
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface MacroRingsProps {
  consumed: { proteinG: number; carbsG: number; fatG: number };
  target: { proteinG: number; carbsG: number; fatG: number };
}

export function MacroRings({ consumed, target }: MacroRingsProps) {
  return (
    <div className="flex justify-around w-full">
      <MacroRing
        label="Protein"
        consumed={consumed.proteinG}
        target={target.proteinG}
        color="#64D2FF"
        delay={0}
      />
      <MacroRing
        label="Carbs"
        consumed={consumed.carbsG}
        target={target.carbsG}
        color="var(--brand-lime)"
        delay={50}
      />
      <MacroRing
        label="Fat"
        consumed={consumed.fatG}
        target={target.fatG}
        color="#FF9F0A"
        delay={100}
      />
    </div>
  );
}
