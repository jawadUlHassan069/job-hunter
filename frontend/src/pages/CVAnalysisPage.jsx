// src/pages/CVAnalysisPage.jsx
// Connect to: POST /api/cv/  →  GET /api/match/  →  GET /api/match/gap/:id/
import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── API helper ──────────────────────────────────────────── */
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

/* ─── Helpers ─────────────────────────────────────────────── */
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const scoreColor = (s) => s >= 80 ? "#1d9e75" : s >= 60 ? "#eab308" : "#ef4444";
const scoreLabel = (s) => s >= 80 ? "Excellent" : s >= 60 ? "Good" : s >= 40 ? "Fair" : "Needs Work";

/* ─── Injected CSS ────────────────────────────────────────── */
const PAGE_CSS = `
  @keyframes cv-fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes cv-fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes cv-blink    { 0%,100%{opacity:1} 50%{opacity:0.15} }
  @keyframes cv-spin     { to{transform:rotate(360deg)} }
  @keyframes cv-scan     { 0%{transform:translateY(-100%);opacity:0} 8%{opacity:1} 92%{opacity:1} 100%{transform:translateY(900%);opacity:0} }
  @keyframes cv-fillBar  { from{width:0} to{width:var(--bar-w)} }
  @keyframes cv-cardIn   { from{opacity:0;transform:translateY(22px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes cv-pulse    { 0%,100%{box-shadow:0 0 0 0 rgba(29,158,117,0.5)} 50%{box-shadow:0 0 0 7px rgba(29,158,117,0)} }
  @keyframes cv-ringPulse{ 0%{transform:scale(1);opacity:0.55} 100%{transform:scale(1.7);opacity:0} }
  @keyframes cv-drawer   { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes cv-shimmer  { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes cv-float    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  @keyframes cv-dot1     { 0%,100%{opacity:.15} 33%{opacity:1} }
  @keyframes cv-dot2     { 0%,100%{opacity:.15} 66%{opacity:1} }
  @keyframes cv-dot3     { 0%,100%{opacity:.15} 99%{opacity:1} }

  .cv-shimmer {
    background:linear-gradient(90deg,var(--surface,rgba(255,255,255,0.04)) 0%,rgba(255,255,255,0.07) 50%,var(--surface,rgba(255,255,255,0.04)) 100%);
    background-size:200% 100%;
    animation:cv-shimmer 1.6s ease infinite;
  }
  .cv-job-card { transition:border-color .25s,box-shadow .25s,transform .25s; }
  .cv-job-card:hover { border-color:rgba(29,158,117,0.40)!important; box-shadow:0 8px 40px rgba(29,158,117,0.10); transform:translateY(-3px); }
  .cv-filter-btn { transition:all .2s; }
  .cv-filter-btn:hover { opacity:.85; }
`;

const mono = "'JetBrains Mono', monospace";
const heading = "'Plus Jakarta Sans', sans-serif";

/* ─── Score Ring ──────────────────────────────────────────── */
function ScoreRing({ score, size = 130 }) {
  const [d, setD] = useState(0);
  const R = size / 2 - 10;
  const circ = 2 * Math.PI * R;
  const col = scoreColor(score);
  useEffect(() => {
    let raf, start = null;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / 1400, 1);
      setD(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {[0, 0.3, 0.6].map((delay, i) => (
        <div key={i} style={{
          position: "absolute", inset: -6 - i * 4, borderRadius: "50%",
          border: `1px solid ${col}`, animation: `cv-ringPulse 2.4s ease-out ${delay}s infinite`, opacity: 0,
        }} />
      ))}
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={7} />
        <circle cx={size / 2} cy={size / 2} r={R} fill="none" stroke={col} strokeWidth={7}
          strokeLinecap="round" strokeDasharray={`${(d / 100) * circ} ${circ}`}
          style={{ filter: `drop-shadow(0 0 8px ${col})`, transition: "stroke .5s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: heading, fontWeight: 900, fontSize: size * 0.22, color: col, lineHeight: 1 }}>{d}</div>
        <div style={{ fontSize: 8, color: "var(--text-muted)", letterSpacing: "0.12em", marginTop: 2, fontFamily: mono }}>ATS SCORE</div>
      </div>
    </div>
  );
}

/* ─── Processing Stages ───────────────────────────────────── */
const STAGES = [
  { key: "upload", icon: "⬆", label: "Uploading CV",           sub: "Securely transferring your document…" },
  { key: "parse",  icon: "⚙", label: "Parsing with Claude AI", sub: "Extracting skills, experience & education…" },
  { key: "ats",    icon: "◎", label: "Running ATS Analysis",   sub: "Scoring against industry benchmarks…" },
  { key: "match",  icon: "◈", label: "Matching Jobs via RAG",  sub: "ChromaDB semantic search running…" },
];

function ProcessingScreen({ stage }) {
  const cur = STAGES.findIndex(s => s.key === stage);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "55vh", gap: 44, animation: "cv-fadeIn .5s ease" }}>
      {/* Animated doc */}
      <div style={{ position: "relative", width: 88, height: 108, animation: "cv-float 3s ease infinite" }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: 10,
          background: "linear-gradient(135deg,var(--card-bg,#0d0f1a) 0%,rgba(13,16,26,0.95) 100%)",
          border: "1px solid rgba(29,158,117,0.35)", padding: "14px 12px",
          display: "flex", flexDirection: "column", gap: 5, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4),0 0 40px rgba(29,158,117,0.12)",
        }}>
          {[70, 50, 60, 40, 55, 35, 48].map((w, i) => (
            <div key={i} style={{ height: 3, width: `${w}%`, borderRadius: 2, background: i < 2 ? "rgba(29,158,117,0.55)" : "rgba(255,255,255,0.07)" }} />
          ))}
          <div style={{ position: "absolute", left: 0, right: 0, height: 2, background: "linear-gradient(90deg,transparent,#1d9e75,transparent)", animation: "cv-scan 2.2s ease-in-out infinite" }} />
        </div>
        <div style={{ position: "absolute", top: 0, right: 0, width: 20, height: 20, background: "var(--bg,#060816)", borderLeft: "1px solid rgba(29,158,117,0.3)", borderBottom: "1px solid rgba(29,158,117,0.3)", borderRadius: "0 10px 0 7px" }} />
      </div>
      {/* Stages */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 380 }}>
        {STAGES.map((s, i) => {
          const done = i < cur, active = i === cur;
          return (
            <div key={s.key} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
              borderRadius: 12, border: `1px solid ${active ? "rgba(29,158,117,0.40)" : "rgba(255,255,255,0.06)"}`,
              background: active ? "rgba(29,158,117,0.07)" : "transparent", opacity: i > cur ? 0.3 : 1, transition: "all .4s ease",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? "#1d9e75" : active ? "rgba(29,158,117,0.18)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${done ? "#1d9e75" : active ? "rgba(29,158,117,0.45)" : "rgba(255,255,255,0.08)"}`,
                fontSize: done ? 12 : 14, color: done ? "#000" : active ? "#1d9e75" : "rgba(255,255,255,0.3)",
                animation: active ? "cv-spin 1.2s linear infinite" : "none", transition: "all .4s ease",
              }}>{done ? "✓" : s.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: mono, color: done ? "rgba(255,255,255,0.4)" : active ? "#f3f6ff" : "rgba(255,255,255,0.2)", marginBottom: 2 }}>{s.label}</div>
                {active && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: mono }}>{s.sub}</div>}
              </div>
              {active && (
                <div style={{ display: "flex", gap: 4 }}>
                  {[0, 1, 2].map(j => <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: "#1d9e75", animation: `cv-blink 1s ease-in-out ${j * 0.25}s infinite` }} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Upload Zone ─────────────────────────────────────────── */
function UploadZone({ onFile }) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef(null);
  const handle = (file) => {
    if (!file) return;
    if (file.type !== "application/pdf") { alert("Please upload a PDF file."); return; }
    if (file.size > 5 * 1024 * 1024) { alert("File must be under 5MB."); return; }
    onFile(file);
  };
  return (
    <div onClick={() => inputRef.current?.click()}
      onDragEnter={e => { e.preventDefault(); setDrag(true); }}
      onDragLeave={e => { e.preventDefault(); setDrag(false); }}
      onDragOver={e => e.preventDefault()}
      onDrop={e => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files[0]); }}
      style={{
        position: "relative", borderRadius: 18, padding: "52px 32px", textAlign: "center",
        cursor: "pointer", overflow: "hidden",
        border: `1.5px dashed ${drag ? "#1d9e75" : "rgba(255,255,255,0.14)"}`,
        background: drag ? "rgba(29,158,117,0.06)" : "rgba(255,255,255,0.02)",
        transition: "all .25s ease", boxShadow: drag ? "0 0 40px rgba(29,158,117,0.15)" : "none",
      }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.03, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "28px 28px" }} />
      <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", background: drag ? "rgba(29,158,117,0.18)" : "rgba(255,255,255,0.04)", border: `1px solid ${drag ? "rgba(29,158,117,0.5)" : "rgba(255,255,255,0.1)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, transition: "all .25s ease", animation: drag ? "cv-float 1.5s ease infinite" : "none" }}>📄</div>
      <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 20, color: "#f3f6ff", marginBottom: 8 }}>{drag ? "Drop your CV here" : "Upload your CV"}</div>
      <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.38)", lineHeight: 1.8 }}>
        Drag & drop or click to browse<br /><span style={{ color: "#1d9e75" }}>PDF only · max 5MB</span>
      </div>
      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }} onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

/* ─── ATS Panel ───────────────────────────────────────────── */
function ATSPanel({ cvData, score = 72 }) {
  const bars = [
    { label: "Skills Match",    val: clamp(score + 8,  0, 100) },
    { label: "Experience",      val: clamp(score - 5,  0, 100) },
    { label: "Education",       val: clamp(score + 12, 0, 100) },
    { label: "Keywords",        val: clamp(score - 10, 0, 100) },
    { label: "Format & Layout", val: 85 },
  ];
  const skills = cvData?.parsed?.skills || [];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "start" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
        <ScoreRing score={score} size={130} />
        <div style={{ padding: "3px 14px", borderRadius: 100, fontSize: 10, fontFamily: mono, letterSpacing: "0.1em", background: `${scoreColor(score)}18`, color: scoreColor(score), border: `1px solid ${scoreColor(score)}30` }}>{scoreLabel(score)}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          {bars.map((b, i) => (
            <div key={b.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontFamily: mono, color: "var(--text-muted)" }}>{b.label}</span>
                <span style={{ fontSize: 10, fontFamily: mono, color: scoreColor(b.val) }}>{b.val}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 2, background: `linear-gradient(90deg,${scoreColor(b.val)},${scoreColor(b.val)}88)`, "--bar-w": `${b.val}%`, width: `${b.val}%`, animation: `cv-fillBar 1.2s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s both` }} />
              </div>
            </div>
          ))}
        </div>
        {skills.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>Detected Skills</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {skills.slice(0, 14).map((sk, i) => (
                <span key={i} style={{ fontSize: 10, fontFamily: mono, padding: "3px 10px", borderRadius: 100, background: "rgba(29,158,117,0.12)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.25)", animation: `cv-cardIn .4s ease ${0.04 * i}s both` }}>{sk}</span>
              ))}
              {skills.length > 14 && <span style={{ fontSize: 10, fontFamily: mono, color: "rgba(255,255,255,0.2)", padding: "3px 8px" }}>+{skills.length - 14}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Job Card ────────────────────────────────────────────── */
function JobCard({ job, idx, onGap, onSave, onApply, savedIds, appliedIds }) {
  const isSaved = savedIds.has(job.id), isApplied = appliedIds.has(job.id);
  const urgent = job.days_until_deadline != null && job.days_until_deadline <= 7;
  return (
    <div className="cv-job-card" style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", animation: `cv-cardIn .5s ease ${0.06 * idx}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 15, color: "#f3f6ff", marginBottom: 3, lineHeight: 1.3 }}>{job.title}</div>
          <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.45)" }}>{job.company} · {job.location}</div>
        </div>
        {job.match_score != null && (
          <div style={{ flexShrink: 0, marginLeft: 12, padding: "4px 10px", borderRadius: 8, background: `${scoreColor(job.match_score)}14`, border: `1px solid ${scoreColor(job.match_score)}28`, fontSize: 11, fontFamily: mono, color: scoreColor(job.match_score), fontWeight: 700 }}>{job.match_score}%</div>
        )}
      </div>
      {job.description && <p style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.35)", lineHeight: 1.7, marginBottom: 12, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.description}</p>}
      {job.required_skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {job.required_skills.slice(0, 6).map((sk, i) => <span key={i} style={{ fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 100, background: "rgba(255,255,255,0.04)", color: "rgba(243,246,255,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>{sk}</span>)}
          {job.required_skills.length > 6 && <span style={{ fontSize: 9, fontFamily: mono, color: "rgba(255,255,255,0.2)", padding: "2px 4px" }}>+{job.required_skills.length - 6}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div>{job.deadline && <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 100, background: urgent ? "rgba(239,68,68,0.10)" : "rgba(255,255,255,0.04)", color: urgent ? "#ef4444" : "rgba(243,246,255,0.4)", border: `1px solid ${urgent ? "rgba(239,68,68,0.28)" : "rgba(255,255,255,0.07)"}` }}>{urgent ? `⚠ ${job.days_until_deadline}d left` : `Deadline ${job.deadline}`}</span>}</div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onGap(job)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontFamily: mono, background: "rgba(29,158,117,0.12)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.28)", cursor: "pointer", transition: "background .2s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(29,158,117,0.22)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(29,158,117,0.12)"}>Skill Gap ↗</button>
          <button onClick={() => onSave(job)} style={{ width: 30, height: 30, borderRadius: 8, fontSize: 13, background: isSaved ? "rgba(29,158,117,0.12)" : "rgba(255,255,255,0.04)", color: isSaved ? "#1d9e75" : "rgba(243,246,255,0.4)", border: `1px solid ${isSaved ? "rgba(29,158,117,0.35)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>{isSaved ? "★" : "☆"}</button>
          <a href={job.url || "#"} target="_blank" rel="noopener noreferrer" onClick={e => { if (!job.url) e.preventDefault(); onApply(job); }} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 10, fontFamily: mono, background: isApplied ? "rgba(255,255,255,0.04)" : "#1d9e75", color: isApplied ? "rgba(243,246,255,0.4)" : "#fff", border: "none", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", fontWeight: 700, transition: "all .2s" }}>{isApplied ? "Applied ✓" : "Apply →"}</a>
        </div>
      </div>
    </div>
  );
}

/* ─── Skill Gap Drawer ────────────────────────────────────── */
function GapDrawer({ job, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  useEffect(() => {
    if (!job) return;
    setLoading(true); setErr(null); setData(null);
    api(`/api/match/gap/${job.id}/`).then(r => r.json()).then(d => { setData(d); setLoading(false); }).catch(() => { setErr("Failed to load skill gap analysis."); setLoading(false); });
  }, [job?.id]);
  if (!job) return null;
  return (
    <>
      <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }} />
      <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(520px,100vw)", zIndex: 50, background: "var(--bg-secondary,#0d1020)", borderLeft: "1px solid rgba(29,158,117,0.2)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "cv-drawer .35s cubic-bezier(0.22,1,0.36,1)", boxShadow: "-20px 0 60px rgba(0,0,0,0.5)" }}>
        <div style={{ padding: "22px 24px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", background: "var(--card-bg,#0d0f1a)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", textTransform: "uppercase", color: "#1d9e75", marginBottom: 10 }}>◈ Skill Gap Analysis</div>
              <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 17, color: "#f3f6ff", lineHeight: 1.3 }}>{job.title}</div>
              <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.4)", marginTop: 3 }}>{job.company}</div>
            </div>
            <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(243,246,255,0.5)", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
          </div>
          {data && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.4)" }}>Match Score</span>
                <span style={{ fontSize: 10, fontFamily: mono, color: scoreColor(data.match_score) }}>{data.match_score}% — {scoreLabel(data.match_score)}</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg,${scoreColor(data.match_score)},${scoreColor(data.match_score)}88)`, width: `${data.match_score}%`, transition: "width 1s ease" }} />
              </div>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
          {loading && <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[1, 2, 3, 4].map(i => <div key={i} className="cv-shimmer" style={{ height: 52, borderRadius: 10 }} />)}</div>}
          {err && <div style={{ padding: 20, borderRadius: 10, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontFamily: mono }}>{err}</div>}
          {data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {data.strong_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: mono, color: "#1d9e75", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>✓ Strong Matches ({data.strong_matches.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.strong_matches.map((sk, i) => <span key={i} style={{ fontSize: 11, fontFamily: mono, padding: "4px 12px", borderRadius: 100, background: "rgba(29,158,117,0.12)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.28)" }}>{sk}</span>)}
                  </div>
                </div>
              )}
              {data.partial_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: mono, color: "#eab308", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>◑ Partial Matches ({data.partial_matches.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.partial_matches.map((pm, i) => (
                      <div key={i} style={{ padding: "11px 14px", borderRadius: 10, background: "rgba(234,179,8,0.05)", border: "1px solid rgba(234,179,8,0.15)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontFamily: mono, fontWeight: 600, color: "#f3f6ff" }}>{pm.skill}</span>
                          <span style={{ fontSize: 10, fontFamily: mono, color: "#eab308" }}>You have: {pm.candidate_has}</span>
                        </div>
                        <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.4)", lineHeight: 1.6 }}>{pm.gap}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.missing_skills?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: mono, color: "#ef4444", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>✕ Missing Skills ({data.missing_skills.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.missing_skills.map((sk, i) => <span key={i} style={{ fontSize: 11, fontFamily: mono, padding: "4px 12px", borderRadius: 100, background: "rgba(239,68,68,0.07)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.22)" }}>{sk}</span>)}
                  </div>
                </div>
              )}
              {data.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.35)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>◈ Recommendations</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.recommendations.map((r, i) => (
                      <div key={i} style={{ display: "flex", gap: 10, padding: "10px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <span style={{ color: "#1d9e75", flexShrink: 0, fontSize: 12 }}>→</span>
                        <span style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.5)", lineHeight: 1.65 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.summary && (
                <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(29,158,117,0.06)", border: "1px solid rgba(29,158,117,0.22)" }}>
                  <div style={{ fontSize: 9, fontFamily: mono, color: "#1d9e75", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>AI Summary</div>
                  <p style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.55)", lineHeight: 1.8, fontStyle: "italic" }}>{data.summary}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function CVAnalysisPage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState("idle");
  const [procStage, setProcStage] = useState("upload");
  const [cvData, setCvData] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [gapJob, setGapJob] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("");
  const [filter, setFilter] = useState("all");
  const jobsRef = useRef(null);

  useEffect(() => {
    if (document.getElementById("cv-page-css")) return;
    const s = document.createElement("style");
    s.id = "cv-page-css"; s.textContent = PAGE_CSS;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api("/api/jobs/saved/").then(r => r.json()).then(d => { if (Array.isArray(d)) setSavedIds(new Set(d.map(s => s.job.id))); }).catch(() => {});
    api("/api/jobs/applications/").then(r => r.json()).then(d => { if (Array.isArray(d)) setAppliedIds(new Set(d.map(a => a.job.id))); }).catch(() => {});
  }, []);

  const handleFile = useCallback(async (file) => {
    setFileName(file.name); setPhase("processing"); setError(null);
    setProcStage("upload");
    let cv;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/api/cv/", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || e.detail || "Upload failed"); }
      cv = await res.json();
    } catch (e) { setError(e.message || "CV upload failed."); setPhase("error"); return; }
    setProcStage("parse"); await new Promise(r => setTimeout(r, 800));
    setProcStage("ats"); await new Promise(r => setTimeout(r, 900));
    setCvData(cv);
    setProcStage("match"); setJobsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    let matched = [];
    try {
      const res = await api("/api/match/");
      if (res.status === 202) { await new Promise(r => setTimeout(r, 8000)); const r2 = await api("/api/match/"); if (r2.ok) matched = await r2.json(); }
      else if (res.ok) matched = await res.json();
    } catch {}
    setJobs(Array.isArray(matched) ? matched : []);
    setJobsLoading(false); setPhase("done");
    setTimeout(() => jobsRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
  }, []);

  const handleSave = useCallback(async (job) => {
    if (savedIds.has(job.id)) {
      try { const r = await api("/api/jobs/saved/"); const list = await r.json(); const entry = list.find(s => s.job.id === job.id); if (entry) { await api(`/api/jobs/saved/${entry.id}/`, { method: "DELETE" }); setSavedIds(p => { const n = new Set(p); n.delete(job.id); return n; }); } } catch {}
    } else {
      try { await api("/api/jobs/saved/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id }) }); setSavedIds(p => new Set([...p, job.id])); } catch {}
    }
  }, [savedIds]);

  const handleApply = useCallback(async (job) => {
    if (appliedIds.has(job.id)) return;
    try { await api("/api/jobs/applications/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ job_id: job.id }) }); setAppliedIds(p => new Set([...p, job.id])); } catch {}
  }, [appliedIds]);

  const reset = () => { setPhase("idle"); setCvData(null); setJobs([]); setError(null); setFileName(""); setFilter("all"); };
  const displayJobs = jobs.filter(j => filter === "soon" ? j.days_until_deadline != null && j.days_until_deadline <= 7 : filter === "saved" ? savedIds.has(j.id) : true);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg,#060816)", position: "relative", overflow: "hidden" }}>
      {/* Ambient BG */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.025, backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,1) 1px,transparent 1px)", backgroundSize: "40px 40px" }} />
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 70% 50% at 50% 0%,rgba(29,158,117,0.12) 0%,transparent 65%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>
        {/* Header */}
        <div style={{ padding: "80px 0 44px", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 48 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(243,246,255,0.45)", fontSize: 11, fontFamily: mono, padding: "5px 14px", borderRadius: 8, cursor: "pointer", marginBottom: 28, display: "inline-flex", alignItems: "center", gap: 6, transition: "all .2s" }} onMouseEnter={e => { e.currentTarget.style.color = "#f3f6ff"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }} onMouseLeave={e => { e.currentTarget.style.color = "rgba(243,246,255,0.45)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>← Back to Home</button>
          <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", textTransform: "uppercase", color: "#1d9e75", marginBottom: 14 }}>◈ CV Analysis · Job Matching</div>
          <h1 style={{ fontFamily: heading, fontWeight: 900, fontSize: "clamp(2.4rem,5vw,4rem)", lineHeight: 0.92, letterSpacing: "-0.04em", color: "#f3f6ff", marginBottom: 16 }}>
            SCAN YOUR CV.<br /><span style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.14)", color: "transparent" }}>FIND YOUR MATCH.</span>
          </h1>
          <p style={{ fontFamily: mono, fontSize: 13, color: "rgba(243,246,255,0.4)", lineHeight: 1.8, maxWidth: 480 }}>Upload your CV — our AI parses it with Claude, scores it against ATS benchmarks, then finds the best jobs via RAG + ChromaDB semantic search.</p>
          {cvData && <button onClick={reset} style={{ marginTop: 16, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(243,246,255,0.4)", fontSize: 11, fontFamily: mono, padding: "6px 14px", borderRadius: 8, cursor: "pointer" }}>← Upload new CV</button>}
        </div>

        {/* IDLE */}
        {phase === "idle" && (
          <div style={{ maxWidth: 560, margin: "0 auto", animation: "cv-fadeUp .6s ease" }}>
            <UploadZone onFile={handleFile} />
            <div style={{ display: "flex", gap: 16, marginTop: 20, padding: "14px 18px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)" }}>
              {[{ icon: "◎", text: "ATS Score Analysis" }, { icon: "◈", text: "RAG Job Matching" }, { icon: "◑", text: "Skill Gap Report" }].map(f => (
                <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
                  <span style={{ color: "#1d9e75", fontSize: 12 }}>{f.icon}</span>
                  <span style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.4)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PROCESSING */}
        {phase === "processing" && <div style={{ maxWidth: 480, margin: "0 auto" }}><ProcessingScreen stage={procStage} /></div>}

        {/* ERROR */}
        {phase === "error" && (
          <div style={{ maxWidth: 480, margin: "0 auto 40px", animation: "cv-fadeUp .5s ease" }}>
            <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
              <div style={{ fontSize: 12, fontFamily: mono, color: "#ef4444", marginBottom: 12 }}>✕ {error}</div>
              <button onClick={reset} style={{ padding: "9px 20px", borderRadius: 100, background: "#1d9e75", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: heading }}>Try Again</button>
            </div>
          </div>
        )}

        {/* DONE */}
        {phase === "done" && cvData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 52 }}>
            {/* ATS Report */}
            <div style={{ animation: "cv-fadeUp .6s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", textTransform: "uppercase", color: "#1d9e75" }}>◈ ATS Report</div>
                <div style={{ marginLeft: "auto", fontSize: 10, fontFamily: mono, color: "rgba(255,255,255,0.2)", padding: "3px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.07)" }}>{fileName}</div>
              </div>
              <div style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: 28 }}>
                {cvData.parsed?.name && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.28)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: heading, fontWeight: 900, fontSize: 16, color: "#1d9e75" }}>{cvData.parsed.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 16, color: "#f3f6ff" }}>{cvData.parsed.name}</div>
                      <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.4)", marginTop: 2 }}>{[cvData.parsed.email, cvData.parsed.location].filter(Boolean).join(" · ")}</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 18 }}>
                      {[{ label: "Skills", val: cvData.parsed.skills?.length || 0 }, { label: "Jobs", val: cvData.parsed.experience?.length || 0 }, { label: "Certs", val: cvData.parsed.certifications?.length || 0 }].map(stat => (
                        <div key={stat.label} style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 20, color: "#1d9e75" }}>{stat.val}</div>
                          <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ATSPanel cvData={cvData} score={jobs[0]?.match_score ?? 72} />
              </div>
            </div>

            {/* Jobs */}
            <div ref={jobsRef}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", textTransform: "uppercase", color: "#1d9e75" }}>◈ Matched Jobs</div>
                <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                  {[{ key: "all", label: `All (${jobs.length})` }, { key: "soon", label: "Closing Soon" }, { key: "saved", label: `Saved (${savedIds.size})` }].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)} className="cv-filter-btn" style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, fontFamily: mono, cursor: "pointer", background: filter === f.key ? "rgba(29,158,117,0.12)" : "rgba(255,255,255,0.03)", color: filter === f.key ? "#1d9e75" : "rgba(243,246,255,0.4)", border: `1px solid ${filter === f.key ? "rgba(29,158,117,0.32)" : "rgba(255,255,255,0.07)"}` }}>{f.label}</button>
                  ))}
                </div>
              </div>
              {jobsLoading
                ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{[0, 1, 2].map(i => <div key={i} className="cv-shimmer" style={{ height: 160, borderRadius: 14 }} />)}</div>
                : displayJobs.length === 0
                  ? <div style={{ padding: "48px 24px", textAlign: "center", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.02)" }}>
                      <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.2 }}>◈</div>
                      <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 16, color: "rgba(243,246,255,0.4)", marginBottom: 6 }}>{filter !== "all" ? "No jobs in this filter" : "No matched jobs yet"}</div>
                      <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(255,255,255,0.2)" }}>{filter !== "all" ? "Try switching to All" : "Jobs are being indexed — check back in a moment"}</div>
                    </div>
                  : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {displayJobs.map((job, i) => <JobCard key={job.id} job={job} idx={i} onGap={setGapJob} onSave={handleSave} onApply={handleApply} savedIds={savedIds} appliedIds={appliedIds} />)}
                    </div>
              }
            </div>
          </div>
        )}
      </div>
      {gapJob && <GapDrawer job={gapJob} onClose={() => setGapJob(null)} />}
    </div>
  );
}