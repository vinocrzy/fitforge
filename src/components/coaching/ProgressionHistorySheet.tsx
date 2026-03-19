// ═══════════════════════════════════════════════════════════════════
// FitForge — Progression History Sheet
// PT Feature 2: Shows RPE + weight trends over time with sparkline
// ═══════════════════════════════════════════════════════════════════

'use client';

import { useMemo } from 'react';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { WorkoutSession } from '@/types';
import { useProfileStore } from '@/store/useProfileStore';

interface ProgressionHistorySheetProps {
  open: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  workouts: WorkoutSession[];
}

interface ChartDataPoint {
  date: string;
  dateLabel: string;
  weight: number | null;
  rpe: number | null;
  reps: number | null;
}

export function ProgressionHistorySheet({
  open,
  onClose,
  exerciseId,
  exerciseName,
  workouts,
}: ProgressionHistorySheetProps) {
  const unitPreference = useProfileStore((s) => s.unitPreference);

  // Build chart data from last 10 sessions
  const chartData = useMemo((): ChartDataPoint[] => {
    const relevantWorkouts = workouts
      .filter((w) => {
        // Check if workout contains this exercise in workout phase
        return w.workout.some((ex) => ex.exerciseId === exerciseId);
      })
      .sort((a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime())
      .slice(-10); // Last 10 sessions

    return relevantWorkouts.map((workout) => {
      const exercise = workout.workout.find((ex) => ex.exerciseId === exerciseId);
      if (!exercise) {
        return {
          date: workout.completedAt,
          dateLabel: new Date(workout.completedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          weight: null,
          rpe: null,
          reps: null,
        };
      }

      const setsWithRpe = exercise.sets.filter((s) => s.rpe !== undefined);
      const avgRpe = setsWithRpe.length > 0
        ? setsWithRpe.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / setsWithRpe.length
        : null;

      const maxWeight = Math.max(...exercise.sets.map((s) => s.weightKg ?? 0));
      const avgReps = exercise.sets.reduce((sum, s) => sum + (s.actualReps ?? 0), 0) / exercise.sets.length;

      return {
        date: workout.completedAt,
        dateLabel: new Date(workout.completedAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        weight: maxWeight > 0 ? maxWeight : null,
        rpe: avgRpe,
        reps: avgReps > 0 ? avgReps : null,
      };
    });
  }, [workouts, exerciseId]);

  const formatWeight = (kg: number) => {
    if (unitPreference === 'lbs') {
      return `${Math.round(kg * 2.20462)}lbs`;
    }
    return `${kg}kg`;
  };

  const hasData = chartData.length > 0;

  return (
    <BottomSheet
      id="progression-history"
      open={open}
      onClose={onClose}
      title="Progression History"
      fullHeight
    >
      <div className="p-4 pb-8">
        {/* Exercise name */}
        <h3 className="text-[20px] font-bold mb-1" style={{ color: '#F5F5F5' }}>
          {exerciseName}
        </h3>
        <p className="text-[13px] mb-6" style={{ color: 'rgba(245,245,245,0.50)' }}>
          Last {chartData.length} sessions
        </p>

        {!hasData && (
          <div className="py-12 text-center">
            <p className="text-[15px]" style={{ color: 'rgba(245,245,245,0.50)' }}>
              No workout history for this exercise yet
            </p>
          </div>
        )}

        {hasData && (
          <>
            {/* Weight + RPE Combined Chart */}
            <div className="mb-8">
              <p className="text-[13px] uppercase font-semibold mb-3" style={{ color: 'rgba(245,245,245,0.50)', letterSpacing: '0.5px' }}>
                Weight & RPE Trend
              </p>
              <div className="rounded-[16px] p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="dateLabel"
                      tick={{ fill: 'rgba(245,245,245,0.40)', fontSize: 11 }}
                      stroke="rgba(255,255,255,0.10)"
                    />
                    <YAxis
                      yAxisId="left"
                      tick={{ fill: 'rgba(245,245,245,0.40)', fontSize: 11 }}
                      stroke="rgba(255,255,255,0.10)"
                      label={{ value: unitPreference === 'kg' ? 'Weight (kg)' : 'Weight (lbs)', angle: -90, position: 'insideLeft', fill: '#C5F74F', fontSize: 11 }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      domain={[0, 10]}
                      tick={{ fill: 'rgba(245,245,245,0.40)', fontSize: 11 }}
                      stroke="rgba(255,255,255,0.10)"
                      label={{ value: 'RPE', angle: 90, position: 'insideRight', fill: '#FF9F0A', fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(20,20,20,0.95)',
                        border: '1px solid rgba(255,255,255,0.10)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#F5F5F5' }}
                      formatter={(value: number | undefined, name: string | undefined) => {
                        if (value === undefined) return ['—', name ?? 'Unknown'];
                        if (name === 'weight') {
                          return [formatWeight(value), 'Weight'];
                        }
                        if (name === 'rpe') {
                          return [value.toFixed(1), 'Avg RPE'];
                        }
                        return [value, name ?? 'Unknown'];
                      }}
                    />
                    <Legend
                      wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => {
                        if (value === 'weight') return 'Weight';
                        if (value === 'rpe') return 'Avg RPE';
                        return value;
                      }}
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="weight"
                      stroke="#C5F74F"
                      strokeWidth={3}
                      dot={{ fill: '#C5F74F', r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rpe"
                      stroke="#FF9F0A"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#FF9F0A', r: 3 }}
                      activeDot={{ r: 5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Session Table */}
            <div>
              <p className="text-[13px] uppercase font-semibold mb-3" style={{ color: 'rgba(245,245,245,0.50)', letterSpacing: '0.5px' }}>
                Session Details
              </p>
              <div className="flex flex-col gap-2">
                {chartData.slice().reverse().map((session, i) => (
                  <div
                    key={session.date}
                    className="rounded-[12px] p-3"
                    style={{ background: 'rgba(255,255,255,0.03)' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[13px] font-semibold" style={{ color: '#F5F5F5' }}>
                        {session.dateLabel}
                      </p>
                      {session.rpe && (
                        <div
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                          style={{
                            background: session.rpe > 8 ? 'rgba(255,69,58,0.15)' : session.rpe > 6 ? 'rgba(255,159,10,0.15)' : 'rgba(48,209,88,0.15)',
                            color: session.rpe > 8 ? '#FF453A' : session.rpe > 6 ? '#FF9F0A' : '#30D158',
                          }}
                        >
                          RPE {session.rpe.toFixed(1)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      {session.weight && (
                        <div>
                          <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.40)' }}>Weight</p>
                          <p className="text-[15px] font-bold tabular-nums" style={{ color: '#C5F74F' }}>
                            {formatWeight(session.weight)}
                          </p>
                        </div>
                      )}
                      {session.reps && (
                        <div>
                          <p className="text-[11px]" style={{ color: 'rgba(245,245,245,0.40)' }}>Avg Reps</p>
                          <p className="text-[15px] font-bold tabular-nums" style={{ color: 'rgba(245,245,245,0.70)' }}>
                            {Math.round(session.reps)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </BottomSheet>
  );
}
