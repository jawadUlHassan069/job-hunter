// src/pages/DashboardPage.jsx
// Connect to: GET /api/jobs/applications/  GET /api/jobs/saved/  GET /api/cv/  PATCH /api/jobs/applications/:id/
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RefreshJobsButton from "../components/RefreshJobsButton";

/* ─── API helper ──────────────────────────────────────────── */
const BASE = import.meta.env.VITE_API_URL || "https://job-hunter-du0n.onrender.com";
const api = async (path, opts = {}) => {
  const token = localStorage.getItem("access_token");
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  if (res.status === 401) throw new Error("AUTH");
  return res;
};

/* ─── CSS ─────────────────────────────────────────────────── */
const PAGE_CSS = `
  @keyframes db-fadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
  @keyframes db-fadeIn  { from{opacity:0} to{opacity:1} }
  @keyframes db-pulse   { 0%,100%{box-shadow:0 0 0 0 rgba(29,158,117,0.5)} 50%{box-shadow:0 0 0 7px rgba(29,158,117,0)} }
  @keyframes db-countUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes db-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
  @keyframes db-cardIn  { from{opacity:0;transform:translateY(12px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes db-spin    { to{transform:rotate(360deg)} }

  .db-stat-card  { transition: border-color .2s, box-shadow .2s, transform .2s; }
  .db-stat-card:hover { border-color: rgba(29,158,117,0.30) !important; transform: translateY(-3px); box-shadow: 0 8px 32px rgba(29,158,117,0.08); }
  .db-app-card   { transition: border-color .25s, transform .25s, box-shadow .25s; }
  .db-app-card:hover { border-color: rgba(29,158,117,0.35) !important; transform: translateY(-2px); box-shadow: 0 6px 28px rgba(0,0,0,0.3); }
  .db-tab-btn    { transition: all .2s; }
  .db-tab-btn:hover { color: #f3f6ff !important; }
  .db-status-btn { transition: all .15s; }
  .db-status-btn:hover { opacity: .8; }
  .db-nav-btn    { transition: all .2s; }
  .db-nav-btn:hover { background: rgba(255,255,255,0.06) !important; color: #f3f6ff !important; }
  .db-shimmer {
    background:linear-gradient(90deg,rgba(255,255,255,0.03) 0%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 100%);
    background-size:200% 100%;
    animation:db-shimmer 1.6s ease infinite;
  }
`;

const mono = "'JetBrains Mono', monospace";
const heading = "'Plus Jakarta Sans', sans-serif";

// Keys match backend STATUS_CHOICES: applied / interview / offer / rejected
const STATUS_COLORS = {
  applied:   { bg: "rgba(59,130,246,0.14)",  border: "rgba(59,130,246,0.3)",  text: "rgba(147,197,253,0.9)",  dot: "#3b82f6" },
  interview: { bg: "rgba(234,179,8,0.14)",   border: "rgba(234,179,8,0.3)",   text: "rgba(253,224,71,0.9)",   dot: "#eab308" },
  offer:     { bg: "rgba(29,158,117,0.14)",  border: "rgba(29,158,117,0.3)",  text: "rgba(52,211,153,0.9)",   dot: "#1d9e75" },
  rejected:  { bg: "rgba(239,68,68,0.14)",   border: "rgba(239,68,68,0.3)",   text: "rgba(252,165,165,0.9)",  dot: "#ef4444" },
  saved:     { bg: "rgba(167,139,250,0.14)", border: "rgba(167,139,250,0.3)", text: "rgba(196,181,253,0.9)",  dot: "#a78bfa" },
};
// ← "interview" matches the backend model choice, NOT "interviewing"
const STATUSES = ["applied", "interview", "offer", "rejected"];

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.applied;
  return (
    <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 9px", borderRadius: 100, background: c.bg, color: c.text, border: `1px solid ${c.border}`, display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function StatCard({ icon, label, value, accent = "#1d9e75", delay = 0 }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    const n = parseInt(value) || 0;
    if (!n) { setDisplayed(n); return; }
    let v = 0;
    const t = setInterval(() => { v = Math.min(v + Math.ceil(n / 20), n); setDisplayed(v); if (v >= n) clearInterval(t); }, 40);
    return () => clearInterval(t);
  }, [value]);
  return (
    <div className="db-stat-card" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 14, padding: "20px 22px", animation: `db-fadeUp .5s ease ${delay}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}25`, border: `1px solid ${accent}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent, animation: "db-pulse 2.5s infinite" }} />
      </div>
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 28, color: "#f3f6ff", lineHeight: 1, marginBottom: 4, animation: `db-countUp .6s ease ${delay + 0.1}s both` }}>{typeof value === "string" && !parseInt(value) ? value : displayed}</div>
      <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.5)", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function AppCard({ app, idx, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const job = app.job || {};
  return (
    <div className="db-app-card" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 18px", animation: `db-cardIn .4s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: "#f3f6ff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || "Unknown Role"}</div>
          <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.55)" }}>{job.company || "—"} {job.location ? `· ${job.location}` : ""}</div>
        </div>
        <StatusBadge status={app.status || "applied"} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.4)" }}>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setOpen(!open)} style={{ fontSize: 9, fontFamily: mono, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.6)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>Update ▾</button>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, fontFamily: mono, padding: "3px 8px", borderRadius: 6, background: "rgba(29,158,117,0.15)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.3)", textDecoration: "none" }}>↗</a>}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.10)", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {STATUSES.map(s => (
            <button key={s} className="db-status-btn" onClick={() => { onStatusChange(app.id, s); setOpen(false); }} style={{ fontSize: 9, fontFamily: mono, padding: "3px 9px", borderRadius: 6, background: app.status === s ? `${STATUS_COLORS[s].bg}` : "rgba(255,255,255,0.06)", color: app.status === s ? STATUS_COLORS[s].text : "rgba(243,246,255,0.55)", border: `1px solid ${app.status === s ? STATUS_COLORS[s].border : "rgba(255,255,255,0.12)"}`, cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedJobCard({ item, idx, onRemove }) {
  const job = item.job || {};
  const daysLeft = job.days_until_deadline;
  const isUrgent = daysLeft !== null && daysLeft !== undefined && daysLeft <= 7;
  
  return (
    <div className="db-app-card" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 18px", animation: `db-cardIn .4s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: "#f3f6ff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || "Unknown Role"}</div>
          <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.55)" }}>{job.company || "—"} {job.location ? `· ${job.location}` : ""}</div>
        </div>
        {isUrgent && (
          <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 100, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", flexShrink: 0, marginLeft: 8 }}>
            ⚠ {daysLeft}d left
          </span>
        )}
      </div>
      {job.required_skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {job.required_skills.slice(0, 5).map((sk, i) => <span key={i} style={{ fontSize: 8, fontFamily: mono, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.5)", border: "1px solid rgba(255,255,255,0.10)" }}>{sk}</span>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, fontFamily: mono, padding: "4px 12px", borderRadius: 7, background: "#1d9e75", color: "#fff", border: "none", textDecoration: "none", fontWeight: 700 }}>Apply →</a>}
        <button onClick={() => onRemove(item.id)} style={{ fontSize: 9, fontFamily: mono, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer" }}>✕ Remove</button>
      </div>
    </div>
  );
}

function BrowseJobCard({ job, idx, onSave, onApply, savedIds, appliedIds }) {
  const isSaved = savedIds.has(job.id), isApplied = appliedIds.has(job.id);
  const daysLeft = job.days_until_deadline;
  const isUrgent = daysLeft !== null && daysLeft !== undefined && daysLeft <= 7;
  
  return (
    <div className="db-app-card" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "16px 18px", animation: `db-cardIn .4s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: "#f3f6ff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || "Unknown Role"}</div>
          <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.55)" }}>{job.company || "—"} {job.location ? `· ${job.location}` : ""}</div>
        </div>
        {isUrgent && (
          <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 100, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.35)", flexShrink: 0, marginLeft: 8 }}>
            ⚠ {daysLeft}d left
          </span>
        )}
      </div>
      {job.description && <p style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.35)", lineHeight: 1.6, marginBottom: 10, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{job.description}</p>}
      {job.required_skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {job.required_skills.slice(0, 6).map((sk, i) => <span key={i} style={{ fontSize: 8, fontFamily: mono, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.5)", border: "1px solid rgba(255,255,255,0.10)" }}>{sk}</span>)}
          {job.required_skills.length > 6 && <span style={{ fontSize: 8, fontFamily: mono, color: "rgba(255,255,255,0.2)", padding: "2px 4px" }}>+{job.required_skills.length - 6}</span>}
        </div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <button onClick={() => onSave(job)} style={{ width: 30, height: 30, borderRadius: 8, fontSize: 13, background: isSaved ? "rgba(29,158,117,0.12)" : "rgba(255,255,255,0.04)", color: isSaved ? "#1d9e75" : "rgba(243,246,255,0.4)", border: `1px solid ${isSaved ? "rgba(29,158,117,0.35)" : "rgba(255,255,255,0.07)"}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .2s" }}>{isSaved ? "★" : "☆"}</button>
        <a href={job.url || "#"} target="_blank" rel="noopener noreferrer" onClick={e => { if (!job.url) e.preventDefault(); onApply(job); }} style={{ flex: 1, fontSize: 9, fontFamily: mono, padding: "6px 14px", borderRadius: 7, background: isApplied ? "rgba(255,255,255,0.04)" : "#1d9e75", color: isApplied ? "rgba(243,246,255,0.4)" : "#fff", border: "none", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, transition: "all .2s" }}>{isApplied ? "Applied ✓" : "Apply →"}</a>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("applications"); // applications | saved | cv | browse
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [cvList, setCvList] = useState([]);
  const [browseJobs, setBrowseJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState("dark");
  const [jobStats, setJobStats] = useState(null);
  const [savedIds, setSavedIds] = useState(new Set());
  const [appliedIds, setAppliedIds] = useState(new Set());

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "dark";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  useEffect(() => {
    if (document.getElementById("db-page-css")) return;
    const s = document.createElement("style");
    s.id = "db-page-css"; s.textContent = PAGE_CSS;
    document.head.appendChild(s);
  }, []);

  // Single data-fetch on mount — no duplicate, no dead useCallback
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [appsRes, savedRes, cvRes, userRes, jobStatsRes, browseRes] = await Promise.all([
          api("/api/jobs/applications/"),
          api("/api/jobs/saved/"),
          api("/api/cv/").catch(() => ({ ok: false, json: async () => ({ error: "No CV" }) })),
          api("/api/auth/me/").catch(() => null),
          api("/api/jobs/stats/").catch(() => null),
          api("/api/jobs/").catch(() => ({ ok: false, json: async () => [] })),
        ]);
        const apps  = await appsRes.json();
        const saved = await savedRes.json();
        const cv    = await cvRes.json();
        const browse = browseRes.ok ? await browseRes.json() : [];
        setApplications(Array.isArray(apps)  ? apps  : []);
        setSavedJobs(Array.isArray(saved) ? saved : []);
        setBrowseJobs(Array.isArray(browse) ? browse : []);
        
        // Build savedIds and appliedIds Sets
        if (Array.isArray(saved)) {
          setSavedIds(new Set(saved.map(s => s.job.id)));
        }
        if (Array.isArray(apps)) {
          setAppliedIds(new Set(apps.map(a => a.job.id)));
        }
        
        // /api/cv/ returns a single object, not an array — wrap it
        // Only add to list if CV exists and has valid data
        if (cv && !cv.error && cv.cv) {
          setCvList([cv.cv]);
        } else {
          setCvList([]);
        }
        if (userRes?.ok) setUser(await userRes.json());
        if (jobStatsRes?.ok) setJobStats(await jobStatsRes.json());
      } catch (e) {
        if (e.message === "AUTH") { navigate("/login"); return; }
        setError("Failed to load data.");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const updateStatus = async (appId, status) => {
    try {
      await api(`/api/jobs/applications/${appId}/`, { method: "PATCH", body: JSON.stringify({ status }) });
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status } : a));
    } catch {}
  };

  const removeSaved = async (id) => {
    try {
      await api(`/api/jobs/saved/${id}/`, { method: "DELETE" });
      setSavedJobs(prev => prev.filter(s => s.id !== id));
    } catch {}
  };

  const saveJob = async (job) => {
    if (savedIds.has(job.id)) {
      // Remove from saved
      try {
        const r = await api("/api/jobs/saved/");
        const list = await r.json();
        const entry = list.find(s => s.job.id === job.id);
        if (entry) {
          await api(`/api/jobs/saved/${entry.id}/`, { method: "DELETE" });
          setSavedIds(p => { const n = new Set(p); n.delete(job.id); return n; });
          // Also remove from savedJobs list if viewing saved tab
          setSavedJobs(prev => prev.filter(s => s.job.id !== job.id));
        }
      } catch {}
    } else {
      // Add to saved
      try {
        const res = await api("/api/jobs/saved/", { method: "POST", body: JSON.stringify({ job_id: job.id }) });
        const saved = await res.json();
        setSavedIds(p => new Set([...p, job.id]));
        setSavedJobs(prev => [...prev, saved]);
      } catch {}
    }
  };

  const applyToJob = async (job) => {
    if (appliedIds.has(job.id)) return;
    try {
      await api("/api/jobs/applications/", { method: "POST", body: JSON.stringify({ job_id: job.id }) });
      setAppliedIds(p => new Set([...p, job.id]));
    } catch {}
  };

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/");
  };

  /* Stats */
  const stats = {
    total:    applications.length,
    active:   applications.filter(a => ["applied", "interviewing"].includes(a.status)).length,
    offers:   applications.filter(a => a.status === "offer").length,
    saved:    savedJobs.length,
    cvs:      cvList.length,
  };

  const filteredApps = statusFilter === "all" ? applications : applications.filter(a => a.status === statusFilter);

  /* Pipeline counts */
  const pipelineCounts = STATUSES.reduce((acc, s) => ({ ...acc, [s]: applications.filter(a => a.status === s).length }), {});

  const TABS = [
    { key: "applications", label: "Applications", count: applications.length },
    { key: "saved",        label: "Saved Jobs",   count: savedJobs.length },
    { key: "browse",       label: "Browse Jobs",  count: browseJobs.length },
    { key: "cv",           label: "My CVs",       count: cvList.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#0f1419", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 50% 35% at 80% 0%,rgba(29,158,117,0.12) 0%,transparent 55%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 16px 80px" }}>

        {/* Header */}
        <div className="dashboard-header" style={{ padding: "24px 0 20px", display: "flex", alignItems: "flex-start", gap: 12, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.12)", marginBottom: 32 }}>
          <div style={{ flex: "1 1 100%", minWidth: 0, marginBottom: 8 }}>
            <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", color: "#1d9e75", marginBottom: 4 }}>◈ DASHBOARD</div>
            <div style={{ fontFamily: heading, fontWeight: 900, fontSize: "clamp(1.4rem,3vw,2.2rem)", color: "#f3f6ff", lineHeight: 1.1 }}>
              {user?.name ? `Welcome back, ${user.name}` : "My Dashboard"}
            </div>
          </div>
          <div className="dashboard-header-buttons" style={{ display: "flex", gap: 6, flexWrap: "wrap", width: "100%", alignItems: "center" }}>
            <button onClick={toggleTheme} style={{ width: 34, height: 34, borderRadius: "50%", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.2s", flexShrink: 0 }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.10)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"} aria-label="Toggle theme">{theme === "light" ? "🌙" : "☀️"}</button>
            <button className="db-nav-btn" onClick={() => navigate("/cv-analysis")} style={{ fontSize: 10, fontFamily: mono, padding: "7px 12px", borderRadius: 8, background: "rgba(29,158,117,0.18)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.35)", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>Upload CV →</button>
            <button className="db-nav-btn" onClick={() => navigate("/cv-maker")} style={{ fontSize: 10, fontFamily: mono, padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.7)", border: "1px solid rgba(255,255,255,0.14)", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}>Build CV →</button>
            <button className="db-nav-btn" onClick={logout} style={{ fontSize: 10, fontFamily: mono, padding: "7px 10px", borderRadius: 8, background: "rgba(255,255,255,0.06)", color: "rgba(243,246,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap", marginLeft: "auto" }}>Log out</button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 40 }}>
          <StatCard icon="📋" label="Total Applications" value={stats.total}  accent="#1d9e75" delay={0} />
          <StatCard icon="⚡" label="Active Pipeline"    value={stats.active} accent="#3b82f6" delay={0.05} />
          <StatCard icon="🎯" label="Offers Received"    value={stats.offers} accent="#eab308" delay={0.10} />
          <StatCard icon="★"  label="Saved Jobs"         value={stats.saved}  accent="#a78bfa" delay={0.15} />
          <StatCard icon="📄" label="CVs Uploaded"       value={stats.cvs}    accent="#f59e0b" delay={0.20} />
        </div>

        {/* Refresh Jobs Button - Available for all logged-in users */}
        <RefreshJobsButton onRefreshComplete={() => {
          // Reload browse jobs and stats after refresh
          api("/api/jobs/").then(r => r.json()).then(jobs => setBrowseJobs(Array.isArray(jobs) ? jobs : [])).catch(() => {});
          api("/api/jobs/stats/").then(r => r.json()).then(stats => setJobStats(stats)).catch(() => {});
        }} />

        {/* Job database info */}
        {jobStats && jobStats.total_jobs > 0 && (
          <div style={{ marginBottom: 32, padding: "14px 18px", borderRadius: 12, background: "rgba(29,158,117,0.08)", border: "1px solid rgba(29,158,117,0.25)", animation: "db-fadeIn .5s ease .25s both", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>📊</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontFamily: heading, fontWeight: 700, color: "#1d9e75", marginBottom: 2 }}>
                Job Database Status
              </div>
              <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.5)" }}>
                {jobStats.total_jobs} total jobs • {jobStats.recent_jobs_24h} added in last 24h
                {jobStats.latest_scrape && ` • Last scrape: ${new Date(jobStats.latest_scrape).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
              </div>
            </div>
          </div>
        )}

        {/* Pipeline */}
        <div className="pipeline-section" style={{ marginBottom: 40, padding: "18px 22px", borderRadius: 14, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.12)", animation: "db-fadeUp .5s ease .2s both" }}>
          <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", color: "rgba(243,246,255,0.45)", marginBottom: 14 }}>◈ APPLICATION PIPELINE</div>
          <div className="pipeline-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {STATUSES.map(s => {
              const c = STATUS_COLORS[s];
              const count = pipelineCounts[s] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s} onClick={() => { setStatusFilter(s); setTab("applications"); }} style={{ cursor: "pointer", padding: "14px 16px", borderRadius: 10, background: `${c.bg}`, border: `1px solid ${c.border}`, transition: "transform .2s,box-shadow .2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${c.dot}25`; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 24, color: c.dot, lineHeight: 1, marginBottom: 4 }}>{count}</div>
                  <div style={{ fontSize: 10, fontFamily: mono, color: c.text, letterSpacing: "0.08em" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                  <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: c.dot, width: `${pct}%`, transition: "width .8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.12)", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="db-tab-btn" style={{ fontSize: 12, fontFamily: mono, padding: "10px 18px", background: "none", border: "none", cursor: "pointer", color: tab === t.key ? "#f3f6ff" : "rgba(243,246,255,0.5)", borderBottom: `2px solid ${tab === t.key ? "#1d9e75" : "transparent"}`, transition: "all .2s", marginBottom: -1 }}>
              {t.label} {t.count > 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 5, background: tab === t.key ? "rgba(29,158,117,0.22)" : "rgba(255,255,255,0.08)", color: tab === t.key ? "#1d9e75" : "rgba(243,246,255,0.45)", marginLeft: 6 }}>{t.count}</span>}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[0, 1, 2, 3].map(i => <div key={i} className="db-shimmer" style={{ height: 90, borderRadius: 12, animationDelay: `${i * 0.1}s` }} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{ padding: "20px 24px", borderRadius: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", fontSize: 12, fontFamily: mono, color: "#ef4444" }}>✕ {error} <button onClick={() => window.location.reload()} style={{ marginLeft: 12, color: "#f3f6ff", background: "none", border: "none", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>Retry</button></div>
        )}

        {/* Tab content */}
        {!loading && !error && (
          <>
            {/* APPLICATIONS */}
            {tab === "applications" && (
              <div style={{ animation: "db-fadeIn .4s ease" }}>
                {/* Status filter pills */}
                <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
                  {["all", ...STATUSES].map(s => {
                    const c = s === "all" ? { bg: "rgba(255,255,255,0.10)", text: "rgba(243,246,255,0.75)", border: "rgba(255,255,255,0.18)", dot: "rgba(255,255,255,0.5)" } : STATUS_COLORS[s];
                    const active = statusFilter === s;
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: 10, fontFamily: mono, padding: "5px 12px", borderRadius: 8, cursor: "pointer", background: active ? c.bg : "rgba(255,255,255,0.04)", color: active ? (s === "all" ? "#f3f6ff" : c.text) : "rgba(243,246,255,0.5)", border: `1px solid ${active ? c.border : "rgba(255,255,255,0.10)"}`, transition: "all .15s" }}>
                        {s === "all" ? `All (${applications.length})` : `${s.charAt(0).toUpperCase() + s.slice(1)} (${pipelineCounts[s] || 0})`}
                      </button>
                    );
                  })}
                </div>
                {filteredApps.length === 0
                  ? <Empty icon="📋" title="No applications yet" sub="Upload your CV and start applying to jobs matched to your profile" action={{ label: "Upload CV →", fn: () => navigate("/cv-analysis") }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
                      {filteredApps.map((a, i) => <AppCard key={a.id} app={a} idx={i} onStatusChange={updateStatus} />)}
                    </div>
                }
              </div>
            )}

            {/* SAVED JOBS */}
            {tab === "saved" && (
              <div style={{ animation: "db-fadeIn .4s ease" }}>
                {savedJobs.length === 0
                  ? <Empty icon="★" title="No saved jobs" sub="Save interesting jobs while browsing matched results" action={{ label: "Find Jobs →", fn: () => navigate("/cv-analysis") }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
                      {savedJobs.map((s, i) => <SavedJobCard key={s.id} item={s} idx={i} onRemove={removeSaved} />)}
                    </div>
                }
              </div>
            )}

            {/* BROWSE JOBS */}
            {tab === "browse" && (
              <div style={{ animation: "db-fadeIn .4s ease" }}>
                {browseJobs.length === 0
                  ? <Empty icon="🔍" title="No jobs available" sub="New jobs will appear here once they're scraped from job boards" />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 12 }}>
                      {browseJobs.map((job, i) => <BrowseJobCard key={job.id} job={job} idx={i} onSave={saveJob} onApply={applyToJob} savedIds={savedIds} appliedIds={appliedIds} />)}
                    </div>
                }
              </div>
            )}

            {/* CVs */}
            {tab === "cv" && (
              <div style={{ animation: "db-fadeIn .4s ease" }}>
                {cvList.length === 0
                  ? <Empty icon="📄" title="No CVs uploaded" sub="Upload your CV to get ATS scores and job matches" action={{ label: "Upload CV →", fn: () => navigate("/cv-analysis") }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                      {cvList.map((cv, i) => (
                        <div key={cv.id} className="db-app-card" style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: "18px 20px", animation: `db-cardIn .4s ease ${i * 0.05}s both` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(29,158,117,0.18)", border: "1px solid rgba(29,158,117,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 13, color: "#f3f6ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cv.original_filename || cv.file_name || `CV #${cv.id}`}</div>
                              <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.45)", marginTop: 2 }}>{cv.uploaded_at ? new Date(cv.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                            </div>
                          </div>
                          {cv.parsed?.skills?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                              {cv.parsed.skills.slice(0, 6).map((sk, j) => <span key={j} style={{ fontSize: 8, fontFamily: mono, padding: "2px 6px", borderRadius: 5, background: "rgba(29,158,117,0.12)", color: "rgba(29,158,117,0.9)", border: "1px solid rgba(29,158,117,0.28)" }}>{sk}</span>)}
                              {cv.parsed.skills.length > 6 && <span style={{ fontSize: 8, fontFamily: mono, color: "rgba(255,255,255,0.3)", padding: "2px 4px" }}>+{cv.parsed.skills.length - 6}</span>}
                            </div>
                          )}
                          <button onClick={() => navigate("/cv-analysis")} style={{ width: "100%", fontSize: 10, fontFamily: mono, padding: "7px 0", borderRadius: 8, background: "rgba(29,158,117,0.15)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.3)", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(29,158,117,0.22)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(29,158,117,0.15)"}>Re-run Analysis →</button>
                        </div>
                      ))}
                    </div>
                }
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Empty({ icon, title, sub, action }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.14)", background: "rgba(255,255,255,0.02)", animation: "db-fadeIn .5s ease" }}>
      <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.4 }}>{icon}</div>
      <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 17, color: "rgba(243,246,255,0.6)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.4)", marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>{sub}</div>
      {action && <button onClick={action.fn} style={{ padding: "10px 24px", borderRadius: 100, background: "#1d9e75", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: mono, fontWeight: 700 }}>{action.label}</button>}
    </div>
  );
}

// Add mobile responsive styles
if (typeof document !== 'undefined' && !document.getElementById('dashboard-mobile-css')) {
  const style = document.createElement('style');
  style.id = 'dashboard-mobile-css';
  style.textContent = `
    /* Dashboard header mobile responsive */
    @media (max-width: 768px) {
      .dashboard-header {
        padding: 20px 0 16px !important;
      }
      
      .dashboard-header-buttons {
        gap: 6px !important;
      }
      
      .db-nav-btn {
        font-size: 10px !important;
        padding: 7px 12px !important;
      }
    }
    
    @media (max-width: 520px) {
      .dashboard-header {
        padding: 16px 0 14px !important;
      }
      
      .dashboard-header-buttons {
        gap: 6px !important;
      }
      
      .db-nav-btn {
        font-size: 9px !important;
        padding: 6px 10px !important;
      }
    }
    
    /* Stats grid mobile responsive */
    @media (max-width: 768px) {
      [style*="gridTemplateColumns: \"repeat(auto-fit,minmax(160px,1fr))\""] {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    
    /* Pipeline and content grids mobile responsive */
    @media (max-width: 768px) {
      .pipeline-grid {
        grid-template-columns: repeat(2, 1fr) !important;
      }
    }
    
    @media (max-width: 520px) {
      /* Pipeline - single column on small mobile */
      .pipeline-grid {
        grid-template-columns: 1fr !important;
      }
      
      /* Stats - 2 columns on small mobile */
      .stats-grid-mobile {
        grid-template-columns: repeat(2, 1fr) !important;
      }
      
      /* Reduce padding on pipeline section */
      .pipeline-section {
        padding: 14px 16px !important;
      }
      
      /* Header - wrap buttons */
      [style*="display: \"flex\""][style*="gap: 8"] {
        flex-wrap: wrap;
      }
      
      /* Tab buttons - reduce padding */
      .db-tab-btn {
        padding: 8px 12px !important;
        font-size: 11px !important;
      }
      
      /* Filter pills - wrap properly */
      [style*="display: \"flex\""][style*="gap: 6"][style*="marginBottom: 20"] {
        flex-wrap: wrap;
      }
      
      /* Job cards grid - single column on small screens */
      [style*="gridTemplateColumns: \"repeat(auto-fill,minmax(320px,1fr))\""],
      [style*="gridTemplateColumns: \"repeat(auto-fill,minmax(280px,1fr))\""] {
        grid-template-columns: 1fr !important;
      }
    }
    
    @media (max-width: 380px) {
      /* Extra small screens - adjust stat cards */
      .db-stat-card {
        padding: 16px 18px !important;
      }
      
      /* Smaller font sizes */
      [style*="fontSize: 28"] {
        font-size: 24px !important;
      }
      
      /* Even smaller button text */
      .db-nav-btn {
        font-size: 8px !important;
        padding: 6px 8px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

