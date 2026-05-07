#!/usr/bin/env python3
"""
FitForge Food Scraper
=====================
Sprint 1 — Phase 1 : IFCT-2017 Excel ingester  (no API calls, runs offline)
Sprint 2 — Phase 2 : Open Food Facts barcode fetcher  (rate-limited, 1 req/s)
Sprint 3 — Phase 3 : Anuvaad INDB Excel + Kaggle CSV ingester
                     Source A: https://www.anuvaad.org.in/indian-nutrient-databank/
                       Auto-downloads Anuvaad_INDB_2024.11.xlsx (~1,014 Indian recipes)
                     Source B: https://www.kaggle.com/datasets/batthulavinay/indian-food-nutrition
                       Processes Indian_Food_Nutrition_Processed.csv locally (250+ dishes)
                       (Kaggle login required to download — pass path via --kaggle)

Usage
-----
  python scripts/food_scraper.py --phase 1 --ifct path/to/IFCT2017.xlsx
  python scripts/food_scraper.py --phase 2
  python scripts/food_scraper.py --phase 3                          # INDB Excel only (auto-download)
  python scripts/food_scraper.py --phase 3 --indb path/to/Anuvaad_INDB_2024.11.xlsx
  python scripts/food_scraper.py --phase 3 --kaggle path/to/Indian_Food_Nutrition_Processed.csv
  python scripts/food_scraper.py --phase 3 --indb <path> --kaggle <path>  # both

Output
------
  output/foods/F{NNN}.json   — one file per food item
  scripts/food-progress.json — progress tracker (auto-generated)

After running, use food_collect_complete.py to copy finished items to
data/foods/, then run:
  npx ts-node scripts/generate-food-manifest.ts

Dependencies
------------
  pip install openpyxl requests
"""

import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

# ── Paths ────────────────────────────────────────────────────────────────────
WORKSPACE_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR    = Path(__file__).parent
OUTPUT_DIR     = WORKSPACE_ROOT / "output" / "foods"
DATA_DIR       = WORKSPACE_ROOT / "data" / "foods"
PROGRESS_FILE  = SCRIPTS_DIR / "food-progress.json"

# ── Valid category keys (docs/10 §7) ─────────────────────────────────────────
VALID_CATEGORIES = {
    "south-indian-staple", "rice-dish", "gravy-curry", "dry-dish",
    "north-indian-crossover", "breakfast-protein", "snack", "dairy",
    "beverage", "fruit", "vegetable", "pulse-grain", "sweet",
    "packaged-staple", "protein-meat-fish", "oil-condiment",
    "bread-bakery", "fast-food",
}

# ── IFCT-2017 food-group → FitForge category key ─────────────────────────────
# Keys are normalised to lowercase, stripped — handle spelling variants.
IFCT_GROUP_MAP: dict[str, str] = {
    "cereals and millets":                    "pulse-grain",
    "cereals & millets":                      "pulse-grain",
    "cereals":                                "pulse-grain",
    "millets":                                "pulse-grain",
    "starchy roots and other vegetables":     "vegetable",
    "starchy roots & other vegetables":       "vegetable",
    "starchy roots":                          "vegetable",
    "green leafy vegetables":                 "vegetable",
    "other vegetables":                       "vegetable",
    "vegetables":                             "vegetable",
    "fruits":                                 "fruit",
    "nuts and oil seeds":                     "oil-condiment",
    "nuts & oil seeds":                       "oil-condiment",
    "nuts":                                   "oil-condiment",
    "sugars and condiments":                  "oil-condiment",
    "sugars & condiments":                    "oil-condiment",
    "sugars":                                 "oil-condiment",
    "milk and milk products":                 "dairy",
    "milk & milk products":                   "dairy",
    "milk products":                          "dairy",
    "dairy":                                  "dairy",
    "egg":                                    "breakfast-protein",
    "eggs":                                   "breakfast-protein",
    "meat, poultry and marine fish":          "protein-meat-fish",
    "meat, poultry & marine fish":            "protein-meat-fish",
    "meat and poultry":                       "protein-meat-fish",
    "marine fish":                            "protein-meat-fish",
    "fish and shellfish":                     "protein-meat-fish",
    "fish & shellfish":                       "protein-meat-fish",
    "pulses and legumes":                     "pulse-grain",
    "pulses & legumes":                       "pulse-grain",
    "pulses":                                 "pulse-grain",
    "legumes":                                "pulse-grain",
    "prepared dishes":                        "gravy-curry",        # generic fallback
    "prepared dishes - south indian":         "south-indian-staple",
    "prepared dishes – south indian":         "south-indian-staple",
    "prepared dishes — south indian":         "south-indian-staple",
    "south indian dishes":                    "south-indian-staple",
    "south indian":                           "south-indian-staple",
    "prepared dishes - rice":                 "rice-dish",
    "prepared dishes – rice":                 "rice-dish",
    "prepared dishes — rice":                 "rice-dish",
    "rice dishes":                            "rice-dish",
    "prepared dishes - curry/gravy":          "gravy-curry",
    "prepared dishes – curry/gravy":          "gravy-curry",
    "prepared dishes — curry/gravy":          "gravy-curry",
    "curry and gravy dishes":                 "gravy-curry",
    "curries":                                "gravy-curry",
    "prepared dishes - dry dishes":           "dry-dish",
    "prepared dishes – dry dishes":           "dry-dish",
    "prepared dishes — dry dishes":           "dry-dish",
    "dry dishes":                             "dry-dish",
    "prepared dishes - north indian":         "north-indian-crossover",
    "prepared dishes – north indian":         "north-indian-crossover",
    "prepared dishes — north indian":         "north-indian-crossover",
    "north indian dishes":                    "north-indian-crossover",
    "north indian":                           "north-indian-crossover",
    "sweets and confectionery":               "sweet",
    "sweets & confectionery":                 "sweet",
    "sweets":                                 "sweet",
    "confectionery":                          "sweet",
    "beverages":                              "beverage",
    "snacks and namkeens":                    "snack",
    "snacks & namkeens":                      "snack",
    "snacks":                                 "snack",
    "namkeens":                               "snack",
    "fats and oils":                          "oil-condiment",
    "fats & oils":                            "oil-condiment",
    "fats":                                   "oil-condiment",
    "oils":                                   "oil-condiment",
    "bakery products":                        "bread-bakery",
    "bread and bakery":                       "bread-bakery",
    "bread & bakery":                         "bread-bakery",
}


# ── Portion lookup table ──────────────────────────────────────────────────────
# (category, keyword_in_food_name_lowercase) → (unit, weightGrams)
# Keywords checked in order; first match wins. Fallback to category default.
# NOTE: Recommend nutritionist review before Sprint 1 ships.

PORTION_TABLE: list[tuple[str, str, str, int]] = [
    # (category, name_keyword, unit, weightGrams)
    # South-Indian staples
    ("south-indian-staple", "idli",          "piece",  40),
    ("south-indian-staple", "dosa",          "piece",  80),
    ("south-indian-staple", "uttapam",       "piece", 100),
    ("south-indian-staple", "appam",         "piece",  60),
    ("south-indian-staple", "puttu",         "piece", 100),
    ("south-indian-staple", "idiyappam",     "piece",  80),
    ("south-indian-staple", "upma",          "katori", 150),
    ("south-indian-staple", "pongal",        "katori", 150),
    ("south-indian-staple", "semiya",        "katori", 150),
    # Rice dishes
    ("rice-dish",           "biryani",       "plate",  300),
    ("rice-dish",           "rice",          "katori", 150),
    # Gravies / curries
    ("gravy-curry",         "sambar",        "katori", 150),
    ("gravy-curry",         "rasam",         "katori", 150),
    # Breakfast protein
    ("breakfast-protein",   "egg",           "piece",   55),
    ("breakfast-protein",   "omelette",      "piece",   90),
    # Dairy
    ("dairy",               "milk",          "glass",  200),
    ("dairy",               "buttermilk",    "glass",  200),
    ("dairy",               "curd",          "katori", 100),
    ("dairy",               "ghee",          "tablespoon", 14),
    ("dairy",               "butter",        "tablespoon", 14),
    ("dairy",               "paneer",        "katori", 100),
    # Beverages
    ("beverage",            "coffee",        "glass",  150),
    ("beverage",            "tea",           "glass",  150),
    ("beverage",            "chai",          "glass",  150),
    ("beverage",            "juice",         "glass",  200),
    ("beverage",            "coconut water", "glass",  240),
    ("beverage",            "sugarcane",     "glass",  200),
    # Fruits
    ("fruit",               "banana",        "piece",  100),
    ("fruit",               "mango",         "katori", 100),
    ("fruit",               "apple",         "piece",  150),
    ("fruit",               "orange",        "piece",  130),
    ("fruit",               "watermelon",    "katori", 150),
    ("fruit",               "grapes",        "katori", 100),
    ("fruit",               "papaya",        "katori", 150),
    ("fruit",               "guava",         "piece",  100),
    # Oils / condiments
    ("oil-condiment",       "oil",           "tablespoon", 14),
    ("oil-condiment",       "ghee",          "tablespoon", 14),
    ("oil-condiment",       "butter",        "tablespoon", 14),
    # Bread / bakery
    ("bread-bakery",        "bread",         "piece",   30),
    ("bread-bakery",        "chapati",       "piece",   30),
    ("bread-bakery",        "roti",          "piece",   30),
    ("bread-bakery",        "parotta",       "piece",   80),
    ("bread-bakery",        "puri",          "piece",   30),
    # Sweets
    ("sweet",               "ladoo",         "piece",   50),
    ("sweet",               "halwa",         "katori",  80),
    ("sweet",               "payasam",       "katori", 100),
    ("sweet",               "kesari",        "katori",  80),
    # Fast food
    ("fast-food",           "",              "plate",  300),
    # Snacks
    ("snack",               "vada",          "piece",   40),
    ("snack",               "samosa",        "piece",   50),
    ("snack",               "bajji",         "piece",   30),
    ("snack",               "bonda",         "piece",   50),
]

# Category-level default portions (fallback when no keyword matches)
CATEGORY_DEFAULT_PORTION: dict[str, tuple[str, int]] = {
    "south-indian-staple":   ("piece",       80),
    "rice-dish":             ("katori",     150),
    "gravy-curry":           ("katori",     150),
    "dry-dish":              ("katori",     100),
    "north-indian-crossover":("katori",     150),
    "breakfast-protein":     ("piece",       55),
    "snack":                 ("katori",      30),
    "dairy":                 ("katori",     100),
    "beverage":              ("glass",      200),
    "fruit":                 ("katori",     100),
    "vegetable":             ("katori",     100),
    "pulse-grain":           ("katori",     100),
    "sweet":                 ("katori",      80),
    "packaged-staple":       ("gram",        30),
    "protein-meat-fish":     ("gram",       100),
    "oil-condiment":         ("tablespoon",  14),
    "bread-bakery":          ("piece",       30),
    "fast-food":             ("plate",      300),
}

VALID_UNITS = {"piece", "katori", "cup", "plate", "tablespoon", "glass", "gram"}


# ── Open Food Facts barcode list (Phase 2) ────────────────────────────────────
# Only barcodes confirmed to have full macro data in the OFF world database.
# Format: (barcode, target_category, expected_name_hint)
OFF_BARCODES: list[tuple[str, str, str]] = [
    ("8901725016838", "packaged-staple",  "Aashirvaad Superior MP Atta"),
    ("8909106052185", "beverage",         "Horlicks Classic Malt"),
    ("8901063162914", "snack",            "Britannia Marie Gold Biscuit"),
]

# ── Manual packaged food entries ──────────────────────────────────────────────
# Used when OFF has no macro data. Values sourced from product packaging / IFCT.
# Format matches FoodItem schema (all per 100 g, portion via lookup table).
MANUAL_PACKAGED_FOODS: list[dict] = [
    {
        "name": "Amul Butter",
        "category": "packaged-staple",
        "caloriesPer100g": 717.0,
        "proteinPer100g":  0.5,
        "carbsPer100g":    0.5,
        "fatPer100g":      80.0,
        "fiberPer100g":    0,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 14},
        "source": "manual",
    },
    {
        "name": "Amul Ghee",
        "category": "packaged-staple",
        "caloriesPer100g": 900.0,
        "proteinPer100g":  0.0,
        "carbsPer100g":    0.0,
        "fatPer100g":      99.5,
        "fiberPer100g":    0,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 14},
        "source": "manual",
    },
    {
        "name": "Bournvita Chocolate Malt Drink",
        "category": "beverage",
        "caloriesPer100g": 391.0,
        "proteinPer100g":  7.5,
        "carbsPer100g":    80.0,
        "fatPer100g":      3.5,
        "fiberPer100g":    1.5,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 20},
        "source": "manual",
    },
    {
        "name": "Maggi 2-Minute Masala Noodles",
        "category": "fast-food",
        "caloriesPer100g": 440.0,
        "proteinPer100g":  9.8,
        "carbsPer100g":    62.0,
        "fatPer100g":      16.1,
        "fiberPer100g":    2.5,
        "defaultPortion": {"unit": "plate", "weightGrams": 70},
        "source": "manual",
    },
    {
        "name": "MTR Sambar Powder",
        "category": "packaged-staple",
        "caloriesPer100g": 285.0,
        "proteinPer100g":  11.0,
        "carbsPer100g":    41.0,
        "fatPer100g":      9.0,
        "fiberPer100g":    15.0,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 10},
        "source": "manual",
    },
    {
        "name": "Fortune Sunflower Oil",
        "category": "oil-condiment",
        "caloriesPer100g": 900.0,
        "proteinPer100g":  0.0,
        "carbsPer100g":    0.0,
        "fatPer100g":      100.0,
        "fiberPer100g":    0,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 14},
        "source": "manual",
    },
    {
        "name": "Nestle Munch Chocolate Bar",
        "category": "snack",
        "caloriesPer100g": 515.0,
        "proteinPer100g":  5.6,
        "carbsPer100g":    63.0,
        "fatPer100g":      26.0,
        "fiberPer100g":    1.2,
        "defaultPortion": {"unit": "piece", "weightGrams": 20},
        "source": "manual",
    },
    {
        "name": "Complan Chocolate Drink Mix",
        "category": "beverage",
        "caloriesPer100g": 400.0,
        "proteinPer100g":  18.0,
        "carbsPer100g":    62.0,
        "fatPer100g":      7.0,
        "fiberPer100g":    0,
        "defaultPortion": {"unit": "tablespoon", "weightGrams": 25},
        "source": "manual",
    },
]


# ── Helpers ───────────────────────────────────────────────────────────────────

def load_progress() -> dict:
    if PROGRESS_FILE.exists():
        with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_progress(progress: dict) -> None:
    with open(PROGRESS_FILE, "w", encoding="utf-8") as f:
        json.dump(progress, f, indent=2)


def next_food_id() -> int:
    """Scan data/foods and output/foods for max numeric ID, return max+1."""
    max_id = 10  # F001–F010 already exist in data/foods
    for directory in [DATA_DIR, OUTPUT_DIR]:
        if not directory.exists():
            continue
        for fname in directory.iterdir():
            m = re.match(r"F(\d+)\.json", fname.name, re.IGNORECASE)
            if m:
                max_id = max(max_id, int(m.group(1)))
    return max_id + 1


def format_food_id(n: int) -> str:
    return f"F{n:03d}"


def lookup_portion(category: str, name: str) -> tuple[str, int]:
    name_lower = name.lower()
    for cat, keyword, unit, weight in PORTION_TABLE:
        if cat == category and keyword and keyword in name_lower:
            return (unit, weight)
    return CATEGORY_DEFAULT_PORTION.get(category, ("gram", 100))


def map_ifct_group(raw_group: str) -> str | None:
    normalised = raw_group.strip().lower()
    # Direct lookup
    if normalised in IFCT_GROUP_MAP:
        return IFCT_GROUP_MAP[normalised]
    # Partial match (IFCT editions sometimes have extra parentheticals)
    for key, cat in IFCT_GROUP_MAP.items():
        if key in normalised or normalised in key:
            return cat
    return None


def validate_food(item: dict) -> list[str]:
    """Return list of validation errors (empty = valid)."""
    errors: list[str] = []
    required = [
        "id", "name", "nameLocal", "category",
        "caloriesPer100g", "proteinPer100g", "carbsPer100g",
        "fatPer100g", "fiberPer100g", "defaultPortion",
        "altPortions", "source", "isCustom",
    ]
    for field in required:
        if field not in item:
            errors.append(f"missing field: {field}")
    if "category" in item and item["category"] not in VALID_CATEGORIES:
        errors.append(f"invalid category: {item['category']}")
    if "defaultPortion" in item:
        dp = item["defaultPortion"]
        if dp.get("unit") not in VALID_UNITS:
            errors.append(f"invalid portion unit: {dp.get('unit')}")
        if not isinstance(dp.get("weightGrams"), (int, float)) or dp["weightGrams"] <= 0:
            errors.append("defaultPortion.weightGrams must be positive number")
    return errors


def write_food(item: dict) -> Path:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / f"{item['id']}.json"
    with open(path, "w", encoding="utf-8") as f:
        json.dump(item, f, indent=2, ensure_ascii=False)
    return path


# ── Phase 1: IFCT-2017 Excel ingester ────────────────────────────────────────

# Columns we look for in each sheet (case-insensitive, strip whitespace).
# Maps FitForge field → list of possible IFCT column header fragments.
IFCT_COLUMN_PATTERNS: dict[str, list[str]] = {
    "name":             ["food name", "name of the food", "name"],
    "caloriesPer100g":  ["energy (kcal)", "energy_kcal", "energy", "calories", "kcal"],
    "proteinPer100g":   ["protein (g)", "protein_g", "protein"],
    "carbsPer100g":     ["total carbohydrate", "carbohydrate (g)", "carbohydrate_g",
                         "carbohydrate", "carbs"],
    "fatPer100g":       ["total fat", "fat (g)", "fat_g", "fat"],
    "fiberPer100g":     ["total dietary fibre", "dietary fibre", "fibre (g)",
                         "fibre_g", "fiber (g)", "fiber_g", "fiber", "fibre", "tdf"],
    "food_group":       ["food group", "group", "category"],
}


def _find_col(headers: list[str], patterns: list[str]) -> int | None:
    """Return column index for the first matching pattern, or None."""
    headers_lower = [h.strip().lower() for h in headers]
    for pattern in patterns:
        for i, h in enumerate(headers_lower):
            if pattern in h:
                return i
    return None


def _safe_float(val) -> float | None:
    if val is None or str(val).strip() in ("", "-", "–", "N/A", "n/a", "Tr", "tr"):
        return None
    try:
        return float(str(val).strip().replace(",", ""))
    except ValueError:
        return None


def phase1_ingest(ifct_path: str) -> None:
    try:
        import openpyxl
    except ImportError:
        print("ERROR: openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    wb = openpyxl.load_workbook(ifct_path, read_only=True, data_only=True)
    progress = load_progress()

    food_id_counter = next_food_id()
    total_written = 0
    total_skipped = 0
    total_errors  = 0

    print(f"[Phase 1] Loaded workbook: {ifct_path}")
    print(f"[Phase 1] Sheets found: {wb.sheetnames}")
    print(f"[Phase 1] Starting from ID: {format_food_id(food_id_counter)}")
    print()

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue

        # Find header row (first row that contains recognisable column names)
        header_row_idx = None
        headers: list[str] = []
        for row_idx, row in enumerate(rows[:5]):
            row_strs = [str(c).strip() if c is not None else "" for c in row]
            if any("name" in c.lower() or "food" in c.lower() for c in row_strs if c):
                header_row_idx = row_idx
                headers = row_strs
                break

        if header_row_idx is None:
            print(f"  [SKIP] Sheet '{sheet_name}' — no recognisable header row")
            continue

        # Resolve column indices
        col = {
            field: _find_col(headers, patterns)
            for field, patterns in IFCT_COLUMN_PATTERNS.items()
        }

        # Must have at minimum: name + calories + protein + carbs + fat
        required_cols = ["name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"]
        missing = [f for f in required_cols if col[f] is None]
        if missing:
            print(f"  [SKIP] Sheet '{sheet_name}' — missing columns: {missing}")
            print(f"         Headers found: {headers}")
            continue

        # Determine food group for this sheet
        # If there's a food_group column, we read it per row; otherwise use sheet name.
        group_col = col.get("food_group")

        print(f"  [Sheet] '{sheet_name}' — processing rows {header_row_idx + 2} onward")

        for row in rows[header_row_idx + 1:]:
            name_val = row[col["name"]] if col["name"] is not None else None
            if not name_val or str(name_val).strip() in ("", "–", "-"):
                continue

            name = str(name_val).strip()

            # Determine food group
            if group_col is not None and row[group_col]:
                raw_group = str(row[group_col]).strip()
            else:
                raw_group = sheet_name

            category = map_ifct_group(raw_group)
            if not category:
                # Unmapped group — log and use sheet name heuristic
                print(f"    [WARN] Unmapped group '{raw_group}' for '{name}' — defaulting to 'gravy-curry'")
                category = "gravy-curry"

            # Skip if already in progress
            progress_key = f"ifct:{sheet_name}:{name}"
            if progress_key in progress and progress[progress_key].get("metadata"):
                total_skipped += 1
                continue

            calories = _safe_float(row[col["caloriesPer100g"]])
            protein  = _safe_float(row[col["proteinPer100g"]])
            carbs    = _safe_float(row[col["carbsPer100g"]])
            fat      = _safe_float(row[col["fatPer100g"]])
            fiber_col = col.get("fiberPer100g")
            fiber    = _safe_float(row[fiber_col]) if fiber_col is not None else None

            # Skip rows with missing macro data
            if any(v is None for v in [calories, protein, carbs, fat]):
                print(f"    [SKIP] '{name}' — missing macro data")
                continue

            unit, weight_grams = lookup_portion(category, name)

            food_item = {
                "id":              format_food_id(food_id_counter),
                "name":            name,
                "nameLocal":       None,
                "category":        category,
                "caloriesPer100g": round(calories, 1),
                "proteinPer100g":  round(protein, 1),
                "carbsPer100g":    round(carbs, 1),
                "fatPer100g":      round(fat, 1),
                "fiberPer100g":    round(fiber, 1) if fiber is not None else 0,
                "defaultPortion": {
                    "unit":        unit,
                    "weightGrams": weight_grams,
                },
                "altPortions": [],
                "source":      "IFCT-2017",
                "isCustom":    False,
            }

            errors = validate_food(food_item)
            if errors:
                print(f"    [ERROR] '{name}': {errors}")
                total_errors += 1
                continue

            out_path = write_food(food_item)
            progress[progress_key] = {"id": food_item["id"], "metadata": True}
            save_progress(progress)

            print(f"    ✓  {food_item['id']}  {name}  [{category}]  → {out_path.name}")
            food_id_counter += 1
            total_written += 1

    wb.close()
    print()
    print(f"[Phase 1] Done — written: {total_written}, skipped: {total_skipped}, errors: {total_errors}")
    print(f"[Phase 1] Next available ID: {format_food_id(food_id_counter)}")


# ── Phase 3 constants ────────────────────────────────────────────────────────

INDB_EXCEL_URL = "https://www.anuvaad.org.in/wp-content/uploads/2020/07/Anuvaad_INDB_2024.11.xlsx"
INDB_EXCEL_CACHE = SCRIPTS_DIR / "Anuvaad_INDB_2024.11.xlsx"

# Column patterns for the Anuvaad INDB Excel (per-100g sheet).
# The workbook may have multiple sheets; we look for the one with food data.
INDB_COLUMN_PATTERNS: dict[str, list[str]] = {
    "name":             ["food_name", "recipe name", "dish name", "food name", "name"],
    "caloriesPer100g":  ["energy_kcal", "energy (kcal)", "energy (kcal) per 100", "calories",
                         "kcal per 100", "energy"],
    "proteinPer100g":   ["protein_g", "protein (g)", "protein per 100", "protein"],
    "carbsPer100g":     ["carb_g", "carbohydrate_g", "carbohydrate (g)", "carbohydrates (g)",
                         "total carbohydrate", "carbs", "carbohydrate"],
    "fatPer100g":       ["fat_g", "total fat (g)", "fat (g)", "fat per 100", "fat"],
    "fiberPer100g":     ["fibre_g", "fiber_g", "dietary fibre (g)", "dietary fiber (g)",
                         "fibre (g)", "fiber (g)", "fibre", "fiber"],
    "food_group":       ["primarysource", "food group", "recipe category", "category",
                         "cuisine", "group"],
    "serving_size":     ["serving size (g)", "serving size", "serving weight", "portion (g)"],
}

# INDB recipe category → FitForge category key
INDB_GROUP_MAP: dict[str, str] = {
    # South Indian
    "south indian":                    "south-indian-staple",
    "south indian breakfast":          "south-indian-staple",
    "south indian rice":               "rice-dish",
    "south indian curry":              "gravy-curry",
    "south indian snack":              "snack",
    "south indian sweet":              "sweet",
    # North Indian
    "north indian":                    "north-indian-crossover",
    "north indian bread":              "bread-bakery",
    "north indian curry":              "gravy-curry",
    "north indian rice":               "rice-dish",
    "north indian snack":              "snack",
    "north indian sweet":              "sweet",
    # Generic recipe groups used in INDB
    "rice dishes":                     "rice-dish",
    "rice":                            "rice-dish",
    "curry":                           "gravy-curry",
    "curries":                         "gravy-curry",
    "gravy":                           "gravy-curry",
    "dry dishes":                      "dry-dish",
    "dry":                             "dry-dish",
    "stir fry":                        "dry-dish",
    "breakfast":                       "south-indian-staple",
    "snacks":                          "snack",
    "snack":                           "snack",
    "sweets":                          "sweet",
    "sweet":                           "sweet",
    "dessert":                         "sweet",
    "desserts":                        "sweet",
    "beverages":                       "beverage",
    "beverage":                        "beverage",
    "drink":                           "beverage",
    "drinks":                          "beverage",
    "bread":                           "bread-bakery",
    "breads":                          "bread-bakery",
    "roti":                            "bread-bakery",
    "flatbread":                       "bread-bakery",
    "dal":                             "pulse-grain",
    "dals":                            "pulse-grain",
    "lentil":                          "pulse-grain",
    "lentils":                         "pulse-grain",
    "salad":                           "vegetable",
    "salads":                          "vegetable",
    "raita":                           "dairy",
    "chutney":                         "oil-condiment",
    "chutneys":                        "oil-condiment",
    "pickle":                          "oil-condiment",
    "street food":                     "fast-food",
    "fast food":                       "fast-food",
    # Pass-through for IFCT groups already in IFCT_GROUP_MAP
    **{k: v for k, v in IFCT_GROUP_MAP.items()},
}


def map_indb_group(raw_group: str) -> str | None:
    """Map an INDB/Kaggle category string to a FitForge category key."""
    normalised = raw_group.strip().lower()
    if normalised in INDB_GROUP_MAP:
        return INDB_GROUP_MAP[normalised]
    for key, cat in INDB_GROUP_MAP.items():
        if key in normalised or normalised in key:
            return cat
    # Try IFCT map as fallback
    return map_ifct_group(raw_group)


# Kaggle CSV column patterns  (Indian_Food_Nutrition_Processed.csv)
KAGGLE_COLUMN_PATTERNS: dict[str, list[str]] = {
    "name":             ["dish_name", "dish name", "food_name", "food name", "name"],
    "caloriesPer100g":  ["calories_per_100g", "calories per 100g", "energy (kcal)",
                         "energy_kcal", "calories"],
    "proteinPer100g":   ["protein_(g)", "protein (g)", "protein_g", "protein"],
    "carbsPer100g":     ["carbohydrates_(g)", "carbohydrates (g)", "carbohydrate_g",
                         "carbs_(g)", "carbs"],
    "fatPer100g":       ["fats_(g)", "fats (g)", "fat_(g)", "fat (g)", "fat_g", "fat"],
    "fiberPer100g":     ["fiber_(g)", "fiber (g)", "fibre_(g)", "fibre (g)",
                         "dietary_fiber", "fiber_g", "fiber"],
    "food_group":       ["category", "food_category", "dish_category", "cuisine",
                         "food_group", "group"],
}


# ── Phase 2: Open Food Facts barcode fetcher ──────────────────────────────────

OFF_API_URLS = [
    "https://world.openfoodfacts.org/api/v0/product/{barcode}.json",
    "https://in.openfoodfacts.org/api/v0/product/{barcode}.json",
]
OFF_HEADERS = {"User-Agent": "FitForge-FoodScraper/1.0 (fitforge@localhost)"}
MAX_RETRIES = 3
RETRY_DELAYS = [15, 30, 60]


def fetch_off_product(barcode: str) -> dict | None:
    """Fetch a single product from Open Food Facts. Returns raw product dict or None."""
    try:
        import requests
    except ImportError:
        print("ERROR: requests not installed. Run: pip install requests", file=sys.stderr)
        sys.exit(1)

    # Try world DB first, then India-specific subdomain
    for url_template in OFF_API_URLS:
        url = url_template.format(barcode=barcode)
        for attempt in range(MAX_RETRIES):
            try:
                resp = requests.get(url, headers=OFF_HEADERS, timeout=15)
                if resp.status_code == 200:
                    data = resp.json()
                    # v0 API: status == 1 means found
                    if data.get("status") == 1 and data.get("product"):
                        return data["product"]
                    else:
                        # Not found in this database, try next URL
                        break
                elif resp.status_code == 404:
                    # Not in this database, try next URL
                    break
                elif resp.status_code in (429, 500, 502, 503, 504):
                    delay = RETRY_DELAYS[min(attempt, len(RETRY_DELAYS) - 1)]
                    print(f"    [RETRY {attempt+1}/{MAX_RETRIES}] HTTP {resp.status_code} — waiting {delay}s")
                    time.sleep(delay)
                else:
                    print(f"    [WARN] barcode {barcode} — HTTP {resp.status_code} from {url}")
                    break
            except Exception as exc:
                print(f"    [ERROR] barcode {barcode} — {exc}")
                break

    print(f"    [NOT FOUND] barcode {barcode} — not in world or India OFF database")
    return None


def _extract_nutriment(product: dict, keys: list[str], scale: float = 1.0) -> float | None:
    nm = product.get("nutriments", {})
    for key in keys:
        val = nm.get(key) or nm.get(f"{key}_100g")
        if val is not None:
            try:
                return round(float(val) * scale, 1)
            except (ValueError, TypeError):
                continue
    return None


def phase2_write_manual(item_template: dict, food_id: str) -> dict:
    """Merge a MANUAL_PACKAGED_FOODS entry with required schema fields."""
    return {
        "id":        food_id,
        "nameLocal": None,
        "altPortions": [],
        "isCustom":  False,
        **item_template,
    }


def phase2_fetch() -> None:
    progress = load_progress()
    food_id_counter = next_food_id()
    total_written = 0
    total_skipped = 0
    total_errors  = 0

    print(f"[Phase 2] Starting Open Food Facts barcode fetch")
    print(f"[Phase 2] {len(OFF_BARCODES)} barcodes + {len(MANUAL_PACKAGED_FOODS)} manual entries")
    print()

    for barcode, target_category, name_hint in OFF_BARCODES:
        progress_key = f"off:{barcode}"

        if progress_key in progress and progress[progress_key].get("metadata"):
            print(f"  ✓  {barcode} ({name_hint}) — already fetched, skipping")
            total_skipped += 1
            continue

        print(f"  ↓  {barcode} ({name_hint})...")
        product = fetch_off_product(barcode)
        time.sleep(1.0)  # polite rate limiting

        if not product:
            progress[progress_key] = {"id": None, "metadata": False, "error": "not_found"}
            save_progress(progress)
            total_errors += 1
            continue

        # Extract fields
        name = (
            product.get("product_name_en")
            or product.get("product_name")
            or name_hint
        ).strip()

        calories = _extract_nutriment(product, ["energy-kcal", "energy_kcal", "energy-kcal_100g"])
        protein  = _extract_nutriment(product, ["proteins", "proteins_100g"])
        carbs    = _extract_nutriment(product, ["carbohydrates", "carbohydrates_100g"])
        fat      = _extract_nutriment(product, ["fat", "fat_100g"])
        fiber    = _extract_nutriment(product, ["fiber", "fiber_100g", "fibre", "fibre_100g"])

        if any(v is None for v in [calories, protein, carbs, fat]):
            print(f"    [SKIP] '{name}' — incomplete macro data")
            progress[progress_key] = {"id": None, "metadata": False, "error": "incomplete_macros"}
            save_progress(progress)
            total_errors += 1
            continue

        unit, weight_grams = lookup_portion(target_category, name)

        food_item = {
            "id":              format_food_id(food_id_counter),
            "name":            name,
            "nameLocal":       None,
            "category":        target_category,
            "caloriesPer100g": calories,
            "proteinPer100g":  protein,
            "carbsPer100g":    carbs,
            "fatPer100g":      fat,
            "fiberPer100g":    fiber if fiber is not None else 0,
            "defaultPortion": {
                "unit":        unit,
                "weightGrams": weight_grams,
            },
            "altPortions": [],
            "source":      "Open Food Facts",
            "isCustom":    False,
        }

        errors = validate_food(food_item)
        if errors:
            print(f"    [ERROR] '{name}': {errors}")
            progress[progress_key] = {"id": None, "metadata": False, "error": str(errors)}
            save_progress(progress)
            total_errors += 1
            continue

        out_path = write_food(food_item)
        progress[progress_key] = {"id": food_item["id"], "metadata": True}
        save_progress(progress)

        print(f"    ✓  {food_item['id']}  {name}  [{target_category}]  → {out_path.name}")
        food_id_counter += 1
        total_written += 1

    # ── Manual packaged food entries ──────────────────────────────────────────
    print()
    print("[Phase 2] Processing manual packaged food entries...")
    for template in MANUAL_PACKAGED_FOODS:
        progress_key = f"manual:{template['name']}"
        if progress_key in progress and progress[progress_key].get("metadata"):
            print(f"  ✓  {template['name']} — already written, skipping")
            total_skipped += 1
            continue

        food_item = phase2_write_manual(template, format_food_id(food_id_counter))
        errors = validate_food(food_item)
        if errors:
            print(f"    [ERROR] '{food_item['name']}': {errors}")
            total_errors += 1
            continue

        out_path = write_food(food_item)
        progress[progress_key] = {"id": food_item["id"], "metadata": True}
        save_progress(progress)

        print(f"    ✓  {food_item['id']}  {food_item['name']}  [{food_item['category']}]  → {out_path.name}")
        food_id_counter += 1
        total_written += 1

    print()
    print(f"[Phase 2] Done — written: {total_written}, skipped: {total_skipped}, errors: {total_errors}")


# ── Phase 3: Anuvaad INDB Excel ingester ─────────────────────────────────────

def _download_indb_excel() -> Path:
    """Download the Anuvaad INDB Excel if not already cached. Returns local path."""
    try:
        import requests
    except ImportError:
        print("ERROR: requests not installed. Run: pip install requests", file=sys.stderr)
        sys.exit(1)

    if INDB_EXCEL_CACHE.exists():
        print(f"[Phase 3] Using cached INDB Excel: {INDB_EXCEL_CACHE}")
        return INDB_EXCEL_CACHE

    print(f"[Phase 3] Downloading INDB Excel from {INDB_EXCEL_URL} ...")
    resp = requests.get(INDB_EXCEL_URL, headers={"User-Agent": "FitForge-FoodScraper/1.0"}, timeout=60)
    resp.raise_for_status()
    INDB_EXCEL_CACHE.write_bytes(resp.content)
    print(f"[Phase 3] Saved to {INDB_EXCEL_CACHE} ({len(resp.content) // 1024} KB)")
    return INDB_EXCEL_CACHE


def phase3_ingest_indb(indb_path: str | None) -> int:
    """
    Ingest the Anuvaad INDB Excel workbook.
    If indb_path is None, the file is auto-downloaded from anuvaad.org.in.
    Returns the next available food_id_counter after processing.
    """
    try:
        import openpyxl
    except ImportError:
        print("ERROR: openpyxl not installed. Run: pip install openpyxl", file=sys.stderr)
        sys.exit(1)

    excel_path = Path(indb_path) if indb_path else _download_indb_excel()
    progress = load_progress()
    food_id_counter = next_food_id()
    total_written = total_skipped = total_errors = 0

    wb = openpyxl.load_workbook(str(excel_path), read_only=True, data_only=True)
    print(f"[Phase 3 / INDB] Loaded: {excel_path}")
    print(f"[Phase 3 / INDB] Sheets: {wb.sheetnames}")
    print(f"[Phase 3 / INDB] Starting from ID: {format_food_id(food_id_counter)}")
    print()

    for sheet_name in wb.sheetnames:
        ws = wb[sheet_name]
        rows = list(ws.iter_rows(values_only=True))
        if not rows:
            continue

        # Locate header row (first 10 rows)
        header_row_idx = None
        headers: list[str] = []
        for row_idx, row in enumerate(rows[:10]):
            row_strs = [str(c).strip() if c is not None else "" for c in row]
            if any(
                any(p in s.lower() for p in ["name", "recipe", "dish", "energy", "calorie", "food_name", "food_code"])
                for s in row_strs if s
            ):
                header_row_idx = row_idx
                headers = row_strs
                break

        if header_row_idx is None:
            print(f"  [SKIP] Sheet '{sheet_name}' — no recognisable header row")
            continue

        col = {
            field: _find_col(headers, patterns)
            for field, patterns in INDB_COLUMN_PATTERNS.items()
        }

        required_cols = ["name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"]
        missing = [f for f in required_cols if col[f] is None]
        if missing:
            print(f"  [SKIP] Sheet '{sheet_name}' — missing columns: {missing}")
            print(f"         Headers found: {headers}")
            continue

        print(f"  [Sheet] '{sheet_name}' — processing rows {header_row_idx + 2} onward")

        for row in rows[header_row_idx + 1:]:
            name_val = row[col["name"]] if col["name"] is not None else None
            if not name_val or str(name_val).strip() in ("", "–", "-"):
                continue
            name = str(name_val).strip()

            # Determine food group
            group_col = col.get("food_group")
            if group_col is not None and row[group_col]:
                raw_group = str(row[group_col]).strip()
            else:
                raw_group = sheet_name

            category = map_indb_group(raw_group)
            if not category:
                print(f"    [WARN] Unmapped group '{raw_group}' for '{name}' — defaulting to 'gravy-curry'")
                category = "gravy-curry"

            progress_key = f"indb:{sheet_name}:{name}"
            if progress_key in progress and progress[progress_key].get("metadata"):
                total_skipped += 1
                continue

            calories = _safe_float(row[col["caloriesPer100g"]])
            protein  = _safe_float(row[col["proteinPer100g"]])
            carbs    = _safe_float(row[col["carbsPer100g"]])
            fat      = _safe_float(row[col["fatPer100g"]])
            fiber_col = col.get("fiberPer100g")
            fiber    = _safe_float(row[fiber_col]) if fiber_col is not None else None

            if any(v is None for v in [calories, protein, carbs, fat]):
                print(f"    [SKIP] '{name}' — missing macro data")
                continue

            # Use serving size from spreadsheet if available, else lookup table
            serving_col = col.get("serving_size")
            serving_g = _safe_float(row[serving_col]) if serving_col is not None else None
            if serving_g and serving_g > 0:
                unit, weight_grams = lookup_portion(category, name)
                weight_grams = int(round(serving_g))
            else:
                unit, weight_grams = lookup_portion(category, name)

            food_item = {
                "id":              format_food_id(food_id_counter),
                "name":            name,
                "nameLocal":       None,
                "category":        category,
                "caloriesPer100g": round(calories, 1),
                "proteinPer100g":  round(protein, 1),
                "carbsPer100g":    round(carbs, 1),
                "fatPer100g":      round(fat, 1),
                "fiberPer100g":    round(fiber, 1) if fiber is not None else 0,
                "defaultPortion": {
                    "unit":        unit,
                    "weightGrams": weight_grams,
                },
                "altPortions": [],
                "source":      "INDB-2024",
                "isCustom":    False,
            }

            errors = validate_food(food_item)
            if errors:
                print(f"    [ERROR] '{name}': {errors}")
                total_errors += 1
                continue

            out_path = write_food(food_item)
            progress[progress_key] = {"id": food_item["id"], "metadata": True}
            save_progress(progress)

            print(f"    ✓  {food_item['id']}  {name}  [{category}]  → {out_path.name}")
            food_id_counter += 1
            total_written += 1

    wb.close()
    print()
    print(f"[Phase 3 / INDB] Done — written: {total_written}, skipped: {total_skipped}, errors: {total_errors}")
    print(f"[Phase 3 / INDB] Next available ID: {format_food_id(food_id_counter)}")
    return food_id_counter


# ── Phase 3b: Kaggle CSV ingester ────────────────────────────────────────────

def phase3_ingest_kaggle(csv_path: str, food_id_counter: int) -> int:
    """
    Ingest Indian_Food_Nutrition_Processed.csv from Kaggle.
    Requires the file to be downloaded manually (Kaggle login needed).
    Returns the next available food_id_counter after processing.
    """
    import csv as csv_mod

    csv_file = Path(csv_path)
    if not csv_file.exists():
        print(f"[Phase 3 / Kaggle] ERROR: File not found: {csv_file}", file=sys.stderr)
        print("  Download from: https://www.kaggle.com/datasets/batthulavinay/indian-food-nutrition")
        return food_id_counter

    progress = load_progress()
    total_written = total_skipped = total_errors = 0

    print(f"[Phase 3 / Kaggle] Loading: {csv_file}")
    print(f"[Phase 3 / Kaggle] Starting from ID: {format_food_id(food_id_counter)}")
    print()

    with open(csv_file, "r", encoding="utf-8-sig") as f:
        reader = csv_mod.DictReader(f)
        raw_headers = reader.fieldnames or []
        print(f"  Columns: {raw_headers}")

        # Resolve column name mapping
        headers_lower = [h.strip().lower() for h in raw_headers]

        def _col_name(patterns: list[str]) -> str | None:
            for pattern in patterns:
                for i, h in enumerate(headers_lower):
                    if pattern in h:
                        return raw_headers[i]
            return None

        col = {field: _col_name(patterns) for field, patterns in KAGGLE_COLUMN_PATTERNS.items()}

        required_cols = ["name", "caloriesPer100g", "proteinPer100g", "carbsPer100g", "fatPer100g"]
        missing = [f for f in required_cols if col[f] is None]
        if missing:
            print(f"  [ERROR] Missing required columns: {missing}")
            print(f"          Raw headers: {raw_headers}")
            return food_id_counter

        for row_num, row in enumerate(reader, start=2):
            name = row.get(col["name"], "").strip() if col["name"] else ""
            if not name or name in ("-", "–"):
                continue

            # Determine category
            raw_group = row.get(col["food_group"] or "", "").strip() if col["food_group"] else ""
            category = map_indb_group(raw_group) if raw_group else None
            if not category:
                # Heuristic from dish name
                name_lower = name.lower()
                if any(k in name_lower for k in ["biryani", "pulao", "rice"]):
                    category = "rice-dish"
                elif any(k in name_lower for k in ["dosa", "idli", "uttapam", "appam", "upma", "pongal"]):
                    category = "south-indian-staple"
                elif any(k in name_lower for k in ["roti", "chapati", "paratha", "naan", "bread"]):
                    category = "bread-bakery"
                elif any(k in name_lower for k in ["curry", "masala", "gravy", "sabzi", "dal"]):
                    category = "gravy-curry"
                elif any(k in name_lower for k in ["ladoo", "halwa", "kheer", "payasam", "mithai"]):
                    category = "sweet"
                elif any(k in name_lower for k in ["tea", "coffee", "chai", "lassi", "juice", "milk"]):
                    category = "beverage"
                elif any(k in name_lower for k in ["samosa", "vada", "pakora", "bhaji", "chaat"]):
                    category = "snack"
                else:
                    category = "gravy-curry"  # generic fallback

            progress_key = f"kaggle:{name}"
            if progress_key in progress and progress[progress_key].get("metadata"):
                total_skipped += 1
                continue

            calories = _safe_float(row.get(col["caloriesPer100g"] or ""))
            protein  = _safe_float(row.get(col["proteinPer100g"] or ""))
            carbs    = _safe_float(row.get(col["carbsPer100g"] or ""))
            fat      = _safe_float(row.get(col["fatPer100g"] or ""))
            fiber    = _safe_float(row.get(col["fiberPer100g"] or "")) if col["fiberPer100g"] else None

            if any(v is None for v in [calories, protein, carbs, fat]):
                print(f"  [SKIP] Row {row_num} '{name}' — missing macro data")
                continue

            unit, weight_grams = lookup_portion(category, name)

            food_item = {
                "id":              format_food_id(food_id_counter),
                "name":            name,
                "nameLocal":       None,
                "category":        category,
                "caloriesPer100g": round(calories, 1),
                "proteinPer100g":  round(protein, 1),
                "carbsPer100g":    round(carbs, 1),
                "fatPer100g":      round(fat, 1),
                "fiberPer100g":    round(fiber, 1) if fiber is not None else 0,
                "defaultPortion": {
                    "unit":        unit,
                    "weightGrams": weight_grams,
                },
                "altPortions": [],
                "source":      "INDB-2024",
                "isCustom":    False,
            }

            errors = validate_food(food_item)
            if errors:
                print(f"  [ERROR] Row {row_num} '{name}': {errors}")
                total_errors += 1
                continue

            out_path = write_food(food_item)
            progress[progress_key] = {"id": food_item["id"], "metadata": True}
            save_progress(progress)

            print(f"  ✓  {food_item['id']}  {name}  [{category}]  → {out_path.name}")
            food_id_counter += 1
            total_written += 1

    print()
    print(f"[Phase 3 / Kaggle] Done — written: {total_written}, skipped: {total_skipped}, errors: {total_errors}")
    print(f"[Phase 3 / Kaggle] Next available ID: {format_food_id(food_id_counter)}")
    return food_id_counter


# ── CLI ───────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="FitForge Food Scraper — IFCT-2017 + Open Food Facts + Anuvaad INDB"
    )
    parser.add_argument(
        "--phase", type=int, choices=[1, 2, 3], required=True,
        help="1 = IFCT-2017 Excel, 2 = Open Food Facts barcodes, 3 = Anuvaad INDB / Kaggle CSV",
    )
    parser.add_argument(
        "--ifct", type=str, default=None,
        help="[Phase 1 only] Path to the IFCT-2017 Excel workbook (.xlsx)",
    )
    parser.add_argument(
        "--indb", type=str, default=None,
        help="[Phase 3] Path to Anuvaad INDB Excel (.xlsx). Omit to auto-download.",
    )
    parser.add_argument(
        "--kaggle", type=str, default=None,
        help="[Phase 3] Path to Indian_Food_Nutrition_Processed.csv from Kaggle.",
    )
    args = parser.parse_args()

    if args.phase == 1:
        if not args.ifct:
            parser.error("--ifct <path> is required for --phase 1")
        if not Path(args.ifct).exists():
            parser.error(f"IFCT file not found: {args.ifct}")
        phase1_ingest(args.ifct)

    elif args.phase == 2:
        phase2_fetch()

    elif args.phase == 3:
        if not args.indb and not args.kaggle:
            # Default: auto-download and process INDB Excel
            next_id = phase3_ingest_indb(None)
        else:
            next_id = next_food_id()
            if args.indb:
                if not Path(args.indb).exists():
                    parser.error(f"INDB file not found: {args.indb}")
                next_id = phase3_ingest_indb(args.indb)
            if args.kaggle:
                if not Path(args.kaggle).exists():
                    parser.error(f"Kaggle CSV not found: {args.kaggle}")
                phase3_ingest_kaggle(args.kaggle, next_id)


if __name__ == "__main__":
    main()
