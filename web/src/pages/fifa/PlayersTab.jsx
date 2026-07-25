import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import Section from '../../components/Section'
import InsightList from '../../components/InsightList'
import {
  plusMinusLeaders,
  conversionLeaders,
  defensiveWorkhorses,
  disciplineLeaders,
  ironMen,
  impactSubs,
  ageImpactCurve,
  playerInsights,
  fmtPct,
  positionLabel,
} from '../../lib/fifaAnalysis'

export default function PlayersTab({ roster }) {
  const pm = useMemo(() => plusMinusLeaders(roster), [roster])
  const conversion = useMemo(() => conversionLeaders(roster), [roster])
  const workhorses = useMemo(() => defensiveWorkhorses(roster), [roster])
  const discipline = useMemo(() => disciplineLeaders(roster), [roster])
  const iron = useMemo(() => ironMen(roster), [roster])
  const subs = useMemo(() => impactSubs(roster), [roster])
  const ageCurve = useMemo(() => ageImpactCurve(roster), [roster])
  const insights = useMemo(() => playerInsights(roster), [roster])

  return (
    <div>
      <Section title="Biggest on-pitch impact" subtitle="Team goal difference per 90 while the player was on the field, min. 3 matches">
        <PlayerTable
          rows={pm}
          columns={[
            { key: 'player', label: 'Player' },
            { key: 'team', label: 'Team' },
            { key: 'primary_position', label: 'Pos', fmt: positionLabel },
            { key: 'plus_minus_per90', label: '+/- per90', fmt: (v) => v.toFixed(2) },
            { key: 'plus_minus', label: '+/- total' },
            { key: 'goals', label: 'G' },
            { key: 'assists', label: 'A' },
          ]}
        />
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }} className="two-col">
        <Section title="Most clinical finishers" subtitle="Goals per shot, min. 8 shots">
          <PlayerTable
            rows={conversion}
            columns={[
              { key: 'player', label: 'Player' },
              { key: 'team', label: 'Team' },
              { key: 'goals', label: 'Goals' },
              { key: 'shots', label: 'Shots' },
              { key: 'goals_per_shot', label: 'Conv.', fmt: (v) => fmtPct(v * 100, 0) },
            ]}
          />
        </Section>

        <Section title="Defensive workhorses" subtitle="Tackles won + interceptions per 90, min. 3 nineties played">
          <PlayerTable
            rows={workhorses}
            columns={[
              { key: 'player', label: 'Player' },
              { key: 'team', label: 'Team' },
              { key: 'primary_position', label: 'Pos', fmt: positionLabel },
              { key: 'defActionsPer90', label: 'Def./90', fmt: (v) => v.toFixed(2) },
            ]}
          />
        </Section>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }} className="two-col">
        <Section title="Iron men" subtitle="Most minutes played, tournament-wide">
          <PlayerTable
            rows={iron}
            columns={[
              { key: 'player', label: 'Player' },
              { key: 'team', label: 'Team' },
              { key: 'minutes', label: 'Minutes', fmt: (v) => Math.round(v) },
              { key: 'games', label: 'Matches' },
            ]}
          />
        </Section>

        <Section title="Most cautioned" subtitle="Cards per 90, min. 3 nineties played">
          <PlayerTable
            rows={discipline}
            columns={[
              { key: 'player', label: 'Player' },
              { key: 'team', label: 'Team' },
              { key: 'primary_position', label: 'Pos', fmt: positionLabel },
              { key: 'cards_per90', label: 'Cards/90', fmt: (v) => v.toFixed(2) },
            ]}
          />
        </Section>
      </div>

      <Section title="Best super-subs" subtitle="Goal contributions per 90, players who only ever came off the bench (min. 3 sub appearances)">
        <PlayerTable
          rows={subs}
          columns={[
            { key: 'player', label: 'Player' },
            { key: 'team', label: 'Team' },
            { key: 'games_subs', label: 'Sub apps' },
            { key: 'goals_assists', label: 'G+A' },
            { key: 'gaPer90', label: 'G+A/90', fmt: (v) => v.toFixed(2) },
          ]}
        />
      </Section>

      <Section title="On-pitch impact by age" subtitle="Average +/- per 90, min. 3 matches played">
        <div className="card">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ageCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
              <XAxis dataKey="ageBand" stroke="#5a6272" fontSize={11} />
              <YAxis stroke="#5a6272" fontSize={11} />
              <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'var(--text-dim)' }}
                />
              <Bar dataKey="avgPlusMinusPer90" fill="#5b8cff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <InsightList insights={insights} />
    </div>
  )
}

function PlayerTable({ rows, columns }) {
  return (
    <div className="card">
      <table>
        <thead>
          <tr>{columns.map((c) => <th key={c.key}>{c.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.player_id}>
              {columns.map((c) => (
                <td key={c.key}>{c.fmt ? c.fmt(r[c.key]) : r[c.key]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
