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
import { rotationByTeam, rotationInsights } from '../../lib/fifaAnalysis'

export default function SquadDepthTab({ roster, teamSummary }) {
  const rotation = useMemo(() => rotationByTeam(roster, teamSummary), [roster, teamSummary])
  const insights = useMemo(() => rotationInsights(rotation), [rotation])

  const top10 = rotation.slice(0, 10)
  const bottom10 = [...rotation].sort((a, b) => a.coreStartersShare - b.coreStartersShare).slice(0, 10)

  return (
    <div>
      <Section
        title="Starting-XI reliance"
        subtitle="Share of a team's matches its average starter actually started — higher means a more settled lineup, lower means heavier rotation"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Most settled lineups</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={top10} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#5a6272" fontSize={11} />
                <YAxis type="category" dataKey="team" stroke="#8b93a7" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Bar dataKey="coreStartersShare" fill="#f87171" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Most rotated squads</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={bottom10} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#5a6272" fontSize={11} />
                <YAxis type="category" dataKey="team" stroke="#8b93a7" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Bar dataKey="coreStartersShare" fill="#38d9c4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <InsightList insights={insights} />
    </div>
  )
}
