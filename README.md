# Data Portfolio

A growing collection of interactive dashboards built from open datasets, cleaned and
visualized end to end. One React/Vite app, one GitHub Pages site, one page per dataset.

**Live site:** deployed via GitHub Pages (see Actions tab / repo settings for the URL)

## Projects

- **Global Country Rankings, 2000–2026** — happiness, human development, GDP, life
  expectancy, corruption, democracy, press freedom, peace and environmental performance for
  217 countries across 27 years.
- **Tech Skill Scarcity Index** — weekly job-posting snapshots tracking how hard 141 tech
  skills are to hire for across AI, data, devops, engineering, product and security roles.
- **FIFA World Cup 2026 — Player Performance** — real tournament data (verified against live
  reporting), six deep-dive tabs beyond results/top-scorer tables, plus a football-pitch
  visual for squad and position views.

## Structure

```
assets/                       raw source files, one subfolder per dataset
scripts/
  clean_rankings.py           cleans the country-rankings CSV
  clean_skills.py             cleans the tech-skills CSV
  clean_fifa.py                cleans the FIFA player-stats CSV
web/                           React + Vite app
  src/pages/                  one page per dataset (Home lists all of them)
    fifa/                     one tab component per FIFA dashboard view
  src/components/             shared chart/UI components (incl. PitchView, InsightList)
  src/lib/
    rankingsAnalysis.js       aggregation helpers for the rankings dataset
    skillsAnalysis.js         aggregation helpers for the skills dataset
    fifaAnalysis.js           aggregation + insight-sentence helpers for the FIFA dataset
  src/data/
    rankings/                 cleaned JSON for the rankings dataset (generated)
    skills/                   cleaned JSON for the skills dataset (generated)
    fifa/                     cleaned JSON for the FIFA dataset (generated)
```

Each dataset's page is lazy-loaded (`React.lazy`), so visiting the Home page or one
dashboard doesn't download the other dataset's JSON.

## Adding a new dataset/analysis

1. Add a subfolder under `assets/` with the raw file(s).
2. Write a cleaning script under `scripts/` (follow `clean_rankings.py` or `clean_skills.py`)
   that exports JSON into `web/src/data/<dataset>/`.
3. Add `web/src/lib/<dataset>Analysis.js` with aggregation helpers, and
   `web/src/pages/<Dataset>.jsx` for the dashboard.
4. Lazy-load the new page and add a route in `web/src/main.jsx`.
5. Add a card for it in `web/src/pages/Home.jsx`.

Note: if a dataset's categorical fields aren't globally unique on their own (e.g. the same
skill name showing up under multiple role categories in the skills dataset), key lookups on
the full combination of fields, not a single column — see `skillKey()` in
`skillsAnalysis.js` for the pattern.

## Local development

```bash
python3 scripts/clean_rankings.py
python3 scripts/clean_skills.py
python3 scripts/clean_fifa.py
cd web
npm install
npm run dev
```

## Deployment

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds the Vite app and
publishes it to GitHub Pages.
