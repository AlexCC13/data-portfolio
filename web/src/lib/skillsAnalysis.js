export function mean(arr) {
  if (!arr.length) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

const CATEGORY_LABELS = {
  ai: 'AI',
  data: 'Data',
  devops: 'DevOps',
  engineering: 'Engineering',
  product: 'Product',
  security: 'Security',
}
export { CATEGORY_LABELS }

export function latestSnapshot(data) {
  return data.reduce((max, r) => (r.snapshot_date > max ? r.snapshot_date : max), data[0].snapshot_date)
}

export function categoryAverages(data, snapshotDate) {
  const rows = data.filter((r) => r.snapshot_date === snapshotDate)
  const categories = [...new Set(rows.map((r) => r.category))]
  return categories
    .map((category) => {
      const catRows = rows.filter((r) => r.category === category)
      const withSalary = catRows.filter((r) => r.salary_premium_pct != null)
      return {
        category: CATEGORY_LABELS[category] || category,
        key: category,
        count: catRows.length,
        avgScarcity: Number(mean(catRows.map((r) => r.scarcity_score)).toFixed(1)),
        avgSalaryPremium: withSalary.length ? Number(mean(withSalary.map((r) => r.salary_premium_pct)).toFixed(1)) : null,
        avgRepostRate: Number(mean(catRows.map((r) => r.repost_rate_pct)).toFixed(1)),
      }
    })
    .sort((a, b) => b.avgScarcity - a.avgScarcity)
}

export function scarcityLeaderboard(data, snapshotDate, n = 15) {
  return data
    .filter((r) => r.snapshot_date === snapshotDate)
    .sort((a, b) => b.scarcity_score - a.scarcity_score)
    .slice(0, n)
}

export function abundantSkills(data, snapshotDate, n = 15) {
  return data
    .filter((r) => r.snapshot_date === snapshotDate)
    .sort((a, b) => a.scarcity_score - b.scarcity_score)
    .slice(0, n)
}

export function scarcityVsSalary(data, snapshotDate) {
  return data.filter((r) => r.snapshot_date === snapshotDate && r.salary_premium_pct != null)
}

// skill_name alone isn't unique — most skills are tracked per role category
// (Python-in-AI vs Python-in-Data have different scarcity), so lookups need
// both skill_name and category.
export function skillKey(skillName, category) {
  return `${skillName}__${category}`
}

export function skillTrend(data, skillName, category) {
  return data
    .filter((r) => r.skill_name === skillName && r.category === category)
    .sort((a, b) => (a.snapshot_date > b.snapshot_date ? 1 : -1))
}

export function risingSkills(data, firstDate, lastDate, n = 10) {
  const byKey = {}
  data.forEach((r) => {
    if (r.snapshot_date === firstDate || r.snapshot_date === lastDate) {
      const key = skillKey(r.skill_name, r.category)
      byKey[key] = byKey[key] || { skill: r.skill_name, category: r.category }
      byKey[key][r.snapshot_date] = r.scarcity_score
    }
  })
  const changes = Object.values(byKey)
    .filter((v) => v[firstDate] !== undefined && v[lastDate] !== undefined)
    .map((v) => ({
      skill: v.skill,
      category: v.category,
      from: v[firstDate],
      to: v[lastDate],
      change: Number((v[lastDate] - v[firstDate]).toFixed(1)),
    }))
    .sort((a, b) => b.change - a.change)
  return {
    rising: changes.slice(0, n),
    falling: changes.slice(-n).reverse(),
  }
}

export function demandShareByCategory(data, snapshotDate) {
  const rows = data.filter((r) => r.snapshot_date === snapshotDate)
  const categories = [...new Set(rows.map((r) => r.category))]
  return categories.map((category) => ({
    name: CATEGORY_LABELS[category] || category,
    value: Number(rows.filter((r) => r.category === category).reduce((s, r) => s + r.demand_count, 0)),
  }))
}
