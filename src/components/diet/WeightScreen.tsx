// ═══════════════════════════════════════════════════════════════════
// FitForge — WeightScreen
// Weight log & chart full-screen view
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useWeightLogs, useLogWeight } from '@/hooks/useWeightLogs';
import { useDietProfile } from '@/hooks/useDietProfile';
import { useProfileStore } from '@/store/useProfileStore';
import { analyzeWeightTrend } from '@/lib/calculations/weightTrend';
import { WeightChart } from '@/components/diet/WeightChart';
import { BottomSheet } from '@/components/ui/BottomSheet';

// ─── Helpers ─────────────────────────────────────────────────────

function kgToDisplay(kg: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? Math.round(kg * 22046) / 10000 : Math.round(kg * 10) / 10;
}

function displayToKg(val: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs' ? Math.round(val * 453.592) / 1000 : val;
}

function formatLogDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Component ───────────────────────────────────────────────────

export function WeightScreen(): React.ReactElement {
  const router = useRouter();
  const unitPreference = useProfileStore((s) => s.unitPreference);

  const { data: logs = [] } = useWeightLogs(90);
  const { data: dietProfile } = useDietProfile();
  const logWeight = useLogWeight();

  const goalPhase = dietProfile?.goalPhase ?? 'maintain';
  const trend = analyzeWeightTrend(logs, goalPhase);

  const [isLogSheetOpen, setIsLogSheetOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [note, setNote] = useState('');

  const currentDisplay =
    trend.currentWeight != null ? kgToDisplay(trend.currentWeight, unitPreference) : null;

  // Last 30 entries, most recent first
  const recentEntries = [...trend.points].reverse().slice(0, 30);

  function handleOpenSheet(): void {
    setInputValue(currentDisplay != null ? String(currentDisplay) : '');
    setNote('');
    setIsLogSheetOpen(true);
  }

  function handleSave(): void {
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;
    const kg = displayToKg(val, unitPreference);
    logWeight.mutate(
      { weightKg: kg, note: note.trim() || undefined },
      { onSuccess: () => setIsLogSheetOpen(false) },
    );
  }

  // ─── Trend direction text ─────────────────────────────────────

  function renderTrendLine(): React.ReactElement {
    const { trendDirection, weeklyChangeKg } = trend;
    const changeDisplay =
      weeklyChangeKg != null
        ? kgToDisplay(Math.abs(weeklyChangeKg), unitPreference)
        : null;

    if (trendDirection === 'losing' && changeDisplay != null) {
      return (
        <p style={{ color: 'var(--brand-success)', fontSize: 14 }}>
          ↓ {changeDisplay} {unitPreference}/week
        </p>
      );
    }
    if (trendDirection === 'gaining' && changeDisplay != null) {
      return (
        <p style={{ color: 'var(--brand-warning)', fontSize: 14 }}>
          ↑ {changeDisplay} {unitPreference}/week
        </p>
      );
    }
    if (trendDirection === 'stable') {
      return (
        <p style={{ color: 'var(--brand-text-2)', fontSize: 14 }}>→ Stable</p>
      );
    }
    return (
      <p style={{ color: 'var(--brand-text-3)', fontSize: 14 }}>
        Log more entries to see your trend
      </p>
    );
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--brand-bg)',
        paddingBottom: 112,
      }}
    >
      {/* Header */}
      <div
        className="glass-nav-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          paddingTop: 'calc(env(safe-area-inset-top) + 12px)',
          position: 'sticky',
          top: 0,
          zIndex: 20,
        }}
      >
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 8,
            borderRadius: 8,
          }}
        >
          <Icon name="chevron.left" size={24} />
        </button>

        <h1
          style={{
            color: 'var(--brand-text)',
            fontWeight: 900,
            fontSize: 22,
            letterSpacing: '-0.02em',
            margin: 0,
          }}
        >
          Weight
        </h1>

        <motion.button
          whileTap={{ scale: 0.94 }}
          transition={springSnappy}
          onClick={handleOpenSheet}
          style={{
            background: 'var(--brand-lime)',
            border: 'none',
            borderRadius: 20,
            padding: '8px 14px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: 14,
            color: '#0B0B0B',
          }}
        >
          Log Weight
        </motion.button>
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        {/* Current weight card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springDefault}
          className="glass rounded-2xl"
          style={{ padding: 20, marginBottom: 12 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontWeight: 900,
                fontSize: 40,
                letterSpacing: '-0.03em',
                color: trend.isNewLow ? 'var(--brand-lime)' : 'var(--brand-text)',
                lineHeight: 1,
              }}
            >
              {currentDisplay != null ? `${currentDisplay} ${unitPreference}` : '—'}
            </span>

            <AnimatePresence>
              {trend.isNewLow && (
                <motion.span
                  key="new-low-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={springSnappy}
                  style={{
                    background: 'var(--brand-lime)',
                    color: '#0B0B0B',
                    fontWeight: 700,
                    fontSize: 12,
                    borderRadius: 10,
                    padding: '3px 8px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  🏆 New Low!
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div style={{ marginTop: 6 }}>{renderTrendLine()}</div>
        </motion.div>

        {/* Alert banners */}
        <AnimatePresence>
          {trend.divergenceAlert && (
            <motion.div
              key="divergence-alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springGentle}
              style={{
                background: 'rgba(255,159,10,0.15)',
                border: '1px solid rgba(255,159,10,0.3)',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 10,
              }}
            >
              <p style={{ color: 'var(--brand-warning)', fontSize: 13, margin: 0 }}>
                ⚠ Your weight trend is diverging from your expected rate. Consider reviewing your
                calorie target.
              </p>
            </motion.div>
          )}

          {trend.plateauAlert && (
            <motion.div
              key="plateau-alert"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={springGentle}
              style={{
                background: 'rgba(255,159,10,0.15)',
                border: '1px solid rgba(255,159,10,0.3)',
                borderRadius: 12,
                padding: '10px 14px',
                marginBottom: 10,
              }}
            >
              <p style={{ color: 'var(--brand-warning)', fontSize: 13, margin: 0 }}>
                📊 Your weight has been stable for 4+ weeks on a calorie deficit. This may indicate
                metabolic adaptation — consider a diet break week at maintenance calories.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chart */}
        {trend.points.length >= 2 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: 0.05 }}
            className="glass rounded-2xl"
            style={{ padding: 16, marginBottom: 12 }}
          >
            <WeightChart
              points={trend.points}
              rollingAvg={trend.rollingAvg}
              unitPreference={unitPreference}
            />
          </motion.div>
        ) : (
          <div
            className="glass rounded-2xl"
            style={{
              padding: 20,
              marginBottom: 12,
              textAlign: 'center',
            }}
          >
            <p style={{ color: 'var(--brand-text-3)', fontSize: 14, margin: 0 }}>
              Log at least 2 entries to see your chart
            </p>
          </div>
        )}

        {/* History list */}
        {recentEntries.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springDefault, delay: 0.1 }}
            className="glass rounded-2xl"
            style={{ overflow: 'hidden', marginBottom: 12 }}
          >
            <p
              style={{
                color: 'var(--brand-text-2)',
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                padding: '12px 16px 8px',
                margin: 0,
              }}
            >
              History
            </p>

            {recentEntries.map((entry, i) => (
              <div key={entry.date + i}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 16px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {entry.isNewLow && (
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: 'var(--brand-lime)',
                          display: 'inline-block',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <span
                      style={{
                        color: 'var(--brand-text-2)',
                        fontSize: 15,
                        marginLeft: entry.isNewLow ? 0 : 15,
                      }}
                    >
                      {formatLogDate(entry.date)}
                    </span>
                  </div>
                  <span
                    style={{
                      color: entry.isNewLow ? 'var(--brand-lime)' : 'var(--brand-text)',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    {kgToDisplay(entry.weightKg, unitPreference)} {unitPreference}
                  </span>
                </div>

                {i < recentEntries.length - 1 && (
                  <div
                    style={{
                      height: 1,
                      background: 'rgba(255,255,255,0.06)',
                      margin: '0 16px',
                    }}
                  />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Log Weight Bottom Sheet */}
      <BottomSheet
        id="log-weight-sheet"
        open={isLogSheetOpen}
        onClose={() => setIsLogSheetOpen(false)}
        title="Log Weight"
      >
        <div style={{ padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Weight input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="number"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="0.0"
              inputMode="decimal"
              style={{
                flex: 1,
                background: 'var(--brand-surface-2)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: '14px 16px',
                color: 'var(--brand-text)',
                fontSize: 28,
                fontWeight: 700,
                textAlign: 'center',
                outline: 'none',
              }}
            />

            {/* Unit display badge */}
            <div
              className="glass-elevated"
              style={{
                borderRadius: 10,
                padding: '8px 14px',
                fontWeight: 700,
                fontSize: 16,
                color: 'var(--brand-text)',
              }}
            >
              {unitPreference}
            </div>
          </div>

          {/* Optional note input */}
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note (optional)"
            style={{
              background: 'var(--brand-surface-2)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12,
              padding: '12px 16px',
              color: 'var(--brand-text)',
              fontSize: 15,
              outline: 'none',
            }}
          />

          {/* Save button */}
          <motion.button
            whileTap={{ scale: 0.96 }}
            transition={springSnappy}
            onClick={handleSave}
            disabled={logWeight.isPending}
            className={cn(
              'rounded-2xl',
              logWeight.isPending ? 'opacity-60' : '',
            )}
            style={{
              background: 'var(--brand-lime)',
              border: 'none',
              padding: '16px',
              fontWeight: 700,
              fontSize: 17,
              color: '#0B0B0B',
              cursor: logWeight.isPending ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {logWeight.isPending ? (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                  style={{ display: 'inline-block', fontSize: 16 }}
                >
                  ⟳
                </motion.span>
                Saving…
              </>
            ) : (
              'Save'
            )}
          </motion.button>
        </div>
      </BottomSheet>
    </div>
  );
}
