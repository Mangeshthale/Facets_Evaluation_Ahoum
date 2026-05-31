import { scoreColor, scoreLabel } from '../utils/api.js'

export default function ScoreCard({ entry, onClose }) {
  if (!entry) return null
  const color = scoreColor(entry.score)
  const conf = Math.round(entry.confidence * 100)

  return (
    <div style={{
      width: '320px', flexShrink: 0,
      background: '#fff', borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflowY: 'auto',
      animation: 'fadeUp 0.2s ease',
    }}>
      <div style={{ padding: '20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="tag" style={{ marginBottom: '8px' }}>{entry.category}</div>
          <h3 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '16px', lineHeight: 1.3 }}>{entry.name}</h3>
        </div>
        <button onClick={onClose} style={{ background: 'none', color: 'var(--text3)', fontSize: '18px', fontWeight: 300, padding: '2px 6px', borderRadius: '4px', lineHeight: 1 }}>✕</button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Score */}
        <div style={{ textAlign: 'center', padding: '20px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: `2px solid ${color}20` }}>
          <div style={{ fontSize: '52px', fontFamily: 'var(--font-head)', fontWeight: 800, color, lineHeight: 1 }}>{entry.score > 0 ? '+' : ''}{entry.score}</div>
          <div style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '6px' }}>{scoreLabel(entry.score)}</div>
        </div>

        {/* Confidence */}
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '8px' }}>Confidence</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ flex: 1, height: '5px', background: 'var(--bg3)', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${conf}%`, background: conf >= 80 ? 'var(--green)' : conf >= 50 ? 'var(--yellow)' : 'var(--orange)', borderRadius: '3px', transition: 'width 0.5s ease' }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 500, minWidth: '36px' }}>{conf}%</span>
          </div>
        </div>

        {/* Reasoning */}
        <div>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '8px' }}>Reasoning</div>
          <p style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.65, fontStyle: 'italic', padding: '12px', background: 'var(--bg2)', borderRadius: 'var(--radius-sm)', borderLeft: `3px solid ${color}` }}>
            "{entry.reasoning || 'No reasoning provided.'}"
          </p>
        </div>

        {/* Meta */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingTop: '4px', borderTop: '1px solid var(--border)' }}>
          {[['Facet ID', entry.facet_id], ['Polarity', entry.polarity], ['Scale', '−2 to +2']].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{l}</span>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--text2)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
