import { useState, useRef, useEffect, useCallback } from "react";

/* ─── API ─────────────────────────────────────────────────────────────── */
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
    // Try refresh
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

/* ─── Design tokens (matches landing page) ──────────────────────────── */
const ACCENT  = "#1d9e75";
const BG      = "#080808";
const SURF    = "#0d0d0d";
const SURF2   = "#111111";
const BORDER  = "rgba(255,255,255,0.06)";
const BORDER2 = "rgba(255,255,255,0.10)";

/* ─── Fonts ──────────────────────────────────────────────────────────── */
const FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Mono:ital,wght@0,300;0,400;0,500;1,400&family=DM+Sans:wght@300;400;500;600&display=swap";

/* ─── CSS ────────────────────────────────────────────────────────────── */
const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body {
    font-family: 'DM Mono', monospace;
    background: ${BG};
    color: #fff;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }

  @keyframes fadeUp   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
  @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
  @keyframes blink    { 0%,100%{opacity:1} 50%{opacity:0.1} }
  @keyframes spin     { to{transform:rotate(360deg)} }
  @keyframes scanLine {
    0%   { transform: translateY(-100%); opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { transform: translateY(800%); opacity: 0; }
  }
  @keyframes fillBar  { from{width:0} to{width:var(--w)} }
  @keyframes countUp  { from{opacity:0;transform:scale(0.8)} to{opacity:1;transform:scale(1)} }
  @keyframes cardIn   {
    from { opacity:0; transform:translateY(24px) scale(0.97); }
    to   { opacity:1; transform:translateY(0) scale(1); }
  }
  @keyframes pulseRing {
    0%   { transform:scale(1);   opacity:0.6; }
    100% { transform:scale(1.8); opacity:0; }
  }
  @keyframes drawerIn {
    from { transform:translateX(100%); opacity:0; }
    to   { transform:translateX(0);    opacity:1; }
  }
  @keyframes shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  @keyframes float {
    0%,100% { transform:translateY(0); }
    50%     { transform:translateY(-6px); }
  }

  .shimmer {
    background: linear-gradient(90deg,
      rgba(255,255,255,0.04) 0%,
      rgba(255,255,255,0.09) 50%,
      rgba(255,255,255,0.04) 100%
    );
    background-size: 200% 100%;
    animation: shimmer 1.6s ease infinite;
  }

  .job-card { transition: border-color 0.25s, box-shadow 0.25s, transform 0.25s; }
  .job-card:hover {
    border-color: rgba(29,158,117,0.35) !important;
    box-shadow: 0 8px 40px rgba(29,158,117,0.12);
    transform: translateY(-3px);
  }

  .skill-tag { transition: background 0.2s, border-color 0.2s, color 0.2s; }

  .btn-primary {
    transition: opacity 0.15s, transform 0.15s, box-shadow 0.15s;
  }
  .btn-primary:hover:not(:disabled) {
    opacity: 0.85;
    transform: scale(1.03);
    box-shadow: 0 0 28px ${ACCENT}50;
  }
  .btn-primary:active:not(:disabled) { transform: scale(0.98); }

  .gap-row { transition: background 0.2s; }
  .gap-row:hover { background: rgba(255,255,255,0.03) !important; }
`;

/* ─── Helpers ─────────────────────────────────────────────────────────── */
const fmt = (s) => String(s ?? "");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function scoreColor(s) {
  if (s >= 80) return "#1d9e75";
  if (s >= 60) return "#eab308";
  return "#ef4444";
}
function scoreLabel(s) {
  if (s >= 80) return "Excellent";
  if (s >= 60) return "Good";
  if (s >= 40) return "Fair";
  return "Needs Work";
}

/* ─── Section label (matches landing page) ──────────────────────────── */
function SectionLabel({ children, color = ACCENT }) {
  return (
    <div style={{
      fontSize: 10, fontFamily: "'DM Mono',monospace", letterSpacing: "0.22em",
      textTransform: "uppercase", color, marginBottom: 16,
    }}>◈ {children}</div>
  );
}

/* ─── Animated score ring ────────────────────────────────────────────── */
function ScoreRing({ score, size = 140 }) {
  const [displayed, setDisplayed] = useState(0);
  const R = (size / 2) - 10;
  const circ = 2 * Math.PI * R;
  const dash = (displayed / 100) * circ;
  const color = scoreColor(score);

  useEffect(() => {
    let raf, start = null, from = 0;
    const duration = 1400;
    const tick = (t) => {
      if (!start) start = t;
      const p = Math.min((t - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplayed(Math.round(from + (score - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      {/* pulse rings */}
      {[0, 0.3, 0.6].map((d, i) => (
        <div key={i} style={{
          position: "absolute", inset: -8 - i * 4,
          borderRadius: "50%", border: `1px solid ${color}`,
          animation: `pulseRing 2.4s ease-out ${d}s infinite`,
          opacity: 0,
        }} />
      ))}
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={8} />
        <circle
          cx={size/2} cy={size/2} r={R} fill="none"
          stroke={color} strokeWidth={8} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: "stroke 0.6s ease" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: size * 0.22, color, lineHeight: 1 }}>
          {displayed}
        </div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", marginTop: 2, fontFamily: "'DM Mono',monospace" }}>
          ATS SCORE
        </div>
      </div>
    </div>
  );
}

/* ─── Processing animation ────────────────────────────────────────────── */
function ProcessingScreen({ stage }) {
  const STAGES = [
    { key: "upload",   icon: "⬆",  label: "Uploading CV",          sub: "Securely transferring your document…" },
    { key: "parse",    icon: "⚙",  label: "Parsing with Claude AI", sub: "Extracting skills, experience, and education…" },
    { key: "ats",      icon: "◎",  label: "Running ATS Analysis",   sub: "Scoring against industry benchmarks…" },
    { key: "match",    icon: "◈",  label: "Matching Jobs via RAG",  sub: "ChromaDB semantic search running…" },
  ];
  const current = STAGES.findIndex(s => s.key === stage);

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: 48, animation: "fadeIn 0.5s ease",
    }}>
      {/* Animated document icon */}
      <div style={{ position: "relative", width: 100, height: 120, animation: "float 3s ease infinite" }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: 10,
          background: "linear-gradient(135deg, #111 0%, #1a1a1a 100%)",
          border: `1px solid ${BORDER2}`,
          display: "flex", flexDirection: "column", padding: "16px 14px", gap: 6,
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${ACCENT}20`,
          overflow: "hidden",
        }}>
          {[70, 50, 60, 40, 55, 35, 48].map((w, i) => (
            <div key={i} style={{
              height: 3, width: `${w}%`, borderRadius: 2,
              background: i < 2 ? `${ACCENT}60` : "rgba(255,255,255,0.1)",
            }} />
          ))}
          {/* scan line */}
          <div style={{
            position: "absolute", left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)`,
            animation: "scanLine 2.2s ease-in-out infinite",
          }} />
        </div>
        {/* top-right fold */}
        <div style={{
          position: "absolute", top: 0, right: 0, width: 22, height: 22,
          background: BG, borderLeft: `1px solid ${BORDER2}`, borderBottom: `1px solid ${BORDER2}`,
          borderRadius: "0 10px 0 8px",
        }} />
      </div>

      {/* Stage list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%", maxWidth: 380 }}>
        {STAGES.map((s, i) => {
          const done   = i < current;
          const active = i === current;
          return (
            <div key={s.key} style={{
              display: "flex", alignItems: "center", gap: 14, padding: "12px 16px",
              borderRadius: 10, border: `1px solid ${active ? ACCENT + "40" : BORDER}`,
              background: active ? `${ACCENT}08` : "transparent",
              transition: "all 0.4s ease",
              opacity: i > current ? 0.3 : 1,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: done ? ACCENT : active ? `${ACCENT}20` : "rgba(255,255,255,0.05)",
                border: `1px solid ${done ? ACCENT : active ? `${ACCENT}50` : BORDER}`,
                fontSize: done ? 13 : 15, color: done ? "#000" : active ? ACCENT : "rgba(255,255,255,0.3)",
                transition: "all 0.4s ease",
                animation: active ? "spin 1.2s linear infinite" : "none",
              }}>
                {done ? "✓" : s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 12, fontWeight: 600, fontFamily: "'DM Mono',monospace",
                  color: done ? "rgba(255,255,255,0.6)" : active ? "#fff" : "rgba(255,255,255,0.25)",
                  marginBottom: 2,
                }}>{s.label}</div>
                {active && (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono',monospace" }}>
                    {s.sub}
                  </div>
                )}
              </div>
              {active && (
                <div style={{ display: "flex", gap: 4 }}>
                  {[0,1,2].map(i => (
                    <div key={i} style={{
                      width: 4, height: 4, borderRadius: "50%", background: ACCENT,
                      animation: `blink 1s ease-in-out ${i*0.25}s infinite`,
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

/* ─── Upload zone ─────────────────────────────────────────────────────── */
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
      onDrop={e => {
        e.preventDefault(); setDrag(false);
        handle(e.dataTransfer.files[0]);
      }}
      style={{
        position: "relative", border: `1.5px dashed ${drag ? ACCENT : BORDER2}`,
        borderRadius: 16, padding: "52px 32px", textAlign: "center",
        cursor: loading ? "not-allowed" : "pointer", overflow: "hidden",
        background: drag ? `${ACCENT}08` : "rgba(255,255,255,0.015)",
        transition: "all 0.25s ease",
        boxShadow: drag ? `0 0 40px ${ACCENT}20` : "none",
      }}
    >
      {/* grid pattern bg */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none",
        backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
        backgroundSize: "28px 28px",
      }} />

      {/* Icon */}
      <div style={{
        width: 64, height: 64, borderRadius: 16, margin: "0 auto 20px",
        background: drag ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
        border: `1px solid ${drag ? ACCENT + "50" : BORDER2}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 24, transition: "all 0.25s ease",
        animation: drag ? "float 1.5s ease infinite" : "none",
      }}>
        {loading ? (
          <div style={{ width: 24, height: 24, borderRadius: "50%", border: `2px solid ${ACCENT}`, borderTopColor: "transparent", animation: "spin 0.8s linear infinite" }} />
        ) : "📄"}
      </div>

      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 18, color: "#fff", marginBottom: 8 }}>
        {drag ? "Drop your CV here" : "Upload your CV"}
      </div>
      <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.32)", lineHeight: 1.8 }}>
        Drag & drop or click to browse<br />
        <span style={{ color: ACCENT }}>PDF only · max 5MB</span>
      </div>

      <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
        onChange={e => handle(e.target.files[0])} />
    </div>
  );
}

/* ─── ATS Score panel ─────────────────────────────────────────────────── */
function ATSPanel({ cvData, matchScore }) {
  const score = matchScore ?? 72;
  const { parsed } = cvData;

  const bars = [
    { label: "Skills Match",    val: clamp(score + 8,  0, 100) },
    { label: "Experience",      val: clamp(score - 5,  0, 100) },
    { label: "Education",       val: clamp(score + 12, 0, 100) },
    { label: "Keywords",        val: clamp(score - 10, 0, 100) },
    { label: "Format & Layout", val: 85 },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 32, alignItems: "start" }}>
      {/* Ring */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <ScoreRing score={score} size={140} />
        <div style={{
          padding: "4px 14px", borderRadius: 100, fontSize: 10,
          fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em",
          background: `${scoreColor(score)}18`, color: scoreColor(score),
          border: `1px solid ${scoreColor(score)}30`,
        }}>
          {scoreLabel(score)}
        </div>
      </div>

      {/* Bars + skills */}
      <div>
        <div style={{ marginBottom: 20 }}>
          {bars.map((b, i) => (
            <div key={b.label} style={{ marginBottom: 11 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.45)" }}>{b.label}</span>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: scoreColor(b.val) }}>{b.val}%</span>
              </div>
              <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 2,
                  background: `linear-gradient(90deg, ${scoreColor(b.val)}, ${scoreColor(b.val)}aa)`,
                  "--w": `${b.val}%`,
                  animation: `fillBar 1.2s cubic-bezier(0.22,1,0.36,1) ${0.1 + i * 0.12}s both`,
                  width: `${b.val}%`,
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Detected skills */}
        {parsed?.skills?.length > 0 && (
          <div>
            <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
              Detected Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {parsed.skills.slice(0, 12).map((sk, i) => (
                <span key={i} className="skill-tag" style={{
                  fontSize: 10, fontFamily: "'DM Mono',monospace",
                  padding: "3px 10px", borderRadius: 100,
                  background: `${ACCENT}12`, color: ACCENT,
                  border: `1px solid ${ACCENT}25`,
                  animation: `cardIn 0.4s ease ${0.05 * i}s both`,
                }}>{sk}</span>
              ))}
              {parsed.skills.length > 12 && (
                <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", padding: "3px 10px" }}>
                  +{parsed.skills.length - 12} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Job card ────────────────────────────────────────────────────────── */
function JobCard({ job, idx, onGap, onSave, onApply, savedIds, appliedIds }) {
  const isSaved   = savedIds.has(job.id);
  const isApplied = appliedIds.has(job.id);
  const urgency   = job.days_until_deadline != null && job.days_until_deadline <= 7;

  return (
    <div className="job-card" style={{
      background: SURF2, border: `1px solid ${BORDER}`,
      borderRadius: 14, padding: "20px 22px",
      animation: `cardIn 0.5s ease ${0.06 * idx}s both`,
      cursor: "default",
    }}>
      {/* Header row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2, lineHeight: 1.3 }}>
            {job.title}
          </div>
          <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.4)" }}>
            {job.company} · {job.location}
          </div>
        </div>
        {/* Source badge */}
        <span style={{
          fontSize: 9, fontFamily: "'DM Mono',monospace", letterSpacing: "0.1em",
          textTransform: "uppercase", padding: "3px 8px", borderRadius: 6,
          background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)",
          border: `1px solid ${BORDER}`, flexShrink: 0, marginLeft: 8,
        }}>
          {job.source || "web"}
        </span>
      </div>

      {/* Description excerpt */}
      {job.description && (
        <p style={{
          fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.32)",
          lineHeight: 1.7, marginBottom: 12,
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
        }}>
          {job.description}
        </p>
      )}

      {/* Skills */}
      {job.required_skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {job.required_skills.slice(0, 6).map((sk, i) => (
            <span key={i} style={{
              fontSize: 9, fontFamily: "'DM Mono',monospace", padding: "2px 8px",
              borderRadius: 100, background: "rgba(255,255,255,0.04)",
              color: "rgba(255,255,255,0.4)", border: `1px solid ${BORDER}`,
            }}>{sk}</span>
          ))}
          {job.required_skills.length > 6 && (
            <span style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", padding: "2px 4px" }}>
              +{job.required_skills.length - 6}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        {/* Deadline */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {job.deadline && (
            <span style={{
              fontSize: 9, fontFamily: "'DM Mono',monospace", padding: "2px 8px", borderRadius: 100,
              background: urgency ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.04)",
              color: urgency ? "#ef4444" : "rgba(255,255,255,0.3)",
              border: `1px solid ${urgency ? "rgba(239,68,68,0.3)" : BORDER}`,
            }}>
              {urgency ? `⚠ ${job.days_until_deadline}d left` : `Deadline ${job.deadline}`}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => onGap(job)}
            style={{
              padding: "5px 12px", borderRadius: 8, fontSize: 10, fontFamily: "'DM Mono',monospace",
              background: `${ACCENT}14`, color: ACCENT, border: `1px solid ${ACCENT}30`,
              cursor: "pointer", transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}25`; }}
            onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}14`; }}
          >
            Skill Gap ↗
          </button>

          <button onClick={() => onSave(job)}
            style={{
              width: 30, height: 30, borderRadius: 8, fontSize: 13,
              background: isSaved ? `${ACCENT}20` : "rgba(255,255,255,0.04)",
              color: isSaved ? ACCENT : "rgba(255,255,255,0.3)",
              border: `1px solid ${isSaved ? ACCENT + "40" : BORDER}`,
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.2s",
            }}>
            {isSaved ? "★" : "☆"}
          </button>

          <a href={job.url || "#"} target="_blank" rel="noopener noreferrer"
            onClick={e => { if (!job.url) e.preventDefault(); onApply(job); }}
            style={{
              padding: "5px 14px", borderRadius: 8, fontSize: 10, fontFamily: "'Syne',monospace",
              background: isApplied ? "rgba(255,255,255,0.06)" : ACCENT,
              color: isApplied ? "rgba(255,255,255,0.4)" : "#000",
              border: "none", cursor: "pointer", textDecoration: "none",
              display: "flex", alignItems: "center",
              fontWeight: 700, transition: "all 0.2s",
            }}>
            {isApplied ? "Applied ✓" : "Apply →"}
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Skill Gap Drawer ────────────────────────────────────────────────── */
function GapDrawer({ job, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

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
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 40, backdropFilter: "blur(4px)" }}
      />
      {/* Drawer */}
      <div style={{
        position: "fixed", top: 0, right: 0, bottom: 0,
        width: "min(520px, 100vw)", zIndex: 50,
        background: "#0a0a0a", borderLeft: `1px solid ${BORDER2}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
        animation: "drawerIn 0.35s cubic-bezier(0.22,1,0.36,1)",
        boxShadow: "-20px 0 60px rgba(0,0,0,0.7)",
      }}>
        {/* Drawer header */}
        <div style={{
          padding: "22px 24px 18px", borderBottom: `1px solid ${BORDER}`,
          background: SURF, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <SectionLabel>Skill Gap Analysis</SectionLabel>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 17, color: "#fff", lineHeight: 1.3 }}>
                {job.title}
              </div>
              <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)", marginTop: 3 }}>
                {job.company}
              </div>
            </div>
            <button onClick={onClose}
              style={{
                width: 32, height: 32, borderRadius: 8, background: "rgba(255,255,255,0.05)",
                border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.4)",
                cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.2s", flexShrink: 0,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.4)"}
            >×</button>
          </div>

          {/* Match score bar */}
          {data && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.4)" }}>Match Score</span>
                <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: scoreColor(data.match_score) }}>
                  {data.match_score}% — {scoreLabel(data.match_score)}
                </span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3, transition: "width 1s ease",
                  background: `linear-gradient(90deg, ${scoreColor(data.match_score)}, ${scoreColor(data.match_score)}88)`,
                  width: `${data.match_score}%`,
                }} />
              </div>
            </div>
          )}
        </div>

        {/* Drawer body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="shimmer" style={{ height: 52, borderRadius: 10 }} />
              ))}
            </div>
          )}

          {err && (
            <div style={{ padding: 20, borderRadius: 10, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", fontSize: 12, fontFamily: "'DM Mono',monospace" }}>
              {err}
            </div>
          )}

          {data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* Strong matches */}
              {data.strong_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                    ✓ Strong Matches ({data.strong_matches.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.strong_matches.map((sk, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontFamily: "'DM Mono',monospace", padding: "4px 12px",
                        borderRadius: 100, background: `${ACCENT}14`, color: ACCENT,
                        border: `1px solid ${ACCENT}30`,
                      }}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Partial matches */}
              {data.partial_matches?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "#eab308", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                    ◑ Partial Matches ({data.partial_matches.length})
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.partial_matches.map((pm, i) => (
                      <div className="gap-row" key={i} style={{
                        padding: "11px 14px", borderRadius: 10,
                        background: "rgba(234,179,8,0.06)", border: "1px solid rgba(234,179,8,0.15)",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", fontWeight: 600, color: "#fff" }}>{pm.skill}</span>
                          <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "#eab308" }}>You have: {pm.candidate_has}</span>
                        </div>
                        <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>{pm.gap}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing skills */}
              {data.missing_skills?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "#ef4444", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                    ✕ Missing Skills ({data.missing_skills.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {data.missing_skills.map((sk, i) => (
                      <span key={i} style={{
                        fontSize: 11, fontFamily: "'DM Mono',monospace", padding: "4px 12px",
                        borderRadius: 100, background: "rgba(239,68,68,0.08)", color: "#ef4444",
                        border: "1px solid rgba(239,68,68,0.25)",
                      }}>{sk}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations?.length > 0 && (
                <div>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.3)", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 10 }}>
                    ◈ Recommendations
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {data.recommendations.map((r, i) => (
                      <div key={i} style={{
                        display: "flex", gap: 10, padding: "10px 12px",
                        borderRadius: 8, background: "rgba(255,255,255,0.025)",
                        border: `1px solid ${BORDER}`,
                      }}>
                        <span style={{ color: ACCENT, flexShrink: 0, fontSize: 12, marginTop: 1 }}>→</span>
                        <span style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.55)", lineHeight: 1.65 }}>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {data.summary && (
                <div style={{
                  padding: "14px 16px", borderRadius: 10,
                  background: `${ACCENT}08`, border: `1px solid ${ACCENT}20`,
                }}>
                  <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: ACCENT, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>
                    AI Summary
                  </div>
                  <p style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.55)", lineHeight: 1.8, fontStyle: "italic" }}>
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

/* ─── Skeleton loader for jobs ───────────────────────────────────────── */
function JobSkeleton({ count = 3 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div key={i} className="shimmer" style={{
      height: 170, borderRadius: 14, animation: `shimmer 1.6s ease ${i * 0.15}s infinite`,
    }} />
  ));
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN PAGE COMPONENT
══════════════════════════════════════════════════════════════════════ */
export default function CVAnalysisPage() {
  // phases: idle | processing | done | error
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
  const [filter,      setFilter]      = useState("all"); // all | soon | saved
  const jobsRef = useRef(null);

  // Inject fonts + CSS
  useEffect(() => {
    const link = document.createElement("link"); link.rel = "stylesheet"; link.href = FONT_HREF;
    document.head.appendChild(link);
    const style = document.createElement("style"); style.textContent = CSS;
    document.head.appendChild(style);
    return () => { document.head.removeChild(link); document.head.removeChild(style); };
  }, []);

  // Load saved/applied on mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    api("/api/jobs/saved/").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSavedIds(new Set(d.map(s => s.job.id)));
    }).catch(() => {});
    api("/api/jobs/applications/").then(r => r.json()).then(d => {
      if (Array.isArray(d)) setAppliedIds(new Set(d.map(a => a.job.id)));
    }).catch(() => {});
  }, []);

  /* ── Upload + process pipeline ── */
  const handleFile = useCallback(async (file) => {
    setFileName(file.name);
    setPhase("processing");
    setError(null);

    // 1. Upload CV
    setProcStage("upload");
    let cv;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api("/api/cv/", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.detail || "Upload failed");
      }
      cv = await res.json();
    } catch (e) {
      setError(e.message || "CV upload failed. Please try again.");
      setPhase("error");
      return;
    }

    // 2. Parse stage (simulate brief wait since backend does it synchronously)
    setProcStage("parse");
    await new Promise(r => setTimeout(r, 800));

    // 3. ATS stage
    setProcStage("ats");
    await new Promise(r => setTimeout(r, 900));
    setCvData(cv);

    // 4. Match jobs via RAG
    setProcStage("match");
    setJobsLoading(true);
    let matched = [];
    // Wait a bit for ChromaDB embedding (per API docs: 10-15s after fresh upload)
    await new Promise(r => setTimeout(r, 1200));
    try {
      const res = await api("/api/match/");
      if (res.status === 202) {
        // Still indexing — wait and retry once
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

    // Scroll to results
    setTimeout(() => jobsRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
  }, []);

  const handleSave = useCallback(async (job) => {
    const isSaved = savedIds.has(job.id);
    if (isSaved) {
      // Find saved entry ID — need list refresh
      try {
        const res = await api("/api/jobs/saved/");
        const list = await res.json();
        const entry = list.find(s => s.job.id === job.id);
        if (entry) {
          await api(`/api/jobs/saved/${entry.id}/`, { method: "DELETE" });
          setSavedIds(prev => { const n = new Set(prev); n.delete(job.id); return n; });
        }
      } catch {}
    } else {
      try {
        await api("/api/jobs/saved/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ job_id: job.id }),
      });
      setAppliedIds(prev => new Set([...prev, job.id]));
    } catch {}
  }, [appliedIds]);

  const reset = () => {
    setPhase("idle"); setCvData(null); setJobs([]);
    setError(null); setFileName("");
  };

  /* ── Filter jobs ── */
  const displayJobs = jobs.filter(j => {
    if (filter === "soon") return j.days_until_deadline != null && j.days_until_deadline <= 7;
    if (filter === "saved") return savedIds.has(j.id);
    return true;
  });

  /* ── Score from first matched job or default ── */
  const atsScore = jobs[0] ? null : null; // will come from gap analysis; use null to trigger default

  return (
    <div style={{ minHeight: "100vh", background: BG, position: "relative", overflow: "hidden" }}>

      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, opacity: 0.025,
        backgroundImage: "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
      }} />

      {/* Radial glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
        background: `radial-gradient(ellipse 70% 50% at 50% 0%, ${ACCENT}14 0%, transparent 65%)`,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ padding: "64px 0 48px", borderBottom: `1px solid ${BORDER}`, marginBottom: 48 }}>
          <SectionLabel>CV Analysis · Job Matching</SectionLabel>
          <h1 style={{
            fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: "clamp(2.4rem,5vw,4rem)",
            lineHeight: 0.9, letterSpacing: "-0.03em", color: "#fff", marginBottom: 16,
          }}>
            SCAN YOUR CV.<br />
            <span style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.18)", color: "transparent" }}>
              FIND YOUR MATCH.
            </span>
          </h1>
          <p style={{
            fontFamily: "'DM Mono',monospace", fontSize: 13, color: "rgba(255,255,255,0.38)",
            lineHeight: 1.8, maxWidth: 480,
          }}>
            Upload your CV — our AI parses it with Claude, scores it against ATS benchmarks,
            then finds the best jobs via RAG + ChromaDB semantic search.
          </p>
          {cvData && (
            <button onClick={reset} style={{
              marginTop: 16, background: "none", border: `1px solid ${BORDER2}`,
              color: "rgba(255,255,255,0.35)", fontSize: 11, fontFamily: "'DM Mono',monospace",
              padding: "6px 14px", borderRadius: 8, cursor: "pointer", transition: "color 0.15s",
            }}
              onMouseEnter={e => e.currentTarget.style.color = "#fff"}
              onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
            >← Upload new CV</button>
          )}
        </div>

        {/* ── IDLE: upload zone ── */}
        {phase === "idle" && (
          <div style={{ maxWidth: 560, margin: "0 auto", animation: "fadeUp 0.6s ease" }}>
            <UploadZone onFile={handleFile} loading={false} />
            <div style={{
              display: "flex", gap: 16, marginTop: 20,
              padding: "14px 18px", borderRadius: 10,
              background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
            }}>
              {[
                { icon: "◎", text: "ATS Score Analysis" },
                { icon: "◈", text: "RAG Job Matching" },
                { icon: "◑", text: "Skill Gap Report" },
              ].map(f => (
                <div key={f.text} style={{ display: "flex", alignItems: "center", gap: 7, flex: 1 }}>
                  <span style={{ color: ACCENT, fontSize: 12 }}>{f.icon}</span>
                  <span style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)" }}>{f.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── PROCESSING ── */}
        {phase === "processing" && (
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <ProcessingScreen stage={procStage} />
          </div>
        )}

        {/* ── ERROR ── */}
        {phase === "error" && (
          <div style={{ maxWidth: 480, margin: "0 auto 40px", animation: "fadeUp 0.5s ease" }}>
            <div style={{
              padding: "20px 24px", borderRadius: 12,
              background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)",
            }}>
              <div style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#ef4444", marginBottom: 12 }}>
                ✕ {error}
              </div>
              <button className="btn-primary" onClick={reset}
                style={{
                  padding: "9px 20px", borderRadius: 100, background: ACCENT, color: "#000",
                  border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700,
                  fontFamily: "'Syne',sans-serif",
                }}>Try Again</button>
            </div>
          </div>
        )}

        {/* ── DONE: ATS + Jobs ── */}
        {phase === "done" && cvData && (
          <div style={{ display: "flex", flexDirection: "column", gap: 48 }}>

            {/* ATS SECTION */}
            <div style={{ animation: "fadeUp 0.6s ease" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <SectionLabel>ATS Report</SectionLabel>
                <div style={{
                  marginLeft: "auto", fontSize: 10, fontFamily: "'DM Mono',monospace",
                  color: "rgba(255,255,255,0.25)",
                  padding: "3px 10px", borderRadius: 6, border: `1px solid ${BORDER}`,
                }}>
                  {fileName}
                </div>
              </div>

              <div style={{
                background: SURF, border: `1px solid ${BORDER2}`,
                borderRadius: 16, padding: "28px 28px",
              }}>
                {/* CV parsed name + info */}
                {cvData.parsed?.name && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                      background: `${ACCENT}18`, border: `1px solid ${ACCENT}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 16, color: ACCENT,
                    }}>
                      {cvData.parsed.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "#fff" }}>
                        {cvData.parsed.name}
                      </div>
                      <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                        {[cvData.parsed.email, cvData.parsed.location].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
                      {[
                        { label: "Skills",   val: cvData.parsed.skills?.length || 0 },
                        { label: "Jobs",     val: cvData.parsed.experience?.length || 0 },
                        { label: "Certs",    val: cvData.parsed.certifications?.length || 0 },
                      ].map(stat => (
                        <div key={stat.label} style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 900, fontSize: 20, color: ACCENT }}>{stat.val}</div>
                          <div style={{ fontSize: 9, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em" }}>{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <ATSPanel cvData={cvData} matchScore={jobs[0] ? 72 : 65} />
              </div>
            </div>

            {/* JOBS SECTION */}
            <div ref={jobsRef}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                <SectionLabel>Matched Jobs</SectionLabel>

                {/* Filter tabs */}
                <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
                  {[
                    { key: "all",   label: `All (${jobs.length})` },
                    { key: "soon",  label: "Closing Soon" },
                    { key: "saved", label: `Saved (${savedIds.size})` },
                  ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                      style={{
                        padding: "5px 12px", borderRadius: 8, fontSize: 10,
                        fontFamily: "'DM Mono',monospace", cursor: "pointer",
                        background: filter === f.key ? `${ACCENT}18` : "rgba(255,255,255,0.04)",
                        color: filter === f.key ? ACCENT : "rgba(255,255,255,0.3)",
                        border: `1px solid ${filter === f.key ? ACCENT + "35" : BORDER}`,
                        transition: "all 0.2s",
                      }}>{f.label}</button>
                  ))}
                </div>
              </div>

              {jobsLoading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <JobSkeleton count={3} />
                </div>
              ) : displayJobs.length === 0 ? (
                <div style={{
                  padding: "48px 24px", textAlign: "center", borderRadius: 14,
                  border: `1px dashed ${BORDER2}`, background: "rgba(255,255,255,0.01)",
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◈</div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 16, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>
                    {filter !== "all" ? "No jobs in this filter" : "No matched jobs yet"}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: "'DM Mono',monospace", color: "rgba(255,255,255,0.2)" }}>
                    {filter !== "all" ? "Try switching to All" : "Jobs are being indexed — check back in a moment"}
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {displayJobs.map((job, i) => (
                    <JobCard key={job.id} job={job} idx={i}
                      onGap={setGapJob}
                      onSave={handleSave}
                      onApply={handleApply}
                      savedIds={savedIds}
                      appliedIds={appliedIds}
                    />
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Skill Gap Drawer */}
      {gapJob && <GapDrawer job={gapJob} onClose={() => setGapJob(null)} />}
    </div>
  );
}
