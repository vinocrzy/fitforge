'use client';

import { motion } from 'framer-motion';
import { springDefault } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useClientNutrition } from '@/hooks/useClientNutrition';
import { cn } from '@/lib/utils';

export interface ClientNutritionViewProps {
  clientId: string;
  onSuggest: () => void;
}

const PHASE_COLORS: Record<string, string> = {
  cut: 'var(--brand-danger)',
  maintain: 'var(--brand-lime)',
  bulk: '#FF9F0A',
};

export function ClientNutritionView({
  clientId,
  onSuggest,
}: ClientNutritionViewProps): React.ReactElement {
  const { data, isLoading } = useClientNutrition(clientId);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="rounded-2xl"
            style={{ height: 88, background: 'var(--brand-surface-2)' }}
            animate={{ opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  const { dietProfile, last7Days } = data ?? { dietProfile: null, last7Days: { loggedDays: 0, avgCalories: 0, avgProteinG: 0, avgCarbsG: 0, avgFatG: 0 } };

  return (
    <motion.div
      className="flex flex-col gap-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={springDefault}
    >
      {!dietProfile ? (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="flame.fill" size={20} color="rgba(245,245,245,0.30)" />
            <p className="text-[15px]" style={{ color: 'var(--brand-text-2)' }}>
              Client hasn&apos;t set up their nutrition profile yet.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Goal Phase card */}
          <div className="glass rounded-2xl p-4">
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-1"
              style={{ color: 'var(--brand-text-3)' }}
            >
              Goal Phase
            </p>
            <p
              className="text-[24px] font-bold"
              style={{ color: PHASE_COLORS[dietProfile.goalPhase] ?? 'var(--brand-text)' }}
            >
              {dietProfile.goalPhase.charAt(0).toUpperCase() + dietProfile.goalPhase.slice(1)}
            </p>
            <p className="text-[14px] mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
              Target: {dietProfile.dailyTargets.calories} kcal/day
            </p>
          </div>

          {/* 7-Day Averages card */}
          <div className="glass rounded-2xl p-4">
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--brand-text-2)' }}
            >
              Last 7 Days (avg/day)
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Calories', value: Math.round(last7Days.avgCalories), unit: 'kcal' },
                { label: 'Protein', value: Math.round(last7Days.avgProteinG), unit: 'g' },
                { label: 'Carbs', value: Math.round(last7Days.avgCarbsG), unit: 'g' },
                { label: 'Fat', value: Math.round(last7Days.avgFatG), unit: 'g' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className={cn('rounded-xl p-3')}
                  style={{ background: 'rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[18px] font-bold" style={{ color: 'var(--brand-text)' }}>
                    {stat.value}
                    <span className="text-[12px] font-normal ml-0.5" style={{ color: 'var(--brand-text-3)' }}>
                      {stat.unit}
                    </span>
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--brand-text-2)' }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
            <p className="text-[12px] mt-2" style={{ color: 'var(--brand-text-3)' }}>
              Based on {last7Days.loggedDays} logged day{last7Days.loggedDays !== 1 ? 's' : ''}
            </p>
          </div>
        </>
      )}

      {/* Send Suggestion button */}
      <PrimaryButton onClick={onSuggest}>
        💡 Send Nutrition Suggestion
      </PrimaryButton>
    </motion.div>
  );
}
