# Task 4 — Business Logic Document

---

## 4.1 Calorie Burn Calculation

Calorie calculation in strength training is estimated. The model is grounded in **MET (Metabolic Equivalent of Task)** values, adjusted for intensity signals available in the app.

### MET Values by Category and Difficulty

```typescript
// lib/calculations/calories.ts
const BASE_MET: Record<string, Record<string, number>> = {
  strength:    { beginner: 3.5, intermediate: 5.0, advanced: 6.0 },
  cardio:      { beginner: 7.0, intermediate: 9.0, advanced: 11.0 },
  stretching:  { beginner: 2.5, intermediate: 2.5, advanced: 2.5  },
  plyometrics: { beginner: 7.0, intermediate: 8.5, advanced: 10.0 },
};

const AVG_REP_DURATION_SEC = 3; // ~3s per rep default; configurable per routine
```

### Calorie Formula

Based on the Harris-Benedict principle:

```
Calories = MET × weight_kg × duration_hours
```

```typescript
export function calculateCalories(
  exercises: { exerciseRecord: ExerciseRecord; sets: CompletedSet[] }[],
  userWeightKg: number,
  actualRpeAvg?: number
): number {
  let totalCalories = 0;

  exercises.forEach(({ exerciseRecord, sets }) => {
    const baseMet =
      BASE_MET[exerciseRecord.category]?.[exerciseRecord.difficulty] ?? 4.0;

    // RPE modifier: RPE 10 = +20%, RPE 7 = ±0%, RPE 5 = −6.6%
    const rpeMod = actualRpeAvg
      ? 1 + (actualRpeAvg - 7) * 0.033
      : 1.0;

    const met = baseMet * rpeMod;

    sets.forEach((set) => {
      const activeTimeSec = set.actualReps * AVG_REP_DURATION_SEC;

      // Active time burns at full MET; rest burns at basal (~1.2 MET)
      const activeCalories = met * userWeightKg * (activeTimeSec / 3600);
      const restCalories   = 1.2 * userWeightKg * (set.restTakenSec / 3600);

      totalCalories += activeCalories + restCalories;
    });
  });

  return Math.round(totalCalories);
}
```

### Pre-Workout Estimation (Routine Builder)

Uses `targetReps`, `sets`, and `restTimeSec` from the routine definition with the same formula but no RPE modifier (RPE is unknown pre-workout).

### Phase-Aware Calorie Breakdown

Calories are summed independently across the three phases and reported separately in the post-workout summary. Stretch exercises use their own MET category (`stretching`, MET ≈ 2.5) regardless of `difficulty`. Warm-up exercises use the base MET of their category at ×0.6 intensity (warm-up loads are sub-maximal by definition).

```typescript
const PHASE_MET_MODIFIER: Record<SessionPhase, number> = {
  warmUp:  0.6,   // sub-maximal effort
  workout: 1.0,   // full effort
  stretch: 1.0,   // already low MET in BASE_MET table
};
```

### Custom Exercise MET Handling

Custom exercises created by the user do not have a known `category`/`difficulty` from the seeded database. The app resolves their MET as follows:

| Condition | MET Used |
|---|---|
| `phaseHint === 'stretch'` | `2.5` (stretching baseline) |
| `phaseHint === 'warmUp'` | `3.5 × 0.6 = 2.1` (beginner strength × warm-up modifier) |
| `phaseHint === 'workout'` and no category | `4.0` (conservative default) |
| User manually sets `category` + `difficulty` | Full MET table lookup |

---

## 4.2 Estimated vs. Actual Time Tracking

### Pre-Workout Estimation

The estimate now sums all three phases, applying a `holdSec` path for stretch items:

```typescript
// lib/calculations/time.ts
function estimatePhaseTime(
  items: RoutineExerciseConfig[]
): number {
  return items.reduce((total, ex) => {
    // Stretch items use holdSec instead of targetReps × rep duration
    const activePerSet = ex.holdSec
      ? ex.holdSec
      : (ex.targetReps ?? 0) * AVG_REP_DURATION_SEC;
    return total + ex.sets * (activePerSet + ex.restTimeSec);
  }, 0);
}

export function estimateRoutineTime(routine: Routine): {
  warmUpSec: number;
  workoutSec: number;
  stretchSec: number;
  totalSec: number;
} {
  const warmUpSec  = estimatePhaseTime(routine.warmUp);
  const workoutSec = estimatePhaseTime(routine.workout);
  const stretchSec = estimatePhaseTime(routine.stretch);

  // +10% overhead on workout phase only (warm-up and stretch transitions are short)
  const totalSec = warmUpSec + Math.round(workoutSec * 1.1) + stretchSec;

  // Add 20s transition buffer between phases
  return { warmUpSec, workoutSec, stretchSec, totalSec: totalSec + 40 };
}
```

### Post-Workout Delta

```typescript
export function getTimeDelta(
  estimatedSec: number,
  actualSec: number
): { deltaSeconds: number; label: string } {
  const delta = estimatedSec - actualSec;
  const absDelta = Math.abs(delta);
  const mins = Math.floor(absDelta / 60);
  const secs = absDelta % 60;

  const label =
    delta > 0
      ? `${mins}m ${secs}s faster than estimated`
      : delta < 0
      ? `${mins}m ${secs}s longer than estimated`
      : 'Right on schedule';

  return { deltaSeconds: delta, label };
}
```

Displayed in `PostWorkoutSummary` as motivating feedback.

---

## 4.3 Auto-Count Rep Logic

Auto-count is a **timed metronome**, not computer-vision — no camera access required. This respects user privacy and works in a pocket.

### State Machine

```
IDLE ──► COUNTDOWN (3s) ──► COUNTING ──► COMPLETE
                                │
                           (user taps stop early)
                                ▼
                            PARTIAL
```

### `useAutoCount` Hook

```typescript
// hooks/useAutoCount.ts
interface AutoCountState {
  phase: 'idle' | 'countdown' | 'counting' | 'complete';
  repCount: number;
  countdownValue: number; // 3, 2, 1
}

export function useAutoCount(targetReps: number, repDurationMs = 2000) {
  const [state, dispatch] = useReducer(autoCountReducer, {
    phase: 'idle',
    repCount: 0,
    countdownValue: 3,
  });

  // Countdown phase: tick from 3 → 0 → start counting
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    if (state.countdownValue === 0) {
      dispatch({ type: 'BEGIN_COUNTING' });
      return;
    }
    const t = setTimeout(() => dispatch({ type: 'TICK_COUNTDOWN' }), 1000);
    return () => clearTimeout(t);
  }, [state.phase, state.countdownValue]);

  // Counting phase: increment rep every repDurationMs
  useEffect(() => {
    if (state.phase !== 'counting') return;

    // Haptic on each rep
    navigator.vibrate?.(50);

    if (state.repCount >= targetReps) {
      dispatch({ type: 'COMPLETE' });
      navigator.vibrate?.([100, 50, 100]); // done signal
      return;
    }

    const t = setTimeout(() => dispatch({ type: 'INCREMENT_REP' }), repDurationMs);
    return () => clearTimeout(t);
  }, [state.phase, state.repCount, targetReps, repDurationMs]);

  return {
    state,
    start:    () => dispatch({ type: 'START' }),
    stopEarly:() => dispatch({ type: 'STOP_EARLY' }),
    reset:    () => dispatch({ type: 'RESET' }),
  };
}
```

### Rep Duration Configuration

| Mode | `repDurationMs` | Use Case |
|---|---|---|
| Explosive / speed | `1500ms` | Plyometrics, speed work |
| Standard | `2000ms` | Default strength reps |
| Controlled | `3000ms` | Standard tempo (1s up, 1s down + pause) |
| Slow / eccentric | `4000ms` | 4-second eccentric focus |

Rep duration is configurable per-routine from a slider in the routine builder and overridable per-set during execution.

---

## 4.4 Rest and Energy Meter

The Recovery/Energy Meter is a composite score (0–100) derived from four signals, each normalized and weighted.

### Signal Weights

| Signal | Weight | Source | Notes |
|---|---|---|---|
| Time since last workout | 30% | `workouts` DB | Optimal window: 24–72h |
| Rolling 7-day volume load | 25% | Last 7 sessions | `Σ(sets × reps × weight)` vs. personal baseline |
| Recent RPE history | 25% | Last 3 sessions | Low RPE = more energy available |
| Manual feel self-report | 20% | User input on app open | Slider 1–5, prompted once per day |

### Calculation

```typescript
// lib/calculations/energyMeter.ts
export function calculateEnergyScore(
  lastWorkoutHoursAgo: number,
  volumeLoadRatio: number,    // 1.0 = at personal baseline; >1 = overloaded
  avgRecentRpe: number,       // average of last 3 sessions
  manualFeelScore: number     // 1–5 user self-report
): number {
  // Time factor: peaks at 48h; degrades sharply below 24h or above 96h
  const timeFactor =
    lastWorkoutHoursAgo < 24
      ? lastWorkoutHoursAgo / 24
      : lastWorkoutHoursAgo < 72
      ? 1.0
      : Math.max(0, 1 - (lastWorkoutHoursAgo - 72) / 48);

  // Volume factor: 1.0 ratio = full score; 1.5 = half; ≥2.0 = 0
  const volumeFactor = Math.max(0, 1 - Math.max(0, volumeLoadRatio - 1));

  // RPE factor: RPE 5 = 1.0; RPE 8 = 0.4; RPE 10 = 0.0
  const rpeFactor = Math.max(0, 1 - (avgRecentRpe - 5) / 5);

  // Manual factor: 1 = 0.0; 3 = 0.5; 5 = 1.0
  const manualFactor = (manualFeelScore - 1) / 4;

  const score =
    timeFactor   * 0.30 +
    volumeFactor * 0.25 +
    rpeFactor    * 0.25 +
    manualFactor * 0.20;

  return Math.round(score * 100);
}
```

### Score Interpretation

> Colors aligned with §3.1 of the Design System (lime primary, iOS system semantic colors).

| Range | Color | Token | Label | Recommendation |
|---|---|---|---|---|
| 75–100 | `#C5F74F` | `--color-primary` | Ready to crush it | Full intensity session |
| 50–74 | `#64D2FF` | `--color-info` | Good to train | Normal session, monitor RPE |
| 25–49 | `#FF9F0A` | `--color-warning` | Take it easy today | Reduce load 20–30%, or active recovery |
| 0–24 | `#FF453A` | `--color-danger` | Rest day recommended | Mobility / stretching only |

### Volume Load Baseline Calculation

```typescript
// Calculated from the user's 30-day rolling average
export function calculateVolumeLoadRatio(
  last7DaysSessions: WorkoutSession[],
  rollingBaselineKg: number // avg weekly volume over last 30 days
): number {
  const weeklyVolume = last7DaysSessions.reduce((total, session) => {
    return total + session.exercises.reduce((exTotal, ex) => {
      return exTotal + ex.sets.reduce((setTotal, set) => {
        return setTotal + (set.actualReps * set.weightKg);
      }, 0);
    }, 0);
  }, 0);

  if (rollingBaselineKg === 0) return 1.0; // no baseline yet
  return weeklyVolume / rollingBaselineKg;
}
```

---

## 4.5 Gamification & XP System

### Session XP Calculation

```typescript
// lib/calculations/xp.ts
export function calculateSessionXP(
  session: WorkoutSummary,
  prsAchieved: PersonalRecord[]
): number {
  let xp = 0;

  xp += session.totalCalories * 0.5;                // Base: 0.5 XP per calorie
  xp += session.exerciseCount * 10;                 // Exercise variety bonus
  xp += (session.completionRate ?? 1) * 50;         // Up to 50 XP for full completion
  xp += prsAchieved.length * 100;                   // 100 XP per personal record
  if (session.totalTimeSec >= 2700) xp += 50;       // Bonus for 45+ min session
  if (session.streakDay > 1) xp += session.streakDay * 5; // Streak multiplier

  return Math.round(xp);
}
```

### Level Thresholds

```typescript
export const LEVEL_THRESHOLDS = [
  0, 100, 250, 450, 700, 1000, 1400, 1850, 2350, 2900,  // Levels 1-10
  3500, 4200, 5000, 5900, 6900, 8000, 9200, 10500, 12000, 13700, // 11-20
  // ... continues with increasing increments
];

export function getLevel(totalXp: number): number {
  return LEVEL_THRESHOLDS.findLastIndex((threshold) => totalXp >= threshold) + 1;
}
```

---

## 4.6 Personal Record (PR) Detection

A PR is detected when a set exceeds the historical maximum for a given exercise on any of three metrics:

| PR Type | Calculation | Example |
|---|---|---|
| **Max Weight** | Heaviest single rep at any rep count | 120kg single |
| **Max Volume** | Highest `weight × reps` in a single set | 100kg × 10 = 1000kg |
| **Max Reps** | Most reps at any given weight | 15 reps @ bodyweight |

```typescript
// lib/calculations/prs.ts
export function detectPRs(
  completedSets: { exerciseId: string; weightKg: number; actualReps: number }[],
  existingPRs: Record<string, PersonalRecord>
): PersonalRecord[] {
  const newPRs: PersonalRecord[] = [];

  completedSets.forEach(({ exerciseId, weightKg, actualReps }) => {
    const existing = existingPRs[exerciseId];
    const volume = weightKg * actualReps;

    if (!existing || weightKg > existing.maxWeightKg) {
      newPRs.push({ exerciseId, type: 'weight', value: weightKg });
    }
    if (!existing || volume > existing.maxVolume) {
      newPRs.push({ exerciseId, type: 'volume', value: volume });
    }
  });

  return newPRs;
}
```
