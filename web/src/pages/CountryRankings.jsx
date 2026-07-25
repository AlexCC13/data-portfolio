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
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import data from '../data/rankings/rankings.json'
import meta from '../data/rankings/meta.json'
import {
  METRICS,
  regionAverages,
  globalSpreadTrend,
  regionTrend,
  topMovers,
  correlationMatrix,
  leaderboard,
  countryTrend,
  countryLatestRadar,
  tierDistribution,
} from '../lib/rankingsAnalysis'
import Section from '../components/Section'
import StatCard from '../components/StatCard'
import CorrelationHeatmap from '../components/CorrelationHeatmap'

const REGION_COLORS = {
  Asia: '#5b8cff',
  Europe: '#38d9c4',
  Africa: '#ff8a5c',
  'South America': '#c084fc',
  'North America': '#4ade80',
}
const TIER_COLORS = ['#5b8cff', '#38d9c4', '#ff8a5c', '#f87171']

const minYear = meta.years[0]
const maxYear = meta.years[meta.years.length - 1]

export default function CountryRankings() {
  const [metric, setMetric] = useState('Happiness')
  const [year, setYear] = useState(maxYear)
  const [country, setCountry] = useState('United States')
  const [lbMetric, setLbMetric] = useState('Happiness')

  const regionAvg = useMemo(() => regionAverages(data, year), [year])
  const spreadTrend = useMemo(() => globalSpreadTrend(data, metric), [metric])
  const rTrend = useMemo(() => regionTrend(data, metric), [metric])
  const movers = useMemo(() => topMovers(data, minYear, maxYear), [])
  const corrMatrix = useMemo(() => correlationMatrix(data), [])
  const top10 = useMemo(() => leaderboard(data, lbMetric, year, 'top'), [lbMetric, year])
  const bottom10 = useMemo(() => leaderboard(data, lbMetric, year, 'bottom'), [lbMetric, year])
  const cTrend = useMemo(() => countryTrend(data, country), [country])
  const cRadar = useMemo(() => countryLatestRadar(data, country, year), [country, year])
  const tiers = useMemo(() => tierDistribution(data, year), [year])

  const regionList = [...new Set(data.map((r) => r.Region))]
  const countryList = meta.countries

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>Global Country Rankings, {minYear}–{maxYear}</h1>
        <p style={{ fontSize: 14, maxWidth: 720 }}>
          Comparative rankings across 11 socioeconomic indicators — happiness, human development, GDP per capita,
          life expectancy, corruption, democracy, income equality, press freedom, peace and environmental
          performance — for {meta.countries.length} countries.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 36 }}>
        <StatCard label="Countries" value={meta.countries.length} />
        <StatCard label="Years covered" value={`${minYear}–${maxYear}`} />
        <StatCard label="Regions" value={regionList.length} />
        <StatCard label="Indicators tracked" value={METRICS.length} />
        <StatCard label="Total records" value={meta.rowCount.toLocaleString()} />
      </div>

      <Section
        title="Regional performance"
        subtitle={`Average composite score by region, ${year} (0–100, higher is better)`}
        action={<YearSelect value={year} onChange={setYear} />}
      >
        <div className="card">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={regionAvg} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#232939" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#5a6272" fontSize={12} />
              <YAxis type="category" dataKey="region" stroke="#8b93a7" fontSize={12} width={110} />
              <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
              <Bar dataKey="overall" radius={[0, 4, 4, 0]}>
                {regionAvg.map((r) => (
                  <Cell key={r.region} fill={REGION_COLORS[r.region] || '#5b8cff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      <Section
        title="Regional trends & global spread"
        subtitle="Rankings are zero-sum each year, so the global average never moves — what changes is how spread out countries are, and how regions move relative to each other"
        action={<MetricSelect value={metric} onChange={setMetric} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Global spread (std. dev. & inter-quartile gap)</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={spreadTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="year" stroke="#5a6272" fontSize={11} />
                <YAxis stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="stdDev" name="Std. deviation" stroke="#5b8cff" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="iqrGap" name="IQR gap (Q3–Q1)" stroke="#ff8a5c" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>By region</div>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="year" stroke="#5a6272" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                {regionList.map((r) => (
                  <Line key={r} type="monotone" dataKey={r} stroke={REGION_COLORS[r]} strokeWidth={1.5} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="How indicators relate" subtitle="Pearson correlation between composite scores across all country-years">
        <CorrelationHeatmap matrix={corrMatrix} />
      </Section>

      <Section title="Biggest movers" subtitle={`Change in overall composite score, ${minYear} → ${maxYear}`}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <MoversTable title="Most improved" rows={movers.improved} positive />
          <MoversTable title="Most declined" rows={movers.declined} positive={false} />
        </div>
      </Section>

      <Section
        title="Leaderboard"
        subtitle={`Ranked by indicator, ${year}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <MetricSelect value={lbMetric} onChange={setLbMetric} />
            <YearSelect value={year} onChange={setYear} />
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col">
          <LeaderTable title="Top 10" rows={top10} />
          <LeaderTable title="Bottom 10" rows={bottom10} />
        </div>
      </Section>

      <Section
        title="Country explorer"
        subtitle="Trend over time and current profile across all indicators"
        action={<CountrySelect value={country} onChange={setCountry} options={countryList} />}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14 }} className="two-col">
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>Overall composite score over time</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={cTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#232939" />
                <XAxis dataKey="year" stroke="#5a6272" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#5a6272" fontSize={11} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
                <Line type="monotone" dataKey="overall" stroke="#38d9c4" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{country} — {year} profile</div>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={cRadar} outerRadius="75%">
                <PolarGrid stroke="#232939" />
                <PolarAngleAxis dataKey="metric" stroke="#8b93a7" fontSize={10} />
                <PolarRadiusAxis domain={[0, 100]} stroke="#232939" fontSize={9} />
                <Radar dataKey="score" stroke="#5b8cff" fill="#5b8cff" fillOpacity={0.35} />
                <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section title="Economic tier distribution" subtitle={`Number of countries per income tier, ${year}`}>
        <div className="card">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={tiers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => `${e.name}: ${e.value}`}>
                {tiers.map((t, i) => (
                  <Cell key={t.name} fill={TIER_COLORS[i % TIER_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: '#161b26', border: '1px solid #232939', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </Section>
    </div>
  )
}

function MetricSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {METRICS.map((m) => (
        <option key={m.key} value={m.key}>{m.label}</option>
      ))}
    </select>
  )
}

function YearSelect({ value, onChange }) {
  return (
    <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
      {meta.years.map((y) => (
        <option key={y} value={y}>{y}</option>
      ))}
    </select>
  )
}

function CountrySelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map((c) => (
        <option key={c} value={c}>{c}</option>
      ))}
    </select>
  )
}

function MoversTable({ title, rows, positive }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
      <table>
        <thead>
          <tr><th>Country</th><th>{minYear}</th><th>{maxYear}</th><th>Change</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.country}>
              <td>{r.country}</td>
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

function LeaderTable({ title, rows }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 8 }}>{title}</div>
      <table>
        <thead>
          <tr><th>#</th><th>Country</th><th>Region</th><th>Score</th></tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.country}>
              <td>{r.rank}</td>
              <td>{r.country}</td>
              <td style={{ color: 'var(--text-dim)' }}>{r.region}</td>
              <td>{r.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
