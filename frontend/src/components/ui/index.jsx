// Composants UI réutilisables

export function Card({ children, style = {} }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: 24,
      ...style
    }}>
      {children}
    </div>
  )
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--text)', marginBottom: 4 }}>
          {title}
        </h1>
        {subtitle && <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}

export function Btn({ children, onClick, variant = 'primary', type = 'button', disabled = false, small = false, style = {} }) {
  const base = {
    border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 8, fontFamily: 'var(--font-body)',
    fontWeight: 500, transition: 'all 0.15s',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    opacity: disabled ? 0.5 : 1,
    padding: small ? '6px 14px' : '9px 20px',
    fontSize: small ? 13 : 14,
    ...style,
  }
  const variants = {
    primary: { background: 'var(--accent)', color: '#fff' },
    danger:  { background: 'var(--danger)', color: '#fff' },
    ghost:   { background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)' },
    success: { background: 'var(--success)', color: '#fff' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant] }}>
      {children}
    </button>
  )
}

export function Input({ label, error, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <input
        {...props}
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 8, color: 'var(--text)',
          padding: '9px 12px', fontSize: 14, width: '100%',
          outline: 'none', transition: 'border-color 0.15s',
        }}
      />
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Select({ label, error, children, ...props }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {label && <label style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</label>}
      <select
        {...props}
        style={{
          background: 'var(--surface2)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          borderRadius: 8, color: 'var(--text)',
          padding: '9px 12px', fontSize: 14, width: '100%',
          outline: 'none',
        }}
      >
        {children}
      </select>
      {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
    </div>
  )
}

export function Badge({ children, color = 'accent' }) {
  const colors = {
    accent:  { bg: 'rgba(79,142,247,0.15)', text: 'var(--accent-light)' },
    success: { bg: 'rgba(34,197,94,0.15)',  text: 'var(--success)' },
    warning: { bg: 'rgba(245,158,11,0.15)', text: 'var(--warning)' },
    danger:  { bg: 'rgba(239,68,68,0.15)',  text: 'var(--danger)' },
    muted:   { bg: 'rgba(122,138,170,0.15)',text: 'var(--text-muted)' },
  }
  const c = colors[color] || colors.accent
  return (
    <span style={{
      background: c.bg, color: c.text,
      padding: '3px 9px', borderRadius: 20, fontSize: 12, fontWeight: 500,
    }}>
      {children}
    </span>
  )
}

export function Table({ headers, children, empty = 'Aucun résultat.' }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h} style={{
                padding: '10px 14px', textAlign: 'left',
                color: 'var(--text-muted)', fontWeight: 500, fontSize: 12,
                borderBottom: '1px solid var(--border)', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {children || (
            <tr>
              <td colSpan={headers.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Tr({ children, onClick }) {
  return (
    <tr
      onClick={onClick}
      style={{
        borderBottom: '1px solid var(--border)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background 0.1s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'var(--surface2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
    >
      {children}
    </tr>
  )
}

export function Td({ children, style = {} }) {
  return <td style={{ padding: '12px 14px', color: 'var(--text)', ...style }}>{children}</td>
}

export function Modal({ title, children, onClose, width = 500, top }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1000, padding: -300,
      paddingTop: top ? (typeof top === 'number' ? top : 250) : 20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 14, width: '100%', maxWidth: width, maxHeight: '85vh',
        overflow: 'auto', animation: 'fadeUp 0.2s ease',
        marginTop: top ? (typeof top === 'number' ? top : 100) : 0,
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
        }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--text)' }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 18 }}>✕</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  )
}

export function StatCard({ label, value, sub, color = 'var(--accent)' }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 12, padding: '20px 24px',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontFamily: 'var(--font-display)', color: 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export function Alert({ children, type = 'danger' }) {
  const colors = {
    danger:  { bg: 'rgba(239,68,68,0.1)',  border: 'var(--danger)',  text: '#fca5a5' },
    success: { bg: 'rgba(34,197,94,0.1)',  border: 'var(--success)', text: '#86efac' },
    warning: { bg: 'rgba(245,158,11,0.1)', border: 'var(--warning)', text: '#fcd34d' },
  }
  const c = colors[type]
  return (
    <div style={{
      background: c.bg, border: `1px solid ${c.border}`,
      borderRadius: 8, padding: '10px 14px', color: c.text, fontSize: 14,
    }}>
      {children}
    </div>
  )
}

export function Spinner() {
  return <div style={{ display:'flex', justifyContent:'center', padding:40 }}><span className="spinner" /></div>
}

export function FormRow({ children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {children}
    </div>
  )
}
