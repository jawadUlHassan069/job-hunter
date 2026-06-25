// src/pages/Auth.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const BASE   = 'http://localhost:8000'
const ACCENT = '#1d9e75'

function isLoggedIn() {
  try { return !!localStorage.getItem('access_token'); } catch { return false; }
}
function extractTokens(data) {
  return {
    access:  data?.tokens?.access  || data?.access  || data?.token  || null,
    refresh: data?.tokens?.refresh || data?.refresh || null,
  }
}

const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 500,
  marginBottom: 5, color: 'rgba(0,0,0,0.50)',
  fontFamily: "'DM Mono', monospace", letterSpacing: '0.04em',
}

// inputStyle is now handled by CSS class "auth-input" in index.css
// Keeping this only for the OTP field which needs extra overrides
const otpExtraStyle = {
  textAlign: 'center', fontSize: 22, letterSpacing: '0.35em', fontWeight: 700,
}

/* ── Login Form ── */
function LoginForm({ onSwitch, onRequires2FA, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/auth/login/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({email,password}) })
      const data = await res.json()
      if (res.status === 429) { setError('Too many attempts. Please wait a minute and try again.'); return }
      if (!res.ok) { setError(data.error||data.detail||'Invalid credentials'); return }
      if (data.requires_2fa) onRequires2FA(data.user_id)
      else onSuccess(data)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
      {error && <div style={{padding:'9px 12px',borderRadius:7,background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',color:'#dc2626',fontSize:12}}>{error}</div>}
      <div>
        <label style={labelStyle}>Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required className="auth-input" placeholder="you@example.com" />
      </div>
      <div style={{position:'relative'}}>
        <label style={labelStyle}>Password</label>
        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e=>setPassword(e.target.value)} required className="auth-input" placeholder="••••••••" style={{paddingRight:'40px'}} />
        <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute',right:'10px',top:'30px',background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'rgba(0,0,0,0.4)',padding:'4px 6px',display:'flex',alignItems:'center',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color='rgba(0,0,0,0.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(0,0,0,0.4)'}>
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
      </div>
      <button type="submit" disabled={loading} style={{width:'100%',padding:'12px',background:ACCENT,color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',transition:'opacity .15s',opacity:loading?0.7:1}}>
        {loading ? 'Signing in…' : 'Sign In'}
      </button>
      <p style={{textAlign:'center',fontSize:12,color:'rgba(0,0,0,0.42)',margin:0}}>
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} style={{background:'none',border:'none',color:ACCENT,cursor:'pointer',fontSize:12,fontWeight:600}}>Create one</button>
      </p>
    </form>
  )
}

/* ── Register Form ── */
function RegisterForm({ onSwitch, onSuccess }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setFieldErrors({})
    try {
      const res  = await fetch(`${BASE}/api/auth/register/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,password}) })
      const data = await res.json()
      if (!res.ok) {
        if (res.status === 429) { setError('Too many attempts. Please wait a minute and try again.'); return }
        // Collect all field errors
        const errors = {}
        if (data.email?.[0]) errors.email = data.email[0]
        if (data.name?.[0]) errors.name = data.name[0]
        if (data.password?.[0]) errors.password = data.password[0]
        
        // Set field-specific errors for inline display
        setFieldErrors(errors)
        
        // Build a clear error message
        if (Object.keys(errors).length > 0) {
          const errorMessages = Object.entries(errors).map(([field, msg]) => 
            `${field.charAt(0).toUpperCase() + field.slice(1)}: ${msg}`
          ).join(' • ')
          setError(errorMessages)
        } else if (data.non_field_errors?.[0]) {
          setError(data.non_field_errors[0])
        } else {
          setError(data.error || data.detail || 'Registration failed')
        }
        return
      }
      onSuccess(data)
    } catch { setError('Network error. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
      {error && <div style={{padding:'9px 12px',borderRadius:7,background:'rgba(239,68,68,0.07)',border:'1px solid rgba(239,68,68,0.18)',color:'#dc2626',fontSize:12}}>{error}</div>}
      <div>
        <label style={labelStyle}>Full Name</label>
        <input 
          type="text" 
          value={name} 
          onChange={e=>{setName(e.target.value); if(fieldErrors.name) setFieldErrors(prev=>({...prev, name:null}))}} 
          required 
          className="auth-input" 
          placeholder="John Doe" 
          style={fieldErrors.name ? {borderColor:'#ef4444',borderWidth:'1.5px'} : {}}
        />
        {fieldErrors.name && <div style={{fontSize:10,color:'#ef4444',marginTop:3,fontFamily:mono}}>{fieldErrors.name}</div>}
      </div>
      <div>
        <label style={labelStyle}>Email</label>
        <input 
          type="email" 
          value={email} 
          onChange={e=>{setEmail(e.target.value); if(fieldErrors.email) setFieldErrors(prev=>({...prev, email:null}))}} 
          required 
          className="auth-input" 
          placeholder="you@example.com" 
          style={fieldErrors.email ? {borderColor:'#ef4444',borderWidth:'1.5px'} : {}}
        />
        {fieldErrors.email && <div style={{fontSize:10,color:'#ef4444',marginTop:3,fontFamily:mono}}>{fieldErrors.email}</div>}
      </div>
      <div style={{position:'relative'}}>
        <label style={labelStyle}>Password</label>
        <input 
          type={showPassword ? 'text' : 'password'} 
          value={password} 
          onChange={e=>{setPassword(e.target.value); if(fieldErrors.password) setFieldErrors(prev=>({...prev, password:null}))}} 
          required 
          className="auth-input" 
          placeholder="Min. 8 characters" 
          style={fieldErrors.password ? {paddingRight:'40px',borderColor:'#ef4444',borderWidth:'1.5px'} : {paddingRight:'40px'}}
        />
        <button type="button" onClick={()=>setShowPassword(!showPassword)} style={{position:'absolute',right:'10px',top:'30px',background:'none',border:'none',cursor:'pointer',fontSize:'18px',color:'rgba(0,0,0,0.4)',padding:'4px 6px',display:'flex',alignItems:'center',transition:'color 0.2s'}} onMouseEnter={e=>e.currentTarget.style.color='rgba(0,0,0,0.7)'} onMouseLeave={e=>e.currentTarget.style.color='rgba(0,0,0,0.4)'}>
          {showPassword ? '👁️' : '👁️‍🗨️'}
        </button>
        {fieldErrors.password && <div style={{fontSize:10,color:'#ef4444',marginTop:3,fontFamily:mono}}>{fieldErrors.password}</div>}
      </div>
      <button type="submit" disabled={loading} style={{width:'100%',padding:'12px',background:ACCENT,color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',transition:'opacity .15s',opacity:loading?0.7:1}}>
        {loading ? 'Creating account…' : 'Create Account'}
      </button>
      <p style={{textAlign:'center',fontSize:12,color:'rgba(0,0,0,0.42)',margin:0}}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} style={{background:'none',border:'none',color:ACCENT,cursor:'pointer',fontSize:12,fontWeight:600}}>Sign in</button>
      </p>
    </form>
  )
}

/* ── OTP Form ── */
function OTPForm({ userId, onBack, onSuccess }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (code.length !== 6) { setError('Enter 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const res  = await fetch(`${BASE}/api/auth/2fa/verify/`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({user_id:userId,code}) })
      const data = await res.json()
      if (!res.ok) { setError(data.error||data.detail||'Invalid OTP'); return }
      onSuccess(data)
    } catch { setError('Verification failed.') }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} style={{display:'flex',flexDirection:'column',gap:14}}>
      <div>
        <label style={labelStyle}>6-digit code from Google Authenticator</label>
        <input type="text" value={code} maxLength={6} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))}
          className="auth-input" style={otpExtraStyle} placeholder="000000" />
      </div>
      {error && <div style={{color:'#dc2626',fontSize:12,textAlign:'center'}}>{error}</div>}
      <button type="submit" disabled={loading||code.length!==6} style={{width:'100%',padding:'12px',background:ACCENT,color:'#fff',border:'none',borderRadius:9,fontSize:14,fontWeight:700,cursor:'pointer',opacity:loading||code.length!==6?0.5:1}}>
        {loading ? 'Verifying…' : 'Verify OTP'}
      </button>
      <button type="button" onClick={onBack} style={{background:'none',border:'none',color:'rgba(0,0,0,0.38)',cursor:'pointer',fontSize:12,padding:'4px 0'}}>← Back to Login</button>
    </form>
  )
}

/* ── Brand Panel ── */
function BrandPanel() {
  return (
    <div style={{
      width:320, flexShrink:0,
      background:'linear-gradient(160deg,#070a12 0%,#0a1a14 100%)',
      padding:'40px 32px',
      display:'flex', flexDirection:'column', justifyContent:'space-between',
      position:'relative', overflow:'hidden',
    }}>
      <div style={{position:'absolute',bottom:-40,right:-40,width:220,height:220,borderRadius:'50%',background:`radial-gradient(circle,${ACCENT}20 0%,transparent 70%)`,pointerEvents:'none'}}/>
      <div>
        <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:36}}>
          <span style={{fontSize:16,fontWeight:900,color:ACCENT,fontFamily:"'Syne',sans-serif"}}>JOB</span>
          <span style={{fontSize:16,fontWeight:900,color:'#f3f6ff',fontFamily:"'Syne',sans-serif"}}>HUNTER</span>
        </div>
        <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",letterSpacing:'0.2em',color:`${ACCENT}88`,marginBottom:12}}>◈ AI-POWERED PLATFORM</div>
        <h2 style={{fontSize:'clamp(1.3rem,2.2vw,1.75rem)',fontWeight:900,color:'#f3f6ff',lineHeight:1.2,margin:'0 0 14px',fontFamily:"'Syne',sans-serif"}}>
          Land your<br/>dream job<br/><span style={{color:ACCENT}}>faster.</span>
        </h2>
        <p style={{fontSize:11,color:'rgba(243,246,255,0.42)',lineHeight:1.7,maxWidth:220,fontFamily:"'DM Mono',monospace"}}>
          Upload your CV, get ATS scores, and match to jobs using AI.
        </p>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {[['◎','ATS Score'],['◈','AI Matching'],['◑','Skill Gap'],['✦','CV Builder']].map(([icon,text])=>(
          <div key={text} style={{display:'flex',alignItems:'center',gap:8}}>
            <span style={{color:ACCENT,fontSize:11}}>{icon}</span>
            <span style={{fontSize:11,color:'rgba(243,246,255,0.48)',fontFamily:"'DM Mono',monospace"}}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Main Auth Page ── */
export default function AuthPage() {
  const navigate = useNavigate()
  const [ready]   = useState(() => !isLoggedIn())
  const [mode,     setMode]    = useState('login')
  const [animKey,  setAnimKey] = useState(0)
  const [userId,   setUserId]  = useState(null)

  useEffect(() => { if (!ready) navigate('/dashboard',{replace:true}) }, [ready,navigate])
  if (!ready) return null

  function switchMode(next) { if(next===mode)return; setMode(next); setAnimKey(k=>k+1) }
  function handleRequires2FA(uid) { setUserId(uid); setMode('otp'); setAnimKey(k=>k+1) }
  function saveAndGo(data) {
    const {access,refresh} = extractTokens(data)
    if (!access) return
    localStorage.setItem('access_token',access)
    if (refresh) localStorage.setItem('refresh_token',refresh)
    navigate('/dashboard',{replace:true})
  }

  const HEADING = {
    login:    {tag:'Sign In',        h:['Welcome ','back.']},
    register: {tag:'Create Account', h:['Create your ','account.']},
    otp:      {tag:'Two-Factor',     h:['Verify your ','identity.']},
  }
  const h = HEADING[mode]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;}
        body{margin:0;font-family:'DM Sans',sans-serif;}
        @keyframes authIn{from{opacity:0;transform:scale(0.97) translateY(8px)}to{opacity:1;transform:scale(1) translateY(0)}}
        @keyframes slideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:translateX(0)}}
        .auth-brand{display:flex;}
        /* Ensure auth-input focus accent is visible */
        .auth-input:focus { border-color: #1d9e75 !important; box-shadow: 0 0 0 3px rgba(29,158,117,0.10); }
        @media(max-width:600px){
          .auth-brand{display:none!important;}
          .auth-form-panel{padding:28px 20px!important;}
          .auth-home-link{display:none!important;}
        }
      `}</style>

      <div style={{minHeight:'100vh',background:'#eeeee8',display:'flex',alignItems:'center',justifyContent:'center',padding:'16px',position:'relative'}}>

        {/* Back to Home — top left */}
        <a href="/" className="auth-home-link" style={{
          position:'fixed',top:16,left:20,display:'flex',alignItems:'center',gap:5,
          fontSize:11,fontFamily:"'DM Mono',monospace",color:'rgba(0,0,0,0.40)',
          textDecoration:'none',padding:'5px 10px',borderRadius:7,
          border:'1px solid rgba(0,0,0,0.09)',background:'rgba(255,255,255,0.65)',
          backdropFilter:'blur(8px)',transition:'all 0.2s',zIndex:10,
        }}
          onMouseEnter={e=>{e.currentTarget.style.color='#0a0a0a';e.currentTarget.style.borderColor='rgba(0,0,0,0.20)';}}
          onMouseLeave={e=>{e.currentTarget.style.color='rgba(0,0,0,0.40)';e.currentTarget.style.borderColor='rgba(0,0,0,0.09)';}}>
          ← Home
        </a>

        {/* Card — smaller maxWidth */}
        <div style={{
          display:'flex',width:'100%',maxWidth:760,
          borderRadius:20,overflow:'hidden',
          boxShadow:'0 24px 64px rgba(0,0,0,0.10)',
          border:'1px solid rgba(0,0,0,0.06)',
          animation:'authIn 0.4s cubic-bezier(0.22,1,0.36,1)',
        }}>
          {/* Brand */}
          <div className="auth-brand"><BrandPanel /></div>

          {/* Form */}
          <div className="auth-form-panel" style={{
            flex:1, background:'#fff',
            padding:'36px 36px',
            display:'flex', flexDirection:'column', justifyContent:'center',
            position:'relative', overflow:'hidden',
          }}>
            <div style={{position:'absolute',top:-50,right:-50,width:180,height:180,borderRadius:'50%',background:`radial-gradient(circle,${ACCENT}07 0%,transparent 70%)`,pointerEvents:'none'}}/>

            {/* Tabs — CENTERED */}
            {mode !== 'otp' && (
              <div style={{display:'flex',justifyContent:'center',marginBottom:28}}>
                <div style={{display:'flex',gap:2,background:'#f0efeb',borderRadius:9,padding:3}}>
                  {[['login','Sign in'],['register','Register']].map(([m,label])=>(
                    <button key={m} type="button" onClick={()=>switchMode(m)} style={{
                      padding:'7px 20px',borderRadius:7,border:'none',cursor:'pointer',
                      fontSize:12,fontFamily:"'DM Mono',monospace",
                      background:mode===m?'#fff':'transparent',
                      color:mode===m?'#0a0a0a':'rgba(0,0,0,0.30)',
                      boxShadow:mode===m?'0 1px 4px rgba(0,0,0,0.07)':'none',
                      transition:'all 0.2s',fontWeight:mode===m?600:400,
                      whiteSpace:'nowrap',
                    }}>{label}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Heading */}
            <div style={{marginBottom:24}}>
              <div style={{fontSize:9,fontFamily:"'DM Mono',monospace",letterSpacing:'0.18em',textTransform:'uppercase',color:ACCENT,marginBottom:7}}>◈ {h.tag}</div>
              <h1 style={{fontFamily:"'Syne',sans-serif",fontWeight:900,fontSize:'clamp(1.4rem,2.5vw,1.9rem)',color:'#0a0a0a',letterSpacing:'-0.02em',lineHeight:1.1,margin:0}}>
                {h.h[0]}<span style={{color:ACCENT}}>{h.h[1]}</span>
              </h1>
            </div>

            {/* Form content */}
            <div key={animKey} style={{animation:'slideIn 0.22s cubic-bezier(0.22,1,0.36,1)'}}>
              {mode==='login'    && <LoginForm    onSwitch={()=>switchMode('register')} onRequires2FA={handleRequires2FA} onSuccess={saveAndGo}/>}
              {mode==='register' && <RegisterForm onSwitch={()=>switchMode('login')}    onSuccess={saveAndGo}/>}
              {mode==='otp'      && <OTPForm      userId={userId} onBack={()=>{setUserId(null);switchMode('login')}} onSuccess={saveAndGo}/>}
            </div>

            {/* Mobile back to home */}
            <div style={{marginTop:20,textAlign:'center',display:'none'}} className="auth-home-mobile">
              <a href="/" style={{fontSize:11,fontFamily:"'DM Mono',monospace",color:'rgba(0,0,0,0.35)',textDecoration:'none'}}>← Back to Home</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
