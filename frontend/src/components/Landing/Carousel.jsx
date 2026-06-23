// src/components/landing/Carousel.jsx
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
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 80%", once: true } }
      );
      gsap.fromTo(".carousel-card",
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power4.out",
          scrollTrigger: { trigger: sectionRef.current, start: "top 75%", once: true } }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const animateCard = useCallback(() => {
    if (!cardRef.current) return;
    gsap.fromTo(cardRef.current,
      { opacity: 0.4, y: 16 },
      { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
    );
  }, []);

  const goTo = useCallback((idx) => {
    setCurrent((idx + JOBS.length) % JOBS.length);
    animateCard();
  }, [animateCard]);

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (isHovered) { clearInterval(intervalRef.current); return; }
    intervalRef.current = setInterval(next, 4500);
    return () => clearInterval(intervalRef.current);
  }, [isHovered, next]);

  const job = JOBS[current];

  return (
    <section id="jobs" ref={sectionRef} style={{ padding: "80px 24px", background: "var(--bg)" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* Header */}
        <div className="carousel-header" style={{ opacity: 0, marginBottom: "48px" }}>
          <div style={{ fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.25em",
            textTransform: "uppercase", color: job.accent, marginBottom: "12px" }}>
            ◈ Featured Matches
          </div>
          <h2 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800,
            color: "var(--text)", lineHeight: 1.1 }}>
            Jobs matched to{" "}
            <span style={{ color: job.accent }}>your profile</span>
          </h2>
        </div>

        {/* Card */}
        <div className="carousel-card" style={{ opacity: 0 }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}>

          <div ref={cardRef} style={{
            background: "var(--card-bg)",
            border: `1px solid ${job.accent}25`,
            borderRadius: "24px",
            padding: "36px",
            boxShadow: `0 20px 60px ${job.accent}12`,
            transition: "border-color 0.4s ease",
          }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "32px", alignItems: "center" }}>

              {/* Left */}
              <div>
                {/* Company row */}
                <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "20px", flexWrap: "wrap" }}>
                  <div style={{
                    width: "48px", height: "48px", borderRadius: "14px",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: `${job.accent}20`, color: job.accent,
                    fontWeight: 800, fontSize: "13px", fontFamily: "monospace", flexShrink: 0,
                  }}>
                    {job.logo}
                  </div>
                  <div>
                    <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--text)" }}>{job.company}</div>
                    <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{job.location} · {job.type}</div>
                  </div>
                  <div style={{ marginLeft: "auto", fontSize: "11px", fontFamily: "monospace",
                    padding: "4px 12px", borderRadius: "999px",
                    background: `${job.accent}15`, color: job.accent,
                    border: `1px solid ${job.accent}30` }}>
                    {job.deadline}
                  </div>
                </div>

                {/* Title */}
                <h3 style={{ fontSize: "clamp(1.4rem,3vw,2rem)", fontWeight: 800,
                  color: "var(--text)", marginBottom: "16px", lineHeight: 1.2 }}>
                  {job.title}
                </h3>

                {/* Tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "24px" }}>
                  {job.tags.map(tag => (
                    <span key={tag} style={{
                      padding: "6px 14px", borderRadius: "999px", fontSize: "12px", fontWeight: 500,
                      background: `${job.accent}12`, color: job.accent,
                      border: `1px solid ${job.accent}25`,
                    }}>{tag}</span>
                  ))}
                </div>

                {/* Salary + CTA */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)" }}>{job.salary}</span>
                  <button style={{
                    padding: "12px 24px", borderRadius: "999px", border: "none",
                    background: `linear-gradient(135deg, ${job.accent}, #34d399)`,
                    color: "#fff", fontWeight: 600, fontSize: "14px",
                    cursor: "pointer", transition: "transform 0.2s ease",
                    boxShadow: `0 8px 24px ${job.accent}35`,
                  }}
                    onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                    onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                  >
                    Apply Now →
                  </button>
                </div>
              </div>

              {/* Match circle */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <div style={{ position: "relative", width: "130px", height: "130px" }}>
                  <svg viewBox="0 0 120 120" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border)" strokeWidth="8" />
                    <circle cx="60" cy="60" r="50" fill="none" stroke={job.accent} strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(job.match / 100) * 314.16} 314.16`}
                      style={{ transition: "stroke-dasharray 0.7s ease", filter: `drop-shadow(0 0 8px ${job.accent})` }}
                    />
                  </svg>
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text)", lineHeight: 1 }}>{job.match}%</span>
                    <span style={{ fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-muted)", textTransform: "uppercase" }}>match</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px" }}>
            {/* Dots */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {JOBS.map((j, i) => (
                <button key={i} onClick={() => goTo(i)} style={{
                  height: "8px", borderRadius: "999px", border: "none", cursor: "pointer",
                  width: i === current ? "32px" : "8px",
                  background: i === current ? job.accent : "var(--border-strong)",
                  transition: "all 0.3s ease", padding: 0,
                }} />
              ))}
            </div>
            {/* Arrows */}
            <div style={{ display: "flex", gap: "10px" }}>
              {[["←", prev], ["→", next]].map(([arrow, fn]) => (
                <button key={arrow} onClick={fn} style={{
                  width: "42px", height: "42px", borderRadius: "50%", border: "1px solid var(--border)",
                  background: "var(--surface)", color: "var(--text-soft)", fontSize: "16px",
                  cursor: "pointer", transition: "all 0.2s ease", display: "flex",
                  alignItems: "center", justifyContent: "center",
                }}
                  onMouseEnter={e => { e.currentTarget.style.color = "var(--text)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
                  onMouseLeave={e => { e.currentTarget.style.color = "var(--text-soft)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                >
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
