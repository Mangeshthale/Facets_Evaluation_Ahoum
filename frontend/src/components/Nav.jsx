import { Link, useLocation } from 'react-router-dom'

export default function Nav() {
  const { pathname } = useLocation()
  return (
    <nav style={{
      background: '#fff',
      borderBottom: '1px solid var(--border)',
      padding: '0 40px',
      height: '58px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 100,
      boxShadow: '0 1px 0 var(--border)',
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '6px',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" fill="white" opacity="0.9"/>
            <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
            <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity="0.6"/>
            <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '17px', color: 'var(--text)', letterSpacing: '-0.01em' }}>
          Facet Eval
        </span>
      </Link>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        {[['/', 'Evaluate'], ['/results', 'Results']].map(([path, label]) => (
          <Link key={path} to={path} style={{
            padding: '6px 14px', borderRadius: 'var(--radius-sm)',
            fontWeight: 500, fontSize: '14px', textDecoration: 'none',
            background: pathname === path ? 'var(--bg2)' : 'transparent',
            color: pathname === path ? 'var(--accent)' : 'var(--text2)',
            transition: 'all 0.15s',
          }}>{label}</Link>
        ))}
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" style={{
          padding: '6px 14px', borderRadius: 'var(--radius-sm)',
          fontSize: '13px', color: 'var(--text3)', textDecoration: 'none',
          fontFamily: 'var(--font-mono)',
        }}>API ↗</a>
      </div>
    </nav>
  )
}
