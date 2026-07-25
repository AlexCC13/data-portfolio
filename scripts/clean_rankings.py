"""
Cleans the raw Kaggle global country rankings CSV and exports it as JSON
for the web dashboard to consume.

Source: assets/global-country-rankings/global_country_rankings_2000_2026.csv
Output: web/src/data/rankings/rankings.json, web/src/data/rankings/meta.json
"""
import json
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC_CSV = ROOT / "assets" / "global-country-rankings" / "global_country_rankings_2000_2026.csv"
OUT_DIR = ROOT / "web" / "src" / "data" / "rankings"

RANK_COLUMNS = [
    "Happiness_Rank",
    "Global_Hunger_Rank",
    "Human_Development_Rank",
    "GDP_Per_Capita_Rank",
    "Life_Expectancy_Rank",
    "Corruption_Perception_Rank",
    "Democracy_Rank",
    "Gini_Rank",
    "Press_Freedom_Rank",
    "Global_Peace_Rank",
    "Environmental_Performance_Rank",
]

TIER_LABELS = {
    1: "High Income",
    2: "Upper-Middle Income",
    3: "Lower-Middle Income",
    4: "Low Income",
}


def main() -> None:
    df = pd.read_csv(SRC_CSV)

    df = df.drop_duplicates(subset=["Country", "Year"]).copy()

    for col in RANK_COLUMNS + ["Economic_Tier", "Year"]:
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")

    df = df.dropna(subset=["Country", "Year"] + RANK_COLUMNS)

    df["Country"] = df["Country"].str.strip()
    df["Region"] = df["Region"].str.strip()
    df["Economic_Tier_Label"] = df["Economic_Tier"].map(TIER_LABELS)

    max_rank = max(df[col].max() for col in RANK_COLUMNS)
    for col in RANK_COLUMNS:
        score_col = col.replace("_Rank", "_Score")
        df[score_col] = ((max_rank - df[col] + 1) / max_rank * 100).round(1)

    df = df.sort_values(["Country", "Year"]).reset_index(drop=True)

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    records = df.to_dict(orient="records")
    with open(OUT_DIR / "rankings.json", "w") as f:
        json.dump(records, f, separators=(",", ":"))

    meta = {
        "countries": sorted(df["Country"].unique().tolist()),
        "regions": sorted(df["Region"].unique().tolist()),
        "years": sorted(int(y) for y in df["Year"].unique().tolist()),
        "economicTiers": TIER_LABELS,
        "rankColumns": RANK_COLUMNS,
        "maxRank": int(max_rank),
        "rowCount": len(df),
        "lastUpdated": pd.Timestamp.utcnow().strftime("%Y-%m-%d"),
    }
    with open(OUT_DIR / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Cleaned {len(df)} rows -> {OUT_DIR}")


if __name__ == "__main__":
    main()
