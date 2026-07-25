import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  LabelList,
} from 'recharts'
import Section from '../../components/Section'
import InsightList from '../../components/InsightList'
import { teamInsights, teamDimensions, teamTopPerformers, teamNarrative, positionLabel } from '../../lib/fifaAnalysis'

function percentileColor(p) {
  if (p >= 70) return '#4ade80'
  if (p >= 40) return '#f9c74f'
  return '#f87171'
}

export default function TeamsTab({ teamSummary, roster, gkProfiles }) {
  const [team, setTeam] = useState('Spain')

  const insights = useMemo(() => teamInsights(teamSummary), [teamSummary])
  const profile = useMemo(() => teamDimensions(teamSummary, team), [teamSummary, team])
  const topPerformers = useMemo(() => teamTopPerformers(roster, team), [roster, team])
  const narrative = useMemo(() => teamNarrative(teamSummary, roster, gkProfiles, team), [teamSummary, roster, gkProfiles, team])
  // Teams played 3-8 matches depending on how far they went, so per-match
  // rates are what's actually comparable here — raw totals would just
  // reward teams for advancing further, not for attacking/defending better.
  const perMatch = useMemo(
    () => teamSummary.map((t) => ({
      ...t,
      goalsForPerMatch: Number((t.goalsFor / t.matchesPlayed).toFixed(2)),
      goalsAgainstPerMatch: Number((t.goalsAgainst / t.matchesPlayed).toFixed(2)),
      shotsPerMatch: Number((t.shots / t.matchesPlayed).toFixed(1)),
    })),
    [teamSummary]
  )

  return (
    <div>
      <Section title="Goals for vs. against" subtitle="Every team's attack vs. defense record, per match — bubble size is shots taken per match">
        <div className="card">
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
              <XAxis type="number" dataKey="goalsForPerMatch" name="Goals for / match" stroke="#5a6272" fontSize={11} label={{ value: 'Goals for / match', position: 'insideBottom', offset: -10, fill: '#5a6272', fontSize: 11 }} />
              <YAxis type="number" dataKey="goalsAgainstPerMatch" name="Goals against / match" stroke="#5a6272" fontSize={11} label={{ value: 'Goals against / match', angle: -90, position: 'insideLeft', fill: '#5a6272', fontSize: 11 }} />
              <ZAxis type="number" dataKey="shotsPerMatch" range={[30, 300]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.team}</div>
                      <div>{d.wins}W-{d.draws}D-{d.losses}L · {d.goalsFor}-{d.goalsAgainst} over {d.matchesPlayed} matches</div>
                      <div>{d.goalsForPerMatch}-{d.goalsAgainstPerMatch} per match · {d.shotsPerMatch} shots/match, {d.shotsOnTargetPct}% on target</div>
                    </div>
                  )
                }}
              />
              <Scatter data={perMatch} fillOpacity={0.75}>
                {perMatch.map((t) => (
                  <Cell key={t.team} fill={t.goalsForPerMatch >= t.goalsAgainstPerMatch ? '#4ade80' : '#f87171'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section
        title="Team deep dive"
        subtitle="How one team stacks up across the field on every dimension the data can measure — e.g. what actually explains a team's run"
        action={
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            {teamSummary.map((t) => (
              <option key={t.team} value={t.team}>{t.team}</option>
            ))}
          </select>
        }
      >
        {profile && (
          <>
            <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 14 }}>
              {profile.stats.wins}W–{profile.stats.draws}D–{profile.stats.losses}L across {profile.stats.matchesPlayed} matches ·{' '}
              {profile.stats.goalsFor}–{profile.stats.goalsAgainst} goals · {profile.stats.playersUsed}/{profile.stats.squadSize} squad used
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }} className="two-col">
              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Percentile vs. all 48 teams</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={profile.dimensions} layout="vertical" margin={{ left: 10, right: 30 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} stroke="#5a6272" fontSize={11} />
                    <YAxis type="category" dataKey="label" stroke="#8b93a7" fontSize={11} width={90} />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null
                        const d = payload[0].payload
                        return (
                          <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6 }}>
                            <div style={{ fontWeight: 600 }}>{d.label}: {d.display}</div>
                            <div>Better than {d.percentile}% of teams</div>
                          </div>
                        )
                      }}
                    />
                    <Bar dataKey="percentile" radius={[0, 4, 4, 0]}>
                      {profile.dimensions.map((d) => (
                        <Cell key={d.key} fill={percentileColor(d.percentile)} />
                      ))}
                      <LabelList dataKey="display" position="right" fontSize={11} fill="var(--text-dim)" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Top on-pitch contributors (+/- per 90, min. 2 matches)</div>
                <table>
                  <thead>
                    <tr><th>Player</th><th>Pos</th><th>+/-/90</th><th>G</th><th>A</th></tr>
                  </thead>
                  <tbody>
                    {topPerformers.map((p) => (
                      <tr key={p.player_id}>
                        <td>{p.player}</td>
                        <td style={{ color: 'var(--text-dim)' }}>{positionLabel(p.primary_position)}</td>
                        <td>{p.plus_minus_per90.toFixed(2)}</td>
                        <td>{p.goals}</td>
                        <td>{p.assists}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <div style={{ marginTop: 14 }}>
          <InsightList insights={narrative} title={`Why ${team} finished the way they did`} />
        </div>
      </Section>

      <InsightList insights={insights} title="Cross-team insights" />
    </div>
  )
}
