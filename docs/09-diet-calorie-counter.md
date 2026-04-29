# Task 9 — Diet & Calorie Counter Module

> **Feature Owner:** TBD  
> **Status:** Planning  
> **Dependencies:** Phase 4 (Workout Calorie Calculation) — ✅ Complete · Phase 8 (Clerk Auth + CouchDB Proxy) — ✅ Complete · Task 8 (PT Portal) — Planning  
> **Food Database Source:** IFCT-2017 (National Institute of Nutrition, Hyderabad)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Design Principles](#2-design-principles)
3. [Feature Breakdown](#3-feature-breakdown)
4. [Calculations](#4-calculations)
5. [Data Model](#5-data-model)
6. [Food Library Architecture](#6-food-library-architecture)
7. [Food Library — Category Index](#7-food-library--category-index)
8. [User Stories & Epics](#8-user-stories--epics)
9. [PT Portal Integration](#9-pt-portal-integration)
10. [Integrations with Existing FitForge](#10-integrations-with-existing-fitforge)
11. [Safety Rules](#11-safety-rules)
12. [Screen Inventory & UI Specifications](#12-screen-inventory--ui-specifications)
13. [Sprint Plan](#13-sprint-plan)
14. [Phase 2 & 3 Enhancements](#14-phase-2--3-enhancements)
15. [Open Questions & Future Considerations](#15-open-questions--future-considerations)

---

## 1. Overview

### 1.1 What

A **Diet & Calorie Counter Module** that adds nutrition tracking directly inside FitForge — the same app athletes already use for workout tracking. Users can log meals, track macros, monitor body weight over time, and close the feedback loop between exercise calorie burn and dietary intake. Coached athletes can receive macro targets from their trainer through the existing PT Portal suggestion pattern.

### 1.2 Why

| Pain Point | FitForge Solution |
|------------|-------------------|
| Nutrition tracking apps are separate from fitness apps | Single app — workout calories auto-import into the diet dashboard |
| Generic Western-centric food databases don't serve Indian users | Curated IFCT-2017 library with ~300 Indian foods at launch |
| Manual calorie burn entry is error-prone | `calculateCalories()` from `lib/calculations/calories.ts` auto-populates exercise burn |
| PT macro guidance lives outside the app | Trainer suggests targets inside FitForge; client accepts in one tap |
| Barcode scanners require network | Offline-first curated library handles 90% of daily Indian meals |

### 1.3 Core Principles

| Principle | Description |
|-----------|-------------|
| **Local-first** | All nutrition data written to PouchDB immediately — no network required |
| **Indian-first food library** | IFCT-2017 curated data, South Indian / Indian priority, standard Indian portion units |
| **Exercise calories auto-imported** | No double-entry — today's workout burn flows in automatically |
| **Net calories as primary metric** | Net = Consumed − Exercise burn — aligned with how athletes think |
| **Privacy by design** | Individual meal entries are never shared, even with a connected trainer |
| **Safety floors enforced** | Hard minimum calorie targets — app refuses to set targets below the threshold |
| **Offline-capable** | 100% functional with no connectivity — identical pipeline pattern to the exercise library |

---

## 2. Design Principles

### 2.1 Offline-First Data Pipeline

The food library follows the exact same pipeline as the exercise library:

```
data/foods/F001.json               ← source of truth, version-controlled
        ↓  scripts/generate-food-manifest.ts
public/data/foods/F001.json        ← served as static assets
public/data/food-manifest.json     ← version hash + ID index
        ↓  fetch on app startup (versioned delta sync)
PouchDB fitforge_nutrition          ← local, offline-capable
        ↓  CouchDB proxy sync (background, non-blocking)
CouchDB {userId}_fitforge_nutrition ← cloud backup + PT visibility
```

### 2.2 Net Calories Model

```
Daily Net Calories = Total Food Calories − Exercise Calories Burned
```

- **Consumed** — sum of calories across all `meal_entry` documents for today's date
- **Exercise burn** — pulled from today's `workout_session.summary.totalCalories` via TanStack Query
- **Remaining** — `dailyCalorieTarget − netCalories` (green when positive, red when over on a loss goal)

### 2.3 Portion Unit Standard

All food items support Indian-standard portion units:

| Unit | Description |
|------|-------------|
| `piece` | Single discrete item (idli, egg, chapati) |
| `katori` | Standard Indian bowl — approximately 150–200 ml |
| `cup` | 240 ml standard cup |
| `plate` | Full meal plate — approximately 400–500 g |
| `tablespoon` | 15 ml |
| `glass` | 250 ml |
| `gram` | Raw gram weight — always available as fallback |

---

## 3. Feature Breakdown

### 3.1 Body Composition Setup & Onboarding (Epic 1)

| Feature | Description |
|---------|-------------|
| **Sex input** | Male / Female selection — drives BMR formula variant and safety floor |
| **Date of birth** | Used to derive age in years for BMR calculation |
| **Height input** | Entered in cm (or ft/in, converted to cm internally) |
| **Current weight** | Seeds TDEE calculation; pre-populated from profile store if weight already set |
| **Activity level** | 5-level picker (Sedentary → Extra Active) with optional auto-suggestion from workout frequency |
| **Goal phase selection** | Weight Loss (Slow / Standard / Aggressive) / Maintenance / Lean Bulk / Bulk |
| **TDEE calculation** | Computed client-side immediately; stored in `diet_profile_user_{userId}` |
| **Macro target calculation** | Derived from goal phase; protein floor applied before values are displayed |
| **Safety floor check** | If calculated target < floor → clamped to floor + persistent warning banner |
| **Goal change recalculation** | Changing goal phase recalculates all targets immediately with no network round-trip |

### 3.2 Daily Food Logging (Epic 2)

| Feature | Description |
|---------|-------------|
| **Food search** | Real-time search against local PouchDB food library, indexed by name and category |
| **Portion picker** | Default portion pre-selected; user adjusts quantity or switches unit |
| **Log entry** | Creates a `meal_entry` document in PouchDB immediately (optimistic, no network wait) |
| **Macro display** | Each logged item shows cal / P / C / F inline |
| **Swipe to delete** | Swipe right or long-press → delete with a 5-second undo toast |
| **Custom food creation** | Name + cal/100g required; macros optional; stored as `food_item` with `isCustom: true` |
| **Offline logging** | 100% functional with no connectivity — all writes go to local PouchDB |

### 3.3 Meal Slots (Epic 3)

| Feature | Description |
|---------|-------------|
| **Four fixed slots** | Breakfast · Lunch · Dinner · Snacks — fixed order, no reordering at MVP |
| **Per-slot totals** | Each slot shows its own calorie and macro sub-totals |
| **Empty slot state** | Motivational empty state with a prominent "+ Add Food" CTA |
| **Late-day nudge** | If all slots empty past 8 pm and notifications are enabled → one soft push notification fires |

### 3.4 Daily Dashboard (Epic 4)

| Feature | Description |
|---------|-------------|
| **Calorie ring** | Animated ring — lime when under target, red when over |
| **Macro rings** | Three smaller rings: Protein / Carbs / Fat progress vs target |
| **Net calories card** | Consumed − Exercise burn = Net; remaining calories shown prominently |
| **Exercise auto-import** | Today's `workout_session.summary.totalCalories` pulled via TanStack Query — zero manual entry |
| **Daily slot breakdown** | Per-slot calorie bar below the rings |
| **Date navigation** | Swipe or arrow navigation to view previous days |
| **Empty state** | On first launch with no data, shows motivational empty state and setup CTA if profile incomplete |
| **Over-target indicator** | Remaining calories card turns red when net exceeds daily target on a weight loss goal |

### 3.5 Meal Templates & Quick Re-Log (Epic 5)

| Feature | Description |
|---------|-------------|
| **Save slot as template** | Long-press a meal slot → "Save as Template" → name prompt |
| **Template library** | Accessible from the Add Food search screen |
| **Re-log in one tap** | Template items added as individual `meal_entry` documents — each is independently editable/deletable |
| **Template management** | Rename or delete templates; stored as `meal_template` documents in `fitforge_nutrition` |

### 3.6 Body Weight Log & Progress (Epic 6)

| Feature | Description |
|---------|-------------|
| **Log weight** | Tap + on the Weight card → number input → stored as a new `weight_log` document |
| **Unit respect** | Displayed in the app's global unit preference (kg / lbs); stored internally in kg |
| **Weekly cadence prompt** | Soft notification on Monday morning if no entry exists for the current week (not a hard gate) |
| **Permanent history** | Every entry persisted — no overwriting, no deletion of historical entries |
| **Progress chart** | Scatter dots (individual entries) + 4-week rolling average trend line (requires 7+ entries) |
| **New low highlight** | PR-style lime badge shown when a new lowest weight is recorded during a weight loss goal |
| **Divergence alert** | Weight change deviates >0.3 kg/week from predicted rate for 2 consecutive weeks → suggest reviewing calorie target |
| **Plateau detection** | Weight stable (≤0.1 kg variance) for ≥4 consecutive weeks on a deficit → metabolic adaptation flag + diet break week suggestion |

### 3.7 Weekly Nutrition Report (Epic 7)

| Feature | Description |
|---------|-------------|
| **Avg daily calories** | Mean across all logged days in the week |
| **Days on target** | Count of days where net calories were within ±100 kcal of the daily target |
| **Avg macro split** | Mean protein / carbs / fat percentages across logged days |
| **Total exercise burn** | Sum of exercise calories for the week from workout sessions |
| **Net weekly balance** | Total consumed − total burned across all 7 days |
| **Low data flag** | If <4 days have meal entries → "Low data — results may not be representative" disclaimer |
| **Fully offline** | Generated entirely from local PouchDB — no network required |

---

## 4. Calculations

### 4.1 BMR — Mifflin-St Jeor Formula

All calorie targets are derived from Basal Metabolic Rate (BMR) using the Mifflin-St Jeor equation:

**Men:**

$$\text{BMR} = 10w + 6.25h - 5a + 5$$

**Women:**

$$\text{BMR} = 10w + 6.25h - 5a - 161$$

Where $w$ = weight (kg), $h$ = height (cm), $a$ = age (years).

```typescript
// lib/calculations/nutrition.ts
export function calculateBMR(
  sex: 'male' | 'female',
  weightKg: number,
  heightCm: number,
  ageYears: number
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === 'male' ? base + 5 : base - 161;
}
```

### 4.2 TDEE — Total Daily Energy Expenditure

$$\text{TDEE} = \text{BMR} \times \text{Activity Multiplier}$$

| Activity Level | Multiplier | Typical Profile |
|----------------|------------|-----------------|
| Sedentary | 1.2 | Desk job, little to no exercise |
| Lightly Active | 1.375 | Light exercise 1–3 days/week |
| Moderately Active | 1.55 | Moderate exercise 3–5 days/week |
| Very Active | 1.725 | Hard exercise 6–7 days/week |
| Extra Active | 1.9 | Physical job + hard daily training |

> **Auto-suggestion:** The app can suggest an activity level based on the user's average weekly workout frequency queried from the `fitforge_workouts` PouchDB. The user must confirm — the suggestion is never auto-applied.

### 4.3 Daily Calorie Target by Goal Phase

| Goal Phase | Daily Calorie Target | Estimated Rate |
|------------|----------------------|----------------|
| Weight Loss (Slow) | TDEE − 250 kcal | ~0.25 kg/week |
| Weight Loss (Standard) | TDEE − 500 kcal | ~0.5 kg/week |
| Weight Loss (Aggressive) | TDEE − 750 kcal | ~0.75 kg/week |
| Maintenance | TDEE | 0 kg/week |
| Lean Bulk | TDEE + 250 kcal | ~0.25 kg/week |
| Bulk | TDEE + 500 kcal | ~0.5 kg/week |

> Safety floors are applied **after** this calculation — see [Section 11](#11-safety-rules).

> **Deload week adjustment:** When the deload week flag is active in `fitforge_workouts`, the recommended target shifts to TDEE − 200 regardless of the active goal phase deficit, to support recovery. This is surfaced as a suggestion card, not auto-applied.

### 4.4 Macro Targets by Goal Phase

| Goal Phase | Protein | Carbs | Fat |
|------------|---------|-------|-----|
| Weight Loss | 40% | 30% | 30% |
| Maintenance | 30% | 40% | 30% |
| Muscle Gain (Lean Bulk / Bulk) | 35% | 45% | 20% |

**Protein minimum floor:** A minimum of **2.2 g per kg of bodyweight** is enforced. If the percentage-derived protein grams fall below this floor, protein is raised to the floor and carbohydrates are reduced to compensate, keeping total calories unchanged.

**Manual override:** Users can manually adjust macro percentage splits. Custom splits are persisted in `diet_profile.macroTargets` and remain until explicitly reset or a new goal phase is selected. The `macroTargetsOverridden` flag is set to `true`.

```typescript
// lib/calculations/nutrition.ts
export function calculateMacroTargets(
  dailyCalories: number,
  weightKg: number,
  goalPhase: GoalPhase
): MacroTargets {
  const split = MACRO_SPLITS[goalPhase];
  let proteinG = Math.round((dailyCalories * split.proteinPct) / 4);
  const proteinFloor = Math.round(2.2 * weightKg);

  if (proteinG < proteinFloor) {
    const proteinCalories = proteinFloor * 4;
    const fatCalories = Math.round(dailyCalories * split.fatPct);
    const carbCalories = dailyCalories - proteinCalories - fatCalories;
    return {
      proteinG: proteinFloor,
      carbsG: Math.round(carbCalories / 4),
      fatG: Math.round(fatCalories / 9),
    };
  }

  return {
    proteinG,
    carbsG: Math.round((dailyCalories * split.carbsPct) / 4),
    fatG: Math.round((dailyCalories * split.fatPct) / 9),
  };
}
```

### 4.5 Macronutrient Energy Density

| Macronutrient | kcal per gram |
|---------------|--------------|
| Protein | 4 kcal/g |
| Carbohydrates | 4 kcal/g |
| Fat | 9 kcal/g |

---

## 5. Data Model

### 5.1 PouchDB Database

A new dedicated PouchDB database `fitforge_nutrition` is created per user, following the same pattern as `fitforge_routines` and `fitforge_workouts`. It syncs to CouchDB via the existing `/api/couch-proxy` route.

```
CouchDB DB name: {clerkUserId}_fitforge_nutrition
```

This database is provisioned by the existing `/api/auth/provision-couch` route — the `fitforge_nutrition` DB name is added to the provisioned database list.

### 5.2 TypeScript Interfaces

#### Supporting Types

```typescript
// types/nutrition.ts

type GoalPhase =
  | 'weight_loss_slow'
  | 'weight_loss_standard'
  | 'weight_loss_aggressive'
  | 'maintenance'
  | 'lean_bulk'
  | 'bulk';

type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active'
  | 'extra_active';

type PortionUnit =
  | 'piece'
  | 'katori'
  | 'cup'
  | 'plate'
  | 'tablespoon'
  | 'glass'
  | 'gram';

type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

type NutritionSuggestionStatus = 'pending' | 'accepted' | 'rejected' | 'superseded';

interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

interface PortionDisplay {
  unit: PortionUnit;
  quantity: number;
}
```

#### `MealEntry` — single logged food item

```typescript
interface MealEntry {
  _id: string;              // "meal_entry_{ISO8601}_{nanoid}"
  _rev?: string;
  type: 'meal_entry';
  date: string;             // "YYYY-MM-DD" — local calendar date, not UTC
  slot: MealSlot;
  foodItemId: string;       // References food JSON id (e.g. "F001") or custom food_item._id
  isCustomFood: boolean;
  portionGrams: number;     // Always stored in grams regardless of display unit
  portionDisplay: PortionDisplay;  // What the user saw when logging
  calories: number;         // Derived at log time — denormalised for fast daily totals
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  loggedAt: string;         // ISO 8601 timestamp
}
```

#### `FoodItem` — custom user-created food (system items are static JSON files)

System library food items (`F001.json` … `F300.json`) are served as static assets and are **not** stored as PouchDB documents. Only user-created custom foods are persisted here.

```typescript
interface FoodItem {
  _id: string;              // "food_item_{slug}_{nanoid}"
  _rev?: string;
  type: 'food_item';
  name: string;
  nameLocal: string | null; // Reserved for Phase 2 localisation — always null at launch
  category: string;         // e.g. "south-indian-staple", "dairy", "protein-meat-fish"
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  defaultPortion: {
    unit: PortionUnit;
    weightGrams: number;
  };
  altPortions: Array<{
    unit: PortionUnit;
    weightGrams: number;
  }>;
  source: string;           // "IFCT-2017" | "custom"
  isCustom: boolean;
  createdAt?: string;       // Present only for custom items
}
```

#### `DietProfile` — body composition and targets (one per user)

```typescript
interface DietProfile {
  _id: string;                      // "diet_profile_user_{clerkUserId}"
  _rev?: string;
  type: 'diet_profile';
  sex: 'male' | 'female';
  dob: string;                      // "YYYY-MM-DD"
  heightCm: number;
  goalPhase: GoalPhase;
  activityLevel: ActivityLevel;
  bmr: number;                      // Stored for display; recalculated on profile change
  tdee: number;                     // Stored for display; recalculated on profile change
  dailyCalorieTarget: number;       // Safety-floor-applied target
  macroTargets: MacroTargets;
  macroTargetsOverridden: boolean;  // true when user has manually adjusted splits
  safetyFloorApplied: boolean;      // true when target was clamped to the minimum floor
  ptSuggestionActive: boolean;      // true when an accepted PT suggestion is in effect
  updatedAt: string;
}
```

#### `WeightLog` — individual weigh-in entry (never overwritten)

```typescript
interface WeightLog {
  _id: string;      // "weight_log_{ISO8601}_{nanoid}"
  _rev?: string;
  type: 'weight_log';
  date: string;     // "YYYY-MM-DD" — local calendar date
  weightKg: number; // Always stored in kg; displayed in user's unit preference
  loggedAt: string; // ISO 8601 timestamp
}
```

#### `MealTemplate` — saved meal for quick re-logging

```typescript
interface MealTemplateItem {
  foodItemId: string;
  isCustomFood: boolean;
  portionGrams: number;
  portionDisplay: PortionDisplay;
}

interface MealTemplate {
  _id: string;          // "meal_template_{slug}_{nanoid}"
  _rev?: string;
  type: 'meal_template';
  name: string;
  items: MealTemplateItem[];
  sourceSlot?: MealSlot; // Slot the template was saved from, if applicable
  createdAt: string;
  updatedAt: string;
}
```

#### `NutritionSuggestion` — PT-suggested macro targets

```typescript
interface NutritionSuggestion {
  _id: string;                       // "nutrition_suggestion_{clientId}_{nanoid}"
  _rev?: string;
  type: 'nutrition_suggestion';
  trainerId: string;                 // Clerk userId of the trainer
  clientId: string;                  // Clerk userId of the client
  dailyCalorieTarget: number;
  macroTargets: MacroTargets;
  proteinFloor: number;              // Minimum protein in g/day
  goalPhase: GoalPhase;
  notes?: string;                    // Trainer's guidance text (max 1,000 chars)
  status: NutritionSuggestionStatus;
  sentAt: string;
  respondedAt?: string;
  supersededById?: string;           // ID of the newer suggestion that replaced this one
}
```

### 5.3 Document ID Conventions

| Document Type | ID Pattern | Example |
|---------------|------------|---------|
| `meal_entry` | `meal_entry_{ISO8601}_{nanoid}` | `meal_entry_2026-04-29T07:30:00Z_abc12` |
| `food_item` (custom) | `food_item_{slug}_{nanoid}` | `food_item_homemade-sambar_xyz99` |
| `diet_profile` | `diet_profile_user_{clerkUserId}` | `diet_profile_user_user_2aBcDe` |
| `weight_log` | `weight_log_{ISO8601}_{nanoid}` | `weight_log_2026-04-28T07:00:00Z_def34` |
| `meal_template` | `meal_template_{slug}_{nanoid}` | `meal_template_my-breakfast_ghi56` |
| `nutrition_suggestion` | `nutrition_suggestion_{clientId}_{nanoid}` | `nutrition_suggestion_user_2aBcDe_jkl78` |

---

## 6. Food Library Architecture

### 6.1 Source Files

Each food item lives as a standalone JSON file under `data/foods/`:

```
data/
  foods/
    F001.json    ← Idli (steamed, plain)
    F002.json    ← Dosa (plain)
    F003.json    ← Sambar (per katori)
    ...
    F300.json
```

### 6.2 Food JSON Schema

```json
{
  "id": "F001",
  "name": "Idli (steamed, plain)",
  "nameLocal": null,
  "category": "south-indian-staple",
  "caloriesPer100g": 58,
  "proteinPer100g": 2.0,
  "carbsPer100g": 12.1,
  "fatPer100g": 0.2,
  "fiberPer100g": 0.5,
  "defaultPortion": { "unit": "piece", "weightGrams": 40 },
  "altPortions": [
    { "unit": "katori", "weightGrams": 130 }
  ],
  "source": "IFCT-2017",
  "isCustom": false
}
```

**Field definitions:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | `string` | ✅ | `F` prefix + zero-padded 3-digit number |
| `name` | `string` | ✅ | English name including preparation style |
| `nameLocal` | `string \| null` | ✅ | `null` at launch; Phase 2 adds local language names |
| `category` | `string` | ✅ | Category key from the index in Section 7 |
| `caloriesPer100g` | `number` | ✅ | kcal per 100 g |
| `proteinPer100g` | `number` | ✅ | g per 100 g |
| `carbsPer100g` | `number` | ✅ | g per 100 g |
| `fatPer100g` | `number` | ✅ | g per 100 g |
| `fiberPer100g` | `number` | ✅ | g per 100 g |
| `defaultPortion` | `object` | ✅ | Most common Indian serving for this food |
| `altPortions` | `array` | ✅ | Additional portion options; empty array `[]` if none |
| `source` | `string` | ✅ | `"IFCT-2017"` for all curated library items |
| `isCustom` | `boolean` | ✅ | Always `false` for curated library items |

### 6.3 Build Script

`scripts/generate-food-manifest.ts` is a near-copy of `scripts/generate-exercise-manifest.ts` with paths adjusted for the food library:

- Reads all `data/foods/F*.json` files
- Copies each to `public/data/foods/`
- Generates `public/data/food-manifest.json`

```json
{
  "version": "a1b2c3d4e5f6",
  "count": 300,
  "foods": [
    { "id": "F001", "hash": "3f9a2c1b" },
    { "id": "F002", "hash": "7e4d5a0c" }
  ]
}
```

- Per-file SHA-1 hash enables versioned delta sync
- `version` (library hash) changes only when any food item changes — app startup skips all fetches if unchanged (sub-5 ms check)

### 6.4 Manifest-Driven Startup Sync

On app startup (or on first Diet tab load):

1. Fetch `public/data/food-manifest.json`
2. Compare `version` against the last-stored version in a `fitforge_nutrition` meta document
3. If unchanged → skip all food item fetches
4. If changed → diff per-item hashes, fetch only the changed `F*.json` files from `public/data/foods/`
5. Upsert changed items into PouchDB (keyed by `id`)

This is identical to the versioned delta sync used for the exercise library.

### 6.5 Food Search Strategy (MVP)

With ~300 items, the entire manifest fits comfortably in memory. At MVP, search works as follows:

1. On Diet tab mount, load all food manifest entries into a Zustand slice (`useFoodStore`)
2. User types in the search box → filter in-memory by `name` (case-insensitive substring match)
3. Lazy-load the full `F*.json` data only for items that appear in search results
4. Custom `food_item` documents from PouchDB are merged into search results, appearing first

> **Future migration:** If the library grows beyond 1,000 items, migrate to a PouchDB `find()` with a Mango index on `name` to avoid full in-memory filtering.

---

## 7. Food Library — Category Index

Approximately 300 food items at launch. All nutritional data is sourced from IFCT-2017 (National Institute of Nutrition, Hyderabad). South Indian and common pan-Indian items are prioritised.

| # | Category Key | Representative Items | Approx. Count |
|---|--------------|----------------------|---------------|
| 1 | `south-indian-staple` | Idli (plain/rava), Dosa (plain/masala/rava/set), Uttapam, Appam, Puttu, Idiyappam, Pongal (ven/sakkarai), Upma, Semiya upma | ~20 |
| 2 | `rice-dish` | Steamed rice (raw/boiled/parboiled), Curd rice, Lemon rice, Tomato rice, Sambar rice, Rasam rice, Chicken biryani, Mutton biryani, Veg biryani | ~15 |
| 3 | `gravy-curry` | Sambar, Rasam, Kootu, Avial, Mor kuzhambu, Vatha kuzhambu, Keerai kootu, Egg curry, Chicken curry, Mutton curry, Fish curry, Prawn curry | ~20 |
| 4 | `dry-dish` | Beans poriyal, Carrot poriyal, Cabbage poriyal, Potato roast, Cauliflower roast, Brinjal fry, Drumstick stir-fry | ~15 |
| 5 | `north-indian-crossover` | Chapati/Roti (plain/wheat), Dal tadka, Dal makhani, Paneer butter masala, Rajma, Chole, Aloo sabzi, Palak paneer | ~15 |
| 6 | `breakfast-protein` | Boiled egg (whole/white/yolk), Omelette (plain/masala), Egg bhurji, Scrambled eggs | ~8 |
| 7 | `snack` | Murukku, Sundal (groundnut/chickpea), Bajji (onion/plantain), Bonda, Medhu vada, Samosa, Mixture | ~15 |
| 8 | `dairy` | Full-fat milk, Toned milk, Curd (plain), Buttermilk (chaas), Paneer, Ghee, Butter, Whey protein (plain) | ~12 |
| 9 | `beverage` | Filter coffee (with/without sugar), Masala chai, Nannari sherbet, Sugarcane juice, Tender coconut water | ~10 |
| 10 | `fruit` | Banana, Mango, Papaya, Guava, Sapota, Jackfruit, Pomegranate, Apple, Orange, Watermelon, Grapes | ~20 |
| 11 | `vegetable` | Onion, Tomato, Carrot, Beans, Cabbage, Spinach, Drumstick, Brinjal, Ladies finger, Bitter gourd | ~20 |
| 12 | `pulse-grain` | Toor dal (raw/cooked), Moong dal, Urad dal, Rajma (raw/cooked), Chickpeas, Wheat flour (atta), Rice flour, Rava (sooji) | ~15 |
| 13 | `sweet` | Payasam (rice/vermicelli), Pongal (sakkarai), Halwa (carrot/sooji), Ladoo (besan/rava), Kesari, Mysore pak | ~10 |
| 14 | `packaged-staple` | Amul butter (salted/unsalted), Amul ghee, Aashirvaad atta, Horlicks, Bournvita | ~10 |
| 15 | `protein-meat-fish` | Chicken breast (raw/cooked), Chicken thigh, Chicken leg, Rohu fish, Pomfret, Sardine, Seer fish (vanjaram), Mutton (lean/bone-in), Prawn | ~20 |
| 16 | `oil-condiment` | Groundnut oil, Coconut oil, Sunflower oil, Sesame (gingelly) oil, Tamarind, Curry leaves, Mustard seeds | ~10 |
| 17 | `bread-bakery` | White bread (slice), Brown bread (slice), Parotta, Puri | ~8 |
| 18 | `fast-food` | Veg burger (approx), Restaurant-style masala dosa, Restaurant fried rice | ~7 |

**Total: ~300 items**

---

## 8. User Stories & Epics

### Epic 1 — Body Composition Setup (US-D01)

**As a** FitForge user  
**I want to** enter my body stats and fitness goal  
**So that** the app calculates my personalised daily calorie and macro targets

**Acceptance Criteria:**

- [ ] User provides: sex, date of birth, height, current weight, activity level, goal phase
- [ ] If weight already exists in `useProfileStore`, it is pre-populated — no re-entry required
- [ ] BMR, TDEE, daily calorie target, and macro targets are computed entirely client-side with no network request
- [ ] If the computed target < safety floor, target is clamped to the floor and a persistent amber warning banner is displayed
- [ ] All results are stored in `diet_profile_user_{clerkUserId}` in `fitforge_nutrition`
- [ ] Changing goal phase instantly recalculates and saves all targets
- [ ] Setup is re-accessible at any time from Settings → Nutrition

---

### Epic 2 — Daily Food Logging (US-D02)

**As a** FitForge user  
**I want to** search for and log the food I have eaten  
**So that** I can track my daily calorie and macro intake

**Acceptance Criteria:**

- [ ] Food search queries local PouchDB food library — works fully offline
- [ ] Selecting a food shows its full nutritional info and a portion picker
- [ ] The default portion is pre-selected; user can adjust quantity or switch unit
- [ ] Tapping "Log" creates a `meal_entry` document in PouchDB immediately (no network wait)
- [ ] Daily totals on the dashboard update instantly after each log entry
- [ ] User can create a custom food item (name + cal/100g required; macros optional)
- [ ] Custom food items are searchable immediately after creation
- [ ] Swiping a logged entry shows a delete option with a 5-second undo toast
- [ ] All logging functionality works 100% offline

---

### Epic 3 — Meal Slots (US-D03)

**As a** FitForge user  
**I want to** organise my food logs into meal slots  
**So that** I can see my eating pattern throughout the day

**Acceptance Criteria:**

- [ ] Four fixed slots exist in order: Breakfast, Lunch, Dinner, Snacks
- [ ] Each slot shows its own calorie and macro sub-totals
- [ ] An empty slot shows an empty state with a prominent "+ Add Food" CTA
- [ ] If all slots are empty past 8 pm and notifications are enabled → one soft push notification fires
- [ ] The notification is not sent if any food has been logged that day

---

### Epic 4 — Daily Dashboard (US-D04)

**As a** FitForge user  
**I want to** see a clear daily nutrition summary  
**So that** I know how many calories I have remaining and whether I am hitting my macros

**Acceptance Criteria:**

- [ ] The calorie ring shows: consumed / target / remaining (or over)
- [ ] Three macro rings show protein, carbs, and fat progress vs target
- [ ] Exercise calories are automatically pulled from today's `workout_session.summary.totalCalories` — zero manual entry
- [ ] Net calories (consumed − exercise burn) is the primary displayed figure
- [ ] When net calories exceed the daily target on a weight loss goal, the remaining indicator turns red
- [ ] Date navigation (swipe or arrows) shows historical days' data
- [ ] If no diet profile exists, the dashboard shows a "Set Up Nutrition" CTA
- [ ] All data loads from PouchDB — no network dependency

---

### Epic 5 — Meal Templates & Quick Re-Log (US-D05)

**As a** FitForge user  
**I want to** save and re-log frequently eaten meals  
**So that** logging my usual meals takes only one tap

**Acceptance Criteria:**

- [ ] Long-pressing a meal slot surfaces a "Save as Template" option
- [ ] The user is prompted for a template name before saving
- [ ] Saved templates appear in a "Templates" section of the Add Food screen
- [ ] Re-logging a template creates individual, independently editable `meal_entry` documents for each item
- [ ] Templates can be renamed or deleted from the template library
- [ ] The template library is available fully offline

---

### Epic 6 — Body Weight Log & Progress (US-D06)

**As a** FitForge user  
**I want to** log my weight regularly and see my trend  
**So that** I can monitor whether my diet and training approach is working

**Acceptance Criteria:**

- [ ] Weight can be logged from the Diet tab at any time
- [ ] Weight is displayed in the user's preferred unit (kg/lbs); stored internally in kg
- [ ] Every entry is stored as a separate `weight_log` document — no entry is ever overwritten or deleted
- [ ] On Monday mornings, a soft nudge notification fires if no entry exists for the current week (requires notification permission; never blocks the user)
- [ ] With 7+ entries, a chart shows scatter dots for individual entries and a 4-week rolling average trend line
- [ ] A new personal-low weight during a weight loss goal triggers a lime "New Low!" PR badge
- [ ] If weight change deviates >0.3 kg/week from the predicted rate for 2 consecutive weeks, a "Review your calorie target?" suggestion card appears
- [ ] If weight is stable (≤0.1 kg variance) for ≥4 consecutive weeks on a calorie deficit, a metabolic adaptation alert appears with a diet break week suggestion

---

### Epic 7 — Weekly Nutrition Report (US-D07)

**As a** FitForge user  
**I want to** see a weekly nutrition summary  
**So that** I can evaluate my consistency and overall dietary balance

**Acceptance Criteria:**

- [ ] The report covers Monday–Sunday of the selected week
- [ ] Displays: avg daily calories, days on target (±100 kcal), avg macro split, total exercise burn, net weekly calorie balance
- [ ] If fewer than 4 days have meal log entries, a "Low data — results may not be representative" flag is shown
- [ ] The report is generated entirely from local PouchDB — no network request
- [ ] Previous weeks are accessible via date navigation

---

### Epic 8 — PT Nutrition Visibility (US-D08)

**As a** Personal Trainer  
**I want to** see my client's nutrition summary and suggest macro targets  
**So that** I can provide holistic fitness and nutrition coaching in a single platform

**Acceptance Criteria:**

- [ ] If the client has NOT enabled nutrition sharing → trainer sees only a "Not shared" placeholder with no data
- [ ] If sharing is enabled → trainer sees: avg daily calories (last 7 days), avg macro split, days logged in the last 7 days, current goal phase, 4-week weight trend
- [ ] Individual meal entries are **never** visible to the trainer — only aggregated summaries
- [ ] Trainer can send a `nutrition_suggestion` with: daily calorie target, macro targets, protein floor, goal phase, optional notes
- [ ] Client sees the incoming suggestion as an actionable card in their Diet tab
- [ ] Client can tap "View Details" to see the full breakdown before deciding
- [ ] Client can Accept or Reject the suggestion
- [ ] An accepted suggestion overrides the client's calculated TDEE targets and sets `ptSuggestionActive: true`
- [ ] Client can revert to calculated targets at any time in Settings → Nutrition
- [ ] Only one active suggestion per client — a new trainer suggestion supersedes any `pending` old one
- [ ] Trainer sees suggestion status: Pending / Accepted / Rejected

---

## 9. PT Portal Integration

### 9.1 Nutrition Sharing Model

Sharing is governed by the user's coaching relationship status and their explicit privacy settings.

| User Type | Default Sharing State | How to Change |
|-----------|-----------------------|---------------|
| Self-directed (no trainer connection) | Private | N/A |
| Coached athlete (active trainer connection) | Shared — auto-enabled when connection is accepted | Settings → Privacy → Nutrition Sharing |

**When a trainer connection is accepted:**

An in-app notice is displayed immediately:

> *"Your nutrition summary (weekly averages only — individual meal details are never shared) will be visible to [Trainer Name]. You can change this at any time in Settings → Privacy."*

The user must dismiss this notice. It is not a consent gate; it is an explicit information disclosure. The auto-enable happens in the background once the connection is accepted.

**When the user revokes sharing:**

- The trainer immediately loses access; any query returns the "Not shared" state
- No data is deleted — local PouchDB data is completely unaffected
- The `nutrition_suggestion` documents remain in the shared DB but are inaccessible to the trainer after revocation

### 9.2 Shared vs Private Data

| Data | Shared with Trainer | Notes |
|------|--------------------|----|
| Weekly avg calories | ✅ | 7-day rolling average |
| Avg macro split | ✅ | % protein / carbs / fat |
| Days logged (last 7) | ✅ | Adherence / compliance indicator |
| Goal phase | ✅ | e.g. "Weight Loss — Standard" |
| 4-week weight trend | ✅ | Trend direction + kg values |
| Individual meal entries | ❌ | **Absolute privacy boundary — never shared** |
| Custom food names | ❌ | Never shared |
| Meal slot contents | ❌ | Never shared |
| Calorie target (exact) | ❌ | Trainer sees goal phase; not the raw number |

### 9.3 Nutrition Suggestion Flow

The `nutrition_suggestion` pattern mirrors `routine_suggestion` from Task 8 §3.5 exactly:

```
Trainer fills suggestion form → stored in shared CouchDB DB
        ↓  PouchDB sync to client device
Client sees suggestion card in Diet tab inbox
        ↓
Client taps "View Details" → full macro breakdown sheet opens
        ↓
Client taps Accept or Reject
        ↓  status update written to PouchDB → syncs back
Trainer sees updated status in client nutrition tab
```

**Business rules:**

- One active suggestion per client at a time
- New suggestion from the same trainer → supersedes any `pending` old suggestion (old document `status` set to `"superseded"`, `supersededById` set to new suggestion ID)
- An accepted suggestion sets `diet_profile.dailyCalorieTarget` and `diet_profile.macroTargets` to the suggested values and `ptSuggestionActive: true`
- Client revert → `ptSuggestionActive: false`; targets recomputed from stored `bmr` and `tdee` using the current `goalPhase`
- Safety floor check applies to PT suggestions — see [Section 11](#11-safety-rules)

### 9.4 Trainer-Side UI — Client Nutrition Tab

A **Nutrition** tab is added to the existing client detail view in the PT Portal (alongside the existing Workouts tab):

| Element | Description |
|---------|-------------|
| Not-shared state | Lock icon + "Client hasn't shared nutrition data" |
| Summary card | 7-day avg calories, macro split donut, days logged badge, goal phase chip |
| Weight trend card | Mini sparkline + trend direction arrow (↓ losing / → stable / ↑ gaining) |
| Active suggestion card | Current suggestion status (if any) — Pending / Accepted / Rejected |
| "Send New Target" CTA | Opens suggestion form sheet |
| Suggestion form | Daily calorie target input · macro split sliders · protein floor input · goal phase picker · optional notes textarea |

---

## 10. Integrations with Existing FitForge

| Existing System | Integration Point | Implementation Details |
|-----------------|-------------------|-----------------------|
| `lib/calculations/calories.ts` · `calculateCalories()` | Exercise burn auto-import | Today's `workout_session.summary.totalCalories` is fetched via TanStack Query and displayed as "Burned" in the Diet dashboard. No manual entry required. |
| `useProfileStore` · `weightKg` | TDEE seeding at setup | `weightKg` from the profile store pre-populates the body composition setup form. Changes to weight in the workout profile do **not** auto-update the diet profile — it is a one-time seed; the user manages diet weight separately. |
| `fitforge_workouts` DB · `isDeload` flag | Calorie target adjustment on deload | When a deload week is active, a banner suggestion card is shown: *"You're on a deload week. Consider eating at TDEE − 200 to support recovery."* The target is not auto-changed. |
| `useProfileStore` · `xp` · `addXP()` | Logging streak rewards | 7 consecutive days logged = "Consistent Logger" badge + XP bonus. 30 days = "Nutrition Disciple" milestone. XP awarded through the existing `addXP()` action. |
| PT Portal (Task 8) | Nutrition visibility + `nutrition_suggestion` | Trainer sees aggregated nutrition summary in client detail. `NutritionSuggestion` follows the identical accept/reject pattern as `RoutineSuggestion`. |
| Settings store · `unitPreference` | Unit display throughout the module | The diet module reads `unitPreference` globally — weight is displayed in kg or lbs without any separate diet-specific unit setting. |
| Notification system · `NotificationPreferences` | Soft nudges | The 8 pm meal logging reminder and the Monday weight nudge both check `NotificationPreferences.enabled` before firing. |

---

## 11. Safety Rules

Safety floors are **hard-enforced**. The app will never allow a daily calorie target to be set below these values — not by goal phase calculation, not by a trainer suggestion, and not by manual override.

| Sex | Minimum Daily Calorie Target |
|-----|------------------------------|
| Female | 1,200 kcal/day |
| Male | 1,500 kcal/day |

### Enforcement Logic

```typescript
// lib/calculations/nutrition.ts
export function applySafetyFloor(
  calculatedTarget: number,
  sex: 'male' | 'female'
): { target: number; floorApplied: boolean } {
  const floor = sex === 'male' ? 1500 : 1200;
  if (calculatedTarget < floor) {
    return { target: floor, floorApplied: true };
  }
  return { target: calculatedTarget, floorApplied: false };
}
```

### User-Facing Behaviour When Floor Is Triggered

1. Target is silently clamped to the floor value
2. A persistent amber warning banner appears below the calorie target card:  
   *"Your target has been set to the minimum safe intake of [N] kcal/day. Eating below this level is not recommended."*
3. The banner persists until the user selects a goal phase that results in a target above the floor
4. `diet_profile.safetyFloorApplied` is set to `true`

### PT Suggestion Safety Check

When a trainer submits a `nutrition_suggestion`, the API route (`/api/nutrition/suggest`) validates the `dailyCalorieTarget` against the client's safety floor before storing the document. If the value is below the floor:

- The suggestion document is **not stored**
- The API returns HTTP 422 with a clear error message
- The trainer sees a validation error in the suggestion form: *"Target below the client's minimum safe intake of [N] kcal/day."*

---

## 12. Screen Inventory & UI Specifications

### 12.1 Screen List

| Screen | Route | Entry Point |
|--------|-------|-------------|
| Diet Dashboard — Daily View | `/diet` | Tab bar |
| Diet Onboarding / Profile Setup | `/diet/setup` | First launch or Settings → Nutrition redirect |
| Add Food — Search | `/diet/log/search` | Sheet from dashboard slot |
| Add Food — Portion Picker | `/diet/log/portion` | Sheet after selecting a food |
| Food Detail (Nutrition Info) | `/diet/food/[id]` | Sheet from search result long-press |
| Custom Food Creator | `/diet/food/new` | Button in the search screen |
| Weight Log & Chart | `/diet/weight` | Card tap on dashboard |
| Weekly Nutrition Report | `/diet/report` | Header link on dashboard |
| Meal Templates Library | `/diet/templates` | Button in Add Food search screen |
| Settings — Nutrition | `/settings/nutrition` | Settings tab |
| Settings — Privacy (Sharing) | `/settings/privacy` | Settings tab |
| PT — Client Nutrition Tab | `/trainer/clients/[id]/nutrition` | PT Portal client detail |
| PT — Send Nutrition Suggestion | `/trainer/clients/[id]/nutrition/suggest` | PT Portal CTA |

### 12.2 Daily Dashboard Layout

```
┌───────────────────────────────────────────┐
│  ← Tue, Apr 29                 Week →     │  ← glass-nav-bar
├───────────────────────────────────────────┤
│                                           │
│           ┌──────────────┐                │
│           │  [Calorie    │                │
│           │    Ring]     │                │
│           │  1,840 kcal  │                │
│           │  consumed    │                │
│           │              │                │
│           │  560 left    │  ← lime text   │
│           └──────────────┘                │
│                                           │
│   [P ring]   [C ring]   [F ring]          │
│  142/160g   210/240g    58/70g            │
│                                           │
│  🔥 Exercise burned:  −320 kcal           │
│  Net calories today:  1,520 kcal          │
│                                           │
├───────────────────────────────────────────┤
│  BREAKFAST                  +  320 kcal   │
│  ├ Idli × 3                    96 kcal   │
│  ├ Sambar (1 katori)           48 kcal   │
│  └ Filter coffee               85 kcal   │
├───────────────────────────────────────────┤
│  LUNCH                      +  610 kcal   │
│  └ (tap to expand / + to add)            │
├───────────────────────────────────────────┤
│  DINNER                     +      —      │
│  └ [Empty — tap + to log]                │
├───────────────────────────────────────────┤
│  SNACKS                     +      —      │
└───────────────────────────────────────────┘
```

### 12.3 Design Tokens

| Element | Token / Value |
|---------|--------------|
| Page background | `var(--bg-primary)` = `#0B0B0B` |
| Calorie ring — under target | `var(--brand-lime)` = `#C5F74F` |
| Calorie ring — over target | `var(--red-alert)` = `#FF453A` |
| Remaining text — under target | `var(--brand-lime)` |
| Remaining text — over target | `var(--red-alert)` |
| Meal slot cards | `.glass` material |
| Section headers | 13px / 600 weight / `var(--text-tertiary)` / uppercase letter-spacing |
| Progress ring strokes | `<motion.circle>` animated via `springDefault` on mount |
| Safety floor warning banner | `var(--amber-warning)` background, `.glass-elevated` |

### 12.4 Animation Specifications

| Interaction | Animation Spec |
|-------------|----------------|
| Calorie ring fill on mount | `springDefault` — arc draws from 0 to current value |
| Macro rings fill on mount | Staggered `springDefault` with 50 ms delay between each ring |
| Meal entry log (new item appears) | `sheetVariants` scale-up from 0.95 → 1.0, `springSnappy` |
| Meal entry delete | `opacity` → 0 + `x` → −100% with `springSnappy`, then item collapses |
| Over-target state transition | Animated colour change on remaining number (lime → red), `springDefault` |
| Add Food sheet present | `sheetVariants` from `lib/motion/variants.ts` — slides up from bottom |
| Portion picker sheet present | `sheetVariants`, background scales to 0.92 via `useSheetStore` |

---

## 13. Sprint Plan

Each sprint produces a testable, independently shippable increment. Sprints are ordered by feature dependency.

| Sprint | Focus | Key Deliverables | Depends On |
|--------|-------|-----------------|------------|
| **1** | Food data pipeline + Body composition setup | `scripts/generate-food-manifest.ts`; 300 food JSON files under `data/foods/`; `fitforge_nutrition` PouchDB + CouchDB provisioning; BMR / TDEE / macro calculation functions in `lib/calculations/nutrition.ts`; Diet onboarding screen at `/diet/setup`; `DietProfile` document write | Profile store (exists), Clerk auth (exists) |
| **2** | Food logging + custom foods | Food search UI; portion picker sheet; `meal_entry` document creation; daily totals calculation; custom food creator; swipe-to-delete with undo toast | Sprint 1 |
| **3** | Daily dashboard | Calorie ring + macro rings; net calories display; exercise auto-import via TanStack Query; date navigation; over-target red state; empty/setup states | Sprint 2 + workout session DB (exists) |
| **4** | Body weight log + progress chart | Weight log entry screen; scatter + rolling average trend chart; Monday nudge; new-low badge; divergence alert; plateau detection logic | Sprint 2 |
| **5** | Meal templates + quick re-log | Save slot as template; template library screen; one-tap re-log | Sprint 2 |
| **6** | Weekly nutrition report | Weekly report screen at `/diet/report`; avg calculations; on-target count; low-data flag | Sprints 3–4 |
| **7** | PT Portal nutrition integration | Nutrition sharing toggle in Settings → Privacy; aggregated summary queries; `NutritionSuggestion` document flow; trainer send-suggestion form; client accept/reject UI; safety floor check in API route | Sprint 6 + PT Portal (Task 8) |
| **8** | Phase 2 — Barcode, IF, Hydration | Camera barcode scanner with Open Food Facts fallback; Intermittent Fasting timer (16:8, 18:6, 5:2); daily hydration tracker | Sprint 3 |

---

## 14. Phase 2 & 3 Enhancements

### 14.1 High Value (Phase 2)

| Feature | Description |
|---------|-------------|
| **Hydration tracker** | Daily water intake log (glasses / ml); configurable daily target (e.g. 8 glasses); hydration ring on the dashboard |
| **Barcode scanner** | Camera API → barcode decode → Open Food Facts API lookup → result cached locally; curated library serves as the offline fallback |
| **Intermittent Fasting timer** | IF protocol picker (16:8, 18:6, 5:2, custom); countdown timer on dashboard during fasting window; fasting log stored in `fitforge_nutrition` |
| **Pre/post-workout nutrition flag** | Within 2 hours of a completed workout → configurable push reminder for protein intake |
| **Calorie balance calendar** | GitHub contribution-style heatmap by day: lime (on target), amber (±200 kcal), red (>200 kcal over), grey (not logged) |
| **Nutrient density score** | Protein-per-calorie ratio displayed per food item; "Best value" sort option in food search |
| **Diet break suggestion** | After 4+ consecutive weeks of deficit → suggestion card: *"Consider a diet break week at TDEE"* |
| **Localisation — `nameLocal`** | Populate `nameLocal` field in food JSONs for Tamil, Telugu, Kannada; UI toggle for local language food names |

### 14.2 Medium Value (Phase 2/3)

| Feature | Description |
|---------|-------------|
| **Grocery list generator** | Export a shopping list from saved meal templates or the upcoming week's plan, grouped by food category |
| **Fiber & sodium tracking** | Add `fiberG` and `sodiumMg` to logged totals; display on food detail and daily dashboard |
| **Progress photos** | Photo blobs stored in PouchDB; privacy-first timeline view; never shared or synced to trainer |
| **Body fat % estimation** | US Navy formula (neck / waist / hip measurements); displayed alongside weight trend chart |
| **Caffeine tracker** | Log coffee, tea, and energy drinks; daily caffeine total; advisory cutoff warning after 2 pm |

### 14.3 PT Portal Extensions (Phase 2)

| Feature | Description |
|---------|-------------|
| **Weekly nutrition check-in form** | Client submits a brief weekly self-assessment (hunger levels, energy, adherence); trainer reviews responses in the client detail panel |
| **Client compliance score** | Days on calorie target / total days tracked — displayed as a percentage in the trainer's client list |
| **Trainer macro template library** | Trainer saves reusable macro target presets (e.g. "Cutting protocol", "Maintenance") for rapid application across multiple clients |

### 14.4 Gamification

| Badge | Trigger Condition |
|-------|-------------------|
| Consistent Logger (7 days) | 7 consecutive days with at least one meal entry |
| Nutrition Disciple (30 days) | 30 consecutive days with at least one meal entry |
| Century Logger (100 days) | 100 consecutive days with at least one meal entry |
| Deficit Streak | 7 consecutive days with net calories under the daily target (weight loss goal only) |
| Macro Precision | All three macros within 5% of their target for one full day |

---

## 15. Open Questions & Future Considerations

| Item | Status | Notes |
|------|--------|-------|
| IFCT-2017 data licensing | ⚠️ Verify before launch | IFCT-2017 is a Government of India publication (NIN, Hyderabad). Confirm whether commercial use of the nutritional data tables is permitted, or whether a data licence or attribution is required. |
| `nameLocal` field population | Deferred — Phase 2 | Field is reserved in the schema (`null` at launch). Requires translator review for Tamil, Telugu, and Kannada accuracy before population. |
| Barcode scanner — packaged goods coverage | Deferred — Phase 2 | Open Food Facts India coverage is sparse for regional packaged goods. The curated IFCT-2017 library covers the large majority of typical unpackaged Indian daily meals at MVP. |
| Recipe builder for composite dishes | Deferred — Phase 2 | At MVP, composite dishes (e.g. "Sambar per katori") are pre-calculated single entries based on IFCT-2017 standard preparation. Phase 2 adds a full ingredient-based recipe builder with per-100g output. |
| PT suggestion vs user-set target — conflict resolution | **Resolved** | An accepted PT suggestion always overrides the user's calculated targets. The user can revert to their own calculated targets at any time via Settings → Nutrition → "Use My Calculated Targets". |
| CouchDB provisioning for `fitforge_nutrition` | Implementation detail — Sprint 1 | Add `{userId}_fitforge_nutrition` to the list of databases created by the existing `/api/auth/provision-couch` route. |
| Sharing revocation and historical PT suggestion documents | **Resolved** | Revocation removes read access. Historical `nutrition_suggestion` documents remain in the shared CouchDB database but become inaccessible to the trainer immediately upon revocation. No data is deleted. |
| Food search performance at scale | Monitor | In-memory filtering of 300 items is acceptable at MVP. If the library grows beyond ~1,000 items (Phase 2+), migrate to `PouchDB.find()` with a Mango index on `name` to avoid full in-memory scans. |
| Portion weight accuracy for restaurant and home-cooked dishes | Acknowledged limitation | IFCT-2017 values represent standard preparation. Restaurant portions and home recipes vary inherently. This limitation is common to all nutrition trackers and will be disclosed in the onboarding screen. |
| Weight log unit mismatch on unit preference change | Implementation detail | If user switches from kg to lbs (or vice versa), stored `weightKg` values are converted at display time — stored values in kg are never altered. |
