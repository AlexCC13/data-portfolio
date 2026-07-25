"""
Cleans the raw Kaggle tech skill-scarcity CSV and exports it as JSON for the
web dashboard to consume.

Source: assets/tech-skills/skill-scarcity-index.csv
Output: web/src/data/skills/skills.json, web/src/data/skills/meta.json
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC_CSV = ROOT / "assets" / "tech-skills" / "skill-scarcity-index.csv"
OUT_DIR = ROOT / "web" / "src" / "data" / "skills"

NUMERIC_COLS = [
    "demand_count",
    "demand_pct",
    "median_days_open",
    "salary_premium_pct",
    "repost_rate_pct",
    "scarcity_score",
]


def main() -> None:
    df = pd.read_csv(SRC_CSV)

    df = df.drop_duplicates(subset=["snapshot_date", "category", "skill_name"]).copy()

    df["snapshot_date"] = pd.to_datetime(df["snapshot_date"], errors="coerce")
    df = df.dropna(subset=["snapshot_date", "category", "skill_name"])

    for col in NUMERIC_COLS:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # demand_count, demand_pct, repost_rate_pct, scarcity_score are always
    # present in the source; median_days_open and salary_premium_pct are
    # genuinely missing (skill wasn't tracked long enough / no salary data
    # posted that week) rather than zero, so we keep them as null rather
    # than imputing a misleading 0.
    df = df.dropna(subset=["demand_count", "demand_pct", "repost_rate_pct", "scarcity_score"])

    df["category"] = df["category"].str.strip()
    df["skill_name"] = df["skill_name"].str.strip()
    df["snapshot_date"] = df["snapshot_date"].dt.strftime("%Y-%m-%d")

    df = df.sort_values(["skill_name", "snapshot_date"]).reset_index(drop=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    records = json.loads(df.to_json(orient="records"))
    with open(OUT_DIR / "skills.json", "w") as f:
        json.dump(records, f, separators=(",", ":"))

    # skill_name is not globally unique: most skills are tracked separately
    # per role category (e.g. Python's scarcity among AI-tagged postings
    # differs from Data-tagged postings), so the real identity is the
    # (skill_name, category) pair.
    skill_category_pairs = (
        df[["skill_name", "category"]]
        .drop_duplicates()
        .sort_values(["skill_name", "category"])
        .to_dict(orient="records")
    )

    meta = {
        "categories": sorted(df["category"].unique().tolist()),
        "skills": sorted(df["skill_name"].unique().tolist()),
        "skillCategoryPairs": skill_category_pairs,
        "snapshotDates": sorted(df["snapshot_date"].unique().tolist()),
        "rowCount": len(df),
        "missingMedianDaysOpen": int(df["median_days_open"].isna().sum()),
        "missingSalaryPremium": int(df["salary_premium_pct"].isna().sum()),
        "lastUpdated": pd.Timestamp.utcnow().strftime("%Y-%m-%d"),
    }
    with open(OUT_DIR / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Cleaned {len(df)} rows -> {OUT_DIR}")


if __name__ == "__main__":
    main()
