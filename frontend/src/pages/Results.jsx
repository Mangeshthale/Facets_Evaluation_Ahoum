import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FacetHeatmap from '../components/FacetHeatmap.jsx'
import ScoreCard from '../components/ScoreCard.jsx'

export default function Results() {
  const [result, setResult] = useState(null)
  const [selected, setSelected] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    const raw = sessionStorage.getItem('eval_result')
    if (!raw) { navigate('/'); return }
    setResult(JSON.parse(raw))
  }, [])

  if (!result) return null
  const { scores, metadata } = result

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

      {/* Main area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>

        {/* Header strip */}
        <div style={{ background: '#fff', borderBottom: '1px solid var(--border)', padding: '20px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.01em', marginBottom: '3px' }}>Evaluation Results</h2>
            <p style={{ fontSize: '12px', color: 'var(--text3)', fontFamily: 'var(--font-mono)' }}>
              {metadata.total_facets_scored} facets · {metadata.model} · {(metadata.processing_time_ms/1000).toFixed(0)}s · {metadata.batches_used} batches
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => {
              const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' })
              const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'facet_scores.json'; a.click()
            }} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--bg2)', color: 'var(--text2)', border: '1px solid var(--border2)', fontSize: '13px' }}>
              ↓ Download JSON
            </button>
            <button onClick={() => navigate('/')} style={{ padding: '8px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent)', color: '#fff', fontSize: '13px', fontWeight: 500 }}>
              ← New evaluation
            </button>
          </div>
        </div>

        {/* Turn evaluated */}
        <div style={{ padding: '16px 40px', background: 'var(--bg2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginRight: '12px' }}>Turn scored</span>
          <span style={{ fontSize: '14px', color: 'var(--text)', fontStyle: 'italic' }}>"{metadata.turn_evaluated}"</span>
        </div>

        {/* Heatmap */}
        <div style={{ flex: 1, padding: '28px 40px', overflowY: 'auto' }}>
          <FacetHeatmap scores={scores} onSelect={setSelected} />
        </div>
      </div>

      {/* Side panel */}
      {selected && <ScoreCard entry={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
