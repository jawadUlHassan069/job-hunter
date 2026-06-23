// src/components/Landing/Carousel.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { JOBS } from "@/data.js";

gsap.registerPlugin(ScrollTrigger);

export default function Carousel() {
  const [current,   setCurrent]   = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const sectionRef  = useRef(null);
  const cardRef     = useRef(null);
  const intervalRef = useRef(null);

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

  const goTo = useCallback((idx) => { setCurrent((idx+JOBS.length)%JOBS.length); animateCard(); }, [animateCard]);
  const next = useCallback(() => goTo(current+1), [current, goTo]);
  const prev = useCallback(() => goTo(current-1), [current, goTo]);

  useEffect(() => {
    if (isHovered) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(next, 4500);
    return () => clearInterval(intervalRef.current);
  }, [isHovered, next]);

  const job = JOBS[current];

  return (
    <section id="jobs" ref={sectionRef}
      style={{ padding:"56px 32px 48px", background:"var(--bg,#060816)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div className="carousel-header" style={{ marginBottom:36 }}>
          <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.22em",
            textTransform:"uppercase", color:job.accent, marginBottom:10 }}>
            ◈ Featured Matches
          </div>
          <h2 style={{ margin:0, fontFamily:"'Syne',sans-serif", fontWeight:900,
            fontSize:"clamp(1.6rem,2.8vw,2.2rem)", color:"var(--text,#f3f6ff)", lineHeight:1.15 }}>
            Jobs matched to <span style={{ color:job.accent }}>your profile</span>
          </h2>
        </div>

        {/* Card */}
        <div className="carousel-card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>
          <div ref={cardRef} style={{
            background:"var(--card-bg,#0d0f1a)",
            border:`1px solid ${job.accent}28`,
            borderRadius:16, padding:"28px",
            boxShadow:`0 12px 40px ${job.accent}0e`,
            transition:"border-color 0.4s ease",
          }}>
            <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:24, alignItems:"center" }}>
              {/* Left */}
              <div>
                {/* Company row */}
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16, flexWrap:"wrap" }}>
                  <div style={{ width:42, height:42, borderRadius:10, display:"flex", alignItems:"center",
                    justifyContent:"center", background:`${job.accent}20`, color:job.accent,
                    fontWeight:800, fontSize:12, fontFamily:"'DM Mono',monospace", flexShrink:0 }}>
                    {job.logo}
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:"var(--text,#f3f6ff)" }}>{job.company}</div>
                    <div style={{ fontSize:12, color:"var(--text-muted,rgba(243,246,255,0.55))" }}>{job.location}</div>
                  </div>
                  <div style={{ marginLeft:"auto", fontSize:10, fontFamily:"'DM Mono',monospace",
                    padding:"3px 10px", borderRadius:100, background:`${job.accent}15`,
                    color:job.accent, border:`1px solid ${job.accent}30` }}>
                    {job.deadline}
                  </div>
                </div>
                <h3 style={{ margin:"0 0 12px", fontFamily:"'Syne',sans-serif", fontWeight:800,
                  fontSize:"clamp(1.1rem,2.2vw,1.45rem)", color:"var(--text,#f3f6ff)", lineHeight:1.2 }}>
                  {job.title}
                </h3>
                {/* Tags */}
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:18 }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{ padding:"4px 12px", borderRadius:100, fontSize:11,
                      background:`${job.accent}12`, color:job.accent, border:`1px solid ${job.accent}25` }}>
                      {tag}
                    </span>
                  ))}
                </div>
                {/* Salary + CTA */}
                <div style={{ display:"flex", alignItems:"center", gap:14, flexWrap:"wrap" }}>
                  <span style={{ fontSize:18, fontWeight:700, color:"var(--text,#f3f6ff)" }}>{job.salary}</span>
                  <button style={{ padding:"9px 20px", borderRadius:100, border:"none",
                    background:`linear-gradient(135deg,${job.accent},#34d399)`, color:"#fff",
                    fontWeight:600, fontSize:13, cursor:"pointer", transition:"transform 0.2s",
                    boxShadow:`0 6px 20px ${job.accent}30` }}
                    onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"}
                    onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                    Apply Now →
                  </button>
                </div>
              </div>
              {/* Match ring */}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                <div style={{ position:"relative", width:110, height:110 }}>
                  <svg viewBox="0 0 120 120" style={{ width:"100%", height:"100%", transform:"rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"/>
                    <circle cx="60" cy="60" r="50" fill="none" stroke={job.accent} strokeWidth="8"
                      strokeLinecap="round" strokeDasharray={`${(job.match/100)*314.16} 314.16`}
                      style={{ transition:"stroke-dasharray 0.7s ease", filter:`drop-shadow(0 0 6px ${job.accent})` }}/>
                  </svg>
                  <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center" }}>
                    <span style={{ fontSize:24, fontWeight:800, color:"var(--text,#f3f6ff)", lineHeight:1 }}>{job.match}%</span>
                    <span style={{ fontSize:9, letterSpacing:"0.15em", color:"var(--text-muted,rgba(243,246,255,0.50))", textTransform:"uppercase" }}>match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:16 }}>
            <div style={{ display:"flex", gap:6 }}>
              {JOBS.map((_,i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  height:7, borderRadius:999, border:"none", cursor:"pointer", padding:0,
                  width: i===current ? 28 : 7,
                  background: i===current ? job.accent : "rgba(255,255,255,0.18)",
                  transition:"all 0.3s ease" }} />
              ))}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              {[["←",prev],["→",next]].map(([arrow,fn]) => (
                <button key={arrow} onClick={fn} style={{
                  width:36, height:36, borderRadius:"50%", border:"1px solid rgba(255,255,255,0.12)",
                  background:"rgba(255,255,255,0.04)", color:"var(--text-soft,rgba(243,246,255,0.60))", fontSize:14,
                  cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.2s" }}
                  onMouseEnter={e=>{e.currentTarget.style.color="var(--text,#f3f6ff)";e.currentTarget.style.borderColor="rgba(255,255,255,0.25)";}}
                  onMouseLeave={e=>{e.currentTarget.style.color="rgba(243,246,255,0.60)";e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";}}>
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
