// ═══════════════════════════════════════════════════════════════════
// FitForge — WeightSelector
// Inline weight stepper for workout execution
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';

interface WeightSelectorProps {
  value: number | null;
  onChange: (value: number) => void;
  unit: 'kg' | 'lbs';
  step?: number;
}

export function WeightSelector({
  value,
  onChange,
  unit,
  step = 2.5,
}: WeightSelectorProps) {
  const currentValue = value ?? 0;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (longPressInterval.current) clearInterval(longPressInterval.current);
    longPressTimer.current = null;
    longPressInterval.current = null;
  }, []);

  const startLongPress = useCallback(
    (direction: 'up' | 'down') => {
      const bigStep = step * 2;
      longPressTimer.current = setTimeout(() => {
        longPressInterval.current = setInterval(() => {
          onChange(
            direction === 'up'
              ? currentValue + bigStep
              : Math.max(0, currentValue - bigStep)
          );
          navigator.vibrate?.(20);
        }, 150);
      }, 600);
    },
    [currentValue, onChange, step]
  );

  const handleDecrement = () => {
    const newVal = Math.max(0, currentValue - step);
    onChange(newVal);
    navigator.vibrate?.(30);
  };

  const handleIncrement = () => {
    onChange(currentValue + step);
    navigator.vibrate?.(30);
  };

  const handleEditSubmit = () => {
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setIsEditing(false);
  };

  if (currentValue === 0 && value === null) {
    return null; // Bodyweight exercise — no weight selector
  }

  return (
    <div
      className="flex items-center justify-center gap-3 h-[52px] rounded-[14px] px-4 mx-4"
      style={{ background: '#1E1E1E' }}
    >
      {/* Scale icon */}
      <Icon
        name="scalemass.fill"
        size={18}
        color="rgba(245,245,245,0.45)"
      />

      {/* Decrement */}
      <motion.button
        onClick={handleDecrement}
        onPointerDown={() => startLongPress('down')}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        whileTap={{ scale: 0.9 }}
        transition={springSnappy}
        className="w-8 h-8 rounded-[10px] flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Icon name="chevron.down" size={14} color="#F5F5F5" />
      </motion.button>

      {/* Weight display */}
      {isEditing ? (
        <input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleEditSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleEditSubmit()}
          autoFocus
          className="w-20 text-center text-[22px] font-bold tabular-nums bg-transparent outline-none"
          style={{ color: '#F5F5F5' }}
        />
      ) : (
        <button
          onClick={() => {
            setEditValue(currentValue.toString());
            setIsEditing(true);
          }}
          className="flex items-center gap-1"
        >
          <AnimatePresence mode="popLayout">
            <motion.span
              key={currentValue}
              initial={{ y: -8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              transition={springSnappy}
              className="text-[22px] font-bold tabular-nums"
              style={{ color: '#F5F5F5' }}
            >
              {currentValue}
            </motion.span>
          </AnimatePresence>
          <span
            className="text-[15px]"
            style={{ color: 'rgba(245,245,245,0.50)' }}
          >
            {unit}
          </span>
        </button>
      )}

      {/* Increment */}
      <motion.button
        onClick={handleIncrement}
        onPointerDown={() => startLongPress('up')}
        onPointerUp={clearLongPress}
        onPointerLeave={clearLongPress}
        whileTap={{ scale: 0.9 }}
        transition={springSnappy}
        className="w-8 h-8 rounded-[10px] flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.06)' }}
      >
        <Icon name="chevron.up" size={14} color="#F5F5F5" />
      </motion.button>
    </div>
  );
}
