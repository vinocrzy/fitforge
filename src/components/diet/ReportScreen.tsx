'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { springDefault, springSnappy, springGentle } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { cn } from '@/lib/utils';
import { useWeeklyReport } from '@/hooks/useWeeklyReport';
import { useDietProfile } from '@/hooks/useDietProfile';
import type { DayReport, WeeklyReport } from '@/lib/calculations/weeklyReport';

// ─── Helpers ──────────────────────────────────────────────────────

function formatWeekLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

function formatDayDate(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

// ─── Adherence colour ─────────────────────────────────────────────

function adherenceColor(score: number, logged: boolean): string {
  if (!logged) return 'rgba(245,245,245,0.25)';
  if (score >= 80) return 'var(--brand-lime)';
  if (score >= 50) return 'var(--brand-warning)';
  return 'var(--brand-danger)';
}

// ─── Custom calorie bar shape ─────────────────────────────────────

interface CalorieBarProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  calories?: number;
  target?: number;
}

function CalorieBar(props: CalorieBarProps): React.ReactElement {
  const { x = 0, y = 0, width = 0, height = 0, calories = 0, target = 0 } = props;
  const fill =
    calories === 0
      ? 'rgba(245,245,245,0.12)'
      : calories > target
      ? 'var(--brand-danger)'
      : '#C5F74F';
  return <rect x={x} y={y} width={width} height={height} fill={fill} rx={4} />;
}

// ─── Custom chart tooltip ─────────────────────────────────────────

interface TooltipPayloadItem {
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CalorieTooltip({ active, payload, label }: CustomTooltipProps): React.ReactElement | null {
  if (!active || !payload?.length) return null;
  const kcal = payload[0].value;
  return (
    <div
      className="glass rounded-xl px-3 py-2"
      style={{ fontSize: 13, color: 'var(--brand-text)' }}
    >
      <p style={{ color: 'var(--brand-text-2)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700 }}>{kcal > 0 ? `${kcal} kcal` : 'Not logged'}</p>
    </div>
  );
}

// ─── Stat tile ────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string;
  sub?: string;
  valueColor?: string;
}

function StatTile({ label, value, sub, valueColor = 'var(--brand-text)' }: StatTileProps): React.ReactElement {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-1">
      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.06em',
          color: 'var(--brand-text-3)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 28, fontWeight: 800, color: valueColor, lineHeight: 1 }}>
        {value}
      </p>
      {sub && (
        <p style={{ fontSize: 12, color: 'var(--brand-text-3)', marginTop: 2 }}>{sub}</p>
      )}
    </div>
  );
}

// ─── Macros breakdown card ────────────────────────────────────────

interface MacrosCardProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function MacrosCard({ proteinG, carbsG, fatG }: MacrosCardProps): React.ReactElement {
  const proteinKcal = proteinG * 4;
  const carbsKcal = carbsG * 4;
  const fatKcal = fatG * 9;
  const totalKcal = proteinKcal + carbsKcal + fatKcal || 1;

  const proteinPct = (proteinKcal / totalKcal) * 100;
  const carbsPct = (carbsKcal / totalKcal) * 100;
  const fatPct = (fatKcal / totalKcal) * 100;

  return (
    <div className="glass rounded-2xl p-4">
      <p style={{ fontSize: 13, color: 'var(--brand-text-2)', marginBottom: 12 }}>
        Avg Macro Breakdown
      </p>

      {/* Stacked bar */}
      <div
        style={{
          display: 'flex',
          height: 10,
          borderRadius: 5,
          overflow: 'hidden',
          marginBottom: 16,
          gap: 2,
        }}
      >
        <div style={{ width: `${proteinPct}%`, background: '#64D2FF', borderRadius: 5 }} />
        <div style={{ width: `${carbsPct}%`, background: '#C5F74F', borderRadius: 5 }} />
        <div style={{ width: `${fatPct}%`, background: '#FF9F0A', borderRadius: 5 }} />
      </div>

      {/* Values row */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {[
          { label: 'Protein', value: proteinG, color: '#64D2FF' },
          { label: 'Carbs', value: carbsG, color: '#C5F74F' },
          { label: 'Fat', value: fatG, color: '#FF9F0A' },
        ].map(({ label, value, color }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}g</p>
            <p style={{ fontSize: 12, color: 'var(--brand-text-3)', marginTop: 2 }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Day row ──────────────────────────────────────────────────────

interface DayRowProps {
  day: DayReport;
  isLast: boolean;
}

function DayRow({ day, isLast }: DayRowProps): React.ReactElement {
  const color = adherenceColor(day.adherence, day.logged);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left: label + date */}
        <div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-text)' }}>
            {day.dayLabel}
          </p>
          <p style={{ fontSize: 12, color: 'var(--brand-text-3)', marginTop: 1 }}>
            {formatDayDate(day.date)}
          </p>
        </div>

        {/* Right: calories + adherence badge */}
        <div className="flex items-center gap-2">
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--brand-text-2)' }}>
            {day.logged ? `${Math.round(day.totals.calories)} kcal` : '—'}
          </p>
          <div
            style={{
              background: color,
              borderRadius: 20,
              paddingInline: 8,
              paddingBlock: 3,
              minWidth: 40,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: day.logged ? 'var(--brand-bg)' : 'rgba(245,245,245,0.5)',
              }}
            >
              {day.logged ? `${day.adherence}%` : '—'}
            </p>
          </div>
        </div>
      </div>

      {!isLast && (
        <div
          style={{
            height: 1,
            background: 'rgba(245,245,245,0.06)',
            marginInline: 16,
          }}
        />
      )}
    </>
  );
}

// ─── ReportScreen ─────────────────────────────────────────────────

export function ReportScreen(): React.ReactElement {
  const router = useRouter();
  const [weekOffset, setWeekOffset] = useState(0);

  const { data: dietProfile, isLoading: profileLoading } = useDietProfile();
  const targetCalories = dietProfile?.dailyTargets.calories ?? 0;
  const { data: report, isLoading: reportLoading } = useWeeklyReport(targetCalories, weekOffset);

  const isLoading = profileLoading || reportLoading;

  // ── Chart data ──
  const chartData = report?.days.map(d => ({
    dayLabel: d.dayLabel,
    calories: Math.round(d.totals.calories),
    target: targetCalories,
  })) ?? [];

  // ── Summary metrics ──
  function daysLoggedColor(n: number): string {
    if (n >= 5) return 'var(--brand-lime)';
    if (n >= 3) return 'var(--brand-warning)';
    return 'var(--brand-danger)';
  }

  function adherenceScoreColor(score: number): string {
    if (score >= 80) return 'var(--brand-lime)';
    if (score >= 50) return 'var(--brand-warning)';
    return 'var(--brand-danger)';
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: 'var(--brand-bg)',
        paddingBottom: 112,
      }}
    >
      {/* ── Sticky Header ── */}
      <div
        className="glass-nav-bar sticky top-0 z-40 flex items-center gap-3 px-4"
        style={{
          paddingTop: 'calc(16px + env(safe-area-inset-top, 0px))',
          paddingBottom: 12,
        }}
      >
        <motion.button
          whileTap={{ scale: 0.88 }}
          transition={springSnappy}
          onClick={() => router.back()}
          aria-label="Go back"
          className="glass rounded-xl p-2"
        >
          <Icon name="chevron.left" size={20} color="var(--brand-text)" />
        </motion.button>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: 'var(--brand-text)',
            letterSpacing: '-0.02em',
          }}
        >
          Weekly Report
        </h1>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-4">
        {/* ── No profile guard ── */}
        {!profileLoading && !dietProfile && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springDefault}
            className="glass rounded-2xl p-5 flex flex-col gap-4"
          >
            <p style={{ fontSize: 15, color: 'var(--brand-text-2)' }}>
              Set up your nutrition profile to see weekly reports.
            </p>
            <motion.button
              whileTap={{ scale: 0.96 }}
              transition={springSnappy}
              onClick={() => router.push('/diet/setup')}
              className="rounded-xl px-4 py-3"
              style={{
                background: 'var(--brand-lime)',
                color: 'var(--brand-bg)',
                fontSize: 15,
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              Set Up Profile
            </motion.button>
          </motion.div>
        )}

        {/* ── Week Navigator ── */}
        {dietProfile && (
          <div className="glass rounded-2xl px-4 py-3 flex items-center justify-between">
            <motion.button
              whileTap={{ scale: 0.88 }}
              transition={springSnappy}
              onClick={() => setWeekOffset(o => o - 1)}
              disabled={weekOffset <= -12}
              aria-label="Previous week"
              style={{ opacity: weekOffset <= -12 ? 0.3 : 1 }}
            >
              <Icon name="chevron.left" size={20} color="var(--brand-text)" />
            </motion.button>

            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--brand-text)',
                letterSpacing: '-0.01em',
              }}
            >
              {report
                ? `${formatWeekLabel(report.weekStart)} – ${formatWeekLabel(report.weekEnd)}`
                : '—'}
            </p>

            <motion.button
              whileTap={{ scale: 0.88 }}
              transition={springSnappy}
              onClick={() => setWeekOffset(o => o + 1)}
              disabled={weekOffset >= 0}
              aria-label="Next week"
              style={{ opacity: weekOffset >= 0 ? 0.3 : 1 }}
            >
              <Icon name="chevron.right" size={20} color="var(--brand-text)" />
            </motion.button>
          </div>
        )}

        {/* ── Loading skeletons ── */}
        {isLoading && dietProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={springGentle}
            className="flex flex-col gap-4"
          >
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="glass rounded-2xl"
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
                style={{
                  height: i === 1 ? 120 : i === 2 ? 220 : 300,
                }}
              />
            ))}
          </motion.div>
        )}

        {/* ── Report content ── */}
        <AnimatePresence mode="wait">
          {!isLoading && dietProfile && report && (
            <motion.div
              key={`report-${weekOffset}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={springDefault}
              className="flex flex-col gap-4"
            >
              {/* ── Summary 2×2 grid ── */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <StatTile
                  label="Days Logged"
                  value={`${report.loggedDays} / 7`}
                  valueColor={daysLoggedColor(report.loggedDays)}
                />
                <StatTile
                  label="Avg Calories"
                  value={`${report.avgCalories}`}
                  sub={`Target: ${targetCalories} kcal`}
                />
                <StatTile
                  label="Streak"
                  value={`${report.streakDays} day${report.streakDays !== 1 ? 's' : ''}`}
                  valueColor={report.streakDays >= 3 ? 'var(--brand-lime)' : 'var(--brand-text)'}
                />
                <StatTile
                  label="Adherence"
                  value={`${report.adherenceScore}%`}
                  valueColor={adherenceScoreColor(report.adherenceScore)}
                />
              </div>

              {/* ── Calorie bar chart ── */}
              <div className="glass rounded-2xl p-4">
                <p style={{ fontSize: 13, color: 'var(--brand-text-2)', marginBottom: 12 }}>
                  Calories This Week
                </p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart
                    data={chartData}
                    margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid
                      horizontal={true}
                      vertical={false}
                      stroke="rgba(255,255,255,0.06)"
                    />
                    <XAxis
                      dataKey="dayLabel"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: 'rgba(245,245,245,0.45)', fontSize: 11 }}
                    />
                    <YAxis hide={true} />
                    <Tooltip content={<CalorieTooltip />} cursor={false} />
                    <ReferenceLine
                      y={targetCalories}
                      stroke="rgba(197,247,79,0.5)"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Target',
                        position: 'insideTopRight',
                        fill: 'rgba(197,247,79,0.6)',
                        fontSize: 10,
                      }}
                    />
                    <Bar
                      dataKey="calories"
                      shape={<CalorieBar />}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* ── Macros breakdown ── */}
              <MacrosCard
                proteinG={report.avgProteinG}
                carbsG={report.avgCarbsG}
                fatG={report.avgFatG}
              />

              {/* ── Per-day list ── */}
              <div className="glass rounded-2xl overflow-hidden">
                {report.days.map((day, idx) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    isLast={idx === report.days.length - 1}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
