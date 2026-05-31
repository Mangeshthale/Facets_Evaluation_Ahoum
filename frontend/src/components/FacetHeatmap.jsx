import { useState, useMemo } from 'react'
import { scoreColor, CATEGORIES } from '../utils/api.js'

export default function FacetHeatmap({ scores, onSelect }) {
  const [filterCat, setFilterCat] = useState('all')
  const [filterScore, setFilterScore] = useState('all')
  const [sortBy, setSortBy] = useState('score')
  const [search, setSearch] = useState('')

  const entries = useMemo(() => {
    let list = Object.entries(scores).map(([name, data]) => ({ name, ...data }))
    if (filterCat !== 'all') list = list.filter(e => e.category === filterCat)
    if (filterScore !== 'all') list = list.filter(e => String(e.score) === filterScore)
    if (search) list = list.filter(e => e.name.toLowerCase().includes(search.toLowerCase()))
    if (sortBy === 'score') list.sort((a, b) => b.score - a.score)
    else if (sortBy === 'confidence') list.sort((a, b) => b.confidence - a.confidence)
    else list.sort((a, b) => a.name.localeCompare(b.name))
    return list
  }, [scores, filterCat, filterScore, sortBy, search])

  const stats = useMemo(() => {
    const all = Object.values(scores)
    return {
      avg: (all.reduce((s, x) => s + x.score, 0) / all.length).toFixed(2),
      avgConf: Math.round(all.reduce((s, x) => s + x.confidence, 0) / all.length * 100),
      counts: { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0, ...Object.fromEntries(Object.entries(Object.groupBy ? {} : {}).map(([k,v])=>[k,v.length])) },
      total: all.length,
    }
  }, [scores])

  // compute counts properly
  const counts = useMemo(() => {
    const c = { '-2': 0, '-1': 0, '0': 0, '1': 0, '2': 0 }
    Object.values(scores).forEach(x => c[String(x.score)] = (c[String(x.score)] || 0) + 1)
    return c
  }, [scores])

  const sel = { background: 'var(--bg2)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '6px 10px', cursor: 'pointer' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Distribution bar */}
      <div style={{ display: 'flex', gap: '3px', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
        {['-2','-1','0','1','2'].map(s => (
          <div key={s} style={{ flex: counts[s] || 0.1, background: scoreColor(parseInt(s)), opacity: 0.7, transition: 'flex 0.4s' }} title={`${s}: ${counts[s]}`} />
        ))}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {[['Facets Scored', Object.keys(scores).length],['Avg Score', stats.avg],['Avg Confidence', stats.avgConf + '%'],['Strong Signals', (counts['2'] + counts['-2'])]].map(([l, v]) => (
          <div key={l} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text3)', marginBottom: '4px' }}>{l}</div>
            <div style={{ fontSize: '24px', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--text)' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <input placeholder="Search facets…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 180px', fontFamily: 'var(--font-mono)', fontSize: '13px' }} />
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={sel}>
          <option value="all">All categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterScore} onChange={e => setFilterScore(e.target.value)} style={sel}>
          <option value="all">All scores</option>
          {['-2','-1','0','1','2'].map(s => <option key={s} value={s}>Score {s > 0 ? '+' : ''}{s}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={sel}>
          <option value="score">Sort: Score</option>
          <option value="confidence">Sort: Confidence</option>
          <option value="name">Sort: Name A–Z</option>
        </select>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' }}>
        {entries.map(e => <FacetCell key={e.name} entry={e} onClick={() => onSelect(e)} />)}
      </div>
      {entries.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text3)', padding: '48px' }}>No facets match your filters.</p>}
    </div>
  )
}

function FacetCell({ entry, onClick }) {
  const color = scoreColor(entry.score)
  const conf = Math.round(entry.confidence * 100)
  return (
    <button onClick={onClick} style={{
      background: '#fff', border: `1px solid var(--border)`,
      borderLeft: `3px solid ${color}`,
      borderRadius: 'var(--radius-sm)', padding: '10px 12px',
      textAlign: 'left', cursor: 'pointer', transition: 'all 0.12s',
      display: 'flex', flexDirection: 'column', gap: '5px',
    }}
    onMouseEnter={e => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none' }}
    >
      <span style={{ fontSize: '12px', color: 'var(--text)', lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontWeight: 500 }}>
        {entry.name}
      </span>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '17px', fontFamily: 'var(--font-head)', fontWeight: 700, color }}>{entry.score > 0 ? '+' : ''}{entry.score}</span>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: conf >= 80 ? 'var(--green)' : conf >= 50 ? 'var(--yellow)' : 'var(--orange)' }}>{conf}%</span>
      </div>
    </button>
  )
}
