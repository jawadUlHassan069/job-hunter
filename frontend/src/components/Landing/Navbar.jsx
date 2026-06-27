// src/components/Landing/Navbar.jsx
import { useState, useEffect } from "react";
import { NAV_LINKS, ACCENT } from "@/data.js";
import { useNavigate } from "react-router-dom";

export default function Navbar({ theme, setTheme, onAnalyze, isAnalyzePage, onHome }) {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const isLight  = theme === "light";

  // Theme-aware color helpers — navbar always overlays sections so we need
  // explicit colors for both modes rather than relying on CSS vars
  const navTextColor    = isLight ? "rgba(11,17,32,0.70)"  : "rgba(243,246,255,0.65)";
  const navTextHover    = isLight ? "#0b1120"               : "#f3f6ff";
  const navBorderColor  = isLight ? "rgba(11,17,32,0.18)"  : "rgba(255,255,255,0.15)";
  const navBtnBg        = isLight ? "rgba(11,17,32,0.06)"  : "rgba(255,255,255,0.05)";
  const navBtnBgHover   = isLight ? "rgba(11,17,32,0.10)"  : "rgba(255,255,255,0.10)";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scrollTo = (href) => {
    setOpen(false);
    if (isAnalyzePage) { onHome?.(); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav style={{
      position:             "fixed",
      top: 0, left: 0, right: 0,
      zIndex:               50,
      height:               60,
      transition:           "background 0.3s ease, border-color 0.3s ease",
      background:           scrolled ? "var(--nav)" : "transparent",
      backdropFilter:       scrolled ? "blur(24px) saturate(1.4)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(24px) saturate(1.4)" : "none",
      borderBottom:         scrolled ? "1px solid var(--nav-border)" : "1px solid transparent",
    }}>
      <div style={{
        maxWidth: 1200, margin: "0 auto",
        padding: "0 24px", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>

        {/* ── Logo ── */}
        <button
          onClick={() => { setOpen(false); onHome ? onHome() : window.scrollTo({ top: 0, behavior: "smooth" }); }}
          style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, padding: 0 }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: ACCENT, letterSpacing: "-0.5px", fontFamily: "'Syne', sans-serif" }}>JOB</span>
          <span style={{ fontSize: 18, fontWeight: 900, color: "var(--text)", letterSpacing: "-0.5px", fontFamily: "'Syne', sans-serif" }}>HUNTER</span>
        </button>

        {/* ── Desktop nav links ── */}
        <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {!isAnalyzePage && NAV_LINKS.map(({ label, href }) => (
            <button key={label} onClick={() => scrollTo(href)} style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "6px 14px", borderRadius: 8,
              fontSize: 13, fontWeight: 500,
              color: navTextColor,
              transition: "color 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => e.currentTarget.style.color = navTextHover}
              onMouseLeave={e => e.currentTarget.style.color = navTextColor}
            >{label}</button>
          ))}

          {isAnalyzePage && (
            <button onClick={onHome} style={{
              background: "none",
              border: `1px solid ${navBorderColor}`,
              cursor: "pointer",
              padding: "6px 14px", borderRadius: 8,
              fontSize: 13, color: navTextColor,
              transition: "all 0.2s", fontFamily: "'DM Mono', monospace",
            }}
              onMouseEnter={e => e.currentTarget.style.color = navTextHover}
              onMouseLeave={e => e.currentTarget.style.color = navTextColor}
            >← Back</button>
          )}
        </div>

        {/* ── Right: theme toggle + auth ── */}
        <div className="hidden md:flex" style={{ display: "flex", alignItems: "center", gap: 8 }}>

          {/* Theme toggle */}
          <button onClick={() => setTheme(isLight ? "dark" : "light")} style={{
            width: 34, height: 34, borderRadius: "50%",
            background: navBtnBg,
            border: `1px solid ${navBorderColor}`,
            cursor: "pointer", fontSize: 14,
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "background 0.2s",
          }}
            onMouseEnter={e => e.currentTarget.style.background = navBtnBgHover}
            onMouseLeave={e => e.currentTarget.style.background = navBtnBg}
            aria-label="Toggle theme"
          >{isLight ? "🌙" : "☀️"}</button>

          {/* Log in */}
          <button onClick={() => navigate("/login")} style={{
            background: "none",
            border: `1px solid ${navBorderColor}`,
            cursor: "pointer",
            padding: "7px 18px", borderRadius: 8,
            fontSize: 13, fontWeight: 500,
            color: navTextColor,
            transition: "all 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
            onMouseEnter={e => {
              e.currentTarget.style.color = navTextHover;
              e.currentTarget.style.borderColor = isLight ? "rgba(11,17,32,0.35)" : "rgba(255,255,255,0.30)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.color = navTextColor;
              e.currentTarget.style.borderColor = navBorderColor;
            }}
          >Log in</button>

          {/* Get Started */}
          <button onClick={() => navigate("/register")} style={{
            background: ACCENT,
            border: "none",
            cursor: "pointer",
            padding: "7px 18px", borderRadius: 8,
            fontSize: 13, fontWeight: 600,
            color: "#fff",
            transition: "opacity 0.2s, transform 0.2s",
            fontFamily: "'DM Sans', sans-serif",
          }}
            onMouseEnter={e => { e.currentTarget.style.opacity = "0.88"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "none"; }}
          >Get Started</button>
        </div>

        {/* ── Mobile hamburger ── */}
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "var(--text)" }}
          aria-label={open ? "Close menu" : "Open menu"}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 5, width: 22 }}>
            {[0, 1, 2].map(i => (
              <span key={i} style={{
                display: "block", height: 2, background: "currentColor", borderRadius: 2,
                transition: "all 0.25s ease",
                transform:
                  i === 0 && open ? "translateY(7px) rotate(45deg)" :
                  i === 2 && open ? "translateY(-7px) rotate(-45deg)" : "none",
                opacity: i === 1 && open ? 0 : 1,
              }} />
            ))}
          </div>
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      <div style={{ overflow: "hidden", transition: "max-height 0.3s ease", maxHeight: open ? "360px" : "0" }}
        className="md:hidden">
        <div style={{
          margin: "0 16px 16px", padding: "20px", borderRadius: 16,
          background: isLight ? "rgba(255,255,255,0.96)" : "rgba(13,15,26,0.96)",
          backdropFilter: "blur(20px)",
          border: `1px solid ${navBorderColor}`,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          {!isAnalyzePage && NAV_LINKS.map(({ label, href }) => (
            <button key={label} onClick={() => scrollTo(href)} style={{
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left", padding: "8px 4px",
              fontSize: 14, color: navTextColor,
              fontFamily: "'DM Sans', sans-serif",
            }}>{label}</button>
          ))}
          {isAnalyzePage && (
            <button onClick={() => { setOpen(false); onHome?.(); }} style={{
              background: "none", border: "none", cursor: "pointer",
              textAlign: "left", padding: "8px 4px",
              fontSize: 14, color: ACCENT,
              fontFamily: "'DM Mono', monospace",
            }}>← Back to Home</button>
          )}
          <div style={{ height: 1, background: navBorderColor, margin: "4px 0" }} />
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setOpen(false); navigate("/login"); }} style={{
              flex: 1, padding: "10px", borderRadius: 8,
              background: "none", border: `1px solid ${navBorderColor}`,
              color: navTextColor, fontSize: 13, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>Log in</button>
            <button onClick={() => { setOpen(false); navigate("/register"); }} style={{
              flex: 1, padding: "10px", borderRadius: 8,
              background: ACCENT, border: "none",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
              fontFamily: "'DM Sans', sans-serif",
            }}>Get Started</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 4 }}>
            <span style={{ fontSize: 12, color: navTextColor, fontFamily: "'DM Mono', monospace" }}>Toggle theme</span>
            <button onClick={() => setTheme(isLight ? "dark" : "light")} style={{
              width: 32, height: 32, borderRadius: "50%",
              background: navBtnBg, border: `1px solid ${navBorderColor}`,
              cursor: "pointer", fontSize: 14,
            }}>{isLight ? "🌙" : "☀️"}</button>
          </div>
        </div>
      </div>
    </nav>
  );
}
