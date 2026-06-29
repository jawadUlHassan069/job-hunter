// src/components/Landing/TeamSection.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TEAM, ACCENT } from "@/data.js";

gsap.registerPlugin(ScrollTrigger);

export default function TeamSection() {
  const sectionRef = useRef(null);

  useEffect(() => {
    // CRITICAL: Fallback for mobile in case GSAP doesn't fire
    const fallbackTimer = setTimeout(() => {
      const header = document.querySelector(".team-header");
      const cards = document.querySelectorAll(".team-card");
      if (header) header.style.opacity = "1";
      cards.forEach(c => { c.style.opacity = "1"; c.style.transform = "none"; });
    }, 100);

    const ctx = gsap.context(() => {
      gsap.fromTo(".team-header",
        { opacity:0, y:20 },
        { opacity:1, y:0, duration:0.6, ease:"power3.out", clearProps:"opacity,transform",
          scrollTrigger:{ trigger:sectionRef.current, start:"top 88%", once:true } }
      );
      gsap.fromTo(".team-card",
        { opacity:0, y:20 },
        { opacity:1, y:0, duration:0.5, stagger:0.07, ease:"power3.out", clearProps:"opacity,transform",
          scrollTrigger:{ trigger:".team-grid", start:"top 88%", once:true },
          onComplete: () => clearTimeout(fallbackTimer)
        }
      );
    }, sectionRef);
    
    return () => {
      clearTimeout(fallbackTimer);
      ctx.revert();
    };
  }, []);

  return (
    <section id="team" ref={sectionRef}
      style={{ padding:"56px 32px 60px", borderTop:"1px solid var(--border,rgba(255,255,255,0.08))", background:"var(--bg,#060816)" }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Header */}
        <div className="team-header" style={{ marginBottom:36, display:"flex",
          alignItems:"flex-end", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:10, fontFamily:"'JetBrains Mono',monospace", letterSpacing:"0.2em",
              textTransform:"uppercase", color:ACCENT, marginBottom:10 }}>◈ The Team</div>
            <h2 style={{ margin:0, fontFamily:"'Syne',sans-serif", fontWeight:900,
              fontSize:"clamp(1.6rem,3vw,2.4rem)", lineHeight:1.1, color:"var(--text,#f3f6ff)" }}>
              BSE 6A · Spring 2026
            </h2>
          </div>
          <p style={{ margin:0, fontSize:12, lineHeight:1.7, color:"var(--text-muted,rgba(243,246,255,0.50))",
            fontFamily:"'DM Mono',monospace", maxWidth:220 }}>
            CSL 220 Cloud Computing<br />Bahria University Karachi Campus
          </p>
        </div>

        {/* Cards */}
        <div className="team-grid" style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12 }}>
          {TEAM.map(m => (
            <div key={m.enroll} className="team-card" style={{
              borderRadius:12, padding:"18px",
              background:"var(--card-bg,#0d0f1a)",
              border:"1px solid rgba(255,255,255,0.08)",
              transition:"border-color 0.25s,transform 0.25s,box-shadow 0.25s",
            }}
              onMouseEnter={e=>{ e.currentTarget.style.borderColor=`${m.color}35`; e.currentTarget.style.transform="translateY(-3px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${m.color}12`; }}
              onMouseLeave={e=>{ e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}
            >
              {/* Avatar + lead */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:14 }}>
                <div style={{ width:38, height:38, borderRadius:9, background:`${m.color}22`, color:m.color,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:11, fontFamily:"'Syne',sans-serif" }}>
                  {m.initials}
                </div>
                {m.lead && (
                  <span style={{ fontSize:9, fontFamily:"'DM Mono',monospace", padding:"2px 8px",
                    borderRadius:100, background:`${ACCENT}18`, color:ACCENT, border:`1px solid ${ACCENT}28` }}>
                    Lead
                  </span>
                )}
              </div>
              {/* Name */}
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13,
                color:"var(--text,#f3f6ff)", marginBottom:3, lineHeight:1.3 }}>{m.name}</div>
              {/* Role */}
              <div style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:`${m.color}CC`, marginBottom:10 }}>{m.role}</div>
              {/* Enroll */}
              <div style={{ fontSize:10, fontFamily:"'DM Mono',monospace", color:"var(--text-faint,rgba(243,246,255,0.30))" }}>{m.enroll}</div>
            </div>
          ))}
        </div>

        <style>{`
          @media(max-width:880px){ .team-grid{ grid-template-columns:repeat(2,1fr)!important; } }
          @media(max-width:480px){ .team-grid{ grid-template-columns:1fr!important; } }
        `}</style>
      </div>
    </section>
  );
}
