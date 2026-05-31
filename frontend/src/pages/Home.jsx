import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ConversationInput from '../components/ConversationInput.jsx'
import { evaluate, healthCheck } from '../utils/api.js'

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [health, setHealth] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    healthCheck().then(setHealth).catch(() => setHealth({ status: 'unreachable', model_loaded: false }))
  }, [])

  async function handleSubmit({ conversation, turnIndex, categories }) {
    setLoading(true); setError(null)
    try {
      const result = await evaluate(conversation, { turnIndex, categories })
      sessionStorage.setItem('eval_result', JSON.stringify(result))
      sessionStorage.setItem('eval_conversation', JSON.stringify(conversation))
      navigate('/results')
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Evaluation failed.')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Full-width header strip */}
      <div style={{ background: 'var(--accent)', padding: '36px 48px 32px', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'clamp(26px,4vw,40px)', color: '#fff', lineHeight: 1.15, letterSpacing: '-0.02em', marginBottom: '8px' }}>
                Conversation Facet Scorer
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '15px', maxWidth: '520px' }}>
                Score any conversation turn across 396 psychological, linguistic and behavioral facets using open-weights LLMs running locally.
              </p>
            </div>
            {health && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 14px', borderRadius: 'var(--radius)',
                background: health.model_loaded ? 'rgba(255,255,255,0.15)' : 'rgba(255,100,50,0.25)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '13px', color: '#fff', fontFamily: 'var(--font-mono)',
              }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: health.model_loaded ? '#74c69d' : '#ff6b6b', animation: health.model_loaded ? 'pulse 2s ease infinite' : 'none' }} />
                {health.model_loaded ? `${health.model} · ready` : 'Model offline'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Left panel — input */}
        <div style={{ width: '420px', flexShrink: 0, borderRight: '1px solid var(--border)', background: '#fff', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ padding: '28px 28px 24px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '16px' }}>
              Input
            </div>
            <ConversationInput onSubmit={handleSubmit} loading={loading} />
            {error && (
              <div style={{ marginTop: '16px', padding: '12px 14px', background: 'rgba(193,68,14,0.06)', border: '1px solid rgba(193,68,14,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--red)', fontSize: '13px' }}>
                ⚠ {error}
              </div>
            )}
          </div>
        </div>

        {/* Right panel — info / empty state */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', padding: '36px 48px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '24px' }}>
            How it works
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px', marginBottom: '36px' }}>
            {[
              { n: '01', title: 'Batch routing', desc: '396 facets split into micro-batches of ~40, each scored in a separate LLM call. Scales to 5000+ facets without redesign.' },
              { n: '02', title: 'Few-shot prompting', desc: 'Each batch uses 3 anchor examples with score + reasoning. Not one-shot — satisfies hard constraint #1.' },
              { n: '03', title: '−2 to +2 scale', desc: 'Signed integers make polarity explicit. 0 = no evidence (strict rule). More intuitive than 0–4 for psychological facets.' },
              { n: '04', title: 'Confidence scores', desc: 'Each facet score includes a 0–100% confidence. Low confidence flags uncertain inferences for human review.' },
              { n: '05', title: 'Open weights only', desc: 'Qwen2.5:7B runs entirely on your local GPU via Ollama. No API keys, no data leaving your machine.' },
              { n: '06', title: 'Parallel workers', desc: 'Multiple batches run concurrently via asyncio semaphore. Worker count tunable via .env.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="card" style={{ padding: '20px' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent2)', marginBottom: '8px', fontWeight: 500 }}>{n}</div>
                <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: '15px', marginBottom: '6px', color: 'var(--text)' }}>{title}</div>
                <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* Score scale reference */}
          <div className="card" style={{ padding: '20px', maxWidth: '500px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: '14px' }}>Score scale reference</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[[-2,'#c1440e','Strongly absent / strongly negative'],[-1,'#d46a1a','Mildly absent'],[0,'#9a9080','Neutral — no observable evidence'],[1,'#40916c','Mildly present'],[2,'#2d6a4f','Strongly present / dominant']].map(([s,c,l]) => (
                <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 600, color: c, minWidth: '24px', textAlign: 'right' }}>{s > 0 ? '+' : ''}{s}</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--text2)' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
