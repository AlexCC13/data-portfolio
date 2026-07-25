import { useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts'
import Section from '../../components/Section'
import StatCard from '../../components/StatCard'
import InsightList from '../../components/InsightList'
import { goalsByTeam, disciplineByTeam, overviewInsights } from '../../lib/fifaAnalysis'

export default function OverviewTab({ meta, teamSummary }) {
  const topGoals = useMemo(() => goalsByTeam(teamSummary), [teamSummary])
  const topDiscipline = useMemo(() => disciplineByTeam(teamSummary), [teamSummary])
  const insights = useMemo(() => overviewInsights(teamSummary, meta), [teamSummary, meta])

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 28 }}>
        <StatCard label="Squad players" value={meta.playerCount.toLocaleString()} />
        <StatCard label="Players featured" value={meta.playersFeatured.toLocaleString()} sub={`of ${meta.playerCount} named`} />
        <StatCard label="Teams" value={meta.teams.length} />
        <StatCard label="Goals (+ own goals)" value={`${meta.totalGoals} + ${meta.totalOwnGoals}`} />
        <StatCard label="Assists" value={meta.totalAssists.toLocaleString()} />
        <StatCard label="Cards" value={`${meta.totalYellowCards}Y / ${meta.totalRedCards}R`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }} className="two-col">
        <Section title="Top scoring squads" subtitle="Total goals by team">
          <div className="card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topGoals} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" stroke="#5a6272" fontSize={11} />
                <YAxis type="category" dataKey="team" stroke="#8b93a7" fontSize={10} width={90} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'var(--text-dim)' }}
                />
                <Bar dataKey="goalsFor" name="Goals" fill="#5b8cff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="Roughest disciplinary records" subtitle="Discipline index = yellow cards + 3x red cards">
          <div className="card">
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={topDiscipline} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" stroke="#5a6272" fontSize={11} />
                <YAxis type="category" dataKey="team" stroke="#8b93a7" fontSize={10} width={90} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    const d = payload[0].payload
                    return (
                      <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6, color: 'var(--text)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.team}</div>
                        <div style={{ color: 'var(--text-dim)' }}>Index: {d.cardIndex} · {d.yellowCards} yellow, {d.redCards} red</div>
                      </div>
                    )
                  }}
                />
                <Bar dataKey="cardIndex" name="Discipline index" radius={[0, 4, 4, 0]}>
                  {topDiscipline.map((t) => (
                    <Cell key={t.team} fill={t.redCards > 0 ? '#f87171' : '#f9c74f'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, marginTop: 10, fontSize: 11, color: 'var(--text-faint)' }}>
              <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#f9c74f', marginRight: 5 }} />Yellow cards only</span>
              <span><span style={{ display: 'inline-block', width: 9, height: 9, borderRadius: 2, background: '#f87171', marginRight: 5 }} />At least one red card</span>
            </div>
          </div>
        </Section>
      </div>

      <InsightList insights={insights} />
    </div>
  )
}
