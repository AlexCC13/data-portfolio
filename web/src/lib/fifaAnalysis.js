export function mean(arr) {
  const clean = arr.filter((v) => v != null && !Number.isNaN(v))
  if (!clean.length) return 0
  return clean.reduce((a, b) => a + b, 0) / clean.length
}

export function correlation(pairs) {
  const clean = pairs.filter(([x, y]) => x != null && y != null && !Number.isNaN(x) && !Number.isNaN(y))
  const n = clean.length
  if (n < 2) return 0
  const xs = clean.map((p) => p[0])
  const ys = clean.map((p) => p[1])
  const mx = mean(xs)
  const my = mean(ys)
  let cov = 0, vx = 0, vy = 0
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx
    const dy = ys[i] - my
    cov += dx * dy
    vx += dx * dx
    vy += dy * dy
  }
  if (vx === 0 || vy === 0) return 0
  return cov / Math.sqrt(vx * vy)
}

export function fmtPct(v, digits = 0) {
  return `${Number(v).toFixed(digits)}%`
}

export const POSITION_COLORS = {
  Goalkeeper: '#ff8a5c',
  Defender: '#5b8cff',
  Midfielder: '#38d9c4',
  Forward: '#f87171',
}

const POSITION_CODE_TO_LABEL = { GK: 'Goalkeeper', DF: 'Defender', MF: 'Midfielder', FW: 'Forward' }
export function positionLabel(code) {
  return POSITION_CODE_TO_LABEL[code] || code
}

// ---------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------
// Teams played anywhere from 3 to 8 matches depending on how far they went,
// so any raw total (goals, cards, shots, clean sheets) mechanically favors
// teams that played more matches — it's not a fair basis for ranking or
// correlating across teams. Every team-comparison metric below is a
// per-match (or already-a-percentage) rate instead.
export function goalsByTeam(teamSummary, n = 15) {
  return [...teamSummary]
    .map((t) => ({ ...t, goalsPerMatch: Number((t.goalsFor / t.matchesPlayed).toFixed(2)) }))
    .sort((a, b) => b.goalsPerMatch - a.goalsPerMatch)
    .slice(0, n)
}

export function disciplineByTeam(teamSummary, n = 15) {
  return [...teamSummary]
    .map((t) => ({ ...t, cardIndexPerMatch: Number(((t.yellowCards + t.redCards * 3) / t.matchesPlayed).toFixed(2)) }))
    .sort((a, b) => b.cardIndexPerMatch - a.cardIndexPerMatch)
    .slice(0, n)
}

export function overviewInsights(teamSummary, meta) {
  const topScoring = [...teamSummary].sort((a, b) => b.goalsFor / b.matchesPlayed - a.goalsFor / a.matchesPlayed)[0]
  const tightest = [...teamSummary].filter((t) => t.matchesPlayed >= 4).sort((a, b) => a.goalsAgainst / a.matchesPlayed - b.goalsAgainst / b.matchesPlayed)[0]
  const mostCleanSheets = [...teamSummary].sort((a, b) => b.cleanSheets / b.matchesPlayed - a.cleanSheets / a.matchesPlayed)[0]
  const avgSquadUsage = mean(teamSummary.map((t) => t.playersUsed / t.squadSize))

  return [
    `${topScoring.team} had the best scoring rate of any squad — ${(topScoring.goalsFor / topScoring.matchesPlayed).toFixed(2)} goals per match across ${topScoring.matchesPlayed} games.`,
    `${tightest.team} had the tightest defense — just ${(tightest.goalsAgainst / tightest.matchesPlayed).toFixed(2)} goals conceded per match over ${tightest.matchesPlayed} games.`,
    `${mostCleanSheets.team} kept a clean sheet in ${fmtPct((mostCleanSheets.cleanSheets / mostCleanSheets.matchesPlayed) * 100, 0)} of their matches (${mostCleanSheets.cleanSheets}/${mostCleanSheets.matchesPlayed}), the best rate of any team.`,
    `On average, teams used ${fmtPct(avgSquadUsage * 100, 0)} of their 26-man squad — the rest never left the bench across the tournament.`,
    `${meta.totalGoals} goals from named goalscorers plus ${meta.totalOwnGoals} own goals gives the tournament's real total of ${meta.totalGoals + meta.totalOwnGoals}.`,
  ]
}

// ---------------------------------------------------------------------
// Team analysis
// ---------------------------------------------------------------------
export function teamInsights(teamSummary) {
  const byDiff = teamSummary.map((t) => ({ ...t, goalDiffPerMatch: (t.goalsFor - t.goalsAgainst) / t.matchesPlayed }))
  const bestDiff = [...byDiff].sort((a, b) => b.goalDiffPerMatch - a.goalDiffPerMatch)[0]
  const bestWinRate = [...teamSummary].filter((t) => t.matchesPlayed >= 4).sort((a, b) => b.wins / b.matchesPlayed - a.wins / a.matchesPlayed)[0]
  const bestAccuracy = [...teamSummary].sort((a, b) => b.shotsOnTargetPct - a.shotsOnTargetPct)[0]
  const r = correlation(teamSummary.map((t) => [t.shots / t.matchesPlayed, t.goalsFor / t.matchesPlayed]))

  return [
    `${bestDiff.team} posted the best goal difference per match in the tournament (${bestDiff.goalDiffPerMatch >= 0 ? '+' : ''}${bestDiff.goalDiffPerMatch.toFixed(2)}/match: ${bestDiff.goalsFor} for, ${bestDiff.goalsAgainst} against over ${bestDiff.matchesPlayed} games).`,
    `${bestWinRate.team} had the best win rate among teams with 4+ matches — ${bestWinRate.wins} wins from ${bestWinRate.matchesPlayed} games (${fmtPct((bestWinRate.wins / bestWinRate.matchesPlayed) * 100, 0)}).`,
    `${bestAccuracy.team} were the most clinical with their shots on target, landing ${fmtPct(bestAccuracy.shotsOnTargetPct, 1)} of attempts on frame.`,
    `Shots and goals per match correlate at r=${r.toFixed(2)} across all 48 teams — ${r > 0.6 ? 'teams that shot more generally scored more, as expected' : 'shot volume alone is a moderate predictor of goals — quality of chances matters too'}.`,
  ]
}

// Percentile rank of `value` among `values`: share of the field this value
// is at or ahead of. `invert: true` for metrics where lower is better
// (goals against, cards) so "ahead of" still means "better than".
export function percentileRank(values, value, invert = false) {
  const n = values.length
  if (!n) return 0
  const beaten = invert ? values.filter((v) => v >= value).length : values.filter((v) => v <= value).length
  return Math.round((beaten / n) * 100)
}

export function teamDimensions(teamSummary, team) {
  const t = teamSummary.find((x) => x.team === team)
  if (!t) return null
  // Teams played 3-8 matches depending on how far they went, so every
  // dimension here is a per-match rate — comparing raw totals would just
  // reward playing more games, not playing better.
  const goalsPerMatch = t.goalsFor / t.matchesPlayed
  const concededPerMatch = t.goalsAgainst / t.matchesPlayed
  const cardsPerMatch = (t.yellowCards + t.redCards * 3) / t.matchesPlayed
  const cleanSheetRate = t.cleanSheets / t.matchesPlayed
  const winRate = t.matchesPlayed ? t.wins / t.matchesPlayed : 0

  const fieldGoalsPerMatch = teamSummary.map((x) => x.goalsFor / x.matchesPlayed)
  const fieldConcededPerMatch = teamSummary.map((x) => x.goalsAgainst / x.matchesPlayed)
  const fieldCardsPerMatch = teamSummary.map((x) => (x.yellowCards + x.redCards * 3) / x.matchesPlayed)
  const fieldCleanSheetRate = teamSummary.map((x) => x.cleanSheets / x.matchesPlayed)
  const fieldWinRate = teamSummary.map((x) => (x.matchesPlayed ? x.wins / x.matchesPlayed : 0))

  return {
    team,
    stats: t,
    winRate,
    cardsPerMatch,
    dimensions: [
      { key: 'attack', label: 'Attack', raw: goalsPerMatch, display: `${goalsPerMatch.toFixed(2)}/match`, percentile: percentileRank(fieldGoalsPerMatch, goalsPerMatch) },
      { key: 'defense', label: 'Defense', raw: concededPerMatch, display: `${concededPerMatch.toFixed(2)}/match`, percentile: percentileRank(fieldConcededPerMatch, concededPerMatch, true) },
      { key: 'efficiency', label: 'Shot efficiency', raw: t.shotsOnTargetPct, display: fmtPct(t.shotsOnTargetPct, 1), percentile: percentileRank(teamSummary.map((x) => x.shotsOnTargetPct), t.shotsOnTargetPct) },
      { key: 'discipline', label: 'Discipline', raw: cardsPerMatch, display: `${cardsPerMatch.toFixed(2)} cards/match`, percentile: percentileRank(fieldCardsPerMatch, cardsPerMatch, true) },
      { key: 'winRate', label: 'Win rate', raw: winRate, display: fmtPct(winRate * 100, 0), percentile: percentileRank(fieldWinRate, winRate) },
      { key: 'cleanSheets', label: 'Clean sheets', raw: cleanSheetRate, display: fmtPct(cleanSheetRate * 100, 0), percentile: percentileRank(fieldCleanSheetRate, cleanSheetRate) },
    ],
  }
}

// Ranked by per-90 impact rather than raw plus_minus, and requires 2+
// matches, so a single-substitute cameo can't outrank genuine contributors.
export function teamTopPerformers(roster, team, minGames = 2, n = 5) {
  return roster
    .filter((p) => p.team === team && !p.did_not_play && p.games >= minGames)
    .sort((a, b) => b.plus_minus_per90 - a.plus_minus_per90)
    .slice(0, n)
}

export function teamNarrative(teamSummary, roster, gkProfiles, team) {
  const profile = teamDimensions(teamSummary, team)
  if (!profile) return []
  const { stats, winRate, dimensions } = profile
  const ranked = [...dimensions].sort((a, b) => b.percentile - a.percentile)
  const strongest = ranked[0]
  const secondStrongest = ranked[1]
  const weakest = ranked[ranked.length - 1]

  const avgWinRate = mean(teamSummary.map((t) => (t.matchesPlayed ? t.wins / t.matchesPlayed : 0)))
  const top = teamTopPerformers(roster, team, 2, 1)[0]
  const keeper = gkProfiles.filter((g) => g.team === team).sort((a, b) => b.gk_games - a.gk_games)[0]

  const dimensionSentence = (d) => {
    switch (d.key) {
      case 'attack': return `their attack (${d.display}, better than ${d.percentile}% of the field)`
      case 'defense': return `their defense (${d.display}, better than ${d.percentile}% of the field)`
      case 'efficiency': return `their shot conversion (${d.display} of shots on target, better than ${d.percentile}% of the field)`
      case 'discipline': return `their discipline (${d.display}, cleaner than ${d.percentile}% of the field)`
      case 'winRate': return `their results (${d.display} win rate, better than ${d.percentile}% of the field)`
      case 'cleanSheets': return `their clean-sheet rate (${d.display} of matches, better than ${d.percentile}% of the field)`
      default: return ''
    }
  }

  const lines = [
    `${team} finished ${stats.wins}-${stats.draws}-${stats.losses} across ${stats.matchesPlayed} matches (${fmtPct(winRate * 100, 0)} win rate, vs a ${fmtPct(avgWinRate * 100, 0)} tournament average).`,
    `Their standout dimension was ${dimensionSentence(strongest)}${secondStrongest.percentile >= 70 ? `, closely followed by ${dimensionSentence(secondStrongest)}` : ''}.`,
  ]

  if (weakest.percentile <= 40 && weakest.key !== strongest.key) {
    lines.push(`Their most exposed area was ${dimensionSentence(weakest)}.`)
  }

  if (top) {
    lines.push(`${top.player} had the biggest per-90 impact on the team: ${top.plus_minus_per90 >= 0 ? '+' : ''}${top.plus_minus_per90.toFixed(2)} per 90 (${top.plus_minus >= 0 ? '+' : ''}${top.plus_minus} total across ${top.games} matches, ${top.goals}G ${top.assists}A).`)
  }

  if (keeper && keeper.gk_games >= 2) {
    lines.push(`${keeper.player} started in goal, posting a ${fmtPct(keeper.gk_save_pct, 1)} save rate and a ${fmtPct(keeper.gk_clean_sheets_pct, 0)} clean-sheet rate across ${keeper.gk_games} games.`)
  }

  return lines
}

// ---------------------------------------------------------------------
// Position archetypes
// ---------------------------------------------------------------------
export const RADAR_METRICS = [
  { key: 'goals_per90', label: 'Goals/90' },
  { key: 'assists_per90', label: 'Assists/90' },
  { key: 'shots_per90', label: 'Shots/90' },
  { key: 'crosses_per90', label: 'Crosses/90' },
  { key: 'interceptions_per90', label: 'Interceptions/90' },
  { key: 'tackles_won_per90', label: 'Tackles/90' },
]

export function radarData(positionProfiles, maxByMetric) {
  return RADAR_METRICS.map((m) => {
    const row = { metric: m.label }
    positionProfiles.forEach((p) => {
      // normalize each metric to 0-100 so wildly different scales (goals/90 vs crosses/90) share one axis
      row[p.position] = maxByMetric[m.key] ? Number(((p[m.key] / maxByMetric[m.key]) * 100).toFixed(1)) : 0
    })
    return row
  })
}

export function computeMaxByMetric(positionProfiles) {
  const out = {}
  RADAR_METRICS.forEach((m) => {
    out[m.key] = Math.max(...positionProfiles.map((p) => p[m.key] || 0))
  })
  return out
}

export function positionInsights(positionProfiles) {
  const byMetric = (key) => [...positionProfiles].sort((a, b) => b[key] - a[key])
  const topScorers = byMetric('goals_per90')[0]
  const topCreators = byMetric('assists_per90')[0]
  const topDefenders = byMetric('tackles_won_per90')[0]
  const topCrossers = byMetric('crosses_per90')[0]
  const gk = positionProfiles.find((p) => p.position === 'Goalkeeper')

  const assistLine = topCreators.position === topScorers.position
    ? `${topScorers.position}s also lead in assists per 90 (${topCreators.assists_per90}) — the most complete attacking output of any position, not just the most shots.`
    : `${topCreators.position}s lead in assists per 90 (${topCreators.assists_per90}), ahead of ${topScorers.position.toLowerCase()}s in the creative department.`

  return [
    `${topScorers.position}s score the most per 90 minutes (${topScorers.goals_per90}), as expected. ${assistLine}`,
    `${topDefenders.position}s make the most tackles per 90 (${topDefenders.tackles_won_per90}), while ${topCrossers.position}s deliver the most crosses (${topCrossers.crosses_per90}/90).`,
    gk ? `Goalkeepers average ${gk.fouled_per90.toFixed(2)} times fouled per 90 despite almost never touching the ball offensively — a reminder that most of their "fouled" count comes from being challenged during set pieces and crosses into the box.` : null,
  ].filter(Boolean)
}

// ---------------------------------------------------------------------
// Player scouting — deliberately skips raw top-scorer/top-assist tables
// (already well covered by mainstream World Cup coverage).
// ---------------------------------------------------------------------
// Raw plus_minus accumulates with more minutes played, so a player with 8
// matches has a structural edge over one with 3 regardless of quality —
// ranked by the per-90 rate instead, with the raw total kept for context.
export function plusMinusLeaders(roster, minGames = 3, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.games >= minGames)
    .sort((a, b) => b.plus_minus_per90 - a.plus_minus_per90)
    .slice(0, n)
}

export function conversionLeaders(roster, minShots = 8, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.shots >= minShots)
    .sort((a, b) => b.goals_per_shot - a.goals_per_shot)
    .slice(0, n)
}

// Raw def_actions favors players who simply played more minutes, so this
// ranks by the per-90 rate instead (already computed per player in
// clean_fifa.py) with a minimum-minutes floor to keep small samples out.
export function defensiveWorkhorses(roster, minMinutes90 = 3, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.primary_position !== 'GK' && p.minutes_90s >= minMinutes90)
    .map((p) => ({ ...p, defActionsPer90: p.tackles_won_per90 + p.interceptions_per90 }))
    .sort((a, b) => b.defActionsPer90 - a.defActionsPer90)
    .slice(0, n)
}

export function disciplineLeaders(roster, minMinutes90 = 3, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.minutes_90s >= minMinutes90)
    .sort((a, b) => b.cards_per90 - a.cards_per90)
    .slice(0, n)
}

export function ironMen(roster, n = 10) {
  return [...roster].filter((p) => !p.did_not_play).sort((a, b) => b.minutes - a.minutes).slice(0, n)
}

export function impactSubs(roster, minSubApps = 3, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.games_subs >= minSubApps && p.games_starts === 0 && p.minutes_90s > 0)
    .map((p) => ({ ...p, gaPer90: p.goals_assists / p.minutes_90s }))
    .sort((a, b) => b.gaPer90 - a.gaPer90)
    .slice(0, n)
}

export function ageImpactCurve(roster, minGames = 3) {
  const buckets = [
    { label: '17-20', min: 17, max: 20 },
    { label: '21-23', min: 21, max: 23 },
    { label: '24-26', min: 24, max: 26 },
    { label: '27-29', min: 27, max: 29 },
    { label: '30-32', min: 30, max: 32 },
    { label: '33+', min: 33, max: 99 },
  ]
  const eligible = roster.filter((p) => !p.did_not_play && p.games >= minGames)
  return buckets.map((b) => {
    const rows = eligible.filter((p) => p.age >= b.min && p.age <= b.max)
    return {
      ageBand: b.label,
      avgPlusMinusPer90: rows.length ? Number(mean(rows.map((p) => p.plus_minus_per90)).toFixed(2)) : 0,
      count: rows.length,
    }
  })
}

export function playerInsights(roster) {
  const pm = plusMinusLeaders(roster)[0]
  const conv = conversionLeaders(roster)[0]
  const iron = ironMen(roster)[0]
  const impact = impactSubs(roster)[0]

  return [
    pm ? `${pm.player} (${pm.team}) had the biggest per-90 on-pitch impact — their team was ${pm.plus_minus_per90 >= 0 ? '+' : ''}${pm.plus_minus_per90.toFixed(2)} goals better off per 90 minutes with them on, ahead of any other outfield player (${pm.plus_minus >= 0 ? '+' : ''}${pm.plus_minus} total across ${pm.games} matches).` : null,
    conv ? `${conv.player} (${conv.team}) was the most clinical finisher, converting ${fmtPct(conv.goals_per_shot * 100, 0)} of shots into goals (min. 8 shots).` : null,
    iron ? `${iron.player} (${iron.team}) played the most minutes of the tournament: ${Math.round(iron.minutes).toLocaleString()} across ${iron.games} matches, starting every one of them.` : null,
    impact ? `${impact.player} (${impact.team}) was the tournament's best "super-sub" — ${impact.goals_assists} goal contributions in just ${impact.games_subs} substitute appearances, never starting a match.` : null,
  ].filter(Boolean)
}

// ---------------------------------------------------------------------
// Squad depth & rotation
// ---------------------------------------------------------------------
export function rotationByTeam(roster, teamSummary) {
  const matchesByTeam = Object.fromEntries(teamSummary.map((t) => [t.team, t.matchesPlayed]))
  const byTeam = {}
  roster.forEach((p) => {
    byTeam[p.team] = byTeam[p.team] || []
    byTeam[p.team].push(p)
  })
  return Object.entries(byTeam).map(([team, players]) => {
    const matches = matchesByTeam[team] || 1
    const starters = players.filter((p) => p.games_starts > 0)
    const avgStarts = mean(starters.map((p) => p.games_starts))
    const unusedRate = mean(players.map((p) => p.unused_subs)) / matches
    return {
      team,
      matchesPlayed: matches,
      coreStartersShare: starters.length ? Number(((avgStarts / matches) * 100).toFixed(1)) : 0,
      unusedSubsRate: Number((unusedRate * 100).toFixed(1)),
      squadUsed: players.filter((p) => !p.did_not_play).length,
    }
  }).sort((a, b) => b.coreStartersShare - a.coreStartersShare)
}

export function rotationInsights(rotation) {
  const mostReliant = rotation[0]
  const mostRotated = [...rotation].sort((a, b) => a.coreStartersShare - b.coreStartersShare)[0]
  const avgUsed = mean(rotation.map((r) => r.squadUsed))

  return [
    `${mostReliant.team} relied most heavily on a settled XI — their starters averaged starting ${mostReliant.coreStartersShare}% of the team's matches.`,
    `${mostRotated.team} rotated the most, with starters appearing in just ${mostRotated.coreStartersShare}% of matches on average.`,
    `Across all 48 squads, teams used an average of ${avgUsed.toFixed(1)} of their 26 named players — about ${(26 - avgUsed).toFixed(0)} squad members per team never featured at all.`,
  ]
}

// ---------------------------------------------------------------------
// Goalkeepers
// ---------------------------------------------------------------------
export function gkLeaders(gkProfiles, minGames = 3, n = 10) {
  return gkProfiles.filter((g) => g.gk_games >= minGames).sort((a, b) => b.gk_save_pct - a.gk_save_pct).slice(0, n)
}

export function gkCleanSheetLeaders(gkProfiles, minGames = 3, n = 10) {
  return gkProfiles.filter((g) => g.gk_games >= minGames).sort((a, b) => b.gk_clean_sheets_pct - a.gk_clean_sheets_pct).slice(0, n)
}

export function gkInsights(gkProfiles) {
  const eligible = gkProfiles.filter((g) => g.gk_games >= 3)
  const bestSavePct = [...eligible].sort((a, b) => b.gk_save_pct - a.gk_save_pct)[0]
  const bestGA90 = [...eligible].sort((a, b) => a.gk_goals_against_per90 - b.gk_goals_against_per90)[0]
  const penSavers = gkProfiles.filter((g) => g.gk_pens_saved > 0).sort((a, b) => b.gk_pens_saved - a.gk_pens_saved)
  const r = correlation(eligible.map((g) => [g.gk_save_pct, g.gk_clean_sheets_pct]))

  return [
    `${bestSavePct.player} (${bestSavePct.team}) posted the best save percentage of any keeper with 3+ games: ${fmtPct(bestSavePct.gk_save_pct, 1)}.`,
    `${bestGA90.player} (${bestGA90.team}) conceded the fewest goals per 90 minutes (${bestGA90.gk_goals_against_per90.toFixed(2)}) among keepers with 3+ games.`,
    penSavers.length ? `${penSavers[0].player} (${penSavers[0].team}) saved the most penalties (${penSavers[0].gk_pens_saved}).` : `No goalkeeper saved more than one penalty across the tournament.`,
    `Save percentage and clean-sheet rate correlate at r=${r.toFixed(2)} among regular keepers — ${r > 0.5 ? 'shot-stopping ability tracks fairly closely with keeping clean sheets' : 'clean sheets depend on more than shot-stopping alone (defense in front of the keeper matters just as much)'}.`,
  ]
}

export function pitchZonesForMetric(positionProfiles, metricKey, formatFn = (v) => v) {
  const order = [
    { label: 'Forward', code: 'Forward', range: [2, 40] },
    { label: 'Midfielder', code: 'Midfielder', range: [40, 78] },
    { label: 'Defender', code: 'Defender', range: [78, 116] },
    { label: 'Goalkeeper', code: 'Goalkeeper', range: [116, 148] },
  ]
  const values = positionProfiles.map((p) => p[metricKey])
  const min = Math.min(...values)
  const max = Math.max(...values)
  return order.map(({ label, code, range }) => {
    const row = positionProfiles.find((p) => p.position === code)
    const t = max === min ? 0.5 : (row[metricKey] - min) / (max - min)
    return {
      label,
      yStart: range[0],
      yEnd: range[1],
      color: POSITION_COLORS[code],
      opacity: 0.25 + t * 0.5,
      value: row ? formatFn(row[metricKey]) : null,
    }
  })
}
