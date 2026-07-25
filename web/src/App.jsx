import { Link, Outlet } from 'react-router-dom'

function App() {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <header style={{ borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'rgba(11,14,20,0.85)', backdropFilter: 'blur(8px)', zIndex: 10 }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 }}>
          <Link to="/" style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.01em' }}>
            Alexis Slagk <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>/ Data Portfolio</span>
          </Link>
          <a href="https://github.com/AlexCC13/data-portfolio" target="_blank" rel="noreferrer" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
            GitHub ↗
          </a>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 0', marginTop: 40 }}>
        <div className="container" style={{ fontSize: 12, color: 'var(--text-faint)' }}>
          Built with React, Vite & Recharts. Data from Kaggle.
        </div>
      </footer>
    </div>
  )
}

export default App
