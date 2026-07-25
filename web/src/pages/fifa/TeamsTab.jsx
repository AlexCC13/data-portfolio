import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import Section from '../../components/Section'
import InsightList from '../../components/InsightList'
import PitchView from '../../components/PitchView'
import { teamInsights, squadPitchMarkers, positionLabel } from '../../lib/fifaAnalysis'

export default function TeamsTab({ teamSummary, roster }) {
  const [team, setTeam] = useState('France')
  const [pitchMetric, setPitchMetric] = useState('plus_minus')
  const [hovered, setHovered] = useState(null)

  const insights = useMemo(() => teamInsights(teamSummary), [teamSummary])
  const teamRoster = useMemo(() => roster.filter((p) => p.team === team), [roster, team])
  const markers = useMemo(() => squadPitchMarkers(teamRoster, pitchMetric), [teamRoster, pitchMetric])
  const teamStats = teamSummary.find((t) => t.team === team)

  return (
    <div>
      <Section title="Goals for vs. against" subtitle="Every team's attack vs. defense record — bubble size is shots taken">
        <div className="card">
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
              <XAxis type="number" dataKey="goalsFor" name="Goals for" stroke="#5a6272" fontSize={11} label={{ value: 'Goals for', position: 'insideBottom', offset: -10, fill: '#5a6272', fontSize: 11 }} />
              <YAxis type="number" dataKey="goalsAgainst" name="Goals against" stroke="#5a6272" fontSize={11} label={{ value: 'Goals against', angle: -90, position: 'insideLeft', fill: '#5a6272', fontSize: 11 }} />
              <ZAxis type="number" dataKey="shots" range={[30, 300]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.team}</div>
                      <div>{d.wins}W-{d.draws}D-{d.losses}L · {d.goalsFor}-{d.goalsAgainst}</div>
                      <div>{d.shots} shots, {d.shotsOnTargetPct}% on target</div>
                    </div>
                  )
                }}
              />
              <Scatter data={teamSummary} fillOpacity={0.75}>
                {teamSummary.map((t) => (
                  <Cell key={t.team} fill={t.goalsFor >= t.goalsAgainst ? '#4ade80' : '#f87171'} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Squad pitch view" subtitle="A team's named squad laid out by position, sized and colored by a chosen metric — dim dots never featured">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <select value={team} onChange={(e) => setTeam(e.target.value)}>
                {teamSummary.map((t) => (
                  <option key={t.team} value={t.team}>{t.team}</option>
                ))}
              </select>
              <select value={pitchMetric} onChange={(e) => setPitchMetric(e.target.value)}>
                <option value="plus_minus">+/- impact</option>
                <option value="minutes">Minutes played</option>
                <option value="goals">Goals</option>
                <option value="assists">Assists</option>
              </select>
            </div>
            {teamStats && (
              <div style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 10 }}>
                {teamStats.wins}W–{teamStats.draws}D–{teamStats.losses}L · {teamStats.goalsFor}–{teamStats.goalsAgainst} goals · {teamStats.playersUsed}/{teamStats.squadSize} squad used
              </div>
            )}
            {hovered && (
              <div style={{ fontSize: 13, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 10px' }}>
                <strong>{hovered.player.player}</strong> — {positionLabel(hovered.player.primary_position)}
                <br />
                {hovered.player.did_not_play
                  ? 'Named to squad, did not play'
                  : `+/- ${hovered.player.plus_minus} · ${hovered.player.goals}G ${hovered.player.assists}A · ${Math.round(hovered.player.minutes)} min`}
              </div>
            )}
          </div>
          <div className="card">
            <PitchView markers={markers} onMarkerHover={setHovered} />
          </div>
        </div>
      </Section>

      <InsightList insights={insights} />
    </div>
  )
}
