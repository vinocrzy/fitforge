'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { springDefault, springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useCreateCustomFood } from '@/hooks/useCustomFoods';
import type { PortionUnit } from '@/types';

// ─── Props ────────────────────────────────────────────────────────

export interface CustomFoodFormProps {
  slot: string;
  date: string;
}

// ─── Portion units ────────────────────────────────────────────────

const PORTION_UNITS: PortionUnit[] = ['g', 'ml', 'piece', 'cup', 'tbsp', 'tsp', 'serving'];

// ─── Field wrapper ────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl px-4 py-4">
      <label
        className="block text-xs font-semibold mb-2"
        style={{ color: 'var(--brand-text-2)' }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'transparent',
  color: 'var(--brand-text)',
  outline: 'none',
  width: '100%',
  fontSize: 16,
};

// ─── CustomFoodForm ───────────────────────────────────────────────

export function CustomFoodForm({ slot, date }: CustomFoodFormProps) {
  const router = useRouter();
  const createFood = useCreateCustomFood();

  // Form state
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [proteinG, setProteinG] = useState('');
  const [carbsG, setCarbsG] = useState('');
  const [fatG, setFatG] = useState('');
  const [portionAmount, setPortionAmount] = useState('1');
  const [portionUnit, setPortionUnit] = useState<PortionUnit>('g');
  const [portionWeightG, setPortionWeightG] = useState('100');
  const [brand, setBrand] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    const cal = parseFloat(calories);
    if (!calories || isNaN(cal) || cal <= 0) newErrors.calories = 'Calories must be > 0';
    const wg = parseFloat(portionWeightG);
    if (!portionWeightG || isNaN(wg) || wg <= 0) newErrors.portionWeightG = 'Portion weight must be > 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    createFood.mutate(
      {
        name: name.trim(),
        category: 'Custom',
        per100g: {
          calories: parseFloat(calories),
          proteinG: parseFloat(proteinG) || 0,
          carbsG: parseFloat(carbsG) || 0,
          fatG: parseFloat(fatG) || 0,
        },
        defaultPortion: {
          amount: parseFloat(portionAmount) || 1,
          unit: portionUnit,
          weightG: parseFloat(portionWeightG),
        },
        ...(brand.trim() ? { brand: brand.trim() } : {}),
      },
      {
        onSuccess: () =>
          router.replace(`/diet/log/search?slot=${slot}&date=${date}`),
      },
    );
  };

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
        <h1
          className="flex-1 font-bold text-lg"
          style={{ color: 'var(--brand-text)', letterSpacing: '-0.02em' }}
        >
          New Food
        </h1>
      </div>

      {/* Form fields */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springDefault}
        className="flex-1 px-4 space-y-3 overflow-y-auto"
      >
        {/* Food name */}
        <Field label="FOOD NAME *">
          <input
            type="text"
            placeholder="e.g. Chicken Breast"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
            autoFocus
          />
          {errors.name && (
            <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>
              {errors.name}
            </p>
          )}
        </Field>

        {/* Calories */}
        <Field label="CALORIES PER 100g (kcal) *">
          <input
            type="number"
            placeholder="0"
            min={0}
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            style={inputStyle}
          />
          {errors.calories && (
            <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>
              {errors.calories}
            </p>
          )}
        </Field>

        {/* Macros row */}
        <div className="glass rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--brand-text-2)' }}>
            MACROS PER 100g (g) — OPTIONAL
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Protein', value: proteinG, setter: setProteinG },
              { label: 'Carbs', value: carbsG, setter: setCarbsG },
              { label: 'Fat', value: fatG, setter: setFatG },
            ].map(({ label, value, setter }) => (
              <div key={label}>
                <p className="text-[10px] mb-1" style={{ color: 'var(--brand-text-3)' }}>
                  {label}
                </p>
                <input
                  type="number"
                  placeholder="0"
                  min={0}
                  value={value}
                  onChange={(e) => setter(e.target.value)}
                  className="w-full text-sm py-1.5 px-2 rounded-lg"
                  style={{
                    background: 'var(--brand-surface-3)',
                    color: 'var(--brand-text)',
                    outline: 'none',
                    border: 'none',
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Default portion */}
        <div className="glass rounded-2xl px-4 py-4">
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--brand-text-2)' }}>
            DEFAULT PORTION *
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-[10px] mb-1" style={{ color: 'var(--brand-text-3)' }}>
                Amount
              </p>
              <input
                type="number"
                min={0.1}
                step={0.5}
                value={portionAmount}
                onChange={(e) => setPortionAmount(e.target.value)}
                className="w-full text-sm py-1.5 px-2 rounded-lg"
                style={{
                  background: 'var(--brand-surface-3)',
                  color: 'var(--brand-text)',
                  outline: 'none',
                  border: 'none',
                }}
              />
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: 'var(--brand-text-3)' }}>
                Unit
              </p>
              <select
                value={portionUnit}
                onChange={(e) => setPortionUnit(e.target.value as PortionUnit)}
                className="w-full text-sm py-1.5 px-2 rounded-lg appearance-none"
                style={{
                  background: 'var(--brand-surface-3)',
                  color: 'var(--brand-text)',
                  outline: 'none',
                  border: 'none',
                }}
              >
                {PORTION_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-[10px] mb-1" style={{ color: 'var(--brand-text-3)' }}>
                Weight (g)
              </p>
              <input
                type="number"
                min={1}
                value={portionWeightG}
                onChange={(e) => setPortionWeightG(e.target.value)}
                className="w-full text-sm py-1.5 px-2 rounded-lg"
                style={{
                  background: 'var(--brand-surface-3)',
                  color: 'var(--brand-text)',
                  outline: 'none',
                  border: 'none',
                }}
              />
            </div>
          </div>
          {errors.portionWeightG && (
            <p className="text-xs mt-1" style={{ color: 'var(--brand-danger)' }}>
              {errors.portionWeightG}
            </p>
          )}
        </div>

        {/* Brand */}
        <Field label="BRAND — OPTIONAL">
          <input
            type="text"
            placeholder="e.g. Tesco"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            style={inputStyle}
          />
        </Field>
      </motion.div>

      {/* Save button */}
      <div className="px-4 pt-4">
        <motion.button
          whileTap={{ scale: createFood.isPending ? 1 : 0.97 }}
          transition={springSnappy}
          onClick={handleSave}
          disabled={createFood.isPending}
          className={cn(
            'w-full py-4 rounded-2xl text-base font-bold flex items-center justify-center gap-2',
            createFood.isPending ? 'opacity-60' : '',
          )}
          style={{ background: 'var(--brand-lime)', color: '#0B0B0B' }}
        >
          {createFood.isPending ? (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
              className="inline-block"
            >
              <Icon name="arrow.clockwise" size={20} color="#0B0B0B" />
            </motion.span>
          ) : (
            'Save Food'
          )}
        </motion.button>
      </div>
    </div>
  );
}
