export const METRICS = [
  { key: 'Happiness', label: 'Happiness' },
  { key: 'Global_Hunger', label: 'Hunger (inv.)' },
  { key: 'Human_Development', label: 'Human Development' },
  { key: 'GDP_Per_Capita', label: 'GDP per Capita' },
  { key: 'Life_Expectancy', label: 'Life Expectancy' },
  { key: 'Corruption_Perception', label: 'Corruption (low)' },
  { key: 'Democracy', label: 'Democracy' },
  { key: 'Gini', label: 'Income Equality' },
  { key: 'Press_Freedom', label: 'Press Freedom' },
  { key: 'Global_Peace', label: 'Peace' },
  { key: 'Environmental_Performance', label: 'Environment' },
]

const scoreKey = (m) => `${m}_Score`
const rankKey = (m) => `${m}_Rank`

export function mean(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

export function overallScore(row) {
  return mean(METRICS.map((m) => row[scoreKey(m.key)]))
}

export function regionAverages(data, year) {
  const rows = data.filter((r) => r.Year === year)
  const regions = [...new Set(rows.map((r) => r.Region))]
  return regions
    .map((region) => {
      const regionRows = rows.filter((r) => r.Region === region)
      const entry = { region, count: regionRows.length }
      METRICS.forEach((m) => {
        entry[m.key] = Number(mean(regionRows.map((r) => r[scoreKey(m.key)])).toFixed(1))
      })
      entry.overall = Number(mean(regionRows.map(overallScore)).toFixed(1))
      return entry
    })
    .sort((a, b) => b.overall - a.overall)
}

// Rank-derived scores always average out to the same value every year (ranks
// are a full 1..N permutation each year), so a "global average" trend line is
// flat by construction. What actually varies year to year is the *spread* —
// how tightly or loosely countries are clustered — so we track std deviation
// and the top/bottom quartile gap instead.
export function globalSpreadTrend(data, metric) {
  const years = [...new Set(data.map((r) => r.Year))].sort((a, b) => a - b)
  return years.map((year) => {
    const scores = data.filter((r) => r.Year === year).map((r) => r[scoreKey(metric)])
    const avg = mean(scores)
    const variance = mean(scores.map((s) => (s - avg) ** 2))
    const sorted = [...scores].sort((a, b) => a - b)
    const q1 = sorted[Math.floor(sorted.length * 0.25)]
    const q3 = sorted[Math.floor(sorted.length * 0.75)]
    return {
      year,
      stdDev: Number(Math.sqrt(variance).toFixed(1)),
      iqrGap: Number((q3 - q1).toFixed(1)),
    }
  })
}

export function regionTrend(data, metric) {
  const years = [...new Set(data.map((r) => r.Year))].sort((a, b) => a - b)
  const regions = [...new Set(data.map((r) => r.Region))]
  return years.map((year) => {
    const rows = data.filter((r) => r.Year === year)
    const entry = { year }
    regions.forEach((region) => {
      const regionRows = rows.filter((r) => r.Region === region)
      entry[region] = Number(mean(regionRows.map((r) => r[scoreKey(metric)])).toFixed(1))
    })
    return entry
  })
}

export function topMovers(data, fromYear, toYear, n = 10) {
  const byCountry = {}
  data.forEach((r) => {
    if (r.Year === fromYear || r.Year === toYear) {
      byCountry[r.Country] = byCountry[r.Country] || {}
      byCountry[r.Country][r.Year] = overallScore(r)
    }
  })
  const changes = Object.entries(byCountry)
    .filter(([, v]) => v[fromYear] !== undefined && v[toYear] !== undefined)
    .map(([country, v]) => ({
      country,
      from: Number(v[fromYear].toFixed(1)),
      to: Number(v[toYear].toFixed(1)),
      change: Number((v[toYear] - v[fromYear]).toFixed(1)),
    }))
    .sort((a, b) => b.change - a.change)
  return {
    improved: changes.slice(0, n),
    declined: changes.slice(-n).reverse(),
  }
}

export function correlationMatrix(data) {
  const keys = METRICS.map((m) => scoreKey(m.key))
  const n = data.length
  const means = keys.map((k) => mean(data.map((r) => r[k])))
  const stds = keys.map((k, i) => {
    const variance = mean(data.map((r) => (r[k] - means[i]) ** 2))
    return Math.sqrt(variance)
  })
  const matrix = keys.map((ki, i) =>
    keys.map((kj, j) => {
      if (stds[i] === 0 || stds[j] === 0) return 0
      let cov = 0
      for (let idx = 0; idx < n; idx++) {
        cov += (data[idx][ki] - means[i]) * (data[idx][kj] - means[j])
      }
      cov /= n
      return Number((cov / (stds[i] * stds[j])).toFixed(2))
    })
  )
  return matrix
}

export function leaderboard(data, metric, year, direction = 'top', n = 10) {
  const rows = data
    .filter((r) => r.Year === year)
    .map((r) => ({ country: r.Country, region: r.Region, rank: r[rankKey(metric)], score: r[scoreKey(metric)] }))
    .sort((a, b) => a.rank - b.rank)
  return direction === 'top' ? rows.slice(0, n) : rows.slice(-n).reverse()
}

export function countryTrend(data, country) {
  return data
    .filter((r) => r.Country === country)
    .sort((a, b) => a.Year - b.Year)
    .map((r) => ({ year: r.Year, overall: Number(overallScore(r).toFixed(1)), ...r }))
}

export function countryLatestRadar(data, country, year) {
  const row = data.find((r) => r.Country === country && r.Year === year)
  if (!row) return []
  return METRICS.map((m) => ({ metric: m.label, score: row[scoreKey(m.key)] }))
}

export function tierDistribution(data, year) {
  const rows = data.filter((r) => r.Year === year)
  const counts = {}
  rows.forEach((r) => {
    counts[r.Economic_Tier_Label] = (counts[r.Economic_Tier_Label] || 0) + 1
  })
  return Object.entries(counts).map(([label, value]) => ({ name: label, value }))
}
