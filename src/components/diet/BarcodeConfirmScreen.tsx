'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useLogMealEntry } from '@/hooks/useMealEntries';
import type { MealSlot } from '@/types';

// ─── Props ────────────────────────────────────────────────────────

export interface BarcodeConfirmScreenProps {
  slot?: string;
  date?: string;
  name?: string;
  brand?: string;
  barcode?: string;
  cal?: string;
  prot?: string;
  carb?: string;
  fat?: string;
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

// ─── BarcodeConfirmScreen ─────────────────────────────────────────

export function BarcodeConfirmScreen({
  slot = 'breakfast',
  date = new Date().toISOString().slice(0, 10),
  name = 'Unknown Product',
  brand,
  barcode = '',
  cal = '0',
  prot = '0',
  carb = '0',
  fat = '0',
}: BarcodeConfirmScreenProps) {
  const router = useRouter();
  const logEntry = useLogMealEntry();
  const [portionG, setPortionG] = useState(100);
  const [portionInput, setPortionInput] = useState('100');

  const calPer100 = parseFloat(cal) || 0;
  const protPer100 = parseFloat(prot) || 0;
  const carbPer100 = parseFloat(carb) || 0;
  const fatPer100 = parseFloat(fat) || 0;

  const scale = (v: number) => Math.round((v * portionG) / 100 * 10) / 10;
  const scaledCal = Math.round((calPer100 * portionG) / 100);
  const scaledProt = scale(protPer100);
  const scaledCarb = scale(carbPer100);
  const scaledFat = scale(fatPer100);

  const handlePortionInput = (val: string) => {
    setPortionInput(val);
    const n = parseFloat(val);
    if (!isNaN(n) && n >= 5) setPortionG(n);
  };

  const handleDecrement = () => {
    const next = Math.max(5, portionG - 10);
    setPortionG(next);
    setPortionInput(String(next));
  };

  const handleIncrement = () => {
    const next = Math.min(2000, portionG + 10);
    setPortionG(next);
    setPortionInput(String(next));
  };

  const handleLog = () => {
    logEntry.mutate(
      {
        date,
        slot: slot as MealSlot,
        foodId: `barcode_${barcode}`,
        isCustomFood: false,
        foodName: name,
        portionWeightG: portionG,
        macros: {
          calories: scaledCal,
          proteinG: scaledProt,
          carbsG: scaledCarb,
          fatG: scaledFat,
        },
      },
      { onSuccess: () => router.push('/diet') }
    );
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
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
            {name}
          </h1>
          {brand && (
            <p className="text-xs" style={{ color: 'var(--brand-text-2)' }}>{brand}</p>
          )}
        </div>
      </div>

      <div className="flex-1 px-4 py-4 flex flex-col gap-5">

        {/* Per-100g sub-label */}
        <p className="text-xs" style={{ color: 'var(--brand-text-3)' }}>
          Per 100g: {calPer100} kcal · P {protPer100}g · C {carbPer100}g · F {fatPer100}g
        </p>

        {/* Scaled macro chips */}
        <div className="grid grid-cols-4 gap-2">
          <MacroChip label="Calories" value={scaledCal} unit="kcal" />
          <MacroChip label="Protein" value={scaledProt} unit="g" />
          <MacroChip label="Carbs" value={scaledCarb} unit="g" />
          <MacroChip label="Fat" value={scaledFat} unit="g" />
        </div>

        {/* Portion stepper */}
        <div
          className="flex items-center gap-3 glass rounded-2xl px-4 py-3"
        >
          <motion.button
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
            onClick={handleDecrement}
            aria-label="Decrease portion"
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{ background: 'var(--brand-surface-2)', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="minus" size={18} color="var(--brand-text)" />
          </motion.button>

          <div className="flex-1 flex items-baseline justify-center gap-1">
            <input
              type="number"
              min={5}
              max={2000}
              step={10}
              value={portionInput}
              onChange={e => handlePortionInput(e.target.value)}
              className="bg-transparent text-center font-bold text-2xl outline-none w-20 tabular-nums"
              style={{ color: 'var(--brand-text)' }}
            />
            <span className="text-sm font-medium" style={{ color: 'var(--brand-text-2)' }}>g</span>
          </div>

          <motion.button
            whileTap={{ scale: 0.88 }}
            transition={springSnappy}
            onClick={handleIncrement}
            aria-label="Increase portion"
            className="flex items-center justify-center w-9 h-9 rounded-full"
            style={{ background: 'var(--brand-surface-2)', border: 'none', cursor: 'pointer' }}
          >
            <Icon name="plus" size={18} color="var(--brand-text)" />
          </motion.button>
        </div>

        {/* Log button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={handleLog}
          disabled={logEntry.isPending}
          className="w-full py-4 rounded-2xl font-bold text-base"
          style={{
            background: 'var(--brand-lime)',
            color: '#0B0B0B',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {logEntry.isPending ? 'Logging…' : `Log ${portionG}g`}
        </motion.button>

      </div>
    </div>
  );
}
