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
export function goalsByTeam(teamSummary, n = 15) {
  return [...teamSummary].sort((a, b) => b.goalsFor - a.goalsFor).slice(0, n)
}

export function disciplineByTeam(teamSummary, n = 15) {
  return [...teamSummary]
    .map((t) => ({ ...t, cardIndex: t.yellowCards + t.redCards * 3 }))
    .sort((a, b) => b.cardIndex - a.cardIndex)
    .slice(0, n)
}

export function overviewInsights(teamSummary, meta) {
  const topScoring = [...teamSummary].sort((a, b) => b.goalsFor - a.goalsFor)[0]
  const tightest = [...teamSummary].filter((t) => t.matchesPlayed >= 4).sort((a, b) => a.goalsAgainst / a.matchesPlayed - b.goalsAgainst / b.matchesPlayed)[0]
  const mostCleanSheets = [...teamSummary].sort((a, b) => b.cleanSheets - a.cleanSheets)[0]
  const avgSquadUsage = mean(teamSummary.map((t) => t.playersUsed / t.squadSize))

  return [
    `${topScoring.team} scored the most goals of any squad (${topScoring.goalsFor}) across ${topScoring.matchesPlayed} matches.`,
    `${tightest.team} had the tightest defense — just ${(tightest.goalsAgainst / tightest.matchesPlayed).toFixed(2)} goals conceded per match over ${tightest.matchesPlayed} games.`,
    `${mostCleanSheets.team} kept the most clean sheets (${mostCleanSheets.cleanSheets}).`,
    `On average, teams used ${fmtPct(avgSquadUsage * 100, 0)} of their 26-man squad — the rest never left the bench across the tournament.`,
    `${meta.totalGoals} goals from named goalscorers plus ${meta.totalOwnGoals} own goals gives the tournament's real total of ${meta.totalGoals + meta.totalOwnGoals}.`,
  ]
}

// ---------------------------------------------------------------------
// Team analysis
// ---------------------------------------------------------------------
export function teamInsights(teamSummary) {
  const byDiff = teamSummary.map((t) => ({ ...t, goalDiff: t.goalsFor - t.goalsAgainst }))
  const bestDiff = [...byDiff].sort((a, b) => b.goalDiff - a.goalDiff)[0]
  const bestWinRate = [...teamSummary].filter((t) => t.matchesPlayed >= 4).sort((a, b) => b.wins / b.matchesPlayed - a.wins / a.matchesPlayed)[0]
  const bestAccuracy = [...teamSummary].sort((a, b) => b.shotsOnTargetPct - a.shotsOnTargetPct)[0]
  const r = correlation(teamSummary.map((t) => [t.shots, t.goalsFor]))

  return [
    `${bestDiff.team} posted the best goal difference in the tournament (${bestDiff.goalDiff >= 0 ? '+' : ''}${bestDiff.goalDiff}: ${bestDiff.goalsFor} for, ${bestDiff.goalsAgainst} against).`,
    `${bestWinRate.team} had the best win rate among teams with 4+ matches — ${bestWinRate.wins} wins from ${bestWinRate.matchesPlayed} games (${fmtPct((bestWinRate.wins / bestWinRate.matchesPlayed) * 100, 0)}).`,
    `${bestAccuracy.team} were the most clinical with their shots on target, landing ${fmtPct(bestAccuracy.shotsOnTargetPct, 1)} of attempts on frame.`,
    `Shot volume and goals scored correlate at r=${r.toFixed(2)} across all 48 teams — ${r > 0.6 ? 'teams that shot more generally scored more, as expected' : 'shot volume alone is a moderate predictor of goals — quality of chances matters too'}.`,
  ]
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
export function plusMinusLeaders(roster, minGames = 3, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.games >= minGames)
    .sort((a, b) => b.plus_minus - a.plus_minus)
    .slice(0, n)
}

export function conversionLeaders(roster, minShots = 8, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.shots >= minShots)
    .sort((a, b) => b.goals_per_shot - a.goals_per_shot)
    .slice(0, n)
}

export function defensiveWorkhorses(roster, n = 10) {
  return roster
    .filter((p) => !p.did_not_play && p.primary_position !== 'GK')
    .sort((a, b) => b.def_actions - a.def_actions)
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
    pm ? `${pm.player} (${pm.team}) had the single biggest on-pitch impact — their team was ${pm.plus_minus >= 0 ? '+' : ''}${pm.plus_minus} goals better off while they played, more than any other outfield player.` : null,
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

// ---------------------------------------------------------------------
// Squad pitch view markers
// ---------------------------------------------------------------------
const PITCH_BANDS = { GK: 138, DF: 112, MF: 75, FW: 30 }

export function squadPitchMarkers(teamRoster, metricKey = 'plus_minus') {
  const byPosition = {}
  teamRoster.forEach((p) => {
    byPosition[p.primary_position] = byPosition[p.primary_position] || []
    byPosition[p.primary_position].push(p)
  })

  const values = teamRoster.map((p) => p[metricKey]).filter((v) => v != null && !Number.isNaN(v))
  const min = Math.min(...values, 0)
  const max = Math.max(...values, 1)
  const norm = (v) => (v == null || Number.isNaN(v) ? 0.5 : max === min ? 0.5 : (v - min) / (max - min))

  const markers = []
  Object.entries(byPosition).forEach(([code, players]) => {
    const y = PITCH_BANDS[code] ?? 75
    const sorted = [...players].sort((a, b) => (a.player > b.player ? 1 : -1))
    const n = sorted.length
    sorted.forEach((p, i) => {
      const x = n === 1 ? 50 : 8 + (84 * i) / (n - 1)
      const t = norm(p[metricKey])
      markers.push({
        id: p.player_id,
        x,
        y,
        r: p.did_not_play ? 1.6 : 2.2 + t * 2.2,
        color: p.did_not_play ? '#3a4152' : `rgb(${Math.round(91 + t * (248 - 91))}, ${Math.round(140 + t * (113 - 140))}, ${Math.round(255 + t * (113 - 255))})`,
        player: p,
      })
    })
  })
  return markers
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
