// ═══════════════════════════════════════════════════════════════════
// FitForge — WeightChart
// Scatter + rolling-average trend chart (Recharts)
// ═══════════════════════════════════════════════════════════════════

'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Scatter,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

export interface WeightChartProps {
  points: Array<{ date: string; weightKg: number; isNewLow: boolean }>;
  rollingAvg: Array<{ date: string; avgKg: number }>;
  unitPreference: 'kg' | 'lbs';
}

// ─── Helpers ─────────────────────────────────────────────────────

function toDisplay(kg: number, unit: 'kg' | 'lbs'): number {
  return unit === 'lbs'
    ? Math.round(kg * 2.20462 * 10) / 10
    : Math.round(kg * 10) / 10;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${d.getDate()} ${d.toLocaleString('en-GB', { month: 'short' })}`;
}

// ─── Custom dot ──────────────────────────────────────────────────

function CustomDot(props: {
  cx?: number;
  cy?: number;
  payload?: { isNewLow?: boolean };
}) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null) return null;
  const isNewLow = payload?.isNewLow ?? false;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={isNewLow ? 5 : 3}
      fill={isNewLow ? '#C5F74F' : 'rgba(245,245,245,0.45)'}
      stroke="none"
    />
  );
}

// ─── Custom tooltip ──────────────────────────────────────────────

function CustomTooltip({
  active,
  payload,
  unitPreference,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  unitPreference: 'kg' | 'lbs';
}) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(20,20,20,0.95)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: '6px 10px',
      }}
    >
      {payload.map((p) => (
        <p key={p.name} style={{ color: '#F5F5F5', fontSize: 12, margin: 0 }}>
          {p.name}: {p.value} {unitPreference}
        </p>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────

export function WeightChart({ points, rollingAvg, unitPreference }: WeightChartProps) {
  // Merge points and rollingAvg by date
  const dateMap = new Map<
    string,
    { date: string; weight?: number; avg?: number; isNewLow?: boolean }
  >();

  for (const p of points) {
    dateMap.set(p.date, {
      date: p.date,
      weight: toDisplay(p.weightKg, unitPreference),
      isNewLow: p.isNewLow,
    });
  }

  for (const r of rollingAvg) {
    const existing = dateMap.get(r.date);
    dateMap.set(r.date, {
      ...(existing ?? { date: r.date }),
      avg: toDisplay(r.avgKg, unitPreference),
    });
  }

  const data = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  // Show ~5 evenly spaced X-axis ticks
  const totalTicks = data.length;
  const interval = totalTicks > 5 ? Math.floor(totalTicks / 5) : 0;

  const allValues = data.flatMap((d) =>
    [d.weight, d.avg].filter((v): v is number => v != null),
  );
  const minVal = allValues.length ? Math.min(...allValues) : 0;
  const maxVal = allValues.length ? Math.max(...allValues) : 100;
  const padding = (maxVal - minVal) * 0.1 || 2;
  const yDomain: [number, number] = [
    Math.round((minVal - padding) * 10) / 10,
    Math.round((maxVal + padding) * 10) / 10,
  ];

  return (
    <div>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            interval={interval}
            tick={{ fill: 'rgba(245,245,245,0.45)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={yDomain}
            tickFormatter={(v: number) => `${v}`}
            tick={{ fill: 'rgba(245,245,245,0.45)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            label={{
              value: unitPreference,
              position: 'insideTopLeft',
              fill: 'rgba(245,245,245,0.30)',
              fontSize: 11,
              offset: 4,
            }}
          />
          <Tooltip
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as Array<{ value: number; name: string }>}
                unitPreference={unitPreference}
              />
            )}
          />
          <Scatter dataKey="weight" name="Weight" shape={<CustomDot />} />
          <Line
            dataKey="avg"
            name="7-day avg"
            stroke="var(--brand-lime)"
            strokeWidth={2}
            dot={false}
            type="monotone"
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>

      {rollingAvg.length < 2 && (
        <p
          style={{
            color: 'var(--brand-text-3)',
            fontSize: 12,
            textAlign: 'center',
            marginTop: 6,
          }}
        >
          Need 7+ entries for trend line
        </p>
      )}
    </div>
  );
}
