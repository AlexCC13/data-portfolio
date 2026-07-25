import { useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  ZAxis,
} from 'recharts'
import data from '../data/skills/skills.json'
import meta from '../data/skills/meta.json'
import {
  CATEGORY_LABELS,
  categoryAverages,
  scarcityLeaderboard,
  abundantSkills,
  scarcityVsSalary,
  skillTrend,
  skillKey,
  risingSkills,
  demandShareByCategory,
} from '../lib/skillsAnalysis'
import Section from '../components/Section'
import StatCard from '../components/StatCard'

const CATEGORY_COLORS = {
  ai: '#5b8cff',
  data: '#38d9c4',
  devops: '#ff8a5c',
  engineering: '#c084fc',
  product: '#4ade80',
  security: '#f87171',
}

const firstSnapshot = meta.snapshotDates[0]
const lastSnapshot = meta.snapshotDates[meta.snapshotDates.length - 1]

const defaultPair = meta.skillCategoryPairs.find((p) => p.skill_name === 'Python') || meta.skillCategoryPairs[0]

export default function SkillScarcity() {
  const [snapshot, setSnapshot] = useState(lastSnapshot)
  const [skillPairKey, setSkillPairKey] = useState(skillKey(defaultPair.skill_name, defaultPair.category))

  const catAvg = useMemo(() => categoryAverages(data, snapshot), [snapshot])
  const scarce = useMemo(() => scarcityLeaderboard(data, snapshot), [snapshot])
  const abundant = useMemo(() => abundantSkills(data, snapshot), [snapshot])
  const scatter = useMemo(() => scarcityVsSalary(data, snapshot), [snapshot])
  const [skillName, skillCategory] = useMemo(() => {
    const pair = meta.skillCategoryPairs.find((p) => skillKey(p.skill_name, p.category) === skillPairKey)
    return [pair.skill_name, pair.category]
  }, [skillPairKey])
  const trend = useMemo(() => skillTrend(data, skillName, skillCategory), [skillName, skillCategory])
  const movers = useMemo(() => risingSkills(data, firstSnapshot, lastSnapshot), [])
  const demandShare = useMemo(() => demandShareByCategory(data, snapshot), [snapshot])

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Tech Skill Scarcity Index</h1>
        <p style={{ fontSize: 14, maxWidth: 720 }}>
          Weekly job-posting snapshots ({firstSnapshot} → {lastSnapshot}) tracking how hard {meta.skills.length} tech
          skills are to hire for — based on posting demand, time-to-fill, salary premiums and repost rates across
          AI, data, devops, engineering, product and security roles.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
        <StatCard label="Skills tracked" value={meta.skills.length} />
        <StatCard label="Categories" value={Object.keys(CATEGORY_LABELS).length} />
        <StatCard label="Weekly snapshots" value={meta.snapshotDates.length} />
        <StatCard label="Total records" value={meta.rowCount.toLocaleString()} />
        <StatCard label="Missing salary data" value={meta.missingSalaryPremium} sub="rows without a posted premium" />
      </div>

      <Section
        title="Scarcity & salary premium by category"
        subtitle={`Average scarcity score (0–100) and salary premium, ${snapshot}`}
        action={<SnapshotSelect value={snapshot} onChange={setSnapshot} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Avg. scarcity score</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catAvg} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} stroke="#5a6272" fontSize={12} />
                <YAxis type="category" dataKey="category" stroke="#8b93a7" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Bar dataKey="avgScarcity" radius={[0, 4, 4, 0]}>
                  {catAvg.map((c) => (
                    <Cell key={c.key} fill={CATEGORY_COLORS[c.key] || '#5b8cff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Avg. salary premium (%)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={catAvg.filter((c) => c.avgSalaryPremium != null)} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
                <XAxis type="number" stroke="#5a6272" fontSize={12} />
                <YAxis type="category" dataKey="category" stroke="#8b93a7" fontSize={12} width={90} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Bar dataKey="avgSalaryPremium" radius={[0, 4, 4, 0]}>
                  {catAvg.filter((c) => c.avgSalaryPremium != null).map((c) => (
                    <Cell key={c.key} fill={CATEGORY_COLORS[c.key] || '#5b8cff'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Does scarcity pay?" subtitle={`Scarcity score vs. salary premium per skill, ${snapshot} (each dot is a skill)`}>
        <div className="card">
          <ResponsiveContainer width="100%" height={360}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
              <XAxis type="number" dataKey="scarcity_score" name="Scarcity score" domain={[0, 100]} stroke="#5a6272" fontSize={11} label={{ value: 'Scarcity score', position: 'insideBottom', offset: -4, fill: '#5a6272', fontSize: 11 }} />
              <YAxis type="number" dataKey="salary_premium_pct" name="Salary premium %" stroke="#5a6272" fontSize={11} label={{ value: 'Salary premium %', angle: -90, position: 'insideLeft', fill: '#5a6272', fontSize: 11 }} />
              <ZAxis type="number" dataKey="demand_count" range={[30, 300]} name="Demand" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }}
                formatter={(value, name) => [value, name]}
                labelFormatter={() => ''}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null
                  const d = payload[0].payload
                  return (
                    <div style={{ background: '#161b26', border: '1px solid #232939', fontSize: 12, padding: 8, borderRadius: 6 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.skill_name}</div>
                      <div>Scarcity: {d.scarcity_score}</div>
                      <div>Salary premium: {d.salary_premium_pct}%</div>
                      <div>Postings: {d.demand_count}</div>
                    </div>
                  )
                }}
              />
              {Object.keys(CATEGORY_LABELS).map((cat) => (
                <Scatter key={cat} name={CATEGORY_LABELS[cat]} data={scatter.filter((r) => r.category === cat)} fill={CATEGORY_COLORS[cat]} fillOpacity={0.75} />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section title="Leaderboard" subtitle={`Most and least scarce skills, ${snapshot}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <SkillTable title="Hardest to hire" rows={scarce} highlight="scarcity_score" />
          <SkillTable title="Easiest to hire" rows={abundant} highlight="scarcity_score" />
        </div>
      </Section>

      <Section title="Biggest movers" subtitle={`Change in scarcity score, ${firstSnapshot} → ${lastSnapshot}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <MoversTable title="Rising scarcity" rows={movers.rising} positive />
          <MoversTable title="Falling scarcity" rows={movers.falling} positive={false} />
        </div>
      </Section>

      <Section
        title="Skill explorer"
        subtitle="How scarcity, demand and salary premium have moved week over week"
        action={<SkillSelect value={skillPairKey} onChange={setSkillPairKey} options={meta.skillCategoryPairs} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>
              {skillName} <span style={{ color: 'var(--text-faint)' }}>({CATEGORY_LABELS[skillCategory]})</span> — scarcity score & demand share (%)
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="snapshot_date" stroke="#5a6272" fontSize={10} />
                <YAxis stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="scarcity_score" name="Scarcity score" stroke="#5b8cff" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="demand_pct" name="Demand %" stroke="#38d9c4" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Salary premium % & repost rate %</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="snapshot_date" stroke="#5a6272" fontSize={10} />
                <YAxis stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="salary_premium_pct" name="Salary premium %" stroke="#ff8a5c" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                <Line type="monotone" dataKey="repost_rate_pct" name="Repost rate %" stroke="#f87171" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Demand share by category" subtitle={`Share of total job postings, ${snapshot}`}>
        <div className="card">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={demandShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(e) => `${e.name}`}>
                {demandShare.map((d, i) => (
                  <Cell key={d.name} fill={Object.values(CATEGORY_COLORS)[i % 6]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  )
}

function SnapshotSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {meta.snapshotDates.map((d) => (
        <option key={d} value={d}>{d}</option>
      ))}
    </select>
  )
}

function SkillSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((p) => {
        const key = skillKey(p.skill_name, p.category)
        return (
          <option key={key} value={key}>
            {p.skill_name} ({CATEGORY_LABELS[p.category] || p.category})
          </option>
        )
      })}
    </select>
  )
}

function SkillTable({ title, rows }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
      <table>
        <thead>
          <tr><th>Skill</th><th>Category</th><th>Scarcity</th><th>Salary +%</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={skillKey(r.skill_name, r.category)}>
              <td>{r.skill_name}</td>
              <td style={{ color: 'var(--text-dim)' }}>{CATEGORY_LABELS[r.category] || r.category}</td>
              <td>{r.scarcity_score}</td>
              <td>{r.salary_premium_pct != null ? `${r.salary_premium_pct}%` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function MoversTable({ title, rows, positive }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
      <table>
        <thead>
          <tr><th>Skill</th><th>Category</th><th>{firstSnapshot}</th><th>{lastSnapshot}</th><th>Change</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={skillKey(r.skill, r.category)}>
              <td>{r.skill}</td>
              <td style={{ color: 'var(--text-dim)' }}>{CATEGORY_LABELS[r.category] || r.category}</td>
              <td>{r.from}</td>
              <td>{r.to}</td>
              <td style={{ color: positive ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>
                {r.change > 0 ? '+' : ''}{r.change}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
