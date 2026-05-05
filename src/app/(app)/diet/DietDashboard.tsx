'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useDailyTotals, useMealEntries, useDeleteMealEntry } from '@/hooks/useMealEntries';
import { useDietProfile } from '@/hooks/useDietProfile';
import { useExerciseBurnToday } from '@/hooks/useExerciseBurnToday';
import { nutritionDb } from '@/lib/db/pouchdb';
import type { MealSlot, MacroTargets, MealEntry } from '@/types';

// ─── Date helpers ─────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// ─── Macro scaling helper ─────────────────────────────────────────

function scaleMacros(per100g: MacroTargets, weightG: number): MacroTargets {
  const factor = weightG / 100;
  return {
    calories: Math.round(per100g.calories * factor),
    proteinG: Math.round(per100g.proteinG * factor * 10) / 10,
    carbsG: Math.round(per100g.carbsG * factor * 10) / 10,
    fatG: Math.round(per100g.fatG * factor * 10) / 10,
  };
}

// ─── UndoToast ────────────────────────────────────────────────────

interface UndoState {
  entry: MealEntry;
  timeoutId: ReturnType<typeof setTimeout>;
}

// ─── MealEntryRow ─────────────────────────────────────────────────

interface MealEntryRowProps {
  entry: MealEntry;
  date: string;
  onDeleteStart: (entry: MealEntry) => void;
}

function MealEntryRow({ entry, date, onDeleteStart }: MealEntryRowProps) {
  const deleteEntry = useDeleteMealEntry();
  const [isDragging, setIsDragging] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handlePanEnd = useCallback(
    (_e: unknown, info: { offset: { x: number } }) => {
      setIsDragging(false);
      if (info.offset.x < -80) {
        setShowDelete(true);
      }
    },
    [],
  );

  const handleDelete = useCallback(() => {
    setShowDelete(false);
    onDeleteStart(entry);
    deleteEntry.mutate({ id: entry._id, rev: entry._rev ?? '', date });
  }, [entry, date, deleteEntry, onDeleteStart]);

  const macros = entry.macros;

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Red delete button revealed on swipe */}
      <AnimatePresence>
        {showDelete && (
          <motion.button
            key="delete-btn"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={springSnappy}
            onClick={handleDelete}
            className="absolute right-0 top-0 bottom-0 flex items-center justify-center w-20 rounded-r-xl z-10"
            style={{ background: 'var(--brand-danger)' }}
          >
            <Icon name="trash" size={20} color="white" />
          </motion.button>
        )}
      </AnimatePresence>

      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.1}
        onDragStart={() => setIsDragging(true)}
        onPanEnd={handlePanEnd}
        animate={{ x: showDelete ? -80 : 0 }}
        transition={springDefault}
        className={cn(
          'flex items-center justify-between px-3 py-3 rounded-xl',
          isDragging ? 'cursor-grabbing' : 'cursor-default',
        )}
        style={{ background: 'var(--brand-surface-2)' }}
        onClick={() => showDelete && setShowDelete(false)}
      >
        <div className="flex-1 min-w-0 mr-3">
          <p
            className="text-sm font-semibold truncate"
            style={{ color: 'var(--brand-text)' }}
          >
            {entry.foodName}
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
            {entry.portionWeightG}g &middot; P {macros.proteinG}g &middot; C {macros.carbsG}g &middot; F {macros.fatG}g
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums" style={{ color: 'var(--brand-text)' }}>
          {macros.calories} kcal
        </span>
      </motion.div>
    </div>
  );
}

// ─── MealSlotCard ─────────────────────────────────────────────────

interface MealSlotCardProps {
  slot: MealSlot;
  entries: MealEntry[];
  date: string;
  onDeleteStart: (entry: MealEntry) => void;
}

function MealSlotCard({ slot, entries, date, onDeleteStart }: MealSlotCardProps) {
  const router = useRouter();
  const slotCalories = entries.reduce((sum, e) => sum + (e.macros?.calories ?? 0), 0);
  const slotLabel = slot.charAt(0).toUpperCase() + slot.slice(1);

  const handleAdd = () => {
    router.push(`/diet/log/search?slot=${slot}&date=${date}`);
  };

  return (
    <motion.div
      layout
      className="glass rounded-2xl overflow-hidden"
      transition={springDefault}
    >
      {/* Slot header */}
      <div className="flex items-center justify-between px-4 py-3">
        <span
          className="text-base font-semibold"
          style={{ color: 'var(--brand-text)' }}
        >
          {slotLabel}
        </span>
        <span className="text-sm tabular-nums" style={{ color: 'var(--brand-text-2)' }}>
          {slotCalories > 0 ? `${slotCalories} kcal` : ''}
        </span>
      </div>

      {/* Entry list */}
      <div className="px-3 pb-3 space-y-2">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <motion.div
              key={entry._id}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={springDefault}
            >
              <MealEntryRow entry={entry} date={date} onDeleteStart={onDeleteStart} />
            </motion.div>
          ))}
        </AnimatePresence>

        {entries.length === 0 && (
          <p className="text-sm px-1 py-1" style={{ color: 'var(--brand-text-3)' }}>
            Nothing logged yet
          </p>
        )}

        {/* Add food button */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          transition={springSnappy}
          onClick={handleAdd}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
          style={{ color: 'var(--brand-lime)', background: 'rgba(197,247,79,0.10)' }}
        >
          <Icon name="plus" size={16} color="var(--brand-lime)" />
          Add Food
        </motion.button>
      </div>
    </motion.div>
  );
}

// ─── DietDashboard ────────────────────────────────────────────────

const MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function DietDashboard() {
  const router = useRouter();
  const date = todayISO();

  const { data: dietProfile, isLoading: profileLoading } = useDietProfile();
  const { totals } = useDailyTotals(date);
  const { data: allEntries = [] } = useMealEntries(date);
  const { burnKcal } = useExerciseBurnToday();

  // Undo toast state
  const [undoEntry, setUndoEntry] = useState<MealEntry | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleDeleteStart = useCallback(
    (entry: MealEntry) => {
      if (undoTimeoutId) clearTimeout(undoTimeoutId);
      setUndoEntry(entry);
      const id = setTimeout(() => setUndoEntry(null), 5000);
      setUndoTimeoutId(id);
    },
    [undoTimeoutId],
  );

  const handleUndo = useCallback(async () => {
    if (!undoEntry) return;
    if (undoTimeoutId) clearTimeout(undoTimeoutId);
    setUndoEntry(null);
    // Re-insert the document without _deleted flag and without _rev
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _rev, ...docWithoutRev } = undoEntry;
    const shortId = Math.random().toString(36).slice(2, 8);
    await nutritionDb.put({ ...docWithoutRev, _id: `${undoEntry._id}_undo_${shortId}` });
  }, [undoEntry, undoTimeoutId]);

  const netKcal = totals.calories - burnKcal;
  const targetKcal = dietProfile?.dailyTargets.calories ?? 0;
  const netOver = dietProfile?.goalPhase === 'cut' && netKcal > targetKcal;

  if (profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--brand-bg)' }}
      >
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-10 h-10 rounded-full"
          style={{ background: 'var(--brand-surface-2)' }}
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-28"
      style={{
        background: 'var(--brand-bg)',
        paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
        paddingLeft: 16,
        paddingRight: 16,
      }}
    >
      {/* Header */}
      <div className="mb-5">
        <h1
          className="font-black"
          style={{ fontSize: 34, color: 'var(--brand-text)', letterSpacing: '-0.04em' }}
        >
          Diet
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
          {formatDate(date)}
        </p>
      </div>

      {/* Setup CTA — no profile */}
      {!dietProfile ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springDefault}
          className="glass rounded-2xl p-5"
        >
          <p
            className="text-lg font-bold mb-1"
            style={{ color: 'var(--brand-text)' }}
          >
            Set Up Nutrition
          </p>
          <p className="text-sm mb-4" style={{ color: 'var(--brand-text-2)' }}>
            Get personalised calorie &amp; macro targets
          </p>
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={() => router.push('/diet/setup')}
            className="px-5 py-2.5 rounded-xl text-sm font-bold"
            style={{ background: 'var(--brand-lime)', color: '#0B0B0B' }}
          >
            Get Started
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Daily summary bar */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springDefault}
            className="glass rounded-2xl px-4 py-4 mb-4 grid grid-cols-4 gap-2"
          >
            {[
              { label: 'Consumed', value: `${totals.calories}`, unit: 'kcal', danger: false },
              { label: 'Burned', value: `${burnKcal}`, unit: 'kcal', danger: false },
              { label: 'Net', value: `${netKcal}`, unit: 'kcal', danger: netOver },
              { label: 'Target', value: `${targetKcal}`, unit: 'kcal', danger: false },
            ].map(({ label, value, unit, danger }) => (
              <div key={label} className="flex flex-col items-center">
                <span
                  className="text-lg font-bold tabular-nums leading-none"
                  style={{ color: danger ? 'var(--brand-danger)' : 'var(--brand-text)' }}
                >
                  {value}
                </span>
                <span className="text-[10px] mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
                  {unit}
                </span>
                <span className="text-[10px]" style={{ color: 'var(--brand-text-3)' }}>
                  {label}
                </span>
              </div>
            ))}
          </motion.div>

          {/* Meal slots */}
          <div className="space-y-3">
            {MEAL_SLOTS.map((slot) => {
              const slotEntries = allEntries.filter((e) => e.slot === slot);
              return (
                <MealSlotCard
                  key={slot}
                  slot={slot}
                  entries={slotEntries}
                  date={date}
                  onDeleteStart={handleDeleteStart}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Undo toast */}
      <AnimatePresence>
        {undoEntry && (
          <motion.div
            key="undo-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={springGentle}
            className="fixed left-1/2 glass-elevated rounded-2xl flex items-center gap-3 px-4 py-3 z-50"
            style={{
              bottom: 90,
              transform: 'translateX(-50%)',
              minWidth: 220,
            }}
          >
            <p className="text-sm flex-1 truncate" style={{ color: 'var(--brand-text)' }}>
              Deleted &ldquo;{undoEntry.foodName}&rdquo;
            </p>
            <motion.button
              whileTap={{ scale: 0.94 }}
              transition={springSnappy}
              onClick={handleUndo}
              className="text-sm font-bold px-2 py-1 rounded-lg"
              style={{ color: 'var(--brand-lime)' }}
            >
              Undo
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
