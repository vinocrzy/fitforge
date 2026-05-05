'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { springSnappy } from '@/lib/motion/springs';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useSendNutritionSuggestion } from '@/hooks/useNutritionSuggestions';

export interface SuggestNutritionSheetProps {
  clientId: string;
  clientName?: string;
  open: boolean;
  onClose: () => void;
}

const PHASE_OPTIONS: { value: 'cut' | 'maintain' | 'bulk'; label: string; color: string }[] = [
  { value: 'cut', label: 'Cut', color: 'var(--brand-danger)' },
  { value: 'maintain', label: 'Maintain', color: 'var(--brand-lime)' },
  { value: 'bulk', label: 'Bulk', color: '#FF9F0A' },
];

export function SuggestNutritionSheet({
  clientId,
  clientName,
  open,
  onClose,
}: SuggestNutritionSheetProps): React.ReactElement {
  const [message, setMessage] = useState('');
  const [goalPhase, setGoalPhase] = useState<'cut' | 'maintain' | 'bulk' | ''>('');
  const [calories, setCalories] = useState('');
  const sendSuggestion = useSendNutritionSuggestion();

  function handleSend(): void {
    if (!message.trim()) return;
    sendSuggestion.mutate(
      {
        clientId,
        message: message.trim(),
        suggestedGoalPhase: goalPhase || undefined,
        suggestedDailyCalories: calories ? Number(calories) : undefined,
      },
      {
        onSuccess: () => {
          setMessage('');
          setGoalPhase('');
          setCalories('');
          onClose();
        },
      },
    );
  }

  return (
    <BottomSheet
      id="suggest-nutrition-sheet"
      open={open}
      onClose={onClose}
      title="Nutrition Suggestion"
    >
      <div className="flex flex-col gap-4 px-1 pb-2">
        {/* Client name */}
        <p className="text-[14px]" style={{ color: 'var(--brand-text-2)' }}>
          To: {clientName ?? 'Client'}
        </p>

        {/* Message textarea */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-text-2)' }}
          >
            Message <span style={{ color: 'var(--brand-danger)' }}>*</span>
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your nutrition guidance here…"
            className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none resize-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--brand-text)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>

        {/* Goal Phase pills */}
        <div className="flex flex-col gap-2">
          <p
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-text-2)' }}
          >
            Suggest Goal Phase (optional)
          </p>
          <div className="flex gap-2">
            {PHASE_OPTIONS.map((opt) => {
              const isActive = goalPhase === opt.value;
              return (
                <motion.button
                  key={opt.value}
                  whileTap={{ scale: 0.92 }}
                  transition={springSnappy}
                  onClick={() => setGoalPhase(isActive ? '' : opt.value)}
                  className="flex-1 py-2 rounded-xl text-[14px] font-semibold"
                  style={
                    isActive
                      ? { background: opt.color, color: opt.value === 'maintain' ? '#0B0B0B' : '#F5F5F5' }
                      : { background: 'rgba(255,255,255,0.07)', color: 'var(--brand-text-2)', border: '1px solid rgba(255,255,255,0.08)' }
                  }
                >
                  {opt.label}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Daily Calories input */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[13px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--brand-text-2)' }}
          >
            Suggest Daily Calories (optional)
          </label>
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="e.g. 2000"
            min={800}
            max={10000}
            className="w-full rounded-2xl px-4 py-3 text-[15px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.06)',
              color: 'var(--brand-text)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>

        {/* Send button */}
        <PrimaryButton
          onClick={handleSend}
          disabled={!message.trim() || sendSuggestion.isPending}
        >
          {sendSuggestion.isPending ? 'Sending…' : 'Send Suggestion'}
        </PrimaryButton>
      </div>
    </BottomSheet>
  );
}
