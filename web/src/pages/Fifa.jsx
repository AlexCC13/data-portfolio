import { useState } from 'react'
import roster from '../data/fifa/roster.json'
import teamSummary from '../data/fifa/team_summary.json'
import positionProfiles from '../data/fifa/position_profiles.json'
import gkProfiles from '../data/fifa/gk_profiles.json'
import meta from '../data/fifa/meta.json'

import OverviewTab from './fifa/OverviewTab'
import TeamsTab from './fifa/TeamsTab'
import PositionsTab from './fifa/PositionsTab'
import PlayersTab from './fifa/PlayersTab'
import SquadDepthTab from './fifa/SquadDepthTab'
import GoalkeepersTab from './fifa/GoalkeepersTab'

const TABS = [
  { key: 'overview', label: 'Tournament Overview' },
  { key: 'teams', label: 'Team Analysis' },
  { key: 'positions', label: 'Position Archetypes' },
  { key: 'players', label: 'Player Scouting' },
  { key: 'depth', label: 'Squad Depth' },
  { key: 'goalkeepers', label: 'Goalkeepers' },
]

export default function Fifa() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="container" style={{ paddingTop: 32, paddingBottom: 64 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, marginBottom: 8 }}>FIFA World Cup 2026 — Player Performance</h1>
        <p style={{ fontSize: 14, maxWidth: 760 }}>
          Real tournament data — {meta.playerCount.toLocaleString()} named squad players across {meta.teams.length} teams,
          {' '}{meta.playersFeatured.toLocaleString()} of whom actually featured. Verified against live World Cup reporting
          (goals, own goals and assist leaders all match published figures exactly). Six deep-dive views beyond the obvious
          results and top-scorer tables: tournament shape, team economics, position archetypes, scouting angles, squad
          rotation, and a dedicated goalkeeper breakdown.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28, borderBottom: '1px solid var(--border)', paddingBottom: 12 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? 'var(--accent)' : 'var(--bg-elevated)',
              color: tab === t.key ? '#0b0e14' : 'var(--text-dim)',
              fontWeight: tab === t.key ? 700 : 500,
              border: '1px solid var(--border)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab meta={meta} teamSummary={teamSummary} />}
      {tab === 'teams' && <TeamsTab teamSummary={teamSummary} roster={roster} />}
      {tab === 'positions' && <PositionsTab positionProfiles={positionProfiles} />}
      {tab === 'players' && <PlayersTab roster={roster} />}
      {tab === 'depth' && <SquadDepthTab roster={roster} teamSummary={teamSummary} />}
      {tab === 'goalkeepers' && <GoalkeepersTab gkProfiles={gkProfiles} />}
    </div>
  )
}
