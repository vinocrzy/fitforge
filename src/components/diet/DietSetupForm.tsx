// ═══════════════════════════════════════════════════════════════════
// FitForge — Diet Setup Form (5-Step Onboarding)
// Design System §3 — Liquid Glass, Framer Motion step transitions
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useDietStore } from '@/store/useDietStore';
import { springDefault } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import type { ActivityLevel, GoalPhase, DietSetupFormState } from '@/types';

// ─── Step slide variants ─────────────────────────────────────────

const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; description: string }[] = [
  { value: 'sedentary',          label: 'Sedentary',         description: 'Little or no exercise' },
  { value: 'lightly_active',     label: 'Lightly Active',    description: 'Light exercise 1–3 days/week' },
  { value: 'moderately_active',  label: 'Moderately Active', description: 'Moderate exercise 3–5 days/week' },
  { value: 'very_active',        label: 'Very Active',       description: 'Hard exercise 6–7 days/week' },
  { value: 'extremely_active',   label: 'Extremely Active',  description: 'Very hard exercise + physical job' },
];

const GOAL_OPTIONS: { value: GoalPhase; label: string; description: string; icon: string }[] = [
  { value: 'cut',      label: 'Cut',      description: 'Lose fat, preserve muscle', icon: 'bolt.fill' },
  { value: 'maintain', label: 'Maintain', description: 'Keep current composition',  icon: 'checkmark' },
  { value: 'bulk',     label: 'Bulk',     description: 'Build muscle, gain strength', icon: 'flame.fill' },
];

// ─── Age preview helper ──────────────────────────────────────────

function calcAge(dob: string): number | null {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age >= 0 ? age : null;
}

// ─── Step slide variants ─────────────────────────────────────────

function stepVariants(direction: number) {
  return {
    initial:  { x: direction > 0 ? '100%' : '-100%', opacity: 0 },
    animate:  { x: 0,   opacity: 1 },
    exit:     { x: direction > 0 ? '-100%' : '100%', opacity: 0 },
  };
}

// ─── Component ───────────────────────────────────────────────────

const TOTAL_STEPS = 5;

export function DietSetupForm() {
  const router = useRouter();
  const { user } = useUser();

  const setupForm       = useDietStore(s => s.setupForm);
  const setSetupForm    = useDietStore(s => s.setSetupForm);
  const saveDietProfile = useDietStore(s => s.saveDietProfile);
  const isSavingProfile = useDietStore(s => s.isSavingProfile);
  const profileError    = useDietStore(s => s.profileError);

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);

  function goNext() {
    setDirection(1);
    setStep(s => Math.min(s + 1, TOTAL_STEPS));
  }

  function goBack() {
    setDirection(-1);
    setStep(s => Math.max(s - 1, 1));
  }

  async function handleSave() {
    const userId = user?.id ?? 'guest';
    await saveDietProfile(userId, setupForm);
    // profileError is set in store on failure
    if (!useDietStore.getState().profileError) {
      router.push('/diet');
    }
  }

  const canAdvance = (): boolean => {
    switch (step) {
      case 1: return !!setupForm.sex;
      case 2: return !!setupForm.dob;
      case 3: return setupForm.heightCm !== '' && setupForm.weightKg !== '';
      case 4: return !!setupForm.activityLevel;
      case 5: return !!setupForm.goalPhase;
      default: return false;
    }
  };

  const variants = stepVariants(direction);

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-between"
      style={{ background: 'var(--brand-bg)', paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {/* ── Header ── */}
      <div className="w-full max-w-md px-6 pt-6">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width:   i + 1 === step ? 24 : 8,
                opacity: i + 1 <= step  ? 1  : 0.25,
              }}
              transition={springDefault}
              className="h-2 rounded-full"
              style={{ background: i + 1 === step ? 'var(--brand-lime)' : 'var(--brand-text)' }}
            />
          ))}
        </div>
      </div>

      {/* ── Step content ── */}
      <div className="flex-1 w-full max-w-md px-6 overflow-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={springDefault}
            className="absolute inset-0 px-6 flex flex-col justify-start pt-2"
          >
            {step === 1 && (
              <StepSex
                value={setupForm.sex}
                onChange={sex => setSetupForm({ sex: sex as DietSetupFormState['sex'] })}
              />
            )}
            {step === 2 && (
              <StepDob
                value={setupForm.dob}
                onChange={dob => setSetupForm({ dob })}
              />
            )}
            {step === 3 && (
              <StepBodyStats
                heightCm={setupForm.heightCm}
                weightKg={setupForm.weightKg}
                onChangeHeight={h => setSetupForm({ heightCm: h })}
                onChangeWeight={w => setSetupForm({ weightKg: w })}
              />
            )}
            {step === 4 && (
              <StepActivity
                value={setupForm.activityLevel}
                onChange={v => setSetupForm({ activityLevel: v as ActivityLevel })}
              />
            )}
            {step === 5 && (
              <StepGoal
                value={setupForm.goalPhase}
                onChange={v => setSetupForm({ goalPhase: v as GoalPhase })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Footer navigation ── */}
      <div className="w-full max-w-md px-6 pb-8">
        {profileError && (
          <p className="text-center text-sm mb-3" style={{ color: 'var(--brand-danger)' }}>
            {profileError}
          </p>
        )}

        <div className="flex gap-3">
          {step > 1 && (
            <motion.button
              onClick={goBack}
              whileTap={{ scale: 0.96 }}
              transition={springDefault}
              className="glass flex items-center justify-center rounded-2xl h-14 w-14 flex-shrink-0"
              aria-label="Go back"
            >
              <Icon name="chevron.left" size={22} color="var(--brand-text)" />
            </motion.button>
          )}

          {step < TOTAL_STEPS ? (
            <motion.button
              onClick={goNext}
              disabled={!canAdvance()}
              whileTap={{ scale: canAdvance() ? 0.96 : 1 }}
              transition={springDefault}
              className={cn(
                'flex-1 h-14 rounded-2xl font-bold text-base',
                canAdvance()
                  ? 'bg-[var(--brand-lime)] text-black'
                  : 'glass opacity-40 text-[var(--brand-text)]'
              )}
            >
              Next
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSave}
              disabled={!canAdvance() || isSavingProfile}
              whileTap={{ scale: canAdvance() && !isSavingProfile ? 0.96 : 1 }}
              transition={springDefault}
              className={cn(
                'flex-1 h-14 rounded-2xl font-bold text-base',
                canAdvance() && !isSavingProfile
                  ? 'bg-[var(--brand-lime)] text-black'
                  : 'glass opacity-40 text-[var(--brand-text)]'
              )}
            >
              {isSavingProfile ? 'Saving…' : 'Save & Start'}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Step sub-components
// ═══════════════════════════════════════════════════════════════════

// ─── Step 1: Biological Sex ──────────────────────────────────────

interface StepSexProps {
  value: 'male' | 'female' | '';
  onChange: (v: 'male' | 'female') => void;
}

function StepSex({ value, onChange }: StepSexProps) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--brand-text)' }}>
        Biological Sex
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--brand-text-2)' }}>
        Used to calculate your basal metabolic rate.
      </p>
      <div className="flex flex-col gap-4">
        {(['male', 'female'] as const).map(sex => {
          const isSelected = value === sex;
          return (
            <motion.button
              key={sex}
              onClick={() => onChange(sex)}
              whileTap={{ scale: 0.97 }}
              transition={springDefault}
              className={cn(
                'rounded-2xl p-5 text-left flex items-center gap-4 border-2',
                isSelected
                  ? 'border-[var(--brand-lime)] glass-elevated'
                  : 'border-transparent glass'
              )}
            >
              <Icon
                name="person.fill"
                size={28}
                color={isSelected ? 'var(--brand-lime)' : 'var(--brand-text-2)'}
              />
              <div>
                <p className="text-lg font-semibold capitalize" style={{ color: 'var(--brand-text)' }}>
                  {sex}
                </p>
              </div>
              {isSelected && (
                <motion.div layoutId="sex-check" className="ml-auto">
                  <Icon name="checkmark" size={20} color="var(--brand-lime)" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 2: Date of Birth ───────────────────────────────────────

interface StepDobProps {
  value: string;
  onChange: (v: string) => void;
}

function StepDob({ value, onChange }: StepDobProps) {
  const age = calcAge(value);
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--brand-text)' }}>
        Date of Birth
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--brand-text-2)' }}>
        Your age factors into calorie calculations.
      </p>
      <div className="glass rounded-2xl p-5">
        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brand-text-2)' }}>
          Birthday
        </label>
        <input
          type="date"
          value={value}
          onChange={e => onChange(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="w-full bg-transparent text-lg font-semibold outline-none"
          style={{ color: 'var(--brand-text)', colorScheme: 'dark' }}
        />
      </div>
      {age !== null && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springDefault}
          className="mt-4 text-center text-base"
          style={{ color: 'var(--brand-text-2)' }}
        >
          Age: <span className="font-bold" style={{ color: 'var(--brand-lime)' }}>{age}</span>
        </motion.p>
      )}
    </div>
  );
}

// ─── Step 3: Body Stats ──────────────────────────────────────────

interface StepBodyStatsProps {
  heightCm: number | '';
  weightKg: number | '';
  onChangeHeight: (v: number | '') => void;
  onChangeWeight: (v: number | '') => void;
}

function StepBodyStats({ heightCm, weightKg, onChangeHeight, onChangeWeight }: StepBodyStatsProps) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--brand-text)' }}>
        Body Stats
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--brand-text-2)' }}>
        Used to calculate your daily calorie target.
      </p>
      <div className="flex flex-col gap-4">
        <div className="glass rounded-2xl p-5">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brand-text-2)' }}>
            Height
          </label>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="175"
              min={100}
              max={250}
              value={heightCm === '' ? '' : String(heightCm)}
              onChange={e => onChangeHeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="flex-1 bg-transparent text-2xl font-bold outline-none"
              style={{ color: 'var(--brand-text)' }}
            />
            <span className="text-base font-medium" style={{ color: 'var(--brand-text-2)' }}>cm</span>
          </div>
        </div>

        <div className="glass rounded-2xl p-5">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--brand-text-2)' }}>
            Weight
          </label>
          <div className="flex items-baseline gap-2">
            <input
              type="number"
              inputMode="decimal"
              placeholder="75"
              min={30}
              max={300}
              value={weightKg === '' ? '' : String(weightKg)}
              onChange={e => onChangeWeight(e.target.value === '' ? '' : parseFloat(e.target.value))}
              className="flex-1 bg-transparent text-2xl font-bold outline-none"
              style={{ color: 'var(--brand-text)' }}
            />
            <span className="text-base font-medium" style={{ color: 'var(--brand-text-2)' }}>kg</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 4: Activity Level ──────────────────────────────────────

interface StepActivityProps {
  value: ActivityLevel | '';
  onChange: (v: ActivityLevel) => void;
}

function StepActivity({ value, onChange }: StepActivityProps) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--brand-text)' }}>
        Activity Level
      </h1>
      <p className="text-base mb-6" style={{ color: 'var(--brand-text-2)' }}>
        How active are you on a typical week?
      </p>
      <div className="flex flex-col gap-3">
        {ACTIVITY_OPTIONS.map(opt => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.97 }}
              transition={springDefault}
              className={cn(
                'rounded-2xl p-4 text-left flex items-center justify-between border-2',
                isSelected
                  ? 'border-[var(--brand-lime)] glass-elevated'
                  : 'border-transparent glass'
              )}
            >
              <div>
                <p className="text-base font-semibold" style={{ color: 'var(--brand-text)' }}>
                  {opt.label}
                </p>
                <p className="text-sm" style={{ color: 'var(--brand-text-2)' }}>
                  {opt.description}
                </p>
              </div>
              {isSelected && (
                <Icon name="checkmark" size={20} color="var(--brand-lime)" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Step 5: Goal Phase ──────────────────────────────────────────

interface StepGoalProps {
  value: GoalPhase | '';
  onChange: (v: GoalPhase) => void;
}

function StepGoal({ value, onChange }: StepGoalProps) {
  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight mb-2" style={{ color: 'var(--brand-text)' }}>
        Your Goal
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--brand-text-2)' }}>
        This determines your calorie surplus or deficit.
      </p>
      <div className="flex flex-col gap-4">
        {GOAL_OPTIONS.map(opt => {
          const isSelected = value === opt.value;
          return (
            <motion.button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.97 }}
              transition={springDefault}
              className={cn(
                'rounded-2xl p-5 text-left flex items-center gap-4 border-2',
                isSelected
                  ? 'border-[var(--brand-lime)] glass-elevated'
                  : 'border-transparent glass'
              )}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isSelected ? 'var(--brand-lime)' : 'rgba(245,245,245,0.08)' }}
              >
                <Icon
                  name={opt.icon}
                  size={24}
                  color={isSelected ? 'black' : 'var(--brand-text-2)'}
                />
              </div>
              <div className="flex-1">
                <p className="text-lg font-bold" style={{ color: 'var(--brand-text)' }}>
                  {opt.label}
                </p>
                <p className="text-sm" style={{ color: 'var(--brand-text-2)' }}>
                  {opt.description}
                </p>
              </div>
              {isSelected && (
                <Icon name="checkmark" size={20} color="var(--brand-lime)" />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
