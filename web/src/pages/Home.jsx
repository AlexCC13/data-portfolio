import { Link } from 'react-router-dom'
import rankingsMeta from '../data/rankings/meta.json'
import skillsMeta from '../data/skills/meta.json'

const projects = [
  {
    to: '/country-rankings',
    title: 'Global Country Rankings, 2000–2026',
    description:
      'Happiness, human development, GDP, life expectancy, corruption, democracy, press freedom, peace and environmental performance for 217 countries across 27 years.',
    stats: [
      `${rankingsMeta.countries.length} countries`,
      `${rankingsMeta.years[0]}–${rankingsMeta.years[rankingsMeta.years.length - 1]}`,
      `${rankingsMeta.rowCount.toLocaleString()} rows`,
    ],
    tags: ['Kaggle', 'Time series', 'Geopolitics'],
  },
  {
    to: '/skill-scarcity',
    title: 'Tech Skill Scarcity Index',
    description:
      'Which tech skills are hardest to hire for right now — demand share, time-to-fill, salary premiums and repost rates across AI, data, devops, engineering, product and security roles.',
    stats: [
      `${skillsMeta.skills.length} skills`,
      `${skillsMeta.snapshotDates.length} weekly snapshots`,
      `${skillsMeta.rowCount.toLocaleString()} rows`,
    ],
    tags: ['Kaggle', 'Labor market', 'Job postings'],
  },
]

export default function Home() {
  return (
    <div className="container" style={{ paddingTop: 64, paddingBottom: 64 }}>
      <div style={{ maxWidth: 640, marginBottom: 48 }}>
        <div style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, marginBottom: 10 }}>DATA ANALYTICS PORTFOLIO</div>
        <h1 style={{ fontSize: 40, marginBottom: 14 }}>Exploring public datasets, one dashboard at a time</h1>
        <p style={{ fontSize: 16 }}>
          A growing collection of interactive analyses built from open datasets — cleaned, visualized, and
          explored end to end. Each project below is a self-contained deep dive.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {projects.map((p) => (
          <Link key={p.to} to={p.to} className="card" style={{ display: 'block', transition: 'border-color 0.15s' }}>
            <h3 style={{ fontSize: 18, marginBottom: 10 }}>{p.title}</h3>
            <p style={{ fontSize: 14, marginBottom: 16 }}>{p.description}</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {p.stats.map((s) => (
                <span key={s} style={{ fontSize: 12, color: 'var(--text)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px' }}>
                  {s}
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {p.tags.map((t) => (
                <span key={t} style={{ fontSize: 11, color: 'var(--text-faint)' }}>#{t}</span>
              ))}
            </div>
          </Link>
        ))}

        <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', color: 'var(--text-faint)', fontSize: 13, minHeight: 140 }}>
          More analyses coming soon
        </div>
      </div>
    </div>
  )
}
