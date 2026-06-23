// src/pages/Auth.jsx  — fully self-contained, no child component dependencies
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE = 'http://localhost:8000'
const ACCENT = '#1d9e75'

function extractTokens(data) {
  return {
    access:  data?.tokens?.access  || data?.access  || data?.token  || null,
    refresh: data?.tokens?.refresh || data?.refresh || null,
  }
}

/* ── Shared input style ── */
const inputStyle = {
  width: '100%', padding: '12px 16px',
  border: '1.5px solid rgba(0,0,0,0.12)', borderRadius: 12,
  fontSize: 14, fontFamily: 'inherit', outline: 'none',
  background: '#fafafa', color: '#0a0a0a',
  transition: 'border-color .2s',
  boxSizing: 'border-box',
}

const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 500,
  marginBottom: 6, color: 'rgba(0,0,0,0.6)',
  fontFamily: "'DM Mono', monospace", letterSpacing: '0.05em',
}

const btnStyle = {
  width: '100%', padding: '13px 0',
  background: ACCENT, color: '#fff',
  border: 'none', borderRadius: 12,
  fontSize: 14, fontWeight: 700,
  cursor: 'pointer', transition: 'opacity .15s',
  fontFamily: 'inherit',
}

/* ── Login Form ── */
function LoginForm({ onSwitch, onRequires2FA, onSuccess }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/auth/login/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || data.message || 'Invalid credentials'); return }
      if (data.requires_2fa) { onRequires2FA(data.user_id) }
      else { onSuccess(data) }
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}
      <div>
        <label style={labelStyle}>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'} />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="••••••••"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'} />
      </div>
      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: 0 }}>
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Create one
        </button>
      </p>
    </form>
  )
}

/* ── Register Form ── */
function RegisterForm({ onSwitch, onSuccess }) {
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/auth/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || data.message || 'Registration failed'); return }
      onSuccess(data)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#dc2626', fontSize: 13 }}>
          {error}
        </div>
      )}
      <div>
        <label style={labelStyle}>Full Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)} required style={inputStyle} placeholder="John Doe"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'} />
      </div>
      <div>
        <label style={labelStyle}>Email Address</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} placeholder="you@example.com"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'} />
      </div>
      <div>
        <label style={labelStyle}>Password</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required style={inputStyle} placeholder="Minimum 8 characters"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'} />
      </div>
      <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
      <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(0,0,0,0.5)', margin: 0 }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
          Sign in
        </button>
      </p>
    </form>
  )
}

/* ── OTP Form ── */
function OTPForm({ userId, onBack, onSuccess }) {
  const [code,    setCode]    = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Please enter 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/auth/2fa/verify/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, code }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.detail || 'Invalid OTP'); return }
      onSuccess(data)
    } catch { setError('Verification failed. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>6-digit code from Google Authenticator</label>
        <input
          type="text" value={code} maxLength={6}
          onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          style={{ ...inputStyle, textAlign: 'center', fontSize: 24, letterSpacing: '0.4em', fontWeight: 700 }}
          placeholder="000000"
          onFocus={e => e.target.style.borderColor = ACCENT} onBlur={e => e.target.style.borderColor = 'rgba(0,0,0,0.12)'}
        />
      </div>
      {error && <div style={{ color: '#dc2626', fontSize: 13, textAlign: 'center' }}>{error}</div>}
      <button type="submit" disabled={loading || code.length !== 6} style={{ ...btnStyle, opacity: loading || code.length !== 6 ? 0.5 : 1 }}>
        {loading ? 'Verifying…' : 'Verify OTP'}
      </button>
      <button type="button" onClick={onBack} style={{ background: 'none', border: 'none', color: 'rgba(0,0,0,0.45)', cursor: 'pointer', fontSize: 13, padding: '6px 0' }}>
        ← Back to Login
      </button>
    </form>
  )
}

/* ── Brand Panel ── */
function BrandPanel() {
  return (
    <div style={{
      width: 380, flexShrink: 0,
      background: 'linear-gradient(160deg, #0a0a0a 0%, #0d1a14 100%)',
      padding: '52px 44px',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glow */}
      <div style={{ position: 'absolute', bottom: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}25 0%, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -40, left: -40, width: 180, height: 180, borderRadius: '50%', background: 'radial-gradient(circle, rgba(55,138,221,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 48 }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: ACCENT, letterSpacing: '-0.5px' }}>JOB</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#f3f6ff', letterSpacing: '-0.5px' }}>HUNTER</span>
        </div>

        <div style={{ fontSize: 10, fontFamily: 'monospace', letterSpacing: '0.22em', color: `${ACCENT}99`, marginBottom: 16 }}>◈ AI-POWERED PLATFORM</div>
        <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 900, color: '#f3f6ff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: 20 }}>
          Land your<br />dream job<br /><span style={{ color: ACCENT }}>faster.</span>
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(243,246,255,0.45)', lineHeight: 1.7, maxWidth: 260 }}>
          Upload your CV, get instant ATS scores, and match to hundreds of jobs using AI.
        </p>
      </div>

      {/* Feature list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {[
          { icon: '◎', text: 'ATS Score Analysis' },
          { icon: '◈', text: 'AI Job Matching' },
          { icon: '◑', text: 'Skill Gap Reports' },
          { icon: '✦', text: 'CV Builder Agent' },
        ].map(f => (
          <div key={f.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: ACCENT, fontSize: 13, width: 16 }}>{f.icon}</span>
            <span style={{ fontSize: 13, color: 'rgba(243,246,255,0.55)', fontFamily: 'monospace' }}>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Auth Page ── */
export default function AuthPage() {
  const [mode,    setMode]    = useState('login')
  const [animKey, setAnimKey] = useState(0)
  const [userId,  setUserId]  = useState(null)
  const navigate              = useNavigate()

  useEffect(() => {
    if (localStorage.getItem('access_token')) navigate('/dashboard', { replace: true })
  }, [navigate])

  function switchMode(next) {
    if (next === mode) return
    setMode(next); setAnimKey(k => k + 1)
  }

  function handleRequires2FA(uid) { setUserId(uid); setMode('otp'); setAnimKey(k => k + 1) }

  function saveAndGo(data) {
    const { access, refresh } = extractTokens(data)
    if (!access) { console.error('No access token in response:', data); return }
    localStorage.setItem('access_token', access)
    if (refresh) localStorage.setItem('refresh_token', refresh)
    navigate('/dashboard', { replace: true })
  }

  const HEADING = {
    login:    { tag: 'Authentication',   h: ['Welcome ', 'back.'] },
    register: { tag: 'New account',      h: ['Create your ', 'account.'] },
    otp:      { tag: 'Two-factor auth',  h: ['Verify your ', 'identity.'] },
  }
  const h = HEADING[mode]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        body { margin: 0; font-family: 'DM Sans', sans-serif; }
        @keyframes scaleIn { from { opacity:0; transform:scale(0.95) } to { opacity:1; transform:scale(1) } }
        @keyframes slideIn { from { opacity:0; transform:translateX(16px) } to { opacity:1; transform:translateX(0) } }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#f0f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{
          display: 'flex', width: '100%', maxWidth: 920, minHeight: 600,
          borderRadius: 24, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.14)',
          border: '1px solid rgba(0,0,0,0.07)',
          animation: 'scaleIn 0.5s cubic-bezier(0.22,1,0.36,1)',
        }}>

          {/* Brand */}
          <BrandPanel />

          {/* Form side */}
          <div style={{ flex: 1, background: '#fff', padding: '52px 48px', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            {/* Subtle glow */}
            <div style={{ position: 'absolute', top: -80, right: -80, width: 240, height: 240, borderRadius: '50%', background: `radial-gradient(circle, ${ACCENT}0a 0%, transparent 70%)`, pointerEvents: 'none' }} />

            {/* Tabs */}
            {mode !== 'otp' && (
              <div style={{ display: 'flex', gap: 3, background: '#f0efeb', borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 36 }}>
                {[['login', 'Sign in'], ['register', 'Register']].map(([m, label]) => (
                  <button key={m} type="button" onClick={() => switchMode(m)} style={{
                    padding: '8px 22px', borderRadius: 8, border: 'none', cursor: 'pointer',
                    fontSize: 12, fontFamily: "'DM Mono', monospace",
                    background: mode === m ? '#fff' : 'transparent',
                    color: mode === m ? '#0a0a0a' : 'rgba(0,0,0,0.35)',
                    boxShadow: mode === m ? '0 1px 6px rgba(0,0,0,0.09)' : 'none',
                    transition: 'all 0.2s ease',
                    fontWeight: mode === m ? 600 : 400,
                  }}>{label}</button>
                ))}
              </div>
            )}

            {/* Heading */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.2em', textTransform: 'uppercase', color: ACCENT, marginBottom: 10 }}>◈ {h.tag}</div>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 'clamp(1.7rem,3vw,2.3rem)', color: '#0a0a0a', letterSpacing: '-0.025em', lineHeight: 1.1, margin: 0 }}>
                {h.h[0]}<span style={{ color: ACCENT }}>{h.h[1]}</span>
              </h1>
            </div>

            {/* Animated form swap */}
            <div key={animKey} style={{ animation: 'slideIn 0.28s cubic-bezier(0.22,1,0.36,1)' }}>
              {mode === 'login'    && <LoginForm    onSwitch={() => switchMode('register')} onRequires2FA={handleRequires2FA} onSuccess={saveAndGo} />}
              {mode === 'register' && <RegisterForm onSwitch={() => switchMode('login')}    onSuccess={saveAndGo} />}
              {mode === 'otp'      && <OTPForm      userId={userId} onBack={() => { setUserId(null); switchMode('login') }} onSuccess={saveAndGo} />}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
