// ═══════════════════════════════════════════════════════════════════
// FitForge — Profile & Stats (S-18)
// Avatar, XP bar, monthly chart, PRs, settings
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { springSnappy } from '@/lib/motion/springs';
import { Icon } from '@/components/ui/Icon';
import { useProfileStore } from '@/store/useProfileStore';
import { useWorkoutHistory } from '@/hooks/useDatabase';
import type { WorkoutSession, PersonalRecord, FitnessGoal } from '@/types';

// ─── Level thresholds (mirrors store) ─────────────────────────────
const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900,
  3500, 4200, 5000, 5900, 6900, 8000, 9200, 10500, 12000, 13700,
];

function xpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] + 2000;
}

function xpForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[level - 1] ?? 0;
}

// ─── Monthly stats helper ─────────────────────────────────────────
interface MonthBucket {
  month: string;
  workouts: number;
}

function monthlyStats(workouts: WorkoutSession[], months = 6): MonthBucket[] {
  const result: MonthBucket[] = [];
  const now = new Date();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const count = workouts.filter((w) => {
      const wd = new Date(w.completedAt);
      return wd.getMonth() === m && wd.getFullYear() === y;
    }).length;
    result.push({ month: monthNames[m], workouts: count });
  }
  return result;
}

// ─── Goal meta ────────────────────────────────────────────────────
const GOAL_META: Record<FitnessGoal, { label: string; color: string }> = {
  muscle_gain: { label: 'Muscle', color: '#C5F74F' },
  cardio: { label: 'Cardio', color: '#64D2FF' },
  athletic: { label: 'Athletic', color: '#FF9F0A' },
  flexibility: { label: 'Flex', color: '#BF5AF2' },
  fat_loss: { label: 'Fat Loss', color: '#FF453A' },
  maintain: { label: 'Maintain', color: '#30D158' },
};

// ═══════════════════════════════════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();
  const {
    level,
    xp,
    streakDays,
    unitPreference,
    weightKg,
    experienceLevel,
    goals,
    prs,
    fatigueThresholdPercent,
    setUnitPreference,
    setFatigueThreshold,
  } = useProfileStore();

  const { data: workouts = [] } = useWorkoutHistory();

  const displayWeight =
    unitPreference === 'lbs'
      ? `${Math.round(weightKg * 2.20462)} lbs`
      : `${weightKg} kg`;

  // XP progress
  const currentLevelXp = xpForCurrentLevel(level);
  const nextLevelXp = xpForNextLevel(level);
  const xpProgress = nextLevelXp > currentLevelXp
    ? (xp - currentLevelXp) / (nextLevelXp - currentLevelXp)
    : 1;

  // Monthly bar data
  const monthData = useMemo(() => monthlyStats(workouts), [workouts]);
  const hasMonthData = monthData.some((d) => d.workouts > 0);

  // Goals with simple progress (based on workout count — proxy)
  const totalWorkouts = workouts.length;
  const goalProgress = useMemo(() =>
    goals.map((g) => {
      const meta = GOAL_META[g];
      // Proxy progress: every 10 workouts ≈ 25% toward goal
      const pct = Math.min(100, Math.round((totalWorkouts / 40) * 100));
      return { ...meta, goal: g, percent: pct };
    }),
    [goals, totalWorkouts],
  );

  // PR list (most recent first)
  const prList = useMemo(() => {
    return Object.values(prs)
      .sort((a, b) => new Date(b.achievedAt).getTime() - new Date(a.achievedAt).getTime())
      .slice(0, 10);
  }, [prs]);

  return (
    <div className="min-h-screen px-6 pt-16 pb-28 bg-[#0B0B0B]">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <motion.h1
          className="text-[34px] font-extrabold tracking-tight"
          style={{ color: '#F5F5F5' }}
          initial={{ y: 14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        >
          Profile
        </motion.h1>
        <motion.button
          onClick={() => router.push('/onboarding/profile')}
          whileTap={{ scale: 0.92 }}
          transition={springSnappy}
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.06)' }}
          aria-label="Edit profile"
        >
          <Icon name="pencil" size={16} color="rgba(245,245,245,0.55)" />
        </motion.button>
      </div>

      <div className="mt-6 flex flex-col gap-5">
        {/* ── Profile Card ───────────────────────────────────── */}
        <motion.div
          className="rounded-[20px] p-5 flex flex-col items-center gap-3"
          style={{
            background: '#141414',
            backgroundImage: 'linear-gradient(135deg, rgba(197,247,79,0.04) 0%, transparent 60%)',
          }}
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.06 }}
        >
          {/* Avatar */}
          <div
            className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[26px] font-bold"
            style={{
              background: 'linear-gradient(135deg, #C5F74F, #8BC34A)',
              border: '2px solid #C5F74F',
              color: '#0B0B0B',
            }}
          >
            {/* Initials fallback */}
            FF
          </div>

          {/* Name */}
          <div className="text-[22px] font-extrabold" style={{ color: '#F5F5F5' }}>
            FitForge Athlete
          </div>

          {/* Level / XP */}
          <div className="flex items-center gap-2 text-[15px] font-medium">
            <span style={{ color: '#C5F74F' }}>Level {level}</span>
            <span style={{ color: 'rgba(245,245,245,0.35)' }}>•</span>
            <span style={{ color: 'rgba(245,245,245,0.55)' }}>
              {xp.toLocaleString()} XP
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full max-w-[260px] flex items-center gap-2">
            <div
              className="flex-1 h-[6px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#C5F74F' }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round(xpProgress * 100)}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
              />
            </div>
            <span
              className="text-[11px] tabular-nums"
              style={{ color: 'rgba(245,245,245,0.40)' }}
            >
              {nextLevelXp - xp} to go
            </span>
          </div>
        </motion.div>

        {/* ── Stats Grid ─────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
        >
          {[
            { label: 'Streak', value: `${streakDays}d`, icon: 'flame.fill' },
            { label: 'Workouts', value: String(totalWorkouts), icon: 'dumbbell.fill' },
            { label: 'PRs', value: String(prList.length), icon: 'trophy.fill' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-2 py-4 rounded-[16px]"
              style={{ background: '#141414' }}
            >
              <Icon name={stat.icon} size={18} color="#C5F74F" weight="fill" />
              <div className="text-[20px] font-bold tabular-nums" style={{ color: '#F5F5F5' }}>
                {stat.value}
              </div>
              <div
                className="text-[11px] font-medium uppercase tracking-wider"
                style={{ color: 'rgba(245,245,245,0.45)' }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Goals ──────────────────────────────────────────── */}
        {goalProgress.length > 0 && (
          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.14 }}
          >
            <SectionLabel>Goals</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {goalProgress.map((g) => (
                <div
                  key={g.goal}
                  className="rounded-[16px] p-4 flex flex-col items-center gap-3"
                  style={{ background: '#141414' }}
                >
                  {/* Ring */}
                  <svg width={64} height={64} viewBox="0 0 64 64">
                    <circle
                      cx={32} cy={32} r={26}
                      fill="none"
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth={5}
                    />
                    <circle
                      cx={32} cy={32} r={26}
                      fill="none"
                      stroke={g.color}
                      strokeWidth={5}
                      strokeLinecap="round"
                      strokeDasharray={`${(g.percent / 100) * 163.36} 163.36`}
                      transform="rotate(-90 32 32)"
                    />
                    <text
                      x={32} y={34}
                      textAnchor="middle"
                      fontSize={13}
                      fontWeight={700}
                      fill={g.color}
                    >
                      {g.percent}%
                    </text>
                  </svg>
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: 'rgba(245,245,245,0.70)' }}
                  >
                    {g.label}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── Monthly Stats Chart ────────────────────────────── */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.18 }}
        >
          <SectionLabel>Monthly Stats</SectionLabel>
          {hasMonthData ? (
            <div className="rounded-[20px] p-5 mt-3" style={{ background: '#141414' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={monthData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.07)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(245,245,245,0.40)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(20,20,20,0.9)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 10,
                      color: '#F5F5F5',
                      fontSize: 14,
                    }}
                    formatter={(value) => [`${value}`, 'Workouts']}
                    labelStyle={{ color: 'rgba(245,245,245,0.55)' }}
                    cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  />
                  <Bar dataKey="workouts" fill="#C5F74F" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div
              className="rounded-[20px] p-5 flex items-center justify-center mt-3"
              style={{ background: '#141414', height: 160 }}
            >
              <p className="text-[14px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
                Complete workouts to see monthly stats
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Personal Records ────────────────────────────────── */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.22 }}
        >
          <SectionLabel>Personal Records</SectionLabel>
          {prList.length > 0 ? (
            <div
              className="rounded-[16px] mt-3 overflow-hidden"
              style={{ background: '#141414' }}
            >
              {prList.map((pr, i) => (
                <PRRow key={pr.exerciseId + pr.type} pr={pr} unit={unitPreference} last={i === prList.length - 1} />
              ))}
            </div>
          ) : (
            <div
              className="rounded-[16px] p-5 flex items-center justify-center mt-3"
              style={{ background: '#141414' }}
            >
              <p className="text-[14px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
                PRs will appear as you train
              </p>
            </div>
          )}
        </motion.div>

        {/* ── Settings ───────────────────────────────────────── */}
        <motion.div
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.26 }}
        >
          <SectionLabel>Settings</SectionLabel>
          <div className="rounded-[14px] mt-3 overflow-hidden" style={{ background: '#141414' }}>
            {/* Units toggle */}
            <SettingsRow
              label="Units"
              value={unitPreference.toUpperCase()}
              onTap={() => setUnitPreference(unitPreference === 'kg' ? 'lbs' : 'kg')}
            />
            {/* Bodyweight */}
            <SettingsRow label="Bodyweight" value={displayWeight} />
            {/* Experience */}
            <SettingsRow label="Experience" value={experienceLevel} capitalize />
            {/* Fatigue threshold */}
            <SettingsRow
              label="Fatigue Threshold"
              value={`${fatigueThresholdPercent}%`}
              onTap={() => {
                const next = fatigueThresholdPercent >= 50 ? 10 : fatigueThresholdPercent + 10;
                setFatigueThreshold(next);
              }}
            />
            {/* Edit profile */}
            <SettingsRow
              label="Edit Profile"
              chevron
              onTap={() => router.push('/onboarding/profile')}
              last
            />
          </div>
        </motion.div>

        {/* ── Quick Links ────────────────────────────────────── */}
        <motion.div
          className="flex gap-3 mt-1"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
        >
          <QuickLink label="Exercises" icon="figure.strengthtraining.traditional" onTap={() => router.push('/exercises')} />
          <QuickLink label="History" icon="clock.arrow.circlepath" onTap={() => router.push('/history')} />
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[13px] font-bold uppercase tracking-[0.08em]"
      style={{ color: 'rgba(245,245,245,0.40)' }}
    >
      {children}
    </p>
  );
}

function PRRow({ pr, unit, last }: { pr: PersonalRecord; unit: 'kg' | 'lbs'; last: boolean }) {
  const displayVal =
    pr.type === 'weight'
      ? unit === 'lbs'
        ? `${Math.round((pr.value) * 2.20462)} lbs`
        : `${pr.value} kg`
      : pr.type === 'reps'
        ? `${pr.value} reps`
        : `${pr.value.toLocaleString()} vol`;

  const date = new Date(pr.achievedAt);
  const dateStr = `${date.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getMonth()]}`;

  return (
    <div
      className="flex items-center justify-between px-4 py-3"
      style={{
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <Icon name="trophy.fill" size={14} color="#C5F74F" weight="fill" />
        <span className="text-[15px] font-medium" style={{ color: '#F5F5F5' }}>
          {pr.exerciseId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 22)}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[15px] font-semibold tabular-nums" style={{ color: '#C5F74F' }}>
          {displayVal}
        </span>
        <span className="text-[12px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
          {dateStr}
        </span>
      </div>
    </div>
  );
}

function SettingsRow({
  label,
  value,
  chevron,
  capitalize,
  onTap,
  last,
}: {
  label: string;
  value?: string;
  chevron?: boolean;
  capitalize?: boolean;
  onTap?: () => void;
  last?: boolean;
}) {
  return (
    <motion.button
      className="w-full flex items-center justify-between px-4"
      style={{
        height: 52,
        borderBottom: last ? 'none' : '1px solid rgba(255,255,255,0.06)',
      }}
      whileTap={onTap ? { scale: 0.98 } : undefined}
      onClick={onTap}
      transition={springSnappy}
    >
      <span className="text-[17px]" style={{ color: '#F5F5F5' }}>
        {label}
      </span>
      <span
        className={`text-[17px] ${capitalize ? 'capitalize' : ''}`}
        style={{ color: 'rgba(245,245,245,0.45)' }}
      >
        {value}
        {chevron && (
          <Icon name="chevron.right" size={13} color="rgba(245,245,245,0.35)" />
        )}
      </span>
    </motion.button>
  );
}

function QuickLink({ label, icon, onTap }: { label: string; icon: string; onTap: () => void }) {
  return (
    <motion.button
      onClick={onTap}
      whileTap={{ scale: 0.97 }}
      transition={springSnappy}
      className="flex-1 h-12 rounded-[14px] flex items-center justify-center gap-2"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Icon name={icon} size={16} color="rgba(245,245,245,0.60)" weight="fill" />
      <span className="text-[15px] font-semibold" style={{ color: 'rgba(245,245,245,0.70)' }}>
        {label}
      </span>
    </motion.button>
  );
}
