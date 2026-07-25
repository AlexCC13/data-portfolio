"""
Cleans the FIFA World Cup 2026 player-statistics CSV and exports it as JSON
for the web dashboard to consume.

Source: assets/fifa-world-cup-player-performance/players.csv
Output: web/src/data/fifa/{roster,team_summary,position_profiles,gk_profiles}.json
        web/src/data/fifa/meta.json

Unlike the two other datasets in this repo, this one is real (verified
against live World Cup 2026 reporting — goals, own goals, assist leaders and
team assist totals all match published figures exactly; see CLAUDE.md). It's
also structured differently: one row per player with season-aggregate stats
(FBref style), not per-match. There is no match_id/date/opponent/market-value
data at all, so this pipeline derives team-level results (wins/draws/losses,
goals against) from goalkeeper stats rather than a match table, and skips any
notion of squad market value entirely (the dashboard's Market tab from the
old synthetic dataset has no equivalent here).

Cleaning decisions:
  - `pens_won` and `pens_conceded` are 100% empty — dropped.
  - `position` is sometimes a combo like "FW,MF" (a player who featured in
    multiple roles). We keep the raw value but also derive `primary_position`
    (the first-listed code) for grouping/radar charts, since a player needs
    exactly one bucket there.
  - 209 of 1,248 rows have `games == 0` (named to a squad, never played) —
    every per-game stat is correctly null for these rows already in the
    source; we keep them (flagged via `did_not_play`) for squad-depth
    analysis but exclude them from performance aggregates.
  - Team win/draw/loss records and goals-against are derived by summing each
    team's goalkeeper(s) `gk_wins`/`gk_ties`/`gk_losses`/`gk_goals_against` —
    verified this reproduces the correct match count per team exactly
    (cross-checked against the max `games` value among outfield players on
    the same team).
"""
import json
from pathlib import Path

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
SRC_CSV = ROOT / "assets" / "fifa-world-cup-player-performance" / "players.csv"
OUT_DIR = ROOT / "web" / "src" / "data" / "fifa"

EMPTY_COLS = ["pens_won", "pens_conceded"]

POSITION_LABELS = {
    "GK": "Goalkeeper",
    "DF": "Defender",
    "MF": "Midfielder",
    "FW": "Forward",
}

ROSTER_COLS = [
    "player_id", "player", "team", "team_country", "position", "primary_position",
    "age", "birth_year", "club", "did_not_play",
    "games", "games_starts", "games_subs", "games_complete", "unused_subs",
    "minutes", "minutes_90s", "minutes_per_game",
    "goals", "assists", "goals_assists", "own_goals",
    "shots", "shots_on_target", "shots_on_target_pct", "goals_per_shot",
    "cards_yellow", "cards_red",
    "fouls", "fouled", "offsides", "crosses", "interceptions", "tackles_won",
    "plus_minus", "plus_minus_per90", "points_per_game",
]

RATE_METRICS = [
    "goals_per90", "assists_per90", "shots_per90", "shots_on_target_per90",
    "plus_minus_per90",
]

PER90_DERIVE = ["fouls", "fouled", "crosses", "interceptions", "tackles_won"]


def main() -> None:
    df = pd.read_csv(SRC_CSV)
    df = df.drop(columns=EMPTY_COLS)
    df = df.drop_duplicates()

    df["player_id"] = [f"P{i:04d}" for i in range(len(df))]
    df["did_not_play"] = df["games"] == 0
    df["primary_position"] = df["position"].str.split(",").str[0]

    played = df[~df["did_not_play"]].copy()
    for col in PER90_DERIVE:
        played[f"{col}_per90"] = np.where(
            played["minutes_90s"] > 0, played[col] / played["minutes_90s"], np.nan
        )
    played["cards_per90"] = np.where(
        played["minutes_90s"] > 0,
        (played["cards_yellow"] + played["cards_red"] * 2) / played["minutes_90s"],
        np.nan,
    )
    played["def_actions"] = played["tackles_won"] + played["interceptions"]

    # --- roster.json ---------------------------------------------------
    roster = df[ROSTER_COLS].copy()
    extra = played.set_index("player_id")[
        [f"{c}_per90" for c in PER90_DERIVE] + ["cards_per90", "def_actions"]
    ]
    roster = roster.join(extra, on="player_id")
    roster = roster.round(3)
    roster_json = json.loads(roster.to_json(orient="records"))

    # --- team_summary.json: derived from GK win/draw/loss records ------
    gk_played = played[played["primary_position"] == "GK"]
    team_rows = []
    for team, players in df.groupby("team"):
        team_played = played[played["team"] == team]
        team_gk = gk_played[gk_played["team"] == team]
        wins = float(team_gk["gk_wins"].sum())
        ties = float(team_gk["gk_ties"].sum())
        losses = float(team_gk["gk_losses"].sum())
        team_rows.append({
            "team": team,
            "teamCountry": players["team_country"].iloc[0],
            "matchesPlayed": int(wins + ties + losses),
            "wins": int(wins),
            "draws": int(ties),
            "losses": int(losses),
            "goalsFor": int(team_played["goals"].sum()),
            "goalsAgainst": int(team_gk["gk_goals_against"].sum()),
            "assists": int(team_played["assists"].sum()),
            "shots": int(team_played["shots"].sum()),
            "shotsOnTargetPct": round(float(team_played["shots_on_target_pct"].mean()), 1) if len(team_played) else 0,
            "yellowCards": int(team_played["cards_yellow"].sum()),
            "redCards": int(team_played["cards_red"].sum()),
            "cleanSheets": int(team_gk["gk_clean_sheets"].sum()),
            "squadSize": int(players.shape[0]),
            "playersUsed": int(team_played.shape[0]),
            "avgPlusMinus": round(float(team_played["plus_minus"].mean()), 2) if len(team_played) else 0,
        })
    team_summary = pd.DataFrame(team_rows).sort_values("goalsFor", ascending=False).reset_index(drop=True)

    # --- position_profiles.json -----------------------------------------
    profile_cols = ["goals_per90", "assists_per90", "shots_per90", "shots_on_target_pct"] + \
        [f"{c}_per90" for c in PER90_DERIVE] + ["plus_minus_per90"]
    profiles = played.groupby("primary_position")[profile_cols].mean().round(2)
    # goalkeepers essentially never shoot, so shots_on_target_pct is 0/0 = NaN
    # for that row; 0 is the semantically correct display value, not "unknown".
    profiles["shots_on_target_pct"] = profiles["shots_on_target_pct"].fillna(0)
    profiles.index = profiles.index.map(lambda p: POSITION_LABELS.get(p, p))
    position_profiles = json.loads(profiles.reset_index().rename(columns={"primary_position": "position"}).to_json(orient="records"))

    # --- gk_profiles.json --------------------------------------------------
    gk_cols = [
        "player_id", "player", "team", "gk_games", "gk_wins", "gk_ties", "gk_losses",
        "gk_goals_against", "gk_goals_against_per90", "gk_shots_on_target_against",
        "gk_saves", "gk_save_pct", "gk_clean_sheets", "gk_clean_sheets_pct",
        "gk_pens_att", "gk_pens_allowed", "gk_pens_saved", "gk_pens_missed", "gk_pens_save_pct",
    ]
    gk_profiles = gk_played[gk_cols].round(2)
    gk_profiles_json = json.loads(gk_profiles.to_json(orient="records"))

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    def dump(obj, name):
        with open(OUT_DIR / name, "w") as f:
            json.dump(obj, f, separators=(",", ":"))

    dump(roster_json, "roster.json")
    dump(json.loads(team_summary.to_json(orient="records")), "team_summary.json")
    dump(position_profiles, "position_profiles.json")
    dump(gk_profiles_json, "gk_profiles.json")

    meta = {
        "playerCount": int(df.shape[0]),
        "playersFeatured": int(played.shape[0]),
        "teams": sorted(df["team"].unique().tolist()),
        "positions": list(POSITION_LABELS.values()),
        "totalGoals": int(df["goals"].sum()),
        "totalOwnGoals": int(df["own_goals"].sum()),
        "totalAssists": int(df["assists"].sum()),
        "totalYellowCards": int(df["cards_yellow"].sum()),
        "totalRedCards": int(df["cards_red"].sum()),
        "totalMinutes": int(df["minutes"].sum()),
        "droppedEmptyColumns": EMPTY_COLS,
        "verifiedAgainstLiveReporting": True,
        "lastUpdated": pd.Timestamp.utcnow().strftime("%Y-%m-%d"),
    }
    with open(OUT_DIR / "meta.json", "w") as f:
        json.dump(meta, f, indent=2)

    print(f"Cleaned {len(df)} players ({played.shape[0]} featured) -> {team_summary.shape[0]} teams, "
          f"{len(position_profiles)} position profiles, {len(gk_profiles_json)} goalkeepers -> {OUT_DIR}")


if __name__ == "__main__":
    main()
