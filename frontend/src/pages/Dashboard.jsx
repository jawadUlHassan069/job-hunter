// src/pages/DashboardPage.jsx
// Connect to: GET /api/jobs/applications/  GET /api/jobs/saved/  GET /api/cv/  PATCH /api/jobs/applications/:id/
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";

/* ─── API helper ──────────────────────────────────────────── */
const BASE = "http://localhost:8000";
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

const STATUS_COLORS = {
  applied:     { bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.3)",  text: "rgba(147,197,253,0.9)",   dot: "#3b82f6" },
  interviewing:{ bg: "rgba(234,179,8,0.14)",  border: "rgba(234,179,8,0.3)",   text: "rgba(253,224,71,0.9)",    dot: "#eab308" },
  offer:       { bg: "rgba(29,158,117,0.14)", border: "rgba(29,158,117,0.3)",  text: "rgba(52,211,153,0.9)",    dot: "#1d9e75" },
  rejected:    { bg: "rgba(239,68,68,0.14)",  border: "rgba(239,68,68,0.3)",   text: "rgba(252,165,165,0.9)",   dot: "#ef4444" },
  saved:       { bg: "rgba(167,139,250,0.14)",border: "rgba(167,139,250,0.3)", text: "rgba(196,181,253,0.9)",   dot: "#a78bfa" },
};
const STATUSES = ["applied", "interviewing", "offer", "rejected"];

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
    <div className="db-stat-card" style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "20px 22px", animation: `db-fadeUp .5s ease ${delay}s both` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}18`, border: `1px solid ${accent}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{icon}</div>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent, animation: "db-pulse 2.5s infinite" }} />
      </div>
      <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 28, color: "#f3f6ff", lineHeight: 1, marginBottom: 4, animation: `db-countUp .6s ease ${delay + 0.1}s both` }}>{typeof value === "string" && !parseInt(value) ? value : displayed}</div>
      <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.38)", letterSpacing: "0.05em" }}>{label}</div>
    </div>
  );
}

function AppCard({ app, idx, onStatusChange }) {
  const [open, setOpen] = useState(false);
  const job = app.job || {};
  return (
    <div className="db-app-card" style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", animation: `db-cardIn .4s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: "#f3f6ff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || "Unknown Role"}</div>
          <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.4)" }}>{job.company || "—"} {job.location ? `· ${job.location}` : ""}</div>
        </div>
        <StatusBadge status={app.status || "applied"} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.25)" }}>Applied {app.applied_at ? new Date(app.applied_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}</div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => setOpen(!open)} style={{ fontSize: 9, fontFamily: mono, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.03)", color: "rgba(243,246,255,0.4)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>Update ▾</button>
          {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, fontFamily: mono, padding: "3px 8px", borderRadius: 6, background: "rgba(29,158,117,0.10)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.22)", textDecoration: "none" }}>↗</a>}
        </div>
      </div>
      {open && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", flexWrap: "wrap", gap: 5 }}>
          {STATUSES.map(s => (
            <button key={s} className="db-status-btn" onClick={() => { onStatusChange(app.id, s); setOpen(false); }} style={{ fontSize: 9, fontFamily: mono, padding: "3px 9px", borderRadius: 6, background: app.status === s ? `${STATUS_COLORS[s].bg}` : "rgba(255,255,255,0.03)", color: app.status === s ? STATUS_COLORS[s].text : "rgba(243,246,255,0.4)", border: `1px solid ${app.status === s ? STATUS_COLORS[s].border : "rgba(255,255,255,0.07)"}`, cursor: "pointer" }}>{s}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function SavedJobCard({ item, idx, onRemove }) {
  const job = item.job || {};
  return (
    <div className="db-app-card" style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 18px", animation: `db-cardIn .4s ease ${idx * 0.05}s both` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 14, color: "#f3f6ff", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{job.title || "Unknown Role"}</div>
          <div style={{ fontSize: 10, fontFamily: mono, color: "rgba(243,246,255,0.4)" }}>{job.company || "—"} {job.location ? `· ${job.location}` : ""}</div>
        </div>
        {job.days_until_deadline != null && job.days_until_deadline <= 7 && (
          <span style={{ fontSize: 9, fontFamily: mono, padding: "2px 8px", borderRadius: 100, background: "rgba(239,68,68,0.10)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.28)", flexShrink: 0, marginLeft: 8 }}>⚠ {job.days_until_deadline}d</span>
        )}
      </div>
      {job.required_skills?.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
          {job.required_skills.slice(0, 5).map((sk, i) => <span key={i} style={{ fontSize: 8, fontFamily: mono, padding: "2px 6px", borderRadius: 5, background: "rgba(255,255,255,0.03)", color: "rgba(243,246,255,0.35)", border: "1px solid rgba(255,255,255,0.06)" }}>{sk}</span>)}
        </div>
      )}
      <div style={{ display: "flex", gap: 6 }}>
        {job.url && <a href={job.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 9, fontFamily: mono, padding: "4px 12px", borderRadius: 7, background: "#1d9e75", color: "#fff", border: "none", textDecoration: "none", fontWeight: 700 }}>Apply →</a>}
        <button onClick={() => onRemove(item.id)} style={{ fontSize: 9, fontFamily: mono, padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.03)", color: "rgba(243,246,255,0.35)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>✕ Remove</button>
      </div>
    </div>
  );
}

/* ─── Main Page ───────────────────────────────────────────── */
export default function DashboardPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("applications"); // applications | saved | cv
  const [applications, setApplications] = useState([]);
  const [savedJobs, setSavedJobs] = useState([]);
  const [cvList, setCvList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [user, setUser] = useState(null);

  useEffect(() => {
    if (document.getElementById("db-page-css")) return;
    const s = document.createElement("style");
    s.id = "db-page-css"; s.textContent = PAGE_CSS;
    document.head.appendChild(s);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [appsRes, savedRes, cvRes, userRes] = await Promise.all([
        api("/api/jobs/applications/"),
        api("/api/jobs/saved/"),
        api("/api/cv/"),
        api("/api/auth/me/").catch(() => null),
      ]);
      setApplications(Array.isArray(await appsRes.json()) ? await appsRes.clone().json() : []);
      setSavedJobs(Array.isArray(await savedRes.json()) ? await savedRes.clone().json() : []);
      setCvList(Array.isArray(await cvRes.json()) ? await cvRes.clone().json() : []);
      if (userRes?.ok) setUser(await userRes.json());
    } catch (e) {
      if (e.message === "AUTH") { navigate("/login"); return; }
      setError("Failed to load dashboard data.");
    } finally { setLoading(false); }
  }, [navigate]);

  // Re-fetch properly
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const [appsRes, savedRes, cvRes] = await Promise.all([
          api("/api/jobs/applications/"),
          api("/api/jobs/saved/"),
          api("/api/cv/"),
        ]);
        const apps  = await appsRes.json();
        const saved = await savedRes.json();
        const cvs   = await cvRes.json();
        setApplications(Array.isArray(apps)  ? apps  : []);
        setSavedJobs(Array.isArray(saved) ? saved : []);
        setCvList(Array.isArray(cvs)    ? cvs   : []);
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

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
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
    { key: "cv",           label: "My CVs",       count: cvList.length },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg,#060816)", position: "relative" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, background: "radial-gradient(ellipse 50% 35% at 80% 0%,rgba(29,158,117,0.08) 0%,transparent 55%)" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>

        {/* Header */}
        <div style={{ padding: "32px 0 28px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: 32 }}>
          <div>
            <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", color: "#1d9e75", marginBottom: 4 }}>◈ DASHBOARD</div>
            <div style={{ fontFamily: heading, fontWeight: 900, fontSize: "clamp(1.6rem,3vw,2.2rem)", color: "#f3f6ff", lineHeight: 1 }}>
              {user?.first_name ? `Welcome back, ${user.first_name}` : "My Dashboard"}
            </div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            <button className="db-nav-btn" onClick={() => navigate("/cv-analysis")} style={{ fontSize: 11, fontFamily: mono, padding: "8px 16px", borderRadius: 10, background: "rgba(29,158,117,0.12)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.28)", cursor: "pointer" }}>Upload CV →</button>
            <button className="db-nav-btn" onClick={() => navigate("/cv-maker")} style={{ fontSize: 11, fontFamily: mono, padding: "8px 16px", borderRadius: 10, background: "rgba(255,255,255,0.04)", color: "rgba(243,246,255,0.6)", border: "1px solid rgba(255,255,255,0.09)", cursor: "pointer" }}>Build CV →</button>
            <button className="db-nav-btn" onClick={logout} style={{ fontSize: 11, fontFamily: mono, padding: "8px 12px", borderRadius: 10, background: "rgba(255,255,255,0.03)", color: "rgba(243,246,255,0.35)", border: "1px solid rgba(255,255,255,0.07)", cursor: "pointer" }}>Log out</button>
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

        {/* Pipeline */}
        <div style={{ marginBottom: 40, padding: "18px 22px", borderRadius: 14, background: "rgba(255,255,255,0.015)", border: "1px solid rgba(255,255,255,0.07)", animation: "db-fadeUp .5s ease .2s both" }}>
          <div style={{ fontSize: 10, fontFamily: mono, letterSpacing: "0.22em", color: "rgba(243,246,255,0.3)", marginBottom: 14 }}>◈ APPLICATION PIPELINE</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
            {STATUSES.map(s => {
              const c = STATUS_COLORS[s];
              const count = pipelineCounts[s] || 0;
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={s} onClick={() => { setStatusFilter(s); setTab("applications"); }} style={{ cursor: "pointer", padding: "14px 16px", borderRadius: 10, background: `${c.bg}`, border: `1px solid ${c.border}`, transition: "transform .2s,box-shadow .2s" }} onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 6px 20px ${c.dot}18`; }} onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
                  <div style={{ fontFamily: heading, fontWeight: 900, fontSize: 24, color: c.dot, lineHeight: 1, marginBottom: 4 }}>{count}</div>
                  <div style={{ fontSize: 10, fontFamily: mono, color: c.text, letterSpacing: "0.08em" }}>{s.charAt(0).toUpperCase() + s.slice(1)}</div>
                  <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: c.dot, width: `${pct}%`, transition: "width .8s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className="db-tab-btn" style={{ fontSize: 12, fontFamily: mono, padding: "10px 18px", background: "none", border: "none", cursor: "pointer", color: tab === t.key ? "#f3f6ff" : "rgba(243,246,255,0.35)", borderBottom: `2px solid ${tab === t.key ? "#1d9e75" : "transparent"}`, transition: "all .2s", marginBottom: -1 }}>
              {t.label} {t.count > 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 5, background: tab === t.key ? "rgba(29,158,117,0.18)" : "rgba(255,255,255,0.05)", color: tab === t.key ? "#1d9e75" : "rgba(243,246,255,0.3)", marginLeft: 6 }}>{t.count}</span>}
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
                    const c = s === "all" ? { bg: "rgba(255,255,255,0.06)", text: "rgba(243,246,255,0.6)", border: "rgba(255,255,255,0.12)", dot: "rgba(255,255,255,0.4)" } : STATUS_COLORS[s];
                    const active = statusFilter === s;
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)} style={{ fontSize: 10, fontFamily: mono, padding: "5px 12px", borderRadius: 8, cursor: "pointer", background: active ? c.bg : "rgba(255,255,255,0.02)", color: active ? (s === "all" ? "#f3f6ff" : c.text) : "rgba(243,246,255,0.35)", border: `1px solid ${active ? c.border : "rgba(255,255,255,0.06)"}`, transition: "all .15s" }}>
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

            {/* CVs */}
            {tab === "cv" && (
              <div style={{ animation: "db-fadeIn .4s ease" }}>
                {cvList.length === 0
                  ? <Empty icon="📄" title="No CVs uploaded" sub="Upload your CV to get ATS scores and job matches" action={{ label: "Upload CV →", fn: () => navigate("/cv-analysis") }} />
                  : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 12 }}>
                      {cvList.map((cv, i) => (
                        <div key={cv.id} className="db-app-card" style={{ background: "var(--card-bg,#0d0f1a)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "18px 20px", animation: `db-cardIn .4s ease ${i * 0.05}s both` }}>
                          <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(29,158,117,0.12)", border: "1px solid rgba(29,158,117,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>📄</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontFamily: heading, fontWeight: 700, fontSize: 13, color: "#f3f6ff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cv.original_filename || cv.file_name || `CV #${cv.id}`}</div>
                              <div style={{ fontSize: 9, fontFamily: mono, color: "rgba(243,246,255,0.3)", marginTop: 2 }}>{cv.uploaded_at ? new Date(cv.uploaded_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</div>
                            </div>
                          </div>
                          {cv.parsed?.skills?.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                              {cv.parsed.skills.slice(0, 6).map((sk, j) => <span key={j} style={{ fontSize: 8, fontFamily: mono, padding: "2px 6px", borderRadius: 5, background: "rgba(29,158,117,0.09)", color: "rgba(29,158,117,0.8)", border: "1px solid rgba(29,158,117,0.2)" }}>{sk}</span>)}
                              {cv.parsed.skills.length > 6 && <span style={{ fontSize: 8, fontFamily: mono, color: "rgba(255,255,255,0.2)", padding: "2px 4px" }}>+{cv.parsed.skills.length - 6}</span>}
                            </div>
                          )}
                          <button onClick={() => navigate("/cv-analysis")} style={{ width: "100%", fontSize: 10, fontFamily: mono, padding: "7px 0", borderRadius: 8, background: "rgba(29,158,117,0.10)", color: "#1d9e75", border: "1px solid rgba(29,158,117,0.22)", cursor: "pointer", transition: "background .15s" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(29,158,117,0.18)"} onMouseLeave={e => e.currentTarget.style.background = "rgba(29,158,117,0.10)"}>Re-run Analysis →</button>
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
    <div style={{ padding: "60px 24px", textAlign: "center", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.01)", animation: "db-fadeIn .5s ease" }}>
      <div style={{ fontSize: 36, marginBottom: 14, opacity: 0.3 }}>{icon}</div>
      <div style={{ fontFamily: heading, fontWeight: 800, fontSize: 17, color: "rgba(243,246,255,0.45)", marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 11, fontFamily: mono, color: "rgba(243,246,255,0.25)", marginBottom: 20, maxWidth: 320, margin: "0 auto 20px" }}>{sub}</div>
      {action && <button onClick={action.fn} style={{ padding: "10px 24px", borderRadius: 100, background: "#1d9e75", color: "#fff", border: "none", cursor: "pointer", fontSize: 12, fontFamily: mono, fontWeight: 700 }}>{action.label}</button>}
    </div>
  );
}
