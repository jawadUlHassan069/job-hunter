import { useState, useRef, useEffect, useCallback } from "react";

/* ─── API helper ─────────────────────────────────────────────────── */
const BASE = "http://localhost:8000";
const api = async (path, opts = {}) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    const refresh = localStorage.getItem("refresh_token");
    if (refresh) {
      const rr = await fetch(`${BASE}/api/auth/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (rr.ok) {
        const { access } = await rr.json();
        localStorage.setItem("access_token", access);
        return fetch(`${BASE}${path}`, {
          ...opts,
          headers: { ...(opts.headers || {}), Authorization: `Bearer ${access}` },
        });
      }
    }
    throw new Error("AUTH");
  }
  return res;
};

/* ─── Helpers ────────────────────────────────────────────────────── */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function scoreColor(s) {
  if (s >= 80) return "var(--accent)";
  if (s >= 60) return "#eab308";
  return "#ef4444";
}
function scoreLabel(s) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Needs Work";
}

/* ─── Page-scoped CSS (only animations & utilities) ──────────────── */
const PAGE_CSS = `
  @keyframes cv-fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cv-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes cv-blink    { 0%,100%{opacity:1} 50%{opacity:0.1} }
  @keyframes cv-spin     { to{transform:rotate(360deg)} }
  @keyframes cv-scanLine { 0%{transform:translateY(-100%);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(800%);opacity:0} }
  @keyframes cv-fillBar  { from{width:0} to{width:var(--bar-w)} }
  @keyframes cv-cardIn   { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cv-pulseRing{ 0%{transform:scale(1);opacity:0.6} 100%{transform:scale(1.8);opacity:0} }
  @keyframes cv-drawerIn { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes cv-shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes cv-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }

  .cv-shimmer {
    background: linear-gradient(90deg, var(--surface) 0%, rgba(255,255,255,0.06) 50%, var(--surface) 100%);
    background-size: 200% 100%;
    animation: cv-shimmer 1.6s ease infinite;
  }
  .cv-job-card { transition: border-color .25s, box-shadow .25s, transform .25s; }
  .cv-job-card:hover {
    border-color: rgba(29,158,117,0.38) !important;
    box-shadow: 0 8px 40px rgba(29,158,117,0.10);
    transform: translateY(-3px);
  }
  .cv-btn-primary { transition: opacity .15s, transform .15s, box-shadow .15s; }
  .cv-btn-primary:hover:not(:disabled) { opacity:.88; transform:scale(1.03); box-shadow:0 0 28px rgba(29,158,117,0.4); }
  .cv-btn-primary:active:not(:disabled) { transform:scale(0.98); }
  .cv-gap-row { transition: background .2s; }
  .cv-gap-row:hover { background: rgba(255,255,255,0.025) !important; }
  .cv-skill-tag { transition: background .2s, border-color .2s; }
  .cv-filter-btn { transition: all .2s; }
  .cv-filter-btn:hover { opacity: 0.85; }
`;

/* ─── Shared style primitives that respect CSS vars ──────────────── */
const card = {
  background: "var(--card-bg)",
  border: "1px solid var(--border)",
  borderRadius: 16,
};
const mono = "'JetBrains Mono', monospace";
const heading = "'Plus Jakarta Sans', sans-serif";

/* ─── Section label ──────────────────────────────────────────────── */
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: mono, letterSpacing: "0.22em",
      textTransform: "uppercase", color: "var(--accent)", marginBottom: 14,
    }}>
      ◈ {children}
    </div>
  );
}

/* ─── Animated ATS score ring ────────────────────────────────────── */
function ScoreRing({ score, size = 130 }) {
  const [displayed, setDisplayed] = useState(0);
  const R    = (size / 2) - 10;
  const circ = 2 * Math.PI * R;
  const dash = (displayed / 100) * circ;
  const col  = scoreColor(score);

  useEffect(() => {
    let raf, start = null;
    const dur = 1400;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(score * e));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div style={{ position:"relative", width:size, height:size, flexShrink:0 }}>
      {[0,0.3,0.6].map((d,i) => (
        <div key={i} style={{
          position:"absolute", inset:-6-i*4, borderRadius:"50%",
          border:`1px solid ${col}`,
          animation:`cv-pulseRing 2.4s ease-out ${d}s infinite`, opacity:0,
        }} />
      ))}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
        style={{ transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke="var(--border)" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={R} fill="none"
          stroke={col} strokeWidth={7} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition:"stroke 0.6s ease", filter:`drop-shadow(0 0 8px ${col})` }} />
      </svg>
      <div style={{
        position:"absolute", inset:0, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center",
      }}>
        <div style={{ fontFamily:heading, fontWeight:900, fontSize:size*0.22, color:col, lineHeight:1 }}>
          {displayed}
        </div>
        <div style={{ fontSize:8, color:"var(--text-muted)", letterSpacing:"0.12em", marginTop:2, fontFamily:mono }}>
          ATS SCORE
        </div>
      </div>
    </div>
  );
}

/* ─── Processing screen ──────────────────────────────────────────── */
const STAGES = [
  { key:"upload", icon:"⬆", label:"Uploading CV",          sub:"Securely transferring your document…"        },
  { key:"parse",  icon:"⚙", label:"Parsing with Claude AI", sub:"Extracting skills, experience & education…"  },
  { key:"ats",    icon:"◎", label:"Running ATS Analysis",   sub:"Scoring against industry benchmarks…"        },
  { key:"match",  icon:"◈", label:"Matching Jobs via RAG",  sub:"ChromaDB semantic search running…"           },
];

function ProcessingScreen({ stage }) {
  const current = STAGES.findIndex(s => s.key === stage);
  return (
    <div style={{
      display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
      minHeight:"55vh", gap:44, animation:"cv-fadeIn 0.5s ease",
    }}>
      {/* Animated document */}
      <div style={{ position:"relative", width:88, height:108, animation:"cv-float 3s ease infinite" }}>
        <div style={{
          width:"100%", height:"100%", borderRadius:10,
          background:"linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%)",
          border:"1px solid var(--border-strong)",
          display:"flex", flexDirection:"column", padding:"14px 12px", gap:5,
          boxShadow:"0 20px 60px rgba(0,0,0,0.4), 0 0 40px rgba(29,158,117,0.12)",
          overflow:"hidden",
        }}>
          {[70,50,60,40,55,35,48].map((w,i) => (
            <div key={i} style={{
              height:3, width:`${w}%`, borderRadius:2,
              background: i<2 ? "rgba(29,158,117,0.55)" : "var(--border-strong)",
            }} />
          ))}
          <div style={{
            position:"absolute", left:0, right:0, height:2,
            background:"linear-gradient(90deg,transparent,var(--accent),transparent)",
            animation:"cv-scanLine 2.2s ease-in-out infinite",
          }} />
        </div>
        <div style={{
          position:"absolute", top:0, right:0, width:20, height:20,
          background:"var(--bg)", borderLeft:"1px solid var(--border)",
          borderBottom:"1px solid var(--border)", borderRadius:"0 10px 0 7px",
        }} />
      </div>

      {/* Stage list */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", maxWidth:380 }}>
        {STAGES.map((s,i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <div key={s.key} style={{
              display:"flex", alignItems:"center", gap:14, padding:"12px 16px",
              borderRadius:12, border:`1px solid ${active ? "rgba(29,158,117,0.40)" : "var(--border)"}`,
              background: active ? "rgba(29,158,117,0.07)" : "transparent",
              transition:"all 0.4s ease", opacity: i > current ? 0.3 : 1,
            }}>
              <div style={{
                width:30, height:30, borderRadius:"50%", flexShrink:0,
                display:"flex", alignItems:"center", justifyContent:"center",
                background: done ? "var(--accent)" : active ? "rgba(29,158,117,0.18)" : "var(--surface)",
                border:`1px solid ${done ? "var(--accent)" : active ? "rgba(29,158,117,0.45)" : "var(--border)"}`,
                fontSize: done ? 12 : 14,
                color: done ? "#000" : active ? "var(--accent)" : "var(--text-muted)",
                transition:"all 0.4s ease",
                animation: active ? "cv-spin 1.2s linear infinite" : "none",
              }}>
                {done ? "✓" : s.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{
                  fontSize:12, fontWeight:600, fontFamily:mono,
                  color: done ? "var(--text-muted)" : active ? "var(--text)" : "var(--text-faint)",
                  marginBottom:2,
                }}>{s.label}</div>
                {active && (
                  <div style={{ fontSize:10, color:"var(--text-muted)", fontFamily:mono }}>
                    {s.sub}
                  </div>
                )}
              </div>
              {active && (
                <div style={{ display:"flex", gap:4 }}>
                  {[0,1,2].map(j => (
                    <div key={j} style={{
                      width:4, height:4, borderRadius:"50%", background:"var(--accent)",
                      animation:`cv-blink 1s ease-in-out ${j*0.25}s infinite`,
                    }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Upload zone ────────────────────────────────────────────────── */
function UploadZone({ onFile, loading }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);

  const handle = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
    if (file.size > 5 * 1024 * 1024)    { alert("File must be under 5MB.");   return; }
    onFile(file);
  };

  return (
    <div
      onClick={() => !loading && inputRef.current?.click()}
      onDragEnter={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        position:"relative",
        border:`1.5px dashed ${drag ? "var(--accent)" : "var(--border-strong)"}`,
        borderRadius:18, padding:"52px 32px", textAlign:"center",
        cursor: loading ? "not-allowed" : "pointer", overflow:"hidden",
        background: drag ? "rgba(29,158,117,0.06)" : "var(--surface)",
        transition:"all 0.25s ease",
        boxShadow: drag ? "0 0 40px rgba(29,158,117,0.15)" : "none",
      }}
    >
      {/* Grid bg */}
      <div style={{
        position:"absolute", inset:0, opacity:0.03, pointerEvents:"none",
        backgroundImage:"linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
        backgroundSize:"28px 28px",
      }} />

      <div style={{
        width:64, height:64, borderRadius:18, margin:"0 auto 20px",
        background: drag ? "rgba(29,158,117,0.18)" : "var(--surface)",
        border:`1px solid ${drag ? "rgba(29,158,117,0.45)" : "var(--border)"}`,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:24, transition:"all 0.25s ease",
        animation: drag ? "cv-float 1.5s ease infinite" : "none",
      }}>
        {loading
          ? <div style={{ width:24, height:24, borderRadius:"50%", border:"2px solid var(--accent)", borderTopColor:"transparent", animation:"cv-spin 0.8s linear infinite" }} />
          : "📄"
        }
      </div>

      <div style={{ fontFamily:heading, fontWeight:800, fontSize:20, color:"var(--text)", marginBottom:8 }}>
        {drag ? "Drop your CV here" : "Upload your CV"}
      </div>
      <div style={{ fontSize:11, fontFamily:mono, color:"var(--text-muted)", lineHeight:1.8 }}>
        Drag & drop or click to browse<br />
        <span style={{ color:"var(--accent)" }}>PDF only · max 5MB</span>
      </div>

      <input ref={inputRef} type="file" accept=".pdf" style={{ display:"none" }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

/* ─── ATS Panel ──────────────────────────────────────────────────── */
function ATSPanel({ cvData, matchScore }) {
  const score  = matchScore ?? 72;
  const { parsed } = cvData;
  const bars = [
    { label:"Skills Match",    val: clamp(score + 8,  0, 100) },
    { label:"Experience",      val: clamp(score - 5,  0, 100) },
    { label:"Education",       val: clamp(score + 12, 0, 100) },
    { label:"Keywords",        val: clamp(score - 10, 0, 100) },
    { label:"Format & Layout", val: 85 },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:32, alignItems:"start" }}>
      {/* Ring + label */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
        <ScoreRing score={score} size={130} />
        <div style={{
          padding:"3px 14px", borderRadius:100, fontSize:10,
          fontFamily:mono, letterSpacing:"0.1em",
          background:`${scoreColor(score)}18`, color:scoreColor(score),
          border:`1px solid ${scoreColor(score)}30`,
        }}>
          {scoreLabel(score)}
        </div>
      </div>

      {/* Bars + skills */}
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        <div>
          {bars.map((b,i) => (
            <div key={b.label} style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                <span style={{ fontSize:10, fontFamily:mono, color:"var(--text-muted)" }}>{b.label}</span>
                <span style={{ fontSize:10, fontFamily:mono, color:scoreColor(b.val) }}>{b.val}%</span>
              </div>
              <div style={{ height:4, background:"var(--border)", borderRadius:2, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:2,
                  background:`linear-gradient(90deg,${scoreColor(b.val)},${scoreColor(b.val)}99)`,
                  "--bar-w":`${b.val}%`, width:`${b.val}%`,
                  animation:`cv-fillBar 1.2s cubic-bezier(0.22,1,0.36,1) ${0.1+i*0.12}s both`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {parsed?.skills?.length > 0 && (
          <div>
            <div style={{ fontSize:9, fontFamily:mono, color:"var(--text-faint)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>
              Detected Skills
            </div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {parsed.skills.slice(0,12).map((sk,i) => (
                <span key={i} className="cv-skill-tag" style={{
                  fontSize:10, fontFamily:mono, padding:"3px 10px", borderRadius:100,
                  background:"var(--accent-soft)", color:"var(--accent)",
                  border:"1px solid rgba(29,158,117,0.25)",
                  animation:`cv-cardIn 0.4s ease ${0.05*i}s both`,
                }}>{sk}</span>
              ))}
              {parsed.skills.length > 12 && (
                <span style={{ fontSize:10, fontFamily:mono, color:"var(--text-faint)", padding:"3px 10px" }}>
                  +{parsed.skills.length-12} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Job card ───────────────────────────────────────────────────── */
function JobCard({ job, idx, onGap, onSave, onApply, savedIds, appliedIds }) {
  const isSaved   = savedIds.has(job.id);
  const isApplied = appliedIds.has(job.id);
  const urgency   = job.days_until_deadline != null && job.days_until_deadline <= 7;

  return (
    <div className="cv-job-card" style={{
      ...card, padding:"20px 22px",
      animation:`cv-cardIn 0.5s ease ${0.06*idx}s both`,
    }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:heading, fontWeight:800, fontSize:15, color:"var(--text)", marginBottom:2, lineHeight:1.3 }}>
            {job.title}
          </div>
          <div style={{ fontSize:11, fontFamily:mono, color:"var(--text-muted)" }}>
            {job.company} · {job.location}
          </div>
        </div>
        <span style={{
          fontSize:9, fontFamily:mono, letterSpacing:"0.1em", textTransform:"uppercase",
          padding:"3px 8px", borderRadius:6,
          background:"var(--surface)", color:"var(--text-muted)",
          border:"1px solid var(--border)", flexShrink:0, marginLeft:8,
        }}>
          {job.source || "web"}
        </span>
      </div>

      {/* Description */}
      {job.description && (
        <p style={{
          fontSize:11, fontFamily:mono, color:"var(--text-muted)",
          lineHeight:1.7, marginBottom:12,
          display:"-webkit-box", WebkitLineClamp:2,
          WebkitBoxOrient:"vertical", overflow:"hidden",
        }}>
          {job.description}
        </p>
      )}

      {/* Skill tags */}
      {job.required_skills?.length > 0 && (
        <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:14 }}>
          {job.required_skills.slice(0,6).map((sk,i) => (
            <span key={i} style={{
              fontSize:9, fontFamily:mono, padding:"2px 8px", borderRadius:100,
              background:"var(--surface)", color:"var(--text-muted)",
              border:"1px solid var(--border)",
            }}>{sk}</span>
          ))}
          {job.required_skills.length > 6 && (
            <span style={{ fontSize:9, fontFamily:mono, color:"var(--text-faint)", padding:"2px 4px" }}>
              +{job.required_skills.length-6}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          {job.deadline && (
            <span style={{
              fontSize:9, fontFamily:mono, padding:"2px 8px", borderRadius:100,
              background: urgency ? "rgba(239,68,68,0.10)" : "var(--surface)",
              color: urgency ? "#ef4444" : "var(--text-muted)",
              border:`1px solid ${urgency ? "rgba(239,68,68,0.28)" : "var(--border)"}`,
            }}>
              {urgency ? `⚠ ${job.days_until_deadline}d left` : `Deadline ${job.deadline}`}
            </span>
          )}
        </div>
        <div style={{ display:"flex", gap:6 }}>
          <button onClick={() => onGap(job)} style={{
            padding:"5px 12px", borderRadius:8, fontSize:10, fontFamily:mono,
            background:"var(--accent-soft)", color:"var(--accent)",
            border:"1px solid rgba(29,158,117,0.28)", cursor:"pointer",
            transition:"all 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(29,158,117,0.22)"}
            onMouseLeave={e => e.currentTarget.style.background = "var(--accent-soft)"}
          >
            Skill Gap ↗
          </button>

          <button onClick={() => onSave(job)} style={{
            width:30, height:30, borderRadius:8, fontSize:13,
            background: isSaved ? "var(--accent-soft)" : "var(--surface)",
            color: isSaved ? "var(--accent)" : "var(--text-muted)",
            border:`1px solid ${isSaved ? "rgba(29,158,117,0.35)" : "var(--border)"}`,
            cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
            transition:"all 0.2s",
          }}>
            {isSaved ? "★" : "☆"}
          </button>

          <a href={job.url || "#"} target="_blank" rel="noopener noreferrer"
            onClick={e => { if (!job.url) e.preventDefault(); onApply(job); }}
            style={{
              padding:"5px 14px", borderRadius:8, fontSize:10, fontFamily:mono,
              background: isApplied ? "var(--surface)" : "var(--accent)",
              color: isApplied ? "var(--text-muted)" : "#fff",
              border:"none", cursor:"pointer", textDecoration:"none",
              display:"flex", alignItems:"center", fontWeight:700, transition:"all 0.2s",
            }}>
            {isApplied ? "Applied ✓" : "Apply →"}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Skill Gap Drawer ───────────────────────────────────────────── */
function GapDrawer({ job, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);

  useEffect(() => {
    if (!job) return;
    setLoading(true); setErr(null); setData(null);
    api(`/api/match/gap/${job.id}/`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setErr("Failed to load skill gap analysis."); setLoading(false); });
  }, [job?.id]);

  if (!job) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
        zIndex:40, backdropFilter:"blur(4px)",
      }} />
      <div style={{
        position:"fixed", top:0, right:0, bottom:0,
        width:"min(520px,100vw)", zIndex:50,
        background:"var(--bg-secondary)",
        borderLeft:"1px solid var(--border-strong)",
        display:"flex", flexDirection:"column", overflow:"hidden",
        animation:"cv-drawerIn 0.35s cubic-bezier(0.22,1,0.36,1)",
        boxShadow:"-20px 0 60px rgba(0,0,0,0.5)",
      }}>
        {/* Drawer header */}
        <div style={{
          padding:"22px 24px 18px", borderBottom:"1px solid var(--border)",
          background:"var(--card-bg)", flexShrink:0,
        }}>
          <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
            <div>
              <SectionLabel>Skill Gap Analysis</SectionLabel>
              <div style={{ fontFamily:heading, fontWeight:800, fontSize:17, color:"var(--text)", lineHeight:1.3 }}>
                {job.title}
              </div>
              <div style={{ fontSize:11, fontFamily:mono, color:"var(--text-muted)", marginTop:3 }}>
                {job.company}
              </div>
            </div>
            <button onClick={onClose} style={{
              width:32, height:32, borderRadius:8, background:"var(--surface)",
              border:"1px solid var(--border)", color:"var(--text-muted)",
              cursor:"pointer", fontSize:16, display:"flex",
              alignItems:"center", justifyContent:"center", transition:"all 0.2s", flexShrink:0,
            }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >×</button>
          </div>

          {data && (
            <div style={{ marginTop:16 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:10, fontFamily:mono, color:"var(--text-muted)" }}>Match Score</span>
                <span style={{ fontSize:10, fontFamily:mono, color:scoreColor(data.match_score) }}>
                  {data.match_score}% — {scoreLabel(data.match_score)}
                </span>
              </div>
              <div style={{ height:5, background:"var(--border)", borderRadius:3, overflow:"hidden" }}>
                <div style={{
                  height:"100%", borderRadius:3, transition:"width 1s ease",
                  background:`linear-gradient(90deg,${scoreColor(data.match_score)},${scoreColor(data.match_score)}88)`,
                  width:`${data.match_score}%`,
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Drawer body */}
        <div style={{ flex:1, overflowY:"auto", padding:"24px" }}>
          {loading && (
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="cv-shimmer" style={{ height:52, borderRadius:10 }} />
              ))}
            </div>
          )}
          {err && (
            <div style={{ padding:20, borderRadius:10, background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)", color:"#ef4444", fontSize:12, fontFamily:mono }}>
              {err}
            </div>
          )}
          {data && (
            <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
              {data.strong_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontFamily:mono, color:"var(--accent)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:10 }}>
                    ✓ Strong Matches ({data.strong_matches.length})
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {data.strong_matches.map((sk,i) => (
                      <span key={i} style={{
                        fontSize:11, fontFamily:mono, padding:"4px 12px", borderRadius:100,
                        background:"var(--accent-soft)", color:"var(--accent)",
                        border:"1px solid rgba(29,158,117,0.28)",
                      }}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.partial_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontFamily:mono, color:"#eab308", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:10 }}>
                    ◑ Partial Matches ({data.partial_matches.length})
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {data.partial_matches.map((pm,i) => (
                      <div className="cv-gap-row" key={i} style={{
                        padding:"11px 14px", borderRadius:10,
                        background:"rgba(234,179,8,0.05)", border:"1px solid rgba(234,179,8,0.15)",
                      }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:12, fontFamily:mono, fontWeight:600, color:"var(--text)" }}>{pm.skill}</span>
                          <span style={{ fontSize:10, fontFamily:mono, color:"#eab308" }}>You have: {pm.candidate_has}</span>
                        </div>
                        <div style={{ fontSize:10, fontFamily:mono, color:"var(--text-muted)", lineHeight:1.6 }}>{pm.gap}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.missing_skills?.length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontFamily:mono, color:"#ef4444", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:10 }}>
                    ✕ Missing Skills ({data.missing_skills.length})
                  </div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                    {data.missing_skills.map((sk,i) => (
                      <span key={i} style={{
                        fontSize:11, fontFamily:mono, padding:"4px 12px", borderRadius:100,
                        background:"rgba(239,68,68,0.07)", color:"#ef4444",
                        border:"1px solid rgba(239,68,68,0.22)",
                      }}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {data.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize:9, fontFamily:mono, color:"var(--text-muted)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:10 }}>
                    ◈ Recommendations
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {data.recommendations.map((r,i) => (
                      <div key={i} style={{
                        display:"flex", gap:10, padding:"10px 12px",
                        borderRadius:8, background:"var(--surface)",
                        border:"1px solid var(--border)",
                      }}>
                        <span style={{ color:"var(--accent)", flexShrink:0, fontSize:12, marginTop:1 }}>→</span>
                        <span style={{ fontSize:11, fontFamily:mono, color:"var(--text-muted)", lineHeight:1.65 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.summary && (
                <div style={{ padding:"14px 16px", borderRadius:10, background:"var(--accent-soft)", border:"1px solid rgba(29,158,117,0.22)" }}>
                  <div style={{ fontSize:9, fontFamily:mono, color:"var(--accent)", letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>
                    AI Summary
                  </div>
                  <p style={{ fontSize:11, fontFamily:mono, color:"var(--text-soft)", lineHeight:1.8, fontStyle:"italic" }}>
                    {data.summary}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Job skeleton loader ────────────────────────────────────────── */
function JobSkeleton({ count = 3 }) {
  return Array.from({ length: count }).map((_,i) => (
    <div key={i} className="cv-shimmer" style={{
      height:160, borderRadius:14, animationDelay:`${i*0.15}s`,
    }} />
  ));
}

/* ─── Main CVAnalysisPage ────────────────────────────────────────── */
export default function CVAnalysisPage({ onBack }) {
  const [phase,       setPhase]       = useState("idle");
  const [procStage,   setProcStage]   = useState("upload");
  const [cvData,      setCvData]      = useState(null);
  const [jobs,        setJobs]        = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [savedIds,    setSavedIds]    = useState(new Set());
  const [appliedIds,  setAppliedIds]  = useState(new Set());
  const [gapJob,      setGapJob]      = useState(null);
  const [error,       setError]       = useState(null);
  const [fileName,    setFileName]    = useState("");
  const [filter,      setFilter]      = useState("all");
  const jobsRef = useRef(null);

  /* Inject page CSS once */
  useEffect(() => {
    if (document.getElementById("cv-page-css")) return;
    const s = document.createElement("style");
    s.id = "cv-page-css"; s.textContent = PAGE_CSS;
    document.head.appendChild(s);
  }, []);

  /* Load saved/applied */
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api("/api/jobs/saved/").then(r=>r.json()).then(d => {
      if (Array.isArray(d)) setSavedIds(new Set(d.map(s=>s.job.id)));
    }).catch(()=>{});
    api("/api/jobs/applications/").then(r=>r.json()).then(d => {
      if (Array.isArray(d)) setAppliedIds(new Set(d.map(a=>a.job.id)));
    }).catch(()=>{});
  }, []);

  /* Upload pipeline */
  const handleFile = useCallback(async (file) => {
    setFileName(file.name);
    setPhase("processing");
    setError(null);

    setProcStage("upload");
    let cv;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/api/cv/", { method:"POST", body:fd });
      if (!res.ok) {
        const err = await res.json().catch(()=>({}));
        throw new Error(err.error || err.detail || "Upload failed");
      }
      cv = await res.json();
    } catch(e) {
      setError(e.message || "CV upload failed. Please try again.");
      setPhase("error"); return;
    }

    setProcStage("parse");
    await new Promise(r => setTimeout(r, 800));
    setProcStage("ats");
    await new Promise(r => setTimeout(r, 900));
    setCvData(cv);

    setProcStage("match");
    setJobsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    let matched = [];
    try {
      const res = await api("/api/match/");
      if (res.status === 202) {
        await new Promise(r => setTimeout(r, 8000));
        const res2 = await api("/api/match/");
        if (res2.ok) matched = await res2.json();
      } else if (res.ok) {
        matched = await res.json();
      }
    } catch {}
    setJobs(Array.isArray(matched) ? matched : []);
    setJobsLoading(false);
    setPhase("done");
    setTimeout(() => jobsRef.current?.scrollIntoView({ behavior:"smooth" }), 300);
  }, []);

  const handleSave = useCallback(async (job) => {
    if (savedIds.has(job.id)) {
      try {
        const res = await api("/api/jobs/saved/");
        const list = await res.json();
        const entry = list.find(s => s.job.id === job.id);
        if (entry) {
          await api(`/api/jobs/saved/${entry.id}/`, { method:"DELETE" });
          setSavedIds(prev => { const n=new Set(prev); n.delete(job.id); return n; });
        }
      } catch {}
    } else {
      try {
        await api("/api/jobs/saved/", {
          method:"POST", headers:{"Content-Type":"application/json"},
          body: JSON.stringify({ job_id: job.id }),
        });
        setSavedIds(prev => new Set([...prev, job.id]));
      } catch {}
    }
  }, [savedIds]);

  const handleApply = useCallback(async (job) => {
    if (appliedIds.has(job.id)) return;
    try {
      await api("/api/jobs/applications/", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ job_id: job.id }),
      });
      setAppliedIds(prev => new Set([...prev, job.id]));
    } catch {}
  }, [appliedIds]);

  const reset = () => {
    setPhase("idle"); setCvData(null); setJobs([]);
    setError(null); setFileName(""); setFilter("all");
  };

  const displayJobs = jobs.filter(j => {
    if (filter === "soon")  return j.days_until_deadline != null && j.days_until_deadline <= 7;
    if (filter === "saved") return savedIds.has(j.id);
    return true;
  });

  return (
    <div style={{ minHeight:"100vh", background:"var(--bg)", position:"relative", overflow:"hidden" }}>

      {/* Background grid — matches landing page */}
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        opacity:0.025,
        backgroundImage:"linear-gradient(var(--text) 1px, transparent 1px), linear-gradient(90deg, var(--text) 1px, transparent 1px)",
        backgroundSize:"40px 40px",
      }} />
      <div style={{
        position:"fixed", inset:0, pointerEvents:"none", zIndex:0,
        background:"radial-gradient(ellipse 70% 50% at 50% 0%, rgba(29,158,117,0.12) 0%, transparent 65%)",
      }} />

      <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"0 24px 80px" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ padding:"80px 0 44px", borderBottom:"1px solid var(--border)", marginBottom:48 }}>
          {/* Back button */}
          <button onClick={onBack} style={{
            background:"none", border:"1px solid var(--border)", color:"var(--text-muted)",
            fontSize:11, fontFamily:mono, padding:"5px 14px", borderRadius:8,
            cursor:"pointer", transition:"all 0.2s", marginBottom:28,
            display:"inline-flex", alignItems:"center", gap:6,
          }}
            onMouseEnter={e => { e.currentTarget.style.color="var(--text)"; e.currentTarget.style.borderColor="var(--border-strong)"; }}
            onMouseLeave={e => { e.currentTarget.style.color="var(--text-muted)"; e.currentTarget.style.borderColor="var(--border)"; }}
          >
            ← Back to Home
          </button>

          <SectionLabel>CV Analysis · Job Matching</SectionLabel>
          <h1 style={{
            fontFamily:heading, fontWeight:900,
            fontSize:"clamp(2.4rem,5vw,4rem)",
            lineHeight:0.92, letterSpacing:"-0.04em",
            color:"var(--text)", marginBottom:16,
          }}>
            SCAN YOUR CV.
            <br />
            <span className="text-outline">FIND YOUR MATCH.</span>
          </h1>
          <p style={{
            fontFamily:mono, fontSize:13, color:"var(--text-muted)",
            lineHeight:1.8, maxWidth:480,
          }}>
            Upload your CV — our AI parses it with Claude, scores it against ATS benchmarks,
            then finds the best jobs via RAG + ChromaDB semantic search.
          </p>
          {cvData && (
            <button onClick={reset} style={{
              marginTop:16, background:"none", border:"1px solid var(--border)",
              color:"var(--text-muted)", fontSize:11, fontFamily:mono,
              padding:"6px 14px", borderRadius:8, cursor:"pointer", transition:"color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.color="var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color="var(--text-muted)"}
            >← Upload new CV</button>
          )}
        </div>

        {/* ── IDLE ── */}
        {phase === "idle" && (
          <div style={{ maxWidth:560, margin:"0 auto", animation:"cv-fadeUp 0.6s ease" }}>
            <UploadZone onFile={handleFile} loading={false} />
            <div style={{
              display:"flex", gap:16, marginTop:20, padding:"14px 18px",
              borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)",
            }}>
              {[
                { icon:"◎", text:"ATS Score Analysis" },
                { icon:"◈", text:"RAG Job Matching"   },
                { icon:"◑", text:"Skill Gap Report"   },
              ].map(f => (
                <div key={f.text} style={{ display:"flex", alignItems:"center", gap:7, flex:1 }}>
                  <span style={{ color:"var(--accent)", fontSize:12 }}>{f.icon}</span>
                  <span style={{ fontSize:10, fontFamily:mono, color:"var(--text-muted)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {phase === "processing" && (
          <div style={{ maxWidth:480, margin:"0 auto" }}>
            <ProcessingScreen stage={procStage} />
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ maxWidth:480, margin:"0 auto 40px", animation:"cv-fadeUp 0.5s ease" }}>
            <div style={{
              padding:"20px 24px", borderRadius:14,
              background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.2)",
            }}>
              <div style={{ fontSize:12, fontFamily:mono, color:"#ef4444", marginBottom:12 }}>
                ✕ {error}
              </div>
              <button className="cv-btn-primary" onClick={reset} style={{
                padding:"9px 20px", borderRadius:100, background:"var(--accent)",
                color:"#fff", border:"none", cursor:"pointer",
                fontSize:12, fontWeight:700, fontFamily:heading,
              }}>Try Again</button>
            </div>
          </div>
        )}

        {/* ── DONE ── */}
        {phase === "done" && cvData && (
          <div style={{ display:"flex", flexDirection:"column", gap:52 }}>

            {/* ATS Report */}
            <div style={{ animation:"cv-fadeUp 0.6s ease" }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
                <SectionLabel>ATS Report</SectionLabel>
                <div style={{
                  marginLeft:"auto", fontSize:10, fontFamily:mono,
                  color:"var(--text-faint)", padding:"3px 10px",
                  borderRadius:6, border:"1px solid var(--border)",
                }}>
                  {fileName}
                </div>
              </div>

              <div style={{ ...card, padding:"28px" }}>
                {cvData.parsed?.name && (
                  <div style={{
                    display:"flex", alignItems:"center", gap:14,
                    marginBottom:24, paddingBottom:20,
                    borderBottom:"1px solid var(--border)",
                  }}>
                    <div style={{
                      width:44, height:44, borderRadius:12, flexShrink:0,
                      background:"var(--accent-soft)", border:"1px solid rgba(29,158,117,0.28)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontFamily:heading, fontWeight:900, fontSize:16, color:"var(--accent)",
                    }}>
                      {cvData.parsed.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily:heading, fontWeight:800, fontSize:16, color:"var(--text)" }}>
                        {cvData.parsed.name}
                      </div>
                      <div style={{ fontSize:11, fontFamily:mono, color:"var(--text-muted)", marginTop:2 }}>
                        {[cvData.parsed.email, cvData.parsed.location].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div style={{ marginLeft:"auto", display:"flex", gap:18 }}>
                      {[
                        { label:"Skills", val: cvData.parsed.skills?.length || 0 },
                        { label:"Jobs",   val: cvData.parsed.experience?.length || 0 },
                        { label:"Certs",  val: cvData.parsed.certifications?.length || 0 },
                      ].map(stat => (
                        <div key={stat.label} style={{ textAlign:"center" }}>
                          <div style={{ fontFamily:heading, fontWeight:900, fontSize:20, color:"var(--accent)" }}>{stat.val}</div>
                          <div style={{ fontSize:9, fontFamily:mono, color:"var(--text-faint)", letterSpacing:"0.1em" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ATSPanel cvData={cvData} matchScore={jobs[0] ? 72 : 65} />
              </div>
            </div>

            {/* Jobs section */}
            <div ref={jobsRef}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20, flexWrap:"wrap" }}>
                <SectionLabel>Matched Jobs</SectionLabel>
                <div style={{ display:"flex", gap:6, marginLeft:"auto" }}>
                  {[
                    { key:"all",   label:`All (${jobs.length})` },
                    { key:"soon",  label:"Closing Soon" },
                    { key:"saved", label:`Saved (${savedIds.size})` },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                      className="cv-filter-btn"
                      style={{
                        padding:"5px 12px", borderRadius:8, fontSize:10,
                        fontFamily:mono, cursor:"pointer",
                        background: filter===f.key ? "var(--accent-soft)" : "var(--surface)",
                        color: filter===f.key ? "var(--accent)" : "var(--text-muted)",
                        border:`1px solid ${filter===f.key ? "rgba(29,158,117,0.32)" : "var(--border)"}`,
                      }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {jobsLoading ? (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <JobSkeleton count={3} />
                </div>
              ) : displayJobs.length === 0 ? (
                <div style={{
                  padding:"48px 24px", textAlign:"center", borderRadius:16,
                  border:"1px dashed var(--border-strong)", background:"var(--surface)",
                }}>
                  <div style={{ fontSize:32, marginBottom:12, opacity:0.28 }}>◈</div>
                  <div style={{ fontFamily:heading, fontWeight:800, fontSize:16, color:"var(--text-muted)", marginBottom:6 }}>
                    {filter !== "all" ? "No jobs in this filter" : "No matched jobs yet"}
                  </div>
                  <div style={{ fontSize:11, fontFamily:mono, color:"var(--text-faint)" }}>
                    {filter !== "all" ? "Try switching to All" : "Jobs are being indexed — check back in a moment"}
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {displayJobs.map((job,i) => (
                    <JobCard key={job.id} job={job} idx={i}
                      onGap={setGapJob} onSave={handleSave}
                      onApply={handleApply} savedIds={savedIds} appliedIds={appliedIds}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {gapJob && <GapDrawer job={gapJob} onClose={() => setGapJob(null)} />}
    </div>
  );
}
