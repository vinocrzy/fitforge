'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/nextjs';
import { springSnappy } from '@/lib/motion/springs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Icon } from '@/components/ui/Icon';
import { useDietProfile } from '@/hooks/useDietProfile';
import { nutritionDb } from '@/lib/db/pouchdb';
import { computeDailyTargets } from '@/lib/calculations/nutrition';
import type { GoalPhase, ActivityLevel, DietProfile } from '@/types';

// ─── Types ────────────────────────────────────────────────────────

export interface DietSettingsSheetProps {
  open: boolean;
  onClose: () => void;
}

// ─── Activity options ──────────────────────────────────────────────

const ACTIVITY_OPTIONS: Array<{ id: ActivityLevel; label: string; desc: string }> = [
  { id: 'sedentary', label: 'Sedentary', desc: 'Little or no exercise' },
  { id: 'lightly_active', label: 'Lightly Active', desc: '1–3 days/week' },
  { id: 'moderately_active', label: 'Moderately Active', desc: '3–5 days/week' },
  { id: 'very_active', label: 'Very Active', desc: '6–7 days/week' },
  { id: 'extremely_active', label: 'Extremely Active', desc: 'Physical job or 2x/day' },
];

// ─── DietSettingsSheet ────────────────────────────────────────────

export function DietSettingsSheet({ open, onClose }: DietSettingsSheetProps) {
  const { user } = useUser();
  const userId = user?.id ?? 'guest';
  const queryClient = useQueryClient();

  const { data: dietProfile, isLoading } = useDietProfile();

  const [weightKg, setWeightKg] = useState('');
  const [goalPhase, setGoalPhase] = useState<GoalPhase | ''>('');
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open && dietProfile) {
      setWeightKg(String(dietProfile.weightKg));
      setGoalPhase(dietProfile.goalPhase);
      setActivityLevel(dietProfile.activityLevel);
    }
  }, [open, dietProfile]);

  const handleSave = useCallback(async () => {
    if (!dietProfile || !goalPhase || !activityLevel) return;
    const kg = parseFloat(weightKg);
    if (isNaN(kg) || kg < 20 || kg > 500) return;

    setIsSaving(true);
    try {
      const dailyTargets = computeDailyTargets(
        dietProfile.sex,
        dietProfile.dob,
        kg,
        dietProfile.heightCm,
        activityLevel as ActivityLevel,
        goalPhase as GoalPhase,
      );

      const updated: DietProfile = {
        ...dietProfile,
        weightKg: kg,
        activityLevel: activityLevel as ActivityLevel,
        goalPhase: goalPhase as GoalPhase,
        dailyTargets,
        updatedAt: new Date().toISOString(),
      };

      await nutritionDb.put(updated);
      // Fetch saved doc to get fresh _rev, then update cache
      const saved = await nutritionDb.get<DietProfile>(updated._id);
      queryClient.setQueryData(['diet', 'profile', userId], saved);
      await queryClient.invalidateQueries({ queryKey: ['diet', 'profile', userId] });
      onClose();
    } catch (err) {
      console.error('[DietSettingsSheet] save error:', err);
    } finally {
      setIsSaving(false);
    }
  }, [dietProfile, weightKg, goalPhase, activityLevel, userId, queryClient, onClose]);

  // ─── Projected targets preview ────────────────────────────────

  const projected = useMemo(() => {
    if (!dietProfile || !goalPhase || !activityLevel) return null;
    const kg = parseFloat(weightKg);
    if (isNaN(kg)) return null;
    return computeDailyTargets(
      dietProfile.sex,
      dietProfile.dob,
      kg,
      dietProfile.heightCm,
      activityLevel as ActivityLevel,
      goalPhase as GoalPhase,
    );
  }, [dietProfile, goalPhase, activityLevel, weightKg]);

  const isSaveDisabled =
    isSaving ||
    isLoading ||
    !dietProfile ||
    !goalPhase ||
    !activityLevel ||
    isNaN(parseFloat(weightKg));

  return (
    <BottomSheet id="diet-settings-sheet" open={open} onClose={onClose} title="Diet Settings">
      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-8 h-8 rounded-full"
            style={{ background: 'var(--brand-surface-2)' }}
          />
        </div>
      ) : !dietProfile ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p style={{ color: 'var(--brand-text-2)', fontSize: 15 }}>
            No diet profile found. Set one up first.
          </p>
        </div>
      ) : (
      <div className="flex flex-col gap-5 px-1 pb-2">

        {/* ── Current Weight ───────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="diet-settings-weight"
            style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-text)' }}
          >
            Current Weight (kg)
          </label>
          <input
            id="diet-settings-weight"
            type="number"
            inputMode="decimal"
            value={weightKg}
            onChange={e => setWeightKg(e.target.value)}
            className="glass rounded-xl px-4 py-3 w-full outline-none"
            style={{
              fontSize: 16,
              color: 'var(--brand-text)',
              background: 'var(--brand-surface-2)',
            }}
            placeholder="e.g. 80"
          />
          <span style={{ fontSize: 11, color: 'var(--brand-text-3)' }}>
            (always stored in kg)
          </span>
        </div>

        {/* ── Goal Phase ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-text)' }}>
            Goal Phase
          </span>
          <div className="flex gap-2">
            {(
              [
                { id: 'cut' as GoalPhase, label: 'Cut', activeColor: 'rgba(255,69,58,0.15)', activeText: 'var(--brand-danger)' },
                { id: 'maintain' as GoalPhase, label: 'Maintain', activeColor: 'rgba(197,247,79,0.15)', activeText: 'var(--brand-lime)' },
                { id: 'bulk' as GoalPhase, label: 'Bulk', activeColor: 'rgba(255,184,0,0.15)', activeText: '#FFB800' },
              ] as const
            ).map(({ id, label, activeColor, activeText }) => {
              const isActive = goalPhase === id;
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.94 }}
                  transition={springSnappy}
                  onClick={() => setGoalPhase(id)}
                  className="flex-1 rounded-2xl py-2.5"
                  style={{
                    background: isActive ? activeColor : 'transparent',
                    border: isActive ? `1px solid ${activeText}` : '1px solid rgba(245,245,245,0.1)',
                    color: isActive ? activeText : 'var(--brand-text-2)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  {label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Activity Level ───────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand-text)' }}>
            Activity Level
          </span>
          <div className="flex flex-col gap-1.5">
            {ACTIVITY_OPTIONS.map(option => {
              const isActive = activityLevel === option.id;
              return (
                <motion.button
                  key={option.id}
                  whileTap={{ scale: 0.98 }}
                  transition={springSnappy}
                  onClick={() => setActivityLevel(option.id)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-left"
                  style={{
                    background: isActive ? 'rgba(197,247,79,0.10)' : 'transparent',
                    border: isActive
                      ? '1px solid rgba(197,247,79,0.3)'
                      : '1px solid rgba(245,245,245,0.06)',
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-text)' }}>
                      {option.label}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--brand-text-2)' }}>
                      {option.desc}
                    </span>
                  </div>
                  {isActive && (
                    <Icon name="checkmark.circle.fill" size={20} color="var(--brand-lime)" />
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Projected targets preview ─────────────────────────── */}
        {projected && (
          <div className="glass-elevated rounded-xl p-3 flex flex-col gap-1">
            <span style={{ fontSize: 12, color: 'var(--brand-text-3)' }}>New targets:</span>
            <span style={{ fontSize: 13, color: 'var(--brand-lime)', fontWeight: 600 }}>
              {projected.calories} kcal/day · P {projected.proteinG}g · C {projected.carbsG}g · F {projected.fatG}g
            </span>
          </div>
        )}

        {/* ── Save button ───────────────────────────────────────── */}
        <motion.button
          whileTap={{ scale: isSaveDisabled ? 1 : 0.96 }}
          transition={springSnappy}
          onClick={handleSave}
          disabled={isSaveDisabled}
          className="w-full rounded-2xl py-4"
          style={{
            background: isSaveDisabled ? 'rgba(197,247,79,0.3)' : 'var(--brand-lime)',
            color: isSaveDisabled ? 'rgba(11,11,11,0.45)' : '#0B0B0B',
            fontSize: 16,
            fontWeight: 700,
            cursor: isSaveDisabled ? 'not-allowed' : 'pointer',
          }}
        >
          {isSaving ? 'Saving…' : 'Save & Recalculate'}
        </motion.button>
      </div>
      )}
    </BottomSheet>
  );
}
