'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springDefault, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useFoodStore } from '@/store/useFoodStore';
import { useLogMealEntry } from '@/hooks/useMealEntries';
import type { MealSlot, MacroTargets, FoodLibraryItem, FoodItem } from '@/types';

// ─── Macro scaling helper ─────────────────────────────────────────

function scale(per100g: number, portionG: number): number {
  return Math.round((per100g * portionG) / 100 * 10) / 10;
}

function scaleMacros(per100g: MacroTargets, portionG: number): MacroTargets {
  return {
    calories: Math.round((per100g.calories * portionG) / 100),
    proteinG: scale(per100g.proteinG, portionG),
    carbsG: scale(per100g.carbsG, portionG),
    fatG: scale(per100g.fatG, portionG),
  };
}

// ─── MacroChip ────────────────────────────────────────────────────

function MacroChip({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="flex flex-col items-center glass rounded-xl px-4 py-3">
      <span className="text-lg font-bold tabular-nums" style={{ color: 'var(--brand-text)' }}>
        {value}
      </span>
      <span className="text-[10px] mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
        {unit}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--brand-text-3)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────

export interface PortionPickerScreenProps {
  foodId: string;
  slot: string;
  date: string;
  foodName: string;
  isCustom: boolean;
}

// ─── PortionPickerScreen ──────────────────────────────────────────

export function PortionPickerScreen({ foodId, slot, date, foodName, isCustom }: PortionPickerScreenProps) {
  const router = useRouter();
  const { libraryItems, customItems, loadLibrary } = useFoodStore();
  const logEntry = useLogMealEntry();

  const [portionG, setPortionG] = useState<number>(100);
  const [portionInput, setPortionInput] = useState<string>('100');

  // Find the food item
  const food: FoodLibraryItem | FoodItem | undefined = isCustom
    ? customItems.find((f) => f._id === foodId)
    : libraryItems.find((f) => (f as FoodLibraryItem).id === foodId);

  // Load library if not yet loaded
  useEffect(() => {
    if (libraryItems.length === 0 && customItems.length === 0) {
      loadLibrary();
    }
  }, [libraryItems.length, customItems.length, loadLibrary]);

  // Once food is found, set default portion
  useEffect(() => {
    if (food) {
      const w = food.defaultPortion.weightG;
      setPortionG(w);
      setPortionInput(String(w));
    }
  }, [food]);

  const handleInputChange = (val: string) => {
    setPortionInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) setPortionG(n);
  };

  const step = food?.defaultPortion.weightG ?? 50;

  const handleDecrement = () => {
    const next = Math.max(1, portionG - step);
    setPortionG(next);
    setPortionInput(String(next));
  };

  const handleIncrement = () => {
    const next = portionG + step;
    setPortionG(next);
    setPortionInput(String(next));
  };

  const scaledMacros = food ? scaleMacros(food.per100g, portionG) : null;
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  const handleLog = () => {
    if (!food || !scaledMacros) return;
    logEntry.mutate(
      {
        date,
        slot: slot as MealSlot,
        foodId,
        isCustomFood: isCustom,
        foodName: food.name,
        portionWeightG: portionG,
        macros: scaledMacros,
      },
      {
        onSuccess: () => router.replace('/diet'),
      },
    );
  };

  // Loading state
  if (!food) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center"
        style={{ background: 'var(--brand-bg)' }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 rounded-full"
          style={{ background: 'var(--brand-surface-2)' }}
        />
        <p className="text-sm mt-4" style={{ color: 'var(--brand-text-2)' }}>
          Loading food…
        </p>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col pb-10"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <motion.button
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          onClick={() => router.back()}
          className="flex items-center justify-center w-9 h-9 rounded-full glass"
          aria-label="Go back"
        >
          <Icon name="chevron.left" size={20} color="var(--brand-text)" />
        </motion.button>
        <div className="flex-1 min-w-0">
          <h1
            className="font-bold text-lg truncate"
            style={{ color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
          >
            {food.name}
          </h1>
          {food.brand && (
            <p className="text-xs truncate" style={{ color: 'var(--brand-text-2)' }}>
              {food.brand}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 space-y-4">
        {/* Per 100g card */}
        <div className="glass rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--brand-text-2)' }}>
            PER 100g
          </p>
          <div className="grid grid-cols-4 gap-2">
            <MacroChip label="Cal" value={food.per100g.calories} unit="kcal" />
            <MacroChip label="Protein" value={food.per100g.proteinG} unit="g" />
            <MacroChip label="Carbs" value={food.per100g.carbsG} unit="g" />
            <MacroChip label="Fat" value={food.per100g.fatG} unit="g" />
          </div>
        </div>

        {/* Portion input */}
        <div className="glass rounded-2xl px-4 py-5">
          <p className="text-xs font-semibold mb-4" style={{ color: 'var(--brand-text-2)' }}>
            PORTION
          </p>
          <div className="flex items-center justify-center gap-4">
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={handleDecrement}
              className="w-11 h-11 rounded-full glass flex items-center justify-center"
              aria-label="Decrease portion"
            >
              <Icon name="minus" size={20} color="var(--brand-text)" />
            </motion.button>

            <div className="flex items-baseline gap-1.5">
              <input
                type="number"
                value={portionInput}
                onChange={(e) => handleInputChange(e.target.value)}
                className="w-24 text-center text-3xl font-bold bg-transparent outline-none tabular-nums"
                style={{ color: 'var(--brand-text)' }}
                min={1}
              />
              <span className="text-base" style={{ color: 'var(--brand-text-2)' }}>
                g
              </span>
            </div>

            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={springSnappy}
              onClick={handleIncrement}
              className="w-11 h-11 rounded-full glass flex items-center justify-center"
              aria-label="Increase portion"
            >
              <Icon name="plus" size={20} color="var(--brand-text)" />
            </motion.button>
          </div>

          <p className="text-center text-xs mt-3" style={{ color: 'var(--brand-text-3)' }}>
            Default: {food.defaultPortion.amount} {food.defaultPortion.unit} ({food.defaultPortion.weightG}g)
          </p>
        </div>

        {/* Live macros for this portion */}
        {scaledMacros && (
          <motion.div
            key={portionG}
            initial={{ opacity: 0.7, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={springSnappy}
            className="glass rounded-2xl px-4 py-4"
          >
            <p className="text-xs font-semibold mb-3" style={{ color: 'var(--brand-text-2)' }}>
              FOR THIS PORTION
            </p>
            <div className="grid grid-cols-4 gap-2">
              <MacroChip label="Cal" value={scaledMacros.calories} unit="kcal" />
              <MacroChip label="Protein" value={scaledMacros.proteinG} unit="g" />
              <MacroChip label="Carbs" value={scaledMacros.carbsG} unit="g" />
              <MacroChip label="Fat" value={scaledMacros.fatG} unit="g" />
            </div>
          </motion.div>
        )}
      </div>

      {/* Log CTA */}
      <div className="px-4 pt-4">
        <motion.button
          whileTap={{ scale: logEntry.isPending ? 1 : 0.97 }}
          transition={springSnappy}
          onClick={handleLog}
          disabled={logEntry.isPending}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2',
            logEntry.isPending ? 'opacity-60' : '',
          )}
          style={{ background: 'var(--brand-lime)', color: '#0B0B0B' }}
        >
          {logEntry.isPending ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Icon name="arrow.clockwise" size={20} color="#0B0B0B" />
            </motion.span>
          ) : (
            `Log to ${slotLabel}`
          )}
        </motion.button>
      </div>
    </div>
  );
}
