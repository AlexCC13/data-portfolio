import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import Section from '../../components/Section'
import InsightList from '../../components/InsightList'
import PitchView from '../../components/PitchView'
import { radarData, computeMaxByMetric, positionInsights, pitchZonesForMetric, POSITION_COLORS } from '../../lib/fifaAnalysis'

const ZONE_METRIC_OPTIONS = [
  { key: 'goals_per90', label: 'Goals / 90' },
  { key: 'assists_per90', label: 'Assists / 90' },
  { key: 'tackles_won_per90', label: 'Tackles / 90' },
  { key: 'interceptions_per90', label: 'Interceptions / 90' },
  { key: 'crosses_per90', label: 'Crosses / 90' },
  { key: 'plus_minus_per90', label: '+/- per 90' },
]

export default function PositionsTab({ positionProfiles }) {
  const [zoneMetric, setZoneMetric] = useState('goals_per90')
  const maxByMetric = useMemo(() => computeMaxByMetric(positionProfiles), [positionProfiles])
  const radar = useMemo(() => radarData(positionProfiles, maxByMetric), [positionProfiles, maxByMetric])
  const insights = useMemo(() => positionInsights(positionProfiles), [positionProfiles])
  const zones = useMemo(() => pitchZonesForMetric(positionProfiles, zoneMetric, (v) => v.toFixed(2)), [positionProfiles, zoneMetric])

  return (
    <div>
      <Section title="Position archetypes" subtitle="Per-90 profile by position, each metric normalized to its own max so shapes are comparable">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radar} outerRadius="75%">
                <PolarGrid stroke="#232939" />
                <PolarAngleAxis dataKey="metric" stroke="#8b93a7" fontSize={10} />
                {Object.keys(POSITION_COLORS).map((pos) => (
                  <Radar key={pos} name={pos} dataKey={pos} stroke={POSITION_COLORS[pos]} fill={POSITION_COLORS[pos]} fillOpacity={0.15} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'var(--text-dim)' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Shots on target %</div>
            <ResponsiveContainer width="100%" height={340}>
              <BarChart data={positionProfiles}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="position" stroke="#5a6272" fontSize={11} />
                <YAxis stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, color: 'var(--text)' }}
                  labelStyle={{ color: 'var(--text)', fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: 'var(--text-dim)' }}
                />
                <Bar dataKey="shots_on_target_pct" radius={[4, 4, 0, 0]} fill="#5b8cff" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section
        title="Pitch heatmap by position"
        subtitle="Band opacity scales with the position's average value for the selected metric"
        action={
          <select value={zoneMetric} onChange={(e) => setZoneMetric(e.target.value)}>
            {ZONE_METRIC_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>{o.label}</option>
            ))}
          </select>
        }
      >
        <div className="card" style={{ maxWidth: 420, margin: '0 auto' }}>
          <PitchView zones={zones} height={520} />
        </div>
      </Section>

      <InsightList insights={insights} />
    </div>
  )
}
