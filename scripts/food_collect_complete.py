#!/usr/bin/env python3
"""
FitForge — Food Collect Complete
=================================
Reads scripts/food-progress.json and copies all fully-processed items
(metadata: true) from output/foods/ into data/foods/.

Run after food_scraper.py finishes each phase:
  python scripts/food_collect_complete.py

Then regenerate the manifest:
  npx ts-node scripts/generate-food-manifest.ts
"""

import json
import shutil
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).parent.parent
SCRIPTS_DIR    = Path(__file__).parent
OUTPUT_DIR     = WORKSPACE_ROOT / "output" / "foods"
DATA_DIR       = WORKSPACE_ROOT / "data" / "foods"
PROGRESS_FILE  = SCRIPTS_DIR / "food-progress.json"


def main() -> None:
    if not PROGRESS_FILE.exists():
        print("[collect] No food-progress.json found — run food_scraper.py first.")
        return

    with open(PROGRESS_FILE, "r", encoding="utf-8") as f:
        progress: dict = json.load(f)

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    total   = len(progress)
    complete = 0
    copied  = 0
    already = 0
    missing = 0

    for key, entry in progress.items():
        if not entry.get("metadata"):
            continue
        complete += 1

        food_id = entry.get("id")
        if not food_id:
            continue

        src = OUTPUT_DIR / f"{food_id}.json"
        dst = DATA_DIR   / f"{food_id}.json"

        if not src.exists():
            print(f"  [WARN] Source file not found: {src}")
            missing += 1
            continue

        if dst.exists():
            already += 1
        else:
            shutil.copy2(src, dst)
            copied += 1
            print(f"  ✓  {food_id}.json  →  data/foods/")

    print()
    print(f"Progress file : {total} tracked items")
    print(f"Complete      : {complete} (metadata: true)")
    print(f"Copied now    : {copied}")
    print(f"Already exist : {already}")
    print(f"Missing src   : {missing}")
    print()

    if copied > 0 or already > 0:
        total_in_data = sum(1 for _ in DATA_DIR.glob("F*.json"))
        print(f"data/foods/ now contains {total_in_data} food files.")
        print("Run:  npx ts-node scripts/generate-food-manifest.ts")


if __name__ == "__main__":
    main()
