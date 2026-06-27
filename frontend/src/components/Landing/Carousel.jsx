// src/components/Landing/Carousel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BASE_URL = import.meta.env.VITE_API_URL || 'https://job-hunter-du0n.onrender.com';

export default function Carousel() {
  const [current,   setCurrent]   = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [jobs,      setJobs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const sectionRef  = useRef(null);
  const cardRef     = useRef(null);
  const intervalRef = useRef(null);

  // Fetch real jobs from backend
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/jobs/featured/`);
        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        }
      } catch (e) {
        console.error('Failed to fetch jobs:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".carousel-header",
        { opacity:0, y:20 },
        { opacity:1, y:0, duration:0.6, ease:"power3.out", clearProps:"opacity,transform",
          scrollTrigger:{ trigger:sectionRef.current, start:"top 88%", once:true } }
      );
      gsap.fromTo(".carousel-card",
        { opacity:0, y:30 },
        { opacity:1, y:0, duration:0.7, ease:"power3.out", clearProps:"opacity,transform",
          scrollTrigger:{ trigger:sectionRef.current, start:"top 85%", once:true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const animateCard = useCallback(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current, { opacity:0.5, y:10 }, { opacity:1, y:0, duration:0.35, ease:"power3.out" });
  }, []);

  const goTo = useCallback((idx) => { 
    if (jobs.length === 0) return;
    setCurrent((idx+jobs.length)%jobs.length); 
    animateCard(); 
  }, [animateCard, jobs.length]);
  
  const next = useCallback(() => goTo(current+1), [current, goTo]);
  const prev = useCallback(() => goTo(current-1), [current, goTo]);

  useEffect(() => {
    if (isHovered || jobs.length === 0) { 
      clearInterval(intervalRef.current); 
      return; 
    }
    intervalRef.current = setInterval(next, 4500);
    return () => clearInterval(intervalRef.current);
  }, [isHovered, next, jobs.length]);

  if (loading || jobs.length === 0) {
    return (
      <section id="jobs" ref={sectionRef} style={{ padding:"56px 32px 48px", background:"var(--bg,#060816)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", textAlign:"center", padding:"60px 0", color:"rgba(243,246,255,0.5)" }}>
          {loading ? "Loading jobs..." : "No jobs available"}
        </div>
      </section>
    );
  }

  const job = jobs[current];
  const accent = ["#1d9e75", "#3b82f6", "#eab308", "#a78bfa", "#f59e0b"][current % 5];
  
  // Calculate deadline badge
  const daysLeft = job.days_until_deadline;
  const deadlineBadge = daysLeft !== null && daysLeft !== undefined ? (
    daysLeft <= 7 ? (
      <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "3px 10px", borderRadius: 100, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)" }}>
        ⚠ {daysLeft} days left
      </div>
    ) : (
      <div style={{ fontSize: 10, fontFamily: "'DM Mono',monospace", padding: "3px 10px", borderRadius: 100, background: `${accent}15`, color: accent, border: `1px solid ${accent}30` }}>
        {daysLeft} days left
      </div>
    )
  ) : null;

  return (
    <section id="jobs" ref={sectionRef}
      style={{ padding:"56px 32px 48px", background:"var(--bg,#060816)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div className="carousel-header" style={{ marginBottom:36 }}>
          <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.22em",
            textTransform:"uppercase", color:accent, marginBottom:10 }}>
            ◈ Featured Jobs
          </div>
          <h2 style={{ margin:0, fontFamily:"'Syne',sans-serif", fontWeight:900,
            fontSize:"clamp(1.6rem,2.8vw,2.2rem)", color:"var(--text,#f3f6ff)", lineHeight:1.15 }}>
            Latest opportunities <span style={{ color:accent }}>from top companies</span>
          </h2>
        </div>

        {/* Card */}
        <div className="carousel-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <div ref={cardRef} style={{
            background:"var(--card-bg,#0d0f1a)",
            border:`1px solid ${accent}28`,
            borderRadius:16, padding:"28px",
            boxShadow:`0 12px 40px ${accent}0e`,
            transition:"border-color 0.4s ease",
          }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"center" }}>
              {/* Left */}
              <div>
                {/* Company row */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ width:42, height:42, borderRadius:10, display:"flex", alignItems:"center",
                    justifyContent:"center", background:`${accent}20`, color:accent,
                    fontWeight:800, fontSize:12, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
                    {job.company.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--text,#f3f6ff)" }}>{job.company}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted,rgba(243,246,255,0.55))" }}>{job.location || "Remote"}</div>
                  </div>
                  {deadlineBadge && <div style={{ marginLeft:"auto" }}>{deadlineBadge}</div>}
                  {!deadlineBadge && (
                    <div style={{ marginLeft:"auto", fontSize:10, fontFamily:"'DM Mono',monospace",
                      padding:"3px 10px", borderRadius:100, background:`${accent}15`,
                      color:accent, border:`1px solid ${accent}30` }}>
                      {job.source}
                    </div>
                  )}
                </div>
                <h3 style={{ margin:"0 0 12px", fontFamily:"'Syne',sans-serif", fontWeight:800,
                  fontSize:"clamp(1.1rem,2.2vw,1.45rem)", color:"var(--text,#f3f6ff)", lineHeight:1.2 }}>
                  {job.title}
                </h3>
                {/* Tags */}
                {job.required_skills && job.required_skills.length > 0 && (
                  <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>
                    {job.required_skills.slice(0, 5).map((skill, i) => (
                      <span key={i} style={{ padding:"4px 12px", borderRadius:100, fontSize:11,
                        background:`${accent}12`, color:accent, border:`1px solid ${accent}25` }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {/* Description preview */}
                {job.description && (
                  <p style={{ fontSize:13, color:"rgba(243,246,255,0.6)", margin:"0 0 18px", lineHeight:1.5,
                    display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                    {job.description}
                  </p>
                )}
                {/* CTA */}
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <a href={job.url} target="_blank" rel="noopener noreferrer" 
                    style={{ padding:"9px 20px", borderRadius:100, border:"none", textDecoration:"none",
                    background:`linear-gradient(135deg,${accent},#34d399)`, color:"#fff",
                    fontWeight:600, fontSize:13, cursor:"pointer", transition:"transform 0.2s",
                    boxShadow:`0 6px 20px ${accent}30`, display:"inline-block" }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    View Job →
                  </a>
                  <span style={{ fontSize:11, color:"rgba(243,246,255,0.4)" }}>
                    Posted {new Date(job.scraped_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
              {/* Badge */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <div style={{ width:110, height:110, borderRadius:"50%", display:"flex", flexDirection:"column",
                  alignItems:"center", justifyContent:"center", background:`${accent}15`,
                  border:`2px solid ${accent}30` }}>
                  <span style={{ fontSize:11, letterSpacing:"0.12em", color:"rgba(243,246,255,0.50)", 
                    textTransform:"uppercase", marginBottom:4 }}>New</span>
                  <span style={{ fontSize:10, color:"rgba(243,246,255,0.6)", textAlign:"center", maxWidth:80 }}>
                    Fresh Job
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
            <div style={{ display:"flex", gap:6 }}>
              {jobs.map((_,i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  height:7, borderRadius:999, border:"none", cursor:"pointer", padding:0,
                  width: i===current ? 28 : 7,
                  background: i===current ? accent : "rgba(255,255,255,0.18)",
                  transition:"all 0.3s ease" }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[["←",prev],["→",next]].map(([arrow,fn]) => (
                <button key={arrow} onClick={fn} style={{
                  width:36, height:36, borderRadius:"50%", border:"1px solid var(--border,rgba(255,255,255,0.12))",
                  background:"var(--surface,rgba(255,255,255,0.04))", color:"var(--text,#f3f6ff)", fontSize:14,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.background=`${accent}15`;e.currentTarget.style.borderColor=`${accent}40`;e.currentTarget.style.color=accent;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="var(--surface,rgba(255,255,255,0.04))";e.currentTarget.style.borderColor="var(--border,rgba(255,255,255,0.12))";e.currentTarget.style.color="var(--text,#f3f6ff)";}}>
                  {arrow}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
