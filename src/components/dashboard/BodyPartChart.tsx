// ═══════════════════════════════════════════════════════════════════
// FitForge — Body Part Frequency Chart (Recharts)
// Horizontal bar chart showing muscle group training frequency
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { WorkoutSession, ExerciseDoc } from '@/types';
import { bodyPartFrequency } from '@/lib/calculations/analytics';

const BODY_PART_COLORS: Record<string, string> = {
  chest: '#C5F74F',
  back: '#64D2FF',
  shoulders: '#FF9F0A',
  'upper arms': '#FF453A',
  'lower arms': '#FF6B6B',
  'upper legs': '#30D158',
  'lower legs': '#5AC8FA',
  waist: '#BF5AF2',
  cardio: '#FFD60A',
  other: 'rgba(245,245,245,0.25)',
};

interface BodyPartChartProps {
  workouts: WorkoutSession[];
  exercises: ExerciseDoc[];
}

function toTitleCase(str: string): string {
  return str.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function BodyPartChart({ workouts, exercises }: BodyPartChartProps) {
  const data = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of exercises) {
      map.set(ex.id, ex.bodyPart);
    }
    return bodyPartFrequency(workouts, map).slice(0, 8);
  }, [workouts, exercises]);

  if (data.length === 0) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center justify-center"
        style={{ background: '#141414', height: 200 }}
      >
        <p className="text-[14px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
          Train different muscle groups to see frequency
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: toTitleCase(d.bodyPart),
    count: d.count,
    fill: BODY_PART_COLORS[d.bodyPart] ?? BODY_PART_COLORS.other,
  }));

  return (
    <div className="rounded-[20px] p-5" style={{ background: '#141414' }}>
      <p
        className="text-[13px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.06em' }}
      >
        Muscle Group Focus
      </p>
      <ResponsiveContainer width="100%" height={data.length * 36 + 8}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
        >
          <XAxis
            type="number"
            tick={{ fill: 'rgba(245,245,245,0.30)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'rgba(245,245,245,0.55)', fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={90}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              color: '#F5F5F5',
              fontSize: 13,
            }}
            formatter={(value) => [`${value} sessions`, 'Frequency']}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={20}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
