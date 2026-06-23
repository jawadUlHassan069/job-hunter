// src/components/Landing/Footer.jsx
import { TECH_STACK, ACCENT } from "@/data.js";

const QUICK_LINKS = [
  { label: "Upload CV",          action: "analyze"   },
  { label: "Browse Jobs",        href:   "#jobs"     },
  { label: "Skill Gap Analysis", href:   "#features" },
  { label: "Track Applications", href:   "#features" },
];

export default function Footer({ onFeatureClick, onAnalyze }) {
  return (
    <footer style={{
      borderTop:  "1px solid var(--border)",
      background: "var(--bg)",
      padding:    "48px 32px 28px",
    }}>
      <div style={{ maxWidth:1100, margin:"0 auto" }}>

        {/* Top grid */}
        <div className="footer-grid" style={{
          display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:36, marginBottom:36,
        }}>

          {/* Brand */}
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:12 }}>
              <span style={{ color:ACCENT, fontSize:17, fontWeight:900, fontFamily:"'Syne',sans-serif" }}>JOB</span>
              <span style={{ color:"var(--text)", fontSize:17, fontWeight:900, fontFamily:"'Syne',sans-serif" }}>HUNTER</span>
            </div>
            <p style={{ color:"var(--text-muted)", fontSize:12, lineHeight:1.7, marginBottom:16,
              fontFamily:"'DM Mono',monospace", margin:"0 0 16px" }}>
              Smart CV &amp; Job Matching Platform.<br/>Cloud Computing — CSL 220.
            </p>
            <div style={{ display:"inline-flex", alignItems:"center", gap:7, fontSize:10,
              fontFamily:"'DM Mono',monospace", padding:"5px 12px", borderRadius:100,
              background:`${ACCENT}18`, color:ACCENT, border:`1px solid ${ACCENT}30` }}>
              <span style={{ width:6, height:6, borderRadius:"50%", background:ACCENT,
                display:"inline-block", animation:"footerPulse 2s ease-in-out infinite" }} />
              Live on Azure
            </div>
          </div>

          {/* Tech Stack */}
          <div>
            <p style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase",
              color:"var(--text-faint)", fontFamily:"'DM Mono',monospace", marginBottom:14 }}>
              Tech Stack
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {TECH_STACK?.map(s => (
                <div key={s} style={{ display:"flex", alignItems:"center", gap:8,
                  fontSize:12, fontFamily:"'DM Mono',monospace", color:"var(--text-muted)" }}>
                  <span style={{ color:ACCENT }}>·</span>{s}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <p style={{ fontSize:10, letterSpacing:"0.18em", textTransform:"uppercase",
              color:"var(--text-faint)", fontFamily:"'DM Mono',monospace", marginBottom:14 }}>
              Quick Links
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
              {QUICK_LINKS.map(({ label, action, href }) =>
                action === "analyze" ? (
                  <button key={label}
                    onClick={() => { onFeatureClick?.("cv-analysis"); onAnalyze?.(); }}
                    style={{ background:"none", border:"none", cursor:"pointer", textAlign:"left",
                      padding:0, fontSize:12, fontFamily:"'DM Mono',monospace",
                      color:"var(--text-muted)", transition:"color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    {label} →
                  </button>
                ) : (
                  <a key={label} href={href}
                    style={{ fontSize:12, fontFamily:"'DM Mono',monospace",
                      color:"var(--text-muted)", textDecoration:"none", transition:"color 0.2s" }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text)"}
                    onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                    {label} →
                  </a>
                )
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop:"1px solid var(--border)", paddingTop:20,
          display:"flex", flexWrap:"wrap", justifyContent:"space-between", alignItems:"center", gap:8 }}>
          <p style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"var(--text-faint)", margin:0 }}>
            © 2026 Job Hunter · Bahria University Karachi Campus · BSE 6A
          </p>
          <p style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:"var(--text-faint)", margin:0 }}>
            Powered by Gemini API · Azure Cloud
          </p>
        </div>
      </div>

      <style>{`
        @keyframes footerPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @media(max-width:700px){ .footer-grid{ grid-template-columns:1fr!important; gap:24px!important; } }
      `}</style>
    </footer>
  );
}
