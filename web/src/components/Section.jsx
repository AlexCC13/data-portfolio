export default function Section({ title, subtitle, action, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 18 }}>{title}</h2>
          {subtitle && <p style={{ fontSize: 13, marginTop: 4 }}>{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}
