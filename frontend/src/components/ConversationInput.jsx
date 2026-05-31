import { useState } from 'react'
import { CATEGORIES } from '../utils/api.js'

const EXAMPLE = [
  { role: 'user', content: "I've been really struggling lately. Nothing I do seems good enough and I'm exhausted." },
  { role: 'assistant', content: "That sounds really hard. It takes courage to say that out loud. What's been weighing on you most?" },
  { role: 'user', content: "I don't know, everything. Work is a mess, my relationships feel distant. I just don't see the point sometimes." },
]

export default function ConversationInput({ onSubmit, loading }) {
  const [turns, setTurns] = useState(EXAMPLE)
  const [turnIdx, setTurnIdx] = useState(2)
  const [selectedCats, setSelectedCats] = useState([])
  const [newRole, setNewRole] = useState('user')
  const [newContent, setNewContent] = useState('')

  function addTurn() {
    if (!newContent.trim()) return
    const updated = [...turns, { role: newRole, content: newContent.trim() }]
    setTurns(updated); setNewContent(''); setTurnIdx(updated.length - 1)
  }

  const label = { fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '8px', display: 'block' }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Turns */}
      <div>
        <span style={label}>Conversation turns</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {turns.map((turn, i) => (
            <div key={i} onClick={() => setTurnIdx(i)}
              style={{ display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'all 0.12s',
                background: i === turnIdx ? 'rgba(45,106,79,0.05)' : 'var(--bg)',
                border: i === turnIdx ? '1px solid var(--accent2)' : '1px solid var(--border)',
              }}>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: turn.role === 'user' ? 'var(--accent)' : 'var(--text3)', minWidth: '60px', paddingTop: '1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{turn.role}</span>
              <span style={{ fontSize: '13px', color: 'var(--text)', flex: 1, lineHeight: 1.5 }}>{turn.content}</span>
              <button onClick={e => { e.stopPropagation(); setTurns(turns.filter((_,j)=>j!==i)) }}
                style={{ background: 'none', color: 'var(--text3)', fontSize: '14px', padding: '0 2px', lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
          <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '90px', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
            <option value="user">user</option>
            <option value="assistant">assistant</option>
          </select>
          <input value={newContent} onChange={e => setNewContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTurn()} placeholder="Add a turn…" />
          <button onClick={addTurn} style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', padding: '0 12px', color: 'var(--text2)', fontSize: '18px', flexShrink: 0 }}>+</button>
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '5px' }}>Click a turn to select it for scoring (green border = selected)</p>
      </div>

      {/* Categories */}
      <div>
        <span style={label}>Filter by category <span style={{ color: 'var(--bg4)' }}>(none = all)</span></span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setSelectedCats(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat])}
              style={{ padding: '4px 10px', borderRadius: '99px', fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', cursor: 'pointer',
                background: selectedCats.includes(cat) ? 'rgba(45,106,79,0.1)' : 'var(--bg2)',
                color: selectedCats.includes(cat) ? 'var(--accent)' : 'var(--text3)',
                border: selectedCats.includes(cat) ? '1px solid rgba(45,106,79,0.3)' : '1px solid var(--border)',
              }}>{cat}</button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button onClick={() => onSubmit({ conversation: turns, turnIndex: turnIdx, categories: selectedCats.length > 0 ? selectedCats : null })}
        disabled={loading || turns.length === 0}
        style={{ padding: '13px', borderRadius: 'var(--radius)', background: loading ? 'var(--bg3)' : 'var(--accent)', color: loading ? 'var(--text3)' : '#fff', fontSize: '14px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: loading ? 'none' : '0 2px 8px rgba(45,106,79,0.25)' }}>
        {loading && <div className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />}
        {loading ? 'Scoring… (5–8 min for all facets)' : `Score ${selectedCats.length ? 'filtered' : 'all'} facets →`}
      </button>
    </div>
  )
}
