import { useMemo } from 'react'
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import Section from '../../components/Section'
import InsightList from '../../components/InsightList'
import { gkLeaders, gkCleanSheetLeaders, gkInsights, fmtPct } from '../../lib/fifaAnalysis'

export default function GoalkeepersTab({ gkProfiles }) {
  const savePctLeaders = useMemo(() => gkLeaders(gkProfiles), [gkProfiles])
  const cleanSheetLeaders = useMemo(() => gkCleanSheetLeaders(gkProfiles), [gkProfiles])
  const insights = useMemo(() => gkInsights(gkProfiles), [gkProfiles])
  const eligible = useMemo(() => gkProfiles.filter((g) => g.gk_games >= 2), [gkProfiles])

  return (
    <div>
      <Section title="Shot-stopping vs. clean sheets" subtitle="Every keeper with 2+ games — bubble size is shots faced on target">
        <div className="card">
          <ResponsiveContainer width="100%" height={380}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
              <XAxis type="number" dataKey="gk_save_pct" name="Save %" domain={[0, 100]} stroke="#5a6272" fontSize={11} label={{ value: 'Save %', position: 'insideBottom', offset: -10, fill: '#5a6272', fontSize: 11 }} />
              <YAxis type="number" dataKey="gk_clean_sheets_pct" name="Clean sheet %" domain={[0, 100]} stroke="#5a6272" fontSize={11} label={{ value: 'Clean sheet %', angle: -90, position: 'insideLeft', fill: '#5a6272', fontSize: 11 }} />
              <ZAxis type="number" dataKey="gk_shots_on_target_against" range={[30, 260]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.player}</div>
                      <div>{d.team} · {d.gk_games} games</div>
                      <div>Save {fmtPct(d.gk_save_pct, 0)} · Clean sheets {fmtPct(d.gk_clean_sheets_pct, 0)}</div>
                    </div>
                  )
                }}
              />
              <Scatter data={eligible} fill="#ff8a5c" fillOpacity={0.75} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 32 }} className="two-col">
        <Section title="Best shot-stoppers" subtitle="Highest save %, min. 3 games">
          <GkTable
            rows={savePctLeaders}
            columns={[
              { key: 'player', label: 'Keeper' },
              { key: 'team', label: 'Team' },
              { key: 'gk_games', label: 'GP' },
              { key: 'gk_save_pct', label: 'Save %', fmt: (v) => fmtPct(v, 1) },
            ]}
          />
        </Section>

        <Section title="Most reliable clean sheets" subtitle="Highest clean-sheet %, min. 3 games">
          <GkTable
            rows={cleanSheetLeaders}
            columns={[
              { key: 'player', label: 'Keeper' },
              { key: 'team', label: 'Team' },
              { key: 'gk_clean_sheets', label: 'CS' },
              { key: 'gk_clean_sheets_pct', label: 'CS %', fmt: (v) => fmtPct(v, 0) },
            ]}
          />
        </Section>
      </div>

      <InsightList insights={insights} />
    </div>
  )
}

function GkTable({ rows, columns }) {
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
