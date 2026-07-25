// Generic vertical football pitch, viewBox 0 0 100 150 (GK end at bottom, y=150).
// Two overlay modes, usable together: `zones` for colored horizontal bands
// (e.g. average rating by position band) and `markers` for individual dots
// (e.g. one per squad player) positioned by percentage {x, y}.
export default function PitchView({ zones = [], markers = [], height = 480, onMarkerHover }) {
  return (
    <svg viewBox="0 0 100 150" width="100%" height={height} style={{ display: 'block' }}>
      <rect x="0" y="0" width="100" height="150" fill="#0f2417" />

      {zones.map((z) => (
        <rect
          key={z.label}
          x="2"
          y={z.yStart}
          width="96"
          height={z.yEnd - z.yStart}
          fill={z.color}
          fillOpacity={z.opacity ?? 0.55}
        />
      ))}

      {/* pitch markings */}
      <g stroke="rgba(255,255,255,0.35)" strokeWidth="0.4" fill="none">
        <rect x="2" y="2" width="96" height="146" />
        <line x1="2" y1="75" x2="98" y2="75" />
        <circle cx="50" cy="75" r="9" />
        <circle cx="50" cy="75" r="0.6" fill="rgba(255,255,255,0.35)" />
        {/* bottom (own) penalty area */}
        <rect x="26" y="128" width="48" height="20" />
        <rect x="38" y="140" width="24" height="8" />
        <circle cx="50" cy="138" r="0.6" fill="rgba(255,255,255,0.35)" />
        {/* top (attacking) penalty area */}
        <rect x="26" y="2" width="48" height="20" />
        <rect x="38" y="2" width="24" height="8" />
        <circle cx="50" cy="12" r="0.6" fill="rgba(255,255,255,0.35)" />
      </g>

      {zones.map((z) => (
        <text
          key={`${z.label}-label`}
          x="6"
          y={(z.yStart + z.yEnd) / 2}
          fontSize="4.2"
          fill="rgba(255,255,255,0.85)"
          fontWeight="600"
        >
          {z.label}
        </text>
      ))}
      {zones.map((z) =>
        z.value != null ? (
          <text
            key={`${z.label}-value`}
            x="94"
            y={(z.yStart + z.yEnd) / 2}
            fontSize="5.5"
            fill="#fff"
            fontWeight="700"
            textAnchor="end"
          >
            {z.value}
          </text>
        ) : null
      )}

      {markers.map((m) => (
        <g
          key={m.id}
          transform={`translate(${m.x}, ${m.y})`}
          onMouseEnter={() => onMarkerHover?.(m)}
          onMouseLeave={() => onMarkerHover?.(null)}
          style={{ cursor: onMarkerHover ? 'pointer' : 'default' }}
        >
          <circle r={m.r ?? 2.6} fill={m.color ?? '#5b8cff'} stroke="#0b0e14" strokeWidth="0.4" />
          {m.label && (
            <text y={m.r ? m.r + 3.2 : 5.8} textAnchor="middle" fontSize="3" fill="rgba(255,255,255,0.85)">
              {m.label}
            </text>
          )}
        </g>
      ))}
    </svg>
  )
}
