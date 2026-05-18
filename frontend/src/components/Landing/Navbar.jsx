import { useState, useEffect } from "react";
import { NAV_LINKS, ACCENT } from "@/data.js";
import { useNavigate } from 'react-router-dom'



export default function Navbar({ theme, setTheme, onAnalyze, isAnalyzePage, onHome }) {
  const [open,     setOpen]     = useState(false);
  const [scrolled, setScrolled] = useState(false);

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

  const handleNavClick = (href) => {
    setOpen(false);
    // If we're on the analyze page, go back home first then scroll
    if (isAnalyzePage) { onHome?.(); return; }
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  const isLight = theme === "light";

  const navigate = useNavigate()

  return (
    <nav
      style={{
        position:            "fixed",
        top:                 0,
        left:                0,
        right:               0,
        zIndex:              50,
        transition:          "all 0.4s ease",
        background:          scrolled ? "var(--nav)" : "transparent",
        backdropFilter:      scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter:scrolled ? "blur(20px)" : "none",
        borderBottom:        scrolled
          ? "1px solid var(--nav-border)"
          : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">

        {/* ── Logo ─────────────────────────────────────────── */}
        <button
          onClick={() => { setOpen(false); onHome ? onHome() : window.scrollTo({ top:0, behavior:"smooth" }); }}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer"
        >
          <span
            className="text-xl font-extrabold tracking-tight font-heading"
            style={{ color: ACCENT }}
          >JOB</span>
          <span
            className="text-xl font-extrabold tracking-tight font-heading"
            style={{ color: "var(--text)" }}
          >HUNTER</span>
          <span
            className="ml-2 hidden sm:inline text-[10px] font-mono-ui px-2 py-1 rounded-full"
            style={{
              color:      "var(--text-muted)",
              border:     "1px solid var(--border)",
              background: "var(--surface)",
            }}
          >BUKC · BSE-6A</span>
        </button>

        {/* ── Desktop links ─────────────────────────────────── */}
        <div className="hidden md:flex items-center gap-2">
          {/* Nav links (hidden on analyze page) */}
          {!isAnalyzePage && NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNavClick(href)}
              className="text-sm font-medium transition-all duration-200 bg-transparent border-none cursor-pointer px-3 py-2 rounded-full"
              style={{ color: "var(--text-soft)" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-soft)"}
            >{label}</button>
          ))}

          {/* Analyze CV button */}
          {!isAnalyzePage ? (
            <button
              onClick={onAnalyze}
              className="text-sm px-4 py-2 rounded-full font-medium transition-all duration-200"
              style={{
                color:      ACCENT,
                border:     `1px solid ${ACCENT}35`,
                background: `${ACCENT}10`,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${ACCENT}20`; }}
              onMouseLeave={e => { e.currentTarget.style.background = `${ACCENT}10`; }}
            >
              Analyze CV ↗
            </button>
          ) : (
            <button
              onClick={onHome}
              className="text-sm px-4 py-2 rounded-full font-medium transition-all duration-200"
              style={{
                color:      "var(--text-soft)",
                border:     "1px solid var(--border)",
                background: "var(--surface)",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-soft)"}
            >
              ← Landing Page
            </button>
          )}

          {/* Theme toggle */}
          <button
            onClick={() => setTheme(isLight ? "dark" : "light")}
            className="w-10 h-10 rounded-full flex items-center justify-center text-base transition-all duration-300 hover:scale-110"
            style={{
              background: "var(--surface)",
              border:     "1px solid var(--border)",
            }}
            aria-label="Toggle theme"
          >
            {isLight ? "🌙" : "☀️"}
          </button>

        {/* Primary CTA */}
{/* Primary CTA */}
<button
  onClick={() => navigate("/login")}
  className="px-5 py-2.5 text-sm font-medium rounded-full border border-white/20 hover:bg-white/10 transition"
  style={{ color: "var(--text)" }}
>
  Log in
</button>

<button
  onClick={() => navigate("/register")}
  className="px-6 py-2.5 text-sm font-medium rounded-full text-white transition-all hover:scale-105"
  style={{
    background: "linear-gradient(135deg, var(--accent), #34d399)",
  }}
>
  Get Started Free
</button>
        </div>

        {/* ── Mobile hamburger ──────────────────────────────── */}
        <button
          className="md:hidden p-2 bg-transparent border-none cursor-pointer"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          style={{ color: "var(--text)" }}
        >
          <div className="flex flex-col gap-1.5 w-6">
            {[0,1,2].map((i) => (
              <span key={i}
                className="block h-[2px] bg-current transition-all duration-300 rounded-full"
                style={{
                  transform:
                    i===0 && open ? "translateY(7px) rotate(45deg)"   :
                    i===2 && open ? "translateY(-7px) rotate(-45deg)" : "none",
                  opacity: i===1 && open ? 0 : 1,
                }}
              />
            ))}
          </div>
        </button>
      </div>

      {/* ── Mobile drawer ────────────────────────────────────── */}
      <div
        className="md:hidden overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "400px" : "0px" }}
      >
        <div
          className="mx-4 mb-4 p-5 rounded-3xl space-y-3"
          style={{
            background:     "var(--surface)",
            backdropFilter: "blur(20px)",
            border:         "1px solid var(--border)",
          }}
        >
          {!isAnalyzePage && NAV_LINKS.map(({ label, href }) => (
            <button
              key={label}
              onClick={() => handleNavClick(href)}
              className="block w-full text-left text-sm transition-colors bg-transparent border-none cursor-pointer py-1"
              style={{ color: "var(--text-soft)" }}
            >{label}</button>
          ))}

          {/* Analyze CV link in mobile */}
          <button
            onClick={() => { setOpen(false); isAnalyzePage ? onHome() : onAnalyze(); }}
            className="block w-full text-left text-sm py-1 bg-transparent border-none cursor-pointer"
            style={{ color: ACCENT }}
          >
            {isAnalyzePage ? "← Landing Page" : "Analyze CV ↗"}
          </button>

          <div className="flex items-center gap-3 pt-2 border-t"
            style={{ borderColor: "var(--border)" }}>
            <button
              onClick={() => setTheme(isLight ? "dark" : "light")}
              className="w-11 h-11 rounded-full flex items-center justify-center text-base"
              style={{ background:"var(--surface)", border:"1px solid var(--border)" }}
            >
              {isLight ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => { setOpen(false); onAnalyze(); }}
              className="flex-1 text-sm px-4 py-3 rounded-full text-white font-semibold"
              style={{ background:`linear-gradient(135deg, ${ACCENT}, #34d399)` }}
            >
              {isAnalyzePage ? "New Analysis" : "Get Started"}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
