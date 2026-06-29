// src/components/Landing/BentoGrid.jsx
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { BENTO_CARDS } from "@/data.js";

gsap.registerPlugin(ScrollTrigger);

function BentoCard({ card }) {
  const ref = useRef(null);
  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (!ref.current) return;
        ref.current.style.borderColor = `${card.accent}55`;
        ref.current.style.transform   = "translateY(-3px)";
        ref.current.style.boxShadow   = `0 8px 28px ${card.accent}14`;
      }}
      onMouseLeave={() => {
        if (!ref.current) return;
        ref.current.style.borderColor = `${card.accent}22`;
        ref.current.style.transform   = "none";
        ref.current.style.boxShadow   = "none";
      }}
      className={`bento-card ${card.span}`}
      style={{
        /* Never start invisible — GSAP will animate from opacity:0
           but clearProps ensures it always ends at opacity:1 */
        background:     "var(--card-bg)",
        border:         `1px solid ${card.accent}22`,
        borderRadius:   14,
        padding:        "22px",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "space-between",
        minHeight:      card.large ? "240px" : "155px",
        cursor:         "pointer",
        transition:     "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
      }}
    >
      <div>
        {/* Tag — full opacity, uses accent color directly */}
        <div style={{
          fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.16em", textTransform: "uppercase",
          color: card.accent,          /* no opacity reduction */
          marginBottom: 10,
          fontWeight: 600,
        }}>
          {card.tag}
        </div>

        {/* Headline */}
        <h3 style={{
          margin: 0,
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: card.large ? "clamp(1.15rem, 2vw, 1.55rem)" : "clamp(0.92rem, 1.6vw, 1.08rem)",
          lineHeight: 1.25,
          color: "var(--text)",        /* CSS variable — works in both modes */
          marginBottom: 9,
        }}>
          {card.headline}
        </h3>

        {/* Body */}
        <p style={{
          margin: 0, fontSize: 12, lineHeight: 1.7,
          color: "var(--text-muted)",  /* CSS variable — readable in both modes */
          fontFamily: "'DM Mono', monospace",
        }}>
          {card.body}
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
        <span style={{ fontSize: 22, color: card.accent }}>{card.icon}</span>
        <span style={{ fontSize: 10, fontFamily: "'DM Mono', monospace", color: "var(--text-faint)" }}>
          Learn more →
        </span>
      </div>
    </div>
  );
}

export default function BentoGrid() {
  const sectionRef = useRef(null);

  useEffect(() => {
    // CRITICAL: Set fallback visibility immediately for mobile
    const cards = document.querySelectorAll(".bento-card");
    const header = document.querySelector(".bento-header");
    
    // Timeout fallback in case GSAP doesn't fire (mobile issues)
    const fallbackTimer = setTimeout(() => {
      if (header) header.style.opacity = "1";
      cards.forEach(c => { c.style.opacity = "1"; c.style.transform = "none"; });
    }, 100);

    // Set initial opacity via JS so SSR/React doesn't flash invisible cards
    cards.forEach(c => { c.style.opacity = "0"; c.style.transform = "translateY(20px)"; });

    const ctx = gsap.context(() => {
      gsap.fromTo(".bento-header",
        { opacity: 0, y: 18 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: "power3.out",
          clearProps: "opacity,transform",
          scrollTrigger: { trigger: sectionRef.current, start: "top 90%", once: true },
        }
      );
      gsap.fromTo(".bento-card",
        { opacity: 0, y: 20 },
        {
          opacity: 1, y: 0, duration: 0.5, stagger: 0.055, ease: "power3.out",
          clearProps: "opacity,transform",          /* critical — never leaves at opacity:0 */
          scrollTrigger: { trigger: ".bento-grid", start: "top 90%", once: true },
          onComplete: () => {
            clearTimeout(fallbackTimer);
            /* Fallback — force visible if GSAP somehow didn't fire */
            cards.forEach(c => { c.style.opacity = "1"; c.style.transform = "none"; });
          },
        }
      );
    }, sectionRef);

    return () => {
      clearTimeout(fallbackTimer);
      ctx.revert();
    };
  }, []);

  return (
    <section id="features" ref={sectionRef}
      style={{ padding: "56px 32px 48px", background: "var(--bg)" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header — no GSAP initial opacity:0 on the wrapper, only on the class */}
        <div className="bento-header" style={{ marginBottom: 36 }}>
          <div style={{
            fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.2em", textTransform: "uppercase",
            color: "var(--accent)", marginBottom: 12,
          }}>
            ◈ Everything You Need
          </div>
          <h2 style={{
            margin: 0, fontFamily: "'Syne', sans-serif", fontWeight: 900,
            fontSize: "clamp(1.8rem, 3.5vw, 2.8rem)", lineHeight: 1.05,
            color: "var(--text)",
          }}>
            Built for every step
          </h2>
        </div>

        {/* Grid */}
        <div className="bento-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
          {BENTO_CARDS.map(card => <BentoCard key={card.id} card={card} />)}
        </div>

        <style>{`
          @media(max-width:900px){ .bento-grid{ grid-template-columns:repeat(2,1fr)!important; } }
          @media(max-width:520px){ .bento-grid{ grid-template-columns:1fr!important; } }
          /* Light mode card border enhancement */
          [data-theme="light"] .bento-card { box-shadow: 0 1px 4px rgba(11,17,32,0.06); }
        `}</style>
      </div>
    </section>
  );
}
