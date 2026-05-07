# 10 — Food Library Enrichment

> Single source of truth for building and maintaining the FitForge food database.
> For the diet module feature spec (UI, calculations, data model, PT integration), see [docs/09-diet-calorie-counter.md](09-diet-calorie-counter.md).

---

## 1. Overview

Both pipelines share the same versioned delta sync: the manifest `version` hash changes only when a food item changes, so app startup skips all fetches if the library is unchanged (sub-5 ms check).

---

## 2. Current State vs Target State

| Dimension | Current (10 files) | Target MVP (~300 files) | Target Phase 2 (300+ files) |
|---|---|---|---|
| **Volume** | 10 items | ~300 items | 300+ items |
| **Indian coverage** | ~0% (Western staples) | ~95% (IFCT-2017 sourced) | ~95% + localised names |
| **Schema fields** | 6 | 13 | 22 |
| **Macros tracked** | calories, protein, carbs, fat | + fiber | + sugar, sodium, iron, calcium, potassium |
| **Portion units** | `g` only | All 6 Indian units | All 6 + GI index |
| **Alternate portions** | None | `altPortions` array | `altPortions` + recipe builder |
| **Media** | None | None | Food photo (WebP) |
| **Data source** | Manual / unverified | IFCT-2017 + Open Food Facts | + USDA FDC micronutrients |
| **Schema match (Task 9 §6.2)** | ❌ Key names differ | ✅ Exact match | ✅ Superset |
| **Build pipeline** | ✅ Works | ✅ Works (unchanged) | ✅ Works (image hashes added) |

---

## 3. Sprint 0 — Schema Migration

Before running any scraper, the 10 existing files must be migrated to the canonical schema defined in `09-diet-calorie-counter.md §6.2`. The current files will break the `FoodItem` TypeScript interface used by the diet module.

### 3.1 Key Name Changes

| Old key | New key | Notes |
|---|---|---|
| `per100g.calories` | `caloriesPer100g` | Promoted to flat top-level field |
| `per100g.proteinG` | `proteinPer100g` | Promoted to flat top-level field |
| `per100g.carbsG` | `carbsPer100g` | Promoted to flat top-level field |
| `per100g.fatG` | `fatPer100g` | Promoted to flat top-level field |
| `defaultPortion.amount` | *(removed)* | Merged into `weightGrams` |
| `defaultPortion.unit` | `defaultPortion.unit` | Unchanged |
| `defaultPortion.weightG` | `defaultPortion.weightGrams` | Renamed |
| `category` (free text) | `category` (category key) | Must map to one of the 18 keys in §7 |

### 3.2 New Required Fields

| Field | Value for existing 10 items |
|---|---|
| `nameLocal` | `null` |
| `fiberPer100g` | `0` (unknown — verify against IFCT-2017 in S1) |
| `altPortions` | `[]` |
| `source` | `"manual"` |
| `isCustom` | `false` (unchanged) |

### 3.3 Migration Script

`scripts/migrate-food-schema.ts` — one-shot TypeScript script. Reads every `data/foods/F*.json`, transforms to canonical schema, writes in-place. Idempotent (detects already-migrated files).

```typescript
// scripts/migrate-food-schema.ts
// Run once:  npx ts-node scripts/migrate-food-schema.ts
// Idempotent — skips already-migrated files.

import * as fs from 'fs';
import * as path from 'path';

const foodsDir = path.join(process.cwd(), 'data', 'foods');
const files = fs.readdirSync(foodsDir).filter(f => f.endsWith('.json'));

const CATEGORY_MAP: Record<string, string> = {
  Protein:    'protein-meat-fish',
  Grains:     'pulse-grain',
  Dairy:      'dairy',
  Vegetables: 'vegetable',
  Fruits:     'fruit',
  Fats:       'oil-condiment',
  Beverages:  'beverage',
  Snacks:     'snack',
};

for (const file of files) {
  const filePath = path.join(foodsDir, file);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  // Already migrated — skip
  if ('caloriesPer100g' in raw) {
    console.log(`  ✓  ${file} already migrated — skipping`);
    continue;
  }

  const migrated = {
    id:              raw.id,
    name:            raw.name,
    nameLocal:       null,
    category:        CATEGORY_MAP[raw.category] ?? raw.category,
    caloriesPer100g: raw.per100g.calories,
    proteinPer100g:  raw.per100g.proteinG,
    carbsPer100g:    raw.per100g.carbsG,
    fatPer100g:      raw.per100g.fatG,
    fiberPer100g:    0,
    defaultPortion: {
      unit:        raw.defaultPortion.unit,
      weightGrams: raw.defaultPortion.weightG ?? raw.defaultPortion.amount,
    },
    altPortions: [],
    source:      'manual',
    isCustom:    false,
  };

  fs.writeFileSync(filePath, JSON.stringify(migrated, null, 2));
  console.log(`  ↻  ${file} migrated`);
}

console.log('\nMigration complete. Run generate-food-manifest.ts to verify.');
```

### 3.4 Verification

Confirm `public/data/food-manifest.json` shows `"count": 10` with no errors. This is the green light to proceed to Sprint 1.

---

## 4. Data Sources

### 4.1 Source Comparison

| Source | URL | Auth | Rate Limit | Best Use Case | Indian Coverage | Offline |
|---|---|---|---|---|---|---|
| IFCT-2017 | nin.res.in / data.gov.in | None (open govt data) | N/A — local file | All 300 MVP foods (Indian staples, cooked dishes, raw ingredients) | ⭐⭐⭐⭐⭐ | ✅ |
| USDA FoodData Central | api.nal.usda.gov/fdc/v1 | Free API key (self-register) | 3,600 req/hr | Phase 2 micronutrient enrichment (iron, calcium, potassium) | ⭐⭐ | ❌ |
| Open Food Facts | world.openfoodfacts.org/api/v2 | None | ~1 req/sec (polite) | Packaged / branded Indian goods (Amul, Aashirvaad, MTR) | ⭐⭐⭐ | ❌ |
| Nutritionix | trackapi.nutritionix.com/v2 | Free (500 req/day) | 500/day | Natural language queries — Phase 2 only | ⭐⭐⭐ | ❌ |

### 4.2 Primary Strategy

| Priority | Source | Covers |
|---|---|---|
| 1 — Foundation | IFCT-2017 CSV ingester | ~280 of the 300 foods — all unpackaged Indian food |
| 2 — Top-up | Open Food Facts | ~15–20 packaged/branded items (packaged-staple, some dairy) |
| 3 — Phase 2 only | USDA FoodData Central | Micronutrient enrichment pass |
| 4 — Phase 2 only | Nutritionix | Portion weight validation for composite dishes |

> **Decision rationale:** IFCT-2017 is a Government of India publication specifically covering Indian foods — the most accurate source for the target user base by design. No API calls, no rate limits, no monthly caps. The entire MVP food library can be ingested in a single local script run.

---

## 5. Scraper Architecture

### 5.1 File Layout

After running `food_collect_complete.py`, copy output into the FitForge workspace:

```
scripts/
  food_scraper.py
  food_collect_complete.py
  food-progress.json          # auto-generated, tracks per-item status
output/
  foods/                      # raw JSON output from scraper
  complete/foods/             # items where metadata: true
  food-images/                # WebP thumbnails (Phase 2 only)
data/
  foods/                      # final destination — committed to repo
```

### 5.2 `food_scraper.py` — Three Phases

**Phase 1: IFCT-2017 CSV Ingester (no API calls)**

1. Load the IFCT-2017 Excel workbook (`openpyxl`)
2. For each food row, map columns to FitForge fields (see §8.2)
3. Validate required fields are non-null
4. Assign next sequential `F{NNN}` ID — scan existing output files, pick `max(id) + 1`
5. Map IFCT food group to one of the 18 FitForge category keys (see §8.3)
6. Look up `defaultPortion` from the hard-coded portion table (see §8.4)
7. Write `output/foods/F{NNN}.json`

Fully idempotent — files already written are skipped. No rate cap needed — runs in one pass.

**Phase 2: Open Food Facts Fetcher (API calls, rate-limited)**

Fetches ~20 Indian packaged food barcodes from Open Food Facts. Rate: 1 req/sec. Progress-tracked in `food-progress.json`.

**Phase 3: Image Downloader (Phase 2, guarded flag)**

Downloads Open Food Facts product images for packaged items, converts to WebP via Pillow, saves to `output/food-images/F{NNN}.webp`. Skips items without a photo URL. Non-packaged Indian dish photos require a separate manual curation step or Spoonacular API.

### 5.3 `food_collect_complete.py`

Mirrors `collect_complete.py` exactly:

- Reads `food-progress.json`
- Copies all items where `metadata: true` (+ `image: true` for Phase 2) to `output/complete/foods/`
- Prints: total tracked / complete / incomplete

### 5.4 Safety Rules (inherited from exercise scraper)

| Rule | Implementation |
|---|---|
| Fully incremental | Check if `output/foods/F{NNN}.json` exists before writing |
| Safe to stop (Ctrl+C) | `food-progress.json` saved after every file write |
| Auto-ID assignment | Scan existing output files — `max(id) + 1` |
| JSON schema validation | Validate required fields before writing; print warning and skip on failure |
| Polite crawling | `time.sleep(1.0)` between Open Food Facts requests |
| Retry on 429 / 5xx | Exponential back-off (15 s → 30 s → 60 s), max 3 retries |

---

## 6. Target Schema

### 6.1 MVP Schema (matches `09-diet-calorie-counter.md §6.2` exactly)

All 13 fields are required at MVP. `fiberPer100g: 0` is acceptable when the value is genuinely unavailable — the field must not be omitted.

### 6.2 Phase 2 Enriched Schema (Sprint 3 target)

Phase 2 fields are additive — the manifest script and diet module remain forward-compatible. Fields absent at MVP are simply absent from the JSON; no `null` placeholders are required for Phase 2-only fields.

---

## 7. Food Category Coverage Plan

All nutritional data sourced from IFCT-2017 unless otherwise noted.

| # | Category Key | Representative Items | Target Count | Primary Source | Phase |
|---|---|---|---|---|---|
| 1 | `south-indian-staple` | Idli (plain/rava), Dosa (plain/masala/rava/set), Uttapam, Appam, Puttu, Idiyappam, Pongal (ven/sakkarai), Upma, Semiya upma | 20 | IFCT-2017 | MVP |
| 2 | `rice-dish` | Steamed rice (raw/boiled/parboiled), Curd rice, Lemon rice, Tomato rice, Sambar rice, Chicken biryani, Mutton biryani, Veg biryani | 15 | IFCT-2017 | MVP |
| 3 | `gravy-curry` | Sambar, Rasam, Kootu, Avial, Mor kuzhambu, Vatha kuzhambu, Keerai kootu, Egg curry, Chicken curry, Fish curry, Prawn curry | 20 | IFCT-2017 | MVP |
| 4 | `dry-dish` | Beans poriyal, Carrot poriyal, Cabbage poriyal, Potato roast, Cauliflower roast, Brinjal fry, Drumstick stir-fry | 15 | IFCT-2017 | MVP |
| 5 | `north-indian-crossover` | Chapati (plain/wheat), Dal tadka, Dal makhani, Paneer butter masala, Rajma, Chole, Aloo sabzi, Palak paneer | 15 | IFCT-2017 | MVP |
| 6 | `breakfast-protein` | Boiled egg (whole/white/yolk), Omelette (plain/masala), Egg bhurji, Scrambled eggs | 8 | IFCT-2017 | MVP |
| 7 | `snack` | Murukku, Sundal (groundnut/chickpea), Bajji (onion/plantain), Bonda, Medhu vada, Samosa, Mixture | 15 | IFCT-2017 | MVP |
| 8 | `dairy` | Full-fat milk, Toned milk, Curd (plain), Buttermilk, Paneer, Ghee, Butter, Whey protein | 12 | IFCT-2017 + Open Food Facts (branded) | MVP |
| 9 | `beverage` | Filter coffee (with/without sugar), Masala chai, Tender coconut water, Sugarcane juice | 10 | IFCT-2017 | MVP |
| 10 | `fruit` | Banana, Mango, Papaya, Guava, Sapota, Jackfruit, Pomegranate, Apple, Orange, Watermelon, Grapes | 20 | IFCT-2017 | MVP |
| 11 | `vegetable` | Onion, Tomato, Carrot, Beans, Cabbage, Spinach, Drumstick, Brinjal, Ladies finger, Bitter gourd | 20 | IFCT-2017 | MVP |
| 12 | `pulse-grain` | Toor dal (raw/cooked), Moong dal, Urad dal, Rajma, Chickpeas, Wheat flour, Rice flour, Rava | 15 | IFCT-2017 | MVP |
| 13 | `sweet` | Payasam (rice/vermicelli), Pongal (sakkarai), Halwa (carrot/sooji), Ladoo (besan/rava), Kesari, Mysore pak | 10 | IFCT-2017 | MVP |
| 14 | `packaged-staple` | Amul butter, Amul ghee, Aashirvaad atta, Horlicks, Bournvita, MTR sambar powder | 10 | Open Food Facts (barcodes) | MVP |
| 15 | `protein-meat-fish` | Chicken breast (raw/cooked), Chicken thigh, Rohu, Pomfret, Sardine, Seer fish (vanjaram), Mutton, Prawn | 20 | IFCT-2017 | MVP |
| 16 | `oil-condiment` | Groundnut oil, Coconut oil, Sunflower oil, Gingelly oil, Tamarind, Mustard seeds, Curry leaves | 10 | IFCT-2017 | MVP |
| 17 | `bread-bakery` | White bread (slice), Brown bread (slice), Parotta, Puri | 8 | IFCT-2017 + Open Food Facts | MVP |
| 18 | `fast-food` | Veg burger (approx), Restaurant masala dosa, Restaurant fried rice | 7 | Manual (IFCT-2017 estimated) | MVP |

**Total: ~300 items**

---

## 8. IFCT-2017 Ingestion Notes

### 8.1 Obtaining the Data

| Method | URL | Format |
|---|---|---|
| NIN official | https://www.nin.res.in/ifct.html | PDF + Excel |
| data.gov.in | Search "IFCT 2017" | CSV / Excel |

The workbook contains one sheet per food group. Each row is one food item. All values are per 100 g edible portion — no unit conversion needed.

### 8.2 Column Mapping

| IFCT-2017 Column | FitForge Field | Unit | Notes |
|---|---|---|---|
| Food Name (English) | `name` | — | Append preparation style if absent (e.g. "cooked", "raw") |
| Energy (kcal) | `caloriesPer100g` | kcal/100 g | |
| Protein (g) | `proteinPer100g` | g/100 g | |
| Total Carbohydrate (g) | `carbsPer100g` | g/100 g | |
| Total Fat (g) | `fatPer100g` | g/100 g | |
| Total Dietary Fibre (g) | `fiberPer100g` | g/100 g | Use `0` if column is blank |
| Food Group | `category` | — | Map via §8.3 |

### 8.3 Food Group → Category Key Mapping

| IFCT-2017 Food Group | FitForge Category Key |
|---|---|
| Cereals & Millets | `pulse-grain` |
| Starchy Roots & Other Vegetables | `vegetable` |
| Green Leafy Vegetables | `vegetable` |
| Other Vegetables | `vegetable` |
| Fruits | `fruit` |
| Nuts & Oil Seeds | `oil-condiment` |
| Sugars & Condiments | `oil-condiment` |
| Milk & Milk Products | `dairy` |
| Egg | `breakfast-protein` |
| Meat, Poultry & Marine Fish | `protein-meat-fish` |
| Pulses & Legumes | `pulse-grain` |
| Prepared Dishes — South Indian | `south-indian-staple` |
| Prepared Dishes — Rice | `rice-dish` |
| Prepared Dishes — Curry/Gravy | `gravy-curry` |
| Prepared Dishes — Dry Dishes | `dry-dish` |
| Prepared Dishes — North Indian | `north-indian-crossover` |
| Sweets & Confectionery | `sweet` |
| Beverages | `beverage` |
| Snacks & Namkeens | `snack` |
| Fats & Oils | `oil-condiment` |

### 8.4 Portion Weight Assignment

IFCT-2017 does not include portion weights. `defaultPortion` is assigned from a hard-coded lookup table in `food_scraper.py`, keyed on `(category, food_name_keyword)`.

> **Recommended:** Have the nutritionist review this lookup table before S1 ships to validate standard Indian portion weights.

### 8.5 Licensing

| Item | Status |
|---|---|
| IFCT-2017 authorship | National Institute of Nutrition (NIN), Hyderabad — Government of India / ICMR |
| Distribution model | Publicly available; free download; no paywall |
| Commercial use | ⚠️ Verify before launch — confirm whether commercial redistribution of the data tables requires a licence or attribution only |
| Recommended action | Add in app's About / Licenses screen: *"Nutritional data sourced from IFCT-2017, National Institute of Nutrition, Hyderabad, ICMR."* |

---

## 9. Sprint Plan

| Sprint | Name | Key Deliverables | Owner | Depends On | Estimate |
|---|---|---|---|---|---|
| S0 | Schema Migration | `scripts/migrate-food-schema.ts` written and executed; all 10 `data/foods/F*.json` files migrated to canonical schema; `generate-food-manifest.ts` confirms `count: 10` with no errors | Backend | Nothing | 0.5 day |
| S1 | IFCT-2017 Ingest | `food_scraper.py` Phase 1 (IFCT-2017 CSV ingester); F011–F~290 JSON files generated; `food_collect_complete.py`; files copied to `foods`; `generate-food-manifest.ts` confirms ~290 foods; 17 of 18 categories populated | Backend | S0 + IFCT-2017 file obtained | 2 days |
| S2 | Packaged Foods Top-Up | `food_scraper.py` Phase 2 (Open Food Facts barcode fetcher); `packaged-staple` complete (10 items); `dairy` branded items added (4 items); total manifest count ≥ 300 | Backend | S1 | 1 day |
| S3 | Phase 2 Enrichment + Images | `food_scraper.py` Phase 3 (image downloader → WebP); USDA FDC micronutrient pass (fiber, sodium, iron, calcium, potassium); `nameLocal` Tamil for top-50 most-used items; `generate-food-manifest.ts` updated to hash image files | Backend + Nutritionist review | S2 · after diet module MVP ships | 3–4 days |

### S1 Detailed Task Breakdown

| Task | Notes |
|---|---|
| Obtain IFCT-2017 Excel workbook | Download from NIN or data.gov.in |
| Confirm column headers | Sheet names vary between edition years — verify against §8.2 before running |
| Confirm food group → category mapping | Validate §8.3 covers all sheets in the workbook |
| Write Phase 1 ingester | Implement `food_scraper.py --phase 1` |
| Validate output | Spot-check 20 random items against IFCT-2017 source values |
| Nutritionist review | Spot-check 10 items per category for calorie/macro accuracy |
| Copy to workspace | Run `food_collect_complete.py` → copy to `foods` |
| Run manifest script | `npx ts-node scripts/generate-food-manifest.ts` — verify count, no TS errors |

---

## 10. Acceptance Criteria

The food library is ready for Task 9 Sprint 1 when **ALL** of the following pass:

- [ ] `scripts/migrate-food-schema.ts` exists and has been executed — no `per100g` wrapper key remains in any file
- [ ] `npx ts-node scripts/generate-food-manifest.ts` completes without errors
- [ ] `food-manifest.json` shows `count >= 300`
- [ ] Every `data/foods/F*.json` file contains all 13 required MVP fields: `id`, `name`, `nameLocal`, `category`, `caloriesPer100g`, `proteinPer100g`, `carbsPer100g`, `fatPer100g`, `fiberPer100g`, `defaultPortion`, `altPortions`, `source`, `isCustom`
- [ ] `defaultPortion.unit` is one of: `piece`, `katori`, `cup`, `plate`, `tablespoon`, `glass`, `gram`
- [ ] `category` is one of the 18 valid category keys defined in §7
- [ ] `south-indian-staple` has >= 20 items
- [ ] `rice-dish` has >= 15 items
- [ ] `protein-meat-fish` has >= 20 items
- [ ] At least 8 items across the library use a non-gram portion unit (validates Indian portion standards are applied)
- [ ] `packaged-staple` has >= 8 items with macro values cross-checked against product packaging
- [ ] No duplicate `id` values exist across all `F*.json` files
- [ ] `source` is present on every item (`"IFCT-2017"`, `"Open Food Facts"`, or `"manual"`)
- [ ] Task 9 Sprint 1 kick-off is unblocked

---

## 11. Open Questions

| Question | Status | Owner |
|---|---|---|
| IFCT-2017 licensing — is commercial use permitted, or is attribution-only sufficient? | ⚠️ Must resolve before launch | TBD |
| Who on the team can download the IFCT-2017 Excel workbook? | ⚠️ Must resolve before S1 | TBD |
| Is Open Food Facts India barcode coverage sufficient for `packaged-staple`, or should those ~10 items be manually curated? | Open | Backend |
| Should `fiberPer100g` accept `0` for genuinely unknown values, or `null \| number`? Task 9 TypeScript interface has it as `number` — `0` is the simplest forward-compatible choice. | Leaning `0` as `number` | Backend |
| Should the default portion lookup table (§8.4) be reviewed by the nutritionist before S1 ships? | Recommended | fitforge-nutritionist |
| `nameLocal` population (Tamil, Telugu, Kannada) — deferred to Phase 2 per Task 9 §15. Confirm Phase 2 scope and translator availability. | Deferred | TBD |
| Barcode scanner (Phase 2): Open Food Facts India coverage is sparse for regional packaged goods — should a manual override list be maintained alongside the scraper? | Deferred | TBD |
