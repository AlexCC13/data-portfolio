export default function InsightList({ insights, title = 'Key insights' }) {
  if (!insights?.length) return null
  return (
    <div className="card" style={{ borderColor: 'var(--accent)', borderLeftWidth: 3 }}>
      <div style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {title}
      </div>
      <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {insights.map((text, i) => (
          <li key={i} style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.5 }}>{text}</li>
        ))}
      </ul>
    </div>
  )
}
