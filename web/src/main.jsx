import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Home from './pages/Home.jsx'

const CountryRankings = lazy(() => import('./pages/CountryRankings.jsx'))
const SkillScarcity = lazy(() => import('./pages/SkillScarcity.jsx'))
const Fifa = lazy(() => import('./pages/Fifa.jsx'))

function PageFallback() {
  return (
    <div className="container" style={{ paddingTop: 64, color: 'var(--text-faint)', fontSize: 14 }}>
      Loading…
    </div>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<Home />} />
          <Route
            path="country-rankings"
            element={
              <Suspense fallback={<PageFallback />}>
                <CountryRankings />
              </Suspense>
            }
          />
          <Route
            path="skill-scarcity"
            element={
              <Suspense fallback={<PageFallback />}>
                <SkillScarcity />
              </Suspense>
            }
          />
          <Route
            path="fifa-world-cup"
            element={
              <Suspense fallback={<PageFallback />}>
                <Fifa />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  </StrictMode>,
)
