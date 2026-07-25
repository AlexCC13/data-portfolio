import { Link } from 'react-router-dom'
import fifaMeta from '../data/fifa/meta.json'

// Global Country Rankings and Tech Skill Scarcity Index are hidden from the
// portfolio listing (still deployed and reachable at their routes, just not
// surfaced on Home) — ask before removing them outright if that changes.
const projects = [
  {
    to: '/fifa-world-cup',
    title: 'FIFA World Cup 2026 — Player Performance',
    description:
      'Real tournament data, verified against live reporting. A six-tab deep dive beyond the obvious results and top-scorer tables: team economics, position archetypes, scouting angles, squad rotation, and a dedicated goalkeeper breakdown — with a football-pitch visual for squad and position views.',
    stats: [
      `${fifaMeta.playersFeatured.toLocaleString()} players featured`,
      `${fifaMeta.teams.length} teams`,
      `${fifaMeta.totalGoals + fifaMeta.totalOwnGoals} goals`,
    ],
    tags: ['Kaggle', 'Sports analytics', 'Player scouting'],
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
