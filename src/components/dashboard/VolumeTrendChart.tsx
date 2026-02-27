// ═══════════════════════════════════════════════════════════════════
// FitForge — Volume Trend Chart (Recharts)
// Weekly volume bar chart with 8-week trend
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { WorkoutSession } from '@/types';
import { volumeTrend } from '@/lib/calculations/analytics';

interface VolumeTrendChartProps {
  workouts: WorkoutSession[];
  weeks?: number;
}

export function VolumeTrendChart({ workouts, weeks = 8 }: VolumeTrendChartProps) {
  const data = useMemo(() => volumeTrend(workouts, weeks), [workouts, weeks]);

  const hasData = data.some((d) => d.volume > 0);

  if (!hasData) {
    return (
      <div
        className="rounded-[20px] p-5 flex items-center justify-center"
        style={{ background: '#141414', height: 220 }}
      >
        <p className="text-[14px]" style={{ color: 'rgba(245,245,245,0.35)' }}>
          Complete a few workouts to see volume trends
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[20px] p-5" style={{ background: '#141414' }}>
      <p
        className="text-[13px] font-semibold uppercase tracking-wider mb-3"
        style={{ color: 'rgba(245,245,245,0.45)', letterSpacing: '0.06em' }}
      >
        Volume Trend
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.06)"
            vertical={false}
          />
          <XAxis
            dataKey="weekLabel"
            tick={{ fill: 'rgba(245,245,245,0.40)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'rgba(245,245,245,0.30)', fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
          />
          <Tooltip
            contentStyle={{
              background: '#1A1A1A',
              border: '1px solid rgba(255,255,255,0.10)',
              borderRadius: 12,
              color: '#F5F5F5',
              fontSize: 13,
            }}
            formatter={(value) => [`${Number(value).toLocaleString()} kg`, 'Volume']}
            labelStyle={{ color: 'rgba(245,245,245,0.55)' }}
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
          />
          <Bar
            dataKey="volume"
            fill="#C5F74F"
            radius={[4, 4, 0, 0]}
            barSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
