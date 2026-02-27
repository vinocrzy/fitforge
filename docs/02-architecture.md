# Task 2 — Architecture Document

---

## 2.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser / PWA)                  │
│                                                             │
│  ┌──────────────┐   ┌──────────────┐   ┌────────────────┐  │
│  │  Next.js App │   │   Zustand    │   │  React Query   │  │
│  │  (App Router)│◄──│  (UI State)  │   │ (Async/Cache)  │  │
│  └──────┬───────┘   └──────────────┘   └───────┬────────┘  │
│         │                                       │           │
│  ┌──────▼───────────────────────────────────────▼────────┐  │
│  │                  PouchDB (IndexedDB)                  │  │
│  │         Local-First Persistent Data Store             │  │
│  └──────────────────────────┬────────────────────────────┘  │
│                             │ (Service Worker intercepts)   │
└─────────────────────────────┼───────────────────────────────┘
                              │ sync (when online)
                    ┌─────────▼──────────┐
                    │   CouchDB / IBM    │
                    │   Cloudant (future)│
                    └────────────────────┘
```

---

## 2.2 Local-First Data Flow

All reads and writes go to **PouchDB** first. The UI never waits for a network call. CouchDB sync is a background side-effect.

```
User Action
    │
    ▼
Zustand Action Creator
    │
    ▼
PouchDB Write (IndexedDB)  ──► UI updates optimistically
    │
    ▼ (background, if online)
CouchDB Replication (continuous bi-directional)
    │
    ▼
Conflict Resolution Handler
    (last-write-wins on workout logs; manual merge on routines)
```

---

## 2.3 PouchDB Database Design

Three logical databases, each as a separate PouchDB instance (enables per-database replication granularity):

| Database | Purpose | Replicates to CouchDB? |
|---|---|---|
| `fitforge_exercises` | Seeded from local JSON, read-only | No (static) |
| `fitforge_custom_exercises` | User-created exercises (warm-up / workout / stretch) | Yes |
| `fitforge_routines` | User-created routines | Yes |
| `fitforge_workouts` | Completed session logs | Yes |
| `fitforge_profile` | User profile, settings, PRs, XP | Yes |

### Document ID Strategy

Use composite, human-readable IDs that sort chronologically and enable efficient `allDocs` range queries without secondary indexes:

```
workout_2026-02-26T14:30:00_abc123
routine_upper_push_xyz789
custom_exercise_user_abc123
profile_user_001
```

---

### Routine Structure — Three-Phase Model

Every routine is divided into three ordered phases. All three phases are always present (they may be empty arrays if the user skips a section).

```
Routine
├── warmUp[]    — mobility, activation, light cardio before the main session
├── workout[]   — the primary working exercises
└── stretch[]   — cool-down static or dynamic stretches
```

During execution the app moves through phases sequentially:

```
[WARM-UP PHASE] → phase transition banner → [WORKOUT PHASE] → phase transition banner → [STRETCH PHASE] → session complete
```

### Example Routine Document

```json
{
  "_id": "routine_upper_push_xyz789",
  "_rev": "2-def...",
  "type": "routine",
  "name": "Upper Push Day",
  "createdAt": "2026-02-20T10:00:00Z",
  "unitPreference": "kg",
  "warmUp": [
    {
      "exerciseId": "0001",
      "isCustom": false,
      "sets": 2,
      "targetReps": 15,
      "restTimeSec": 30,
      "weightKg": null
    },
    {
      "exerciseId": "custom_exercise_user_abc123",
      "isCustom": true,
      "sets": 1,
      "targetReps": 10,
      "restTimeSec": 20,
      "weightKg": null
    }
  ],
  "workout": [
    {
      "exerciseId": "0050",
      "isCustom": false,
      "sets": 4,
      "targetReps": 10,
      "restTimeSec": 90,
      "weightKg": 60,
      "progressionScheme": "linear",
      "progressionStepKg": 2.5
    }
  ],
  "stretch": [
    {
      "exerciseId": "custom_exercise_user_def456",
      "isCustom": true,
      "sets": 1,
      "holdSec": 30,
      "restTimeSec": 10,
      "weightKg": null
    }
  ]
}
```

---

### Custom Exercise Document

Users can create their own exercises and assign them to any phase (warm-up, workout, or stretch). Custom exercises are stored in `fitforge_custom_exercises` and are treated identically to seeded library exercises at runtime.

```json
{
  "_id": "custom_exercise_user_abc123",
  "_rev": "1-ghi...",
  "type": "custom_exercise",
  "name": "Band Pull-Apart",
  "bodyPart": "shoulders",
  "equipment": "resistance band",
  "target": "rear deltoids",
  "secondaryMuscles": ["trapezius", "rhomboids"],
  "instructions": ["Hold a resistance band at shoulder width.", "Pull the band apart until arms are fully extended.", "Slowly return to start."],
  "description": "A custom warm-up exercise for shoulder health.",
  "difficulty": "beginner",
  "category": "strength",
  "phaseHint": "warmUp",
  "isCustom": true,
  "createdAt": "2026-02-22T08:00:00Z"
}
```

**`phaseHint`** is a non-binding default suggestion for which phase this exercise belongs to. The user can still add it to any phase when building a routine.

---

### Example Workout Log Document

The log mirrors the three-phase routine structure so each phase's stats can be reported independently in the post-workout summary.

```json
{
  "_id": "workout_2026-02-26T07:00:00_u001",
  "_rev": "1-abc...",
  "type": "workout_session",
  "routineId": "routine_xyz789",
  "startedAt": "2026-02-26T07:00:00Z",
  "completedAt": "2026-02-26T07:48:22Z",
  "mode": "structured",
  "unitPreference": "kg",
  "warmUp": [
    {
      "exerciseId": "0001",
      "isCustom": false,
      "sets": [
        { "setNumber": 1, "actualReps": 15, "weightKg": null, "completedAt": "2026-02-26T07:03:00Z" }
      ]
    }
  ],
  "workout": [
    {
      "exerciseId": "0050",
      "isCustom": false,
      "sets": [
        {
          "setNumber": 1,
          "targetReps": 10,
          "actualReps": 10,
          "weightKg": 60,
          "rpe": 7,
          "completedAt": "2026-02-26T07:15:30Z",
          "restTakenSec": 90
        }
      ]
    }
  ],
  "stretch": [
    {
      "exerciseId": "custom_exercise_user_def456",
      "isCustom": true,
      "sets": [
        { "setNumber": 1, "holdSec": 30, "completedAt": "2026-02-26T07:46:00Z" }
      ]
    }
  ],
  "summary": {
    "totalCalories": 312,
    "warmUpCalories": 28,
    "workoutCalories": 268,
    "stretchCalories": 16,
    "totalTimeSec": 2902,
    "intensityScore": 74,
    "xpEarned": 180
  }
}
```

---

## 2.4 Exercise Library — Versioned Sync Strategy

### The Problem with a Simple Seed

The original `seedExercisesIfEmpty()` pattern only runs when the database is **empty**. This means:

| Scenario | Simple seed result |
|---|---|
| First install (empty DB) | ✅ Works |
| App update adds 20 new exercises | ❌ Skipped — DB is not empty |
| App update fixes an exercise description | ❌ Skipped — existing doc is not touched |
| Exercise removed from library | ❌ Stale doc stays in PouchDB forever |

The library currently has **207 exercises** and will grow. A versioned sync strategy ensures every device stays in sync with the bundled source of truth after every app update.

---

### Step 1 — Build-Time: Generate the Exercise Manifest

A pre-build script (`scripts/generate-exercise-manifest.ts`) runs as part of `next build` and writes `public/data/exercise-manifest.json`. This file is a lightweight registry of every exercise in the bundle — it is **tiny** (~15KB) and is part of the SW precache, so it is always available offline.

```typescript
// scripts/generate-exercise-manifest.ts
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const exercisesDir = path.join(process.cwd(), 'data', 'exercises');
const outputPath   = path.join(process.cwd(), 'public', 'data', 'exercise-manifest.json');

const files = fs.readdirSync(exercisesDir).filter(f => f.endsWith('.json'));

const entries = files.map(file => {
  const raw  = fs.readFileSync(path.join(exercisesDir, file), 'utf-8');
  const data = JSON.parse(raw);
  // Per-exercise content hash — changes only when the file content changes
  const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
  return { id: data.id, hash };
});

// Library-level version — changes whenever any exercise is added, removed, or edited
const libraryHash = crypto
  .createHash('sha1')
  .update(JSON.stringify(entries))
  .digest('hex')
  .slice(0, 12);

const manifest = {
  version: libraryHash,   // e.g. "a3f9c1d72e04"
  count: entries.length,  // e.g. 207
  exercises: entries,     // [{ id: "0001", hash: "a1b2c3d4" }, ...]
};

fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
console.log(`Exercise manifest generated: ${entries.length} exercises, version ${libraryHash}`);
```

Add to `package.json`:
```json
"scripts": {
  "prebuild": "ts-node scripts/generate-exercise-manifest.ts",
  "build": "next build"
}
```

**Example `public/data/exercise-manifest.json`:**
```json
{
  "version": "a3f9c1d72e04",
  "count": 207,
  "exercises": [
    { "id": "0001", "hash": "a1b2c3d4" },
    { "id": "0002", "hash": "ff3a9901" },
    ...
  ]
}
```

---

### Step 2 — Runtime: Version Check on App Start

On every app startup, `syncExerciseLibrary()` is called (replaces `seedExercisesIfEmpty()`). It:
1. Fetches `/data/exercise-manifest.json` (always served from SW cache — no network needed)
2. Reads the stored `libraryVersion` from PouchDB metadata
3. If versions match → **done in <5ms**, nothing to do
4. If versions differ → runs a **delta sync** to apply only what changed

```typescript
// lib/db/syncExerciseLibrary.ts
import { exerciseDb } from './pouchdb';

const META_DOC_ID = '_local/exercise_library_meta';

interface LibraryMeta {
  _id: typeof META_DOC_ID;
  _rev?: string;
  version: string;
  count: number;
  syncedAt: string;
}

export async function syncExerciseLibrary(): Promise<void> {
  // 1. Fetch manifest (served from SW cache — works offline)
  const res = await fetch('/data/exercise-manifest.json');
  const manifest: {
    version: string;
    count: number;
    exercises: { id: string; hash: string }[];
  } = await res.json();

  // 2. Read stored version
  let meta: LibraryMeta | null = null;
  try {
    meta = await exerciseDb.get<LibraryMeta>(META_DOC_ID);
  } catch {
    // _local doc doesn't exist yet — first install
  }

  // 3. Version match → nothing to do
  if (meta?.version === manifest.version) {
    console.debug(`[ExerciseLib] Up to date (v${manifest.version}, ${manifest.count} exercises)`);
    return;
  }

  console.info(`[ExerciseLib] Update detected: ${
    meta?.version ?? 'none'
  } → ${manifest.version}. Running delta sync…`);

  // 4. Delta sync
  await deltaSync(manifest);

  // 5. Persist new version
  const updatedMeta: LibraryMeta = {
    _id: META_DOC_ID,
    ...(meta?._rev ? { _rev: meta._rev } : {}),
    version: manifest.version,
    count: manifest.count,
    syncedAt: new Date().toISOString(),
  };
  await exerciseDb.put(updatedMeta);

  console.info(`[ExerciseLib] Sync complete. Library now at v${manifest.version}.`);
}
```

---

### Step 3 — Delta Sync: Only Touch What Changed

The delta sync never wipes and re-seeds the entire database. It computes a precise diff between the manifest and what is currently in PouchDB, then applies only the minimum set of writes:

```typescript
// lib/db/syncExerciseLibrary.ts (continued)
async function deltaSync(
  manifest: { exercises: { id: string; hash: string }[] }
): Promise<void> {
  const modules = import.meta.glob('../../../data/exercises/*.json');

  // 1. Fetch all existing exercise docs from PouchDB (id + rev + stored hash)
  const allRows = await exerciseDb.allDocs({ include_docs: false });
  const existingMap = new Map(
    allRows.rows.map(r => [r.id, r.value.rev])   // id → _rev
  );

  // 2. Also fetch stored per-exercise hashes from meta (stored as _local/hashes)
  let storedHashes: Record<string, string> = {};
  try {
    const hashDoc = await exerciseDb.get<{ hashes: Record<string, string> }>('_local/exercise_hashes');
    storedHashes = hashDoc.hashes;
  } catch { /* first run */ }

  const manifestIds = new Set(manifest.exercises.map(e => e.id));

  // 3. Classify each manifest entry
  const toUpsert: { id: string }[] = [];
  const toDelete: { _id: string; _rev: string; _deleted: true }[] = [];

  for (const { id, hash } of manifest.exercises) {
    const docId = `exercise_${id}`;
    const existingRev = existingMap.get(docId);

    if (!existingRev) {
      // NEW exercise — not in PouchDB at all
      toUpsert.push({ id });
    } else if (storedHashes[id] !== hash) {
      // MODIFIED exercise — content hash changed
      toUpsert.push({ id });
    }
    // else: UNCHANGED — skip entirely
  }

  // 4. Find exercises removed from the library
  for (const [docId, rev] of existingMap) {
    const id = docId.replace('exercise_', '');
    if (!manifestIds.has(id) && !docId.startsWith('_')) {
      // REMOVED from library — soft-delete the PouchDB doc
      toDelete.push({ _id: docId, _rev: rev, _deleted: true });
    }
  }

  console.info(`[ExerciseLib] Delta: +${toUpsert.length} upsert, -${toDelete.length} delete`);

  // 5. Load and upsert changed/new exercise JSON files
  if (toUpsert.length > 0) {
    const newDocs = await Promise.all(
      toUpsert.map(async ({ id }) => {
        // Pad id to 4 digits to match filename e.g. 0001
        const paddedId = id.padStart(4, '0');
        const load = modules[`../../../data/exercises/${paddedId}.json`];
        const ex = (await load()) as ExerciseRecord;
        const docId = `exercise_${id}`;
        const existingRev = existingMap.get(docId);
        return {
          ...ex,
          _id: docId,
          ...(existingRev ? { _rev: existingRev } : {}),  // include _rev for updates
          type: 'exercise' as const,
        };
      })
    );
    await exerciseDb.bulkDocs(newDocs);
  }

  // 6. Apply deletes
  if (toDelete.length > 0) {
    await exerciseDb.bulkDocs(toDelete);
  }

  // 7. Persist updated hash index
  let hashDocRev: string | undefined;
  try {
    const existing = await exerciseDb.get('_local/exercise_hashes');
    hashDocRev = existing._rev;
  } catch { /* ok */ }

  const newHashes = Object.fromEntries(
    manifest.exercises.map(({ id, hash }) => [id, hash])
  );
  await exerciseDb.put({
    _id: '_local/exercise_hashes',
    ...(hashDocRev ? { _rev: hashDocRev } : {}),
    hashes: newHashes,
  });
}
```

---

### Sync Decision Flow

```
App starts
    │
    ▼
Fetch /data/exercise-manifest.json  (from SW cache — offline safe)
    │
    ▼
Read _local/exercise_library_meta from PouchDB
    │
    ├── version matches ──────────────────────────────► Done (0 writes, <5ms)
    │
    └── version differs
            │
            ▼
        For each exercise in manifest:
            │
            ├── not in PouchDB ──────────────────────► INSERT (new exercise)
            ├── hash changed ────────────────────────► UPSERT (edited exercise)
            └── hash unchanged ────────────────────► SKIP
            │
        For each doc in PouchDB not in manifest:
            └── ──────────────────────────────────── ► SOFT-DELETE (removed exercise)
            │
            ▼
        bulkDocs() — single batch write
            │
            ▼
        Update _local/exercise_library_meta (new version)
        Update _local/exercise_hashes (updated hash index)
            │
            ▼
        Done
```

---

### Key Properties of This Approach

| Property | Detail |
|---|---|
| **First install** | All 207 exercises inserted via `bulkDocs` in one batch |
| **New exercises added** | Only new IDs are inserted; existing docs untouched |
| **Exercise content edited** | Only docs with changed hash are upserted with current `_rev` |
| **Exercise removed from library** | Soft-deleted in PouchDB; any routine referencing it shows a "no longer available" fallback |
| **No update needed** | Version check exits in <5ms with zero PouchDB writes |
| **Fully offline** | Manifest is in SW precache; sync runs entirely against local IndexedDB |
| **No data loss** | User-created custom exercises live in `fitforge_custom_exercises` — a completely separate PouchDB instance never touched by this sync |
| **`_local/` docs** | PouchDB `_local` docs are never replicated to CouchDB — meta and hash index stay client-only |

### When Is `syncExerciseLibrary()` Called?

```typescript
// app/layout.tsx (root layout — runs once per app session)
import { syncExerciseLibrary } from '@/lib/db/syncExerciseLibrary';

useEffect(() => {
  // Non-blocking: runs in the background after first render
  // Does nothing if library is already up to date
  syncExerciseLibrary().catch(console.error);
}, []); // empty deps = once per mount (once per session)
```

Because the version check is near-instant when nothing has changed, calling this on every app open has negligible cost.
```

---

## 2.5 CouchDB Sync Strategy (Future Phase)

```typescript
// lib/db/sync.ts
export function startSync(remoteUrl: string, token: string) {
  const syncHandlers: PouchDB.Replication.Sync<{}>[] = [];

  [routinesDb, workoutsDb, profileDb].forEach((db, i) => {
    const remote = new PouchDB(`${remoteUrl}/${DB_NAMES[i]}`, {
      fetch: (url, opts) => {
        (opts!.headers as Headers).set('Authorization', `Bearer ${token}`);
        return PouchDB.fetch(url, opts);
      }
    });

    const handler = db.sync(remote, {
      live: true,
      retry: true,
      // Exponential backoff: double the delay each retry, cap at 30s
      back_off_function: (delay) => Math.min(delay * 1.5, 30000)
    })
    .on('change', handleSyncChange)
    .on('error', handleSyncError);

    syncHandlers.push(handler);
  });

  // Return a cleanup function
  return () => syncHandlers.forEach(h => h.cancel());
}
```

### Conflict Resolution Policy

| Document Type | Policy |
|---|---|
| `workout_session` | Last-write-wins (old session logs are rarely re-edited) |
| `routine` | Surface conflict to user with a diff-style merge UI |
| `profile` | Merge additive fields (XP, PRs); last-write-wins on preferences |

---

## 2.6 Next.js PWA Implementation

### `next.config.ts`

Use `@ducanh2912/next-pwa` (the actively maintained fork):

```typescript
import withPWA from '@ducanh2912/next-pwa';

export default withPWA({
  dest: 'public',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: false, // local-first: no forced reload when coming back online
  workboxOptions: {
    // ─── IMPORTANT: exclude GIFs from the SW precache manifest entirely ───
    // 200MB+ cannot be precached at install time; GIFs use a separate
    // on-demand runtime cache defined below in runtimeCaching.
    exclude: [/\/data\/gifs\//],

    runtimeCaching: [
      // ── 1. Exercise GIFs — on-demand, cache-first, quota-managed ──────────
      {
        urlPattern: /\/data\/gifs\/\d+\.gif$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'exercise-gifs',
          rangeRequests: true, // required: browsers make Range requests for media
          expiration: {
            maxEntries: 150,      // keep the 150 most-recently viewed GIFs
            maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
            purgeOnQuotaError: true, // auto-evict if storage quota is exceeded
          },
          cacheableResponse: {
            statuses: [0, 200, 206], // 206 = partial content (range request)
          },
        },
      },

      // ── 2. Exercise WebP previews (if conversion pipeline runs) ──────────
      {
        urlPattern: /\/data\/gifs\/\d+\.webp$/,
        handler: 'CacheFirst',
        options: {
          cacheName: 'exercise-previews',
          expiration: {
            maxEntries: 250,
            maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
            purgeOnQuotaError: true,
          },
          cacheableResponse: { statuses: [0, 200] },
        },
      },

      // ── 3. All other network requests ────────────────────────────────────
      {
        urlPattern: /^https?.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          networkTimeoutSeconds: 3,
        },
      },
    ],
  },
})({
  // Next.js config goes here
});
```

### App Router Folder Structure

```
app/
├── (auth)/
│   └── onboarding/
├── (app)/
│   ├── layout.tsx              ← bottom nav shell, PWA viewport meta
│   ├── dashboard/
│   │   └── page.tsx
│   ├── routines/
│   │   ├── page.tsx            ← routine list
│   │   └── [id]/
│   │       ├── page.tsx        ← routine detail / edit
│   │       └── start/
│   │           └── page.tsx    ← workout execution
│   ├── history/
│   │   └── page.tsx
│   ├── analytics/
│   │   └── page.tsx
│   └── profile/
│       └── page.tsx
├── manifest.ts                 ← generates /manifest.webmanifest
└── sw.ts                       ← service worker entry point
```

---

## 2.7 GIF Asset Caching Strategy

### The Problem

The `data/gifs/` folder contains **233+ animated GIFs** totalling **200MB+**. This creates three hard constraints:

| Constraint | Detail |
|---|---|
| Cannot precache at install | SW install precaching 200MB would fail on most devices and blow through storage quota immediately |
| Browser Cache API quota | Browsers typically allow 20–50% of available device storage; 200MB is a significant slice |
| Mobile data cost | Downloading all GIFs upfront on cellular is unacceptable; must be strictly on-demand |
| `RangeRequests` required | Browsers issue `Range:` HTTP requests for media; the cache handler must support `206 Partial Content` |

### Strategy: Lazy On-Demand Cache-First with LRU Eviction

GIFs are **never fetched eagerly**. They are fetched and cached the first time they are rendered (when the user view an `ExerciseCard`, opens `ExerciseDetail`, or begins executing a set). Subsequent views are served entirely from the `exercise-gifs` Cache Storage entry — **no network request, fully offline**.

```
User views exercise GIF
        │
        ▼
Service Worker intercepts /data/gifs/0050.gif
        │
        ├─ HIT in 'exercise-gifs' cache? ──► serve from cache (offline ✓)
        │
        └─ MISS
                │
                ▼
            Fetch from network
                │
                ▼
            Store in 'exercise-gifs' cache
                │
                ▼
            Serve response
                │
                ▼
            ExpirationPlugin checks:
              - entry count > 150? evict oldest (LRU)
              - quota exceeded?    purge oldest entries
```

### Cache Budget

| Cache Name | Handler | Max Entries | Approx Max Size | TTL |
|---|---|---|---|---|
| `exercise-gifs` | `CacheFirst` | 150 GIFs | ~130MB | 30 days |
| `exercise-previews` | `CacheFirst` | 250 WebP | ~25MB (if converted) | 60 days |
| `api-cache` | `NetworkFirst` | — | ~5MB | 3s timeout |
| SW precache manifest | `StaleWhileRevalidate` | app shell only | ~2MB | version bump |

> **Net result:** the cache stays well within a ~160MB budget. LRU ensures the 150 most recently used GIFs are always available offline; older ones are re-fetched on next access.

### GIF Format Optimization (Recommended — Phase 1)

Before deploying, run a one-time build-time conversion pipeline to reduce the 200MB+ to a manageable size:

| Format | Tool | Expected Size Reduction | Notes |
|---|---|---|---|
| `.webp` (animated) | `ffmpeg` or `sharp` | **~60–70% smaller** | Supported on all modern iOS/Android browsers |
| `.mp4` (H.264, loop) | `ffmpeg` | **~80–90% smaller** | Best size, but requires `<video>` tag instead of `<img>` |

**Recommended approach — animated WebP:**
```bash
# scripts/convert-gifs.sh
# Run once at build time; output to public/data/previews/
mkdir -p public/data/previews
for f in data/gifs/*.gif; do
  id=$(basename "$f" .gif)
  ffmpeg -i "$f" -vf "fps=15,scale=320:-1:flags=lanczos" \
    -loop 0 "public/data/previews/${id}.webp" -y
done
```

With `fps=15` and `scale=320px` width, each WebP preview stays under **300–600KB** vs the original GIF's ~1MB average. Total library drops from ~200MB to **~40–70MB**.

### `<ExerciseGif />` Component — Progressive Loading

The component uses a `blur placeholder → GIF/WebP` progressive pattern so the UI never shows a broken image:

```tsx
// components/ExerciseGif.tsx
'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ExerciseGifProps {
  exerciseId: string;  // e.g. "0050"
  alt: string;
  /** true = full animated GIF; false = static WebP thumbnail */
  animated?: boolean;
}

export function ExerciseGif({ exerciseId, alt, animated = false }: ExerciseGifProps) {
  const [loaded, setLoaded] = useState(false);

  // Serve WebP previews by default; fall back to original GIF only
  // when user explicitly requests animation (e.g. during active set)
  const src = animated
    ? `/data/gifs/${exerciseId}.gif`
    : `/data/previews/${exerciseId}.webp`;

  return (
    <div className="relative w-full aspect-square overflow-hidden rounded-xl bg-surface-2">
      {/* Skeleton shimmer shown until image loads */}
      <AnimatePresence>
        {!loaded && (
          <motion.div
            key="skeleton"
            className="absolute inset-0 bg-surface-3 animate-pulse"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>

      <motion.img
        key={src}
        src={src}
        alt={alt}
        loading="lazy"          // native lazy load — browser only fetches when in viewport
        decoding="async"
        onLoad={() => setLoaded(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
```

**Key decisions:**
- `loading="lazy"` ensures GIFs are not fetched until they scroll into view — critical during exercise list browsing
- `animated={false}` (WebP thumbnail) used everywhere except the **active set card during workout execution**, where the full GIF plays
- The Service Worker intercepts both `/data/gifs/*` and `/data/previews/*` URL patterns independently with separate cache budgets

### Prefetching GIFs for an Active Routine

When a user taps "Start" on a routine, prefetch only the GIFs for exercises in that specific routine into the cache before execution begins. This ensures offline playback during the workout without fetching the entire library:

```typescript
// lib/cache/prefetchRoutineGifs.ts
export async function prefetchRoutineGifs(routine: Routine): Promise<void> {
  if (!('caches' in window)) return;

  const cache = await caches.open('exercise-gifs');
  const exerciseIds = [
    ...routine.warmUp,
    ...routine.workout,
    ...routine.stretch,
  ].map((ex) => ex.exerciseId);

  const uniqueIds = [...new Set(exerciseIds)];

  // Fetch in parallel, skip IDs already cached
  await Promise.allSettled(
    uniqueIds.map(async (id) => {
      const url = `/data/gifs/${id}.gif`;
      const cached = await cache.match(url);
      if (!cached) {
        // fire-and-forget: populate the SW cache so it's ready during execution
        await fetch(url);
      }
    })
  );
}
```

Call `prefetchRoutineGifs(routine)` on the routine detail page when the user lands on it (not on "Start" tap, to give time to download on Wi-Fi).


---

## 2.8 Static Media & Placeholder Image Strategy

### Public Folder Layout

Next.js only serves files under `public/`. The `data/gifs/` folder must be copied there. Expected structure after setup:

```
public/
├── data/
│   ├── exercise-manifest.json    ← generated by prebuild script
│   ├── gifs/                     ← original GIFs (copied from data/gifs/)
│   └── previews/                 ← converted WebP thumbnails (scripts/convert-gifs.sh)
├── images/
│   └── athletes/
│       ├── strength.jpg          ← hero photos, one per workout category
│       ├── cardio.jpg
│       ├── stretch.jpg
│       ├── warmup.jpg
│       ├── upper.jpg
│       ├── lower.jpg
│       ├── core.jpg
│       └── fullbody.jpg
└── icons/                        ← SF Symbol SVG exports (see §2.9)
```

### Step 1 — Copy GIFs to `public/`

Run once on initial dev setup:

```powershell
# Windows
xcopy data\gifs public\data\gifs /E /I /Y
```

```bash
# macOS / Linux
cp -r data/gifs public/data/gifs
```

GIFs stay in `data/gifs/` as source-of-truth (committed). The `public/` copies are **not** committed:

```gitignore
# .gitignore additions
public/data/gifs/
public/data/previews/
```

### Step 2 — Convert to WebP Previews

```bash
# scripts/convert-gifs.sh  (requires ffmpeg: winget install ffmpeg)
mkdir -p public/data/previews
for f in public/data/gifs/*.gif; do
  id=$(basename "$f" .gif)
  ffmpeg -i "$f" -vf "fps=15,scale=320:-1:flags=lanczos" \
    -loop 0 -q:v 75 "public/data/previews/${id}.webp" -y
done
```

Add npm scripts:

```json
"scripts": {
  "setup:gifs":     "xcopy data\\gifs public\\data\\gifs /E /I /Y",
  "setup:previews": "bash scripts/convert-gifs.sh",
  "prebuild":       "ts-node scripts/generate-exercise-manifest.ts",
  "build":          "next build"
}
```

---

### Athlete Hero Photos — Category Mapping

Hero cards (S-01 Splash, S-02 Onboarding, S-05 Dashboard, S-09 Routine Detail) use full-bleed athlete photography — a separate set of 8 curated photos, one per workout category, **not** the exercise GIFs.

#### Development: `picsum.photos` Seeded Placeholders

`picsum.photos` with fixed seeds returns the same deterministic image per category — no API key, no large committed files:

```typescript
// lib/media/athletePhotos.ts
const isProd = process.env.NODE_ENV === 'production';

export const ATHLETE_PHOTO: Record<string, string> = {
  strength:   isProd ? '/images/athletes/strength.jpg'  : 'https://picsum.photos/seed/fitstrength/800/500',
  cardio:     isProd ? '/images/athletes/cardio.jpg'    : 'https://picsum.photos/seed/fitcardio/800/500',
  stretching: isProd ? '/images/athletes/stretch.jpg'   : 'https://picsum.photos/seed/fitstretch/800/500',
  warmup:     isProd ? '/images/athletes/warmup.jpg'    : 'https://picsum.photos/seed/fitwarmup/800/500',
  upper:      isProd ? '/images/athletes/upper.jpg'     : 'https://picsum.photos/seed/fitupper/800/500',
  lower:      isProd ? '/images/athletes/lower.jpg'     : 'https://picsum.photos/seed/fitlower/800/500',
  core:       isProd ? '/images/athletes/core.jpg'      : 'https://picsum.photos/seed/fitcore/800/500',
  fullbody:   isProd ? '/images/athletes/fullbody.jpg'  : 'https://picsum.photos/seed/fitfull/800/500',
};

export const ATHLETE_PHOTO_FALLBACK = isProd
  ? '/images/placeholder-athlete.jpg'
  : 'https://picsum.photos/seed/fitdefault/800/500';
```

#### Production: Committed Static Assets

Commit 8 royalty-free athlete photos to `public/images/athletes/`. Free CC0 sources (no attribution required):

- **Pexels** — pexels.com/search/gym
- **StockSnap.io** — stocksnap.io

Target spec: `800×500px` min, dark scene, athlete mid-motion, progressive JPEG ~80% quality (~80–150KB each). Total ≈ 1MB for all 8.

---

### Exercise GIF Usage by Screen

| Screen | Image source | `animated` | Notes |
|--------|-------------|------------|-------|
| Exercise list — S-06 | `/data/previews/{id}.webp` | `false` | Thumbnail, lazy loaded |
| Exercise detail — S-07 | `/data/gifs/{id}.gif` | `true` | Full GIF, plays on render |
| Routine builder row — S-08 | `/data/previews/{id}.webp` | `false` | 40×40pt mini preview |
| Routine detail — S-09 | none — `react-body-highlighter` | — | No photo needed |
| Active set card — S-10/11/12 | `/data/gifs/{id}.gif` | `true` | Always playing during set |
| Rest timer overlay — S-13 | bleeds through glass from active card below | — | No new fetch |
| Post-workout summary — S-15 | none — `react-body-highlighter` | — | No photo needed |
| Hero cards (dashboard, routine) | `ATHLETE_PHOTO[category]` | — | Static athlete photo |

---

## 2.9 Icon System

### Decision: Phosphor Icons as SF Symbol Proxy

SF Symbols are Apple-proprietary, exportable only via SF Symbols.app on macOS. For a Windows/cross-platform dev environment, `@phosphor-icons/react` v2 is the best web substitute:

| Library | Icons | License | SF Symbol similarity | Status |
|---------|-------|---------|---------------------|--------|
| `@phosphor-icons/react` | 1,300+ | MIT | ★★★ closest shapes | ✅ active |
| `lucide-react` | 1,000+ | MIT | ★★☆ clean minimal | ✅ active |
| `react-icons` | 30,000+ | MIT | ★☆☆ generic | ✅ active |
| SF Symbol SVG exports | ~5,000 | Apple EULA | ★★★★ exact | macOS-only |

**Decision:** `@phosphor-icons/react` behind a custom `<Icon />` wrapper. Every callsite uses the SF Symbol name as the key — swapping the entire icon set requires changing only `components/ui/Icon.tsx`.

### The `<Icon />` Wrapper

```tsx
// components/ui/Icon.tsx
import {
  House, ClipboardText, ClockCounterClockwise, UserCircle,
  PlusCircle, Play, CheckCircle, Timer, Scales, List, Trophy,
  CaretLeft, Flame, Lightning, X, Barbell, PersonSimpleRun,
  PersonSimpleWalk, FloppyDisk, DotsThreeVertical, ArrowClockwise,
} from '@phosphor-icons/react';

const ICON_MAP = {
  'house.fill':                          House,
  'list.bullet.clipboard.fill':          ClipboardText,
  'clock.arrow.circlepath':              ClockCounterClockwise,
  'person.crop.circle.fill':             UserCircle,
  'plus.circle.fill':                    PlusCircle,
  'play.fill':                           Play,
  'checkmark.circle.fill':              CheckCircle,
  'timer':                               Timer,
  'scalemass.fill':                      Scales,
  'line.3.horizontal':                   List,
  'trophy.fill':                         Trophy,
  'chevron.left':                        CaretLeft,
  'flame.fill':                          Flame,
  'bolt.fill':                           Lightning,
  'xmark':                               X,
  'figure.strengthtraining.traditional': Barbell,
  'figure.run':                          PersonSimpleRun,
  'figure.flexibility':                  PersonSimpleWalk,
  'scale.3d':                            Scales,
  'square.and.arrow.down.fill':          FloppyDisk,
  'ellipsis':                            DotsThreeVertical,
  'arrow.clockwise':                     ArrowClockwise,
} as const;

export type IconName = keyof typeof ICON_MAP;

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  /** 'fill' for active/selected states; 'regular' for default */
  weight?: 'thin' | 'light' | 'regular' | 'bold' | 'fill' | 'duotone';
  className?: string;
}

export function Icon({ name, size = 24, color = 'currentColor', weight = 'regular', className }: IconProps) {
  const Component = ICON_MAP[name];
  if (!Component) return null;
  return <Component size={size} color={color} weight={weight} className={className} aria-hidden />;
}
```

**Usage — always the SF Symbol key:**

```tsx
<Icon name="house.fill"   size={24} color="#C5F74F"               weight="fill"    />
<Icon name="chevron.left" size={22} color="rgba(245,245,245,0.70)" weight="regular" />
<Icon name="trophy.fill"  size={18} color="#C5F74F"               weight="fill"    />
```

### SF Symbol → Phosphor Mapping Table

| SF Symbol name | Phosphor component | `weight` | Used in |
|----------------|--------------------|----------|---------|
| `house.fill` | `House` | `fill` | Home tab |
| `list.bullet.clipboard.fill` | `ClipboardText` | `fill` | Routines tab |
| `clock.arrow.circlepath` | `ClockCounterClockwise` | `regular` | History tab |
| `person.crop.circle.fill` | `UserCircle` | `fill` | Profile tab |
| `plus.circle.fill` | `PlusCircle` | `fill` | Add exercise |
| `play.fill` | `Play` | `fill` | Start workout |
| `checkmark.circle.fill` | `CheckCircle` | `fill` | Complete set |
| `timer` | `Timer` | `regular` | Rest timer label |
| `scalemass.fill` | `Scales` | `fill` | Weight selector |
| `line.3.horizontal` | `List` | `regular` | Drag handle |
| `trophy.fill` | `Trophy` | `fill` | PR badge |
| `chevron.left` | `CaretLeft` | `regular` | Back nav |
| `flame.fill` | `Flame` | `fill` | Streak, fat-loss goal |
| `bolt.fill` | `Lightning` | `fill` | Athletic goal card |
| `xmark` | `X` | `regular` | Close / dismiss |
| `figure.strengthtraining.traditional` | `Barbell` | `regular` | Muscle gain goal |
| `figure.run` | `PersonSimpleRun` | `regular` | Cardio goal |
| `figure.flexibility` | `PersonSimpleWalk` | `regular` | Flexibility goal |
| `scale.3d` | `Scales` | `regular` | Maintain goal |

### Active / Inactive Tab Icon Pattern

```tsx
// BottomNav.tsx
<Icon
  name={tab.icon as IconName}
  size={24}
  weight={isActive ? 'fill' : 'regular'}
  color={isActive ? '#C5F74F' : 'rgba(245,245,245,0.40)'}
/>
```

### Upgrade Path to Real SVG Exports

When macOS access is available, export symbols from SF Symbols.app and drop into `public/icons/*.svg`. To swap an individual icon without touching callsites:

```tsx
// Replace a Phosphor entry with a real SVG — zero callsite changes
'house.fill': ({ size, color }) => (
  <img src="/icons/house.fill.svg" width={size} height={size}
       style={{ color }} aria-hidden />
),
```
