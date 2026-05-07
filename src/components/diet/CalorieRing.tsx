'use client';

import { useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';

export interface CalorieRingProps {
  consumed: number;
  burned: number;
  target: number;
  size?: number;
}

export function CalorieRing({ consumed, burned, target, size = 180 }: CalorieRingProps) {
  const strokeWidth = 12;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const fillFraction = target > 0 ? Math.min(consumed / target, 1) : 0;
  const isOver = consumed > target;
  const net = consumed - burned;

  const progress = useMotionValue(0);
  const dashOffset = useTransform(progress, [0, 1], [circumference, 0]);
  const strokeColor = useTransform(
    progress,
    [0, 1],
    isOver ? ['var(--brand-danger)', 'var(--brand-danger)'] : ['var(--brand-lime)', 'var(--brand-lime)'],
  );

  useEffect(() => {
    const controls = animate(progress, fillFraction, springDefault);
    return controls.stop;
  }, [fillFraction, progress]);

  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Track ring */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={isOver ? 'var(--brand-danger)' : 'var(--brand-lime)'}
            strokeWidth={strokeWidth}
            strokeOpacity={0.2}
          />
          {/* Progress ring */}
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={isOver ? 'var(--brand-danger)' : 'var(--brand-lime)'}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: dashOffset }}
          />
        </svg>

        {/* Center text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ gap: 2 }}
        >
          <span
            className="font-extrabold tabular-nums leading-none"
            style={{
              fontSize: 28,
              color: isOver ? 'var(--brand-danger)' : 'var(--brand-text)',
            }}
          >
            {Math.round(consumed)}
          </span>
          <span style={{ fontSize: 11, color: 'var(--brand-text-2)' }}>consumed</span>
          <span style={{ fontSize: 11, color: 'var(--brand-text-3)' }}>of {Math.round(target)} kcal</span>
          {burned > 0 && (
            <span
              className="tabular-nums"
              style={{ fontSize: 10, color: 'var(--brand-text-3)', marginTop: 4 }}
            >
              −{Math.round(burned)} burn = {Math.round(net)} net
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
