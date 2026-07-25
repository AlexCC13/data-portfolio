import { METRICS } from '../lib/rankingsAnalysis'

function colorFor(v) {
  // -1 -> red, 0 -> neutral, 1 -> teal
  if (v >= 0) {
    const t = v
    const r = Math.round(22 + (56 - 22) * (1 - t))
    const g = Math.round(27 + (217 - 27) * t)
    const b = Math.round(38 + (196 - 38) * t)
    return `rgb(${r},${g},${b})`
  }
  const t = -v
  const r = Math.round(22 + (248 - 22) * t)
  const g = Math.round(27 + (113 - 27) * t)
  const b = Math.round(38 + (113 - 38) * t)
  return `rgb(${r},${g},${b})`
}

export default function CorrelationHeatmap({ matrix }) {
  const n = METRICS.length
  const cell = 40
  const labelWidth = 150

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <svg width={labelWidth + cell * n} height={labelWidth + cell * n} style={{ display: 'block' }}>
        {METRICS.map((m, i) => (
          <text key={`row-${m.key}`} x={labelWidth - 8} y={labelWidth + i * cell + cell / 2 + 4} textAnchor="end" fontSize="11" fill="var(--text-dim)">
            {m.label}
          </text>
        ))}
        {METRICS.map((m, j) => (
          <text
            key={`col-${m.key}`}
            x={labelWidth + j * cell + cell / 2}
            y={labelWidth - 10}
            textAnchor="start"
            fontSize="11"
            fill="var(--text-dim)"
            transform={`rotate(-45, ${labelWidth + j * cell + cell / 2}, ${labelWidth - 10})`}
          >
            {m.label}
          </text>
        ))}
        {matrix.map((row, i) =>
          row.map((v, j) => (
            <g key={`${i}-${j}`}>
              <rect
                x={labelWidth + j * cell}
                y={labelWidth + i * cell}
                width={cell - 2}
                height={cell - 2}
                rx={3}
                fill={colorFor(v)}
              />
              <text
                x={labelWidth + j * cell + cell / 2}
                y={labelWidth + i * cell + cell / 2 + 4}
                textAnchor="middle"
                fontSize="10"
                fill={Math.abs(v) > 0.55 ? '#0b0e14' : '#e6e9f0'}
              >
                {v.toFixed(1)}
              </text>
            </g>
          ))
        )}
      </svg>
    </div>
  )
}
