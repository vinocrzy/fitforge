// ═══════════════════════════════════════════════════════════════════
// FitForge — WorkoutCalendar (Monthly Heatmap)
// Displays a month grid with workout intensity heatmap
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import type { WorkoutSession } from '@/types';

interface WorkoutCalendarProps {
  workouts: WorkoutSession[];
}

export function WorkoutCalendar({ workouts }: WorkoutCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Map workout dates to intensity (number of workouts on that date) + deload flag
  const dateData = useMemo(() => {
    const map = new Map<string, { regular: number; deload: number }>();
    for (const w of workouts) {
      const dateStr = new Date(w.completedAt).toISOString().split('T')[0];
      const current = map.get(dateStr) ?? { regular: 0, deload: 0 };
      if (w.isDeload) {
        current.deload += 1;
      } else {
        current.regular += 1;
      }
      map.set(dateStr, current);
    }
    return map;
  }, [workouts]);

  // Build calendar grid
  const grid = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDow = (firstDay.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDay.getDate();

    const cells: (number | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
  }, [year, month]);

  const today = new Date().toISOString().split('T')[0];

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => {
    const now = new Date();
    if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth())) {
      setViewDate(new Date(year, month + 1, 1));
    }
  };

  const canGoNext = (() => {
    const now = new Date();
    return year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth());
  })();

  // Workout count for this month
  const monthWorkoutCount = useMemo(() => {
    return workouts.filter((w) => {
      const d = new Date(w.completedAt);
      return d.getFullYear() === year && d.getMonth() === month;
    }).length;
  }, [workouts, year, month]);

  return (
    <div className="rounded-[20px] p-5" style={{ background: '#141414' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={prevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        >
          <Icon name="chevron.left" size={14} color="rgba(245,245,245,0.60)" />
        </motion.button>
        <div className="text-center">
          <p className="text-[17px] font-semibold" style={{ color: '#F5F5F5' }}>
            {monthNames[month]} {year}
          </p>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(245,245,245,0.45)' }}>
            {monthWorkoutCount} workout{monthWorkoutCount !== 1 ? 's' : ''}
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          transition={springSnappy}
          onClick={nextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-full"
          style={{
            background: 'rgba(255,255,255,0.06)',
            opacity: canGoNext ? 1 : 0.3,
          }}
          disabled={!canGoNext}
        >
          <Icon name="chevron.right" size={14} color="rgba(245,245,245,0.60)" />
        </motion.button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
          <div
            key={i}
            className="text-center text-[11px] font-medium py-1"
            style={{ color: 'rgba(245,245,245,0.35)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${year}-${month}`}
          className="grid grid-cols-7 gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {grid.map((day, i) => {
            if (day === null) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const data = dateData.get(dateStr) ?? { regular: 0, deload: 0 };
            const hasRegular = data.regular > 0;
            const hasDeload = data.deload > 0;
            const isToday = dateStr === today;

            // Determine background color based on workout type
            let bg = 'rgba(255,255,255,0.04)'; // Empty
            let textColor = 'rgba(245,245,245,0.35)';

            if (hasRegular && hasDeload) {
              // Mixed day: diagonal split gradient
              bg = 'linear-gradient(135deg, rgba(197,247,79,0.50) 50%, rgba(94,210,223,0.40) 50%)';
              textColor = '#0B0B0B';
            } else if (hasDeload) {
              // Deload only: muted teal
              bg = data.deload >= 2 ? 'rgba(94,210,223,0.60)' : 'rgba(94,210,223,0.40)';
              textColor = '#0B0B0B';
            } else if (hasRegular) {
              // Regular training: lime intensity
              bg = data.regular >= 2 ? 'rgba(197,247,79,0.70)' : 'rgba(197,247,79,0.35)';
              textColor = data.regular >= 2 ? '#0B0B0B' : '#F5F5F5';
            }

            return (
              <div
                key={dateStr}
                className="aspect-square rounded-[8px] flex items-center justify-center relative"
                style={{
                  background: bg,
                  border: isToday ? '1.5px solid #C5F74F' : 'none',
                }}
              >
                <span
                  className="text-[12px] tabular-nums font-medium"
                  style={{ color: textColor }}
                >
                  {day}
                </span>
              </div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(197,247,79,0.60)' }} />
          <span className="text-[11px]" style={{ color: 'rgba(245,245,245,0.50)' }}>Training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded" style={{ background: 'rgba(94,210,223,0.50)' }} />
          <span className="text-[11px]" style={{ color: 'rgba(245,245,245,0.50)' }}>Deload</span>
        </div>
      </div>
    </div>
  );
}
