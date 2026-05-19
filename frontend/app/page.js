'use client'

import { useState, useEffect, useRef } from 'react'
import { SignInButton, UserButton, useAuth } from '@clerk/nextjs'

const API_URL = '/api/v1/advice'

const IDLE_TEXT = {
  astrology:  'Describe your situation above and the stars will speak.',
  behavioral: 'Share your story and your patterns will be read.',
  history:    'Speak your truth and experience will guide you.',
}

const ADVISORS = [
  { key: 'astrology',  icon: '☽', name: 'Cosmic Reader',       role: 'Celestial Interpretation' },
  { key: 'behavioral', icon: '◎', name: 'Behavior Analyst',    role: 'Pattern Recognition' },
  { key: 'history',    icon: '♡', name: 'Experienced Advisor', role: 'Wisdom from Experience' },
]

export default function Page() {
  const { isSignedIn, isLoaded } = useAuth()
  const [situation, setSituation] = useState('')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)
  const [opinions,  setOpinions]  = useState([])
  const [synthesis, setSynthesis] = useState(null)
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    function resize() {
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const stars = Array.from({ length: 175 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.0  + 0.18,
      a: Math.random() * 0.4  + 0.07,
      s: Math.random() * 0.00026 + 0.00006,
      p: Math.random() * Math.PI * 2,
    }))

    const bright = Array.from({ length: 20 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.2  + 0.85,
      a: Math.random() * 0.5  + 0.22,
      s: Math.random() * 0.00018 + 0.00005,
      p: Math.random() * Math.PI * 2,
    }))

    let raf
    function draw(t) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const W = canvas.width, H = canvas.height

      for (const s of stars) {
        const a = s.a * (0.5 + 0.5 * Math.sin(t * s.s * 1000 + s.p))
        ctx.beginPath()
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200,182,255,${a})`
        ctx.fill()
      }

      for (const s of bright) {
        const a = s.a * (0.55 + 0.45 * Math.sin(t * s.s * 1000 + s.p))
        const x = s.x * W, y = s.y * H
        const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 3.8)
        g.addColorStop(0, `rgba(230,215,255,${a})`)
        g.addColorStop(1, `rgba(180,155,255,0)`)
        ctx.beginPath()
        ctx.arc(x, y, s.r * 3.8, 0, Math.PI * 2)
        ctx.fillStyle = g
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, y, s.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240,230,255,${a})`
        ctx.fill()
      }

      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setOpinions([])
    setSynthesis(null)

    try {
      const response = await fetch(API_URL, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:    'demo-user',
          birth_date: '1990-01-01',
          preferences: {
            looking_for:  'relationship-advice',
            interests:    situation.trim() ? [situation.trim()] : [],
            dealbreakers: [],
          },
        }),
      })

      if (!response.ok) {
        const detail = await response.text()
        throw new Error(`Server returned ${response.status}: ${detail}`)
      }

      const data = await response.json()
      setOpinions(data.opinions || [])
      setSynthesis({ final_advice: data.final_advice, rationale: data.rationale })
    } catch (err) {
      setError(err.message || 'Request failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <canvas id="stars-canvas" ref={canvasRef} />
      <div className="orb orb--1" />
      <div className="orb orb--2" />
      <div className="orb orb--3" />
      <div className="orbit-ring orbit-ring--1" />
      <div className="orbit-ring orbit-ring--2" />
      <div className="orbit-ring orbit-ring--3" />

      {/* Auth bar — top-right corner */}
      {isLoaded && (
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1.25rem',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          {isSignedIn ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <SignInButton mode="modal">
              <button style={{
                fontFamily: "'Cinzel', serif",
                fontSize: '0.65rem',
                fontWeight: 500,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                color: '#c8c0e8',
                background: 'rgba(120,80,255,0.12)',
                border: '1px solid rgba(170,140,255,0.3)',
                borderRadius: '8px',
                padding: '0.45rem 1rem',
                cursor: 'pointer',
              }}>
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
      )}

      <div className="page">

        <header className="hero">
          <div className="hero-glyph">
            <svg viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="45" cy="45" r="43" stroke="url(#g1)" strokeWidth="0.6"/>
              <circle cx="45" cy="45" r="32" stroke="rgba(155,127,255,0.14)" strokeWidth="0.5" strokeDasharray="2.5 3.5"/>
              <circle cx="45" cy="45" r="20" stroke="rgba(155,127,255,0.1)" strokeWidth="0.5"/>
              <line x1="45" y1="2" x2="45" y2="88" stroke="rgba(155,127,255,0.1)" strokeWidth="0.5"/>
              <line x1="2" y1="45" x2="88" y2="45" stroke="rgba(155,127,255,0.1)" strokeWidth="0.5"/>
              <line x1="13" y1="13" x2="77" y2="77" stroke="rgba(155,127,255,0.065)" strokeWidth="0.5"/>
              <line x1="77" y1="13" x2="13" y2="77" stroke="rgba(155,127,255,0.065)" strokeWidth="0.5"/>
              <polygon points="45,5 47.2,11 42.8,11" fill="rgba(180,155,255,0.75)"/>
              <polygon points="45,85 47.2,79 42.8,79" fill="rgba(155,127,255,0.45)"/>
              <polygon points="85,45 79,42.8 79,47.2" fill="rgba(155,127,255,0.45)"/>
              <polygon points="5,45 11,42.8 11,47.2" fill="rgba(155,127,255,0.45)"/>
              <path d="M45 31C37.5 31 30 36.5 30 45s7.5 14 15 14c-4.5-4.5-5.5-20 0-28z" fill="rgba(155,127,255,0.38)"/>
              <circle cx="45" cy="45" r="5.5" fill="rgba(155,127,255,0.18)" stroke="rgba(180,155,255,0.4)" strokeWidth="0.7"/>
              <circle cx="45" cy="45" r="2" fill="rgba(220,205,255,0.9)"/>
              <circle cx="45" cy="7"  r="1.4" fill="rgba(180,155,255,0.8)"/>
              <circle cx="83" cy="45" r="1.1" fill="rgba(155,127,255,0.55)"/>
              <circle cx="45" cy="83" r="1.1" fill="rgba(155,127,255,0.55)"/>
              <circle cx="7"  cy="45" r="1.1" fill="rgba(155,127,255,0.55)"/>
              <circle cx="19" cy="19" r="0.8" fill="rgba(155,127,255,0.4)"/>
              <circle cx="71" cy="19" r="0.8" fill="rgba(155,127,255,0.4)"/>
              <circle cx="71" cy="71" r="0.8" fill="rgba(155,127,255,0.4)"/>
              <circle cx="19" cy="71" r="0.8" fill="rgba(155,127,255,0.4)"/>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%"   stopColor="rgba(180,155,255,0.45)"/>
                  <stop offset="50%"  stopColor="rgba(100,75,220,0.18)"/>
                  <stop offset="100%" stopColor="rgba(155,127,255,0.42)"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="hero-title">Cosmic Council</h1>
          <p className="hero-tagline">Describe your situation. Three advisors will speak.</p>
        </header>

        <div className="input-panel">
          <form id="advice-form" onSubmit={handleSubmit}>
            <label className="input-label" htmlFor="situation">Your Situation</label>
            <textarea
              id="situation"
              name="situation"
              rows={6}
              maxLength={1000}
              placeholder={"What happened? What are you feeling? What do you need clarity on?\n\nBe honest — the council listens without judgment."}
              required
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
            <div className="input-footer">
              <span className={`char-count${situation.length > 850 ? ' near-limit' : ''}`}>
                {situation.length} / 1000
              </span>
              <button type="submit" id="submit-btn" className="summon-btn" disabled={loading}>
                <svg className="btn-moon" viewBox="0 0 14 14" fill="none">
                  <path d="M7 1.5C4 1.5 1.5 4 1.5 7s2.5 5.5 5.5 5.5c.7 0 1.4-.14 2-.4C6.8 11.1 5.5 9.2 5.5 7S6.8 2.9 9 1.9A5.4 5.4 0 0 0 7 1.5Z" fill="currentColor"/>
                </svg>
                {loading ? 'Consulting\u2026' : 'Summon the Council'}
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        <div className="section-heading">
          <div className="sh-line" />
          <div className="sh-label">
            <span className="sh-star">✦</span>
            <span>Three Perspectives</span>
            <span className="sh-star">✦</span>
          </div>
          <div className="sh-line" />
        </div>

        <div className="advisors-grid" id="opinions">
          {ADVISORS.map(({ key, icon, name, role }) => {
            const opinion = opinions.find((o) => o.agent_name === key)
            const cardClass = [
              'advisor-card',
              loading             ? 'card--loading' : '',
              opinion && !loading ? 'card--active'  : '',
            ].filter(Boolean).join(' ')

            return (
              <div key={key} className={cardClass} data-agent={key}>
                <div className="advisor-icon">{icon}</div>
                <span className="advisor-name">{name}</span>
                <span className="advisor-role">{role}</span>
                <div className="advisor-rule" />
                <p className={`advisor-advice${opinion ? '' : ' advisor-advice--idle'}`}>
                  {opinion ? opinion.advice : IDLE_TEXT[key]}
                </p>
                {opinion && (
                  <span className={`source-badge source-${opinion.source}`}>
                    {opinion.source}
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {synthesis && (
          <div id="result" className="synthesis-card">
            <div className="synthesis-top">
              <div className="synthesis-glyph">⊕</div>
              <div className="synthesis-meta">
                <span className="synthesis-eyebrow">✦ &thinsp; Council Synthesis &thinsp; ✦</span>
                <span className="synthesis-role">Unified Perspective</span>
              </div>
            </div>
            <div className="synthesis-divider" />
            <p id="final-advice" className="synthesis-advice">{synthesis.final_advice}</p>
            <p id="rationale"    className="synthesis-rationale">{synthesis.rationale}</p>
          </div>
        )}

        <footer className="page-footer">
          <span>✦ &ensp; Trust the stars, but also trust yourself &ensp; ✦</span>
        </footer>

      </div>

      <div id="scores"        style={{ display: 'none' }} />
      <div id="agent-sources" style={{ display: 'none' }} />
    </>
  )
}
