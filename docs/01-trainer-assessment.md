# Task 1 — The Personal Trainer's Assessment

> *Hat on. Clipboard out.*

The proposed feature set is solid, but the five additions below will move this from "a good tracker" to a genuine coach in your pocket.

---

## Addition 1 — Movement Pattern Fatigue Warnings (Safety Layer)

The current design tracks reps and sets but has no awareness of *accumulated load on a movement pattern*. A user hitting heavy squats Monday, leg press Tuesday, and lunges Wednesday is obliterating their quads with zero warning.

The app already has `target` and `secondaryMuscles` on every exercise. This data should be cross-referenced against the last 48–72 hours of logged workouts to surface a pre-workout warning:

> *"Your quads have accumulated high volume in the last 48h. Consider reducing load or substituting."*

This is the single highest-value safety feature a PT provides.

---

## Addition 2 — Rate of Perceived Exertion (RPE) & Adaptive Set Scaling

After each set, prompt the user for an RPE score (1–10, simplified to emoji scale for speed).

| Trigger | App Suggestion |
|---|---|
| Average RPE > 9 for 2 consecutive sessions | Suggest reducing load by 5–10% |
| Average RPE ≤ 6 consistently | Suggest a progression (more weight or reps) |

> **Key principle:** The app always *suggests*, never auto-applies. The user stays in control.

This mirrors the **autoregulation** methodology used by elite strength coaches and makes the app feel intelligent, not just a logger.

---

## Addition 3 — Structured Progressive Overload Templates

Routine creation currently lets users set static sets/reps/weight. Add optional **progression schemes** per exercise:

| Scheme | Description |
|---|---|
| **Linear** | Add X kg/lbs every N sessions |
| **Undulating** | Vary intensity by day — Heavy / Moderate / Light rotation |
| **Double Progression** | Increase reps to a ceiling, then add weight and reset reps |

The app should display the *target for today's session* based on logged history — telling the user what to do *today*, not just recording what they did.

---

## Addition 4 — Warm-Up Set Generator

Before every working set involving significant load (`equipment` ≠ `body weight`), automatically generate a warm-up protocol prepended to the session:

| Step | Load | Reps |
|---|---|---|
| Warm-up 1 | 40% of working weight | 8 |
| Warm-up 2 | 60% | 5 |
| Warm-up 3 | 80% | 3 |
| Warm-up 4 | 90% | 1 |

Users skip warm-ups; injuries follow. This feature enforces best practice invisibly and can be toggled off by experienced users.

---

## Addition 5 — Deload & Recovery Week Scheduler

Track rolling 3–4 week training blocks and automatically suggest a *deload week* (reduce volume/intensity by ~40–50%) at the appropriate interval.

- Surface this as a **progress phase**, not a rest penalty
- Back the suggestion with data from the Recovery Meter (fatigue score, recent RPE, volume load)
- Show a projected trajectory: *"3 weeks of accumulation → 1 deload week → new strength baseline"*

Many recreational lifters plateau or get injured because they never deload. This feature closes the loop on long-term periodization.

---

## Summary Table

| # | Feature | Primary Benefit | Complexity |
|---|---|---|---|
| 1 | Fatigue Warnings | Injury prevention | Medium |
| 2 | RPE + Adaptive Scaling | Intelligent load management | Medium |
| 3 | Progressive Overload Templates | Long-term progression | High |
| 4 | Warm-Up Generator | Injury prevention, best practice | Low |
| 5 | Deload Scheduler | Periodization, plateau prevention | Medium |
